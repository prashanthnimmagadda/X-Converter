# X Converter - iOS App

iOS Share Extension for converting X (Twitter) content to PDF.

## Requirements

- Xcode 15.0+
- iOS 16.0+
- Swift 5.9+

## Project Structure

```
XConverter/
├── XConverter/               # Main app
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   ├── ViewController.swift
│   ├── SettingsViewController.swift
│   ├── AppConfig.swift
│   ├── NetworkManager.swift
│   └── Info.plist
└── ShareExtension/           # Share Extension
    ├── ShareViewController.swift
    ├── PDFFileManager.swift
    └── Info.plist
```

## Setup Instructions

### 1. Create Xcode Project

1. Open Xcode
2. Create a new **App** project
3. Product Name: `XConverter`
4. Organization Identifier: `com.yourcompany`
5. Interface: **Storyboard** (we'll use programmatic UI)
6. Language: **Swift**

### 2. Add Share Extension Target

1. File → New → Target
2. Select **Share Extension**
3. Product Name: `ShareExtension`
4. Language: **Swift**
5. Activate scheme when prompted

### 3. Copy Source Files

1. **Main App Files** → Copy to `XConverter` folder:
   - AppDelegate.swift
   - SceneDelegate.swift
   - ViewController.swift
   - SettingsViewController.swift
   - AppConfig.swift
   - NetworkManager.swift

2. **Share Extension Files** → Copy to `ShareExtension` folder:
   - ShareViewController.swift
   - PDFFileManager.swift

3. Replace the `Info.plist` files with the provided versions

### 4. Configure Build Settings

#### Main App Target (XConverter)

1. Select XConverter target
2. General → Deployment Info
   - iOS Deployment Target: **16.0**
   - iPhone and iPad
3. Signing & Capabilities
   - Enable **Automatically manage signing**
   - Select your team

#### Share Extension Target (ShareExtension)

1. Select ShareExtension target
2. General → Deployment Info
   - iOS Deployment Target: **16.0**
3. Signing & Capabilities
   - Enable **Automatically manage signing**
   - Select your team
4. Build Settings
   - Set bundle identifier: `com.yourcompany.XConverter.ShareExtension`

### 5. Configure App Groups (Optional but Recommended)

For sharing data between main app and extension:

1. Main App Target → Signing & Capabilities
   - Click **+ Capability**
   - Add **App Groups**
   - Add group: `group.com.yourcompany.XConverter`

2. Share Extension Target → Signing & Capabilities
   - Add **App Groups**
   - Add same group: `group.com.yourcompany.XConverter`

### 6. Update AppDelegate

If using SwiftUI lifecycle, update `@main` in AppDelegate.swift to:

```swift
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    // ... existing code
}
```

### 7. Remove Default Storyboards

1. Delete `Main.storyboard` (if exists)
2. Select project → Info tab
3. Remove "Main storyboard file base name" entry
4. Update Info.plist if needed

## Configuration

### Backend Server URL

By default, the app connects to `http://localhost:3000`. To change this:

1. Launch the app
2. Tap **Settings**
3. Update **Server URL** field
4. Example production URL: `https://your-backend.com`

### Settings Options

- **Server URL**: Backend service endpoint
- **Auto-save to Files**: Automatically save PDFs (enabled by default)
- **Show notifications**: Display success/failure notifications

## Usage

### From X App

1. Open X (Twitter) app
2. Navigate to any article, post, or thread
3. Tap the **Share** button
4. Select **Convert to PDF** from Share Sheet
5. Wait for conversion (3-10 seconds)
6. PDF is automatically saved to Files app

### Accessing PDFs

PDFs are saved to:
```
Files → On My iPhone → XConverter
```

Or from the app:
1. Open XConverter app
2. Tap **View Saved PDFs**

## Features

- One-tap conversion from Share Sheet
- Support for articles, posts, and threads
- Automatic PDF saving
- Retry logic for network failures
- Clean, print-friendly PDF output
- No user interaction required after sharing

## Troubleshooting

### Share Extension Not Appearing

1. Ensure both targets are building successfully
2. Check Info.plist configuration for ShareExtension
3. Verify NSExtension configuration
4. Restart device/simulator

### Network Errors

1. Check backend server is running
2. Update Server URL in Settings
3. For iOS Simulator with localhost:
   - Use `http://127.0.0.1:3000` or computer's IP address
   - Not `http://localhost:3000`

### Build Errors

1. Clean build folder: Product → Clean Build Folder (Cmd+Shift+K)
2. Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Restart Xcode

### Share Extension Crashes

1. Check Console app for crash logs
2. Ensure backend server is accessible
3. Verify URL format is correct

## Testing

### Testing in Simulator

1. Run the main app first
2. Configure server URL in Settings
3. Open Safari
4. Navigate to any X URL
5. Tap Share button
6. Select "Convert to PDF"

### Testing on Device

1. Connect device
2. Select device as target
3. Build and run
4. Open X app on device
5. Share any content
6. Select "Convert to PDF"

## Building for Release

1. Select **Any iOS Device** as target
2. Product → Archive
3. Distribute App
4. Choose distribution method:
   - App Store Connect
   - Ad Hoc
   - Enterprise
   - Development

## App Store Requirements

Before submitting to App Store:

1. Add privacy policy URL
2. Update app icons
3. Create screenshots
4. Write app description
5. Test on multiple devices
6. Check App Store Review Guidelines

### Privacy Policy

The app should include:
- No personal data collection
- URLs processed on-demand only
- PDFs stored locally
- No analytics or tracking

## Known Limitations

- Public X content only
- No video embedding
- Requires internet connection
- Maximum processing time: ~30 seconds
- Very long threads may be truncated

## Performance

- Average conversion time: 3-6 seconds
- Network retry attempts: 4
- Retry delays: 2s, 4s, 8s, 16s (exponential backoff)

## License

MIT
