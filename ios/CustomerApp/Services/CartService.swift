//
//  CartService.swift
//  BHD Marketplace
//
//  Shopping cart service with Combine
//

import Foundation
import Combine

// MARK: - Cart Service Protocol
protocol CartServiceProtocol {
    func getCart() -> AnyPublisher<Cart, APIError>
    func addToCart(productId: String, quantity: Int) -> AnyPublisher<Cart, APIError>
    func updateQuantity(itemId: String, quantity: Int) -> AnyPublisher<Cart, APIError>
    func removeFromCart(itemId: String) -> AnyPublisher<Cart, APIError>
    func clearCart() -> AnyPublisher<Void, APIError>
    func applyPromoCode(code: String) -> AnyPublisher<PromoCodeResponse, APIError>
    func removePromoCode() -> AnyPublisher<Cart, APIError>
    func getShippingEstimates() -> AnyPublisher<[ShippingEstimate], APIError>
}

// MARK: - Cart Service
final class CartService: CartServiceProtocol {
    static let shared = CartService()
    
    private let api = APIService.shared
    private var cancellables = Set<AnyCancellable>()
    
    // Published state
    @Published private(set) var cart: Cart?
    @Published private(set) var itemCount: Int = 0
    @Published private(set) var isLoading: Bool = false
    @Published private(set) var error: APIError?
    @Published private(set) var promoCodeApplied: PromoCodeResponse?
    
    private init() {}
    
    // MARK: - Get Cart
    func getCart() -> AnyPublisher<Cart, APIError> {
        isLoading = true
        error = nil
        
        return api.request(endpoint: "/cart", requiresAuth: true)
            .handleEvents(
                receiveOutput: { [weak self] (cart: Cart) in
                    DispatchQueue.main.async {
                        self?.cart = cart
                        self?.itemCount = cart.itemCount
                    }
                },
                receiveCompletion: { [weak self] _ in
                    self?.isLoading = false
                }
            )
            .catch { [weak self] error -> AnyPublisher<Cart, APIError> in
                self?.error = error
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Add to Cart
    func addToCart(productId: String, quantity: Int = 1) -> AnyPublisher<Cart, APIError> {
        isLoading = true
        error = nil
        
        let request = AddToCartRequest(productId: productId, quantity: quantity)
        
        return api.request(
            endpoint: "/cart/items",
            method: .post,
            body: request,
            requiresAuth: true
        )
        .handleEvents(
            receiveOutput: { [weak self] (cart: Cart) in
                DispatchQueue.main.async {
                    self?.cart = cart
                    self?.itemCount = cart.itemCount
                    // Haptic feedback
                    HapticManager.shared.success()
                }
            },
            receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            }
        )
        .catch { [weak self] error -> AnyPublisher<Cart, APIError> in
            self?.error = error
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Update Quantity
    func updateQuantity(itemId: String, quantity: Int) -> AnyPublisher<Cart, APIError> {
        guard quantity >= 1 else { return removeFromCart(itemId: itemId) }
        
        isLoading = true
        error = nil
        
        let request = UpdateCartItemRequest(quantity: quantity)
        
        return api.request(
            endpoint: "/cart/items/\(itemId)",
            method: .put,
            body: request,
            requiresAuth: true
        )
        .handleEvents(
            receiveOutput: { [weak self] (cart: Cart) in
                DispatchQueue.main.async {
                    self?.cart = cart
                    self?.itemCount = cart.itemCount
                }
            },
            receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            }
        )
        .catch { [weak self] error -> AnyPublisher<Cart, APIError> in
            self?.error = error
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Remove from Cart
    func removeFromCart(itemId: String) -> AnyPublisher<Cart, APIError> {
        isLoading = true
        error = nil
        
        return api.request(
            endpoint: "/cart/items/\(itemId)",
            method: .delete,
            requiresAuth: true
        )
        .handleEvents(
            receiveOutput: { [weak self] (cart: Cart) in
                DispatchQueue.main.async {
                    self?.cart = cart
                    self?.itemCount = cart.itemCount
                }
            },
            receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            }
        )
        .catch { [weak self] error -> AnyPublisher<Cart, APIError> in
            self?.error = error
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Clear Cart
    func clearCart() -> AnyPublisher<Void, APIError> {
        isLoading = true
        error = nil
        
        return api.request(
            endpoint: "/cart",
            method: .delete,
            requiresAuth: true
        )
        .map { (_: EmptyResponse) -> Void in () }
        .handleEvents(
            receiveCompletion: { [weak self] completion in
                DispatchQueue.main.async {
                    self?.cart = nil
                    self?.itemCount = 0
                    self?.promoCodeApplied = nil
                    self?.isLoading = false
                }
            }
        )
        .catch { [weak self] error -> AnyPublisher<Void, APIError> in
            self?.error = error
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Apply Promo Code
    func applyPromoCode(code: String) -> AnyPublisher<PromoCodeResponse, APIError> {
        let body = ["code": code]
        
        return api.request(
            endpoint: "/cart/promo",
            method: .post,
            body: body,
            requiresAuth: true
        )
        .handleEvents(receiveOutput: { [weak self] response in
            DispatchQueue.main.async {
                self?.promoCodeApplied = response
            }
        })
        .eraseToAnyPublisher()
    }
    
    // MARK: - Remove Promo Code
    func removePromoCode() -> AnyPublisher<Cart, APIError> {
        return api.request(
            endpoint: "/cart/promo",
            method: .delete,
            requiresAuth: true
        )
        .handleEvents(receiveOutput: { [weak self] cart in
            DispatchQueue.main.async {
                self?.promoCodeApplied = nil
                self?.cart = cart
            }
        })
        .eraseToAnyPublisher()
    }
    
    // MARK: - Get Shipping Estimates
    func getShippingEstimates() -> AnyPublisher<[ShippingEstimate], APIError> {
        return api.request(endpoint: "/cart/shipping", requiresAuth: true)
            .eraseToAnyPublisher()
    }
}

// MARK: - Haptic Manager
final class HapticManager {
    static let shared = HapticManager()
    
    private init() {}
    
    func success() {
        #if canImport(UIKit)
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
        #endif
    }
    
    func error() {
        #if canImport(UIKit)
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.error)
        #endif
    }
    
    func warning() {
        #if canImport(UIKit)
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.warning)
        #endif
    }
    
    func light() {
        #if canImport(UIKit)
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
        #endif
    }
    
    func medium() {
        #if canImport(UIKit)
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
        #endif
    }
}
