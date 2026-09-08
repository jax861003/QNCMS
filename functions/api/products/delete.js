// DELETE /api/products/delete?slug=<slug> - delete a product (auth required)
import { requireAuth } from '../../_utils.js';

export async function DELETE(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return context.json(auth.body, { status: auth.status });

  const slug = context.url.searchParams.get('slug');
  if (!slug) return context.json({ ok: false, message: 'Missing slug' }, { status: 400 });

  const db = context.locals.runtime.env.DB;
  if (!db || typeof db.prepare !== 'function') {
    return context.json({ ok: false, message: 'Database not available' }, { status: 503 });
  }

  await db.prepare('DELETE FROM products WHERE slug = ?').bind(slug).run();
  console.log('[Admin] Deleted product:', slug);
  return context.json({ ok: true, slug });
}
