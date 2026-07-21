//
//  APIService.swift
//  BHD Marketplace
//
//  Core API service with Combine, JWT, and error handling
//

import Foundation
import Combine
import Security

// MARK: - API Configuration
enum APIConfig {
    #if DEBUG
    static let baseURL = "https://api-staging.bhd.marketplace/v1"
    #else
    static let baseURL = "https://api.bhd.marketplace/v1"
    #endif
    
    static let timeout: TimeInterval = 30
    static let maxRetries = 3
    static let retryDelay: TimeInterval = 1.0
}

// MARK: - API Error
enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case decodingError(Error)
    case encodingError(Error)
    case serverError(Int, String?)
    case networkError(Error)
    case unauthorized
    case forbidden
    case notFound
    case validationError([ValidationError])
    case rateLimited(retryAfter: TimeInterval)
    case cancelled
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return L("error.invalidURL")
        case .noData:
            return L("error.noData")
        case .decodingError(let error):
            return "\(L("error.decoding")): \(error.localizedDescription)"
        case .encodingError(let error):
            return "\(L("error.encoding")): \(error.localizedDescription)"
        case .serverError(let code, let message):
            return message ?? "\(L("error.server")) \(code)"
        case .networkError(let error):
            return "\(L("error.network")): \(error.localizedDescription)"
        case .unauthorized:
            return L("error.unauthorized")
        case .forbidden:
            return L("error.forbidden")
        case .notFound:
            return L("error.notFound")
        case .validationError(let errors):
            return errors.map { $0.message }.joined(separator: "\n")
        case .rateLimited(let retryAfter):
            return String(format: L("error.rateLimited"), Int(retryAfter))
        case .cancelled:
            return L("error.cancelled")
        case .unknown:
            return L("error.unknown")
        }
    }
}

// MARK: - Validation Error
struct ValidationError: Codable {
    let field: String
    let message: String
    
    enum CodingKeys: String, CodingKey {
        case field, message
    }
}

// MARK: - API Error Response
struct APIErrorResponse: Codable {
    let success: Bool
    let message: String
    let errors: [ValidationError]?
    let code: String?
}

// MARK: - API Response Wrapper
struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let message: String?
    let meta: ResponseMeta?
}

struct ResponseMeta: Codable {
    let total: Int?
    let page: Int?
    let limit: Int?
    let totalPages: Int?
}

// MARK: - HTTP Method
enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

// MARK: - Keychain Manager
final class KeychainManager {
    static let shared = KeychainManager()
    private init() {}
    
    private let service = "com.bhd.marketplace"
    
    @Published private(set) var accessToken: String? {
        didSet {
            if let token = accessToken {
                try? save(token, account: "accessToken")
            } else {
                try? delete(account: "accessToken")
            }
        }
    }
    
    @Published private(set) var refreshToken: String? {
        didSet {
            if let token = refreshToken {
                try? save(token, account: "refreshToken")
            } else {
                try? delete(account: "refreshToken")
            }
        }
    }
    
    var isAuthenticated: Bool {
        return accessToken != nil
    }
    
    func configure(accessToken: String, refreshToken: String) {
        self.accessToken = accessToken
        self.refreshToken = refreshToken
    }
    
    func clearTokens() {
        accessToken = nil
        refreshToken = nil
        try? delete(account: "accessToken")
        try? delete(account: "refreshToken")
    }
    
    func loadTokens() {
        if let token = try? read(account: "accessToken") {
            self.accessToken = token
        }
        if let token = try? read(account: "refreshToken") {
            self.refreshToken = token
        }
    }
    
    // MARK: - Keychain Operations
    private func save(_ value: String, account: String) throws {
        guard let data = value.data(using: .utf8) else {
            throw APIError.encodingError(NSError(domain: "Keychain", code: -1))
        }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw APIError.unknown
        }
    }
    
    private func read(account: String) throws -> String {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            throw APIError.unknown
        }
        return value
    }
    
    private func delete(account: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw APIError.unknown
        }
    }
}

