import type { APIContext } from 'astro';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fallbackData = JSON.parse(
  readFileSync(join(__dirname, '../../src/data/products.json'), 'utf-8')
);

interface Env {
  DB: D1Database;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  JWT_SECRET: string;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function verifyToken(token: string | null, secret: string): boolean {
  if (!token) return false;
  try {
    const [ts, sig] = token.split('.') as [string, string];
    const expected = Buffer.from(ts + '.' + secret).toString('base64').slice(0, 32);
    return sig === expected && Number(ts) > Date.now() - 86400000;
  } catch {
    return false;
  }
}

function extractAuth(headers: Headers): string | null {
  const auth = headers.get('Authorization');
  const cookie = headers.get('Cookie') || '';
  const match = cookie.match(/nova-admin=([^;]+)/);
  return auth?.replace('Bearer ', '') || match?.[1] || null;
}

export async function POST(context: APIContext) {
  const body = await context.request.json().catch(() => null);
  const { username, password } = body || {};

  if (!username || !password) {
    return context.json({ ok: false, message: 'Missing credentials' }, { status: 400 });
  }

  const env = context.locals.runtime.env as unknown as Env;
  const expectedHash = await hashPassword(password);

  if (username !== env.ADMIN_USERNAME || expectedHash !== env.ADMIN_PASSWORD_HASH) {
    return context.json({ ok: false, message: 'Invalid credentials' }, { status: 401 });
  }

  const ts = String(Date.now());
  const signature = Buffer.from(ts + '.' + env.JWT_SECRET).toString('base64').slice(0, 32);
  const token = `${ts}.${signature}`;

  const response = context.json({ ok: true, token, username });
  response.headers.set('Set-Cookie', `nova-admin=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
  return response;
}

export async function GET(context: APIContext) {
  return context.json({ ok: false, message: 'Method not allowed' }, { status: 405 });
}
