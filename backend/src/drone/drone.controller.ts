/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Drone Controller                         │
 * │  (c) 2025 BHD Systems. All rights reserved.                 │
 * │  REST API endpoints for autonomous drone fleet management    │
 * └─────────────────────────────────────────────────────────────┘
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DroneService } from './services/drone.service';
import { Drone } from './entities/drone.entity';
import { DroneMission } from './entities/drone-mission.entity';
import type {
  RegisterDroneDto,
  UpdateDroneStatusDto,
  UpdateLocationDto,
  PlanMissionDto,
  QueryDronesDto,
  AbortMissionDto,
} from './services/drone.service';

/* ── Guards (placeholder — wire to your auth system) ── */
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

/** Drone ops roles map onto platform admin until dedicated operator accounts exist */
const DRONE_ADMIN = UserRole.ADMIN;
const DRONE_VIEW = UserRole.ADMIN;

@ApiTags('🚁 Drone Fleet Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drones')
export class DroneController {
  constructor(private readonly droneService: DroneService) {}

  /* ═══════════════════════════════════════════
     Fleet Registration & Discovery
     ═══════════════════════════════════════════ */

  @Post('register')
  @Roles(DRONE_ADMIN)
  @ApiOperation({
    summary: 'Register a new drone into the fleet',
    description: 'Adds a drone with full specifications and home location.',
  })
  @ApiResponse({ status: 201, description: 'Drone registered successfully.' })
  @ApiResponse({ status: 409, description: 'Serial number or name already exists.' })
  async registerDrone(
    @Body(new ValidationPipe({ whitelist: true })) dto: RegisterDroneDto,
  ): Promise<Drone> {
    return this.droneService.registerDrone(dto);
  }

  @Get()
  @Roles(DRONE_ADMIN, DRONE_VIEW)
  @ApiOperation({
    summary: 'List all drones with filtering',
    description: 'Supports pagination, status filter, type filter, and search.',
  })
  @ApiResponse({ status: 200, description: 'Paginated drone list.' })
  async findAll(@Query() query: QueryDronesDto) {
    return this.droneService.findAll(query);
  }

  @Get('available')
  @Roles(DRONE_ADMIN)
  @ApiOperation({
    summary: 'Get drones available for mission assignment',
  })
  @ApiResponse({ status: 200, description: 'List of available drones.' })
  async getAvailableDrones(): Promise<Drone[]> {
    return this.droneService.getAvailableDrones();
  }

  @Get('stats')
  @Roles(DRONE_ADMIN)
  @ApiOperation({
    summary: 'Fleet-wide statistics dashboard',
  })
  @ApiResponse({ status: 200, description: 'Fleet statistics.' })
  async getStats() {
    return this.droneService.getDroneStats();
  }

  @Get(':id')
  @Roles(DRONE_ADMIN, DRONE_VIEW)
  @ApiOperation({ summary: 'Get single drone details' })
  @ApiResponse({ status: 200, description: 'Drone details with mission history.' })
  @ApiResponse({ status: 404, description: 'Drone not found.' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Drone> {
    return this.droneService.findOne(id);
  }

  /* ═══════════════════════════════════════════
     Real-time Status & Telemetry
     ═══════════════════════════════════════════ */

  @Patch(':id/status')
  @Roles(DRONE_ADMIN)
  @ApiOperation({ summary: 'Update drone operational status' })
  @ApiResponse({ status: 200, description: 'Status updated.' })
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateDroneStatusDto,
  ): Promise<Drone> {
    return this.droneService.updateStatus(id, dto);
  }

  @Patch(':id/location')
  @HttpCode(HttpStatus.OK)
  @Roles(DRONE_ADMIN)
  @ApiOperation({
    summary: 'Update drone GPS location & battery telemetry',
    description: 'Called by the drone telemetry gateway every 2-5 seconds.',
  })
  @ApiResponse({ status: 200, description: 'Telemetry updated.' })
  async updateLocation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateLocationDto,
  ): Promise<Drone> {
    return this.droneService.updateLocation(id, dto);
  }

