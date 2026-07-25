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
  Req,
} from '@nestjs/common';
import { CommissionService } from './services/commission.service';
import { CommissionStatus } from './entities/commission.entity';
import { CommissionType } from './entities/commission-plan.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { requireRequestUserId } from '../auth/utils/request-user';
import { assertSelfOrStaff } from '../auth/utils/self-or-staff';

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

  // ─── Plans (staff only) ─────────────────────────────────────────

  @Post('plans')
  @Roles(UserRole.ADMIN)
  async createPlan(@Body() dto: CreatePlanDto) {
    const plan = await this.commissionService.createPlan(dto);
    return { success: true, data: plan };
  }

  @Get('plans')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async findAllPlans() {
    const plans = await this.commissionService.findAllPlans();
    return { success: true, data: plans };
  }

  @Get('plans/:id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async findPlan(@Param('id', ParseUUIDPipe) id: string) {
    const plan = await this.commissionService.findPlan(id);
    return { success: true, data: plan };
  }

  @Put('plans/:id')
  @Roles(UserRole.ADMIN)
  async updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const plan = await this.commissionService.updatePlan(id, dto);
    return { success: true, data: plan };
  }

  @Delete('plans/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlan(@Param('id', ParseUUIDPipe) id: string) {
    await this.commissionService.deletePlan(id);
  }

  // ─── Commission Calculation & Management (staff) ────────────────

  @Post('calculate')
  @Roles(UserRole.ADMIN)
  async calculateCommission(@Body() dto: CalculateCommissionDto) {
    const commissions = await this.commissionService.calculateCommission(dto);
    return { success: true, data: commissions };
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN)
  async approveCommission(@Param('id', ParseUUIDPipe) id: string) {
    const commission = await this.commissionService.approveCommission(id);
    return { success: true, data: commission };
  }

  @Post(':id/pay')
  @Roles(UserRole.ADMIN)
  async payCommission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayCommissionDto,
    @Req() req: any,
  ) {
    const paidBy = dto.paidBy || requireRequestUserId(req.user);
    const commission = await this.commissionService.payCommission(
      id,
      paidBy,
      dto.paymentReference,
    );
    return { success: true, data: commission };
  }

  @Get('user/:userId')
  async getUserCommissions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('status') status?: CommissionStatus,
    @Req() req?: any,
  ) {
    const requesterId = requireRequestUserId(req.user);
    assertSelfOrStaff(
      requesterId,
      userId,
      req.user?.role,
      'You can only view your own commissions',
    );
    const commissions = await this.commissionService.getUserCommissions(
      userId,
      status,
    );
    return { success: true, data: commissions };
  }

  @Get('report')
  @Roles(UserRole.ADMIN)
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

  // ─── MLM (staff) ────────────────────────────────────────────────

  @Get('mlm/downline/:userId')
  @Roles(UserRole.ADMIN)
  async getMLMDownline(@Param('userId', ParseUUIDPipe) userId: string) {
    const result = await this.commissionService.getMLMDownline(userId);
    return { success: true, data: result };
  }

  @Post('mlm/calculate')
  @Roles(UserRole.ADMIN)
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
