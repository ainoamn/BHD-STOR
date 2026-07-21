import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
  IsPhoneNumber,
  IsUrl,
  MinLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s'-]+$/)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s'-]+$/)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+96891234567',
  })
  @IsOptional()
  @IsPhoneNumber(null)
  phone?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'User status',
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://cdn.example.com/avatars/user.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Preferred language code',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  preferredLanguage?: string;

  @ApiPropertyOptional({
    description: 'Preferred currency code',
    example: 'OMR',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  preferredCurrency?: string;

  @ApiPropertyOptional({
    description: 'Whether the user is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
