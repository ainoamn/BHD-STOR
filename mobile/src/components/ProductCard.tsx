import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  discount?: number;
  freeShipping?: boolean;
  onPress: (id: string) => void;
  onWishlistPress?: (id: string) => void;
  isWishlisted?: boolean;
  locale?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  originalPrice,
  image,
  rating,
  reviewCount,
  isNew = false,
  discount,
  freeShipping = false,
  onPress,
  onWishlistPress,
  isWishlisted = false,
  locale = 'en',
}) => {
  const rtl = isRTL(locale);
  const hasDiscount = !!discount && discount > 0;
  const displayOriginalPrice = originalPrice || (hasDiscount ? price * (1 + discount / 100) : null);

  return (
    <TouchableOpacity
      style={[styles.container, rtl && styles.containerRTL]}
      onPress={() => onPress(id)}
      activeOpacity={0.8}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image }}
          style={styles.image}
          resizeMode="cover"
          // defaultSource={require('@assets/placeholder-product.png')}
        />

        {/* Badges */}
        <View style={styles.badgesContainer}>
          {isNew && (
            <View style={[styles.badge, styles.newBadge]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
          {hasDiscount && (
            <View style={[styles.badge, styles.discountBadge]}>
              <Text style={styles.badgeText}>-{discount}%</Text>
            </View>
          )}
        </View>

        {/* Wishlist Button */}
        {onWishlistPress && (
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={() => onWishlistPress(id)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Icon
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={20}
              color={isWishlisted ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Free Shipping Badge */}
        {freeShipping && (
          <View style={styles.shippingBadge}>
            <Icon name="truck-fast" size={10} color={colors.success} />
            <Text style={styles.shippingText}>FREE</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.name, rtl && styles.textRTL]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {name}
        </Text>

        {/* Rating */}
        <View style={[styles.ratingContainer, rtl && styles.rowRTL]}>
          <Icon name="star" size={12} color={colors.secondary} />
          <Text style={styles.ratingText}>
            {rating.toFixed(1)} ({reviewCount})
          </Text>
        </View>

        {/* Price */}
        <View style={[styles.priceContainer, rtl && styles.rowRTL]}>
          <Text style={styles.price}>OMR {price.toFixed(3)}</Text>
          {displayOriginalPrice && (
            <Text style={styles.originalPrice}>
              OMR {displayOriginalPrice.toFixed(3)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  containerRTL: {
    // RTL-specific adjustments
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: colors.surfaceVariant,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgesContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'column',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  newBadge: {
    backgroundColor: colors.info,
  },
  discountBadge: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  shippingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  shippingText: {
    fontSize: 9,
    color: colors.success,
    fontWeight: '600',
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 4,
  },
  textRTL: {
    textAlign: 'right',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  ratingText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});

export default ProductCard;
