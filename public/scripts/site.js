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
  function applySiteSettings() {
    fetch('/api/settings', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (s) {
        if (!s || typeof s !== 'object') return;
        var locale = currentLocale();
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
      })
      .catch(function () { /* keep the statically rendered content */ });
  }
  applySiteSettings();

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
      'html[data-theme="dark"] .pmodal-card{background:#141b30;color:#e7eaf4;}' +
      'html[data-theme="dark"] .pmodal-close{background:#232c47;color:#e7eaf4;}' +
      'html[data-theme="dark"] .pmodal-short{color:#a7b0c5;}';
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
        (p.short ? '<p class="pmodal-short">' + p.short + '</p>' : '') +
        (p.description ? '<p class="pmodal-desc">' + p.description + '</p>' : '') +
        (hl ? '<ul class="pmodal-hl">' + hl + '</ul>' : '') +
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
  function applyProducts() {
    var grid = document.querySelector('[data-product-grid]');
    if (!grid) return;
    var locale = currentLocale();
    var staticSlugs = {};
    grid.querySelectorAll('[data-slug]').forEach(function (el) {
      staticSlugs[el.getAttribute('data-slug')] = true;
    });
    fetch('/api/products?locale=' + locale)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) {
        if (!Array.isArray(list) || list.length === 0) return; // keep static content
        var learn = locale === 'zh' ? '了解更多' : 'Learn more';
        var placeholder = '/images/products/placeholder.svg';
        grid.innerHTML = list.map(function (p) {
          var isStatic = !!staticSlugs[p.slug];
          var href = isStatic ? '/' + locale + '/products/' + p.slug + '/' : '#';
          var tag = p.tag ? '<span class="product-tag">' + p.tag + '</span>' : '';
          var img = p.image_url
            ? '<img src="' + p.image_url + '" alt="' + (p.name || '') + '" loading="lazy" width="640" height="400" onerror="this.src=\'' + placeholder + '\'" />'
            : '<img src="' + placeholder + '" alt="' + (p.name || '') + '" loading="lazy" width="640" height="400" />';
          return '<a class="product-card' + (isStatic ? '' : ' is-dynamic') + '" href="' + href + '" data-slug="' + p.slug + '" data-reveal>' +
            '<div class="product-thumb">' + img + tag + '</div>' +
            '<div class="product-body"><h3>' + (p.name || '') + '</h3><p>' + (p.short || '') + '</p>' +
            '<span class="product-link">' + learn +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div></a>';
        }).join('');
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
      })
      .catch(function () { /* keep static */ });
  }
  applyProducts();

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
