// /api/settings - GET/POST site settings (auth required)
import { requireAuth } from '../_utils.js';

export async function GET(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return context.json(auth.body, { status: auth.status });

  const db = context.locals.runtime.env.DB;
  if (!db || typeof db.prepare !== 'function') return context.json({});

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
  const auth = await requireAuth(context);
  if (!auth.ok) return context.json(auth.body, { status: auth.status });

  const body = await context.request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return context.json({ ok: false, message: 'Invalid body' }, { status: 400 });
  }

  const db = context.locals.runtime.env.DB;
  if (db && typeof db.prepare === 'function') {
    for (const [key, value] of Object.entries(body)) {
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      await db.prepare(
        "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')"
      ).bind(key, strValue).run();
    }
  }
  return context.json({ ok: true });
}
