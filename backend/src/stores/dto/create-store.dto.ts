import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';

export enum BusinessType {
  B2B = 'b2b',
  B2C = 'b2c',
  C2C = 'c2c',
  HYBRID = 'hybrid',
}

export class CreateStoreDto {
  @ApiProperty({ description: 'Store name', example: 'Al Maha Trading' })
  @IsString()
  @MinLength(2, { message: 'Store name must be at least 2 characters' })
  @MaxLength(100, { message: 'Store name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Store description',
    example: 'Premium Omani products and traditional crafts...',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description?: string;

  @ApiProperty({
    description: 'Business type',
    enum: BusinessType,
    example: BusinessType.B2C,
  })
  @IsEnum(BusinessType, { message: 'Invalid business type' })
  businessType: BusinessType;

  @ApiPropertyOptional({
    description: 'Store logo URL',
    example: 'https://cdn.example.com/logos/store-logo.png',
  })
  @IsUrl({}, { message: 'Logo must be a valid URL' })
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Store cover image URL',
    example: 'https://cdn.example.com/covers/store-cover.jpg',
  })
  @IsUrl({}, { message: 'Cover image must be a valid URL' })
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Social media links',
    example: {
      facebook: 'https://facebook.com/almaha',
      instagram: 'https://instagram.com/almaha',
      twitter: 'https://twitter.com/almaha',
    },
  })
  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Business hours',
    example: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '14:00', close: '18:00', isOpen: true },
    },
  })
  @IsObject()
  @IsOptional()
  businessHours?: Record<string, { open: string; close: string; isOpen: boolean }>;

  @ApiPropertyOptional({
    description: 'Return policy',
    example: 'Returns accepted within 14 days of purchase...',
  })
  @IsString()
  @IsOptional()
  returnPolicy?: string;

  @ApiPropertyOptional({
    description: 'Shipping policy',
    example: 'Free shipping on orders over 10 OMR...',
  })
  @IsString()
  @IsOptional()
  shippingPolicy?: string;

  @ApiPropertyOptional({ description: 'SEO title', example: 'Al Maha Trading - Premium Omani Products' })
  @IsString()
  @IsOptional()
  @MaxLength(70, { message: 'SEO title must not exceed 70 characters' })
  seoTitle?: string;

  @ApiPropertyOptional({
    description: 'SEO description',
    example: 'Discover premium Omani products at Al Maha Trading...',
  })
  @IsString()
  @IsOptional()
  @MaxLength(160, { message: 'SEO description must not exceed 160 characters' })
  seoDescription?: string;

  @ApiPropertyOptional({
    description: 'SEO keywords',
    example: 'omani products, traditional crafts, muscat',
  })
  @IsString()
  @IsOptional()
  seoKeywords?: string;
}
