//
//  BHDCard.swift
//  BHD Marketplace
//
//  Custom card component with BHD styling
//

import SwiftUI

// MARK: - Card Style
enum BHDCardStyle {
    case `default`
    case elevated
    case outlined
    case flat
}

// MARK: - Card Component
struct BHDCard<Content: View>: View {
    let content: Content
    var style: BHDCardStyle = .default
    var padding: CGFloat = 16
    var cornerRadius: CGFloat = 16
    
    init(style: BHDCardStyle = .default, padding: CGFloat = 16, cornerRadius: CGFloat = 16, @ViewBuilder content: () -> Content) {
        self.style = style
        self.padding = padding
        self.cornerRadius = cornerRadius
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(padding)
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .shadow(
                color: shadowColor,
                radius: shadowRadius,
                x: shadowX,
                y: shadowY
            )
    }
    
    // MARK: - Styling
    private var backgroundColor: Color {
        switch style {
        case .default, .elevated, .outlined:
            return Color(.systemBackground)
        case .flat:
            return Color(.systemGray6)
        }
    }
    
    private var borderColor: Color {
        switch style {
        case .outlined:
            return Color.gray.opacity(0.2)
        default:
            return Color.clear
        }
    }
    
    private var borderWidth: CGFloat {
        switch style {
        case .outlined: return 1
        default: return 0
        }
    }
    
    private var shadowColor: Color {
        switch style {
        case .elevated:
            return .black.opacity(0.1)
        case .default:
            return .black.opacity(0.04)
        case .outlined, .flat:
            return .clear
        }
    }
    
    private var shadowRadius: CGFloat {
        switch style {
        case .elevated: return 12
        case .default: return 6
        case .outlined, .flat: return 0
        }
    }
    
    private var shadowX: CGFloat {
        switch style {
        case .elevated: return 0
        case .default: return 0
        case .outlined, .flat: return 0
        }
    }
    
    private var shadowY: CGFloat {
        switch style {
        case .elevated: return 4
        case .default: return 2
        case .outlined, .flat: return 0
        }
    }
}

// MARK: - Stats Card
struct BHDStatsCard: View {
    let title: String
    let value: String
    var subtitle: String? = nil
    var icon: String? = nil
    var iconColor: Color = .bhdPrimary
    var trend: Double? = nil
    
    var body: some View {
        BHDCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    if let icon = icon {
                        ZStack {
                            Circle()
                                .fill(iconColor.opacity(0.12))
                                .frame(width: 40, height: 40)
                            
                            Image(systemName: icon)
                                .font(.system(size: 18))
                                .foregroundColor(iconColor)
                        }
                    }
                    
                    Spacer()
                    
                    if let trend = trend {
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
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(value)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text(title)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                    
                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }
}

// MARK: - Info Row
struct BHDInfoRow: View {
    let title: String
    let value: String
    var icon: String? = nil
    var iconColor: Color = .bhdPrimary
    
    var body: some View {
        HStack(spacing: 12) {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(iconColor)
                    .frame(width: 28)
            }
            
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Section Header
struct BHDSectionHeader: View {
    let title: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil
    
    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
                .fontWeight(.bold)
            
            Spacer()
            
            if let actionTitle = actionTitle, let action = action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(.subheadline)
                        .foregroundColor(.bhdPrimary)
                }
            }
        }
    }
}

// MARK: - Badge
struct BHDBadge: View {
    let text: String
    var color: Color = .bhdPrimary
    
    var body: some View {
        Text(text)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundColor(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.12))
            .clipShape(Capsule())
    }
}

// MARK: - Preview
#Preview {
    ScrollView {
        VStack(spacing: 16) {
            // Default Card
            BHDCard {
                Text("Default Card")
                    .font(.headline)
            }
            
            // Elevated Card
            BHDCard(style: .elevated) {
                Text("Elevated Card")
                    .font(.headline)
            }
            
            // Outlined Card
            BHDCard(style: .outlined) {
                Text("Outlined Card")
                    .font(.headline)
            }
            
            // Flat Card
            BHDCard(style: .flat) {
                Text("Flat Card")
                    .font(.headline)
            }
            
            // Stats Cards
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                BHDStatsCard(
                    title: "Total Sales",
                    value: "12,450 BHD",
                    icon: "dollarsign.circle",
                    trend: 12.5
                )
                
                BHDStatsCard(
                    title: "Orders",
                    value: "348",
                    icon: "bag",
                    trend: -2.3
                )
            }
            
            // Info Row
            BHDCard {
                VStack(spacing: 12) {
                    BHDInfoRow(title: "Order Date", value: "Jan 15, 2024", icon: "calendar", iconColor: .blue)
                    BHDInfoRow(title: "Status", value: "Delivered", icon: "checkmark.circle", iconColor: .green)
                    BHDInfoRow(title: "Total", value: "125.000 BHD", icon: "dollarsign.circle", iconColor: .orange)
                }
            }
            
            // Badge
            HStack(spacing: 8) {
                BHDBadge(text: "New", color: .green)
                BHDBadge(text: "Sale", color: .red)
                BHDBadge(text: "Featured", color: .bhdPrimary)
                BHDBadge(text: "Sold Out", color: .gray)
            }
        }
        .padding()
    }
}
