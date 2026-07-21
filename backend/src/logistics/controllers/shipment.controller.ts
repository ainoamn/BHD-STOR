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
import { ShipmentService } from '../services/shipment.service';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from '../dto/update-shipment-status.dto';
import { CompleteDeliveryDto } from '../dto/complete-delivery.dto';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';

@ApiTags('Logistics - Shipments')
@Controller('logistics/shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  @Roles('admin', 'logistics_manager', 'dispatcher', 'b2b_customer')
  @ApiOperation({ summary: 'Create a new shipment' })
  @ApiResponse({ status: 201, description: 'Shipment created', type: Shipment })
  async create(@Body() dto: CreateShipmentDto): Promise<Shipment> {
    return this.shipmentService.createShipment(dto);
  }

  @Get()
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get all shipments with filters' })
  @ApiQuery({ name: 'status', required: false, enum: ShipmentStatus })
  @ApiQuery({ name: 'driver', required: false })
  @ApiQuery({ name: 'zone', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: ShipmentStatus,
    @Query('driver') driver?: string,
    @Query('zone') zone?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.shipmentService.findAll({
      status,
      driver,
      zone,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page,
      limit,
    });
  }

  @Get('stats')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get delivery statistics' })
  async getDeliveryStats() {
    return this.shipmentService.getDeliveryStats();
  }

  @Get('active')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get active shipments in transit' })
  async getActiveShipments() {
    return this.shipmentService.getActiveShipments();
  }

  @Get('pending')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get pending shipments' })
  async getPendingShipments() {
    return this.shipmentService.getPendingShipments();
  }

  @Get(':id')
  @Roles('admin', 'logistics_manager', 'dispatcher', 'driver')
  @ApiOperation({ summary: 'Get shipment by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shipmentService.findOne(id);
  }

  @Get('tracking/:trackingNumber')
  @Roles('admin', 'logistics_manager', 'dispatcher', 'driver', 'b2b_customer')
  @ApiOperation({ summary: 'Get shipment by tracking number' })
  async findByTracking(@Param('trackingNumber') trackingNumber: string) {
    return this.shipmentService.findByTracking(trackingNumber);
  }

  @Patch(':id/status')
  @Roles('admin', 'logistics_manager', 'dispatcher', 'driver')
  @ApiOperation({ summary: 'Update shipment status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    return this.shipmentService.updateStatus(id, dto);
  }

  @Post(':id/assign-driver/:driverId')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Assign driver to shipment' })
  async assignDriver(
    @Param('id', ParseUUIDPipe) shipmentId: string,
    @Param('driverId', ParseUUIDPipe) driverId: string,
  ) {
    return this.shipmentService.assignDriver(shipmentId, driverId);
  }

  @Post(':id/assign-route/:routeId')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Assign shipment to route' })
  async assignToRoute(
    @Param('id', ParseUUIDPipe) shipmentId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ) {
    return this.shipmentService.assignToRoute(shipmentId, routeId);
  }

  @Post(':id/delivery-attempt')
  @Roles('admin', 'logistics_manager', 'driver')
  @ApiOperation({ summary: 'Record a delivery attempt' })
  async recordDeliveryAttempt(
    @Param('id', ParseUUIDPipe) shipmentId: string,
    @Body() result: { success: boolean; reason?: string },
  ) {
    return this.shipmentService.recordDeliveryAttempt(shipmentId, result);
  }

  @Post(':id/complete-delivery')
  @Roles('admin', 'logistics_manager', 'driver')
  @ApiOperation({ summary: 'Complete delivery with proof' })
  async completeDelivery(
    @Param('id', ParseUUIDPipe) shipmentId: string,
    @Body() dto: CompleteDeliveryDto,
  ) {
    return this.shipmentService.completeDelivery(shipmentId, dto);
  }

  @Post(':id/generate-otp')
  @Roles('admin', 'logistics_manager', 'dispatcher', 'driver')
  @ApiOperation({ summary: 'Generate delivery OTP' })
  async generateOtp(@Param('id', ParseUUIDPipe) shipmentId: string) {
    return this.shipmentService.generateOtp(shipmentId);
  }

  @Post(':id/verify-otp')
  @Roles('admin', 'logistics_manager', 'driver')
  @ApiOperation({ summary: 'Verify delivery OTP' })
  async verifyOtp(
    @Param('id', ParseUUIDPipe) shipmentId: string,
    @Body('otp') otp: string,
  ) {
    const verified = await this.shipmentService.verifyOtp(shipmentId, otp);
    return { verified };
  }

  @Post(':id/cancel')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel shipment' })
  async cancelShipment(
    @Param('id', ParseUUIDPipe) shipmentId: string,
    @Body('reason') reason: string,
  ) {
    return this.shipmentService.cancelShipment(shipmentId, reason);
  }

  @Post(':id/return')
  @Roles('admin', 'logistics_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Return shipment' })
  async returnShipment(
    @Param('id', ParseUUIDPipe) shipmentId: string,
    @Body('reason') reason: string,
  ) {
    return this.shipmentService.returnShipment(shipmentId, reason);
  }

  @Get(':id/timeline')
  @Roles('admin', 'logistics_manager', 'dispatcher', 'driver', 'b2b_customer')
  @ApiOperation({ summary: 'Get shipment timeline' })
  async getShipmentTimeline(@Param('id', ParseUUIDPipe) shipmentId: string) {
    return this.shipmentService.getShipmentTimeline(shipmentId);
  }
}
