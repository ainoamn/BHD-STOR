//
//  SearchView.swift
//  BHD Marketplace
//
//  Search with suggestions, filters, and results
//

import SwiftUI
import Combine

struct SearchView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var products: [Product] = []
    @State private var isSearching = false
    @State private var hasSearched = false
    @State private var selectedProduct: Product? = nil
    @State private var showProductDetail = false
    @State private var showFilters = false
    @State private var recentSearches: [String] = UserDefaults.standard.stringArray(forKey: "recentSearches") ?? []
    
    // Filters
    @State private var selectedSort: ProductFilter.SortOption = .popular
    @State private var minPrice: Double = 0
    @State private var maxPrice: Double = 5000
    @State private var selectedCategory: String? = nil
    
    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]
    
    private var searchDebounce: AnyCancellable?
    @State private var searchCancellable: AnyCancellable?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search Bar
                HStack(spacing: 12) {
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.secondary)
                        
                        TextField(L("search.placeholder"), text: $searchText)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .onSubmit {
                                performSearch()
                            }
                            .onChange(of: searchText) { _, newValue in
                                if newValue.isEmpty {
                                    products = []
                                    hasSearched = false
                                } else if newValue.count >= 2 {
                                    debounceSearch(query: newValue)
                                }
                            }
                        
                        if !searchText.isEmpty {
                            Button(action: {
                                searchText = ""
                                products = []
                                hasSearched = false
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    
                    // Filter Button
                    Button(action: { showFilters = true }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                            .font(.title2)
                            .foregroundColor(selectedCategory != nil ? .bhdPrimary : .primary)
                    }
                    
                    // Cancel
                    Button(action: { dismiss() }) {
                        Text(L("common.cancel"))
                            .foregroundColor(.bhdPrimary)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                
                // Content
                if isSearching {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if !products.isEmpty {
                    // Results Grid
                    ScrollView {
                        // Result count
                        HStack {
                            Text("\(products.count) \(L("search.results"))")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            Spacer()
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(products) { product in
                                ProductCard(
                                    product: product,
                                    onTap: {
                                        selectedProduct = product
                                        showProductDetail = true
                                    },
                                    onAddToCart: {
                                        CartService.shared.addToCart(productId: product.id, quantity: 1)
                                            .sink(receiveCompletion: { _ in }, receiveValue: { _ in })
                                            .store(in: &SubscriptionStore.shared.cancellables)
                                    },
                                    onToggleWishlist: nil,
                                    isInWishlist: false
                                )
                            }
                        }
                        .padding(.horizontal, 12)
                    }
                } else if hasSearched && searchText.count >= 2 {
                    // No results
                    EmptyStateView(
                        icon: "magnifyingglass",
                        title: L("search.noResults"),
                        message: String(format: L("search.noResultsMessage"), searchText)
                    )
                } else {
                    // Recent Searches & Suggestions
                    ScrollView {
                        if !recentSearches.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Text(L("search.recent"))
                                        .font(.headline)
                                        .fontWeight(.semibold)
                                    
                                    Spacer()
                                    
                                    Button(action: {
                                        recentSearches = []
                                        UserDefaults.standard.removeObject(forKey: "recentSearches")
                                    }) {
                                        Text(L("common.clear"))
                                            .font(.subheadline)
                                            .foregroundColor(.bhdPrimary)
                                    }
                                }
                                .padding(.horizontal, 16)
                                
                                ForEach(recentSearches.prefix(8), id: \.self) { search in
                                    Button(action: {
                                        searchText = search
                                        performSearch()
                                    }) {
                                        HStack(spacing: 12) {
                                            Image(systemName: "clock.arrow.circlepath")
                                                .foregroundColor(.secondary)
                                            
                                            Text(search)
                                                .foregroundColor(.primary)
                                            
                                            Spacer()
                                            
                                            Image(systemName: "chevron.right")
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 10)
                                    }
                                    
                                    Divider()
                                        .padding(.leading, 48)
                                }
                            }
                            .padding(.vertical, 8)
                        }
                        
                        // Popular Searches
                        VStack(alignment: .leading, spacing: 12) {
                            Text(L("search.popular"))
                                .font(.headline)
                                .fontWeight(.semibold)
                                .padding(.horizontal, 16)
                            
                            FlowLayout(spacing: 8) {
                                ForEach(popularSearches, id: \.self) { term in
                                    Button(action: {
                                        searchText = term
                                        performSearch()
                                    }) {
                                        Text(term)
                                            .font(.subheadline)
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 8)
                                            .background(Color(.systemGray6))
                                            .foregroundColor(.primary)
                                            .clipShape(Capsule())
                                    }
                                }
                            }
                            .padding(.horizontal, 16)
                        }
                        .padding(.vertical, 8)
                    }
                }
            }
            .navigationTitle(L("search.title"))
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(isPresented: $showProductDetail) {
                if let product = selectedProduct {
                    ProductDetailView(product: product)
                }
            }
            .sheet(isPresented: $showFilters) {
                FilterSheet(
                    selectedSort: $selectedSort,
                    minPrice: $minPrice,
                    maxPrice: $maxPrice,
                    selectedCategory: $selectedCategory,
                    onApply: {
                        if !searchText.isEmpty {
                            performSearch()
                        }
                    }
                )
            }
        }
    }
    
    // MARK: - Popular Searches
    private var popularSearches: [String] {
        ["iPhone", "Samsung", "Coffee Machine", "Headphones", "Running Shoes", "Watch", "Laptop", "Perfume"]
    }
    
    // MARK: - Debounce Search
    private func debounceSearch(query: String) {
        searchCancellable?.cancel()
        searchCancellable = Just(query)
            .delay(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .sink { _ in
                performSearch()
            }
    }
    
    // MARK: - Perform Search
    private func performSearch() {
        guard searchText.count >= 2 else { return }
        
        isSearching = true
        hasSearched = true
        
        // Save to recent searches
        if !recentSearches.contains(searchText) {
            recentSearches.insert(searchText, at: 0)
            UserDefaults.standard.set(Array(recentSearches.prefix(10)), forKey: "recentSearches")
        }
        
        var filter = ProductFilter()
        filter.sortBy = selectedSort
        filter.minPrice = minPrice > 0 ? minPrice : nil
        filter.maxPrice = maxPrice < 5000 ? maxPrice : nil
        filter.category = selectedCategory
        
        ProductService.shared.searchProducts(query: searchText, filter: filter)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in
                    isSearching = false
                },
                receiveValue: { response in
                    products = response.products
                }
            )
            .store(in: &SubscriptionStore.shared.cancellables)
    }
}

