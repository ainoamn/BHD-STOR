import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminStoresController } from './controllers/admin-stores.controller';
import { AdminProductsController } from './controllers/admin-products.controller';
import { AdminOrdersController } from './controllers/admin-orders.controller';
import { AdminPaymentsController } from './controllers/admin-payments.controller';
import { AdminSubscriptionsController } from './controllers/admin-subscriptions.controller';

import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminStoresService } from './services/admin-stores.service';
import { AdminProductsService } from './services/admin-products.service';
import { AdminOrdersService } from './services/admin-orders.service';
import { AdminPaymentsService } from './services/admin-payments.service';
import { AdminSubscriptionsService } from './services/admin-subscriptions.service';

import { AdminGuard } from './guards/admin.guard';
import { PaymentsModule } from '../payments/payments.module';

// Entities
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionPlanEntity } from '../subscriptions/entities/subscription-plan.entity';
import { Review } from '../reviews/entities/review.entity';
import { ActivityLog } from '../activity/entities/activity-log.entity';
import { Payout } from '../payments/entities/payout.entity';

@Module({
  imports: [
    PaymentsModule,
    TypeOrmModule.forFeature([
      User,
      Store,
      Product,
      Order,
      OrderItem,
      Payment,
      Subscription,
      SubscriptionPlanEntity,
      Review,
      ActivityLog,
      Payout,
    ]),
  ],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminStoresController,
    AdminProductsController,
    AdminOrdersController,
    AdminPaymentsController,
    AdminSubscriptionsController,
  ],
  providers: [
    AdminDashboardService,
    AdminUsersService,
    AdminStoresService,
    AdminProductsService,
    AdminOrdersService,
    AdminPaymentsService,
    AdminSubscriptionsService,
    AdminGuard,
  ],
  exports: [AdminGuard],
})
export class AdminModule {}
