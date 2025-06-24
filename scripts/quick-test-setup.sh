#!/bin/bash

# Quick Test Setup Script

echo "⚡ Quick Playwright Setup"
echo "========================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Quick setup
print_status "Installing Playwright browsers..."
npx playwright install

print_status "Creating test directories..."
mkdir -p test-results playwright-report

print_status "Making scripts executable..."
chmod +x scripts/*.sh

print_success "Quick setup complete!"
echo ""
echo "🚀 Ready to test:"
echo "  npm run test:ui        # Interactive UI"
echo "  npm run test:headed    # With browser"
echo "  npm run test          # All tests (4 workers)"
