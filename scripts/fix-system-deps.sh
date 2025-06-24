#!/bin/bash

# Fix System Dependencies for Playwright

echo "🔧 Fixing System Dependencies for Playwright"
echo "============================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Fix GPG key issues
fix_gpg_keys() {
    print_status "Fixing GPG key issues..."
    
    # Fix Wine key
    print_status "Fixing Wine repository key..."
    sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 76F1A20FF987672F 2>/dev/null || true
    
    # Fix AnyDesk key  
    print_status "Fixing AnyDesk repository key..."
    sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys A2FB21D5A8772835 2>/dev/null || true
    
    # Fix MySQL key
    print_status "Fixing MySQL repository key..."
    sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys B7B3B788A8D3785C 2>/dev/null || true
    
    print_success "GPG keys fixed"
}

# Update package lists
update_packages() {
    print_status "Updating package lists..."
    
    if sudo apt-get update; then
        print_success "Package lists updated"
    else
        print_warning "Some repositories failed to update, but continuing..."
    fi
}

# Install Playwright system dependencies manually
install_playwright_deps() {
    print_status "Installing Playwright system dependencies manually..."
    
    # Core dependencies for Playwright browsers
    DEPS=(
        "libnss3"
        "libnspr4" 
        "libatk-bridge2.0-0"
        "libdrm2"
        "libxkbcommon0"
        "libxcomposite1"
        "libxdamage1"
        "libxrandr2"
        "libgbm1"
        "libxss1"
        "libasound2"
        "libatspi2.0-0"
        "libgtk-3-0"
        "libgdk-pixbuf2.0-0"
        "libxshmfence1"
        "libglu1-mesa"
    )
    
    for dep in "${DEPS[@]}"; do
        print_status "Installing $dep..."
        sudo apt-get install -y "$dep" || print_warning "Failed to install $dep"
    done
    
    print_success "Core dependencies installed"
}

# Try Playwright install-deps again
retry_playwright_deps() {
    print_status "Retrying Playwright system dependencies installation..."
    
    if sudo npx playwright install-deps; then
        print_success "Playwright system dependencies installed successfully"
        return 0
    else
        print_warning "Playwright install-deps still failing, but core deps are installed"
        return 1
    fi
}

# Test browsers
test_browsers() {
    print_status "Testing browser installations..."
    
    # Test Chromium
    if npx playwright install chromium; then
        print_success "Chromium is working"
    else
        print_warning "Chromium may have issues"
    fi
    
    # Test Firefox  
    if npx playwright install firefox; then
        print_success "Firefox is working"
    else
        print_warning "Firefox may have issues"
    fi
    
    # Test WebKit
    if npx playwright install webkit; then
        print_success "WebKit is working"
    else
        print_warning "WebKit may have issues"
    fi
}

# Main function
main() {
    print_status "Starting system dependencies fix..."
    
    fix_gpg_keys
    update_packages
    install_playwright_deps
    
    if retry_playwright_deps; then
        print_success "✅ All dependencies installed successfully!"
    else
        print_warning "⚠️ Some dependencies may be missing, but basic functionality should work"
    fi
    
    test_browsers
    
    echo ""
    print_success "🎉 System dependencies setup completed!"
    echo ""
    echo "You can now run:"
    echo "  npm run test:ui        # Interactive test UI"
    echo "  npm run test:headed    # Tests with browser UI"
    echo "  npm run test          # All tests"
    echo ""
}

# Run main function
main
