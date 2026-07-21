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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, ProductStatus } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UploadService } from '../upload/upload.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product', description: 'Create a new product in a store' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Store or category not found' })
  async create(@Body() dto: CreateProductDto, @Request() req) {
    const product = await this.productsService.create(req.user.userId, dto);
    return {
      success: true,
      message: 'Product created successfully',
      data: product,
    };
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List all products',
    description: 'Get a paginated list of products with search, filters, and sorting',
  })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ApiQuery({ type: ProductFilterDto })
  async findAll(@Query() filter: ProductFilterDto) {
    const result = await this.productsService.findAll(filter);
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

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search products', description: 'Full-text search on products' })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'traditional khanjar' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 400, description: 'Query too short' })
  async search(@Query('q') query: string) {
    const products = await this.productsService.search(query);
    return {
      success: true,
      data: products,
      meta: { count: products.length },
    };
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured products', description: 'Retrieve featured products' })
  @ApiResponse({ status: 200, description: 'Featured products retrieved' })
  async getFeatured() {
    const products = await this.productsService.getFeatured();
    return {
      success: true,
      data: products,
    };
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Get trending products', description: 'Retrieve trending products' })
  @ApiResponse({ status: 200, description: 'Trending products retrieved' })
  async getTrending() {
    const products = await this.productsService.getTrending();
    return {
      success: true,
      data: products,
    };
  }

  @Public()
  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get products by category', description: 'Retrieve products in a specific category' })
  @ApiParam({ name: 'categoryId', description: 'Category UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Products retrieved' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getByCategory(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    const products = await this.productsService.getByCategory(categoryId);
    return {
      success: true,
      data: products,
    };
  }

  @Public()
  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get products by store', description: 'Retrieve products from a specific store' })
  @ApiParam({ name: 'storeId', description: 'Store UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Products retrieved' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getByStore(@Param('storeId', ParseUUIDPipe) storeId: string) {
    const products = await this.productsService.getByStore(storeId);
    return {
      success: true,
      data: products,
    };
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug', description: 'Retrieve a product by its unique slug' })
  @ApiParam({ name: 'slug', description: 'Product slug', example: 'traditional-omani-khanjar' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySlug(@Param('slug') slug: string) {
    const product = await this.productsService.findBySlug(slug);
    await this.productsService.incrementViewCount(product.id);
    return {
      success: true,
      data: product,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID', description: 'Retrieve a product by its UUID' })
  @ApiParam({ name: 'id', description: 'Product UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.productsService.findOne(id);
    return {
      success: true,
      data: product,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product', description: 'Update product details' })
  @ApiParam({ name: 'id', description: 'Product UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @Request() req,
  ) {
    const product = await this.productsService.findOne(id);
    const isOwner = await this.productsService.checkOwnership(id, product.store?.id);
    if (!isOwner && req.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        message: 'You do not have permission to update this product',
      };
    }

    const updatedProduct = await this.productsService.update(id, dto);
    return {
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete product', description: 'Soft delete a product' })
  @ApiParam({ name: 'id', description: 'Product UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const product = await this.productsService.findOne(id);
    const isOwner = await this.productsService.checkOwnership(id, product.store?.id);
    if (!isOwner && req.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        message: 'You do not have permission to delete this product',
      };
    }

    await this.productsService.remove(id);
    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product status' })
  @ApiParam({ name: 'id', description: 'Product UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ProductStatus,
  ) {
    const product = await this.productsService.updateStatus(id, status);
    return {
      success: true,
      message: 'Product status updated successfully',
      data: product,
    };
  }

  @Patch(':id/inventory')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product inventory' })
  @ApiParam({ name: 'id', description: 'Product UUID', format: 'uuid' })
  @ApiBody({ schema: { properties: { quantity: { type: 'number', example: 50 } } } })
  @ApiResponse({ status: 200, description: 'Inventory updated successfully' })
  async updateInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
  ) {
    const product = await this.productsService.updateInventory(id, quantity);
    return {
      success: true,
      message: 'Inventory updated successfully',
      data: product,
    };
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload product images' })
  @ApiParam({ name: 'id', description: 'Product UUID', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  async uploadImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    const product = await this.productsService.findOne(id);
    const isOwner = await this.productsService.checkOwnership(id, product.store?.id);
    if (!isOwner) {
      return { success: false, message: 'Permission denied' };
    }

    const uploadResults = await this.uploadService.uploadMultiple(files);
    const imageUrls = uploadResults.map((r) => r.url);

    const currentImages = product.images || [];
    const updatedProduct = await this.productsService.update(id, {
      images: [...currentImages, ...imageUrls],
    });

    return {
      success: true,
      message: 'Images uploaded successfully',
      data: { product: updatedProduct, uploadedImages: imageUrls },
    };
  }
}
