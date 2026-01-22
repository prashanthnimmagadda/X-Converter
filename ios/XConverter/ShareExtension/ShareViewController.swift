//
//  ShareViewController.swift
//  ShareExtension
//
//  Share Extension for X Content to PDF Converter
//

import UIKit
import Social
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    // MARK: - UI Components

    private let containerView: UIView = {
        let view = UIView()
        view.backgroundColor = .systemBackground
        view.layer.cornerRadius = 12
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "X → PDF Converter"
        label.font = UIFont.systemFont(ofSize: 18, weight: .bold)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private let statusLabel: UILabel = {
        let label = UILabel()
        label.text = "Preparing to convert..."
        label.font = UIFont.systemFont(ofSize: 15)
        label.textAlignment = .center
        label.textColor = .secondaryLabel
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private let activityIndicator: UIActivityIndicatorView = {
        let indicator = UIActivityIndicatorView(style: .large)
        indicator.hidesWhenStopped = true
        indicator.translatesAutoresizingMaskIntoConstraints = false
        return indicator
    }()

    private let progressView: UIProgressView = {
        let progress = UIProgressView(progressViewStyle: .default)
        progress.translatesAutoresizingMaskIntoConstraints = false
        progress.isHidden = true
        return progress
    }()

    private let cancelButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Cancel", for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    // MARK: - Properties

    private var extractedURL: String?
    private let fileManager = PDFFileManager()

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()

        setupUI()
        setupActions()
        extractURL()
    }

    // MARK: - Setup

    private func setupUI() {
        view.backgroundColor = .black.withAlphaComponent(0.4)

        view.addSubview(containerView)
        containerView.addSubview(titleLabel)
        containerView.addSubview(statusLabel)
        containerView.addSubview(activityIndicator)
        containerView.addSubview(progressView)
        containerView.addSubview(cancelButton)

        NSLayoutConstraint.activate([
            containerView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            containerView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            containerView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 40),
            containerView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -40),
            containerView.heightAnchor.constraint(greaterThanOrEqualToConstant: 250),

            titleLabel.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 24),
            titleLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 20),
            titleLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -20),

            activityIndicator.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            activityIndicator.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 30),

            statusLabel.topAnchor.constraint(equalTo: activityIndicator.bottomAnchor, constant: 20),
            statusLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 20),
            statusLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -20),

            progressView.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 20),
            progressView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 30),
            progressView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -30),

            cancelButton.topAnchor.constraint(equalTo: progressView.bottomAnchor, constant: 20),
            cancelButton.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            cancelButton.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -20),
            cancelButton.widthAnchor.constraint(equalToConstant: 100)
        ])
    }

    private func setupActions() {
        cancelButton.addTarget(self, action: #selector(cancel), for: .touchUpInside)
    }

    // MARK: - URL Extraction

    private func extractURL() {
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let itemProvider = extensionItem.attachments?.first else {
            showError("No content to share")
            return
        }

        // Try to get URL
        if itemProvider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] (item, error) in
                DispatchQueue.main.async {
                    if let url = item as? URL {
                        self?.extractedURL = url.absoluteString
                        self?.startConversion()
                    } else if let error = error {
                        self?.showError("Failed to extract URL: \(error.localizedDescription)")
                    } else {
                        self?.showError("Invalid URL")
                    }
                }
            }
        } else if itemProvider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] (item, error) in
                DispatchQueue.main.async {
                    if let text = item as? String {
                        // Try to extract URL from text
                        if let url = self?.extractURLFromText(text) {
                            self?.extractedURL = url
                            self?.startConversion()
                        } else {
                            self?.showError("No valid X URL found")
                        }
                    } else {
                        self?.showError("Failed to extract URL")
                    }
                }
            }
        } else {
            showError("Unsupported content type")
        }
    }

    private func extractURLFromText(_ text: String) -> String? {
        // Try to find X/Twitter URLs in text
        let pattern = "(https?://)?(www\\.)?(x\\.com|twitter\\.com)/[^\\s]+"

        guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else {
            return nil
        }

        let nsString = text as NSString
        let results = regex.matches(in: text, options: [], range: NSRange(location: 0, length: nsString.length))

        if let match = results.first {
            var urlString = nsString.substring(with: match.range)
            if !urlString.hasPrefix("http") {
                urlString = "https://" + urlString
            }
            return urlString
        }

        return nil
    }

    // MARK: - Conversion

    private func startConversion() {
        guard let url = extractedURL else {
            showError("No URL found")
            return
        }

        activityIndicator.startAnimating()
        statusLabel.text = "Converting to PDF..."

        Task {
            do {
                // Perform conversion
                let result = try await NetworkManager.shared.convertToPDF(url: url)

                // Save PDF
                try await savePDF(data: result.data, filename: result.filename)

                // Show success
                await MainActor.run {
                    showSuccess(filename: result.filename)
                }
            } catch {
                await MainActor.run {
                    showError("Conversion failed: \(error.localizedDescription)")
                }
            }
        }
    }

    private func savePDF(data: Data, filename: String) async throws {
        await MainActor.run {
            statusLabel.text = "Saving PDF..."
        }

        try fileManager.savePDF(data: data, filename: filename)
    }

    // MARK: - UI Updates

    private func showSuccess(filename: String) {
        activityIndicator.stopAnimating()
        statusLabel.text = "PDF saved successfully!\n\n\(filename)"
        statusLabel.textColor = .systemGreen

        cancelButton.setTitle("Done", for: .normal)

        // Auto-dismiss after 2 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
            self?.close()
        }
    }

    private func showError(_ message: String) {
        activityIndicator.stopAnimating()
        statusLabel.text = message
        statusLabel.textColor = .systemRed

        cancelButton.setTitle("Close", for: .normal)
    }

    // MARK: - Actions

    @objc private func cancel() {
        close()
    }

    private func close() {
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
}
