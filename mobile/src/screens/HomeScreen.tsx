import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Carousel from 'react-native-snap-carousel';
import { colors } from '@theme/colors';
import { isRTL, getFlexDirection, getTextAlign } from '@utils/rtl';
import {
  useFeaturedProducts,
  useTrendingProducts,
  useNewArrivals,
  useCategories,
  useStores,
  useBanners,
} from '@hooks/useProducts';
import { useCartStore } from '@store/cartStore';
import ProductCard from '@components/ProductCard';
import StoreCard from '@components/StoreCard';
import LoadingSkeleton from '@components/LoadingSkeleton';
import EmptyState from '@components/EmptyState';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  locale?: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ locale = 'en' }) => {
  const navigation = useNavigation();
  const rtl = isRTL(locale);
  const cartCount = useCartStore((s) => s.totalCount());

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    banners,
    isLoading: bannersLoading,
    refetch: refetchBanners,
  } = useBanners();
  const {
    categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();
  const {
    products: featuredProducts,
    isLoading: featuredLoading,
    refetch: refetchFeatured,
  } = useFeaturedProducts(10);
  const {
    products: trendingProducts,
    isLoading: trendingLoading,
    refetch: refetchTrending,
  } = useTrendingProducts(10);
  const {
    products: newArrivals,
    isLoading: arrivalsLoading,
    refetch: refetchArrivals,
  } = useNewArrivals(10);
  const { stores, isLoading: storesLoading, refetch: refetchStores } = useStores(5);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchBanners(),
      refetchCategories(),
      refetchFeatured(),
      refetchTrending(),
      refetchArrivals(),
      refetchStores(),
    ]);
    setRefreshing(false);
  }, [
    refetchBanners,
    refetchCategories,
    refetchFeatured,
    refetchTrending,
    refetchArrivals,
    refetchStores,
  ]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery });
    }
  };

  const handleProductPress = (id: string) => {
    navigation.navigate('ProductDetail', { productId: id });
  };

  const handleStorePress = (id: string) => {
    navigation.navigate('Store', { storeId: id });
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    navigation.navigate('Products', { categoryId, categoryName });
  };

  const renderBanner = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.bannerItem}
      onPress={() => {
        if (item.link) {
          // Handle banner link
        }
      }}
    >
      <View style={styles.bannerImage}>
        {/* Placeholder for banner image */}
        <View style={[styles.bannerPlaceholder, { backgroundColor: colors.primary }]}>
          <Text style={styles.bannerTitle}>{item.title || 'Special Offer'}</Text>
          <Text style={styles.bannerSubtitle}>Shop Now</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item.id, item.name)}
    >
      <View style={styles.categoryIcon}>
        <Icon
          name={item.icon || 'shape-outline'}
          size={28}
          color={colors.primary}
        />
      </View>
      <Text style={[styles.categoryName, { textAlign: rtl ? 'right' : 'left' }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, onSeeAll?: () => void) => (
    <View style={[styles.sectionHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
        {title}
      </Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Search */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>BHD</Text>
            <Text style={styles.logoSubtext}>OMAN</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Icon name="cart-outline" size={22} color={colors.text} />
              {cartCount() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
        >
          <Icon name="magnify" size={20} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>
            Search products, stores...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Banners Carousel */}
      {bannersLoading ? (
        <LoadingSkeleton type="banner" />
      ) : banners.length > 0 ? (
        <View style={styles.bannerContainer}>
          <Carousel
            data={banners}
            renderItem={renderBanner}
            sliderWidth={width}
            itemWidth={width - 32}
            loop
            autoplay
            autoplayInterval={5000}
          />
        </View>
      ) : null}

      {/* Categories */}
      {categoriesLoading ? (
        <LoadingSkeleton type="category" count={8} />
      ) : (
        <View style={styles.categoriesSection}>
          {renderSectionHeader('Categories', () =>
            navigation.navigate('Categories')
          )}
          <FlatList
            data={categories.slice(0, 8)}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}

      {/* Special Offers Banner */}
      <TouchableOpacity style={styles.offerBanner}>
        <View style={styles.offerContent}>
          <View style={styles.offerBadge}>
            <Text style={styles.offerBadgeText}>SPECIAL OFFER</Text>
          </View>
          <Text style={styles.offerTitle}>50% OFF</Text>
          <Text style={styles.offerSubtitle}>On selected items this week</Text>
          <View style={styles.offerButton}>
            <Text style={styles.offerButtonText}>Shop Now</Text>
            <Icon name="arrow-right" size={14} color={colors.textInverse} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Featured Products */}
      {featuredLoading ? (
        <LoadingSkeleton type="product" count={4} />
      ) : (
        <View style={styles.section}>
          {renderSectionHeader('Featured Products', () =>
            navigation.navigate('Products', { featured: true })
          )}
          <FlatList
            data={featuredProducts.slice(0, 10)}
            renderItem={({ item }) => (
              <ProductCard
                id={item.id}
                name={item.name}
                price={item.price}
                originalPrice={item.originalPrice}
                image={item.thumbnail || item.images[0]}
                rating={item.rating}
                reviewCount={item.reviewCount}
                isNew={item.isNew}
                discount={item.discount}
                freeShipping={item.freeShipping}
                onPress={handleProductPress}
                locale={locale}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        </View>
      )}

      {/* Featured Stores */}
      {storesLoading ? (
        <LoadingSkeleton type="store" count={3} />
      ) : (
        <View style={styles.section}>
          {renderSectionHeader('Featured Stores')}
          <FlatList
            data={stores}
            renderItem={({ item }) => (
              <StoreCard
                id={item.id}
                name={item.name}
                logo={item.logo}
                cover={item.cover}
                rating={item.rating}
                reviewCount={item.reviewCount}
                productCount={item.productCount}
                followerCount={item.followerCount}
                isFollowing={item.isFollowing}
                isVerified={item.isVerified}
                onPress={handleStorePress}
                locale={locale}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storesList}
          />
        </View>
      )}

      {/* Trending Products */}
      {trendingLoading ? (
        <LoadingSkeleton type="product" count={4} />
      ) : (
        <View style={styles.section}>
          {renderSectionHeader('Trending Now')}
          <View style={styles.productsGrid}>
            {trendingProducts.slice(0, 4).map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                originalPrice={item.originalPrice}
                image={item.thumbnail || item.images[0]}
                rating={item.rating}
                reviewCount={item.reviewCount}
                isNew={item.isNew}
                discount={item.discount}
                freeShipping={item.freeShipping}
                onPress={handleProductPress}
                locale={locale}
              />
            ))}
          </View>
        </View>
      )}

      {/* New Arrivals */}
      {arrivalsLoading ? (
        <LoadingSkeleton type="product" count={4} />
      ) : (
        <View style={[styles.section, styles.lastSection]}>
          {renderSectionHeader('New Arrivals')}
          <View style={styles.productsGrid}>
            {newArrivals.slice(0, 4).map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                originalPrice={item.originalPrice}
                image={item.thumbnail || item.images[0]}
                rating={item.rating}
                reviewCount={item.reviewCount}
                isNew={true}
                discount={item.discount}
                freeShipping={item.freeShipping}
                onPress={handleProductPress}
                locale={locale}
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  logoSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  cartBadgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 14,
  },
  bannerContainer: {
    marginTop: 16,
  },
  bannerItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 160,
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textInverse,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: `${colors.textInverse}CC`,
    marginTop: 4,
  },
  categoriesSection: {
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  categoriesList: {
    paddingHorizontal: 12,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 72,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
  },
  offerBanner: {
    marginHorizontal: 16,
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
  },
  offerContent: {
    alignItems: 'flex-start',
  },
  offerBadge: {
    backgroundColor: colors.textInverse,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
  },
  offerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textInverse,
  },
  offerSubtitle: {
    fontSize: 14,
    color: `${colors.textInverse}CC`,
    marginTop: 2,
  },
  offerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textInverse,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 4,
  },
  offerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  section: {
    paddingVertical: 16,
  },
  lastSection: {
    paddingBottom: 32,
  },
  productsList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  storesList: {
    paddingHorizontal: 12,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});

export default HomeScreen;
