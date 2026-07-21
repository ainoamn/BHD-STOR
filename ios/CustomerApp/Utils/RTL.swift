//
//  RTL.swift
//  BHD Marketplace
//
//  RTL utilities for Arabic support
//

import SwiftUI

// MARK: - RTL Helper
struct RTL {
    /// Check if current language is RTL
    static var isRTL: Bool {
        return LocalizationManager.shared.currentLanguage == "ar"
    }
    
    /// Check if locale is RTL
    static var isRTLLocale: Bool {
        return Locale.characterDirection(forLanguage: LocalizationManager.shared.currentLanguage) == .rightToLeft
    }
    
    /// Alignment that adapts to RTL
    static var leadingAlignment: Alignment {
        isRTL ? .trailing : .leading
    }
    
    static var trailingAlignment: Alignment {
        isRTL ? .leading : .trailing
    }
    
    /// Horizontal edge that adapts to RTL
    static var leadingEdge: HorizontalEdge {
        isRTL ? .trailing : .leading
    }
    
    static var trailingEdge: HorizontalEdge {
        isRTL ? .leading : .trailing
    }
    
    /// Edge insets that adapt to RTL
    static func edgeInsets(top: CGFloat = 0, leading: CGFloat = 0, bottom: CGFloat = 0, trailing: CGFloat = 0) -> EdgeInsets {
        if isRTL {
            return EdgeInsets(top: top, leading: trailing, bottom: bottom, trailing: leading)
        }
        return EdgeInsets(top: top, leading: leading, bottom: bottom, trailing: trailing)
    }
    
    /// NSLocale for layout direction
    static var layoutDirection: LayoutDirection {
        isRTL ? .rightToLeft : .leftToRight
    }
}

// MARK: - View Extensions for RTL
extension View {
    /// Apply RTL-aware padding
    func rtlPadding(_ edges: Edge.Set = .all, _ length: CGFloat) -> some View {
        self.padding(edges, length)
    }
    
    /// Flip view horizontally for RTL
    func rtlFlipped() -> some View {
        self.scaleEffect(x: RTL.isRTL ? -1 : 1, y: 1)
    }
    
    /// Mirror a view for RTL (images that need to be mirrored)
    func rtlMirrored() -> some View {
        self.scaleEffect(x: RTL.isRTL ? -1 : 1, y: 1)
    }
    
    /// Environment override for RTL preview
    func environmentRTL(_ isRTL: Bool) -> some View {
        self.environment(\.layoutDirection, isRTL ? .rightToLeft : .leftToRight)
            .environment(\.locale, Locale(identifier: isRTL ? "ar" : "en"))
    }
}

// MARK: - RTL Wrapper View
struct RTLWrapper<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .environment(\.layoutDirection, RTL.layoutDirection)
    }
}

// MARK: - RTL Preview Helpers
struct RTLPreview<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        VStack(spacing: 20) {
            // LTR
            VStack {
                Text("LTR (English)").font(.caption).foregroundColor(.secondary)
                content
                    .environment(\.layoutDirection, .leftToRight)
                    .frame(maxWidth: .infinity)
                    .border(Color.blue.opacity(0.3))
            }
            
            Divider()
            
            // RTL
            VStack {
                Text("RTL (Arabic)").font(.caption).foregroundColor(.secondary)
                content
                    .environment(\.layoutDirection, .rightToLeft)
                    .frame(maxWidth: .infinity)
                    .borderColor(.green.opacity(0.3))
            }
        }
        .padding()
    }
}

extension View {
    func borderColor(_ color: Color) -> some View {
        self.overlay(
            Rectangle()
                .stroke(color, lineWidth: 1)
        )
    }
}

// MARK: - Text Alignment Helper
extension TextAlignment {
    static var rtlAware: TextAlignment {
        RTL.isRTL ? .trailing : .leading
    }
}

// MARK: - Horizontal Edge Set
extension HorizontalEdge {
    static var rtlLeading: HorizontalEdge {
        RTL.isRTL ? .trailing : .leading
    }
    
    static var rtlTrailing: HorizontalEdge {
        RTL.isRTL ? .leading : .trailing
    }
}

// MARK: - Navigation Direction
enum NavigationDirection {
    case forward
    case back
    
    var edge: Edge {
        switch self {
        case .forward:
            return RTL.isRTL ? .leading : .trailing
        case .back:
            return RTL.isRTL ? .trailing : .leading
        }
    }
}

// MARK: - Date Formatting for RTL
extension DateFormatter {
    static var rtlDateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: LocalizationManager.shared.currentLanguage)
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }
}

// MARK: - Number Formatting for RTL
extension NumberFormatter {
    static var rtlCurrencyFormatter: NumberFormatter {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: LocalizationManager.shared.currentLanguage)
        formatter.currencyCode = "BHD"
        formatter.maximumFractionDigits = 3
        return formatter
    }
}
