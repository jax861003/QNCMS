// /api/admin/products - GET: full bilingual fields for admin editing (auth required)
import { requireAuth } from '../../../_utils.js';

export async function GET(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return context.json(auth.body, { status: auth.status });

  const db = context.locals.runtime.env.DB;
  if (!db || typeof db.prepare !== 'function') {
    // No D1 bound - return empty so admin shows "no products"
    return context.json([]);
  }

  const result = await db
    .prepare('SELECT * FROM products ORDER BY position ASC')
    .all();
  return context.json(result.results || []);
}
