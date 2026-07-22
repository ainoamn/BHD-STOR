import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ReportService } from '../services/report.service';

@ApiTags('Logistics - Reports')
@Controller('logistics/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get logistics summary report' })
  async getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportService.getSummary(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
