import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { ShippingCarriersService } from '../../shipping/services/shipping-carriers.service';

@ApiTags('Admin - Shipping')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/shipping')
export class AdminShippingController {
  constructor(private readonly carriersService: ShippingCarriersService) {}

  @Get('carriers')
  @ApiOperation({ summary: 'List shipping carriers (admin)' })
  async listCarriers() {
    const data = await this.carriersService.listAllForAdmin();
    return { success: true, data };
  }

  @Patch('carriers/:idOrCode')
  @ApiOperation({ summary: 'Enable or disable a shipping carrier' })
  async setCarrierActive(
    @Param('idOrCode') idOrCode: string,
    @Body('isActive') isActive: boolean,
  ) {
    const data = await this.carriersService.setCarrierActive(
      idOrCode,
      Boolean(isActive),
    );
    return {
      success: true,
      message: `Carrier ${data.code} ${isActive ? 'enabled' : 'disabled'}`,
      data,
    };
  }
}
