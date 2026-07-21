import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import { User } from '../users/entities/user.entity';

export interface StoreAnalytics {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  totalVisitors: number;
  conversionRate: number;
  ordersByStatus: Record<string, number>;
  revenueGrowth: number;
  orderGrowth: number;
}

export interface ProductAnalytics {
  period: string;
  productId: string;
  productName: string;
  views: number;
  sales: number;
  revenue: number;
  conversionRate: number;
  averageRating: number;
  stockLevel: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface SalesReport {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  ordersByDay: ChartDataPoint[];
  revenueByDay: ChartDataPoint[];
}

export interface PlatformAnalytics {
  totalUsers: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeStores: number;
  pendingStores: number;
  newUsersThisMonth: number;
  newStoresThisMonth: number;
  newOrdersThisMonth: number;
  revenueThisMonth: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get store analytics for a period
   */
  async getStoreAnalytics(
    storeId: string,
    period: string = '30d',
  ): Promise<StoreAnalytics> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException(`Store with ID "${storeId}" not found`);
    }

    const { startDate, endDate } = this.parsePeriod(period);

    const orders = await this.orderRepository.find({
      where: {
        store: { id: storeId },
        createdAt: Between(startDate, endDate),
      },
      relations: ['items'],
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;

    // Previous period for growth calculation
    const prevPeriod = this.getPreviousPeriod(startDate, endDate);
    const prevOrders = await this.orderRepository.find({
      where: {
        store: { id: storeId },
        createdAt: Between(prevPeriod.startDate, prevPeriod.endDate),
      },
    });
    const prevRevenue = prevOrders.reduce((sum, o) => sum + o.total, 0);

    const ordersByStatus: Record<string, number> = {};
    Object.values(OrderStatus).forEach((status) => {
      ordersByStatus[status] = orders.filter((o) => o.status === status).length;
    });

    const productCount = await this.productRepository.count({
      where: { store: { id: storeId } },
    });

    const revenueGrowth = prevRevenue > 0
      ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
      : 0;
    const orderGrowth = prevOrders.length > 0
      ? Math.round(((totalOrders - prevOrders.length) / prevOrders.length) * 100)
      : 0;

    return {
      period,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      totalProducts: productCount,
      averageOrderValue: totalOrders > 0
        ? Math.round((totalRevenue / totalOrders) * 100) / 100
        : 0,
      totalVisitors: store.viewCount || 0,
      conversionRate: 0, // Would need visitor tracking
      ordersByStatus,
      revenueGrowth,
      orderGrowth,
    };
  }

  /**
   * Get product analytics for a period
   */
  async getProductAnalytics(
    productId: string,
    period: string = '30d',
  ): Promise<ProductAnalytics> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const { startDate, endDate } = this.parsePeriod(period);

    // Get orders containing this product
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .where('product.id = :productId', { productId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    let totalSales = 0;
    let totalRevenue = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.product.id === productId) {
          totalSales += item.quantity;
          totalRevenue += item.totalPrice;
        }
      });
    });

    return {
      period,
      productId,
      productName: product.name,
      views: product.viewCount || 0,
      sales: totalSales,
      revenue: Math.round(totalRevenue * 100) / 100,
      conversionRate: product.viewCount > 0
        ? Math.round((totalSales / product.viewCount) * 10000) / 100
        : 0,
      averageRating: product.rating || 0,
      stockLevel: product.inventoryQuantity,
    };
  }

  /**
   * Get detailed sales report for a store
   */
  async getSalesReport(
    storeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SalesReport> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException(`Store with ID "${storeId}" not found`);
    }

    const orders = await this.orderRepository.find({
      where: {
        store: { id: storeId },
        createdAt: Between(startDate, endDate),
      },
      relations: ['items', 'items.product'],
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce(
      (sum, o) => sum + o.items.reduce((is, i) => is + i.quantity, 0),
      0,
    );

    // Aggregate top products
    const productMap = new Map<
      string,
      { productName: string; quantity: number; revenue: number }
    >();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = productMap.get(item.product.id);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.totalPrice;
        } else {
          productMap.set(item.product.id, {
            productName: item.productName,
            quantity: item.quantity,
            revenue: item.totalPrice,
          });
        }
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        ...data,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily breakdown
    const dailyMap = new Map<string, { orders: number; revenue: number }>();
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(date);
      if (existing) {
        existing.orders += 1;
        existing.revenue += order.total;
      } else {
        dailyMap.set(date, { orders: 1, revenue: order.total });
      }
    });

    const sortedDates = Array.from(dailyMap.keys()).sort();
    const ordersByDay: ChartDataPoint[] = sortedDates.map((date) => ({
      date,
      value: dailyMap.get(date)?.orders || 0,
    }));
    const revenueByDay: ChartDataPoint[] = sortedDates.map((date) => ({
      date,
      value: Math.round((dailyMap.get(date)?.revenue || 0) * 100) / 100,
    }));

    return {
      startDate,
      endDate,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      totalItems,
      averageOrderValue: totalOrders > 0
        ? Math.round((totalRevenue / totalOrders) * 100) / 100
        : 0,
      topProducts,
      ordersByDay,
      revenueByDay,
    };
  }

  /**
   * Get top selling products for a store
   */
  async getTopProducts(
    storeId: string,
    limit: number = 10,
  ): Promise<
    Array<{
      productId: string;
      productName: string;
      image: string;
      totalSales: number;
      totalRevenue: number;
      averageRating: number;
    }>
  > {
    const products = await this.productRepository.find({
      where: { store: { id: storeId } },
      order: { salesCount: 'DESC' },
      take: limit,
    });

    return products.map((p) => ({
      productId: p.id,
      productName: p.name,
      image: p.images?.[0] || '',
      totalSales: p.salesCount || 0,
      totalRevenue: Math.round((p.price * (p.salesCount || 0)) * 100) / 100,
      averageRating: p.rating || 0,
    }));
  }

  /**
   * Get top customers for a store
   */
  async getTopCustomers(
    storeId: string,
    limit: number = 10,
  ): Promise<
    Array<{
      userId: string;
      name: string;
      email: string;
      totalOrders: number;
      totalSpent: number;
    }>
  > {
    const orders = await this.orderRepository.find({
      where: { store: { id: storeId } },
      relations: ['user'],
    });

    const customerMap = new Map<
      string,
      { name: string; email: string; totalOrders: number; totalSpent: number }
    >();

    orders.forEach((order) => {
      const userId = order.user.id;
      const existing = customerMap.get(userId);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += order.total;
      } else {
        customerMap.set(userId, {
          name: order.user.name || 'Unknown',
          email: order.user.email,
          totalOrders: 1,
          totalSpent: order.total,
        });
      }
    });

    return Array.from(customerMap.entries())
      .map(([userId, data]) => ({
        userId,
        ...data,
        totalSpent: Math.round(data.totalSpent * 100) / 100,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  /**
   * Get revenue chart data
   */
  async getRevenueChart(
    storeId: string,
    period: string = '30d',
  ): Promise<ChartDataPoint[]> {
    const { startDate, endDate } = this.parsePeriod(period);

    const orders = await this.orderRepository.find({
      where: {
        store: { id: storeId },
        createdAt: Between(startDate, endDate),
      },
    });

    const dailyMap = new Map<string, number>();
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + order.total);
    });

    // Fill in missing dates
    const result: ChartDataPoint[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        value: Math.round((dailyMap.get(dateStr) || 0) * 100) / 100,
      });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  /**
   * Get order chart data
   */
  async getOrderChart(
    storeId: string,
    period: string = '30d',
  ): Promise<ChartDataPoint[]> {
    const { startDate, endDate } = this.parsePeriod(period);

    const orders = await this.orderRepository.find({
      where: {
        store: { id: storeId },
        createdAt: Between(startDate, endDate),
      },
    });

    const dailyMap = new Map<string, number>();
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    const result: ChartDataPoint[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        value: dailyMap.get(dateStr) || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  /**
   * Get platform-wide analytics (admin only)
   */
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalUsers = await this.userRepository.count();
    const totalStores = await this.storeRepository.count();
    const totalProducts = await this.productRepository.count();
    const totalOrders = await this.orderRepository.count();

    const allOrders = await this.orderRepository.find();
    const totalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);

    const activeStores = await this.storeRepository.count({
      where: { status: 'active' },
    });
    const pendingStores = await this.storeRepository.count({
      where: { status: 'pending' },
    });

    const newUsersThisMonth = await this.userRepository.count({
      where: { createdAt: Between(startOfMonth, now) },
    });
    const newStoresThisMonth = await this.storeRepository.count({
      where: { createdAt: Between(startOfMonth, now) },
    });
    const newOrdersThisMonth = await this.orderRepository.count({
      where: { createdAt: Between(startOfMonth, now) },
    });

    const monthOrders = await this.orderRepository.find({
      where: { createdAt: Between(startOfMonth, now) },
    });
    const revenueThisMonth = monthOrders.reduce((sum, o) => sum + o.total, 0);

    return {
      totalUsers,
      totalStores,
      totalProducts,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeStores,
      pendingStores,
      newUsersThisMonth,
      newStoresThisMonth,
      newOrdersThisMonth,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
    };
  }

  /**
   * Parse period string to date range
   */
  private parsePeriod(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    const match = period.match(/(\d+)([dwm])/);
    if (match) {
      const [, amount, unit] = match;
      const num = parseInt(amount, 10);
      switch (unit) {
        case 'd':
          startDate.setDate(startDate.getDate() - num);
          break;
        case 'w':
          startDate.setDate(startDate.getDate() - num * 7);
          break;
        case 'm':
          startDate.setMonth(startDate.getMonth() - num);
          break;
      }
    } else {
      // Default to 30 days
      startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  /**
   * Get previous period date range
   */
  private getPreviousPeriod(
    startDate: Date,
    endDate: Date,
  ): { startDate: Date; endDate: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      startDate: new Date(startDate.getTime() - duration),
      endDate: new Date(startDate.getTime()),
    };
  }
}
