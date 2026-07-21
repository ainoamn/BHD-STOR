import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminPaymentsService, PaymentQueryDto } from '../services/admin-payments.service';

@ApiTags('Admin - Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly paymentsService: AdminPaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all payments/transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'method', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: PaymentQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  getStats() {
    return this.paymentsService.getStats();
  }

  @Get('payouts/list')
  @ApiOperation({ summary: 'Get all payouts' })
  getAllPayouts() {
    return this.paymentsService.getPayouts();
  }

  @Get('payouts/:storeId')
  @ApiOperation({ summary: 'Get store payouts' })
  getPayouts(@Param('storeId') storeId: string) {
    return this.paymentsService.getPayouts(storeId);
  }

  @Post('refund')
  @ApiOperation({ summary: 'Process refund' })
  processRefund(
    @Body('paymentId') paymentId: string,
    @Body('amount') amount: number,
  ) {
    return this.paymentsService.processRefund(paymentId, amount);
  }

  @Post('payouts/:storeId/process')
  @ApiOperation({ summary: 'Process store payout' })
  processPayout(@Param('storeId') storeId: string) {
    return this.paymentsService.processPayout(storeId);
  }
}
