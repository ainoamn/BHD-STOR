//
//  ProductDetailView.swift
//  BHD Marketplace
//
//  Product detail with images, description, reviews, add to cart
//

import SwiftUI

struct ProductDetailView: View {
    let product: Product
    
    @State private var selectedQuantity = 1
    @State private var selectedImageIndex = 0
    @State private var showFullDescription = false
    @State private var reviews: [ProductReview] = []
    @State private var isInWishlist = false
    @State private var showAddedToCart = false
    @State private var navigateToCart = false
    @Environment(\.dismiss) private var dismiss
    
    private var maxQuantity: Int {
        min(product.stockQuantity, 10)
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Image Carousel
                imageCarousel
                
                // Product Info
                VStack(alignment: .leading, spacing: 16) {
                    // Seller & Rating Row
                    HStack {
                        Text(product.seller.name)
                            .font(.subheadline)
                            .foregroundColor(.bhdPrimary)
                        
                        Spacer()
                        
                        HStack(spacing: 4) {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)
                            Text("\(product.displayRating) (\(product.reviewCount))")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    // Name
                    Text(product.localizedName)
                        .font(.title2)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.leading)
                    
                    // Price
                    HStack(alignment: .lastTextBaseline, spacing: 12) {
                        Text(product.displayPrice)
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.bhdPrimary)
                        
                        if let compare = product.compareAtPrice {
                            Text(String(format: "%.3f %@", compare, product.currency))
                                .font(.title3)
                                .foregroundColor(.secondary)
                                .strikethrough()
                        }
                        
                        if let discount = product.discountPercentage {
                            Text("-\(discount)%")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.red)
                                .clipShape(Capsule())
                        }
                    }
                    
                    Divider()
                    
                    // SKU & Stock
                    HStack {
                        Label("SKU: \(product.sku)", systemImage: "barcode")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        if product.isInStock {
                            Label(L("product.inStock"), systemImage: "checkmark.circle.fill")
                                .font(.caption)
                                .foregroundColor(.green)
                        } else {
                            Label(L("product.outOfStock"), systemImage: "xmark.circle.fill")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                    
                    // Attributes
                    if !product.attributes.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(L("product.specifications"))
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            ForEach(product.attributes, id: \.self) { attr in
                                HStack {
                                    let isRTL = LocalizationManager.shared.currentLanguage == "ar"
                                    Text(isRTL ? (attr.nameAr ?? attr.name) : attr.name)
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text(isRTL ? (attr.valueAr ?? attr.value) : attr.value)
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                }
                                .padding(.vertical, 4)
                                
                                Divider()
                            }
                        }
                    }
                    
                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text(L("product.description"))
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text(product.localizedDescription)
                            .font(.body)
                            .foregroundColor(.secondary)
                            .lineLimit(showFullDescription ? nil : 4)
                        
