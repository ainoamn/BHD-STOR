import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsPositive,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsArray,
  IsObject,
  ValidateNested,
  ArrayMinSize,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SERVICE = 'service',
  SUBSCRIPTION = 'subscription',
}

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  ARCHIVED = 'archived',
}

export class ProductDimensionsDto {
  @IsNumber()
  @IsPositive()
  length: number;

  @IsNumber()
  @IsPositive()
  width: number;

  @IsNumber()
  @IsPositive()
  height: number;

  @IsString()
  unit: string;
}

export class ProductAttributeDto {
  @IsString()
  name: string;

  @IsString()
  value: string;
}

export class ProductVariantDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class CreateProductDto {
  @ApiProperty({ description: 'Store ID', format: 'uuid' })
  @IsUUID('4', { message: 'Invalid store ID format' })
  storeId: string;

  @ApiProperty({ description: 'Category ID', format: 'uuid' })
  @IsUUID('4', { message: 'Invalid category ID format' })
  categoryId: string;

  @ApiProperty({ description: 'Product name', example: 'Traditional Omani Khanjar' })
  @IsString()
  @MinLength(2, { message: 'Product name must be at least 2 characters' })
  @MaxLength(200, { message: 'Product name must not exceed 200 characters' })
  name: string;

  @ApiPropertyOptional({ description: 'English product name', example: 'Traditional Omani Dagger' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Product description', example: 'Handcrafted traditional Omani khanjar...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Short description', example: 'Premium quality traditional khanjar' })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Short description must not exceed 500 characters' })
  shortDescription?: string;

  @ApiProperty({ description: 'Product type', enum: ProductType, example: ProductType.PHYSICAL })
  @IsEnum(ProductType, { message: 'Invalid product type' })
  type: ProductType;

  @ApiProperty({ description: 'Product price', example: 45.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Price must be positive' })
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ description: 'Compare at price (original price)', example: 55.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  compareAtPrice?: number;

  @ApiPropertyOptional({ description: 'SKU (Stock Keeping Unit)', example: 'OM-KHAN-001' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Product weight in kg', example: 0.5 })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional({ description: 'Product dimensions', type: ProductDimensionsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProductDimensionsDto)
  dimensions?: ProductDimensionsDto;

  @ApiProperty({ description: 'Inventory quantity', example: 25 })
  @IsNumber()
  @Min(0, { message: 'Inventory quantity must be 0 or greater' })
  @Type(() => Number)
  inventoryQuantity: number;

  @ApiPropertyOptional({ description: 'Low stock threshold', default: 5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  lowStockThreshold?: number = 5;

  @ApiPropertyOptional({ description: 'Product images URLs', example: ['https://cdn.example.com/img1.jpg'] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Product attributes', type: [ProductAttributeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];

  @ApiPropertyOptional({ description: 'Product variants', type: [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @ApiPropertyOptional({ description: 'SEO title', example: 'Traditional Omani Khanjar - Premium Quality' })
  @IsString()
  @IsOptional()
  @MaxLength(70)
  seoTitle?: string;

  @ApiPropertyOptional({ description: 'SEO description', example: 'Buy authentic Omani khanjar online...' })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  seoDescription?: string;

  @ApiPropertyOptional({ description: 'SEO keywords', example: 'khanjar, omani, traditional, dagger' })
  @IsString()
  @IsOptional()
  seoKeywords?: string;

  @ApiPropertyOptional({ description: 'Product tags', example: ['traditional', 'handcrafted', 'omani'] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is featured product', default: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Product status', enum: ProductStatus, default: ProductStatus.DRAFT })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus = ProductStatus.DRAFT;
}
