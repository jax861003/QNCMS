// functions/[[path]].js
// Catch-all: serves built static assets via ASSETS, and server-renders
// product detail pages (full site chrome: header/footer + all product
// fields) for products added in the admin (no static page).
// Static seeded products are forwarded to their built static pages.
import { getEnv, getDB, ensureTables } from './_utils.js';
import { renderMd } from './_md.js';

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

async function loadSettings(db) {
  const out = {};
  if (!db || typeof db.prepare !== 'function') return out;
  try {
    const r = await db.prepare('SELECT key, value FROM settings').all();
    for (const row of r.results || []) {
      try { out[row.key] = JSON.parse(row.value); } catch { out[row.key] = row.value; }
    }
  } catch (e) { /* ignore */ }
  return out;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function shellHtml(p, locale, settings) {
  const L = locale === 'zh' ? {
    back: '返回产品列表', overview: '产品概述', highlights: '核心亮点',
    buy: '立即购买', contact: '联系我们', home: '首页', products: '产品',
    about: '关于我们', price: '价格', category: '分类', notSet: '未设置',
  } : {
    back: 'Back to products', overview: 'Overview', highlights: 'Highlights',
    buy: 'Buy now', contact: 'Contact us', home: 'Home', products: 'Products',
    about: 'About', price: 'Price', category: 'Category', notSet: 'Not set',
  };
  const brand = (settings['site_title_' + locale]) || (locale === 'zh' ? 'NovaGrid' : 'NovaGrid');
  const logoUrl = settings.logo_url || '';
  const logo = logoUrl
    ? '<img class="logo-img" src="' + esc(logoUrl) + '" alt="' + esc(brand) + '" />'
    : esc(brand);
  const otherLocale = locale === 'zh' ? 'en' : 'zh';
  const otherPath = '/' + otherLocale + '/products/' + p.slug + '/';
  const footerGithub = settings.footer_github || '';
  const footerTwitter = settings.footer_twitter || '';
  const footerCopy = settings.footer_copyright || '';
  const social = (footerGithub || footerTwitter)
    ? '<div class="footer-social">' +
      (footerGithub ? '<a href="' + esc(footerGithub) + '" target="_blank" rel="noopener" aria-label="GitHub">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg></a>' : '') +
      (footerTwitter ? '<a href="' + esc(footerTwitter) + '" target="_blank" rel="noopener" aria-label="Twitter / X">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z"/></svg></a>' : '') +
      '</div>'
    : '';

  const img = '<div class="frame"><img src="' + esc(p.image_url || '/images/products/placeholder.svg') + '" alt="' + esc(p.name) + '" /></div>';
  const price = p.price
    ? '<div class="detail-meta-row"><span class="meta-label">' + L.price + '</span><span class="meta-value price">' + esc(p.price) + '</span></div>'
    : '';
  const category = p.category
    ? '<div class="detail-meta-row"><span class="meta-label">' + L.category + '</span><span class="meta-value">' + esc(p.category) + '</span></div>'
    : '';
  const features = Array.isArray(p.highlights) && p.highlights.length
    ? '<div class="detail-block"><h3>' + L.highlights + '</h3><ul class="feature-list">' +
      p.highlights.map((h) => '<li><span class="ic">✓</span><span>' + esc(h) + '</span></li>').join('') +
      '</ul></div>'
    : '';
  const desc = p.description || p.short || '';

  const layoutAttr = settings.layout_name === 'modern' ? ' data-layout="modern"' : '';
  const variantAttr = settings.theme_name && settings.theme_name !== 'default' ? ' data-variant="' + settings.theme_name + '"' : '';
  return '<!doctype html><html lang="' + locale + '"' + layoutAttr + variantAttr + '>' +
  '<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />' +
  '<title>' + esc(p.name) + ' — ' + esc(brand) + '</title>' +
  '<meta name="description" content="' + esc(p.short || p.name || '') + '" />' +
  '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />' +
  '<script>(function(){var a;try{a=localStorage.getItem("theme")}catch(e){}if(a!=="light"&&a!=="dark"){a=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=a})();</script>' +
  '<style>' +
  ':root{--brand:#2563eb;--brand-2:#7c3aed;--brand-grad:linear-gradient(135deg,#2563eb,#7c3aed);--ink:#0b1020;--ink-soft:#475069;--bg:#fff;--bg-muted:#f5f7fb;--line:#e6e9f2;--card-bg:#fff;--radius-lg:18px;--shadow-lg:0 24px 60px -18px rgba(11,16,32,.18);--ease:cubic-bezier(.22,1,.36,1)}' +
  'html[data-theme="dark"]{--brand:#60a5fa;--brand-2:#a78bfa;--brand-grad:linear-gradient(135deg,#3b82f6,#8b5cf6);--ink:#e7eaf4;--ink-soft:#a7b0c5;--bg:#0b1020;--bg-muted:#12182b;--line:#232c47;--card-bg:#141b30}' +
  'html[data-variant="ocean"]{--brand:#0e7490;--brand-2:#2563eb;--brand-grad:linear-gradient(135deg,#06b6d4,#2563eb)}' +
  'html[data-variant="forest"]{--brand:#059669;--brand-2:#0d9488;--brand-grad:linear-gradient(135deg,#10b981,#0d9488)}' +
  'html[data-variant="sunset"]{--brand:#ea580c;--brand-2:#db2777;--brand-grad:linear-gradient(135deg,#f97316,#db2777)}' +
  '*{box-sizing:border-box;margin:0;padding:0}' +
  'html{scroll-behavior:smooth}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.6;transition:background .3s,color .3s}' +
  'a{text-decoration:none;color:inherit}' +
  '.container{width:100%;max-width:1200px;margin:0 auto;padding:0 24px}' +
  '.site-header{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}html[data-theme="dark"] .site-header{background:rgba(11,16,32,.85)}' +
  '.header-inner{display:flex;align-items:center;gap:24px;height:68px}' +
  '.logo{font-size:1.25rem;font-weight:800;letter-spacing:-.02em;color:var(--ink);display:inline-flex;align-items:center}' +
  '.logo-img{height:34px;width:auto}' +
  '.main-nav{margin-left:auto;display:flex;align-items:center;gap:6px}' +
  '.main-nav a{padding:9px 14px;border-radius:10px;font-weight:500;color:var(--ink-soft);font-size:.95rem;transition:color .2s,background .2s}' +
  '.main-nav a:hover{color:var(--ink);background:var(--bg-muted)}' +
  '.main-nav a[aria-current="page"]{color:#fff;background:var(--brand);box-shadow:0 6px 16px -8px var(--brand)}' +
  '.nav-cta{background:transparent;border:none;color:var(--brand);font-weight:600;font-size:.95rem;padding:9px 14px;border-radius:10px;cursor:pointer;transition:color .2s,background .2s}.nav-cta:hover{color:var(--brand-2,var(--brand));background:var(--bg-muted)}' +
  '.header-actions{display:flex;align-items:center;gap:10px}' +
  '.theme-toggle{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--ink-soft);cursor:pointer;font-size:1rem;transition:all .25s}.theme-toggle:hover{border-color:var(--brand);color:var(--brand)}' +
  '.lang-menu{position:relative}.lang-toggle{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--ink-soft);cursor:pointer;transition:all .25s}.lang-toggle:hover{border-color:var(--brand);color:var(--brand)}.lang-toggle svg{width:19px;height:19px}' +
  '.lang-pop{position:absolute;right:0;top:calc(100% + 10px);min-width:158px;background:var(--card-bg);border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 30px -12px rgba(11,16,32,.25);padding:6px;z-index:300;display:grid;gap:2px}.lang-pop[hidden]{display:none}' +
  '.lang-opt{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:8px;font-weight:600;font-size:.92rem;color:var(--ink);transition:background .2s}.lang-opt:hover{background:var(--bg-muted)}.lang-opt.active{color:var(--brand)}' +
  '.lang-abbr{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:22px;padding:0 5px;border-radius:6px;background:var(--bg-muted);color:var(--brand);font-size:.7rem;font-weight:800;letter-spacing:.04em}.lang-opt.active .lang-abbr{background:var(--brand);color:#fff}' +
  '.section{min-height:calc(100vh - 68px)}.detail-wrap{max-width:1040px;margin:0 auto;padding:44px 24px 80px}' +
  '.d-back{display:inline-flex;align-items:center;gap:8px;color:var(--ink-soft);text-decoration:none;font-weight:600;margin-bottom:28px;transition:color .2s}.d-back:hover{color:var(--brand)}' +
  '.d-hero{display:grid;grid-template-columns:1.1fr .9fr;gap:44px;align-items:center;margin-bottom:44px}@media(max-width:760px){.d-hero{grid-template-columns:1fr}.main-nav .nav-cta{display:none}}' +
  '.d-tag{display:inline-block;padding:5px 12px;border-radius:999px;background:var(--bg-muted);color:var(--brand);font-size:.75rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-top:12px;margin-bottom:14px}' +
  '.md h1,.md h2,.md h3{margin:18px 0 8px;font-size:1.15rem}.md h1{font-size:1.35rem}.md h2{font-size:1.25rem}.md p{margin:0 0 12px}.md ul,.md ol{margin:0 0 12px;padding-left:22px}.md li{margin-bottom:6px}.md a{color:var(--brand);text-decoration:underline}.md pre{background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:14px;overflow:auto;margin:0 0 12px}.md code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.88em;background:var(--bg);border:1px solid var(--line);border-radius:5px;padding:1px 5px}.md pre code{border:none;padding:0;background:transparent}' +
  '.d-hero h1{font-size:clamp(1.9rem,3.4vw,2.7rem);margin:0 0 14px;line-height:1.15}' +
  '.d-lead{color:var(--ink-soft);font-size:1.08rem;margin:0 0 18px;line-height:1.6}' +
  '.detail-meta{display:grid;gap:8px;margin-bottom:22px}' +
  '.detail-meta-row{display:flex;align-items:baseline;gap:10px;font-size:.98rem}' +
  '.meta-label{color:var(--ink-soft);font-weight:600;min-width:64px}' +
  '.meta-value{font-weight:600;color:var(--ink)}.meta-value.price{font-size:1.6rem;font-weight:800;color:var(--brand)}' +
  '.d-buy{display:inline-block;padding:13px 26px;border-radius:999px;font-weight:700;color:#fff;background:var(--brand-grad);text-decoration:none;box-shadow:0 10px 24px -10px var(--brand)}' +
  '.frame{border-radius:16px;overflow:hidden;background:var(--bg-muted)}.frame img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}' +
  '.d-blocks{display:grid;gap:26px}' +
  '.detail-block{background:var(--bg-muted);border:1px solid var(--line);border-radius:14px;padding:26px 28px}' +
  '.detail-block h3{font-size:1.05rem;margin:0 0 12px}' +
  '.detail-block p{margin:0;color:var(--ink-soft);line-height:1.7}' +
  '.feature-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}' +
  '.feature-list li{display:flex;gap:10px;align-items:flex-start;color:var(--ink-soft);line-height:1.5}' +
  '.feature-list .ic{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:var(--brand);color:#fff;font-size:.7rem;font-weight:800;flex:none;margin-top:2px}' +
  '.site-footer{border-top:1px solid var(--line);padding:34px 0 26px;background:var(--bg)}' +
  '.footer-grid{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px 28px;padding-bottom:26px}' +
  '.footer-links{display:flex;align-items:center;gap:22px;list-style:none;margin:0;padding:0}' +
  '.footer-links a{color:var(--ink-soft);font-weight:600;font-size:.95rem;transition:color .2s}.footer-links a:hover{color:var(--brand)}' +
  '.footer-social{display:flex;gap:12px}' +
  '.footer-social a{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:1px solid var(--line);color:var(--ink-soft);transition:all .25s}.footer-social a:hover{border-color:var(--brand);color:var(--brand)}' +
  '.footer-social svg{width:17px;height:17px}' +
  '.footer-bottom{padding-top:16px;border-top:1px solid var(--line);color:var(--ink-soft);font-size:.88rem;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}' +
  '.scroll-fab{position:fixed;right:22px;bottom:22px;display:flex;flex-direction:column;gap:8px;z-index:200}' +
  '.fab-btn{width:42px;height:42px;border-radius:50%;border:1px solid var(--line);background:var(--card-bg);color:var(--ink-soft);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:1.05rem;transition:all .25s}.fab-btn:hover{border-color:var(--brand);color:var(--brand)}' +
  '@media(max-width:620px){.main-nav a{padding:8px 10px;font-size:.9rem}.header-inner{gap:12px}}' +
  'html[data-layout="modern"] .site-header{background:color-mix(in srgb,var(--bg) 80%,transparent);border-bottom-color:transparent}' +
  'html[data-layout="modern"] .main-nav a[aria-current="page"]{background:transparent;color:var(--brand);box-shadow:none}' +
  'html[data-layout="modern"] .main-nav a[aria-current="page"]::after{content:"";display:block;height:2px;border-radius:2px;background:var(--brand);margin-top:5px}' +
  'html[data-layout="modern"] .site-footer{background:var(--bg-soft)}' +
  'html[data-layout="modern"] .d-hero{text-align:center}' +
  'html[data-layout="modern"] .d-hero .frame{max-width:560px;margin:0 auto}' +
  '</style></head><body>' +

  '<header class="site-header"><div class="container header-inner">' +
  '<a class="logo" href="/' + locale + '/">' + logo + '</a>' +
  '<nav class="main-nav">' +
  '<a href="/' + locale + '/">' + L.home + '</a>' +
  '<a href="/' + locale + '/products/" aria-current="page">' + L.products + '</a>' +
  '<a href="/' + locale + '/about/">' + L.about + '</a>' +
  '<a class="nav-cta" href="/' + locale + '/contact/">' + L.contact + '</a>' +
  '</nav>' +
  '<div class="header-actions">' +
  '<div class="lang-menu">' +
  '<button class="lang-toggle" type="button" data-lang-toggle aria-label="Language / 语言" aria-expanded="false">' +
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' +
  '</button>' +
  '<div class="lang-pop" data-lang-pop hidden>' +
  '<a class="lang-opt' + (locale === 'en' ? ' active' : '') + '" href="/en/products/' + p.slug + '/"><span class="lang-abbr">EN</span>English</a>' +
  '<a class="lang-opt' + (locale === 'zh' ? ' active' : '') + '" href="/zh/products/' + p.slug + '/"><span class="lang-abbr">中</span>中文</a>' +
  '</div></div>' +
  '<button class="theme-toggle" data-theme-toggle type="button" aria-label="Toggle dark mode / 切换深色模式"></button>' +
  '</div></div></header>' +

  '<main class="section"><div class="detail-wrap">' +
  '<a class="d-back" href="/' + locale + '/products/">← ' + L.back + '</a>' +
  '<div class="d-hero"><div>' +
  '<h1>' + esc(p.name) + '</h1>' +
  (p.tag ? '<span class="d-tag">' + esc(p.tag) + '</span>' : '') +
  '<p class="d-lead">' + esc(p.short || '') + '</p>' +
  '<div class="detail-meta">' + category + price + '</div>' +
  (p.buy_url
    ? '<a class="d-buy" href="' + esc(p.buy_url) + '" rel="noopener" target="_blank">' + L.buy + '</a>'
    : '<a class="d-buy" href="/' + locale + '/contact/">' + L.contact + '</a>') +
  '</div>' + img + '</div>' +
  '<div class="d-blocks">' +
  (desc ? '<div class="detail-block"><h3>' + L.overview + '</h3><div class="md">' + renderMd(desc) + '</div></div>' : '') +
  features +
  '</div></div></main>' +

  '<footer class="site-footer"><div class="container">' +
  '<div class="footer-grid">' +
  '<a class="logo" href="/' + locale + '/">' + logo + '</a>' +
  '<ul class="footer-links"><li><a href="/' + locale + '/about/">' + L.about + '</a></li><li><a href="/' + locale + '/contact/">' + L.contact + '</a></li></ul>' +
  social +
  '</div>' +
  '<div class="footer-bottom"><span>' + (footerCopy ? esc(footerCopy) : '© ' + new Date().getFullYear() + ' ' + esc(brand)) + '</span></div>' +
  '</div></footer>' +

  '<div class="scroll-fab"><button class="fab-btn" data-fab-top aria-label="Back to top / 回到顶部">↑</button><button class="fab-btn" data-fab-bottom aria-label="Go to bottom / 到达底部">↓</button></div>' +

  '<script>(function(){' +
  'function setThemeBtn(){var d=document.documentElement.dataset.theme;var b=document.querySelector("[data-theme-toggle]");if(b)b.textContent=d==="dark"?"☀️":"🌙";}' +
  'var tt=document.querySelector("[data-theme-toggle]");if(tt){tt.addEventListener("click",function(){var n=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=n;try{localStorage.setItem("theme",n)}catch(e){}setThemeBtn();});}' +
  'setThemeBtn();' +
  'var lg=document.querySelector("[data-lang-toggle]");var lp=document.querySelector("[data-lang-pop]");if(lg&&lp){' +
  'function show(b){lp.hidden=!b;lg.setAttribute("aria-expanded",b?"true":"false");}' +
  'lg.addEventListener("click",function(e){e.stopPropagation();show(lp.hidden);});' +
  'lg.addEventListener("mouseenter",function(){show(true);});' +
  'lp.addEventListener("mouseleave",function(){show(false);});' +
  'lg.addEventListener("mouseleave",function(){setTimeout(function(){if(!lp.matches(":hover"))show(false);},150);});' +
  'document.addEventListener("click",function(e){if(lp.hidden)return;if(e.target!==lg&&!lp.contains(e.target))show(false);});}' +
  'var ft=document.querySelector("[data-fab-top]"),fb=document.querySelector("[data-fab-bottom]");if(ft)ft.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});if(fb)fb.addEventListener("click",function(){window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});});' +
  '})();</script>' +
  '</body></html>';
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const m = url.pathname.match(/^\/(en|zh)\/products\/([^/]+)\/?$/);
  if (m && !STATIC_SLUGS.includes(m[2])) {
    const locale = m[1];
    const slug = m[2];
    const env = getEnv(context);
    const db = getDB(env);
    let product = null;
    let settings = {};
    if (db && typeof db.prepare === 'function') {
      try {
        await ensureTables(db);
        const row = await db.prepare('SELECT * FROM products WHERE slug = ? AND active = 1').bind(slug).first();
        if (row) product = rowToProduct(row, locale);
        settings = await loadSettings(db);
      } catch (e) { /* ignore, fall through */ }
    }
    if (product) {
      return new Response(shellHtml(product, locale, settings), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
  }
  if (typeof context.env.ASSETS === 'object' && context.env.ASSETS && typeof context.env.ASSETS.fetch === 'function') {
    return context.env.ASSETS.fetch(context.request);
  }
  return new Response('Not found', { status: 404 });
}
