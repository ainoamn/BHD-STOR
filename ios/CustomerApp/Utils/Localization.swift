//
//  Localization.swift
//  BHD Marketplace
//
//  Localization manager for bilingual support (EN/AR)
//

import Foundation
import SwiftUI

// MARK: - Localization Manager
final class LocalizationManager: ObservableObject {
    static let shared = LocalizationManager()
    
    @Published var currentLanguage: String {
        didSet {
            UserDefaults.standard.set(currentLanguage, forKey: "app_language")
            UserDefaults.standard.set([currentLanguage], forKey: "AppleLanguages")
            updateBundle()
            NotificationCenter.default.post(name: .languageChanged, object: nil)
        }
    }
    
    private var localizedBundle: Bundle = .main
    
    private init() {
        // Load saved language or default to device language
        if let saved = UserDefaults.standard.string(forKey: "app_language"),
           saved == "en" || saved == "ar" {
            currentLanguage = saved
        } else {
            // Check device language
            let preferred = Locale.preferredLanguages.first ?? "en"
            currentLanguage = preferred.hasPrefix("ar") ? "ar" : "en"
        }
        
        updateBundle()
    }
    
    /// Toggle between English and Arabic
    func toggleLanguage() {
        currentLanguage = (currentLanguage == "en") ? "ar" : "en"
    }
    
    /// Set specific language
    func setLanguage(_ language: String) {
        guard language == "en" || language == "ar" else { return }
        currentLanguage = language
    }
    
    /// Get localized string
    func string(_ key: String) -> String {
        let localized = localizedBundle.localizedString(forKey: key, value: nil, table: nil)
        // Fallback to English if not found
        if localized == key, currentLanguage != "en" {
            if let enPath = Bundle.main.path(forResource: "en", ofType: "lproj"),
               let enBundle = Bundle(path: enPath) {
                return enBundle.localizedString(forKey: key, value: key, table: nil)
            }
        }
        return localized
    }
    
    /// Get localized string with format
    func string(format key: String, _ arguments: CVarArg...) -> String {
        let template = string(key)
        return String(format: template, arguments: arguments)
    }
    
    /// Update the bundle for current language
    private func updateBundle() {
        if let path = Bundle.main.path(forResource: currentLanguage, ofType: "lproj"),
           let bundle = Bundle(path: path) {
            localizedBundle = bundle
        } else {
            localizedBundle = .main
        }
    }
    
    /// Check if current language is Arabic
    var isArabic: Bool {
        return currentLanguage == "ar"
    }
    
    /// Get locale for current language
    var locale: Locale {
        return Locale(identifier: currentLanguage)
    }
}

// MARK: - Global L() function
func L(_ key: String) -> String {
    return LocalizationManager.shared.string(key)
}

func L(_ key: String, _ arguments: CVarArg...) -> String {
    return LocalizationManager.shared.string(format: key, arguments)
}

// MARK: - Notification Name
extension Notification.Name {
    static let languageChanged = Notification.Name("languageChanged")
}

// MARK: - View Extension for Localization
extension View {
    /// Apply current language environment
    func localized() -> some View {
        self.environment(\.locale, LocalizationManager.shared.locale)
            .environment(\.layoutDirection, LocalizationManager.shared.isArabic ? .rightToLeft : .leftToRight)
    }
    
    /// Listen for language changes
    func onLanguageChange(perform action: @escaping () -> Void) -> some View {
        self.onReceive(NotificationCenter.default.publisher(for: .languageChanged)) { _ in
            action()
        }
    }
}

// MARK: - String Extension for Localization
extension String {
    var localized: String {
        return LocalizationManager.shared.string(self)
    }
    
    func localized(_ arguments: CVarArg...) -> String {
        return LocalizationManager.shared.string(format: self, arguments)
    }
}

// MARK: - Supported Languages
enum AppLanguage: String, CaseIterable, Identifiable {
    case english = "en"
    case arabic = "ar"
    
    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .english: return "English"
        case .arabic: return "العربية"
        }
    }
    
    var localeIdentifier: String {
        rawValue
    }
    
    var isRTL: Bool {
        self == .arabic
    }
}
