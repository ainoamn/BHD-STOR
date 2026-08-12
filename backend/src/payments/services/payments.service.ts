import { createHash } from 'crypto';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Payment,
  PaymentMethod,
  PaymentStatus as DbPaymentStatus,
} from '../entities/payment.entity';
import { PaymentGateway } from '../entities/payment-gateway.entity';
import {
  PaymentAttempt,
  PaymentAttemptStatus,
} from '../entities/payment-attempt.entity';
import {
  WebhookEvent,
  WebhookProcessingStatus,
} from '../entities/webhook-event.entity';
import { PaymentGatewayFactory, PaymentGatewayType } from './payment-gateway.factory';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import { StripeService } from './stripe.service';
import { PayPalService } from './paypal.service';
import { OmanNetService } from './oman-net.service';
import { ThawaniService } from './thawani.service';
import { TelrService } from './telr.service';
import { CCAvenueService } from './ccavenue.service';
import { OrdersService } from '../../orders/orders.service';
import { isStaffRole } from '../../auth/utils/roles';
import { PaymentStatus } from '../../orders/entities/order.entity';
import {
  resolveChargeAmount,
  webhookAmountMatchesOrder,
} from '../utils/payment-amount';
import {
  isPaymentRefundableStatus,
  resolveRefundAmount,
} from '../utils/refund-amount';
import { resolveCaptureAmount } from '../utils/capture-amount';
import { addMoney, moneyEquals, roundMoney } from '../../common/utils/money.util';
import { buildSimplePdf } from '../utils/simple-pdf';
import { InvoiceService } from './invoice.service';

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  status: string;
  amount: number;
  currency: string;
  gateway: string;
  redirectUrl?: string;
  clientSecret?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionResult {
  originalAmount: number;
  platformCommission: number;
  platformCommissionRate: number;
  storeAmount: number;
  paymentGatewayFee: number;
  netStoreAmount: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly defaultCommissionRate: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly gatewayFactory: PaymentGatewayFactory,
    private readonly stripeService: StripeService,
    private readonly paypalService: PayPalService,
    private readonly omanNetService: OmanNetService,
    private readonly thawaniService: ThawaniService,
    private readonly telrService: TelrService,
    private readonly ccavenueService: CCAvenueService,
    private readonly ordersService: OrdersService,
    private readonly eventEmitter: EventEmitter2,
    private readonly invoiceService: InvoiceService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentGateway)
    private readonly gatewayRepository: Repository<PaymentGateway>,
    @InjectRepository(PaymentAttempt)
    private readonly paymentAttemptRepository: Repository<PaymentAttempt>,
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepository: Repository<WebhookEvent>,
  ) {
    this.defaultCommissionRate = parseFloat(this.configService.get<string>('PLATFORM_COMMISSION_RATE') || '0.10');
  }

  /**
   * Process a payment through the selected gateway
   */
  async processPayment(userId: string, dto: ProcessPaymentDto): Promise<PaymentResult> {
    const { orderId, gateway, paymentMethodId, customerEmail, customerName, metadata } = dto;
    const returnUrl = this.sanitizePaymentReturnUrl(dto.returnUrl);
    const normalizedGateway = this.normalizeGatewayCode(gateway || '');

    this.logger.log(`Processing payment for order ${orderId} via ${normalizedGateway}`);

    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }

    const isCod =
      normalizedGateway === 'cod' || normalizedGateway === 'cash_on_delivery';
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    if (
      nodeEnv === 'production' &&
      this.configService.get<string>('PAYMENTS_LIVE_ENABLED') !== 'true' &&
      !isCod
    ) {
      throw new ServiceUnavailableException(
        'Live payments are disabled. Set PAYMENTS_LIVE_ENABLED=true to enable card/gateway payments.',
      );
    }

    await this.assertGatewayEnabled(normalizedGateway);
    await this.assertOrderOwnedByUser(orderId, userId);

    const order = await this.ordersService.findOne(orderId);
    const amount = resolveChargeAmount(Number(order.total), dto.amount);
    const currency = String(order.currency || dto.currency || 'OMR').toUpperCase();

    const requestHash = createHash('sha256')
      .update(
        JSON.stringify({
          orderId,
          gateway: normalizedGateway,
          amount,
          currency,
        }),
      )
      .digest('hex');

    let idempotencyKey = dto.idempotencyKey?.trim() || undefined;
    let attempt: PaymentAttempt | null = null;

    if (idempotencyKey) {
      attempt = await this.paymentAttemptRepository.findOne({
        where: { userId, idempotencyKey },
      });
      if (attempt) {
        if (attempt.requestHash && attempt.requestHash !== requestHash) {
          throw new ConflictException(
            'Idempotency key already used with a different payment request',
          );
        }
        if (attempt.resultPayload) {
          return attempt.resultPayload as unknown as PaymentResult;
        }
      }
    } else {
      idempotencyKey = `auto_${orderId}_${normalizedGateway}_${Date.now()}`;
    }

    if (!attempt) {
      attempt = await this.paymentAttemptRepository.save(
        this.paymentAttemptRepository.create({
          orderId,
          userId,
          idempotencyKey,
          gateway: normalizedGateway,
          amount,
          currency,
          status: PaymentAttemptStatus.PENDING,
          requestHash,
        }),
      );
    }

    // Cash on delivery — no external gateway; order already confirmed at create
    if (isCod) {
      const result: PaymentResult = {
        success: true,
        paymentId: `cod_${orderId}`,
        status: 'pending',
        amount,
        currency,
        gateway: 'cod',
        metadata: { method: 'cash_on_delivery', note: 'Pay on delivery' },
      };
      await this.persistPaymentAttemptResult(
        attempt,
        userId,
        orderId,
        normalizedGateway,
        amount,
        currency,
        result,
        true,
      );
      return result;
    }

    // Validate gateway is supported
    if (!this.gatewayFactory.isGatewaySupported(normalizedGateway)) {
      attempt.status = PaymentAttemptStatus.FAILED;
      attempt.lastError = `Unsupported payment gateway: ${gateway}`;
      await this.paymentAttemptRepository.save(attempt);
      throw new BadRequestException(`Unsupported payment gateway: ${gateway}`);
    }

    // Validate gateway configuration (single object when gateway is passed)
    const configValidation = this.gatewayFactory.validateGatewayConfig(
      normalizedGateway as PaymentGatewayType,
    );
    const gatewayConfig = Array.isArray(configValidation)
      ? configValidation.find((c) => c.gateway === normalizedGateway)
      : configValidation;
    if (gatewayConfig && !gatewayConfig.isConfigured) {
      const msg = `Gateway ${gateway} is not properly configured. Missing: ${gatewayConfig.missingKeys.join(', ')}`;
      attempt.status = PaymentAttemptStatus.FAILED;
      attempt.lastError = msg;
      await this.paymentAttemptRepository.save(attempt);
      throw new BadRequestException(msg);
    }

    try {
      let result: PaymentResult;

      switch (normalizedGateway) {
        case 'stripe': {
          // Get or create customer
          let customerId: string | undefined;
          if (customerEmail) {
            const customerResult = await this.stripeService.createCustomer(userId, customerEmail, customerName);
            if (customerResult.success) {
              customerId = customerResult.customerId;
              if (paymentMethodId) {
                await this.stripeService.attachPaymentMethod(customerId, paymentMethodId);
              }
            }
          }

          const stripeResult = await this.stripeService.createPaymentIntent(
            orderId,
            amount,
            currency,
            customerId,
            paymentMethodId,
            metadata,
          );

          result = {
            success: stripeResult.success,
            paymentId: stripeResult.paymentIntentId,
            status: stripeResult.status || 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            clientSecret: stripeResult.clientSecret,
            error: stripeResult.error,
            metadata: stripeResult.metadata,
          };
          break;
        }

        case 'paypal': {
          const paypalResult = await this.paypalService.createOrder(
            orderId,
            amount,
            currency,
            returnUrl,
            undefined,
            metadata?.description,
          );

          result = {
            success: paypalResult.success,
            transactionId: paypalResult.orderId,
            status: paypalResult.status || 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            redirectUrl: paypalResult.approvalUrl,
            error: paypalResult.error,
          };
          break;
        }

        case 'oman_net': {
          const omanResult = await this.omanNetService.initiatePayment(
            orderId,
            amount,
            currency,
            returnUrl,
            customerEmail,
            customerName,
          );

          result = {
            success: omanResult.success,
            transactionId: omanResult.transactionId,
            status: omanResult.status || 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            redirectUrl: omanResult.redirectUrl,
            error: omanResult.error,
          };
          break;
        }

        case 'thawani': {
          // Never trust client-supplied product unit amounts
          const products = [
            {
              name: `Order ${orderId}`,
              unit_amount: amount,
              quantity: 1,
            },
          ];

          const thawaniResult = await this.thawaniService.createSession(
            orderId,
            amount,
            products,
            returnUrl,
            customerEmail,
            customerName,
            metadata,
          );

          result = {
            success: thawaniResult.success,
            transactionId: thawaniResult.sessionId,
            status: thawaniResult.status || 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            redirectUrl: thawaniResult.paymentUrl,
            error: thawaniResult.error,
          };
          break;
        }

        case 'telr': {
          const telrResult = await this.telrService.createPayment(
            orderId,
            amount,
            currency,
            metadata?.description,
            customerEmail,
            customerName,
            returnUrl,
          );

          result = {
            success: telrResult.success,
            transactionId: telrResult.transactionId,
            status: telrResult.status || 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            redirectUrl: telrResult.redirectUrl,
            error: telrResult.error,
          };
          break;
        }

        case 'ccavenue': {
          const ccResult = await this.ccavenueService.initiatePayment(
            orderId,
            amount,
            currency,
            returnUrl,
            undefined,
            customerEmail,
            customerName,
            metadata?.customerPhone,
            metadata?.billingAddress,
          );

          result = {
            success: ccResult.success,
            transactionId: ccResult.orderId,
            status: 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            error: ccResult.error,
            metadata: {
              encRequest: ccResult.encRequest,
              accessCode: ccResult.accessCode,
              gatewayUrl: ccResult.gatewayUrl,
            },
          };
          break;
        }

        default:
          throw new BadRequestException(`Gateway ${gateway} processing not implemented`);
      }

      await this.persistPaymentAttemptResult(
        attempt,
        userId,
        orderId,
        normalizedGateway,
        amount,
        currency,
        result,
        false,
      );
      return result;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        attempt.status = PaymentAttemptStatus.FAILED;
        attempt.lastError = error.message;
        await this.paymentAttemptRepository.save(attempt);
        throw error;
      }
      this.logger.error(`Payment processing failed for order ${orderId}: ${error.message}`, error.stack);
      attempt.status = PaymentAttemptStatus.FAILED;
      attempt.lastError = error.message;
      await this.paymentAttemptRepository.save(attempt);
      throw new InternalServerErrorException(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Verify payment (JWT user): must own/view the DB payment, or be staff for orphan gateway ids.
   */
  async verifyPaymentForUser(
    paymentId: string,
    gateway: PaymentGatewayType,
    userId: string,
    role?: string,
    gatewayData?: any,
  ): Promise<PaymentResult> {
    const paymentRecord = await this.findPaymentByIdOrGatewayRef(paymentId);
    if (paymentRecord) {
      await this.assertPaymentViewAccess(paymentRecord, userId, role);
      const gw = (paymentRecord.gateway || gateway) as PaymentGatewayType;
      const externalId = paymentRecord.transactionId || paymentId;
      return this.verifyPayment(externalId, gw, gatewayData);
    }

    if (!isStaffRole(role)) {
      throw new ForbiddenException('Payment not found or access denied');
    }

    return this.verifyPayment(paymentId, gateway, gatewayData);
  }

  /**
   * Verify a payment status (gateway call; prefer verifyPaymentForUser from HTTP)
   */
  async verifyPayment(paymentId: string, gateway: PaymentGatewayType, gatewayData?: any): Promise<PaymentResult> {
    this.logger.log(`Verifying payment ${paymentId} on ${gateway}`);

    try {
      switch (gateway) {
        case 'stripe': {
          const paymentIntent = await this.stripeService.retrievePaymentIntent(paymentId);
          return {
            success: paymentIntent.status === 'succeeded',
            paymentId: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 1000, // Convert from baisa
            currency: paymentIntent.currency,
            gateway,
          };
        }

        case 'paypal': {
          const orderDetails = await this.paypalService.getOrderDetails(paymentId);
          return {
            success: orderDetails.status === 'COMPLETED',
            transactionId: orderDetails.id,
            status: orderDetails.status === 'COMPLETED' ? 'succeeded' : orderDetails.status.toLowerCase(),
            amount: parseFloat(orderDetails.purchase_units?.[0]?.amount?.value) || 0,
            currency: orderDetails.purchase_units?.[0]?.amount?.currency_code || 'OMR',
            gateway,
          };
        }

        case 'oman_net': {
          const result = await this.omanNetService.verifyPayment(paymentId);
          return {
            success: result.success,
            transactionId: result.transactionId,
            status: result.status || 'unknown',
            amount: result.amount || 0,
            currency: 'OMR',
            gateway,
          };
        }

        case 'thawani': {
          const result = await this.thawaniService.retrieveSession(paymentId);
          return {
            success: result.success,
            transactionId: result.sessionId,
            status: result.status || 'unknown',
            amount: result.amount || 0,
            currency: 'OMR',
            gateway,
          };
        }

        case 'telr': {
          const result = await this.telrService.checkPayment(paymentId);
          return {
            success: result.success,
            transactionId: result.transactionId,
            status: result.status || 'unknown',
            amount: result.amount || 0,
            currency: result.currency || 'OMR',
            gateway,
          };
        }

        case 'ccavenue': {
          const result = await this.ccavenueService.getTransactionStatus(paymentId);
          return {
            success: result.success,
            transactionId: result.trackingId,
            status: result.orderStatus || 'unknown',
            amount: result.amount || 0,
            currency: result.currency || 'OMR',
            gateway,
          };
        }

        default:
          throw new BadRequestException(`Verification not implemented for gateway: ${gateway}`);
      }
    } catch (error) {
      this.logger.error(`Payment verification failed for ${paymentId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Payment verification failed: ${error.message}`);
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(
    userId: string,
    dto: RefundPaymentDto,
    role?: string,
  ): Promise<any> {
    const { paymentId, amount, reason, notes } = dto;

    this.logger.log(`Processing refund for payment ${paymentId}, amount: ${amount || 'full'}`);

    const paymentEntity = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });
    if (!paymentEntity) {
      // Also allow lookup by gateway transaction id
      const byGateway = await this.paymentRepository.findOne({
        where: { gatewayTransactionId: paymentId },
      });
      if (!byGateway) {
        throw new NotFoundException(`Payment ${paymentId} not found`);
      }
      return this.createRefund(userId, { ...dto, paymentId: byGateway.id }, role);
    }

    const paymentRecord = await this.getPaymentRecord(paymentEntity.id);
    if (!paymentRecord) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    await this.assertPaymentManageAccess(paymentRecord, userId, role);

    if (!isPaymentRefundableStatus(String(paymentEntity.status))) {
      throw new BadRequestException(
        `Payment status "${paymentEntity.status}" is not refundable`,
      );
    }

    const refundAmount = resolveRefundAmount(
      Number(paymentEntity.amount),
      Number(paymentEntity.refundAmount || 0),
      amount,
    );

    try {
      const gateway = paymentRecord.gateway as PaymentGatewayType;
      let result: any;

      switch (gateway) {
        case 'stripe': {
          result = await this.stripeService.createRefund(
            paymentRecord.transactionId || paymentEntity.id,
            refundAmount,
            reason,
          );
          break;
        }

        case 'paypal': {
          result = await this.paypalService.createRefund(
            paymentRecord.transactionId || paymentEntity.id,
            refundAmount,
            reason,
          );
          break;
        }

        case 'oman_net': {
          result = await this.omanNetService.createRefund(
            paymentRecord.transactionId || paymentEntity.id,
            refundAmount,
            reason,
          );
          break;
        }

        case 'thawani': {
          result = await this.thawaniService.createRefund(
            paymentRecord.transactionId || paymentEntity.id,
            refundAmount,
            reason,
          );
          break;
        }

        case 'telr': {
          result = await this.telrService.createRefund(
            paymentRecord.transactionId || paymentEntity.id,
            refundAmount,
            reason,
          );
          break;
        }

        case 'ccavenue': {
          result = await this.ccavenueService.createRefund({
            orderId: paymentRecord.orderId,
            referenceNo: paymentRecord.transactionId || paymentEntity.id,
            refundAmount,
            refundCurrency: paymentRecord.currency,
            refundReason: `${reason}: ${notes || ''}`,
          });
          break;
        }

        default:
          throw new BadRequestException(`Refunds not supported for gateway: ${gateway}`);
      }

      if (result.success) {
        this.logger.log(`Refund processed successfully for payment ${paymentEntity.id}`);
        const prior = Number(paymentEntity.refundAmount || 0);
        const cumulative = addMoney(prior, refundAmount);
        const fullyRefunded = moneyEquals(cumulative, Number(paymentEntity.amount))
          || cumulative >= Number(paymentEntity.amount) - 0.001;
        await this.paymentRepository.update(paymentEntity.id, {
          refundAmount: cumulative,
          refundReason: reason || paymentEntity.refundReason,
          refundedAt: new Date(),
          status: fullyRefunded
            ? DbPaymentStatus.REFUNDED
            : paymentEntity.status,
        });
      }

      return { ...result, refundAmount };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Refund failed for payment ${paymentId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Refund processing failed: ${error.message}`);
    }
  }

  /**
   * Verify payment by DB record id (for post-gateway return).
   */
  async verifyPaymentById(
    paymentId: string,
    userId: string,
    role?: string,
    gatewayData?: any,
  ): Promise<any> {
    const paymentRecord = await this.getPaymentRecord(paymentId);
    if (!paymentRecord) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    await this.assertPaymentViewAccess(paymentRecord, userId, role);

    const gateway = (paymentRecord.gateway || '') as PaymentGatewayType;
    if (!gateway) {
      throw new BadRequestException('Payment has no gateway recorded');
    }

    const externalId = paymentRecord.transactionId || paymentId;
    const result = await this.verifyPayment(externalId, gateway, gatewayData);

    return {
      ...result,
      paymentId: paymentRecord.id,
      orderId: paymentRecord.orderId,
      gateway,
    };
  }

  async getPaymentDetailsForUser(
    paymentId: string,
    userId: string,
    role?: string,
  ): Promise<PaymentRecord> {
    const payment = await this.getPaymentDetails(paymentId);
    await this.assertPaymentViewAccess(payment, userId, role);
    return payment;
  }

  /**
   * Get payment history for a user with pagination
   */
  async getPaymentHistory(userId: string, page: number = 1, limit: number = 20): Promise<{ payments: PaymentRecord[]; total: number }> {
    this.logger.debug(`Getting payment history for user ${userId}, page ${page}, limit ${limit}`);

    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      payments: payments.map(p => ({
        id: p.id,
        orderId: p.orderId,
        userId: p.userId,
        amount: p.amount,
        currency: p.currency,
        gateway: p.gateway,
        status: p.status,
        transactionId: p.gatewayTransactionId || undefined,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      total,
    };
  }

  /**
   * Get payment details by ID
   */
  async getPaymentDetails(paymentId: string): Promise<PaymentRecord> {
    this.logger.debug(`Getting payment details for ${paymentId}`);

    const payment = await this.getPaymentRecord(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    return payment;
  }

  /**
   * Handle incoming webhooks from any gateway
   */
  async handleWebhook(gateway: PaymentGatewayType, payload: any, headers: Record<string, any>, rawBody?: string): Promise<{ success: boolean; orderId?: string; action: string }> {
    this.logger.log(`Handling ${gateway} webhook`);

    try {
      let result: { success: boolean; orderId?: string; action: string };
      const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
      const allowSkipVerify = nodeEnv !== 'production';

      switch (gateway) {
        case 'stripe': {
          const signature = headers['stripe-signature'];
          if (!signature) {
            throw new BadRequestException('Missing Stripe signature');
          }
          if (!rawBody) {
            throw new BadRequestException(
              'Missing raw request body for Stripe signature verification',
            );
          }

          const event = this.stripeService.constructEvent(rawBody, signature);
          result = await this.stripeService.handleWebhook(event);
          break;
        }

        case 'paypal': {
          const skipVerify =
            allowSkipVerify &&
            this.configService.get<string>('PAYPAL_SKIP_WEBHOOK_VERIFY') === 'true';

          if (!skipVerify) {
            const webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID');
            if (!this.paypalService.isConfigured() || !webhookId) {
              throw new BadRequestException('PayPal webhook configuration is missing');
            }
          }

          const verification = await this.paypalService.verifyWebhookSignature(headers, payload);
          if (!verification.verified && !skipVerify) {
            throw new BadRequestException('PayPal webhook signature verification failed');
          }
          if (!verification.verified && skipVerify) {
            this.logger.warn('PayPal webhook signature verification failed (skipped via env)');
          }

          result = await this.paypalService.handleWebhook(payload);
          break;
        }

        case 'oman_net': {
          if (!this.omanNetService.isConfigured()) {
            throw new BadRequestException('Oman Net is not configured');
          }
          const omanResult = await this.omanNetService.processCallback(payload);
          if (!omanResult.success && omanResult.error?.includes('Hash verification')) {
            throw new BadRequestException('Oman Net callback signature verification failed');
          }
          result = {
            success: omanResult.success,
            orderId: omanResult.orderId,
            action: omanResult.success ? 'payment_completed' : 'payment_failed',
          };
          break;
        }

        case 'thawani': {
          const signature =
            headers['x-thawani-signature'] ||
            headers['thawani-signature'] ||
            headers['x-signature'];
          const thawaniSecret =
            this.configService.get<string>('THAWANI_WEBHOOK_SECRET') ||
            this.configService.get<string>('THAWANI_SECRET_KEY');
          const skipVerify =
            allowSkipVerify &&
            this.configService.get<string>('THAWANI_SKIP_WEBHOOK_VERIFY') === 'true';

          if (!skipVerify) {
            if (!signature) {
              throw new BadRequestException('Missing Thawani webhook signature');
            }
            if (!thawaniSecret) {
              throw new BadRequestException('Thawani webhook secret is not configured');
            }
            const ok = this.thawaniService.verifyWebhookSignature(
              rawBody || JSON.stringify(payload),
              signature,
            );
            if (!ok) {
              throw new BadRequestException('Thawani webhook signature verification failed');
            }
          } else {
            this.logger.warn('Thawani webhook signature verification skipped via env');
          }

          result = await this.thawaniService.processWebhook(payload);
          break;
        }

        case 'telr': {
          if (!this.telrService.isConfigured()) {
            throw new BadRequestException('Telr is not configured');
          }
          const orderRef =
            payload?.order_ref ||
            payload?.order?.ref ||
            payload?.OrderRef;
          if (!orderRef) {
            throw new BadRequestException(
              'Missing Telr order_ref (tran_ref alone is not accepted)',
            );
          }

          const telrResult = await this.telrService.processCallback(payload);

          // Unverified API/check failures must not soft-ACK (forged callbacks)
          if (telrResult.verified === false) {
            throw new BadRequestException(
              `Telr verification failed: ${telrResult.error || 'unable to confirm with Telr API'}`,
            );
          }

          if (telrResult.success && !telrResult.orderId) {
            throw new BadRequestException(
              'Telr payment verified but cart/order id is missing from Telr response',
            );
          }

          result = {
            success: telrResult.success,
            orderId: telrResult.orderId,
            action: telrResult.success ? 'payment_completed' : 'payment_failed',
          };
          break;
        }

        case 'ccavenue': {
          if (!this.ccavenueService.isConfigured()) {
            throw new BadRequestException('CCAvenue is not configured');
          }
          const encResponse = payload.encResp || payload.enc_response;
          if (!encResponse) {
            throw new BadRequestException('Missing encrypted response');
          }

          const ccResult = await this.ccavenueService.verifyPayment(encResponse);
          if (!ccResult.success && ccResult.error?.toLowerCase().includes('decrypt')) {
            throw new BadRequestException('CCAvenue response decryption failed');
          }
          result = {
            success: ccResult.success,
            orderId: ccResult.orderId,
            action: ccResult.success ? 'payment_completed' : 'payment_failed',
          };
          break;
        }

        default:
          throw new BadRequestException(`Webhook handling not implemented for gateway: ${gateway}`);
      }

      const inbox = await this.registerWebhookEvent(gateway, payload, result);
      if (inbox.alreadyProcessed) {
        return result;
      }

      try {
        await this.applyWebhookToOrder(gateway, result);
        inbox.event.status = WebhookProcessingStatus.PROCESSED;
        inbox.event.eventType = result.action;
        inbox.event.orderId = result.orderId || inbox.event.orderId;
        inbox.event.lastError = null;
        await this.webhookEventRepository.save(inbox.event);
      } catch (applyError) {
        inbox.event.status = WebhookProcessingStatus.FAILED;
        inbox.event.eventType = result.action;
        inbox.event.lastError =
          applyError instanceof Error ? applyError.message : String(applyError);
        await this.webhookEventRepository.save(inbox.event);
        throw applyError;
      }

      return result;
    } catch (error) {
      this.logger.error(`Webhook handling failed for ${gateway}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Persist webhook outcome onto the marketplace order and notify logistics.
   */
  private async applyWebhookToOrder(
    gateway: string,
    result: {
      success: boolean;
      orderId?: string;
      action: string;
      amount?: number;
    },
  ): Promise<void> {
    if (!result.orderId) {
      this.logger.warn(`Webhook ${gateway}/${result.action} has no orderId — order not updated`);
      return;
    }

    const paidActions = [
      'payment_succeeded',
      'payment_completed',
      'payment_captured',
      'order_completed',
      'order_approved_and_captured',
    ];
    const failedActions = ['payment_failed', 'payment_denied'];
    const refundActions = ['refund_processed', 'refund_created'];

    try {
      if (paidActions.includes(result.action) && result.success) {
        const existing = await this.ordersService.findOne(result.orderId);
        if (
          !webhookAmountMatchesOrder(Number(existing.total), result.amount)
        ) {
          this.logger.error(
            `Webhook amount mismatch for order ${result.orderId}: paid=${result.amount} expected=${existing.total}`,
          );
          throw new BadRequestException(
            `Webhook amount does not match order total for order ${result.orderId}`,
          );
        }

        const wasAlreadyPaid = existing.paymentStatus === PaymentStatus.PAID;

        const order = await this.ordersService.applyPaymentWebhook(
          result.orderId,
          PaymentStatus.PAID,
          { gateway, action: result.action, amount: result.amount },
        );

        // Do not re-emit logistics/order events for already-paid orders
        if (!wasAlreadyPaid) {
          this.eventEmitter.emit('order.paid', {
            orderId: order.id,
            gateway,
            action: result.action,
            paymentStatus: PaymentStatus.PAID,
          });
          this.eventEmitter.emit('order.status_changed', {
            orderId: order.id,
            oldStatus: 'pending',
            newStatus: order.status,
          });
          // Trigger logistics shipment creation (idempotent)
          this.eventEmitter.emit('order.created', { orderId: order.id });
        }
        return;
      }

      if (failedActions.includes(result.action) || (!result.success && paidActions.includes(result.action) === false && result.action.includes('fail'))) {
        await this.ordersService.applyPaymentWebhook(
          result.orderId,
          PaymentStatus.FAILED,
          { gateway, action: result.action },
        );
        return;
      }

      if (refundActions.includes(result.action)) {
        await this.ordersService.applyPaymentWebhook(
          result.orderId,
          PaymentStatus.REFUNDED,
          { gateway, action: result.action },
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed to apply webhook to order ${result.orderId}: ${err.message}`,
        err.stack,
      );
      // Re-throw so the webhook endpoint returns 5xx and providers can retry
      throw err;
    }
  }

  /**
   * Process a payout to a store
   */
  async payoutToStore(storeId: string, dto: CreatePayoutDto): Promise<any> {
    this.logger.log(`Processing payout to store ${storeId}, amount: ${dto.amount} ${dto.currency}`);

    try {
      let result: any;

      switch (dto.method) {
        case 'stripe_connect': {
          // Get store's connected account ID from database
          const connectedAccountId = await this.getStoreConnectedAccount(storeId);
          if (!connectedAccountId) {
            throw new BadRequestException(`Store ${storeId} does not have a connected Stripe account`);
          }

          result = await this.stripeService.createPayout(
            connectedAccountId,
            dto.amount,
            dto.currency,
          );
          break;
        }

        case 'paypal': {
          const storeEmail = await this.getStorePaypalEmail(storeId);
          if (!storeEmail) {
            throw new BadRequestException(`Store ${storeId} does not have a PayPal email`);
          }

          result = await this.paypalService.createPayout(
            storeEmail,
            dto.amount,
            dto.currency,
            dto.internalReference,
          );
          break;
        }

        case 'bank_transfer':
        case 'wire': {
          // Process bank transfer via Stripe or internal system
          result = await this.processBankTransfer(storeId, dto);
          break;
        }

        default:
          throw new BadRequestException(`Payout method ${dto.method} not supported`);
      }

      if (result.success) {
        this.logger.log(`Payout to store ${storeId} processed successfully`);
        await this.recordPayout(storeId, dto, result);
      }

      return result;
    } catch (error) {
      this.logger.error(`Payout to store ${storeId} failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Payout processing failed: ${error.message}`);
    }
  }

  /**
   * Calculate platform commission for an order
   */
  async calculateCommission(amount: number, storeId?: string): Promise<CommissionResult> {
    // Get store-specific commission rate if available
    const commissionRate = storeId
      ? await this.getStoreCommissionRate(storeId)
      : this.defaultCommissionRate;

    const platformCommission = roundMoney(amount * commissionRate);

    // Estimate payment gateway fee (typically 2.5-3% for cards)
    const gatewayFeeRate = 0.025; // 2.5%
    const paymentGatewayFee = roundMoney(amount * gatewayFeeRate);

    const storeAmount = roundMoney(amount - platformCommission);
    const netStoreAmount = roundMoney(storeAmount - paymentGatewayFee);

    return {
      originalAmount: roundMoney(amount),
      platformCommission,
      platformCommissionRate: commissionRate,
      storeAmount,
      paymentGatewayFee,
      netStoreAmount,
    };
  }

  /**
   * Issue (or reuse) a sequenced tax invoice and return a PDF buffer.
   */
  async generateInvoice(
    paymentId: string,
    userId: string,
    role?: string,
  ): Promise<{ pdfBuffer: Buffer; filename: string; invoiceNumber: string }> {
    this.logger.log(`Generating invoice for payment ${paymentId}`);

    const payment = await this.getPaymentRecord(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    await this.assertPaymentViewAccess(payment, userId, role);

    const invoice = await this.invoiceService.issueForPayment({
      paymentId: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: Number(payment.amount),
      currency: payment.currency || 'OMR',
      gateway: payment.gateway,
    });

    const amount = roundMoney(Number(invoice.amount)).toFixed(3);
    const pdfBuffer = buildSimplePdf(
      [
        `Invoice Number: ${invoice.invoiceNumber}`,
        `Order ID: ${payment.orderId}`,
        `Payment ID: ${payment.id}`,
        `Transaction ID: ${payment.transactionId || 'N/A'}`,
        `Date: ${invoice.issuedAt.toISOString()}`,
        `Payment Method: ${String(payment.gateway || '').toUpperCase() || 'N/A'}`,
        `Status: ${String(payment.status || '').toUpperCase()}`,
        `Total: ${amount} ${invoice.currency}`,
        '',
        'BHD Oman Marketplace | Tax Registration: OM12345678',
        'Thank you for your business.',
      ],
      'BHD Oman — Tax Invoice',
    );

    return {
      pdfBuffer,
      filename: `${invoice.invoiceNumber}.pdf`,
      invoiceNumber: invoice.invoiceNumber,
    };
  }

  /**
   * Capture an authorized payment (store owner or staff only).
   */
  async capturePayment(
    paymentId: string,
    gateway: PaymentGatewayType,
    amount?: number,
    userId?: string,
    role?: string,
  ): Promise<PaymentResult> {
    this.logger.log(`Capturing payment ${paymentId} on ${gateway}`);

    if (!userId) {
      throw new ForbiddenException('Authentication required to capture payment');
    }

    const paymentRecord = await this.findPaymentByIdOrGatewayRef(paymentId);
    if (!paymentRecord) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    await this.assertPaymentManageAccess(paymentRecord, userId, role);

    const resolvedGateway = (paymentRecord.gateway || gateway) as PaymentGatewayType;
    const externalId = paymentRecord.transactionId || paymentId;

    try {
      switch (resolvedGateway) {
        case 'stripe': {
          const result = await this.stripeService.confirmPayment(externalId);
          return {
            success: result.success,
            paymentId: result.paymentIntentId,
            status: result.status || 'unknown',
            amount: result.amount || 0,
            currency: result.currency || 'OMR',
            gateway: resolvedGateway,
            error: result.error,
          };
        }

        case 'paypal': {
          const result = await this.paypalService.captureOrder(externalId);
          return {
            success: result.success,
            transactionId: result.captureId,
            status: result.status || 'unknown',
            amount: result.amount || 0,
            currency: 'OMR',
            gateway: resolvedGateway,
            error: result.error,
          };
        }

        case 'telr': {
          const captureAmount = resolveCaptureAmount(
            Number(paymentRecord.amount),
            amount,
          );
          const result = await this.telrService.capturePayment(
            externalId,
            captureAmount,
          );
          return {
            success: result.success,
            transactionId: result.transactionId,
            status: result.status || 'unknown',
            amount: captureAmount,
            currency: 'OMR',
            gateway: resolvedGateway,
            error: result.error,
          };
        }

        default:
          throw new BadRequestException(
            `Capture not supported for gateway: ${resolvedGateway}`,
          );
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Payment capture failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Capture failed: ${error.message}`);
    }
  }

  /**
   * Get payment statistics for admin dashboard
   */
  async getPaymentStats(startDate?: Date, endDate?: Date): Promise<any> {
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const payments = await this.paymentRepository.find({
      where,
      select: ['id', 'amount', 'currency', 'gateway', 'status', 'createdAt'],
    });

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const refunds = payments.filter(
      (p) =>
        p.status === DbPaymentStatus.REFUNDED ||
        Number(p.refundAmount || 0) > 0,
    );
    const totalRefunds = refunds.length;
    const totalRefundAmount = refunds.reduce((sum, p) => sum + Number(p.amount), 0);

    // Aggregate by gateway
    const byGateway: Record<string, { count: number; amount: number }> = {};
    const byStatus: Record<string, number> = {};

    for (const payment of payments) {
      // By gateway
      if (!byGateway[payment.gateway]) {
        byGateway[payment.gateway] = { count: 0, amount: 0 };
      }
      byGateway[payment.gateway].count++;
      byGateway[payment.gateway].amount += Number(payment.amount);

      // By status
      byStatus[payment.status] = (byStatus[payment.status] || 0) + 1;
    }

    return {
      totalPayments,
      totalAmount,
      totalRefunds,
      totalRefundAmount,
      byGateway,
      byStatus,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  }

  // ---- Private helper methods ----

  /**
   * Retrieve a payment record from the database by UUID or gateway transaction id
   */
  private async getPaymentRecord(paymentId: string): Promise<PaymentRecord | null> {
    return this.findPaymentByIdOrGatewayRef(paymentId);
  }

  private async findPaymentByIdOrGatewayRef(
    paymentId: string,
  ): Promise<PaymentRecord | null> {
    let payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      payment = await this.paymentRepository.findOne({
        where: { gatewayTransactionId: paymentId },
      });
    }

    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: Number(payment.amount),
      currency: payment.currency,
      gateway: payment.gateway || '',
      status: String(payment.status),
      transactionId: payment.gatewayTransactionId || undefined,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  /** Admin/staff or store owner of the payment's order may refund. */
  private async assertPaymentManageAccess(
    payment: PaymentRecord,
    userId: string,
    role?: string,
  ): Promise<void> {
    if (isStaffRole(role)) {
      return;
    }

    if (!payment.orderId) {
      throw new ForbiddenException('Cannot determine order for this payment');
    }

    const order = await this.ordersService.findOne(payment.orderId);
    const storeOwnerId =
      (order as any).store?.ownerId ||
      (order as any).store?.owner?.id ||
      null;

    if (storeOwnerId && storeOwnerId === userId) {
      return;
    }

    throw new ForbiddenException('You cannot refund this payment');
  }

  /** Payer, store owner, or staff may view/verify. */
  private async assertPaymentViewAccess(
    payment: PaymentRecord,
    userId: string,
    role?: string,
  ): Promise<void> {
    if (isStaffRole(role)) {
      return;
    }
    if (payment.userId && payment.userId === userId) {
      return;
    }

    if (payment.orderId) {
      try {
        const order = await this.ordersService.findOne(payment.orderId);
        const storeOwnerId =
          (order as any).store?.ownerId ||
          (order as any).store?.owner?.id ||
          null;
        if (storeOwnerId && storeOwnerId === userId) {
          return;
        }
      } catch {
        // fall through to forbidden
      }
    }

    throw new ForbiddenException('You do not have access to this payment');
  }

  /**
   * Active gateways for checkout (DB isActive + env isConfigured).
   */
  async listPublicGateways(): Promise<
    Array<{
      id?: string;
      code: string;
      name: string;
      isActive: boolean;
      isConfigured: boolean;
      isSandbox?: boolean;
      displayOrder?: number;
    }>
  > {
    await this.ensureDefaultGateways();
    const rows = await this.gatewayRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
    const configs = this.gatewayFactory.validateGatewayConfig() as Array<{
      gateway: string;
      isConfigured: boolean;
    }>;

    return rows.map((row) => {
      const code = this.normalizeGatewayCode(row.code);
      const cfg = configs.find((c) => c.gateway === code);
      const isCod = code === 'cod' || code === 'cash_on_delivery';
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        isActive: row.isActive,
        isConfigured: isCod ? true : Boolean(cfg?.isConfigured),
        isSandbox: row.isSandbox,
        displayOrder: row.displayOrder,
      };
    });
  }

  async listAllGatewaysForAdmin() {
    await this.ensureDefaultGateways();
    const rows = await this.gatewayRepository.find({
      order: { displayOrder: 'ASC' },
    });
    const configs = this.gatewayFactory.validateGatewayConfig() as Array<{
      gateway: string;
      isConfigured: boolean;
      missingKeys: string[];
    }>;

    return rows.map((row) => {
      const code = this.normalizeGatewayCode(row.code);
      const cfg = configs.find((c) => c.gateway === code);
      const isCod = code === 'cod' || code === 'cash_on_delivery';
      return {
        ...row,
        isConfigured: isCod ? true : Boolean(cfg?.isConfigured),
        missingKeys: isCod ? [] : cfg?.missingKeys || [],
      };
    });
  }

  async setGatewayActive(idOrCode: string, isActive: boolean): Promise<PaymentGateway> {
    await this.ensureDefaultGateways();
    let row = await this.gatewayRepository.findOne({ where: { id: idOrCode } });
    if (!row) {
      row = await this.gatewayRepository.findOne({ where: { code: idOrCode } });
    }
    if (!row) {
      throw new NotFoundException(`Gateway "${idOrCode}" not found`);
    }
    row.isActive = isActive;
    return this.gatewayRepository.save(row);
  }

  private normalizeGatewayCode(code: string): string {
    const n = (code || '').toLowerCase().replace(/-/g, '_');
    if (n === 'omannet') return 'oman_net';
    if (n === 'cash_on_delivery') return 'cod';
    return n;
  }

  private mapGatewayToPaymentMethod(gateway: string): PaymentMethod {
    const code = this.normalizeGatewayCode(gateway);
    switch (code) {
      case 'cod':
        return PaymentMethod.COD;
      case 'stripe':
        return PaymentMethod.STRIPE;
      case 'paypal':
        return PaymentMethod.PAYPAL;
      case 'oman_net':
        return PaymentMethod.OMAN_NET;
      case 'thawani':
        return PaymentMethod.THAWANI;
      case 'telr':
        return PaymentMethod.TELR;
      case 'ccavenue':
        return PaymentMethod.CCAVENUE;
      default:
        return PaymentMethod.CREDIT_CARD;
    }
  }

  private async persistPaymentAttemptResult(
    attempt: PaymentAttempt,
    userId: string,
    orderId: string,
    gateway: string,
    amount: number,
    currency: string,
    result: PaymentResult,
    isCod: boolean,
  ): Promise<void> {
    const gatewayReference =
      result.paymentId || result.transactionId || null;
    const requiresAction = Boolean(result.clientSecret || result.redirectUrl);
    const clearlySucceeded =
      result.success &&
      !isCod &&
      !requiresAction &&
      ['succeeded', 'completed', 'paid'].includes(
        String(result.status || '').toLowerCase(),
      );

    let attemptStatus: PaymentAttemptStatus;
    if (!result.success) {
      attemptStatus = PaymentAttemptStatus.FAILED;
    } else if (requiresAction) {
      attemptStatus = PaymentAttemptStatus.REQUIRES_ACTION;
    } else if (clearlySucceeded) {
      attemptStatus = PaymentAttemptStatus.SUCCEEDED;
    } else {
      // COD and gateway pending → processing
      attemptStatus = PaymentAttemptStatus.PROCESSING;
    }

    const paymentStatus = !result.success
      ? DbPaymentStatus.FAILED
      : clearlySucceeded
        ? DbPaymentStatus.COMPLETED
        : DbPaymentStatus.PROCESSING;

    let payment = await this.paymentRepository.findOne({ where: { orderId } });
    if (!payment) {
      payment = this.paymentRepository.create({
        orderId,
        userId,
        amount,
        currency,
        gateway,
        method: this.mapGatewayToPaymentMethod(gateway),
        status: paymentStatus,
        gatewayTransactionId: gatewayReference,
        metadata: {
          ...(result.metadata || {}),
          attemptId: attempt.id,
          paymentStatus: result.status,
        },
        paidAt: clearlySucceeded ? new Date() : null,
      });
    } else {
      payment.amount = amount;
      payment.currency = currency;
      payment.gateway = gateway;
      payment.method = this.mapGatewayToPaymentMethod(gateway);
      payment.status = paymentStatus;
      if (gatewayReference) {
        payment.gatewayTransactionId = gatewayReference;
      }
      payment.metadata = {
        ...(payment.metadata || {}),
        ...(result.metadata || {}),
        attemptId: attempt.id,
        paymentStatus: result.status,
      };
      if (clearlySucceeded && !payment.paidAt) {
        payment.paidAt = new Date();
      }
    }
    await this.paymentRepository.save(payment);

    attempt.gatewayReference = gatewayReference;
    attempt.status = attemptStatus;
    attempt.resultPayload = result as unknown as Record<string, unknown>;
    attempt.lastError = result.success ? null : result.error || 'Payment failed';
    await this.paymentAttemptRepository.save(attempt);
  }

  private isUniqueViolation(error: unknown): boolean {
    const err = error as { code?: string; driverError?: { code?: string } };
    return err?.code === '23505' || err?.driverError?.code === '23505';
  }

  private resolveProviderEventId(payload: any): string {
    const id =
      payload?.id ||
      payload?.event_id ||
      payload?.EventId ||
      payload?.eventId;
    if (id != null && String(id).trim()) {
      return String(id).slice(0, 255);
    }
    return createHash('sha256')
      .update(JSON.stringify(payload || {}))
      .digest('hex')
      .slice(0, 64);
  }

  private sanitizeWebhookPayload(
    payload: any,
  ): Record<string, unknown> | null {
    if (payload == null) return null;
    try {
      const str = JSON.stringify(payload);
      if (str.length > 8000) {
        return { truncated: true, preview: str.slice(0, 2000) };
      }
      return JSON.parse(str) as Record<string, unknown>;
    } catch {
      return { note: 'unserializable_payload' };
    }
  }

  private async registerWebhookEvent(
    gateway: string,
    payload: any,
    result: { success: boolean; orderId?: string; action: string },
  ): Promise<{ event: WebhookEvent; alreadyProcessed: boolean }> {
    const providerEventId = this.resolveProviderEventId(payload);
    const payloadHash = createHash('sha256')
      .update(JSON.stringify(payload || {}))
      .digest('hex');
    const sanitized = this.sanitizeWebhookPayload(payload);

    try {
      const created = await this.webhookEventRepository.save(
        this.webhookEventRepository.create({
          provider: gateway,
          providerEventId,
          eventType: result.action,
          status: WebhookProcessingStatus.PROCESSING,
          payloadHash,
          payload: sanitized,
          attempts: 1,
          orderId: result.orderId || null,
        }),
      );
      return { event: created, alreadyProcessed: false };
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }

      const existing = await this.webhookEventRepository.findOne({
        where: { provider: gateway, providerEventId },
      });
      if (!existing) {
        throw error;
      }

      if (existing.status === WebhookProcessingStatus.PROCESSED) {
        this.logger.log(
          `Webhook ${gateway}/${providerEventId} already processed — skipping`,
        );
        return { event: existing, alreadyProcessed: true };
      }

      // FAILED / RECEIVED / PROCESSING — allow retry
      existing.attempts = (existing.attempts || 0) + 1;
      existing.status = WebhookProcessingStatus.PROCESSING;
      existing.eventType = result.action || existing.eventType;
      existing.payloadHash = payloadHash;
      if (sanitized) {
        existing.payload = sanitized;
      }
      if (result.orderId) {
        existing.orderId = result.orderId;
      }
      existing.lastError = null;
      await this.webhookEventRepository.save(existing);
      return { event: existing, alreadyProcessed: false };
    }
  }

  /**
   * Allow only return URLs on known app frontends (blocks open redirect via gateway).
   */
  private sanitizePaymentReturnUrl(returnUrl?: string): string | undefined {
    if (!returnUrl || typeof returnUrl !== 'string') return undefined;
    const trimmed = returnUrl.trim();
    const allowedBases = [
      this.configService.get<string>('FRONTEND_URL'),
      this.configService.get<string>('PUBLIC_APP_URL'),
      this.configService.get<string>('NEXT_PUBLIC_APP_URL'),
      this.configService.get<string>('APP_URL'),
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ].filter(Boolean) as string[];

    try {
      if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
        const base = allowedBases[0] || 'http://localhost:3000';
        return `${base.replace(/\/$/, '')}${trimmed}`;
      }
      const target = new URL(trimmed);
      const ok = allowedBases.some((base) => {
        try {
          return new URL(base).origin === target.origin;
        } catch {
          return false;
        }
      });
      if (!ok) {
        this.logger.warn(`Rejected payment returnUrl host: ${target.origin}`);
        return undefined;
      }
      return trimmed;
    } catch {
      this.logger.warn('Rejected invalid payment returnUrl');
      return undefined;
    }
  }

  private async assertOrderOwnedByUser(orderId: string, userId: string): Promise<void> {
    try {
      const order = await this.ordersService.findOne(orderId);
      if (order.userId && userId && order.userId !== userId) {
        throw new ForbiddenException('Order does not belong to this user');
      }
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      throw new BadRequestException(`Order ${orderId} not found`);
    }
  }

  private async assertGatewayEnabled(normalizedCode: string): Promise<void> {
    await this.ensureDefaultGateways();
    const aliases =
      normalizedCode === 'cod'
        ? ['cod', 'cash_on_delivery']
        : normalizedCode === 'oman_net'
          ? ['oman_net', 'omannet']
          : [normalizedCode];

    const rows = await this.gatewayRepository
      .createQueryBuilder('g')
      .where('g.code IN (:...aliases)', { aliases })
      .getMany();

    if (rows.length === 0) {
      // No DB row yet — allow only if factory supports it (dev bootstrapping)
      if (
        normalizedCode !== 'cod' &&
        !this.gatewayFactory.isGatewaySupported(normalizedCode)
      ) {
        throw new BadRequestException(`Unknown payment gateway: ${normalizedCode}`);
      }
      return;
    }

    if (!rows.some((r) => r.isActive)) {
      throw new BadRequestException(
        `Payment gateway "${normalizedCode}" is disabled by admin`,
      );
    }
  }

  private async ensureDefaultGateways(): Promise<void> {
    const defaults: Array<Partial<PaymentGateway>> = [
      {
        name: 'Cash on Delivery',
        code: 'cod',
        isActive: true,
        isSandbox: false,
        displayOrder: 1,
        supportedMethods: ['cash'],
        config: { supported_currencies: ['OMR'] },
      },
      {
        name: 'Stripe',
        code: 'stripe',
        isActive: false,
        isSandbox: true,
        displayOrder: 2,
        supportedMethods: ['card'],
        config: { supported_currencies: ['OMR', 'USD'] },
      },
      {
        name: 'PayPal',
        code: 'paypal',
        isActive: false,
        isSandbox: true,
        displayOrder: 3,
        supportedMethods: ['paypal'],
        config: { supported_currencies: ['OMR', 'USD'] },
      },
      {
        name: 'Thawani',
        code: 'thawani',
        isActive: false,
        isSandbox: true,
        displayOrder: 4,
        supportedMethods: ['card'],
        config: { supported_currencies: ['OMR'] },
      },
      {
        name: 'Oman Net',
        code: 'oman_net',
        isActive: false,
        isSandbox: true,
        displayOrder: 5,
        supportedMethods: ['card'],
        config: { supported_currencies: ['OMR'] },
      },
    ];

    for (const def of defaults) {
      const existing = await this.gatewayRepository.findOne({
        where: { code: def.code },
      });
      if (!existing) {
        // Also skip if legacy cash_on_delivery / omannet already exists
        if (def.code === 'cod') {
          const legacy = await this.gatewayRepository.findOne({
            where: { code: 'cash_on_delivery' },
          });
          if (legacy) continue;
        }
        if (def.code === 'oman_net') {
          const legacy = await this.gatewayRepository.findOne({
            where: { code: 'omannet' },
          });
          if (legacy) continue;
        }
        await this.gatewayRepository.save(this.gatewayRepository.create(def));
      }
    }
  }

  private async updatePaymentStatus(paymentId: string, status: string): Promise<void> {
    await this.paymentRepository.update(paymentId, {
      status: status as DbPaymentStatus,
      updatedAt: new Date(),
    });
    this.logger.debug(`Updated payment ${paymentId} status to ${status}`);
  }

  /**
   * Get a store's connected Stripe account ID from store settings
   */
  private async getStoreConnectedAccount(storeId: string): Promise<string | null> {
    const store = await this.paymentRepository.query(
      `SELECT stripe_connect_account_id FROM store_settings WHERE store_id = $1 LIMIT 1`,
      [storeId]
    );
    return store?.[0]?.stripe_connect_account_id || null;
  }

  /**
   * Get a store's PayPal email from store settings
   */
  private async getStorePaypalEmail(storeId: string): Promise<string | null> {
    const store = await this.paymentRepository.query(
      `SELECT paypal_email FROM store_settings WHERE store_id = $1 LIMIT 1`,
      [storeId]
    );
    return store?.[0]?.paypal_email || null;
  }

  /**
   * Get store-specific commission rate, falling back to platform default
   */
  private async getStoreCommissionRate(storeId: string): Promise<number> {
    const store = await this.paymentRepository.query(
      `SELECT commission_rate FROM store_settings WHERE store_id = $1 LIMIT 1`,
      [storeId]
    );
    const rate = store?.[0]?.commission_rate;
    return rate !== null && rate !== undefined ? parseFloat(rate) : this.defaultCommissionRate;
  }

  /**
   * Process a bank transfer payout to a store's registered bank account
   */
  private async processBankTransfer(storeId: string, dto: CreatePayoutDto): Promise<any> {
    this.logger.log(`Processing bank transfer to store ${storeId}`);

    // Retrieve store bank details for the transfer
    const bankDetails = await this.paymentRepository.query(
      `SELECT bank_name, account_name, account_number, iban, swift_code 
       FROM store_bank_accounts WHERE store_id = $1 AND is_primary = true LIMIT 1`,
      [storeId]
    );

    if (!bankDetails?.[0]) {
      throw new BadRequestException(`Store ${storeId} does not have a registered bank account`);
    }

    return {
      success: true,
      payoutId: `bt-${Date.now()}`,
      status: 'pending',
      estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 business days
      bankDetails: {
        bankName: bankDetails[0].bank_name,
        accountName: bankDetails[0].account_name,
      },
    };
  }

  /**
   * Record a completed payout in the database for audit tracking
   */
  private async recordPayout(storeId: string, dto: CreatePayoutDto, result: any): Promise<void> {
    await this.paymentRepository.query(
      `INSERT INTO payouts (store_id, amount, currency, method, reference_id, status, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        storeId,
        dto.amount,
        dto.currency,
        dto.method,
        result.payoutId || result.payoutBatchId,
        result.status,
        JSON.stringify({ internalReference: dto.internalReference, estimatedArrival: result.estimatedArrival }),
      ]
    );
    this.logger.debug(`Recorded payout for store ${storeId}: ${result.payoutId || result.payoutBatchId}`);
  }
}
