import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Shipment, ShipmentStatus, ServiceType } from '../entities/shipment.entity';
import { Driver } from '../entities/driver.entity';
import { PricingService } from './pricing.service';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from '../dto/update-shipment-status.dto';
import { CompleteDeliveryDto } from '../dto/complete-delivery.dto';

@Injectable()
export class ShipmentService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    private readonly pricingService: PricingService,
  ) {}

  private generateTrackingNumber(): string {
    const prefix = 'BHD';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000000) + 1000000;
    return `${prefix}-${year}-${random}`;
  }

  async createShipment(dto: CreateShipmentDto): Promise<Shipment> {
    const trackingNumber = this.generateTrackingNumber();

    const priceResult = await this.pricingService.calculatePrice({
      fromZoneId: dto.zoneId,
      toZoneId: dto.zoneId,
      weight: dto.weight,
      volume: dto.volume,
      serviceType: dto.serviceType,
    });

    const shipment = this.shipmentRepo.create({
      ...dto,
      trackingNumber,
      totalCost: priceResult.total,
      status: ShipmentStatus.PENDING_PICKUP,
      timeline: [
        {
          status: ShipmentStatus.PENDING_PICKUP,
          timestamp: new Date(),
          notes: 'Shipment created',
        },
      ],
    });

    return this.shipmentRepo.save(shipment);
  }

  async findAll(query: {
    status?: ShipmentStatus;
    driver?: string;
    zone?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: Shipment[]; total: number }> {
    const { status, driver, zone, fromDate, toDate, page = 1, limit = 20 } = query;

    const qb = this.shipmentRepo.createQueryBuilder('shipment');

    if (status) {
      qb.andWhere('shipment.status = :status', { status });
    }
    if (driver) {
      qb.andWhere('shipment.driverId = :driver', { driver });
    }
    if (zone) {
      qb.andWhere('shipment.zoneId = :zone', { zone });
    }
    if (fromDate && toDate) {
      qb.andWhere('shipment.createdAt BETWEEN :from AND :to', {
        from: fromDate,
        to: toDate,
      });
    }

    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('shipment.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({ where: { id } });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
    return shipment;
  }

  async findByTracking(trackingNumber: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { trackingNumber },
    });
    if (!shipment) {
      throw new NotFoundException(
        `Shipment with tracking number ${trackingNumber} not found`,
      );
    }
    return shipment;
  }

  async updateStatus(
    id: string,
    dto: UpdateShipmentStatusDto,
  ): Promise<Shipment> {
    const shipment = await this.findOne(id);

    shipment.status = dto.status;
    shipment.timeline.push({
      status: dto.status,
      timestamp: new Date(),
      location: dto.location,
      notes: dto.notes,
    });

    if (dto.status === ShipmentStatus.DELIVERED) {
      shipment.deliveryDate = new Date();
    }

    return this.shipmentRepo.save(shipment);
  }

  async assignDriver(
    shipmentId: string,
    driverId: string,
  ): Promise<Shipment> {
    const shipment = await this.findOne(shipmentId);
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    shipment.driverId = driverId;
    shipment.timeline.push({
      status: ShipmentStatus.PENDING_PICKUP,
      timestamp: new Date(),
      notes: `Assigned to driver ${driver.employeeId}`,
    });

    return this.shipmentRepo.save(shipment);
  }

  async assignToRoute(
    shipmentId: string,
    routeId: string,
  ): Promise<Shipment> {
    const shipment = await this.findOne(shipmentId);
    shipment.routeId = routeId;
    return this.shipmentRepo.save(shipment);
  }

  async recordDeliveryAttempt(
    shipmentId: string,
    result: { success: boolean; reason?: string },
  ): Promise<Shipment> {
    const shipment = await this.findOne(shipmentId);
    shipment.deliveryAttempts += 1;

    if (!result.success) {
      shipment.failureReason = result.reason || 'Unknown';
      shipment.status = ShipmentStatus.FAILED_DELIVERY;
      shipment.timeline.push({
        status: ShipmentStatus.FAILED_DELIVERY,
        timestamp: new Date(),
        notes: `Delivery attempt ${shipment.deliveryAttempts} failed: ${result.reason}`,
      });
    }

    return this.shipmentRepo.save(shipment);
  }

  async completeDelivery(
    shipmentId: string,
    dto: CompleteDeliveryDto,
  ): Promise<Shipment> {
    const shipment = await this.findOne(shipmentId);

    if (shipment.status === ShipmentStatus.DELIVERED) {
      throw new ConflictException('Shipment already delivered');
    }

    shipment.status = ShipmentStatus.DELIVERED;
    shipment.deliveryDate = new Date();

    shipment.proofOfDelivery = {
      type: dto.proofType,
      data: dto.signatureData || '',
      timestamp: new Date(),
      signature: dto.signatureData,
      photoUrl: dto.photoUrl,
    };

    if (dto.photoUrl) {
      shipment.deliveryPhotoUrl = dto.photoUrl;
    }

    shipment.timeline.push({
      status: ShipmentStatus.DELIVERED,
      timestamp: new Date(),
      notes: dto.notes || 'Delivery completed',
    });

    if (shipment.driverId) {
      const driver = await this.driverRepo.findOne({
        where: { id: shipment.driverId },
      });
      if (driver) {
        driver.totalDeliveries += 1;
        await this.driverRepo.save(driver);
      }
    }

    return this.shipmentRepo.save(shipment);
  }

  async generateOtp(shipmentId: string): Promise<string> {
    const shipment = await this.findOne(shipmentId);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    shipment.otpCode = otp;
    shipment.otpVerified = false;
    await this.shipmentRepo.save(shipment);
    return otp;
  }

  async verifyOtp(shipmentId: string, otp: string): Promise<boolean> {
    const shipment = await this.findOne(shipmentId);
    if (shipment.otpCode === otp) {
      shipment.otpVerified = true;
      await this.shipmentRepo.save(shipment);
      return true;
    }
    return false;
  }

  async cancelShipment(
    shipmentId: string,
    reason: string,
  ): Promise<Shipment> {
    const shipment = await this.findOne(shipmentId);

    if (
      shipment.status === ShipmentStatus.DELIVERED ||
      shipment.status === ShipmentStatus.RETURNED
    ) {
      throw new BadRequestException(
        'Cannot cancel a delivered or returned shipment',
      );
    }

    shipment.status = ShipmentStatus.CANCELLED;
    shipment.timeline.push({
      status: ShipmentStatus.CANCELLED,
      timestamp: new Date(),
      notes: `Cancelled: ${reason}`,
    });

    return this.shipmentRepo.save(shipment);
  }

  async returnShipment(
    shipmentId: string,
    reason: string,
  ): Promise<Shipment> {
    const shipment = await this.findOne(shipmentId);
    shipment.status = ShipmentStatus.RETURNED;
    shipment.timeline.push({
      status: ShipmentStatus.RETURNED,
      timestamp: new Date(),
      notes: `Returned: ${reason}`,
    });
    return this.shipmentRepo.save(shipment);
  }

  async getShipmentTimeline(
    shipmentId: string,
  ): Promise<Shipment['timeline']> {
    const shipment = await this.findOne(shipmentId);
    return shipment.timeline;
  }

  async getActiveShipments(): Promise<Shipment[]> {
    return this.shipmentRepo.find({
      where: {
        status: In([
          ShipmentStatus.PICKED_UP,
          ShipmentStatus.IN_TRANSIT,
          ShipmentStatus.AT_HUB,
          ShipmentStatus.OUT_FOR_DELIVERY,
        ]),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingShipments(): Promise<Shipment[]> {
    return this.shipmentRepo.find({
      where: {
        status: In([ShipmentStatus.DRAFT, ShipmentStatus.PENDING_PICKUP]),
      },
      order: { createdAt: 'ASC' },
    });
  }

  async getDeliveryStats(): Promise<{
    delivered: number;
    failed: number;
    pending: number;
    inTransit: number;
    cancelled: number;
    total: number;
  }> {
    const statuses = await this.shipmentRepo
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(s.id)', 'count')
      .groupBy('s.status')
      .getRawMany();

    const stats = {
      delivered: 0,
      failed: 0,
      pending: 0,
      inTransit: 0,
      cancelled: 0,
      total: 0,
    };

    for (const row of statuses) {
      const count = parseInt(row.count, 10);
      stats.total += count;
      switch (row.status) {
        case ShipmentStatus.DELIVERED:
          stats.delivered = count;
          break;
        case ShipmentStatus.FAILED_DELIVERY:
          stats.failed = count;
          break;
        case ShipmentStatus.PENDING_PICKUP:
        case ShipmentStatus.DRAFT:
          stats.pending += count;
          break;
        case ShipmentStatus.IN_TRANSIT:
        case ShipmentStatus.AT_HUB:
        case ShipmentStatus.OUT_FOR_DELIVERY:
        case ShipmentStatus.PICKED_UP:
          stats.inTransit += count;
          break;
        case ShipmentStatus.CANCELLED:
          stats.cancelled = count;
          break;
      }
    }

    return stats;
  }
}
