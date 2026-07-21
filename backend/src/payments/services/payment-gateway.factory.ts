import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PayPalService } from './paypal.service';
import { OmanNetService } from './oman-net.service';
import { ThawaniService } from './thawani.service';
import { TelrService } from './telr.service';
import { CCAvenueService } from './ccavenue.service';

export type PaymentGatewayType = 'stripe' | 'paypal' | 'oman_net' | 'thawani' | 'telr' | 'ccavenue';

export interface GatewayConfigValidation {
  gateway: PaymentGatewayType;
  isConfigured: boolean;
  missingKeys: string[];
}

export const SupportedGateways: PaymentGatewayType[] = [
  'stripe',
  'paypal',
  'oman_net',
  'thawani',
  'telr',
  'ccavenue',
];

@Injectable()
export class PaymentGatewayFactory {
  private readonly logger = new Logger(PaymentGatewayFactory.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paypalService: PayPalService,
    private readonly omanNetService: OmanNetService,
    private readonly thawaniService: ThawaniService,
    private readonly telrService: TelrService,
    private readonly ccavenueService: CCAvenueService,
  ) {}

  /**
   * Create/get the appropriate payment gateway service
   */
  createGateway(gateway: PaymentGatewayType): any {
    this.logger.debug(`Creating gateway service: ${gateway}`);

    switch (gateway) {
      case 'stripe':
        return this.stripeService;
      case 'paypal':
        return this.paypalService;
      case 'oman_net':
        return this.omanNetService;
      case 'thawani':
        return this.thawaniService;
      case 'telr':
        return this.telrService;
      case 'ccavenue':
        return this.ccavenueService;
      default:
        throw new BadRequestException(
          `Unsupported payment gateway: ${gateway}. Supported gateways: ${SupportedGateways.join(', ')}`,
        );
    }
  }

  /**
   * Check if a gateway is supported
   */
  isGatewaySupported(gateway: string): boolean {
    return SupportedGateways.includes(gateway as PaymentGatewayType);
  }

  /**
   * Get all supported gateway names
   */
  getSupportedGateways(): PaymentGatewayType[] {
    return [...SupportedGateways];
  }

  /**
   * Validate gateway configuration
   * Returns which gateways are properly configured
   */
  validateGatewayConfig(gateway?: PaymentGatewayType): GatewayConfigValidation[] | GatewayConfigValidation {
    const validations: GatewayConfigValidation[] = [
      {
        gateway: 'stripe',
        isConfigured: this.validateStripeConfig(),
        missingKeys: this.getMissingStripeKeys(),
      },
      {
        gateway: 'paypal',
        isConfigured: this.validatePayPalConfig(),
        missingKeys: this.getMissingPayPalKeys(),
      },
      {
        gateway: 'oman_net',
        isConfigured: this.validateOmanNetConfig(),
        missingKeys: this.getMissingOmanNetKeys(),
      },
      {
        gateway: 'thawani',
        isConfigured: this.validateThawaniConfig(),
        missingKeys: this.getMissingThawaniKeys(),
      },
      {
        gateway: 'telr',
        isConfigured: this.validateTelrConfig(),
        missingKeys: this.getMissingTelrKeys(),
      },
      {
        gateway: 'ccavenue',
        isConfigured: this.validateCCAvenueConfig(),
        missingKeys: this.getMissingCCAvenueKeys(),
      },
    ];

    if (gateway) {
      return validations.find((v) => v.gateway === gateway) || validations[0];
    }

    return validations;
  }

  /**
   * Get gateway-specific config for frontend
   */
  getGatewayConfig(gateway: PaymentGatewayType): Record<string, any> {
    switch (gateway) {
      case 'stripe':
        return {
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        };
      case 'paypal':
        return {
          clientId: process.env.PAYPAL_CLIENT_ID || '',
          environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
        };
      case 'thawani':
        return this.thawaniService.getConfig();
      case 'ccavenue':
        return this.ccavenueService.getConfig();
      default:
        return {};
    }
  }

  // ---- Validation helpers ----

  private validateStripeConfig(): boolean {
    return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
  }

  private getMissingStripeKeys(): string[] {
    const missing: string[] = [];
    if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
    if (!process.env.STRIPE_PUBLISHABLE_KEY) missing.push('STRIPE_PUBLISHABLE_KEY');
    return missing;
  }

  private validatePayPalConfig(): boolean {
    return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  }

  private getMissingPayPalKeys(): string[] {
    const missing: string[] = [];
    if (!process.env.PAYPAL_CLIENT_ID) missing.push('PAYPAL_CLIENT_ID');
    if (!process.env.PAYPAL_CLIENT_SECRET) missing.push('PAYPAL_CLIENT_SECRET');
    return missing;
  }

  private validateOmanNetConfig(): boolean {
    return !!(process.env.OMAN_NET_MERCHANT_ID && process.env.OMAN_NET_API_KEY);
  }

  private getMissingOmanNetKeys(): string[] {
    const missing: string[] = [];
    if (!process.env.OMAN_NET_MERCHANT_ID) missing.push('OMAN_NET_MERCHANT_ID');
    if (!process.env.OMAN_NET_API_KEY) missing.push('OMAN_NET_API_KEY');
    return missing;
  }

  private validateThawaniConfig(): boolean {
    return !!(process.env.THAWANI_SECRET_KEY && process.env.THAWANI_PUBLIC_KEY);
  }

  private getMissingThawaniKeys(): string[] {
    const missing: string[] = [];
    if (!process.env.THAWANI_SECRET_KEY) missing.push('THAWANI_SECRET_KEY');
    if (!process.env.THAWANI_PUBLIC_KEY) missing.push('THAWANI_PUBLIC_KEY');
    return missing;
  }

  private validateTelrConfig(): boolean {
    return !!(process.env.TELR_STORE_ID && process.env.TELR_AUTH_KEY);
  }

  private getMissingTelrKeys(): string[] {
    const missing: string[] = [];
    if (!process.env.TELR_STORE_ID) missing.push('TELR_STORE_ID');
    if (!process.env.TELR_AUTH_KEY) missing.push('TELR_AUTH_KEY');
    return missing;
  }

  private validateCCAvenueConfig(): boolean {
    return !!(process.env.CCAVENUE_MERCHANT_ID && process.env.CCAVENUE_WORKING_KEY && process.env.CCAVENUE_ACCESS_CODE);
  }

  private getMissingCCAvenueKeys(): string[] {
    const missing: string[] = [];
    if (!process.env.CCAVENUE_MERCHANT_ID) missing.push('CCAVENUE_MERCHANT_ID');
    if (!process.env.CCAVENUE_WORKING_KEY) missing.push('CCAVENUE_WORKING_KEY');
    if (!process.env.CCAVENUE_ACCESS_CODE) missing.push('CCAVENUE_ACCESS_CODE');
    return missing;
  }
}
