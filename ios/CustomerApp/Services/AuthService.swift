//
//  AuthService.swift
//  BHD Marketplace
//
//  Authentication service with Combine
//

import Foundation
import Combine

// MARK: - Auth Service Protocol
protocol AuthServiceProtocol {
    func login(email: String, password: String, deviceToken: String?) -> AnyPublisher<User, APIError>
    func register(data: RegisterRequest) -> AnyPublisher<User, APIError>
    func logout() -> AnyPublisher<Void, APIError>
    func refreshToken() -> AnyPublisher<Void, APIError>
    func getCurrentUser() -> AnyPublisher<User, APIError>
    func updateProfile(data: UpdateProfileRequest) -> AnyPublisher<User, APIError>
    func changePassword(data: ChangePasswordRequest) -> AnyPublisher<Void, APIError>
    func resetPassword(email: String) -> AnyPublisher<Void, APIError>
    func verifyOTP(email: String, otp: String) -> AnyPublisher<Void, APIError>
    func deleteAccount() -> AnyPublisher<Void, APIError>
}

// MARK: - Auth Service
final class AuthService: AuthServiceProtocol {
    static let shared = AuthService()
    
    private let api = APIService.shared
    private let keychain = KeychainManager.shared
    private var cancellables = Set<AnyCancellable>()
    
    // Published auth state
    @Published private(set) var currentUser: User?
    @Published private(set) var isAuthenticated: Bool = false
    @Published private(set) var isLoading: Bool = false
    @Published private(set) var authError: APIError?
    
    private init() {
        // Sync auth state with keychain
        keychain.$accessToken
            .map { $0 != nil }
            .assign(to: &$isAuthenticated)
        
        // Load user on init if token exists
        if keychain.isAuthenticated {
            getCurrentUser()
                .receive(on: DispatchQueue.main)
                .sink(receiveCompletion: { _ in }, receiveValue: { [weak self] user in
                    self?.currentUser = user
                })
                .store(in: &cancellables)
        }
    }
    
