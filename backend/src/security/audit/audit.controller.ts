/**
 * @fileoverview Audit Controller
 * @description Admin-only endpoints for viewing and exporting audit logs.
 * All endpoints require administrative privileges.
 */

import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  HttpCode,
  Logger,
  ParseEnumPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { AuditAction, RiskLevel } from './entities/audit-log.entity';

@Controller('audit-logs')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit-logs
   * View audit logs with filtering and pagination.
   * Admin only.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getLogs(
    @Query('action', new ParseEnumPipe(AuditAction, { optional: true }))
    action?: AuditAction,
    @Query('userId') userId?: string,
    @Query('ip') ip?: string,
    @Query('riskLevel', new ParseEnumPipe(RiskLevel, { optional: true }))
    riskLevel?: RiskLevel,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    const { data, total } = await this.auditService.getLogs({
      action,
      userId,
      ip,
      riskLevel,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      limit,
      offset: ((page || 1) - 1) * (limit || 50),
    });

    return {
      data,
      meta: {
        total,
        page: page || 1,
        limit: limit || 50,
        totalPages: Math.ceil(total / (limit || 50)),
      },
    };
  }

  /**
   * GET /audit-logs/stats
   * Get audit statistics for the dashboard.
   * Admin only.
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    return this.auditService.getStats();
  }

  /**
   * GET /audit-logs/export
   * Export audit logs to CSV.
   * Admin only.
   */
  @Get('export')
  async exportCsv(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('action', new ParseEnumPipe(AuditAction, { optional: true }))
    action?: AuditAction,
    @Res() response?: Response,
  ) {
    if (!startDate || !endDate) {
      if (response) {
        response.status(HttpStatus.BAD_REQUEST).json({
          error: 'startDate and endDate are required',
        });
      }
      return;
    }

    const csv = await this.auditService.exportToCsv({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      action,
    });

    if (response) {
      response.setHeader('Content-Type', 'text/csv');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-logs-${startDate}-${endDate}.csv"`,
      );
      response.send(csv);
    }
  }

  /**
   * GET /audit-logs/health
   * Service health check.
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  getHealth() {
    return { status: 'ok', service: 'audit' };
  }
}
