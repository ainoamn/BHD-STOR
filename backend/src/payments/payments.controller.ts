import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  Logger,
  BadRequestException,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { PaymentsService } from './services/payments.service';
import { PaymentGatewayFactory, PaymentGatewayType } from './services/payment-gateway.factory';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { WebhookResponseDto } from './dto/webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ThrottlerGuard } from '../auth/guards/throttler.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Throttle, ThrottleLevel } from '../common/decorators/throttle.decorator';
import { requireRequestUserId } from '../auth/utils/request-user';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly gatewayFactory: PaymentGatewayFactory,
  ) {}

  /**
   * Process a payment through selected gateway
   */
  @Post('process')
  @UseGuards(JwtAuthGuard) // Import from auth module
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Process payment',
    description: 'Process a payment for an order using the specified payment gateway. Returns payment details or redirect URL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment initiated successfully',
    schema: {
      example: {
        success: true,
        paymentId: 'pi_1234567890',
        status: 'requires_action',
        amount: 25.5,
        currency: 'OMR',
        gateway: 'stripe',
        clientSecret: 'pi_secret_xxx',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid payment data or unsupported gateway' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Payment processing failed' })
  async processPayment(
    @Body() dto: ProcessPaymentDto,
    @Req() req: any,
  ) {
    const userId = requireRequestUserId(req.user);
    this.logger.log(`Payment process request from user ${userId} for order ${dto.orderId}`);

    const result = await this.paymentsService.processPayment(userId, dto);

    if (!result.success && result.error) {
      throw new BadRequestException(result.error);
    }

    return result;
  }

  /**
   * Verify a payment status
   */
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify payment',
    description: 'Verify the status of a payment with the payment gateway.',
  })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verifyPayment(
    @Body('paymentId') paymentId: string,
    @Body('gateway') gateway: PaymentGatewayType,
    @Body('gatewayData') gatewayData?: any,
  ) {
    if (!paymentId || !gateway) {
      throw new BadRequestException('paymentId and gateway are required');
    }

    this.logger.log(`Payment verification request for ${paymentId} on ${gateway}`);
    return this.paymentsService.verifyPayment(paymentId, gateway, gatewayData);
  }

  /**
   * Process a refund
   */
  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Process refund',
    description: 'Process a full or partial refund for a payment. Requires admin or store owner role.',
  })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refund request' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refundPayment(
    @Body() dto: RefundPaymentDto,
    @Req() req: any,
  ) {
    const userId = requireRequestUserId(req.user);
    this.logger.log(`Refund request from user ${userId} for payment ${dto.paymentId}`);

    return this.paymentsService.createRefund(userId, dto, req.user?.role);
  }

  /**
   * Receive webhooks from payment gateways (public endpoint - no auth)
   */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle(ThrottleLevel.WEBHOOK)
  @Post('webhook/:gateway')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint(false)
  @ApiOperation({
    summary: 'Payment gateway webhook',
    description: 'Receive webhook events from payment gateways. This endpoint is public and handles signature verification internally.',
  })
  @ApiParam({
    name: 'gateway',
    description: 'Payment gateway name',
    enum: ['stripe', 'paypal', 'oman_net', 'thawani', 'telr', 'ccavenue'],
  })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook payload' })
  async handleWebhook(
    @Param('gateway') gateway: PaymentGatewayType,
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<WebhookResponseDto> {
    this.logger.log(`Webhook received from ${gateway}`);

    if (!this.gatewayFactory.isGatewaySupported(gateway)) {
      throw new BadRequestException(`Unsupported gateway: ${gateway}`);
    }

    // Get raw body for signature verification
    const rawBody = req.rawBody?.toString();

    try {
      const result = await this.paymentsService.handleWebhook(gateway, payload, headers, rawBody);

      return {
        success: result.success,
        message: `Webhook processed: ${result.action}`,
        processingId: `wh-${Date.now()}`,
        orderId: result.orderId,
        eventType: result.action,
      };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`);
      // Signature / validation failures must not return 200 (forged webhooks)
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Transient business errors: acknowledge to limit endless provider retries
      return {
        success: false,
        message: `Webhook processing failed: ${error.message}`,
        processingId: `wh-${Date.now()}`,
        eventType: 'error',
      };
    }
  }

  /**
   * Get payment history for authenticated user
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get payment history',
    description: 'Get paginated payment history for the authenticated user.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Payment history returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentHistory(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = requireRequestUserId(req.user);
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '20', 10);

    return this.paymentsService.getPaymentHistory(userId, pageNum, limitNum);
  }

  /**
   * Get payment details by ID
   */
  @Get(':id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify payment by ID',
    description: 'Verify payment status with the gateway after redirect. Caller must own the payment or be staff/store owner.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID (UUID)', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verifyPaymentById(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Req() req: any,
  ) {
    const userId = requireRequestUserId(req.user);
    this.logger.log(`Payment verify-by-id request for ${paymentId} from ${userId}`);
    const result = await this.paymentsService.verifyPaymentById(
      paymentId,
      userId,
      req.user?.role,
    );
    return { success: true, data: result };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get payment details',
    description: 'Get detailed information about a specific payment.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID (UUID)', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Payment details returned' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentDetails(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Req() req: any,
  ) {
    const userId = requireRequestUserId(req.user);
    return this.paymentsService.getPaymentDetailsForUser(
      paymentId,
      userId,
      req.user?.role,
    );
  }

  /**
   * Create a payout to a store (admin only)
   */
  @Post('payout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create store payout',
    description: 'Process a payout to a store. Admin access required.',
  })
  @ApiResponse({ status: 200, description: 'Payout created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payout data' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async createPayout(
    @Body() dto: CreatePayoutDto,
    @Req() req: any,
  ) {
    const adminId = requireRequestUserId(req.user);
    this.logger.log(`Payout request from admin ${adminId} to store ${dto.storeId}`);

    return this.paymentsService.payoutToStore(dto.storeId, dto);
  }

  /**
   * Download invoice PDF
   */
  @Get('invoice/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Download invoice',
    description: 'Generate and download a PDF invoice for a payment.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID (UUID)', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Invoice PDF' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async downloadInvoice(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Res() res: Response,
  ) {
    this.logger.log(`Invoice download request for payment ${paymentId}`);

    const { pdfBuffer, filename } = await this.paymentsService.generateInvoice(paymentId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }

  /**
   * Get payment gateway configuration (for frontend)
   */
  @Get('config/:gateway')
  @ApiOperation({
    summary: 'Get gateway config',
    description: 'Get public configuration for a payment gateway (publishable keys, etc.).',
  })
  @ApiParam({ name: 'gateway', enum: ['stripe', 'paypal', 'thawani', 'ccavenue'] })
  @ApiResponse({ status: 200, description: 'Gateway configuration' })
  async getGatewayConfig(
    @Param('gateway') gateway: PaymentGatewayType,
  ) {
    return this.gatewayFactory.getGatewayConfig(gateway);
  }

  /**
   * Get supported payment gateways
   */
  @Public()
  @Get('gateways')
  @ApiOperation({
    summary: 'List active payment gateways',
    description: 'Returns gateways enabled by admin (with env configuration status).',
  })
  async getGateways() {
    const gateways = await this.paymentsService.listPublicGateways();
    return { success: true, data: gateways };
  }

  @Public()
  @Get('gateways/list')
  @ApiOperation({
    summary: 'List supported gateways (legacy)',
    description: 'Active DB gateways only (no internal config diagnostics).',
  })
  @ApiResponse({ status: 200, description: 'List of supported gateways' })
  async getSupportedGateways() {
    const gateways = await this.paymentsService.listPublicGateways();
    return {
      success: true,
      data: gateways,
      gateways: this.gatewayFactory.getSupportedGateways(),
    };
  }

  /**
   * Calculate commission breakdown
   */
  @Post('commission/calculate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Calculate commission',
    description: 'Calculate platform commission breakdown for a given amount.',
  })
  @ApiResponse({ status: 200, description: 'Commission breakdown' })
  async calculateCommission(
    @Body('amount') amount: number,
    @Body('storeId') storeId?: string,
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Valid amount is required');
    }

    return this.paymentsService.calculateCommission(amount, storeId);
  }

  /**
   * Get payment statistics (admin only)
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Payment statistics',
    description: 'Get payment statistics for the admin dashboard. Admin access required.',
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Payment statistics' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getPaymentStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.paymentsService.getPaymentStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Capture an authorized payment
   */
  @Post('capture')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Capture payment',
    description: 'Capture a previously authorized payment.',
  })
  @ApiResponse({ status: 200, description: 'Payment captured' })
  async capturePayment(
    @Body('paymentId') paymentId: string,
    @Body('gateway') gateway: PaymentGatewayType,
    @Body('amount') amount?: number,
  ) {
    if (!paymentId || !gateway) {
      throw new BadRequestException('paymentId and gateway are required');
    }

    return this.paymentsService.capturePayment(paymentId, gateway, amount);
  }
}
