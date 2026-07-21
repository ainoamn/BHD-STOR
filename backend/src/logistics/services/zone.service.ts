import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from '../entities/zone.entity';
import { CreateZoneDto } from '../dto/create-zone.dto';

@Injectable()
export class ZoneService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepo: Repository<Zone>,
  ) {}

  async createZone(dto: CreateZoneDto): Promise<Zone> {
    const zone = this.zoneRepo.create(dto);
    return this.zoneRepo.save(zone);
  }

  async findAll(): Promise<Zone[]> {
    const zones = await this.zoneRepo.find({
      order: { type: 'ASC', name: 'ASC' },
    });

    const zoneMap = new Map<string, Zone & { children?: Zone[] }>();
    const roots: (Zone & { children?: Zone[] })[] = [];

    for (const zone of zones) {
      zoneMap.set(zone.id, { ...zone, children: [] });
    }

    for (const zone of zones) {
      const node = zoneMap.get(zone.id)!;
      if (zone.parentId && zoneMap.has(zone.parentId)) {
        const parent = zoneMap.get(zone.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots as Zone[];
  }

  async findOne(id: string): Promise<Zone> {
    const zone = await this.zoneRepo.findOne({ where: { id } });
    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }
    return zone;
  }

  async update(id: string, dto: Partial<CreateZoneDto>): Promise<Zone> {
    const zone = await this.findOne(id);
    Object.assign(zone, dto);
    return this.zoneRepo.save(zone);
  }

  async getCoverageAreas(): Promise<Zone[]> {
    return this.zoneRepo.find({
      where: { coverage: true, active: true },
      order: { name: 'ASC' },
    });
  }

  async isAddressCovered(lat: number, lng: number): Promise<boolean> {
    const zones = await this.zoneRepo.find({
      where: { coverage: true, active: true },
    });

    for (const zone of zones) {
      if (zone.boundaries && zone.boundaries.length > 0) {
        if (this.isPointInPolygon(lat, lng, zone.boundaries)) {
          return true;
        }
      }
      if (zone.centerPoint) {
        const distance = this.haversineDistance(
          lat,
          lng,
          zone.centerPoint.lat,
          zone.centerPoint.lng,
        );
        if (distance <= 50) return true;
      }
    }
    return false;
  }

  async getZoneByCoordinates(
    lat: number,
    lng: number,
  ): Promise<Zone | null> {
    const zones = await this.zoneRepo.find({
      where: { coverage: true, active: true },
    });

    for (const zone of zones) {
      if (zone.boundaries && zone.boundaries.length > 0) {
        if (this.isPointInPolygon(lat, lng, zone.boundaries)) {
          return zone;
        }
      }
      if (zone.centerPoint) {
        const distance = this.haversineDistance(
          lat,
          lng,
          zone.centerPoint.lat,
          zone.centerPoint.lng,
        );
        if (distance <= 25) return zone;
      }
    }
    return null;
  }

  private isPointInPolygon(
    lat: number,
    lng: number,
    polygon: { lat: number; lng: number }[],
  ): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng,
        yi = polygon[i].lat;
      const xj = polygon[j].lng,
        yj = polygon[j].lat;

      const intersect =
        yi > lat !== yj > lat &&
        lat < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
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
