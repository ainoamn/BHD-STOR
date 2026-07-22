import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionService } from '../services/commission.service';
import { Commission } from '../entities/commission.entity';
import { OrdersService } from '../../orders/orders.service';
import { Store } from '../../stores/entities/store.entity';
import { User, CommissionType } from '../../users/entities/user.entity';

/**
 * Creates marketplace commission rows when an order is paid (or COD-confirmed).
 * Skips per-order commission when the seller chose a pure subscription mode
 * with 0% transaction fee.
 */
@Injectable()
export class OrderCommissionListener {
  private readonly logger = new Logger(OrderCommissionListener.name);

  constructor(
    private readonly commissionService: CommissionService,
    private readonly ordersService: OrdersService,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @OnEvent('order.paid', { async: true })
  @OnEvent('order.created', { async: true })
  async handleOrderCommission(payload: { orderId: string }): Promise<void> {
    if (!payload?.orderId) return;

    try {
      const existing = await this.commissionRepo.count({
        where: { orderId: payload.orderId },
      });
      if (existing > 0) {
        this.logger.debug(`Commissions already exist for order ${payload.orderId}`);
        return;
      }

      const order = await this.ordersService.findOne(payload.orderId);
      const storeId = order.storeId || order.store?.id;
      if (!storeId) {
        this.logger.warn(`Order ${payload.orderId} has no store — skip commission`);
        return;
      }

      const store = await this.storeRepo.findOne({ where: { id: storeId } });
      const sellerId = store?.ownerId;
      if (!sellerId) {
        this.logger.warn(`Store ${storeId} has no owner — skip commission`);
        return;
      }

      const seller = await this.userRepo.findOne({ where: { id: sellerId } });
      if (
        seller?.commissionType === CommissionType.SUBSCRIPTION &&
        Number(seller.commissionRate ?? 0) === 0
      ) {
        this.logger.log(
          `Seller ${sellerId} on subscription with 0% fee — skip order commission`,
        );
        return;
      }

      const saleAmount = Number(order.subtotal ?? order.total ?? 0);
      if (saleAmount <= 0) return;

      const created = await this.commissionService.calculateCommission({
        userId: sellerId,
        orderId: order.id,
        saleAmount,
      });

      this.logger.log(
        `Created ${created.length} commission(s) for order ${order.id} (seller ${sellerId})`,
      );
    } catch (err) {
      this.logger.error(
        `Commission listener failed for ${payload.orderId}: ${err.message}`,
        err.stack,
      );
    }
  }
}
