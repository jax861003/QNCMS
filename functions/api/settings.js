// Settings API - CRUD operations (requires auth)
export async function GET(context) {
  const token = extractAuth(context.request.headers);
  if (!verifyToken(token)) {
    return context.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const db = context.locals.runtime.env.DB;
  if (!db || typeof db.prepare !== 'function') {
    return context.json({});
  }

  try {
    const result = await db.prepare('SELECT * FROM settings').all();
    const settings = {};
    for (const row of result.results || []) {
      try { settings[row.key] = JSON.parse(row.value); } catch { settings[row.key] = row.value; }
    }
    return context.json(settings);
  } catch (e) {
    console.error('Settings query failed:', e);
    return context.json({});
  }
}

export async function POST(context) {
  const token = extractAuth(context.request.headers);
  if (!verifyToken(token)) {
    return context.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await context.request.json().catch(() => null);
  if (!body) return context.json({ ok: false, message: 'Invalid request body' }, { status: 400 });

  const db = context.locals.runtime.env.DB;
  if (db && typeof db.prepare === 'function') {
    for (const [key, value] of Object.entries(body)) {
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      await db.prepare(
        "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')"
      ).bind(key, strValue).run();
    }
  }

  return context.json({ ok: true });
}

function extractAuth(headers) {
  const auth = headers.get('Authorization');
  const cookie = headers.get('Cookie') || '';
  const match = cookie.match(/nova-admin=([^;]+)/);
  return auth?.replace('Bearer ', '') || match?.[1] || null;
}

function verifyToken(token) {
  if (!token) return false;
  try {
    const [ts, sig] = token.split('.');
    const secret = context?.locals?.runtime?.env?.JWT_SECRET || 'fallback-secret';
    const expected = Buffer.from(ts + '.' + secret).toString('base64').slice(0, 32);
    return sig === expected && Number(ts) > Date.now() - 86400000;
  } catch {
    return false;
  }
}
