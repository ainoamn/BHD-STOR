import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
} from '@nestjs/common';
import { CommissionService } from './services/commission.service';
import {
  CommissionStatus,
} from './entities/commission.entity';
import { CommissionType } from './entities/commission-plan.entity';

class CreatePlanDto {
  name: string;
  type: CommissionType;
  rate?: number;
  amount?: number;
  tiers?: { minAmount: number; maxAmount?: number; rate: number }[];
  levels?: { level: number; rate: number; description?: string }[];
  applicableTo?: 'all_products' | 'categories' | 'specific_products';
  productIds?: string[];
  categoryIds?: string[];
  active?: boolean;
}

class UpdatePlanDto extends CreatePlanDto {}

class CalculateCommissionDto {
  userId: string;
  orderId: string;
  productId?: string;
  categoryId?: string;
  saleAmount: number;
}

class PayCommissionDto {
  paidBy?: string;
  paymentReference?: string;
}

@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  // ─── Plans ─────────────────────────────────────────────────────

  @Post('plans')
  async createPlan(@Body() dto: CreatePlanDto) {
    const plan = await this.commissionService.createPlan(dto);
    return { success: true, data: plan };
  }

  @Get('plans')
  async findAllPlans() {
    const plans = await this.commissionService.findAllPlans();
    return { success: true, data: plans };
  }

  @Get('plans/:id')
  async findPlan(@Param('id', ParseUUIDPipe) id: string) {
    const plan = await this.commissionService.findPlan(id);
    return { success: true, data: plan };
  }

  @Put('plans/:id')
  async updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const plan = await this.commissionService.updatePlan(id, dto);
    return { success: true, data: plan };
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlan(@Param('id', ParseUUIDPipe) id: string) {
    await this.commissionService.deletePlan(id);
  }

  // ─── Commission Calculation & Management ───────────────────────

  @Post('calculate')
  async calculateCommission(@Body() dto: CalculateCommissionDto) {
    const commissions = await this.commissionService.calculateCommission(dto);
    return { success: true, data: commissions };
  }

  @Post(':id/approve')
  async approveCommission(@Param('id', ParseUUIDPipe) id: string) {
    const commission = await this.commissionService.approveCommission(id);
    return { success: true, data: commission };
  }

  @Post(':id/pay')
  async payCommission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayCommissionDto,
  ) {
    const commission = await this.commissionService.payCommission(
      id,
      dto.paidBy,
      dto.paymentReference,
    );
    return { success: true, data: commission };
  }

  @Get('user/:userId')
  async getUserCommissions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('status') status?: CommissionStatus,
  ) {
    const commissions = await this.commissionService.getUserCommissions(
      userId,
      status,
    );
    return { success: true, data: commissions };
  }

  @Get('report')
  async getCommissionReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: CommissionStatus,
  ) {
    const report = await this.commissionService.getCommissionReport({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId,
      status,
    });
    return { success: true, data: report };
  }

  // ─── MLM ───────────────────────────────────────────────────────

  @Get('mlm/downline/:userId')
  async getMLMDownline(@Param('userId', ParseUUIDPipe) userId: string) {
    const result = await this.commissionService.getMLMDownline(userId);
    return { success: true, data: result };
  }

  @Post('mlm/calculate')
  async calculateMLMCommission(
    @Body('saleAmount') saleAmount: number,
    @Body('referrerId') referrerId: string,
    @Body('orderId') orderId: string,
  ) {
    const commissions = await this.commissionService.calculateMLMCommission(
      saleAmount,
      referrerId,
      orderId,
    );
    return { success: true, data: commissions };
  }
}
