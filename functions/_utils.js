// Shared helpers for Pages Functions (plain JavaScript - no TS syntax, no Node Buffer)
// Token format: "<timestamp>.<hex-sig>" where hex-sig = SHA-256(timestamp + "." + JWT_SECRET)

/** SHA-256 hex digest of a string */
export async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Hash a password (SHA-256) - used for ADMIN_PASSWORD_HASH comparison */
export function hashPassword(password) {
  return sha256Hex(password);
}

/**
 * Verify a login attempt against the env config. Supports three forms:
 *   1. ADMIN_PASSWORD        - plaintext password (easiest to remember)
 *   2. ADMIN_PASSWORD_HASH   - SHA-256 hex digest (64 hex chars) of the password
 *   3. ADMIN_PASSWORD_HASH   - any other value is compared as plaintext
 * Returns true when the credentials match.
 */
export async function verifyLogin(env, username, password) {
  if (!env || username !== env.ADMIN_USERNAME) return false;
  if (env.ADMIN_PASSWORD) return password === env.ADMIN_PASSWORD;
  const stored = env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  // 64-char hex => treated as a SHA-256 hash; anything else => plaintext
  if (/^[0-9a-fA-F]{64}$/.test(stored)) {
    return (await hashPassword(password)) === stored.toLowerCase();
  }
  return password === stored;
}

/** Sign a token timestamp with the JWT secret */
export async function signToken(ts, secret) {
  const sig = await sha256Hex(ts + '.' + secret);
  return sig.slice(0, 32);
}

/** Verify a token. Returns true if valid and less than 24h old. */
export async function verifyToken(token, secret) {
  if (!token) return false;
  const idx = token.indexOf('.');
  if (idx < 0) return false;
  const ts = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = await signToken(ts, secret);
  if (sig !== expected) return false;
  return Number(ts) > Date.now() - 86400000;
}

