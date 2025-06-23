#!/bin/bash

# Run Playwright tests in Docker to avoid host dependency issues

echo "🐳 Running Playwright tests in Docker"
echo "====================================="

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to run tests
run_docker_tests() {
    local test_type=${1:-"all"}
    
    print_status "Building Docker image..."
    docker-compose -f docker-compose.playwright.yml build
    
    case $test_type in
        "mobile")
            print_status "Running mobile tests in Docker..."
            docker-compose -f docker-compose.playwright.yml run --rm playwright-mobile
            ;;
        "desktop")
            print_status "Running desktop tests in Docker..."
            docker-compose -f docker-compose.playwright.yml run --rm playwright-desktop
            ;;
        "all"|*)
            print_status "Running all cross-device tests in Docker..."
            docker-compose -f docker-compose.playwright.yml run --rm playwright-tests
            ;;
    esac
    
    local exit_code=$?
    
    # Copy test results from container
    print_status "Copying test results..."
    docker-compose -f docker-compose.playwright.yml down
    
    if [[ $exit_code -eq 0 ]]; then
        print_success "Tests completed successfully!"
        print_status "Test results available in:"
        echo "  - test-results/"
        echo "  - playwright-report/"
    else
        print_error "Tests failed with exit code $exit_code"
    fi
    
    return $exit_code
}

# Handle command line arguments
case "${1:-}" in
    "mobile")
        run_docker_tests "mobile"
        ;;
    "desktop")
        run_docker_tests "desktop"
        ;;
    "all"|"")
        run_docker_tests "all"
        ;;
    "--help"|"-h")
        echo "Docker Playwright Test Runner"
        echo ""
        echo "Usage: $0 [test-type]"
        echo ""
        echo "Test Types:"
        echo "  mobile    Run mobile device tests only"
        echo "  desktop   Run desktop browser tests only"
        echo "  all       Run all cross-device tests (default)"
        echo ""
        echo "Examples:"
        echo "  $0 mobile"
        echo "  $0 desktop"
        echo "  $0 all"
        ;;
    *)
        print_error "Unknown test type: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
