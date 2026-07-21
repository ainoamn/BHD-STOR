//
//  LoginView.swift
//  BHD Marketplace
//
//  Login screen with email/password and social login
//

import SwiftUI

struct LoginView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AuthViewModel()
    
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var showRegister = false
    @State private var showForgotPassword = false
    @FocusState private var focusedField: Field?
    
    enum Field {
        case email, password
    }
    
    private var isFormValid: Bool {
        !email.isEmpty && email.contains("@") && password.count >= 6
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Header
                    headerSection
                    
                    // Form
                    formSection
                    
                    // Social Login
                    socialLoginSection
                    
                    // Register Link
                    registerLinkSection
                }
                .padding(.horizontal, 24)
            }
            .navigationTitle(L("auth.login"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(L("common.cancel")) { dismiss() }
                }
            }
            .sheet(isPresented: $showRegister) {
                RegisterView()
            }
            .sheet(isPresented: $showForgotPassword) {
                ForgotPasswordView()
            }
            .alert(L("error.title"), isPresented: $viewModel.showError) {
                Button(L("common.ok"), role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 12) {
            Spacer().frame(height: 20)
            
            // Logo
            ZStack {
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.bhdPrimary.opacity(0.1))
                    .frame(width: 80, height: 80)
                
                Image(systemName: "bag.fill")
                    .font(.system(size: 36))
                    .foregroundColor(.bhdPrimary)
            }
            
            Text(L("app.name"))
                .font(.title)
                .fontWeight(.bold)
            
            Text(L("auth.loginSubtitle"))
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Spacer().frame(height: 20)
        }
    }
    
    // MARK: - Form Section
    private var formSection: some View {
        VStack(spacing: 16) {
            // Email Field
            VStack(alignment: .leading, spacing: 6) {
                Text(L("auth.email"))
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                HStack {
                    Image(systemName: "envelope")
                        .foregroundColor(.secondary)
                    
                    TextField("example@email.com", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($focusedField, equals: .email)
                        .submitLabel(.next)
                }
                .padding(12)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            
            // Password Field
            VStack(alignment: .leading, spacing: 6) {
                Text(L("auth.password"))
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                HStack {
                    Image(systemName: "lock")
                        .foregroundColor(.secondary)
                    
                    if showPassword {
                        TextField(L("auth.passwordPlaceholder"), text: $password)
                            .focused($focusedField, equals: .password)
                            .submitLabel(.go)
                    } else {
                        SecureField(L("auth.passwordPlaceholder"), text: $password)
                            .focused($focusedField, equals: .password)
                            .submitLabel(.go)
                    }
                    
                    Button(action: { showPassword.toggle() }) {
                        Image(systemName: showPassword ? "eye.slash" : "eye")
                            .foregroundColor(.secondary)
                    }
                }
                .padding(12)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            
            // Forgot Password
            HStack {
                Spacer()
                Button(action: { showForgotPassword = true }) {
                    Text(L("auth.forgotPassword"))
                        .font(.subheadline)
                        .foregroundColor(.bhdPrimary)
                }
            }
            
            // Login Button
            BHDButton(
                title: L("auth.login"),
                isLoading: viewModel.isLoading,
                isDisabled: !isFormValid,
                isFullWidth: true,
                action: {
                    viewModel.login(email: email, password: password)
                }
            )
            .padding(.top, 8)
            .onSubmit {
                if focusedField == .email {
                    focusedField = .password
                } else if focusedField == .password && isFormValid {
                    viewModel.login(email: email, password: password)
                }
            }
        }
    }
    
    // MARK: - Social Login Section
    private var socialLoginSection: some View {
        VStack(spacing: 16) {
            // Divider with "OR"
            HStack(spacing: 12) {
                Divider()
                Text(L("auth.or"))
                    .font(.caption)
                    .foregroundColor(.secondary)
                Divider()
            }
            .padding(.vertical, 8)
            
            // Social Buttons
            VStack(spacing: 12) {
                SocialLoginButton(
                    icon: "apple.logo",
                    title: L("auth.apple"),
                    backgroundColor: .black,
                    foregroundColor: .white,
                    action: {}
                )
                
                SocialLoginButton(
                    icon: "g.circle.fill",
                    title: L("auth.google"),
                    backgroundColor: .white,
                    foregroundColor: .primary,
                    borderColor: .gray.opacity(0.3),
                    action: {}
                )
            }
        }
        .padding(.top, 8)
    }
    
    // MARK: - Register Link Section
    private var registerLinkSection: some View {
        HStack(spacing: 4) {
            Text(L("auth.noAccount"))
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Button(action: { showRegister = true }) {
                Text(L("auth.registerNow"))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.bhdPrimary)
            }
        }
        .padding(.vertical, 24)
    }
}

// MARK: - Social Login Button
struct SocialLoginButton: View {
    let icon: String
    let title: String
    var backgroundColor: Color
    var foregroundColor: Color
    var borderColor: Color? = nil
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .foregroundColor(foregroundColor)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(borderColor ?? Color.clear, lineWidth: borderColor != nil ? 1 : 0)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Forgot Password View
struct ForgotPasswordView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var isLoading = false
    @State private var showSuccess = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer().frame(height: 40)
                
                Image(systemName: "envelope.badge.shield.half.filled")
                    .font(.system(size: 60))
                    .foregroundColor(.bhdPrimary)
                
                VStack(spacing: 8) {
                    Text(L("auth.forgotTitle"))
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text(L("auth.forgotMessage"))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text(L("auth.email"))
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Image(systemName: "envelope")
                            .foregroundColor(.secondary)
                        TextField("example@email.com", text: $email)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                    }
                    .padding(12)
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .padding(.horizontal, 24)
                
                if showSuccess {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text(L("auth.resetSent"))
                            .font(.subheadline)
                            .foregroundColor(.green)
                    }
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 24)
                }
                
                BHDButton(
                    title: L("auth.sendReset"),
                    isLoading: isLoading,
                    isDisabled: email.isEmpty || !email.contains("@"),
                    isFullWidth: true,
                    action: {
                        sendReset()
                    }
                )
                .padding(.horizontal, 24)
                
                Spacer()
            }
            .navigationTitle(L("auth.forgotPassword"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(L("common.cancel")) { dismiss() }
                }
            }
        }
    }
    
    private func sendReset() {
        isLoading = true
        AuthService.shared.resetPassword(email: email)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in
                    isLoading = false
                },
                receiveValue: {
                    showSuccess = true
                }
            )
            .store(in: &SubscriptionStore.shared.cancellables)
    }
}

// MARK: - Preview
#Preview {
    LoginView()
}
