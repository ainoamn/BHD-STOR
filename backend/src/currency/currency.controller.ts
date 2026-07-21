import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CurrencyService, ConversionResult } from './currency.service';
import { Currency, CurrencyCode } from './entities/currency.entity';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@users/entities/user.entity';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Currency')
@Controller('currencies')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  /**
   * List all currencies
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all currencies',
    description: 'Get a list of all supported currencies with their exchange rates.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Currencies retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            code: 'OMR',
            name: 'Omani Rial',
            symbol: 'OMR',
            flag: 'OM',
            rate: 1,
            isActive: true,
            isDefault: true,
            decimals: 3,
            formatTemplate: '{amount} {symbol}',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            code: 'USD',
            name: 'US Dollar',
            symbol: '$',
            flag: 'US',
            rate: 2.60,
            isActive: true,
            isDefault: false,
            decimals: 2,
            formatTemplate: '{symbol} {amount}',
          },
        ],
        meta: {
          timestamp: '2024-01-15T10:30:00.000Z',
          requestId: 'req-12345',
        },
      },
    },
  })
  async findAll(): Promise<Currency[]> {
    return this.currencyService.findAll();
  }

  /**
   * List active currencies
   */
  @Public()
  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List active currencies',
    description: 'Get a list of currently active currencies.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active currencies retrieved successfully',
  })
  async findActive(): Promise<Currency[]> {
    return this.currencyService.findActive();
  }

  /**
   * Get currency by code
   */
  @Public()
  @Get(':code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get currency by code',
    description: 'Get details for a specific currency by its ISO code.',
  })
  @ApiParam({
    name: 'code',
    description: 'Currency code (e.g., OMR, USD)',
    enum: CurrencyCode,
    example: 'OMR',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Currency retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Currency not found',
  })
  async findByCode(@Param('code') code: CurrencyCode): Promise<Currency> {
    return this.currencyService.findByCode(code);
  }

  /**
   * Convert amount between currencies
   */
  @Public()
  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert currency',
    description: 'Convert an amount from one currency to another.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 100 },
        from: { type: 'string', example: 'OMR', enum: Object.values(CurrencyCode) },
        to: { type: 'string', example: 'USD', enum: Object.values(CurrencyCode) },
      },
      required: ['amount', 'from', 'to'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversion successful',
    schema: {
      example: {
        data: {
          from: 'OMR',
          to: 'USD',
          amount: 100,
          convertedAmount: 260.00,
          rate: 2.6,
          timestamp: '2024-01-15T10:30:00.000Z',
        },
        meta: {
          timestamp: '2024-01-15T10:30:00.000Z',
          requestId: 'req-12345',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid currency code or amount',
  })
  async convert(
    @Body('amount') amount: number,
    @Body('from') from: CurrencyCode,
    @Body('to') to: CurrencyCode,
  ): Promise<ConversionResult> {
    return this.currencyService.convert(amount, from, to);
  }

  /**
   * Update exchange rates (admin only)
   */
  @Post('rates/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update exchange rates',
    description: 'Fetch and update all exchange rates from external API. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rates updated successfully',
  })
  async updateRates(): Promise<Currency[]> {
    return this.currencyService.updateRates();
  }
}
