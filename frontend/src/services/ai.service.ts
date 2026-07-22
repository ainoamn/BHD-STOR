// =============================================================================
// BHD Oman Marketplace - AI Service
// =============================================================================

import { api } from './api';
import { Product, CartItem } from '../types';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    products?: Product[];
    actions?: Array<{
      type: string;
      label: string;
      payload: Record<string, unknown>;
    }>;
  };
}

export interface ChatContext {
  sessionId?: string;
  previousMessages?: ChatMessage[];
  userId?: string;
  intent?: string;
  cartItems?: CartItem[];
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
  suggestedActions?: Array<{
    type: string;
    label: string;
    payload: Record<string, unknown>;
  }>;
  relatedProducts?: Product[];
}

export interface ChatStreamChunk {
  content: string;
  isDone: boolean;
  sessionId?: string;
}

export interface RecommendationFilters {
  category?: string;
  maxPrice?: number;
  minRating?: number;
  limit?: number;
}

export interface SearchResult {
  products: Product[];
  totalCount: number;
  facets?: Array<{
    field: string;
    values: Array<{ value: string; count: number }>;
  }>;
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number;
  confidence: number;
}

export interface ImageSearchResult {
  products: Product[];
  similarityScores: number[];
}

export interface ProductDescriptionResult {
  description: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  highlights: string[];
}

// ---------------------------------------------------------------------------
// Chat Endpoints
// ---------------------------------------------------------------------------

/**
 * Send a chat message to the AI assistant and get a response.
 * @param message - User's message text
 * @param context - Optional context (sessionId, previous messages, cart items)
 * @returns AI response with message, suggested actions, and related products
 */
export async function chat(
  message: string,
  context?: ChatContext
): Promise<ChatResponse> {
  const response = await api.post<{ success: boolean; data: ChatResponse }>(
    '/ai/chat',
    {
      message,
      sessionId: context?.sessionId,
      previousMessages: context?.previousMessages,
      userId: context?.userId,
      intent: context?.intent,
      cartItems: context?.cartItems,
    }
  );
  return response.data.data;
}

/**
 * Send a chat message and receive a streaming response.
 * Uses Server-Sent Events for real-time token-by-token responses.
 * @param message - User's message text
 * @param context - Optional context
 * @param onChunk - Callback fired for each chunk of the streamed response
 * @param onComplete - Callback fired when streaming is complete
 * @param onError - Callback fired on stream error
 * @returns A function to abort the stream
 */
