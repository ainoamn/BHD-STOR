import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { Payment } from './entities/payment.entity';
import { PaymentGateway } from './entities/payment-gateway.entity';
import { PaymentAttempt } from './entities/payment-attempt.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Invoice } from './entities/invoice.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './services/payments.service';
import { PaymentGatewayFactory } from './services/payment-gateway.factory';
import { StripeService } from './services/stripe.service';
import { PayPalService } from './services/paypal.service';
import { OmanNetService } from './services/oman-net.service';
import { ThawaniService } from './services/thawani.service';
import { TelrService } from './services/telr.service';
import { CCAvenueService } from './services/ccavenue.service';
import { PaymentReconciliationService } from './services/payment-reconciliation.service';
import { InvoiceService } from './services/invoice.service';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [
    AuthModule,
    OrdersModule,
    TypeOrmModule.forFeature([
      Payment,
      PaymentGateway,
      PaymentAttempt,
      WebhookEvent,
      Invoice,
      Order,
    ]),
  ],
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
    PaymentReconciliationService,
    InvoiceService,
  ],
  exports: [
    PaymentsService,
    PaymentGatewayFactory,
    PaymentReconciliationService,
    InvoiceService,
  ],
})
export class PaymentsModule {}
