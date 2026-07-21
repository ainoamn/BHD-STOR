//
//  BHDButton.swift
//  BHD Marketplace
//
//  Custom button with BHD branding
//

import SwiftUI

enum BHDButtonStyle {
    case primary
    case secondary
    case outline
    case ghost
    case danger
}

struct BHDButton: View {
    let title: String
    var icon: String? = nil
    var style: BHDButtonStyle = .primary
    var isLoading: Bool = false
    var isDisabled: Bool = false
    var isFullWidth: Bool = false
    var height: CGFloat = 52
    var action: () -> Void
    
    var body: some View {
        Button(action: {
            if !isLoading && !isDisabled {
                HapticManager.shared.light()
                action()
            }
        }) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: foregroundColor))
                        .scaleEffect(0.8)
                } else if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .semibold))
                }
                
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
            }
            .foregroundColor(foregroundColor)
            .frame(maxWidth: isFullWidth ? .infinity : nil)
            .frame(height: height)
            .padding(.horizontal, isFullWidth ? 0 : 24)
            .background(backgroundView)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .opacity(isDisabled && !isLoading ? 0.5 : 1.0)
        }
        .buttonStyle(BHDButtonPressStyle())
        .disabled(isDisabled || isLoading)
    }
    
    // MARK: - Colors
    private var foregroundColor: Color {
        switch style {
        case .primary: return .white
        case .secondary: return .bhdPrimary
        case .outline: return .bhdPrimary
        case .ghost: return .bhdPrimary
        case .danger: return .white
        }
    }
    
    private var backgroundView: some View {
        switch style {
        case .primary:
            return LinearGradient(
                colors: [.bhdPrimary, .bhdPrimary.opacity(0.9)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ).eraseToAnyView()
        case .secondary:
            return Color.bhdPrimary.opacity(0.1).eraseToAnyView()
        case .outline:
            return Color.clear.eraseToAnyView()
        case .ghost:
            return Color.clear.eraseToAnyView()
        case .danger:
            return Color.red.eraseToAnyView()
        }
    }
    
    private var borderColor: Color {
        switch style {
        case .primary: return .clear
        case .secondary: return .clear
        case .outline: return .bhdPrimary
        case .ghost: return .clear
        case .danger: return .clear
        }
    }
    
    private var borderWidth: CGFloat {
        switch style {
        case .outline: return 1.5
        default: return 0
        }
    }
}

// MARK: - Button Press Style
struct BHDButtonPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: - View Eraser Helper
extension View {
    func eraseToAnyView() -> AnyView {
        AnyView(self)
    }
}

// MARK: - Small Button
struct BHDSmallButton: View {
    let title: String
    var icon: String? = nil
    var style: BHDButtonStyle = .primary
    var action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.caption)
                }
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .foregroundColor(style == .primary ? .white : .bhdPrimary)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(
                style == .primary ? Color.bhdPrimary : Color.bhdPrimary.opacity(0.1)
            )
            .clipShape(Capsule())
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

// MARK: - Icon Button
struct BHDIconButton: View {
    let icon: String
    var size: CGFloat = 44
    var backgroundColor: Color = Color(.systemGray6)
    var foregroundColor: Color = .primary
    var action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: size * 0.4, weight: .medium))
                .foregroundColor(foregroundColor)
                .frame(width: size, height: size)
                .background(backgroundColor)
                .clipShape(Circle())
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

// MARK: - Preview
#Preview {
    VStack(spacing: 16) {
        BHDButton(title: "Primary Button", icon: "cart", action: {})
        BHDButton(title: "Secondary Button", style: .secondary, action: {})
        BHDButton(title: "Outline Button", style: .outline, action: {})
        BHDButton(title: "Ghost Button", style: .ghost, action: {})
        BHDButton(title: "Danger Button", style: .danger, action: {})
        BHDButton(title: "Loading", isLoading: true, action: {})
        BHDButton(title: "Disabled", isDisabled: true, action: {})
        
        HStack(spacing: 12) {
            BHDSmallButton(title: "Small", action: {})
            BHDSmallButton(title: "Small Outline", style: .outline, action: {})
        }
        
        HStack(spacing: 12) {
            BHDIconButton(icon: "heart", action: {})
            BHDIconButton(icon: "share", backgroundColor: .bhdPrimary.opacity(0.1), foregroundColor: .bhdPrimary, action: {})
        }
    }
    .padding()
}
