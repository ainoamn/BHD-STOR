import { apiClient } from '@/lib/api-client';

// ─── Types ──────────────────────────────────────────────────────────

export interface BlockchainRecord {
  shipmentId: string;
  dataHash: string;
  metadata: string;
  creator: string;
  timestamp: number;
  blockNumber?: number;
  txHash?: string;
}

export interface StatusUpdate {
  status: number;
  statusLabel: string;
  location: string;
  timestamp: string;
  previousHash: string;
  txHash?: string;
}

export interface VerificationResult {
  shipmentId: string;
  isValid: boolean;
  computedHash: string;
  storedHash: string;
  message: string;
  blockchainVerified: boolean;
  verifiedAt: string;
}

export interface CertificateData {
  certificateId: string;
  shipmentId: string;
  issuedAt: string;
  blockchainVerified: boolean;
  verificationStatus: string;
  origin: {
    location: string;
    timestamp: string;
    status: string;
  } | null;
  destination: {
    location: string;
    timestamp: string;
    status: string;
  } | null;
  transitHistory: {
    step: number;
    location: string;
    timestamp: string;
    status: string;
    txHash: string;
  }[];
  hashDetails: {
    computedHash: string;
    storedHash: string;
    message: string;
  };
  authenticity: number;
  totalUpdates: number;
  chainType: string;
}

export interface ShipmentHistory {
  shipmentId: string;
  entries: StatusUpdate[];
  totalEntries: number;
  blockchainVerified: boolean;
}

export interface HealthCheckResult {
  connected: boolean;
  network?: string;
  blockNumber?: number;
  contractAddress?: string;
  mode: 'blockchain' | 'local_fallback';
}

// ─── API Functions ──────────────────────────────────────────────────

const BASE_PATH = '/blockchain';

// Create a new blockchain record for a shipment
export async function createShipmentRecord(
  shipmentId: string,
  data: Record<string, unknown>,
): Promise<BlockchainRecord> {
  const response = await apiClient.post(`${BASE_PATH}/record`, {
    shipmentId,
    data,
  });
  return response.data.data;
}

// Update shipment status on blockchain
export async function updateShipmentStatus(
  shipmentId: string,
  status: number,
  location: string,
): Promise<StatusUpdate> {
  const response = await apiClient.post(`${BASE_PATH}/status`, {
    shipmentId,
    status,
    location,
  });
  return response.data.data;
}

// Get full shipment history
export async function getShipmentHistory(shipmentId: string): Promise<ShipmentHistory> {
  const response = await apiClient.get(`${BASE_PATH}/${shipmentId}/history`);
  return response.data.data;
}

// Verify shipment record integrity
export async function verifyShipment(shipmentId: string): Promise<VerificationResult> {
  const response = await apiClient.get(`${BASE_PATH}/${shipmentId}/verify`);
  return response.data.data;
}

// Get authenticity certificate
export async function getCertificate(shipmentId: string): Promise<CertificateData> {
  const response = await apiClient.get(`${BASE_PATH}/${shipmentId}/certificate`);
  return response.data.data;
}

// Get shipment details
export async function getShipment(shipmentId: string): Promise<BlockchainRecord | null> {
  const response = await apiClient.get(`${BASE_PATH}/${shipmentId}`);
  return response.data.data;
}

// Health check
export async function getBlockchainHealth(): Promise<HealthCheckResult> {
  const response = await apiClient.get(`${BASE_PATH}/health`);
  return response.data.data;
}
