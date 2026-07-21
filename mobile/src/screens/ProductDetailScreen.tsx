import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Carousel from 'react-native-snap-carousel';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';
import { useProduct, useRelatedProducts, useProductReviews } from '@hooks/useProducts';
import { useCart } from '@hooks/useCart';
import ProductCard from '@components/ProductCard';
import LoadingSkeleton from '@components/LoadingSkeleton';
import EmptyState from '@components/EmptyState';

const { width } = Dimensions.get('window');

interface ProductDetailScreenProps {
  locale?: string;
}

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  locale = 'en',
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const rtl = isRTL(locale);

  const { productId } = route.params as { productId: string };

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  const { product, isLoading } = useProduct(productId);
  const { products: relatedProducts } = useRelatedProducts(productId);
  const { reviews } = useProductReviews(productId);
  const { addToCart } = useCart();

  const handleShare = async () => {
    if (product) {
      try {
        await Share.share({
          message: `Check out ${product.name} on BHD Oman!`,
          url: `https://bhdoman.com/product/${product.slug}`,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.thumbnail || product.images[0],
        quantity,
        storeId: product.storeId,
        storeName: product.storeName,
        variant: selectedVariant
          ? { name: 'Variant', value: selectedVariant }
          : undefined,
        maxQuantity: product.stock,
      });
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigation.navigate('Checkout');
  };

  const renderImageCarousel = () => {
    if (!product) return null;
    const images = product.images?.length > 0 ? product.images : [product.thumbnail];

    return (
      <View style={styles.carouselContainer}>
        <Carousel
          data={images}
          renderItem={({ item }: { item: string }) => (
            <Image source={{ uri: item }} style={styles.productImage} resizeMode="cover" />
          )}
          sliderWidth={width}
          itemWidth={width}
          loop
        />
        {/* Image overlay buttons */}
        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={styles.iconCircleButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.iconCircleButton}
              onPress={() => setIsWishlisted(!isWishlisted)}
            >
              <Icon
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={20}
                color={isWishlisted ? colors.accent : colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircleButton} onPress={handleShare}>
              <Icon name="share-variant" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading || !product) {
    return (
      <View style={styles.container}>
        <LoadingSkeleton type="product" count={1} />
      </View>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        {renderImageCarousel()}

        {/* Product Info */}
        <View style={styles.infoContainer}>
          {/* Store */}
          <TouchableOpacity
            style={[styles.storeRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}
            onPress={() => navigation.navigate('Store', { storeId: product.storeId })}
          >
            <View style={styles.storeIcon}>
              <Icon name="store" size={16} color={colors.primary} />
            </View>
            <Text style={styles.storeName}>{product.storeName}</Text>
            <Icon name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Name */}
          <Text style={[styles.productName, { textAlign: rtl ? 'right' : 'left' }]}>
            {product.name}
          </Text>

          {/* Rating */}
          <View style={[styles.ratingRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= Math.round(product.rating) ? 'star' : 'star-outline'}
                  size={16}
                  color={colors.secondary}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </Text>
            {product.sold > 0 && (
              <Text style={styles.soldText}>| {product.sold} sold</Text>
            )}
          </View>

          {/* Price */}
          <View style={[styles.priceRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <Text style={styles.price}>OMR {product.price.toFixed(3)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>
                OMR {product.originalPrice.toFixed(3)}
              </Text>
            )}
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discount}%</Text>
              </View>
            )}
          </View>

          {/* Badges */}
          <View style={[styles.badgesRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            {product.freeShipping && (
              <View style={[styles.badge, styles.shippingBadge]}>
                <Icon name="truck-fast" size={12} color={colors.success} />
                <Text style={styles.badgeText}>Free Shipping</Text>
              </View>
            )}
            {product.stock > 0 ? (
              <View style={[styles.badge, styles.stockBadge]}>
                <Icon name="check-circle" size={12} color={colors.success} />
                <Text style={styles.badgeText}>In Stock</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.outOfStockBadge]}>
                <Icon name="close-circle" size={12} color={colors.error} />
                <Text style={styles.badgeText}>Out of Stock</Text>
              </View>
            )}
          </View>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <View style={styles.variantsSection}>
              <Text style={styles.variantsTitle}>Select Variant</Text>
              <View style={styles.variantsList}>
                {product.variants.map((variant) => (
                  <TouchableOpacity
                    key={variant.id}
                    style={[
                      styles.variantChip,
                      selectedVariant === variant.id && styles.variantChipActive,
                    ]}
                    onPress={() => setSelectedVariant(variant.id)}
                  >
                    <Text
                      style={[
                        styles.variantChipText,
                        selectedVariant === variant.id && styles.variantChipTextActive,
                      ]}
                    >
                      {variant.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={[styles.quantityControls, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Icon name="minus" size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
              >
                <Icon name="plus" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'description' && styles.tabActive]}
              onPress={() => setActiveTab('description')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'description' && styles.tabTextActive,
                ]}
              >
                Description
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
                Reviews ({product.reviewCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'description' ? (
            <View style={styles.tabContent}>
              <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>
                {product.description}
              </Text>
              {product.attributes && product.attributes.length > 0 && (
                <View style={styles.attributesTable}>
                  {product.attributes.map((attr, index) => (
                    <View
                      key={index}
                      style={[
                        styles.attributeRow,
                        index % 2 === 0 && styles.attributeRowEven,
                        { flexDirection: rtl ? 'row-reverse' : 'row' },
                      ]}
                    >
                      <Text style={styles.attributeName}>{attr.name}</Text>
                      <Text style={styles.attributeValue}>{attr.value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              {reviews.length === 0 ? (
                <Text style={styles.noReviews}>No reviews yet</Text>
              ) : (
                reviews.map((review) => (
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
                              size={12}
                              color={colors.secondary}
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>Related Products</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {relatedProducts.map((item) => (
                  <View key={item.id} style={{ marginRight: 12 }}>
                    <ProductCard
                      id={item.id}
                      name={item.name}
                      price={item.price}
                      originalPrice={item.originalPrice}
                      image={item.thumbnail || item.images[0]}
                      rating={item.rating}
                      reviewCount={item.reviewCount}
                      onPress={handleProductPress}
                      locale={locale}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Bottom Spacer */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <Icon name="cart-plus" size={18} color={colors.textInverse} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buyNowButton}
          onPress={handleBuyNow}
          disabled={product.stock === 0}
        >
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  carouselContainer: {
    position: 'relative',
  },
  productImage: {
    width: width,
    height: width * 0.8,
    backgroundColor: colors.surfaceVariant,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  iconCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  rightActions: {
    alignItems: 'flex-end',
  },
  infoContainer: {
    padding: 16,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  storeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  storeName: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 26,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  soldText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 16,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  shippingBadge: {
    backgroundColor: `${colors.success}15`,
  },
  stockBadge: {
    backgroundColor: `${colors.success}15`,
  },
  outOfStockBadge: {
    backgroundColor: `${colors.error}15`,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  variantsSection: {
    marginBottom: 16,
  },
  variantsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  variantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  variantChipActive: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  variantChipText: {
    fontSize: 13,
    color: colors.text,
  },
  variantChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  quantitySection: {
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
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
  tabContent: {
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  attributesTable: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  attributeRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  attributeRowEven: {
    backgroundColor: colors.surfaceVariant,
  },
  attributeName: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  attributeValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'right',
  },
  noReviews: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
  relatedSection: {
    marginTop: 8,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 10,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  addToCartText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  buyNowButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buyNowText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ProductDetailScreen;
