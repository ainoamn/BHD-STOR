import {
  Controller,
  Get,
  Post,
  Patch,
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
import { DriverService } from '../services/driver.service';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { UpdateDriverDto } from '../dto/update-driver.dto';
import { Driver, DriverStatus } from '../entities/driver.entity';

@ApiTags('Logistics - Drivers')
@Controller('logistics/drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Create a new driver' })
  @ApiResponse({ status: 201, description: 'Driver created successfully', type: Driver })
  async create(@Body() dto: CreateDriverDto): Promise<Driver> {
    return this.driverService.createDriver(dto);
  }

  @Get()
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get all drivers with filters' })
  @ApiQuery({ name: 'status', required: false, enum: DriverStatus })
  @ApiQuery({ name: 'zone', required: false })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: DriverStatus,
    @Query('zone') zone?: string,
    @Query('minRating') minRating?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.driverService.findAll({ status, zone, minRating, page, limit });
  }

  @Get('available')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get available drivers for assignment' })
  @ApiQuery({ name: 'zoneId', required: false })
  async getAvailableDrivers(@Query('zoneId') zoneId?: string) {
    return this.driverService.getAvailableDrivers(zoneId);
  }

  @Get(':id')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get driver by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.driverService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Update driver' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.driverService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Update driver status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: DriverStatus,
  ) {
    return this.driverService.updateStatus(id, status);
  }

  @Post(':id/assign-vehicle/:vehicleId')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Assign vehicle to driver' })
  async assignVehicle(
    @Param('id', ParseUUIDPipe) driverId: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.driverService.assignVehicle(driverId, vehicleId);
  }

  @Get(':id/performance')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get driver performance metrics' })
  async getDriverPerformance(@Param('id', ParseUUIDPipe) driverId: string) {
    return this.driverService.getDriverPerformance(driverId);
  }

  @Get(':id/shipments')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get driver shipments' })
  @ApiQuery({ name: 'date', required: false })
  async getDriverShipments(
    @Param('id', ParseUUIDPipe) driverId: string,
    @Query('date') date?: string,
  ) {
    return this.driverService.getDriverShipments(driverId, date);
  }

  @Get(':id/earnings')
  @Roles('admin', 'logistics_manager', 'driver')
  @ApiOperation({ summary: 'Get driver earnings' })
  async getDriverEarnings(@Param('id', ParseUUIDPipe) driverId: string) {
    return this.driverService.getDriverEarnings(driverId);
  }

  @Post(':id/deactivate')
  @Roles('admin', 'logistics_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate driver' })
  async deactivateDriver(@Param('id', ParseUUIDPipe) driverId: string) {
    return this.driverService.deactivateDriver(driverId);
  }
}
