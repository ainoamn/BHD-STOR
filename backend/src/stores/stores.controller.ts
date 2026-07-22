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
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors } from '@nestjs/common';
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
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreFilterDto, StoreStatus } from './dto/store-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { requireRequestUserId } from '../auth/utils/request-user';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UploadService } from '../upload/upload.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new store', description: 'Create a new store for the authenticated user' })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'User already owns a store' })
  async create(@Body() dto: CreateStoreDto, @Request() req) {
    const store = await this.storesService.create(requireRequestUserId(req.user), dto);
    return {
      success: true,
      message: 'Store created successfully',
      data: store,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all stores', description: 'Get a paginated list of stores with search and filters' })
  @ApiResponse({ status: 200, description: 'Stores retrieved successfully' })
  @ApiQuery({ type: StoreFilterDto })
  async findAll(@Query() filter: StoreFilterDto) {
    const result = await this.storesService.findAll(filter);
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

  /**
   * Public barcode/serial scan â€” opens that store only.
   */
  @Public()
  @Get('scan/:code')
  @ApiOperation({
    summary: 'Resolve store by serial or barcode code',
    description:
      'Used when a customer scans a store sticker. Returns the store slug/path for deep-link â€” never the marketplace home.',
  })
  @ApiParam({ name: 'code', example: 'BHD26-A1B2C3' })
  @ApiResponse({ status: 200, description: 'Store resolved' })
  @ApiResponse({ status: 404, description: 'Unknown code' })
  async resolveScan(@Param('code') code: string) {
    const data = await this.storesService.resolveByScanCode(code);
    return { success: true, data };
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my store (includes serial, barcode code, scan URL)' })
  async findMine(@Request() req) {
    const store = await this.storesService.findMine(requireRequestUserId(req.user));
    return { success: true, data: store };
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get store by slug', description: 'Retrieve a store by its unique slug' })
  @ApiParam({ name: 'slug', description: 'Store slug', example: 'al-maha-trading' })
  @ApiResponse({ status: 200, description: 'Store found' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async findBySlug(@Param('slug') slug: string) {
    const store = await this.storesService.findBySlug(slug);
    return {
      success: true,
      data: {
        ...store,
        scanUrl: this.storesService.buildScanUrl(store.storeSerial || store.storeCode || store.slug),
      },
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID', description: 'Retrieve a store by its UUID' })
  @ApiParam({ name: 'id', description: 'Store UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Store found' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const store = await this.storesService.findOne(id);
    return {
      success: true,
      data: {
        ...store,
        scanUrl: this.storesService.buildScanUrl(store.storeSerial || store.storeCode || store.slug),
      },
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store', description: 'Update store details' })
  @ApiParam({ name: 'id', description: 'Store UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
    @Request() req,
  ) {
    const isOwner = await this.storesService.checkOwnership(id, requireRequestUserId(req.user));
    if (!isOwner && req.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        message: 'You do not have permission to update this store',
      };
    }

    const store = await this.storesService.update(id, dto);
    return {
      success: true,
      message: 'Store updated successfully',
      data: store,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete store', description: 'Soft delete a store' })
  @ApiParam({ name: 'id', description: 'Store UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Store deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const isOwner = await this.storesService.checkOwnership(id, requireRequestUserId(req.user));
    if (!isOwner && req.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        message: 'You do not have permission to delete this store',
      };
    }

    await this.storesService.remove(id);
    return {
      success: true,
      message: 'Store deleted successfully',
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store status', description: 'Update store status (admin/moderator only)' })
  @ApiParam({ name: 'id', description: 'Store UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: StoreStatus,
  ) {
    const store = await this.storesService.updateStatus(id, status);
    return {
      success: true,
      message: 'Store status updated successfully',
      data: store,
    };
  }

  @Post(':id/logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload store logo' })
  @ApiParam({ name: 'id', description: 'Store UUID', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: { type: 'string', format: 'binary', description: 'Logo image file' },
      },
    },
  })
  async updateLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const isOwner = await this.storesService.checkOwnership(id, requireRequestUserId(req.user));
    if (!isOwner) {
      return { success: false, message: 'Permission denied' };
    }

    const uploadResult = await this.uploadService.uploadImage(file);
    const store = await this.storesService.updateLogo(id, uploadResult.url);

    return {
      success: true,
      message: 'Logo updated successfully',
      data: { store, logoUrl: uploadResult.url },
    };
  }

  @Post(':id/cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('cover'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload store cover image' })
  @ApiParam({ name: 'id', description: 'Store UUID', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cover: { type: 'string', format: 'binary', description: 'Cover image file' },
      },
    },
  })
  async updateCover(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const isOwner = await this.storesService.checkOwnership(id, requireRequestUserId(req.user));
    if (!isOwner) {
      return { success: false, message: 'Permission denied' };
    }

    const uploadResult = await this.uploadService.uploadImage(file);
    const store = await this.storesService.updateCover(id, uploadResult.url);

    return {
      success: true,
      message: 'Cover image updated successfully',
      data: { store, coverUrl: uploadResult.url },
    };
  }

  @Public()
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get store statistics', description: 'Get statistics for a specific store' })
  @ApiParam({ name: 'id', description: 'Store UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStoreStats(@Param('id', ParseUUIDPipe) id: string) {
    const stats = await this.storesService.getStoreStats(id);
    return {
      success: true,
      data: stats,
    };
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow/unfollow store', description: 'Toggle follow status for a store' })
  @ApiParam({ name: 'id', description: 'Store UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Follow status toggled' })
  async followStore(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    const result = await this.storesService.followStore(requireRequestUserId(req.user), id);
    return {
      success: true,
      message: result.following ? 'Store followed successfully' : 'Store unfollowed successfully',
      data: result,
    };
  }

  @Public()
  @Get(':id/followers')
  @ApiOperation({ summary: 'Get store followers', description: 'Get followers count and list' })
  @ApiParam({ name: 'id', description: 'Store UUID', format: 'uuid' })
  async getFollowers(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.storesService.getFollowers(id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify store', description: 'Verify a store (admin only)' })
  @ApiParam({ name: 'id', description: 'Store UUID', format: 'uuid' })
  async verifyStore(@Param('id', ParseUUIDPipe) id: string) {
    const store = await this.storesService.verifyStore(id);
    return {
      success: true,
      message: 'Store verified successfully',
      data: store,
    };
  }
}
