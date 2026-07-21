//
//  ProductService.swift
//  BHD Marketplace
//
//  Product browsing and search service
//

import Foundation
import Combine

// MARK: - Product Service Protocol
protocol ProductServiceProtocol {
    func getProducts(filter: ProductFilter?, page: Int, limit: Int) -> AnyPublisher<ProductsResponse, APIError>
    func getProduct(id: String) -> AnyPublisher<Product, APIError>
    func searchProducts(query: String, filter: ProductFilter?) -> AnyPublisher<ProductsResponse, APIError>
    func getFeatured() -> AnyPublisher<[Product], APIError>
    func getTrending() -> AnyPublisher<[Product], APIError>
    func getNewArrivals() -> AnyPublisher<[Product], APIError>
    func getCategories() -> AnyPublisher<[Category], APIError>
    func getBanners() -> AnyPublisher<[Banner], APIError>
    func getHomeSections() -> AnyPublisher<[HomeSection], APIError>
    func getReviews(productId: String) -> AnyPublisher<[ProductReview], APIError>
    func addReview(productId: String, rating: Int, comment: String) -> AnyPublisher<ProductReview, APIError>
    func toggleWishlist(productId: String) -> AnyPublisher<Bool, APIError>
    func getWishlist() -> AnyPublisher<[Product], APIError>
}

// MARK: - Product Service
final class ProductService: ProductServiceProtocol {
    static let shared = ProductService()
    
    private let api = APIService.shared
    private var cancellables = Set<AnyCancellable>()
    
    // Cached data
    @Published private(set) var categories: [Category] = []
    @Published private(set) var banners: [Banner] = []
    @Published private(set) var isLoading: Bool = false
    @Published private(set) var error: APIError?
    
    private init() {}
    
