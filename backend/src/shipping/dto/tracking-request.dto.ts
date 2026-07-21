import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TrackingCarrier {
  OMAN_POST = 'oman_post',
  ARAMEX = 'aramex',
  DHL = 'dhl',
  FEDEX = 'fedex',
  UPS = 'ups',
}

export class TrackingRequestDto {
  @ApiProperty({
    description: 'Tracking/AWB number',
    example: '1234567890',
    minLength: 5,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  trackingNumber: string;

  @ApiProperty({
    description: 'Shipping carrier',
    example: 'aramex',
    enum: TrackingCarrier,
  })
  @IsString()
  @IsEnum(TrackingCarrier)
  carrier: TrackingCarrier;

  @ApiPropertyOptional({
    description: 'Order ID for internal reference',
    example: 'order-uuid-1234',
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Customer email for notification',
    example: 'customer@example.com',
  })
  @IsOptional()
  @IsString()
  customerEmail?: string;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  statusCode: string;
  description: string;
  location: string;
  city?: string;
  country?: string;
  signedBy?: string;
}

export interface TrackingResult {
  trackingNumber: string;
  carrier: string;
  carrierName: string;
  status: string;
  estimatedDelivery?: string;
  shippedDate?: string;
  deliveredDate?: string;
  signedBy?: string;
  weight?: number;
  weightUnit?: string;
  service?: string;
  origin: {
    city: string;
    country: string;
  };
  destination: {
    city: string;
    country: string;
  };
  events: TrackingEvent[];
  currentLocation?: string;
  lastUpdated: string;
  isDelivered: boolean;
}

export interface TrackingSubscription {
  id: string;
  trackingNumber: string;
  carrier: string;
  email?: string;
  webhookUrl?: string;
  active: boolean;
  createdAt: string;
}
