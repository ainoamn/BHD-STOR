//
//  OrderDetailView.swift
//  BHD Marketplace
//
//  Order detail with tracking timeline
//

import SwiftUI
import Combine

struct OrderDetailView: View {
    let order: Order
    @State private var tracking: OrderTracking?
    @State private var timeline: [OrderTimelineEvent] = []
    @State private var showCancelConfirmation = false
    @State private var cancelReason = ""
    @State private var isLoading = false
    @State private var showReorderConfirmation = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Order Header
                orderHeader
                
                // Tracking Progress
                if order.status != .cancelled && order.status != .refunded {
                    trackingSection
                }
                
                // Timeline
                if !timeline.isEmpty {
                    timelineSection
                }
                
                // Items
                itemsSection
                
                // Shipping Address
                addressSection
                
                // Payment Info
                paymentSection
                
                // Summary
                summarySection
                
                // Actions
                actionsSection
            }
            .padding(16)
        }
        .navigationTitle(L("order.details"))
        .navigationBarTitleDisplayMode(.inline)
        .alert(L("orders.cancel"), isPresented: $showCancelConfirmation) {
            TextField(L("orders.cancelReason"), text: $cancelReason)
            Button(L("common.cancel"), role: .cancel) {}
            Button(L("orders.confirmCancel"), role: .destructive) {
                cancelOrder()
            }
        } message: {
            Text(L("orders.cancelConfirm"))
        }
        .onAppear {
            loadTimeline()
        }
    }
    
    // MARK: - Order Header
    private var orderHeader: some View {
        BHDCard {
            VStack(spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(order.orderNumber)
                            .font(.headline)
                            .fontWeight(.bold)
                        Text(order.createdAt, style: .date)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    StatusBadge(status: order.status)
                }
                
                if let tracking = order.trackingNumber {
                    HStack {
                        Label("Tracking: \(tracking)", systemImage: "barcode")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        if let url = order.trackingUrl, let trackingURL = URL(string: url) {
                            Link(destination: trackingURL) {
                                Image(systemName: "arrow.up.right.square")
                                    .foregroundColor(.bhdPrimary)
                            }
                        }
                    }
                }
                
                if let estimated = order.estimatedDelivery {
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundColor(.bhdPrimary)
                        Text(L("order.estimatedDelivery"))
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(estimated, style: .date)
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                }
            }
        }
    }
    
    // MARK: - Tracking Section
    private var trackingSection: some View {
        BHDCard {
            VStack(spacing: 12) {
                // Progress Bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 8)
                        
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.bhdPrimary)
                            .frame(width: geo.size.width * order.status.progressValue, height: 8)
                            .animation(.easeInOut(duration: 0.8), value: order.status)
                    }
                }
                .frame(height: 8)
                
                // Status Steps
                HStack {
                    ForEach([OrderStatus.pending, .confirmed, .processing, .shipped, .delivered], id: \.self) { status in
                        VStack(spacing: 4) {
                            Image(systemName: status.iconName)
                                .font(.caption)
                                .foregroundColor(orderStatusColor(for: status))
                            
                            Text(status.localizedName)
                                .font(.caption2)
                                .foregroundColor(orderStatusColor(for: status))
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
        }
    }
    
    private func orderStatusColor(for status: OrderStatus) -> Color {
        let currentProgress = order.status.progressValue
        let statusProgress = status.progressValue
        
        if statusProgress <= currentProgress && currentProgress > 0 {
            return .bhdPrimary
        } else if order.status == .cancelled {
            return .gray.opacity(0.4)
        }
        return .gray.opacity(0.4)
    }
    
    // MARK: - Timeline Section
    private var timelineSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(L("order.timeline"))
                .font(.headline)
                .fontWeight(.semibold)
                .padding(.bottom, 12)
            
            VStack(spacing: 0) {
                ForEach(Array(timeline.enumerated()), id: \.element.id) { index, event in
                    TimelineEventRow(
                        event: event,
                        isLast: index == timeline.count - 1
                    )
                }
            }
        }
    }
    
    // MARK: - Items Section
    private var itemsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(L("order.items"))
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                ForEach(order.items) { item in
                    OrderItemRow(item: item)
                }
            }
        }
    }
    
    // MARK: - Address Section
    private var addressSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(L("order.shippingAddress"))
                .font(.headline)
                .fontWeight(.semibold)
            
            BHDCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text(order.shippingAddress.fullName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    Text(order.shippingAddress.formattedAddress)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(order.shippingAddress.phone)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
    
    // MARK: - Payment Section
    private var paymentSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(L("order.payment"))
                .font(.headline)
                .fontWeight(.semibold)
            
            BHDCard {
                HStack(spacing: 12) {
                    Image(systemName: order.paymentMethod.type.iconName)
                        .font(.title2)
                        .foregroundColor(.bhdPrimary)
                        .frame(width: 40)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(order.paymentMethod.type.localizedName)
                            .font(.subheadline)
                            .fontWeight(.medium)
                        if let lastFour = order.paymentMethod.lastFour {
                            Text("•••• \(lastFour)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Spacer()
                    
                    StatusBadge(status: paymentStatus)
                }
            }
        }
    }
    
    private var paymentStatus: OrderStatus {
        switch order.paymentStatus {
        case .paid: return .delivered
        case .pending: return .pending
        case .failed: return .cancelled
        case .refunded: return .refunded
        case .partiallyRefunded: return .processing
        }
    }
    
    // MARK: - Summary Section
    private var summarySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(L("order.summary"))
                .font(.headline)
                .fontWeight(.semibold)
            
            BHDCard {
                VStack(spacing: 10) {
                    SummaryRow(title: L("cart.subtotal"), value: order.subtotal)
                    if order.discount > 0 {
                        SummaryRow(title: L("cart.discount"), value: -order.discount, isDiscount: true)
                    }
                    SummaryRow(title: L("cart.shipping"), value: order.shippingCost)
                    SummaryRow(title: L("cart.tax"), value: order.tax)
                    
                    Divider()
                    
                    HStack {
                        Text(L("cart.total"))
                            .font(.headline)
                            .fontWeight(.bold)
                        Spacer()
                        Text(order.formattedTotal)
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.bhdPrimary)
                    }
                }
            }
        }
    }
    
    // MARK: - Actions Section
    private var actionsSection: some View {
        VStack(spacing: 12) {
            if order.canCancel {
                BHDButton(
                    title: L("orders.cancel"),
                    icon: "xmark.circle",
                    style: .secondary,
                    isFullWidth: true,
                    action: {
                        showCancelConfirmation = true
                    }
                )
            }
            
            if order.status == .delivered {
                BHDButton(
                    title: L("orders.reorder"),
                    icon: "arrow.counterclockwise",
                    style: .outline,
                    isFullWidth: true,
                    action: {
                        showReorderConfirmation = true
                    }
                )
            }
            
            if let trackingUrl = order.trackingUrl, let url = URL(string: trackingUrl) {
                Link(destination: url) {
                    HStack {
                        Image(systemName: "arrow.up.right.square")
                        Text(L("order.trackExternal"))
                    }
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.bhdPrimary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.bhdPrimary, lineWidth: 1)
                    )
                }
            }
        }
    }
    
    // MARK: - Load Timeline
    private func loadTimeline() {
        guard let timelineData = order.timeline else {
            // Use default timeline from order
            if let tl = order.timeline {
                timeline = tl
            }
            return
        }
        timeline = timelineData
    }
    
    // MARK: - Cancel Order
    private func cancelOrder() {
        isLoading = true
        OrderService.shared.cancelOrder(id: order.id, reason: cancelReason.isEmpty ? nil : cancelReason)
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { _ in isLoading = false }, receiveValue: { _ in })
            .store(in: &SubscriptionStore.shared.cancellables)
    }
}

