//
//  OrderService.swift
//  BHD Marketplace
//
//  Order management service with Combine
//

import Foundation
import Combine

// MARK: - Order Service Protocol
protocol OrderServiceProtocol {
    func createOrder(data: CreateOrderRequest) -> AnyPublisher<Order, APIError>
    func getOrders(status: OrderStatus?, page: Int, limit: Int) -> AnyPublisher<OrdersResponse, APIError>
    func getOrder(id: String) -> AnyPublisher<Order, APIError>
    func cancelOrder(id: String, reason: String?) -> AnyPublisher<Order, APIError>
    func trackOrder(id: String) -> AnyPublisher<OrderTracking, APIError>
    func getOrderTimeline(id: String) -> AnyPublisher<[OrderTimelineEvent], APIError>
    func reorder(orderId: String) -> AnyPublisher<Cart, APIError>
    func submitReview(orderId: String, itemId: String, rating: Int, comment: String) -> AnyPublisher<Void, APIError>
}

// MARK: - Order Service
final class OrderService: OrderServiceProtocol {
    static let shared = OrderService()
    
    private let api = APIService.shared
    private var cancellables = Set<AnyCancellable>()
    
    // Published state
    @Published private(set) var orders: [Order] = []
    @Published private(set) var isLoading: Bool = false
    @Published private(set) var error: APIError?
    
    private init() {}
    
    // MARK: - Create Order
    func createOrder(data: CreateOrderRequest) -> AnyPublisher<Order, APIError> {
        isLoading = true
        error = nil
        
        return api.request(
            endpoint: "/orders",
            method: .post,
            body: data,
            requiresAuth: true
        )
        .handleEvents(
            receiveOutput: { [weak self] (order: Order) in
                DispatchQueue.main.async {
                    self?.orders.insert(order, at: 0)
                    HapticManager.shared.success()
                }
            },
            receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            }
        )
        .catch { [weak self] error -> AnyPublisher<Order, APIError> in
            self?.error = error
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Get Orders
    func getOrders(status: OrderStatus? = nil, page: Int = 1, limit: Int = 20) -> AnyPublisher<OrdersResponse, APIError> {
        isLoading = true
        error = nil
        
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(limit))
        ]
        
        if let status = status {
            queryItems.append(URLQueryItem(name: "status", value: status.rawValue))
        }
        
