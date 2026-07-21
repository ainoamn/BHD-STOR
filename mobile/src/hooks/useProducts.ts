import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { productsService, ProductFilters } from '@services/products.service';

export const useProducts = (filters?: ProductFilters) => {
  const productsQuery = useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam = 1 }) =>
      productsService.getProducts({ ...filters, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const products =
    productsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return {
    products,
    isLoading: productsQuery.isLoading,
    isFetchingNextPage: productsQuery.isFetchingNextPage,
    hasNextPage: productsQuery.hasNextPage,
    fetchNextPage: productsQuery.fetchNextPage,
    isError: productsQuery.isError,
    error: productsQuery.error,
    refetch: productsQuery.refetch,
  };
};

export const useProduct = (id: string) => {
  const query = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.getProductById(id),
    enabled: !!id,
  });

  return {
    product: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useFeaturedProducts = (limit = 10) => {
  const query = useQuery({
    queryKey: ['featured-products', limit],
    queryFn: () => productsService.getFeaturedProducts(limit),
    staleTime: 5 * 60 * 1000,
  });

  return {
    products: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useTrendingProducts = (limit = 10) => {
  const query = useQuery({
    queryKey: ['trending-products', limit],
    queryFn: () => productsService.getTrendingProducts(limit),
    staleTime: 5 * 60 * 1000,
  });

  return {
    products: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useNewArrivals = (limit = 10) => {
  const query = useQuery({
    queryKey: ['new-arrivals', limit],
    queryFn: () => productsService.getNewArrivals(limit),
    staleTime: 5 * 60 * 1000,
  });

  return {
    products: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useProductSearch = (query: string, filters?: ProductFilters) => {
  const searchQuery = useQuery({
    queryKey: ['product-search', query, filters],
    queryFn: () => productsService.searchProducts(query, filters),
    enabled: query.length >= 2,
  });

  return {
    products: searchQuery.data?.data ?? [],
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    refetch: searchQuery.refetch,
  };
};

export const useSearchSuggestions = (query: string) => {
  const suggestionsQuery = useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => productsService.getSearchSuggestions(query),
    enabled: query.length >= 2,
  });

  return {
    suggestions: suggestionsQuery.data?.data ?? [],
    isLoading: suggestionsQuery.isLoading,
  };
};

export const usePopularSearches = () => {
  const query = useQuery({
    queryKey: ['popular-searches'],
    queryFn: () => productsService.getPopularSearches(),
    staleTime: 10 * 60 * 1000,
  });

  return {
    searches: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
};

export const useCategories = () => {
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsService.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  return {
    categories: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useCategory = (id: string) => {
  const query = useQuery({
    queryKey: ['category', id],
    queryFn: () => productsService.getCategoryById(id),
    enabled: !!id,
  });

  return {
    category: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useStores = (limit = 10) => {
  const query = useQuery({
    queryKey: ['stores', limit],
    queryFn: () => productsService.getStores(limit),
    staleTime: 5 * 60 * 1000,
  });

  return {
    stores: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useStore = (id: string) => {
  const query = useQuery({
    queryKey: ['store', id],
    queryFn: () => productsService.getStoreById(id),
    enabled: !!id,
  });

  return {
    store: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useProductReviews = (productId: string) => {
  const query = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => productsService.getProductReviews(productId),
    enabled: !!productId,
  });

  return {
    reviews: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useRelatedProducts = (productId: string) => {
  const query = useQuery({
    queryKey: ['related-products', productId],
    queryFn: () => productsService.getRelatedProducts(productId),
    enabled: !!productId,
  });

  return {
    products: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
};

export const useBanners = () => {
  const query = useQuery({
    queryKey: ['banners'],
    queryFn: () => productsService.getBanners(),
    staleTime: 10 * 60 * 1000,
  });

  return {
    banners: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
};

export default useProducts;
