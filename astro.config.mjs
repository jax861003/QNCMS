import { defineConfig } from 'astro/config';
import { fileURLToPath, URL } from 'node:url';

// Static build -> outputs plain HTML/CSS/JS into ./dist
// Deploy: upload `dist/` assets + `functions/` to Cloudflare Pages.
export default defineConfig({
  output: 'static',
  // Set to your production domain for correct canonical/absolute URLs
  site: 'https://your-domain.pages.dev',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: {
      // Every page lives under /en/... and /zh/... ; the root index page
      // redirects to a locale (Astro also emits `/` -> default-locale 302).
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  // `@/...` -> src/...  (exposed to Vite's resolver)
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
