#!/bin/bash

# Playwright Test Runner Script

echo "🎭 Running Playwright Tests"
echo "==========================="

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

# Get APP_URL from environment or use default
APP_URL=${APP_URL:-"http://localhost:3000"}

# Function to run tests
run_tests() {
    local test_type=${1:-"all"}
    local extra_args=${2:-""}

    print_status "Running $test_type tests with 4 workers..."
    print_status "Using APP_URL: $APP_URL"

    case $test_type in
        "mobile")
            print_status "Running mobile device tests..."
            npx playwright test --grep "@mobile" --workers=4 $extra_args
            ;;
        "desktop")
            print_status "Running desktop browser tests..."
            npx playwright test --grep "@desktop" --workers=4 $extra_args
            ;;
        "cross-device")
            print_status "Running cross-device compatibility tests..."
            npx playwright test --grep "@cross-device" --workers=4 $extra_args
            ;;
        "accessibility")
            print_status "Running accessibility tests..."
            npx playwright test --grep "@accessibility" --workers=4 $extra_args
            ;;
        "performance")
            print_status "Running performance tests..."
            npx playwright test --grep "@performance" --workers=4 $extra_args
            ;;
        "ui")
            print_status "Starting interactive UI mode..."
            npx playwright test --ui
            ;;
        "debug")
            print_status "Starting debug mode..."
            npx playwright test --debug
            ;;
        "headed")
            print_status "Running tests with browser UI..."
            npx playwright test --headed --workers=4 $extra_args
            ;;
        "all"|*)
            print_status "Running all tests..."
            npx playwright test --workers=4 $extra_args
            ;;
    esac

    local exit_code=$?

    if [[ $exit_code -eq 0 ]]; then
        print_success "Tests completed successfully!"
        print_status "Test results available in:"
        echo "  - test-results/"
        echo "  - playwright-report/"
        echo ""
        echo "View detailed report: npm run test:report"
    else
        print_error "Tests failed with exit code $exit_code"
        print_status "Check test results in:"
        echo "  - test-results/"
        echo "  - Screenshots: test-results/screenshots/"
        echo "  - Videos: test-results/videos/"
    fi

    return $exit_code
}

# Check if dev server is running
check_dev_server() {
    print_status "Checking development server at: $APP_URL"

    if ! curl -f "$APP_URL" &> /dev/null; then
        print_warning "Development server is not running at $APP_URL"

        # Only auto-start if using localhost
        if [[ "$APP_URL" == *"localhost"* ]]; then
            print_status "Starting development server..."
            npm run dev &
            DEV_PID=$!
            sleep 10

            if curl -f "$APP_URL" &> /dev/null; then
                print_success "Development server started at $APP_URL"
            else
                print_error "Failed to start development server"
                kill $DEV_PID 2>/dev/null || true
                exit 1
            fi
        else
            print_error "Please ensure your application is running at $APP_URL"
            exit 1
        fi
    else
        print_success "Development server is running at $APP_URL"
    fi
}

# Main execution
main() {
    local test_type=${1:-"all"}
    local extra_args=""

    # Parse additional arguments
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --headed)
                extra_args="$extra_args --headed"
                shift
                ;;
            --debug)
                extra_args="$extra_args --debug"
                shift
                ;;
            --reporter=*)
                extra_args="$extra_args $1"
                shift
                ;;
            *)
                extra_args="$extra_args $1"
                shift
                ;;
        esac
    done

    check_dev_server
    run_tests $test_type "$extra_args"
}

# Handle command line arguments
case "${1:-}" in
    "mobile"|"desktop"|"cross-device"|"accessibility"|"performance"|"ui"|"debug"|"headed"|"all")
        main "$@"
        ;;
    "--help"|"-h")
        echo "Playwright Test Runner for RTPLUX Casino"
        echo ""
        echo "Usage: $0 [test-type] [options]"
        echo ""
        echo "Environment Variables:"
        echo "  APP_URL        Application URL (default: http://localhost:3000)"
        echo ""
        echo "Test Types:"
        echo "  mobile         Run mobile device tests"
        echo "  desktop        Run desktop browser tests"
        echo "  cross-device   Run cross-device compatibility tests"
        echo "  accessibility  Run accessibility tests"
        echo "  performance    Run performance tests"
        echo "  ui             Interactive test UI"
        echo "  debug          Debug mode"
        echo "  headed         Run with browser UI"
        echo "  all            Run all tests (default)"
        echo ""
        echo "Options:"
        echo "  --headed       Show browser UI"
        echo "  --debug        Enable debug mode"
        echo "  --reporter=X   Use specific reporter"
        echo ""
        echo "Examples:"
        echo "  APP_URL=https://myapp.com $0 mobile --headed"
        echo "  $0 accessibility"
        echo "  $0 all --reporter=line"
        ;;
    *)
        main "all" "$@"
        ;;
esac
