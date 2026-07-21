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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ZoneService } from '../services/zone.service';
import { CreateZoneDto } from '../dto/create-zone.dto';

@ApiTags('Logistics - Zones')
@Controller('logistics/zones')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @Post()
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Create a new zone' })
  async create(@Body() dto: CreateZoneDto) {
    return this.zoneService.createZone(dto);
  }

  @Get()
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get all zones as tree structure' })
  async findAll() {
    return this.zoneService.findAll();
  }

  @Get('coverage')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get covered zones' })
  async getCoverageAreas() {
    return this.zoneService.getCoverageAreas();
  }

  @Get('check-coverage')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Check if coordinates are covered' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  async isAddressCovered(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ) {
    const covered = await this.zoneService.isAddressCovered(lat, lng);
    return { covered };
  }

  @Get('by-coordinates')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get zone by GPS coordinates' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  async getZoneByCoordinates(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ) {
    return this.zoneService.getZoneByCoordinates(lat, lng);
  }

  @Get(':id')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get zone by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.zoneService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Update zone' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateZoneDto>,
  ) {
    return this.zoneService.update(id, dto);
  }
}
