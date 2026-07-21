import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';
import { useStore, useStores } from '@hooks/useProducts';
import ProductCard from '@components/ProductCard';
import LoadingSkeleton from '@components/LoadingSkeleton';
import EmptyState from '@components/EmptyState';

const { width } = Dimensions.get('window');

interface StoreScreenProps {
  locale?: string;
}

const StoreScreen: React.FC<StoreScreenProps> = ({ locale = 'en' }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const rtl = isRTL(locale);

  const { storeId } = route.params as { storeId: string };

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'about'>('products');

  const { store, isLoading: storeLoading } = useStore(storeId);

  // Mock products for this store
  const storeProducts = [
    {
      id: 'p1',
      name: 'Premium Omani Dates',
      price: 5.5,
      originalPrice: 7.0,
      image: 'https://via.placeholder.com/200?text=Dates',
      rating: 4.8,
      reviewCount: 124,
      discount: 21,
    },
    {
      id: 'p2',
      name: 'Frankincense Resin',
      price: 8.0,
      image: 'https://via.placeholder.com/200?text=Frankincense',
      rating: 4.7,
      reviewCount: 89,
    },
    {
      id: 'p3',
      name: 'Omani Halwa',
      price: 3.5,
      originalPrice: 4.0,
      image: 'https://via.placeholder.com/200?text=Halwa',
      rating: 4.9,
      reviewCount: 210,
      discount: 12,
    },
    {
      id: 'p4',
      name: 'Sultan Qaboos Rose Water',
      price: 2.5,
      image: 'https://via.placeholder.com/200?text=Rose+Water',
      rating: 4.5,
      reviewCount: 67,
    },
  ];

  // Mock reviews
  const storeReviews = [
    {
      id: 'r1',
      userName: 'Ahmed Al-Rashdi',
      rating: 5,
      comment: 'Excellent quality products and fast delivery!',
      date: '2024-01-15',
    },
    {
      id: 'r2',
      userName: 'Fatima Al-Balushi',
      rating: 4,
      comment: 'Great store, authentic Omani products.',
      date: '2024-01-10',
    },
    {
      id: 'r3',
      userName: 'Khalid Al-Habsi',
      rating: 5,
      comment: 'Best dates I have ever tasted. Highly recommended!',
      date: '2024-01-05',
    },
  ];

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleProductPress = (id: string) => {
    navigation.navigate('ProductDetail', { productId: id });
  };

  const handleContact = () => {
    // Open chat or contact form
  };

  if (storeLoading) {
    return (
      <View style={styles.container}>
        <LoadingSkeleton type="store" count={1} />
        <LoadingSkeleton type="product" count={4} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="store-off"
          title="Store not found"
          message="The store you are looking for does not exist"
          actionLabel="Go Back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Store Header/Cover */}
        <View style={styles.coverContainer}>
          <Image
            source={{
              uri: store.cover || 'https://via.placeholder.com/400x200?text=Store+Cover',
            }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay} />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={22} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Store Info Card */}
        <View style={styles.infoCard}>
          <View style={[styles.storeHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <Image
              source={{
                uri: store.logo || 'https://via.placeholder.com/80?text=S',
              }}
              style={styles.storeLogo}
            />
            <View style={styles.storeInfo}>
              <View style={[styles.nameRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <Text style={styles.storeName}>{store.name}</Text>
                {store.isVerified && (
                  <Icon name="check-decagram" size={18} color={colors.primary} />
                )}
              </View>
              <Text style={styles.storeDescription} numberOfLines={2}>
                {store.description}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{store.productCount}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {store.followerCount >= 1000
                  ? `${(store.followerCount / 1000).toFixed(1)}K`
                  : store.followerCount}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.ratingRow}>
                <Icon name="star" size={14} color={colors.secondary} />
                <Text style={styles.statValue}>{store.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.actionButtons, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={handleFollow}
            >
              <Icon
                name={isFollowing ? 'check' : 'plus'}
                size={16}
                color={isFollowing ? colors.textSecondary : colors.textInverse}
              />
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
              <Icon name="message-text-outline" size={16} color={colors.primary} />
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'products' && styles.tabActive]}
            onPress={() => setActiveTab('products')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'products' && styles.tabTextActive,
              ]}
            >
              Products
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'reviews' && styles.tabTextActive,
              ]}
            >
              Reviews ({store.reviewCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'about' && styles.tabTextActive,
              ]}
            >
              About
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'products' && (
          <View style={styles.productsGrid}>
            {storeProducts.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                originalPrice={item.originalPrice}
                image={item.image}
                rating={item.rating}
                reviewCount={item.reviewCount}
                discount={item.discount}
                onPress={handleProductPress}
                locale={locale}
              />
            ))}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.reviewsContainer}>
            {storeReviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={[styles.reviewHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>
                      {review.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewName}>{review.userName}</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Icon
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={14}
                          color={colors.secondary}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.aboutContainer}>
            <Text style={styles.aboutTitle}>About {store.name}</Text>
            <Text style={styles.aboutText}>{store.description}</Text>

            <View style={styles.aboutDetails}>
              <View style={[styles.aboutRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <Icon name="calendar" size={18} color={colors.textSecondary} />
                <Text style={styles.aboutLabel}>Joined</Text>
                <Text style={styles.aboutValue}>
                  {new Date(store.joinedDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.aboutRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <Icon name="package-variant" size={18} color={colors.textSecondary} />
                <Text style={styles.aboutLabel}>Products</Text>
                <Text style={styles.aboutValue}>{store.productCount}</Text>
              </View>
              <View style={[styles.aboutRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <Icon name="star" size={18} color={colors.textSecondary} />
                <Text style={styles.aboutLabel}>Rating</Text>
                <Text style={styles.aboutValue}>{store.rating.toFixed(1)} / 5</Text>
              </View>
              <View style={[styles.aboutRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <Icon name="shield-check" size={18} color={colors.textSecondary} />
                <Text style={styles.aboutLabel}>Verified</Text>
                <Text style={styles.aboutValue}>
                  {store.isVerified ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  coverContainer: {
    position: 'relative',
    height: 150,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  storeLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.surfaceVariant,
  },
  storeInfo: {
    flex: 1,
    marginLeft: 14,
    marginTop: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  storeDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderLight,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  followingButton: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: colors.textSecondary,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}10`,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  contactButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  reviewsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  reviewItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewAvatarText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  reviewComment: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 46,
  },
  aboutContainer: {
    padding: 16,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  aboutDetails: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  aboutLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 10,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});

export default StoreScreen;
