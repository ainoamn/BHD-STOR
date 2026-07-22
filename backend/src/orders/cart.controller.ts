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
  ApiBody,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CartItemDto } from './dto/cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { requireRequestUserId } from '../auth/utils/request-user';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get cart', description: 'Get or create cart for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCart(@Request() req) {
    const cart = await this.cartService.getCart(requireRequestUserId(req.user));
    return {
      success: true,
      data: cart,
    };
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart', description: 'Add a product to the user cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient inventory' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addItem(@Body() dto: CartItemDto, @Request() req) {
    const cart = await this.cartService.addItem(requireRequestUserId(req.user), dto);
    return {
      success: true,
      message: 'Item added to cart',
      data: cart,
    };
  }

  @Patch('items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update cart item quantity', description: 'Update the quantity of a cart item' })
  @ApiParam({ name: 'itemId', description: 'Cart item UUID', format: 'uuid' })
  @ApiBody({ schema: { properties: { quantity: { type: 'number', example: 3, minimum: 1 } } } })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  @ApiResponse({ status: 400, description: 'Invalid quantity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async updateItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body('quantity') quantity: number,
    @Request() req,
  ) {
    const cart = await this.cartService.updateItem(requireRequestUserId(req.user), itemId, +quantity);
    return {
      success: true,
      message: 'Cart item updated',
      data: cart,
    };
  }

  @Delete('items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove cart item', description: 'Remove an item from the cart' })
  @ApiParam({ name: 'itemId', description: 'Cart item UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeItem(@Param('itemId', ParseUUIDPipe) itemId: string, @Request() req) {
    const cart = await this.cartService.removeItem(requireRequestUserId(req.user), itemId);
    return {
      success: true,
      message: 'Item removed from cart',
      data: cart,
    };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear cart', description: 'Remove all items from the cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearCart(@Request() req) {
    await this.cartService.clearCart(requireRequestUserId(req.user));
    return {
      success: true,
      message: 'Cart cleared successfully',
    };
  }

  @Post('coupon')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply coupon', description: 'Apply a coupon code to the cart' })
  @ApiBody({ schema: { properties: { code: { type: 'string', example: 'WELCOME10' } } } })
  @ApiResponse({ status: 200, description: 'Coupon applied' })
  @ApiResponse({ status: 400, description: 'Invalid coupon code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async applyCoupon(@Body('code') code: string, @Request() req) {
    const cart = await this.cartService.applyCoupon(requireRequestUserId(req.user), code);
    return {
      success: true,
      message: 'Coupon applied successfully',
      data: cart,
    };
  }

  @Delete('coupon')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove coupon', description: 'Remove the applied coupon from cart' })
  @ApiResponse({ status: 200, description: 'Coupon removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeCoupon(@Request() req) {
    const cart = await this.cartService.removeCoupon(requireRequestUserId(req.user));
    return {
      success: true,
      message: 'Coupon removed successfully',
      data: cart,
    };
  }

  @Get('totals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get cart totals', description: 'Get calculated totals for the cart' })
  @ApiResponse({ status: 200, description: 'Cart totals retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCartTotals(@Request() req) {
    const totals = await this.cartService.getCartTotals(requireRequestUserId(req.user));
    return {
      success: true,
      data: totals,
    };
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart', description: 'Merge guest session cart on login' })
  @ApiBody({ schema: { properties: { items: { type: 'array', items: { type: 'object' } } } } })
  @ApiResponse({ status: 200, description: 'Guest cart merged' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async mergeGuestCart(
    @Body('items') items: CartItemDto[],
    @Request() req,
  ) {
    const cart = await this.cartService.mergeGuestCart(requireRequestUserId(req.user), items);
    return {
      success: true,
      message: 'Guest cart merged successfully',
      data: cart,
    };
  }
}
