import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';
import { useCart } from '@hooks/useCart';
import EmptyState from '@components/EmptyState';
import LoadingSkeleton from '@components/LoadingSkeleton';

interface CartScreenProps {
  locale?: string;
}

const CartScreen: React.FC<CartScreenProps> = ({ locale = 'en' }) => {
  const navigation = useNavigation();
  const rtl = isRTL(locale);

  const {
    items,
    subtotal,
    discount,
    shipping,
    total,
    coupon,
    isLoading,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleApplyCoupon = async () => {
    if (couponCode.trim()) {
      await applyCoupon(couponCode.trim());
      setCouponCode('');
      setShowCouponInput(false);
    }
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={[styles.cartItem, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      {/* Product Image */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })}
      >
        <Image source={{ uri: item.image }} style={styles.itemImage} />
      </TouchableOpacity>

      {/* Item Details */}
      <View style={styles.itemDetails}>
        <Text
          style={[styles.itemName, { textAlign: rtl ? 'right' : 'left' }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {item.variant && (
          <Text style={[styles.itemVariant, { textAlign: rtl ? 'right' : 'left' }]}>
            {item.variant.name}: {item.variant.value}
          </Text>
        )}
        <Text style={[styles.itemPrice, { textAlign: rtl ? 'right' : 'left' }]}>
          OMR {(item.price * item.quantity).toFixed(3)}
        </Text>

        {/* Quantity Controls */}
        <View style={[styles.quantityRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <View style={[styles.quantityControls, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
            >
              <Icon name="minus" size={14} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
            >
              <Icon name="plus" size={14} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFromCart(item.id)}
          >
            <Icon name="trash-can-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPriceBreakdown = () => (
    <View style={styles.priceBreakdown}>
      <View style={[styles.priceRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Text style={styles.priceLabel}>Subtotal</Text>
        <Text style={styles.priceValue}>OMR {subtotal.toFixed(3)}</Text>
      </View>

      {discount > 0 && (
        <View style={[styles.priceRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[styles.priceLabel, styles.discountLabel]}>Discount</Text>
            {coupon && (
              <View style={styles.couponTag}>
                <Text style={styles.couponTagText}>{coupon.code}</Text>
                <TouchableOpacity onPress={removeCoupon}>
                  <Icon name="close-circle" size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={[styles.priceValue, styles.discountValue]}>
            -OMR {discount.toFixed(3)}
          </Text>
        </View>
      )}

      <View style={[styles.priceRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Text style={styles.priceLabel}>Shipping</Text>
        <Text style={styles.priceValue}>
          {shipping === 0 ? 'FREE' : `OMR ${shipping.toFixed(3)}`}
        </Text>
      </View>

      <View style={[styles.totalRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>OMR {total.toFixed(3)}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
        </View>
        <LoadingSkeleton type="cart" count={3} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
        </View>
        <EmptyState
          icon="cart-outline"
          title="Your Cart is Empty"
          message="Start shopping and discover amazing products"
          actionLabel="Continue Shopping"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>

      {/* Cart Items */}
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Coupon Section */}
      <View style={styles.couponSection}>
        {!showCouponInput && !coupon ? (
          <TouchableOpacity
            style={styles.addCouponButton}
            onPress={() => setShowCouponInput(true)}
          >
            <Icon name="ticket-percent" size={18} color={colors.primary} />
            <Text style={styles.addCouponText}>Have a coupon code?</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.couponInputRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <TextInput
              style={[styles.couponInput, { textAlign: rtl ? 'right' : 'left' }]}
              placeholder="Enter coupon code"
              placeholderTextColor={colors.textMuted}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyCoupon}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Price Breakdown */}
      {renderPriceBreakdown()}

      {/* Checkout Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutTotal}>OMR {total.toFixed(3)}</Text>
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
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  itemCount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: colors.surfaceVariant,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  itemVariant: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  couponSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  addCouponButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  addCouponText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  applyButton: {
    paddingHorizontal: 16,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '600',
  },
  priceBreakdown: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  discountLabel: {
    color: colors.success,
  },
  priceValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  discountValue: {
    color: colors.success,
    fontWeight: '600',
  },
  couponTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  couponTagText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  bottomBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  checkoutButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  checkoutTotal: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default CartScreen;
