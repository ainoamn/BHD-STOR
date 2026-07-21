//
//  CartViewModel.swift
//  BHD Marketplace
//
//  Cart view model with Combine
//

import Foundation
import Combine

@MainActor
final class CartViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var cartItems: [CartItem] = []
    @Published var subtotal: Double = 0
    @Published var shippingCost: Double = 0
    @Published var discount: Double = 0
    @Published var tax: Double = 0
    @Published var total: Double = 0
    @Published var itemCount: Int = 0
    @Published var currency: String = "BHD"
    @Published var appliedPromo: PromoCodeResponse? = nil
    @Published var isLoading: Bool = false
    @Published var showError: Bool = false
    @Published var errorMessage: String = ""
    
    // MARK: - Computed Properties
    var formattedTotal: String {
        return String(format: "%.3f %@", total, currency)
    }
    
    var formattedSubtotal: String {
        return String(format: "%.3f %@", subtotal, currency)
    }
    
    // MARK: - Services
    private let cartService = CartService.shared
    
    // MARK: - Combine
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Init
    nonisolated init() {}
    
    // MARK: - Load Cart
    func loadCart() {
        isLoading = true
        showError = false
        
        cartService.getCart()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] cart in
                    self?.updateCartState(cart: cart)
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Update Quantity
    func updateQuantity(itemId: String, quantity: Int) {
        guard quantity >= 1 else { return }
        
        cartService.updateQuantity(itemId: itemId, quantity: quantity)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] cart in
                    self?.updateCartState(cart: cart)
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Remove Item
    func removeItem(itemId: String) {
        cartService.removeFromCart(itemId: itemId)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] cart in
                    self?.updateCartState(cart: cart)
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Clear Cart
    func clearCart() {
        cartService.clearCart()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] _ in
                    self?.cartItems = []
                    self?.subtotal = 0
                    self?.shippingCost = 0
                    self?.discount = 0
                    self?.tax = 0
                    self?.total = 0
                    self?.itemCount = 0
                    self?.appliedPromo = nil
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Apply Promo Code
    func applyPromoCode(code: String) {
        cartService.applyPromoCode(code: code)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] response in
                    self?.appliedPromo = response
                    // Reload cart to get updated totals
                    self?.loadCart()
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Remove Promo Code
    func removePromoCode() {
        cartService.removePromoCode()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] cart in
                    self?.appliedPromo = nil
                    self?.updateCartState(cart: cart)
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Update Cart State
    private func updateCartState(cart: Cart) {
        cartItems = cart.items
        subtotal = cart.subtotal
        shippingCost = cart.shippingEstimate
        discount = cart.discountAmount
        tax = cart.tax
        total = cart.total
        itemCount = cart.itemCount
        currency = cart.currency
    }
    
    // MARK: - Error Handling
    private func handleError(_ error: APIError) {
        errorMessage = error.localizedDescription
        showError = true
    }
}
