import type { Product } from "@/types";
import { demoProducts } from "@/lib/demo-data";

export function toPaginatedProducts(products: Product[]) {
  return {
    data: products,
    meta: {
      currentPage: 1,
      totalPages: 1,
      totalCount: products.length,
      perPage: products.length,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

export function normalizeProduct(product: Product): Product & Record<string, unknown> {
  const p = product as Product & Record<string, unknown>;
  return {
    ...p,
    stock: p.stock ?? 100,
    category: (p.category as string) || "عام",
    storeName: (p.storeName as string) || "متجر BHD",
    reviewsCount: (p.reviewsCount as number) ?? (p.reviewCount as number) ?? 0,
    slug: p.slug || String(p.id),
  };
}

export function getDemoProductsList(): Product[] {
  return demoProducts.map((p) => normalizeProduct(p));
}
