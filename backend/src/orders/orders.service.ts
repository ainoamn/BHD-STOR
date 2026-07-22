import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order, OrderAddress, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CartService } from './cart.service';

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
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['store'],
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found');
    }

    const orderItems: OrderItem[] = [];
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      const available = Number(product.stock ?? 0);
      if (available < item.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for "${product.name}". Available: ${available}, Requested: ${item.quantity}`,
        );
      }

      const unitPrice = Number(product.price);
      const orderItem = this.orderItemRepository.create({
        product,
        productId: product.id,
        storeId: product.storeId || product.store?.id || null,
        productName: product.name,
        productImage: product.images?.[0] || null,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        variantAttributes: item.variantAttributes || {},
      });

      orderItems.push(orderItem);
      product.stock = available - item.quantity;
    }

    const totals = this.calculateTotals(orderItems, dto.currency || 'OMR', dto.shippingMethod);
    let discountAmount = 0;
    if (dto.couponCode) {
      const couponResult = this.validateCoupon(dto.couponCode, totals.subtotal);
      if (couponResult.valid) {
        discountAmount = couponResult.discountAmount;
        totals.discount = discountAmount;
        totals.total = Math.max(0, totals.total - discountAmount);
      }
    }

    const orderNumber = await this.generateOrderNumber();
    const storeId = products[0]?.storeId || products[0]?.store?.id || null;
    const paymentMethod = (dto.paymentMethod || 'cod').toLowerCase();
    const isCod = paymentMethod === 'cod' || paymentMethod === 'cash_on_delivery';

    const order = this.orderRepository.create({
      orderNumber,
      user,
      userId,
      items: orderItems,
      shippingAddress,
      billingAddress: shippingAddress,
      currency: dto.currency || 'OMR',
      subtotal: totals.subtotal,
      tax: totals.tax,
      shipping: totals.shipping,
      discount: totals.discount,
      total: totals.total,
      status: isCod ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
      paymentStatus: isCod ? PaymentStatus.PENDING : PaymentStatus.PENDING,
      paymentMethod,
      notes: dto.notes || null,
      couponCode: dto.couponCode || null,
      storeId,
      store: storeId ? ({ id: storeId } as Store) : null,
      statusHistory: [
        {
          status: isCod ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
          note: isCod ? 'Order placed with cash on delivery' : 'Order created, awaiting payment',
          timestamp: new Date().toISOString(),
        },
      ],
      metadata: {
        shippingMethod: dto.shippingMethod || 'standard',
      },
    });

    await this.productRepository.save(products);
    const savedOrder = await this.orderRepository.save(order);

    try {
      await this.cartService.clearCart(userId);
    } catch {
      // Cart may not exist
    }

    const full = await this.findOne(savedOrder.id);

    // COD / confirmed orders can queue logistics immediately
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

    if (role !== 'admin' && role !== 'super_admin' && role !== 'moderator') {
      where.userId = userId;
    }
    if (status) where.status = status;
    if (storeId) where.storeId = storeId;

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
      totalPages: Math.ceil(total / limit),
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
    meta?: { gateway?: string; action?: string },
  ): Promise<Order> {
    const order = await this.findOne(id);
    order.paymentStatus = paymentStatus;
    if (paymentStatus === PaymentStatus.PAID && order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.CONFIRMED;
    }
    if (paymentStatus === PaymentStatus.FAILED && order.status === OrderStatus.PENDING) {
      // keep pending so customer can retry
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

    return this.orderRepository.save(order);
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
    const order = await this.findOne(id);

    if (order.userId !== userId && order.user?.id !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Only pending or confirmed orders can be cancelled');
    }

    for (const item of order.items || []) {
      if (!item.productId) continue;
      const product = await this.productRepository.findOne({ where: { id: item.productId } });
      if (product) {
        product.stock = Number(product.stock || 0) + item.quantity;
        await this.productRepository.save(product);
      }
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

    const saved = await this.orderRepository.save(order);
    this.eventEmitter.emit('order.cancelled', {
      orderId: saved.id,
      reason: reason || 'Cancelled by customer',
    });
    this.eventEmitter.emit('order.status_changed', {
      orderId: saved.id,
      oldStatus,
      newStatus: OrderStatus.CANCELLED,
    });
    return saved;
  }

  private calculateTotals(
    items: OrderItem[],
    currency: string,
    shippingMethod?: string,
  ): OrderTotals {
    const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const tax = Math.round(subtotal * 0.05 * 1000) / 1000;
    const shipping = this.estimateShippingAmount(shippingMethod, subtotal);

    return {
      subtotal: Math.round(subtotal * 1000) / 1000,
      tax,
      shipping,
      discount: 0,
      total: Math.round((subtotal + tax + shipping) * 1000) / 1000,
      currency,
    };
  }

  private estimateShippingAmount(shippingMethod: string | undefined, subtotal: number): number {
    const code = (shippingMethod || 'standard').toLowerCase().replace(/-/g, '_');
    if (code === 'standard' && subtotal >= 10) return 0;
    if (code === 'express') return 3;
    if (code === 'same_day' || code === 'sameday') return 5;
    if (code.includes('local')) return 1.5;
    if (code.includes('aramex')) return 3.5;
    if (code === 'dhl' || code === 'dhl_oman' || code === 'fedex' || code === 'ups') {
      return 5;
    }
    if (code === 'oman_post') return 2;
    // Legacy / unknown carrier codes
    if (code === 'standard') return 1.5;
    return 2;
  }

  private validateCoupon(code: string, subtotal: number): {
    valid: boolean;
    discountAmount: number;
  } {
    const normalized = code.toUpperCase();
    if (normalized === 'FLAT5') return { valid: true, discountAmount: Math.min(5, subtotal) };
    if (normalized.startsWith('WELCOME')) {
      const percent = parseInt(normalized.replace(/\D/g, ''), 10) || 10;
      return {
        valid: true,
        discountAmount: Math.round(((subtotal * percent) / 100) * 1000) / 1000,
      };
    }
    return { valid: false, discountAmount: 0 };
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
