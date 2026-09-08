// Lightweight i18n helper. Astro's `@` alias points to src/.
import en from '@/i18n/en.json';
import zh from '@/i18n/zh.json';
import type products from '@/data/products.json';

/**
 * Supported locales. To add a new language (e.g. Russian/Korean):
 *  1. add its code here (e.g. 'ru') — `Locale` updates automatically
 *  2. import its dictionary below and add it to `dict`
 *  3. add a display name to `localeNames`
 *  4. create src/pages/ru/... pages (copy of src/pages/en/, set locale = 'ru')
 */
export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** Native display names used by the language switcher dropdown. */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};

const dict: Record<Locale, typeof en> = { en, zh };
type Dict = typeof en;

/** Resolve a dot path (e.g. "hero.titleLine1") against the locale dictionary. */
export function t(locale: Locale, path: string): string {
  const value = path.split('.').reduce<any>((acc, key) => acc?.[key], dict[locale]);
  return value ?? path;
}

/** Localize a record that has per-locale fields, e.g. product.name.en / .zh. */
export function pick<T extends Record<string, unknown>>(obj: T, locale: Locale): any {
  return (obj as any)[locale] ?? (obj as any)[defaultLocale] ?? '';
}

/** Localize a whole products.json document, returning copy ready for rendering. */
export function localizeProducts(productsData: typeof products, locale: Locale) {
  return productsData.products.map((p) => ({
    ...p,
    name: pick(p.name, locale),
    tag: pick(p.tag, locale),
    short: pick(p.short, locale),
    description: pick(p.description, locale),
    highlights: (p.highlights as any)[locale] ?? (p.highlights as any)[defaultLocale],
    // Static JSON uses `image`; the API uses `image_url`. Expose both so every
    // component (ProductGrid uses image_url, ProductCard uses image) works.
    image_url: (p as any).image_url || (p as any).image || '',
  }));
}

/**
 * Rewrite a pathname for a target locale, keeping the rest of the URL.
 * Examples: '/en/products/' + 'zh' -> '/zh/products/';
 *           '/products/' + 'en'   -> '/en/products/' (no locale prefix, e.g. 404).
 */
export function localeUrl(pathname: string, target: Locale): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && (locales as readonly string[]).includes(parts[0])) {
    parts[0] = target;
  } else {
    parts.unshift(target);
  }
  return '/' + parts.join('/') + '/';
}
