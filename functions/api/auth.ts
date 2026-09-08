import type { APIContext } from 'astro';

// Hash password to SHA-256
async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify JWT token (simple format: timestamp.signature)
function verifyToken(token: string | null, secret: string): boolean {
  if (!token) return false;
  try {
    const [ts, sig] = token.split('.') as [string, string];
    const expected = Buffer.from(ts + '.' + secret).toString('base64').slice(0, 32);
    return sig === expected && Number(ts) > Date.now() - 86400000; // 24h expiry
  } catch {
    return false;
  }
}

// Extract auth from headers
function extractAuth(headers: Headers): string | null {
  const auth = headers.get('Authorization');
  const cookie = headers.get('Cookie') || '';
  const match = cookie.match(/nova-admin=([^;]+)/);
  return auth?.replace('Bearer ', '') || match?.[1] || null;
}

// Require authentication
export async function requireAuth(request: Request, env: Record<string, unknown>) {
  const secret = String(env.JWT_SECRET || 'fallback-secret');
  const token = extractAuth(request.headers);
  if (!verifyToken(token, secret)) {
    return { ok: false, status: 401, body: { ok: false, message: 'Unauthorized' } as const };
  }
  return { ok: true, status: 200 } as const;
}

// Login handler
export async function loginHandler(context: APIContext) {
  const body = await context.request.json().catch(() => null);
  const { username, password } = body || {};
  
  if (!username || !password) {
    return context.json({ ok: false, message: 'Missing credentials' }, { status: 400 });
  }
  
  const expectedHash = await hashPassword(password);
  if (username !== context.locals.runtime.env.ADMIN_USERNAME || 
      expectedHash !== context.locals.runtime.env.ADMIN_PASSWORD_HASH) {
    return context.json({ ok: false, message: 'Invalid credentials' }, { status: 401 });
  }
  
  // Issue token
  const ts = String(Date.now());
  const secret = String(context.locals.runtime.env.JWT_SECRET || 'fallback');
  const signature = Buffer.from(ts + '.' + secret).toString('base64').slice(0, 32);
  const token = `${ts}.${signature}`;
  
  const response = context.json({ ok: true, token, username });
  response.headers.set('Set-Cookie', `nova-admin=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
  return response;
}

export async function POST(context: APIContext) {
  return loginHandler(context);
}

export async function GET() {
  return new Response(JSON.stringify({ ok: false, message: 'Method not allowed' }), { status: 405 });
}
