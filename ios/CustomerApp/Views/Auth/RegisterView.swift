//
//  RegisterView.swift
//  BHD Marketplace
//
//  Registration screen with form validation
//

import SwiftUI

struct RegisterView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AuthViewModel()
    
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showPassword = false
    @State private var showConfirmPassword = false
    @State private var agreedToTerms = false
    @FocusState private var focusedField: Field?
    
    enum Field: CaseIterable {
        case firstName, lastName, email, phone, password, confirmPassword
        
        var next: Field? {
            let all = Field.allCases
            if let index = all.firstIndex(of: self), index + 1 < all.count {
                return all[index + 1]
            }
            return nil
        }
    }
    
    // MARK: - Validation
    private var isFormValid: Bool {
        !firstName.isEmpty &&
        !lastName.isEmpty &&
        !email.isEmpty &&
        email.contains("@") &&
        password.count >= 6 &&
        password == confirmPassword &&
        agreedToTerms
    }
    
    private var passwordStrength: PasswordStrength {
        PasswordStrength.strength(of: password)
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Header
                    headerSection
                    
                    // Form
                    formSection
                    
                    // Terms
                    termsSection
                    
                    // Submit
                    submitSection
                }
                .padding(.horizontal, 24)
            }
            .navigationTitle(L("auth.register"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(L("common.cancel")) { dismiss() }
                }
            }
            .alert(L("error.title"), isPresented: $viewModel.showError) {
                Button(L("common.ok"), role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }
    
    // MARK: - Header
    private var headerSection: some View {
        VStack(spacing: 12) {
            Spacer().frame(height: 20)
            
            ZStack {
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.bhdPrimary.opacity(0.1))
                    .frame(width: 80, height: 80)
                
                Image(systemName: "person.badge.plus")
                    .font(.system(size: 36))
                    .foregroundColor(.bhdPrimary)
            }
            
            Text(L("auth.registerTitle"))
                .font(.title)
                .fontWeight(.bold)
            
            Text(L("auth.registerSubtitle"))
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Spacer().frame(height: 12)
        }
    }
    
    // MARK: - Form
    private var formSection: some View {
        VStack(spacing: 16) {
            // First & Last Name
            HStack(spacing: 12) {
                FormField(
                    title: L("auth.firstName"),
                    icon: "person",
                    text: $firstName,
                    placeholder: L("auth.firstNamePlaceholder"),
                    focusedField: $focusedField,
                    field: .firstName
                )
                
                FormField(
                    title: L("auth.lastName"),
                    icon: "person",
                    text: $lastName,
                    placeholder: L("auth.lastNamePlaceholder"),
                    focusedField: $focusedField,
                    field: .lastName
                )
            }
            
            // Email
            FormField(
                title: L("auth.email"),
                icon: "envelope",
                text: $email,
                placeholder: "example@email.com",
                keyboardType: .emailAddress,
                focusedField: $focusedField,
                field: .email
            )
            
            // Phone
            FormField(
                title: L("auth.phone"),
                icon: "phone",
                text: $phone,
                placeholder: "+973 3600 0000",
                keyboardType: .phonePad,
                focusedField: $focusedField,
                field: .phone
            )
            
            // Password
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
                            .submitLabel(.next)
                    } else {
                        SecureField(L("auth.passwordPlaceholder"), text: $password)
                            .focused($focusedField, equals: .password)
                            .submitLabel(.next)
                    }
                    
                    Button(action: { showPassword.toggle() }) {
                        Image(systemName: showPassword ? "eye.slash" : "eye")
                            .foregroundColor(.secondary)
                    }
                }
                .padding(12)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                
                // Password Strength
                if !password.isEmpty {
                    PasswordStrengthBar(strength: passwordStrength)
                }
            }
            
            // Confirm Password
            VStack(alignment: .leading, spacing: 6) {
                Text(L("auth.confirmPassword"))
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                HStack {
                    Image(systemName: "lock")
                        .foregroundColor(.secondary)
                    
                    if showConfirmPassword {
                        TextField(L("auth.confirmPassword"), text: $confirmPassword)
                            .focused($focusedField, equals: .confirmPassword)
                            .submitLabel(.go)
                    } else {
                        SecureField(L("auth.confirmPassword"), text: $confirmPassword)
                            .focused($focusedField, equals: .confirmPassword)
                            .submitLabel(.go)
                    }
                    
                    Button(action: { showConfirmPassword.toggle() }) {
                        Image(systemName: showConfirmPassword ? "eye.slash" : "eye")
                            .foregroundColor(.secondary)
                    }
                    
                    // Match indicator
                    if !confirmPassword.isEmpty {
                        Image(systemName: password == confirmPassword ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(password == confirmPassword ? .green : .red)
                    }
                }
                .padding(12)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .onSubmit {
            if let field = focusedField, let next = field.next {
                focusedField = next
            } else if isFormValid {
                register()
            }
        }
    }
    
    // MARK: - Terms Section
    private var termsSection: some View {
        Toggle(isOn: $agreedToTerms) {
            HStack(spacing: 4) {
                Text(L("auth.agreeTo"))
                    .font(.caption)
                    .foregroundColor(.secondary)
                Button(action: {}) {
                    Text(L("auth.terms"))
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.bhdPrimary)
                }
                .buttonStyle(PlainButtonStyle())
                Text(L("auth.and"))
                    .font(.caption)
                    .foregroundColor(.secondary)
                Button(action: {}) {
                    Text(L("auth.privacy"))
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.bhdPrimary)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .toggleStyle(CheckboxToggleStyle())
        .padding(.top, 8)
    }
    
    // MARK: - Submit Section
    private var submitSection: some View {
        VStack(spacing: 16) {
            BHDButton(
                title: L("auth.register"),
                isLoading: viewModel.isLoading,
                isDisabled: !isFormValid,
                isFullWidth: true,
                action: {
                    register()
                }
            )
            .padding(.top, 8)
            
            HStack(spacing: 4) {
                Text(L("auth.haveAccount"))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Button(action: { dismiss() }) {
                    Text(L("auth.loginNow"))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.bhdPrimary)
                }
            }
            .padding(.vertical, 16)
        }
    }
    
    // MARK: - Register
    private func register() {
        let data = RegisterRequest(
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName,
            phone: phone.isEmpty ? nil : phone
        )
        viewModel.register(data: data)
    }
}

