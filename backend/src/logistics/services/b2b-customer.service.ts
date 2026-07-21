import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { B2BCustomer, B2BCustomerStatus } from '../entities/b2b-customer.entity';
import { Shipment } from '../entities/shipment.entity';
import { CreateB2bCustomerDto } from '../dto/create-b2b-customer.dto';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class B2bCustomerService {
  constructor(
    @InjectRepository(B2BCustomer)
    private readonly b2bRepo: Repository<B2BCustomer>,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
  ) {}

  async createCustomer(dto: CreateB2bCustomerDto): Promise<B2BCustomer> {
    const existing = await this.b2bRepo.findOne({
      where: { companyName: dto.companyName },
    });
    if (existing) {
      throw new NotFoundException(
        `B2B customer with company name ${dto.companyName} already exists`,
      );
    }

    const customer = this.b2bRepo.create(dto);
    return this.b2bRepo.save(customer);
  }

  async findAll(query: {
    status?: B2BCustomerStatus;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: B2BCustomer[]; total: number }> {
    const { status, search, page = 1, limit = 20 } = query;

    const qb = this.b2bRepo.createQueryBuilder('c');

    if (status) {
      qb.andWhere('c.status = :status', { status });
    }
    if (search) {
      qb.andWhere(
        '(c.companyName ILIKE :search OR c.contactName ILIKE :search OR c.contactEmail ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('c.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<B2BCustomer> {
    const customer = await this.b2bRepo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`B2B customer with ID ${id} not found`);
    }
    return customer;
  }

  async update(
    id: string,
    dto: Partial<CreateB2bCustomerDto>,
  ): Promise<B2BCustomer> {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.b2bRepo.save(customer);
  }

  async regenerateApiKey(customerId: string): Promise<{ apiKey: string }> {
    const customer = await this.findOne(customerId);
    const rawKey = randomBytes(32).toString('hex');
    const hashedKey = createHash('sha256').update(rawKey).digest('hex');

    customer.apiKey = hashedKey;
    await this.b2bRepo.save(customer);

    return { apiKey: rawKey };
  }

  async toggleApiAccess(
    customerId: string,
    enabled: boolean,
  ): Promise<B2BCustomer> {
    const customer = await this.findOne(customerId);
    customer.apiEnabled = enabled;
    return this.b2bRepo.save(customer);
  }

  async updateCreditLimit(
    customerId: string,
    amount: number,
  ): Promise<B2BCustomer> {
    const customer = await this.findOne(customerId);
    customer.creditLimit = amount;
    return this.b2bRepo.save(customer);
  }

  async getCustomerShipments(customerId: string): Promise<Shipment[]> {
    await this.findOne(customerId);
    return this.shipmentRepo.find({
      where: { senderId: customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getCustomerStatement(
    customerId: string,
    period: { from: Date; to: Date },
  ): Promise<{
    shipments: Shipment[];
    totalCost: number;
    totalCod: number;
    outstandingBalance: number;
  }> {
    await this.findOne(customerId);

    const shipments = await this.shipmentRepo.find({
      where: {
        senderId: customerId,
        createdAt: Between(period.from, period.to),
      },
      order: { createdAt: 'DESC' },
    });

    const totalCost = shipments.reduce(
      (sum, s) => sum + parseFloat(s.totalCost as any),
      0,
    );
    const totalCod = shipments.reduce(
      (sum, s) => sum + (s.codAmount ? parseFloat(s.codAmount as any) : 0),
      0,
    );

    const customer = await this.findOne(customerId);

    return {
      shipments,
      totalCost: Math.round(totalCost * 1000) / 1000,
      totalCod: Math.round(totalCod * 1000) / 1000,
      outstandingBalance: parseFloat(customer.currentBalance as any),
    };
  }
}
