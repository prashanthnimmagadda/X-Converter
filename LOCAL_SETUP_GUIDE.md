# Complete Local Setup Guide for macOS

Step-by-step guide to set up and test X-Converter on your Mac.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Install Prerequisites](#install-prerequisites)
3. [Clone and Setup Project](#clone-and-setup-project)
4. [Backend Setup](#backend-setup)
5. [iOS App Setup in Xcode](#ios-app-setup-in-xcode)
6. [Testing Locally](#testing-locally)
7. [Using VS Code (Optional)](#using-vs-code-optional)
8. [Obtaining Required Keys](#obtaining-required-keys)
9. [Common Issues](#common-issues)

---

## System Requirements

- **macOS:** 12.0 (Monterey) or later
- **RAM:** 8GB minimum (16GB recommended for Xcode)
- **Disk Space:** 10GB free (for Xcode and dependencies)
- **Internet:** Required for downloads

---

## Install Prerequisites

### 1. Install Homebrew (Package Manager)

Open Terminal and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Verify installation:
```bash
brew --version
```

### 2. Install Node.js

```bash
# Install Node.js 18 (LTS)
brew install node@18

# Link Node.js
brew link node@18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 3. Install Git

```bash
# Git is usually pre-installed, but to ensure latest version:
brew install git

# Verify
git --version
```

### 4. Install Xcode

**Method 1: Mac App Store (Recommended)**

1. Open App Store
2. Search for "Xcode"
3. Click "Get" or "Install"
4. Wait for download (12+ GB, takes 30-60 minutes)

**Method 2: Direct Download**

1. Visit https://developer.apple.com/xcode/
2. Download Xcode 15 or later
3. Move to Applications folder

**After Installation:**

```bash
# Install Command Line Tools
xcode-select --install

# Verify
xcodebuild -version

# Accept license
sudo xcodebuild -license accept
```

### 5. Install Docker (Optional)

For containerized deployment:

```bash
# Install Docker Desktop
brew install --cask docker

# Launch Docker Desktop from Applications
# Wait for Docker to start (whale icon in menu bar)

# Verify
docker --version
docker-compose --version
```

### 6. Install Code Editor (Optional)

**VS Code:**
```bash
brew install --cask visual-studio-code
```

**Or download from:** https://code.visualstudio.com/

---

## Clone and Setup Project

### 1. Clone Repository

```bash
# Navigate to your projects directory
cd ~/Projects  # or wherever you keep projects

# Clone the repository
git clone https://github.com/prashanthnimmagadda/X-Converter.git

# Navigate into project
cd X-Converter
```

### 2. Automated Setup

```bash
# Make setup script executable
chmod +x setup.sh

# Run automated setup
./setup.sh
```

The script will:
- Check all prerequisites
- Install backend dependencies
- Create configuration files
- Test the backend server

If setup completes successfully, skip to [iOS App Setup](#ios-app-setup-in-xcode).

---

## Backend Setup

### 1. Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install npm packages
npm install
```

Expected output:
```
added 150 packages in 30s
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env
```

Basic configuration:
```bash
PORT=3000
NODE_ENV=development
TEMP_DIR=./temp
MAX_PROCESSING_TIME=30000
```

Save and exit: `Ctrl+X`, `Y`, `Enter`

### 3. Create Temp Directory

```bash
mkdir -p temp
```

### 4. Start Backend Server

**Option 1: Development Mode (recommended for testing)**

```bash
npm run dev
```

**Option 2: Production Mode**

```bash
npm start
```

Expected output:
```
X Content to PDF Converter Backend
Server running on port 3000
Health check: http://localhost:3000/health

Endpoints:
  POST /convert   - Convert X URL to PDF
  POST /validate  - Validate X URL
```

### 5. Test Backend

Open a **new Terminal window** and run:

```bash
# Test health endpoint
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-01-21T..."}
```

**Run full test suite:**

```bash
cd backend
chmod +x test-api.sh
./test-api.sh
```

Keep the backend server running for iOS testing.

---

## iOS App Setup in Xcode

### 1. Launch Xcode

```bash
# Open Xcode
open /Applications/Xcode.app
```

Or find Xcode in Applications folder.

### 2. Create New Project

1. **Welcome Screen:** Click "Create a new Xcode project"
2. **Template:** Select **iOS** → **App**
3. **Options:**
   - Product Name: `XConverter`
   - Team: Select your Apple ID (or add one)
   - Organization Identifier: `com.yourname` (e.g., `com.john`)
   - Bundle Identifier: Will auto-populate (e.g., `com.john.XConverter`)
   - Interface: **Storyboard**
   - Language: **Swift**
   - Storage: **None**
   - ✗ Include Tests (uncheck for now)
4. **Location:** Save in `~/Projects/X-Converter/ios/`
5. Click **Create**

### 3. Add Share Extension Target

1. **File** → **New** → **Target**
2. Select **iOS** → **Share Extension**
3. **Options:**
   - Product Name: `ShareExtension`
   - Team: Same as main app
   - Language: **Swift**
4. Click **Finish**
5. **Activate Scheme:** Click **Activate**

### 4. Configure Project Structure

#### Project Navigator (Left Sidebar)

You should see:
```
XConverter/
├── XConverter/
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   ├── ViewController.swift
│   ├── Assets.xcassets
│   └── Info.plist
└── ShareExtension/
    ├── ShareViewController.swift
    └── Info.plist
```

### 5. Add Source Files

#### Step 1: Delete Default Files

1. Right-click `XConverter/ViewController.swift` → **Delete** → **Move to Trash**
2. Right-click `ShareExtension/ShareViewController.swift` → **Delete** → **Move to Trash**
3. Delete `Main.storyboard` if present

#### Step 2: Add Main App Files

1. **Finder:** Navigate to `X-Converter/ios/XConverter/XConverter/`
2. **Select all `.swift` files:**
   - AppDelegate.swift
   - SceneDelegate.swift
   - ViewController.swift
   - SettingsViewController.swift
   - AppConfig.swift
   - NetworkManager.swift

3. **Drag into Xcode** → `XConverter` group
4. **Options dialog:**
   - ✓ Copy items if needed
   - ✓ Create groups
   - Target: ✓ XConverter (main app only)
5. Click **Finish**

#### Step 3: Add Share Extension Files

1. **Finder:** Navigate to `X-Converter/ios/XConverter/ShareExtension/`
2. **Select:**
   - ShareViewController.swift
   - PDFFileManager.swift

3. **Drag into Xcode** → `ShareExtension` group
4. **Options dialog:**
   - ✓ Copy items if needed
   - Target: ✓ ShareExtension (extension only)
5. Click **Finish**

#### Step 4: Replace Info.plist Files

**Main App Info.plist:**

1. Open `X-Converter/ios/XConverter/XConverter/Info.plist` in Finder
2. Copy its contents
3. In Xcode, open `XConverter/Info.plist`
4. Replace contents (or delete and drag new one)

**Share Extension Info.plist:**

1. Open `X-Converter/ios/XConverter/ShareExtension/Info.plist` in Finder
2. Copy its contents
3. In Xcode, open `ShareExtension/Info.plist`
4. Replace contents

### 6. Configure Build Settings

#### Main App Target (XConverter)

1. Select project in navigator (top item)
2. Select **XConverter** target
3. **General Tab:**
   - **Display Name:** X Converter
   - **Bundle Identifier:** `com.yourname.XConverter`
   - **Version:** 1.0
   - **Build:** 1
   - **Deployment Info:**
     - iOS: **16.0**
     - Devices: iPhone and iPad

4. **Signing & Capabilities:**
   - ✓ Automatically manage signing
   - Team: Select your Apple ID
   - Should show "Signing Certificate: Apple Development"

#### Share Extension Target (ShareExtension)

1. Select **ShareExtension** target
2. **General Tab:**
   - **Bundle Identifier:** `com.yourname.XConverter.ShareExtension`
     (Must match main app + `.ShareExtension`)
   - iOS: **16.0**

3. **Signing & Capabilities:**
   - ✓ Automatically manage signing
   - Team: Same as main app

### 7. Remove Storyboard References

**Main App:**

1. Select **XConverter** target
2. **Info** tab
3. Find "Main storyboard file base name"
4. Delete this entry (press `-` button)

**Or edit Info.plist directly:**

1. Open `XConverter/Info.plist` as source code (Right-click → Open As → Source Code)
2. Remove these lines if present:
```xml
<key>UIMainStoryboardFile</key>
<string>Main</string>
```

### 8. Build the Project

1. **Select Scheme:** XConverter (top left, next to Run button)
2. **Select Simulator:** iPhone 15 Pro (or any iOS 16+ simulator)
3. **Build:** Press **⌘B** (Command + B)

**Expected:** "Build Succeeded" (green checkmark)

**If errors occur:** See [Common Issues](#common-issues)

### 9. Run the App

1. Press **⌘R** (Command + R) or click Run button (▶)
2. Simulator should launch
3. App should display main screen with:
   - Title: "X → PDF Converter"
   - Description and instructions
   - Settings button
   - View Saved PDFs button

---

## Testing Locally

### Backend Testing

#### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

✓ **Expected:** `{"status":"ok",...}`

#### Test 2: Validate URL

```bash
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://x.com/elonmusk/status/1"}'
```

✓ **Expected:** `{"success":true,...}`

#### Test 3: Convert to PDF

```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{"url":"https://x.com/elonmusk/status/1"}' \
  --output test.pdf
```

✓ **Expected:** `test.pdf` file created

### iOS App Testing

#### Test 1: Launch App

1. Run app in simulator (⌘R)
2. ✓ **Expected:** App launches without crash

#### Test 2: Configure Settings

1. Tap **Settings** button
2. Tap **Server URL** field
3. Change to: `http://127.0.0.1:3000`
   - ⚠️ Use `127.0.0.1`, NOT `localhost` (iOS limitation)
4. Tap < Back
5. ✓ **Expected:** Settings saved

#### Test 3: Test Share Extension

1. Open **Safari** in simulator
2. Navigate to: `https://x.com/` (or any X post URL)
3. Tap **Share** button (square with arrow up)
4. Scroll horizontally on app row
5. Tap **More** (three dots)
6. Find "Convert to PDF" and enable it
7. Tap **Done**
8. Tap **Share** again
9. Select **Convert to PDF**
10. ✓ **Expected:** Extension opens, shows "Converting..."

#### Test 4: Verify PDF Saved

1. Wait for success message (3-10 seconds)
2. Tap **Done** or extension closes automatically
3. Open **Files** app in simulator
4. Navigate to **On My iPhone** → **XConverter**
5. ✓ **Expected:** PDF file listed
6. Tap PDF to open
7. ✓ **Expected:** PDF displays content correctly

#### Test 5: Error Handling

**Stop backend server:**
```bash
# In backend terminal, press Ctrl+C
```

**In iOS:**
1. Try to convert another URL
2. ✓ **Expected:** Error message appears after retries

### End-to-End Test

1. **Backend:** Ensure server is running
2. **iOS:** Configure with `http://127.0.0.1:3000`
3. **Test:** Share an actual X post
4. **Wait:** 3-10 seconds
5. **Verify:** PDF created successfully
6. **Check:** PDF content matches original post

---

## Using VS Code (Optional)

### 1. Open Project in VS Code

```bash
cd ~/Projects/X-Converter
code .
```

### 2. Recommended Extensions

Install these extensions:

1. **ES7+ React/Redux/React-Native snippets**
2. **Prettier - Code formatter**
3. **ESLint**
4. **Docker** (if using Docker)
5. **REST Client** (for API testing)

### 3. Integrated Terminal

```bash
# Open terminal in VS Code: Ctrl+`
# Navigate to backend
cd backend

# Run server
npm run dev
```

### 4. API Testing with REST Client

Create `test-requests.http`:

```http
### Health Check
GET http://localhost:3000/health

### Validate URL
POST http://localhost:3000/validate
Content-Type: application/json

{
  "url": "https://x.com/elonmusk/status/1"
}

### Convert to PDF
POST http://localhost:3000/convert
Content-Type: application/json

{
  "url": "https://x.com/elonmusk/status/1"
}
```

Click **Send Request** above each endpoint.

---

## Obtaining Required Keys

### Good News: No API Keys Required!

This application **does not require any external API keys** or tokens for basic operation.

### What You Need:

1. **Apple ID** (Free)
   - For iOS development
   - Sign up at: https://appleid.apple.com/
   - Add to Xcode: Preferences → Accounts → + → Add Apple ID

2. **Apple Developer Account** (Optional)
   - **Free tier:** Testing on simulator only
   - **Paid ($99/year):** Testing on physical devices + App Store
   - Sign up: https://developer.apple.com/programs/

### Configuration:

All configuration is in **`.env` file** (backend):

```bash
PORT=3000                    # Server port
NODE_ENV=development         # Environment
TEMP_DIR=./temp             # Temporary files
MAX_PROCESSING_TIME=30000   # Timeout (30 seconds)
```

**No external API keys needed!**

### iOS Configuration:

All configuration in the **app Settings**:

- **Server URL:** Where your backend is running
- **Auto-save:** Enable/disable auto-save
- **Notifications:** Show/hide notifications

### Future: If Adding Features

If you add external services later:

**Sentry (Error Tracking):**
```bash
SENTRY_DSN=https://...@sentry.io/...
```
Get from: https://sentry.io/

**Analytics (Optional):**
```bash
ANALYTICS_KEY=your_key_here
```

---

## Common Issues

### Backend Issues

#### Error: `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
# Edit backend/.env: PORT=3001
```

#### Error: `Cannot find module 'puppeteer'`

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### Error: `Failed to launch browser`

**Solution:**
```bash
# Reinstall Puppeteer
cd backend
npm rebuild puppeteer

# Or install Chromium
brew install chromium
```

### iOS Issues

#### Error: "No such module 'UIKit'"

**Solution:**
- Clean build folder: **Product → Clean Build Folder** (⌘⇧K)
- Close and reopen Xcode
- Build again

#### Error: "Bundle Identifier is in use"

**Solution:**
- Change Bundle Identifier to something unique
- Format: `com.yourname.XConverter`

#### Share Extension Not Appearing

**Solution:**
1. Clean build: ⌘⇧K
2. Delete app from simulator: Long press → Delete
3. Delete derived data:
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```
4. Restart Xcode and simulator
5. Build and run again

#### Error: "Failed to register bundle identifier"

**Solution:**
- Ensure Bundle IDs are unique
- Main app: `com.yourname.XConverter`
- Extension: `com.yourname.XConverter.ShareExtension`
- Check Apple ID is added to Xcode

#### Network Connection Failed

**Solution:**
1. Verify backend is running:
```bash
curl http://localhost:3000/health
```

2. Use `127.0.0.1` not `localhost` in iOS Settings

3. Check firewall (System Settings → Network → Firewall)

4. For physical device:
```bash
# Get your Mac's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1
# Use this IP in iOS Settings: http://192.168.x.x:3000
```

### Build Issues

#### Error: "Command PhaseScriptExecution failed"

**Solution:**
- Check file permissions
- Ensure all files are added to correct targets
- Clean and rebuild

#### Error: "Signing for requires a development team"

**Solution:**
- Xcode → Preferences → Accounts
- Add your Apple ID (+ button)
- Select target → Signing & Capabilities
- Choose your team

---

## Next Steps

After successful setup:

1. **Customize:**
   - Edit `backend/.env` for your needs
   - Update app colors/design in Swift files

2. **Deploy Backend:**
   - See [DEPLOYMENT.md](DEPLOYMENT.md)
   - Options: Docker, AWS, GCP, etc.

3. **Distribute iOS App:**
   - TestFlight for beta testing
   - App Store for public release
   - See [ios/README.md](ios/README.md)

4. **Monitor:**
   - Add error tracking (Sentry)
   - Add analytics (optional)
   - Monitor server logs

---

## Quick Reference

### Start Backend
```bash
cd backend && npm run dev
```

### Test Backend
```bash
curl http://localhost:3000/health
```

### Run iOS App
```
Xcode → Select XConverter → Press ⌘R
```

### iOS Settings
```
Server URL: http://127.0.0.1:3000
```

### View Logs
```bash
# Backend
cd backend && npm run dev

# iOS
Xcode → View → Debug Area → Show Debug Area
```

---

## Support

- **Documentation:** [README.md](README.md)
- **Testing:** [TESTING.md](TESTING.md)
- **Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues:** GitHub Issues

Happy coding! 🚀
