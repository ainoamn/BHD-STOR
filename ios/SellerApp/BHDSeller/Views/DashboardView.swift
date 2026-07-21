//
//  DashboardView.swift
//  BHD Seller Dashboard
//
//  Dashboard with stats cards, recent orders, and quick actions
//

import SwiftUI
import Combine

struct DashboardView: View {
    @State private var stats: SellerStats = .sample
    @State private var recentOrders: [SellerOrder] = SellerOrder.samples
    @State private var isLoading = false
    @State private var selectedTimeRange: TimeRange = .today
    @State private var showNotifications = false
    
    enum TimeRange: String, CaseIterable {
        case today = "Today"
        case week = "This Week"
        case month = "This Month"
        case year = "This Year"
    }
    
    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible())
    ]
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Time Range Selector
                    timeRangeSelector
                    
                    // Stats Grid
                    statsGrid
                    
                    // Sales Chart Preview
                    salesChartPreview
                    
                    // Quick Actions
                    quickActions
                    
                    // Recent Orders
                    recentOrdersSection
                    
                    // Low Stock Alert
                    lowStockSection
                }
                .padding(16)
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showNotifications = true }) {
                        ZStack(alignment: .topTrailing) {
                            Image(systemName: "bell")
                                .font(.title3)
                            Circle()
                                .fill(Color.red)
                                .frame(width: 8, height: 8)
                                .offset(x: 2, y: -2)
                        }
                    }
                }
            }
            .sheet(isPresented: $showNotifications) {
                NotificationsView()
            }
            .onAppear {
                loadDashboardData()
            }
        }
    }
    
    // MARK: - Time Range Selector
    private var timeRangeSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(TimeRange.allCases, id: \.self) { range in
                    Button(action: { selectedTimeRange = range }) {
                        Text(range.rawValue)
                            .font(.subheadline)
                            .fontWeight(selectedTimeRange == range ? .semibold : .regular)
                            .foregroundColor(selectedTimeRange == range ? .white : .primary)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(
                                Capsule()
                                    .fill(selectedTimeRange == range ? Color.bhdSellerPrimary : Color.gray.opacity(0.15))
                            )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
    }
    
    // MARK: - Stats Grid
    private var statsGrid: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            StatCard(
                title: "Revenue",
                value: String(format: "%.3f BHD", stats.revenue),
                icon: "dollarsign.circle.fill",
                color: .green,
                trend: stats.revenueTrend
            )
            
            StatCard(
                title: "Orders",
                value: "\(stats.orderCount)",
                icon: "bag.fill",
                color: .bhdSellerPrimary,
                trend: stats.orderTrend
            )
            
            StatCard(
                title: "Products",
                value: "\(stats.productCount)",
                icon: "cube.fill",
                color: .orange,
                trend: stats.productTrend
            )
            
            StatCard(
                title: "Customers",
                value: "\(stats.customerCount)",
                icon: "person.2.fill",
                color: .purple,
                trend: stats.customerTrend
            )
        }
    }
    
    // MARK: - Sales Chart Preview
    private var salesChartPreview: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Sales Overview")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                NavigationLink(destination: AnalyticsView()) {
                    Text("See Details")
                        .font(.subheadline)
                        .foregroundColor(.bhdSellerPrimary)
                }
            }
            
            // Mini bar chart
            HStack(alignment: .bottom, spacing: 8) {
                ForEach(stats.salesData, id: \.day) { data in
                    VStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.bhdSellerPrimary.opacity(0.8))
                            .frame(height: CGFloat(data.amount) / maxSales * 120)
                        
                        Text(data.day)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 150)
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
    
    private var maxSales: Double {
        stats.salesData.map { $0.amount }.max() ?? 1
    }
    
    // MARK: - Quick Actions
    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .fontWeight(.semibold)
            
            HStack(spacing: 12) {
                QuickActionButton(
                    icon: "plus.circle.fill",
                    title: "Add Product",
                    color: .green,
                    action: {}
                )
                
                QuickActionButton(
                    icon: "qrcode",
                    title: "Scan Order",
                    color: .bhdSellerPrimary,
                    action: {}
                )
                
                QuickActionButton(
                    icon: "tag.fill",
                    title: "Promotions",
                    color: .orange,
                    action: {}
                )
                
                QuickActionButton(
                    icon: "envelope.fill",
                    title: "Messages",
                    color: .purple,
                    action: {}
                )
            }
        }
    }
    
    // MARK: - Recent Orders Section
    private var recentOrdersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Orders")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                NavigationLink(destination: SellerOrdersView()) {
                    Text("View All")
                        .font(.subheadline)
                        .foregroundColor(.bhdSellerPrimary)
                }
            }
            
            VStack(spacing: 8) {
                ForEach(recentOrders.prefix(5)) { order in
                    SellerOrderRow(order: order)
                }
            }
        }
    }
    
    // MARK: - Low Stock Section
    private var lowStockSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Low Stock Alerts")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                if stats.lowStockCount > 0 {
                    Text("\(stats.lowStockCount) items")
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.red.opacity(0.1))
                        .clipShape(Capsule())
                }
            }
            
            if stats.lowStockItems.isEmpty {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("All items are well stocked")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                }
                .padding(12)
                .background(Color.green.opacity(0.05))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                VStack(spacing: 8) {
                    ForEach(stats.lowStockItems.prefix(3)) { item in
                        LowStockRow(item: item)
                    }
                }
            }
        }
    }
    
    // MARK: - Load Data
    private func loadDashboardData() {
        // In production, load from API
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    let trend: Double
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Spacer()
                
                HStack(spacing: 2) {
                    Image(systemName: trend >= 0 ? "arrow.up" : "arrow.down")
                        .font(.caption2)
                    Text(String(format: "%.1f%%", abs(trend)))
                        .font(.caption)
                        .fontWeight(.medium)
                }
                .foregroundColor(trend >= 0 ? .green : .red)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background((trend >= 0 ? Color.green : Color.red).opacity(0.1))
                .clipShape(Capsule())
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.12))
                        .frame(width: 48, height: 48)
                    
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundColor(color)
                }
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
        }
        .frame(maxWidth: .infinity)
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Seller Order Row
struct SellerOrderRow: View {
    let order: SellerOrder
    
    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(order.orderNumber)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Text(order.customerName)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(order.date, style: .date)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(String(format: "%.3f BHD", order.total))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                StatusBadge(status: order.status)
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.03), radius: 4, x: 0, y: 1)
    }
}

