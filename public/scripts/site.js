/* NovaGrid — single vanilla client bundle (no framework, ~1KB gzipped).
   Handles: header scroll state, mobile menu, contact form POST, scroll reveal. */
(function () {
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
})();