// MARK: - Timeline Event Row
struct TimelineEventRow: View {
    let event: OrderTimelineEvent
    let isLast: Bool
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Timeline Line & Dot
            VStack(spacing: 0) {
                Circle()
                    .fill(event.isCompleted ? Color.bhdPrimary : Color.gray.opacity(0.3))
                    .frame(width: 12, height: 12)
                    .overlay(
                        Circle()
                            .stroke(Color(.systemBackground), lineWidth: 2)
                    )
                
                if !isLast {
                    Rectangle()
                        .fill(event.isCompleted ? Color.bhdPrimary.opacity(0.3) : Color.gray.opacity(0.2))
                        .frame(width: 2)
                        .frame(maxHeight: .infinity)
                }
            }
            .frame(width: 12)
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(event.status.localizedName)
                    .font(.subheadline)
                    .fontWeight(event.isCompleted ? .semibold : .regular)
                
                Text(event.localizedDescription)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if let location = event.location {
                    Label(location, systemImage: "mappin")
                        .font(.caption2)
                        .foregroundColor(.bhdPrimary)
                }
                
                Text(event.timestamp, style: .date)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, isLast ? 0 : 16)
        }
    }
}

// MARK: - Order Item Row
struct OrderItemRow: View {
    let item: OrderItem
    
    var body: some View {
        HStack(spacing: 12) {
            ProductImageView(url: item.product.thumbnail, width: 60, height: 60)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.product.localizedName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(2)
                
                Text("Qty: \(item.quantity)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(String(format: "%.3f BHD", item.total))
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
            
            Spacer()
        }
        .padding(12)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Summary Row
struct SummaryRow: View {
    let title: String
    let value: Double
    var isDiscount: Bool = false
    
    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
            Text(String(format: "%.3f BHD", value))
                .font(.subheadline)
                .fontWeight(isDiscount ? .semibold : .regular)
                .foregroundColor(isDiscount ? .green : .primary)
        }
    }
}

// MARK: - Preview
#Preview {
    NavigationStack {
        OrderDetailView(order: .sample)
    }
}