    // MARK: - Get Products (Paginated)
    func getProducts(filter: ProductFilter? = nil, page: Int = 1, limit: Int = 20) -> AnyPublisher<ProductsResponse, APIError> {
        isLoading = true
        error = nil
        
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(limit))
        ]
        
        if let filter = filter {
            if let category = filter.category {
                queryItems.append(URLQueryItem(name: "category", value: category))
            }
            if let minPrice = filter.minPrice {
                queryItems.append(URLQueryItem(name: "minPrice", value: String(minPrice)))
            }
            if let maxPrice = filter.maxPrice {
                queryItems.append(URLQueryItem(name: "maxPrice", value: String(maxPrice)))
            }
            queryItems.append(URLQueryItem(name: "sort", value: filter.sortBy.rawValue))
            if let tags = filter.tags {
                queryItems.append(URLQueryItem(name: "tags", value: tags.joined(separator: ",")))
            }
        }
        
        return api.request(endpoint: "/products", queryItems: queryItems, requiresAuth: false)
            .handleEvents(
                receiveCompletion: { [weak self] _ in
                    self?.isLoading = false
                },
                receiveCancel: { [weak self] in
                    self?.isLoading = false
                }
            )
            .catch { [weak self] error -> AnyPublisher<ProductsResponse, APIError> in
                self?.error = error
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get Single Product
    func getProduct(id: String) -> AnyPublisher<Product, APIError> {
        isLoading = true
        error = nil
        
        return api.request(endpoint: "/products/\(id)", requiresAuth: false)
            .handleEvents(receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            })
            .catch { [weak self] error -> AnyPublisher<Product, APIError> in
                self?.error = error
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Search Products
    func searchProducts(query: String, filter: ProductFilter? = nil) -> AnyPublisher<ProductsResponse, APIError> {
        isLoading = true
        error = nil
        
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "limit", value: "50")
        ]
        
        if let filter = filter {
            if let category = filter.category {
                queryItems.append(URLQueryItem(name: "category", value: category))
            }
            if let minPrice = filter.minPrice {
                queryItems.append(URLQueryItem(name: "minPrice", value: String(minPrice)))
            }
            if let maxPrice = filter.maxPrice {
                queryItems.append(URLQueryItem(name: "maxPrice", value: String(maxPrice)))
            }
        }
        
        return api.request(endpoint: "/products/search", queryItems: queryItems, requiresAuth: false)
            .handleEvents(receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            })
            .catch { [weak self] error -> AnyPublisher<ProductsResponse, APIError> in
                self?.error = error
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get Featured Products
    func getFeatured() -> AnyPublisher<[Product], APIError> {
        return api.request(endpoint: "/products/featured", requiresAuth: false)
            .catch { [weak self] error -> AnyPublisher<[Product], APIError> in
                self?.error = error
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get Trending Products
    func getTrending() -> AnyPublisher<[Product], APIError> {
        return api.request(endpoint: "/products/trending", requiresAuth: false)
            .catch { [weak self] error -> AnyPublisher<[Product], APIError> in
                self?.error = error
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get New Arrivals
    func getNewArrivals() -> AnyPublisher<[Product], APIError> {
        return api.request(endpoint: "/products/new-arrivals", requiresAuth: false)
            .catch { [weak self] error -> AnyPublisher<[Product], APIError> in
                self?.error = error
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get Categories
    func getCategories() -> AnyPublisher<[Category], APIError> {
        return api.request(endpoint: "/categories", requiresAuth: false)
            .handleEvents(receiveOutput: { [weak self] categories in
                DispatchQueue.main.async {
                    self?.categories = categories
                }
            })
            .catch { [weak self] error -> AnyPublisher<[Category], APIError> in
                self?.error = error
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get Banners
    func getBanners() -> AnyPublisher<[Banner], APIError> {
        return api.request(endpoint: "/banners", requiresAuth: false)
            .handleEvents(receiveOutput: { [weak self] banners in
                DispatchQueue.main.async {
                    self?.banners = banners
                }
            })
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get Home Sections
    func getHomeSections() -> AnyPublisher<[HomeSection], APIError> {
        return api.request(endpoint: "/home/sections", requiresAuth: false)
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get Product Reviews
    func getReviews(productId: String) -> AnyPublisher<[ProductReview], APIError> {
        return api.request(endpoint: "/products/\(productId)/reviews", requiresAuth: false)
            .eraseToAnyPublisher()
    }
    
    // MARK: - Add Review
    func addReview(productId: String, rating: Int, comment: String) -> AnyPublisher<ProductReview, APIError> {
        let body = AddReviewRequest(rating: rating, comment: comment)
        return api.request(endpoint: "/products/\(productId)/reviews", method: .post, body: body, requiresAuth: true)
            .eraseToAnyPublisher()
    }
    
    // MARK: - Toggle Wishlist
    func toggleWishlist(productId: String) -> AnyPublisher<Bool, APIError> {
        return api.request(endpoint: "/wishlist/\(productId)", method: .post, requiresAuth: true)
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get Wishlist
    func getWishlist() -> AnyPublisher<[Product], APIError> {
        return api.request(endpoint: "/wishlist", requiresAuth: true)
            .eraseToAnyPublisher()
    }
}

// MARK: - Add Review Request
struct AddReviewRequest: Codable {
    let rating: Int
    let comment: String
}

// MARK: - Preview Data
extension Product {
    static let sample = Product(
        id: "prod_1",
        name: "iPhone 15 Pro Max",
        nameAr: "آيفون 15 برو ماكس",
        description: "The most advanced iPhone ever with A17 Pro chip, titanium design, and incredible camera system.",
        descriptionAr: "أحدث آيفون على الإطلاق مع شريحة A17 Pro، تصميم التيتانيوم، ونظام كاميرا مذهل.",
        price: 449.000,
        compareAtPrice: 499.000,
        currency: "BHD",
        images: [
            ProductImage(url: "https://example.com/iphone1.jpg", alt: "iPhone 15 Pro Max - Front", isPrimary: true),
            ProductImage(url: "https://example.com/iphone2.jpg", alt: "iPhone 15 Pro Max - Back", isPrimary: false)
        ],
        thumbnail: "https://example.com/iphone-thumb.jpg",
        category: ProductCategory(id: "cat_1", name: "Electronics", nameAr: "إلكترونيات", icon: "laptop", image: nil),
        subcategory: nil,
        seller: SellerInfo(id: "sell_1", name: "TechWorld BH", logo: nil, rating: 4.8),
        rating: 4.7,
        reviewCount: 234,
        stockQuantity: 50,
        sku: "IPH15PM-256",
        tags: ["smartphone", "apple", "5g"],
        attributes: [
            ProductAttribute(name: "Storage", nameAr: "التخزين", value: "256GB", valueAr: "256 جيجابايت"),
            ProductAttribute(name: "Color", nameAr: "اللون", value: "Natural Titanium", valueAr: "تيتانيوم طبيعي")
        ],
        isFeatured: true,
        isActive: true,
        weight: 0.221,
        dimensions: ProductDimensions(length: 15.9, width: 7.7, height: 0.83, unit: "cm"),
        createdAt: Date(),
        updatedAt: Date()
    )
    
    static let samples: [Product] = [
        sample,
        Product(
            id: "prod_2",
            name: "Samsung Galaxy S24 Ultra",
            nameAr: "سامسونج جالاكسي S24 الترا",
            description: "Galaxy AI is here. Discover the new era of mobile AI.",
            descriptionAr: "جالاكسي AI هنا. اكتشف عصر الذكاء الاصطناعي للجوال.",
            price: 399.000,
            compareAtPrice: 429.000,
            currency: "BHD",
            images: [],
            thumbnail: nil,
            category: ProductCategory(id: "cat_1", name: "Electronics", nameAr: "إلكترونيات", icon: "laptop", image: nil),
            subcategory: nil,
            seller: SellerInfo(id: "sell_2", name: "Samsung Store", logo: nil, rating: 4.6),
            rating: 4.5,
            reviewCount: 189,
            stockQuantity: 30,
            sku: "GS24U-512",
            tags: ["smartphone", "samsung", "ai"],
            attributes: [],
            isFeatured: true,
            isActive: true,
            weight: 0.233,
            dimensions: nil,
            createdAt: Date(),
            updatedAt: Date()
        ),
        Product(
            id: "prod_3",
            name: "Nespresso Vertuo Plus",
            nameAr: "نسبريسو فيرتوو بلس",
            description: "Premium coffee machine with barcode technology for perfect brewing.",
            descriptionAr: "آلة قهوة متميزة بتقنية الباركود لتحضير مثالي.",
            price: 89.000,
            compareAtPrice: nil,
            currency: "BHD",
            images: [],
            thumbnail: nil,
            category: ProductCategory(id: "cat_2", name: "Home Appliances", nameAr: "أجهزة منزلية", icon: "house.fill", image: nil),
            subcategory: nil,
            seller: SellerInfo(id: "sell_3", name: "Home Comfort", logo: nil, rating: 4.4),
            rating: 4.6,
            reviewCount: 78,
            stockQuantity: 15,
            sku: "NEV-PLUS",
            tags: ["coffee", "kitchen", "premium"],
            attributes: [],
            isFeatured: false,
            isActive: true,
            weight: 4.6,
            dimensions: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    ]
}
