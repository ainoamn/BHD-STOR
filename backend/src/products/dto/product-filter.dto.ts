import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus, ProductType } from './create-product.dto';

export enum ProductSortField {
  NAME = 'name',
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  VIEWS = 'viewCount',
  SALES = 'salesCount',
  RATING = 'rating',
}

export class ProductFilterDto {
  @ApiPropertyOptional({ description: 'Search query for name, description, or tags' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by store ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Minimum price', example: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price', example: 500 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by product status', enum: ProductStatus })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Filter by product type', enum: ProductType })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @ApiPropertyOptional({ description: 'Filter by tags', example: ['traditional'] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Sort field', enum: ProductSortField, default: ProductSortField.CREATED_AT })
  @IsEnum(ProductSortField)
  @IsOptional()
  sort?: ProductSortField = ProductSortField.CREATED_AT;

  @ApiPropertyOptional({ description: 'Sort order', example: 'DESC' })
  @IsString()
  @IsOptional()
  order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 12;

  @ApiPropertyOptional({ description: 'Include out of stock products', default: false })
  @IsOptional()
  @Type(() => Boolean)
  includeOutOfStock?: boolean = false;
}
