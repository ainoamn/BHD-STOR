import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface ThawaniProduct {
  name: string;
  unit_amount: number;
  quantity: number;
}

export interface ThawaniSessionResult {
  success: boolean;
  sessionId?: string;
  clientReferenceId?: string;
  paymentUrl?: string;
  status?: string;
  error?: string;
}

export interface ThawaniSessionDetails {
  success: boolean;
  sessionId?: string;
  status?: string;
  amount?: number;
  paymentStatus?: string;
  customerEmail?: string;
  error?: string;
}

export interface ThawaniRefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  error?: string;
}

@Injectable()
export class ThawaniService {
  private readonly logger = new Logger(ThawaniService.name);
  private readonly httpClient: AxiosInstance;
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly apiUrl: string;
  private readonly publishableKey: string;
  private readonly isSandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('THAWANI_SECRET_KEY') || '';
    this.publicKey = this.configService.get<string>('THAWANI_PUBLIC_KEY') || '';
    this.publishableKey = this.configService.get<string>('THAWANI_PUBLISHABLE_KEY') || '';
    this.isSandbox = this.configService.get<string>('THAWANI_ENVIRONMENT') !== 'production';

    if (!this.secretKey || !this.publicKey) {
      this.logger.error('Thawani configuration is missing');
      throw new InternalServerErrorException('Thawani API keys not configured');
    }

    this.apiUrl = this.isSandbox
      ? 'https://uatcheckout.thawani.om'
      : 'https://checkout.thawani.om';

