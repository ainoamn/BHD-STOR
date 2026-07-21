//
//  BHDSellerApp.swift
//  BHD Seller Dashboard
//
//  Seller app entry point
//

import SwiftUI

// MARK: - App Entry Point
@main
struct BHDSellerApp: App {
    @UIApplicationDelegateAdaptor(SellerAppDelegate.self) var appDelegate
    
    var body: some Scene {
        WindowGroup {
            SellerRootView()
        }
    }
}

// MARK: - App Delegate
class SellerAppDelegate: NSObject, UIApplicationDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        configureAppearance()
        KeychainManager.shared.loadTokens()
        return true
    }
    
    // MARK: - Appearance Configuration
    private func configureAppearance() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithDefaultBackground()
        appearance.backgroundColor = .systemBackground
        appearance.titleTextAttributes = [
            .foregroundColor: UIColor.label,
            .font: UIFont.systemFont(ofSize: 18, weight: .semibold)
        ]
        appearance.largeTitleTextAttributes = [
            .foregroundColor: UIColor.label,
            .font: UIFont.systemFont(ofSize: 32, weight: .bold)
        ]
        
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithDefaultBackground()
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
    }
}

// MARK: - Root View
struct SellerRootView: View {
    @State private var selectedTab = 0
    @State private var isAuthenticated = true // Set to false in production
    
    var body: some View {
        if isAuthenticated {
            TabView(selection: $selectedTab) {
                DashboardView()
                    .tabItem {
                        Label("Dashboard", systemImage: "square.grid.2x2.fill")
                    }
                    .tag(0)
                
                SellerOrdersView()
                    .tabItem {
                        Label("Orders", systemImage: "bag.fill")
                    }
                    .tag(1)
                
                SellerProductsView()
                    .tabItem {
                        Label("Products", systemImage: "cube.fill")
                    }
                    .tag(2)
                
                AnalyticsView()
                    .tabItem {
                        Label("Analytics", systemImage: "chart.bar.fill")
                    }
                    .tag(3)
            }
            .tint(.bhdSellerPrimary)
        } else {
            SellerLoginView()
        }
    }
}

// MARK: - Seller Login View
struct SellerLoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                
                // Logo
                VStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 20)
                            .fill(Color.bhdSellerPrimary.opacity(0.1))
                            .frame(width: 80, height: 80)
                        
                        Image(systemName: "storefront.fill")
                            .font(.system(size: 36))
                            .foregroundColor(.bhdSellerPrimary)
                    }
                    
                    Text("BHD Seller")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Seller Dashboard")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer().frame(height: 40)
                
                // Login Form
                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .padding()
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    
                    SecureField("Password", text: $password)
                        .padding()
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    
                    Button(action: {
                        isLoading = true
                    }) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            }
                            Text("Login")
                                .font(.headline)
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.bhdSellerPrimary)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                }
                .padding(.horizontal, 24)
                
                Spacer()
            }
        }
    }
}

// MARK: - Seller Colors
extension Color {
    /// Primary brand color for seller app
    static let bhdSellerPrimary = Color(red: 0.12, green: 0.35, blue: 0.60)
    
    /// Secondary color
    static let bhdSellerSecondary = Color(red: 0.30, green: 0.55, blue: 0.85)
    
    /// Chart colors
    static let chartBlue = Color(red: 0.20, green: 0.40, blue: 0.80)
    static let chartGreen = Color(red: 0.20, green: 0.75, blue: 0.35)
    static let chartOrange = Color(red: 0.95, green: 0.55, blue: 0.15)
    static let chartPurple = Color(red: 0.60, green: 0.25, blue: 0.80)
    static let chartRed = Color(red: 0.90, green: 0.25, blue: 0.25)
    static let chartCyan = Color(red: 0.10, green: 0.65, blue: 0.80)
}