// MARK: - API Service
final class APIService {
    static let shared = APIService()
    
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private let keychain = KeychainManager.shared
    private var cancellables = Set<AnyCancellable>()
    
    // Auth state publisher
    var isAuthenticated: AnyPublisher<Bool, Never> {
        return keychain.$accessToken
            .map { $0 != nil }
            .eraseToAnyPublisher()
    }
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = APIConfig.timeout
        config.timeoutIntervalForResource = APIConfig.timeout * 3
        config.httpAdditionalHeaders = [
            "Accept": "application/json",
            "Content-Type": "application/json"
        ]
        self.session = URLSession(configuration: config)
        
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
        
        // Load tokens from keychain on init
        keychain.loadTokens()
    }
    
    // MARK: - Generic Request
    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        queryItems: [URLQueryItem]? = nil,
        requiresAuth: Bool = true,
        retryCount: Int = APIConfig.maxRetries
    ) -> AnyPublisher<T, APIError> {
        
        guard let url = buildURL(endpoint: endpoint, queryItems: queryItems) else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        if let body = body {
            do {
                request.httpBody = try encoder.encode(body)
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            } catch {
                return Fail(error: APIError.encodingError(error)).eraseToAnyPublisher()
            }
        }
        
        // Add auth header
        if requiresAuth, let token = keychain.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add language header
        let language = LocalizationManager.shared.currentLanguage
        request.setValue(language, forHTTPHeaderField: "Accept-Language")
        
        return session.dataTaskPublisher(for: request)
            .tryMap { [weak self] data, response -> Data in
                guard let self = self else { throw APIError.unknown }
                return try self.handleResponse(data: data, response: response)
            }
            .decode(type: APIResponse<T>.self, decoder: decoder)
            .tryMap { apiResponse -> T in
                guard apiResponse.success else {
                    throw APIError.serverError(400, apiResponse.message)
                }
                guard let data = apiResponse.data else {
                    throw APIError.noData
                }
                return data
            }
            .mapError { [weak self] error -> APIError in
                if let apiError = error as? APIError {
                    if case .unauthorized = apiError {
                        // Attempt token refresh on 401
                        return apiError
                    }
                    return apiError
                }
                if let decodingError = error as? DecodingError {
                    return APIError.decodingError(decodingError)
                }
                return APIError.networkError(error)
            }
            .catch { [weak self] error -> AnyPublisher<T, APIError> in
                guard let self = self else {
                    return Fail(error: error).eraseToAnyPublisher()
                }
                if case .unauthorized = error, retryCount > 0 {
                    return self.refreshToken()
                        .flatMap { _ -> AnyPublisher<T, APIError> in
                            self.request(
                                endpoint: endpoint,
                                method: method,
                                body: body,
                                queryItems: queryItems,
                                requiresAuth: requiresAuth,
                                retryCount: retryCount - 1
                            )
                        }
                        .eraseToAnyPublisher()
                }
                return Fail(error: error).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Simple Request (no wrapper)
    func requestRaw<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        queryItems: [URLQueryItem]? = nil,
        requiresAuth: Bool = true
    ) -> AnyPublisher<T, APIError> {
        
        guard let url = buildURL(endpoint: endpoint, queryItems: queryItems) else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        if let body = body {
            do {
                request.httpBody = try encoder.encode(body)
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            } catch {
                return Fail(error: APIError.encodingError(error)).eraseToAnyPublisher()
            }
        }
        
        if requiresAuth, let token = keychain.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let language = LocalizationManager.shared.currentLanguage
        request.setValue(language, forHTTPHeaderField: "Accept-Language")
        
        return session.dataTaskPublisher(for: request)
            .tryMap { [weak self] data, response -> Data in
                guard let self = self else { throw APIError.unknown }
                return try self.handleResponse(data: data, response: response)
            }
            .decode(type: T.self, decoder: decoder)
            .mapError { error -> APIError in
                if let apiError = error as? APIError { return apiError }
                if let decodingError = error as? DecodingError {
                    return APIError.decodingError(decodingError)
                }
                return APIError.networkError(error)
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Upload Data
    func upload<T: Decodable>(
        endpoint: String,
        data: Data,
        mimeType: String,
        fileName: String,
        fieldName: String = "file",
        requiresAuth: Bool = true
    ) -> AnyPublisher<T, APIError> {
        
        guard let url = URL(string: APIConfig.baseURL + endpoint) else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        let boundary = UUID().uuidString
        var request = URLRequest(url: url)
        request.httpMethod = HTTPMethod.post.rawValue
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        if requiresAuth, let token = keychain.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body
        
        return session.dataTaskPublisher(for: request)
            .tryMap { [weak self] data, response -> Data in
                guard let self = self else { throw APIError.unknown }
                return try self.handleResponse(data: data, response: response)
            }
            .decode(type: T.self, decoder: decoder)
            .mapError { error -> APIError in
                if let apiError = error as? APIError { return apiError }
                return APIError.networkError(error)
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Token Refresh
    func refreshToken() -> AnyPublisher<Void, APIError> {
        guard let refresh = keychain.refreshToken else {
            keychain.clearTokens()
            return Fail(error: APIError.unauthorized).eraseToAnyPublisher()
        }
        
        let request = RefreshTokenRequest(refreshToken: refresh)
        
        return self.request(
            endpoint: "/auth/refresh",
            method: .post,
            body: request,
            requiresAuth: false
        )
        .handleEvents(receiveOutput: { [weak self] (response: AuthResponse) in
            self?.keychain.configure(
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            )
        })
        .map { _ in () }
        .catch { [weak self] error -> AnyPublisher<Void, APIError> in
            self?.keychain.clearTokens()
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Logout
    func logout() -> AnyPublisher<Void, APIError> {
        return request(endpoint: "/auth/logout", method: .post, requiresAuth: true)
            .catch { _ -> AnyPublisher<Void, APIError> in
                Just(()).setFailureType(to: APIError.self).eraseToAnyPublisher()
            }
            .handleEvents(receiveCompletion: { [weak self] _ in
                self?.keychain.clearTokens()
            })
            .eraseToAnyPublisher()
    }
    
    // MARK: - Response Handler
    private func handleResponse(data: Data, response: URLResponse) throws -> Data {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return data
        case 401:
            throw APIError.unauthorized
        case 403:
            throw APIError.forbidden
        case 404:
            throw APIError.notFound
        case 422:
            let errorResponse = try? decoder.decode(APIErrorResponse.self, from: data)
            throw APIError.validationError(errorResponse?.errors ?? [])
        case 429:
            let retryAfter = httpResponse.value(forHTTPHeaderField: "Retry-After")
                .flatMap { TimeInterval($0) } ?? 60
            throw APIError.rateLimited(retryAfter: retryAfter)
        case 500...599:
            let errorResponse = try? decoder.decode(APIErrorResponse.self, from: data)
            throw APIError.serverError(httpResponse.statusCode, errorResponse?.message)
        default:
            let errorResponse = try? decoder.decode(APIErrorResponse.self, from: data)
            throw APIError.serverError(httpResponse.statusCode, errorResponse?.message)
        }
    }
    
    // MARK: - URL Builder
    private func buildURL(endpoint: String, queryItems: [URLQueryItem]? = nil) -> URL? {
        var components = URLComponents(string: APIConfig.baseURL + endpoint)
        if let queryItems = queryItems, !queryItems.isEmpty {
            components?.queryItems = queryItems
        }
        return components?.url
    }
}

// MARK: - Data Extension for Multipart
private extension Data {
    mutating func append(_ string: String) {
        if let data = string.data(using: .utf8) {
            append(data)
        }
    }
}
