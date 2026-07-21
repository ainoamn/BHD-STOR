import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hub } from '../entities/hub.entity';
import { Shipment } from '../entities/shipment.entity';
import { CreateHubDto } from '../dto/create-hub.dto';

@Injectable()
export class HubService {
  constructor(
    @InjectRepository(Hub)
    private readonly hubRepo: Repository<Hub>,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
  ) {}

  async createHub(dto: CreateHubDto): Promise<Hub> {
    const existing = await this.hubRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new NotFoundException(`Hub with code ${dto.code} already exists`);
    }

    const hub = this.hubRepo.create(dto);
    return this.hubRepo.save(hub);
  }

  async findAll(query: {
    zone?: string;
    type?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: Hub[]; total: number }> {
    const { zone, type, active, page = 1, limit = 20 } = query;

    const qb = this.hubRepo.createQueryBuilder('hub');

    if (zone) {
      qb.andWhere('hub.zoneId = :zone', { zone });
    }
    if (type) {
      qb.andWhere('hub.type = :type', { type });
    }
    if (active !== undefined) {
      qb.andWhere('hub.active = :active', { active });
    }

    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('hub.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Hub> {
    const hub = await this.hubRepo.findOne({ where: { id } });
    if (!hub) {
      throw new NotFoundException(`Hub with ID ${id} not found`);
    }
    return hub;
  }

  async update(id: string, dto: Partial<CreateHubDto>): Promise<Hub> {
    const hub = await this.findOne(id);
    Object.assign(hub, dto);
    return this.hubRepo.save(hub);
  }

  async updateLoad(hubId: string, change: number): Promise<Hub> {
    const hub = await this.findOne(hubId);
    hub.currentLoad = Math.max(0, hub.currentLoad + change);
    if (hub.currentLoad > hub.capacity) {
      throw new Error('Hub capacity exceeded');
    }
    return this.hubRepo.save(hub);
  }

  async getHubShipments(
    hubId: string,
    status?: string,
  ): Promise<Shipment[]> {
    await this.findOne(hubId);

    const qb = this.shipmentRepo
      .createQueryBuilder('shipment')
      .where('shipment.zoneId = :hubId', { hubId });

    if (status) {
      qb.andWhere('shipment.status = :status', { status });
    }

    return qb.orderBy('shipment.createdAt', 'DESC').getMany();
  }
}
