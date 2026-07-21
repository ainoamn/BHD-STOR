//
//  HomeViewModel.swift
//  BHD Marketplace
//
//  Home screen view model with Combine
//

import Foundation
import Combine

@MainActor
final class HomeViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var banners: [Banner] = []
    @Published var categories: [Category] = []
    @Published var featuredProducts: [Product] = []
    @Published var trendingProducts: [Product] = []
    @Published var newArrivals: [Product] = []
    @Published var homeSections: [HomeSection] = []
    @Published var wishlist: Set<String> = []
    @Published var isLoading: Bool = false
    @Published var showError: Bool = false
    @Published var errorMessage: String = ""
    
    // MARK: - Services
    private let productService = ProductService.shared
    private let cartService = CartService.shared
    private let authService = AuthService.shared
    
    // MARK: - Combine
    var cancellables = Set<AnyCancellable>()
    
    // MARK: - Init
    nonisolated init() {}
    
    // MARK: - Load Home Data
    func loadHomeData() {
        guard banners.isEmpty else { return }
        isLoading = true
        showError = false
        
        let group = DispatchGroup()
        
        // Load banners
        group.enter()
        productService.getBanners()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                    group.leave()
                },
                receiveValue: { [weak self] banners in
                    self?.banners = banners
                }
            )
            .store(in: &cancellables)
        
        // Load categories
        group.enter()
        productService.getCategories()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                    group.leave()
                },
                receiveValue: { [weak self] categories in
                    self?.categories = categories
                }
            )
            .store(in: &cancellables)
        
        // Load featured products
        group.enter()
        productService.getFeatured()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                    group.leave()
                },
                receiveValue: { [weak self] products in
                    self?.featuredProducts = products
                }
            )
            .store(in: &cancellables)
        
        // Load trending products
        group.enter()
        productService.getTrending()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                    group.leave()
                },
                receiveValue: { [weak self] products in
                    self?.trendingProducts = products
                }
            )
            .store(in: &cancellables)
        
        // Load new arrivals
        group.enter()
        productService.getNewArrivals()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                    group.leave()
                },
                receiveValue: { [weak self] products in
                    self?.newArrivals = products
                }
            )
            .store(in: &cancellables)
        
        group.notify(queue: .main) { [weak self] in
            self?.isLoading = false
        }
    }
    
    // MARK: - Refresh
    func refresh() async {
        isLoading = true
        showError = false
        
        await withTaskGroup(of: Void.self) { group in
            group.addTask { @MainActor [weak self] in
                self?.productService.getBanners()
                    .receive(on: DispatchQueue.main)
                    .sink(receiveCompletion: { _ in }, receiveValue: { [weak self] in self?.banners = $0 })
                    .store(in: &self!.cancellables)
            }
            
            group.addTask { @MainActor [weak self] in
                self?.productService.getCategories()
                    .receive(on: DispatchQueue.main)
                    .sink(receiveCompletion: { _ in }, receiveValue: { [weak self] in self?.categories = $0 })
                    .store(in: &self!.cancellables)
            }
            
            group.addTask { @MainActor [weak self] in
                self?.productService.getFeatured()
                    .receive(on: DispatchQueue.main)
                    .sink(receiveCompletion: { _ in }, receiveValue: { [weak self] in self?.featuredProducts = $0 })
                    .store(in: &self!.cancellables)
            }
            
            group.addTask { @MainActor [weak self] in
                self?.productService.getTrending()
                    .receive(on: DispatchQueue.main)
                    .sink(receiveCompletion: { _ in }, receiveValue: { [weak self] in self?.trendingProducts = $0 })
                    .store(in: &self!.cancellables)
            }
            
            group.addTask { @MainActor [weak self] in
                self?.productService.getNewArrivals()
                    .receive(on: DispatchQueue.main)
                    .sink(receiveCompletion: { _ in }, receiveValue: { [weak self] in self?.newArrivals = $0 })
                    .store(in: &self!.cancellables)
            }
        }
        
        isLoading = false
    }
    
    // MARK: - Add to Cart
    func addToCart(productId: String) {
        cartService.addToCart(productId: productId, quantity: 1)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Toggle Wishlist
    func toggleWishlist(productId: String) {
        productService.toggleWishlist(productId: productId)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { [weak self] isAdded in
                    if isAdded {
                        self?.wishlist.insert(productId)
                    } else {
                        self?.wishlist.remove(productId)
                    }
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Error Handling
    private func handleError(_ error: APIError) {
        errorMessage = error.localizedDescription
        showError = true
    }
}
