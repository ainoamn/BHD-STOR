//
//  OrdersView.swift
//  BHD Seller Dashboard
//
//  Manage orders with status filtering and bulk actions
//

import SwiftUI

struct SellerOrdersView: View {
    @State private var orders: [SellerOrderDetail] = SellerOrderDetail.samples
    @State private var searchText = ""
    @State private var selectedStatus: SellerOrderStatusFilter = .all
    @State private var selectedOrder: SellerOrderDetail? = nil
    @State private var showOrderDetail = false
    @State private var showStatusUpdate = false
    @State private var newStatus: OrderStatus = .pending
    @State private var selectedOrders: Set<UUID> = []
    @State private var isBulkMode = false
    
    enum SellerOrderStatusFilter: String, CaseIterable {
        case all = "All"
        case pending = "Pending"
        case confirmed = "Confirmed"
        case processing = "Processing"
        case shipped = "Shipped"
        case delivered = "Delivered"
        
        var status: OrderStatus? {
            switch self {
            case .all: return nil
            case .pending: return .pending
            case .confirmed: return .confirmed
            case .processing: return .processing
            case .shipped: return .shipped
            case .delivered: return .delivered
            }
        }
    }
    
    var filteredOrders: [SellerOrderDetail] {
        orders.filter { order in
            let matchesSearch = searchText.isEmpty ||
                order.orderNumber.localizedCaseInsensitiveContains(searchText) ||
                order.customerName.localizedCaseInsensitiveContains(searchText)
            
            let matchesStatus = selectedStatus == .all || order.status == selectedStatus.status
            
            return matchesSearch && matchesStatus
        }
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Status Filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(SellerOrderStatusFilter.allCases, id: \.self) { filter in
                            let count = filter == .all ? orders.count : orders.filter { $0.status == filter.status }.count
                            StatusFilterPillSeller(
                                title: "\(filter.rawValue) (\(count))",
                                isSelected: selectedStatus == filter,
                                onSelect: { selectedStatus = filter }
                            )
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                
                // Search
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    TextField("Search orders...", text: $searchText)
                        .textInputAutocapitalization(.never)
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
                .padding(.bottom, 8)
                
                // Bulk Actions Bar
                if isBulkMode && !selectedOrders.isEmpty {
                    bulkActionsBar
                }
                
                // Orders List
                List {
                    ForEach(filteredOrders) { order in
                        SellerOrderDetailRow(
                            order: order,
                            isSelected: selectedOrders.contains(order.id),
                            isBulkMode: isBulkMode
                        )
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if isBulkMode {
                                toggleSelection(order)
                            } else {
                                selectedOrder = order
                                showOrderDetail = true
                            }
                        }
                        .swipeActions(edge: .trailing) {
                            if order.status == .pending {
                                Button {
                                    updateOrderStatus(order, to: .confirmed)
                                } label: {
                                    Label("Confirm", systemImage: "checkmark")
                                }
                                .tint(.green)
                            }
                            
                            if order.status == .confirmed {
                                Button {
                                    updateOrderStatus(order, to: .processing)
                                } label: {
                                    Label("Process", systemImage: "gearshape")
                                }
                                .tint(.blue)
                            }
                            
                            if order.status == .processing {
                                Button {
                                    updateOrderStatus(order, to: .shipped)
                                } label: {
                                    Label("Ship", systemImage: "box.truck")
                                }
                                .tint(.orange)
                            }
                        }
                        .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                    }
                }
                .listStyle(.plain)
            }
            .navigationTitle("Orders")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(isBulkMode ? "Done" : "Select") {
                        withAnimation {
                            isBulkMode.toggle()
                            selectedOrders.removeAll()
                        }
                    }
                }
            }
            .sheet(isPresented: $showOrderDetail) {
                if let order = selectedOrder {
                    SellerOrderDetailSheet(order: order)
                }
            }
        }
    }
    
    // MARK: - Bulk Actions Bar
    private var bulkActionsBar: some View {
        HStack(spacing: 12) {
            Text("\(selectedOrders.count) selected")
                .font(.subheadline)
                .fontWeight(.medium)
            
            Spacer()
            
            Menu {
                Button("Mark as Confirmed") {
                    bulkUpdateStatus(to: .confirmed)
                }
                Button("Mark as Processing") {
                    bulkUpdateStatus(to: .processing)
                }
                Button("Mark as Shipped") {
                    bulkUpdateStatus(to: .shipped)
                }
                Button("Mark as Delivered") {
                    bulkUpdateStatus(to: .delivered)
                }
                Divider()
                Button("Print Labels") {
                    // Print shipping labels
                }
            } label: {
                Label("Actions", systemImage: "ellipsis.circle")
                    .foregroundColor(.bhdSellerPrimary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color.bhdSellerPrimary.opacity(0.08))
    }
    
    private func toggleSelection(_ order: SellerOrderDetail) {
        if selectedOrders.contains(order.id) {
            selectedOrders.remove(order.id)
        } else {
            selectedOrders.insert(order.id)
        }
    }
    
    private func updateOrderStatus(_ order: SellerOrderDetail, to status: OrderStatus) {
        if let index = orders.firstIndex(where: { $0.id == order.id }) {
            var updated = orders[index]
            updated.status = status
            orders[index] = updated
        }
    }
    
    private func bulkUpdateStatus(to status: OrderStatus) {
        for id in selectedOrders {
            if let index = orders.firstIndex(where: { $0.id == id }) {
                var updated = orders[index]
                updated.status = status
                orders[index] = updated
            }
        }
        selectedOrders.removeAll()
    }
}

// MARK: - Seller Order Detail Row
struct SellerOrderDetailRow: View {
    let order: SellerOrderDetail
    let isSelected: Bool
    let isBulkMode: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            // Selection Circle
            if isBulkMode {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? .bhdSellerPrimary : .secondary)
                    .font(.title3)
            }
            
            // Order Info
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(order.orderNumber)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    Spacer()
                    
                    StatusBadge(status: order.status)
                }
                
                Text(order.customerName)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                HStack(spacing: 12) {
                    Label("\(order.itemCount) items", systemImage: "cube.box")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Label(order.date.formatted(date: .abbreviated, time: .shortened), systemImage: "calendar")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Text(String(format: "%.3f BHD", order.total))
                        .font(.subheadline)
                        .fontWeight(.bold)
                    
                    Spacer()
                    
                    // Payment method
                    HStack(spacing: 4) {
                        Image(systemName: paymentIcon)
                            .font(.caption2)
                        Text(order.paymentMethod)
                            .font(.caption2)
                    }
                    .foregroundColor(.secondary)
                }
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.03), radius: 4, x: 0, y: 1)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(isSelected ? Color.bhdSellerPrimary : Color.clear, lineWidth: 2)
        )
    }
    
    private var paymentIcon: String {
        switch order.paymentMethod {
        case "Credit Card": return "creditcard"
        case "Apple Pay": return "apple.logo"
        case "COD": return "banknote"
        default: return "creditcard"
        }
    }
}

