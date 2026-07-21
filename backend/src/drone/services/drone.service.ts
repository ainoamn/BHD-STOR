/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Drone Service                            │
 * │  (c) 2025 BHD Systems. All rights reserved.                 │
 * │  Core service layer for autonomous drone fleet management    │
 * └─────────────────────────────────────────────────────────────┘
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Drone, DroneStatus, DroneType } from '../entities/drone.entity';
import {
  DroneMission,
  MissionStatus,
  MissionType,
} from '../entities/drone-mission.entity';
import { NoFlyZone } from '../entities/no-fly-zone.entity';

/* ── DTOs ── */
export interface RegisterDroneDto {
  name: string;
  serialNumber: string;
  model: string;
  type: DroneType;
  batteryCapacity: number;
  maxPayload: number;
  maxRange: number;
  maxSpeed: number;
  homeLocation: { lat: number; lng: number };
  certifications?: Array<{
    name: string;
    issuedBy: string;
    issueDate: string;
    expiryDate: string;
  }>;
}

export interface UpdateDroneStatusDto {
  status: DroneStatus;
}

export interface UpdateLocationDto {
  lat: number;
  lng: number;
  altitude: number;
  battery: number;
}

export interface PlanMissionDto {
  droneId: string;
  shipmentId?: string;
  type: MissionType;
  payloadWeight: number;
  pickup: { lat: number; lng: number; altitude?: number };
  delivery: { lat: number; lng: number; altitude?: number };
  intermediatePoints?: Array<{ lat: number; lng: number }>;
}

export interface QueryDronesDto {
  status?: DroneStatus;
  type?: DroneType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AbortMissionDto {
  reason: string;
}

/* ── Route types ── */
interface RoutePoint {
  lat: number;
  lng: number;
  altitude: number;
}

@Injectable()
export class DroneService {
  private readonly logger = new Logger(DroneService.name);

  /* Battery consumption constants (empirical) */
  private readonly BATTERY_PER_KM_EMPTY = 2.5; // % per km, no payload
  private readonly BATTERY_PER_KG_KM = 0.8; // additional % per kg per km
  private readonly BATTERY_TAKEOFF_LANDING = 3.0; // % per takeoff/landing cycle
  private readonly SAFETY_MARGIN = 1.25; // 25% safety buffer

  constructor(
    @InjectRepository(Drone)
    private readonly droneRepo: Repository<Drone>,
    @InjectRepository(DroneMission)
    private readonly missionRepo: Repository<DroneMission>,
    @InjectRepository(NoFlyZone)
    private readonly nfzRepo: Repository<NoFlyZone>,
  ) {}

  /* ═══════════════════════════════════════════════
     CRUD — Drones
     ═══════════════════════════════════════════════ */

  async registerDrone(dto: RegisterDroneDto): Promise<Drone> {
    const existing = await this.droneRepo.findOne({
      where: [
        { serialNumber: dto.serialNumber },
        { name: dto.name },
      ],
    });
    if (existing) {
      throw new ConflictException(
        `Drone with serial "${dto.serialNumber}" or name "${dto.name}" already exists`,
      );
    }

    const drone = this.droneRepo.create({
      ...dto,
      status: DroneStatus.AVAILABLE,
      currentBattery: 100,
      currentLocation: {
        lat: dto.homeLocation.lat,
        lng: dto.homeLocation.lng,
        altitude: 0,
      },
      flightHours: 0,
      certifications: dto.certifications ?? [],
      lastMaintenanceDate: new Date(),
    });

    const saved = await this.droneRepo.save(drone);
    this.logger.log(`🚁 Drone registered: ${saved.name} (${saved.id})`);
    return saved;
  }

