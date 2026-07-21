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
import { AdminStoresService, StoreQueryDto } from '../services/admin-stores.service';

@ApiTags('Admin - Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/stores')
export class AdminStoresController {
  constructor(private readonly storesService: AdminStoresService) {}

  @Get()
  @ApiOperation({ summary: 'List all stores with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'verificationStatus', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: StoreQueryDto) {
    return this.storesService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get store statistics' })
  getStats() {
    return this.storesService.getStats();
  }

  @Get('pending-verifications')
  @ApiOperation({ summary: 'Get stores pending verification' })
  getPendingVerifications() {
    return this.storesService.getPendingVerifications();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store details' })
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify a store' })
  verifyStore(@Param('id') id: string) {
    return this.storesService.verifyStore(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update store status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'suspended' | 'rejected',
  ) {
    return this.storesService.updateStatus(id, status);
  }
}
