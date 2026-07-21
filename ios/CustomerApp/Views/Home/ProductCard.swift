//
//  ProductCard.swift
//  BHD Marketplace
//
//  Product card with image, price, rating, and quick actions
//

import SwiftUI

struct ProductCard: View {
    let product: Product
    let onTap: () -> Void
    let onAddToCart: () -> Void
    let onToggleWishlist: (() -> Void)?
    let isInWishlist: Bool
    
    @State private var imageLoaded = false
    @State private var isPressed = false
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 0) {
                // Image
                ZStack(alignment: .topTrailing) {
                    ProductImageView(
                        url: product.thumbnail ?? product.images.first?.url,
                        width: nil,
                        height: 160
                    )
                    
                    // Wishlist Button
                    if let onToggleWishlist = onToggleWishlist {
                        Button(action: onToggleWishlist) {
                            Image(systemName: isInWishlist ? "heart.fill" : "heart")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(isInWishlist ? .red : .white)
                                .frame(width: 32, height: 32)
                                .background(
                                    Circle()
                                        .fill(isInWishlist ? Color.white : Color.black.opacity(0.4))
                                )
                        }
                        .buttonStyle(PlainButtonStyle())
                        .padding(8)
                    }
                    
                    // Discount Badge
                    if let discount = product.discountPercentage {
                        VStack {
                            Text("-\(discount)%")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.red)
                                .cornerRadius(8, corners: [.topLeft, .bottomRight])
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    }
                    
                    // Out of Stock Overlay
                    if !product.isInStock {
                        Rectangle()
                            .fill(Color.black.opacity(0.5))
                            .overlay(
                                Text(L("product.outOfStock"))
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                            )
                    }
                }
                .frame(height: 160)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                
                // Info
                VStack(alignment: .leading, spacing: 6) {
                    // Seller
                    Text(product.seller.name)
                        .font(.caption2)
                        .foregroundColor(.bhdPrimary)
                        .lineLimit(1)
                    
                    // Product Name
                    Text(product.localizedName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                        .frame(minHeight: 38, alignment: .top)
                    
                    // Rating
                    HStack(spacing: 4) {
                        Image(systemName: "star.fill")
                            .font(.caption)
                            .foregroundColor(.yellow)
                        Text(product.displayRating)
                            .font(.caption)
                            .fontWeight(.medium)
                        Text("(\(product.reviewCount))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    // Price Row
                    HStack(alignment: .lastTextBaseline, spacing: 6) {
                        Text(product.displayPrice)
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        if let comparePrice = product.compareAtPrice {
                            Text(String(format: "%.3f %@", comparePrice, product.currency))
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .strikethrough()
                        }
                        
                        Spacer()
                        
                        // Add to Cart Button
                        if product.isInStock {
                            Button(action: onAddToCart) {
                                Image(systemName: "cart.badge.plus")
                                    .font(.system(size: 16))
                                    .foregroundColor(.white)
                                    .frame(width: 32, height: 32)
                                    .background(Color.bhdPrimary)
                                    .clipShape(Circle())
                            }
                            .buttonStyle(ScaleButtonStyle())
                        }
                    }
                }
                .padding(10)
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
            .scaleEffect(isPressed ? 0.97 : 1.0)
        }
        .buttonStyle(PressButtonStyle(isPressed: $isPressed))
    }
}

// MARK: - Product Image View (Reusable)
struct ProductImageView: View {
    let url: String?
    let width: CGFloat?
    let height: CGFloat
    
    var body: some View {
        Group {
            if let urlString = url, let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        placeholder
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    case .failure:
                        errorPlaceholder
                    @unknown default:
                        placeholder
                    }
                }
            } else {
                errorPlaceholder
            }
        }
        .frame(width: width, height: height)
        .clipped()
    }
    
    private var placeholder: some View {
        RoundedRectangle(cornerRadius: 0)
            .fill(Color.gray.opacity(0.1))
            .overlay(
                Image(systemName: "photo")
                    .font(.largeTitle)
                    .foregroundColor(.gray.opacity(0.3))
            )
    }
    
    private var errorPlaceholder: some View {
        RoundedRectangle(cornerRadius: 0)
            .fill(Color.gray.opacity(0.1))
            .overlay(
                VStack(spacing: 4) {
                    Image(systemName: "photo")
                        .font(.title2)
                        .foregroundColor(.gray.opacity(0.4))
                    Text(L("product.noImage"))
                        .font(.caption)
                        .foregroundColor(.gray.opacity(0.5))
                }
            )
    }
}

// MARK: - Horizontal Product Card
struct ProductCardHorizontal: View {
    let product: Product
    let onTap: () -> Void
    let onAddToCart: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Image
                ProductImageView(url: product.thumbnail, width: 100, height: 100)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                
                // Info
                VStack(alignment: .leading, spacing: 6) {
                    Text(product.seller.name)
                        .font(.caption2)
                        .foregroundColor(.bhdPrimary)
                    
                    Text(product.localizedName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                        .lineLimit(2)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "star.fill")
                            .font(.caption)
                            .foregroundColor(.yellow)
                        Text(product.displayRating)
                            .font(.caption)
                    }
                    
                    Text(product.displayPrice)
                        .font(.subheadline)
                        .fontWeight(.bold)
                }
                
                Spacer()
                
                // Add to Cart
                if product.isInStock {
                    Button(action: onAddToCart) {
                        Image(systemName: "plus")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 36, height: 36)
                            .background(Color.bhdPrimary)
                            .clipShape(Circle())
                    }
                    .buttonStyle(ScaleButtonStyle())
                }
            }
            .padding(10)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Press Button Style
struct PressButtonStyle: ButtonStyle {
    @Binding var isPressed: Bool
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .onChange(of: configuration.isPressed) { isPressed = $0 }
    }
}

// MARK: - Scale Button Style
struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.92 : 1.0)
            .animation(.easeOut(duration: 0.2), value: configuration.isPressed)
    }
}

// MARK: - Corner Radius Extension
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners
    
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

// MARK: - Preview
#Preview {
    ProductCard(
        product: .sample,
        onTap: {},
        onAddToCart: {},
        onToggleWishlist: {},
        isInWishlist: false
    )
    .frame(width: 200)
    .padding()
}
