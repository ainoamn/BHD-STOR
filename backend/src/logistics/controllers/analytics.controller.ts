import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('Logistics - Analytics')
@Controller('logistics/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('drivers')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get driver performance report' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  async getDriverPerformanceReport(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.analyticsService.getDriverPerformanceReport({
      from: new Date(from),
      to: new Date(to),
    });
  }

  @Get('revenue')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  async getRevenueReport(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.analyticsService.getRevenueReport({
      from: new Date(from),
      to: new Date(to),
    });
  }

  @Get('zones')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get zone coverage report' })
  async getZoneCoverageReport() {
    return this.analyticsService.getZoneCoverageReport();
  }

  @Get('vehicles')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get vehicle utilization report' })
  async getVehicleUtilizationReport() {
    return this.analyticsService.getVehicleUtilizationReport();
  }

  @Get('on-time-rate')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get on-time delivery rate' })
  async getOnTimeDeliveryRate() {
    const rate = await this.analyticsService.getOnTimeDeliveryRate();
    return { onTimeRate: rate };
  }

  @Get('satisfaction')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get customer satisfaction report' })
  async getCustomerSatisfactionReport() {
    return this.analyticsService.getCustomerSatisfactionReport();
  }
}
