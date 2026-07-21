import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  Param,
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
import { AdminProductsService, ProductQueryDto } from '../services/admin-products.service';

@ApiTags('Admin - Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: AdminProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get product statistics' })
  getStats() {
    return this.productsService.getStats();
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update product status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'inactive' | 'out_of_stock' | 'draft',
  ) {
    return this.productsService.updateStatus(id, status);
  }

  @Post(':id/feature')
  @ApiOperation({ summary: 'Toggle featured status' })
  featureProduct(@Param('id') id: string) {
    return this.productsService.featureProduct(id);
  }

  @Put('reviews/:id/moderate')
  @ApiOperation({ summary: 'Moderate review (approve/reject)' })
  moderateReview(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
  ) {
    return this.productsService.moderateReview(id, status);
  }
}
