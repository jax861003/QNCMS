import type { APIContext } from 'astro';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fallbackData = JSON.parse(
  readFileSync(join(__dirname, '../../../../../src/data/products.json'), 'utf-8')
);

interface Env {
  DB: D1Database;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  JWT_SECRET: string;
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

async function requireAuth(request: Request, env: Record<string, unknown>) {
  const secret = String(env.JWT_SECRET || 'fallback-secret');
  const token = extractAuth(request.headers);
  if (!verifyToken(token, secret)) {
    return { ok: false, status: 401, body: { ok: false, message: 'Unauthorized' } as const };
  }
  return { ok: true, status: 200 } as const;
}

interface SettingRow {
  key: string;
  value: string;
}

export async function GET(context: APIContext) {
  const auth = await requireAuth(context.request, context.locals.runtime.env);
  if (!auth.ok) return context.json(auth.body, { status: auth.status });

  const db = context.locals.runtime.env.DB as unknown as Env['DB'];
  if (db && typeof db.prepare === 'function') {
    try {
      const result = await db.prepare('SELECT * FROM settings').all<SettingRow>();
      const settings: Record<string, any> = {};
      for (const row of result.results || []) {
        try { settings[row.key] = JSON.parse(row.value); } catch { settings[row.key] = row.value; }
      }
      return context.json(settings);
    } catch (e) {
      console.log('D1 settings query failed:', e);
    }
  }
  return context.json({});
}

export async function POST(context: APIContext) {
  const auth = await requireAuth(context.request, context.locals.runtime.env);
  if (!auth.ok) return context.json(auth.body, { status: auth.status });

  const body = await context.request.json().catch(() => null);
  if (!body) return context.json({ ok: false, message: 'Invalid request body' }, { status: 400 });

  const db = context.locals.runtime.env.DB as unknown as Env['DB'];
  if (db && typeof db.prepare === 'function') {
    for (const [key, value] of Object.entries(body)) {
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      await db.prepare(
        'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime(\'now\')'
      ).bind(key, strValue).run();
    }
  }

  return context.json({ ok: true });
}
