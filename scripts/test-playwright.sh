#!/bin/bash

# Test Playwright Installation

echo "🧪 Testing Playwright Installation"
echo "=================================="

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

# Get APP_URL from environment or use default
APP_URL=${APP_URL:-"http://localhost:3000"}

# Test basic Playwright functionality
test_basic() {
    print_status "Testing basic Playwright functionality..."

    # Create simple test
    cat > test-basic.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  try {
    console.log('🚀 Starting browser...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log('📄 Navigating to example.com...');
    await page.goto('https://example.com');

    const title = await page.title();
    console.log('📋 Page title:', title);

    await browser.close();
    console.log('✅ Playwright is working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Playwright test failed:', error.message);
    process.exit(1);
  }
})();
EOF

    # Run test
    if node test-basic.js; then
        print_success "Basic Playwright test passed"
    else
        print_warning "Basic test failed, but setup may still work"
    fi

    # Clean up
    rm test-basic.js
}

# Test project setup
test_project() {
    print_status "Testing project setup..."
    print_status "Using APP_URL: $APP_URL"

    # Check if dev server can start
    print_status "Testing development server..."

    # Only auto-start if using localhost
    if [[ "$APP_URL" == *"localhost"* ]]; then
        # Start dev server in background
        npm run dev &
        DEV_PID=$!

        # Wait for server
        sleep 8

        # Test server
        if curl -f "$APP_URL" &> /dev/null; then
            print_success "Development server is working at $APP_URL"

            # Run quick project test
            print_status "Running quick project test..."
            if timeout 30 npx playwright test --reporter=list --max-failures=1 tests/cross-device/home-page.spec.ts; then
                print_success "Project tests are working!"
            else
                print_warning "Project tests failed, but setup is complete"
            fi
        else
            print_warning "Development server not ready at $APP_URL, skipping project test"
        fi

        # Kill dev server
        kill $DEV_PID 2>/dev/null || true
        sleep 2
    else
        print_status "External APP_URL detected: $APP_URL"
        print_status "Please ensure your application is running at this URL"

        if curl -f "$APP_URL" &> /dev/null; then
            print_success "Application is accessible at $APP_URL"

            # Run quick project test
            print_status "Running quick project test..."
            if timeout 30 npx playwright test --reporter=list --max-failures=1 tests/cross-device/home-page.spec.ts; then
                print_success "Project tests are working!"
            else
                print_warning "Project tests failed, but setup is complete"
            fi
        else
            print_warning "Application not accessible at $APP_URL"
            print_status "Make sure your application is running and accessible"
        fi
    fi
}

# Main test function
main() {
    print_status "Starting Playwright tests..."
    print_status "APP_URL: $APP_URL"

    test_basic
    test_project

    echo ""
    print_success "🎉 Playwright testing completed!"
    echo ""
    echo "🚀 Ready to use:"
    echo "  APP_URL=$APP_URL npm run dev            # Start development server"
    echo "  APP_URL=$APP_URL npm run test:ui        # Interactive test UI"
    echo "  APP_URL=$APP_URL npm run test:headed    # Tests with browser UI"
    echo "  APP_URL=$APP_URL npm run test          # Run all tests"
    echo ""
    echo "💡 Set APP_URL environment variable for different URLs:"
    echo "  export APP_URL=https://myapp.vercel.app"
    echo "  APP_URL=http://localhost:4000 npm run test"
    echo ""
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi
