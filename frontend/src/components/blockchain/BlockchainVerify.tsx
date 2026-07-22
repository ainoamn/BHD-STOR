'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, Search, Loader2, Fingerprint, Lock, Hash, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { verifyShipment } from '@/services/blockchain.service';

interface VerificationResult {
  shipmentId: string;
  isValid: boolean;
  computedHash: string;
  storedHash: string;
  message: string;
  blockchainVerified: boolean;
  verifiedAt: string;
}

interface BlockchainVerifyProps {
  defaultShipmentId?: string;
  onVerified?: (result: VerificationResult) => void;
}

export function BlockchainVerify({ defaultShipmentId = '', onVerified }: BlockchainVerifyProps) {
  const [shipmentId, setShipmentId] = useState(defaultShipmentId);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!shipmentId.trim()) {
      setError('Please enter a shipment ID');
      return;
    }

    setVerifying(true);
    setError('');
    setResult(null);

    try {
      const data = await verifyShipment(shipmentId.trim());
      setResult(data);
      onVerified?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const truncateHash = (hash: string) => {
    if (hash.length <= 20) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Input Section */}
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Fingerprint className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Verify Authenticity</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Enter a shipment ID to verify its blockchain record and ensure authenticity.
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="Enter shipment ID (e.g., SHIP-123456)"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            className="flex-1"
            disabled={verifying}
          />
          <Button onClick={handleVerify} disabled={verifying} className="gap-2">
            {verifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Verify
          </Button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </div>

      {/* Result Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="mt-4 bg-card border rounded-xl p-6 shadow-lg"
          >
            {/* Status Header */}
            <div className="flex items-center justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  result.isValid
                    ? 'bg-green-100 dark:bg-green-900'
                    : 'bg-red-100 dark:bg-red-900'
                }`}
              >
                {result.isValid ? (
                  <ShieldCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
                ) : (
                  <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
                )}
              </motion.div>
            </div>

            <div className="text-center mb-6">
              <h3
                className={`text-lg font-bold ${
                  result.isValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {result.isValid ? 'Authentic & Verified' : 'Verification Failed'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileCheck className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Shipment ID</div>
                  <div className="text-sm font-medium truncate">{result.shipmentId}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Hash className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Computed Hash</div>
                  <div className="text-xs font-mono truncate">{truncateHash(result.computedHash)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Lock className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Stored Hash</div>
                  <div className="text-xs font-mono truncate">{truncateHash(result.storedHash)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Blockchain</span>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    result.blockchainVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {result.blockchainVerified ? 'On-Chain' : 'Local Chain'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-xs text-muted-foreground">Verified At</span>
                <span className="text-xs font-medium">
                  {new Date(result.verifiedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
