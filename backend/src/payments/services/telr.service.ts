import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface TelrPaymentResult {
  success: boolean;
  transactionId?: string;
  orderRef?: string;
  redirectUrl?: string;
  status?: string;
  error?: string;
}

export interface TelrPaymentStatus {
  success: boolean;
  /** True only after a successful Telr API check response */
  verified?: boolean;
  transactionId?: string;
  /** Marketplace order id from Telr cart (ivp_cart) — never trust webhook body */
  orderId?: string;
  status?: string;
  amount?: number;
  currency?: string;
  lastFour?: string;
  authCode?: string;
  error?: string;
}

export interface TelrRefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  error?: string;
}

@Injectable()
export class TelrService {
  private readonly logger = new Logger(TelrService.name);
  private readonly httpClient: AxiosInstance;
  private readonly storeId: string;
  private readonly authKey: string;
  private readonly apiUrl: string;
  private readonly isSandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    this.storeId = this.configService.get<string>('TELR_STORE_ID') || '';
    this.authKey = this.configService.get<string>('TELR_AUTH_KEY') || '';
    this.isSandbox = this.configService.get<string>('TELR_ENVIRONMENT') !== 'production';

    if (!this.storeId || !this.authKey) {
      this.logger.warn('Telr configuration is missing. Telr features will degrade safely.');
    }

