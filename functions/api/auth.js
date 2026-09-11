// POST /api/auth - login, issues a signed token cookie
import { verifyLogin, signToken, getEnv, getDB, rateLimit } from '../_utils.js';

export async function onRequestPost(context) {
  const rl = await rateLimit(
    getDB(getEnv(context)),
    'auth',
    context.request.headers.get('CF-Connecting-IP') || 'unknown',
    10,
    60
  );
  if (!rl.ok) {
    return Response.json(
      { ok: false, message: 'Too many attempts, please try again later' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }
  const body = await context.request.json().catch(() => null);
  const { username, password } = body || {};

  if (!username || !password) {
    return Response.json({ ok: false, message: 'Missing credentials' }, { status: 400 });
  }

  const env = getEnv(context);
  if (!(await verifyLogin(env, username, password))) {
    return Response.json({ ok: false, message: 'Invalid credentials' }, { status: 401 });
  }

  const ts = String(Date.now());
  const sig = await signToken(ts, env.JWT_SECRET || 'change-me-jwt-secret');
  const token = ts + '.' + sig;

  const response = Response.json({ ok: true, token, username });
  response.headers.set(
    'Set-Cookie',
    'nova-admin=' + token + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400'
  );
  return response;
}

export async function onRequestGet(context) {
  return Response.json({ ok: false, message: 'Method not allowed' }, { status: 405 });
}
