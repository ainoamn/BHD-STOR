import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';
import { useAuth } from '@hooks/useAuth';
import { useCart } from '@hooks/useCart';
import ProductCard from '@components/ProductCard';
import EmptyState from '@components/EmptyState';

// Mock wishlist data - would come from API
const mockWishlistItems = [
  {
    id: '1',
    name: 'Premium Dates Box - 1kg',
    price: 5.5,
    originalPrice: 7.0,
    image: 'https://via.placeholder.com/200?text=Dates',
    rating: 4.8,
    reviewCount: 124,
    discount: 21,
    storeId: 's1',
    storeName: 'Omani Delights',
  },
  {
    id: '2',
    name: 'Frankincense Essential Oil',
    price: 12.0,
    originalPrice: 15.0,
    image: 'https://via.placeholder.com/200?text=Oil',
    rating: 4.6,
    reviewCount: 89,
    discount: 20,
    storeId: 's2',
    storeName: 'Desert Aromas',
  },
  {
    id: '3',
    name: 'Traditional Omani Khanjar',
    price: 45.0,
    image: 'https://via.placeholder.com/200?text=Khanjar',
    rating: 4.9,
    reviewCount: 56,
    storeId: 's3',
    storeName: 'Heritage Crafts',
  },
];

interface WishlistScreenProps {
  locale?: string;
}

const WishlistScreen: React.FC<WishlistScreenProps> = ({ locale = 'en' }) => {
  const navigation = useNavigation();
  const rtl = isRTL(locale);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [wishlistItems, setWishlistItems] = useState(mockWishlistItems);

  const handleRemove = (id: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setWishlistItems((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ]
    );
  };

  const handleMoveToCart = (item: any) => {
    addToCart({
      productId: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      quantity: 1,
      storeId: item.storeId,
      storeName: item.storeName,
      maxQuantity: 99,
    });
    setWishlistItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleShare = async (item: any) => {
    try {
      await Share.share({
        message: `Check out ${item.name} on BHD Oman!`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleProductPress = (id: string) => {
    navigation.navigate('ProductDetail', { productId: id });
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wishlist</Text>
        </View>
        <EmptyState
          icon="heart-outline"
          title="Sign in to see your wishlist"
          message="Save your favorite items and access them anytime"
          actionLabel="Sign In"
          onAction={() => navigation.navigate('Login')}
        />
      </View>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>
        <EmptyState
          icon="heart-outline"
          title="Your wishlist is empty"
          message="Save items you love and find them here"
          actionLabel="Start Shopping"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  const renderWishlistItem = ({ item }: { item: typeof mockWishlistItems[0] }) => (
    <View style={styles.itemContainer}>
      <ProductCard
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
      <View style={[styles.actionsRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.moveToCartButton]}
          onPress={() => handleMoveToCart(item)}
        >
          <Icon name="cart-plus" size={16} color={colors.textInverse} />
          <Text style={styles.actionButtonText}>Add to Cart</Text>
        </TouchableOpacity>
        <View style={[styles.iconButtons, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleShare(item)}
          >
            <Icon name="share-variant" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleRemove(item.id)}
          >
            <Icon name="heart-off" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <Text style={styles.itemCount}>{wishlistItems.length} items</Text>
        </View>
      </View>

      {/* Wishlist Grid */}
      <FlatList
        data={wishlistItems}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  itemCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 8,
    gap: 8,
  },
  itemContainer: {
    width: '50%',
    padding: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  moveToCartButton: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  actionButtonText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '600',
  },
  iconButtons: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WishlistScreen;
