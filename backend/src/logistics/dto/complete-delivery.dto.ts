import { IsString, IsOptional, IsBoolean, IsJSON, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProofType {
  SIGNATURE = 'signature',
  PHOTO = 'photo',
  OTP = 'otp',
  BOTH = 'both',
}

export class CompleteDeliveryDto {
  @ApiProperty({ enum: ProofType, example: ProofType.BOTH })
  @IsEnum(ProofType)
  proofType: ProofType;

  @ApiPropertyOptional({ example: 'data:image/png;base64,iVBORw0KGgo...' })
  @IsOptional()
  @IsString()
  signatureData?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/delivery/photo.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ example: '1234' })
  @IsOptional()
  @IsString()
  otpCode?: string;

  @ApiPropertyOptional({ example: 'Delivered to reception' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  receivedBy?: string;
}