// MARK: - Seller Order Detail Sheet
struct SellerOrderDetailSheet: View {
    @Environment(\.dismiss) private var dismiss
    let order: SellerOrderDetail
    @State private var trackingNumber = ""
    @State private var notes = ""
    
    var body: some View {
        NavigationStack {
            Form {
                // Order Info
                Section("Order Information") {
                    HStack {
                        Text("Order Number")
                        Spacer()
                        Text(order.orderNumber)
                            .fontWeight(.semibold)
                    }
                    
                    HStack {
                        Text("Date")
                        Spacer()
                        Text(order.date, style: .date)
                    }
                    
                    HStack {
                        Text("Status")
                        Spacer()
                        StatusBadge(status: order.status)
                    }
                    
                    HStack {
                        Text("Total")
                        Spacer()
                        Text(String(format: "%.3f BHD", order.total))
                            .fontWeight(.bold)
                    }
                }
                
                // Customer Info
                Section("Customer") {
                    HStack {
                        Text("Name")
                        Spacer()
                        Text(order.customerName)
                    }
                    
                    HStack {
                        Text("Email")
                        Spacer()
                        Text(order.customerEmail)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Phone")
                        Spacer()
                        Text(order.customerPhone)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Items
                Section("Items") {
                    ForEach(order.items) { item in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.productName)
                                    .font(.subheadline)
                                Text("Qty: \(item.quantity)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            Text(String(format: "%.3f BHD", item.price * Double(item.quantity)))
                                .font(.subheadline)
                        }
                    }
                }
                
                // Shipping
                Section("Shipping") {
                    TextField("Tracking Number", text: $trackingNumber)
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }
                
                // Actions
                Section {
                    Button("Update Status") {
                        dismiss()
                    }
                    .foregroundColor(.bhdSellerPrimary)
                    
                    Button("Print Invoice") {
                        dismiss()
                    }
                    .foregroundColor(.bhdSellerPrimary)
                }
            }
            .navigationTitle("Order Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Status Filter Pill (Seller)
struct StatusFilterPillSeller: View {
    let title: String
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            Text(title)
                .font(.caption)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(
                    Capsule()
                        .fill(isSelected ? Color.bhdSellerPrimary : Color.gray.opacity(0.15))
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Seller Order Detail Model
struct SellerOrderDetail: Identifiable {
    let id = UUID()
    let orderNumber: String
    let customerName: String
    let customerEmail: String
    let customerPhone: String
    let total: Double
    var status: OrderStatus
    let date: Date
    let itemCount: Int
    let paymentMethod: String
    let items: [SellerOrderItem]
    let address: String
    
    static let samples = [
        SellerOrderDetail(
            orderNumber: "BHD-2024-0128",
            customerName: "Ahmed Al-Rashid",
            customerEmail: "ahmed@email.com",
            customerPhone: "+973 3600 1234",
            total: 449.000,
            status: .pending,
            date: Date(),
            itemCount: 1,
            paymentMethod: "Credit Card",
            items: [SellerOrderItem(productName: "iPhone 15 Pro Max", quantity: 1, price: 449.000)],
            address: "Manama, Bahrain"
        ),
        SellerOrderDetail(
            orderNumber: "BHD-2024-0127",
            customerName: "Fatima Hassan",
            customerEmail: "fatima@email.com",
            customerPhone: "+973 3600 5678",
            total: 125.500,
            status: .confirmed,
            date: Date().addingTimeInterval(-3600),
            itemCount: 3,
            paymentMethod: "Apple Pay",
            items: [
                SellerOrderItem(productName: "AirPods Pro 2", quantity: 1, price: 89.000),
                SellerOrderItem(productName: "USB-C Cable", quantity: 2, price: 18.250)
            ],
            address: "Riffa, Bahrain"
        ),
        SellerOrderDetail(
            orderNumber: "BHD-2024-0126",
            customerName: "Mohammed Saleh",
            customerEmail: "mohammed@email.com",
            customerPhone: "+973 3600 9012",
            total: 89.000,
            status: .shipped,
            date: Date().addingTimeInterval(-86400),
            itemCount: 1,
            paymentMethod: "COD",
            items: [SellerOrderItem(productName: "Nespresso Vertuo Plus", quantity: 1, price: 89.000)],
            address: "Muharraq, Bahrain"
        ),
        SellerOrderDetail(
            orderNumber: "BHD-2024-0125",
            customerName: "Sara Khalid",
            customerEmail: "sara@email.com",
            customerPhone: "+973 3600 3456",
            total: 567.250,
            status: .delivered,
            date: Date().addingTimeInterval(-172800),
            itemCount: 5,
            paymentMethod: "Credit Card",
            items: [
                SellerOrderItem(productName: "MacBook Pro 14\"", quantity: 1, price: 499.000),
                SellerOrderItem(productName: "USB-C Hub", quantity: 1, price: 45.000),
                SellerOrderItem(productName: "Laptop Sleeve", quantity: 1, price: 23.250)
            ],
            address: "Hamad Town, Bahrain"
        ),
    ]
}

struct SellerOrderItem: Identifiable {
    let id = UUID()
    let productName: String
    let quantity: Int
    let price: Double
}

#Preview {
    SellerOrdersView()
}
