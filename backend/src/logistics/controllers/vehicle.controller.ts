import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { VehicleService } from '../services/vehicle.service';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';

@ApiTags('Logistics - Vehicles')
@Controller('logistics/vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully', type: Vehicle })
  @ApiResponse({ status: 409, description: 'Vehicle with plate number already exists' })
  async create(@Body() dto: CreateVehicleDto): Promise<Vehicle> {
    return this.vehicleService.createVehicle(dto);
  }

  @Get()
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get all vehicles with filters' })
  @ApiQuery({ name: 'status', required: false, enum: VehicleStatus })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'zone', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: VehicleStatus,
    @Query('type') type?: string,
    @Query('zone') zone?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.vehicleService.findAll({ status, type, zone, page, limit });
  }

  @Get('stats')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get fleet statistics' })
  async getFleetStats() {
    return this.vehicleService.getFleetStats();
  }

  @Get(':id')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicleService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Update vehicle' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicleService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Update vehicle status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: VehicleStatus,
  ) {
    return this.vehicleService.updateStatus(id, status);
  }

  @Post(':id/assign-driver/:driverId')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Assign driver to vehicle' })
  async assignDriver(
    @Param('id', ParseUUIDPipe) vehicleId: string,
    @Param('driverId', ParseUUIDPipe) driverId: string,
  ) {
    return this.vehicleService.assignDriver(vehicleId, driverId);
  }

  @Post(':id/unassign-driver')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Unassign driver from vehicle' })
  async unassignDriver(@Param('id', ParseUUIDPipe) vehicleId: string) {
    return this.vehicleService.unassignDriver(vehicleId);
  }

  @Get(':id/location')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get vehicle GPS location' })
  async getVehicleLocation(@Param('id', ParseUUIDPipe) vehicleId: string) {
    return this.vehicleService.getVehicleLocation(vehicleId);
  }

  @Post(':id/location')
  @Roles('admin', 'logistics_manager', 'driver')
  @ApiOperation({ summary: 'Update vehicle GPS location' })
  async updateVehicleLocation(
    @Param('id', ParseUUIDPipe) vehicleId: string,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    return this.vehicleService.updateVehicleLocation(vehicleId, lat, lng);
  }

  @Get(':id/maintenance')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get vehicle maintenance schedule' })
  async getMaintenanceSchedule(@Param('id', ParseUUIDPipe) vehicleId: string) {
    return this.vehicleService.getMaintenanceSchedule(vehicleId);
  }
}