// MARK: - Form Field
struct FormField: View {
    let title: String
    let icon: String
    @Binding var text: String
    let placeholder: String
    var keyboardType: UIKeyboardType = .default
    @FocusState.Binding var focusedField: RegisterView.Field?
    let field: RegisterView.Field
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
            
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.secondary)
                
                TextField(placeholder, text: $text)
                    .keyboardType(keyboardType)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($focusedField, equals: field)
                    .submitLabel(.next)
            }
            .padding(12)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

// MARK: - Password Strength
enum PasswordStrength: CaseIterable {
    case weak, fair, good, strong
    
    static func strength(of password: String) -> PasswordStrength {
        var score = 0
        if password.count >= 8 { score += 1 }
        if password.rangeOfCharacter(from: .uppercaseLetters) != nil { score += 1 }
        if password.rangeOfCharacter(from: .lowercaseLetters) != nil { score += 1 }
        if password.rangeOfCharacter(from: .decimalDigits) != nil { score += 1 }
        if password.rangeOfCharacter(from: CharacterSet(charactersIn: "!@#$%^&*")) != nil { score += 1 }
        
        switch score {
        case 0...1: return .weak
        case 2: return .fair
        case 3...4: return .good
        default: return .strong
        }
    }
    
    var color: Color {
        switch self {
        case .weak: return .red
        case .fair: return .orange
        case .good: return .yellow
        case .strong: return .green
        }
    }
    
    var label: String {
        switch self {
        case .weak: return L("password.weak")
        case .fair: return L("password.fair")
        case .good: return L("password.good")
        case .strong: return L("password.strong")
        }
    }
}

// MARK: - Password Strength Bar
struct PasswordStrengthBar: View {
    let strength: PasswordStrength
    
    var fillWidth: CGFloat {
        let index = PasswordStrength.allCases.firstIndex(of: strength) ?? 0
        return CGFloat(index + 1) / CGFloat(PasswordStrength.allCases.count)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)
                    
                    RoundedRectangle(cornerRadius: 3)
                        .fill(strength.color)
                        .frame(width: geo.size.width * fillWidth, height: 6)
                        .animation(.easeInOut(duration: 0.3), value: strength)
                }
            }
            .frame(height: 6)
            
            Text(strength.label)
                .font(.caption2)
                .foregroundColor(strength.color)
        }
    }
}

// MARK: - Checkbox Toggle Style
struct CheckboxToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button(action: { configuration.isOn.toggle() }) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: configuration.isOn ? "checkmark.square.fill" : "square")
                    .font(.system(size: 20))
                    .foregroundColor(configuration.isOn ? .bhdPrimary : .secondary)
                
                configuration.label
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Preview
#Preview {
    RegisterView()
}
