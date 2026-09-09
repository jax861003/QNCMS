// /api/settings - GET (public, for front-end) / POST (auth required, for admin)
import { requireAuth, getEnv, getDB, ensureTables } from '../_utils.js';

// Public: front-end pages read site settings (title / logo / favicon / about
// / contact) at runtime to apply them without a rebuild.
export async function onRequestGet(context) {
  const db = getDB(getEnv(context));
  if (!db || typeof db.prepare !== 'function') return Response.json({});

  try {
    await ensureTables(db);
    const result = await db.prepare('SELECT * FROM settings').all();
    const settings = {};
    for (const row of result.results || []) {
      try { settings[row.key] = JSON.parse(row.value); } catch { settings[row.key] = row.value; }
    }
    return Response.json(settings);
  } catch (e) {
    console.error('Settings query failed:', e);
    return Response.json({});
  }
}

// Auth required: admin saves settings.
export async function onRequestPost(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return Response.json(auth.body, { status: auth.status });

  const body = await context.request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return Response.json({ ok: false, message: 'Invalid body' }, { status: 400 });
  }

  const db = getDB(getEnv(context));
  if (db && typeof db.prepare === 'function') {
    await ensureTables(db);
    for (const [key, value] of Object.entries(body)) {
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      await db.prepare(
        "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')"
      ).bind(key, strValue).run();
    }
  }
  return Response.json({ ok: true });
}
