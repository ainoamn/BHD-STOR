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
import { PricingService } from '../services/pricing.service';
import { CreatePricingRuleDto } from '../dto/create-pricing-rule.dto';
import { CalculatePriceDto } from '../dto/calculate-price.dto';

@ApiTags('Logistics - Pricing')
@Controller('logistics/pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  @Roles('admin', 'logistics_manager', 'dispatcher', 'b2b_customer')
  @ApiOperation({ summary: 'Calculate shipping price' })
  async calculatePrice(@Body() dto: CalculatePriceDto) {
    return this.pricingService.calculatePrice(dto);
  }

  @Post('rules')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Create pricing rule' })
  async createRule(@Body() dto: CreatePricingRuleDto) {
    return this.pricingService.createPricingRule(dto);
  }

  @Get('rules')
  @Roles('admin', 'logistics_manager', 'dispatcher')
  @ApiOperation({ summary: 'Get all pricing rules' })
  async findAllRules() {
    return this.pricingService.findAllRules();
  }

  @Patch('rules/:id')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Update pricing rule' })
  async updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreatePricingRuleDto>,
  ) {
    return this.pricingService.updateRule(id, dto);
  }

  @Post('rules/bulk-update')
  @Roles('admin', 'logistics_manager')
  @ApiOperation({ summary: 'Bulk update pricing rules' })
  async bulkUpdateRules(
    @Body() rules: { id: string; data: Partial<CreatePricingRuleDto> }[],
  ) {
    return this.pricingService.bulkUpdateRules(rules);
  }

  @Get('b2b/:customerId')
  @Roles('admin', 'logistics_manager', 'b2b_customer')
  @ApiOperation({ summary: 'Get B2B pricing with discounts' })
  @ApiQuery({ name: 'weight', required: true, type: Number })
  @ApiQuery({ name: 'fromZoneId', required: true })
  @ApiQuery({ name: 'toZoneId', required: true })
  @ApiQuery({ name: 'distance', required: false, type: Number })
  async getPricingForB2B(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query('weight') weight: number,
    @Query('fromZoneId') fromZoneId: string,
    @Query('toZoneId') toZoneId: string,
    @Query('distance') distance?: number,
  ) {
    return this.pricingService.getPricingForB2B(customerId, weight, {
      fromZoneId,
      toZoneId,
      distance,
    });
  }
}
