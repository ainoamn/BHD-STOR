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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MaintenanceService } from '../services/maintenance.service';
import { CreateMaintenanceDto } from '../dto/create-maintenance.dto';
import { MaintenanceStatus } from '../entities/maintenance-record.entity';

@ApiTags('Logistics - Maintenance')
@Controller('logistics/maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Schedule maintenance record' })
  async create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.scheduleMaintenance(dto);
  }

  @Get()
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get all maintenance records' })
  @ApiQuery({ name: 'vehicle', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false, enum: MaintenanceStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('vehicle') vehicle?: string,
    @Query('type') type?: string,
    @Query('status') status?: MaintenanceStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.maintenanceService.findAll({ vehicle, type, status, page, limit });
  }

  @Get('upcoming')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get upcoming maintenance (next 14 days)' })
  async getUpcomingMaintenance() {
    return this.maintenanceService.getUpcomingMaintenance();
  }

  @Get('overdue')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get overdue maintenance records' })
  async getOverdueMaintenance() {
    return this.maintenanceService.getOverdueMaintenance();
  }

  @Get(':id')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get maintenance record by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Update maintenance status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: MaintenanceStatus,
  ) {
    return this.maintenanceService.updateStatus(id, status);
  }

  @Post(':id/complete')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Complete maintenance record' })
  async completeMaintenance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { cost?: number; performedBy?: string; documents?: string[] },
  ) {
    return this.maintenanceService.completeMaintenance(id, data);
  }
}
