import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Payment, PaymentStatus } from '../../payments/entities/payment.entity';
import { Payout, PayoutStatus } from '../../payments/entities/payout.entity';
import {
  Order,
  OrderStatus,
  PaymentStatus as OrderPaymentStatus,
} from '../../orders/entities/order.entity';
import { PaymentsService } from '../../payments/services/payments.service';

export interface PaymentQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class AdminPaymentsService {
  private readonly logger = new Logger(AdminPaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async listGateways() {
    const data = await this.paymentsService.listAllGatewaysForAdmin();
    return { success: true, data };
  }

  async setGatewayActive(idOrCode: string, isActive: boolean) {
    const data = await this.paymentsService.setGatewayActive(idOrCode, isActive);
    return {
      success: true,
      message: `Gateway ${data.code} ${isActive ? 'enabled' : 'disabled'}`,
      data,
    };
  }

  async findAll(query: PaymentQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.method) {
      where.paymentMethod = query.method;
    }

    if (query.search) {
      where.transactionId = Like(`%${query.search}%`);
    }

    if (query.dateFrom && query.dateTo) {
      where.createdAt = Between(new Date(query.dateFrom), new Date(query.dateTo));
    }

    const [payments, total] = await this.paymentRepository.findAndCount({
      where,
      order: { [query.sortBy || 'createdAt']: query.sortOrder || 'DESC' },
      skip,
      take: limit,
      relations: ['order', 'user'],
    });

    return {
      success: true,
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats() {
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
    ] = await Promise.all([
      this.paymentRepository.count(),
      this.paymentRepository.count({ where: { status: PaymentStatus.COMPLETED } }),
      this.paymentRepository.count({ where: { status: PaymentStatus.PENDING } }),
      this.paymentRepository.count({ where: { status: PaymentStatus.FAILED } }),
      this.paymentRepository.count({ where: { status: PaymentStatus.REFUNDED } }),
    ]);

    // Revenue totals
    const revenueData = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();

    const totalRevenue = Number(revenueData?.total || 0);

    // Refund total
    const refundData = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.REFUNDED })
      .getRawOne();

    const totalRefunded = Number(refundData?.total || 0);

    // Revenue today
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayRevenueData = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('payment.createdAt >= :start', { start: todayStart })
      .getRawOne();

    return {
      success: true,
      data: {
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        refundedPayments,
        totalRevenue,
        totalRefunded,
        todayRevenue: Number(todayRevenueData?.total || 0),
      },
    };
  }

  async processRefund(paymentId: string, amount: number) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException({
        success: false,
        message: `Payment with ID ${paymentId} not found`,
      });
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new NotFoundException({
        success: false,
        message: 'Only completed payments can be refunded',
      });
    }

    const paymentAmount = Number(payment.amount);
    if (amount > paymentAmount) {
      throw new NotFoundException({
        success: false,
        message: `Refund amount cannot exceed payment amount of ${paymentAmount}`,
      });
    }

    const fullyRefunded = amount >= paymentAmount;

    // Update payment status (PaymentStatus has no partially_refunded; keep COMPLETED on partial)
    await this.paymentRepository.update(paymentId, {
      status: fullyRefunded ? PaymentStatus.REFUNDED : PaymentStatus.COMPLETED,
      refundAmount: amount,
    });

    // Update order payment/order status
    if (payment.order) {
      await this.orderRepository.update(payment.order.id, {
        ...(fullyRefunded ? { status: OrderStatus.REFUNDED } : {}),
        paymentStatus: fullyRefunded
          ? OrderPaymentStatus.REFUNDED
          : OrderPaymentStatus.PARTIALLY_REFUNDED,
      });
    }

    return {
      success: true,
      message: `Refund of ${amount} processed successfully`,
      data: {
        paymentId,
        refundAmount: amount,
        status: fullyRefunded
          ? OrderPaymentStatus.REFUNDED
          : OrderPaymentStatus.PARTIALLY_REFUNDED,
      },
    };
  }

  async getPayouts(storeId?: string) {
    const where: any = {};
    if (storeId) {
      where.storeId = storeId;
    }

    const payouts = await this.payoutRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['store'],
    });

    return {
      success: true,
      data: payouts,
    };
  }

  async processPayout(storeId: string) {
    // Calculate pending earnings for store
    const pendingPayout = await this.payoutRepository.findOne({
      where: { storeId, status: PayoutStatus.PENDING },
    });

    if (!pendingPayout) {
      throw new NotFoundException({
        success: false,
        message: `No pending payout found for store ${storeId}`,
      });
    }

    await this.payoutRepository.update(pendingPayout.id, {
      status: PayoutStatus.PROCESSING,
      processedAt: new Date(),
    });

    return {
      success: true,
      message: 'Payout processed successfully',
      data: {
        payoutId: pendingPayout.id,
        storeId,
        status: PayoutStatus.PROCESSING,
      },
    };
  }
}
