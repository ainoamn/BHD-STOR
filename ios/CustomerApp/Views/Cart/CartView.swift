//
//  CartView.swift
//  BHD Marketplace
//
//  Cart with items, quantity controls, total, and checkout
//

import SwiftUI
import Combine

struct CartView: View {
    @StateObject private var viewModel = CartViewModel()
    @State private var showCheckout = false
    @State private var showPromoCodeInput = false
    @State private var promoCode = ""
    @State private var showClearConfirmation = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                if viewModel.isLoading && viewModel.cartItems.isEmpty {
                    LoadingOverlay()
                } else if viewModel.cartItems.isEmpty {
                    EmptyStateView(
                        icon: "cart",
                        title: L("cart.empty"),
                        message: L("cart.emptyMessage"),
                        actionTitle: L("cart.startShopping"),
                        action: {
                            // Navigate to home tab
                        }
                    )
                } else {
                    VStack(spacing: 0) {
                        // Cart Items List
                        List {
                            ForEach(viewModel.cartItems) { item in
                                CartItemRow(
                                    item: item,
                                    onIncrement: { viewModel.updateQuantity(itemId: item.id, quantity: item.quantity + 1) },
                                    onDecrement: { viewModel.updateQuantity(itemId: item.id, quantity: item.quantity - 1) },
                                    onRemove: { viewModel.removeItem(itemId: item.id) }
                                )
                                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                                .listRowSeparator(.hidden)
                                .listRowBackground(Color.clear)
                            }
                            
                            // Promo Code Section
                            Section {
                                if viewModel.appliedPromo != nil {
                                    HStack {
                                        Image(systemName: "tag.fill")
                                            .foregroundColor(.green)
                                        Text(viewModel.appliedPromo?.code ?? "")
                                            .font(.subheadline)
                                        Spacer()
                                        Button(action: { viewModel.removePromoCode() }) {
                                            Image(systemName: "xmark.circle.fill")
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                    .padding(.vertical, 8)
                                } else {
                                    Button(action: { showPromoCodeInput = true }) {
                                        HStack {
                                            Image(systemName: "tag")
                                                .foregroundColor(.bhdPrimary)
                                            Text(L("cart.addPromo"))
                                                .font(.subheadline)
                                                .foregroundColor(.bhdPrimary)
                                            Spacer()
                                            Image(systemName: "chevron.right")
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                }
                            }
                            .listRowBackground(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            
                            // Order Summary
                            Section(header: Text(L("cart.summary")).font(.headline)) {
                                OrderSummaryRow(title: L("cart.subtotal"), value: viewModel.subtotal)
                                if viewModel.discount > 0 {
                                    OrderSummaryRow(title: L("cart.discount"), value: -viewModel.discount, isDiscount: true)
                                }
                                OrderSummaryRow(title: L("cart.shipping"), value: viewModel.shippingCost)
                                OrderSummaryRow(title: L("cart.tax"), value: viewModel.tax)
                                
                                Divider()
                                    .padding(.vertical, 4)
                                
                                HStack {
                                    Text(L("cart.total"))
                                        .font(.headline)
                                        .fontWeight(.bold)
                                    Spacer()
                                    Text(viewModel.formattedTotal)
                                        .font(.title3)
                                        .fontWeight(.bold)
                                        .foregroundColor(.bhdPrimary)
                                }
                            }
                            .listRowBackground(Color.clear)
                            
                            // Clear Cart
                            Section {
                                Button(action: { showClearConfirmation = true }) {
                                    HStack {
                                        Spacer()
                                        Text(L("cart.clear"))
                                            .foregroundColor(.red)
                                        Spacer()
                                    }
                                }
                            }
                            .listRowBackground(Color.clear)
                        }
                        .listStyle(.plain)
                        
                        // Checkout Button
                        VStack(spacing: 0) {
                            Divider()
                            
                            VStack(spacing: 12) {
                                // Total Row
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(L("cart.total"))
                                            .font(.subheadline)
                                            .foregroundColor(.secondary)
                                        Text(viewModel.formattedTotal)
                                            .font(.title2)
                                            .fontWeight(.bold)
                                            .foregroundColor(.bhdPrimary)
                                    }
                                    
                                    Spacer()
                                    
                                    Text("\(viewModel.itemCount) \(L("cart.items"))")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                                
                                // Checkout Button
                                BHDButton(
                                    title: L("cart.checkout"),
                                    icon: "arrow.right",
                                    isFullWidth: true,
                                    action: {
                                        showCheckout = true
                                    }
                                )
                            }
                            .padding(16)
                            .background(Color(.systemBackground))
                        }
                    }
                }
            }
            .navigationTitle(L("cart.title"))
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    if !viewModel.cartItems.isEmpty {
                        Button(action: { showClearConfirmation = true }) {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
            .sheet(isPresented: $showCheckout) {
                CheckoutView(viewModel: viewModel)
            }
            .alert(L("cart.addPromo"), isPresented: $showPromoCodeInput) {
                TextField(L("cart.promoPlaceholder"), text: $promoCode)
                Button(L("common.cancel"), role: .cancel) {}
                Button(L("cart.apply")) {
                    viewModel.applyPromoCode(code: promoCode)
                    promoCode = ""
                }
            }
            .alert(L("cart.clearConfirm"), isPresented: $showClearConfirmation) {
                Button(L("common.cancel"), role: .cancel) {}
                Button(L("cart.clear"), role: .destructive) {
                    viewModel.clearCart()
                }
            } message: {
                Text(L("cart.clearMessage"))
            }
            .onAppear {
                viewModel.loadCart()
            }
        }
    }
}

// MARK: - Cart Item Row
struct CartItemRow: View {
    let item: CartItem
    let onIncrement: () -> Void
    let onDecrement: () -> Void
    let onRemove: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            // Product Image
            ProductImageView(url: item.product.thumbnail, width: 80, height: 80)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            
            // Product Info
            VStack(alignment: .leading, spacing: 6) {
                Text(item.product.seller.name)
                    .font(.caption2)
                    .foregroundColor(.bhdPrimary)
                
                Text(item.product.localizedName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(2)
                
                Text(String(format: "%.3f %@", item.unitPrice, "BHD"))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                // Quantity Controls
                HStack(spacing: 0) {
                    Button(action: onDecrement) {
                        Image(systemName: "minus")
                            .frame(width: 28, height: 28)
                            .foregroundColor(item.isMinQuantity ? .gray : .primary)
                    }
                    .disabled(item.isMinQuantity)
                    
                    Text("\(item.quantity)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .frame(minWidth: 32)
                        .multilineTextAlignment(.center)
                    
                    Button(action: onIncrement) {
                        Image(systemName: "plus")
                            .frame(width: 28, height: 28)
                            .foregroundColor(item.isMaxQuantity ? .gray : .primary)
                    }
                    .disabled(item.isMaxQuantity)
                }
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            
            Spacer()
            
            // Remove & Total
            VStack(alignment: .trailing, spacing: 8) {
                Button(action: onRemove) {
                    Image(systemName: "xmark")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(width: 24, height: 24)
                }
                
                Spacer()
                
                Text(String(format: "%.3f", item.totalPrice))
                    .font(.subheadline)
                    .fontWeight(.bold)
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 4, x: 0, y: 2)
    }
}

// MARK: - Order Summary Row
struct OrderSummaryRow: View {
    let title: String
    let value: Double
    var isDiscount: Bool = false
    
    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
            Text(String(format: "%.3f BHD", value))
                .font(.subheadline)
                .fontWeight(isDiscount ? .semibold : .regular)
                .foregroundColor(isDiscount ? .green : .primary)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Checkout View
struct CheckoutView: View {
    @ObservedObject var viewModel: CartViewModel
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedAddress: ShippingAddress? = nil
    @State private var selectedPayment: PaymentMethodType = .creditCard
    @State private var orderNotes = ""
    @State private var isPlacingOrder = false
    @State private var showOrderSuccess = false
    @State private var createdOrder: Order? = nil
    
    var body: some View {
        NavigationStack {
            Form {
                // Delivery Address
                Section(header: Text(L("checkout.address"))) {
                    if let address = selectedAddress {
                        AddressCard(address: address)
                    } else {
                        Button(action: {}) {
                            HStack {
                                Image(systemName: "plus.circle")
                                    .foregroundColor(.bhdPrimary)
                                Text(L("checkout.addAddress"))
                                    .foregroundColor(.bhdPrimary)
                            }
                        }
                    }
                }
                
                // Payment Method
                Section(header: Text(L("checkout.payment"))) {
                    ForEach([PaymentMethodType.creditCard, .applePay, .cashOnDelivery], id: \.self) { method in
                        PaymentMethodRow(
                            method: method,
                            isSelected: selectedPayment == method,
                            onSelect: { selectedPayment = method }
                        )
                    }
                }
                
                // Order Notes
                Section(header: Text(L("checkout.notes"))) {
                    TextEditor(text: $orderNotes)
                        .frame(minHeight: 80)
                }
                
                // Order Summary
                Section(header: Text(L("checkout.summary"))) {
                    HStack {
                        Text(L("cart.subtotal"))
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(String(format: "%.3f BHD", viewModel.subtotal))
                    }
                    if viewModel.discount > 0 {
                        HStack {
                            Text(L("cart.discount"))
                                .foregroundColor(.secondary)
                            Spacer()
                            Text(String(format: "-%.3f BHD", viewModel.discount))
                                .foregroundColor(.green)
                        }
                    }
                    HStack {
                        Text(L("cart.shipping"))
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(String(format: "%.3f BHD", viewModel.shippingCost))
                    }
                    HStack {
                        Text(L("cart.total"))
                            .fontWeight(.bold)
                        Spacer()
                        Text(viewModel.formattedTotal)
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.bhdPrimary)
                    }
                }
            }
            .navigationTitle(L("checkout.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(L("common.cancel")) { dismiss() }
                }
            }
            .overlay(
                VStack {
                    Spacer()
                    VStack(spacing: 0) {
                        Divider()
                        BHDButton(
                            title: isPlacingOrder ? L("checkout.placing") : L("checkout.placeOrder"),
                            icon: isPlacingOrder ? nil : "checkmark",
                            isLoading: isPlacingOrder,
                            isFullWidth: true,
                            action: { placeOrder() }
                        )
                        .padding(16)
                        .background(Color(.systemBackground))
                    }
                }
            )
            .sheet(isPresented: $showOrderSuccess) {
                if let order = createdOrder {
                    OrderSuccessView(order: order, onDone: {
                        dismiss()
                        viewModel.loadCart()
                    })
                }
            }
        }
    }
    
    private func placeOrder() {
        isPlacingOrder = true
        
        guard let address = selectedAddress else { return }
        
        let items = viewModel.cartItems.map {
            CreateOrderItem(productId: $0.product.id, quantity: $0.quantity)
        }
        
        let request = CreateOrderRequest(
            items: items,
            shippingAddress: address,
            billingAddress: nil,
            paymentMethod: selectedPayment,
            notes: orderNotes.isEmpty ? nil : orderNotes,
            promoCode: viewModel.appliedPromo?.code
        )
        
        OrderService.shared.createOrder(data: request)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in
                    isPlacingOrder = false
                },
                receiveValue: { order in
                    createdOrder = order
                    showOrderSuccess = true
                }
            )
            .store(in: &SubscriptionStore.shared.cancellables)
    }
}

// MARK: - Address Card
struct AddressCard: View {
    let address: ShippingAddress
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(address.fullName)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                if address.isDefault {
                    Text(L("address.default"))
                        .font(.caption2)
                        .fontWeight(.medium)
                        .foregroundColor(.bhdPrimary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.bhdPrimary.opacity(0.1))
                        .clipShape(Capsule())
                }
                
                Spacer()
                
                Button(action: {}) {
                    Text(L("common.edit"))
                        .font(.caption)
                        .foregroundColor(.bhdPrimary)
                }
            }
            
            Text(address.formattedAddress)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Text(address.phone)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Payment Method Row
struct PaymentMethodRow: View {
    let method: PaymentMethodType
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                Image(systemName: method.iconName)
                    .font(.title3)
                    .foregroundColor(isSelected ? .bhdPrimary : .secondary)
                    .frame(width: 32)
                
                Text(method.localizedName)
                    .font(.subheadline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.bhdPrimary)
                } else {
                    Circle()
                        .stroke(Color.secondary.opacity(0.3), lineWidth: 1.5)
                        .frame(width: 22, height: 22)
                }
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Order Success View
struct OrderSuccessView: View {
    let order: Order
    let onDone: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            // Success Animation
            ZStack {
                Circle()
                    .fill(Color.green.opacity(0.1))
                    .frame(width: 120, height: 120)
                
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.green)
            }
            
            VStack(spacing: 8) {
                Text(L("checkout.success"))
                    .font(.title)
                    .fontWeight(.bold)
                
                Text(L("checkout.successMessage"))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                
                Text(order.orderNumber)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.bhdPrimary)
                    .padding(.top, 8)
            }
            
            VStack(spacing: 12) {
                HStack {
                    Text(L("order.status"))
                        .foregroundColor(.secondary)
                    Spacer()
                    StatusBadge(status: order.status)
                }
                
                HStack {
                    Text(L("cart.total"))
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(order.formattedTotal)
                        .fontWeight(.bold)
                }
            }
            .padding(16)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 24)
            
            Spacer()
            
            BHDButton(
                title: L("checkout.done"),
                isFullWidth: true,
                action: onDone
            )
            .padding(.horizontal, 24)
            .padding(.bottom, 32)
        }
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let status: OrderStatus
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: status.iconName)
                .font(.caption2)
            Text(status.localizedName)
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(Color(hex: status.colorHex).opacity(0.12))
        .foregroundColor(Color(hex: status.colorHex))
        .clipShape(Capsule())
    }
}

// MARK: - Color Hex Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Preview
#Preview {
    CartView()
}
