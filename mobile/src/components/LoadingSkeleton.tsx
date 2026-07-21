import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { colors } from '@theme/colors';

const { width } = Dimensions.get('window');

interface LoadingSkeletonProps {
  type?: 'product' | 'store' | 'banner' | 'cart' | 'order' | 'category' | 'list';
  count?: number;
}

const ProductSkeleton: React.FC = () => (
  <SkeletonPlaceholder
    backgroundColor={colors.surfaceVariant}
    highlightColor={colors.borderLight}
  >
    <View style={styles.productContainer}>
      <View style={styles.productImage} />
      <View style={styles.productName} />
      <View style={styles.productRating} />
      <View style={styles.productPrice} />
    </View>
  </SkeletonPlaceholder>
);

const StoreSkeleton: React.FC = () => (
  <SkeletonPlaceholder
    backgroundColor={colors.surfaceVariant}
    highlightColor={colors.borderLight}
  >
    <View style={styles.storeContainer}>
      <View style={styles.storeCover} />
      <View style={styles.storeHeader}>
        <View style={styles.storeLogo} />
        <View style={styles.storeInfo}>
          <View style={styles.storeName} />
          <View style={styles.storeRating} />
        </View>
      </View>
    </View>
  </SkeletonPlaceholder>
);

const BannerSkeleton: React.FC = () => (
  <SkeletonPlaceholder
    backgroundColor={colors.surfaceVariant}
    highlightColor={colors.borderLight}
  >
    <View style={styles.bannerContainer} />
  </SkeletonPlaceholder>
);

const CartSkeleton: React.FC = () => (
  <SkeletonPlaceholder
    backgroundColor={colors.surfaceVariant}
    highlightColor={colors.borderLight}
  >
    <View style={styles.cartItem}>
      <View style={styles.cartImage} />
      <View style={styles.cartContent}>
        <View style={styles.cartName} />
        <View style={styles.cartPrice} />
        <View style={styles.cartQuantity} />
      </View>
    </View>
  </SkeletonPlaceholder>
);

const OrderSkeleton: React.FC = () => (
  <SkeletonPlaceholder
    backgroundColor={colors.surfaceVariant}
    highlightColor={colors.borderLight}
  >
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <View style={styles.orderNumber} />
        <View style={styles.orderStatus} />
      </View>
      <View style={styles.orderDetails} />
      <View style={styles.orderTotal} />
    </View>
  </SkeletonPlaceholder>
);

const CategorySkeleton: React.FC = () => (
  <SkeletonPlaceholder
    backgroundColor={colors.surfaceVariant}
    highlightColor={colors.borderLight}
  >
    <View style={styles.categoryItem}>
      <View style={styles.categoryIcon} />
      <View style={styles.categoryName} />
    </View>
  </SkeletonPlaceholder>
);

const ListSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <SkeletonPlaceholder
    backgroundColor={colors.surfaceVariant}
    highlightColor={colors.borderLight}
  >
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <View style={styles.listIcon} />
          <View style={styles.listContent}>
            <View style={styles.listTitle} />
            <View style={styles.listSubtitle} />
          </View>
        </View>
      ))}
    </View>
  </SkeletonPlaceholder>
);

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'product',
  count = 6,
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'product':
        return (
          <View style={styles.grid}>
            {Array.from({ length: count }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </View>
        );
      case 'store':
        return (
          <View style={styles.horizontalList}>
            {Array.from({ length: Math.min(count, 3) }).map((_, index) => (
              <StoreSkeleton key={index} />
            ))}
          </View>
        );
      case 'banner':
        return <BannerSkeleton />;
      case 'cart':
        return (
          <View>
            {Array.from({ length: count }).map((_, index) => (
              <CartSkeleton key={index} />
            ))}
          </View>
        );
      case 'order':
        return (
          <View>
            {Array.from({ length: count }).map((_, index) => (
              <OrderSkeleton key={index} />
            ))}
          </View>
        );
      case 'category':
        return (
          <View style={styles.categoryGrid}>
            {Array.from({ length: count }).map((_, index) => (
              <CategorySkeleton key={index} />
            ))}
          </View>
        );
      case 'list':
        return <ListSkeleton count={count} />;
      default:
        return <ProductSkeleton />;
    }
  };

  return <View style={styles.container}>{renderSkeleton()}</View>;
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  horizontalList: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  // Product
  productContainer: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: (width - 48) / 2,
    borderRadius: 12,
  },
  productName: {
    width: '90%',
    height: 14,
    borderRadius: 4,
    marginTop: 8,
  },
  productRating: {
    width: '60%',
    height: 12,
    borderRadius: 4,
    marginTop: 6,
  },
  productPrice: {
    width: '40%',
    height: 16,
    borderRadius: 4,
    marginTop: 6,
  },
  // Store
  storeContainer: {
    width: width * 0.7,
    marginRight: 12,
  },
  storeCover: {
    width: '100%',
    height: 80,
    borderRadius: 12,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -20,
    paddingHorizontal: 12,
  },
  storeLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  storeInfo: {
    marginLeft: 10,
    flex: 1,
  },
  storeName: {
    width: '70%',
    height: 14,
    borderRadius: 4,
  },
  storeRating: {
    width: '40%',
    height: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  // Banner
  bannerContainer: {
    width: width - 32,
    height: 160,
    borderRadius: 16,
    alignSelf: 'center',
  },
  // Cart
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cartImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  cartContent: {
    marginLeft: 12,
    flex: 1,
  },
  cartName: {
    width: '80%',
    height: 14,
    borderRadius: 4,
  },
  cartPrice: {
    width: '40%',
    height: 14,
    borderRadius: 4,
    marginTop: 8,
  },
  cartQuantity: {
    width: '30%',
    height: 12,
    borderRadius: 4,
    marginTop: 6,
  },
  // Order
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    width: '40%',
    height: 14,
    borderRadius: 4,
  },
  orderStatus: {
    width: 60,
    height: 20,
    borderRadius: 10,
  },
  orderDetails: {
    width: '70%',
    height: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  orderTotal: {
    width: '30%',
    height: 14,
    borderRadius: 4,
    marginTop: 8,
  },
  // Category
  categoryItem: {
    alignItems: 'center',
    width: (width - 56) / 4,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  categoryName: {
    width: '80%',
    height: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  // List
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  listContent: {
    marginLeft: 12,
    flex: 1,
  },
  listTitle: {
    width: '60%',
    height: 14,
    borderRadius: 4,
  },
  listSubtitle: {
    width: '40%',
    height: 12,
    borderRadius: 4,
    marginTop: 6,
  },
});

export default LoadingSkeleton;
