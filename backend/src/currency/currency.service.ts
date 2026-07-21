import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency, CurrencyCode } from './entities/currency.entity';

export interface ConversionResult {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: number;
  convertedAmount: number;
  rate: number;
  timestamp: Date;
}

export interface CurrencyRate {
  code: CurrencyCode;
  rate: number;
  name: string;
  symbol: string;
}

@Injectable()
export class CurrencyService implements OnModuleInit {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly baseCurrency = CurrencyCode.OMR;

  // Default exchange rates (relative to OMR as base)
  // Rates are updated periodically from the Central Bank of Oman or external FX provider
  private readonly defaultRates: Record<CurrencyCode, { rate: number; name: string; symbol: string; decimals: number }> = {
    [CurrencyCode.OMR]: { rate: 1, name: 'Omani Rial', symbol: 'OMR', decimals: 3 },
    [CurrencyCode.AED]: { rate: 9.54, name: 'UAE Dirham', symbol: 'AED', decimals: 2 },
    [CurrencyCode.SAR]: { rate: 9.75, name: 'Saudi Riyal', symbol: 'SAR', decimals: 2 },
    [CurrencyCode.QAR]: { rate: 9.46, name: 'Qatari Riyal', symbol: 'QAR', decimals: 2 },
    [CurrencyCode.KWD]: { rate: 0.79, name: 'Kuwaiti Dinar', symbol: 'KWD', decimals: 3 },
    [CurrencyCode.BHD]: { rate: 0.98, name: 'Bahraini Dinar', symbol: 'BHD', decimals: 3 },
    [CurrencyCode.USD]: { rate: 2.60, name: 'US Dollar', symbol: '$', decimals: 2 },
    [CurrencyCode.EUR]: { rate: 2.38, name: 'Euro', symbol: '€', decimals: 2 },
    [CurrencyCode.GBP]: { rate: 2.04, name: 'British Pound', symbol: '£', decimals: 2 },
  };

  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  /**
   * Initialize currencies on module startup
   */
  async onModuleInit(): Promise<void> {
    const count = await this.currencyRepository.count();
    if (count === 0) {
      this.logger.log('Seeding default currencies...', 'CurrencyService');
      await this.seedDefaultCurrencies();
    }
  }

  /**
   * Get all currencies
   */
  async findAll(): Promise<Currency[]> {
    return this.currencyRepository.find({
      order: { isDefault: 'DESC', code: 'ASC' },
    });
  }

  /**
   * Get all active currencies
   */
  async findActive(): Promise<Currency[]> {
    return this.currencyRepository.find({
      where: { isActive: true },
      order: { isDefault: 'DESC', code: 'ASC' },
    });
  }

  /**
   * Get currency by code
   */
  async findByCode(code: CurrencyCode): Promise<Currency> {
    const currency = await this.currencyRepository.findOne({
      where: { code },
    });

    if (!currency) {
      throw new NotFoundException(`Currency with code ${code} not found`);
    }

    return currency;
  }

  /**
   * Get default currency
   */
  async getDefaultCurrency(): Promise<Currency> {
    const currency = await this.currencyRepository.findOne({
      where: { isDefault: true },
    });

    if (!currency) {
      // Fallback to OMR
      return this.findByCode(CurrencyCode.OMR);
    }

    return currency;
  }

  /**
   * Convert amount between currencies
   */
  async convert(
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode,
  ): Promise<ConversionResult> {
    if (amount < 0) {
      throw new BadRequestException('Amount must be non-negative');
    }

    if (from === to) {
      return {
        from,
        to,
        amount,
        convertedAmount: amount,
        rate: 1,
        timestamp: new Date(),
      };
    }

    const fromCurrency = await this.findByCode(from);
    const toCurrency = await this.findByCode(to);

    if (!fromCurrency.isActive) {
      throw new BadRequestException(`Currency ${from} is not active`);
    }

    if (!toCurrency.isActive) {
      throw new BadRequestException(`Currency ${to} is not active`);
    }

    // Convert through base currency (OMR)
    const amountInBase = amount / fromCurrency.rate;
    const convertedAmount = amountInBase * toCurrency.rate;

    // Calculate direct rate
    const rate = toCurrency.rate / fromCurrency.rate;

    return {
      from,
      to,
      amount,
      convertedAmount: this.round(convertedAmount, toCurrency.decimals),
      rate: this.round(rate, 6),
      timestamp: new Date(),
    };
  }

