import type { APIContext } from 'astro';
import rawProducts from '../../src/data/products.json' with { type: 'json' };

interface Product {
  id: string;
  slug: string;
  tag: string;
  name: string;
  short: string;
  description: string;
  highlights: string[];
  image_url: string;
  position: number;
}

function localizeProducts(locale: string): Product[] {
  return rawProducts.products.map((p: any) => ({
    id: p.id,
    slug: p.slug,
    tag: locale === 'zh' ? p.name_zh : p.name_en,
    name: locale === 'zh' ? p.name_zh : p.name_en,
    short: locale === 'zh' ? p.short_zh : p.short_en,
    description: locale === 'zh' ? p.description_zh : p.description_en,
    highlights: JSON.parse(locale === 'zh' ? p.highlights_zh : p.highlights_en),
    image_url: p.image_url,
    position: p.position,
  }));
}

export async function GET(context: APIContext) {
  const locale = context.url.searchParams.get('locale') || 'en';
  const slug = context.url.searchParams.get('slug');
  
  // For local development or when D1 is not available
  try {
    const db = (context.locals.runtime.env as any)?.DB;
    if (db && typeof db.prepare === 'function') {
      // D1 is available, use it
      if (!slug) {
        const result = await db.prepare(
          'SELECT * FROM products WHERE active = 1 ORDER BY position ASC'
        ).all();
        return context.json((result.results || []).map((p: any) => ({
          id: p.id,
          slug: p.slug,
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
    }
  } catch (e) {
    console.log('D1 not available, using JSON fallback');
  }
  
  // Fallback to JSON data
  const products = localizeProducts(locale);
  
  if (slug) {
    const product = products.find(p => p.slug === slug);
    return context.json(product || { error: 'Product not found' }, { 
      status: product ? 200 : 404 
    });
  }
  
  return context.json(products);
}
