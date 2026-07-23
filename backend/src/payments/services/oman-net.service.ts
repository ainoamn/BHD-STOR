import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface OmanNetPaymentResult {
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
  status?: string;
  error?: string;
}

export interface OmanNetVerifyResult {
  success: boolean;
  transactionId?: string;
  orderId?: string;
  amount?: number;
  status?: string;
  cardNumber?: string;
  error?: string;
}

export interface OmanNetRefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  error?: string;
}

@Injectable()
export class OmanNetService {
  private readonly logger = new Logger(OmanNetService.name);
  private readonly httpClient: AxiosInstance;
  private readonly merchantId: string;
  private readonly apiKey: string;
  private readonly gatewayUrl: string;
  private readonly returnUrl: string;
  private readonly isSandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.get<string>('OMAN_NET_MERCHANT_ID') || '';
    this.apiKey = this.configService.get<string>('OMAN_NET_API_KEY') || '';
    this.isSandbox = this.configService.get<string>('OMAN_NET_ENVIRONMENT') !== 'production';
    this.gatewayUrl = this.isSandbox
      ? 'https://test.omannet.com/api/v1'
      : 'https://secure.omannet.com/api/v1';
    this.returnUrl = this.configService.get<string>('APP_URL') || 'https://bhd.marketplace.com';

    if (!this.merchantId || !this.apiKey) {
      this.logger.warn('Oman Net configuration is missing. Oman Net features will degrade safely.');
    }

