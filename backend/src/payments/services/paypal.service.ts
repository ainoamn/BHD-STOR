import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface PayPalOrderResult {
  success: boolean;
  orderId?: string;
  status?: string;
  approvalUrl?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export interface PayPalCaptureResult {
  success: boolean;
  captureId?: string;
  status?: string;
  amount?: number;
  payerEmail?: string;
  error?: string;
}

export interface PayPalRefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  amount?: number;
  error?: string;
}

export interface PayPalWebhookVerificationResult {
  verified: boolean;
  event?: any;
}

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private readonly httpClient: AxiosInstance;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private readonly webhookId: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';
    this.webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID') || '';
    const environment = this.configService.get<string>('PAYPAL_ENVIRONMENT') || 'sandbox';
    this.baseUrl = environment === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    if (!this.clientId || !this.clientSecret) {
      this.logger.error('PayPal credentials are not configured');
      throw new InternalServerErrorException('PayPal configuration is missing');
    }

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.httpClient.interceptors.request.use(async (config) => {
      if (!config.url?.includes('/v1/oauth2/token')) {
        const token = await this.getAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for retry logic
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (error.response?.status === 401 && !config._retry) {
          config._retry = true;
          this.accessToken = null;
          this.tokenExpiry = null;
          const newToken = await this.getAccessToken();
          config.headers.Authorization = `Bearer ${newToken}`;
          return this.httpClient(config);
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Get PayPal OAuth2 access token
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        },
      );

      this.accessToken = response.data.access_token;
      // Set expiry slightly before actual expiry
      const expiresIn = response.data.expires_in || 32400;
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);

      this.logger.debug('PayPal access token obtained');
      return this.accessToken!;
    } catch (error) {
      this.logger.error(`Failed to get PayPal access token: ${error.message}`);
      throw new InternalServerErrorException('Failed to authenticate with PayPal');
    }
  }

  /**
   * Create a PayPal order
   */
  async createOrder(
    orderId: string,
    amount: number,
    currency: string = 'OMR',
    returnUrl?: string,
    cancelUrl?: string,
    description?: string,
  ): Promise<PayPalOrderResult> {
    try {
      const token = await this.getAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: orderId,
            description: description || `Order ${orderId}`,
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(3),
              breakdown: {
                item_total: {
                  currency_code: currency.toUpperCase(),
                  value: amount.toFixed(3),
                },
              },
            },
            custom_id: orderId,
          },
        ],
        application_context: {
          brand_name: 'BHD Oman Marketplace',
          landing_page: 'NO_PREFERENCE',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: returnUrl || `${this.configService.get('APP_URL')}/payments/paypal/success`,
          cancel_url: cancelUrl || `${this.configService.get('APP_URL')}/payments/paypal/cancel`,
        },
      };

      const response = await axios.post(`${this.baseUrl}/v2/checkout/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const paypalOrder = response.data;

      // Find the approval URL
      const approvalLink = paypalOrder.links?.find((link: any) => link.rel === 'approve');

      this.logger.log(`PayPal order created: ${paypalOrder.id} for order ${orderId}`);

      return {
        success: true,
        orderId: paypalOrder.id,
        status: paypalOrder.status,
        approvalUrl: approvalLink?.href,
        amount,
        currency,
      };
    } catch (error) {
      this.logger.error(`Failed to create PayPal order for ${orderId}: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Capture a PayPal order payment
   */
  async captureOrder(paypalOrderId: string): Promise<PayPalCaptureResult> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `capture-${paypalOrderId}-${Date.now()}`,
          },
          timeout: 30000,
        },
      );

      const captureData = response.data;
      const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];

      this.logger.log(`PayPal order captured: ${paypalOrderId}, status: ${captureData.status}`);

      return {
        success: captureData.status === 'COMPLETED',
        captureId: capture?.id,
        status: captureData.status,
        amount: capture?.amount ? parseFloat(capture.amount.value) : undefined,
        payerEmail: captureData.payer?.email_address,
      };
    } catch (error) {
      this.logger.error(`Failed to capture PayPal order ${paypalOrderId}: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.details?.[0]?.description || error.message,
      };
    }
  }

  /**
   * Create a refund for a captured payment
   */
  async createRefund(captureId: string, amount?: number, reason?: string): Promise<PayPalRefundResult> {
    try {
      const token = await this.getAccessToken();

      const refundData: any = {
        note_to_payer: reason || 'Refund requested by customer',
      };

      if (amount) {
        refundData.amount = {
          value: amount.toFixed(3),
          currency_code: 'OMR',
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/v2/payments/captures/${captureId}/refund`,
        refundData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `refund-${captureId}-${Date.now()}`,
          },
          timeout: 30000,
        },
      );

      const refund = response.data;

      this.logger.log(`PayPal refund created: ${refund.id} for capture ${captureId}`);

      return {
        success: refund.status === 'COMPLETED',
        refundId: refund.id,
        status: refund.status,
        amount: amount || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to create PayPal refund for ${captureId}: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.details?.[0]?.description || error.message,
      };
    }
  }

  /**
   * Get order details from PayPal
   */
  async getOrderDetails(paypalOrderId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(`${this.baseUrl}/v2/checkout/orders/${paypalOrderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get PayPal order details for ${paypalOrderId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generic HTTP request helper for PayPal API
   */
  async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', data?: any): Promise<any> {
    try {
      const response = await this.httpClient.request({
        url: endpoint,
        method,
        data,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`PayPal API request failed (${method} ${endpoint}): ${error.message}`);
      throw new BadRequestException(`PayPal API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify PayPal webhook signature
   */
  async verifyWebhookSignature(headers: Record<string, any>, body: any): Promise<PayPalWebhookVerificationResult> {
    try {
      const token = await this.getAccessToken();

      const authAlgo = headers['paypal-auth-algo'] || headers['PAYPAL-AUTH-ALGO'];
      const certUrl = headers['paypal-cert-url'] || headers['PAYPAL-CERT-URL'];
      const transmissionId = headers['paypal-transmission-id'] || headers['PAYPAL-TRANSMISSION-ID'];
      const transmissionSig = headers['paypal-transmission-sig'] || headers['PAYPAL-TRANSMISSION-SIG'];
      const transmissionTime = headers['paypal-transmission-time'] || headers['PAYPAL-TRANSMISSION-TIME'];

      if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
        this.logger.warn('Missing PayPal webhook signature headers');
        return { verified: false };
      }

      const verificationData = {
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: this.webhookId,
        webhook_event: body,
      };

      const response = await axios.post(
        `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
        verificationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const isVerified = response.data.verification_status === 'SUCCESS';

      this.logger.log(`PayPal webhook signature verification: ${isVerified ? 'VERIFIED' : 'FAILED'}`);

      return {
        verified: isVerified,
        event: body,
      };
    } catch (error) {
      this.logger.error(`PayPal webhook verification failed: ${error.message}`);
      return { verified: false };
    }
  }

  /**
   * Handle PayPal webhooks
   */
  async handleWebhook(event: any): Promise<{ success: boolean; orderId?: string; action: string }> {
    const eventType = event.event_type;

    this.logger.log(`Processing PayPal webhook: ${eventType}`);

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED': {
        const orderId = event.resource?.purchase_units?.[0]?.reference_id;
        this.logger.log(`PayPal order approved: ${event.resource?.id}, internal order: ${orderId}`);
        // Auto-capture if approved
        await this.captureOrder(event.resource.id);
        return {
          success: true,
          orderId,
          action: 'order_approved_and_captured',
        };
      }

      case 'CHECKOUT.ORDER.COMPLETED': {
        const orderId = event.resource?.purchase_units?.[0]?.reference_id;
        this.logger.log(`PayPal order completed: ${event.resource?.id}`);
        return {
          success: true,
          orderId,
          action: 'order_completed',
        };
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        const customId = event.resource?.custom_id;
        this.logger.log(`PayPal payment captured: ${event.resource?.id}`);
        return {
          success: true,
          orderId: customId,
          action: 'payment_captured',
        };
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        this.logger.warn(`PayPal payment denied: ${event.resource?.id}`);
        return {
          success: false,
          action: 'payment_denied',
        };
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        this.logger.log(`PayPal payment refunded: ${event.resource?.id}`);
        return {
          success: true,
          action: 'payment_refunded',
        };
      }

      case 'CUSTOMER.DISPUTE.CREATED': {
        this.logger.warn(`PayPal dispute created: ${event.resource?.dispute_id}`);
        return {
          success: true,
          action: 'dispute_created',
        };
      }

      default:
        this.logger.log(`Unhandled PayPal webhook event: ${eventType}`);
        return {
          success: true,
          action: 'unhandled',
        };
    }
  }

  /**
   * Create a payout to a PayPal email (for store payouts)
   */
  async createPayout(recipientEmail: string, amount: number, currency: string = 'OMR', senderBatchId?: string): Promise<{ success: boolean; payoutBatchId?: string; error?: string }> {
    try {
      const token = await this.getAccessToken();

      const payoutData = {
        sender_batch_header: {
          sender_batch_id: senderBatchId || `payout-${Date.now()}`,
          email_subject: 'Payout from BHD Oman Marketplace',
          email_message: 'You have received a payout from BHD Oman Marketplace',
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: amount.toFixed(3),
              currency: currency.toUpperCase(),
            },
            receiver: recipientEmail,
            sender_item_id: `item-${Date.now()}`,
          },
        ],
      };

      const response = await axios.post(`${this.baseUrl}/v1/payments/payouts`, payoutData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      this.logger.log(`PayPal payout created: ${response.data.batch_header?.payout_batch_id}`);

      return {
        success: true,
        payoutBatchId: response.data.batch_header?.payout_batch_id,
      };
    } catch (error) {
      this.logger.error(`Failed to create PayPal payout: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}
