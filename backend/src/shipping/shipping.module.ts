import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ShippingController } from './shipping.controller';
import { ShippingCalculatorService } from './services/shipping-calculator.service';
import { TrackingService } from './services/tracking.service';
import { OmanPostService } from './services/oman-post.service';
import { AramexService } from './services/aramex.service';
import { DHLService } from './services/dhl.service';
import { FedExService } from './services/fedex.service';
import { UPSService } from './services/ups.service';
import { ShippingCarriersService } from './services/shipping-carriers.service';
import { ShippingCarrier } from './entities/shipping-carrier.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ShippingCarrier])],
  controllers: [ShippingController],
  providers: [
    ShippingCalculatorService,
    TrackingService,
    OmanPostService,
    AramexService,
    DHLService,
    FedExService,
    UPSService,
    ShippingCarriersService,
  ],
  exports: [
    ShippingCalculatorService,
    TrackingService,
    ShippingCarriersService,
  ],
})
export class ShippingModule {}
