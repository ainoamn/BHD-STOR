import {
  Controller,
  Get,
  Query,
  Param,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { requireRequestUserId } from '../auth/utils/request-user';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('store/:storeId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get store analytics',
    description: 'Get analytics overview for a specific store (owner or staff)',
  })
  @ApiParam({ name: 'storeId', description: 'Store UUID', format: 'uuid' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period (e.g., 7d, 30d, 3m)',
    example: '30d',
  })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStoreAnalytics(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query('period') period: string = '30d',
    @Req() req: any,
  ) {
    const userId = requireRequestUserId(req.user);
    await this.analyticsService.assertStoreAccess(storeId, userId, req.user?.role);
    const analytics = await this.analyticsService.getStoreAnalytics(storeId, period);
    return {
      success: true,
      data: analytics,
    };
  }

  @Get('product/:productId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get product analytics',
    description: 'Get analytics for a product (store owner or staff)',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID', format: 'uuid' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period',
    example: '30d',
  })
  @ApiResponse({ status: 200, description: 'Product analytics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductAnalytics(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('period') period: string = '30d',
    @Req() req: any,
  ) {
    const userId = requireRequestUserId(req.user);
    await this.analyticsService.assertProductAccess(
      productId,
      userId,
      req.user?.role,
    );
    const analytics = await this.analyticsService.getProductAnalytics(
      productId,
      period,
    );
    return {
      success: true,
      data: analytics,
    };
  }

  @Get('store/:storeId/sales-report')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get sales report',
    description: 'Get detailed sales report for a store within a date range',
  })
  @ApiParam({ name: 'storeId', description: 'Store UUID', format: 'uuid' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO)', example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO)', example: '2024-12-31' })
  @ApiResponse({ status: 200, description: 'Sales report retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getSalesReport(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ) {
    const userId = requireRequestUserId(req.user);
    await this.analyticsService.assertStoreAccess(storeId, userId, req.user?.role);
    const report = await this.analyticsService.getSalesReport(
      storeId,
      new Date(startDate),
      new Date(endDate),
    );
    return {
      success: true,
      data: report,
    };
  }

  @Get('store/:storeId/top-products')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get top products',
    description: 'Get top selling products for a store',
  })
  @ApiParam({ name: 'storeId', description: 'Store UUID', format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products', example: 10 })
  @ApiResponse({ status: 200, description: 'Top products retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getTopProducts(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query('limit') limit: number = 10,
    @Req() req: any,
  ) {
    const userId = requireRequestUserId(req.user);
    await this.analyticsService.assertStoreAccess(storeId, userId, req.user?.role);
    const products = await this.analyticsService.getTopProducts(storeId, +limit);
    return {
      success: true,
      data: products,
    };
  }

  @Get('store/:storeId/top-customers')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get top customers',
    description: 'Get top customers for a store (owner or staff)',
  })
  @ApiParam({ name: 'storeId', description: 'Store UUID', format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of customers', example: 10 })
  @ApiResponse({ status: 200, description: 'Top customers retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getTopCustomers(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query('limit') limit: number = 10,
    @Req() req: any,
  ) {
    const userId = requireRequestUserId(req.user);
    await this.analyticsService.assertStoreAccess(storeId, userId, req.user?.role);
    const customers = await this.analyticsService.getTopCustomers(storeId, +limit);
    return {
      success: true,
      data: customers,
    };
  }

  @Get('store/:storeId/revenue-chart')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get revenue chart',
    description: 'Get revenue chart data for a store',
  })
  @ApiParam({ name: 'storeId', description: 'Store UUID', format: 'uuid' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period',
    example: '30d',
  })
  @ApiResponse({ status: 200, description: 'Revenue chart retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRevenueChart(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query('period') period: string = '30d',
    @Req() req: any,
  ) {
    const userId = requireRequestUserId(req.user);
    await this.analyticsService.assertStoreAccess(storeId, userId, req.user?.role);
    const chartData = await this.analyticsService.getRevenueChart(storeId, period);
    return {
      success: true,
      data: chartData,
    };
  }

  @Get('store/:storeId/order-chart')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get order chart',
    description: 'Get order count chart data for a store',
  })
  @ApiParam({ name: 'storeId', description: 'Store UUID', format: 'uuid' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period',
    example: '30d',
  })
  @ApiResponse({ status: 200, description: 'Order chart retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOrderChart(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query('period') period: string = '30d',
    @Req() req: any,
  ) {
    const userId = requireRequestUserId(req.user);
    await this.analyticsService.assertStoreAccess(storeId, userId, req.user?.role);
    const chartData = await this.analyticsService.getOrderChart(storeId, period);
    return {
      success: true,
      data: chartData,
    };
  }

  @Get('platform')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get platform analytics',
    description: 'Get platform-wide analytics (admin only)',
  })
  @ApiResponse({ status: 200, description: 'Platform analytics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getPlatformAnalytics() {
    const analytics = await this.analyticsService.getPlatformAnalytics();
    return {
      success: true,
      data: analytics,
    };
  }
}
