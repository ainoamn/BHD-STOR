import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessType } from './create-store.dto';

export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum StoreSortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  RATING = 'rating',
  PRODUCTS_COUNT = 'productsCount',
}

export class StoreFilterDto {
  @ApiPropertyOptional({ description: 'Search query for store name or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: StoreStatus })
  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus;

  @ApiPropertyOptional({ description: 'Filter by business type', enum: BusinessType })
  @IsEnum(BusinessType)
  @IsOptional()
  businessType?: BusinessType;

  @ApiPropertyOptional({ description: 'Filter by verification status' })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Filter by owner ID' })
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Sort field', enum: StoreSortField, default: StoreSortField.CREATED_AT })
  @IsEnum(StoreSortField)
  @IsOptional()
  sort?: StoreSortField = StoreSortField.CREATED_AT;

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

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
