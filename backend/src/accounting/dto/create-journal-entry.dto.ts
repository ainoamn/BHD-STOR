import { IsString, IsEnum, IsOptional, IsDate, IsArray, ValidateNested, IsUUID, IsDecimal, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReferenceType } from '../entities/journal-entry.entity';

export class JournalLineDto {
  @IsUUID()
  accountId: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '4' })
  @Min(0)
  debit?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '4' })
  @Min(0)
  credit?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateJournalEntryDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsEnum(['order', 'payment', 'expense', 'adjustment', 'payroll'])
  referenceType: ReferenceType;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsUUID()
  createdBy: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
