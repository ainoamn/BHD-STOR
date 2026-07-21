import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface CCAvenuePaymentResult {
  success: boolean;
  orderId?: string;
  encRequest?: string;
  accessCode?: string;
  gatewayUrl?: string;
  error?: string;
}

export interface CCAvenueVerifyResult {
  success: boolean;
  orderId?: string;
  trackingId?: string;
  bankRefNo?: string;
  orderStatus?: string;
  failureMessage?: string;
  paymentMode?: string;
  cardName?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export interface CCAvenueRefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  error?: string;
}

@Injectable()
export class CCAvenueService {
  private readonly logger = new Logger(CCAvenueService.name);
  private readonly httpClient: AxiosInstance;
  private readonly merchantId: string;
  private readonly workingKey: string;
  private readonly accessCode: string;
  private readonly gatewayUrl: string;
  private readonly isSandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.get<string>('CCAVENUE_MERCHANT_ID') || '';
    this.workingKey = this.configService.get<string>('CCAVENUE_WORKING_KEY') || '';
    this.accessCode = this.configService.get<string>('CCAVENUE_ACCESS_CODE') || '';
    this.isSandbox = this.configService.get<string>('CCAVENUE_ENVIRONMENT') !== 'production';

    if (!this.merchantId || !this.workingKey || !this.accessCode) {
      this.logger.error('CCAvenue configuration is missing');
      throw new InternalServerErrorException('CCAvenue credentials not configured');
    }

