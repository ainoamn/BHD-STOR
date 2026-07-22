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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { requireRequestUserId } from '../auth/utils/request-user';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order', description: 'Create an order from cart items' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient inventory' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product or address not found' })
  async create(@Body() dto: CreateOrderDto, @Request() req) {
    const order = await this.ordersService.create(requireRequestUserId(req.user), dto);
    return {
      success: true,
      message: 'Order created successfully',
      data: order,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List orders',
    description: 'Get user orders (all orders for admin)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'storeId', required: false, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: OrderStatus,
    @Query('storeId') storeId?: string,
  ) {
    const result = await this.ordersService.findAll(requireRequestUserId(req.user), {
      page: +page,
      limit: +limit,
      status,
      storeId,
      role: req.user.role,
    });

    return {
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('number/:orderNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by number', description: 'Retrieve an order by its order number' })
  @ApiParam({ name: 'orderNumber', description: 'Order number', example: 'BHD2406150001' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    const order = await this.ordersService.findByOrderNumber(orderNumber);
    return {
      success: true,
      data: order,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID', description: 'Retrieve an order by its UUID' })
  @ApiParam({ name: 'id', description: 'Order UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.ordersService.findOne(id);
    return {
      success: true,
      data: order,
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status', description: 'Update the status of an order' })
  @ApiParam({ name: 'id', description: 'Order UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(id, dto);
    return {
      success: true,
      message: 'Order status updated successfully',
      data: order,
    };
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel order', description: 'Cancel a pending or confirmed order' })
  @ApiParam({ name: 'id', description: 'Order UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Can only cancel own orders' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    const order = await this.ordersService.cancel(id, requireRequestUserId(req.user), reason);
    return {
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    };
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order history', description: 'Get status change history for an order' })
  @ApiParam({ name: 'id', description: 'Order UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order history retrieved' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderHistory(@Param('id', ParseUUIDPipe) id: string) {
    const history = await this.ordersService.getOrderHistory(id);
    return {
      success: true,
      data: history,
    };
  }

  @Post('validate-coupon')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate coupon', description: 'Validate a coupon code' })
  @ApiResponse({ status: 200, description: 'Coupon validation result' })
  async validateCoupon(
    @Body('code') code: string,
    @Request() req,
  ) {
    const result = await this.ordersService.validateCoupon(code, requireRequestUserId(req.user));
    return {
      success: true,
      data: result,
    };
  }
}
