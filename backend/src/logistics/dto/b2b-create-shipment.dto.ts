import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  ValidateNested,
  Min,
  Max,
  Length,
  Matches,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Sender information DTO
 */
export class SenderInfoDto {
  @IsString({ message: 'Sender name must be a string' })
  @IsNotEmpty({ message: 'Sender name is required' })
  @Length(1, 100, { message: 'Sender name must be between 1 and 100 characters' })
  name: string;

  @IsString({ message: 'Sender phone must be a string' })
  @IsNotEmpty({ message: 'Sender phone is required' })
  @Matches(/^[0-9+\-\s]{10,15}$/, {
    message: 'Sender phone must be a valid phone number (10-15 digits)',
  })
  phone: string;

  @IsString({ message: 'Sender address must be a string' })
  @IsNotEmpty({ message: 'Sender address is required' })
  @Length(10, 300, { message: 'Sender address must be between 10 and 300 characters' })
  address: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;
}

/**
 * Receiver information DTO
 */
export class ReceiverInfoDto {
  @IsString({ message: 'Receiver name must be a string' })
  @IsNotEmpty({ message: 'Receiver name is required' })
  @Length(1, 100, { message: 'Receiver name must be between 1 and 100 characters' })
  name: string;

  @IsString({ message: 'Receiver phone must be a string' })
  @IsNotEmpty({ message: 'Receiver phone is required' })
  @Matches(/^[0-9+\-\s]{10,15}$/, {
    message: 'Receiver phone must be a valid phone number (10-15 digits)',
  })
  phone: string;

  @IsString({ message: 'Receiver address must be a string' })
  @IsNotEmpty({ message: 'Receiver address is required' })
  @Length(10, 300, { message: 'Receiver address must be between 10 and 300 characters' })
  address: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;
}

/**
 * Package dimensions DTO
 */
export class PackageDimensionsDto {
  @IsNumber({}, { message: 'Length must be a number' })
  @Min(1, { message: 'Length must be at least 1 cm' })
  @Max(500, { message: 'Length must not exceed 500 cm' })
  length: number;

  @IsNumber({}, { message: 'Width must be a number' })
  @Min(1, { message: 'Width must be at least 1 cm' })
  @Max(500, { message: 'Width must not exceed 500 cm' })
  width: number;

  @IsNumber({}, { message: 'Height must be a number' })
  @Min(1, { message: 'Height must be at least 1 cm' })
  @Max(500, { message: 'Height must not exceed 500 cm' })
  height: number;
}

/**
 * Package details DTO
 */
export class PackageDetailsDto {
  @IsString({ message: 'Package type must be a string' })
  @IsNotEmpty({ message: 'Package type is required' })
  @IsEnum(
    ['document', 'parcel', 'fragile', 'heavy', 'pallet'],
    { message: 'Package type must be one of: document, parcel, fragile, heavy, pallet' },
  )
  type: 'document' | 'parcel' | 'fragile' | 'heavy' | 'pallet';

  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(0.1, { message: 'Weight must be at least 0.1 kg' })
  @Max(1000, { message: 'Weight must not exceed 1000 kg' })
  weight: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PackageDimensionsDto)
  dimensions?: PackageDimensionsDto;

  @IsOptional()
  @IsNumber({}, { message: 'Declared value must be a number' })
  @Min(0, { message: 'Declared value must be non-negative' })
  declaredValue?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * B2B Create Shipment DTO
 * Main DTO for creating shipments via the B2B API
 */
export class B2bCreateShipmentDto {
  @IsOptional()
  @IsString({ message: 'Reference number must be a string' })
  @Length(1, 50, {
    message: 'Reference number must be between 1 and 50 characters',
  })
  referenceNumber?: string;

  @IsNotEmpty({ message: 'Sender information is required' })
  @ValidateNested()
  @Type(() => SenderInfoDto)
  sender: SenderInfoDto;

  @IsNotEmpty({ message: 'Receiver information is required' })
  @ValidateNested()
  @Type(() => ReceiverInfoDto)
  receiver: ReceiverInfoDto;

  @IsNotEmpty({ message: 'Package details are required' })
  @ValidateNested()
  @Type(() => PackageDetailsDto)
  package: PackageDetailsDto;

  @IsString({ message: 'Service type must be a string' })
  @IsNotEmpty({ message: 'Service type is required' })
  @IsEnum(
    ['standard', 'express', 'same_day', 'overnight'],
    { message: 'Service type must be one of: standard, express, same_day, overnight' },
  )
  serviceType: 'standard' | 'express' | 'same_day' | 'overnight';

  @IsOptional()
  @IsNumber({}, { message: 'COD amount must be a number' })
  @Min(0, { message: 'COD amount must be non-negative' })
  codAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  pickupDate?: string;
}
