import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { driverService } from '../../services/driver.service';
import type { Shipment } from '../../types/driver.types';
import type { DriverStackParamList } from '../../navigation/DriverNavigator';

type NavigationProp = NativeStackNavigationProp<DriverStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCANNER_SIZE = SCREEN_WIDTH - 80;

export const ScanScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [scanning, setScanning] = useState(true);
  const [scannedShipment, setScannedShipment] = useState<Shipment | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Simulate QR scanning
  const handleBarCodeScanned = async (trackingNumber: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const shipment = await driverService.scanTrackingNumber(trackingNumber);
      if (shipment) {
        setScannedShipment(shipment);
        setScanning(false);
      } else {
        Alert.alert('Not Found', `No shipment found with tracking number: ${trackingNumber}`, [
          { text: 'Try Again', onPress: () => setIsProcessing(false) },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to look up tracking number');
      setIsProcessing(false);
    }
  };

  // Simulate scan after 3 seconds
  useEffect(() => {
    if (scanning && !showManual) {
      const timer = setTimeout(() => {
        // In real app, this would be triggered by actual QR scan
        // handleBarCodeScanned('BHD-2024-001001');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [scanning, showManual]);

  const handleManualSubmit = () => {
    Keyboard.dismiss();
    if (manualInput.trim().length < 5) {
      Alert.alert('Invalid', 'Please enter a valid tracking number');
      return;
    }
    handleBarCodeScanned(manualInput.trim());
  };

  const handleViewShipment = () => {
    if (scannedShipment) {
      setScannedShipment(null);
      setScanning(true);
      setIsProcessing(false);
      navigation.navigate('ShipmentDetail', { id: scannedShipment.id });
    }
  };

  const handleScanAgain = () => {
    setScannedShipment(null);
    setScanning(true);
    setIsProcessing(false);
    setManualInput('');
  };

  // Scanned result view
  if (scannedShipment) {
    return (
      <View style={styles.container}>
        <View style={styles.resultHeader}>
          <View style={styles.successIcon}>
            <Icon name="check-circle" size={48} color="#10B981" />
          </View>
          <Text style={styles.resultTitle}>Shipment Found!</Text>
        </View>

        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tracking</Text>
            <Text style={styles.resultValue}>{scannedShipment.trackingNumber}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.statusText, { color: '#3B82F6' }]}>
                {scannedShipment.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Receiver</Text>
            <Text style={styles.resultValue}>{scannedShipment.delivery.name}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Address</Text>
            <Text style={styles.resultValue}>{scannedShipment.delivery.address}</Text>
          </View>
          {scannedShipment.codAmount ? (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>COD</Text>
              <Text style={[styles.resultValue, styles.codValue]}>
                BHD {scannedShipment.codAmount.toFixed(2)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.viewButton} onPress={handleViewShipment}>
            <Icon name="eye" size={18} color="#fff" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain}>
            <Icon name="qrcode-scan" size={18} color="#3B82F6" />
            <Text style={styles.scanAgainText}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <Text style={styles.headerSubtitle}>
          Scan the shipment QR code to view details
        </Text>
      </View>

      {/* Scanner View */}
      {scanning && !showManual && (
        <View style={styles.scannerContainer}>
          {/* Scanner Frame */}
          <View style={styles.scannerFrame}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Laser line animation */}
            <View style={styles.laserLine} />

            {/* Center icon */}
            <View style={styles.scannerCenter}>
              <Icon name="qrcode-scan" size={40} color="rgba(255,255,255,0.5)" />
            </View>
          </View>

          <Text style={styles.scannerHint}>
            Position the QR code within the frame
          </Text>

          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.processingText}>Looking up shipment...</Text>
            </View>
          )}
        </View>
      )}

      {/* Manual Entry */}
      {showManual && (
        <View style={styles.manualContainer}>
          <View style={styles.manualCard}>
            <Icon name="barcode-scan" size={48} color="#3B82F6" />
            <Text style={styles.manualTitle}>Enter Tracking Number</Text>
            <Text style={styles.manualSubtitle}>
              Type the tracking number manually if the QR code is not readable.
            </Text>
            <TextInput
              style={styles.manualInput}
              placeholder="e.g., BHD-2024-001001"
              placeholderTextColor="#9CA3AF"
              value={manualInput}
              onChangeText={setManualInput}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.manualSubmit}
              onPress={handleManualSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="magnify" size={18} color="#fff" />
                  <Text style={styles.manualSubmitText}>Look Up</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => {
            setShowManual(!showManual);
            setScanning(showManual);
          }}
        >
          <Icon
            name={showManual ? 'qrcode-scan' : 'keyboard'}
            size={20}
            color="#3B82F6"
          />
          <Text style={styles.toggleText}>
            {showManual ? 'Scan QR Code' : 'Enter Manually'}
          </Text>
        </TouchableOpacity>

        {/* Quick scan demo buttons */}
        <View style={styles.demoButtons}>
          <Text style={styles.demoLabel}>Quick Test:</Text>
          <View style={styles.demoRow}>
            {['BHD-2024-001001', 'BHD-2024-001002', 'BHD-2024-001003'].map(tn => (
              <TouchableOpacity
                key={tn}
                style={styles.demoButton}
                onPress={() => handleBarCodeScanned(tn)}
              >
                <Text style={styles.demoButtonText}>{tn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3B82F6',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  laserLine: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#3B82F6',
    opacity: 0.8,
  },
  scannerCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerHint: {
    marginTop: 24,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#fff',
  },
  manualContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  manualCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  manualTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  manualSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  manualInput: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  manualSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
    width: '100%',
  },
  manualSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  demoButtons: {
    marginTop: 16,
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  demoButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  demoButtonText: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // Result styles
  resultHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    gap: 14,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    maxWidth: 200,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  codValue: {
    color: '#F59E0B',
    fontSize: 16,
  },
  resultActions: {
    marginHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  scanAgainText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
});
