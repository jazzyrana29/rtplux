#!/usr/bin/env bash

# Playwright Setup Script for RTPLUX Casino Platform

echo "🎭 Setting up Playwright for RTPLUX Casino"
echo "=========================================="

# Colors for output
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

# Check Node.js version
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        echo "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+."
        exit 1
    fi

    print_success "Node.js $(node -v) is installed"
}

# Install project dependencies
install_dependencies() {
    print_status "Installing project dependencies..."

    if npm ci --force; then
        print_success "Dependencies installed successfully"
    else
        print_warning "npm ci failed, trying npm install..."
        if npm install --force; then
            print_success "Dependencies installed with npm install"
        else
            print_error "Failed to install dependencies"
            exit 1
        fi
    fi
}

# Install Playwright browsers and OS deps
install_playwright() {
    print_status "Installing Playwright browsers..."

    # Import missing GPG keys (WineHQ, AnyDesk, MySQL) to allow apt updates
    sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys \
        76F1A20FF987672F \
        A2FB21D5A8772835 \
        B7B3B788A8D3785C || true
    sudo apt update

    if npx playwright install; then
        print_success "Playwright browsers installed"
    else
        print_error "Failed to install Playwright browsers"
        exit 1
    fi

    # Install system dependencies (Linux only)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_status "Installing system dependencies for Linux..."
        if sudo npx playwright install-deps 2>/dev/null; then
            print_success "System dependencies installed"
        else
            print_warning "Could not install system dependencies. You may need to run manually:"
            echo "  sudo npx playwright install-deps"
        fi
    fi
}

# Create test directories and set permissions
setup_directories() {
    print_status "Setting up test directories..."

    mkdir -p test-results
    mkdir -p playwright-report

    # Make scripts executable
    find scripts -type f -name "*.sh" -exec chmod +x {} \;

    print_success "Directories created and permissions set"
}

# Test Playwright installation
test_installation() {
    print_status "Testing Playwright installation..."

    # Start dev server in background
    print_status "Starting development server..."
    npm run start &  # use existing "start" script defined in package.json
    DEV_PID=$!

    # Give server time to start
    sleep 10

    # Verify server is running
    if curl -f http://localhost:8081 &> /dev/null; then
        print_success "Development server is running"

        # Run a quick Playwright test
        print_status "Running quick test..."
        if npx playwright test --reporter=list --max-failures=1 tests/cross-device/home-page.spec.ts; then
            print_success "Playwright test passed!"
        else
            print_warning "Test failed, but setup is complete. Check your tests."
        fi
    else
        print_warning "Development server may not be ready. Try running tests manually."
    fi

    # Cleanup: kill server
    kill $DEV_PID 2>/dev/null || true
    sleep 2
}

# Main setup function
main() {
    print_status "Starting Playwright setup..."

    check_node
    install_dependencies
    install_playwright
    setup_directories

    if [ "${1:-}" != "--skip-test" ]; then
        test_installation
    fi

    print_success "🎉 Playwright setup completed successfully!"
    echo ""
    echo "🚀 Quick Start Commands:"
    echo ""
    echo "Development:"
    echo "  npm run start                 # Start development server"
    echo "  npm run test:ui               # Interactive test UI"
    echo "  npm run test:headed           # Run tests with browser UI"
    echo ""
    echo "Testing:"
    echo "  npm run test                  # Run all tests"
    echo "  npm run test:mobile           # Mobile device tests"
    echo "  npm run test:desktop          # Desktop browser tests"
    echo "  npm run test:accessibility    # Accessibility tests"
    echo ""
    echo "Debugging:"
    echo "  npm run test:debug            # Debug mode"
    echo "  npm run test:report           # View test results"
    echo ""
    echo "Visit your app per your start script (e.g., via Expo or localhost:8081)!"
}

# Handle command line arguments
case "${1:-}" in
    --deps-only)
        check_node
        install_dependencies
        ;;
    --browsers-only)
        install_playwright
        ;;
    --test)
        test_installation
        ;;
    --skip-test)
        main --skip-test
        ;;
    --help|-h)
        echo "Playwright Setup Script for RTPLUX Casino"
        echo ""
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  --deps-only       Install dependencies only"
        echo "  --browsers-only   Install Playwright browsers only"
        echo "  --test            Test installation only"
        echo "  --skip-test       Skip test after setup"
        echo "  --help, -h        Show this help message"
        echo ""
        echo "Run without arguments to perform full setup."
        ;;
    *)
        main
        ;;
esac
