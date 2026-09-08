/** Shared helpers for Pages Functions */

/** Hash password with SHA-256 (same as used in auth handler) */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Verify JWT-like token (format: ts.signature) */
export function verifyToken(token: string | null, secret: string): boolean {
  if (!token) return false;
  try {
    const [ts, sig] = token.split('.') as [string, string];
    const expectedSig = btoa(ts + '.' + secret).slice(0, 32);
    return sig === expectedSig && Number(ts) > Date.now() - 86400000;
  } catch {
    return false;
  }
}

/** Extract auth token from Bearer header or Cookie */
export function extractAuth(headers: Headers): string | null {
  const auth = headers.get('Authorization');
  const cookie = headers.get('Cookie') || '';
  const match = cookie.match(/nova-admin=([^;]+)/);
  return auth?.replace('Bearer ', '') || match?.[1] || null;
}

/** Check auth and return { ok, status } */
export async function requireAuth(request: Request, env: Record<string, unknown>): Promise<{ ok: true; status: number } | { ok: false; status: number; body: { ok: false; message: string } }> {
  const secret = (env.JWT_SECRET as string) || 'fallback-secret';
  const token = extractAuth(request.headers);
  if (!verifyToken(token, secret)) {
    return { ok: false, status: 401, body: { ok: false, message: 'Unauthorized' } };
  }
  return { ok: true, status: 200 };
}
