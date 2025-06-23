#!/bin/bash

# Playwright Setup Script for Linux/Ubuntu
# Handles dependency installation and browser setup

echo "🎭 Setting up Playwright for Cross-Device Testing"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    print_warning "This script is designed for Linux. For other OS, please check Playwright documentation."
fi

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. This is not recommended for development."
fi

# Function to install system dependencies
install_system_deps() {
    print_status "Installing system dependencies..."
    
    # Update package list
    sudo apt-get update
    
    # Install required dependencies
    sudo apt-get install -y \
        libevent-2.1-7 \
        libavif16 \
        libgstreamer-plugins-bad1.0-0 \
        libgstreamer-plugins-base1.0-0 \
        libgstreamer1.0-0 \
        libharfbuzz-icu0 \
        libhyphen0 \
        libmanette-0.2-0 \
        libsecret-1-0 \
        libsoup2.4-1 \
        libwayland-client0 \
        libwayland-egl1 \
        libwayland-server0 \
        libwoff1 \
        libxcomposite1 \
        libxdamage1 \
        libxkbcommon0 \
        libxrandr2 \
        xvfb
    
    if [[ $? -eq 0 ]]; then
        print_success "System dependencies installed successfully"
    else
        print_error "Failed to install system dependencies"
        return 1
    fi
}

# Function to install Playwright
install_playwright() {
    print_status "Installing Playwright..."
    
    # Install Playwright package with force flag
    npm install @playwright/test --force
    
    if [[ $? -eq 0 ]]; then
        print_success "Playwright package installed"
    else
        print_error "Failed to install Playwright package"
        return 1
    fi
}

# Function to install browsers
install_browsers() {
    print_status "Installing Playwright browsers..."
    
    # Install browsers
    npx playwright install
    
    if [[ $? -eq 0 ]]; then
        print_success "Playwright browsers installed"
    else
        print_error "Failed to install browsers"
        return 1
    fi
}

# Function to install browser dependencies
install_browser_deps() {
    print_status "Installing browser dependencies..."
    
    # Install browser dependencies
    sudo npx playwright install-deps
    
    if [[ $? -eq 0 ]]; then
        print_success "Browser dependencies installed"
    else
        print_error "Failed to install browser dependencies"
        return 1
    fi
}

# Function to test installation
test_installation() {
    print_status "Testing Playwright installation..."
    
    # Create a simple test file
    cat > test-installation.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://example.com');
    console.log('✅ Playwright is working correctly!');
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Playwright test failed:', error.message);
    process.exit(1);
  }
})();
EOF

    # Run test
    node test-installation.js
    local test_result=$?
    
    # Clean up test file
    rm test-installation.js
    
    if [[ $test_result -eq 0 ]]; then
        print_success "Playwright installation test passed"
    else
        print_error "Playwright installation test failed"
        return 1
    fi
}

# Main installation process
main() {
    print_status "Starting Playwright setup process..."
    
    # Check if we have sudo access
    if ! sudo -n true 2>/dev/null; then
        print_warning "This script requires sudo access for system dependencies."
        print_status "You may be prompted for your password."
    fi
    
    # Install components step by step
    install_playwright || exit 1
    install_system_deps || exit 1
    install_browser_deps || exit 1
    install_browsers || exit 1
    test_installation || exit 1
    
    print_success "🎉 Playwright setup completed successfully!"
    echo ""
    echo "You can now run cross-device tests with:"
    echo "  npm run test"
    echo "  npm run test:cross-device"
    echo "  npm run test:mobile"
    echo ""
}

# Handle command line arguments
case "${1:-}" in
    --deps-only)
        print_status "Installing only system dependencies..."
        install_system_deps
        ;;
    --browsers-only)
        print_status "Installing only browsers..."
        install_browsers
        ;;
    --test)
        print_status "Testing existing installation..."
        test_installation
        ;;
    --help|-h)
        echo "Playwright Setup Script"
        echo ""
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  --deps-only      Install only system dependencies"
        echo "  --browsers-only  Install only browsers"
        echo "  --test          Test existing installation"
        echo "  --help, -h      Show this help message"
        echo ""
        echo "Run without arguments to perform full setup."
        ;;
    *)
        main
        ;;
esac
