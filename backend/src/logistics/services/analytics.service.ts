import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';
import { Driver } from '../entities/driver.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Zone } from '../entities/zone.entity';
import { DriverEarning } from '../entities/driver-earning.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Zone)
    private readonly zoneRepo: Repository<Zone>,
    @InjectRepository(DriverEarning)
    private readonly earningRepo: Repository<DriverEarning>,
  ) {}

  async getDashboardStats(): Promise<{
    totalShipments: number;
    activeShipments: number;
    deliveredToday: number;
    totalDrivers: number;
    activeDrivers: number;
    totalVehicles: number;
    onTripVehicles: number;
    totalRevenue: number;
    onTimeRate: number;
    avgDeliveryTime: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalShipments = await this.shipmentRepo.count();
    const activeShipments = await this.shipmentRepo.count({
      where: [
        { status: ShipmentStatus.IN_TRANSIT },
        { status: ShipmentStatus.OUT_FOR_DELIVERY },
      ],
    });
    const deliveredToday = await this.shipmentRepo.count({
      where: {
        status: ShipmentStatus.DELIVERED,
        deliveryDate: Between(today, tomorrow) as any,
      },
    });
    const totalDrivers = await this.driverRepo.count();
    const activeDrivers = await this.driverRepo.count({
      where: { status: 'active' as any },
    });
    const totalVehicles = await this.vehicleRepo.count();
    const onTripVehicles = await this.vehicleRepo.count({
      where: { status: 'on_trip' as any },
    });

    const revenueResult = await this.earningRepo
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'total')
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult?.total || '0');

    const onTimeRate = await this.getOnTimeDeliveryRate();

    return {
      totalShipments,
      activeShipments,
      deliveredToday,
      totalDrivers,
      activeDrivers,
      totalVehicles,
      onTripVehicles,
      totalRevenue: Math.round(totalRevenue * 1000) / 1000,
      onTimeRate,
      avgDeliveryTime: 24,
    };
  }

  async getDriverPerformanceReport(period: {
    from: Date;
    to: Date;
  }): Promise<
    {
      driverId: string;
      employeeId: string;
      totalDeliveries: number;
      rating: number;
      earnings: number;
      onTimeRate: number;
    }[]
  > {
    const drivers = await this.driverRepo.find({
      where: { status: 'active' as any },
    });

    const report = [];
    for (const driver of drivers) {
      const deliveries = await this.shipmentRepo.count({
        where: {
          driverId: driver.id,
          status: ShipmentStatus.DELIVERED,
          deliveryDate: Between(period.from, period.to) as any,
        },
      });

      const earningsResult = await this.earningRepo
        .createQueryBuilder('e')
        .select('SUM(e.amount)', 'total')
        .where('e.driverId = :driverId', { driverId: driver.id })
        .andWhere('e.createdAt BETWEEN :from AND :to', period)
        .getRawOne();

      report.push({
        driverId: driver.id,
        employeeId: driver.employeeId,
        totalDeliveries: deliveries,
        rating: driver.rating,
        earnings: parseFloat(earningsResult?.total || '0'),
        onTimeRate: driver.successRate,
      });
    }

    return report.sort((a, b) => b.totalDeliveries - a.totalDeliveries);
  }

  async getRevenueReport(period: {
    from: Date;
    to: Date;
  }): Promise<{
    daily: { date: string; revenue: number; shipments: number }[];
    totalRevenue: number;
    totalShipments: number;
    avgPerShipment: number;
  }> {
    const shipments = await this.shipmentRepo
      .createQueryBuilder('s')
      .select('DATE(s.createdAt)', 'date')
      .addSelect('COUNT(s.id)', 'shipments')
      .addSelect('SUM(s.totalCost)', 'revenue')
      .where('s.createdAt BETWEEN :from AND :to', period)
      .groupBy('DATE(s.createdAt)')
      .orderBy('DATE(s.createdAt)', 'ASC')
      .getRawMany();

    const daily = shipments.map((row) => ({
      date: row.date,
      revenue: parseFloat(row.revenue || '0'),
      shipments: parseInt(row.shipments, 10),
    }));

    const totalRevenue = daily.reduce((sum, d) => sum + d.revenue, 0);
    const totalShipments = daily.reduce((sum, d) => sum + d.shipments, 0);

    return {
      daily,
      totalRevenue: Math.round(totalRevenue * 1000) / 1000,
      totalShipments,
      avgPerShipment:
        totalShipments > 0
          ? Math.round((totalRevenue / totalShipments) * 1000) / 1000
          : 0,
    };
  }

  async getZoneCoverageReport(): Promise<
    {
      zoneId: string;
      zoneName: string;
      totalShipments: number;
      activeDrivers: number;
      coverage: boolean;
    }[]
  > {
    const zones = await this.zoneRepo.find();

    const report = [];
    for (const zone of zones) {
      const shipments = await this.shipmentRepo.count({
        where: { zoneId: zone.id },
      });

      const drivers = await this.driverRepo.count({
        where: { currentZoneId: zone.id },
      });

      report.push({
        zoneId: zone.id,
        zoneName: zone.name,
        totalShipments: shipments,
        activeDrivers: drivers,
        coverage: zone.coverage,
      });
    }

    return report;
  }

  async getVehicleUtilizationReport(): Promise<
    {
      vehicleId: string;
      vehicleName: string;
      status: string;
      totalTrips: number;
      totalDistance: number;
      utilizationRate: number;
    }[]
  > {
    const vehicles = await this.vehicleRepo.find();

    const report = [];
    for (const vehicle of vehicles) {
      const shipments = await this.shipmentRepo.count({
        where: { vehicleId: vehicle.id },
      });

      const utilizationRate =
        vehicle.status === 'on_trip'
          ? 100
          : vehicle.status === 'active'
            ? 75
            : 0;

      report.push({
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        status: vehicle.status,
        totalTrips: shipments,
        totalDistance: vehicle.odometer,
        utilizationRate,
      });
    }

    return report;
  }

  async getOnTimeDeliveryRate(): Promise<number> {
    const result = await this.shipmentRepo
      .createQueryBuilder('s')
      .select('COUNT(s.id)', 'total')
      .addSelect(
        'SUM(CASE WHEN s.deliveryDate <= s.promisedDeliveryDate THEN 1 ELSE 0 END)',
        'ontime',
      )
      .where('s.status = :status', { status: ShipmentStatus.DELIVERED })
      .getRawOne();

    const total = parseInt(result?.total || '0', 10);
    const ontime = parseInt(result?.ontime || '0', 10);

    return total > 0 ? Math.round((ontime / total) * 100 * 100) / 100 : 100;
  }

  async getCustomerSatisfactionReport(): Promise<{
    avgRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    const drivers = await this.driverRepo.find();

    const totalReviews = drivers.reduce(
      (sum, d) => sum + d.totalDeliveries,
      0,
    );
    const avgRating =
      drivers.length > 0
        ? Math.round(
            (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length) *
              100,
          ) / 100
        : 5.0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    return {
      avgRating,
      totalReviews,
      ratingDistribution,
    };
  }
}
