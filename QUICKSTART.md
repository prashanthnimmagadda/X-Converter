# Quick Start Guide

Get X-Converter running in under 10 minutes.

## Prerequisites

- macOS 12+
- [Node.js 18+](https://nodejs.org/)
- [Xcode 15+](https://apps.apple.com/us/app/xcode/id497799835)

## 5-Minute Backend Setup

```bash
# 1. Clone repository
git clone https://github.com/prashanthnimmagadda/X-Converter.git
cd X-Converter

# 2. Run automated setup
chmod +x setup.sh
./setup.sh

# 3. Start server (in new terminal)
cd backend
npm run dev
```

✅ Backend running at `http://localhost:3000`

## Test Backend

```bash
# Open new terminal
curl http://localhost:3000/health
```

Expected: `{"status":"ok",...}`

## 5-Minute iOS Setup

### 1. Create Xcode Project

```
1. Open Xcode
2. File → New → Project → iOS App
3. Name: XConverter
4. Interface: Storyboard
5. Language: Swift
6. Save in: X-Converter/ios/
```

### 2. Add Share Extension

```
1. File → New → Target
2. Share Extension
3. Name: ShareExtension
4. Activate scheme: Yes
```

### 3. Add Files

**Drag and drop:**

Main App (to XConverter group):
- `ios/XConverter/XConverter/*.swift` (6 files)

Share Extension (to ShareExtension group):
- `ios/XConverter/ShareExtension/*.swift` (2 files)

Replace Info.plist files:
- `ios/XConverter/XConverter/Info.plist`
- `ios/XConverter/ShareExtension/Info.plist`

### 4. Configure

**Both targets:**
- Deployment Target: iOS 16.0
- Signing: Automatically manage ✓

**Bundle IDs:**
- Main: `com.yourname.XConverter`
- Extension: `com.yourname.XConverter.ShareExtension`

### 5. Build & Run

```
⌘B to build
⌘R to run
```

## Test End-to-End

### 1. Configure App

```
1. Launch app in simulator
2. Settings → Server URL: http://127.0.0.1:3000
3. Go back
```

### 2. Test Conversion

```
1. Open Safari in simulator
2. Go to: x.com
3. Tap Share button
4. More → Enable "Convert to PDF"
5. Share → Convert to PDF
6. Wait 3-10 seconds
```

### 3. Verify PDF

```
1. Files app → On My iPhone → XConverter
2. PDF should be there
3. Tap to view
```

## Troubleshooting

### Backend won't start

```bash
# Kill existing process
lsof -i :3000
kill -9 <PID>

# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
npm run dev
```

### Share Extension not appearing

```
1. Xcode → Product → Clean Build Folder (⌘⇧K)
2. Delete app from simulator
3. Restart simulator
4. Build and run again
```

### Network error in iOS

- Use `127.0.0.1` not `localhost`
- Ensure backend is running
- Check firewall settings

## What's Next?

- **Full Setup:** See [LOCAL_SETUP_GUIDE.md](LOCAL_SETUP_GUIDE.md)
- **Testing:** See [TESTING.md](TESTING.md)
- **Deploy:** See [DEPLOYMENT.md](DEPLOYMENT.md)

## Docker (Alternative)

```bash
# Start with Docker
docker-compose up -d

# Backend at: http://localhost:3000
# iOS Settings: http://127.0.0.1:3000
```

## Commands Cheat Sheet

```bash
# Backend
cd backend
npm run dev          # Start dev server
npm start            # Start prod server
npm test             # Run tests (if added)
./test-api.sh        # Test API endpoints

# Docker
docker-compose up -d      # Start
docker-compose logs -f    # View logs
docker-compose down       # Stop

# iOS
⌘R                   # Build & run
⌘B                   # Build only
⌘⇧K                  # Clean build
⌘.                   # Stop running
```

## URLs

- **Backend Health:** http://localhost:3000/health
- **Backend API:** http://localhost:3000/convert
- **iOS Settings:** Use `http://127.0.0.1:3000`

## Success Criteria

✅ `curl http://localhost:3000/health` returns OK
✅ iOS app launches without crash
✅ Settings save successfully
✅ Share extension appears in Safari
✅ PDF generated and saved
✅ PDF opens in Files app

## Need Help?

1. Check [TESTING.md](TESTING.md) for detailed testing
2. See [Common Issues](#troubleshooting) above
3. Review [LOCAL_SETUP_GUIDE.md](LOCAL_SETUP_GUIDE.md)
4. Open GitHub Issue with:
   - macOS version
   - Node version: `node --version`
   - Xcode version: `xcodebuild -version`
   - Error message
   - Steps to reproduce

Happy converting! 🚀
