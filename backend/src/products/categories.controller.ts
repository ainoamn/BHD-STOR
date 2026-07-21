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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category', description: 'Create a new product category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Category already exists' })
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto);
    return {
      success: true,
      message: 'Category created successfully',
      data: category,
    };
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List all categories',
    description: 'Get all categories with optional tree structure',
  })
  @ApiQuery({ name: 'tree', required: false, description: 'Return nested tree structure', example: 'true' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAll(@Query('tree') tree?: string) {
    const withTree = tree === 'true';
    const categories = await this.categoriesService.findAll(withTree);
    return {
      success: true,
      data: categories,
      meta: { count: categories.length },
    };
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Get category tree', description: 'Get categories in nested tree structure' })
  @ApiResponse({ status: 200, description: 'Category tree retrieved' })
  async getTree() {
    const categories = await this.categoriesService.getTree();
    return {
      success: true,
      data: categories,
    };
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search categories', description: 'Search categories by name' })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'traditional' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Query('q') query: string) {
    const categories = await this.categoriesService.search(query);
    return {
      success: true,
      data: categories,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID', description: 'Retrieve a category by its UUID' })
  @ApiParam({ name: 'id', description: 'Category UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.categoriesService.findOne(id);
    return {
      success: true,
      data: category,
    };
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get category by slug', description: 'Retrieve a category by its slug' })
  @ApiParam({ name: 'slug', description: 'Category slug', example: 'traditional-products' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findBySlug(@Param('slug') slug: string) {
    const category = await this.categoriesService.findBySlug(slug);
    return {
      success: true,
      data: category,
    };
  }

  @Public()
  @Get(':id/path')
  @ApiOperation({ summary: 'Get category breadcrumb path', description: 'Get full path from root to category' })
  @ApiParam({ name: 'id', description: 'Category UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Category path retrieved' })
  async getCategoryPath(@Param('id', ParseUUIDPipe) id: string) {
    const path = await this.categoriesService.getCategoryPath(id);
    return {
      success: true,
      data: path,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category', description: 'Update category details' })
  @ApiParam({ name: 'id', description: 'Category UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(id, dto);
    return {
      success: true,
      message: 'Category updated successfully',
      data: category,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category', description: 'Soft delete a category' })
  @ApiParam({ name: 'id', description: 'Category UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category has subcategories' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriesService.remove(id);
    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }
}