export function chatStream(
  message: string,
  context: ChatContext | undefined,
  onChunk: (chunk: ChatStreamChunk) => void,
  onComplete: (fullResponse: ChatResponse) => void,
  onError: (error: Error) => void
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('bhd_access_token') || ''}`,
        },
        body: JSON.stringify({
          message,
          sessionId: context?.sessionId,
          previousMessages: context?.previousMessages,
          userId: context?.userId,
          intent: context?.intent,
          cartItems: context?.cartItems,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Stream error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Stream complete
              return;
            }
            try {
              const parsed = JSON.parse(data) as ChatStreamChunk;
              onChunk(parsed);
            } catch {
              // Ignore parse errors for non-JSON lines
            }
          }
        }
      }

      // Signal completion
      onComplete({
        message: {
          id: '',
          role: 'assistant',
          content: buffer,
          timestamp: new Date().toISOString(),
        },
        sessionId: context?.sessionId || '',
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        onError(err as Error);
      }
    }
  })();

  return () => controller.abort();
}

// ---------------------------------------------------------------------------
// Recommendation Endpoints
// ---------------------------------------------------------------------------

/**
 * Get AI-powered personalized product recommendations for the current user.
 * @param limit - Maximum number of recommendations (default 10)
 * @param filters - Optional filters to apply
 * @returns List of recommended products
 */
export async function getRecommendations(
  limit = 10,
  filters?: RecommendationFilters
): Promise<Product[]> {
  const response = await api.post<{ success: boolean; data: Product[] }>(
    '/ai/recommendations',
    { limit, ...filters }
  );
  return response.data.data;
}

/**
 * Get smart product suggestions based on current cart items
 * ("frequently bought together", "complete the look", etc.).
 * @param cartItems - Current cart items
 * @returns List of suggested products
 */
export async function getSmartCartSuggestions(
  cartItems: CartItem[]
): Promise<Product[]> {
  const response = await api.post<{ success: boolean; data: Product[] }>(
    '/ai/cart-suggestions',
    { cartItems }
  );
  return response.data.data;
}

/**
 * Get "customers also viewed" products for a given product.
 * @param productId - Product UUID
 * @param limit - Maximum results (default 8)
 * @returns List of related products based on viewing patterns
 */
export async function getCustomersAlsoViewed(
  productId: string,
  limit = 8
): Promise<Product[]> {
  const response = await api.get<{ success: boolean; data: Product[] }>(
    `/ai/also-viewed/${productId}`,
    { params: { limit } }
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Search Endpoints
// ---------------------------------------------------------------------------

/**
 * Perform AI-powered semantic search that understands natural language queries.
 * @param query - Natural language search query
 * @param filters - Optional filters
 * @returns Semantic search results with products
 */
export async function semanticSearch(
  query: string,
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  }
): Promise<SearchResult> {
  const response = await api.post<{ success: boolean; data: SearchResult }>(
    '/ai/search',
    { query, ...filters }
  );
  return response.data.data;
}

/**
 * Search products by uploading an image (visual search).
 * @param imageFile - Image file to search with
 * @returns Similar products found in the catalog
 */
export async function visualSearch(imageFile: File): Promise<ImageSearchResult> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await api.post<{ success: boolean; data: ImageSearchResult }>(
    '/ai/search/visual',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Translation Endpoints
// ---------------------------------------------------------------------------

/**
 * Translate text between languages.
 * @param text - Text to translate
 * @param from - Source language code (e.g., 'en', 'ar')
 * @param to - Target language code (e.g., 'ar', 'en')
 * @returns Translated text
 */
export async function translate(
  text: string,
  from: string,
  to: string
): Promise<string> {
  const response = await api.post<{ success: boolean; data: { translatedText: string } }>(
    '/ai/translate',
    { text, from, to }
  );
  return response.data.data.translatedText;
}

/**
 * Translate product content (name, description, attributes) in bulk.
 * @param productId - Product UUID
 * @param targetLanguage - Target language code
 * @returns Object with translated fields
 */
export async function translateProduct(
  productId: string,
  targetLanguage: string
): Promise<{
  name: string;
  description: string;
  shortDescription?: string;
  attributes: Array<{ name: string; value: string }>;
}> {
  const response = await api.post<{
    success: boolean;
    data: {
      name: string;
      description: string;
      shortDescription?: string;
      attributes: Array<{ name: string; value: string }>;
    };
  }>('/ai/translate/product', { productId, targetLanguage });
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Sentiment Analysis
// ---------------------------------------------------------------------------

/**
 * Analyze the sentiment of a given text (useful for reviews, feedback).
 * @param text - Text to analyze
 * @returns Sentiment result with label, score, and confidence
 */
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const response = await api.post<{ success: boolean; data: SentimentResult }>(
    '/ai/sentiment',
    { text }
  );
  return response.data.data;
}

/**
 * Analyze sentiment of a product's reviews in aggregate.
 * @param productId - Product UUID
 * @returns Aggregated sentiment analysis
 */
export async function analyzeProductSentiment(productId: string): Promise<{
  overall: SentimentResult;
  distribution: Record<string, number>;
  keyPhrases: string[];
}> {
  const response = await api.get<{
    success: boolean;
    data: {
      overall: SentimentResult;
      distribution: Record<string, number>;
      keyPhrases: string[];
    };
  }>(`/ai/sentiment/product/${productId}`);
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Content Generation
// ---------------------------------------------------------------------------

/**
 * Generate AI product description, SEO content, and highlights.
 * @param productName - Product name
 * @param category - Product category
 * @param attributes - Key product attributes
 * @param keywords - SEO keywords to include
 * @returns Generated description, SEO title, meta description, keywords, highlights
 */
export async function generateProductDescription(
  productName: string,
  category: string,
  attributes: Record<string, string>,
  keywords?: string[]
): Promise<ProductDescriptionResult> {
  const response = await api.post<{
    success: boolean;
    data: ProductDescriptionResult;
  }>('/ai/generate/product-description', {
    productName,
    category,
    attributes,
    keywords,
  });
  return response.data.data;
}

/**
 * Generate auto-reply suggestions for customer inquiries.
 * @param message - Customer message
 * @param context - Optional context (order info, product info)
 * @returns Suggested reply text
 */
export async function generateReplySuggestion(
  message: string,
  context?: {
    orderId?: string;
    productId?: string;
    customerName?: string;
  }
): Promise<{ reply: string; tone: string }> {
  const response = await api.post<{
    success: boolean;
    data: { reply: string; tone: string };
  }>('/ai/generate/reply', { message, context });
  return response.data.data;
}

export interface ChatRequest {
  message: string;
  context?: ChatContext;
  history?: Array<{ role: string; content: string }>;
}

export type Recommendation = Product;
export type SmartCartSuggestion = Product;
export type SemanticSearchResult = Product;
export interface TranslationResult {
  translatedText: string;
  from: string;
  to: string;
}

export const aiService = {
  chat: (request: ChatRequest) => chat(request.message, request.context),
  getRecommendations: (limit = 10, filters?: RecommendationFilters) =>
    getRecommendations(limit, filters),
  getSmartCartSuggestions: (
    cartItems: Array<{ productId: string; name: string; category?: string }>,
  ) =>
    getSmartCartSuggestions(
      cartItems.map((item) => ({
        id: item.productId,
        productId: item.productId,
        name: item.name,
        quantity: 1,
        price: 0,
      })) as unknown as CartItem[],
    ),
  semanticSearch: async (query: string) => {
    const result = await semanticSearch(query);
    return result.products as SemanticSearchResult[];
  },
  translate: async (text: string, from: string, to: string): Promise<TranslationResult> => {
    const translatedText = await translate(text, from, to);
    return { translatedText, from, to };
  },
  analyzeSentiment,
};
