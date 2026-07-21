//
//  ProfileView.swift
//  BHD Marketplace
//
//  User profile screen with settings and preferences
//

import SwiftUI
import Combine

struct ProfileView: View {
    @StateObject private var authViewModel = AuthViewModel()
    @State private var showLogin = false
    @State private var showEditProfile = false
    @State private var showAddresses = false
    @State private var showLanguagePicker = false
    @State private var showLogoutConfirmation = false
    @State private var notificationsEnabled = true
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    if authViewModel.isAuthenticated, let user = authViewModel.currentUser {
                        // Authenticated Profile
                        profileHeader(user: user)
                        
                        // Orders Section
                        ordersSection
                        
                        // Account Section
                        accountSection(user: user)
                        
                        // Preferences Section
                        preferencesSection
                        
                        // Support Section
                        supportSection
                        
                        // Logout
                        Section {
                            Button(action: { showLogoutConfirmation = true }) {
                                HStack {
                                    Spacer()
                                    Text(L("profile.logout"))
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                        .foregroundColor(.red)
                                    Spacer()
                                }
                            }
                            .padding(.vertical, 8)
                        }
                        
                        // App Version
                        Text("BHD Marketplace v1.0.0")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.top, 16)
                            .padding(.bottom, 32)
                    } else {
                        // Guest Profile
                        guestProfile
                    }
                }
            }
            .navigationTitle(L("profile.title"))
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showLogin) {
                LoginView()
            }
            .alert(L("profile.logoutConfirm"), isPresented: $showLogoutConfirmation) {
                Button(L("common.cancel"), role: .cancel) {}
                Button(L("profile.logout"), role: .destructive) {
                    authViewModel.logout()
                }
            }
        }
        .onAppear {
            authViewModel.checkAuthStatus()
        }
    }
    
    // MARK: - Profile Header
    private func profileHeader(user: User) -> some View {
        VStack(spacing: 16) {
            // Avatar
            ZStack {
                if let avatar = user.avatar, let url = URL(string: avatar) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        placeholderAvatar(user: user)
                    }
                } else {
                    placeholderAvatar(user: user)
                }
            }
            .frame(width: 90, height: 90)
            .clipShape(Circle())
            .overlay(
                Circle()
                    .stroke(Color.bhdPrimary.opacity(0.2), lineWidth: 3)
            )
            
            // Name & Email
            VStack(spacing: 4) {
                Text(user.fullName)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(user.email)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if let phone = user.phone {
                    Text(phone)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Edit Profile Button
            Button(action: { showEditProfile = true }) {
                Text(L("profile.edit"))
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.bhdPrimary)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 8)
                    .background(Color.bhdPrimary.opacity(0.1))
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(
                colors: [Color.bhdPrimary.opacity(0.08), Color(.systemBackground)],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
    
    private func placeholderAvatar(user: User) -> some View {
        Circle()
            .fill(Color.bhdPrimary.opacity(0.15))
            .overlay(
                Text(user.initials)
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.bhdPrimary)
            )
    }
    
    // MARK: - Orders Section
    private var ordersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(L("profile.myOrders"))
                .font(.headline)
                .fontWeight(.semibold)
                .padding(.horizontal, 16)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 8) {
                OrderStatusButton(
                    icon: "clock",
                    title: L("order.status.pending"),
                    color: .orange
                )
                OrderStatusButton(
                    icon: "box.truck",
                    title: L("order.status.shipped"),
                    color: .cyan
                )
                OrderStatusButton(
                    icon: "checkmark.seal",
                    title: L("order.status.delivered"),
                    color: .green
                )
                OrderStatusButton(
                    icon: "arrow.counterclockwise",
                    title: L("profile.returns"),
                    color: .purple
                )
            }
            .padding(.horizontal, 16)
        }
        .padding(.vertical, 12)
    }
    
    // MARK: - Account Section
    private func accountSection(user: User) -> some View {
        ProfileSection(title: L("profile.account")) {
            ProfileMenuItem(
                icon: "person",
                iconColor: .bhdPrimary,
                title: L("profile.personalInfo"),
                action: { showEditProfile = true }
            )
            
            ProfileMenuItem(
                icon: "location.fill",
                iconColor: .red,
                title: L("profile.addresses"),
                badge: "\(user.addresses.count)",
                action: { showAddresses = true }
            )
            
            ProfileMenuItem(
                icon: "heart.fill",
                iconColor: .pink,
                title: L("profile.wishlist"),
                action: {}
            )
            
            ProfileMenuItem(
                icon: "bell.fill",
                iconColor: .orange,
                title: L("profile.notifications"),
                action: {}
            )
        }
    }
    
    // MARK: - Preferences Section
    private var preferencesSection: some View {
        ProfileSection(title: L("profile.preferences")) {
            ProfileMenuItem(
                icon: "globe",
                iconColor: .blue,
                title: L("profile.language"),
                detail: LocalizationManager.shared.currentLanguage == "ar" ? "العربية" : "English",
                action: { showLanguagePicker = true }
            )
            
            ProfileMenuItem(
                icon: "moon.fill",
                iconColor: .indigo,
                title: L("profile.darkMode"),
                action: {}
            )
            
            ProfileMenuItem(
                icon: "dollarsign.circle.fill",
                iconColor: .green,
                title: L("profile.currency"),
                detail: "BHD",
                action: {}
            )
        }
    }
    
    // MARK: - Support Section
    private var supportSection: some View {
        ProfileSection(title: L("profile.support")) {
            ProfileMenuItem(
                icon: "questionmark.circle.fill",
                iconColor: .blue,
                title: L("profile.help"),
                action: {}
            )
            
            ProfileMenuItem(
                icon: "message.fill",
                iconColor: .green,
                title: L("profile.contactUs"),
                action: {}
            )
            
            ProfileMenuItem(
                icon: "shield.fill",
                iconColor: .gray,
                title: L("profile.privacy"),
                action: {}
            )
            
            ProfileMenuItem(
                icon: "doc.text.fill",
                iconColor: .gray,
                title: L("profile.terms"),
                action: {}
            )
        }
    }
    
    // MARK: - Guest Profile
    private var guestProfile: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 60)
            
            Image(systemName: "person.circle")
                .font(.system(size: 80))
                .foregroundColor(.gray.opacity(0.4))
            
            VStack(spacing: 8) {
                Text(L("profile.guestTitle"))
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(L("profile.guestMessage"))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            
            VStack(spacing: 12) {
                BHDButton(
                    title: L("auth.login"),
                    isFullWidth: true,
                    action: { showLogin = true }
                )
                
                Button(action: {}) {
                    Text(L("auth.register"))
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.bhdPrimary)
                }
            }
            .padding(.horizontal, 40)
            
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Order Status Button
struct OrderStatusButton: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        Button(action: {}) {
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.12))
                        .frame(width: 48, height: 48)
                    
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundColor(color)
                }
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Profile Section
struct ProfileSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .fontWeight(.semibold)
                .padding(.horizontal, 16)
                .padding(.top, 8)
            
            VStack(spacing: 0) {
                content
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 16)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Profile Menu Item
struct ProfileMenuItem: View {
    let icon: String
    let iconColor: Color
    let title: String
    var detail: String? = nil
    var badge: String? = nil
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(iconColor)
                    .frame(width: 28)
                
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                if let badge = badge {
                    Text(badge)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.bhdPrimary)
                        .clipShape(Capsule())
                }
                
                if let detail = detail {
                    Text(detail)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .buttonStyle(PlainButtonStyle())
        .overlay(
            Divider()
                .padding(.leading, 56),
            alignment: .bottom
        )
    }
}

// MARK: - Preview
#Preview {
    ProfileView()
}
