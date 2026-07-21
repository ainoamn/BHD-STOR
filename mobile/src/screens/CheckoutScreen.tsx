import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';
import { useCart } from '@hooks/useCart';
import { useAuth } from '@hooks/useAuth';
import { ordersService } from '@services/orders.service';
import { paymentsService } from '@services/payments.service';
import LoadingSkeleton from '@components/LoadingSkeleton';
import Toast from 'react-native-toast-message';

interface CheckoutScreenProps {
  locale?: string;
}

type PaymentMethod = 'card' | 'cash_on_delivery';

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ locale = 'en' }) => {
  const navigation = useNavigation();
  const { confirmPayment } = useStripe();
  const rtl = isRTL(locale);

  const { items, subtotal, discount, shipping, total, clearCart } = useCart();
  const { user } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // Shipping address form
  const [address, setAddress] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Oman',
  });

  const [cardDetails, setCardDetails] = useState<any>(null);
  const [saveCard, setSaveCard] = useState(false);

  const handlePlaceOrder = async () => {
    // Validate address
    if (!address.fullName || !address.phone || !address.address || !address.city) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      const orderResponse = await ordersService.createOrder({
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          address: address.address,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
        },
        paymentMethod,
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }

      const order = orderResponse.data;

      // Process payment if card
      if (paymentMethod === 'card') {
        const intentResponse = await paymentsService.createPaymentIntent(order.id);

        if (!intentResponse.success) {
          throw new Error('Failed to create payment intent');
        }

        const { error: paymentError, paymentIntent } = await confirmPayment(
          intentResponse.data.clientSecret,
          {
            paymentMethodType: 'Card',
          }
        );

        if (paymentError) {
          throw new Error(paymentError.message);
        }

        if (paymentIntent?.status === 'Succeeded') {
          await paymentsService.confirmPayment(intentResponse.data.paymentIntentId);
        }
      }

      // Success
      clearCart();
      Toast.show({
        type: 'success',
        text1: 'Order Placed!',
        text2: `Order #${order.orderNumber}`,
      });
      navigation.navigate('OrderDetail', { orderId: order.id });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Order Failed',
        text2: error.message || 'Something went wrong',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderAddressForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Shipping Address</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
          value={address.fullName}
          onChangeText={(text) => setAddress({ ...address, fullName: text })}
          placeholder="Enter your full name"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput
          style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
          value={address.phone}
          onChangeText={(text) => setAddress({ ...address, phone: text })}
          placeholder="Enter phone number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Street Address *</Text>
        <TextInput
          style={[styles.input, styles.textArea, { textAlign: rtl ? 'right' : 'left' }]}
          value={address.address}
          onChangeText={(text) => setAddress({ ...address, address: text })}
          placeholder="House/Building, Street, Area"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={[styles.rowInputs, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>City *</Text>
          <TextInput
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
            value={address.city}
            onChangeText={(text) => setAddress({ ...address, city: text })}
            placeholder="City"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>State</Text>
          <TextInput
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
            value={address.state}
            onChangeText={(text) => setAddress({ ...address, state: text })}
            placeholder="State"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      <View style={[styles.rowInputs, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>ZIP Code</Text>
          <TextInput
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
            value={address.zipCode}
            onChangeText={(text) => setAddress({ ...address, zipCode: text })}
            placeholder="ZIP Code"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Country</Text>
          <TextInput
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
            value={address.country}
            editable={false}
          />
        </View>
      </View>
    </View>
  );

  const renderPaymentMethod = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Payment Method</Text>

      <TouchableOpacity
        style={[
          styles.paymentOption,
          paymentMethod === 'card' && styles.paymentOptionActive,
        ]}
        onPress={() => setPaymentMethod('card')}
      >
        <View style={[styles.paymentIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name="credit-card" size={24} color={colors.primary} />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Credit/Debit Card</Text>
          <Text style={styles.paymentSubtitle}>Pay securely with your card</Text>
        </View>
        <View
          style={[
            styles.radioButton,
            paymentMethod === 'card' && styles.radioButtonActive,
          ]}
        >
          {paymentMethod === 'card' && (
            <View style={styles.radioButtonInner} />
          )}
        </View>
      </TouchableOpacity>

      {paymentMethod === 'card' && (
        <View style={styles.cardFieldContainer}>
          <CardField
            postalCodeEnabled={false}
            placeholder={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={{
              backgroundColor: colors.surface,
              textColor: colors.text,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            style={styles.cardField}
            onCardChange={(details) => setCardDetails(details)}
          />
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.paymentOption,
          paymentMethod === 'cash_on_delivery' && styles.paymentOptionActive,
        ]}
        onPress={() => setPaymentMethod('cash_on_delivery')}
      >
        <View style={[styles.paymentIcon, { backgroundColor: `${colors.success}15` }]}>
          <Icon name="cash" size={24} color={colors.success} />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Cash on Delivery</Text>
          <Text style={styles.paymentSubtitle}>Pay when you receive</Text>
        </View>
        <View
          style={[
            styles.radioButton,
            paymentMethod === 'cash_on_delivery' && styles.radioButtonActive,
          ]}
        >
          {paymentMethod === 'cash_on_delivery' && (
            <View style={styles.radioButtonInner} />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderOrderSummary = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Order Summary</Text>

      {items.map((item) => (
        <View
          key={item.id}
          style={[styles.summaryItem, { flexDirection: rtl ? 'row-reverse' : 'row' }]}
        >
          <View style={styles.summaryItemInfo}>
            <Text style={styles.summaryItemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.summaryItemQty}>x{item.quantity}</Text>
          </View>
          <Text style={styles.summaryItemPrice}>
            OMR {(item.price * item.quantity).toFixed(3)}
          </Text>
        </View>
      ))}

      <View style={styles.summaryDivider} />

      <View style={[styles.summaryRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>OMR {subtotal.toFixed(3)}</Text>
      </View>
      {discount > 0 && (
        <View style={[styles.summaryRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.summaryLabel, styles.discountText]}>Discount</Text>
          <Text style={[styles.summaryValue, styles.discountText]}>
            -OMR {discount.toFixed(3)}
          </Text>
        </View>
      )}
      <View style={[styles.summaryRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Text style={styles.summaryLabel}>Shipping</Text>
        <Text style={styles.summaryValue}>
          {shipping === 0 ? 'FREE' : `OMR ${shipping.toFixed(3)}`}
        </Text>
      </View>

      <View style={[styles.totalRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>OMR {total.toFixed(3)}</Text>
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
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderAddressForm()}
        {renderPaymentMethod()}
        {renderOrderSummary()}

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            isProcessing && styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          <Text style={styles.placeOrderButtonText}>
            {isProcessing ? 'Processing...' : `Place Order - OMR ${total.toFixed(3)}`}
          </Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
  },
  formSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  // Payment
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  paymentSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  cardFieldContainer: {
    marginBottom: 16,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  // Summary
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItemName: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  summaryItemQty: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  discountText: {
    color: colors.success,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
  // Bottom Bar
  bottomBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  placeOrderButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CheckoutScreen;