    this.httpClient = axios.create({
      baseURL: this.gatewayUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Merchant-ID': this.merchantId,
      },
    });

    // Add auth header interceptor
    this.httpClient.interceptors.request.use((config) => {
      const timestamp = new Date().toISOString();
      const signature = this.generateSignature(config.data || '', timestamp);
      config.headers['X-Timestamp'] = timestamp;
      config.headers['X-Signature'] = signature;
      return config;
    });
  }

  isConfigured(): boolean {
    return Boolean(this.merchantId && this.apiKey);
  }

  private ensureConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Oman Net is not configured');
    }
  }

  /**
   * Initiate an Oman Net payment
   * Returns a redirect URL that the customer must be sent to
   */
  async initiatePayment(
    orderId: string,
    amount: number,
    currency: string = 'OMR',
    returnUrl?: string,
    customerEmail?: string,
    customerName?: string,
  ): Promise<OmanNetPaymentResult> {
    this.ensureConfigured();
    try {
      const payload = {
        merchant_id: this.merchantId,
        order_id: orderId,
        amount: amount.toFixed(3),
        currency: currency.toUpperCase(),
        return_url: returnUrl || `${this.returnUrl}/payments/oman-net/callback`,
        cancel_url: `${this.returnUrl}/payments/oman-net/cancel`,
        customer_email: customerEmail || '',
        customer_name: customerName || '',
        description: `Payment for order ${orderId}`,
        locale: 'en',
        timestamp: new Date().toISOString(),
      };

      // Generate hash for integrity
      const hash = this.generatePaymentHash(payload);
      (payload as any).hash = hash;

      const response = await this.httpClient.post('/payments/initiate', payload);

      if (response.data.status === 'success' && response.data.redirect_url) {
        this.logger.log(`Oman Net payment initiated for order ${orderId}, transaction: ${response.data.transaction_id}`);

        return {
          success: true,
          transactionId: response.data.transaction_id,
          redirectUrl: response.data.redirect_url,
          status: 'pending',
        };
      }

      this.logger.warn(`Oman Net initiation failed: ${response.data.message}`);
      return {
        success: false,
        error: response.data.message || 'Payment initiation failed',
      };
    } catch (error) {
      this.logger.error(`Oman Net payment initiation failed for order ${orderId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Verify an Oman Net payment status
   */
  async verifyPayment(transactionId: string): Promise<OmanNetVerifyResult> {
    this.ensureConfigured();
    try {
      const payload = {
        merchant_id: this.merchantId,
        transaction_id: transactionId,
      };

      const response = await this.httpClient.post('/payments/verify', payload);

      if (response.data.status === 'success') {
        this.logger.log(`Oman Net payment verified: ${transactionId}, status: ${response.data.payment_status}`);

        return {
          success: response.data.payment_status === 'completed',
          transactionId,
          orderId: response.data.order_id,
          amount: parseFloat(response.data.amount),
          status: response.data.payment_status,
          cardNumber: response.data.card_number,
        };
      }

      return {
        success: false,
        transactionId,
        error: response.data.message || 'Verification failed',
      };
    } catch (error) {
      this.logger.error(`Oman Net verification failed for ${transactionId}: ${error.message}`, error.stack);
      return {
        success: false,
        transactionId,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Process callback from Oman Net gateway
   */
  async processCallback(data: any): Promise<OmanNetVerifyResult> {
    this.ensureConfigured();
    try {
      const { transaction_id, order_id, status, amount, hash, card_number } = data;

      if (!hash) {
        this.logger.error(`Oman Net callback missing hash for order ${order_id}`);
        return {
          success: false,
          error: 'Missing callback hash - rejecting unsigned callback',
        };
      }

      // Verify callback integrity (fail-closed)
      const expectedHash = this.generateCallbackHash(data);
      if (hash !== expectedHash) {
        this.logger.error(`Oman Net callback hash mismatch for order ${order_id}`);
        return {
          success: false,
          error: 'Hash verification failed - possible tampering',
        };
      }

      this.logger.log(`Oman Net callback received: order ${order_id}, status: ${status}`);

      // Re-verify with API to be certain
      if (status === 'success' || status === 'completed') {
        const verifyResult = await this.verifyPayment(transaction_id);
        return verifyResult;
      }

      return {
        success: status === 'success' || status === 'completed',
        transactionId: transaction_id,
        orderId: order_id,
        amount: parseFloat(amount) || 0,
        status: status,
        cardNumber: card_number,
      };
    } catch (error) {
      this.logger.error(`Oman Net callback processing failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a refund via Oman Net
   */
  async createRefund(transactionId: string, amount?: number, reason?: string): Promise<OmanNetRefundResult> {
    this.ensureConfigured();
    try {
      const payload = {
        merchant_id: this.merchantId,
        transaction_id: transactionId,
        amount: amount ? amount.toFixed(3) : undefined,
        reason: reason || 'Customer request',
      };

      const response = await this.httpClient.post('/payments/refund', payload);

      if (response.data.status === 'success') {
        this.logger.log(`Oman Net refund processed: ${response.data.refund_id} for transaction ${transactionId}`);

        return {
          success: true,
          refundId: response.data.refund_id,
          status: response.data.refund_status,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Refund failed',
      };
    } catch (error) {
      this.logger.error(`Oman Net refund failed for ${transactionId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(transactionId: string): Promise<any> {
    this.ensureConfigured();
    try {
      const response = await this.httpClient.get(`/payments/${transactionId}`, {
        params: {
          merchant_id: this.merchantId,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get transaction details for ${transactionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate HMAC signature for API requests
   */
  private generateSignature(data: any, timestamp: string): string {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const sigData = `${this.merchantId}:${timestamp}:${payload}`;
    return crypto.createHmac('sha256', this.apiKey).update(sigData).digest('hex');
  }

  /**
   * Generate payment hash for integrity verification
   */
  private generatePaymentHash(payload: any): string {
    const orderedKeys = Object.keys(payload).sort();
    const hashString = orderedKeys.map((k) => `${k}=${payload[k]}`).join('&');
    return crypto.createHmac('sha256', this.apiKey).update(hashString).digest('hex');
  }

  /**
   * Generate callback hash verification
   */
  private generateCallbackHash(data: any): string {
    const { hash, ...dataWithoutHash } = data;
    void hash;
    const orderedKeys = Object.keys(dataWithoutHash).sort();
    const hashString = orderedKeys.map((k) => `${k}=${dataWithoutHash[k]}`).join('&');
    return crypto.createHmac('sha256', this.apiKey).update(hashString).digest('hex');
  }
}
