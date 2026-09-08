import type { APIContext } from 'astro';
import { requireAuth } from '../auth.ts';

interface SettingRow {
  key: string;
  value: string;
}

export async function GET(context: APIContext) {
  const auth = await requireAuth(context.request, context.locals.runtime.env);
  if (!auth.ok) return context.json(auth.body, { status: auth.status });
  
  const db = context.locals.runtime.env.DB as D1Database;
  const result = await db.prepare('SELECT * FROM settings').all<SettingRow>();
  
  const settings: Record<string, any> = {};
  for (const row of result.results || []) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }
  
  return context.json(settings);
}

export async function POST(context: APIContext) {
  const auth = await requireAuth(context.request, context.locals.runtime.env);
  if (!auth.ok) return context.json(auth.body, { status: auth.status });
  
  const body = await context.request.json();
  const db = context.locals.runtime.env.DB as D1Database;
  
  for (const [key, value] of Object.entries(body)) {
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    await db.prepare(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP'
    ).bind(key, strValue).run();
  }
  
  return context.json({ ok: true });
}
