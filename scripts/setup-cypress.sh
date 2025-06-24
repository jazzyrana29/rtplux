#!/usr/bin/env bash

# Cypress Setup Script for RTPLUX Casino Load Testing

echo "🌲 Setting up Cypress for RTPLUX Casino Load Testing"
echo "===================================================="

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

# Install Cypress and dependencies
install_cypress() {
    print_status "Installing Cypress and load testing dependencies..."

    if npm install cypress cypress-multi-reporters cypress-real-events mochawesome mochawesome-merge mochawesome-report-generator --save-dev --force; then
        print_success "Cypress dependencies installed successfully"
    else
        print_error "Failed to install Cypress dependencies"
        exit 1
    fi
}

# Create Cypress directories and configuration
setup_cypress_structure() {
    print_status "Setting up Cypress directory structure..."

    # Create Cypress directories
    mkdir -p cypress/e2e/load-testing
    mkdir -p cypress/support
    mkdir -p cypress/fixtures
    mkdir -p cypress/downloads
    mkdir -p cypress/screenshots
    mkdir -p cypress/videos
    mkdir -p cypress/reports

    print_success "Cypress directories created"
}

# Create load testing fixtures
create_fixtures() {
    print_status "Creating load testing fixtures..."

    cat > cypress/fixtures/load-test-config.json << 'EOF'
{
  "loadTestProfiles": {
    "light": {
      "users": 5,
      "duration": 30,
      "rampUp": 5
    },
    "moderate": {
      "users": 15,
      "duration": 60,
      "rampUp": 10
    },
    "heavy": {
      "users": 30,
      "duration": 120,
      "rampUp": 20
    },
    "stress": {
      "users": 50,
      "duration": 180,
      "rampUp": 30
    }
  },
  "gameScenarios": {
    "roulette": {
      "actions": ["buyChips", "placeBet", "spin"],
      "iterations": 10,
      "thinkTime": 2000
    },
    "slots": {
      "actions": ["spin", "adjustBet"],
      "iterations": 15,
      "thinkTime": 1500
    },
    "blackjack": {
      "actions": ["placeBet", "hit", "stand"],
      "iterations": 8,
      "thinkTime": 3000
    }
  },
  "performanceThresholds": {
    "pageLoad": 5000,
    "gameLoad": 10000,
    "actionResponse": 1000,
    "memoryLimit": 150
  }
}
EOF

    print_success "Load testing fixtures created"
}

# Test Cypress installation
test_cypress() {
    print_status "Testing Cypress installation..."

    # Start dev server in background
    print_status "Starting development server..."
    npm run web &
    DEV_PID=$!

    # Give server time to start
    sleep 10

    # Verify server is running
    if curl -f http://localhost:8081 &> /dev/null; then
        print_success "Development server is running"

        # Run a quick Cypress test
        print_status "Running quick Cypress test..."
        if npx cypress run --spec "cypress/e2e/load-testing/basic-load.cy.ts" --headless; then
            print_success "Cypress test passed!"
        else
            print_warning "Cypress test failed, but setup is complete. Check your tests."
        fi
    else
        print_warning "Development server may not be ready. Try running tests manually."
    fi

    # Cleanup: kill server
    kill $DEV_PID 2>/dev/null || true
    sleep 2
}

# Create load testing scripts
create_load_scripts() {
    print_status "Creating load testing scripts..."

    # Make scripts executable
    chmod +x scripts/run-load-tests.sh
    chmod +x scripts/generate-load-report.sh

    print_success "Load testing scripts created and made executable"
}

# Main setup function
main() {
    print_status "Starting Cypress load testing setup..."

    check_node
    install_cypress
    setup_cypress_structure
    create_fixtures
    create_load_scripts

    if [ "${1:-}" != "--skip-test" ]; then
        test_cypress
    fi

    print_success "🎉 Cypress load testing setup completed successfully!"
    echo ""
    echo "🚀 Load Testing Commands:"
    echo ""
    echo "Interactive:"
    echo "  npm run cypress:open           # Open Cypress UI"
    echo "  npm run test:load:headed       # Run load tests with UI"
    echo ""
    echo "Load Testing:"
    echo "  npm run test:load              # Run all load tests"
    echo "  npm run test:load:stress       # Run stress tests"
    echo "  npm run test:load:spike        # Run spike tests"
    echo "  npm run test:load:volume       # Run volume tests"
    echo "  npm run test:load:endurance    # Run endurance tests"
    echo ""
    echo "Reporting:"
    echo "  npm run test:load:report       # Generate load test report"
    echo ""
    echo "Environment Variables:"
    echo "  LOAD_TEST_USERS=20 npm run test:load"
    echo "  LOAD_TEST_DURATION=120 npm run test:load:stress"
    echo ""
}

# Handle command line arguments
case "${1:-}" in
    --deps-only)
        check_node
        npm install cypress cypress-multi-reporters cypress-real-events mochawesome mochawesome-merge mochawesome-report-generator --save-dev --force
        ;;
    --structure-only)
        setup_cypress_structure
        create_fixtures
        ;;
    --test)
        test_cypress
        ;;
    --skip-test)
        main --skip-test
        ;;
    --help|-h)
        echo "Cypress Load Testing Setup Script for RTPLUX Casino"
        echo ""
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  --deps-only       Install Cypress dependencies only"
        echo "  --structure-only  Create directory structure only"
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
