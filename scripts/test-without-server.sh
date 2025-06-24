#!/bin/bash

# Test Playwright without starting dev server
# Useful when testing against external URLs

echo "🎭 Running Playwright Tests (No Dev Server)"
echo "============================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

# Get APP_URL
APP_URL=${APP_URL:-"http://localhost:3000"}

print_status "Testing against: $APP_URL"

# Check if URL is accessible
if curl -f "$APP_URL" &> /dev/null; then
    print_success "Application is accessible at $APP_URL"
else
    print_error "Application is not accessible at $APP_URL"
    print_status "Please ensure your application is running at this URL"
    exit 1
fi

# Run tests based on argument
case "${1:-all}" in
    "mobile")
        print_status "Running mobile tests..."
        npx playwright test --project=mobile-chrome --project=mobile-safari
        ;;
    "desktop")
        print_status "Running desktop tests..."
        npx playwright test --project=chromium-desktop --project=firefox-desktop --project=webkit-desktop
        ;;
    "accessibility")
        print_status "Running accessibility tests..."
        npx playwright test tests/cross-device/accessibility.spec.ts
        ;;
    "performance")
        print_status "Running performance tests..."
        npx playwright test tests/cross-device/performance.spec.ts
        ;;
    "ui")
        print_status "Starting Playwright UI..."
        npx playwright test --ui
        ;;
    "headed")
        print_status "Running tests with browser UI..."
        npx playwright test --headed
        ;;
    *)
        print_status "Running all tests..."
        npx playwright test
        ;;
esac

print_success "Tests completed!"
