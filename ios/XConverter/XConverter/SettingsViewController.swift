//
//  SettingsViewController.swift
//  XConverter
//
//  Settings view for configuring the app
//

import UIKit

class SettingsViewController: UIViewController {

    // MARK: - UI Components

    private let tableView: UITableView = {
        let table = UITableView(frame: .zero, style: .insetGrouped)
        table.translatesAutoresizingMaskIntoConstraints = false
        return table
    }()

    // MARK: - Properties

    private enum Section: Int, CaseIterable {
        case server
        case preferences
        case about

        var title: String {
            switch self {
            case .server: return "Server"
            case .preferences: return "Preferences"
            case .about: return "About"
            }
        }
    }

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()

        title = "Settings"
        view.backgroundColor = .systemBackground

        setupTableView()
    }

    // MARK: - Setup

    private func setupTableView() {
        view.addSubview(tableView)
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "Cell")
        tableView.register(TextFieldCell.self, forCellReuseIdentifier: "TextFieldCell")

        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
}

// MARK: - UITableViewDataSource

extension SettingsViewController: UITableViewDataSource {

    func numberOfSections(in tableView: UITableView) -> Int {
        return Section.allCases.count
    }

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        guard let section = Section(rawValue: section) else { return 0 }

        switch section {
        case .server: return 1
        case .preferences: return 2
        case .about: return 2
        }
    }

    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        return Section(rawValue: section)?.title
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard let section = Section(rawValue: indexPath.section) else {
            return UITableViewCell()
        }

        switch section {
        case .server:
            let cell = tableView.dequeueReusableCell(withIdentifier: "TextFieldCell", for: indexPath) as! TextFieldCell
            cell.configure(
                title: "Server URL",
                placeholder: "http://localhost:3000",
                value: AppConfig.shared.serverURL
            ) { [weak self] newValue in
                AppConfig.shared.serverURL = newValue
            }
            return cell

        case .preferences:
            let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
            if indexPath.row == 0 {
                cell.textLabel?.text = "Auto-save to Files"
                cell.accessoryType = AppConfig.shared.autoSave ? .checkmark : .none
            } else {
                cell.textLabel?.text = "Show notifications"
                cell.accessoryType = AppConfig.shared.showNotifications ? .checkmark : .none
            }
            return cell

        case .about:
            let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
            cell.accessoryType = .disclosureIndicator
            if indexPath.row == 0 {
                cell.textLabel?.text = "Version"
                cell.detailTextLabel?.text = "1.0.0"
            } else {
                cell.textLabel?.text = "Privacy Policy"
            }
            return cell
        }
    }
}

// MARK: - UITableViewDelegate

extension SettingsViewController: UITableViewDelegate {

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)

        guard let section = Section(rawValue: indexPath.section) else { return }

        switch section {
        case .preferences:
            if indexPath.row == 0 {
                AppConfig.shared.autoSave.toggle()
            } else {
                AppConfig.shared.showNotifications.toggle()
            }
            tableView.reloadRows(at: [indexPath], with: .automatic)

        case .about:
            if indexPath.row == 1 {
                // Show privacy policy
                showPrivacyPolicy()
            }

        default:
            break
        }
    }

    private func showPrivacyPolicy() {
        let alert = UIAlertController(
            title: "Privacy Policy",
            message: "This app does not collect or store any personal data. URLs are processed on-demand and not logged. PDFs are saved locally on your device only.",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - TextFieldCell

class TextFieldCell: UITableViewCell {

    private let titleLabel: UILabel = {
        let label = UILabel()
        label.font = UIFont.systemFont(ofSize: 15)
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private let textField: UITextField = {
        let field = UITextField()
        field.font = UIFont.systemFont(ofSize: 15)
        field.textAlignment = .right
        field.autocapitalizationType = .none
        field.autocorrectionType = .no
        field.keyboardType = .URL
        field.translatesAutoresizingMaskIntoConstraints = false
        return field
    }()

    private var onChange: ((String) -> Void)?

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupUI()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupUI() {
        contentView.addSubview(titleLabel)
        contentView.addSubview(textField)

        textField.addTarget(self, action: #selector(textFieldChanged), for: .editingChanged)

        NSLayoutConstraint.activate([
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            titleLabel.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            titleLabel.widthAnchor.constraint(equalToConstant: 100),

            textField.leadingAnchor.constraint(equalTo: titleLabel.trailingAnchor, constant: 8),
            textField.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            textField.centerYAnchor.constraint(equalTo: contentView.centerYAnchor)
        ])
    }

    func configure(title: String, placeholder: String, value: String, onChange: @escaping (String) -> Void) {
        titleLabel.text = title
        textField.placeholder = placeholder
        textField.text = value
        self.onChange = onChange
    }

    @objc private func textFieldChanged() {
        onChange?(textField.text ?? "")
    }
}
