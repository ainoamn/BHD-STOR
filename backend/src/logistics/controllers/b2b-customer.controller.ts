import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { B2bCustomerService } from '../services/b2b-customer.service';
import { CreateB2bCustomerDto } from '../dto/create-b2b-customer.dto';
import { B2BCustomerStatus } from '../entities/b2b-customer.entity';

@ApiTags('Logistics - B2B Customers')
@Controller('logistics/b2b-customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class B2bCustomerController {
  constructor(private readonly b2bService: B2bCustomerService) {}

  @Post()
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Create a new B2B customer' })
  async create(@Body() dto: CreateB2bCustomerDto) {
    return this.b2bService.createCustomer(dto);
  }

  @Get()
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get all B2B customers' })
  @ApiQuery({ name: 'status', required: false, enum: B2BCustomerStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: B2BCustomerStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.b2bService.findAll({ status, search, page, limit });
  }

  @Get(':id')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Get B2B customer by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.b2bService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Update B2B customer' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateB2bCustomerDto>,
  ) {
    return this.b2bService.update(id, dto);
  }

  @Post(':id/regenerate-api-key')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Regenerate API key' })
  async regenerateApiKey(@Param('id', ParseUUIDPipe) customerId: string) {
    return this.b2bService.regenerateApiKey(customerId);
  }

  @Post(':id/api-access')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Toggle API access' })
  async toggleApiAccess(
    @Param('id', ParseUUIDPipe) customerId: string,
    @Body('enabled', ParseBoolPipe) enabled: boolean,
  ) {
    return this.b2bService.toggleApiAccess(customerId, enabled);
  }

  @Post(':id/credit-limit')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Update credit limit' })
  async updateCreditLimit(
    @Param('id', ParseUUIDPipe) customerId: string,
    @Body('amount') amount: number,
  ) {
    return this.b2bService.updateCreditLimit(customerId, amount);
  }

  @Get(':id/shipments')
  @Roles('admin', 'logistics_manager', 'b2b_customer')
  @ApiOperation({ summary: 'Get customer shipments' })
  async getCustomerShipments(@Param('id', ParseUUIDPipe) customerId: string) {
    return this.b2bService.getCustomerShipments(customerId);
  }

  @Get(':id/statement')
  @Roles('admin', 'logistics_manager', 'b2b_customer')
  @ApiOperation({ summary: 'Get customer statement' })
  async getCustomerStatement(
    @Param('id', ParseUUIDPipe) customerId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.b2bService.getCustomerStatement(customerId, {
      from: new Date(from),
      to: new Date(to),
    });
  }
}
