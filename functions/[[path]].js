// functions/[[path]].js
// Catch-all: serves static assets via ASSETS, and server-renders product
// detail pages for products that were added in the admin (no static page).
// Static seeded products are forwarded to their built static pages.
import { getEnv, getDB, ensureTables } from './_utils.js';

function safeParseArray(json) {
  try {
    const v = JSON.parse(json || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function rowToProduct(p, locale) {
  return {
    slug: p.slug,
    tag: locale === 'zh' ? p.tag_zh : p.tag_en,
    name: locale === 'zh' ? p.name_zh : p.name_en,
    short: locale === 'zh' ? p.short_zh : p.short_en,
    description: locale === 'zh' ? p.description_zh : p.description_en,
    highlights: safeParseArray(locale === 'zh' ? p.highlights_zh : p.highlights_en),
    image_url: p.image_url,
    category: (locale === 'zh' ? p.category_zh : p.category_en) || '',
    price: p.price || '',
    buy_url: p.buy_url || '',
  };
}

const STATIC_SLUGS = (() => {
  try {
    const data = require('../src/data/products.json');
    return (data && data.products || []).map((p) => p.slug);
  } catch {
    return [];
  }
})();

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function detailHtml(p, locale) {
  const L = locale === 'zh'
    ? { back: '返回产品列表', overview: '产品概述', highlights: '核心亮点', buy: '立即购买', contact: '联系我们' }
    : { back: 'Back to products', overview: 'Overview', highlights: 'Highlights', buy: 'Buy now', contact: 'Contact us' };
  const img = p.image_url
    ? '<img src="' + esc(p.image_url) + '" alt="' + esc(p.name) + '" />'
    : '';
  const price = p.price ? '<div class="d-price">' + esc(p.price) + '</div>' : '';
  const features = Array.isArray(p.highlights) && p.highlights.length
    ? '<div class="d-block"><h3>' + L.highlights + '</h3><ul class="d-features">' +
      p.highlights.map((h) => '<li><span class="d-ic">✓</span><span>' + esc(h) + '</span></li>').join('') +
      '</ul></div>'
    : '';
  const desc = p.description || p.short || '';
  return '<!doctype html><html lang="' + locale + '"><head><meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
    '<title>' + esc(p.name) + ' — QNCMS</title>' +
    '<meta name="description" content="' + esc(p.short || '') + '" />' +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />' +
    '<script>(function(){var a;try{a=localStorage.getItem("theme")}catch(e){}if(a!=="light"&&a!=="dark"){a=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=a})();</script>' +
    '<style>' +
    ':root{color-scheme:light}html[data-theme="dark"]{color-scheme:dark}' +
    '*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#fff;color:#0b1020;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",Arial,sans-serif;transition:background .3s,color .3s}html[data-theme="dark"] body{background:#0b1020;color:#e7eaf4}' +
    '.wrap{max-width:1040px;margin:0 auto;padding:40px 24px 72px}' +
    '.d-back{display:inline-flex;align-items:center;gap:8px;color:#475069;text-decoration:none;font-weight:600;margin-bottom:28px}html[data-theme="dark"] .d-back{color:#a7b0c5}' +
    '.d-hero{display:grid;grid-template-columns:1.1fr .9fr;gap:44px;align-items:center;margin-bottom:44px}@media(max-width:760px){.d-hero{grid-template-columns:1fr}}' +
    '.d-tag{display:inline-block;padding:5px 12px;border-radius:999px;background:#eef0f6;color:#2563eb;font-size:.75rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:14px}html[data-theme="dark"] .d-tag{background:#1c2742;color:#93b4ff}' +
    '.d-hero h1{font-size:clamp(1.9rem,3.4vw,2.7rem);margin:0 0 14px;line-height:1.15}' +
    '.d-lead{color:#475069;font-size:1.08rem;margin:0 0 16px;line-height:1.6}html[data-theme="dark"] .d-lead{color:#a7b0c5}' +
    '.d-price{font-size:1.7rem;font-weight:800;color:#2563eb;margin-bottom:20px}' +
    '.d-buy{display:inline-block;padding:13px 26px;border-radius:999px;font-weight:700;color:#fff;background:linear-gradient(135deg,#2563eb,#7c3aed);text-decoration:none;box-shadow:0 10px 24px -10px rgba(37,99,235,.7)}' +
    '.d-frame{border-radius:16px;overflow:hidden;background:#eef0f6}html[data-theme="dark"] .d-frame{background:#141b30}' +
    '.d-frame img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}' +
    '.d-blocks{display:grid;gap:26px}' +
    '.d-block{background:#f5f7fb;border:1px solid #e6e9f2;border-radius:14px;padding:26px 28px}html[data-theme="dark"] .d-block{background:#12182b;border-color:#232c47}' +
    '.d-block h3{font-size:1.05rem;margin:0 0 12px}' +
    '.d-block p{margin:0;color:#475069;line-height:1.7}html[data-theme="dark"] .d-block p{color:#a7b0c5}' +
    '.d-features{list-style:none;margin:0;padding:0;display:grid;gap:12px}' +
    '.d-features li{display:flex;gap:10px;align-items:flex-start;color:#475069;line-height:1.5}html[data-theme="dark"] .d-features li{color:#a7b0c5}' +
    '.d-ic{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#2563eb;color:#fff;font-size:.7rem;font-weight:800;flex:none;margin-top:2px}' +
    '</style></head><body><div class="wrap">' +
    '<a class="d-back" href="/' + locale + '/products/">← ' + L.back + '</a>' +
    '<div class="d-hero"><div><span class="d-tag">' + esc(p.tag || '') + '</span>' +
    '<h1>' + esc(p.name) + '</h1>' +
    '<p class="d-lead">' + esc(p.short || '') + '</p>' + price +
    (p.buy_url
      ? '<a class="d-buy" href="' + esc(p.buy_url) + '" rel="noopener" target="_blank">' + L.buy + '</a>'
      : '<a class="d-buy" href="/' + locale + '/contact/">' + L.contact + '</a>') +
    '</div><div class="d-frame">' + img + '</div></div>' +
    '<div class="d-blocks">' +
    (desc ? '<div class="d-block"><h3>' + L.overview + '</h3><p>' + esc(desc) + '</p></div>' : '') +
    features +
    '</div></div></body></html>';
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const m = url.pathname.match(/^\/(en|zh)\/products\/([^/]+)\/?$/);
  if (m && !STATIC_SLUGS.includes(m[2])) {
    const locale = m[1];
    const slug = m[2];
    const db = getDB(getEnv(context));
    let product = null;
    if (db && typeof db.prepare === 'function') {
      try {
        await ensureTables(db);
        const row = await db.prepare('SELECT * FROM products WHERE slug = ? AND active = 1').bind(slug).first();
        if (row) product = rowToProduct(row, locale);
      } catch (e) { /* ignore, fall through */ }
    }
    if (product) {
      return new Response(detailHtml(product, locale), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    // product not found -> normal 404 handling (404.html client fallback)
  }
  // serve built static assets (including /api/* handled by specific functions)
  if (typeof context.env.ASSETS === 'object' && context.env.ASSETS && typeof context.env.ASSETS.fetch === 'function') {
    return context.env.ASSETS.fetch(context.request);
  }
  return new Response('Not found', { status: 404 });
}
