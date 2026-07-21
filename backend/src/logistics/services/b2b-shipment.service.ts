import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { B2bCreateShipmentDto } from '../dto/b2b-create-shipment.dto';

/**
 * B2B Customer entity
 */
export interface B2bCustomer {
  id: number;
  companyName: string;
  apiKey: string;
  apiSecret: string;
  creditLimit: number;
  creditUsed: number;
  webhookUrl: string | null;
  isActive: boolean;
  contactEmail: string;
  contactPhone: string;
  address: string;
  createdAt: Date;
  apiCallCount: number;
  apiCallLimit: number;
}

/**
 * Shipment entity for B2B customers
 */
export interface B2bShipment {
  id: number;
  customerId: number;
  trackingNumber: string;
  referenceNumber: string | null;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverProvince: string;
  receiverDistrict: string;
  receiverWard: string;
  packageType: string;
  weight: number;
  dimensions: string | null;
  serviceType: string;
  codAmount: number;
  declaredValue: number;
  shippingFee: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt: Date | null;
  notes: string | null;
}

/**
 * Billing statement entity
 */
export interface BillingStatement {
  id: number;
  customerId: number;
  period: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: Date;
  dueDate: Date;
  invoiceNumber: string;
  shipmentCount: number;
}

/**
 * Webhook log entity
 */
export interface WebhookLog {
  id: number;
  customerId: number;
  shipmentId: number;
  event: string;
  payload: Record<string, unknown>;
  responseStatus: number | null;
  createdAt: Date;
}

/**
 * B2B Shipment Service
 * Handles all B2B shipment operations, account management, billing, and webhooks.
 */
@Injectable()
export class B2bShipmentService {
  constructor(
    @InjectRepository(B2bShipment)
    private shipmentRepo: Repository<B2bShipment>,
    @InjectRepository(B2bCustomer)
    private customerRepo: Repository<B2bCustomer>,
    @InjectRepository(BillingStatement)
    private statementRepo: Repository<BillingStatement>,
    @InjectRepository(WebhookLog)
    private webhookLogRepo: Repository<WebhookLog>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // API Key Validation
  // ────────────────────────────────────────────────────────────────

  /**
   * Validate API key and return associated customer
   */
  async validateApiKey(key: string): Promise<B2bCustomer | null> {
    if (!key || key.length < 16) return null;

    const customer = await this.customerRepo.findOne({
      where: { apiKey: key },
    });

    if (!customer) return null;
    if (!customer.isActive) return null;
    if (customer.apiCallCount >= customer.apiCallLimit) return null;

    // Increment API call count
    await this.customerRepo.update(
      { id: customer.id },
      { apiCallCount: () => 'api_call_count + 1' },
    );

    // Refresh count in returned object
    customer.apiCallCount += 1;
    return customer;
  }

  // ────────────────────────────────────────────────────────────────
  // Shipment Creation
  // ────────────────────────────────────────────────────────────────

  /**
   * Create a B2B shipment with customer context
   */
  async createB2bShipment(
    customer: B2bCustomer,
    dto: B2bCreateShipmentDto,
  ): Promise<B2bShipment> {
    // Validate credit limit
    const estimatedFee = this.estimateShippingFee(dto);
    if (customer.creditUsed + estimatedFee > customer.creditLimit) {
      throw new ForbiddenException(
        'Credit limit exceeded. Please make a payment or contact your account manager.',
      );
    }

    // Generate tracking number
    const trackingNumber = this.generateTrackingNumber();

    const shipment = this.shipmentRepo.create({
      customerId: customer.id,
      trackingNumber,
      referenceNumber: dto.referenceNumber || null,
      senderName: dto.sender.name,
      senderPhone: dto.sender.phone,
      senderAddress: dto.sender.address,
      receiverName: dto.receiver.name,
      receiverPhone: dto.receiver.phone,
      receiverAddress: dto.receiver.address,
      receiverProvince: dto.receiver.province || '',
      receiverDistrict: dto.receiver.district || '',
      receiverWard: dto.receiver.ward || '',
      packageType: dto.package.type,
      weight: dto.package.weight,
      dimensions: dto.package.dimensions
        ? `${dto.package.dimensions.length}x${dto.package.dimensions.width}x${dto.package.dimensions.height}`
        : null,
      serviceType: dto.serviceType,
      codAmount: dto.codAmount || 0,
      declaredValue: dto.package.declaredValue || 0,
      shippingFee: estimatedFee,
      status: 'pending_pickup',
      notes: dto.notes || null,
    });

    const saved = await this.shipmentRepo.save(shipment);

    // Update credit used
    await this.customerRepo.update(
      { id: customer.id },
      { creditUsed: () => `credit_used + ${estimatedFee}` },
    );

    // Send webhook notification
    await this.processWebhook(customer, saved, 'shipment.created');

    return saved;
  }

  /**
   * Create multiple shipments in bulk
   */
  async createBulkShipments(
    customer: B2bCustomer,
    shipments: B2bCreateShipmentDto[],
  ): Promise<Array<{ success: boolean; trackingNumber?: string; error?: string }>> {
    const results: Array<{ success: boolean; trackingNumber?: string; error?: string }> = [];

    for (const dto of shipments) {
      try {
        const shipment = await this.createB2bShipment(customer, dto);
        results.push({ success: true, trackingNumber: shipment.trackingNumber });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ success: false, error: message });
      }
    }

