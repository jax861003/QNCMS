// /api/admin/messages - GET: list contact form messages (auth required)
// DELETE: delete a message by id (?id=)
import { requireAuth, getEnv, getDB, ensureTables } from '../../_utils.js';

export async function onRequestGet(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return Response.json(auth.body, { status: auth.status });

  const db = getDB(getEnv(context));
  if (!db || typeof db.prepare !== 'function') return Response.json([]);

  try {
    await ensureTables(db);
    const result = await db
      .prepare('SELECT * FROM messages ORDER BY created_at DESC')
      .all();
    return Response.json(result.results || []);
  } catch (e) {
    console.error('D1 messages query failed:', e);
    return Response.json([]);
  }
}

export async function onRequestDelete(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return Response.json(auth.body, { status: auth.status });

  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ ok: false, message: 'Missing id' }, { status: 400 });

  const db = getDB(getEnv(context));
  if (!db || typeof db.prepare !== 'function') {
    return Response.json({ ok: false, message: 'Database not available' }, { status: 503 });
  }

  try {
    await ensureTables(db);
    await db.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
    return Response.json({ ok: true });
  } catch (e) {
    console.error('D1 message delete failed:', e);
    return Response.json({ ok: false, message: 'Database error' }, { status: 500 });
  }
}
