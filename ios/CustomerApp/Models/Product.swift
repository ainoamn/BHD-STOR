//
//  Product.swift
//  BHD Marketplace
//
//  Product model with full Codable support
//

import Foundation

// MARK: - Product
struct Product: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let nameAr: String?
    let description: String
    let descriptionAr: String?
    let price: Double
    let compareAtPrice: Double?
    let currency: String
    let images: [ProductImage]
    let thumbnail: String?
    let category: ProductCategory
    let subcategory: ProductCategory?
    let seller: SellerInfo
    let rating: Double
    let reviewCount: Int
    let stockQuantity: Int
    let sku: String
    let tags: [String]
    let attributes: [ProductAttribute]
    let isFeatured: Bool
    let isActive: Bool
    let weight: Double?
    let dimensions: ProductDimensions?
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, nameAr, description, descriptionAr, price
        case compareAtPrice, currency, images, thumbnail, category
        case subcategory, seller, rating, reviewCount, stockQuantity
        case sku, tags, attributes, isFeatured, isActive
        case weight, dimensions, createdAt, updatedAt
    }
    
    var localizedName: String {
        let isRTL = LocalizationManager.shared.currentLanguage == "ar"
        return isRTL ? (nameAr ?? name) : name
    }
    
    var localizedDescription: String {
        let isRTL = LocalizationManager.shared.currentLanguage == "ar"
        return isRTL ? (descriptionAr ?? description) : description
    }
    
    var displayPrice: String {
        return String(format: "%.3f %@", price, currency)
    }
    
    var hasDiscount: Bool {
        guard let compare = compareAtPrice else { return false }
        return compare > price
    }
    
    var discountPercentage: Int? {
        guard let compare = compareAtPrice, compare > price else { return nil }
        return Int(((compare - price) / compare) * 100)
    }
    
    var isInStock: Bool {
        return stockQuantity > 0
    }
    
    var displayRating: String {
        return String(format: "%.1f", rating)
    }
}

// MARK: - ProductImage
struct ProductImage: Codable, Hashable {
    let url: String
    let alt: String?
    let isPrimary: Bool
}

// MARK: - ProductCategory
struct ProductCategory: Codable, Hashable, Identifiable {
    let id: String
    let name: String
    let nameAr: String?
    let icon: String?
    let image: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, nameAr, icon, image
    }
    
    var localizedName: String {
        let isRTL = LocalizationManager.shared.currentLanguage == "ar"
        return isRTL ? (nameAr ?? name) : name
    }
}

// MARK: - SellerInfo
struct SellerInfo: Codable, Hashable, Identifiable {
    let id: String
    let name: String
    let logo: String?
    let rating: Double
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, logo, rating
    }
}

// MARK: - ProductAttribute
struct ProductAttribute: Codable, Hashable {
    let name: String
    let nameAr: String?
    let value: String
    let valueAr: String?
}

// MARK: - ProductDimensions
struct ProductDimensions: Codable, Hashable {
    let length: Double
    let width: Double
    let height: Double
    let unit: String
}

// MARK: - Product Filter
struct ProductFilter: Codable {
    var category: String?
    var minPrice: Double?
    var maxPrice: Double?
    var sortBy: SortOption
    var searchQuery: String?
    var tags: [String]?
    
    enum SortOption: String, Codable, CaseIterable {
        case priceAsc = "price_asc"
        case priceDesc = "price_desc"
        case newest = "newest"
        case popular = "popular"
        case rating = "rating"
        
        var displayName: String {
            switch self {
            case .priceAsc: return "Price: Low to High"
            case .priceDesc: return "Price: High to Low"
            case .newest: return "Newest First"
            case .popular: return "Most Popular"
            case .rating: return "Highest Rated"
            }
        }
        
        var localizedName: String {
            switch self {
            case .priceAsc: return L("sort.priceAsc")
            case .priceDesc: return L("sort.priceDesc")
            case .newest: return L("sort.newest")
            case .popular: return L("sort.popular")
            case .rating: return L("sort.rating")
            }
        }
    }
}

// MARK: - Paginated Products Response
struct ProductsResponse: Codable {
    let products: [Product]
    let total: Int
    let page: Int
    let limit: Int
    let totalPages: Int
}

// MARK: - Review
struct ProductReview: Identifiable, Codable {
    let id: String
    let user: ReviewUser
    let rating: Int
    let comment: String
    let images: [String]?
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case user, rating, comment, images, createdAt
    }
}

struct ReviewUser: Codable {
    let id: String
    let name: String
    let avatar: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, avatar
    }
}
