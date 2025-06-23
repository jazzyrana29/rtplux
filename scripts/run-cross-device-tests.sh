#!/bin/bash

# Cross-Device Testing Script for RTPLUX Casino

echo "🎰 Starting Cross-Device Testing for RTPLUX Casino"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Playwright is installed
if ! command -v npx playwright &> /dev/null; then
    print_error "Playwright not found. Installing..."
    npm install @playwright/test
    npx playwright install
fi

# Create test results directory
mkdir -p test-results/screenshots
mkdir -p test-results/videos
mkdir -p test-results/traces

print_status "Starting development server..."
npm run dev &
DEV_PID=$!

# Wait for server to start
sleep 10

# Function to run tests and capture results
run_test_suite() {
    local suite_name=$1
    local test_pattern=$2
    local description=$3
    
    print_status "Running $description..."
    
    if npx playwright test $test_pattern --reporter=html; then
        print_success "$description completed successfully"
        return 0
    else
        print_error "$description failed"
        return 1
    fi
}

# Test suites
FAILED_TESTS=0

# 1. Desktop Tests
print_status "🖥️  Running Desktop Tests"
if ! run_test_suite "desktop" "--grep @desktop" "Desktop Browser Tests"; then
    ((FAILED_TESTS++))
fi

# 2. Mobile Tests  
print_status "📱 Running Mobile Tests"
if ! run_test_suite "mobile" "--grep @mobile" "Mobile Device Tests"; then
    ((FAILED_TESTS++))
fi

# 3. Cross-Device Tests
print_status "🔄 Running Cross-Device Tests"
if ! run_test_suite "cross-device" "--grep @cross-device" "Cross-Device Compatibility Tests"; then
    ((FAILED_TESTS++))
fi

# 4. Accessibility Tests
print_status "♿ Running Accessibility Tests"
if ! run_test_suite "accessibility" "--grep @accessibility" "Accessibility Tests"; then
    ((FAILED_TESTS++))
fi

# 5. Performance Tests
print_status "⚡ Running Performance Tests"
if ! run_test_suite "performance" "--grep @performance" "Performance Tests"; then
    ((FAILED_TESTS++))
fi

# 6. Visual Regression Tests
print_status "👁️  Running Visual Tests"
if ! run_test_suite "visual" "tests/cross-device/" "Visual Regression Tests"; then
    ((FAILED_TESTS++))
fi

# Cleanup
print_status "Cleaning up..."
kill $DEV_PID 2>/dev/null

# Generate comprehensive report
print_status "Generating test report..."
npx playwright show-report

# Summary
echo ""
echo "🎰 Cross-Device Testing Summary"
echo "==============================="

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "All test suites passed! 🎉"
    echo ""
    echo "✅ Desktop compatibility: PASSED"
    echo "✅ Mobile compatibility: PASSED" 
    echo "✅ Cross-device features: PASSED"
    echo "✅ Accessibility: PASSED"
    echo "✅ Performance: PASSED"
    echo "✅ Visual consistency: PASSED"
else
    print_warning "$FAILED_TESTS test suite(s) failed"
    echo ""
    echo "❌ Some tests failed. Check the HTML report for details."
fi

echo ""
echo "📊 Test Results:"
echo "   - Screenshots: test-results/screenshots/"
echo "   - Videos: test-results/videos/"
echo "   - HTML Report: playwright-report/index.html"
echo ""

# Open report if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Opening test report..."
    open playwright-report/index.html
fi

exit $FAILED_TESTS
