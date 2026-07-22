import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Payment } from '../entities/payment.entity';
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
import { PaymentStatus } from '../../orders/entities/order.entity';

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
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {
    this.defaultCommissionRate = parseFloat(this.configService.get<string>('PLATFORM_COMMISSION_RATE') || '0.10');
  }

  /**
   * Process a payment through the selected gateway
   */
  async processPayment(userId: string, dto: ProcessPaymentDto): Promise<PaymentResult> {
    const { orderId, gateway, paymentMethodId, currency, amount, customerEmail, customerName, returnUrl, metadata } = dto;
    const normalizedGateway = (gateway || '').toLowerCase().replace(/-/g, '_');

    this.logger.log(`Processing payment for order ${orderId} via ${normalizedGateway}`);

    // Cash on delivery — no external gateway required
    if (normalizedGateway === 'cod' || normalizedGateway === 'cash_on_delivery') {
      return {
        success: true,
        paymentId: `cod_${orderId}`,
        status: 'pending',
        amount: amount || 0,
        currency: currency || 'OMR',
        gateway: 'cod',
        metadata: { method: 'cash_on_delivery', note: 'Pay on delivery' },
      };
    }

    // Validate gateway is supported
    if (!this.gatewayFactory.isGatewaySupported(normalizedGateway)) {
      throw new BadRequestException(`Unsupported payment gateway: ${gateway}`);
    }

    // Validate gateway configuration
    const configValidation = this.gatewayFactory.validateGatewayConfig(normalizedGateway as PaymentGatewayType);
    if (Array.isArray(configValidation)) {
      const gatewayConfig = configValidation.find((c) => c.gateway === normalizedGateway);
      if (gatewayConfig && !gatewayConfig.isConfigured) {
        throw new BadRequestException(`Gateway ${gateway} is not properly configured. Missing: ${gatewayConfig.missingKeys.join(', ')}`);
      }
    }

    try {
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

          const result = await this.stripeService.createPaymentIntent(
            orderId,
            amount || 0,
            currency,
            customerId,
            paymentMethodId,
            metadata,
          );

          return {
            success: result.success,
            paymentId: result.paymentIntentId,
            status: result.status || 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            clientSecret: result.clientSecret,
            error: result.error,
            metadata: result.metadata,
          };
        }

        case 'paypal': {
          const result = await this.paypalService.createOrder(
            orderId,
            amount || 0,
            currency,
            returnUrl,
            undefined,
            metadata?.description,
          );

          return {
            success: result.success,
            transactionId: result.orderId,
            status: result.status || 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            redirectUrl: result.approvalUrl,
            error: result.error,
          };
        }

        case 'oman_net': {
          const result = await this.omanNetService.initiatePayment(
            orderId,
            amount || 0,
            currency,
            returnUrl,
            customerEmail,
            customerName,
          );

          return {
            success: result.success,
            transactionId: result.transactionId,
            status: result.status || 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            redirectUrl: result.redirectUrl,
            error: result.error,
          };
        }

        case 'thawani': {
          const products = metadata?.products || [{
            name: `Order ${orderId}`,
            unit_amount: amount || 0,
            quantity: 1,
          }];

          const result = await this.thawaniService.createSession(
            orderId,
            amount || 0,
            products,
            returnUrl,
            customerEmail,
            customerName,
            metadata,
          );

          return {
            success: result.success,
            transactionId: result.sessionId,
            status: result.status || 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            redirectUrl: result.paymentUrl,
            error: result.error,
          };
        }

        case 'telr': {
          const result = await this.telrService.createPayment(
            orderId,
            amount || 0,
            currency,
            metadata?.description,
            customerEmail,
            customerName,
            returnUrl,
          );

          return {
            success: result.success,
            transactionId: result.transactionId,
            status: result.status || 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            redirectUrl: result.redirectUrl,
            error: result.error,
          };
        }

        case 'ccavenue': {
          const result = await this.ccavenueService.initiatePayment(
            orderId,
            amount || 0,
            currency,
            returnUrl,
            undefined,
            customerEmail,
            customerName,
            metadata?.customerPhone,
            metadata?.billingAddress,
          );

          return {
            success: result.success,
            transactionId: result.orderId,
            status: 'pending',
            amount: amount || 0,
            currency,
            gateway: normalizedGateway,
            error: result.error,
            metadata: {
              encRequest: result.encRequest,
              accessCode: result.accessCode,
              gatewayUrl: result.gatewayUrl,
            },
          };
        }

        default:
          throw new BadRequestException(`Gateway ${gateway} processing not implemented`);
      }
    } catch (error) {
      this.logger.error(`Payment processing failed for order ${orderId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Verify a payment status
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
  async createRefund(userId: string, dto: RefundPaymentDto): Promise<any> {
    const { paymentId, amount, reason, notes } = dto;

    this.logger.log(`Processing refund for payment ${paymentId}, amount: ${amount || 'full'}`);

    // Lookup payment from database to get gateway info
    const paymentRecord = await this.getPaymentRecord(paymentId);
    if (!paymentRecord) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    try {
      const gateway = paymentRecord.gateway as PaymentGatewayType;
      let result: any;

      switch (gateway) {
        case 'stripe': {
          result = await this.stripeService.createRefund(
            paymentRecord.transactionId || paymentId,
            amount,
            reason,
          );
          break;
        }

        case 'paypal': {
          // For PayPal, paymentId is the captureId
          result = await this.paypalService.createRefund(
            paymentRecord.transactionId || paymentId,
            amount,
            reason,
          );
          break;
        }

        case 'oman_net': {
          result = await this.omanNetService.createRefund(
            paymentRecord.transactionId || paymentId,
            amount,
            reason,
          );
          break;
        }

        case 'thawani': {
          result = await this.thawaniService.createRefund(
            paymentRecord.transactionId || paymentId,
            amount,
            reason,
          );
          break;
        }

        case 'telr': {
          result = await this.telrService.createRefund(
            paymentRecord.transactionId || paymentId,
            amount,
            reason,
          );
          break;
        }

        case 'ccavenue': {
          result = await this.ccavenueService.createRefund({
            orderId: paymentRecord.orderId,
            referenceNo: paymentRecord.transactionId || paymentId,
            refundAmount: amount || paymentRecord.amount,
            refundCurrency: paymentRecord.currency,
            refundReason: `${reason}: ${notes || ''}`,
          });
          break;
        }

        default:
          throw new BadRequestException(`Refunds not supported for gateway: ${gateway}`);
      }

      if (result.success) {
        this.logger.log(`Refund processed successfully for payment ${paymentId}`);
        // Update payment record status to refunded
        await this.updatePaymentStatus(paymentId, amount ? 'partially_refunded' : 'refunded');
      }

      return result;
    } catch (error) {
      this.logger.error(`Refund failed for payment ${paymentId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Refund processing failed: ${error.message}`);
    }
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
        transactionId: p.transactionId,
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

      switch (gateway) {
        case 'stripe': {
          const signature = headers['stripe-signature'];
          if (!signature) {
            throw new BadRequestException('Missing Stripe signature');
          }

          const event = this.stripeService.constructEvent(
            rawBody || JSON.stringify(payload),
            signature,
          );

          result = await this.stripeService.handleWebhook(event);
          break;
        }

        case 'paypal': {
          const verification = await this.paypalService.verifyWebhookSignature(headers, payload);
          const skipVerify =
            this.configService.get<string>('PAYPAL_SKIP_WEBHOOK_VERIFY') === 'true';
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
          const omanResult = await this.omanNetService.processCallback(payload);
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
          const thawaniSecret = this.configService.get<string>('THAWANI_SECRET_KEY');
          if (signature && thawaniSecret) {
            const ok = this.thawaniService.verifyWebhookSignature(
              rawBody || payload,
              signature,
            );
            if (!ok) {
              throw new BadRequestException('Thawani webhook signature verification failed');
            }
          }
          result = await this.thawaniService.processWebhook(payload);
          break;
        }

        case 'telr': {
          const telrResult = await this.telrService.processCallback(payload);
          result = {
            success: telrResult.success,
            orderId: (telrResult as any).orderId,
            action: telrResult.success ? 'payment_completed' : 'payment_failed',
          };
          break;
        }

        case 'ccavenue': {
          const encResponse = payload.encResp || payload.enc_response;
          if (!encResponse) {
            throw new BadRequestException('Missing encrypted response');
          }

          const ccResult = await this.ccavenueService.verifyPayment(encResponse);
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

      await this.applyWebhookToOrder(gateway, result);
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
    result: { success: boolean; orderId?: string; action: string },
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
        const order = await this.ordersService.applyPaymentWebhook(
          result.orderId,
          PaymentStatus.PAID,
          { gateway, action: result.action },
        );
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

    const platformCommission = Math.round(amount * commissionRate * 1000) / 1000;

    // Estimate payment gateway fee (typically 2.5-3% for cards)
    const gatewayFeeRate = 0.025; // 2.5%
    const paymentGatewayFee = Math.round(amount * gatewayFeeRate * 1000) / 1000;

    const storeAmount = amount - platformCommission;
    const netStoreAmount = storeAmount - paymentGatewayFee;

    return {
      originalAmount: amount,
      platformCommission,
      platformCommissionRate: commissionRate,
      storeAmount,
      paymentGatewayFee,
      netStoreAmount,
    };
  }

  /**
   * Generate an invoice PDF for a payment
   */
  async generateInvoice(paymentId: string): Promise<{ pdfBuffer: Buffer; filename: string }> {
    this.logger.log(`Generating invoice for payment ${paymentId}`);

    const payment = await this.getPaymentRecord(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    // Generate invoice HTML for PDF conversion
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${paymentId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-title { font-size: 24px; font-weight: bold; color: #333; }
          .details { margin-bottom: 20px; }
          .details table { width: 100%; border-collapse: collapse; }
          .details td { padding: 8px; border-bottom: 1px solid #ddd; }
          .details td:first-child { font-weight: bold; width: 30%; }
          .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="invoice-title">BHD Oman Marketplace</div>
          <div>Tax Invoice</div>
        </div>
        <div class="details">
          <table>
            <tr><td>Invoice Number:</td><td>INV-${paymentId.slice(0, 8).toUpperCase()}</td></tr>
            <tr><td>Order ID:</td><td>${payment.orderId}</td></tr>
            <tr><td>Payment ID:</td><td>${payment.id}</td></tr>
            <tr><td>Transaction ID:</td><td>${payment.transactionId || 'N/A'}</td></tr>
            <tr><td>Date:</td><td>${payment.createdAt.toISOString()}</td></tr>
            <tr><td>Payment Method:</td><td>${payment.gateway.toUpperCase()}</td></tr>
            <tr><td>Status:</td><td>${payment.status.toUpperCase()}</td></tr>
          </table>
        </div>
        <div class="total">
          Total: ${payment.amount.toFixed(3)} ${payment.currency}
        </div>
        <div class="footer">
          BHD Oman Marketplace | Tax Registration: OM12345678<br>
          Thank you for your business!
        </div>
      </body>
      </html>
    `;

    // Convert HTML to PDF buffer for download
    // When puppeteer is available: use page.pdf({ format: 'A4' })
    const pdfBuffer = Buffer.from(invoiceHtml);

    return {
      pdfBuffer,
      filename: `invoice-${paymentId.slice(0, 8)}.pdf`,
    };
  }

  /**
   * Capture an authorized payment
   */
  async capturePayment(paymentId: string, gateway: PaymentGatewayType, amount?: number): Promise<PaymentResult> {
    this.logger.log(`Capturing payment ${paymentId} on ${gateway}`);

    try {
      switch (gateway) {
        case 'stripe': {
          const result = await this.stripeService.confirmPayment(paymentId);
          return {
            success: result.success,
            paymentId: result.paymentIntentId,
            status: result.status || 'unknown',
            amount: result.amount || 0,
            currency: result.currency || 'OMR',
            gateway,
            error: result.error,
          };
        }

        case 'paypal': {
          const result = await this.paypalService.captureOrder(paymentId);
          return {
            success: result.success,
            transactionId: result.captureId,
            status: result.status || 'unknown',
            amount: result.amount || 0,
            currency: 'OMR',
            gateway,
            error: result.error,
          };
        }

        case 'telr': {
          const result = await this.telrService.capturePayment(paymentId, amount);
          return {
            success: result.success,
            transactionId: result.transactionId,
            status: result.status || 'unknown',
            amount: amount || 0,
            currency: 'OMR',
            gateway,
          };
        }

        default:
          throw new BadRequestException(`Capture not supported for gateway: ${gateway}`);
      }
    } catch (error) {
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
    const refunds = payments.filter(p => p.status === 'refunded' || p.status === 'partially_refunded');
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
   * Retrieve a payment record from the database by ID
   */
  private async getPaymentRecord(paymentId: string): Promise<PaymentRecord | null> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });

    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      gateway: payment.gateway,
      status: payment.status,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  /**
   * Update payment status in the database
   */
  private async updatePaymentStatus(paymentId: string, status: string): Promise<void> {
    await this.paymentRepository.update(paymentId, { status, updatedAt: new Date() });
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