// MARK: - Filter Sheet
struct FilterSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var selectedSort: ProductFilter.SortOption
    @Binding var minPrice: Double
    @Binding var maxPrice: Double
    @Binding var selectedCategory: String?
    let onApply: () -> Void
    
    @State private var categories: [Category] = []
    
    var body: some View {
        NavigationStack {
            Form {
                // Sort
                Section(header: Text(L("filter.sortBy"))) {
                    Picker(L("filter.sortBy"), selection: $selectedSort) {
                        ForEach(ProductFilter.SortOption.allCases, id: \.self) { option in
                            Text(option.localizedName).tag(option)
                        }
                    }
                    .pickerStyle(.inline)
                }
                
                // Price Range
                Section(header: Text(L("filter.priceRange"))) {
                    HStack {
                        Text("BHD \(Int(minPrice))")
                        Spacer()
                        Text("BHD \(Int(maxPrice))")
                    }
                    
                    HStack(spacing: 0) {
                        Text(L("filter.from"))
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Slider(value: $minPrice, in: 0...maxPrice, step: 5)
                    }
                    
                    HStack(spacing: 0) {
                        Text(L("filter.to"))
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Slider(value: $maxPrice, in: minPrice...5000, step: 5)
                    }
                }
                
                // Category
                if !categories.isEmpty {
                    Section(header: Text(L("filter.category"))) {
                        Picker(L("filter.category"), selection: $selectedCategory) {
                            Text(L("filter.allCategories")).tag(nil as String?)
                            ForEach(categories) { category in
                                Text(category.localizedName).tag(category.id as String?)
                            }
                        }
                        .pickerStyle(.inline)
                    }
                }
                
                // Reset
                Section {
                    Button(L("filter.reset")) {
                        selectedSort = .popular
                        minPrice = 0
                        maxPrice = 5000
                        selectedCategory = nil
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle(L("filter.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(L("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(L("filter.apply")) {
                        onApply()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
            .onAppear {
                ProductService.shared.getCategories()
                    .receive(on: DispatchQueue.main)
                    .sink(receiveCompletion: { _ in }, receiveValue: { cats in
                        categories = cats
                    })
                    .store(in: &SubscriptionStore.shared.cancellables)
            }
        }
    }
}

// MARK: - Flow Layout
struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.width ?? 0, subviews: subviews, spacing: spacing)
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x,
                                      y: bounds.minY + result.positions[index].y),
                         proposal: .unspecified)
        }
    }
    
    struct FlowResult {
        var size: CGSize = .zero
        var positions: [CGPoint] = []
        
        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var x: CGFloat = 0
            var y: CGFloat = 0
            var rowHeight: CGFloat = 0
            
            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)
                if x + size.width > maxWidth && x > 0 {
                    x = 0
                    y += rowHeight + spacing
                    rowHeight = 0
                }
                positions.append(CGPoint(x: x, y: y))
                rowHeight = max(rowHeight, size.height)
                x += size.width + spacing
            }
            
            self.size = CGSize(width: maxWidth, height: y + rowHeight)
        }
    }
}

// MARK: - Preview
#Preview {
    SearchView()
}
