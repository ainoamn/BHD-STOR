/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Drone Module Barrel Export               │
 * │  (c) 2025 BHD Systems. All rights reserved.                 │
 * └─────────────────────────────────────────────────────────────┘
 */

/* ── Module ── */
export { DroneModule } from './drone.module';

/* ── Entities ── */
export { Drone, DroneType, DroneStatus } from './entities/drone.entity';
export type { GeoLocation, HomeLocation, DroneCertification } from './entities/drone.entity';

export {
  DroneMission,
  MissionType,
  MissionStatus,
} from './entities/drone-mission.entity';
export type { Waypoint, WeatherConditions, MissionLog } from './entities/drone-mission.entity';

export { NoFlyZone, NoFlyZoneType } from './entities/no-fly-zone.entity';
export type { GeoPoint } from './entities/no-fly-zone.entity';

/* ── Service ── */
export { DroneService } from './services/drone.service';
export type {
  RegisterDroneDto,
  UpdateDroneStatusDto,
  UpdateLocationDto,
  PlanMissionDto,
  QueryDronesDto,
  AbortMissionDto,
} from './services/drone.service';

/* ── Controller ── */
export { DroneController } from './drone.controller';
