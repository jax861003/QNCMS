// Utility functions for Pages Functions
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function verifyToken(token, secret) {
  if (!token) return false;
  try {
    const [ts, sig] = token.split('.');
    const expected = Buffer.from(ts + '.' + secret).toString('base64').slice(0, 32);
    return sig === expected && Number(ts) > Date.now() - 86400000;
  } catch {
    return false;
  }
}

export function extractAuth(headers) {
  const auth = headers.get('Authorization');
  const cookie = headers.get('Cookie') || '';
  const match = cookie.match(/nova-admin=([^;]+)/);
  return auth?.replace('Bearer ', '') || match?.[1] || null;
}

export async function requireAuth(request, env) {
  const secret = env.JWT_SECRET || 'fallback-secret';
  const token = extractAuth(request.headers);
  if (!verifyToken(token, secret)) {
    return { ok: false, status: 401, body: { ok: false, message: 'Unauthorized' } };
  }
  return { ok: true, status: 200 };
}
