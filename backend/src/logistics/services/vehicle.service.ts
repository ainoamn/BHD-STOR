import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
  ) {}

  async createVehicle(dto: CreateVehicleDto): Promise<Vehicle> {
    const existing = await this.vehicleRepo.findOne({
      where: { plateNumber: dto.plateNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Vehicle with plate number ${dto.plateNumber} already exists`,
      );
    }

    const vehicle = this.vehicleRepo.create(dto);
    return this.vehicleRepo.save(vehicle);
  }

  async findAll(query: {
    status?: VehicleStatus;
    type?: string;
    zone?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Vehicle[]; total: number }> {
    const { status, type, zone, page = 1, limit = 20 } = query;

    const qb = this.vehicleRepo.createQueryBuilder('vehicle');

    if (status) {
      qb.andWhere('vehicle.status = :status', { status });
    }
    if (type) {
      qb.andWhere('vehicle.type = :type', { type });
    }
    if (zone) {
      qb.andWhere('vehicle.currentLocation->>\'zone\' = :zone', { zone });
    }

    qb.skip((page - 1) * limit).take(limit).orderBy('vehicle.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    let driver = null;
    if (vehicle.currentDriverId) {
      driver = await this.driverRepo.findOne({
        where: { id: vehicle.currentDriverId },
      });
    }

    return { ...vehicle, driver } as any;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    Object.assign(vehicle, dto);
    return this.vehicleRepo.save(vehicle);
  }

  async updateStatus(
    id: string,
    status: VehicleStatus,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    vehicle.status = status;
    return this.vehicleRepo.save(vehicle);
  }

  async assignDriver(
    vehicleId: string,
    driverId: string,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(vehicleId);
    const driver = await this.driverRepo.findOne({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    if (driver.status !== DriverStatus.ACTIVE) {
      throw new ConflictException('Driver is not active');
    }

    vehicle.currentDriverId = driverId;
    driver.currentVehicleId = vehicleId;

    await this.driverRepo.save(driver);
    return this.vehicleRepo.save(vehicle);
  }

  async unassignDriver(vehicleId: string): Promise<Vehicle> {
    const vehicle = await this.findOne(vehicleId);

    if (vehicle.currentDriverId) {
      const driver = await this.driverRepo.findOne({
        where: { id: vehicle.currentDriverId },
      });
      if (driver) {
        driver.currentVehicleId = null;
        await this.driverRepo.save(driver);
      }
    }

    vehicle.currentDriverId = null;
    return this.vehicleRepo.save(vehicle);
  }

  async getVehicleLocation(
    vehicleId: string,
  ): Promise<{ lat: number; lng: number; timestamp: Date } | null> {
    const vehicle = await this.findOne(vehicleId);
    return vehicle.currentLocation;
  }

  async updateVehicleLocation(
    vehicleId: string,
    lat: number,
    lng: number,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(vehicleId);
    vehicle.currentLocation = { lat, lng, timestamp: new Date() };
    return this.vehicleRepo.save(vehicle);
  }

  async getMaintenanceSchedule(vehicleId: string): Promise<{
    lastMaintenance: Date | null;
    nextMaintenance: Date | null;
    overdue: boolean;
  }> {
    const vehicle = await this.findOne(vehicleId);
    const overdue = vehicle.nextMaintenanceDate
      ? new Date(vehicle.nextMaintenanceDate) < new Date()
      : false;

    return {
      lastMaintenance: vehicle.lastMaintenanceDate,
      nextMaintenance: vehicle.nextMaintenanceDate,
      overdue,
    };
  }

  async getFleetStats(): Promise<{
    total: number;
    active: number;
    maintenance: number;
    onTrip: number;
    retired: number;
  }> {
    const stats = await this.vehicleRepo
      .createQueryBuilder('v')
      .select('v.status', 'status')
      .addSelect('COUNT(v.id)', 'count')
      .groupBy('v.status')
      .getRawMany();

    const result = {
      total: 0,
      active: 0,
      maintenance: 0,
      onTrip: 0,
      retired: 0,
    };

    for (const row of stats) {
      const count = parseInt(row.count, 10);
      result.total += count;
      switch (row.status) {
        case VehicleStatus.ACTIVE:
          result.active = count;
          break;
        case VehicleStatus.MAINTENANCE:
          result.maintenance = count;
          break;
        case VehicleStatus.ON_TRIP:
          result.onTrip = count;
          break;
        case VehicleStatus.RETIRED:
          result.retired = count;
          break;
      }
    }

    return result;
  }
}
