//
//  AnalyticsView.swift
//  BHD Seller Dashboard
//
//  Charts and analytics for seller performance
//

import SwiftUI

struct AnalyticsView: View {
    @State private var selectedPeriod: AnalyticsPeriod = .week
    @State private var analyticsData: AnalyticsData = .sample
    @State private var selectedChart: ChartType = .sales
    
    enum AnalyticsPeriod: String, CaseIterable {
        case today = "Today"
        case week = "Week"
        case month = "Month"
        case year = "Year"
    }
    
    enum ChartType: String, CaseIterable {
        case sales = "Sales"
        case orders = "Orders"
        case customers = "Customers"
        case products = "Products"
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Period Selector
                    periodSelector
                    
                    // KPI Cards
                    kpiCards
                    
                    // Main Chart
                    mainChart
                    
                    // Revenue Breakdown
                    revenueBreakdown
                    
                    // Top Products
                    topProductsSection
                    
                    // Top Categories
                    topCategoriesSection
                    
                    // Customer Insights
                    customerInsights
                }
                .padding(16)
            }
            .navigationTitle("Analytics")
            .navigationBarTitleDisplayMode(.large)
        }
    }
    
    // MARK: - Period Selector
    private var periodSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(AnalyticsPeriod.allCases, id: \.self) { period in
                    Button(action: { selectedPeriod = period }) {
                        Text(period.rawValue)
                            .font(.subheadline)
                            .fontWeight(selectedPeriod == period ? .semibold : .regular)
                            .foregroundColor(selectedPeriod == period ? .white : .primary)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(
                                Capsule()
                                    .fill(selectedPeriod == period ? Color.bhdSellerPrimary : Color.gray.opacity(0.15))
                            )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
    }
    
    // MARK: - KPI Cards
    private var kpiCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            AnalyticsKpiCard(
                title: "Revenue",
                value: String(format: "%.3f BHD", analyticsData.totalRevenue),
                change: analyticsData.revenueChange,
                icon: "dollarsign.circle.fill",
                color: .green
            )
            AnalyticsKpiCard(
                title: "Orders",
                value: "\(analyticsData.totalOrders)",
                change: analyticsData.ordersChange,
                icon: "bag.fill",
                color: .bhdSellerPrimary
            )
            AnalyticsKpiCard(
                title: "Avg Order",
                value: String(format: "%.3f BHD", analyticsData.averageOrderValue),
                change: analyticsData.aovChange,
                icon: "cart.fill",
                color: .orange
            )
            AnalyticsKpiCard(
                title: "Conversion",
                value: String(format: "%.1f%%", analyticsData.conversionRate),
                change: analyticsData.conversionChange,
                icon: "arrowshape.turn.up.right.fill",
                color: .purple
            )
        }
    }
    
    // MARK: - Main Chart
    private var mainChart: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Sales Trend")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                // Chart Type Picker
                Picker("Chart", selection: $selectedChart) {
                    ForEach(ChartType.allCases, id: \.self) { type in
                        Text(type.rawValue).tag(type)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 250)
            }
            
            // Chart
            GeometryReader { geo in
                let data = chartData
                let maxValue = data.map { $0.value }.max() ?? 1
                let minValue = data.map { $0.value }.min() ?? 0
                let range = maxValue - minValue
                
                HStack(alignment: .bottom, spacing: 0) {
                    // Y-axis labels
                    VStack(alignment: .trailing, spacing: 0) {
                        Text(String(format: "%.0f", maxValue))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(String(format: "%.0f", minValue))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .frame(width: 40)
                    
                    // Chart area
                    ZStack {
                        // Grid lines
                        VStack(spacing: 0) {
                            Divider().opacity(0.3)
                            Spacer()
                            Divider().opacity(0.3)
                            Spacer()
                            Divider().opacity(0.3)
                        }
                        
                        // Bars
                        HStack(alignment: .bottom, spacing: 8) {
                            ForEach(data) { point in
                                VStack(spacing: 4) {
                                    let height = range > 0 ? CGFloat((point.value - minValue) / range) * (geo.size.height - 60) : 0
                                    
                                    VStack {
                                        Spacer()
                                        RoundedRectangle(cornerRadius: 4)
                                            .fill(barColor(for: point))
                                            .frame(height: max(height, 4))
                                    }
                                    
                                    Text(point.label)
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                        .rotationEffect(.degrees(-45))
                                        .frame(height: 20)
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                        .padding(.leading, 4)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .frame(height: 220)
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
    
    private var chartData: [ChartDataPoint] {
        switch selectedChart {
        case .sales: return analyticsData.salesTrend
        case .orders: return analyticsData.ordersTrend
        case .customers: return analyticsData.customersTrend
        case .products: return analyticsData.productsTrend
        }
    }
    
    private func barColor(for point: ChartDataPoint) -> Color {
        switch selectedChart {
        case .sales: return .chartGreen
        case .orders: return .bhdSellerPrimary
        case .customers: return .chartPurple
        case .products: return .chartOrange
        }
    }
    
    // MARK: - Revenue Breakdown
    private var revenueBreakdown: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Revenue Breakdown")
                .font(.headline)
                .fontWeight(.semibold)
            
            HStack(spacing: 20) {
                // Donut Chart
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.15), lineWidth: 24)
                    
                    ForEach(Array(analyticsData.revenueBreakdown.enumerated()), id: \.offset) { index, item in
                        Circle()
                            .trim(from: item.startAngle, to: item.endAngle)
                            .stroke(item.color, style: StrokeStyle(lineWidth: 24, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                    }
                    
                    VStack(spacing: 2) {
                        Text("Total")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(String(format: "%.0f", analyticsData.totalRevenue))
                            .font(.title3)
                            .fontWeight(.bold)
                    }
                }
                .frame(width: 140, height: 140)
                
                // Legend
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(analyticsData.revenueBreakdown) { item in
                        HStack(spacing: 8) {
                            Circle()
                                .fill(item.color)
                                .frame(width: 10, height: 10)
                            Text(item.category)
                                .font(.caption)
                            Spacer()
                            Text(String(format: "%.1f%%", item.percentage))
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
    
    // MARK: - Top Products
    private var topProductsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Top Products")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 8) {
                // Header
                HStack {
                    Text("Product")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text("Sales")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(width: 60, alignment: .trailing)
                    Text("Revenue")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(width: 80, alignment: .trailing)
                }
                .padding(.horizontal, 8)
                
                Divider()
                
                ForEach(analyticsData.topProducts) { product in
                    HStack {
                        HStack(spacing: 8) {
                            Text("\(product.rank)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .frame(width: 20)
                            
                            Text(product.name)
                                .font(.subheadline)
                                .lineLimit(1)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        
                        Text("\(product.unitsSold)")
                            .font(.subheadline)
                            .frame(width: 60, alignment: .trailing)
                        
                        Text(String(format: "%.3f", product.revenue))
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .frame(width: 80, alignment: .trailing)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
    
    // MARK: - Top Categories
    private var topCategoriesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Top Categories")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                ForEach(analyticsData.topCategories) { category in
                    VStack(spacing: 8) {
                        HStack {
                            Text(category.name)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Spacer()
                            Text(String(format: "%.3f BHD", category.revenue))
                                .font(.subheadline)
                                .fontWeight(.semibold)
                        }
                        
                        // Progress bar
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(Color.gray.opacity(0.15))
                                    .frame(height: 8)
                                
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(category.color)
                                    .frame(width: geo.size.width * CGFloat(category.percentage / 100), height: 8)
                            }
                        }
                        .frame(height: 8)
                        
                        HStack {
                            Text("\(category.orders) orders")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            Spacer()
                            Text(String(format: "%.1f%%", category.percentage))
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
    
    // MARK: - Customer Insights
    private var customerInsights: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Customer Insights")
                .font(.headline)
                .fontWeight(.semibold)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                InsightCard(title: "New Customers", value: "\(analyticsData.newCustomers)", subtitle: "This period", icon: "person.badge.plus", color: .chartBlue)
                InsightCard(title: "Returning", value: "\(analyticsData.returningCustomers)", subtitle: "This period", icon: "person.2", color: .chartGreen)
                InsightCard(title: "Retention", value: String(format: "%.1f%%", analyticsData.retentionRate), subtitle: "Customer retention", icon: "arrow.clockwise.heart", color: .chartPurple)
                InsightCard(title: "Satisfaction", value: String(format: "%.1f", analyticsData.avgRating), subtitle: "Average rating", icon: "star.fill", color: .chartOrange)
            }
        }
    }
}

// MARK: - Analytics KPI Card
struct AnalyticsKpiCard: View {
    let title: String
    let value: String
    let change: Double
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 22))
                    .foregroundColor(color)
                
                Spacer()
                
                HStack(spacing: 2) {
                    Image(systemName: change >= 0 ? "arrow.up" : "arrow.down")
                        .font(.caption2)
                    Text(String(format: "%.1f%%", abs(change)))
                        .font(.caption)
                }
                .foregroundColor(change >= 0 ? .green : .red)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background((change >= 0 ? Color.green : Color.red).opacity(0.1))
                .clipShape(Capsule())
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.title3)
                    .fontWeight(.bold)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }
}

// MARK: - Insight Card
struct InsightCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(color)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Text(subtitle)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }
}

// MARK: - Data Models
struct ChartDataPoint: Identifiable {
    let id = UUID()
    let label: String
    let value: Double
}

struct RevenueBreakdownItem: Identifiable {
    let id = UUID()
    let category: String
    let percentage: Double
    let color: Color
    let startAngle: Double
    let endAngle: Double
}

struct TopProduct: Identifiable {
    let id = UUID()
    let rank: Int
    let name: String
    let unitsSold: Int
    let revenue: Double
}

struct TopCategory: Identifiable {
    let id = UUID()
    let name: String
    let revenue: Double
    let orders: Int
    let percentage: Double
    let color: Color
}

struct AnalyticsData {
    let totalRevenue: Double
    let totalOrders: Int
    let averageOrderValue: Double
    let conversionRate: Double
    let revenueChange: Double
    let ordersChange: Double
    let aovChange: Double
    let conversionChange: Double
    let salesTrend: [ChartDataPoint]
    let ordersTrend: [ChartDataPoint]
    let customersTrend: [ChartDataPoint]
    let productsTrend: [ChartDataPoint]
    let revenueBreakdown: [RevenueBreakdownItem]
    let topProducts: [TopProduct]
    let topCategories: [TopCategory]
    let newCustomers: Int
    let returningCustomers: Int
    let retentionRate: Double
    let avgRating: Double
    
    static let sample = AnalyticsData(
        totalRevenue: 4523.750,
        totalOrders: 128,
        averageOrderValue: 35.341,
        conversionRate: 3.2,
        revenueChange: 12.5,
        ordersChange: 8.3,
        aovChange: 3.8,
        conversionChange: -0.5,
        salesTrend: [
            ChartDataPoint(label: "Mon", value: 450),
            ChartDataPoint(label: "Tue", value: 620),
            ChartDataPoint(label: "Wed", value: 380),
            ChartDataPoint(label: "Thu", value: 890),
            ChartDataPoint(label: "Fri", value: 750),
            ChartDataPoint(label: "Sat", value: 920),
            ChartDataPoint(label: "Sun", value: 510),
        ],
        ordersTrend: [
            ChartDataPoint(label: "Mon", value: 12),
            ChartDataPoint(label: "Tue", value: 18),
            ChartDataPoint(label: "Wed", value: 9),
            ChartDataPoint(label: "Thu", value: 25),
            ChartDataPoint(label: "Fri", value: 20),
            ChartDataPoint(label: "Sat", value: 28),
            ChartDataPoint(label: "Sun", value: 16),
        ],
        customersTrend: [
            ChartDataPoint(label: "Mon", value: 10),
            ChartDataPoint(label: "Tue", value: 15),
            ChartDataPoint(label: "Wed", value: 8),
            ChartDataPoint(label: "Thu", value: 22),
            ChartDataPoint(label: "Fri", value: 18),
            ChartDataPoint(label: "Sat", value: 24),
            ChartDataPoint(label: "Sun", value: 14),
        ],
        productsTrend: [
            ChartDataPoint(label: "Mon", value: 45),
            ChartDataPoint(label: "Tue", value: 62),
            ChartDataPoint(label: "Wed", value: 38),
            ChartDataPoint(label: "Thu", value: 89),
            ChartDataPoint(label: "Fri", value: 75),
            ChartDataPoint(label: "Sat", value: 92),
            ChartDataPoint(label: "Sun", value: 51),
        ],
        revenueBreakdown: [
            RevenueBreakdownItem(category: "Electronics", percentage: 45, color: .chartBlue, startAngle: 0.0, endAngle: 0.45),
            RevenueBreakdownItem(category: "Home", percentage: 25, color: .chartGreen, startAngle: 0.45, endAngle: 0.70),
            RevenueBreakdownItem(category: "Fashion", percentage: 20, color: .chartOrange, startAngle: 0.70, endAngle: 0.90),
            RevenueBreakdownItem(category: "Other", percentage: 10, color: .chartPurple, startAngle: 0.90, endAngle: 1.0),
        ],
        topProducts: [
            TopProduct(rank: 1, name: "iPhone 15 Pro Max", unitsSold: 45, revenue: 20205.000),
            TopProduct(rank: 2, name: "Samsung Galaxy S24", unitsSold: 32, revenue: 12768.000),
            TopProduct(rank: 3, name: "Nespresso Vertuo Plus", unitsSold: 78, revenue: 6942.000),
            TopProduct(rank: 4, name: "Sony WH-1000XM5", unitsSold: 23, revenue: 3657.000),
            TopProduct(rank: 5, name: "AirPods Pro 2", unitsSold: 56, revenue: 4984.000),
        ],
        topCategories: [
            TopCategory(name: "Electronics", revenue: 20345.000, orders: 156, percentage: 45, color: .chartBlue),
            TopCategory(name: "Home & Kitchen", revenue: 11305.000, orders: 89, percentage: 25, color: .chartGreen),
            TopCategory(name: "Fashion", revenue: 9045.000, orders: 67, percentage: 20, color: .chartOrange),
            TopCategory(name: "Sports", revenue: 4520.000, orders: 34, percentage: 10, color: .chartPurple),
        ],
        newCustomers: 45,
        returningCustomers: 83,
        retentionRate: 64.8,
        avgRating: 4.7
    )
}

#Preview {
    AnalyticsView()
}
