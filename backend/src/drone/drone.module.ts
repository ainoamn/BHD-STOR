/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Drone Module                             │
 * │  (c) 2025 BHD Systems. All rights reserved.                 │
 * │  NestJS module wiring for drone fleet management            │
 * └─────────────────────────────────────────────────────────────┘
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

/* ── Entities ── */
import { Drone } from './entities/drone.entity';
import { DroneMission } from './entities/drone-mission.entity';
import { NoFlyZone } from './entities/no-fly-zone.entity';

/* ── Services ── */
import { DroneService } from './services/drone.service';

/* ── Controllers ── */
import { DroneController } from './drone.controller';

/* ── WebSocket Gateway (real-time telemetry) ── */
import { DroneTelemetryGateway } from './gateways/drone-telemetry.gateway';

/* ── Schedulers ── */
import { DroneFleetScheduler } from './schedulers/drone-fleet.scheduler';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Drone, DroneMission, NoFlyZone]),
  ],
  controllers: [DroneController],
  providers: [
    DroneService,
    DroneTelemetryGateway,
    DroneFleetScheduler,
  ],
  exports: [DroneService],
})
export class DroneModule {}
