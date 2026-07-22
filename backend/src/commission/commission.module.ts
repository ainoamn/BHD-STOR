import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionController } from './commission.controller';
import { CommissionService } from './services/commission.service';
import { CommissionPlan } from './entities/commission-plan.entity';
import { Commission } from './entities/commission.entity';
import { OrderCommissionListener } from './listeners/order-commission.listener';
import { OrdersModule } from '../orders/orders.module';
import { Store } from '../stores/entities/store.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommissionPlan, Commission, Store, User]),
    forwardRef(() => OrdersModule),
  ],
  controllers: [CommissionController],
  providers: [CommissionService, OrderCommissionListener],
  exports: [CommissionService],
})
export class CommissionModule {}
