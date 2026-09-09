// POST /api/products/create - create/update a product (auth required)
// NOTE: primary upsert endpoint is POST /api/products (functions/api/products.js).
// This route is kept as an alias for the admin UI.
import { requireAuth, getEnv, getDB, ensureTables } from '../../_utils.js';

export async function onRequestPost(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return Response.json(auth.body, { status: auth.status });

  const body = await context.request.json().catch(() => null);
  if (!body || !body.slug) {
    return Response.json({ ok: false, message: 'Missing slug' }, { status: 400 });
  }

  const db = getDB(getEnv(context));
  if (!db || typeof db.prepare !== 'function') {
    return Response.json({ ok: false, message: 'Database not available' }, { status: 503 });
  }
  await ensureTables(db);

  const fields = {
    tag_en: body.tag_en || '',
    tag_zh: body.tag_zh || '',
    name_en: body.name_en || '',
    name_zh: body.name_zh || '',
    short_en: body.short_en || '',
    short_zh: body.short_zh || '',
    description_en: body.description_en || '',
    description_zh: body.description_zh || '',
    highlights_en: JSON.stringify(Array.isArray(body.highlights_en) ? body.highlights_en : []),
    highlights_zh: JSON.stringify(Array.isArray(body.highlights_zh) ? body.highlights_zh : []),
    image_url: body.image_url || '',
    position: Number(body.position) || 0,
  };

  try {
    const existing = await db
      .prepare('SELECT id FROM products WHERE slug = ?')
      .bind(body.slug)
      .first();

    if (existing) {
      await db
        .prepare(
          `UPDATE products SET tag_en=?, tag_zh=?, name_en=?, name_zh=?, short_en=?, short_zh=?,
           description_en=?, description_zh=?, highlights_en=?, highlights_zh=?,
           image_url=?, position=?, updated_at=datetime('now')
           WHERE slug=?`
        )
        .bind(
          fields.tag_en, fields.tag_zh, fields.name_en, fields.name_zh,
          fields.short_en, fields.short_zh, fields.description_en, fields.description_zh,
          fields.highlights_en, fields.highlights_zh, fields.image_url, fields.position,
          body.slug
        )
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO products (id, slug, tag_en, tag_zh, name_en, name_zh, short_en, short_zh,
           description_en, description_zh, highlights_en, highlights_zh, image_url, position,
           active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
        )
        .bind(
          'prod-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
          body.slug,
          fields.tag_en, fields.tag_zh, fields.name_en, fields.name_zh,
          fields.short_en, fields.short_zh, fields.description_en, fields.description_zh,
          fields.highlights_en, fields.highlights_zh, fields.image_url, fields.position
        )
        .run();
    }
  } catch (e) {
    console.error('D1 product create failed:', e);
    return Response.json({ ok: false, message: 'Database error: ' + (e && e.message ? e.message : e) }, { status: 500 });
  }

  return Response.json({ ok: true, slug: body.slug });
}
