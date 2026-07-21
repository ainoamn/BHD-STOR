//
//  SellerAPIService.swift
//  BHD Seller Dashboard
//
//  Seller-specific API service for dashboard operations
//

import Foundation
import Combine

// MARK: - Seller API Configuration
enum SellerAPIConfig {
    #if DEBUG
    static let baseURL = "https://api-staging.bhd.marketplace/v1/seller"
    #else
    static let baseURL = "https://api.bhd.marketplace/v1/seller"
    #endif
    
    static let timeout: TimeInterval = 30
}

// MARK: - Seller API Error
enum SellerAPIError: Error, LocalizedError {
    case invalidURL
    case noData
    case decodingError(Error)
    case serverError(Int, String?)
    case networkError(Error)
    case unauthorized
    case forbidden
    case notFound
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .noData: return "No data received"
        case .decodingError(let error): return "Decoding error: \(error.localizedDescription)"
        case .serverError(let code, let message): return message ?? "Server error \(code)"
        case .networkError(let error): return "Network error: \(error.localizedDescription)"
        case .unauthorized: return "Session expired. Please login again."
        case .forbidden: return "You don't have permission to access this resource."
        case .notFound: return "Resource not found"
        case .unknown: return "An unknown error occurred"
        }
    }
}

// MARK: - Seller API Response Wrapper
struct SellerAPIResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let message: String?
    let meta: SellerResponseMeta?
}

struct SellerResponseMeta: Codable {
    let total: Int?
    let page: Int?
    let limit: Int?
    let totalPages: Int?
}

// MARK: - Seller API Service
final class SellerAPIService {
    static let shared = SellerAPIService()
    
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private var cancellables = Set<AnyCancellable>()
    
