import type { APIContext } from 'astro';

// Read JSON fallback data using Node fs (available in Cloudflare Pages Functions)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fallbackData = JSON.parse(
  readFileSync(join(__dirname, '../../src/data/products.json'), 'utf-8')
);

interface Env {
  DB: D1Database;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  JWT_SECRET: string;
}

export async function GET(context: APIContext) {
  const locale = context.url.searchParams.get('locale') || 'en';
  const slug = context.url.searchParams.get('slug');
  const env = context.locals.runtime.env as unknown as Env;
  const db = env.DB;

  // Try D1 first (production), fallback to JSON (local dev without D1)
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
      console.log('D1 query failed, using JSON fallback:', e);
    }
  }

  // Fallback to local JSON data
  const products = (fallbackData.products || []).map((p: any) => ({
    id: p.id, slug: p.slug,
    tag: locale === 'zh' ? p.name_zh : p.name_en,
    name: locale === 'zh' ? p.name_zh : p.name_en,
    short: locale === 'zh' ? p.short_zh : p.short_en,
    description: locale === 'zh' ? p.description_zh : p.description_en,
    highlights: JSON.parse(locale === 'zh' ? p.highlights_zh : p.highlights_en),
    image_url: p.image_url,
    position: p.position,
  }));

  if (slug) {
    const product = products.find(p => p.slug === slug);
    return context.json(product || { error: 'Product not found' }, { status: product ? 200 : 404 });
  }
  return context.json(products);
}

export async function POST(context: APIContext) {
  // Auth check would go here in production
  return context.json({ ok: false, message: 'Admin access required' }, { status: 401 });
}