    this.apiUrl = this.isSandbox
      ? 'https://secure.telr.com/gateway'
      : 'https://secure.telr.com/gateway';

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    });
  }

  isConfigured(): boolean {
    return Boolean(this.storeId && this.authKey);
  }

  private ensureConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Telr is not configured');
    }
  }

  /**
   * Create a Telr payment
   * Returns a redirect URL for the payment page
   */
  async createPayment(
    orderId: string,
    amount: number,
    currency: string = 'OMR',
    description?: string,
    customerEmail?: string,
    customerName?: string,
    returnUrl?: string,
  ): Promise<TelrPaymentResult> {
    this.ensureConfigured();
    try {
      const payload = {
        ivp_method: 'create',
        ivp_store: this.storeId,
        ivp_authkey: this.authKey,
        ivp_cart: orderId,
        ivp_test: this.isSandbox ? '1' : '0',
        ivp_amount: amount.toFixed(3),
        ivp_currency: currency,
        ivp_desc: description || `Order ${orderId}`,
        return_auth: returnUrl || `${this.configService.get('APP_URL')}/payments/telr/success`,
        return_can: `${this.configService.get('APP_URL')}/payments/telr/cancel`,
        return_decl: `${this.configService.get('APP_URL')}/payments/telr/declined`,
        bill_fname: customerName ? customerName.split(' ')[0] : '',
        bill_sname: customerName ? customerName.split(' ').slice(1).join(' ') : '',
        bill_email: customerEmail || '',
      };

      this.logger.debug(`Creating Telr payment for order ${orderId}`);

      const response = await this.httpClient.post(`${this.apiUrl}/order.json`, new URLSearchParams(payload).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = response.data;

      if (data.order?.url) {
        this.logger.log(`Telr payment created for order ${orderId}, ref: ${data.order.ref}`);

        return {
          success: true,
          transactionId: data.order.ref,
          orderRef: data.order.ref,
          redirectUrl: data.order.url,
          status: 'pending',
        };
      }

      const errorMessage = data?.error?.message || data?.error || 'Payment creation failed';
      this.logger.warn(`Telr payment creation failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    } catch (error) {
      this.logger.error(`Telr payment creation failed for order ${orderId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Check payment status via Telr API
   */
  async checkPayment(transactionId: string): Promise<TelrPaymentStatus> {
    this.ensureConfigured();
    if (!transactionId || typeof transactionId !== 'string') {
      return {
        success: false,
        verified: false,
        error: 'Missing Telr order_ref',
      };
    }
    try {
      const payload = {
        ivp_method: 'check',
        ivp_store: this.storeId,
        ivp_authkey: this.authKey,
        order_ref: transactionId,
      };

      const response = await this.httpClient.post(`${this.apiUrl}/order.json`, new URLSearchParams(payload).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = response.data;

      if (data.order) {
        const order = data.order;
        const statusCode = String(order.status?.code ?? '');
        const paid = statusCode === '3' || statusCode === '1'; // 3 = paid, 1 = authorized
        const cartOrderId =
          order.cartid ||
          order.cart ||
          order.cartId ||
          order.order?.cartid ||
          (typeof order.description === 'string' &&
          order.description.startsWith('Order ')
            ? order.description.replace(/^Order\s+/, '').trim()
            : undefined);

        this.logger.log(`Telr payment status for ${transactionId}: ${order.status?.code}`);

        return {
          success: paid,
          verified: true,
          transactionId: order.transaction?.ref || transactionId,
          orderId: cartOrderId ? String(cartOrderId) : undefined,
          status: order.status?.text || statusCode || 'unknown',
          amount: parseFloat(order.amount) || 0,
          currency: order.currency,
          lastFour: order.transaction?.lastfour,
          authCode: order.transaction?.authcode,
        };
      }

      return {
        success: false,
        verified: true,
        transactionId,
        error: 'Payment not found',
      };
    } catch (error) {
      this.logger.error(`Telr payment check failed for ${transactionId}: ${error.message}`, error.stack);
      return {
        success: false,
        verified: false,
        transactionId,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Process callback from Telr — always re-check with Telr API (never trust payload status).
   */
  async processCallback(data: any): Promise<TelrPaymentStatus> {
    this.ensureConfigured();
    try {
      const order_ref =
        data?.order_ref ||
        data?.order?.ref ||
        data?.OrderRef ||
        null;

      this.logger.log(
        `Telr callback received: ref ${order_ref}, payload status: ${data?.status}`,
      );

      if (!order_ref) {
        return {
          success: false,
          verified: false,
          error: 'Missing Telr order_ref',
        };
      }

      // Fail-closed: ignore forged status/amount from client body
      return await this.checkPayment(String(order_ref));
    } catch (error) {
      this.logger.error(`Telr callback processing failed: ${error.message}`, error.stack);
      return {
        success: false,
        verified: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(transactionId: string): Promise<{ success: boolean; error?: string }> {
    this.ensureConfigured();
    try {
      const payload = {
        ivp_method: 'cancel',
        ivp_store: this.storeId,
        ivp_authkey: this.authKey,
        order_ref: transactionId,
      };

      const response = await this.httpClient.post(`${this.apiUrl}/order.json`, new URLSearchParams(payload).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data?.order?.status?.code === '-1') {
        this.logger.log(`Telr payment cancelled: ${transactionId}`);
        return { success: true };
      }

      return {
        success: false,
        error: response.data?.error?.message || 'Cancel failed',
      };
    } catch (error) {
      this.logger.error(`Telr cancel failed for ${transactionId}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process a refund through Telr
   */
  async createRefund(transactionId: string, amount?: number, reason?: string): Promise<TelrRefundResult> {
    this.ensureConfigured();
    try {
      const payload: any = {
        ivp_method: 'refund',
        ivp_store: this.storeId,
        ivp_authkey: this.authKey,
        order_ref: transactionId,
      };

      if (amount) {
        payload.refund_amount = amount.toFixed(3);
      }

      if (reason) {
        payload.refund_reason = reason;
      }

      const response = await this.httpClient.post(`${this.apiUrl}/order.json`, new URLSearchParams(payload).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = response.data;

      if (data.order?.status?.code === '3' || data.refund?.status === 'success') {
        this.logger.log(`Telr refund processed for ${transactionId}`);

        return {
          success: true,
          refundId: data.refund?.ref || `${transactionId}-refund`,
          status: 'completed',
        };
      }

      return {
        success: false,
        error: data?.error?.message || 'Refund failed',
      };
    } catch (error) {
      this.logger.error(`Telr refund failed for ${transactionId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Capture an authorized payment
   */
  async capturePayment(transactionId: string, amount?: number): Promise<TelrPaymentResult> {
    this.ensureConfigured();
    try {
      const payload: any = {
        ivp_method: 'capture',
        ivp_store: this.storeId,
        ivp_authkey: this.authKey,
        order_ref: transactionId,
      };

      if (amount) {
        payload.capture_amount = amount.toFixed(3);
      }

      const response = await this.httpClient.post(`${this.apiUrl}/order.json`, new URLSearchParams(payload).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data?.order?.status?.code === '3') {
        this.logger.log(`Telr payment captured: ${transactionId}`);

        return {
          success: true,
          transactionId,
          status: 'captured',
        };
      }

      return {
        success: false,
        error: response.data?.error?.message || 'Capture failed',
      };
    } catch (error) {
      this.logger.error(`Telr capture failed for ${transactionId}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Map Telr status codes to readable text
   */
  private mapStatusCode(code: string): string {
    const statusMap: Record<string, string> = {
      '-2': 'declined',
      '-1': 'cancelled',
      '1': 'authorized',
      '2': 'invalid',
      '3': 'paid',
    };
    return statusMap[code] || 'unknown';
  }
}
