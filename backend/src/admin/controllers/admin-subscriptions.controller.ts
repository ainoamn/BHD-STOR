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
import {
  AdminSubscriptionsService,
  SubscriberQueryDto,
} from '../services/admin-subscriptions.service';

@ApiTags('Admin - Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: AdminSubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List all subscription plans' })
  findAllPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create new subscription plan' })
  createPlan(@Body() data: any) {
    return this.subscriptionsService.createPlan(data);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update subscription plan' })
  updatePlan(@Param('id') id: string, @Body() data: any) {
    return this.subscriptionsService.updatePlan(id, data);
  }

  @Get('subscribers')
  @ApiOperation({ summary: 'List all subscribers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'planId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  getSubscribers(@Query() query: SubscriberQueryDto) {
    return this.subscriptionsService.getSubscribers(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get subscription statistics' })
  getStats() {
    return this.subscriptionsService.getStats();
  }
}
