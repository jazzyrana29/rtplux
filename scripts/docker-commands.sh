#!/bin/bash

# Docker Commands Helper Script
# Provides easy-to-use commands for common Docker operations

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}$1${NC}"
    echo "=================================="
}

print_command() {
    echo -e "${GREEN}$1${NC}"
    echo "  $2"
    echo ""
}

case "${1:-}" in
    "dev")
        print_header "🚀 Development Commands"
        print_command "docker-compose up -d" "Start development environment"
        print_command "docker-compose logs -f" "View live logs"
        print_command "docker-compose logs -f app" "View app logs only"
        print_command "docker-compose restart app" "Restart app service"
        print_command "docker-compose down" "Stop all services"
        print_command "docker-compose exec app bash" "Access app container shell"
        print_command "docker-compose exec app npm install" "Install new packages"
        ;;
    
    "test")
        print_header "🧪 Testing Commands"
        print_command "npm run test:docker" "Run all cross-device tests"
        print_command "npm run test:docker:mobile" "Run mobile device tests"
        print_command "npm run test:docker:desktop" "Run desktop browser tests"
        print_command "docker-compose -f docker-compose.playwright.yml run --rm playwright-accessibility" "Run accessibility tests"
        print_command "docker-compose -f docker-compose.playwright.yml run --rm playwright-performance" "Run performance tests"
        print_command "docker-compose -f docker-compose.playwright.yml run --rm playwright-visual" "Update visual snapshots"
        ;;
    
    "prod")
        print_header "🏭 Production Commands"
        print_command "docker-compose --profile production up -d" "Start production environment"
        print_command "docker-compose --profile production build" "Build production images"
        print_command "docker-compose --profile production logs -f" "View production logs"
        print_command "docker-compose --profile production down" "Stop production environment"
        ;;
    
    "debug")
        print_header "🔍 Debugging Commands"
        print_command "docker-compose ps" "Show running containers"
        print_command "docker-compose logs app" "View app logs"
        print_command "docker-compose exec app npm run test:debug" "Debug tests in container"
        print_command "docker system df" "Show Docker disk usage"
        print_command "docker-compose config" "Validate compose file"
        ;;
    
    "clean")
        print_header "🧹 Cleanup Commands"
        print_command "docker-compose down -v" "Stop and remove volumes"
        print_command "docker system prune" "Remove unused Docker resources"
        print_command "docker image prune" "Remove unused images"
        print_command "docker volume prune" "Remove unused volumes"
        print_command "docker-compose build --no-cache" "Rebuild without cache"
        ;;
    
    "help"|*)
        echo "🐳 Docker Commands Helper for RTPLUX Casino"
        echo ""
        echo "Usage: $0 [category]"
        echo ""
        echo "Categories:"
        echo "  dev     Development commands"
        echo "  test    Testing commands"
        echo "  prod    Production commands"
        echo "  debug   Debugging commands"
        echo "  clean   Cleanup commands"
        echo ""
        echo "Examples:"
        echo "  $0 dev    # Show development commands"
        echo "  $0 test   # Show testing commands"
        ;;
esac
