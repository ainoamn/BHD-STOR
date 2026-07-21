import { IsString, IsObject, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ShipmentStatus } from '../services/smart-contract.interface';

// ─── Create Record DTO ──────────────────────────────────────────────

export class CreateBlockchainRecordDto {
  @IsString()
  @IsNotEmpty()
  shipmentId: string;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, unknown>;

  @IsString()
  @IsOptional()
  metadata?: string;
}

// ─── Update Status DTO ──────────────────────────────────────────────

export class UpdateShipmentStatusDto {
  @IsString()
  @IsNotEmpty()
  shipmentId: string;

  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ─── Verify Response DTO ────────────────────────────────────────────

export class VerificationResponseDto {
  shipmentId: string;
  isValid: boolean;
  computedHash: string;
  storedHash: string;
  message: string;
  blockchainVerified: boolean;
  verifiedAt: string;
}

// ─── Certificate Response DTO ───────────────────────────────────────

export interface TransitPoint {
  step: number;
  location: string;
  timestamp: string;
  status: string;
  txHash: string;
}

export interface CertificateOrigin {
  location: string;
  timestamp: string;
  status: string;
}

export interface HashDetails {
  computedHash: string;
  storedHash: string;
  message: string;
}

export class CertificateResponseDto {
  certificateId: string;
  shipmentId: string;
  issuedAt: string;
  blockchainVerified: boolean;
  verificationStatus: string;
  origin: CertificateOrigin | null;
  destination: CertificateOrigin | null;
  transitHistory: TransitPoint[];
  hashDetails: HashDetails;
  authenticity: number;
  totalUpdates: number;
  chainType: string;
}

// ─── History Response DTO ───────────────────────────────────────────

export class HistoryResponseDto {
  shipmentId: string;
  entries: {
    status: number;
    statusLabel: string;
    location: string;
    timestamp: string;
    previousHash: string;
    txHash?: string;
  }[];
  totalEntries: number;
  blockchainVerified: boolean;
}

// ─── Health Check Response DTO ──────────────────────────────────────

export class HealthCheckResponseDto {
  connected: boolean;
  network?: string;
  blockNumber?: number;
  contractAddress?: string;
  mode: 'blockchain' | 'local_fallback';
}
