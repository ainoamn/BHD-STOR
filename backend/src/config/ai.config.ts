import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30000,
    organization: '',
  },

  // Anthropic Claude Configuration
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30000,
  },

  // Google AI (Gemini) Configuration
  google: {
    apiKey: process.env.GOOGLE_AI_API_KEY || '',
    model: process.env.GOOGLE_AI_MODEL || 'gemini-pro',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30000,
  },

  // LangChain Configuration
  langchain: {
    apiKey: process.env.LANGCHAIN_API_KEY || '',
    tracingV2: process.env.LANGCHAIN_TRACING_V2 === 'true',
    project: process.env.LANGCHAIN_PROJECT || 'bhd-marketplace',
    callbackHandler: true,
  },

  // ChromaDB Configuration
  chromadb: {
    url: process.env.CHROMADB_URL || 'http://localhost:8000',
    collectionName: process.env.CHROMADB_COLLECTION_NAME || 'bhd_marketplace',
    distanceFunction: 'cosine',
  },

  // Embedding Configuration
  embeddings: {
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    dimensions: 1536,
    batchSize: 100,
    chunkSize: 1000,
    chunkOverlap: 200,
  },

  // AI Feature Flags
  features: {
    enableProductRecommendations: true,
    enableChatbot: true,
    enablePriceOptimization: true,
    enableFraudDetection: true,
    enableSentimentAnalysis: true,
    enableAutoTranslation: true,
    enableImageGeneration: false,
    enableSmartSearch: true,
  },

  // Rate Limiting for AI APIs
  rateLimits: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    tokensPerMinute: 100000,
  },
}));

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  embeddingModel: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  organization: string;
}

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface GoogleAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface LangChainConfig {
  apiKey: string;
  tracingV2: boolean;
  project: string;
  callbackHandler: boolean;
}

export interface ChromaDBConfig {
  url: string;
  collectionName: string;
  distanceFunction: string;
}

export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  batchSize: number;
  chunkSize: number;
  chunkOverlap: number;
}

export interface AIFeatures {
  enableProductRecommendations: boolean;
  enableChatbot: boolean;
  enablePriceOptimization: boolean;
  enableFraudDetection: boolean;
  enableSentimentAnalysis: boolean;
  enableAutoTranslation: boolean;
  enableImageGeneration: boolean;
  enableSmartSearch: boolean;
}

export interface AIRateLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  tokensPerMinute: number;
}

export interface AIConfig {
  openai: OpenAIConfig;
  anthropic: AnthropicConfig;
  google: GoogleAIConfig;
  langchain: LangChainConfig;
  chromadb: ChromaDBConfig;
  embeddings: EmbeddingConfig;
  features: AIFeatures;
  rateLimits: AIRateLimits;
}
