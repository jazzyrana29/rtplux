#!/bin/bash

# Quick setup for users who just want to run tests without full system setup

echo "🚀 Quick Playwright Test Setup"
echo "=============================="

# Colors
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

print_status "Setting up Playwright for testing..."

# Option 1: Try Docker approach (recommended)
if command -v docker &> /dev/null; then
    print_status "Docker detected. Using containerized testing approach..."
    
    # Make scripts executable
    chmod +x scripts/run-tests-docker.sh
    
    print_success "✅ Docker setup complete!"
    echo ""
    echo "Run tests with:"
    echo "  npm run test:docker"
    echo "  npm run test:docker:mobile"
    echo "  npm run test:docker:desktop"
    echo ""
    
# Option 2: Headless mode (fallback)
else
    print_warning "Docker not found. Setting up headless mode..."
    
    # Install Playwright
    npm install @playwright/test
    npx playwright install chromium
    
    print_success "✅ Headless setup complete!"
    echo ""
    echo "Run tests with:"
    echo "  npm run test:headless"
    echo ""
    echo "Note: Some visual tests may not work in headless mode."
    echo "For full testing, consider installing Docker or system dependencies."
fi

echo ""
echo "📚 Additional Setup Options:"
echo ""
echo "1. Full system setup (requires sudo):"
echo "   npm run setup:playwright"
echo ""
echo "2. Docker-based testing (recommended):"
echo "   npm run test:docker"
echo ""
echo "3. Headless testing (limited features):"
echo "   npm run test:headless"
echo ""
echo "4. Test current setup:"
echo "   npm run setup:playwright:test"
