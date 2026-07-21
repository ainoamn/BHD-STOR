//
//  ProductsView.swift
//  BHD Seller Dashboard
//
//  Manage products (CRUD) with list and grid views
//

import SwiftUI

struct SellerProductsView: View {
    @State private var products: [SellerProduct] = SellerProduct.samples
    @State private var searchText = ""
    @State private var selectedFilter: ProductFilter = .all
    @State private var showAddProduct = false
    @State private var selectedProduct: SellerProduct? = nil
    @State private var showEditProduct = false
    @State private var showDeleteConfirmation = false
    @State private var isGridView = false
    
    enum ProductFilter: String, CaseIterable {
        case all = "All"
        case active = "Active"
        case inactive = "Inactive"
        case lowStock = "Low Stock"
        
        var color: Color {
            switch self {
            case .all: return .primary
            case .active: return .green
            case .inactive: return .gray
            case .lowStock: return .red
            }
        }
    }
    
    var filteredProducts: [SellerProduct] {
        products.filter { product in
            let matchesSearch = searchText.isEmpty ||
                product.name.localizedCaseInsensitiveContains(searchText) ||
                product.sku.localizedCaseInsensitiveContains(searchText)
            
            let matchesFilter: Bool = {
                switch selectedFilter {
                case .all: return true
                case .active: return product.isActive
                case .inactive: return !product.isActive
                case .lowStock: return product.stock <= 5
                }
            }()
            
            return matchesSearch && matchesFilter
        }
    }
    
    let gridColumns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search & Filter Bar
                searchAndFilterBar
                
