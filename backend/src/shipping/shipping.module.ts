import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ShippingController } from './shipping.controller';
import { ShippingCalculatorService } from './services/shipping-calculator.service';
import { TrackingService } from './services/tracking.service';
import { OmanPostService } from './services/oman-post.service';
import { AramexService } from './services/aramex.service';
import { DHLService } from './services/dhl.service';
import { FedExService } from './services/fedex.service';
import { UPSService } from './services/ups.service';

@Module({
  imports: [AuthModule],
  controllers: [ShippingController],
  providers: [
    ShippingCalculatorService,
    TrackingService,
    OmanPostService,
    AramexService,
    DHLService,
    FedExService,
    UPSService,
  ],
  exports: [ShippingCalculatorService, TrackingService],
})
export class ShippingModule {}
