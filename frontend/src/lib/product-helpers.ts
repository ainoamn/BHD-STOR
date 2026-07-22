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
  const categoryName =
    typeof p.category === "string"
      ? p.category
      : p.category?.name || "عام";
  return {
    ...p,
    stock: p.stock ?? 100,
    category: categoryName,
    storeName: p.storeName || "متجر BHD",
    reviewsCount: (p.reviewsCount as number) ?? (p.reviewCount as number) ?? 0,
    slug: p.slug || String(p.id),
  };
}

export function getDemoProductsList(): Product[] {
  return demoProducts.map((p) => normalizeProduct(p));
}
