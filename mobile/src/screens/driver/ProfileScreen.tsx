import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { driverService } from '../../services/driver.service';
import type { DriverProfile } from '../../types/driver.types';

export const ProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    driverService.getDriverProfile().then(setProfile);
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => console.log('Logged out') },
    ]);
  };

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <View style={styles.profileCard}>
          <Image source={{ uri: profile.photo }} style={styles.profilePhoto} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileId}>ID: {profile.employeeId}</Text>
            <View style={styles.ratingRow}>
              <Icon name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{profile.rating}</Text>
              <Text style={styles.ratingLabel}>/ 5.0</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile.totalDeliveries.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile.successRate}%</Text>
          <Text style={styles.statLabel}>Success</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{(profile.distanceTraveled / 1000).toFixed(1)}k</Text>
          <Text style={styles.statLabel}>Km Driven</Text>
        </View>
      </View>

      {/* Vehicle Info */}
      {profile.vehicle && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="truck" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{profile.vehicle.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Model</Text>
              <Text style={styles.infoValue}>{profile.vehicle.model}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plate</Text>
              <Text style={styles.infoValue}>{profile.vehicle.plateNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Color</Text>
              <View style={styles.colorRow}>
                <View style={[styles.colorDot, { backgroundColor: profile.vehicle.color.toLowerCase() }]} />
                <Text style={styles.infoValue}>{profile.vehicle.color}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Work Schedule */}
      {profile.workSchedule && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="calendar-clock" size={20} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Work Schedule</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Days</Text>
              <Text style={styles.infoValue}>{profile.workSchedule.days.join(', ')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hours</Text>
              <Text style={styles.infoValue}>
                {profile.workSchedule.startTime} - {profile.workSchedule.endTime}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Documents */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="file-document" size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Documents</Text>
        </View>
        <View style={styles.infoCard}>
          {profile.documents.map((doc, index) => (
            <View key={index} style={[styles.docRow, index < profile.documents.length - 1 && styles.docRowBorder]}>
              <View style={styles.docLeft}>
                <Icon
                  name={doc.verified ? 'check-circle' : 'alert-circle'}
                  size={22}
                  color={doc.verified ? '#10B981' : '#F59E0B'}
                />
                <View>
                  <Text style={styles.docType}>{doc.type}</Text>
                  <Text style={styles.docNumber}>{doc.number}</Text>
                </View>
              </View>
              <View style={styles.docRight}>
                <Text style={styles.docExpiry}>Exp: {doc.expiryDate}</Text>
                {doc.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="cog" size={20} color="#6B7280" />
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Icon name="bell-outline" size={22} color="#6B7280" />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
              thumbColor={notificationsEnabled ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingLeft}>
              <Icon name="theme-light-dark" size={22} color="#6B7280" />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
              thumbColor={darkMode ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
          <TouchableOpacity style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingLeft}>
              <Icon name="translate" size={22} color="#6B7280" />
              <Text style={styles.settingLabel}>Language</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>English</Text>
              <Icon name="chevron-right" size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingLeft}>
              <Icon name="headset" size={22} color="#6B7280" />
              <Text style={styles.settingLabel}>Support</Text>
            </View>
            <Icon name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Icon name="information" size={22} color="#6B7280" />
              <Text style={styles.settingLabel}>About</Text>
            </View>
            <Text style={styles.settingValue}>v1.0.0</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    position: 'relative',
  },
  headerBg: {
    height: 100,
    backgroundColor: '#3B82F6',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: -40,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profilePhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  profileId: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  ratingLabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
    flex: 1,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  docRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  docNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  docRight: {
    alignItems: 'flex-end',
  },
  docExpiry: {
    fontSize: 12,
    color: '#6B7280',
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  bottomPadding: {
    height: 30,
  },
});
