import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingCarrier } from '../entities/shipping-carrier.entity';

/** Maps DB seed codes → calculator service keys */
const RATE_SERVICE_ALIASES: Record<string, string> = {
  oman_post: 'oman_post',
  aramex: 'aramex',
  aramex_oman: 'aramex',
  dhl: 'dhl',
  dhl_oman: 'dhl',
  fedex: 'fedex',
  ups: 'ups',
  local_delivery_muscat: 'local',
};

@Injectable()
export class ShippingCarriersService {
  private readonly logger = new Logger(ShippingCarriersService.name);

  constructor(
    @InjectRepository(ShippingCarrier)
    private readonly carrierRepository: Repository<ShippingCarrier>,
  ) {}

  normalizeCode(code: string): string {
    return (code || '').toLowerCase().replace(/-/g, '_');
  }

  /** Service key used by ShippingCalculatorService.getCarrierRates */
  toRateServiceCode(code: string): string | null {
    const n = this.normalizeCode(code);
    return RATE_SERVICE_ALIASES[n] ?? (['oman_post', 'aramex', 'dhl', 'fedex', 'ups'].includes(n) ? n : null);
  }

  async listPublicCarriers(): Promise<
    Array<{
      id: string;
      code: string;
      name: string;
      nameAr: string | null;
      isActive: boolean;
      supportsCod: boolean;
      displayOrder: number;
      tracking: boolean;
      rateServiceCode: string | null;
    }>
  > {
    await this.ensureDefaultCarriers();
    const rows = await this.carrierRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      nameAr: row.nameAr,
      isActive: row.isActive,
      supportsCod: row.supportsCod,
      displayOrder: row.displayOrder,
      tracking: Boolean(row.trackingUrlTemplate),
      rateServiceCode: this.toRateServiceCode(row.code),
    }));
  }

  async listAllForAdmin() {
    await this.ensureDefaultCarriers();
    return this.carrierRepository.find({
      order: { displayOrder: 'ASC' },
    });
  }

  async setCarrierActive(idOrCode: string, isActive: boolean): Promise<ShippingCarrier> {
    await this.ensureDefaultCarriers();
    let row = await this.carrierRepository.findOne({ where: { id: idOrCode } });
    if (!row) {
      row = await this.carrierRepository.findOne({ where: { code: idOrCode } });
    }
    if (!row) {
      throw new NotFoundException(`Shipping carrier "${idOrCode}" not found`);
    }
    row.isActive = isActive;
    return this.carrierRepository.save(row);
  }

  async assertCarrierEnabled(code: string): Promise<void> {
    await this.ensureDefaultCarriers();
    const n = this.normalizeCode(code);
    const svc = this.toRateServiceCode(n) || n;

    const codes = new Set<string>([n, svc]);
    for (const [dbCode, rateSvc] of Object.entries(RATE_SERVICE_ALIASES)) {
      if (rateSvc === svc || dbCode === n) {
        codes.add(dbCode);
      }
    }

    const rows = await this.carrierRepository
      .createQueryBuilder('c')
      .where('c.code IN (:...codes)', { codes: [...codes] })
      .getMany();

    if (rows.length === 0) {
      if (!this.toRateServiceCode(n)) {
        throw new BadRequestException(`Unknown shipping carrier: ${code}`);
      }
      return;
    }

    if (!rows.some((r) => r.isActive)) {
      throw new BadRequestException(
        `Shipping carrier "${code}" is disabled by admin`,
      );
    }
  }

  /** Active rate-service codes for calculator (deduped). */
  async getActiveRateServiceCodes(): Promise<string[]> {
    await this.ensureDefaultCarriers();
    const rows = await this.carrierRepository.find({ where: { isActive: true } });
    const codes = new Set<string>();
    for (const row of rows) {
      const svc = this.toRateServiceCode(row.code);
      if (svc && svc !== 'local') {
        codes.add(svc);
      }
    }
    // Fallback if DB empty of rate-capable carriers
    if (codes.size === 0) {
      return ['oman_post'];
    }
    return [...codes];
  }

  private async ensureDefaultCarriers(): Promise<void> {
    const defaults: Array<Partial<ShippingCarrier>> = [
      {
        name: 'Oman Post',
        nameAr: 'بريد عمان',
        code: 'oman_post',
        isActive: true,
        supportsCod: true,
        displayOrder: 1,
        trackingUrlTemplate:
          'https://tracking.omanpost.om/?tracking={tracking_number}',
        config: {},
      },
      {
        name: 'Aramex',
        nameAr: 'أرامكس',
        code: 'aramex',
        isActive: true,
        supportsCod: true,
        displayOrder: 2,
        trackingUrlTemplate:
          'https://www.aramex.com/track?track={tracking_number}',
        config: {},
      },
      {
        name: 'DHL Express',
        nameAr: 'دي إتش إل',
        code: 'dhl',
        isActive: false,
        supportsCod: false,
        displayOrder: 3,
        trackingUrlTemplate:
          'https://www.dhl.com/om-en/home/tracking.html?tracking-id={tracking_number}',
        config: {},
      },
      {
        name: 'FedEx',
        nameAr: 'فيديكس',
        code: 'fedex',
        isActive: false,
        supportsCod: false,
        displayOrder: 4,
        config: {},
      },
      {
        name: 'UPS',
        nameAr: 'يو بي إس',
        code: 'ups',
        isActive: false,
        supportsCod: false,
        displayOrder: 5,
        config: {},
      },
      {
        name: 'Local Delivery (Muscat)',
        nameAr: 'توصيل محلي (مسقط)',
        code: 'local_delivery_muscat',
        isActive: true,
        supportsCod: true,
        displayOrder: 6,
        config: { domestic_zones: ['muscat'] },
      },
    ];

    for (const def of defaults) {
      const existing = await this.carrierRepository.findOne({
        where: { code: def.code },
      });
      if (existing) continue;

      // Skip creating aramex/dhl if seed used *_oman variants
      if (def.code === 'aramex') {
        const legacy = await this.carrierRepository.findOne({
          where: { code: 'aramex_oman' },
        });
        if (legacy) continue;
      }
      if (def.code === 'dhl') {
        const legacy = await this.carrierRepository.findOne({
          where: { code: 'dhl_oman' },
        });
        if (legacy) continue;
      }

      await this.carrierRepository.save(this.carrierRepository.create(def));
      this.logger.log(`Seeded shipping carrier ${def.code}`);
    }
  }
}
