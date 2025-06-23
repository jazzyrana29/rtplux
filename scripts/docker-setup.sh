#!/bin/bash

# Docker Setup Script for RTPLUX Casino Platform

echo "🐳 Setting up Docker environment for RTPLUX Casino"
echo "=================================================="

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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        echo ""
        echo "Please install Docker first:"
        echo "  Ubuntu/Debian: sudo apt-get install docker.io docker-compose"
        echo "  macOS: brew install --cask docker"
        echo "  Windows: Download from https://www.docker.com/products/docker-desktop"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        echo ""
        echo "Please install Docker Compose:"
        echo "  sudo apt-get install docker-compose"
        exit 1
    fi

    print_success "Docker and Docker Compose are installed"
}

# Check Docker daemon
check_docker_daemon() {
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running!"
        echo ""
        echo "Please start Docker:"
        echo "  Linux: sudo systemctl start docker"
        echo "  macOS/Windows: Start Docker Desktop"
        exit 1
    fi

    print_success "Docker daemon is running"
}

# Setup Docker environment
setup_environment() {
    print_status "Setting up Docker environment..."

    # Create necessary directories
    mkdir -p test-results
    mkdir -p playwright-report
    mkdir -p nginx/ssl

    # Make scripts executable
    chmod +x scripts/*.sh

    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp env-example .env
        print_warning "Please update .env file with your configuration"
    fi

    # Clean up any existing containers
    print_status "Cleaning up existing containers..."
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose.playwright.yml down 2>/dev/null || true

    print_success "Environment setup complete"
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."

    # Build main application image
    print_status "Building main application image..."
    if docker-compose build app; then
        print_success "Main application image built successfully"
    else
        print_error "Failed to build main application image"
        return 1
    fi

    # Build testing image
    print_status "Building Playwright testing image..."
    if docker-compose -f docker-compose.playwright.yml build playwright-tests; then
        print_success "Playwright testing image built successfully"
    else
        print_error "Failed to build Playwright testing image"
        return 1
    fi

    print_success "All Docker images built successfully"
}

# Test Docker setup
test_setup() {
    print_status "Testing Docker setup..."

    # Test main application
    print_status "Testing main application container..."
    docker-compose up -d app
    sleep 15

    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Application container is working"
    else
        print_warning "Application container may still be starting..."
        print_status "Checking container logs..."
        docker-compose logs app | tail -10
    fi

    docker-compose down

    print_success "Docker setup test completed"
}

# Main setup function
main() {
    print_status "Starting Docker setup for RTPLUX Casino..."

    check_docker
    check_docker_daemon
    setup_environment
    build_images
    test_setup

    print_success "🎉 Docker setup completed successfully!"
    echo ""
    echo "🚀 Quick Start Commands:"
    echo ""
    echo "Development:"
    echo "  docker-compose up -d              # Start development environment"
    echo "  docker-compose logs -f            # View logs"
    echo "  docker-compose down               # Stop environment"
    echo ""
    echo "Testing:"
    echo "  npm run test:docker               # Run all tests"
    echo "  npm run test:docker:mobile        # Run mobile tests"
    echo "  npm run test:docker:desktop       # Run desktop tests"
    echo ""
    echo "Production:"
    echo "  docker-compose --profile production up -d  # Start production"
    echo ""
    echo "Visit http://localhost:3000 to see your application!"
}

# Handle command line arguments
case "${1:-}" in
    --check)
        check_docker
        check_docker_daemon
        ;;
    --build)
        build_images
        ;;
    --test)
        test_setup
        ;;
    --help|-h)
        echo "Docker Setup Script for RTPLUX Casino"
        echo ""
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  --check     Check Docker installation"
        echo "  --build     Build Docker images only"
        echo "  --test      Test Docker setup"
        echo "  --help, -h  Show this help message"
        echo ""
        echo "Run without arguments to perform full setup."
        ;;
    *)
        main
        ;;
esac