  /* ═══════════════════════════════════════════
     Mission Lifecycle
     ═══════════════════════════════════════════ */

  @Post('missions/plan')
  @Roles(DRONE_ADMIN)
  @ApiOperation({
    summary: 'Plan a new drone mission',
    description: 'Validates route, checks no-fly zones, estimates battery.',
  })
  @ApiResponse({ status: 201, description: 'Mission planned successfully.' })
  @ApiResponse({ status: 400, description: 'Route validation failed.' })
  async planMission(
    @Body(new ValidationPipe({ whitelist: true })) dto: PlanMissionDto,
  ): Promise<DroneMission> {
    return this.droneService.planMission(dto);
  }

  @Post('missions/:missionId/launch')
  @Roles(DRONE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Launch a planned mission' })
  @ApiResponse({ status: 200, description: 'Mission launched.' })
  async launchMission(
    @Param('missionId', new ParseUUIDPipe()) missionId: string,
  ): Promise<DroneMission> {
    return this.droneService.launchMission(missionId);
  }

  @Post('missions/:missionId/abort')
  @HttpCode(HttpStatus.OK)
  @Roles(DRONE_ADMIN)
  @ApiOperation({ summary: 'Abort an active mission (RTH)' })
  @ApiResponse({ status: 200, description: 'Mission aborted, drone returning home.' })
  async abortMission(
    @Param('missionId', new ParseUUIDPipe()) missionId: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: AbortMissionDto,
  ): Promise<DroneMission> {
    return this.droneService.abortMission(missionId, dto);
  }

  @Post('missions/:missionId/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(DRONE_ADMIN)
  @ApiOperation({ summary: 'Mark an in-progress mission as completed' })
  @ApiResponse({ status: 200, description: 'Mission completed.' })
  async completeMission(
    @Param('missionId', new ParseUUIDPipe()) missionId: string,
  ): Promise<DroneMission> {
    return this.droneService.completeMission(missionId);
  }

  @Get(':droneId/missions')
  @Roles(DRONE_ADMIN, DRONE_VIEW)
  @ApiOperation({ summary: 'Get mission history for a drone' })
  @ApiResponse({ status: 200, description: 'List of missions.' })
  async getMissionHistory(
    @Param('droneId', new ParseUUIDPipe()) droneId: string,
  ): Promise<DroneMission[]> {
    return this.droneService.getMissionHistory(droneId);
  }

  /* ═══════════════════════════════════════════
     Route Validation Utilities
     ═══════════════════════════════════════════ */

  @Post('validate-route')
  @HttpCode(HttpStatus.OK)
  @Roles(DRONE_ADMIN)
  @ApiOperation({
    summary: 'Validate a path against no-fly zones',
    description: 'Check if proposed waypoints intersect any restricted airspace.',
  })
  @ApiResponse({ status: 200, description: 'Validation result with violations.' })
  async validateRoute(
    @Body()
    body: {
      waypoints: Array<{ lat: number; lng: number; altitude?: number }>;
    },
  ) {
    const violations = await this.droneService.checkNoFlyZones(body.waypoints);
    return {
      valid: violations.length === 0,
      violations,
      checkedAt: new Date().toISOString(),
    };
  }

  @Post('estimate-battery')
  @HttpCode(HttpStatus.OK)
  @Roles(DRONE_ADMIN)
  @ApiOperation({ summary: 'Estimate battery consumption for a route' })
  @ApiResponse({ status: 200, description: 'Battery estimate.' })
  async estimateBattery(
    @Body() body: { distanceKm: number; payloadKg: number },
  ) {
    const estimate = this.droneService.getBatteryEstimate(
      body.distanceKm,
      body.payloadKg,
    );
    return {
      estimatedBatteryPercent: estimate,
      withSafetyMargin: Math.round(estimate * 1.25 * 10) / 10,
    };
  }
}
