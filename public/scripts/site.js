/* NovaGrid — single vanilla client bundle (no framework, ~1KB gzipped).
   Handles: theme toggle, header scroll state, mobile menu, contact form POST,
   scroll reveal. */
(function () {
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
        var locale = /^\/zh\//.test(window.location.pathname) ? 'zh' : 'en';
        var title = s['site_title_' + locale] || s.site_title_en;
        if (title) document.title = title;

        if (s.favicon_url) {
          var icon = document.querySelector('link[rel="icon"]');
          if (icon) icon.href = s.favicon_url;
        }

        if (s.logo_url) {
          var logoLink = document.querySelector('a.logo');
          if (logoLink) {
            var img = document.createElement('img');
            img.src = s.logo_url;
            img.alt = title || '';
            img.style.cssText = 'height:30px;width:auto;display:block;';
            logoLink.innerHTML = '';
            logoLink.appendChild(img);
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
})();
