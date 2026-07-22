import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { StoresModule } from '../stores/stores.module';
import { PaymentsModule } from '../payments/payments.module';
import { ShippingModule } from '../shipping/shipping.module';
import { CurrencyModule } from '../currency/currency.module';
import { UploadModule } from '../upload/upload.module';
import { ChatModule } from '../chat/chat.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AiModule } from '../ai/ai.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { AdminModule } from '../admin/admin.module';

/**
 * Aggregates core commerce modules (was missing — AppModule imported a non-existent path).
 */
@Module({
  imports: [
    OrdersModule,
    ProductsModule,
    StoresModule,
    PaymentsModule,
    ShippingModule,
    CurrencyModule,
    UploadModule,
    ChatModule,
    SubscriptionsModule,
    AnalyticsModule,
    AiModule,
    WhatsAppModule,
    AdminModule,
  ],
  exports: [
    OrdersModule,
    ProductsModule,
    StoresModule,
    PaymentsModule,
    ShippingModule,
  ],
})
export class MarketplaceModule {}
