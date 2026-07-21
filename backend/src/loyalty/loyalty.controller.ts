import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { LoyaltyService } from './services/loyalty.service';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { PointsTransaction } from './entities/points-transaction.entity';
import { Reward } from './entities/reward.entity';
import { RewardRedemption } from './entities/reward-redemption.entity';

@ApiTags('Loyalty & Rewards')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('account')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my loyalty account' })
  @ApiResponse({ status: HttpStatus.OK, type: LoyaltyAccount })
  async getAccount(@Req() req: any): Promise<LoyaltyAccount> {
    const userId = req.user?.id || req.user?.sub;
    return this.loyaltyService.getAccount(userId);
  }

  @Get('balance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my points balance' })
  @ApiResponse({ status: HttpStatus.OK })
  async getBalance(@Req() req: any): Promise<{
    available: number;
    total: number;
    lifetime: number;
    redeemed: number;
    tier: string;
  }> {
    const userId = req.user?.id || req.user?.sub;
    return this.loyaltyService.getPointsBalance(userId);
  }

  @Get('rewards')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List available rewards' })
  @ApiQuery({ name: 'tier', type: String, required: false })
  @ApiResponse({ status: HttpStatus.OK, type: [Reward] })
  async getAvailableRewards(
    @Req() req: any,
    @Query('tier') tier?: string,
  ): Promise<Reward[]> {
    const userId = req.user?.id || req.user?.sub;
    return this.loyaltyService.getAvailableRewards(userId, tier);
  }

  @Post('redeem')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Redeem points for a reward' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Insufficient points' })
  async redeemReward(
    @Req() req: any,
    @Body('rewardId') rewardId: string,
  ): Promise<{ redemption: RewardRedemption; remainingPoints: number }> {
    const userId = req.user?.id || req.user?.sub;
    return this.loyaltyService.redeemPoints(userId, rewardId);
  }

  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get points transaction history' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: HttpStatus.OK })
  async getTransactions(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ items: PointsTransaction[]; total: number }> {
    const userId = req.user?.id || req.user?.sub;
    return this.loyaltyService.getTransactions(
      userId,
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }

  @Get('referral')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my referral code' })
  @ApiResponse({ status: HttpStatus.OK })
  async getReferralCode(@Req() req: any): Promise<{ code: string; url: string }> {
    const userId = req.user?.id || req.user?.sub;
    return this.loyaltyService.getReferralCode(userId);
  }

  @Post('referral/apply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply a referral code' })
  @ApiResponse({ status: HttpStatus.OK })
  async applyReferral(
    @Req() req: any,
    @Body('referralCode') referralCode: string,
  ): Promise<{ success: boolean; bonus: number }> {
    const userId = req.user?.id || req.user?.sub;
    return this.loyaltyService.applyReferral(referralCode, userId);
  }

  @Get('tier')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tier info' })
  @ApiResponse({ status: HttpStatus.OK })
  async getTier(@Req() req: any): Promise<{
    tier: string;
    tierData: { name: string; minPoints: number; multiplier: number; benefits: string[] } | null;
  }> {
    const userId = req.user?.id || req.user?.sub;
    return this.loyaltyService.calculateTier(userId);
  }

  // ============ Admin Endpoints ============

  @Post('admin/earn')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually award points to a user (admin)' })
  async adminEarnPoints(
    @Body('userId') userId: string,
    @Body('orderId') orderId: string,
    @Body('amount') amount: number,
  ): Promise<{ pointsEarned: number; newBalance: number }> {
    return this.loyaltyService.earnPoints(userId, orderId, amount);
  }

  @Post('admin/adjust')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually adjust points (admin)' })
  async adminAdjustPoints(
    @Body('userId') userId: string,
    @Body('points') points: number,
    @Body('reason') reason: string,
  ): Promise<LoyaltyAccount> {
    return this.loyaltyService.adjustPoints(userId, points, reason);
  }

  @Post('admin/rewards')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new reward (admin)' })
  async createReward(@Body() data: Partial<Reward>): Promise<Reward> {
    return this.loyaltyService.createReward(data);
  }

  @Get('admin/rewards')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all rewards (admin)' })
  async getAllRewards(): Promise<Reward[]> {
    return this.loyaltyService.getAllRewards();
  }

  @Put('admin/rewards/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a reward (admin)' })
  async updateReward(
    @Param('id') id: string,
    @Body() data: Partial<Reward>,
  ): Promise<Reward> {
    return this.loyaltyService.updateReward(id, data);
  }

  @Delete('admin/rewards/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a reward (admin)' })
  async deleteReward(@Param('id') id: string): Promise<void> {
    return this.loyaltyService.deleteReward(id);
  }
}
