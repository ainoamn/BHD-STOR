//
//  User.swift
//  BHD Marketplace
//
//  User model with profile support
//

import Foundation

// MARK: - User
struct User: Identifiable, Codable {
    let id: String
    let email: String
    let firstName: String
    let lastName: String
    let phone: String?
    let avatar: String?
    let role: UserRole
    let addresses: [ShippingAddress]
    let preferences: UserPreferences?
    let wishlist: [String]?
    let isActive: Bool
    let emailVerified: Bool
    let phoneVerified: Bool
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case email, firstName, lastName, phone, avatar
        case role, addresses, preferences, wishlist
        case isActive, emailVerified, phoneVerified
        case createdAt, updatedAt
    }
    
    var fullName: String {
        return "\(firstName) \(lastName)"
    }
    
    var initials: String {
        let first = String(firstName.prefix(1)).uppercased()
        let last = String(lastName.prefix(1)).uppercased()
        return first + last
    }
    
    var primaryAddress: ShippingAddress? {
        return addresses.first(where: { $0.isDefault }) ?? addresses.first
    }
}

// MARK: - User Role
enum UserRole: String, Codable {
    case customer
    case seller
    case admin
    case moderator
}

// MARK: - User Preferences
struct UserPreferences: Codable {
    let language: String
    let currency: String
    let notificationsEnabled: Bool
    let darkMode: Bool?
    
    static let `default` = UserPreferences(
        language: "en",
        currency: "BHD",
        notificationsEnabled: true,
        darkMode: nil
    )
}

// MARK: - Login Request
struct LoginRequest: Codable {
    let email: String
    let password: String
    let deviceToken: String?
}

// MARK: - Register Request
struct RegisterRequest: Codable {
    let email: String
    let password: String
    let firstName: String
    let lastName: String
    let phone: String?
}

// MARK: - Auth Response
struct AuthResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
    let user: User
}

// MARK: - Refresh Token Request
struct RefreshTokenRequest: Codable {
    let refreshToken: String
}

// MARK: - Update Profile Request
struct UpdateProfileRequest: Codable {
    let firstName: String?
    let lastName: String?
    let phone: String?
    let avatar: String?
}

// MARK: - Change Password Request
struct ChangePasswordRequest: Codable {
    let currentPassword: String
    let newPassword: String
}

// MARK: - Password Reset Request
struct PasswordResetRequest: Codable {
    let email: String
}

// MARK: - Verify OTP Request
struct VerifyOTPRequest: Codable {
    let email: String
    let otp: String
}
