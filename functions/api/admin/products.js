// /api/admin/products - GET: full bilingual fields for admin editing (auth required)
import { requireAuth, getEnv, getDB, ensureTables } from '../../_utils.js';

export async function onRequestGet(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return Response.json(auth.body, { status: auth.status });

  const db = getDB(getEnv(context));
  if (!db || typeof db.prepare !== 'function') {
    // No D1 bound - return empty so admin shows "no products"
    return Response.json([]);
  }

  try {
    await ensureTables(db);
    const result = await db
      .prepare('SELECT * FROM products ORDER BY position ASC')
      .all();
    return Response.json(result.results || []);
  } catch (e) {
    // Table not created yet (migration not run) - return empty so the admin
    // UI can show its "run the D1 migration" hint instead of a 500.
    console.error('D1 admin products query failed:', e);
    return Response.json([]);
  }
}