    // Published state
    @Published var isLoading: Bool = false
    @Published var lastError: SellerAPIError?
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = SellerAPIConfig.timeout
        config.httpAdditionalHeaders = [
            "Accept": "application/json",
            "Content-Type": "application/json"
        ]
        self.session = URLSession(configuration: config)
        
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
    }
    
    // MARK: - Generic Request
    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        queryItems: [URLQueryItem]? = nil
    ) -> AnyPublisher<T, SellerAPIError> {
        
        guard let url = buildURL(endpoint: endpoint, queryItems: queryItems) else {
            return Fail(error: SellerAPIError.invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        if let body = body {
            do {
                request.httpBody = try encoder.encode(body)
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            } catch {
                return Fail(error: SellerAPIError.decodingError(error)).eraseToAnyPublisher()
            }
        }
        
        // Auth header
        if let token = KeychainManager.shared.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        return session.dataTaskPublisher(for: request)
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw SellerAPIError.unknown
                }
                
                switch httpResponse.statusCode {
                case 200...299:
                    return data
                case 401:
                    throw SellerAPIError.unauthorized
                case 403:
                    throw SellerAPIError.forbidden
                case 404:
                    throw SellerAPIError.notFound
                case 500...599:
                    throw SellerAPIError.serverError(httpResponse.statusCode, nil)
                default:
                    throw SellerAPIError.serverError(httpResponse.statusCode, nil)
                }
            }
            .decode(type: SellerAPIResponse<T>.self, decoder: decoder)
            .tryMap { response -> T in
                guard response.success else {
                    throw SellerAPIError.serverError(400, response.message)
                }
                guard let data = response.data else {
                    throw SellerAPIError.noData
                }
                return data
            }
            .mapError { error -> SellerAPIError in
                if let apiError = error as? SellerAPIError { return apiError }
                if let decodingError = error as? DecodingError {
                    return SellerAPIError.decodingError(decodingError)
                }
                return SellerAPIError.networkError(error)
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Dashboard
    func getDashboardStats(period: String? = nil) -> AnyPublisher<SellerDashboardStats, SellerAPIError> {
        var queryItems: [URLQueryItem] = []
        if let period = period {
            queryItems.append(URLQueryItem(name: "period", value: period))
        }
        return request(endpoint: "/dashboard", queryItems: queryItems)
    }
    
    // MARK: - Products
    func getProducts(
        page: Int = 1,
        limit: Int = 20,
        search: String? = nil,
        category: String? = nil,
        status: String? = nil,
        sortBy: String = "created_at",
        sortOrder: String = "desc"
    ) -> AnyPublisher<SellerProductsResponse, SellerAPIError> {
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(limit)),
            URLQueryItem(name: "sort_by", value: sortBy),
            URLQueryItem(name: "sort_order", value: sortOrder)
        ]
        if let search = search { queryItems.append(URLQueryItem(name: "search", value: search)) }
        if let category = category { queryItems.append(URLQueryItem(name: "category", value: category)) }
        if let status = status { queryItems.append(URLQueryItem(name: "status", value: status)) }
        
        return request(endpoint: "/products", queryItems: queryItems)
    }
    
    func getProduct(id: String) -> AnyPublisher<SellerProductDetail, SellerAPIError> {
        return request(endpoint: "/products/\(id)")
    }
    
    func createProduct(data: CreateSellerProductRequest) -> AnyPublisher<SellerProductDetail, SellerAPIError> {
        return request(endpoint: "/products", method: .post, body: data)
    }
    
    func updateProduct(id: String, data: UpdateSellerProductRequest) -> AnyPublisher<SellerProductDetail, SellerAPIError> {
        return request(endpoint: "/products/\(id)", method: .put, body: data)
    }
    
    func deleteProduct(id: String) -> AnyPublisher<Void, SellerAPIError> {
        return request(endpoint: "/products/\(id)", method: .delete)
            .map { (_: EmptyResponse) in () }
            .eraseToAnyPublisher()
    }
    
    func updateStock(id: String, quantity: Int) -> AnyPublisher<SellerProductDetail, SellerAPIError> {
        let body = ["stock_quantity": quantity]
        return request(endpoint: "/products/\(id)/stock", method: .patch, body: body)
    }
    
    func uploadProductImage(productId: String, imageData: Data) -> AnyPublisher<ProductImageResponse, SellerAPIError> {
        guard let url = URL(string: SellerAPIConfig.baseURL + "/products/\(productId)/images") else {
            return Fail(error: SellerAPIError.invalidURL).eraseToAnyPublisher()
        }
        
        let boundary = UUID().uuidString
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        if let token = KeychainManager.shared.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"product.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body
        
        return session.dataTaskPublisher(for: request)
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse,
                      (200...299).contains(httpResponse.statusCode) else {
                    throw SellerAPIError.unknown
                }
                return data
            }
            .decode(type: ProductImageResponse.self, decoder: decoder)
            .mapError { error -> SellerAPIError in
                if let apiError = error as? SellerAPIError { return apiError }
                return SellerAPIError.networkError(error)
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Orders
    func getOrders(
        page: Int = 1,
        limit: Int = 20,
        status: String? = nil,
        startDate: String? = nil,
        endDate: String? = nil
    ) -> AnyPublisher<SellerOrdersResponse, SellerAPIError> {
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(limit))
        ]
        if let status = status { queryItems.append(URLQueryItem(name: "status", value: status)) }
        if let startDate = startDate { queryItems.append(URLQueryItem(name: "start_date", value: startDate)) }
        if let endDate = endDate { queryItems.append(URLQueryItem(name: "end_date", value: endDate)) }
        
        return request(endpoint: "/orders", queryItems: queryItems)
    }
    
    func getOrder(id: String) -> AnyPublisher<SellerOrderDetailResponse, SellerAPIError> {
        return request(endpoint: "/orders/\(id)")
    }
    
    func updateOrderStatus(id: String, status: String, notes: String? = nil) -> AnyPublisher<SellerOrderDetailResponse, SellerAPIError> {
        var body: [String: String] = ["status": status]
        if let notes = notes { body["notes"] = notes }
        return request(endpoint: "/orders/\(id)/status", method: .patch, body: body)
    }
    
    func addTracking(id: String, trackingNumber: String, carrier: String) -> AnyPublisher<SellerOrderDetailResponse, SellerAPIError> {
        let body = [
            "tracking_number": trackingNumber,
            "carrier": carrier
        ]
        return request(endpoint: "/orders/\(id)/tracking", method: .post, body: body)
    }
    
    func bulkUpdateOrderStatus(orderIds: [String], status: String) -> AnyPublisher<BulkUpdateResponse, SellerAPIError> {
        let body = [
            "order_ids": orderIds,
            "status": status
        ] as [String : Any]
        return request(endpoint: "/orders/bulk-update", method: .post, body: body)
    }
    
    // MARK: - Analytics
    func getAnalytics(
        period: String = "week",
        startDate: String? = nil,
        endDate: String? = nil
    ) -> AnyPublisher<SellerAnalytics, SellerAPIError> {
        var queryItems: [URLQueryItem] = [URLQueryItem(name: "period", value: period)]
        if let startDate = startDate { queryItems.append(URLQueryItem(name: "start_date", value: startDate)) }
        if let endDate = endDate { queryItems.append(URLQueryItem(name: "end_date", value: endDate)) }
        
        return request(endpoint: "/analytics", queryItems: queryItems)
    }
    
    func getSalesReport(
        period: String = "month",
        groupBy: String = "day"
    ) -> AnyPublisher<SalesReport, SellerAPIError> {
        let queryItems: [URLQueryItem] = [
            URLQueryItem(name: "period", value: period),
            URLQueryItem(name: "group_by", value: groupBy)
        ]
        return request(endpoint: "/analytics/sales", queryItems: queryItems)
    }
    
    func getTopProducts(
        period: String = "month",
        limit: Int = 10
    ) -> AnyPublisher<TopProductsResponse, SellerAPIError> {
        let queryItems: [URLQueryItem] = [
            URLQueryItem(name: "period", value: period),
            URLQueryItem(name: "limit", value: String(limit))
        ]
        return request(endpoint: "/analytics/top-products", queryItems: queryItems)
    }
    
    // MARK: - Notifications
    func getNotifications(page: Int = 1, limit: Int = 20) -> AnyPublisher<SellerNotificationsResponse, SellerAPIError> {
        let queryItems: [URLQueryItem] = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(limit))
        ]
        return request(endpoint: "/notifications", queryItems: queryItems)
    }
    
    func markNotificationRead(id: String) -> AnyPublisher<Void, SellerAPIError> {
        return request(endpoint: "/notifications/\(id)/read", method: .patch)
            .map { (_: EmptyResponse) in () }
            .eraseToAnyPublisher()
    }
    
    // MARK: - URL Builder
    private func buildURL(endpoint: String, queryItems: [URLQueryItem]? = nil) -> URL? {
        var components = URLComponents(string: SellerAPIConfig.baseURL + endpoint)
        if let queryItems = queryItems, !queryItems.isEmpty {
            components?.queryItems = queryItems
        }
        return components?.url
    }
}