        return api.request(endpoint: "/orders", queryItems: queryItems, requiresAuth: true)
            .handleEvents(
                receiveOutput: { [weak self] (response: OrdersResponse) in
                    DispatchQueue.main.async {
                        if page == 1 {
                            self?.orders = response.orders
                        } else {
                            self?.orders.append(contentsOf: response.orders)
                        }
                    }
                },
                receiveCompletion: { [weak self] _ in
                    self?.isLoading = false
                }
            )
            .catch { [weak self] error -> AnyPublisher<OrdersResponse, APIError> in
                self?.error = error
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get Single Order
    func getOrder(id: String) -> AnyPublisher<Order, APIError> {
        isLoading = true
        error = nil
        
        return api.request(endpoint: "/orders/\(id)", requiresAuth: true)
            .handleEvents(receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            })
            .catch { [weak self] error -> AnyPublisher<Order, APIError> in
                self?.error = error
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Cancel Order
    func cancelOrder(id: String, reason: String? = nil) -> AnyPublisher<Order, APIError> {
        isLoading = true
        error = nil
        
        let body: [String: String?] = ["reason": reason]
        
        return api.request(
            endpoint: "/orders/\(id)/cancel",
            method: .patch,
            body: body,
            requiresAuth: true
        )
        .handleEvents(
            receiveOutput: { [weak self] (order: Order) in
                DispatchQueue.main.async {
                    if let index = self?.orders.firstIndex(where: { $0.id == id }) {
                        self?.orders[index] = order
                    }
                    HapticManager.shared.success()
                }
            },
            receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            }
        )
        .catch { [weak self] error -> AnyPublisher<Order, APIError> in
            self?.error = error
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Track Order
    func trackOrder(id: String) -> AnyPublisher<OrderTracking, APIError> {
        return api.request(endpoint: "/orders/\(id)/track", requiresAuth: true)
            .catch { [weak self] error -> AnyPublisher<OrderTracking, APIError> in
                self?.error = error
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get Order Timeline
    func getOrderTimeline(id: String) -> AnyPublisher<[OrderTimelineEvent], APIError> {
        return api.request(endpoint: "/orders/\(id)/timeline", requiresAuth: true)
            .eraseToAnyPublisher()
    }
    
    // MARK: - Reorder
    func reorder(orderId: String) -> AnyPublisher<Cart, APIError> {
        isLoading = true
        
        return api.request(
            endpoint: "/orders/\(orderId)/reorder",
            method: .post,
            requiresAuth: true
        )
        .handleEvents(receiveCompletion: { [weak self] _ in
            self?.isLoading = false
        })
        .catch { [weak self] error -> AnyPublisher<Cart, APIError> in
            self?.error = error
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Submit Review
    func submitReview(orderId: String, itemId: String, rating: Int, comment: String) -> AnyPublisher<Void, APIError> {
        let body = [
            "rating": rating,
            "comment": comment
        ] as [String : Any]
        
        return api.request(
            endpoint: "/orders/\(orderId)/items/\(itemId)/review",
            method: .post,
            body: body,
            requiresAuth: true
        )
        .map { (_: EmptyResponse) -> Void in () }
        .eraseToAnyPublisher()
    }
}

// MARK: - Order Tracking
struct OrderTracking: Codable {
    let orderId: String
    let trackingNumber: String?
    let carrier: String?
    let currentStatus: OrderStatus
    let estimatedDelivery: Date?
    let currentLocation: String?
    let progress: Double
    let events: [TrackingEvent]
    let mapUrl: String?
}

struct TrackingEvent: Codable, Identifiable {
    let id: String
    let status: String
    let description: String
    let descriptionAr: String?
    let location: String?
    let timestamp: Date
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case status, description, descriptionAr, location, timestamp
    }
}

// MARK: - Order Preview Data
extension Order {
    static let sample = Order(
        id: "ord_1",
        orderNumber: "BHD-2024-00123",
        user: "user_1",
        items: [
            OrderItem(
                id: "oi_1",
                product: OrderProduct(
                    id: "prod_1",
                    name: "iPhone 15 Pro Max",
                    nameAr: "آيفون 15 برو ماكس",
                    thumbnail: nil,
                    sku: "IPH15PM-256"
                ),
                quantity: 1,
                price: 449.000,
                total: 449.000
            ),
            OrderItem(
                id: "oi_2",
                product: OrderProduct(
                    id: "prod_3",
                    name: "Nespresso Vertuo Plus",
                    nameAr: "نسبريسو فيرتوو بلس",
                    thumbnail: nil,
                    sku: "NEV-PLUS"
                ),
                quantity: 1,
                price: 89.000,
                total: 89.000
            )
        ],
        shippingAddress: ShippingAddress(
            id: "addr_1",
            fullName: "Ahmed Al-Rashid",
            phone: "+973 3600 1234",
            addressLine1: "Building 123, Road 456",
            addressLine2: "Block 789",
            city: "Manama",
            governorate: "Capital Governorate",
            country: "Bahrain",
            postalCode: "1234",
            isDefault: true,
            label: "Home",
            location: GeoLocation(latitude: 26.2285, longitude: 50.5860)
        ),
        billingAddress: nil,
        status: .shipped,
        paymentStatus: .paid,
        paymentMethod: PaymentMethod(type: .creditCard, lastFour: "4242", cardBrand: "Visa"),
        subtotal: 538.000,
        shippingCost: 2.000,
        discount: 0,
        tax: 0,
        total: 540.000,
        currency: "BHD",
        notes: nil,
        trackingNumber: "BHDTRK789456123",
        trackingUrl: "https://tracking.bhd.marketplace/BHDTRK789456123",
        estimatedDelivery: Date().addingTimeInterval(86400 * 2),
        timeline: [
            OrderTimelineEvent(
                id: "te_1",
                status: .pending,
                description: "Order placed",
                descriptionAr: "تم تقديم الطلب",
                location: nil,
                timestamp: Date().addingTimeInterval(-86400 * 3),
                isCompleted: true
            ),
            OrderTimelineEvent(
                id: "te_2",
                status: .confirmed,
                description: "Order confirmed",
                descriptionAr: "تم تأكيد الطلب",
                location: nil,
                timestamp: Date().addingTimeInterval(-86400 * 2),
                isCompleted: true
            ),
            OrderTimelineEvent(
                id: "te_3",
                status: .processing,
                description: "Order being processed",
                descriptionAr: "جاري معالجة الطلب",
                location: "Manama Warehouse",
                timestamp: Date().addingTimeInterval(-86400),
                isCompleted: true
            ),
            OrderTimelineEvent(
                id: "te_4",
                status: .shipped,
                description: "Order shipped via Aramex",
                descriptionAr: "تم شحن الطلب عبر ارامكس",
                location: "Manama",
                timestamp: Date(),
                isCompleted: true
            )
        ],
        createdAt: Date().addingTimeInterval(-86400 * 3),
        updatedAt: Date()
    )
}
