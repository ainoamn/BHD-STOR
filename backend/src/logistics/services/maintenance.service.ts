import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { MaintenanceRecord, MaintenanceStatus } from '../entities/maintenance-record.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { CreateMaintenanceDto } from '../dto/create-maintenance.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRecord)
    private readonly maintenanceRepo: Repository<MaintenanceRecord>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async scheduleMaintenance(dto: CreateMaintenanceDto): Promise<MaintenanceRecord> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${dto.vehicleId} not found`);
    }

    const record = this.maintenanceRepo.create(dto);
    const saved = await this.maintenanceRepo.save(record);

    if (dto.nextDueDate) {
      vehicle.nextMaintenanceDate = dto.nextDueDate;
      await this.vehicleRepo.save(vehicle);
    }

    return saved;
  }

  async findAll(query: {
    vehicle?: string;
    type?: string;
    status?: MaintenanceStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: MaintenanceRecord[]; total: number }> {
    const { vehicle, type, status, page = 1, limit = 20 } = query;

    const qb = this.maintenanceRepo.createQueryBuilder('m');

    if (vehicle) {
      qb.andWhere('m.vehicleId = :vehicle', { vehicle });
    }
    if (type) {
      qb.andWhere('m.type = :type', { type });
    }
    if (status) {
      qb.andWhere('m.status = :status', { status });
    }

    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('m.date', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<MaintenanceRecord> {
    const record = await this.maintenanceRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Maintenance record with ID ${id} not found`);
    }
    return record;
  }

  async updateStatus(
    id: string,
    status: MaintenanceStatus,
  ): Promise<MaintenanceRecord> {
    const record = await this.findOne(id);
    record.status = status;
    return this.maintenanceRepo.save(record);
  }

  async getUpcomingMaintenance(): Promise<MaintenanceRecord[]> {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 14);

    return this.maintenanceRepo.find({
      where: {
        status: MaintenanceStatus.SCHEDULED,
        date: LessThan(future),
      },
      order: { date: 'ASC' },
    });
  }

  async getOverdueMaintenance(): Promise<MaintenanceRecord[]> {
    const today = new Date();

    return this.maintenanceRepo.find({
      where: {
        status: MaintenanceStatus.OVERDUE,
      },
      order: { date: 'ASC' },
    });
  }

  async completeMaintenance(
    id: string,
    data: { cost?: number; performedBy?: string; documents?: string[] },
  ): Promise<MaintenanceRecord> {
    const record = await this.findOne(id);
    record.status = MaintenanceStatus.COMPLETED;

    if (data.cost !== undefined) record.cost = data.cost;
    if (data.performedBy) record.performedBy = data.performedBy;
    if (data.documents) record.documents = data.documents;

    const vehicle = await this.vehicleRepo.findOne({
      where: { id: record.vehicleId },
    });
    if (vehicle) {
      vehicle.lastMaintenanceDate = record.date;
      await this.vehicleRepo.save(vehicle);
    }

    return this.maintenanceRepo.save(record);
  }
}
