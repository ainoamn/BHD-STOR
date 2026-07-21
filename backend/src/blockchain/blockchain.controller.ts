import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BlockchainService } from './services/blockchain.service';
import {
  CreateBlockchainRecordDto,
  UpdateShipmentStatusDto,
} from './dto/blockchain-record.dto';
import { ShipmentStatusLabels } from './services/smart-contract.interface';

@Controller('blockchain')
export class BlockchainController {
  private readonly logger = new Logger(BlockchainController.name);

  constructor(private readonly blockchainService: BlockchainService) {}

  // ─── Create Record ────────────────────────────────────────────────

  @Post('record')
  @HttpCode(HttpStatus.CREATED)
  async createRecord(@Body() dto: CreateBlockchainRecordDto) {
    this.logger.log(`Creating blockchain record for shipment: ${dto.shipmentId}`);

    const record = await this.blockchainService.createShipmentRecord(
      dto.shipmentId,
      dto.data,
    );

    return {
      success: true,
      data: record,
      message: 'Shipment record created successfully',
    };
  }

  // ─── Update Status ────────────────────────────────────────────────

  @Post('status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Body() dto: UpdateShipmentStatusDto) {
    this.logger.log(
      `Updating status for shipment ${dto.shipmentId}: ${ShipmentStatusLabels[dto.status]} at ${dto.location}`,
    );

    const update = await this.blockchainService.updateShipmentStatus(
      dto.shipmentId,
      dto.status,
      dto.location,
    );

    return {
      success: true,
      data: {
        ...update,
        statusLabel: ShipmentStatusLabels[update.status],
        timestamp: new Date(update.timestamp * 1000).toISOString(),
      },
      message: 'Status updated successfully',
    };
  }

  // ─── Get History ──────────────────────────────────────────────────

  @Get(':shipmentId/history')
  async getHistory(@Param('shipmentId') shipmentId: string) {
    this.logger.log(`Fetching history for shipment: ${shipmentId}`);

    const history = await this.blockchainService.getShipmentHistory(shipmentId);
    const shipment = await this.blockchainService.getShipment(shipmentId);

    const health = await this.blockchainService.healthCheck();

    return {
      success: true,
      data: {
        shipmentId,
        shipment,
        entries: history.map((entry) => ({
          status: entry.status,
          statusLabel: ShipmentStatusLabels[entry.status],
          location: entry.location,
          timestamp: new Date(entry.timestamp * 1000).toISOString(),
          previousHash: entry.previousHash,
          txHash: entry.txHash || null,
        })),
        totalEntries: history.length,
        blockchainVerified: health.mode === 'blockchain',
      },
    };
  }

  // ─── Verify ───────────────────────────────────────────────────────

  @Get(':shipmentId/verify')
  async verify(@Param('shipmentId') shipmentId: string) {
    this.logger.log(`Verifying shipment: ${shipmentId}`);

    const result = await this.blockchainService.verifyShipmentRecord(shipmentId);
    const health = await this.blockchainService.healthCheck();

    return {
      success: true,
      data: {
        shipmentId,
        ...result,
        blockchainVerified: health.mode === 'blockchain',
        verifiedAt: new Date().toISOString(),
      },
      message: result.message,
    };
  }

  // ─── Certificate ──────────────────────────────────────────────────

  @Get(':shipmentId/certificate')
  async getCertificate(@Param('shipmentId') shipmentId: string) {
    this.logger.log(`Generating certificate for shipment: ${shipmentId}`);

    const certificate = await this.blockchainService.generateCertificate(shipmentId);

    return {
      success: true,
      data: certificate,
      message: 'Certificate generated successfully',
    };
  }

  // ─── Get Shipment ─────────────────────────────────────────────────

  @Get(':shipmentId')
  async getShipment(@Param('shipmentId') shipmentId: string) {
    this.logger.log(`Fetching shipment: ${shipmentId}`);

    const shipment = await this.blockchainService.getShipment(shipmentId);

    if (!shipment) {
      return {
        success: false,
        data: null,
        message: 'Shipment not found',
      };
    }

    return {
      success: true,
      data: {
        ...shipment,
        statusLabel: ShipmentStatusLabels[shipment.status],
        createdAt: new Date(shipment.createdAt * 1000).toISOString(),
      },
      message: 'Shipment found',
    };
  }

  // ─── Health Check ─────────────────────────────────────────────────

  @Get('health')
  async healthCheck() {
    const health = await this.blockchainService.healthCheck();

    return {
      success: true,
      data: health,
      message: health.connected
        ? 'Blockchain connection is healthy'
        : 'Running in local fallback mode',
    };
  }
}
