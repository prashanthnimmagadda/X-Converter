//
//  NetworkManager.swift
//  XConverter
//
//  Network layer for communicating with backend service
//

import Foundation

enum NetworkError: Error {
    case invalidURL
    case invalidResponse
    case serverError(String)
    case networkFailure(Error)

    var localizedDescription: String {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .serverError(let message):
            return message
        case .networkFailure(let error):
            return error.localizedDescription
        }
    }
}

class NetworkManager {

    static let shared = NetworkManager()

    private let session: URLSession
    private let maxRetries = 4
    private let retryDelays: [TimeInterval] = [2, 4, 8, 16]

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        config.timeoutIntervalForResource = 120
        self.session = URLSession(configuration: config)
    }

    // MARK: - Public Methods

    /**
     Convert X URL to PDF
     - Parameter url: The X URL to convert
     - Returns: PDF data
     */
    func convertToPDF(url: String) async throws -> (data: Data, filename: String) {
        var lastError: Error?

        // Try with retries
        for attempt in 0..<maxRetries {
            do {
                return try await performConversion(url: url)
            } catch let error as NetworkError {
                lastError = error

                // Only retry on network failures
                if case .networkFailure = error {
                    if attempt < maxRetries - 1 {
                        let delay = retryDelays[attempt]
                        print("Request failed, retrying in \(delay)s... (attempt \(attempt + 1)/\(maxRetries))")
                        try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                        continue
                    }
                }

                // Don't retry on server errors or invalid responses
                throw error
            }
        }

        throw lastError ?? NetworkError.invalidResponse
    }

    /**
     Validate X URL
     - Parameter url: The X URL to validate
     - Returns: Validation result
     */
    func validateURL(url: String) async throws -> ValidationResult {
        let serverURL = AppConfig.shared.serverURL
        guard let endpoint = URL(string: "\(serverURL)/validate") else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ["url": url]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        if httpResponse.statusCode == 200 {
            let result = try JSONDecoder().decode(ValidationResult.self, from: data)
            return result
        } else {
            if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                throw NetworkError.serverError(errorResponse.error)
            }
            throw NetworkError.invalidResponse
        }
    }

    // MARK: - Private Methods

    private func performConversion(url: String) async throws -> (data: Data, filename: String) {
        let serverURL = AppConfig.shared.serverURL
        guard let endpoint = URL(string: "\(serverURL)/convert") else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ["url": url]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        if httpResponse.statusCode == 200 {
            // Extract filename from Content-Disposition header
            let filename = self.extractFilename(from: httpResponse) ?? "converted.pdf"
            return (data, filename)
        } else {
            // Try to parse error response
            if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                throw NetworkError.serverError(errorResponse.error)
            }
            throw NetworkError.serverError("Conversion failed with status \(httpResponse.statusCode)")
        }
    }

    private func extractFilename(from response: HTTPURLResponse) -> String? {
        guard let contentDisposition = response.value(forHTTPHeaderField: "Content-Disposition") else {
            return nil
        }

        // Parse: attachment; filename="example.pdf"
        let components = contentDisposition.components(separatedBy: ";")
        for component in components {
            let trimmed = component.trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("filename=") {
                let filename = trimmed
                    .replacingOccurrences(of: "filename=", with: "")
                    .replacingOccurrences(of: "\"", with: "")
                return filename
            }
        }

        return nil
    }
}

// MARK: - Response Models

struct ValidationResult: Codable {
    let success: Bool
    let classification: Classification?
    let normalizedUrl: String?

    struct Classification: Codable {
        let type: String
        let valid: Bool
        let username: String?
        let tweetId: String?
    }
}

struct ErrorResponse: Codable {
    let success: Bool
    let error: String
    let details: String?
}