                // Product Count
                HStack {
                    Text("\(filteredProducts.count) products")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                
                // Products List/Grid
                if isGridView {
                    gridView
                } else {
                    listView
                }
            }
            .navigationTitle("Products")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 12) {
                        Button(action: { isGridView.toggle() }) {
                            Image(systemName: isGridView ? "list.bullet" : "square.grid.2x2")
                                .foregroundColor(.primary)
                        }
                        
                        Button(action: { showAddProduct = true }) {
                            Image(systemName: "plus.circle.fill")
                                .font(.title3)
                                .foregroundColor(.bhdSellerPrimary)
                        }
                    }
                }
            }
            .sheet(isPresented: $showAddProduct) {
                AddProductView()
            }
            .sheet(isPresented: $showEditProduct) {
                if let product = selectedProduct {
                    AddProductView(product: product, isEditing: true)
                }
            }
            .alert("Delete Product?", isPresented: $showDeleteConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    if let product = selectedProduct {
                        deleteProduct(product)
                    }
                }
            } message: {
                Text("This action cannot be undone.")
            }
        }
    }
    
    // MARK: - Search & Filter Bar
    private var searchAndFilterBar: some View {
        VStack(spacing: 8) {
            // Search
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                TextField("Search products...", text: $searchText)
                    .textInputAutocapitalization(.never
                if !searchText.isEmpty {
                    Button(action: { searchText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(10)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 16)
            
            // Filter Pills
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(ProductFilter.allCases, id: \.self) { filter in
                        Button(action: { selectedFilter = filter }) {
                            Text(filter.rawValue)
                                .font(.caption)
                                .fontWeight(selectedFilter == filter ? .semibold : .regular)
                                .foregroundColor(selectedFilter == filter ? .white : filter.color)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(
                                    Capsule()
                                        .fill(selectedFilter == filter ? filter.color : filter.color.opacity(0.1))
                                )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.horizontal, 16)
            }
        }
        .padding(.vertical, 8)
    }
    
    // MARK: - List View
    private var listView: some View {
        List {
            ForEach(filteredProducts) { product in
                SellerProductListRow(product: product)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedProduct = product
                        showEditProduct = true
                    }
                    .swipeActions(edge: .trailing) {
                        Button(role: .destructive) {
                            selectedProduct = product
                            showDeleteConfirmation = true
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                        
                        Button {
                            selectedProduct = product
                            showEditProduct = true
                        } label: {
                            Label("Edit", systemImage: "pencil")
                        }
                        .tint(.bhdSellerPrimary)
                    }
                    .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
            }
        }
        .listStyle(.plain)
    }
    
    // MARK: - Grid View
    private var gridView: some View {
        ScrollView {
            LazyVGrid(columns: gridColumns, spacing: 12) {
                ForEach(filteredProducts) { product in
                    SellerProductGridCard(product: product)
                        .onTapGesture {
                            selectedProduct = product
                            showEditProduct = true
                        }
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
        }
    }
    
    private func deleteProduct(_ product: SellerProduct) {
        products.removeAll { $0.id == product.id }
    }
}

// MARK: - Seller Product List Row
struct SellerProductListRow: View {
    let product: SellerProduct
    
    var body: some View {
        HStack(spacing: 12) {
            // Product Image
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.gray.opacity(0.15))
                .frame(width: 60, height: 60)
                .overlay(
                    Image(systemName: "cube.box")
                        .font(.title3)
                        .foregroundColor(.gray.opacity(0.5))
                )
            
            // Product Info
            VStack(alignment: .leading, spacing: 4) {
                Text(product.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(1)
                
                Text("SKU: \(product.sku)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                HStack(spacing: 8) {
                    Text(String(format: "%.3f BHD", product.price))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    // Stock Badge
                    Text("\(product.stock) in stock")
                        .font(.caption2)
                        .foregroundColor(stockColor)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(stockColor.opacity(0.1))
                        .clipShape(Capsule())
                }
            }
            
            Spacer()
            
            // Status
            Circle()
                .fill(product.isActive ? Color.green : Color.gray)
                .frame(width: 10, height: 10)
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.03), radius: 4, x: 0, y: 1)
    }
    
    private var stockColor: Color {
        if product.stock <= 5 { return .red }
        if product.stock <= 15 { return .orange }
        return .green
    }
}

// MARK: - Seller Product Grid Card
struct SellerProductGridCard: View {
    let product: SellerProduct
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Image
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.15))
                .frame(height: 120)
                .overlay(
                    Image(systemName: "cube.box")
                        .font(.system(size: 40))
                        .foregroundColor(.gray.opacity(0.4))
                )
            
            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(product.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(2)
                
                Text(String(format: "%.3f BHD", product.price))
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.bhdSellerPrimary)
                
                HStack {
                    Text("\(product.stock) left")
                        .font(.caption)
                        .foregroundColor(product.stock <= 5 ? .red : .secondary)
                    
                    Spacer()
                    
                    Circle()
                        .fill(product.isActive ? Color.green : Color.gray)
                        .frame(width: 8, height: 8)
                }
            }
        }
        .padding(10)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }
}

// MARK: - Seller Product Model
struct SellerProduct: Identifiable {
    let id = UUID()
    let name: String
    let sku: String
    let price: Double
    let stock: Int
    let category: String
    let isActive: Bool
    let sales: Int
    let imageUrl: String?
    
    static let samples = [
        SellerProduct(name: "iPhone 15 Pro Max", sku: "IPH15PM-256", price: 449.000, stock: 12, category: "Electronics", isActive: true, sales: 45, imageUrl: nil),
        SellerProduct(name: "Samsung Galaxy S24 Ultra", sku: "GS24U-512", price: 399.000, stock: 8, category: "Electronics", isActive: true, sales: 32, imageUrl: nil),
        SellerProduct(name: "Nespresso Vertuo Plus", sku: "NEV-PLUS", price: 89.000, stock: 3, category: "Home", isActive: true, sales: 78, imageUrl: nil),
        SellerProduct(name: "Sony WH-1000XM5", sku: "SONY-XM5", price: 159.000, stock: 20, category: "Electronics", isActive: true, sales: 23, imageUrl: nil),
        SellerProduct(name: "MacBook Pro 14\"", sku: "MBP-14-512", price: 699.000, stock: 5, category: "Electronics", isActive: true, sales: 15, imageUrl: nil),
        SellerProduct(name: "iPad Air 5", sku: "IPA-5-256", price: 299.000, stock: 0, category: "Electronics", isActive: false, sales: 0, imageUrl: nil),
    ]
}

#Preview {
    SellerProductsView()
}
