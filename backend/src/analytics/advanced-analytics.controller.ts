import {
  Controller,
  Get,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AdvancedAnalyticsService } from './services/advanced-analytics.service';

@Controller('analytics')
export class AdvancedAnalyticsController {
  constructor(private readonly analyticsService: AdvancedAnalyticsService) {}

  // ─── Sales Heatmap ─────────────────────────────────────────────

  @Get('heatmap')
  async getSalesHeatmap(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.analyticsService.getSalesHeatmap(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return { success: true, data };
  }

  // ─── Customer Segments (RFM) ───────────────────────────────────

  @Get('segments')
  async getCustomerSegments() {
    const data = await this.analyticsService.getCustomerSegments();
    return { success: true, data };
  }

  // ─── Product Affinity ──────────────────────────────────────────

  @Get('affinity')
  async getProductAffinity(@Query('minSupport') minSupport?: string) {
    const data = await this.analyticsService.getProductAffinity(
      minSupport ? parseFloat(minSupport) : 0.01,
    );
    return { success: true, data };
  }

  // ─── Churn Prediction ──────────────────────────────────────────

  @Get('churn')
  async getChurnPrediction() {
    const data = await this.analyticsService.getChurnPrediction();
    return { success: true, data };
  }

  // ─── Customer Lifetime Value ───────────────────────────────────

  @Get('clv')
  async getLifetimeValue() {
    const data = await this.analyticsService.getLifetimeValue();
    return { success: true, data };
  }

  // ─── Cohort Analysis ───────────────────────────────────────────

  @Get('cohorts')
  async getCohortAnalysis() {
    const data = await this.analyticsService.getCohortAnalysis();
    return { success: true, data };
  }

  // ─── Geographic Analytics ──────────────────────────────────────

  @Get('geo')
  async getGeoAnalytics() {
    const data = await this.analyticsService.getGeoAnalytics();
    return { success: true, data };
  }

  // ─── Seasonal Trends ───────────────────────────────────────────

  @Get('seasonal')
  async getSeasonalTrends() {
    const data = await this.analyticsService.getSeasonalTrends();
    return { success: true, data };
  }

  // ─── Real-time Stats ───────────────────────────────────────────

  @Get('realtime')
  async getRealTimeStats() {
    const data = await this.analyticsService.getRealTimeStats();
    return { success: true, data };
  }

  // ─── Dashboard Summary ─────────────────────────────────────────

  @Get('dashboard')
  async getDashboardSummary() {
    const data = await this.analyticsService.getDashboardSummary();
    return { success: true, data };
  }

  // ─── Export ────────────────────────────────────────────────────

  @Post('export')
  async exportReport(
    @Query('type') type: 'csv' | 'pdf' = 'csv',
    @Query('period') period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const report = await this.analyticsService.exportReport(
      type,
      period,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    if (type === 'csv') {
      res?.setHeader('Content-Type', 'text/csv');
      res?.setHeader(
        'Content-Disposition',
        `attachment; filename="${report.filename}"`,
      );
      res?.send(report.content);
      return;
    }

    return { success: true, data: report };
  }
}
