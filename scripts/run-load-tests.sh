#!/bin/bash

# Load Testing Runner Script

echo "🚀 Running Load Tests for RTPLUX Casino"
echo "======================================="

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

# Get test type and configuration
TEST_TYPE=${1:-"basic"}
APP_URL=${APP_URL:-"http://localhost:8081"}
LOAD_TEST_USERS=${LOAD_TEST_USERS:-"10"}
LOAD_TEST_DURATION=${LOAD_TEST_DURATION:-"60"}

print_status "Load Test Configuration:"
echo "  Test Type: $TEST_TYPE"
echo "  App URL: $APP_URL"
echo "  Users: $LOAD_TEST_USERS"
echo "  Duration: ${LOAD_TEST_DURATION}s"
echo ""

# Check if dev server is running
check_server() {
    print_status "Checking if development server is running..."
    
    if curl -f "$APP_URL" &> /dev/null; then
        print_success "Development server is running at $APP_URL"
    else
        print_warning "Development server is not running"
        print_status "Starting development server..."
        
        npm run web &
        DEV_PID=$!
        
        # Wait for server to start
        sleep 10
        
        if curl -f "$APP_URL" &> /dev/null; then
            print_success "Development server started"
        else
            print_error "Failed to start development server"
            exit 1
        fi
    fi
}

# Run specific load test type
run_load_test() {
    local test_type=$1
    
    case $test_type in
        "basic")
            print_status "Running basic load tests..."
            npx cypress run \
                --spec "cypress/e2e/load-testing/basic-load.cy.ts" \
                --env LOAD_TEST_USERS=$LOAD_TEST_USERS,LOAD_TEST_DURATION=$LOAD_TEST_DURATION \
                --reporter mochawesome \
                --reporter-options "reportDir=cypress/reports,overwrite=false,html=true,json=true"
            ;;
        "stress")
            print_status "Running stress tests..."
            STRESS_USERS=$((LOAD_TEST_USERS * 2))
            STRESS_DURATION=$((LOAD_TEST_DURATION * 2))
            
            npx cypress run \
                --spec "cypress/e2e/load-testing/stress-test.cy.ts" \
                --env LOAD_TEST_USERS=$STRESS_USERS,LOAD_TEST_DURATION=$STRESS_DURATION \
                --reporter mochawesome \
                --reporter-options "reportDir=cypress/reports,overwrite=false,html=true,json=true"
            ;;
        "spike")
            print_status "Running spike tests..."
            SPIKE_USERS=$((LOAD_TEST_USERS * 3))
            
            npx cypress run \
                --spec "cypress/e2e/load-testing/basic-load.cy.ts,cypress/e2e/load-testing/game-load.cy.ts" \
                --env LOAD_TEST_USERS=$SPIKE_USERS,LOAD_TEST_DURATION=30 \
                --reporter mochawesome \
                --reporter-options "reportDir=cypress/reports,overwrite=false,html=true,json=true"
            ;;
        "volume")
            print_status "Running volume tests..."
            npx cypress run \
                --spec "cypress/e2e/load-testing/game-load.cy.ts" \
                --env LOAD_TEST_USERS=$LOAD_TEST_USERS,LOAD_TEST_DURATION=$((LOAD_TEST_DURATION * 3)) \
                --reporter mochawesome \
                --reporter-options "reportDir=cypress/reports,overwrite=false,html=true,json=true"
            ;;
        "endurance")
            print_status "Running endurance tests..."
            ENDURANCE_DURATION=$((LOAD_TEST_DURATION * 5))
            
            npx cypress run \
                --spec "cypress/e2e/load-testing/**/*.cy.ts" \
                --env LOAD_TEST_USERS=$LOAD_TEST_USERS,LOAD_TEST_DURATION=$ENDURANCE_DURATION \
                --reporter mochawesome \
                --reporter-options "reportDir=cypress/reports,overwrite=false,html=true,json=true"
            ;;
        "game")
            print_status "Running game-specific load tests..."
            npx cypress run \
                --spec "cypress/e2e/load-testing/game-load.cy.ts" \
                --env LOAD_TEST_USERS=$LOAD_TEST_USERS,LOAD_TEST_DURATION=$LOAD_TEST_DURATION \
                --reporter mochawesome \
                --reporter-options "reportDir=cypress/reports,overwrite=false,html=true,json=true"
            ;;
        "all")
            print_status "Running all load tests..."
            npx cypress run \
                --spec "cypress/e2e/load-testing/**/*.cy.ts" \
                --env LOAD_TEST_USERS=$LOAD_TEST_USERS,LOAD_TEST_DURATION=$LOAD_TEST_DURATION \
                --reporter mochawesome \
                --reporter-options "reportDir=cypress/reports,overwrite=false,html=true,json=true"
            ;;
        *)
            print_error "Unknown test type: $test_type"
            echo "Available test types: basic, stress, spike, volume, endurance, game, all"
            exit 1
            ;;
    esac
}

# Generate summary report
generate_summary() {
    print_status "Generating load test summary..."
    
    # Merge mochawesome reports
    npx mochawesome-merge cypress/reports/*.json > cypress/reports/merged-report.json
    npx marge cypress/reports/merged-report.json --reportDir cypress/reports --inline
    
    print_success "Load test reports generated:"
    echo "  - HTML Report: cypress/reports/merged-report.html"
    echo "  - JSON Report: cypress/reports/merged-report.json"
    echo "  - Screenshots: cypress/screenshots/"
    echo "  - Videos: cypress/videos/"
}

# Cleanup function
cleanup() {
    if [ ! -z "$DEV_PID" ]; then
        print_status "Cleaning up development server..."
        kill $DEV_PID 2>/dev/null || true
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main execution
main() {
    print_status "Starting load test execution..."
    
    check_server
    run_load_test $TEST_TYPE
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Load tests completed successfully!"
        generate_summary
    else
        print_error "Load tests failed with exit code $exit_code"
    fi
    
    return $exit_code
}

# Help function
show_help() {
    echo "Load Testing Runner for RTPLUX Casino"
    echo ""
    echo "Usage: $0 [test-type]"
    echo ""
    echo "Test Types:"
    echo "  basic      Basic load testing (default)"
    echo "  stress     Stress testing with increased load"
    echo "  spike      Spike testing with sudden load increase"
    echo "  volume     Volume testing with extended duration"
    echo "  endurance  Endurance testing with long duration"
    echo "  game       Game-specific load testing"
    echo "  all        Run all load tests"
    echo ""
    echo "Environment Variables:"
    echo "  APP_URL              Application URL (default: http://localhost:8081)"
    echo "  LOAD_TEST_USERS      Number of concurrent users (default: 10)"
    echo "  LOAD_TEST_DURATION   Test duration in seconds (default: 60)"
    echo ""
    echo "Examples:"
    echo "  $0 stress"
    echo "  LOAD_TEST_USERS=20 $0 spike"
    echo "  LOAD_TEST_DURATION=300 $0 endurance"
}

# Handle command line arguments
case "${1:-}" in
    "basic"|"stress"|"spike"|"volume"|"endurance"|"game"|"all")
        main
        ;;
    "--help"|"-h")
        show_help
        ;;
    *)
        if [ -z "${1:-}" ]; then
            main
        else
            print_error "Unknown test type: $1"
            show_help
            exit 1
        fi
        ;;
esac
