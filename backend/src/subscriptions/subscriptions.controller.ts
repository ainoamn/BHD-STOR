import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { ChooseMonetizationDto } from './dto/choose-monetization.dto';
import { SubscribeDto, CancelSubscriptionDto, UpgradeSubscriptionDto } from './dto/subscribe.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PlanTier } from './entities/subscription-plan.entity';
import { requireRequestUserId } from '../auth/utils/request-user';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List seller subscription plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved' })
  async getPlans() {
    const plans = await this.subscriptionsService.getPlans();
    return { success: true, data: plans };
  }

  @Public()
  @Get('plans/:tier')
  @ApiOperation({ summary: 'Get plan by tier' })
  @ApiParam({ name: 'tier', enum: PlanTier })
  async getPlanByTier(@Param('tier') tier: string) {
    const plan = await this.subscriptionsService.getPlanByType(tier);
    return { success: true, data: plan };
  }

  @Get('me')
  @ApiBearerAuth()
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Current seller monetization choice' })
  async getMine(@Request() req) {
    const data = await this.subscriptionsService.getMyMonetization(
      requireRequestUserId(req.user),
    );
    return { success: true, data };
  }

  @Post('choose')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Choose subscription package OR commission percentage',
  })
  async choose(@Body() dto: ChooseMonetizationDto, @Request() req) {
    const data = await this.subscriptionsService.chooseMonetization(
      requireRequestUserId(req.user),
      dto,
    );
    return { success: true, message: 'Monetization updated', data };
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Subscribe to a plan (alias of choose subscription)' })
  async subscribe(@Body() dto: SubscribeDto, @Request() req) {
    const data = await this.subscriptionsService.subscribe(
      requireRequestUserId(req.user),
      {
        plan: dto.plan as string,
        billingCycle: dto.billingCycle as string,
      },
    );
    return { success: true, message: 'Subscribed', data };
  }

  @Get('my-subscription')
  @ApiBearerAuth()
  async mySubscription(@Request() req) {
    const data = await this.subscriptionsService.getMySubscription(
      requireRequestUserId(req.user),
    );
    return { success: true, data };
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async cancel(@Body() dto: CancelSubscriptionDto, @Request() req) {
    const data = await this.subscriptionsService.cancel(
      requireRequestUserId(req.user),
      dto.reason,
    );
    return { success: true, message: 'Switched to commission mode', data };
  }

  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async upgrade(@Body() dto: UpgradeSubscriptionDto, @Request() req) {
    const data = await this.subscriptionsService.upgrade(
      requireRequestUserId(req.user),
      {
        newPlan: dto.newPlan as string,
      },
    );
    return { success: true, data };
  }
}