// MARK: - Low Stock Row
struct LowStockRow: View {
    let item: LowStockItem
    
    var body: some View {
        HStack(spacing: 12) {
            // Product Image Placeholder
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.15))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: "cube.box")
                        .foregroundColor(.gray)
                )
            
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text("SKU: \(item.sku)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(item.stock) left")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(item.stock <= 5 ? .red : .orange)
                
                // Stock indicator
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 4)
                        
                        let ratio = min(Double(item.stock) / Double(item.reorderLevel * 2), 1.0)
                        RoundedRectangle(cornerRadius: 2)
                            .fill(item.stock <= 5 ? Color.red : Color.orange)
                            .frame(width: geo.size.width * CGFloat(ratio), height: 4)
                    }
                }
                .frame(width: 50, height: 4)
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.03), radius: 4, x: 0, y: 1)
    }
}

// MARK: - Notifications View
struct NotificationsView: View {
    @Environment(\.dismiss) private var dismiss
    
    let notifications = [
        SellerNotification(title: "New Order", message: "Order #1234 received", time: "2 min ago", isRead: false),
        SellerNotification(title: "Low Stock", message: "iPhone 15 Pro running low", time: "15 min ago", isRead: false),
        SellerNotification(title: "Order Shipped", message: "Order #1230 shipped", time: "1 hour ago", isRead: true),
    ]
    
    var body: some View {
        NavigationStack {
            List {
                ForEach(notifications) { notification in
                    NotificationRow(notification: notification)
                }
            }
            .listStyle(.plain)
            .navigationTitle("Notifications")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
}

struct NotificationRow: View {
    let notification: SellerNotification
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(notification.isRead ? Color.clear : Color.bhdSellerPrimary)
                .frame(width: 8, height: 8)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(notification.title)
                    .font(.subheadline)
                    .fontWeight(notification.isRead ? .regular : .semibold)
                Text(notification.message)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(notification.time)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Models
struct SellerStats {
    let revenue: Double
    let orderCount: Int
    let productCount: Int
    let customerCount: Int
    let revenueTrend: Double
    let orderTrend: Double
    let productTrend: Double
    let customerTrend: Double
    let lowStockCount: Int
    let lowStockItems: [LowStockItem]
    let salesData: [SalesDataPoint]
    
    static let sample = SellerStats(
        revenue: 4523.750,
        orderCount: 128,
        productCount: 456,
        customerCount: 892,
        revenueTrend: 12.5,
        orderTrend: 8.3,
        productTrend: 3.1,
        customerTrend: 15.2,
        lowStockCount: 5,
        lowStockItems: LowStockItem.samples,
        salesData: SalesDataPoint.sampleWeek
    )
}

struct SalesDataPoint: Identifiable {
    let id = UUID()
    let day: String
    let amount: Double
    
    static let sampleWeek = [
        SalesDataPoint(day: "Mon", amount: 450),
        SalesDataPoint(day: "Tue", amount: 620),
        SalesDataPoint(day: "Wed", amount: 380),
        SalesDataPoint(day: "Thu", amount: 890),
        SalesDataPoint(day: "Fri", amount: 750),
        SalesDataPoint(day: "Sat", amount: 920),
        SalesDataPoint(day: "Sun", amount: 510),
    ]
}

struct SellerOrder: Identifiable {
    let id = UUID()
    let orderNumber: String
    let customerName: String
    let total: Double
    let status: OrderStatus
    let date: Date
    let itemCount: Int
    
    static let samples = [
        SellerOrder(orderNumber: "BHD-2024-0128", customerName: "Ahmed Al-Rashid", total: 449.000, status: .pending, date: Date(), itemCount: 1),
        SellerOrder(orderNumber: "BHD-2024-0127", customerName: "Fatima Hassan", total: 125.500, status: .shipped, date: Date().addingTimeInterval(-3600), itemCount: 3),
        SellerOrder(orderNumber: "BHD-2024-0126", customerName: "Mohammed Saleh", total: 89.000, status: .delivered, date: Date().addingTimeInterval(-86400), itemCount: 1),
        SellerOrder(orderNumber: "BHD-2024-0125", customerName: "Sara Khalid", total: 567.250, status: .processing, date: Date().addingTimeInterval(-172800), itemCount: 5),
    ]
}

struct LowStockItem: Identifiable {
    let id = UUID()
    let name: String
    let sku: String
    let stock: Int
    let reorderLevel: Int
    
    static let samples = [
        LowStockItem(name: "iPhone 15 Pro Max", sku: "IPH15PM-256", stock: 3, reorderLevel: 10),
        LowStockItem(name: "AirPods Pro 2", sku: "APP-2ND", stock: 5, reorderLevel: 15),
        LowStockItem(name: "Samsung Galaxy S24", sku: "GS24-512", stock: 2, reorderLevel: 8),
    ]
}

struct SellerNotification: Identifiable {
    let id = UUID()
    let title: String
    let message: String
    let time: String
    let isRead: Bool
}

#Preview {
    DashboardView()
}
