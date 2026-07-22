'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  ShieldCheck,
  MapPin,
  Clock,
  Hash,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  Truck,
  Package,
  CheckCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { getCertificate } from '@/services/blockchain.service';

interface TransitPoint {
  step: number;
  location: string;
  timestamp: string;
  status: string;
  txHash: string;
}

interface CertificateData {
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
  transitHistory: TransitPoint[];
  hashDetails: {
    computedHash: string;
    storedHash: string;
    message: string;
  };
  authenticity: number;
  totalUpdates: number;
  chainType: string;
}

interface BlockchainCertificateProps {
  shipmentId?: string;
}

export function BlockchainCertificate({ shipmentId: defaultShipmentId }: BlockchainCertificateProps) {
  const [shipmentId, setShipmentId] = useState(defaultShipmentId || '');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [error, setError] = useState('');
  const [showTimeline, setShowTimeline] = useState(false);

  const fetchCertificate = async () => {
    if (!shipmentId.trim()) {
      setError('Please enter a shipment ID');
      return;
    }

    setLoading(true);
    setError('');
    setCertificate(null);

    try {
      const data = await getCertificate(shipmentId.trim());
      setCertificate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch certificate');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = () => {
    if (!certificate) return;

    const certJson = JSON.stringify(certificate, null, 2);
    const blob = new Blob([certJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate-${certificate.shipmentId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const truncateHash = (hash: string) => {
    if (!hash || hash.length <= 16) return hash || '-';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Input */}
      {!defaultShipmentId && (
        <div className="bg-card border rounded-xl p-6 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Authenticity Certificate</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Generate a blockchain-backed certificate of authenticity for any shipment.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter shipment ID"
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCertificate()}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={fetchCertificate} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Generate
            </Button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Certificate Display */}
      <AnimatePresence>
        {certificate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-card border-2 border-primary/20 rounded-xl overflow-hidden shadow-xl"
          >
            {/* Certificate Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Certificate of Authenticity</h3>
                    <p className="text-xs text-muted-foreground">{certificate.certificateId}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={downloadCertificate} className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Authenticity Score */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Authenticity Score</span>
                <span
                  className={`text-lg font-bold ${
                    certificate.authenticity >= 90
                      ? 'text-green-600'
                      : certificate.authenticity >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {certificate.authenticity}%
                </span>
              </div>
              <Progress value={certificate.authenticity} className="h-3" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {certificate.verificationStatus === 'VERIFIED' ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Verified on {certificate.chainType}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      Verification failed
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {certificate.totalUpdates} updates
                </span>
              </div>
            </div>

            {/* Origin & Destination */}
            <div className="p-6 border-b">
              <div className="grid grid-cols-2 gap-4">
                {/* Origin */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Origin</span>
                  </div>
                  {certificate.origin ? (
                    <>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {certificate.origin.location}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(certificate.origin.timestamp).toLocaleString()}
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium mt-2">
                        {certificate.origin.status}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No origin data</span>
                  )}
                </div>

                {/* Destination */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold">Destination</span>
                  </div>
                  {certificate.destination ? (
                    <>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {certificate.destination.location}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(certificate.destination.timestamp).toLocaleString()}
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium mt-2">
                        {certificate.destination.status}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No destination data</span>
                  )}
                </div>
              </div>
            </div>

            {/* Transit Timeline */}
            {certificate.transitHistory.length > 0 && (
              <div className="p-6 border-b">
                <button
                  onClick={() => setShowTimeline(!showTimeline)}
                  className="flex items-center justify-between w-full"
                >
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    Transit Timeline ({certificate.transitHistory.length} steps)
                  </span>
                  {showTimeline ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {showTimeline && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3">
                        {certificate.transitHistory.map((point, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                          >
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {point.step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm font-medium">{point.location}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(point.timestamp).toLocaleString()}
                                </span>
                                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  {point.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Hash className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {truncateHash(point.txHash)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Hash Details */}
            <div className="p-6">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Hash Verification Details
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                  <span className="text-muted-foreground">Computed Hash</span>
                  <span className="font-mono">{truncateHash(certificate.hashDetails.computedHash)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                  <span className="text-muted-foreground">Stored Hash</span>
                  <span className="font-mono">{truncateHash(certificate.hashDetails.storedHash)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{certificate.hashDetails.message}</p>

              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  Issued on {new Date(certificate.issuedAt).toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Blockchain: {certificate.chainType} | Certificate: {certificate.certificateId}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