                        Button(action: { showFullDescription.toggle() }) {
                            Text(showFullDescription ? L("common.showLess") : L("common.showMore"))
                                .font(.subheadline)
                                .foregroundColor(.bhdPrimary)
                        }
                    }
                    
                    // Shipping Info
                    BHDCard {
                        HStack(spacing: 12) {
                            Image(systemName: "truck")
                                .font(.title2)
                                .foregroundColor(.bhdPrimary)
                                .frame(width: 40)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(L("product.freeShipping"))
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Text(L("product.deliveryTime"))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    
                    // Reviews Section
                    if !reviews.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text(L("product.reviews"))
                                    .font(.headline)
                                    .fontWeight(.semibold)
                                
                                Spacer()
                                
                                Text("(\(reviews.count))")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            
                            ForEach(reviews.prefix(3)) { review in
                                ReviewCard(review: review)
                            }
                        }
                    }
                }
                .padding(16)
            }
        }
        .navigationTitle(L("product.details"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { toggleWishlist() }) {
                    Image(systemName: isInWishlist ? "heart.fill" : "heart")
                        .foregroundColor(isInWishlist ? .red : .primary)
                }
            }
        }
        .overlay(
            // Bottom Bar
            VStack(spacing: 0) {
                Divider()
                
                HStack(spacing: 16) {
                    // Quantity Selector
                    if product.isInStock {
                        HStack(spacing: 0) {
                            Button(action: {
                                if selectedQuantity > 1 { selectedQuantity -= 1 }
                            }) {
                                Image(systemName: "minus")
                                    .frame(width: 36, height: 36)
                                    .foregroundColor(.primary)
                            }
                            .disabled(selectedQuantity <= 1)
                            
                            Text("\(selectedQuantity)")
                                .font(.headline)
                                .frame(minWidth: 40)
                                .multilineTextAlignment(.center)
                            
                            Button(action: {
                                if selectedQuantity < maxQuantity { selectedQuantity += 1 }
                            }) {
                                Image(systemName: "plus")
                                    .frame(width: 36, height: 36)
                                    .foregroundColor(.primary)
                            }
                            .disabled(selectedQuantity >= maxQuantity)
                        }
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    
                    // Add to Cart Button
                    BHDButton(
                        title: product.isInStock ? L("cart.add") : L("product.outOfStock"),
                        icon: "cart",
                        isDisabled: !product.isInStock,
                        action: {
                            addToCart()
                        }
                    )
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color(.systemBackground))
            }
            , alignment: .bottom
        )
        .overlay(
            // Added to Cart Toast
            Group {
                if showAddedToCart {
                    VStack {
                        AddedToCartToast(onViewCart: {
                            navigateToCart = true
                        })
                        .padding(.horizontal, 40)
                        .padding(.bottom, 100)
                        
                        Spacer()
                    }
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        )
        .onAppear {
            loadReviews()
        }
    }
    
    // MARK: - Image Carousel
    private var imageCarousel: some View {
        TabView(selection: $selectedImageIndex) {
            ForEach(Array(product.images.enumerated()), id: \.offset) { index, image in
                ProductImageView(url: image.url, width: nil, height: 350)
                    .tag(index)
            }
        }
        .tabViewStyle(PageTabViewStyle(indexDisplayMode: .always))
        .frame(height: 350)
        .background(Color.gray.opacity(0.05))
    }
    
    // MARK: - Add to Cart
    private func addToCart() {
        CartService.shared.addToCart(productId: product.id, quantity: selectedQuantity)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { _ in
                    withAnimation {
                        showAddedToCart = true
                    }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                        withAnimation {
                            showAddedToCart = false
                        }
                    }
                }
            )
            .store(in: &SubscriptionStore.shared.cancellables)
    }
    
    // MARK: - Toggle Wishlist
    private func toggleWishlist() {
        ProductService.shared.toggleWishlist(productId: product.id)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { result in
                    isInWishlist = result
                }
            )
            .store(in: &SubscriptionStore.shared.cancellables)
    }
    
    // MARK: - Load Reviews
    private func loadReviews() {
        ProductService.shared.getReviews(productId: product.id)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { reviews in
                    self.reviews = reviews
                }
            )
            .store(in: &SubscriptionStore.shared.cancellables)
    }
}

// MARK: - Review Card
struct ReviewCard: View {
    let review: ProductReview
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                // Avatar
                ZStack {
                    Circle()
                        .fill(Color.bhdPrimary.opacity(0.15))
                        .frame(width: 36, height: 36)
                    Text(String(review.user.name.prefix(1)))
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.bhdPrimary)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(review.user.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    HStack(spacing: 2) {
                        ForEach(1...5, id: \.self) { star in
                            Image(systemName: star <= review.rating ? "star.fill" : "star")
                                .font(.caption2)
                                .foregroundColor(star <= review.rating ? .yellow : .gray.opacity(0.3))
                        }
                    }
                }
                
                Spacer()
                
                Text(review.createdAt, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text(review.comment)
                .font(.subheadline)
                .foregroundColor(.primary)
                .lineLimit(3)
        }
        .padding(12)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Added to Cart Toast
struct AddedToCartToast: View {
    let onViewCart: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.title3)
                .foregroundColor(.green)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(L("cart.added"))
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(L("cart.addedMessage"))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button(action: onViewCart) {
                Text(L("cart.view"))
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.bhdPrimary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.bhdPrimary.opacity(0.1))
                    .clipShape(Capsule())
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 4)
    }
}

// MARK: - Preview
#Preview {
    NavigationStack {
        ProductDetailView(product: .sample)
    }
}
