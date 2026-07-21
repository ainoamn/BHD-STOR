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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review', description: 'Create a new product review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Already reviewed this product' })
  async create(@Body() dto: CreateReviewDto, @Request() req) {
    const review = await this.reviewsService.create(req.user.userId, dto);
    return {
      success: true,
      message: 'Review created successfully',
      data: review,
    };
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get product reviews', description: 'Get all reviews for a specific product' })
  @ApiParam({ name: 'productId', description: 'Product UUID', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.reviewsService.findByProduct(productId, +page, +limit);
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

  @Get('product/:productId/summary')
  @ApiOperation({ summary: 'Get product review summary', description: 'Get rating summary for a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Review summary retrieved' })
  async getProductReviewSummary(@Param('productId', ParseUUIDPipe) productId: string) {
    const summary = await this.reviewsService.getProductReviewSummary(productId);
    return {
      success: true,
      data: summary,
    };
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my reviews', description: 'Get all reviews written by the authenticated user' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  async findMyReviews(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.reviewsService.findByUser(req.user.userId, +page, +limit);
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

  @Get('can-review/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user can review', description: 'Check if authenticated user can review a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID', format: 'uuid' })
  async canReview(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Request() req,
  ) {
    const canReview = await this.reviewsService.canReview(req.user.userId, productId);
    return {
      success: true,
      data: { canReview },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID', description: 'Retrieve a review by its UUID' })
  @ApiParam({ name: 'id', description: 'Review UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Review found' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const review = await this.reviewsService.findOne(id);
    return {
      success: true,
      data: review,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review', description: 'Update your own review' })
  @ApiParam({ name: 'id', description: 'Review UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Can only update own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateReviewDto>,
    @Request() req,
  ) {
    const review = await this.reviewsService.update(id, req.user.userId, dto);
    return {
      success: true,
      message: 'Review updated successfully',
      data: review,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete review', description: 'Delete your own review' })
  @ApiParam({ name: 'id', description: 'Review UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Can only delete own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.reviewsService.remove(id, req.user.userId);
    return {
      success: true,
      message: 'Review deleted successfully',
    };
  }

  @Post(':id/helpful')
  @ApiOperation({ summary: 'Mark review as helpful', description: 'Increment helpful count for a review' })
  @ApiParam({ name: 'id', description: 'Review UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Marked as helpful' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async markHelpful(@Param('id', ParseUUIDPipe) id: string) {
    const review = await this.reviewsService.markHelpful(id);
    return {
      success: true,
      message: 'Review marked as helpful',
      data: review,
    };
  }
}
