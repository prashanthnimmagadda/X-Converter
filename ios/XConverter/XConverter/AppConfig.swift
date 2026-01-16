//
//  AppConfig.swift
//  XConverter
//
//  App configuration and settings management
//

import Foundation

class AppConfig {

    static let shared = AppConfig()

    private let defaults = UserDefaults.standard

    // MARK: - Keys

    private enum Keys {
        static let serverURL = "serverURL"
        static let autoSave = "autoSave"
        static let showNotifications = "showNotifications"
    }

    // MARK: - Properties

    var serverURL: String {
        get {
            return defaults.string(forKey: Keys.serverURL) ?? "http://localhost:3000"
        }
        set {
            defaults.set(newValue, forKey: Keys.serverURL)
        }
    }

    var autoSave: Bool {
        get {
            return defaults.bool(forKey: Keys.autoSave)
        }
        set {
            defaults.set(newValue, forKey: Keys.autoSave)
        }
    }

    var showNotifications: Bool {
        get {
            return defaults.bool(forKey: Keys.showNotifications)
        }
        set {
            defaults.set(newValue, forKey: Keys.showNotifications)
        }
    }

    // MARK: - Initialization

    private init() {
        // Set defaults on first launch
        if defaults.object(forKey: Keys.autoSave) == nil {
            defaults.set(true, forKey: Keys.autoSave)
        }
        if defaults.object(forKey: Keys.showNotifications) == nil {
            defaults.set(true, forKey: Keys.showNotifications)
        }
    }
}
