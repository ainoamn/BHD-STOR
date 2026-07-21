// ─── Smart Contract ABI ─────────────────────────────────────────────
// ShipmentRegistry.sol - Ethereum Smart Contract Interface
//
// contract ShipmentRegistry {
//   struct ShipmentRecord {
//     string shipmentId;
//     address creator;
//     uint256 createdAt;
//     bytes32 dataHash;
//     Status status;
//   }
//   struct StatusUpdate {
//     Status status;
//     string location;
//     uint256 timestamp;
//     bytes32 previousHash;
//   }
//   enum Status { CREATED, PICKED_UP, IN_TRANSIT, AT_HUB, OUT_FOR_DELIVERY, DELIVERED, EXCEPTION }
//   event ShipmentCreated(string shipmentId, address creator, uint256 timestamp, bytes32 dataHash);
//   event StatusUpdated(string shipmentId, Status status, string location, uint256 timestamp, bytes32 txHash);
// }

export const SHIPMENT_REGISTRY_ABI = [
  // Constructor
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'shipmentId', type: 'string' },
      { indexed: false, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'bytes32', name: 'dataHash', type: 'bytes32' },
    ],
    name: 'ShipmentCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'shipmentId', type: 'string' },
      { indexed: false, internalType: 'uint8', name: 'status', type: 'uint8' },
      { indexed: false, internalType: 'string', name: 'location', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'bytes32', name: 'txHash', type: 'bytes32' },
    ],
    name: 'StatusUpdated',
    type: 'event',
  },

  // Read Functions
  {
    inputs: [{ internalType: 'string', name: 'shipmentId', type: 'string' }],
    name: 'getShipment',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'shipmentId', type: 'string' },
          { internalType: 'address', name: 'creator', type: 'address' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'bytes32', name: 'dataHash', type: 'bytes32' },
          { internalType: 'uint8', name: 'status', type: 'uint8' },
        ],
        internalType: 'struct ShipmentRegistry.ShipmentRecord',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'shipmentId', type: 'string' }],
    name: 'getHistory',
    outputs: [
      {
        components: [
          { internalType: 'uint8', name: 'status', type: 'uint8' },
          { internalType: 'string', name: 'location', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'bytes32', name: 'previousHash', type: 'bytes32' },
        ],
        internalType: 'struct ShipmentRegistry.StatusUpdate[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'shipmentId', type: 'string' }],
    name: 'verify',
    outputs: [
      { internalType: 'bool', name: 'isValid', type: 'bool' },
      { internalType: 'bytes32', name: 'computedHash', type: 'bytes32' },
      { internalType: 'bytes32', name: 'storedHash', type: 'bytes32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'shipmentId', type: 'string' }],
    name: 'getRecordCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getContractAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },

  // Write Functions
  {
    inputs: [
      { internalType: 'string', name: 'shipmentId', type: 'string' },
      { internalType: 'bytes32', name: 'dataHash', type: 'bytes32' },
      { internalType: 'string', name: 'metadata', type: 'string' },
    ],
    name: 'createShipment',
    outputs: [{ internalType: 'bytes32', name: 'txHash', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'shipmentId', type: 'string' },
      { internalType: 'uint8', name: 'status', type: 'uint8' },
      { internalType: 'string', name: 'location', type: 'string' },
    ],
    name: 'updateStatus',
    outputs: [{ internalType: 'bytes32', name: 'txHash', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// ─── Contract Address ───────────────────────────────────────────────

export const SHIPMENT_REGISTRY_ADDRESS =
  process.env.SHIPMENT_REGISTRY_CONTRACT_ADDRESS ||
  '0x0000000000000000000000000000000000000000';

// ─── Enums ──────────────────────────────────────────────────────────

export enum ShipmentStatus {
  CREATED = 0,
  PICKED_UP = 1,
  IN_TRANSIT = 2,
  AT_HUB = 3,
  OUT_FOR_DELIVERY = 4,
  DELIVERED = 5,
  EXCEPTION = 6,
}

export const ShipmentStatusLabels: Record<ShipmentStatus, string> = {
  [ShipmentStatus.CREATED]: 'Created',
  [ShipmentStatus.PICKED_UP]: 'Picked Up',
  [ShipmentStatus.IN_TRANSIT]: 'In Transit',
  [ShipmentStatus.AT_HUB]: 'At Hub',
  [ShipmentStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ShipmentStatus.DELIVERED]: 'Delivered',
  [ShipmentStatus.EXCEPTION]: 'Exception',
};

// ─── Types ──────────────────────────────────────────────────────────

export interface ShipmentRecord {
  shipmentId: string;
  creator: string;
  createdAt: number;
  dataHash: string;
  status: ShipmentStatus;
}

export interface StatusUpdate {
  status: ShipmentStatus;
  location: string;
  timestamp: number;
  previousHash: string;
  txHash?: string;
}

export interface VerificationResult {
  isValid: boolean;
  computedHash: string;
  storedHash: string;
  message?: string;
}

export interface BlockchainRecord {
  shipmentId: string;
  dataHash: string;
  metadata: string;
  creator: string;
  timestamp: number;
  blockNumber?: number;
  txHash?: string;
}
