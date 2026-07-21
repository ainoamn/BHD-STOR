import { registerAs } from '@nestjs/config';

export default registerAs('shipping', () => ({
  // Oman Post Configuration
  omanPost: {
    apiKey: process.env.OMAN_POST_API_KEY || '',
    apiUrl: process.env.OMAN_POST_API_URL || 'https://api.omanpost.om',
    timeout: 30000,
    maxWeightKg: 30,
    insuranceEnabled: true,
    trackingEnabled: true,
  },

  // Aramex Configuration
  aramex: {
    accountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || '',
    accountPin: process.env.ARAMEX_ACCOUNT_PIN || '',
    username: process.env.ARAMEX_USERNAME || '',
    password: process.env.ARAMEX_PASSWORD || '',
    apiUrl: process.env.ARAMEX_API_URL || 'https://ws.aramex.net',
    version: 'v1',
    timeout: 30000,
    maxWeightKg: 50,
    insuranceEnabled: true,
    codEnabled: true,
  },

  // DHL Configuration
  dhl: {
    apiKey: process.env.DHL_API_KEY || '',
    apiSecret: process.env.DHL_API_SECRET || '',
    accountNumber: process.env.DHL_ACCOUNT_NUMBER || '',
    apiUrl: process.env.DHL_API_URL || 'https://api-eu.dhl.com',
    timeout: 30000,
    maxWeightKg: 70,
    insuranceEnabled: true,
    expressEnabled: true,
  },

  // FedEx Configuration
  fedEx: {
    clientId: process.env.FEDEX_CLIENT_ID || '',
    clientSecret: process.env.FEDEX_CLIENT_SECRET || '',
    accountNumber: process.env.FEDEX_ACCOUNT_NUMBER || '',
    apiUrl: process.env.FEDEX_API_URL || 'https://apis-sandbox.fedex.com',
    timeout: 30000,
    maxWeightKg: 68,
    insuranceEnabled: true,
  },

  // UPS Configuration
  ups: {
    clientId: process.env.UPS_CLIENT_ID || '',
    clientSecret: process.env.UPS_CLIENT_SECRET || '',
    accountNumber: process.env.UPS_ACCOUNT_NUMBER || '',
    apiUrl: process.env.UPS_API_URL || 'https://onlinetools.ups.com',
    timeout: 30000,
    maxWeightKg: 70,
    insuranceEnabled: true,
  },

  // Default shipping settings
  defaults: {
    originCountry: 'OM',
    originCity: 'Muscat',
    originPostalCode: '100',
    defaultWeight: 1,
    defaultDimensions: {
      length: 10,
      width: 10,
      height: 10,
    },
  },
}));

export interface OmanPostConfig {
  apiKey: string;
  apiUrl: string;
  timeout: number;
  maxWeightKg: number;
  insuranceEnabled: boolean;
  trackingEnabled: boolean;
}

export interface AramexConfig {
  accountNumber: string;
  accountPin: string;
  username: string;
  password: string;
  apiUrl: string;
  version: string;
  timeout: number;
  maxWeightKg: number;
  insuranceEnabled: boolean;
  codEnabled: boolean;
}

export interface DHLConfig {
  apiKey: string;
  apiSecret: string;
  accountNumber: string;
  apiUrl: string;
  timeout: number;
  maxWeightKg: number;
  insuranceEnabled: boolean;
  expressEnabled: boolean;
}

export interface FedExConfig {
  clientId: string;
  clientSecret: string;
  accountNumber: string;
  apiUrl: string;
  timeout: number;
  maxWeightKg: number;
  insuranceEnabled: boolean;
}

export interface UPSConfig {
  clientId: string;
  clientSecret: string;
  accountNumber: string;
  apiUrl: string;
  timeout: number;
  maxWeightKg: number;
  insuranceEnabled: boolean;
}

export interface ShippingDefaults {
  originCountry: string;
  originCity: string;
  originPostalCode: string;
  defaultWeight: number;
  defaultDimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export interface ShippingConfig {
  omanPost: OmanPostConfig;
  aramex: AramexConfig;
  dhl: DHLConfig;
  fedEx: FedExConfig;
  ups: UPSConfig;
  defaults: ShippingDefaults;
}
