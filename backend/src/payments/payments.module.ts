import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { Payment } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './services/payments.service';
import { PaymentGatewayFactory } from './services/payment-gateway.factory';
import { StripeService } from './services/stripe.service';
import { PayPalService } from './services/paypal.service';
import { OmanNetService } from './services/oman-net.service';
import { ThawaniService } from './services/thawani.service';
import { TelrService } from './services/telr.service';
import { CCAvenueService } from './services/ccavenue.service';

@Module({
  imports: [AuthModule, OrdersModule, TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentGatewayFactory,
    StripeService,
    PayPalService,
    OmanNetService,
    ThawaniService,
    TelrService,
    CCAvenueService,
  ],
  exports: [PaymentsService, PaymentGatewayFactory],
})
export class PaymentsModule {}
