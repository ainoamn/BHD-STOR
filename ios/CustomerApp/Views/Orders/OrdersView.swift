//
//  OrdersView.swift
//  BHD Marketplace
//
//  Orders list with status filtering
//

import SwiftUI
import Combine

struct OrdersView: View {
    @State private var orders: [Order] = []
    @State private var isLoading = true
    @State private var selectedStatus: OrderStatus? = nil
    @State private var selectedOrder: Order? = nil
    @State private var showOrderDetail = false
    @State private var currentPage = 1
    @State private var hasMorePages = true
    
    private let statusFilters: [OrderStatus?] = [
        nil, .pending, .confirmed, .processing, .shipped, .delivered
    ]
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Status Filter Pills
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(statusFilters, id: \.self) { status in
                            StatusFilterPill(
                                status: status,
                                isSelected: selectedStatus == status,
                                onSelect: {
                                    selectedStatus = status
                                    currentPage = 1
                                    loadOrders()
                                }
                            )
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                
                // Orders List
                if isLoading && orders.isEmpty {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if orders.isEmpty {
                    Spacer()
                    EmptyStateView(
                        icon: "box.truck",
                        title: L("orders.empty"),
                        message: L("orders.emptyMessage")
                    )
                    Spacer()
                } else {
                    List {
                        ForEach(orders) { order in
                            OrderRow(order: order)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    selectedOrder = order
                                    showOrderDetail = true
                                }
                                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                                .listRowSeparator(.hidden)
                                .listRowBackground(Color.clear)
                        }
                        
                        // Load more
                        if hasMorePages {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                                .onAppear {
                                    loadMoreOrders()
                                }
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        currentPage = 1
                        await refreshOrders()
                    }
                }
            }
            .navigationTitle(L("orders.title"))
            .navigationBarTitleDisplayMode(.large)
            .navigationDestination(isPresented: $showOrderDetail) {
                if let order = selectedOrder {
                    OrderDetailView(order: order)
                }
            }
            .onAppear {
                if orders.isEmpty {
                    loadOrders()
                }
            }
        }
    }
    
    // MARK: - Load Orders
    private func loadOrders() {
        isLoading = true
        
        OrderService.shared.getOrders(status: selectedStatus, page: currentPage, limit: 20)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in
                    isLoading = false
                },
                receiveValue: { response in
                    if currentPage == 1 {
                        orders = response.orders
                    } else {
                        orders.append(contentsOf: response.orders)
                    }
                    hasMorePages = response.page < response.totalPages
                }
            )
            .store(in: &SubscriptionStore.shared.cancellables)
    }
    
    private func loadMoreOrders() {
        guard !isLoading, hasMorePages else { return }
        currentPage += 1
        loadOrders()
    }
    
    private func refreshOrders() async {
        currentPage = 1
        loadOrders()
        // Wait a bit for the loading to complete
        try? await Task.sleep(nanoseconds: 500_000_000)
    }
}

// MARK: - Status Filter Pill
struct StatusFilterPill: View {
    let status: OrderStatus?
    let isSelected: Bool
    let onSelect: () -> Void
    
    var label: String {
        status?.localizedName ?? L("orders.all")
    }
    
    var body: some View {
        Button(action: onSelect) {
            Text(label)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    Capsule()
                        .fill(isSelected ? Color.bhdPrimary : Color.gray.opacity(0.15))
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Order Row
struct OrderRow: View {
    let order: Order
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header Row
            HStack {
                Text(order.orderNumber)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                StatusBadge(status: order.status)
            }
            
            Divider()
            
            // Items Summary
            HStack(spacing: 8) {
                // Thumbnail stack
                HStack(spacing: -8) {
                    ForEach(order.items.prefix(3)) { item in
                        if let thumbnail = item.product.thumbnail {
                            AsyncImage(url: URL(string: thumbnail)) { image in
                                image.resizable().aspectRatio(contentMode: .fill)
                            } placeholder: {
                                Color.gray.opacity(0.2)
                            }
                            .frame(width: 40, height: 40)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color(.systemBackground), lineWidth: 2)
                            )
                        } else {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.gray.opacity(0.2))
                                .frame(width: 40, height: 40)
                                .overlay(
                                    Image(systemName: "cube.box")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                )
                        }
                    }
                    
                    if order.items.count > 3 {
                        Text("+\(order.items.count - 3)")
                            .font(.caption)
                            .fontWeight(.medium)
                            .frame(width: 40, height: 40)
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text(order.formattedTotal)
                        .font(.subheadline)
                        .fontWeight(.bold)
                    
                    Text("\(order.itemCount) \(L("orders.items"))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Date & Actions
            HStack {
                Text(order.createdAt, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if order.canCancel {
                    Button(action: {}) {
                        Text(L("orders.cancel"))
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.red)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .background(Color.red.opacity(0.1))
                            .clipShape(Capsule())
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 4, x: 0, y: 2)
    }
}

// MARK: - Preview
#Preview {
    OrdersView()
}