// MARK: - Request/Response Models

struct CreateSellerProductRequest: Codable {
    let name: String
    let nameAr: String?
    let description: String?
    let descriptionAr: String?
    let price: Double
    let compareAtPrice: Double?
    let sku: String
    let category: String
    let stockQuantity: Int
    let weight: Double?
    let tags: [String]?
    let isActive: Bool
    let isFeatured: Bool
    let attributes: [ProductAttributeRequest]?
    let variants: [ProductVariantRequest]?
}

struct UpdateSellerProductRequest: Codable {
    let name: String?
    let nameAr: String?
    let description: String?
    let descriptionAr: String?
    let price: Double?
    let compareAtPrice: Double?
    let category: String?
    let stockQuantity: Int?
    let weight: Double?
    let tags: [String]?
    let isActive: Bool?
    let isFeatured: Bool?
}

struct ProductAttributeRequest: Codable {
    let name: String
    let value: String
}

struct ProductVariantRequest: Codable {
    let name: String
    let price: Double
    let stockQuantity: Int
    let sku: String?
}

// MARK: - Response Models
struct SellerDashboardStats: Codable {
    let totalRevenue: Double
    let totalOrders: Int
    let totalProducts: Int
    let totalCustomers: Int
    let pendingOrders: Int
    let lowStockCount: Int
    let revenueTrend: [TrendDataPoint]
    let recentOrders: [RecentOrderSummary]
}

