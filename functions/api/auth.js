// Auth API - login endpoint
export async function POST(context) {
  const body = await context.request.json().catch(() => null);
  const { username, password } = body || {};

  if (!username || !password) {
    return context.json({ ok: false, message: 'Missing credentials' }, { status: 400 });
  }

  // Simple hash check (in production, use proper password hashing)
  const expectedHash = await hashPassword(password);
  const { ADMIN_USERNAME, ADMIN_PASSWORD_HASH, JWT_SECRET } = context.locals.runtime.env;

  if (username !== ADMIN_USERNAME || expectedHash !== ADMIN_PASSWORD_HASH) {
    return context.json({ ok: false, message: 'Invalid credentials' }, { status: 401 });
  }

  // Issue token
  const ts = String(Date.now());
  const signature = Buffer.from(ts + '.' + JWT_SECRET).toString('base64').slice(0, 32);
  const token = `${ts}.${signature}`;

  const response = context.json({ ok: true, token, username });
  response.headers.set('Set-Cookie', `nova-admin=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
  return response;
}

export async function GET(context) {
  return context.json({ ok: false, message: 'Method not allowed' }, { status: 405 });
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
