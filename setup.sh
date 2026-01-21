#!/bin/bash

# X-Converter Local Setup Script
# Automated setup for macOS development environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "================================"
echo "X-Converter Setup Script"
echo "================================"
echo ""

# Function to print status
print_status() {
    echo -e "${BLUE}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_warning "This script is optimized for macOS. Continue? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Check prerequisites
echo ""
print_status "Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found. Please install npm."
    exit 1
fi

# Check Docker (optional)
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker installed: $DOCKER_VERSION"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker not found (optional for production deployment)"
    DOCKER_AVAILABLE=false
fi

# Check Xcode (for iOS development)
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    print_success "Xcode installed: $XCODE_VERSION"
    XCODE_AVAILABLE=true
else
    print_warning "Xcode not found (required for iOS development)"
    XCODE_AVAILABLE=false
fi

# Setup backend
echo ""
print_status "Setting up backend..."
echo ""

cd backend

# Install dependencies
print_status "Installing backend dependencies..."
npm install
print_success "Backend dependencies installed"

# Create .env file
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    cp .env.example .env
    print_success ".env file created"
else
    print_warning ".env file already exists (skipping)"
fi

# Create temp directory
if [ ! -d temp ]; then
    print_status "Creating temp directory..."
    mkdir -p temp
    print_success "Temp directory created"
fi

cd ..

# Test backend
echo ""
print_status "Testing backend server..."
echo ""

cd backend

# Start server in background
print_status "Starting backend server..."
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Check if server is running
if curl -s http://localhost:3000/health > /dev/null; then
    print_success "Backend server is running (PID: $SERVER_PID)"

    # Run tests
    echo ""
    print_status "Running API tests..."
    chmod +x test-api.sh
    ./test-api.sh

    # Stop server
    print_status "Stopping backend server..."
    kill $SERVER_PID
    print_success "Backend server stopped"
else
    print_error "Backend server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

cd ..

# Setup complete
echo ""
echo "================================"
print_success "Setup Complete!"
echo "================================"
echo ""

# Print next steps
echo "Next Steps:"
echo ""
echo "1. Start the backend server:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Configure your server URL:"
echo "   Edit backend/.env to customize settings"
echo ""

if [ "$XCODE_AVAILABLE" = true ]; then
    echo "3. Set up iOS app in Xcode:"
    echo "   - Open Xcode"
    echo "   - Create new iOS App: 'XConverter'"
    echo "   - Add Share Extension target"
    echo "   - Copy Swift files from ios/XConverter/"
    echo "   - Build and run"
    echo ""
fi

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "4. Or use Docker:"
    echo "   docker-compose up -d"
    echo ""
fi

echo "For detailed instructions, see:"
echo "  - README.md (main documentation)"
echo "  - backend/README.md (backend setup)"
echo "  - ios/README.md (iOS setup)"
echo "  - TESTING.md (testing guide)"
echo ""

print_success "Happy coding!"
echo ""
