import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto, CancelSubscriptionDto, UpgradeSubscriptionDto } from './dto/subscribe.dto';
import { SubscriptionPlanType } from './dto/create-subscription-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({
    summary: 'Get subscription plans',
    description: 'Get all active subscription plans with features',
  })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  async getPlans() {
    const plans = await this.subscriptionsService.getPlans();
    return {
      success: true,
      data: plans,
    };
  }

  @Get('plans/:planType')
  @ApiOperation({ summary: 'Get plan by type', description: 'Get a specific subscription plan' })
  @ApiParam({ name: 'planType', description: 'Plan type', enum: SubscriptionPlanType })
  @ApiResponse({ status: 200, description: 'Plan found' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanByType(
    @Param('planType', new ParseEnumPipe(SubscriptionPlanType)) planType: SubscriptionPlanType,
  ) {
    const plan = await this.subscriptionsService.getPlanByType(planType);
    return {
      success: true,
      data: plan,
    };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to plan', description: 'Subscribe to a subscription plan' })
  @ApiResponse({ status: 201, description: 'Subscribed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid plan or billing cycle' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Already subscribed to this plan' })
  async subscribe(@Body() dto: SubscribeDto, @Request() req) {
    const subscription = await this.subscriptionsService.subscribe(req.user.userId, dto);
    return {
      success: true,
      message: 'Subscribed successfully',
      data: subscription,
    };
  }

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my subscription', description: 'Get current subscription details' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No subscription found' })
  async getMySubscription(@Request() req) {
    const subscription = await this.subscriptionsService.getSubscription(req.user.userId);
    return {
      success: true,
      data: subscription,
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription status', description: 'Get subscription status summary' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSubscriptionStatus(@Request() req) {
    const status = await this.subscriptionsService.getSubscriptionStatus(req.user.userId);
    return {
      success: true,
      data: status,
    };
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel subscription', description: 'Cancel active subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  @ApiResponse({ status: 400, description: 'No active subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancel(@Body() dto: CancelSubscriptionDto, @Request() req) {
    const subscription = await this.subscriptionsService.cancel(
      req.user.userId,
      dto.reason,
    );
    return {
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription,
    };
  }

  @Post('renew')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renew subscription', description: 'Renew expired or active subscription' })
  @ApiResponse({ status: 200, description: 'Subscription renewed' })
  @ApiResponse({ status: 400, description: 'Cannot renew subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async renew(@Request() req) {
    const subscription = await this.subscriptionsService.renew(req.user.userId);
    return {
      success: true,
      message: 'Subscription renewed successfully',
      data: subscription,
    };
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade subscription', description: 'Upgrade to a higher tier plan' })
  @ApiResponse({ status: 200, description: 'Subscription upgraded' })
  @ApiResponse({ status: 400, description: 'Invalid upgrade' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upgrade(@Body() dto: UpgradeSubscriptionDto, @Request() req) {
    const subscription = await this.subscriptionsService.upgrade(req.user.userId, dto);
    return {
      success: true,
      message: 'Subscription upgraded successfully',
      data: subscription,
    };
  }

  @Post('downgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Downgrade subscription', description: 'Downgrade to a lower tier plan' })
  @ApiResponse({ status: 200, description: 'Subscription downgraded' })
  @ApiResponse({ status: 400, description: 'Invalid downgrade' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async downgrade(@Body() dto: UpgradeSubscriptionDto, @Request() req) {
    const subscription = await this.subscriptionsService.downgrade(req.user.userId, dto);
    return {
      success: true,
      message: 'Subscription downgraded successfully',
      data: subscription,
    };
  }

  @Get('feature-access/:feature')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check feature access', description: 'Check if user has access to a feature' })
  @ApiParam({ name: 'feature', description: 'Feature name', example: 'advanced_analytics' })
  @ApiResponse({ status: 200, description: 'Feature access checked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkFeatureAccess(
    @Param('feature') feature: string,
    @Request() req,
  ) {
    const result = await this.subscriptionsService.checkFeatureAccess(
      req.user.userId,
      feature,
    );
    return {
      success: true,
      data: result,
    };
  }
}
