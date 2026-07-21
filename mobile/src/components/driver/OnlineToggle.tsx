import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { driverService } from '../../services/driver.service';
import { useDriverStore } from '../../store/driverStore';

interface OnlineToggleProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const OnlineToggle: React.FC<OnlineToggleProps> = ({
  size = 'medium',
  showLabel = true,
}) => {
  const isOnline = useDriverStore(state => state.isOnline);
  const isToggling = useDriverStore(state => state.isToggling);
  const setOnline = useDriverStore(state => state.setOnline);
  const setToggling = useDriverStore(state => state.setToggling);

  const animatedValue = useRef(new Animated.Value(isOnline ? 1 : 0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOnline ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOnline, animatedValue]);

  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline, pulseAnim]);

  const togglePosition = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 28],
  });

  const handleToggle = async () => {
    if (isToggling) return;
    setToggling(true);
    try {
      const newStatus = !isOnline;
      const result = await driverService.toggleOnlineStatus(newStatus);
      if (result.success) {
        setOnline(result.isOnline);
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    } finally {
      setToggling(false);
    }
  };

  const sizeStyles = {
    small: { toggle: { width: 44, height: 24 }, circle: { width: 20, height: 20 } },
    medium: { toggle: { width: 56, height: 30 }, circle: { width: 26, height: 26 } },
    large: { toggle: { width: 70, height: 38 }, circle: { width: 34, height: 34 } },
  };

  const s = sizeStyles[size];
  const togglePos = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, s.toggle.width - s.circle.width - 2],
  });

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Animated.View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? '#10B981' : '#9CA3AF' },
              isOnline && { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Text
            style={[
              styles.statusLabel,
              { color: isOnline ? '#10B981' : '#6B7280' },
            ]}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          {isOnline && (
            <Text style={styles.earningLabel}>Ready for deliveries</Text>
          )}
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleToggle}
        disabled={isToggling}
        accessibilityRole="switch"
        accessibilityState={{ checked: isOnline }}
        accessibilityLabel={isOnline ? 'Go offline' : 'Go online'}
      >
        <Animated.View
          style={[
            styles.toggle,
            {
              width: s.toggle.width,
              height: s.toggle.height,
              backgroundColor: isOnline ? '#D1FAE5' : '#E5E7EB',
              opacity: isToggling ? 0.6 : 1,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.toggleCircle,
              {
                width: s.circle.width,
                height: s.circle.height,
                backgroundColor: isOnline ? '#10B981' : '#9CA3AF',
                transform: [{ translateX: togglePos }],
              },
            ]}
          >
            <Icon
              name={isOnline ? 'check' : 'close'}
              size={size === 'small' ? 10 : size === 'medium' ? 14 : 18}
              color="#fff"
            />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  earningLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  toggle: {
    borderRadius: 100,
    justifyContent: 'center',
    padding: 2,
  },
  toggleCircle: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
