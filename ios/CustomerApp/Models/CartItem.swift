//
//  CartItem.swift
//  BHD Marketplace
//
//  Cart item model
//

import Foundation

// MARK: - Cart
struct Cart: Codable {
    let id: String
    let user: String
    let items: [CartItem]
    let promoCode: String?
    let discountAmount: Double
    let subtotal: Double
    let shippingEstimate: Double
    let tax: Double
    let total: Double
    let currency: String
    let itemCount: Int
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case user, items, promoCode, discountAmount
        case subtotal, shippingEstimate, tax, total
        case currency, itemCount, updatedAt
    }
}

// MARK: - Cart Item
struct CartItem: Identifiable, Codable {
    let id: String
    let product: CartProduct
    let quantity: Int
    let unitPrice: Double
    let totalPrice: Double
    let addedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case product, quantity, unitPrice, totalPrice, addedAt
    }
    
    var isMaxQuantity: Bool {
        return quantity >= product.stockQuantity
    }
    
    var isMinQuantity: Bool {
        return quantity <= 1
    }
}

// MARK: - Cart Product (embedded)
struct CartProduct: Codable, Identifiable {
    let id: String
    let name: String
    let nameAr: String?
    let thumbnail: String?
    let price: Double
    let stockQuantity: Int
    let isActive: Bool
    let seller: SellerInfo
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, nameAr, thumbnail, price
        case stockQuantity, isActive, seller
    }
    
    var localizedName: String {
        let isRTL = LocalizationManager.shared.currentLanguage == "ar"
        return isRTL ? (nameAr ?? name) : name
    }
}

// MARK: - Add to Cart Request
struct AddToCartRequest: Codable {
    let productId: String
    let quantity: Int
}

// MARK: - Update Cart Item Request
struct UpdateCartItemRequest: Codable {
    let quantity: Int
}

// MARK: - Promo Code Response
struct PromoCodeResponse: Codable {
    let code: String
    let discountType: DiscountType
    let discountValue: Double
    let discountAmount: Double
    let minimumOrder: Double?
    let message: String?
}

enum DiscountType: String, Codable {
    case percentage
    case fixed
}

// MARK: - Shipping Estimate
struct ShippingEstimate: Codable {
    let method: String
    let cost: Double
    let estimatedDays: Int
    let currency: String
}
