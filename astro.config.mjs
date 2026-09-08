import { defineConfig } from 'astro/config';
import { fileURLToPath, URL } from 'node:url';

// Static build -> outputs plain HTML/CSS/JS into ./dist
// Deploy: upload `dist/` assets + `functions/` to Cloudflare Pages.
export default defineConfig({
  output: 'static',
  // Production domain for canonical/absolute URLs.
  // NOTE: Astro i18n routing was removed on purpose:
  //  - `redirectToDefaultLocale` + `site` used to emit a root redirect to an
  //    absolute placeholder URL (https://your-domain.pages.dev/en/).
  //  - with `prefixDefaultLocale`, non-locale pages (e.g. /admin/) were
  //    logged as built but never written to dist, causing a 404 on deploy.
  // Locale routing is handled manually by src/pages/index.astro (relative
  // URLs) and by the physical src/pages/{en,zh} directory layout.
  site: 'https://qncms.pages.dev',
  // `@/...` -> src/...  (exposed to Vite's resolver)
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