/** Extract token from Authorization: Bearer <token> or Cookie nova-admin=<token> */
export function extractAuth(headers) {
  const auth = headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  const cookie = headers.get('Cookie') || '';
  const match = cookie.match(/nova-admin=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Resolve the Workers env bindings from a Pages Function context.
 * Works both with `context.locals.runtime.env` (classic) and `context.env`.
 */
export function getEnv(context) {
  return context.locals?.runtime?.env || context.env || {};
}

/**
 * Resolve the D1 database binding from env.
 * The binding name is NOT hard-coded: set `DB_BINDING_NAME` (an environment
 * variable) to whatever variable name you used for the D1 binding in the
 * dashboard. Falls back to "DB", then to any of the common names.
 */
export function getDB(env) {
  env = env || {};
  const names = [env.DB_BINDING_NAME, 'DB', 'D1', 'DATABASE']
    .map((n) => (n || '').trim())
    .filter(Boolean);
  for (const name of names) {
    if (env[name] && typeof env[name].prepare === 'function') return env[name];
  }
  return env.DB || null;
}

/**
 * Require authentication for a Pages Function context.
 * Returns { ok: true } or { ok: false, status, body } for a quick error response.
 */
export async function requireAuth(context) {
  const env = getEnv(context);
  const secret = env.JWT_SECRET || 'change-me-jwt-secret';
  const token = extractAuth(context.request.headers);
  if (!(await verifyToken(token, secret))) {
    return { ok: false, status: 401, body: { ok: false, message: 'Unauthorized' } };
  }
  return { ok: true, status: 200 };
}

/**
 * Idempotently create the D1 tables the CMS needs.
 * Called automatically by the API handlers before the first query, so no
 * manual migration is required after the D1 binding is added in the dashboard.
 * Returns true when the database is usable.
 */
export async function ensureTables(db) {
  if (!db || typeof db.prepare !== 'function') return false;
  try {
    // D1's exec() rejects multi-statement strings, so run each DDL via
    // prepare().run() - CREATE TABLE IF NOT EXISTS is idempotent, so calling
    // this on every request is safe and cheap.
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS products (
          id          TEXT PRIMARY KEY,
          slug        TEXT UNIQUE NOT NULL,
          tag_en      TEXT NOT NULL DEFAULT '',
          tag_zh      TEXT NOT NULL DEFAULT '',
          name_en     TEXT NOT NULL DEFAULT '',
          name_zh     TEXT NOT NULL DEFAULT '',
          short_en    TEXT NOT NULL DEFAULT '',
          short_zh    TEXT NOT NULL DEFAULT '',
          description_en TEXT NOT NULL DEFAULT '',
          description_zh TEXT NOT NULL DEFAULT '',
          highlights_en TEXT NOT NULL DEFAULT '[]',
          highlights_zh TEXT NOT NULL DEFAULT '[]',
          image_url   TEXT NOT NULL DEFAULT '',
          category_en TEXT NOT NULL DEFAULT '',
          category_zh TEXT NOT NULL DEFAULT '',
          price       TEXT NOT NULL DEFAULT '',
          buy_url     TEXT NOT NULL DEFAULT '',
          position    INTEGER NOT NULL DEFAULT 0,
          active      INTEGER NOT NULL DEFAULT 1,
          created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
          updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        )`
      )
      .run();
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS settings (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL DEFAULT '',
          updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        )`
      )
      .run();
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS messages (
          id         TEXT PRIMARY KEY,
          name       TEXT NOT NULL DEFAULT '',
          email      TEXT NOT NULL DEFAULT '',
          phone      TEXT NOT NULL DEFAULT '',
          company    TEXT NOT NULL DEFAULT '',
          message    TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        )`
      )
      .run();
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS rate_limits (
          bucket TEXT NOT NULL,
          ip     TEXT NOT NULL,
          ts     INTEGER NOT NULL
        )`
      )
      .run();
    // Upgrade existing products tables with columns added after the first deploy
    try {
      const cols = await db.prepare('PRAGMA table_info(products)').all();
      const names = new Set((cols.results || []).map((c) => c.name));
      const addCol = async (col, ddl) => {
        if (!names.has(col)) {
          await db.prepare('ALTER TABLE products ADD COLUMN ' + ddl).run();
        }
      };
      await addCol('price', "price TEXT NOT NULL DEFAULT ''");
      await addCol('buy_url', "buy_url TEXT NOT NULL DEFAULT ''");
      await addCol('category_en', "category_en TEXT NOT NULL DEFAULT ''");
      await addCol('category_zh', "category_zh TEXT NOT NULL DEFAULT ''");
    } catch (e) {
      console.error('ensureColumns failed:', e);
    }
    return true;
  } catch (e) {
    console.error('ensureTables failed:', e);
    return false;
  }
}

/**
 * Per-IP rate limit backed by D1.
 * Returns { ok: true } to allow the request, or { ok: false, retryAfter }
 * (seconds) when the limit is exceeded. Fails open if D1 is unavailable.
 */
export async function rateLimit(db, bucket, ip, limit, windowSeconds) {
  if (!db || typeof db.prepare !== 'function') return { ok: true };
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;
  try {
    await db.prepare('DELETE FROM rate_limits WHERE ts < ?').bind(cutoff).run();
    const row = await db
      .prepare('SELECT COUNT(*) AS n FROM rate_limits WHERE bucket = ? AND ip = ? AND ts >= ?')
      .bind(bucket, ip, cutoff)
      .first();
    if (row && Number(row.n) >= limit) {
      return { ok: false, retryAfter: windowSeconds };
    }
    await db
      .prepare('INSERT INTO rate_limits (bucket, ip, ts) VALUES (?, ?, ?)')
      .bind(bucket, ip, now)
      .run();
    return { ok: true };
  } catch (e) {
    console.error('rateLimit failed:', e);
    return { ok: true };
  }
}
