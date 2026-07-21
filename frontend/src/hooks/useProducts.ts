import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
  QueryKey,
} from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { isDemoMode } from '@/lib/demo-mode';
import { getDemoProductsList, toPaginatedProducts } from '@/lib/product-helpers';
import type {
  Product,
  ProductFilters,
  PaginatedProducts,
  Review,
  ReviewData,
  CreateReviewData,
} from '@/services/products.service';

// ------------------------------------------------------------------
// Query Keys
// ------------------------------------------------------------------
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  slug: (slug: string) => [...productKeys.details(), 'slug', slug] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  trending: () => [...productKeys.all, 'trending'] as const,
  category: (categoryId: string) =>
    [...productKeys.all, 'category', categoryId] as const,
  store: (storeId: string) =>
    [...productKeys.all, 'store', storeId] as const,
  search: (query: string, filters?: ProductFilters) =>
    [...productKeys.all, 'search', query, filters ?? {}] as const,
  reviews: (productId: string) =>
    [...productKeys.all, 'reviews', productId] as const,
};

// ------------------------------------------------------------------
// Product Query Hooks
// ------------------------------------------------------------------

/**
 * Hook: useProducts
 * Fetch paginated products with optional filters (category, price range, sorting).
 */
export function useProducts(
  filters: ProductFilters = {},
): UseQueryResult<PaginatedProducts, Error> {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      if (isDemoMode()) {
        return toPaginatedProducts(getDemoProductsList());
      }
      try {
        return await productsService.getProducts(filters);
      } catch {
        return toPaginatedProducts(getDemoProductsList());
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

/**
 * Hook: useProduct
 * Fetch a single product by its ID.
 */
export function useProduct(id: string): UseQueryResult<Product, Error> {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsService.getProductById(id),
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10,
    enabled: !!id,
  });
}

/**
 * Hook: useProductBySlug
 * Fetch a single product by its URL slug.
 */
export function useProductBySlug(
  slug: string,
): UseQueryResult<Product, Error> {
  return useQuery({
    queryKey: productKeys.slug(slug),
    queryFn: async () => {
      if (isDemoMode()) {
        const { getDemoProductBySlug } = await import("@/lib/demo-data");
        const product = getDemoProductBySlug(slug);
        if (!product) throw new Error("Product not found");
        return product;
      }
      try {
        return await productsService.getProductBySlug(slug);
      } catch {
        const { getDemoProductBySlug } = await import("@/lib/demo-data");
        const product = getDemoProductBySlug(slug);
        if (!product) throw new Error("Product not found");
        return product;
      }
    },
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
    enabled: !!slug,
    retry: false,
  });
}

/**
 * Hook: useFeaturedProducts
 * Fetch the featured / curated product list.
 */
export function useFeaturedProducts(): UseQueryResult<Product[], Error> {
  return useQuery({
    queryKey: productKeys.featured(),
    queryFn: async () => {
      if (isDemoMode()) {
        return getDemoProductsList();
      }
      try {
        return await productsService.getFeaturedProducts();
      } catch {
        return getDemoProductsList();
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: false,
  });
}

/**
 * Hook: useTrendingProducts
 * Fetch the trending / popular product list.
 */
export function useTrendingProducts(): UseQueryResult<Product[], Error> {
  return useQuery({
    queryKey: productKeys.trending(),
    queryFn: () => productsService.getTrendingProducts(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
}

/**
 * Hook: useProductsByCategory
 * Fetch products filtered by a specific category ID.
 */
export function useProductsByCategory(
  categoryId: string,
): UseQueryResult<PaginatedProducts, Error> {
  return useQuery({
    queryKey: productKeys.category(categoryId),
    queryFn: () =>
      productsService.getProducts({ category: categoryId }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    enabled: !!categoryId,
  });
}

/**
 * Hook: useProductsByStore
 * Fetch products belonging to a specific store.
 */
export function useProductsByStore(
  storeId: string,
): UseQueryResult<PaginatedProducts, Error> {
  return useQuery({
    queryKey: productKeys.store(storeId),
    queryFn: () => productsService.getProducts({ store: storeId }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    enabled: !!storeId,
  });
}

/**
 * Hook: useSearchProducts
 * Search products by text query. Only enabled when query is non-empty.
 */
export function useSearchProducts(
  query: string,
  filters?: ProductFilters,
): UseQueryResult<PaginatedProducts, Error> {
  return useQuery({
    queryKey: productKeys.search(query, filters),
    queryFn: () => productsService.searchProducts(query, filters),
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5,
    enabled: !!query && query.trim().length > 0,
    placeholderData: (previousData) => previousData,
  });
}

// ------------------------------------------------------------------
// Review Hooks
// ------------------------------------------------------------------

/**
 * Hook: useReviews
 * Fetch reviews for a specific product.
 */
export function useReviews(
  productId: string,
): UseQueryResult<Review[], Error> {
  return useQuery({
    queryKey: productKeys.reviews(productId),
    queryFn: () => productsService.getReviews(productId),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    enabled: !!productId,
  });
}

/**
 * Hook: useCreateReview
 * Mutation to post a new review for a product.
 */
export function useCreateReview(): UseMutationResult<
  Review,
  Error,
  CreateReviewData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewData) => productsService.createReview(data),
    onSuccess: (_newReview, variables) => {
      // Invalidate the reviews list for this product
      queryClient.invalidateQueries({
        queryKey: productKeys.reviews(variables.productId),
      });
      // Also invalidate the product detail to refresh rating
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}
