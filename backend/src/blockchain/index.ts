// Services
export { BlockchainService } from './services/blockchain.service';

// Smart Contract Interface
export {
  SHIPMENT_REGISTRY_ABI,
  SHIPMENT_REGISTRY_ADDRESS,
  ShipmentStatus,
  ShipmentStatusLabels,
  type ShipmentRecord,
  type StatusUpdate,
  type VerificationResult,
  type BlockchainRecord,
} from './services/smart-contract.interface';

// Controller
export { BlockchainController } from './blockchain.controller';

// DTOs
export {
  CreateBlockchainRecordDto,
  UpdateShipmentStatusDto,
  VerificationResponseDto,
  CertificateResponseDto,
  HistoryResponseDto,
  HealthCheckResponseDto,
  type TransitPoint,
  type CertificateOrigin,
  type HashDetails,
} from './dto/blockchain-record.dto';

// Module
export { BlockchainModule } from './blockchain.module';
