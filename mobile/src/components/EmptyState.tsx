import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  locale?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'package-variant',
  title,
  message,
  actionLabel,
  onAction,
  locale = 'en',
}) => {
  const rtl = isRTL(locale);

  return (
    <View style={[styles.container, rtl && styles.containerRTL]}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={64} color={colors.primary} />
      </View>
      <Text style={[styles.title, rtl && styles.textRTL]}>{title}</Text>
      {message && (
        <Text style={[styles.message, rtl && styles.textRTL]}>{message}</Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  containerRTL: {
    // RTL-specific adjustments
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  textRTL: {
    textAlign: 'right',
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmptyState;
