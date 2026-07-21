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
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { HubService } from '../services/hub.service';
import { CreateHubDto } from '../dto/create-hub.dto';

@ApiTags('Logistics - Hubs')
@Controller('logistics/hubs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class HubController {
  constructor(private readonly hubService: HubService) {}

  @Post()
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Create a new hub' })
  async create(@Body() dto: CreateHubDto) {
    return this.hubService.createHub(dto);
  }

  @Get()
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get all hubs with filters' })
  @ApiQuery({ name: 'zone', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('zone') zone?: string,
    @Query('type') type?: string,
    @Query('active') active?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.hubService.findAll({ zone, type, active, page, limit });
  }

  @Get(':id')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get hub by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.hubService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Update hub' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateHubDto>,
  ) {
    return this.hubService.update(id, dto);
  }

  @Post(':id/load')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Update hub load (increment/decrement)' })
  async updateLoad(
    @Param('id', ParseUUIDPipe) hubId: string,
    @Body('change', ParseIntPipe) change: number,
  ) {
    return this.hubService.updateLoad(hubId, change);
  }

  @Get(':id/shipments')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get hub shipments' })
  @ApiQuery({ name: 'status', required: false })
  async getHubShipments(
    @Param('id', ParseUUIDPipe) hubId: string,
    @Query('status') status?: string,
  ) {
    return this.hubService.getHubShipments(hubId, status);
  }
}
