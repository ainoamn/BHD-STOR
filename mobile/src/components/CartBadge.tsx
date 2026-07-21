import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';

interface CartBadgeProps {
  count: number;
  color?: string;
  size?: number;
}

const CartBadge: React.FC<CartBadgeProps> = ({
  count,
  color = colors.textSecondary,
  size = 24,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (count !== prevCountRef.current && count > 0) {
      // Animate badge on count change
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.4,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevCountRef.current = count;
  }, [count, scaleAnim]);

  return (
    <View style={styles.container}>
      <Icon name="cart-outline" size={size} color={color} />
      {count > 0 && (
        <Animated.View
          style={[
            styles.badge,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
});

export default CartBadge;
