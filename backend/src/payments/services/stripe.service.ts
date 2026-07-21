import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface StripePaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  status?: string;
  amount?: number;
  currency?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface StripeRefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  amount?: number;
  error?: string;
}

export interface StripeCustomerResult {
  success: boolean;
  customerId?: string;
  error?: string;
}

export interface PaymentMethodResult {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';

    if (!secretKey) {
      this.logger.error('STRIPE_SECRET_KEY is not configured');
      throw new InternalServerErrorException('Stripe configuration is missing');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
      maxNetworkRetries: 3,
    });
  }

  /**
   * Create a Stripe PaymentIntent for an order
   */
  async createPaymentIntent(
    orderId: string,
    amount: number,
    currency: string = 'OMR',
    customerId?: string,
    paymentMethodId?: string,
    metadata?: Record<string, any>,
  ): Promise<StripePaymentResult> {
    try {
      // Stripe expects amounts in smallest currency unit (e.g., baisa for OMR)
      const amountInSmallestUnit = this.convertToSmallestUnit(amount, currency);

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amountInSmallestUnit,
        currency: currency.toLowerCase(),
        metadata: {
          orderId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
        description: `Payment for order ${orderId}`,
        confirm: false,
      };

      if (customerId) {
        paymentIntentData.customer = customerId;
      }

      if (paymentMethodId) {
        paymentIntentData.payment_method = paymentMethodId;
        paymentIntentData.confirm = true;
        paymentIntentData.off_session = true;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

      this.logger.log(`PaymentIntent created: ${paymentIntent.id} for order ${orderId}`);

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        status: paymentIntent.status,
        amount,
        currency,
        metadata: paymentIntent.metadata as Record<string, any>,
      };
    } catch (error) {
      this.logger.error(`Failed to create PaymentIntent for order ${orderId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Confirm a PaymentIntent (for manual confirmation flow)
   */
  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<StripePaymentResult> {
    try {
      const params: Stripe.PaymentIntentConfirmParams = {};
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, params);

      this.logger.log(`PaymentIntent confirmed: ${paymentIntentId}, status: ${paymentIntent.status}`);

      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: this.convertFromSmallestUnit(paymentIntent.amount, paymentIntent.currency),
        currency: paymentIntent.currency,
      };
    } catch (error) {
      this.logger.error(`Failed to confirm PaymentIntent ${paymentIntentId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<StripeRefundResult> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = this.convertToSmallestUnit(amount, 'OMR');
      }

      if (reason) {
        refundData.reason = this.mapRefundReason(reason);
      }

      const refund = await this.stripe.refunds.create(refundData);

      this.logger.log(`Refund created: ${refund.id} for PaymentIntent ${paymentIntentId}`);

      return {
        success: refund.status === 'succeeded' || refund.status === 'pending',
        refundId: refund.id,
        status: refund.status,
        amount: amount || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to create refund for ${paymentIntentId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Construct and verify a Stripe webhook event from payload + signature
   */
  constructEvent(payload: Buffer | string, signature: string, secret?: string): Stripe.Event {
    try {
      const webhookSecret = secret || this.webhookSecret;
      if (!webhookSecret) {
        throw new BadRequestException('Webhook secret is not configured');
      }
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<{ success: boolean; orderId?: string; action: string }> {
    const eventType = event.type;
    const eventData = event.data.object as any;

    this.logger.log(`Processing Stripe webhook: ${eventType}, ID: ${event.id}`);

    switch (eventType) {
      case 'payment_intent.succeeded': {
        const orderId = eventData.metadata?.orderId;
        this.logger.log(`Payment succeeded for order: ${orderId}, PaymentIntent: ${eventData.id}`);
        // Emit event for order processing service
        return {
          success: true,
          orderId,
          action: 'payment_succeeded',
        };
      }

      case 'payment_intent.payment_failed': {
        const orderId = eventData.metadata?.orderId;
        const errorMessage = eventData.last_payment_error?.message || 'Payment failed';
        this.logger.warn(`Payment failed for order: ${orderId}, reason: ${errorMessage}`);
        return {
          success: false,
          orderId,
          action: 'payment_failed',
        };
      }

      case 'charge.refunded': {
        const paymentIntentId = eventData.payment_intent;
        const refundAmount = eventData.amount_refunded;
        this.logger.log(`Refund processed for PaymentIntent: ${paymentIntentId}, amount: ${refundAmount}`);
        return {
          success: true,
          action: 'refund_processed',
        };
      }

      case 'charge.dispute.created': {
        this.logger.warn(`Dispute created for charge: ${eventData.id}, reason: ${eventData.reason}`);
        return {
          success: true,
          action: 'dispute_created',
        };
      }

      case 'invoice.payment_succeeded': {
        const subscriptionId = eventData.subscription;
        this.logger.log(`Subscription payment succeeded: ${subscriptionId}`);
        return {
          success: true,
          action: 'subscription_payment_succeeded',
        };
      }

      case 'invoice.payment_failed': {
        const subscriptionId = eventData.subscription;
        this.logger.warn(`Subscription payment failed: ${subscriptionId}`);
        return {
          success: false,
          action: 'subscription_payment_failed',
        };
      }

      default:
        this.logger.log(`Unhandled Stripe webhook event: ${eventType}`);
        return {
          success: true,
          action: 'unhandled',
        };
    }
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(userId: string, email: string, name?: string): Promise<StripeCustomerResult> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name: name || email,
        metadata: {
          userId,
        },
      });

      this.logger.log(`Stripe customer created: ${customer.id} for user ${userId}`);

      return {
        success: true,
        customerId: customer.id,
      };
    } catch (error) {
      this.logger.error(`Failed to create customer for user ${userId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Attach a payment method to a customer
   */
  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      this.logger.log(`Payment method ${paymentMethodId} attached to customer ${customerId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to attach payment method: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<{ success: boolean; methods?: PaymentMethodResult[]; error?: string }> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      const methods: PaymentMethodResult[] = paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            }
          : undefined,
      }));

      return {
        success: true,
        methods,
      };
    } catch (error) {
      this.logger.error(`Failed to get payment methods for ${customerId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a payout to a connected account (for store payouts)
   */
  async createPayout(connectedAccountId: string, amount: number, currency: string = 'OMR'): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      const payout = await this.stripe.transfers.create({
        amount: this.convertToSmallestUnit(amount, currency),
        currency: currency.toLowerCase(),
        destination: connectedAccountId,
      });

      this.logger.log(`Payout created: ${payout.id} to account ${connectedAccountId}`);

      return {
        success: true,
        payoutId: payout.id,
      };
    } catch (error) {
      this.logger.error(`Failed to create payout: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Retrieve a PaymentIntent by ID
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Create a SetupIntent for saving payment methods
   */
  async createSetupIntent(customerId: string): Promise<{ clientSecret: string | null; setupIntentId: string }> {
    const setupIntent = await this.stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    };
  }

  /**
   * Create a connected account for a store (Stripe Connect)
   */
  async createConnectedAccount(storeEmail: string, storeName: string, country: string = 'OM'): Promise<{ accountId: string }> {
    const account = await this.stripe.accounts.create({
      type: 'standard',
      country,
      email: storeEmail,
      business_profile: {
        name: storeName,
      },
    });

    return { accountId: account.id };
  }

  /**
   * Create an account link for onboarding
   */
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<{ url: string }> {
    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  /**
   * Convert amount to smallest currency unit (e.g., OMR -> baisa)
   */
  private convertToSmallestUnit(amount: number, currency: string): number {
    const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd'];
    const currencyLower = currency.toLowerCase();

    if (zeroDecimalCurrencies.includes(currencyLower)) {
      return Math.round(amount);
    }

    // OMR has 3 decimal places (1000 baisa = 1 OMR)
    if (currencyLower === 'omr' || currencyLower === 'bhd' || currencyLower === 'tnd' || currencyLower === 'lyd') {
      return Math.round(amount * 1000);
    }

    // Most currencies have 2 decimal places
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from smallest currency unit back to standard unit
   */
  private convertFromSmallestUnit(amount: number, currency: string): number {
    const currencyLower = currency.toLowerCase();

    if (currencyLower === 'omr' || currencyLower === 'bhd' || currencyLower === 'tnd' || currencyLower === 'lyd') {
      return amount / 1000;
    }

    return amount / 100;
  }

  /**
   * Map refund reason to Stripe's enum
   */
  private mapRefundReason(reason: string): Stripe.RefundCreateParams.Reason {
    const reasonMap: Record<string, Stripe.RefundCreateParams.Reason> = {
      duplicate: 'duplicate',
      fraudulent: 'fraudulent',
      requested_by_customer: 'requested_by_customer',
    };

    return reasonMap[reason] || 'requested_by_customer';
  }

  /**
   * Get the underlying Stripe SDK instance for advanced operations
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}
