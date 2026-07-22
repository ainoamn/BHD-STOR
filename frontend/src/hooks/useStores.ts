import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { storesService } from '@/services/stores.service';
import { isDemoMode } from '@/lib/demo-mode';
import type {
  Store,
  StoreFilters,
  PaginatedStores,
  CreateStoreData,
  UpdateStoreData,
  Product,
} from '@/services/stores.service';

// ------------------------------------------------------------------
// Query Keys
// ------------------------------------------------------------------
export const storeKeys = {
  all: ['stores'] as const,
  lists: () => [...storeKeys.all, 'list'] as const,
  list: (filters: StoreFilters) => [...storeKeys.lists(), filters] as const,
  details: () => [...storeKeys.all, 'detail'] as const,
  detail: (id: string) => [...storeKeys.details(), id] as const,
  slug: (slug: string) => [...storeKeys.details(), 'slug', slug] as const,
  products: (storeId: string) =>
    [...storeKeys.all, 'products', storeId] as const,
  featured: () => [...storeKeys.all, 'featured'] as const,
  following: () => [...storeKeys.all, 'following'] as const,
};

// ------------------------------------------------------------------
// Store Query Hooks
// ------------------------------------------------------------------

/**
 * Hook: useStores
 * Fetch paginated stores with optional filters.
 */
export function useStores(
  filters: StoreFilters = {},
): UseQueryResult<PaginatedStores, Error> {
  return useQuery({
    queryKey: storeKeys.list(filters),
    queryFn: async () => {
      if (isDemoMode()) {
        const { demoStores } = await import("@/lib/demo-data");
        return {
          data: demoStores as Store[],
          meta: {
            currentPage: 1,
            totalPages: 1,
            totalCount: demoStores.length,
            perPage: demoStores.length,
            hasNextPage: false,
            hasPrevPage: false,
          },
        } as PaginatedStores;
      }
      return storesService.getStores(filters);
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10,
    placeholderData: (previousData) => previousData,
    retry: 1,
  });
}

/**
 * Hook: useStore
 * Fetch a single store by its ID.
 */
export function useStore(id: string): UseQueryResult<Store, Error> {
  return useQuery({
    queryKey: storeKeys.detail(id),
    queryFn: () => storesService.getStoreById(id),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    enabled: !!id,
  });
}

/**
 * Hook: useStoreBySlug
 * Fetch a single store by its URL slug.
 */
export function useStoreBySlug(slug: string): UseQueryResult<Store, Error> {
  return useQuery({
    queryKey: storeKeys.slug(slug),
    queryFn: async () => {
      if (isDemoMode()) {
        const { getDemoStoreBySlug } = await import("@/lib/demo-data");
        const store = getDemoStoreBySlug(slug);
        if (!store) throw new Error("Store not found");
        return store as Store;
      }
      return storesService.getStoreBySlug(slug);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    enabled: !!slug,
    retry: 1,
  });
}

/**
 * Hook: useStoreProducts
 * Fetch products belonging to a specific store.
 */
export function useStoreProducts(
  storeId: string,
  storeName?: string,
): UseQueryResult<Product[], Error> {
  return useQuery({
    queryKey: storeKeys.products(storeId),
    queryFn: async () => {
      if (isDemoMode()) {
        const { getDemoProductsByStoreName } = await import("@/lib/demo-data");
        const { getDemoProductsList } = await import("@/lib/product-helpers");
        if (storeName) return getDemoProductsByStoreName(storeName) as Product[];
        return getDemoProductsList();
      }
      const result = await storesService.getStoreProducts(storeId);
      return result.data ?? (result as unknown as Product[]);
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    enabled: !!storeId,
    retry: 1,
  });
}

/**
 * Hook: useFeaturedStores
 * Fetch featured / curated stores.
 */
export function useFeaturedStores(): UseQueryResult<Store[], Error> {
  return useQuery({
    queryKey: storeKeys.featured(),
    queryFn: async () => {
      if (isDemoMode()) {
        const { demoStores } = await import("@/lib/demo-data");
        return demoStores as Store[];
      }
      return storesService.getFeaturedStores();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 1,
  });
}

// ------------------------------------------------------------------
// Store Mutation Hooks
// ------------------------------------------------------------------

/**
 * Hook: useCreateStore
 * Mutation to create a new store. Invalidates store lists on success.
 */
export function useCreateStore(): UseMutationResult<
  Store,
  Error,
  CreateStoreData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStoreData) => storesService.createStore(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storeKeys.featured() });
    },
  });
}

/**
 * Hook: useUpdateStore
 * Mutation to update an existing store. Invalidates the specific store & lists.
 */
export function useUpdateStore(): UseMutationResult<
  Store,
  Error,
  { id: string } & UpdateStoreData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateStoreData) =>
      storesService.updateStore(id, data),
    onSuccess: (updatedStore) => {
      queryClient.invalidateQueries({
        queryKey: storeKeys.detail(updatedStore.id),
      });
      queryClient.invalidateQueries({
        queryKey: storeKeys.slug(updatedStore.slug),
      });
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
    },
  });
}

/**
 * Hook: useFollowStore
 * Mutation to follow/unfollow a store with optimistic update.
 */
export function useFollowStore(): UseMutationResult<
  { following: boolean; followersCount: number },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => storesService.followStore(storeId),
    onMutate: async (storeId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: storeKeys.detail(storeId) });

      // Snapshot the previous value
      const previousStore = queryClient.getQueryData<Store>(
        storeKeys.detail(storeId),
      );

      // Optimistically update
      if (previousStore) {
        queryClient.setQueryData(storeKeys.detail(storeId), {
          ...previousStore,
          isFollowing: !previousStore.isFollowing,
          followersCount:
            (previousStore.followersCount || 0) +
            (previousStore.isFollowing ? -1 : 1),
        });
      }

      return { previousStore };
    },
    onError: (_err, storeId, context) => {
      // Rollback on error
      if (context?.previousStore) {
        queryClient.setQueryData(
          storeKeys.detail(storeId),
          context.previousStore,
        );
      }
    },
    onSettled: (_data, _error, storeId) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: storeKeys.detail(storeId) });
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
    },
  });
}
