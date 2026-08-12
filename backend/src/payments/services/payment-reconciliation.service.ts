import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, In, Repository } from 'typeorm';
import { Payment, PaymentStatus as DbPaymentStatus } from '../entities/payment.entity';
import {
  PaymentAttempt,
  PaymentAttemptStatus,
} from '../entities/payment-attempt.entity';
import { Order, PaymentStatus as OrderPaymentStatus } from '../../orders/entities/order.entity';

export interface ReconciliationReport {
  ranAt: string;
  staleAttemptsMarkedFailed: number;
  stalePaymentsFlagged: number;
  orderPaymentMismatches: number;
  details: string[];
}

/**
 * Periodic payment reconciliation (audit P2-02 foundation).
 * Marks abandoned attempts failed and logs order/payment status drift.
 * Does not auto-capture or refund live gateways.
 */
@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);
  private readonly enabled: boolean;
  private readonly staleMinutes: number;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentAttempt)
    private readonly attemptRepository: Repository<PaymentAttempt>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {
    this.enabled =
      String(this.configService.get('PAYMENT_RECONCILIATION_ENABLED', 'true')).toLowerCase() !==
      'false';
    this.staleMinutes = Number(
      this.configService.get('PAYMENT_RECONCILIATION_STALE_MINUTES', 60),
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledReconcile(): Promise<void> {
    if (!this.enabled) return;
    try {
      const report = await this.reconcile();
      this.logger.log(
        `Payment reconciliation: staleAttempts=${report.staleAttemptsMarkedFailed} ` +
          `stalePayments=${report.stalePaymentsFlagged} mismatches=${report.orderPaymentMismatches}`,
      );
    } catch (err: any) {
      this.logger.error(`Payment reconciliation failed: ${err?.message}`, err?.stack);
    }
  }

  async reconcile(): Promise<ReconciliationReport> {
    const details: string[] = [];
    const cutoff = new Date(Date.now() - Math.max(5, this.staleMinutes) * 60_000);

    // 1) Stale open attempts → failed (customer abandoned checkout)
    const staleAttempts = await this.attemptRepository.find({
      where: {
        status: In([
          PaymentAttemptStatus.PENDING,
          PaymentAttemptStatus.PROCESSING,
          PaymentAttemptStatus.REQUIRES_ACTION,
        ]),
        updatedAt: LessThan(cutoff),
      },
      take: 200,
    });

    let staleAttemptsMarkedFailed = 0;
    for (const attempt of staleAttempts) {
      attempt.status = PaymentAttemptStatus.FAILED;
      attempt.lastError = attempt.lastError || 'Marked failed by reconciliation (stale)';
      await this.attemptRepository.save(attempt);
      staleAttemptsMarkedFailed += 1;
      details.push(`attempt:${attempt.id}:stale_failed`);
    }

    // 2) Stale processing payments — flag in metadata, do not auto-complete
    const stalePayments = await this.paymentRepository.find({
      where: {
        status: In([DbPaymentStatus.PENDING, DbPaymentStatus.PROCESSING]),
        updatedAt: LessThan(cutoff),
      },
      take: 200,
    });

    let stalePaymentsFlagged = 0;
    for (const payment of stalePayments) {
      const meta = {
        ...((payment.metadata as Record<string, unknown>) || {}),
        reconciliation: {
          flaggedAt: new Date().toISOString(),
          reason: 'stale_processing',
        },
      };
      await this.paymentRepository.update(payment.id, { metadata: meta as any });
      stalePaymentsFlagged += 1;
      details.push(`payment:${payment.id}:stale_flagged`);
    }

    // 3) Drift: completed payment vs unpaid order
    const recentCompleted = await this.paymentRepository.find({
      where: { status: DbPaymentStatus.COMPLETED },
      order: { updatedAt: 'DESC' },
      take: 100,
    });

    let orderPaymentMismatches = 0;
    for (const payment of recentCompleted) {
      const order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
      });
      if (!order) continue;
      if (
        order.paymentStatus !== OrderPaymentStatus.PAID &&
        order.paymentStatus !== OrderPaymentStatus.REFUNDED
      ) {
        orderPaymentMismatches += 1;
        details.push(
          `mismatch:payment=${payment.id}:order=${order.id}:orderStatus=${order.paymentStatus}`,
        );
        this.logger.warn(
          `Reconciliation mismatch: payment ${payment.id} COMPLETED but order ${order.id} paymentStatus=${order.paymentStatus}`,
        );
      }
    }

    return {
      ranAt: new Date().toISOString(),
      staleAttemptsMarkedFailed,
      stalePaymentsFlagged,
      orderPaymentMismatches,
      details,
    };
  }
}
