import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  // Stripe Configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    currency: 'omr',
    apiVersion: '2023-10-16' as const,
  },

  // PayPal Configuration
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
    apiUrl: process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com',
    currency: 'OMR',
  },

  // Oman Net Configuration
  omanNet: {
    merchantId: process.env.OMAN_NET_MERCHANT_ID || '',
    apiKey: process.env.OMAN_NET_API_KEY || '',
    gatewayUrl: process.env.OMAN_NET_GATEWAY_URL || 'https://testsecure.oman.net.com',
    currency: '512',
    language: 'ENG',
  },

  // Thawani Configuration
  thawani: {
    apiKey: process.env.THAWANI_API_KEY || '',
    publishableKey: process.env.THAWANI_PUBLISHABLE_KEY || '',
    environment: process.env.THAWANI_ENVIRONMENT || 'sandbox',
    apiUrl: process.env.THAWANI_API_URL || 'https://uatcheckout.thawani.om',
    currency: 'OMR',
  },

  // Telr Configuration
  telr: {
    storeId: process.env.TELR_STORE_ID || '',
    authKey: process.env.TELR_AUTH_KEY || '',
    testMode: process.env.TELR_TEST_MODE === '1',
    apiUrl: process.env.TELR_API_URL || 'https://secure.telr.com/gateway/order.json',
    currency: 'OMR',
  },

  // CCAvenue Configuration
  ccavenue: {
    merchantId: process.env.CCAVENUE_MERCHANT_ID || '',
    accessCode: process.env.CCAVENUE_ACCESS_CODE || '',
    workingKey: process.env.CCAVENUE_WORKING_KEY || '',
    apiUrl: process.env.CCAVENUE_API_URL || 'https://test.ccavenue.com',
    currency: 'OMR',
  },
}));

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  publishableKey: string;
  currency: string;
  apiVersion: string;
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: string;
  apiUrl: string;
  currency: string;
}

export interface OmanNetConfig {
  merchantId: string;
  apiKey: string;
  gatewayUrl: string;
  currency: string;
  language: string;
}

export interface ThawaniConfig {
  apiKey: string;
  publishableKey: string;
  environment: string;
  apiUrl: string;
  currency: string;
}

export interface TelrConfig {
  storeId: string;
  authKey: string;
  testMode: boolean;
  apiUrl: string;
  currency: string;
}

export interface CCAvenueConfig {
  merchantId: string;
  accessCode: string;
  workingKey: string;
  apiUrl: string;
  currency: string;
}

export interface PaymentConfig {
  stripe: StripeConfig;
  paypal: PayPalConfig;
  omanNet: OmanNetConfig;
  thawani: ThawaniConfig;
  telr: TelrConfig;
  ccavenue: CCAvenueConfig;
}
