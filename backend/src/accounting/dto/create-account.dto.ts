import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, Length, IsDecimal, Min } from 'class-validator';
import { AccountType, AccountCategory } from '../entities/account.entity';

export class CreateAccountDto {
  @IsString()
  @Length(1, 50)
  code: string;

  @IsString()
  @Length(1, 255)
  name: string;

  @IsString()
  @Length(1, 255)
  nameAr: string;

  @IsEnum(['asset', 'liability', 'equity', 'revenue', 'expense'])
  type: AccountType;

  @IsString()
  category: AccountCategory;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '4' })
  @Min(0)
  balance?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
