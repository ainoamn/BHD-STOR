import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { driverService } from '../../services/driver.service';
import { useUpdateShipmentStatus } from '../../hooks/useDriverShipments';
import type { IssueType, IssueReport } from '../../types/driver.types';
import type { DriverStackParamList } from '../../navigation/DriverNavigator';

type NavigationProp = NativeStackNavigationProp<DriverStackParamList>;
type IssueRouteProp = RouteProp<DriverStackParamList, 'IssueReport'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

const issueTypes: { type: IssueType; label: string; icon: string; color: string; bg: string }[] = [
  {
    type: 'customer_not_available',
    label: 'Customer Not Available',
    icon: 'account-off',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  {
    type: 'wrong_address',
    label: 'Wrong Address',
    icon: 'map-marker-off',
    color: '#EF4444',
    bg: '#FEE2E2',
  },
  {
    type: 'delivery_failed',
    label: 'Delivery Failed',
    icon: 'close-circle',
    color: '#EF4444',
    bg: '#FEE2E2',
  },
  {
    type: 'package_damaged',
    label: 'Package Damaged',
    icon: 'package-variant-closed-remove',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  {
    type: 'vehicle_problem',
    label: 'Vehicle Problem',
    icon: 'car-wrench',
    color: '#8B5CF6',
    bg: '#EDE9FE',
  },
  {
    type: 'accident',
    label: 'Accident',
    icon: 'car-emergency',
    color: '#EF4444',
    bg: '#FEE2E2',
  },
];

export const IssueReportScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<IssueRouteProp>();
  const { shipmentId } = route.params;
  const { updateStatus } = useUpdateShipmentStatus();

  const [selectedType, setSelectedType] = useState<IssueType | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoCapture = () => {
    Alert.alert('Photo', 'Capture a photo of the issue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Capture',
        onPress: () => {
          setPhotos(prev => [...prev, `photo_${Date.now()}.jpg`]);
        },
      },
    ]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Required', 'Please select an issue type');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Required', 'Please provide a description of at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const issueData: IssueReport = {
        shipmentId,
        issueType: selectedType,
        description: description.trim(),
        photos: photos.length > 0 ? photos : undefined,
      };

      await driverService.reportIssue(shipmentId, issueData);
      updateStatus({ id: shipmentId, status: 'failed' });

      Alert.alert('Issue Reported', 'Your issue has been reported successfully.', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Shipments');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to report issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = !selectedType || description.trim().length < 10 || isSubmitting;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.warningIcon}>
            <Icon name="alert-circle" size={32} color="#EF4444" />
          </View>
          <Text style={styles.headerTitle}>Report an Issue</Text>
          <Text style={styles.headerSubtitle}>
            Please describe the issue you encountered with this delivery
          </Text>
        </View>

        {/* Issue Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Type *</Text>
          <View style={styles.issueGrid}>
            {issueTypes.map(issue => (
              <TouchableOpacity
                key={issue.type}
                style={[
                  styles.issueCard,
                  selectedType === issue.type && styles.issueCardActive,
                  selectedType === issue.type && { borderColor: issue.color },
                ]}
                onPress={() => setSelectedType(issue.type)}
              >
                <View style={[styles.issueIcon, { backgroundColor: issue.bg }]}>
                  <Icon name={issue.icon} size={24} color={issue.color} />
                </View>
                <Text
                  style={[
                    styles.issueLabel,
                    selectedType === issue.type && { color: issue.color, fontWeight: '700' },
                  ]}
                >
                  {issue.label}
                </Text>
                {selectedType === issue.type && (
                  <View style={[styles.checkIcon, { backgroundColor: issue.color }]}>
                    <Icon name="check" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description *</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the issue in detail... (min 10 characters)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>
        </View>

        {/* Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos (Optional)</Text>
          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <View style={styles.photoPlaceholder}>
                  <Icon name="image" size={28} color="#6B7280" />
                </View>
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => removePhoto(index)}
                >
                  <Icon name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addPhoto} onPress={handlePhotoCapture}>
              <Icon name="camera-plus" size={28} color="#3B82F6" />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Icon name="information" size={18} color="#F59E0B" />
          <Text style={styles.warningText}>
            Reporting an issue will mark this shipment as failed. The operations team will review and follow up.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="send" size={18} color={isSubmitDisabled ? '#9CA3AF' : '#fff'} />
              <Text style={[styles.submitText, isSubmitDisabled && styles.submitTextDisabled]}>
                Submit Report
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  warningIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  issueCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  issueCardActive: {
    borderWidth: 2,
    backgroundColor: '#FAFAFA',
  },
  issueIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textAreaContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  textArea: {
    height: 100,
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoItem: {
    position: 'relative',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  addPhoto: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 4,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  submitTextDisabled: {
    color: '#9CA3AF',
  },
});
