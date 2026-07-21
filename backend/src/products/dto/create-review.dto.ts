import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsString,
  IsOptional,
  IsArray,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Product ID being reviewed', format: 'uuid' })
  @IsUUID('4', { message: 'Invalid product ID format' })
  productId: string;

  @ApiPropertyOptional({ description: 'Order ID associated with this review', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'Rating from 1 to 5', example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating: number;

  @ApiPropertyOptional({ description: 'Review title', example: 'Excellent quality!' })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Title must be at least 2 characters' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title?: string;

  @ApiPropertyOptional({ description: 'Review comment', example: 'The product exceeded my expectations...' })
  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'Comment must be at least 5 characters' })
  @MaxLength(2000, { message: 'Comment must not exceed 2000 characters' })
  comment?: string;

  @ApiPropertyOptional({ description: 'Review images URLs', example: ['https://cdn.example.com/review1.jpg'] })
  @IsArray()
  @IsOptional()
  @IsUrl({}, { each: true })
  images?: string[];
}
