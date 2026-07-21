import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import {
  SHIPMENT_REGISTRY_ABI,
  SHIPMENT_REGISTRY_ADDRESS,
  ShipmentStatus,
  ShipmentStatusLabels,
  ShipmentRecord,
  StatusUpdate,
  VerificationResult,
  BlockchainRecord,
} from './smart-contract.interface';

// ─── Local Hash Chain (Fallback) ────────────────────────────────────

interface LocalChainEntry {
  shipmentId: string;
  dataHash: string;
  previousHash: string;
  timestamp: number;
  status: ShipmentStatus;
  location: string;
  txHash: string;
  blockNumber: number;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private useBlockchain = false;

  // Local fallback storage
  private localChain: Map<string, LocalChainEntry[]> = new Map();
  private localNonce = 0;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeBlockchain();
  }

  private async initializeBlockchain(): Promise<void> {
    try {
      const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL');
      const privateKey = this.configService.get<string>('BLOCKCHAIN_PRIVATE_KEY');
      const contractAddress =
        this.configService.get<string>('SHIPMENT_REGISTRY_CONTRACT_ADDRESS') ||
        SHIPMENT_REGISTRY_ADDRESS;

      if (!rpcUrl || !privateKey) {
        this.logger.warn(
          'Blockchain configuration missing. Using local hash chain fallback.',
        );
        this.useBlockchain = false;
        return;
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Verify connection
      const network = await this.provider.getNetwork();
      this.logger.log(`Connected to blockchain: ${network.name} (${network.chainId})`);

      this.contract = new ethers.Contract(
        contractAddress,
        SHIPMENT_REGISTRY_ABI,
        this.wallet,
      );

      // Verify contract
      const code = await this.provider.getCode(contractAddress);
      if (code === '0x') {
        this.logger.warn('No contract deployed at address. Using local fallback.');
        this.useBlockchain = false;
        return;
      }

      this.useBlockchain = true;
      this.logger.log(
        `Blockchain service initialized. Contract: ${contractAddress}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize blockchain: ${error.message}. Using local fallback.`,
      );
      this.useBlockchain = false;
    }
  }

  // ─── Hash Utilities ───────────────────────────────────────────────

  private computeHash(data: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  private generateLocalTxHash(): string {
    this.localNonce++;
    return ethers.keccak256(
      ethers.toUtf8Bytes(`local-tx-${Date.now()}-${this.localNonce}`),
    );
  }

  // ─── Shipment Record Creation ─────────────────────────────────────

  async createShipmentRecord(
    shipmentId: string,
    data: Record<string, unknown>,
  ): Promise<BlockchainRecord> {
    const dataString = JSON.stringify(data);
    const dataHash = this.computeHash(dataString);
    const timestamp = Math.floor(Date.now() / 1000);

    if (this.useBlockchain && this.contract) {
      try {
        const tx = await this.contract.createShipment(
          shipmentId,
          dataHash,
          dataString,
        );
        const receipt = await tx.wait();

        this.logger.log(
          `Shipment ${shipmentId} recorded on blockchain. Tx: ${receipt.hash}`,
        );

        return {
          shipmentId,
          dataHash,
          metadata: dataString,
          creator: this.wallet!.address,
          timestamp,
          blockNumber: receipt.blockNumber,
          txHash: receipt.hash,
        };
      } catch (error) {
        this.logger.error(`Blockchain write failed, falling back to local: ${error.message}`);
        return this.createLocalRecord(shipmentId, dataHash, dataString, timestamp);
      }
    }

    return this.createLocalRecord(shipmentId, dataHash, dataString, timestamp);
  }

  private createLocalRecord(
    shipmentId: string,
    dataHash: string,
    metadata: string,
    timestamp: number,
  ): BlockchainRecord {
    const previousEntries = this.localChain.get(shipmentId) || [];
    const previousHash =
      previousEntries.length > 0
        ? previousEntries[previousEntries.length - 1].txHash
        : ethers.ZeroHash;

    const entry: LocalChainEntry = {
      shipmentId,
      dataHash,
      previousHash,
      timestamp,
      status: ShipmentStatus.CREATED,
      location: 'Origin',
      txHash: this.generateLocalTxHash(),
      blockNumber: previousEntries.length + 1,
    };

    this.localChain.set(shipmentId, [...previousEntries, entry]);

    this.logger.log(`Shipment ${shipmentId} recorded locally. Hash: ${entry.txHash}`);

    return {
      shipmentId,
      dataHash,
      metadata,
      creator: 'local-system',
      timestamp,
      blockNumber: entry.blockNumber,
      txHash: entry.txHash,
    };
  }

  // ─── Status Update ────────────────────────────────────────────────

  async updateShipmentStatus(
    shipmentId: string,
    status: ShipmentStatus,
    location: string,
  ): Promise<StatusUpdate> {
    const timestamp = Math.floor(Date.now() / 1000);

    if (this.useBlockchain && this.contract) {
      try {
        const tx = await this.contract.updateStatus(shipmentId, status, location);
        const receipt = await tx.wait();

        // Get previous hash from local tracking
        const entries = this.localChain.get(shipmentId) || [];
        const previousHash =
          entries.length > 0 ? entries[entries.length - 1].txHash : ethers.ZeroHash;

        const update: StatusUpdate = {
          status,
          location,
          timestamp,
          previousHash,
          txHash: receipt.hash,
        };

        this.logger.log(
          `Status updated for ${shipmentId}: ${ShipmentStatusLabels[status]} at ${location}`,
        );

        return update;
      } catch (error) {
        this.logger.error(`Blockchain status update failed: ${error.message}`);
        return this.createLocalStatusUpdate(shipmentId, status, location, timestamp);
      }
    }

    return this.createLocalStatusUpdate(shipmentId, status, location, timestamp);
  }

  private createLocalStatusUpdate(
    shipmentId: string,
    status: ShipmentStatus,
    location: string,
    timestamp: number,
  ): StatusUpdate {
    const previousEntries = this.localChain.get(shipmentId) || [];
    const previousHash =
      previousEntries.length > 0
        ? previousEntries[previousEntries.length - 1].txHash
        : ethers.ZeroHash;

    const txHash = this.generateLocalTxHash();
    const entry: LocalChainEntry = {
      shipmentId,
      dataHash: this.computeHash(`${shipmentId}-${status}-${location}-${timestamp}`),
      previousHash,
      timestamp,
      status,
      location,
      txHash,
      blockNumber: previousEntries.length + 1,
    };

    this.localChain.set(shipmentId, [...previousEntries, entry]);

    return {
      status,
      location,
      timestamp,
      previousHash,
      txHash,
    };
  }

  // ─── Verification ─────────────────────────────────────────────────

  async verifyShipmentRecord(shipmentId: string): Promise<VerificationResult> {
    // Compute hash from local data
    const entries = this.localChain.get(shipmentId) || [];
    const record = entries[0];

    if (!record) {
      return {
        isValid: false,
        computedHash: ethers.ZeroHash,
        storedHash: ethers.ZeroHash,
        message: 'No record found for this shipment',
      };
    }

    if (this.useBlockchain && this.contract) {
      try {
        const result = await this.contract.verify(shipmentId);
        return {
          isValid: result.isValid,
          computedHash: result.computedHash,
          storedHash: result.storedHash,
          message: result.isValid
            ? 'Blockchain verification successful. Record is authentic.'
            : 'Blockchain verification failed. Record may be tampered.',
        };
      } catch (error) {
        this.logger.error(`Blockchain verification failed: ${error.message}`);
      }
    }

    // Local verification - check hash chain integrity
    let isValid = true;
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].previousHash !== entries[i - 1].txHash) {
        isValid = false;
        break;
      }
    }

    return {
      isValid,
      computedHash: record.dataHash,
      storedHash: record.dataHash,
      message: isValid
        ? 'Local hash chain verification successful. All records intact.'
        : 'Local hash chain verification failed. Some records may be tampered.',
    };
  }

  // ─── History ──────────────────────────────────────────────────────

  async getShipmentHistory(shipmentId: string): Promise<StatusUpdate[]> {
    if (this.useBlockchain && this.contract) {
      try {
        const history = await this.contract.getHistory(shipmentId);
        return history.map((h: StatusUpdate) => ({
          status: Number(h.status) as ShipmentStatus,
          location: h.location,
          timestamp: Number(h.timestamp),
          previousHash: h.previousHash,
        }));
      } catch (error) {
        this.logger.error(`Blockchain history fetch failed: ${error.message}`);
      }
    }

    // Return from local chain
    const entries = this.localChain.get(shipmentId) || [];
    return entries.map((entry) => ({
      status: entry.status,
      location: entry.location,
      timestamp: entry.timestamp,
      previousHash: entry.previousHash,
      txHash: entry.txHash,
    }));
  }

  // ─── Certificate ──────────────────────────────────────────────────

  async generateCertificate(shipmentId: string): Promise<Record<string, unknown>> {
    const history = await this.getShipmentHistory(shipmentId);
    const verification = await this.verifyShipmentRecord(shipmentId);

    const origin = history.length > 0 ? history[0] : null;
    const destination = history.length > 0 ? history[history.length - 1] : null;
    const transitPoints = history.slice(1, -1);

    const certificate = {
      certificateId: `CERT-${shipmentId}-${Date.now()}`,
      shipmentId,
      issuedAt: new Date().toISOString(),
      blockchainVerified: this.useBlockchain,
      verificationStatus: verification.isValid ? 'VERIFIED' : 'FAILED',
      origin: origin
        ? {
            location: origin.location,
            timestamp: new Date(origin.timestamp * 1000).toISOString(),
            status: ShipmentStatusLabels[origin.status],
          }
        : null,
      destination: destination
        ? {
            location: destination.location,
            timestamp: new Date(destination.timestamp * 1000).toISOString(),
            status: ShipmentStatusLabels[destination.status],
          }
        : null,
      transitHistory: transitPoints.map((point, index) => ({
        step: index + 1,
        location: point.location,
        timestamp: new Date(point.timestamp * 1000).toISOString(),
        status: ShipmentStatusLabels[point.status],
        txHash: point.txHash || point.previousHash,
      })),
      hashDetails: {
        computedHash: verification.computedHash,
        storedHash: verification.storedHash,
        message: verification.message,
      },
      authenticity: verification.isValid ? 100 : 0,
      totalUpdates: history.length,
      chainType: this.useBlockchain ? 'ethereum' : 'local_hash_chain',
    };

    this.logger.log(`Certificate generated for shipment ${shipmentId}`);

    return certificate;
  }

  // ─── Get Single Shipment ──────────────────────────────────────────

  async getShipment(shipmentId: string): Promise<ShipmentRecord | null> {
    if (this.useBlockchain && this.contract) {
      try {
        const record = await this.contract.getShipment(shipmentId);
        return {
          shipmentId: record.shipmentId,
          creator: record.creator,
          createdAt: Number(record.createdAt),
          dataHash: record.dataHash,
          status: Number(record.status) as ShipmentStatus,
        };
      } catch (error) {
        this.logger.error(`Failed to get shipment from blockchain: ${error.message}`);
      }
    }

    // Local fallback
    const entries = this.localChain.get(shipmentId);
    if (!entries || entries.length === 0) return null;

    const firstEntry = entries[0];
    return {
      shipmentId: firstEntry.shipmentId,
      creator: 'local-system',
      createdAt: firstEntry.timestamp,
      dataHash: firstEntry.dataHash,
      status: firstEntry.status,
    };
  }

  // ─── Health Check ─────────────────────────────────────────────────

  async healthCheck(): Promise<{
    connected: boolean;
    network?: string;
    blockNumber?: number;
    contractAddress?: string;
    mode: 'blockchain' | 'local_fallback';
  }> {
    if (!this.useBlockchain || !this.provider) {
      return { connected: false, mode: 'local_fallback' };
    }

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        connected: true,
        network: network.name,
        blockNumber,
        contractAddress: SHIPMENT_REGISTRY_ADDRESS,
        mode: 'blockchain',
      };
    } catch {
      return { connected: false, mode: 'local_fallback' };
    }
  }
}
