//
//  BHDMarketplaceApp.swift
//  BHD Marketplace
//
//  @main app entry point with AppDelegate
//

import SwiftUI
import Combine

// MARK: - App Entry Point
@main
struct BHDMarketplaceApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var localizationManager = LocalizationManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.layoutDirection, localizationManager.isArabic ? .rightToLeft : .leftToRight)
                .environment(\.locale, localizationManager.locale)
                .onReceive(NotificationCenter.default.publisher(for: .languageChanged)) { _ in
                    // Trigger view update on language change
                }
        }
    }
}

// MARK: - App Delegate
class AppDelegate: NSObject, UIApplicationDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        
        // Configure appearance
        configureAppearance()
        
        // Load saved authentication
        KeychainManager.shared.loadTokens()
        
        // Request notification permissions
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { _, _ in }
        application.registerForRemoteNotifications()
        
        return true
    }
    
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        UserDefaults.standard.set(token, forKey: "device_token")
    }
    
    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        completionHandler(.newData)
    }
    
    // MARK: - Appearance Configuration
    private func configureAppearance() {
        // Navigation Bar
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
        
        // Tab Bar
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithDefaultBackground()
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
        
        // Tab Bar item appearance
        let itemAppearance = UITabBarItemAppearance()
        itemAppearance.normal.iconColor = .secondaryLabel
        itemAppearance.normal.titleTextAttributes = [.foregroundColor: UIColor.secondaryLabel]
        itemAppearance.selected.iconColor = UIColor(Color.bhdPrimary)
        itemAppearance.selected.titleTextAttributes = [.foregroundColor: UIColor(Color.bhdPrimary)]
        tabAppearance.inlineLayoutAppearance = itemAppearance
        tabAppearance.stackedLayoutAppearance = itemAppearance
        tabAppearance.compactInlineLayoutAppearance = itemAppearance
        
        // Search Bar
        let searchAppearance = UISearchBar.appearance()
        searchAppearance.tintColor = UIColor(Color.bhdPrimary)
    }
}

// MARK: - Color Extensions
extension Color {
    /// Primary brand color - inspired by Bahrain flag (red)
    static let bhdPrimary = Color(red: 0.78, green: 0.13, blue: 0.18)
    
    /// Secondary brand color
    static let bhdSecondary = Color(red: 0.12, green: 0.29, blue: 0.49)
    
    /// Accent color for highlights
    static let bhdAccent = Color(red: 1.0, green: 0.76, blue: 0.03)
    
    /// Success color
    static let bhdSuccess = Color(red: 0.20, green: 0.78, blue: 0.35)
    
    /// Background colors
    static let bhdBackground = Color(UIColor.systemBackground)
    static let bhdSecondaryBackground = Color(UIColor.secondarySystemBackground)
    static let bhdGroupedBackground = Color(UIColor.systemGroupedBackground)
    
    /// Surface color for cards
    static let bhdSurface = Color(UIColor.systemBackground)
    
    /// Text colors
    static let bhdTextPrimary = Color(UIColor.label)
    static let bhdTextSecondary = Color(UIColor.secondaryLabel)
    static let bhdTextTertiary = Color(UIColor.tertiaryLabel)
}

// MARK: - Notification Name
extension Notification.Name {
    static let cartUpdated = Notification.Name("cartUpdated")
    static let orderPlaced = Notification.Name("orderPlaced")
}
