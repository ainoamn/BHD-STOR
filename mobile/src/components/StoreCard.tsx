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
const CARD_WIDTH = width * 0.7;

export interface StoreCardProps {
  id: string;
  name: string;
  logo?: string;
  cover?: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  followerCount: number;
  isFollowing: boolean;
  isVerified: boolean;
  onPress: (id: string) => void;
  onFollowPress?: (id: string) => void;
  locale?: string;
}

const StoreCard: React.FC<StoreCardProps> = ({
  id,
  name,
  logo,
  cover,
  rating,
  reviewCount,
  productCount,
  followerCount,
  isFollowing,
  isVerified,
  onPress,
  onFollowPress,
  locale = 'en',
}) => {
  const rtl = isRTL(locale);

  return (
    <TouchableOpacity
      style={[styles.container, rtl && styles.containerRTL]}
      onPress={() => onPress(id)}
      activeOpacity={0.9}
    >
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        <Image
          source={{
            uri: cover || 'https://via.placeholder.com/400x150?text=Store',
          }}
          style={styles.coverImage}
          resizeMode="cover"
        />
        <View style={styles.coverOverlay} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo and Name Row */}
        <View style={[styles.headerRow, rtl && styles.rowRTL]}>
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: logo || 'https://via.placeholder.com/60?text=S',
              }}
              style={styles.logo}
              resizeMode="cover"
            />
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Icon name="check-decagram" size={12} color={colors.primary} />
              </View>
            )}
          </View>

          <View style={styles.nameContainer}>
            <Text
              style={[styles.name, rtl && styles.textRTL]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <View style={[styles.ratingRow, rtl && styles.rowRTL]}>
              <Icon name="star" size={12} color={colors.secondary} />
              <Text style={styles.ratingText}>
                {rating.toFixed(1)} ({reviewCount})
              </Text>
            </View>
          </View>

          {/* Follow Button */}
          {onFollowPress && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={() => onFollowPress(id)}
            >
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, rtl && styles.rowRTL]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{productCount}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {followerCount >= 1000
                ? `${(followerCount / 1000).toFixed(1)}K`
                : followerCount}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  containerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  coverContainer: {
    width: '100%',
    height: 80,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  logoContainer: {
    position: 'relative',
    marginRight: 10,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.card,
    marginTop: -30,
    backgroundColor: colors.surfaceVariant,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 1,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  textRTL: {
    textAlign: 'right',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  followButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  followingButton: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followButtonText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '600',
  },
  followingButtonText: {
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default StoreCard;
