import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { B2bShipmentService } from '../services/b2b-shipment.service';
import { B2bApiKeyGuard } from '../guards/b2b-api-key.guard';
import { B2bCreateShipmentDto } from '../dto/b2b-create-shipment.dto';
import { Request } from 'express';

interface RequestWithCustomer extends Request {
  customer: {
    id: number;
    companyName: string;
    apiKey: string;
    creditLimit: number;
    creditUsed: number;
    webhookUrl: string | null;
    isActive: boolean;
  };
}

/**
 * B2B Shipment Controller
 * Provides API endpoints for business customers to manage shipments programmatically.
 * All endpoints (except public tracking) require X-API-Key header authentication.
 */
@Controller('b2b')
export class B2bShipmentController {
  constructor(private readonly b2bShipmentService: B2bShipmentService) {}

  /**
   * POST /b2b/shipments
   * Create a new shipment via API (API key authentication)
   */
  @Post('shipments')
  @UseGuards(B2bApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  async createShipment(
    @Body() dto: B2bCreateShipmentDto,
    @Req() req: RequestWithCustomer,
  ) {
    const shipment = await this.b2bShipmentService.createB2bShipment(
      req.customer,
      dto,
    );
    return {
      success: true,
      data: shipment,
      message: 'Shipment created successfully',
    };
  }

  /**
   * GET /b2b/shipments
   * List all shipments for the authenticated company
   */
  @Get('shipments')
  @UseGuards(B2bApiKeyGuard)
  async findShipments(
    @Req() req: RequestWithCustomer,
    @Query('status') status?: string,
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
    @Query('reference') referenceNumber?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const filters = {
      status,
      dateFrom,
      dateTo,
      referenceNumber,
      page,
      limit,
    };
    const result = await this.b2bShipmentService.findB2bShipments(
      req.customer.id,
      filters,
    );
    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * GET /b2b/shipments/:id
   * Get detailed shipment information by ID
   */
  @Get('shipments/:id')
  @UseGuards(B2bApiKeyGuard)
  async getShipment(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithCustomer,
  ) {
    const shipment = await this.b2bShipmentService.getB2bShipmentDetail(
      req.customer.id,
      id,
    );
    return {
      success: true,
      data: shipment,
    };
  }

  /**
   * GET /b2b/shipments/:id/tracking
   * Public tracking endpoint - no API key required
   */
  @Get('shipments/:id/tracking')
  async trackShipment(@Param('id') id: string) {
    // Accept both numeric ID and tracking number
    const tracking = await this.b2bShipmentService.trackShipmentPublic(id);
    return {
      success: true,
      data: tracking,
    };
  }

  /**
   * GET /b2b/account
   * Get account information for the authenticated company
   */
  @Get('account')
  @UseGuards(B2bApiKeyGuard)
  async getAccount(@Req() req: RequestWithCustomer) {
    const account = await this.b2bShipmentService.getB2bAccount(req.customer.id);
    return {
      success: true,
      data: account,
    };
  }

  /**
   * GET /b2b/statements
   * Get billing statements for the authenticated company
   */
  @Get('statements')
  @UseGuards(B2bApiKeyGuard)
  async getStatements(
    @Req() req: RequestWithCustomer,
    @Query('period') period?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const result = await this.b2bShipmentService.getStatements(
      req.customer.id,
      period,
      page,
      limit,
    );
    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * GET /b2b/statements/:id/download
   * Download a specific statement/invoice
   */
  @Get('statements/:id/download')
  @UseGuards(B2bApiKeyGuard)
  async downloadStatement(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithCustomer,
  ) {
    const downloadUrl = await this.b2bShipmentService.getStatementDownloadUrl(
      req.customer.id,
      id,
    );
    return {
      success: true,
      data: { downloadUrl },
    };
  }

  /**
   * POST /b2b/webhook/configure
   * Configure webhook URL for shipment event notifications
   */
  @Post('webhook/configure')
  @UseGuards(B2bApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  async configureWebhook(
    @Body('webhookUrl') webhookUrl: string,
    @Body('events') events: string[],
    @Req() req: RequestWithCustomer,
  ) {
    const config = await this.b2bShipmentService.configureWebhook(
      req.customer.id,
      webhookUrl,
      events,
    );
    return {
      success: true,
      data: config,
      message: 'Webhook configured successfully',
    };
  }

  /**
   * POST /b2b/bulk-shipments
   * Create multiple shipments in bulk
   */
  @Post('bulk-shipments')
  @UseGuards(B2bApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBulkShipments(
    @Body() shipments: B2bCreateShipmentDto[],
    @Req() req: RequestWithCustomer,
  ) {
    const results = await this.b2bShipmentService.createBulkShipments(
      req.customer,
      shipments,
    );
    return {
      success: true,
      data: results,
      message: `Processed ${shipments.length} shipments`,
    };
  }
}