struct TrendDataPoint: Codable {
    let date: String
    let value: Double
}

struct RecentOrderSummary: Codable, Identifiable {
    let id: String
    let orderNumber: String
    let customerName: String
    let total: Double
    let status: String
    let createdAt: Date
}

struct SellerProductsResponse: Codable {
    let products: [SellerProductDetail]
    let total: Int
    let page: Int
    let totalPages: Int
}

struct SellerProductDetail: Codable, Identifiable {
    let id: String
    let name: String
    let nameAr: String?
    let sku: String
    let price: Double
    let compareAtPrice: Double?
    let stockQuantity: Int
    let category: String
    let isActive: Bool
    let isFeatured: Bool
    let images: [String]?
    let sales: Int?
    let createdAt: Date?
    let updatedAt: Date?
}

struct ProductImageResponse: Codable {
    let imageUrl: String
    let thumbnailUrl: String?
}

struct SellerOrdersResponse: Codable {
    let orders: [SellerOrderDetailResponse]
    let total: Int
    let page: Int
    let totalPages: Int
}

struct SellerOrderDetailResponse: Codable, Identifiable {
    let id: String
    let orderNumber: String
    let customerName: String
    let customerEmail: String
    let customerPhone: String
    let total: Double
    let status: String
    let paymentMethod: String
    let trackingNumber: String?
    let items: [SellerOrderItemResponse]
    let shippingAddress: SellerShippingAddress?
    let createdAt: Date
    let updatedAt: Date?
}

struct SellerOrderItemResponse: Codable, Identifiable {
    let id: String
    let productName: String
    let productNameAr: String?
    let quantity: Int
    let price: Double
    let total: Double
    let image: String?
}

struct SellerShippingAddress: Codable {
    let fullName: String
    let phone: String
    let address: String
    let city: String
    let governorate: String
}

struct BulkUpdateResponse: Codable {
    let updated: Int
    let failed: Int
    let errors: [String]?
}

struct SellerAnalytics: Codable {
    let totalRevenue: Double
    let totalOrders: Int
    let averageOrderValue: Double
    let conversionRate: Double
    let revenueChange: Double
    let ordersChange: Double
    let topProducts: [TopProductAnalytics]
    let salesByDay: [SalesDayData]
    let revenueByCategory: [CategoryRevenue]
}

struct TopProductAnalytics: Codable, Identifiable {
    let id: String
    let name: String
    let unitsSold: Int
    let revenue: Double
}

struct SalesDayData: Codable {
    let date: String
    let sales: Double
    let orders: Int
}

struct CategoryRevenue: Codable {
    let category: String
    let revenue: Double
    let percentage: Double
}

struct SalesReport: Codable {
    let period: String
    let totalRevenue: Double
    let totalOrders: Int
    let dataPoints: [SalesReportDataPoint]
}

struct SalesReportDataPoint: Codable {
    let date: String
    let revenue: Double
    let orders: Int
    let customers: Int
}

struct TopProductsResponse: Codable {
    let products: [TopProductAnalytics]
}

struct SellerNotificationsResponse: Codable {
    let notifications: [SellerNotificationItem]
    let unreadCount: Int
}

struct SellerNotificationItem: Codable, Identifiable {
    let id: String
    let title: String
    let message: String
    let type: String
    let isRead: Bool
    let createdAt: Date
    let data: [String: String]?
}
