import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name in Arabic', example: 'منتجات تقليدية' })
  @IsString()
  @MinLength(2, { message: 'Category name must be at least 2 characters' })
  @MaxLength(100, { message: 'Category name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({ description: 'Category name in English', example: 'Traditional Products' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Parent category ID for subcategories', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Category icon URL', example: 'https://cdn.example.com/icons/traditional.png' })
  @IsUrl()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Category color code', example: '#D4AF37' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Category description', example: 'Handcrafted traditional Omani products' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Category image URL', example: 'https://cdn.example.com/categories/traditional.jpg' })
  @IsUrl()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is category active', default: true })
  @IsOptional()
  isActive?: boolean;
}
