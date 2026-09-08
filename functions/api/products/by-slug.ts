---
import type { APIContext } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export async function GET(context: APIContext) {
  const db = context.locals.runtime.env.DB as unknown as Env;
  const locale = context.url.searchParams.get('locale') || 'en';
  const slug = context.url.searchParams.get('slug');
  
  if (!slug) {
    return context.json({ error: 'Missing slug' }, { status: 400 });
  }
  
  const result = await db.prepare(
    'SELECT * FROM products WHERE slug = ? AND active = 1'
  ).bind(slug).first();
  
  if (!result) {
    return context.json({ error: 'Product not found' }, { status: 404 });
  }
  
  return context.json({
    id: result.id,
    slug: result.slug,
    tag: locale === 'zh' ? result.tag_zh : result.tag_en,
    name: locale === 'zh' ? result.name_zh : result.name_en,
    short: locale === 'zh' ? result.short_zh : result.short_en,
    description: locale === 'zh' ? result.description_zh : result.description_en,
    highlights: JSON.parse(locale === 'zh' ? result.highlights_zh : result.highlights_en),
    image_url: result.image_url,
  });
}
