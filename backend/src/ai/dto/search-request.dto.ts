import { IsString, IsObject, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchRequestDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'wireless headphones with noise cancellation',
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Search filters (category, price range, brand, etc.)',
    example: {
      category: 'electronics',
      minPrice: 20,
      maxPrice: 300,
      brand: 'Sony',
      rating: 4,
    },
  })
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    example: 20,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Page offset for pagination',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  offset?: number;

  @ApiPropertyOptional({
    description: 'User ID for personalized search results',
    example: 'user-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class SearchResponseDto {
  @ApiProperty({ description: 'Original search query' })
  query: string;

  @ApiProperty({ description: 'Corrected query (if spell check applied)' })
  correctedQuery?: string;

  @ApiProperty({ description: 'Search results' })
  results: SearchResultDto[];

  @ApiProperty({ description: 'Total number of results' })
  total: number;

  @ApiProperty({ description: 'Search suggestions' })
  suggestions: string[];

  @ApiProperty({ description: 'Processing time in milliseconds' })
  processingTime: number;

  @ApiPropertyOptional({ description: 'Applied filters' })
  appliedFilters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'AI-generated search summary' })
  aiSummary?: string;
}

export class SearchResultDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product description' })
  description: string;

  @ApiProperty({ description: 'Product price' })
  price: number;

  @ApiProperty({ description: 'Product currency (OMR)' })
  currency: string;

  @ApiPropertyOptional({ description: 'Product image URL' })
  imageUrl?: string;

  @ApiProperty({ description: 'Product category' })
  category: string;

  @ApiProperty({ description: 'Store name' })
  store: string;

  @ApiProperty({ description: 'Semantic relevance score (0-1)' })
  relevanceScore: number;

  @ApiPropertyOptional({ description: 'Product rating' })
  rating?: number;

  @ApiPropertyOptional({ description: 'Number of reviews' })
  reviewCount?: number;

  @ApiPropertyOptional({ description: 'Available variants' })
  variants?: any[];
}

export class SearchSuggestionDto {
  @ApiProperty({ description: 'Suggested query' })
  query: string;

  @ApiProperty({ description: 'Suggestion type' })
  type: 'autocomplete' | 'trending' | 'personalized' | 'corrected';

  @ApiPropertyOptional({ description: 'Number of results for this query' })
  resultCount?: number;
}

export class TranslateRequestDto {
  @ApiProperty({ description: 'Text to translate', example: 'Hello, how are you?' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Source language code', example: 'en' })
  @IsString()
  fromLang: string;

  @ApiProperty({ description: 'Target language code', example: 'ar' })
  @IsString()
  toLang: string;
}

export class SummarizeRequestDto {
  @ApiProperty({
    description: 'Text to summarize',
    example: 'This is a very long product description that needs to be summarized...',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Maximum length of summary',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  maxLength?: number;
}

export class ModerateRequestDto {
  @ApiProperty({
    description: 'Text to check for inappropriate content',
    example: 'This product is amazing! Highly recommended.',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Content type for context-appropriate moderation',
    enum: ['review', 'comment', 'product_description', 'chat_message'],
    example: 'review',
  })
  @IsString()
  @IsOptional()
  contentType?: 'review' | 'comment' | 'product_description' | 'chat_message';
}