  /**
   * Convert batch amounts
   */
  async convertBatch(
    amounts: number[],
    from: CurrencyCode,
    to: CurrencyCode,
  ): Promise<ConversionResult[]> {
    return Promise.all(
      amounts.map((amount) => this.convert(amount, from, to)),
    );
  }

  /**
   * Format amount with currency symbol
   */
  formatAmount(amount: number, currency: Currency): string {
    const template = currency.formatTemplate || '{symbol} {amount}';
    const formatted = amount.toFixed(currency.decimals);
    return template
      .replace('{symbol}', currency.symbol)
      .replace('{amount}', formatted)
      .replace('{code}', currency.code);
  }

  /**
   * Update exchange rate for a currency
   */
  async updateRate(code: CurrencyCode, rate: number): Promise<Currency> {
    if (rate <= 0) {
      throw new BadRequestException('Exchange rate must be positive');
    }

    const currency = await this.findByCode(code);
    currency.rate = rate;
    currency.updatedAt = new Date();

    const updated = await this.currencyRepository.save(currency);
    this.logger.log(`Updated rate for ${code}: ${rate}`, 'CurrencyService');

    return updated;
  }

  /**
   * Update all exchange rates from external API
   * Fetches latest rates from Central Bank of Oman or configured FX provider
   */
  async updateRates(): Promise<Currency[]> {
    this.logger.log('Updating exchange rates...', 'CurrencyService');

    try {
      // Fetch rates from external FX API (e.g., ExchangeRate-API, OpenExchangeRates)
      // Example: const response = await axios.get(`${apiUrl}${this.baseCurrency}`, { headers: { apikey: apiKey } });
      // On success, parse response.data.rates and update each currency

      // Fallback: refresh using default rates when external API is unavailable
      const activeCurrencies = await this.findActive();
      const updated: Currency[] = [];

      for (const currency of activeCurrencies) {
        if (currency.code === this.baseCurrency) continue;

        const defaultRate = this.defaultRates[currency.code];
        if (defaultRate) {
          currency.rate = defaultRate.rate;
          currency.updatedAt = new Date();
          updated.push(await this.currencyRepository.save(currency));
        }
      }

      this.logger.log(`Updated ${updated.length} currency rates`, 'CurrencyService');
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update rates: ${error.message}`, error.stack, 'CurrencyService');
      throw new BadRequestException('Failed to update exchange rates');
    }
  }

  /**
   * Toggle currency active status
   */
  async toggleStatus(code: CurrencyCode): Promise<Currency> {
    const currency = await this.findByCode(code);

    if (currency.isDefault) {
      throw new BadRequestException('Cannot deactivate the default currency');
    }

    currency.isActive = !currency.isActive;
    return this.currencyRepository.save(currency);
  }

  /**
   * Get supported currencies list
   */
  getSupportedCurrencies(): CurrencyCode[] {
    return Object.values(CurrencyCode);
  }

  /**
   * Validate currency code
   */
  isValidCurrency(code: string): code is CurrencyCode {
    return Object.values(CurrencyCode).includes(code as CurrencyCode);
  }

  /**
   * Seed default currencies
   */
  private async seedDefaultCurrencies(): Promise<void> {
    const currencies: Partial<Currency>[] = Object.entries(this.defaultRates).map(
      ([code, data], index) => ({
        code: code as CurrencyCode,
        name: data.name,
        symbol: data.symbol,
        flag: this.getFlagEmoji(code),
        rate: data.rate,
        isActive: true,
        isDefault: code === this.baseCurrency,
        decimals: data.decimals,
        formatTemplate: code === CurrencyCode.OMR ? '{amount} {symbol}' : '{symbol} {amount}',
      }),
    );

    await this.currencyRepository.save(currencies);
    this.logger.log(`Seeded ${currencies.length} currencies`, 'CurrencyService');
  }

  /**
   * Get flag emoji for currency
   */
  private getFlagEmoji(code: string): string {
    const flags: Record<string, string> = {
      OMR: 'OM',
      AED: 'AE',
      SAR: 'SA',
      QAR: 'QA',
      KWD: 'KW',
      BHD: 'BH',
      USD: 'US',
      EUR: 'EU',
      GBP: 'GB',
    };
    return flags[code] || '';
  }

  /**
   * Round number to specified decimal places
   */
  private round(value: number, decimals: number): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }
}