    this.httpClient = axios.create({
      baseURL: `${this.apiUrl}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'thawani-api-key': this.secretKey,
      },
    });
  }

  /**
   * Create a Thawani checkout session
   */
  async createSession(
    orderId: string,
    amount: number,
    products: ThawaniProduct[],
    returnUrl?: string,
    customerEmail?: string,
    customerName?: string,
    metadata?: Record<string, any>,
  ): Promise<ThawaniSessionResult> {
    try {
      // Thawani expects amount in baisa (smallest OMR unit, 1000 baisa = 1 OMR)
      const amountInBaisa = Math.round(amount * 1000);

      // Build line items from products
      const lineItems = products.map((product) => ({
        name: product.name,
        unit_amount: Math.round(product.unit_amount * 1000), // Convert to baisa
        quantity: product.quantity,
      }));

      const sessionData = {
        client_reference_id: orderId,
        mode: 'payment',
        products: lineItems,
        success_url: returnUrl || `${this.configService.get('APP_URL')}/payments/thawani/success?session_id={checkout_session_id}`,
        cancel_url: `${this.configService.get('APP_URL')}/payments/thawani/cancel`,
        metadata: {
          order_id: orderId,
          customer_name: customerName || '',
          ...metadata,
        },
        ...(customerEmail && { customer_email: customerEmail }),
      };

      this.logger.debug(`Creating Thawani session for order ${orderId}`);

      const response = await this.httpClient.post('/checkout/session', sessionData);

      if (response.data?.data?.session_id) {
        const sessionData = response.data.data;
        const paymentUrl = `${this.apiUrl}/pay/${sessionData.session_id}?key=${this.publishableKey}`;

        this.logger.log(`Thawani session created: ${sessionData.session_id} for order ${orderId}`);

        return {
          success: true,
          sessionId: sessionData.session_id,
          clientReferenceId: sessionData.client_reference_id,
          paymentUrl,
          status: 'created',
        };
      }

      this.logger.warn(`Thawani session creation failed: ${response.data?.description}`);
      return {
        success: false,
        error: response.data?.description || 'Failed to create checkout session',
      };
    } catch (error) {
      this.logger.error(`Thawani session creation failed for order ${orderId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  /**
   * Retrieve a Thawani session by ID
   */
  async retrieveSession(sessionId: string): Promise<ThawaniSessionDetails> {
    try {
      const response = await this.httpClient.get(`/checkout/session/${sessionId}`);

      if (response.data?.data) {
        const session = response.data.data;

        return {
          success: true,
          sessionId: session.session_id,
          status: session.status,
          amount: session.total_amount ? session.total_amount / 1000 : 0, // Convert from baisa
          paymentStatus: session.payment_status,
          customerEmail: session.customer_email,
        };
      }

      return {
        success: false,
        error: 'Session not found',
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve Thawani session ${sessionId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  /**
   * Process Thawani webhook events
   */
  async processWebhook(event: any): Promise<{ success: boolean; orderId?: string; action: string }> {
    try {
      const eventType = event.event || event.type;
      const data = event.data || {};

      this.logger.log(`Processing Thawani webhook: ${eventType}`);

      switch (eventType) {
        case 'checkout_session.completed': {
          const orderId = data.client_reference_id;
          this.logger.log(`Thawani payment completed for order ${orderId}, session: ${data.session_id}`);
          return {
            success: true,
            orderId,
            action: 'payment_completed',
          };
        }

        case 'checkout_session.payment_failed': {
          const orderId = data.client_reference_id;
          this.logger.warn(`Thawani payment failed for order ${orderId}, session: ${data.session_id}`);
          return {
            success: false,
            orderId,
            action: 'payment_failed',
          };
        }

        case 'payment.captured': {
          const orderId = data.client_reference_id;
          this.logger.log(`Thawani payment captured for order ${orderId}`);
          return {
            success: true,
            orderId,
            action: 'payment_captured',
          };
        }

        case 'refund.created': {
          this.logger.log(`Thawani refund created: ${data.refund_id}`);
          return {
            success: true,
            action: 'refund_created',
          };
        }

        default:
          this.logger.log(`Unhandled Thawani webhook event: ${eventType}`);
          return {
            success: true,
            action: 'unhandled',
          };
      }
    } catch (error) {
      this.logger.error(`Thawani webhook processing error: ${error.message}`, error.stack);
      return {
        success: false,
        action: 'error',
      };
    }
  }

  /**
   * Create a refund for a Thawani payment
   */
  async createRefund(paymentId: string, amount?: number, reason?: string): Promise<ThawaniRefundResult> {
    try {
      const refundData: any = {
        payment_intent: paymentId,
        reason: reason || 'requested_by_customer',
      };

      if (amount) {
        refundData.amount = Math.round(amount * 1000); // Convert to baisa
      }

      const response = await this.httpClient.post('/refunds', refundData);

      if (response.data?.data?.refund_id) {
        this.logger.log(`Thawani refund created: ${response.data.data.refund_id} for payment ${paymentId}`);

        return {
          success: true,
          refundId: response.data.data.refund_id,
          status: response.data.data.status,
        };
      }

      return {
        success: false,
        error: response.data?.description || 'Refund failed',
      };
    } catch (error) {
      this.logger.error(`Thawani refund failed for ${paymentId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  /**
   * Cancel a checkout session
   */
  async cancelSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.httpClient.put(`/checkout/session/${sessionId}/cancel`, {});

      if (response.data?.success) {
        this.logger.log(`Thawani session cancelled: ${sessionId}`);
        return { success: true };
      }

      return {
        success: false,
        error: response.data?.description || 'Failed to cancel session',
      };
    } catch (error) {
      this.logger.error(`Failed to cancel Thawani session ${sessionId}: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  /**
   * List all checkout sessions
   */
  async listSessions(limit: number = 10, skip: number = 0): Promise<any> {
    try {
      const response = await this.httpClient.get('/checkout/session', {
        params: { limit, skip },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to list Thawani sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Thawani payment configuration for frontend
   */
  getConfig(): { publishableKey: string; apiUrl: string; isSandbox: boolean } {
    return {
      publishableKey: this.publishableKey,
      apiUrl: this.apiUrl,
      isSandbox: this.isSandbox,
    };
  }

  /**
   * Verify webhook signature (HMAC-SHA256, timing-safe).
   * Prefer THAWANI_WEBHOOK_SECRET; fall back to THAWANI_SECRET_KEY.
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      const crypto = require('crypto') as typeof import('crypto');
      const secret =
        this.configService.get<string>('THAWANI_WEBHOOK_SECRET') ||
        this.secretKey;
      if (!secret || !signature) {
        return false;
      }

      const expectedSignature = this.generateWebhookSignature(payload, secret);
      const provided = String(signature).trim();
      const a = Buffer.from(expectedSignature, 'utf8');
      const b = Buffer.from(provided, 'utf8');
      if (a.length !== b.length) {
        return false;
      }
      return crypto.timingSafeEqual(a, b);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate webhook signature for verification
   */
  private generateWebhookSignature(payload: any, secret?: string): string {
    const crypto = require('crypto') as typeof import('crypto');
    const key = secret || this.secretKey;
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }
}
