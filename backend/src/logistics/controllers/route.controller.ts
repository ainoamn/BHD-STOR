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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RouteService } from '../services/route.service';
import { CreateRouteDto } from '../dto/create-route.dto';
import { RouteStatus } from '../entities/route.entity';

@ApiTags('Logistics - Routes')
@Controller('logistics/routes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Create a new route' })
  async create(@Body() dto: CreateRouteDto) {
    return this.routeService.createRoute(dto);
  }

  @Get()
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get all routes with filters' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'driver', required: false })
  @ApiQuery({ name: 'status', required: false, enum: RouteStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('date') date?: string,
    @Query('driver') driver?: string,
    @Query('status') status?: RouteStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.routeService.findAll({ date, driver, status, page, limit });
  }

  @Get(':id')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get route by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.routeService.findOne(id);
  }

  @Post(':id/optimize')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Optimize route using nearest-neighbor algorithm' })
  async optimizeRoute(@Param('id', ParseUUIDPipe) routeId: string) {
    return this.routeService.optimizeRoute(routeId);
  }

  @Post(':id/start')
  @Roles('admin', 'logistics_manager', 'dispatcher', 'driver')
  @ApiOperation({ summary: 'Start the route' })
  async startRoute(@Param('id', ParseUUIDPipe) routeId: string) {
    return this.routeService.startRoute(routeId);
  }

  @Post(':id/complete')
  @Roles('admin', 'logistics_manager', 'dispatcher', 'driver')
  @ApiOperation({ summary: 'Complete the route' })
  async completeRoute(@Param('id', ParseUUIDPipe) routeId: string) {
    return this.routeService.completeRoute(routeId);
  }

  @Post(':id/stops')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Add a stop to the route' })
  async addStop(
    @Param('id', ParseUUIDPipe) routeId: string,
    @Body('shipmentId', ParseUUIDPipe) shipmentId: string,
  ) {
    return this.routeService.addStop(routeId, shipmentId);
  }

  @Delete(':id/stops/:shipmentId')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Remove a stop from the route' })
  async removeStop(
    @Param('id', ParseUUIDPipe) routeId: string,
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
  ) {
    return this.routeService.removeStop(routeId, shipmentId);
  }

  @Patch(':id/stops/:stopIndex')
  @Roles('admin', 'logistics_manager', 'dispatcher', 'driver')
  @ApiOperation({ summary: 'Update stop status' })
  async updateStopStatus(
    @Param('id', ParseUUIDPipe) routeId: string,
    @Param('stopIndex') stopIndex: number,
    @Body('status') status: string,
  ) {
    return this.routeService.updateStopStatus(routeId, stopIndex, status);
  }

  @Get('driver/:driverId/today')
  @Roles('admin', 'logistics_manager', 'dispatcher', 'driver')
  @ApiOperation({ summary: "Get driver's route for today" })
  @ApiQuery({ name: 'date', required: false })
  async getDriverRoute(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Query('date') date?: string,
  ) {
    return this.routeService.getDriverRoute(driverId, date);
  }

  @Get(':id/efficiency')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get route efficiency report' })
  async getRouteEfficiency(@Param('id', ParseUUIDPipe) routeId: string) {
    return this.routeService.getRouteEfficiency(routeId);
  }
}
