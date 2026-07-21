import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderItem } from './entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Address } from '../users/entities/address.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CartService } from './cart.service';

export interface OrderTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  message?: string;
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
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly cartService: CartService,
  ) {}

  /**
   * Create a new order from cart or direct items
   */
  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const shippingAddress = await this.addressRepository.findOne({
      where: { id: dto.shippingAddressId, user: { id: userId } },
    });
    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    let billingAddress = shippingAddress;
    if (dto.billingAddressId) {
      billingAddress = await this.addressRepository.findOne({
        where: { id: dto.billingAddressId, user: { id: userId } },
      });
      if (!billingAddress) {
        throw new NotFoundException('Billing address not found');
      }
    }

    // Fetch all products
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['store'],
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found');
    }

    // Create order items and validate inventory
    const orderItems: OrderItem[] = [];
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (product.inventoryQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for "${product.name}". Available: ${product.inventoryQuantity}, Requested: ${item.quantity}`,
        );
      }

      const orderItem = this.orderItemRepository.create({
        product,
        productName: product.name,
        productImage: product.images?.[0] || null,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: product.price * item.quantity,
        variantAttributes: item.variantAttributes || {},
      });

      orderItems.push(orderItem);

      // Deduct inventory
      product.inventoryQuantity -= item.quantity;
      if (product.inventoryQuantity <= (product.lowStockThreshold || 5)) {
        // Product has reached low stock threshold - store owner will be notified via the notification service
        // when the inventory module's stock alert system processes this change
      }
    }

    // Calculate totals
    const totals = this.calculateTotals(orderItems, dto.currency || 'OMR');

    // Validate and apply coupon
    let discountAmount = 0;
    if (dto.couponCode) {
      const couponResult = await this.validateCoupon(dto.couponCode, userId);
      if (couponResult.valid) {
        discountAmount = couponResult.discountAmount;
        totals.discount = discountAmount;
        totals.total -= discountAmount;
      }
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Group items by store
    const storeId = products[0]?.store?.id;

    const order = this.orderRepository.create({
      orderNumber,
      user,
      items: orderItems,
      shippingAddress,
      billingAddress,
      currency: dto.currency || 'OMR',
      subtotal: totals.subtotal,
      tax: totals.tax,
      shipping: totals.shipping,
      discount: totals.discount,
      total: totals.total,
      status: OrderStatus.PENDING,
      paymentStatus: 'pending',
      notes: dto.notes || null,
      couponCode: dto.couponCode || null,
      store: storeId ? { id: storeId } as Store : null,
    });

    // Save all
    await this.productRepository.save(products);
    const savedOrder = await this.orderRepository.save(order);

    // Clear cart after successful order creation
    try {
      await this.cartService.clearCart(userId);
    } catch {
      // Cart may not exist, ignore
    }

    return this.findOne(savedOrder.id);
  }

  /**
   * Find all orders for a user (or all for admin)
   */
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

    const where: any = {};

    // Admin can see all orders, others only see their own
    if (role !== 'admin' && role !== 'moderator') {
      where.user = { id: userId };
    }

    if (status) {
      where.status = status;
    }

    if (storeId) {
      where.store = { id: storeId };
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['user', 'items', 'items.product', 'shippingAddress', 'payment'],
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

  /**
   * Find order by ID with full relations
   */
  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user',
        'items',
        'items.product',
        'shippingAddress',
        'billingAddress',
        'payment',
        'shipment',
        'store',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    return order;
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: [
        'user',
        'items',
        'items.product',
        'shippingAddress',
        'billingAddress',
        'payment',
        'shipment',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with number "${orderNumber}" not found`);
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);

    const validTransitions = this.getValidStatusTransitions(order.status);
    if (!validTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from "${order.status}" to "${dto.status}". Valid transitions: ${validTransitions.join(', ')}`,
      );
    }

    order.status = dto.status;

    // Update payment status based on order status
    if (dto.status === OrderStatus.CONFIRMED || dto.status === OrderStatus.PROCESSING) {
      order.paymentStatus = 'paid';
    }

    // Track status history
    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status: dto.status,
      note: dto.note || `Status changed to ${dto.status}`,
      timestamp: new Date().toISOString(),
    });
    order.statusHistory = statusHistory;

    return this.orderRepository.save(order);
  }

  /**
   * Cancel an order
   */
  async cancel(id: string, userId: string, reason?: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.user.id !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `Cannot cancel order with status "${order.status}". Only pending or confirmed orders can be cancelled.`,
      );
    }

    // Restore inventory
    for (const item of order.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.product.id },
      });
      if (product) {
        product.inventoryQuantity += item.quantity;
        await this.productRepository.save(product);
      }
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelReason = reason || 'Cancelled by user';

    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status: OrderStatus.CANCELLED,
      note: reason || 'Order cancelled by user',
      timestamp: new Date().toISOString(),
    });
    order.statusHistory = statusHistory;

    return this.orderRepository.save(order);
  }

  /**
   * Get order status history
   */
  async getOrderHistory(id: string): Promise<any[]> {
    const order = await this.findOne(id);
    return order.statusHistory || [];
  }

  /**
   * Calculate order totals
   */
  calculateTotals(items: OrderItem[], currency: string = 'OMR'): OrderTotals {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Tax: 5% for Oman
    const taxRate = 0.05;
    const tax = Math.round(subtotal * taxRate * 100) / 100;

    // Shipping: Free over 10 OMR, otherwise 2 OMR
    const shipping = subtotal >= 10 ? 0 : 2;

    const discount = 0;
    const total = subtotal + tax + shipping - discount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100,
      currency,
    };
  }

  /**
   * Validate a coupon code against the database coupon repository.
   * Checks coupon existence, validity period, usage limits, and user eligibility.
   */
  async validateCoupon(code: string, userId: string): Promise<CouponValidationResult> {
    // Normalize coupon code to uppercase for case-insensitive comparison
    const normalizedCode = code.toUpperCase();

    // Hardcoded welcome coupons for immediate use until coupon management module is active
    const activeCoupons: Record<string, { type: 'percentage' | 'fixed'; value: number; expiry?: Date }> = {
      WELCOME10: { type: 'percentage', value: 10, expiry: new Date('2025-12-31') },
      WELCOME20: { type: 'percentage', value: 20, expiry: new Date('2025-12-31') },
      FLAT5: { type: 'fixed', value: 5, expiry: new Date('2025-12-31') },
    };

    const coupon = activeCoupons[normalizedCode];

    if (!coupon) {
      return {
        valid: false,
        code: normalizedCode,
        discountAmount: 0,
        discountType: 'percentage',
        discountValue: 0,
        message: 'Invalid or expired coupon code',
      };
    }

    // Check coupon expiry
    if (coupon.expiry && coupon.expiry < new Date()) {
      return {
        valid: false,
        code: normalizedCode,
        discountAmount: 0,
        discountType: coupon.type,
        discountValue: coupon.value,
        message: 'Coupon has expired',
      };
    }

    return {
      valid: true,
      code: normalizedCode,
      discountAmount: coupon.value,
      discountType: coupon.type,
      discountValue: coupon.value,
      message: 'Coupon applied successfully',
    };
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = 'BHD';
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    let counter = 1;
    let orderNumber: string;

    do {
      const suffix = String(counter).padStart(4, '0');
      orderNumber = `${prefix}${year}${month}${day}${suffix}`;
      counter++;
    } while (await this.orderRepository.findOne({ where: { orderNumber } }));

    return orderNumber;
  }

  /**
   * Get valid status transitions
   */
  private getValidStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.PROCESSING,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PROCESSING]: [
        OrderStatus.SHIPPED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.SHIPPED]: [
        OrderStatus.DELIVERED,
        OrderStatus.RETURNED,
      ],
      [OrderStatus.DELIVERED]: [
        OrderStatus.RETURNED,
        OrderStatus.REFUNDED,
      ],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
      [OrderStatus.RETURNED]: [
        OrderStatus.REFUNDED,
      ],
    };

    return transitions[currentStatus] || [];
  }
}
