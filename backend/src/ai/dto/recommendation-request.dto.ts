import { IsString, IsNumber, IsObject, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecommendationRequestDto {
  @ApiProperty({
    description: 'User ID to get personalized recommendations for',
    example: 'user-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Maximum number of recommendations to return',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  limit: number;

  @ApiPropertyOptional({
    description: 'Filter recommendations by category',
    example: 'electronics',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Additional filters for recommendations',
    example: { minPrice: 10, maxPrice: 500, brand: 'Apple' },
  })
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;
}

export class RecommendationResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'List of recommended products' })
  products: RecommendedProductDto[];

  @ApiProperty({ description: 'Recommendation algorithm used' })
  algorithm: 'collaborative_filtering' | 'content_based' | 'hybrid' | 'trending';

  @ApiProperty({ description: 'Time taken to generate recommendations (ms)' })
  processingTime: number;
}

export class RecommendedProductDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product price' })
  price: number;

  @ApiProperty({ description: 'Product currency' })
  currency: string;

  @ApiPropertyOptional({ description: 'Product image URL' })
  imageUrl?: string;

  @ApiProperty({ description: 'Recommendation score (0-1)' })
  score: number;

  @ApiProperty({ description: 'Why this was recommended' })
  reason: string;

  @ApiProperty({ description: 'Product category' })
  category: string;

  @ApiProperty({ description: 'Store name' })
  store: string;
}

export class SimilarProductsRequestDto {
  @ApiProperty({ description: 'Product ID to find similar items for' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Maximum number of similar products', example: 8 })
  @IsNumber()
  @Min(1)
  @Max(20)
  limit: number;
}

export class FrequentlyBoughtTogetherRequestDto {
  @ApiProperty({ description: 'Product ID to find complementary items for' })
  @IsString()
  productId: string;
}
