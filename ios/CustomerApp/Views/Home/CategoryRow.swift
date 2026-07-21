//
//  CategoryRow.swift
//  BHD Marketplace
//
//  Horizontal scrolling category row
//

import SwiftUI

struct CategoryRow: View {
    let categories: [Category]
    let onSelect: (Category) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Text(L("home.categories"))
                    .font(.title3)
                    .fontWeight(.bold)
                
                Spacer()
                
                Button(action: { /* See all */ }) {
                    Text(L("common.seeAll"))
                        .font(.subheadline)
                        .foregroundColor(.bhdPrimary)
                }
            }
            .padding(.horizontal, 16)
            
            // Horizontal Scroll
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(categories) { category in
                        CategoryCard(category: category, onTap: onSelect)
                    }
                }
                .padding(.horizontal, 16)
            }
        }
    }
}

// MARK: - Category Card
struct CategoryCard: View {
    let category: Category
    let onTap: (Category) -> Void
    
    private let iconColors: [Color] = [
        .blue, .green, .orange, .purple, .pink, .red, .cyan, .indigo
    ]
    
    private var iconColor: Color {
        let hash = abs(category.id.hashValue)
        return iconColors[hash % iconColors.count]
    }
    
    var body: some View {
        Button(action: { onTap(category) }) {
            VStack(spacing: 10) {
                // Icon Circle
                ZStack {
                    Circle()
                        .fill(iconColor.opacity(0.15))
                        .frame(width: 64, height: 64)
                    
                    if let icon = category.icon, !icon.isEmpty {
                        Image(systemName: icon)
                            .font(.system(size: 26))
                            .foregroundColor(iconColor)
                    } else {
                        Text(String(category.localizedName.prefix(1)))
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(iconColor)
                    }
                }
                
                // Name
                Text(category.localizedName)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .frame(width: 72)
            }
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

// MARK: - Subcategory Row
struct SubcategoryRow: View {
    let subcategories: [Category]
    let selectedId: String?
    let onSelect: (Category) -> Void
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(subcategories) { sub in
                    SubcategoryPill(
                        name: sub.localizedName,
                        isSelected: sub.id == selectedId,
                        onTap: { onSelect(sub) }
                    )
                }
            }
            .padding(.horizontal, 16)
        }
    }
}

// MARK: - Subcategory Pill
struct SubcategoryPill: View {
    let name: String
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            Text(name)
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
        .animation(.easeInOut(duration: 0.2), value: isSelected)
    }
}

// MARK: - Preview
#Preview {
    CategoryRow(
        categories: [
            Category(id: "1", name: "Electronics", nameAr: "إلكترونيات", slug: "electronics", description: nil, descriptionAr: nil, icon: "laptop", image: nil, parent: nil, order: 0, isActive: true, productCount: 1250, subcategories: nil, createdAt: Date(), updatedAt: Date()),
            Category(id: "2", name: "Fashion", nameAr: "أزياء", slug: "fashion", description: nil, descriptionAr: nil, icon: "tshirt", image: nil, parent: nil, order: 1, isActive: true, productCount: 890, subcategories: nil, createdAt: Date(), updatedAt: Date()),
            Category(id: "3", name: "Home", nameAr: "منزل", slug: "home", description: nil, descriptionAr: nil, icon: "house.fill", image: nil, parent: nil, order: 2, isActive: true, productCount: 567, subcategories: nil, createdAt: Date(), updatedAt: Date()),
            Category(id: "4", name: "Sports", nameAr: "رياضة", slug: "sports", description: nil, descriptionAr: nil, icon: "sportscourt.fill", image: nil, parent: nil, order: 3, isActive: true, productCount: 432, subcategories: nil, createdAt: Date(), updatedAt: Date())
        ],
        onSelect: { _ in }
    )
}
