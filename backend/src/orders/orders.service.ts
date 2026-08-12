import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order, OrderAddress, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CartService } from './cart.service';
import { isStaffRole } from '../auth/utils/roles';
import { evaluateCoupon } from './utils/coupons';
import { addMoney, mulMoney, roundMoney } from '../common/utils/money.util';
import { canDecrementStock } from './utils/stock-decrement';

export interface OrderTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly cartService: CartService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!dto.shippingAddress && !dto.shippingAddressId) {
      throw new BadRequestException('shippingAddress or shippingAddressId is required');
    }

    const shippingAddress: OrderAddress = dto.shippingAddress
      ? {
          fullName: dto.shippingAddress.fullName,
          phone: dto.shippingAddress.phone,
          city: dto.shippingAddress.city,
          street: dto.shippingAddress.street,
          country: dto.shippingAddress.country || 'OM',
          governorate: dto.shippingAddress.governorate || dto.shippingAddress.city,
        }
      : {
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          phone: user.phone || '',
          city: 'Muscat',
          street: `Address ref ${dto.shippingAddressId}`,
          country: 'OM',
        };

    const productIds = dto.items.map((item) => item.productId);
    const paymentMethod = (dto.paymentMethod || 'cod').toLowerCase();
    const isCod = paymentMethod === 'cod' || paymentMethod === 'cash_on_delivery';

    const savedOrderId = await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const orderRepo = manager.getRepository(Order);

      // Lock product rows for update to prevent oversell races
      const products = await productRepo
        .createQueryBuilder('product')
        .setLock('pessimistic_write')
        .where('product.id IN (:...ids)', { ids: productIds })
        .leftJoinAndSelect('product.store', 'store')
        .getMany();

      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products not found');
      }

      const orderItems: Partial<OrderItem>[] = [];
      for (const item of dto.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        const qty = Math.trunc(Number(item.quantity));
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new BadRequestException(`Invalid quantity for product ${product.id}`);
        }

        if (!canDecrementStock(Number(product.stock ?? 0), qty)) {
          throw new BadRequestException(
            `Insufficient inventory for "${product.name}". Available: ${Number(product.stock ?? 0)}, Requested: ${qty}`,
          );
        }

        // Conditional stock decrement — fails if concurrent checkout drained stock
        const dec = await productRepo
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => 'stock - :qty' })
          .where('id = :id AND stock >= :qty')
          .setParameters({ id: product.id, qty })
          .execute();

        if (!dec.affected) {
          const available = Number(product.stock ?? 0);
          throw new BadRequestException(
            `Insufficient inventory for "${product.name}". Available: ${available}, Requested: ${qty}`,
          );
        }

        const unitPrice = roundMoney(Number(product.price));
        orderItems.push({
          productId: product.id,
          storeId: product.storeId || product.store?.id || null,
          productName: product.name,
          productImage: product.images?.[0] || null,
          quantity: qty,
          unitPrice,
          totalPrice: mulMoney(unitPrice, qty),
          variantAttributes: item.variantAttributes || {},
        });
      }

      const totals = this.calculateTotals(
        orderItems as OrderItem[],
        dto.currency || 'OMR',
        dto.shippingMethod,
      );
      let couponCode = dto.couponCode || null;
      if (dto.couponCode) {
        const couponResult = evaluateCoupon(dto.couponCode, totals.subtotal);
        if (!couponResult.valid) {
          throw new BadRequestException('Invalid coupon code');
        }
        totals.discount = roundMoney(couponResult.discountAmount);
        totals.total = roundMoney(Math.max(0, totals.total - totals.discount));
        couponCode = couponResult.code;
      }

      const storeId = products[0]?.storeId || products[0]?.store?.id || null;
      let orderNumber = await this.generateOrderNumber();
      let saved: Order | null = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const order = orderRepo.create({
            orderNumber,
            user,
            userId,
            items: orderItems.map((oi) => manager.getRepository(OrderItem).create(oi)),
            shippingAddress,
            billingAddress: shippingAddress,
            currency: dto.currency || 'OMR',
            subtotal: totals.subtotal,
            tax: totals.tax,
            shipping: totals.shipping,
            discount: totals.discount,
            total: totals.total,
            status: isCod ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod,
            notes: dto.notes || null,
            couponCode,
            storeId,
            store: storeId ? ({ id: storeId } as Store) : null,
            statusHistory: [
              {
                status: isCod ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
                note: isCod
                  ? 'Order placed with cash on delivery'
                  : 'Order created, awaiting payment',
                timestamp: new Date().toISOString(),
              },
            ],
            metadata: {
              shippingMethod: dto.shippingMethod || 'standard',
            },
          });
          saved = await orderRepo.save(order);
          break;
        } catch (err: any) {
          // Unique order_number collision — retry
          if (err?.code === '23505' && attempt < 4) {
            orderNumber = await this.generateOrderNumber();
            continue;
          }
          throw err;
        }
      }

      if (!saved) {
        throw new ConflictException('Could not allocate a unique order number');
      }
      return saved.id;
    });

    try {
      await this.cartService.clearCart(userId);
    } catch {
      // Cart may not exist
    }

    const full = await this.findOne(savedOrderId);

    if (isCod) {
      this.eventEmitter.emit('order.created', { orderId: full.id });
      this.eventEmitter.emit('order.status_changed', {
        orderId: full.id,
        oldStatus: OrderStatus.PENDING,
        newStatus: full.status,
      });
    }

    return full;
  }

  async findAll(
    userId: string,
    filter: { page?: number; limit?: number; status?: OrderStatus; storeId?: string; role?: string },
  ): Promise<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status, storeId, role } = filter;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    const roleNorm = String(role || '').toLowerCase();
    const isStaff = isStaffRole(roleNorm);
    const isSeller = roleNorm === 'seller' || roleNorm === 'vendor';

    if (isStaff) {
      if (storeId) where.storeId = storeId;
    } else if (isSeller) {
      let sellerStoreId = storeId;
      if (sellerStoreId) {
        const owned = await this.storeRepository.findOne({
          where: { id: sellerStoreId, ownerId: userId },
        });
        if (!owned) {
          throw new ForbiddenException('You do not own this store');
        }
      } else {
        const mine = await this.storeRepository.findOne({
          where: { ownerId: userId },
        });
        if (!mine) {
          return { data: [], total: 0, page, limit, totalPages: 0 };
        }
        sellerStoreId = mine.id;
      }
      where.storeId = sellerStoreId;
    } else {
      where.userId = userId;
      if (storeId) where.storeId = storeId;
    }

    if (status) where.status = status;

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['user', 'items', 'items.product', 'store'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product', 'store'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    return order;
  }

  /**
   * Load order and enforce ownership for customers.
   * Admins / super_admins / moderators may access any order.
   */
  async findOneForRequester(
    id: string,
    userId: string,
    role?: string,
  ): Promise<Order> {
    const order = await this.findOne(id);
    this.assertOrderAccess(order, userId, role);
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['user', 'items', 'items.product', 'store'],
    });

    if (!order) {
      throw new NotFoundException(`Order with number "${orderNumber}" not found`);
    }

    return order;
  }

  async findByOrderNumberForRequester(
    orderNumber: string,
    userId: string,
    role?: string,
  ): Promise<Order> {
    const order = await this.findByOrderNumber(orderNumber);
    this.assertOrderAccess(order, userId, role);
    return order;
  }

  async getOrderHistory(
    id: string,
    userId?: string,
    role?: string,
  ): Promise<Array<{ status: string; note?: string; timestamp: string }>> {
    const order =
      userId != null
        ? await this.findOneForRequester(id, userId, role)
        : await this.findOne(id);

    if (order.statusHistory?.length) {
      return order.statusHistory;
    }

    return [
      {
        status: String(order.status),
        timestamp: new Date(
          (order as any).updatedAt || (order as any).createdAt || Date.now(),
        ).toISOString(),
      },
    ];
  }

  assertOrderAccess(order: Order, userId: string, role?: string): void {
    if (isStaffRole(role)) return;
    if (order.userId && order.userId === userId) return;

    const storeOwnerId =
      (order as any).store?.ownerId ||
      (order as any).store?.owner?.id ||
      null;
    if (storeOwnerId && storeOwnerId === userId) return;

    throw new ForbiddenException('You do not have access to this order');
  }

  /** Staff or store owner may manage status — buying customer cannot. */
  assertOrderManageAccess(order: Order, userId: string, role?: string): void {
    if (isStaffRole(role)) return;

    const storeOwnerId =
      (order as any).store?.ownerId ||
      (order as any).store?.owner?.id ||
      null;
    if (storeOwnerId && storeOwnerId === userId) return;

    throw new ForbiddenException(
      'Only store staff or admins can update order status',
    );
  }

  async updateStatusForRequester(
    id: string,
    dtoOrStatus: UpdateOrderStatusDto | OrderStatus | string,
    userId: string,
    role?: string,
    note?: string,
  ): Promise<Order> {
    const order = await this.findOne(id);
    this.assertOrderManageAccess(order, userId, role);
    return this.updateStatus(id, dtoOrStatus, note);
  }

  async updateStatus(
    id: string,
    dtoOrStatus: UpdateOrderStatusDto | OrderStatus | string,
    note?: string,
  ): Promise<Order> {
    const dto: UpdateOrderStatusDto =
      typeof dtoOrStatus === 'string'
        ? { status: dtoOrStatus as OrderStatus, note }
        : dtoOrStatus;

    const order = await this.findOne(id);
    const oldStatus = order.status;
    const validTransitions = this.getValidStatusTransitions(order.status);
    // Allow logistics sync even if transition table is strict
    if (validTransitions.length && !validTransitions.includes(dto.status)) {
      const logisticsSync = [
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED,
        OrderStatus.RETURNED,
      ];
      if (!logisticsSync.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from "${order.status}" to "${dto.status}". Valid transitions: ${validTransitions.join(', ')}`,
        );
      }
    }

    order.status = dto.status;
    if (dto.status === OrderStatus.CONFIRMED || dto.status === OrderStatus.PROCESSING) {
      if (order.paymentMethod !== 'cod' && order.paymentMethod !== 'cash_on_delivery') {
        order.paymentStatus = PaymentStatus.PAID;
      }
    }

    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status: dto.status,
      note: dto.note || `Status changed to ${dto.status}`,
      timestamp: new Date().toISOString(),
    });
    order.statusHistory = statusHistory;

    const saved = await this.orderRepository.save(order);
    this.eventEmitter.emit('order.status_changed', {
      orderId: saved.id,
      oldStatus,
      newStatus: saved.status,
    });
    return saved;
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    return this.applyPaymentWebhook(id, paymentStatus);
  }

  async applyPaymentWebhook(
    id: string,
    paymentStatus: PaymentStatus,
    meta?: { gateway?: string; action?: string; amount?: number },
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo
        .createQueryBuilder('order')
        .setLock('pessimistic_write')
        .where('order.id = :id', { id })
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('order.user', 'user')
        .getOne();

      if (!order) {
        throw new NotFoundException(`Order ${id} not found`);
      }

      // Idempotent: already paid → no duplicate history/events side effects here
      if (
        paymentStatus === PaymentStatus.PAID &&
        order.paymentStatus === PaymentStatus.PAID
      ) {
        return order;
      }

      order.paymentStatus = paymentStatus;
      if (paymentStatus === PaymentStatus.PAID && order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.CONFIRMED;
      }
      if (paymentStatus === PaymentStatus.REFUNDED) {
        order.status = OrderStatus.REFUNDED;
      }

      const statusHistory = order.statusHistory || [];
      statusHistory.push({
        status: order.status,
        note: `Payment status: ${paymentStatus}${meta?.gateway ? ` via ${meta.gateway}` : ''}${meta?.action ? ` (${meta.action})` : ''}`,
        timestamp: new Date().toISOString(),
      });
      order.statusHistory = statusHistory;
      order.metadata = {
        ...(order.metadata || {}),
        lastPaymentWebhook: meta || null,
        lastPaymentStatusAt: new Date().toISOString(),
      };

      return orderRepo.save(order);
    });
  }

  async updateTracking(id: string, trackingNumber: string): Promise<Order> {
    const order = await this.findOne(id);
    order.trackingNumber = trackingNumber;
    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.PROCESSING;
    }
    order.statusHistory = [
      ...(order.statusHistory || []),
      {
        status: order.status,
        note: `Tracking assigned: ${trackingNumber}`,
        timestamp: new Date().toISOString(),
      },
    ];
    order.metadata = {
      ...(order.metadata || {}),
      shipmentQueued: true,
    };
    return this.orderRepository.save(order);
  }

  async cancel(id: string, userId: string, reason?: string): Promise<Order> {
    const result = await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const productRepo = manager.getRepository(Product);

      const order = await orderRepo
        .createQueryBuilder('order')
        .setLock('pessimistic_write')
        .where('order.id = :id', { id })
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('order.user', 'user')
        .getOne();

      if (!order) {
        throw new NotFoundException(`Order ${id} not found`);
      }

      if (order.userId !== userId && order.user?.id !== userId) {
        throw new ForbiddenException('You can only cancel your own orders');
      }

      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
        throw new BadRequestException('Only pending or confirmed orders can be cancelled');
      }

      for (const item of order.items || []) {
        if (!item.productId) continue;
        const qty = Math.trunc(Number(item.quantity));
        if (!Number.isFinite(qty) || qty <= 0) continue;
        await productRepo
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => 'stock + :qty' })
          .where('id = :id')
          .setParameters({ id: item.productId, qty })
          .execute();
      }

      const oldStatus = order.status;
      order.status = OrderStatus.CANCELLED;
      order.statusHistory = [
        ...(order.statusHistory || []),
        {
          status: OrderStatus.CANCELLED,
          note: reason || 'Cancelled by customer',
          timestamp: new Date().toISOString(),
        },
      ];

      const saved = await orderRepo.save(order);
      return { saved, oldStatus };
    });

    this.eventEmitter.emit('order.cancelled', {
      orderId: result.saved.id,
      reason: reason || 'Cancelled by customer',
    });
    this.eventEmitter.emit('order.status_changed', {
      orderId: result.saved.id,
      oldStatus: result.oldStatus,
      newStatus: OrderStatus.CANCELLED,
    });
    return result.saved;
  }

  private calculateTotals(
    items: Array<Pick<OrderItem, 'totalPrice'>>,
    currency: string,
    shippingMethod?: string,
  ): OrderTotals {
    const subtotal = roundMoney(
      items.reduce((sum, item) => addMoney(sum, Number(item.totalPrice)), 0),
    );
    const tax = roundMoney(subtotal * 0.05);
    const shipping = this.estimateShippingAmount(shippingMethod, subtotal);

    return {
      subtotal,
      tax,
      shipping,
      discount: 0,
      total: addMoney(subtotal, tax, shipping),
      currency,
    };
  }

  /**
   * Validate a coupon code (whitelist only — no open WELCOME* parsing).
   */
  async validateCoupon(
    code: string,
    _userId?: string,
    subtotal = 100,
  ): Promise<{ valid: boolean; discountAmount: number; code?: string }> {
    return evaluateCoupon(code, subtotal);
  }

  private estimateShippingAmount(shippingMethod: string | undefined, subtotal: number): number {
    const code = (shippingMethod || 'standard').toLowerCase().replace(/-/g, '_');
    if (code === 'standard' && subtotal >= 10) return 0;
    if (code === 'express') return roundMoney(3);
    if (code === 'same_day' || code === 'sameday') return roundMoney(5);
    if (code.includes('local')) return roundMoney(1.5);
    if (code.includes('aramex')) return roundMoney(3.5);
    if (code === 'dhl' || code === 'dhl_oman' || code === 'fedex' || code === 'ups') {
      return roundMoney(5);
    }
    if (code === 'oman_post') return roundMoney(2);
    // Legacy / unknown carrier codes
    if (code === 'standard') return roundMoney(1.5);
    return roundMoney(2);
  }

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `BHD-${y}${m}${d}-${rand}`;
  }

  private getValidStatusTransitions(current: OrderStatus | string): OrderStatus[] {
    const map: Record<string, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED, OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
      [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
    };
    return map[current] || [];
  }
}
