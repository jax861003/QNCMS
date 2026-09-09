// POST /api/products/batch-delete - delete multiple products by slug (auth required)
import { requireAuth, getEnv, getDB, ensureTables } from '../../_utils.js';

export async function onRequestPost(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return Response.json(auth.body, { status: auth.status });

  const body = await context.request.json().catch(() => null);
  const slugs = body && Array.isArray(body.slugs)
    ? body.slugs.filter((s) => typeof s === 'string' && s.trim())
    : [];
  if (!slugs.length) {
    return Response.json({ ok: false, message: 'No slugs provided' }, { status: 400 });
  }

  const db = getDB(getEnv(context));
  if (!db || typeof db.prepare !== 'function') {
    return Response.json({ ok: false, message: 'Database not available' }, { status: 503 });
  }
  await ensureTables(db);

  try {
    const placeholders = slugs.map(() => '?').join(',');
    await db
      .prepare(`DELETE FROM products WHERE slug IN (${placeholders})`)
      .bind(...slugs)
      .run();
    return Response.json({ ok: true, deleted: slugs.length });
  } catch (e) {
    console.error('Batch delete failed:', e);
    return Response.json(
      { ok: false, message: 'Database error: ' + (e && e.message ? e.message : e) },
      { status: 500 }
    );
  }
}
