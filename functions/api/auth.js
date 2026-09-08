// POST /api/auth - login, issues a signed token cookie
import { hashPassword, signToken } from '../_utils.js';

export async function POST(context) {
  const body = await context.request.json().catch(() => null);
  const { username, password } = body || {};

  if (!username || !password) {
    return context.json({ ok: false, message: 'Missing credentials' }, { status: 400 });
  }

  const env = context.locals.runtime.env;
  const expectedHash = await hashPassword(password);

  if (username !== env.ADMIN_USERNAME || expectedHash !== env.ADMIN_PASSWORD_HASH) {
    return context.json({ ok: false, message: 'Invalid credentials' }, { status: 401 });
  }

  const ts = String(Date.now());
  const sig = await signToken(ts, env.JWT_SECRET || 'change-me-jwt-secret');
  const token = ts + '.' + sig;

  const response = context.json({ ok: true, token, username });
  response.headers.set(
    'Set-Cookie',
    'nova-admin=' + token + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400'
  );
  return response;
}

export function GET(context) {
  return context.json({ ok: false, message: 'Method not allowed' }, { status: 405 });
}
