//
//  Order.swift
//  BHD Marketplace
//
//  Order model with tracking support
//

import Foundation

// MARK: - Order Status
enum OrderStatus: String, Codable, CaseIterable {
    case pending = "pending"
    case confirmed = "confirmed"
    case processing = "processing"
    case shipped = "shipped"
    case outForDelivery = "out_for_delivery"
    case delivered = "delivered"
    case cancelled = "cancelled"
    case refunded = "refunded"
    
    var displayName: String {
        switch self {
        case .pending: return "Pending"
        case .confirmed: return "Confirmed"
        case .processing: return "Processing"
        case .shipped: return "Shipped"
        case .outForDelivery: return "Out for Delivery"
        case .delivered: return "Delivered"
        case .cancelled: return "Cancelled"
        case .refunded: return "Refunded"
        }
    }
    
    var localizedName: String {
        switch self {
        case .pending: return L("order.status.pending")
        case .confirmed: return L("order.status.confirmed")
        case .processing: return L("order.status.processing")
        case .shipped: return L("order.status.shipped")
        case .outForDelivery: return L("order.status.outForDelivery")
        case .delivered: return L("order.status.delivered")
        case .cancelled: return L("order.status.cancelled")
        case .refunded: return L("order.status.refunded")
        }
    }
    
    var colorHex: String {
        switch self {
        case .pending: return "#F59E0B"
        case .confirmed: return "#3B82F6"
        case .processing: return "#8B5CF6"
        case .shipped: return "#06B6D4"
        case .outForDelivery: return "#F97316"
        case .delivered: return "#10B981"
        case .cancelled: return "#EF4444"
        case .refunded: return "#6B7280"
        }
    }
    
    var iconName: String {
        switch self {
        case .pending: return "clock"
        case .confirmed: return "checkmark.circle"
        case .processing: return "gearshape.2"
        case .shipped: return "box.truck"
        case .outForDelivery: return "truck"
        case .delivered: return "checkmark.seal"
        case .cancelled: return "xmark.circle"
        case .refunded: return "arrow.uturn.backward.circle"
        }
    }
    
    var progressValue: Double {
        switch self {
        case .pending: return 0.125
        case .confirmed: return 0.25
        case .processing: return 0.375
        case .shipped: return 0.5
        case .outForDelivery: return 0.75
        case .delivered: return 1.0
        case .cancelled: return 0.0
        case .refunded: return 0.0
        }
    }
}

// MARK: - Order
struct Order: Identifiable, Codable {
    let id: String
    let orderNumber: String
    let user: String
    let items: [OrderItem]
    let shippingAddress: ShippingAddress
    let billingAddress: ShippingAddress?
    let status: OrderStatus
    let paymentStatus: PaymentStatus
    let paymentMethod: PaymentMethod
    let subtotal: Double
    let shippingCost: Double
    let discount: Double
    let tax: Double
    let total: Double
    let currency: String
    let notes: String?
    let trackingNumber: String?
    let trackingUrl: String?
    let estimatedDelivery: Date?
    let timeline: [OrderTimelineEvent]?
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case orderNumber, user, items, shippingAddress
        case billingAddress, status, paymentStatus, paymentMethod
        case subtotal, shippingCost, discount, tax, total
        case currency, notes, trackingNumber, trackingUrl
        case estimatedDelivery, timeline, createdAt, updatedAt
    }
    
    var itemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }
    
    var formattedTotal: String {
        return String(format: "%.3f %@", total, currency)
    }
    
    var canCancel: Bool {
        return status == .pending || status == .confirmed
    }
}

// MARK: - Order Item
struct OrderItem: Codable, Identifiable {
    let id: String
    let product: OrderProduct
    let quantity: Int
    let price: Double
    let total: Double
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case product, quantity, price, total
    }
}

// MARK: - Order Product (minimal)
struct OrderProduct: Codable, Identifiable {
    let id: String
    let name: String
    let nameAr: String?
    let thumbnail: String?
    let sku: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, nameAr, thumbnail, sku
    }
    
    var localizedName: String {
        let isRTL = LocalizationManager.shared.currentLanguage == "ar"
        return isRTL ? (nameAr ?? name) : name
    }
}

// MARK: - Shipping Address
struct ShippingAddress: Codable, Identifiable, Hashable {
    let id: String
    let fullName: String
    let phone: String
    let addressLine1: String
    let addressLine2: String?
    let city: String
    let governorate: String
    let country: String
    let postalCode: String?
    let isDefault: Bool
    let label: String?
    let location: GeoLocation?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case fullName, phone, addressLine1, addressLine2
        case city, governorate, country, postalCode
        case isDefault, label, location
    }
    
    var formattedAddress: String {
        var parts = [addressLine1]
        if let line2 = addressLine2 { parts.append(line2) }
        parts.append(city)
        parts.append(governorate)
        return parts.joined(separator: ", ")
    }
}

// MARK: - Geo Location
struct GeoLocation: Codable, Hashable {
    let latitude: Double
    let longitude: Double
}

// MARK: - Payment Status
enum PaymentStatus: String, Codable {
    case pending = "pending"
    case paid = "paid"
    case failed = "failed"
    case refunded = "refunded"
    case partiallyRefunded = "partially_refunded"
}

// MARK: - Payment Method
struct PaymentMethod: Codable {
    let type: PaymentMethodType
    let lastFour: String?
    let cardBrand: String?
}

enum PaymentMethodType: String, Codable {
    case creditCard = "credit_card"
    case debitCard = "debit_card"
    case applePay = "apple_pay"
    case cashOnDelivery = "cash_on_delivery"
    case bankTransfer = "bank_transfer"
    
    var displayName: String {
        switch self {
        case .creditCard: return "Credit Card"
        case .debitCard: return "Debit Card"
        case .applePay: return "Apple Pay"
        case .cashOnDelivery: return "Cash on Delivery"
        case .bankTransfer: return "Bank Transfer"
        }
    }
    
    var localizedName: String {
        switch self {
        case .creditCard: return L("payment.creditCard")
        case .debitCard: return L("payment.debitCard")
        case .applePay: return L("payment.applePay")
        case .cashOnDelivery: return L("payment.cod")
        case .bankTransfer: return L("payment.bankTransfer")
        }
    }
    
    var iconName: String {
        switch self {
        case .creditCard, .debitCard: return "creditcard"
        case .applePay: return "apple.logo"
        case .cashOnDelivery: return "banknote"
        case .bankTransfer: return "building.columns"
        }
    }
}

// MARK: - Order Timeline Event
struct OrderTimelineEvent: Codable, Identifiable {
    let id: String
    let status: OrderStatus
    let description: String
    let descriptionAr: String?
    let location: String?
    let timestamp: Date
    let isCompleted: Bool
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case status, description, descriptionAr
        case location, timestamp, isCompleted
    }
    
    var localizedDescription: String {
        let isRTL = LocalizationManager.shared.currentLanguage == "ar"
        return isRTL ? (descriptionAr ?? description) : description
    }
}

// MARK: - Create Order Request
struct CreateOrderRequest: Codable {
    let items: [CreateOrderItem]
    let shippingAddress: ShippingAddress
    let billingAddress: ShippingAddress?
    let paymentMethod: PaymentMethodType
    let notes: String?
    let promoCode: String?
}

struct CreateOrderItem: Codable {
    let productId: String
    let quantity: Int
}

// MARK: - Orders Response
struct OrdersResponse: Codable {
    let orders: [Order]
    let total: Int
    let page: Int
    let totalPages: Int
}
