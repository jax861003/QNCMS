/* NovaGrid — single vanilla client bundle (no framework, ~1KB gzipped).
   Handles: theme toggle, header scroll state, mobile menu, contact form POST,
   scroll reveal, site settings application, dynamic product grid + detail modal. */
(function () {
  function currentLocale() {
    return /^\/zh\//.test(window.location.pathname) ? 'zh' : 'en';
  }

  // ---- Theme toggle -------------------------------------------------------
  var themeBtn = document.querySelector('[data-theme-toggle]');
  function currentTheme() {
    try {
      var s = localStorage.getItem('theme');
      if (s === 'light' || s === 'dark') return s;
    } catch (e) { /* ignore */ }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) { /* ignore */ }
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // Header shadow on scroll
  var header = document.querySelector('[data-header]');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle
  var toggle = document.querySelector('[data-nav-toggle]');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close menu after tapping a link
    var nav = document.querySelector('[data-nav]');
    if (nav) {
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
          header.classList.remove('nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  // Contact form -> Cloudflare Pages Function
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    var btn = form.querySelector('[data-submit]');
    var status = form.querySelector('[data-form-status]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());
      if (btn) { btn.disabled = true; btn.textContent = form.dataset.sending || 'Sending…'; }
      var ok = form.dataset.success || 'Thanks — we have received your message.';
      var err = form.dataset.error || 'Something went wrong. Please email us directly.';
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (r) { return r.json().then(function (b) { return { ok: r.ok && b.ok, message: b.message }; }); })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            if (status) { status.textContent = res.message || ok; status.className = 'form-status ok'; }
          } else {
            if (status) { status.textContent = err; status.className = 'form-status err'; }
          }
        })
        .catch(function () {
          if (status) { status.textContent = err; status.className = 'form-status err'; }
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = form.dataset.submitLabel || 'Send message'; }
        });
    });
  }

  // Scroll reveal
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // ---- Site settings (public /api/settings) ------------------------------
  // Applies admin-configured site title, favicon, logo, about and contact
  // info at runtime, so a content change needs no rebuild/redeploy.
  // Cache-first: a cached copy is applied instantly on reload (no flash of
  // default content), then the network copy refreshes it silently.
  function renderSettings(s) {
        if (!s || typeof s !== 'object') return;
        var locale = currentLocale();
        // Theme template (color scheme) selected in the admin
        document.documentElement.setAttribute('data-variant', s.theme_name || 'default');
        var title = s['site_title_' + locale] || s.site_title_en;
        if (title) document.title = title;

        if (s.favicon_url) {
          var icon = document.querySelector('link[rel="icon"]');
          if (icon) icon.href = s.favicon_url;
        }

        var logoEl = document.querySelector('[data-site-logo]');
        if (logoEl) {
          if (s.logo_url) {
            // Replace the text logo with an image logo
            var img = document.createElement('img');
            img.src = s.logo_url;
            img.alt = title || '';
            img.style.cssText = 'height:30px;width:auto;display:block;';
            logoEl.parentNode.innerHTML = '';
            logoEl.parentNode.appendChild(img);
          } else if (title) {
            // Update the site name shown in the header (主页名称)
            logoEl.textContent = title;
          }
        }

        var at = s['about_title_' + locale], ab = s['about_body_' + locale];
        if (at) { var atEl = document.querySelector('[data-about-title]'); if (atEl) atEl.textContent = at; }
        if (ab) { var abEl = document.querySelector('[data-about-body]'); if (abEl) abEl.textContent = ab; }
        if (s.contact_email) { var ceEl = document.querySelector('[data-contact-email]'); if (ceEl) ceEl.textContent = s.contact_email; }
        if (s.contact_phone) { var cpEl = document.querySelector('[data-contact-phone]'); if (cpEl) cpEl.textContent = s.contact_phone; }
        if (s.contact_address) { var caEl = document.querySelector('[data-contact-address]'); if (caEl) caEl.textContent = s.contact_address; }

        // Hero block (page-top heading + image)
        var h1 = s['hero_title1_' + locale], h2 = s['hero_title2_' + locale], hs = s['hero_subtitle_' + locale];
        if (h1) { var el1 = document.querySelector('[data-hero-line1]'); if (el1) el1.textContent = h1; }
        if (h2) { var el2 = document.querySelector('[data-hero-line2]'); if (el2) el2.textContent = h2; }
        if (hs) { var el3 = document.querySelector('[data-hero-sub]'); if (el3) el3.textContent = hs; }
        if (s.hero_image_url) { var hi = document.querySelector('[data-hero-img]'); if (hi) hi.src = s.hero_image_url; }

        // Products section title/subtitle
        var pt = s['products_title_' + locale], ps = s['products_subtitle_' + locale];
        if (pt) { var ptEl = document.querySelector('[data-products-title]'); if (ptEl) ptEl.textContent = pt; }
        if (ps) { var psEl = document.querySelector('[data-products-sub]'); if (psEl) psEl.textContent = ps; }

        // Contact QQ / WeChat
        if (s.contact_qq) { var qqEl = document.querySelector('[data-contact-qq]'); if (qqEl) qqEl.textContent = s.contact_qq; }
        if (s.contact_wechat) { var wcEl = document.querySelector('[data-contact-wechat]'); if (wcEl) wcEl.textContent = s.contact_wechat; }

        // Footer social links (GitHub / Twitter-X) - shown only when configured
        var gh = document.querySelector('[data-footer-github]');
        if (gh) {
          if (s.footer_github) { gh.href = s.footer_github; gh.style.display = ''; }
          else gh.style.display = 'none';
        }
        var tw = document.querySelector('[data-footer-twitter]');
        if (tw) {
          if (s.footer_twitter) { tw.href = s.footer_twitter; tw.style.display = ''; }
          else tw.style.display = 'none';
        }

        // Footer brand + copyright (custom copyright from settings wins)
        if (title) {
          var fb = document.querySelector('[data-footer-brand]');
          if (fb) fb.textContent = title;
          var fc = document.querySelector('[data-footer-copy]');
          if (fc) {
            if (s.footer_copyright) fc.textContent = s.footer_copyright;
            else fc.textContent = fc.textContent.replace(/©\s*\d{4}\s*[^.]*/, '© ' + new Date().getFullYear() + ' ' + title);
          }
        }
  }
  function loadSettings() {
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem('qncms_settings_cache') || 'null'); } catch (e) { /* ignore */ }
    if (cached && typeof cached === 'object' && !Array.isArray(cached)) renderSettings(cached);
    fetch('/api/settings', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (s) {
        if (!s || typeof s !== 'object' || Array.isArray(s)) return;
        renderSettings(s);
        try { localStorage.setItem('qncms_settings_cache', JSON.stringify(s)); } catch (e) { /* ignore */ }
      })
      .catch(function () { /* keep cached / statically rendered content */ });
  }
  loadSettings();

  // ---- Product detail modal (for admin-added products) -------------------
  var productModal = null;
  var productModalStyle = null;
  function ensureModalStyle() {
    if (productModalStyle) return;
    productModalStyle = document.createElement('style');
    productModalStyle.textContent =
      '.pmodal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;}' +
      '.pmodal-backdrop{position:absolute;inset:0;background:rgba(10,15,30,.66);backdrop-filter:blur(4px);}' +
      '.pmodal-card{position:relative;background:var(--bg,#fff);color:var(--ink,#0b1020);max-width:760px;width:100%;max-height:86vh;overflow-y:auto;border-radius:18px;padding:36px;box-shadow:0 24px 80px rgba(0,0,0,.35);}' +
      '.pmodal-close{position:absolute;top:14px;right:16px;border:none;background:var(--bg-muted,#eef0f6);color:var(--ink,#0b1020);width:36px;height:36px;border-radius:50%;font-size:22px;cursor:pointer;line-height:1;}' +
      '.pmodal-img{width:100%;border-radius:12px;margin-bottom:18px;aspect-ratio:16/10;object-fit:cover;background:var(--bg-muted,#eef0f6);}' +
      '.pmodal-tag{display:inline-block;padding:5px 12px;border-radius:999px;background:var(--bg-muted,#eef0f6);color:var(--brand,#2563eb);font-size:.75rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:12px;}' +
      '.pmodal-card h2{font-size:1.8rem;margin-bottom:10px;}' +
      '.pmodal-short{color:var(--ink-soft,#475069);margin-bottom:14px;font-size:1.05rem;}' +
      '.pmodal-desc{line-height:1.75;margin-bottom:16px;}' +
      '.pmodal-hl{margin:0;padding-left:22px;display:grid;gap:8px;}' +
      '.pmodal-price{font-size:1.8rem;font-weight:800;color:var(--brand,#2563eb);margin-bottom:12px;}' +
      '.pmodal-buy{display:inline-block;margin:6px 0 0;padding:12px 26px;border-radius:10px;background:var(--brand,#2563eb);color:#fff;font-weight:700;text-decoration:none;}' +
      'html[data-theme="dark"] .pmodal-card{background:#141b30;color:#e7eaf4;}' +
      'html[data-theme="dark"] .pmodal-close{background:#232c47;color:#e7eaf4;}' +
      'html[data-theme="dark"] .pmodal-short{color:#a7b0c5;}' +
      '@media(max-width:640px){.pmodal{padding:10px}.pmodal-card{padding:22px;border-radius:14px;max-height:92vh}.pmodal-card h2{font-size:1.4rem}.pmodal-price{font-size:1.4rem}}';
    document.head.appendChild(productModalStyle);
  }
  function closeProductModal() {
    if (productModal) { productModal.style.display = 'none'; document.body.style.overflow = ''; }
  }
  function showProductModal(p) {
    ensureModalStyle();
    if (!productModal) {
      productModal = document.createElement('div');
      productModal.className = 'pmodal';
      document.body.appendChild(productModal);
    }
    var hl = (p.highlights || []).map(function (h) { return '<li>' + h + '</li>'; }).join('');
    productModal.innerHTML =
      '<div class="pmodal-backdrop"></div>' +
      '<div class="pmodal-card" role="dialog" aria-modal="true">' +
        '<button class="pmodal-close" aria-label="Close">&times;</button>' +
        (p.image_url ? '<img class="pmodal-img" src="' + p.image_url + '" alt="' + (p.name || '') + '" onerror="this.src=\'/images/products/placeholder.svg\'" />' : '') +
        (p.tag ? '<span class="pmodal-tag">' + p.tag + '</span>' : '') +
        '<h2>' + (p.name || '') + '</h2>' +
        (p.price ? '<div class="pmodal-price">' + p.price + '</div>' : '') +
        (p.short ? '<p class="pmodal-short">' + p.short + '</p>' : '') +
        (p.description ? '<p class="pmodal-desc">' + p.description + '</p>' : '') +
        (hl ? '<ul class="pmodal-hl">' + hl + '</ul>' : '') +
        (p.buy_url ? '<a class="pmodal-buy" href="' + p.buy_url + '" target="_blank" rel="noopener">' + (currentLocale() === 'zh' ? '立即购买' : 'Buy now') + '</a>' : '') +
      '</div>';
    productModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    productModal.querySelector('.pmodal-close').addEventListener('click', closeProductModal);
    productModal.querySelector('.pmodal-backdrop').addEventListener('click', closeProductModal);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { closeProductModal(); document.removeEventListener('keydown', onKey); }
    });
  }
  function openProductModal(slug) {
    fetch('/api/products?locale=' + currentLocale() + '&slug=' + encodeURIComponent(slug))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (p) { if (p && !p.error) showProductModal(p); })
      .catch(function () { /* ignore */ });
  }

  // ---- Dynamic product grid ----------------------------------------------
  // Re-renders [data-product-grid] from the public API so products added in
  // the admin appear on the homepage / product list without a redeploy.
  // Cards for slugs that also have a static detail page keep their link;
  // newly added products open a detail modal instead.
  function renderGrid(list) {
    var grid = document.querySelector('[data-product-grid]');
    if (!grid) return;
    if (!Array.isArray(list) || list.length === 0) return; // keep static content
    var locale = currentLocale();
    var staticSlugs = {};
    grid.querySelectorAll('[data-slug]').forEach(function (el) {
      staticSlugs[el.getAttribute('data-slug')] = true;
    });
        var learn = locale === 'zh' ? '了解更多' : 'Learn more';
        var placeholder = '/images/products/placeholder.svg';
        grid.innerHTML = list.map(function (p) {
          var isStatic = !!staticSlugs[p.slug];
          var href = isStatic ? '/' + locale + '/products/' + p.slug + '/' : '#';
          var tag = p.tag ? '<span class="product-tag">' + p.tag + '</span>' : '';
          var img = p.image_url
            ? '<img src="' + p.image_url + '" alt="' + (p.name || '') + '" loading="lazy" width="640" height="400" onerror="this.src=\'' + placeholder + '\'" />'
            : '<img src="' + placeholder + '" alt="' + (p.name || '') + '" loading="lazy" width="640" height="400" />';
          return '<a class="product-card' + (isStatic ? '' : ' is-dynamic') + '" href="' + href + '" data-slug="' + p.slug + '" data-cat="' + (p.category || '') + '" data-name="' + ((p.name || '').toLowerCase()) + '" data-reveal>' +
            '<div class="product-thumb">' + img + tag + '</div>' +
            '<div class="product-body"><h3>' + (p.name || '') + '</h3>' +
            (p.price ? '<span style="color:var(--brand);font-weight:700;font-size:1rem;">' + p.price + '</span>' : '') +
            '<p>' + (p.short || '') + '</p>' +
            '<span class="product-link">' + learn +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div></a>';
        }).join('');
        setupProductFilters(grid);
        filterProductGrid();
        // replay reveal animation
        var els = Array.prototype.slice.call(grid.querySelectorAll('[data-reveal]'));
        if ('IntersectionObserver' in window) {
          var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
            });
          }, { threshold: 0.12 });
          els.forEach(function (el) { obs.observe(el); });
        } else {
          els.forEach(function (el) { el.classList.add('in'); });
        }
  }
  function loadProducts() {
    var locale = currentLocale();
    var key = 'qncms_products_cache_' + locale;
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { /* ignore */ }
    if (cached && Array.isArray(cached) && cached.length) {
      renderGrid(cached);
    }
    fetch('/api/products?locale=' + locale)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) {
        if (!Array.isArray(list) || list.length === 0) return; // keep cached / static content
        renderGrid(list);
        try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* ignore */ }
      })
      .catch(function () { /* keep cached / static */ });
  }
  loadProducts();

  // ---- Floating scroll buttons (back to top / to bottom) ----------------
  var fab = document.createElement('div');
  fab.className = 'scroll-fab';
  fab.innerHTML =
    '<button type="button" data-scroll-top aria-label="Back to top" title="Back to top">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>' +
    '<button type="button" data-scroll-bottom aria-label="Go to bottom" title="Go to bottom">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg></button>';
  document.body.appendChild(fab);
  fab.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!t) return;
    if (t.hasAttribute('data-scroll-top')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (t.hasAttribute('data-scroll-bottom')) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  });

  // ---- Product filters: category tabs + search (home & list pages) ----
  function setupProductFilters(grid) {
    var locale = currentLocale();
    var filters = document.querySelector('[data-cat-tabs]');
    var search = document.querySelector('[data-product-search]');
    if (!filters) return;
    var cats = [];
    grid.querySelectorAll('.product-card').forEach(function (card) {
      var cat = card.getAttribute('data-cat');
      if (cat && cats.indexOf(cat) < 0) cats.push(cat);
    });
    filters.innerHTML = '<button class="cat-tab active" data-cat="">' + (locale === 'zh' ? '全部' : 'All') + '</button>' +
      cats.map(function (cat) { return '<button class="cat-tab" data-cat="' + cat + '">' + cat + '</button>'; }).join('');
    if (!filters.dataset.bound) {
      filters.dataset.bound = '1';
      filters.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('.cat-tab') : null;
        if (!btn) return;
        filters.querySelectorAll('.cat-tab').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        filterProductGrid();
      });
    }
    if (search && !search.dataset.bound) {
      search.dataset.bound = '1';
      search.addEventListener('input', filterProductGrid);
    }
  }
  function filterProductGrid() {
    var grid = document.querySelector('[data-product-grid]');
    if (!grid) return;
    var active = grid.parentNode.querySelector('.cat-tab.active');
    var cat = active ? active.getAttribute('data-cat') : '';
    var search = grid.parentNode.querySelector('[data-product-search]');
    var text = search ? search.value.trim().toLowerCase() : '';
    grid.querySelectorAll('.product-card').forEach(function (card) {
      var okCat = !cat || card.getAttribute('data-cat') === cat;
      var okText = !text || (card.getAttribute('data-name') || '').indexOf(text) > -1;
      card.style.display = okCat && okText ? '' : 'none';
    });
  }

  // Card click: dynamic products open the modal; static ones navigate normally
  document.addEventListener('click', function (e) {
    var card = e.target && e.target.closest ? e.target.closest('a.product-card') : null;
    if (card && (card.classList.contains('is-dynamic') || card.getAttribute('href') === '#')) {
      e.preventDefault();
      openProductModal(card.getAttribute('data-slug'));
    }
  });

  // Deep link to a newly added product: /en/products/<slug>/ -> open modal
  (function handleDeepLink() {
    var m = window.location.pathname.match(/^\/(en|zh)\/products\/([^/]+)\/?$/);
    if (!m) return;
    var grid = document.querySelector('[data-product-grid]');
    var staticSlugs = {};
    if (grid) {
      grid.querySelectorAll('[data-slug]').forEach(function (el) {
        staticSlugs[el.getAttribute('data-slug')] = true;
      });
    }
    if (staticSlugs[m[2]]) return; // a static detail page exists for this slug
    setTimeout(function () { openProductModal(m[2]); }, 350);
  })();
})();
