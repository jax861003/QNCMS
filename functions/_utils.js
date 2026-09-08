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
 * Require authentication for a Pages Function context.
 * Returns { ok: true } or { ok: false, status, body } for a quick error response.
 */
export async function requireAuth(context) {
  const env = context.locals.runtime.env;
  const secret = env.JWT_SECRET || 'change-me-jwt-secret';
  const token = extractAuth(context.request.headers);
  if (!(await verifyToken(token, secret))) {
    return { ok: false, status: 401, body: { ok: false, message: 'Unauthorized' } };
  }
  return { ok: true, status: 200 };
}
