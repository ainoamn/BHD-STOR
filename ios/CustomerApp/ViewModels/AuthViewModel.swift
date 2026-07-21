//
//  AuthViewModel.swift
//  BHD Marketplace
//
//  Auth view model with Combine
//

import Foundation
import Combine

@MainActor
final class AuthViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var currentUser: User? = nil
    @Published var isAuthenticated: Bool = false
    @Published var isLoading: Bool = false
    @Published var showError: Bool = false
    @Published var errorMessage: String = ""
    @Published var isLoggedIn: Bool = false
    
    // MARK: - Services
    private let authService = AuthService.shared
    
    // MARK: - Combine
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Init
    nonisolated init() {}
    
    // MARK: - Check Auth Status
    func checkAuthStatus() {
        authService.getCurrentUser()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure = completion {
                        self?.isAuthenticated = false
                        self?.currentUser = nil
                    }
                },
                receiveValue: { [weak self] user in
                    self?.currentUser = user
                    self?.isAuthenticated = true
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Login
    func login(email: String, password: String) {
        isLoading = true
        showError = false
        
        authService.login(email: email, password: password)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] user in
                    self?.currentUser = user
                    self?.isAuthenticated = true
                    self?.isLoggedIn = true
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Register
    func register(data: RegisterRequest) {
        isLoading = true
        showError = false
        
        authService.register(data: data)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] user in
                    self?.currentUser = user
                    self?.isAuthenticated = true
                    self?.isLoggedIn = true
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Logout
    func logout() {
        isLoading = true
        
        authService.logout()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] _ in
                    self?.isLoading = false
                },
                receiveValue: { [weak self] _ in
                    self?.currentUser = nil
                    self?.isAuthenticated = false
                    self?.isLoggedIn = false
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Update Profile
    func updateProfile(data: UpdateProfileRequest) {
        isLoading = true
        
        authService.updateProfile(data: data)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] user in
                    self?.currentUser = user
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Change Password
    func changePassword(currentPassword: String, newPassword: String) {
        isLoading = true
        
        let request = ChangePasswordRequest(
            currentPassword: currentPassword,
            newPassword: newPassword
        )
        
        authService.changePassword(data: request)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] _ in
                    // Show success
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Reset Password
    func resetPassword(email: String) {
        isLoading = true
        
        authService.resetPassword(email: email)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Delete Account
    func deleteAccount() {
        isLoading = true
        
        authService.deleteAccount()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] _ in
                    self?.currentUser = nil
                    self?.isAuthenticated = false
                    self?.isLoggedIn = false
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Error Handling
    private func handleError(_ error: APIError) {
        errorMessage = error.localizedDescription
        showError = true
    }
}
