// DELETE /api/products/delete?slug=<slug> - delete a product (auth required)
import { requireAuth, getEnv, getDB, ensureTables } from '../../_utils.js';

export async function onRequestDelete(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return Response.json(auth.body, { status: auth.status });

  const slug = new URL(context.request.url).searchParams.get('slug');
  if (!slug) return Response.json({ ok: false, message: 'Missing slug' }, { status: 400 });

  const db = getDB(getEnv(context));
  if (!db || typeof db.prepare !== 'function') {
    return Response.json({ ok: false, message: 'Database not available' }, { status: 503 });
  }
  await ensureTables(db);

  try {
    await db.prepare('DELETE FROM products WHERE slug = ?').bind(slug).run();
  } catch (e) {
    console.error('D1 product delete failed:', e);
    return Response.json({ ok: false, message: 'Database error: ' + (e && e.message ? e.message : e) }, { status: 500 });
  }
  console.log('[Admin] Deleted product:', slug);
  return Response.json({ ok: true, slug });
}
