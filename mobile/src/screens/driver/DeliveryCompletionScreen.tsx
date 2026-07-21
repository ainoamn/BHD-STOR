import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DeliverySteps } from '../../components/driver/DeliverySteps';
import { SignaturePad } from '../../components/driver/SignaturePad';
import { useShipmentDetail } from '../../hooks/useDriverShipments';
import { useDeliveryCompletionFlow } from '../../hooks/useDeliveryCompletion';
import type { DriverStackParamList } from '../../navigation/DriverNavigator';
import type { SignaturePadRef } from '../../components/driver/SignaturePad';

type NavigationProp = NativeStackNavigationProp<DriverStackParamList>;
type CompletionRouteProp = RouteProp<DriverStackParamList, 'DeliveryCompletion'>;

export const DeliveryCompletionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CompletionRouteProp>();
  const { shipmentId } = route.params;

  const { data: shipment } = useShipmentDetail(shipmentId);
  const flow = useDeliveryCompletionFlow(shipmentId);
  const signatureRef = useRef<SignaturePadRef>(null);

  // Animation for success
  const [showSuccess, setShowSuccess] = useState(false);
  const successScale = useState(new Animated.Value(0))[0];
  const successOpacity = useState(new Animated.Value(0))[0];

  const animateSuccess = () => {
    setShowSuccess(true);
    Animated.parallel([
      Animated.timing(successScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto navigate after success
    setTimeout(() => {
      navigation.navigate('Shipments');
    }, 2500);
  };

  const handleSignatureSave = (base64: string) => {
    flow.signature.saveSignature(base64);
  };

  const handlePhotoCapture = () => {
    // Mock photo capture - in real app, use camera
    Alert.alert('Photo Capture', 'Take a photo of the delivered package', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Capture',
        onPress: () => {
          // Mock captured photo
          flow.photo.takePhoto('mock-photo-base64-data');
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    await flow.submitDelivery();
    if (flow.isSuccess) {
      animateSuccess();
    }
  };

  // Success overlay
  if (showSuccess || flow.isSuccess) {
    return (
      <View style={styles.successContainer}>
        <Animated.View
          style={[
            styles.successContent,
            {
              opacity: successOpacity,
              transform: [{ scale: successScale }],
            },
          ]}
        >
          <View style={styles.successCircle}>
            <Icon name="check" size={64} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Delivery Complete!</Text>
          <Text style={styles.successSubtitle}>
            {shipment?.trackingNumber || 'Shipment'} has been delivered successfully.
          </Text>
          {shipment?.codAmount && (
            <View style={styles.codCollectedBadge}>
              <Icon name="cash-check" size={20} color="#10B981" />
              <Text style={styles.codCollectedText}>
                BHD {shipment.codAmount.toFixed(2)} COD collected
              </Text>
            </View>
          )}
          <Text style={styles.redirectText}>Redirecting to shipments...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Steps indicator */}
      <View style={styles.stepsContainer}>
        <DeliverySteps steps={flow.steps} currentStep={flow.currentStep} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: OTP Verification */}
        {flow.currentStep === 0 && (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Icon name="shield-check" size={48} color="#3B82F6" />
            </View>
            <Text style={styles.stepTitle}>Verify Delivery OTP</Text>
            <Text style={styles.stepDescription}>
              Ask the receiver for the 4-digit OTP code to confirm their identity.
            </Text>

            <View style={styles.otpContainer}>
              {[0, 1, 2, 3].map(index => (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    flow.otp.otp.length > index && styles.otpBoxFilled,
                    flow.otp.error && styles.otpBoxError,
                    flow.otp.isVerified && styles.otpBoxSuccess,
                  ]}
                >
                  <Text style={styles.otpText}>
                    {flow.otp.otp[index] || ''}
                  </Text>
                </View>
              ))}
            </View>

            {flow.otp.error && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{flow.otp.error}</Text>
              </View>
            )}

            {flow.otp.isVerified && (
              <View style={styles.verifiedContainer}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.verifiedText}>OTP Verified Successfully</Text>
              </View>
            )}

            {/* Numeric Keypad */}
            {!flow.otp.isVerified && (
              <View style={styles.keypad}>
                {[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                  ['C', '0', 'DEL'],
                ].map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.keypadRow}>
                    {row.map(key => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.keypadButton,
                          key === 'C' && styles.keypadClear,
                          key === 'DEL' && styles.keypadClear,
                        ]}
                        onPress={() => {
                          if (key === 'C') {
                            flow.otp.setOtp('');
                          } else if (key === 'DEL') {
                            flow.otp.setOtp(prev => prev.slice(0, -1));
                          } else if (flow.otp.otp.length < 4) {
                            const newOtp = flow.otp.otp + key;
                            flow.otp.setOtp(newOtp);
                            if (newOtp.length === 4) {
                              setTimeout(() => flow.otp.verifyOtp(), 300);
                            }
                          }
                        }}
                      >
                        {key === 'DEL' ? (
                          <Icon name="backspace" size={22} color="#EF4444" />
                        ) : key === 'C' ? (
                          <Text style={[styles.keypadText, { color: '#EF4444' }]}>{key}</Text>
                        ) : (
                          <Text style={styles.keypadText}>{key}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {flow.otp.isVerified && (
              <TouchableOpacity style={styles.nextButton} onPress={flow.nextStep}>
                <Text style={styles.nextButtonText}>Continue</Text>
                <Icon name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 2: Signature */}
        {flow.currentStep === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Icon name="signature" size={48} color="#8B5CF6" />
            </View>
            <Text style={styles.stepTitle}>Capture Signature</Text>
            <Text style={styles.stepDescription}>
              Ask {shipment?.delivery.name || 'the receiver'} to sign below.
            </Text>

            <View style={styles.signatureWrapper}>
              <SignaturePad
                ref={signatureRef}
                onSave={handleSignatureSave}
                width={340}
                height={200}
              />
            </View>

            {flow.signature.signature && (
              <TouchableOpacity style={styles.nextButton} onPress={flow.nextStep}>
                <Text style={styles.nextButtonText}>Continue</Text>
                <Icon name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 3: Photo */}
        {flow.currentStep === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Icon name="camera" size={48} color="#10B981" />
            </View>
            <Text style={styles.stepTitle}>Photo Proof</Text>
            <Text style={styles.stepDescription}>
              Take a photo of the delivered package at the delivery location.
            </Text>

            {!flow.photo.photo ? (
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handlePhotoCapture}
              >
                <Icon name="camera" size={48} color="#3B82F6" />
                <Text style={styles.cameraText}>Tap to Capture Photo</Text>
                <Text style={styles.cameraHint}>
                  Make sure the package and location are visible
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.photoPreview}>
                <View style={styles.photoPlaceholder}>
                  <Icon name="image-check" size={48} color="#10B981" />
                  <Text style={styles.photoCapturedText}>Photo Captured</Text>
                </View>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={flow.photo.retakePhoto}
                >
                  <Icon name="camera-retake" size={18} color="#6B7280" />
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            )}

            {flow.photo.photo && (
              <TouchableOpacity style={styles.nextButton} onPress={flow.nextStep}>
                <Text style={styles.nextButtonText}>Continue</Text>
                <Icon name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 4: Confirm */}
        {flow.currentStep === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Icon name="clipboard-check" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.stepTitle}>Confirm Delivery</Text>
            <Text style={styles.stepDescription}>
              Review the details and complete the delivery.
            </Text>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tracking</Text>
                <Text style={styles.summaryValue}>
                  {shipment?.trackingNumber || '---'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Receiver</Text>
                <Text style={styles.summaryValue}>
                  {shipment?.delivery.name || '---'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>OTP</Text>
                <View style={styles.otpVerifiedBadge}>
                  <Icon name="check" size={12} color="#fff" />
                  <Text style={styles.otpVerifiedText}>Verified</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Signature</Text>
                <View style={styles.otpVerifiedBadge}>
                  <Icon name="check" size={12} color="#fff" />
                  <Text style={styles.otpVerifiedText}>Captured</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Photo</Text>
                <View style={styles.otpVerifiedBadge}>
                  <Icon name="check" size={12} color="#fff" />
                  <Text style={styles.otpVerifiedText}>Captured</Text>
                </View>
              </View>
              {shipment?.codAmount ? (
                <View style={[styles.summaryRow, styles.codSummaryRow]}>
                  <Text style={styles.summaryLabel}>COD Amount</Text>
                  <Text style={styles.codSummaryValue}>
                    BHD {shipment.codAmount.toFixed(2)}
                  </Text>
                </View>
              ) : null}
            </View>

            {flow.submitError && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{flow.submitError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={flow.isSubmitting}
            >
              {flow.isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="check-circle" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Complete Delivery</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.footer}>
        {flow.currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={flow.prevStep}>
            <Icon name="arrow-left" size={18} color="#6B7280" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  stepsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  // OTP
  otpContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  otpBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  otpBoxError: {
    borderColor: '#EF4444',
  },
  otpBoxSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  otpText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    backgroundColor: '#ECFDF5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },

  // Keypad
  keypad: {
    width: '100%',
    maxWidth: 320,
    gap: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keypadButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  keypadClear: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  keypadText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },

  // Signature
  signatureWrapper: {
    marginBottom: 20,
  },

  // Camera
  cameraButton: {
    width: 280,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  cameraHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  photoPreview: {
    marginBottom: 20,
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 280,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCapturedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 8,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  retakeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Summary
  summaryCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  codSummaryRow: {
    borderBottomWidth: 0,
    marginTop: 4,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  codSummaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
  },
  otpVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  otpVerifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },

  // Buttons
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 10,
    width: '100%',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  codCollectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  codCollectedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  redirectText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
