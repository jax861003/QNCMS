// Lightweight i18n helper. Astro's `@` alias points to src/.
import en from '@/i18n/en.json';
import zh from '@/i18n/zh.json';
import type products from '@/data/products.json';

export type Locale = 'en' | 'zh';
export const locales: Locale[] = ['en', 'zh'];
export const defaultLocale: Locale = 'en';

const dict = { en, zh } as const;
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
  }));
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'zh' : 'en';
}