    this.gatewayUrl = this.isSandbox
      ? 'https://test.ccavenue.com'
      : 'https://secure.ccavenue.com';

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Initiate a CCAvenue payment
   * Returns encrypted request data to POST to CCAvenue
   */
  async initiatePayment(
    orderId: string,
    amount: number,
    currency: string = 'OMR',
    redirectUrl?: string,
    cancelUrl?: string,
    customerEmail?: string,
    customerName?: string,
    customerPhone?: string,
    billingAddress?: string,
  ): Promise<CCAvenuePaymentResult> {
    try {
      const merchantParam = {
        merchant_id: this.merchantId,
        order_id: orderId,
        currency: currency,
        amount: amount.toFixed(3),
        redirect_url: redirectUrl || `${this.configService.get('APP_URL')}/payments/ccavenue/response`,
        cancel_url: cancelUrl || `${this.configService.get('APP_URL')}/payments/ccavenue/cancel`,
        language: 'EN',
        billing_name: customerName || '',
        billing_address: billingAddress || '',
        billing_country: 'Oman',
        billing_tel: customerPhone || '',
        billing_email: customerEmail || '',
        merchant_param1: `Order_${orderId}`,
        merchant_param2: 'BHD_Marketplace',
        merchant_param3: customerEmail || '',
        integration_type: 'iframe_normal',
      };

      // Convert to query string format
      const merchantData = Object.entries(merchantParam)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&');

      // Encrypt the merchant data
      const encRequest = this.encrypt(merchantData);

      this.logger.log(`CCAvenue payment initiated for order ${orderId}`);

      return {
        success: true,
        orderId,
        encRequest,
        accessCode: this.accessCode,
        gatewayUrl: `${this.gatewayUrl}/transaction/transaction.do?command=initiateTransaction`,
      };
    } catch (error) {
      this.logger.error(`CCAvenue payment initiation failed for order ${orderId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify payment response from CCAvenue
   * CCAvenue returns encrypted response that needs to be decrypted
   */
  async verifyPayment(encResponse: string): Promise<CCAvenueVerifyResult> {
    try {
      // Decrypt the response
      const decryptedData = this.decrypt(encResponse);

      // Parse the response string (format: key=value&key2=value2)
      const responseData = this.parseResponse(decryptedData);

      const orderStatus = responseData.order_status?.toLowerCase();
      const isSuccessful = orderStatus === 'success';

      this.logger.log(`CCAvenue payment verification: order ${responseData.order_id}, status: ${orderStatus}`);

      return {
        success: isSuccessful,
        orderId: responseData.order_id,
        trackingId: responseData.tracking_id,
        bankRefNo: responseData.bank_ref_no,
        orderStatus: responseData.order_status,
        failureMessage: responseData.failure_message,
        paymentMode: responseData.payment_mode,
        cardName: responseData.card_name,
        amount: parseFloat(responseData.amount) || 0,
        currency: responseData.currency,
      };
    } catch (error) {
      this.logger.error(`CCAvenue payment verification failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a refund via CCAvenue API
   */
  async createRefund(params: {
    orderId: string;
    referenceNo: string;
    refundAmount: number;
    refundCurrency?: string;
    refundReason?: string;
  }): Promise<CCAvenueRefundResult> {
    try {
      const refundData = {
        reference_no: params.referenceNo,
        refund_amount: params.refundAmount.toFixed(3),
        refund_currency: params.refundCurrency || 'OMR',
        refund_reason: params.refundReason || 'Customer request',
      };

      const queryString = Object.entries(refundData)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&');

      const encRequest = this.encrypt(queryString);

      const payload = new URLSearchParams({
        access_code: this.accessCode,
        request_type: 'JSON',
        command: 'refundOrder',
        enc_request: encRequest,
      }).toString();

      const response = await this.httpClient.post(`${this.gatewayUrl}/api/transaction/transaction.do`, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const responseData = response.data;

      // CCAvenue returns encrypted response
      if (responseData.enc_response) {
        const decryptedResponse = this.decrypt(responseData.enc_response);
        const refundResponse = JSON.parse(decryptedResponse);

        if (refundResponse.refund_status === 'Success') {
          this.logger.log(`CCAvenue refund processed: ${refundResponse.refund_id} for order ${params.orderId}`);

          return {
            success: true,
            refundId: refundResponse.refund_id,
            status: refundResponse.refund_status,
          };
        }

        return {
          success: false,
          error: refundResponse.reason || 'Refund failed',
        };
      }

      return {
        success: false,
        error: 'Invalid refund response',
      };
    } catch (error) {
      this.logger.error(`CCAvenue refund failed for order ${params.orderId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get transaction status from CCAvenue
   */
  async getTransactionStatus(orderId: string): Promise<CCAvenueVerifyResult> {
    try {
      const requestData = {
        order_no: orderId,
        command: 'orderStatusTracker',
        access_code: this.accessCode,
      };

      const encRequest = this.encrypt(JSON.stringify(requestData));

      const payload = new URLSearchParams({
        access_code: this.accessCode,
        request_type: 'JSON',
        command: 'orderStatusTracker',
        enc_request: encRequest,
      }).toString();

      const response = await this.httpClient.post(`${this.gatewayUrl}/api/transaction/transaction.do`, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.enc_response) {
        const decryptedResponse = this.decrypt(response.data.enc_response);
        const statusData = JSON.parse(decryptedResponse);

        return {
          success: statusData.order_status === 'Shipped' || statusData.order_status === 'Success',
          orderId: statusData.order_no,
          orderStatus: statusData.order_status,
          trackingId: statusData.reference_no,
          amount: parseFloat(statusData.order_amount) || 0,
        };
      }

      return {
        success: false,
        error: 'Failed to get transaction status',
      };
    } catch (error) {
      this.logger.error(`CCAvenue transaction status check failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel a pending order
   */
  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const requestData = {
        order_no: orderId,
        command: 'cancelOrder',
      };

      const encRequest = this.encrypt(JSON.stringify(requestData));

      const payload = new URLSearchParams({
        access_code: this.accessCode,
        request_type: 'JSON',
        command: 'cancelOrder',
        enc_request: encRequest,
      }).toString();

      const response = await this.httpClient.post(`${this.gatewayUrl}/api/transaction/transaction.do`, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.enc_response) {
        const decryptedResponse = this.decrypt(response.data.enc_response);
        const cancelResponse = JSON.parse(decryptedResponse);

        if (cancelResponse.cancel_status === 'Success') {
          this.logger.log(`CCAvenue order cancelled: ${orderId}`);
          return { success: true };
        }

        return {
          success: false,
          error: cancelResponse.reason || 'Cancel failed',
        };
      }

      return {
        success: false,
        error: 'Invalid cancel response',
      };
    } catch (error) {
      this.logger.error(`CCAvenue cancel failed for ${orderId}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Encrypt data using CCAvenue's AES-128 encryption
   */
  private encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(this.workingKey.padEnd(16).slice(0, 16)), iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Prepend IV to encrypted data
    return iv.toString('hex') + encrypted;
  }

  /**
   * Decrypt CCAvenue encrypted response
   */
  private decrypt(encData: string): string {
    try {
      // Extract IV (first 16 bytes = 32 hex chars) and encrypted data
      const iv = Buffer.from(encData.slice(0, 32), 'hex');
      const encrypted = encData.slice(32);

      const decipher = crypto.createDecipheriv(
        'aes-128-cbc',
        Buffer.from(this.workingKey.padEnd(16).slice(0, 16)),
        iv,
      );

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(`CCAvenue decryption failed: ${error.message}`);
      throw new Error('Failed to decrypt CCAvenue response');
    }
  }

  /**
   * Parse CCAvenue response string into object
   */
  private parseResponse(responseString: string): Record<string, string> {
    const result: Record<string, string> = {};
    const pairs = responseString.split('&');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        result[key] = decodeURIComponent(value || '');
      }
    }

    return result;
  }

  /**
   * Get CCAvenue configuration for frontend integration
   */
  getConfig(): { accessCode: string; merchantId: string; gatewayUrl: string; isSandbox: boolean } {
    return {
      accessCode: this.accessCode,
      merchantId: this.merchantId,
      gatewayUrl: this.gatewayUrl,
      isSandbox: this.isSandbox,
    };
  }
}
