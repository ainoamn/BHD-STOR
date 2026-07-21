'use client';

import React, { useState, useCallback, useRef } from 'react';
import { createBulkShipments } from '../../services/b2b.service';
import type { CreateShipmentData } from '../../services/b2b.service';

interface BulkUploadProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

interface ParsedRow {
  row: number;
  data: Partial<CreateShipmentData>;
  valid: boolean;
  errors: string[];
}

interface UploadResult {
  success: boolean;
  trackingNumber?: string;
  error?: string;
}

export default function BulkUpload({ onSuccess, onClose }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const parseCSV = useCallback((text: string): ParsedRow[] => {
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const errors: string[] = [];
      const data: Partial<CreateShipmentData> = {
        sender: { name: '', phone: '', address: '' },
        receiver: { name: '', phone: '', address: '' },
        package: { type: 'parcel', weight: 0 },
        serviceType: 'standard',
      };

      // Map CSV columns to shipment data
      headers.forEach((header, idx) => {
        const value = values[idx] || '';
        switch (header) {
          case 'receiver_name':
            if (data.receiver) data.receiver.name = value;
            break;
          case 'receiver_phone':
            if (data.receiver) data.receiver.phone = value;
            break;
          case 'receiver_address':
            if (data.receiver) data.receiver.address = value;
            break;
          case 'receiver_province':
            if (data.receiver) data.receiver.province = value;
            break;
          case 'receiver_district':
            if (data.receiver) data.receiver.district = value;
            break;
          case 'package_type':
            if (data.package) {
              data.package.type = (value as CreateShipmentData['package']['type']) || 'parcel';
            }
            break;
          case 'weight':
            if (data.package) data.package.weight = parseFloat(value) || 0;
            break;
          case 'service_type':
            data.serviceType = (value as CreateShipmentData['serviceType']) || 'standard';
            break;
          case 'cod_amount':
            data.codAmount = parseFloat(value) || 0;
            break;
          case 'declared_value':
            if (data.package) data.package.declaredValue = parseFloat(value) || 0;
            break;
          case 'reference_number':
            data.referenceNumber = value;
            break;
          case 'notes':
            data.notes = value;
            break;
        }
      });

      // Validate
      if (!data.receiver?.name) errors.push('Receiver name is required');
      if (!data.receiver?.phone) errors.push('Receiver phone is required');
      if (!data.receiver?.address) errors.push('Receiver address is required');
      if (!data.package?.weight || data.package.weight <= 0)
        errors.push('Valid weight is required');
      if (!data.serviceType) errors.push('Service type is required');

      rows.push({
        row: i + 1,
        data,
        valid: errors.length === 0,
        errors,
      });
    }

    return rows;
  }, []);

  const handleFile = useCallback(
    (selectedFile: File) => {
      setFile(selectedFile);
      setResults(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = parseCSV(text);
        setParsedRows(rows);
      };
      reader.readAsText(selectedFile);
    },
    [parseCSV],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx'))) {
        handleFile(droppedFile);
      }
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFile(selectedFile);
    },
    [handleFile],
  );

  const handleUpload = useCallback(async () => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setUploading(true);
    try {
      const shipments = validRows.map((r) => r.data as CreateShipmentData);
      const response = await createBulkShipments(shipments);
      setResults(response.data);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setResults(
        validRows.map(() => ({ success: false, error: message })),
      );
    } finally {
      setUploading(false);
    }
  }, [parsedRows, onSuccess]);

  const downloadTemplate = useCallback(() => {
    const headers = [
      'receiver_name',
      'receiver_phone',
      'receiver_address',
      'receiver_province',
      'receiver_district',
      'package_type',
      'weight',
      'service_type',
      'cod_amount',
      'declared_value',
      'reference_number',
      'notes',
    ].join(',');
    const sample = [
      'Nguyen Van A,0901234567,123 Le Loi District 1 HCMC,Ho Chi Minh,District 1,parcel,2.5,standard,0,500000,REF001,Fragile items',
      'Tran Thi B,0912345678,456 Nguyen Hue District 1 HCMC,Ho Chi Minh,District 1,document,0.5,express,0,0,REF002,Documents',
    ].join('\n');
    const csv = `${headers}\n${sample}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bhd_bulk_shipment_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.filter((r) => !r.valid).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Bulk Upload Shipments
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Upload a CSV file to create multiple shipments at once
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Download Template */}
        <button
          onClick={downloadTemplate}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download CSV Template
        </button>

        {/* Drop Zone */}
        {!file && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">CSV files only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {/* File Info */}
        {file && !results && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <div className="flex items-center gap-2">
              {validCount > 0 && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                  {validCount} valid
                </span>
              )}
              {invalidCount > 0 && (
                <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                  {invalidCount} invalid
                </span>
              )}
              <button
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                }}
                className="text-gray-400 hover:text-red-600 p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Parsed Rows Preview */}
        {parsedRows.length > 0 && !results && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Row</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Receiver</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Phone</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Address</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Weight</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Service</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedRows.map((row) => (
                    <tr key={row.row} className={row.valid ? '' : 'bg-red-50'}>
                      <td className="px-3 py-2 text-gray-500">{row.row}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {row.data.receiver?.name || '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.data.receiver?.phone || '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-600 truncate max-w-[150px]">
                        {row.data.receiver?.address || '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.data.package?.weight} kg
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        <span className="capitalize">{row.data.serviceType}</span>
                      </td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <span className="text-emerald-600 font-medium">Valid</span>
                        ) : (
                          <span
                            className="text-red-600 font-medium cursor-help"
                            title={row.errors.join(', ')}
                          >
                            Invalid ({row.errors.length})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {parsedRows.length > 0 && !results && (
          <button
            onClick={handleUpload}
            disabled={uploading || validCount === 0}
            className={`w-full font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
              validCount > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload {validCount} Shipments
              </>
            )}
          </button>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Upload Results</h4>
              <span className="text-sm text-gray-500">
                {results.filter((r) => r.success).length} / {results.length} successful
              </span>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Result</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((result, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2">
                        {result.success ? (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Success
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {result.success ? (
                          <span className="font-mono text-blue-600">
                            {result.trackingNumber}
                          </span>
                        ) : (
                          <span className="text-red-500">{result.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                  setResults(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                Upload More
              </button>
              <button
                onClick={onSuccess}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
