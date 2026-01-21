# X-Converter Testing Guide

Complete guide for testing the X Content to PDF Converter locally on macOS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Backend Testing](#backend-testing)
4. [iOS App Testing](#ios-app-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Troubleshooting](#troubleshooting)
7. [Production Testing](#production-testing)

---

## Prerequisites

### Required Software

1. **Node.js 18+**
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **npm or yarn**
   - Comes with Node.js
   - Verify: `npm --version`

3. **Xcode 15+** (for iOS development)
   - Download from Mac App Store
   - Install Command Line Tools: `xcode-select --install`
   - Verify: `xcodebuild -version`

4. **Git**
   - Usually pre-installed on macOS
   - Verify: `git --version`

### Optional Software

1. **Docker Desktop** (for containerized deployment)
   - Download: https://www.docker.com/products/docker-desktop
   - Verify: `docker --version`

2. **Postman** or **Insomnia** (for API testing)
   - Postman: https://www.postman.com/
   - Insomnia: https://insomnia.rest/

3. **VS Code** or your preferred code editor
   - Download: https://code.visualstudio.com/

### System Requirements

- **macOS** 12.0 (Monterey) or later
- **RAM:** 8GB minimum, 16GB recommended
- **Disk Space:** 5GB free space
- **Internet connection** for downloading dependencies

---

## Local Setup

### Method 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
# Clone the repository
git clone https://github.com/yourusername/X-Converter.git
cd X-Converter

# Make setup script executable
chmod +x setup.sh

# Run setup
./setup.sh
```

The script will:
- Check all prerequisites
- Install backend dependencies
- Create configuration files
- Start and test the backend server

### Method 2: Manual Setup

#### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/X-Converter.git
cd X-Converter
```

#### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Create temp directory
mkdir -p temp

# Verify installation
npm list
```

#### Step 3: Configure Environment

Edit `backend/.env`:

```bash
PORT=3000
NODE_ENV=development
TEMP_DIR=./temp
MAX_PROCESSING_TIME=30000
```

---

## Backend Testing

### 1. Start Backend Server

#### Development Mode (with auto-reload)

```bash
cd backend
npm run dev
```

#### Production Mode

```bash
cd backend
npm start
```

### 2. Verify Server is Running

Open browser and navigate to:
```
http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

### 3. Run Automated API Tests

```bash
cd backend
chmod +x test-api.sh
./test-api.sh
```

### 4. Manual API Testing

#### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

Expected: `200 OK` with JSON response

#### Test 2: Validate URL (Valid)

```bash
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://x.com/elonmusk/status/1"}'
```

Expected: `200 OK` with classification data

#### Test 3: Validate URL (Invalid)

```bash
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}'
```

Expected: `400 Bad Request` with error message

#### Test 4: Convert URL to PDF

**⚠️ Note:** This requires a valid, publicly accessible X URL.

```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{"url":"https://x.com/username/status/123"}' \
  --output test.pdf
```

Expected: PDF file saved as `test.pdf`

#### Test 5: Missing URL Parameter

```bash
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: `400 Bad Request`

#### Test 6: Unknown Endpoint

```bash
curl http://localhost:3000/unknown
```

Expected: `404 Not Found`

### 5. Performance Testing

#### Test Processing Time

```bash
time curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{"url":"https://x.com/username/status/123"}' \
  --output test.pdf
```

Expected: < 10 seconds total time

#### Test Concurrent Requests

```bash
# Install Apache Bench (if not installed)
brew install httpd

# Run load test
ab -n 10 -c 2 -T application/json \
  -p request.json \
  http://localhost:3000/validate
```

Where `request.json` contains:
```json
{"url":"https://x.com/username/status/123"}
```

---

## iOS App Testing

### 1. Create Xcode Project

#### Step 1: Create New Project

1. Open Xcode
2. File → New → Project
3. Select **iOS** → **App**
4. Product Name: `XConverter`
5. Organization Identifier: `com.yourcompany`
6. Interface: **Storyboard**
7. Language: **Swift**
8. Click **Create**

#### Step 2: Add Share Extension

1. File → New → Target
2. Select **Share Extension**
3. Product Name: `ShareExtension`
4. Language: **Swift**
5. Click **Finish**
6. Activate scheme: **Yes**

### 2. Add Source Files

#### Main App Files

Copy these files to `XConverter` group:

```
ios/XConverter/XConverter/AppDelegate.swift
ios/XConverter/XConverter/SceneDelegate.swift
ios/XConverter/XConverter/ViewController.swift
ios/XConverter/XConverter/SettingsViewController.swift
ios/XConverter/XConverter/AppConfig.swift
ios/XConverter/XConverter/NetworkManager.swift
```

#### Share Extension Files

Copy these files to `ShareExtension` group:

```
ios/XConverter/ShareExtension/ShareViewController.swift
ios/XConverter/ShareExtension/PDFFileManager.swift
```

#### Info.plist Files

Replace the default `Info.plist` files with:

```
ios/XConverter/XConverter/Info.plist
ios/XConverter/ShareExtension/Info.plist
```

### 3. Configure Project

#### Bundle Identifiers

1. **Main App:**
   - Select project → XConverter target
   - General → Bundle Identifier: `com.yourcompany.XConverter`

2. **Share Extension:**
   - Select ShareExtension target
   - General → Bundle Identifier: `com.yourcompany.XConverter.ShareExtension`

#### Deployment Target

Set both targets to **iOS 16.0** or later:
- General → Deployment Info → iOS Deployment Target

#### Signing

Enable **Automatically manage signing** for both targets:
- Signing & Capabilities → Automatically manage signing ✓

### 4. Remove Default Files

Delete if present:
- `Main.storyboard` (if exists)
- Default `ShareViewController.swift` (replace with ours)

Update `Info.plist`:
- Remove "Main storyboard file base name" if present

### 5. Build and Run

#### Build Main App

1. Select scheme: **XConverter**
2. Select simulator: **iPhone 15 Pro** (or your preference)
3. Press **⌘R** or click Run
4. App should launch successfully

#### Build Share Extension

1. Select scheme: **ShareExtension**
2. Build: **⌘B**
3. Should build without errors

### 6. Test in Simulator

#### Configure Server URL

1. Launch XConverter app
2. Tap **Settings**
3. Update **Server URL**: `http://127.0.0.1:3000`
   - ⚠️ Use `127.0.0.1`, not `localhost` (iOS limitation)
4. Go back to main screen

#### Test Share Extension

1. Open **Safari** in simulator
2. Navigate to any X URL (e.g., `https://x.com/elonmusk`)
3. Tap **Share** button (square with arrow)
4. Scroll and tap **More** if "Convert to PDF" doesn't appear
5. Enable "Convert to PDF" and tap **Done**
6. Go back and tap **Share** again
7. Select **Convert to PDF**
8. Wait for conversion (3-10 seconds)
9. Should show success message

#### Verify PDF Saved

1. Open **Files** app in simulator
2. Navigate to **On My iPhone** → **XConverter**
3. PDF should be listed
4. Tap to open and verify content

---

## End-to-End Testing

### Test Scenario 1: Article Conversion

1. **Backend:** Ensure server is running
2. **iOS:** Launch app and configure URL
3. **Test:** Share an X article URL
4. **Verify:** PDF contains full article with images
5. **Check:** Formatting is clean and readable

### Test Scenario 2: Single Post Conversion

1. **Test:** Share a single X post
2. **Verify:** PDF shows author, text, and images
3. **Check:** Timestamp is correct
4. **Check:** Source URL in footer

### Test Scenario 3: Thread Conversion

1. **Test:** Share a thread (multiple posts by same author)
2. **Verify:** All posts in thread are included
3. **Check:** Posts are in correct order
4. **Check:** First post is visually prominent

### Test Scenario 4: Error Handling

1. **Test:** Invalid URL (non-X domain)
2. **Verify:** Error message is user-friendly
3. **Test:** Network failure (stop backend)
4. **Verify:** Retry logic works
5. **Verify:** Final error message after retries

### Test Scenario 5: Duplicate Files

1. **Test:** Convert same URL twice
2. **Verify:** Second file has numbered suffix
3. **Check:** Both files exist
4. **Verify:** Content is identical

---

## Troubleshooting

### Backend Issues

#### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

#### Issue: Puppeteer Fails to Launch

**Error:** `Failed to launch the browser process`

**Solution (macOS):**
```bash
# Install Chromium via Homebrew
brew install chromium

# Or reinstall Puppeteer
cd backend
npm rebuild puppeteer
```

#### Issue: Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### iOS Issues

#### Issue: Share Extension Not Appearing

**Solution:**
1. Clean build folder: **Product → Clean Build Folder** (⌘⇧K)
2. Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Restart Xcode
4. Restart simulator
5. Rebuild both targets

#### Issue: Network Connection Failed

**Error:** "Failed to connect to server"

**Solution:**
1. Verify backend is running: `curl http://localhost:3000/health`
2. Use `127.0.0.1` instead of `localhost` in iOS settings
3. Check firewall settings
4. For physical device: Use computer's IP address (e.g., `http://192.168.1.100:3000`)

#### Issue: Build Errors

**Error:** Various Swift compilation errors

**Solution:**
1. Ensure all files are added to correct target
2. Check Bundle IDs match
3. Verify deployment target is set
4. Clean and rebuild

#### Issue: PDF Not Saving

**Solution:**
1. Check Files app permissions
2. Verify temp directory exists
3. Check device storage space
4. Review error messages in Xcode console

### Testing on Physical Device

#### Get Computer's IP Address

```bash
# Find your IP address
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Example output: `inet 192.168.1.100`

#### Update iOS Settings

1. Open XConverter app on device
2. Settings → Server URL: `http://192.168.1.100:3000`
3. Test conversion

---

## Production Testing

### Pre-Deployment Checklist

Backend:
- [ ] All tests pass: `./backend/test-api.sh`
- [ ] No console errors
- [ ] Memory usage stable
- [ ] Response times < 10s
- [ ] Error handling works
- [ ] Temp files cleanup

iOS:
- [ ] Builds without warnings
- [ ] All features work
- [ ] Share extension appears
- [ ] PDFs save correctly
- [ ] Error messages clear
- [ ] No crashes

### Load Testing

```bash
# Install Apache Bench
brew install httpd

# Create request payload
echo '{"url":"https://x.com/test/status/1"}' > request.json

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 -T application/json -p request.json \
  http://localhost:3000/validate
```

### Monitor Performance

```bash
# Monitor backend logs
cd backend
npm run dev

# Watch for errors, memory usage, processing times
```

### Security Testing

1. **Input Validation:**
   - Test with malicious URLs
   - Test with SQL injection patterns
   - Test with XSS payloads

2. **Rate Limiting:**
   - Send rapid requests
   - Verify server handles gracefully

3. **SSL/TLS:**
   - Ensure HTTPS in production
   - Test certificate validity

---

## Test Results Documentation

### Template

```markdown
## Test Report

**Date:** YYYY-MM-DD
**Tester:** Name
**Environment:** Development/Staging/Production

### Backend Tests
- Health check: ✓ PASS / ✗ FAIL
- Validate endpoint: ✓ PASS / ✗ FAIL
- Convert endpoint: ✓ PASS / ✗ FAIL
- Error handling: ✓ PASS / ✗ FAIL
- Performance: [X seconds average]

### iOS Tests
- App launch: ✓ PASS / ✗ FAIL
- Settings: ✓ PASS / ✗ FAIL
- Share extension: ✓ PASS / ✗ FAIL
- PDF generation: ✓ PASS / ✗ FAIL
- File saving: ✓ PASS / ✗ FAIL

### End-to-End Tests
- Article conversion: ✓ PASS / ✗ FAIL
- Post conversion: ✓ PASS / ✗ FAIL
- Thread conversion: ✓ PASS / ✗ FAIL

### Issues Found
1. [Description]
2. [Description]

### Notes
[Any additional observations]
```

---

## Continuous Testing

### Automated Testing

Set up GitHub Actions (`.github/workflows/test.yml`):

```yaml
name: Test

on: [push, pull_request]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm install
      - name: Start server
        run: cd backend && npm start &
      - name: Run tests
        run: cd backend && ./test-api.sh
```

---

## Additional Resources

- [Backend README](backend/README.md)
- [iOS README](ios/README.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Main README](README.md)

---

## Support

For issues:
1. Check this guide
2. Review error messages
3. Check GitHub Issues
4. Open a new issue with:
   - Environment details
   - Steps to reproduce
   - Error messages
   - Screenshots if applicable
