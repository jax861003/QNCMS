import type { APIContext } from 'astro';

interface Env {
  DB: D1Database;
}

export async function GET(context: APIContext) {
  const locale = context.url.searchParams.get('locale') || 'en';
  const slug = context.url.searchParams.get('slug');
  const env = context.locals.runtime.env as unknown as Env;
  const db = env.DB;

  // Use D1 in production (when available)
  if (db && typeof db.prepare === 'function') {
    try {
      if (!slug) {
        const result = await db.prepare(
          'SELECT * FROM products WHERE active = 1 ORDER BY position ASC'
        ).all();
        return context.json((result.results || []).map((p: any) => ({
          id: p.id, slug: p.slug,
          tag: locale === 'zh' ? p.tag_zh : p.tag_en,
          name: locale === 'zh' ? p.name_zh : p.name_en,
          short: locale === 'zh' ? p.short_zh : p.short_en,
          description: locale === 'zh' ? p.description_zh : p.description_en,
          highlights: JSON.parse(locale === 'zh' ? p.highlights_zh : p.highlights_en),
          image_url: p.image_url,
          position: p.position,
        })));
      } else {
        const result = await db.prepare(
          'SELECT * FROM products WHERE slug = ? AND active = 1'
        ).bind(slug).first();
        if (!result) return context.json({ error: 'Product not found' }, { status: 404 });
        return context.json({
          id: result.id, slug: result.slug,
          tag: locale === 'zh' ? result.tag_zh : result.tag_en,
          name: locale === 'zh' ? result.name_zh : result.name_en,
          short: locale === 'zh' ? result.short_zh : result.short_en,
          description: locale === 'zh' ? result.description_zh : result.description_en,
          highlights: JSON.parse(locale === 'zh' ? result.highlights_zh : result.highlights_en),
          image_url: result.image_url,
        });
      }
    } catch (e) {
      console.log('D1 query failed:', e);
      return context.json([], { status: 500 });
    }
  }

  // Local dev fallback - return empty array when D1 not available
  // In production, D1 will be connected via wrangler.toml binding
  return context.json([]);
}

export async function POST(context: APIContext) {
  return context.json({ ok: false, message: 'Admin access required' }, { status: 401 });
}
