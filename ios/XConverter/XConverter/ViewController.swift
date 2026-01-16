//
//  ViewController.swift
//  XConverter
//
//  X Content to PDF Converter - Main View
//

import UIKit

class ViewController: UIViewController {

    // MARK: - UI Components

    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "X → PDF Converter"
        label.font = UIFont.systemFont(ofSize: 28, weight: .bold)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private let descriptionLabel: UILabel = {
        let label = UILabel()
        label.text = "Convert X articles, posts, and threads to PDF"
        label.font = UIFont.systemFont(ofSize: 16, weight: .regular)
        label.textAlignment = .center
        label.textColor = .secondaryLabel
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private let instructionsLabel: UILabel = {
        let label = UILabel()
        label.text = "To use:\n\n1. Open X app\n2. Tap Share on any article or post\n3. Select 'Convert to PDF'\n4. PDF will be saved to Files"
        label.font = UIFont.systemFont(ofSize: 15)
        label.textAlignment = .center
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private let settingsButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Settings", for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .medium)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    private let historyButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("View Saved PDFs", for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .medium)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()

        setupUI()
        setupActions()
    }

    // MARK: - Setup

    private func setupUI() {
        view.backgroundColor = .systemBackground
        title = "X Converter"

        view.addSubview(titleLabel)
        view.addSubview(descriptionLabel)
        view.addSubview(instructionsLabel)
        view.addSubview(settingsButton)
        view.addSubview(historyButton)

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 60),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),

            descriptionLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 12),
            descriptionLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            descriptionLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),

            instructionsLabel.topAnchor.constraint(equalTo: descriptionLabel.bottomAnchor, constant: 40),
            instructionsLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            instructionsLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),

            historyButton.bottomAnchor.constraint(equalTo: settingsButton.topAnchor, constant: -20),
            historyButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            historyButton.widthAnchor.constraint(equalToConstant: 200),
            historyButton.heightAnchor.constraint(equalToConstant: 50),

            settingsButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -30),
            settingsButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            settingsButton.widthAnchor.constraint(equalToConstant: 200),
            settingsButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    private func setupActions() {
        settingsButton.addTarget(self, action: #selector(showSettings), for: .touchUpInside)
        historyButton.addTarget(self, action: #selector(showHistory), for: .touchUpInside)
    }

    // MARK: - Actions

    @objc private func showSettings() {
        let settingsVC = SettingsViewController()
        navigationController?.pushViewController(settingsVC, animated: true)
    }

    @objc private func showHistory() {
        // Open Files app to show PDFs
        let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let pdfURL = documentsURL.appendingPathComponent("XConverter")

        if FileManager.default.fileExists(atPath: pdfURL.path) {
            let documentPicker = UIDocumentPickerViewController(forOpeningContentTypes: [.pdf])
            documentPicker.directoryURL = pdfURL
            present(documentPicker, animated: true)
        } else {
            let alert = UIAlertController(
                title: "No PDFs Yet",
                message: "You haven't converted any content yet. Share a post or article from X to get started!",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            present(alert, animated: true)
        }
    }
}