    return results;
  }

  // ────────────────────────────────────────────────────────────────
  // Shipment Retrieval
  // ────────────────────────────────────────────────────────────────

  /**
   * Find B2B shipments with filters
   */
  async findB2bShipments(
    customerId: number,
    filters: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      referenceNumber?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    items: B2bShipment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { customerId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.referenceNumber) {
      where.referenceNumber = Like(`%${filters.referenceNumber}%`);
    }

    if (filters.dateFrom && filters.dateTo) {
      where.createdAt = Between(
        new Date(filters.dateFrom),
        new Date(filters.dateTo),
      );
    } else if (filters.dateFrom) {
      where.createdAt = MoreThanOrEqual(new Date(filters.dateFrom));
    } else if (filters.dateTo) {
      where.createdAt = LessThanOrEqual(new Date(filters.dateTo));
    }

    const [items, total] = await this.shipmentRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single shipment detail
   */
  async getB2bShipmentDetail(
    customerId: number,
    shipmentId: number,
  ): Promise<B2bShipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId, customerId },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment #${shipmentId} not found`);
    }

    return shipment;
  }

  // ────────────────────────────────────────────────────────────────
  // Public Tracking
  // ────────────────────────────────────────────────────────────────

  /**
   * Public tracking - no authentication required
   */
  async trackShipmentPublic(id: string): Promise<{
    trackingNumber: string;
    referenceNumber: string | null;
    status: string;
    statusLabel: string;
    receiver: { name: string; address: string };
    timeline: Array<{ status: string; label: string; time: Date; location: string }>;
    estimatedDelivery: Date | null;
  }> {
    const shipment = await this.shipmentRepo.findOne({
      where: [{ trackingNumber: id }, { id: !isNaN(Number(id)) ? Number(id) : 0 }],
    });

    if (!shipment) {
      throw new NotFoundException(`Tracking number ${id} not found`);
    }

    // Build timeline (in real app, from tracking_events table)
    const timeline = this.buildTrackingTimeline(shipment);

    return {
      trackingNumber: shipment.trackingNumber,
      referenceNumber: shipment.referenceNumber,
      status: shipment.status,
      statusLabel: this.getStatusLabel(shipment.status),
      receiver: {
        name: shipment.receiverName,
        address: shipment.receiverAddress,
      },
      timeline,
      estimatedDelivery: this.calculateEstimatedDelivery(shipment),
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Account Management
  // ────────────────────────────────────────────────────────────────

  /**
   * Get B2B account information
   */
  async getB2bAccount(customerId: number): Promise<{
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    creditLimit: number;
    creditUsed: number;
    creditAvailable: number;
    totalShipments: number;
    apiCallCount: number;
    apiCallLimit: number;
    webhookUrl: string | null;
  }> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Account not found');
    }

    const totalShipments = await this.shipmentRepo.count({
      where: { customerId },
    });

    return {
      companyName: customer.companyName,
      contactEmail: customer.contactEmail,
      contactPhone: customer.contactPhone,
      address: customer.address,
      creditLimit: customer.creditLimit,
      creditUsed: customer.creditUsed,
      creditAvailable: customer.creditLimit - customer.creditUsed,
      totalShipments,
      apiCallCount: customer.apiCallCount,
      apiCallLimit: customer.apiCallLimit,
      webhookUrl: customer.webhookUrl,
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Billing Statements
  // ────────────────────────────────────────────────────────────────

  /**
   * Get billing statements for a customer
   */
  async getStatements(
    customerId: number,
    period?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: BillingStatement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { customerId };

    if (period) {
      where.period = period;
    }

    const [items, total] = await this.statementRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get statement download URL
   */
  async getStatementDownloadUrl(
    customerId: number,
    statementId: number,
  ): Promise<string> {
    const statement = await this.statementRepo.findOne({
      where: { id: statementId, customerId },
    });

    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    // Generate a signed URL for PDF download (implementation depends on storage)
    return `/api/v1/invoices/${statement.invoiceNumber}/download?token=signed-jwt-token`;
  }

  // ────────────────────────────────────────────────────────────────
  // Webhook Processing
  // ────────────────────────────────────────────────────────────────

  /**
   * Configure webhook for a customer
   */
  async configureWebhook(
    customerId: number,
    webhookUrl: string,
    events: string[],
  ): Promise<{
    webhookUrl: string;
    events: string[];
    secret: string;
  }> {
    // Validate URL
    try {
      new URL(webhookUrl);
    } catch {
      throw new BadRequestException('Invalid webhook URL');
    }

    // Generate webhook secret
    const secret = this.generateWebhookSecret();

    await this.customerRepo.update(customerId, {
      webhookUrl,
    });

    // Store webhook configuration (events, secret) in a separate table in production
    return { webhookUrl, events, secret };
  }

  /**
   * Process webhook - send notification to customer webhook URL
   */
  async processWebhook(
    customer: B2bCustomer,
    shipment: B2bShipment,
    event: string,
  ): Promise<void> {
    if (!customer.webhookUrl) return;

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data: {
        trackingNumber: shipment.trackingNumber,
        referenceNumber: shipment.referenceNumber,
        status: shipment.status,
        statusLabel: this.getStatusLabel(shipment.status),
        receiverName: shipment.receiverName,
        receiverAddress: shipment.receiverAddress,
        shippingFee: shipment.shippingFee,
        codAmount: shipment.codAmount,
        updatedAt: shipment.updatedAt,
      },
    };

    // Send webhook asynchronously (fire and forget)
    this.sendWebhookRequest(customer.webhookUrl, payload).catch(() => {
      // Silently fail - webhook delivery should not block main flow
    });

    // Log webhook attempt
    await this.webhookLogRepo.save({
      customerId: customer.id,
      shipmentId: shipment.id,
      event,
      payload,
      responseStatus: null,
    });
  }

  /**
   * Send HTTP POST request to webhook URL
   */
  private async sendWebhookRequest(
    url: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BHD-Logistics-Webhook/1.0',
        },
        body: JSON.stringify(payload),
      });

      // Update webhook log with response status
      await this.webhookLogRepo.update(
        { customerId: payload.data ? (payload.data as Record<string, unknown>).customerId : 0 },
        { responseStatus: response.status },
      );
    } catch {
      // Webhook delivery failed - retry logic would go here
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────

  /**
   * Generate unique tracking number
   */
  private generateTrackingNumber(): string {
    const prefix = 'BHD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Generate webhook secret
   */
  private generateWebhookSecret(): string {
    return (
      'whsec_' +
      Array.from({ length: 32 }, () =>
        Math.random().toString(36).charAt(2),
      ).join('')
    );
  }

  /**
   * Estimate shipping fee based on package details
   */
  private estimateShippingFee(dto: B2bCreateShipmentDto): number {
    const baseRates: Record<string, number> = {
      standard: 15000,
      express: 30000,
      same_day: 50000,
      overnight: 45000,
    };

    const baseRate = baseRates[dto.serviceType] || baseRates.standard;
    const weightFee = Math.ceil(dto.package.weight / 0.5) * 5000;
    const codFee = dto.codAmount ? Math.min(dto.codAmount * 0.01, 50000) : 0;
    const declaredValueFee = dto.package.declaredValue
      ? Math.min(dto.package.declaredValue * 0.005, 100000)
      : 0;

    return Math.round(baseRate + weightFee + codFee + declaredValueFee);
  }

  /**
   * Get human-readable status label
   */
  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending_pickup: 'Pending Pickup',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      at_sorting: 'At Sorting Center',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      failed_delivery: 'Delivery Failed',
      returned: 'Returned',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  /**
   * Build tracking timeline from shipment data
   */
  private buildTrackingTimeline(
    shipment: B2bShipment,
  ): Array<{ status: string; label: string; time: Date; location: string }> {
    const timeline: Array<{ status: string; label: string; time: Date; location: string }> = [
      {
        status: 'created',
        label: 'Shipment Created',
        time: shipment.createdAt,
        location: 'BHD Logistics Hub',
      },
    ];

    if (shipment.status === 'pending_pickup') return timeline;

    timeline.push({
      status: 'picked_up',
      label: 'Picked Up',
      time: new Date(new Date(shipment.createdAt).getTime() + 3600000),
      location: shipment.senderAddress,
    });

    if (['in_transit', 'at_sorting', 'out_for_delivery', 'delivered'].includes(shipment.status)) {
      timeline.push({
        status: 'in_transit',
        label: 'In Transit',
        time: new Date(new Date(shipment.createdAt).getTime() + 7200000),
        location: 'Regional Distribution Center',
      });
    }

    if (['at_sorting', 'out_for_delivery', 'delivered'].includes(shipment.status)) {
      timeline.push({
        status: 'at_sorting',
        label: 'Arrived at Sorting Center',
        time: new Date(new Date(shipment.createdAt).getTime() + 10800000),
        location: `${shipment.receiverProvince} Sorting Center`,
      });
    }

    if (['out_for_delivery', 'delivered'].includes(shipment.status)) {
      timeline.push({
        status: 'out_for_delivery',
        label: 'Out for Delivery',
        time: new Date(new Date(shipment.createdAt).getTime() + 14400000),
        location: shipment.receiverDistrict,
      });
    }

    if (shipment.status === 'delivered' && shipment.deliveredAt) {
      timeline.push({
        status: 'delivered',
        label: 'Delivered',
        time: shipment.deliveredAt,
        location: shipment.receiverAddress,
      });
    }

    return timeline;
  }

  /**
   * Calculate estimated delivery date
   */
  private calculateEstimatedDelivery(shipment: B2bShipment): Date | null {
    if (shipment.status === 'delivered') return null;

    const deliveryDays: Record<string, number> = {
      standard: 3,
      express: 1,
      same_day: 0,
      overnight: 1,
    };

    const days = deliveryDays[shipment.serviceType] || 3;
    const est = new Date(shipment.createdAt);
    est.setDate(est.getDate() + days);
    return est;
  }
}
