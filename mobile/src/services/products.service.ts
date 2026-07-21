import apiClient, { ApiResponse } from './api';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  thumbnail: string;
  rating: number;
  reviewCount: number;
  stock: number;
  sold: number;
  categoryId: string;
  categoryName: string;
  storeId: string;
  storeName: string;
  storeLogo?: string;
  isFeatured: boolean;
  isTrending: boolean;
  isNew: boolean;
  freeShipping: boolean;
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  parentId?: string;
  children: Category[];
  productCount: number;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  cover?: string;
  description: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  followerCount: number;
  isFollowing: boolean;
  isVerified: boolean;
  joinedDate: string;
}

export interface ProductFilters {
  categoryId?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  brand?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating';
  search?: string;
  page?: number;
  limit?: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  helpful: number;
  isHelpful: boolean;
}

export const productsService = {
  async getProducts(filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get<ApiResponse<Product[]>>(
      `/products?${params.toString()}`
    );
    return response.data;
  },

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.get<ApiResponse<Product>>(
      `/products/slug/${slug}`
    );
    return response.data;
  },

  async getFeaturedProducts(limit = 10): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      `/products/featured?limit=${limit}`
    );
    return response.data;
  },

  async getTrendingProducts(limit = 10): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      `/products/trending?limit=${limit}`
    );
    return response.data;
  },

  async getNewArrivals(limit = 10): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      `/products/new?limit=${limit}`
    );
    return response.data;
  },

  async searchProducts(
    query: string,
    filters?: Omit<ProductFilters, 'search'>
  ): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>(`/products/search`, {
      params: { q: query, ...filters },
    });
    return response.data;
  },

  async getSearchSuggestions(query: string): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `/products/search/suggestions?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  async getPopularSearches(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<ApiResponse<string[]>>(
      '/products/search/popular'
    );
    return response.data;
  },

  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return response.data;
  },

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  },

  async getCategoryProducts(
    categoryId: string,
    filters?: ProductFilters
  ): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      `/categories/${categoryId}/products`,
      { params: filters }
    );
    return response.data;
  },

  async getStores(limit = 10): Promise<ApiResponse<Store[]>> {
    const response = await apiClient.get<ApiResponse<Store[]>>(
      `/stores?limit=${limit}`
    );
    return response.data;
  },

  async getStoreById(id: string): Promise<ApiResponse<Store>> {
    const response = await apiClient.get<ApiResponse<Store>>(`/stores/${id}`);
    return response.data;
  },

  async getStoreProducts(
    storeId: string,
    filters?: ProductFilters
  ): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      `/stores/${storeId}/products`,
      { params: filters }
    );
    return response.data;
  },

  async followStore(storeId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    const response = await apiClient.post<ApiResponse<{ isFollowing: boolean }>>(
      `/stores/${storeId}/follow`
    );
    return response.data;
  },

  async getProductReviews(
    productId: string,
    page = 1,
    limit = 10
  ): Promise<ApiResponse<Review[]>> {
    const response = await apiClient.get<ApiResponse<Review[]>>(
      `/products/${productId}/reviews?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  async addReview(
    productId: string,
    data: { rating: number; comment: string; images?: string[] }
  ): Promise<ApiResponse<Review>> {
    const response = await apiClient.post<ApiResponse<Review>>(
      `/products/${productId}/reviews`,
      data
    );
    return response.data;
  },

  async getRelatedProducts(
    productId: string,
    limit = 8
  ): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      `/products/${productId}/related?limit=${limit}`
    );
    return response.data;
  },

  async getBanners(): Promise<
    ApiResponse<{ id: string; image: string; link?: string; title?: string }[]>
  > {
    const response = await apiClient.get<
      ApiResponse<{ id: string; image: string; link?: string; title?: string }[]>
    >('/banners');
    return response.data;
  },
};

export default productsService;
