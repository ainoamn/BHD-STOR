import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
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
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { requireRequestUserId } from '../auth/utils/request-user';

@ApiTags('Wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wishlist', description: 'Get the authenticated user wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWishlist(@Request() req) {
    const wishlist = await this.wishlistService.getWishlist(requireRequestUserId(req.user));
    return {
      success: true,
      data: wishlist,
    };
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wishlist count', description: 'Get the number of items in wishlist' })
  @ApiResponse({ status: 200, description: 'Count retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWishlistCount(@Request() req) {
    const count = await this.wishlistService.getWishlistCount(requireRequestUserId(req.user));
    return {
      success: true,
      data: { count },
    };
  }

  @Get('check/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check wishlist status', description: 'Check if a product is in the user wishlist' })
  @ApiParam({ name: 'productId', description: 'Product UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Wishlist status checked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async isInWishlist(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Request() req,
  ) {
    const inWishlist = await this.wishlistService.isInWishlist(requireRequestUserId(req.user), productId);
    return {
      success: true,
      data: { inWishlist },
    };
  }

  @Post('toggle/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle wishlist', description: 'Add or remove a product from wishlist' })
  @ApiParam({ name: 'productId', description: 'Product UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Wishlist toggled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async toggleWishlist(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Request() req,
  ) {
    const result = await this.wishlistService.toggleWishlist(requireRequestUserId(req.user), productId);
    return {
      success: true,
      message: result.inWishlist
        ? 'Product added to wishlist'
        : 'Product removed from wishlist',
      data: result,
    };
  }

  @Post(':productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add to wishlist', description: 'Add a product to the user wishlist' })
  @ApiParam({ name: 'productId', description: 'Product UUID', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Product added to wishlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product already in wishlist' })
  async addToWishlist(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Request() req,
  ) {
    const wishlist = await this.wishlistService.addToWishlist(requireRequestUserId(req.user), productId);
    return {
      success: true,
      message: 'Product added to wishlist',
      data: wishlist,
    };
  }

  @Delete(':productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove from wishlist', description: 'Remove a product from the user wishlist' })
  @ApiParam({ name: 'productId', description: 'Product UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product removed from wishlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not in wishlist' })
  async removeFromWishlist(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Request() req,
  ) {
    const wishlist = await this.wishlistService.removeFromWishlist(requireRequestUserId(req.user), productId);
    return {
      success: true,
      message: 'Product removed from wishlist',
      data: wishlist,
    };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear wishlist', description: 'Remove all items from wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist cleared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearWishlist(@Request() req) {
    await this.wishlistService.clearWishlist(requireRequestUserId(req.user));
    return {
      success: true,
      message: 'Wishlist cleared successfully',
    };
  }
}
