import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route, RouteStatus } from '../entities/route.entity';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';
import { CreateRouteDto } from '../dto/create-route.dto';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepo: Repository<Route>,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
  ) {}

  async createRoute(dto: CreateRouteDto): Promise<Route> {
    const route = this.routeRepo.create({
      ...dto,
      status: dto.status || RouteStatus.PLANNED,
      stops: dto.stops || [],
    });
    return this.routeRepo.save(route);
  }

  async findAll(query: {
    date?: string;
    driver?: string;
    status?: RouteStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: Route[]; total: number }> {
    const { date, driver, status, page = 1, limit = 20 } = query;

    const qb = this.routeRepo.createQueryBuilder('route');

    if (date) {
      qb.andWhere('route.date = :date', { date });
    }
    if (driver) {
      qb.andWhere('route.driverId = :driver', { driver });
    }
    if (status) {
      qb.andWhere('route.status = :status', { status });
    }

    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('route.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Route> {
    const route = await this.routeRepo.findOne({ where: { id } });
    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }
    return route;
  }

  async optimizeRoute(routeId: string): Promise<Route> {
    const route = await this.findOne(routeId);

    if (!route.stops || route.stops.length < 2) {
      return route;
    }

    const origin = route.stops[0];
    const unvisited = route.stops.slice(1);
    const optimized = [origin];
    let current = origin;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = this.haversine(
          current.lat,
          current.lng,
          unvisited[i].lat,
          unvisited[i].lng,
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      const next = unvisited.splice(nearestIdx, 1)[0];
      next.sequence = optimized.length + 1;
      optimized.push(next);
      current = next;
    }

    origin.sequence = 1;

    let totalDist = 0;
    const path = optimized.map((s) => ({ lat: s.lat, lng: s.lng }));
    for (let i = 1; i < optimized.length; i++) {
      totalDist += this.haversine(
        optimized[i - 1].lat,
        optimized[i - 1].lng,
        optimized[i].lat,
        optimized[i].lng,
      );
    }

    route.stops = optimized;
    route.optimizedPath = path;
    route.totalDistance = Math.round(totalDist * 100) / 100;
    route.estimatedDuration = Math.ceil(totalDist * 3 + optimized.length * 10);

    return this.routeRepo.save(route);
  }

  async startRoute(routeId: string): Promise<Route> {
    const route = await this.findOne(routeId);
    if (route.status !== RouteStatus.PLANNED) {
      throw new BadRequestException('Route must be in planned status to start');
    }
    route.status = RouteStatus.IN_PROGRESS;
    route.startTime = new Date();
    return this.routeRepo.save(route);
  }

  async completeRoute(routeId: string): Promise<Route> {
    const route = await this.findOne(routeId);
    if (route.status !== RouteStatus.IN_PROGRESS) {
      throw new BadRequestException('Route must be in progress to complete');
    }
    route.status = RouteStatus.COMPLETED;
    route.endTime = new Date();
    if (route.startTime) {
      route.actualDuration = Math.round(
        (new Date().getTime() - route.startTime.getTime()) / 60000,
      );
    }
    return this.routeRepo.save(route);
  }

  async addStop(routeId: string, shipmentId: string): Promise<Route> {
    const route = await this.findOne(routeId);
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    const stop = {
      shipmentId,
      sequence: route.stops.length + 1,
      estimatedArrival: new Date(Date.now() + 3600000),
      status: 'pending',
      lat: shipment.receiverLocation?.lat || 0,
      lng: shipment.receiverLocation?.lng || 0,
      address: shipment.receiverAddress?.street || '',
    };

    route.stops.push(stop);
    return this.routeRepo.save(route);
  }

  async removeStop(routeId: string, shipmentId: string): Promise<Route> {
    const route = await this.findOne(routeId);
    route.stops = route.stops.filter((s) => s.shipmentId !== shipmentId);
    route.stops.forEach((s, i) => {
      s.sequence = i + 1;
    });
    return this.routeRepo.save(route);
  }

  async updateStopStatus(
    routeId: string,
    stopIndex: number,
    status: string,
  ): Promise<Route> {
    const route = await this.findOne(routeId);
    if (stopIndex < 0 || stopIndex >= route.stops.length) {
      throw new BadRequestException('Invalid stop index');
    }
    route.stops[stopIndex].status = status;
    if (status === 'completed') {
      route.stops[stopIndex].actualArrival = new Date();
    }
    return this.routeRepo.save(route);
  }

  async getDriverRoute(
    driverId: string,
    date?: string,
  ): Promise<Route | null> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    const route = await this.routeRepo.findOne({
      where: { driverId, date: queryDate as any },
    });
    return route;
  }

  async getRouteEfficiency(routeId: string): Promise<{
    distanceVariance: number;
    timeVariance: number;
    fuelEfficiency: number | null;
    stopCompletionRate: number;
  }> {
    const route = await this.findOne(routeId);

    const distanceVariance =
      route.totalDistance > 0
        ? Math.round(
            ((route.totalDistance - route.totalDistance) /
              route.totalDistance) *
              100,
          )
        : 0;

    const timeVariance =
      route.estimatedDuration && route.actualDuration
        ? Math.round(
            ((route.actualDuration - route.estimatedDuration) /
              route.estimatedDuration) *
              100,
          )
        : 0;

    const completedStops = route.stops.filter(
      (s) => s.status === 'completed',
    ).length;
    const stopCompletionRate =
      route.stops.length > 0
        ? Math.round((completedStops / route.stops.length) * 100)
        : 0;

    return {
      distanceVariance,
      timeVariance,
      fuelEfficiency: route.fuelCost
        ? Math.round((route.totalDistance / (route.fuelCost as any)) * 100) / 100
        : null,
      stopCompletionRate,
    };
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
