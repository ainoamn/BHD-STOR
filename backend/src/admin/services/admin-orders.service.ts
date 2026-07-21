import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export interface OrderQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findAll(query: OrderQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.orderNumber = Like(`%${query.search}%`);
    }

    if (query.dateFrom && query.dateTo) {
      where.createdAt = Between(new Date(query.dateFrom), new Date(query.dateTo));
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      order: { [query.sortBy || 'createdAt']: query.sortOrder || 'DESC' },
      skip,
      take: limit,
      relations: ['user', 'store', 'items', 'payment'],
    });

    return {
      success: true,
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'store', 'items', 'items.product', 'payment', 'shipping'],
    });

    if (!order) {
      throw new NotFoundException({
        success: false,
        message: `Order with ID ${id} not found`,
      });
    }

    return {
      success: true,
      data: order,
    };
  }

  async updateStatus(id: string, status: string) {
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException({
        success: false,
        message: `Order with ID ${id} not found`,
      });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new NotFoundException({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    await this.orderRepository.update(id, { status });

    return {
      success: true,
      message: `Order status updated to ${status}`,
      data: { id, status },
    };
  }

  async getStats() {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      refundedOrders,
    ] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository.count({ where: { status: 'pending' } }),
      this.orderRepository.count({ where: { status: 'processing' } }),
      this.orderRepository.count({ where: { status: 'shipped' } }),
      this.orderRepository.count({ where: { status: 'delivered' } }),
      this.orderRepository.count({ where: { status: 'cancelled' } }),
      this.orderRepository.count({ where: { status: 'refunded' } }),
    ]);

    // Orders this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const ordersThisMonth = await this.orderRepository.count({
      where: { createdAt: monthStart },
    });

    // Revenue
    const revenueData = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.status IN (:...statuses)', {
        statuses: ['delivered', 'shipped'],
      })
      .getRawOne();

    return {
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        refundedOrders,
        ordersThisMonth,
        totalRevenue: Number(revenueData?.total || 0),
      },
    };
  }

  async getRecentOrders(limit: number = 10) {
    const orders = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user', 'store'],
    });

    return {
      success: true,
      data: orders,
    };
  }
}