  async findAll(query: QueryDronesDto = {}): Promise<{
    items: Drone[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      status,
      type,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.droneRepo.createQueryBuilder('drone');

    if (status) {
      qb.andWhere('drone.status = :status', { status });
    }
    if (type) {
      qb.andWhere('drone.type = :type', { type });
    }
    if (search) {
      qb.andWhere(
        new Brackets((qb2) => {
          qb2
            .where('drone.name ILIKE :search', { search: `%${search}%` })
            .orWhere('drone.serialNumber ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('drone.model ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    qb.orderBy(`drone.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<Drone> {
    const drone = await this.droneRepo.findOne({
      where: { id },
      relations: ['missions'],
    });
    if (!drone) throw new NotFoundException(`Drone ${id} not found`);
    return drone;
  }

  async updateStatus(
    id: string,
    dto: UpdateDroneStatusDto,
  ): Promise<Drone> {
    const drone = await this.findOne(id);
    const oldStatus = drone.status;
    drone.status = dto.status;
    const saved = await this.droneRepo.save(drone);
    this.logger.log(
      `🚁 Drone ${drone.name} status: ${oldStatus} → ${dto.status}`,
    );
    return saved;
  }

  async updateLocation(
    id: string,
    dto: UpdateLocationDto,
  ): Promise<Drone> {
    const drone = await this.findOne(id);
    drone.currentLocation = {
      lat: dto.lat,
      lng: dto.lng,
      altitude: dto.altitude,
    };
    drone.currentBattery = Math.max(0, Math.min(100, dto.battery));
    return this.droneRepo.save(drone);
  }

  async getAvailableDrones(): Promise<Drone[]> {
    return this.droneRepo.find({
      where: {
        status: DroneStatus.AVAILABLE,
      },
      order: { currentBattery: 'DESC' },
    });
  }

  /* ═══════════════════════════════════════════════
     Mission Lifecycle
     ═══════════════════════════════════════════════ */

  async planMission(dto: PlanMissionDto): Promise<DroneMission> {
    const drone = await this.findOne(dto.droneId);

    if (!drone.canAcceptMission) {
      throw new BadRequestException(
        `Drone ${drone.name} is not available for missions (status: ${drone.status}, battery: ${drone.currentBattery}%)`,
      );
    }

    if (dto.payloadWeight > drone.maxPayload) {
      throw new BadRequestException(
        `Payload ${dto.payloadWeight}kg exceeds drone max payload ${drone.maxPayload}kg`,
      );
    }

    // Generate optimal route
    const waypoints = await this.calculateOptimalRoute(
      dto.pickup,
      dto.delivery,
      dto.intermediatePoints,
    );

    // Validate against no-fly zones
    const violations = await this.checkNoFlyZones(waypoints);
    if (violations.length > 0) {
      throw new BadRequestException({
        message: 'Route intersects no-fly zones',
        violations,
      });
    }

    const distance = this.computePathDistance(waypoints);
    const batteryNeeded = this.getBatteryEstimate(distance, dto.payloadWeight);

    if (drone.currentBattery < batteryNeeded * this.SAFETY_MARGIN) {
      throw new BadRequestException(
        `Insufficient battery: need ~${batteryNeeded.toFixed(1)}% (with safety margin), drone has ${drone.currentBattery}%`,
      );
    }

    const estimatedDuration = this.estimateDuration(drone, distance);

    const mission = this.missionRepo.create({
      droneId: dto.droneId,
      shipmentId: dto.shipmentId ?? null,
      type: dto.type,
      status: MissionStatus.PLANNED,
      waypoints,
      estimatedDistance: distance,
      estimatedDuration,
      payloadWeight: dto.payloadWeight,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Mission planned and route validated',
          metadata: { waypointsCount: waypoints.length, distance },
        },
      ],
    });

    const saved = await this.missionRepo.save(mission);
    this.logger.log(`📋 Mission ${saved.id} planned for drone ${drone.name}`);
    return saved;
  }

  async launchMission(missionId: string): Promise<DroneMission> {
    const mission = await this.missionRepo.findOne({
      where: { id: missionId },
      relations: ['drone'],
    });
    if (!mission) throw new NotFoundException(`Mission ${missionId} not found`);

    if (mission.status !== MissionStatus.PLANNED) {
      throw new BadRequestException(
        `Cannot launch mission in status ${mission.status}`,
      );
    }

    // Update drone status
    await this.updateStatus(mission.droneId, {
      status: DroneStatus.IN_FLIGHT,
    });

    mission.status = MissionStatus.IN_PROGRESS;
    mission.startTime = new Date();
    mission.logs = [
      ...(mission.logs ?? []),
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Mission launched — drone airborne',
      },
    ];

    const saved = await this.missionRepo.save(mission);
    this.logger.log(`🚀 Mission ${missionId} launched`);
    return saved;
  }

  async abortMission(
    missionId: string,
    dto: AbortMissionDto,
  ): Promise<DroneMission> {
    const mission = await this.missionRepo.findOne({
      where: { id: missionId },
      relations: ['drone'],
    });
    if (!mission) throw new NotFoundException(`Mission ${missionId} not found`);

    if (mission.isTerminal) {
      throw new BadRequestException(
        `Mission already in terminal state: ${mission.status}`,
      );
    }

    // Initiate return-to-home
    await this.updateStatus(mission.droneId, {
      status: DroneStatus.AVAILABLE,
    });

    mission.status = MissionStatus.ABORTED;
    mission.endTime = new Date();
    mission.logs = [
      ...(mission.logs ?? []),
      {
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: `Mission aborted: ${dto.reason}`,
      },
    ];

    const saved = await this.missionRepo.save(mission);
    this.logger.warn(`⚠️ Mission ${missionId} aborted: ${dto.reason}`);
    return saved;
  }

  async completeMission(missionId: string): Promise<DroneMission> {
    const mission = await this.missionRepo.findOne({
      where: { id: missionId },
      relations: ['drone'],
    });
    if (!mission) throw new NotFoundException(`Mission ${missionId} not found`);

    if (mission.status !== MissionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot complete mission in status ${mission.status}`,
      );
    }

    // Update drone status
    await this.updateStatus(mission.droneId, {
      status: DroneStatus.AVAILABLE,
    });

    mission.status = MissionStatus.COMPLETED;
    mission.endTime = new Date();
    mission.actualDuration = mission.duration;
    mission.logs = [
      ...(mission.logs ?? []),
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Mission completed successfully',
      },
    ];

    const saved = await this.missionRepo.save(mission);
    this.logger.log(`✅ Mission ${missionId} completed`);
    return saved;
  }

  async getMissionHistory(droneId: string): Promise<DroneMission[]> {
    return this.missionRepo.find({
      where: { droneId },
      order: { createdAt: 'DESC' },
      relations: ['drone'],
    });
  }

  /* ═══════════════════════════════════════════════
     Route Planning & No-Fly Zones
     ═══════════════════════════════════════════════ */

  async calculateOptimalRoute(
    pickup: RoutePoint,
    delivery: RoutePoint,
    intermediatePoints: RoutePoint[] = [],
  ): Promise<Array<{ lat: number; lng: number; altitude: number; sequence: number }>> {
    // Build path: home → pickup → intermediates → delivery
    const path: RoutePoint[] = [pickup, ...intermediatePoints, delivery];

    const waypoints = path.map((pt, idx) => ({
      lat: pt.lat,
      lng: pt.lng,
      altitude: pt.altitude ?? 80, // default cruising altitude 80m AGL
      sequence: idx + 1,
      action:
        idx === 0
          ? ('pickup' as const)
          : idx === path.length - 1
            ? ('drop' as const)
            : ('hover' as const),
    }));

    // Ensure first and last have appropriate altitude
    if (waypoints.length > 0) {
      waypoints[0].altitude = pickup.altitude ?? 15; // pickup hover at 15m
      waypoints[waypoints.length - 1].altitude = delivery.altitude ?? 10; // delivery at 10m
    }

    return waypoints;
  }

  async checkNoFlyZones(
    path: Array<{ lat: number; lng: number; altitude?: number }>,
  ): Promise<
    Array<{
      zoneId: string;
      zoneName: string;
      zoneType: string;
      intersection: { lat: number; lng: number };
    }>
  > {
    const activeZones = await this.nfzRepo.find({
      where: { permanent: true },
    });

    const violations: Array<{
      zoneId: string;
      zoneName: string;
      zoneType: string;
      intersection: { lat: number; lng: number };
    }> = [];

    for (const zone of activeZones) {
      if (!zone.isActive) continue;

      for (const point of path) {
        if (zone.containsPoint(point.lat, point.lng)) {
          if (!point.altitude || point.altitude < zone.altitudeLimit) {
            violations.push({
              zoneId: zone.id,
              zoneName: zone.name,
              zoneType: zone.type,
              intersection: { lat: point.lat, lng: point.lng },
            });
            break; // one violation per zone is enough
          }
        }
      }
    }

    return violations;
  }

  getBatteryEstimate(distanceKm: number, payloadKg: number): number {
    const cruiseConsumption =
      distanceKm *
      (this.BATTERY_PER_KM_EMPTY + this.BATTERY_PER_KG_KM * payloadKg);
    const takeoffLanding = this.BATTERY_TAKEOFF_LANDING * 2;
    return Math.round((cruiseConsumption + takeoffLanding) * 10) / 10;
  }

  /* ═══════════════════════════════════════════════
     Fleet Statistics
     ═══════════════════════════════════════════════ */

  async getDroneStats(): Promise<{
    total: number;
    available: number;
    inFlight: number;
    charging: number;
    maintenance: number;
    offline: number;
    avgBattery: number;
    totalFlightHours: number;
    activeMissions: number;
    completedMissionsToday: number;
  }> {
    const allDrones = await this.droneRepo.find();
    const activeMissions = await this.missionRepo.count({
      where: [
        { status: MissionStatus.IN_PROGRESS },
        { status: MissionStatus.PRE_FLIGHT },
      ],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedMissionsToday = await this.missionRepo.count({
      where: { status: MissionStatus.COMPLETED },
    });

    const totalBattery = allDrones.reduce(
      (sum, d) => sum + (d.currentBattery ?? 0),
      0,
    );

    return {
      total: allDrones.length,
      available: allDrones.filter((d) => d.status === DroneStatus.AVAILABLE)
        .length,
      inFlight: allDrones.filter((d) => d.status === DroneStatus.IN_FLIGHT)
        .length,
      charging: allDrones.filter((d) => d.status === DroneStatus.CHARGING)
        .length,
      maintenance: allDrones.filter(
        (d) => d.status === DroneStatus.MAINTENANCE,
      ).length,
      offline: allDrones.filter((d) => d.status === DroneStatus.OFFLINE)
        .length,
      avgBattery: allDrones.length > 0 ? Math.round(totalBattery / allDrones.length) : 0,
      totalFlightHours: allDrones.reduce(
        (sum, d) => sum + parseFloat(String(d.flightHours ?? 0)),
        0,
      ),
      activeMissions,
      completedMissionsToday,
    };
  }

  /* ═══════════════════════════════════════════════
     Private helpers
     ═══════════════════════════════════════════════ */

  private computePathDistance(
    waypoints: Array<{ lat: number; lng: number }>,
  ): number {
    let total = 0;
    for (let i = 1; i < waypoints.length; i++) {
      total += this.haversine(waypoints[i - 1], waypoints[i]);
    }
    return Math.round(total * 100) / 100;
  }

  private haversine(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(a.lat)) *
        Math.cos(this.toRad(b.lat)) *
        Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private estimateDuration(drone: Drone, distanceKm: number): number {
    const speedKmh = parseFloat(String(drone.maxSpeed));
    const cruiseMinutes = (distanceKm / speedKmh) * 60;
    const takeoffLandingMinutes = 4;
    return Math.round(cruiseMinutes + takeoffLandingMinutes);
  }
}
