import rawProducts from '@/data/products.json';
import { localizeProducts, type Locale } from '@/lib/i18n';

export type Product = (typeof rawProducts.products)[number];
export type LocalizedProduct = ReturnType<typeof localizeProducts>[number];

/** All products, localized into a single locale. */
export function getProducts(locale: Locale): LocalizedProduct[] {
  return localizeProducts(rawProducts, locale);
}

/** One product by slug in a locale, if it exists. */
export function getProduct(slug: string, locale: Locale): LocalizedProduct | undefined {
  return getProducts(locale).find((p) => p.slug === slug);
}

/** Every product slug (locale-independent). */
export function productSlugs(): string[] {
  return rawProducts.products.map((p) => p.slug);
}
