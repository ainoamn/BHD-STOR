import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  Matches,
  IsUrl,
  IsBoolean,
} from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
    required: true,
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s'-]+$/)
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s'-]+$/)
  lastName: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+96891234567',
    required: true,
  })
  @IsPhoneNumber(null, { message: 'Please provide a valid phone number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.CUSTOMER;

  @ApiPropertyOptional({
    description: 'User status',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus = UserStatus.PENDING_VERIFICATION;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://cdn.example.com/avatars/user.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Whether email is verified',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean = false;
}
