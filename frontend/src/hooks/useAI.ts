import {
  useMutation,
  useQuery,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { aiService } from '@/services/ai.service';
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  Recommendation,
  SmartCartSuggestion,
  SemanticSearchResult,
  TranslationResult,
  SentimentResult,
} from '@/services/ai.service';

// ------------------------------------------------------------------
// Query & Mutation Keys
// ------------------------------------------------------------------
export const aiKeys = {
  all: ['ai'] as const,
  chat: () => [...aiKeys.all, 'chat'] as const,
  recommendations: (limit: number) =>
    [...aiKeys.all, 'recommendations', limit] as const,
  smartCart: (cartItems: unknown[]) =>
    [...aiKeys.all, 'smartCart', cartItems] as const,
  semanticSearch: (query: string) =>
    [...aiKeys.all, 'semanticSearch', query] as const,
  translate: (text: string, from: string, to: string) =>
    [...aiKeys.all, 'translate', text, from, to] as const,
  sentiment: (text: string) =>
    [...aiKeys.all, 'sentiment', text] as const,
};

// ------------------------------------------------------------------
// AI Chat Hook
// ------------------------------------------------------------------

/**
 * Hook: useChat
 * Mutation for sending messages to the AI assistant.
 */
export function useChat(): UseMutationResult<
  ChatResponse,
  Error,
  ChatRequest
> {
  return useMutation({
    mutationFn: (request: ChatRequest) => aiService.chat(request),
  });
}

// ------------------------------------------------------------------
// AI Recommendation Hook
// ------------------------------------------------------------------

/**
 * Hook: useRecommendations
 * Fetch AI-powered personalized product recommendations.
 */
export function useRecommendations(
  limit: number = 10,
): UseQueryResult<Recommendation[], Error> {
  return useQuery({
    queryKey: aiKeys.recommendations(limit),
    queryFn: () => aiService.getRecommendations(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
    enabled: limit > 0,
  });
}

// ------------------------------------------------------------------
// AI Smart Cart Hook
// ------------------------------------------------------------------

/**
 * Hook: useSmartCartSuggestions
 * Fetch AI-powered suggestions based on current cart items.
 */
export function useSmartCartSuggestions(
  cartItems: Array<{ productId: string; name: string; category?: string }>,
): UseQueryResult<SmartCartSuggestion[], Error> {
  return useQuery({
    queryKey: aiKeys.smartCart(cartItems),
    queryFn: () => aiService.getSmartCartSuggestions(cartItems),
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10,
    enabled: cartItems.length > 0,
  });
}

// ------------------------------------------------------------------
// AI Semantic Search Hook
// ------------------------------------------------------------------

/**
 * Hook: useSemanticSearch
 * Perform AI-powered semantic search. Only enabled when query > 2 chars.
 */
export function useSemanticSearch(
  query: string,
): UseQueryResult<SemanticSearchResult[], Error> {
  return useQuery({
    queryKey: aiKeys.semanticSearch(query),
    queryFn: () => aiService.semanticSearch(query),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5,
    enabled: query.trim().length > 2,
    placeholderData: (previousData) => previousData,
  });
}

// ------------------------------------------------------------------
// AI Translation Hook
// ------------------------------------------------------------------

/**
 * Hook: useTranslate
 * Translate text from one language to another.
 */
export function useTranslate(
  text: string,
  from: string,
  to: string,
): UseQueryResult<TranslationResult, Error> {
  return useQuery({
    queryKey: aiKeys.translate(text, from, to),
    queryFn: () => aiService.translate(text, from, to),
    staleTime: Infinity, // Translations don't change
    gcTime: 1000 * 60 * 30,
    enabled: !!text && text.trim().length > 0 && !!from && !!to && from !== to,
  });
}

// ------------------------------------------------------------------
// AI Sentiment Analysis Hook
// ------------------------------------------------------------------

/**
 * Hook: useSentiment
 * Analyze the sentiment of a given text.
 */
export function useSentiment(
  text: string,
): UseQueryResult<SentimentResult, Error> {
  return useQuery({
    queryKey: aiKeys.sentiment(text),
    queryFn: () => aiService.analyzeSentiment(text),
    staleTime: Infinity, // Sentiment results are deterministic
    gcTime: 1000 * 60 * 30,
    enabled: !!text && text.trim().length > 0,
  });
}
