import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@ApiTags('Admin - Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform-wide statistics' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent activity logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecentActivity(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentActivity(Number(limit) || 50);
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Get sales data for charts' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month', 'year'],
  })
  getSalesChart(
    @Query('period') period: 'day' | 'week' | 'month' | 'year' = 'week',
  ) {
    return this.dashboardService.getSalesChart(period);
  }

  @Get('traffic')
  @ApiOperation({ summary: 'Get visitor statistics' })
  getTrafficStats() {
    return this.dashboardService.getTrafficStats();
  }
}
