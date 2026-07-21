//
//  HomeView.swift
//  BHD Marketplace
//
//  Home screen with banners, categories, featured products, and sections
//

import SwiftUI
import Combine

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @State private var selectedProduct: Product? = nil
    @State private var showProductDetail = false
    @State private var selectedCategory: Category? = nil
    @State private var showCategoryProducts = false
    @State private var searchText = ""
    @State private var showSearch = false
    
    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                ScrollView(.vertical, showsIndicators: false) {
                    LazyVStack(spacing: 0, pinnedViews: []) {
                        // Banners
                        if !viewModel.banners.isEmpty {
                            BannerCarousel(banners: viewModel.banners) { banner in
                                handleBannerTap(banner)
                            }
                            .padding(.top, 8)
                        }
                        
                        // Categories
                        if !viewModel.categories.isEmpty {
                            CategoryRow(
                                categories: viewModel.categories,
                                onSelect: { category in
                                    selectedCategory = category
                                    showCategoryProducts = true
                                }
                            )
                            .padding(.vertical, 16)
                        }
                        
                        // Featured Products
                        if !viewModel.featuredProducts.isEmpty {
                            productSection(
                                title: L("home.featured"),
                                products: viewModel.featuredProducts
                            )
                        }
                        
                        // Trending Products
                        if !viewModel.trendingProducts.isEmpty {
                            productSection(
                                title: L("home.trending"),
                                products: viewModel.trendingProducts
                            )
                        }
                        
                        // New Arrivals
                        if !viewModel.newArrivals.isEmpty {
                            productSection(
                                title: L("home.newArrivals"),
                                products: viewModel.newArrivals
                            )
                        }
                    }
                    .padding(.bottom, 20)
                }
                .refreshable {
                    await viewModel.refresh()
                }
                
                // Loading overlay
                if viewModel.isLoading && viewModel.banners.isEmpty {
                    LoadingOverlay()
                }
            }
            .navigationTitle(L("app.name"))
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin.and.ellipse")
                            .font(.caption)
                            .foregroundColor(.bhdPrimary)
                        Text("Bahrain")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 12) {
                        // Search
                        Button(action: { showSearch = true }) {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.primary)
                        }
                        
                        // Notifications
                        Button(action: {}) {
                            ZStack(alignment: .topTrailing) {
                                Image(systemName: "bell")
                                    .foregroundColor(.primary)
                                Circle()
                                    .fill(Color.red)
                                    .frame(width: 8, height: 8)
                                    .offset(x: 2, y: -2)
                            }
                        }
                    }
                }
            }
            .sheet(isPresented: $showSearch) {
                SearchView()
            }
            .navigationDestination(isPresented: $showProductDetail) {
                if let product = selectedProduct {
                    ProductDetailView(product: product)
                }
            }
            .navigationDestination(isPresented: $showCategoryProducts) {
                if let category = selectedCategory {
                    CategoryProductsView(category: category)
                }
            }
            .onAppear {
                viewModel.loadHomeData()
            }
            .alert(L("error.title"), isPresented: $viewModel.showError) {
                Button(L("common.ok"), role: .cancel) {}
                Button(L("common.retry")) {
                    viewModel.loadHomeData()
                }
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }
    
    // MARK: - Product Section
    @ViewBuilder
    private func productSection(title: String, products: [Product]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            // Section Header
            HStack {
                Text(title)
                    .font(.title3)
                    .fontWeight(.bold)
                
                Spacer()
                
                Button(action: {}) {
                    Text(L("common.seeAll"))
                        .font(.subheadline)
                        .foregroundColor(.bhdPrimary)
                }
            }
            .padding(.horizontal, 16)
            
            // Product Grid
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(products.prefix(4)) { product in
                    ProductCard(
                        product: product,
                        onTap: {
                            selectedProduct = product
                            showProductDetail = true
                        },
                        onAddToCart: {
                            viewModel.addToCart(productId: product.id)
                        },
                        onToggleWishlist: {
                            viewModel.toggleWishlist(productId: product.id)
                        },
                        isInWishlist: viewModel.wishlist.contains(product.id)
                    )
                }
            }
            .padding(.horizontal, 12)
        }
        .padding(.vertical, 12)
    }
    
    // MARK: - Handle Banner Tap
    private func handleBannerTap(_ banner: Banner) {
        switch banner.linkType {
        case .product:
            if let link = banner.link {
                // Load product and show detail
                ProductService.shared.getProduct(id: link)
                    .receive(on: DispatchQueue.main)
                    .sink(receiveCompletion: { _ in }, receiveValue: { product in
                        selectedProduct = product
                        showProductDetail = true
                    })
                    .store(in: &viewModel.cancellables)
            }
        case .category:
            if let link = banner.link {
                // Navigate to category
            }
        case .url:
            if let link = banner.link, let url = URL(string: link) {
                UIApplication.shared.open(url)
            }
        case .none:
            break
        }
    }
}

// MARK: - Category Products View
struct CategoryProductsView: View {
    let category: Category
    @State private var products: [Product] = []
    @State private var isLoading = true
    @State private var selectedProduct: Product? = nil
    @State private var showProductDetail = false
    
    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]
    
    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity, minHeight: 300)
            } else if products.isEmpty {
                EmptyStateView(
                    icon: "cube.box",
                    title: L("category.noProducts"),
                    message: L("category.noProductsMessage")
                )
            } else {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(products) { product in
                        ProductCard(
                            product: product,
                            onTap: {
                                selectedProduct = product
                                showProductDetail = true
                            },
                            onAddToCart: {},
                            onToggleWishlist: nil,
                            isInWishlist: false
                        )
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 12)
            }
        }
        .navigationTitle(category.localizedName)
        .navigationDestination(isPresented: $showProductDetail) {
            if let product = selectedProduct {
                ProductDetailView(product: product)
            }
        }
        .onAppear {
            loadProducts()
        }
    }
    
    private func loadProducts() {
        var filter = ProductFilter()
        filter.category = category.id
        
        ProductService.shared.getProducts(filter: filter, page: 1, limit: 50)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in isLoading = false },
                receiveValue: { response in
                    products = response.products
                }
            )
            .store(in: &SubscriptionStore.shared.cancellables)
    }
}

// MARK: - Loading Overlay
struct LoadingOverlay: View {
    var body: some View {
        VStack {
            Spacer()
            VStack(spacing: 16) {
                ProgressView()
                    .scaleEffect(1.5)
                Text(L("common.loading"))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground).opacity(0.9))
    }
}

// MARK: - Empty State View
struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil
    
    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(.gray.opacity(0.4))
            
            Text(title)
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            
            if let actionTitle = actionTitle, let action = action {
                BHDButton(title: actionTitle, action: action)
                    .padding(.top, 8)
                    .padding(.horizontal, 60)
            }
            
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Subscription Store (helper for standalone views)
final class SubscriptionStore {
    static let shared = SubscriptionStore()
    var cancellables = Set<AnyCancellable>()
    private init() {}
}

// MARK: - Preview
#Preview {
    HomeView()
}