    // MARK: - Login
    func login(email: String, password: String, deviceToken: String? = nil) -> AnyPublisher<User, APIError> {
        isLoading = true
        authError = nil
        
        let request = LoginRequest(
            email: email,
            password: password,
            deviceToken: deviceToken
        )
        
        return api.request(
            endpoint: "/auth/login",
            method: .post,
            body: request,
            requiresAuth: false
        )
        .handleEvents(
            receiveOutput: { [weak self] (response: AuthResponse) in
                self?.keychain.configure(
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken
                )
                self?.currentUser = response.user
            },
            receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            }
        )
        .map { (response: AuthResponse) -> User in
            response.user
        }
        .catch { [weak self] error -> AnyPublisher<User, APIError> in
            self?.authError = error
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Register
    func register(data: RegisterRequest) -> AnyPublisher<User, APIError> {
        isLoading = true
        authError = nil
        
        return api.request(
            endpoint: "/auth/register",
            method: .post,
            body: data,
            requiresAuth: false
        )
        .handleEvents(
            receiveOutput: { [weak self] (response: AuthResponse) in
                self?.keychain.configure(
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken
                )
                self?.currentUser = response.user
            },
            receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            }
        )
        .map { (response: AuthResponse) -> User in
            response.user
        }
        .catch { [weak self] error -> AnyPublisher<User, APIError> in
            self?.authError = error
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Logout
    func logout() -> AnyPublisher<Void, APIError> {
        isLoading = true
        
        return api.logout()
            .handleEvents(
                receiveCompletion: { [weak self] _ in
                    DispatchQueue.main.async {
                        self?.currentUser = nil
                        self?.isAuthenticated = false
                        self?.isLoading = false
                        self?.authError = nil
                    }
                }
            )
            .eraseToAnyPublisher()
    }
    
    // MARK: - Refresh Token
    func refreshToken() -> AnyPublisher<Void, APIError> {
        return api.refreshToken()
    }
    
    // MARK: - Get Current User
    func getCurrentUser() -> AnyPublisher<User, APIError> {
        isLoading = true
        
        return api.request(endpoint: "/auth/me", method: .get, requiresAuth: true)
            .handleEvents(
                receiveOutput: { [weak self] (user: User) in
                    DispatchQueue.main.async {
                        self?.currentUser = user
                        self?.isAuthenticated = true
                    }
                },
                receiveCompletion: { [weak self] _ in
                    self?.isLoading = false
                }
            )
            .catch { [weak self] error -> AnyPublisher<User, APIError> in
                if case .unauthorized = error {
                    DispatchQueue.main.async {
                        self?.currentUser = nil
                        self?.isAuthenticated = false
                    }
                }
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Update Profile
    func updateProfile(data: UpdateProfileRequest) -> AnyPublisher<User, APIError> {
        isLoading = true
        
        return api.request(
            endpoint: "/auth/profile",
            method: .patch,
            body: data,
            requiresAuth: true
        )
        .handleEvents(
            receiveOutput: { [weak self] (user: User) in
                DispatchQueue.main.async {
                    self?.currentUser = user
                }
            },
            receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            }
        )
        .eraseToAnyPublisher()
    }
    
    // MARK: - Change Password
    func changePassword(data: ChangePasswordRequest) -> AnyPublisher<Void, APIError> {
        isLoading = true
        
        return api.request(
            endpoint: "/auth/password",
            method: .put,
            body: data,
            requiresAuth: true
        )
        .map { (_: EmptyResponse) -> Void in () }
        .handleEvents(receiveCompletion: { [weak self] _ in
            self?.isLoading = false
        })
        .eraseToAnyPublisher()
    }
    
    // MARK: - Reset Password
    func resetPassword(email: String) -> AnyPublisher<Void, APIError> {
        let request = PasswordResetRequest(email: email)
        
        return api.request(
            endpoint: "/auth/reset-password",
            method: .post,
            body: request,
            requiresAuth: false
        )
        .map { (_: EmptyResponse) -> Void in () }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Verify OTP
    func verifyOTP(email: String, otp: String) -> AnyPublisher<Void, APIError> {
        let request = VerifyOTPRequest(email: email, otp: otp)
        
        return api.request(
            endpoint: "/auth/verify-otp",
            method: .post,
            body: request,
            requiresAuth: false
        )
        .map { (_: EmptyResponse) -> Void in () }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Delete Account
    func deleteAccount() -> AnyPublisher<Void, APIError> {
        return api.request(
            endpoint: "/auth/account",
            method: .delete,
            requiresAuth: true
        )
        .map { (_: EmptyResponse) -> Void in () }
        .handleEvents(receiveCompletion: { [weak self] _ in
            self?.keychain.clearTokens()
            DispatchQueue.main.async {
                self?.currentUser = nil
                self?.isAuthenticated = false
            }
        })
        .eraseToAnyPublisher()
    }
}

// MARK: - Empty Response
struct EmptyResponse: Codable {}

// MARK: - Preview Mock
#if DEBUG
class MockAuthService: AuthServiceProtocol {
    var mockUser = User(
        id: "1",
        email: "user@example.com",
        firstName: "Ahmed",
        lastName: "Al-Rashid",
        phone: "+973 3600 1234",
        avatar: nil,
        role: .customer,
        addresses: [],
        preferences: .default,
        wishlist: nil,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: Date(),
        updatedAt: Date()
    )
    
    func login(email: String, password: String, deviceToken: String?) -> AnyPublisher<User, APIError> {
        Just(mockUser).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
    
    func register(data: RegisterRequest) -> AnyPublisher<User, APIError> {
        Just(mockUser).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
    
    func logout() -> AnyPublisher<Void, APIError> {
        Just(()).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
    
    func refreshToken() -> AnyPublisher<Void, APIError> {
        Just(()).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
    
    func getCurrentUser() -> AnyPublisher<User, APIError> {
        Just(mockUser).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
    
    func updateProfile(data: UpdateProfileRequest) -> AnyPublisher<User, APIError> {
        Just(mockUser).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
    
    func changePassword(data: ChangePasswordRequest) -> AnyPublisher<Void, APIError> {
        Just(()).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
    
    func resetPassword(email: String) -> AnyPublisher<Void, APIError> {
        Just(()).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
    
    func verifyOTP(email: String, otp: String) -> AnyPublisher<Void, APIError> {
        Just(()).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
    
    func deleteAccount() -> AnyPublisher<Void, APIError> {
        Just(()).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
}
#endif
