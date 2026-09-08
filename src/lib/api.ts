import type { Locale } from './i18n';

export interface Product {
  id: string;
  slug: string;
  tag: string;
  name: string;
  short: string;
  description: string;
  highlights: string[];
  image_url: string;
  position: number;
}

const API_BASE = '/api';

/** Fetch products from API */
export async function fetchProducts(locale: Locale): Promise<Product[]> {
  try {
    const resp = await fetch(`${API_BASE}/products?locale=${locale}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json() as Promise<Product[]>;
  } catch (e) {
    console.error('Failed to fetch products:', e);
    // Return empty array on error - will show loading state
    return [];
  }
}

/** Fetch single product by slug */
export async function fetchProduct(slug: string, locale: Locale): Promise<Product | null> {
  try {
    const resp = await fetch(`${API_BASE}/products?locale=${locale}&slug=${slug}`);
    if (!resp.ok) return null;
    const product = await resp.json() as Product;
    return product;
  } catch (e) {
    console.error('Failed to fetch product:', e);
    return null;
  }
}
