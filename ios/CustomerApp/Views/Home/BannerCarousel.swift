//
//  BannerCarousel.swift
//  BHD Marketplace
//
//  Auto-scrolling banner carousel with pagination
//

import SwiftUI
import Combine

struct BannerCarousel: View {
    let banners: [Banner]
    let onTap: (Banner) -> Void
    
    @State private var currentIndex = 0
    @State private var timer: Timer.TimerPublisher?
    @State private var cancellable: AnyCancellable?
    
    private let autoScrollInterval: TimeInterval = 5.0
    
    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let height = min(width * 0.45, 220)
            
            TabView(selection: $currentIndex) {
                ForEach(Array(banners.enumerated()), id: \.element.id) { index, banner in
                    BannerCard(banner: banner, onTap: onTap)
                        .tag(index)
                }
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            .frame(height: height)
            .overlay(
                // Custom pagination dots
                VStack {
                    Spacer()
                    HStack(spacing: 8) {
                        ForEach(0..<banners.count, id: \.self) { index in
                            Capsule()
                                .fill(currentIndex == index ? Color.bhdPrimary : Color.white.opacity(0.6))
                                .frame(width: currentIndex == index ? 24 : 8, height: 8)
                                .animation(.spring(), value: currentIndex)
                        }
                    }
                    .padding(.bottom, 12)
                }
            )
            .onAppear {
                startAutoScroll()
            }
            .onDisappear {
                stopAutoScroll()
            }
            .onChange(of: currentIndex) { _ in
                restartAutoScroll()
            }
        }
        .frame(height: min(UIScreen.main.bounds.width * 0.45, 220))
    }
    
    private func startAutoScroll() {
        timer = Timer.publish(every: autoScrollInterval, on: .main, in: .common)
        cancellable = timer?
            .autoconnect()
            .sink { _ in
                withAnimation {
                    currentIndex = (currentIndex + 1) % banners.count
                }
            }
    }
    
    private func stopAutoScroll() {
        cancellable?.cancel()
        cancellable = nil
        timer = nil
    }
    
    private func restartAutoScroll() {
        stopAutoScroll()
        startAutoScroll()
    }
}

// MARK: - Banner Card
struct BannerCard: View {
    let banner: Banner
    let onTap: (Banner) -> Void
    
    @State private var imageLoaded = false
    
    var body: some View {
        Button(action: { onTap(banner) }) {
            ZStack(alignment: .bottomLeading) {
                // Background Image
                AsyncImage(url: URL(string: banner.image)) { phase in
                    switch phase {
                    case .empty:
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.gray.opacity(0.2))
                            .overlay(ProgressView())
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .onAppear { imageLoaded = true }
                    case .failure:
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.gray.opacity(0.2))
                            .overlay(Image(systemName: "photo").foregroundColor(.gray))
                    @unknown default:
                        EmptyView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                
                // Gradient Overlay
                LinearGradient(
                    colors: [.black.opacity(0.6), .clear],
                    startPoint: .bottom,
                    endPoint: .center
                )
                .clipShape(RoundedRectangle(cornerRadius: 16))
                
                // Text Content
                VStack(alignment: .leading, spacing: 4) {
                    Text(banner.localizedTitle)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .lineLimit(2)
                    
                    if let subtitle = banner.localizedSubtitle {
                        Text(subtitle)
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.9))
                            .lineLimit(2)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 30)
                .multilineTextAlignment(.leading)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(.horizontal, 16)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Preview
#Preview {
    BannerCarousel(
        banners: [
            Banner(
                id: "1",
                title: "Summer Sale",
                titleAr: "تخفيضات الصيف",
                subtitle: "Up to 50% off on selected items",
                subtitleAr: "خصم يصل إلى 50% على منتجات مختارة",
                image: "https://example.com/banner1.jpg",
                link: "/sale",
                linkType: .url,
                backgroundColor: nil,
                textColor: nil,
                order: 0,
                isActive: true,
                startDate: nil,
                endDate: nil
            ),
            Banner(
                id: "2",
                title: "New Electronics",
                titleAr: "إلكترونيات جديدة",
                subtitle: "Latest gadgets now available",
                subtitleAr: "أحدث الأجهزة متوفرة الآن",
                image: "https://example.com/banner2.jpg",
                link: "/category/electronics",
                linkType: .category,
                backgroundColor: nil,
                textColor: nil,
                order: 1,
                isActive: true,
                startDate: nil,
                endDate: nil
            )
        ],
        onTap: { _ in }
    )
}
