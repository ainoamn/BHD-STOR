import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';
import { DriverEarning } from '../entities/driver-earning.entity';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { UpdateDriverDto } from '../dto/update-driver.dto';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(DriverEarning)
    private readonly earningRepo: Repository<DriverEarning>,
  ) {}

  async createDriver(dto: CreateDriverDto): Promise<Driver> {
    const existing = await this.driverRepo.findOne({
      where: { employeeId: dto.employeeId },
    });
    if (existing) {
      throw new ConflictException(
        `Driver with employee ID ${dto.employeeId} already exists`,
      );
    }

    const driver = this.driverRepo.create(dto);
    return this.driverRepo.save(driver);
  }

  async findAll(query: {
    status?: DriverStatus;
    zone?: string;
    minRating?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: Driver[]; total: number }> {
    const { status, zone, minRating, page = 1, limit = 20 } = query;

    const qb = this.driverRepo.createQueryBuilder('driver');

    if (status) {
      qb.andWhere('driver.status = :status', { status });
    }
    if (zone) {
      qb.andWhere('driver.currentZoneId = :zone', { zone });
    }
    if (minRating) {
      qb.andWhere('driver.rating >= :minRating', { minRating });
    }

    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('driver.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Driver> {
    const driver = await this.driverRepo.findOne({ where: { id } });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return driver;
  }

  async update(id: string, dto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.findOne(id);
    Object.assign(driver, dto);
    return this.driverRepo.save(driver);
  }

  async updateStatus(id: string, status: DriverStatus): Promise<Driver> {
    const driver = await this.findOne(id);
    driver.status = status;

    if (status === DriverStatus.INACTIVE || status === DriverStatus.SUSPENDED) {
      if (driver.currentVehicleId) {
        const vehicle = await this.vehicleRepo.findOne({
          where: { id: driver.currentVehicleId },
        });
        if (vehicle) {
          vehicle.currentDriverId = null;
          vehicle.status = VehicleStatus.ACTIVE;
          await this.vehicleRepo.save(vehicle);
        }
        driver.currentVehicleId = null;
      }
    }

    return this.driverRepo.save(driver);
  }

  async assignVehicle(
    driverId: string,
    vehicleId: string,
  ): Promise<Driver> {
    const driver = await this.findOne(driverId);
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    if (vehicle.currentDriverId && vehicle.currentDriverId !== driverId) {
      throw new ConflictException('Vehicle is already assigned to another driver');
    }

    driver.currentVehicleId = vehicleId;
    vehicle.currentDriverId = driverId;

    await this.vehicleRepo.save(vehicle);
    return this.driverRepo.save(driver);
  }

  async getDriverPerformance(driverId: string): Promise<{
    totalDeliveries: number;
    rating: number;
    successRate: number;
    totalEarnings: number;
    onTimeRate: number;
  }> {
    const driver = await this.findOne(driverId);

    const completedShipments = await this.shipmentRepo.count({
      where: {
        driverId,
        status: ShipmentStatus.DELIVERED,
      },
    });

    const failedShipments = await this.shipmentRepo.count({
      where: {
        driverId,
        status: ShipmentStatus.FAILED_DELIVERY,
      },
    });

    const totalHandled = completedShipments + failedShipments;
    const successRate =
      totalHandled > 0
        ? Math.round((completedShipments / totalHandled) * 100 * 100) / 100
        : 100;

    const earnings = await this.earningRepo
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'total')
      .where('e.driverId = :driverId', { driverId })
      .getRawOne();

    return {
      totalDeliveries: driver.totalDeliveries,
      rating: driver.rating,
      successRate,
      totalEarnings: parseFloat(earnings?.total || '0'),
      onTimeRate: successRate,
    };
  }

  async getAvailableDrivers(zoneId?: string): Promise<Driver[]> {
    const qb = this.driverRepo
      .createQueryBuilder('driver')
      .where('driver.status = :status', { status: DriverStatus.ACTIVE })
      .andWhere('driver.currentVehicleId IS NOT NULL');

    if (zoneId) {
      qb.andWhere('driver.currentZoneId = :zoneId', { zoneId });
    }

    return qb.getMany();
  }

  async getDriverShipments(
    driverId: string,
    date?: string,
  ): Promise<Shipment[]> {
    await this.findOne(driverId);

    const query: any = { driverId };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = Between(start, end);
    }

    return this.shipmentRepo.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  async getDriverEarnings(
    driverId: string,
    period?: { from: Date; to: Date },
  ): Promise<{ earnings: DriverEarning[]; total: number }> {
    await this.findOne(driverId);

    const qb = this.earningRepo
      .createQueryBuilder('e')
      .where('e.driverId = :driverId', { driverId });

    if (period) {
      qb.andWhere('e.createdAt BETWEEN :from AND :to', {
        from: period.from,
        to: period.to,
      });
    }

    const earnings = await qb
      .orderBy('e.createdAt', 'DESC')
      .getMany();

    const total = earnings.reduce((sum, e) => sum + parseFloat(e.amount as any), 0);

    return { earnings, total };
  }

  async deactivateDriver(driverId: string): Promise<Driver> {
    const driver = await this.findOne(driverId);

    if (driver.currentVehicleId) {
      const vehicle = await this.vehicleRepo.findOne({
        where: { id: driver.currentVehicleId },
      });
      if (vehicle) {
        vehicle.currentDriverId = null;
        vehicle.status = VehicleStatus.ACTIVE;
        await this.vehicleRepo.save(vehicle);
      }
      driver.currentVehicleId = null;
    }

    driver.status = DriverStatus.INACTIVE;
    return this.driverRepo.save(driver);
  }
}
