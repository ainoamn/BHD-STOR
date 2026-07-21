//
//  ContentView.swift
//  BHD Marketplace
//
//  Root view with TabView
//

import SwiftUI

struct ContentView: View {
    @StateObject private var cartService = CartService.shared
    @StateObject private var localizationManager = LocalizationManager.shared
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Home Tab
            HomeView()
                .tabItem {
                    Label(L("tab.home"), systemImage: "house.fill")
                }
                .tag(0)
            
            // Search Tab
            SearchView()
                .tabItem {
                    Label(L("tab.search"), systemImage: "magnifyingglass")
                }
                .tag(1)
            
            // Cart Tab
            CartView()
                .tabItem {
                    Label {
                        Text(L("tab.cart"))
                    } icon: {
                        Image(systemName: "cart.fill")
                    }
                    .badge(cartService.itemCount)
                }
                .tag(2)
            
            // Orders Tab
            OrdersView()
                .tabItem {
                    Label(L("tab.orders"), systemImage: "bag.fill")
                }
                .tag(3)
            
            // Profile Tab
            ProfileView()
                .tabItem {
                    Label(L("tab.profile"), systemImage: "person.fill")
                }
                .tag(4)
        }
        .tint(.bhdPrimary)
        .environment(\.layoutDirection, localizationManager.isArabic ? .rightToLeft : .leftToRight)
    }
}

// MARK: - Root View Modifier
struct RootViewModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
    }
}

// MARK: - Preview
#Preview {
    ContentView()
}
