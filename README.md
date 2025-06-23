# 🎰 RTPLUX Casino Platform

A modern, multi-partner casino platform built with Next.js, featuring real-time games, internationalization, and
comprehensive cross-device testing.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Testing Setup](#testing-setup)
- [Docker Setup](#docker-setup)
- [Development](#development)
- [Partner Configuration](#partner-configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

- 🎮 **Multi-Game Platform**: Roulette, Slots, Blackjack, Crash games
- 🌍 **Internationalization**: English, Spanish, Arabic support
- 🏢 **Multi-Partner System**: Dynamic partner configurations
- 📱 **Cross-Device Compatible**: Desktop, tablet, mobile optimized
- 🎨 **Dynamic Theming**: Partner-specific branding
- 📊 **Analytics Integration**: PostHog, Sentry tracking
- 🧪 **Comprehensive Testing**: Playwright cross-device tests
- 🔧 **Feature Flags**: Dynamic feature management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (recommended for testing)

### Installation

# Clone the repository

git clone <repository-url>
cd rtuplux-casino

# Install dependencies

npm install

# Start development server

npm run dev
\`\`\`

Visit `http://localhost:3000` to see the application.

## 🧪 Testing Setup

### Why Playwright Testing?

Our casino platform requires rigorous cross-device testing to ensure:

- ✅ Games work on all devices (desktop, tablet, mobile)
- ✅ Partner configurations load correctly
- ✅ Internationalization displays properly
- ✅ Performance meets standards across devices
- ✅ Accessibility compliance

### Testing Options

#### Option 1: Docker Testing (Recommended) 🐳

**Why Docker?**

- ✅ No host dependency issues
- ✅ Consistent testing environment
- ✅ Easy CI/CD integration
- ✅ Isolated from system changes
- ✅ Works on any operating system

\`\`\`bash

# Quick setup

npm run setup:docker

# Run all cross-device tests

npm run test:docker

# Run specific test suites

npm run test:docker:mobile
npm run test:docker:desktop
npm run test:docker:accessibility
\`\`\`

#### Option 2: Native Installation

\`\`\`bash

# Automated setup (Linux/Ubuntu)

npm run setup:playwright

# Manual setup

sudo npx playwright install-deps
npx playwright install

# Run tests

npm run test
npm run test:cross-device
npm run test:mobile
\`\`\`

#### Option 3: Headless Mode (Limited)

\`\`\`bash

# For CI/CD or limited environments

npm run test:headless
\`\`\`

### Test Commands

\`\`\`bash

# All test commands

npm run test # Run all tests
npm run test:headed # Run with browser UI
npm run test:debug # Debug mode
npm run test:mobile # Mobile device tests
npm run test:desktop # Desktop browser tests
npm run test:cross-device # Cross-device compatibility
npm run test:accessibility # Accessibility tests
npm run test:performance # Performance tests
npm run test:ui # Interactive test UI
npm run test:report # View test results

# Docker-based testing

npm run test:docker # All tests in Docker
npm run test:docker:mobile # Mobile tests in Docker
npm run test:docker:desktop # Desktop tests in Docker
\`\`\`

## 🐳 Docker Setup

### Why Docker is Necessary

Docker is **highly recommended** for this project because:

1. **Playwright Dependencies**: Requires many system libraries
2. **Cross-Device Testing**: Needs multiple browser engines
3. **Consistent Environment**: Same results across different machines
4. **CI/CD Ready**: Easy integration with deployment pipelines
5. **No System Pollution**: Keeps your system clean

### Docker Installation

#### Install Docker

**Ubuntu/Debian:**
\`\`\`bash

# Update package index

sudo apt-get update

# Install Docker

sudo apt-get install docker.io docker-compose

# Add user to docker group (logout/login required)

sudo usermod -aG docker $USER

# Start Docker service

sudo systemctl start docker
sudo systemctl enable docker
\`\`\`

**macOS:**
\`\`\`bash

# Install Docker Desktop

brew install --cask docker

# Or download from: https://www.docker.com/products/docker-desktop

\`\`\`

**Windows:**
\`\`\`bash

# Download Docker Desktop from: https://www.docker.com/products/docker-desktop

# Follow installation wizard

\`\`\`

#### Verify Docker Installation

\`\`\`bash

# Check Docker version

docker --version
docker-compose --version

# Test Docker

docker run hello-world
\`\`\`

### Project Docker Setup

#### 1. Build Docker Images

\`\`\`bash

# Build all images

docker-compose -f docker-compose.yml build

# Build specific services

docker-compose -f docker-compose.playwright.yml build playwright-tests
\`\`\`

#### 2. Run Development Environment

\`\`\`bash

# Start development environment

docker-compose up -d

# View logs

docker-compose logs -f

# Stop environment

docker-compose down
\`\`\`

#### 3. Run Tests in Docker

\`\`\`bash

# Run all cross-device tests

npm run test:docker

# Run specific test suites

npm run test:docker:mobile
npm run test:docker:desktop

# Run with custom configuration

docker-compose -f docker-compose.playwright.yml run --rm playwright-tests npm run test:accessibility
\`\`\`

### Docker Commands Reference

\`\`\`bash

# Container Management

docker-compose up -d # Start all services
docker-compose down # Stop all services
docker-compose restart # Restart services
docker-compose logs -f [service]        # View logs

# Testing Commands

docker-compose -f docker-compose.playwright.yml run --rm playwright-tests npm run test
docker-compose -f docker-compose.playwright.yml run --rm playwright-mobile
docker-compose -f docker-compose.playwright.yml run --rm playwright-desktop

# Development Commands

docker-compose exec app npm install # Install new packages
docker-compose exec app npm run build # Build application
docker-compose exec app bash # Access container shell

# Cleanup Commands

docker-compose down -v # Remove containers and volumes
docker system prune # Clean up unused Docker resources
docker image prune # Remove unused images
\`\`\`

### Docker Troubleshooting

#### Common Issues

**1. Permission Denied**
\`\`\`bash

# Add user to docker group

sudo usermod -aG docker $USER

# Logout and login again

\`\`\`

**2. Port Already in Use**
\`\`\`bash

# Check what's using the port

sudo lsof -i :3000

# Kill the process or change port in docker-compose.yml

\`\`\`

**3. Out of Disk Space**
\`\`\`bash

# Clean up Docker

docker system prune -a
docker volume prune
\`\`\`

**4. Container Won't Start**
\`\`\`bash

# Check logs

docker-compose logs [service-name]

# Rebuild image

docker-compose build --no-cache [service-name]
\`\`\`

## 🔧 Development

### Environment Setup

\`\`\`bash

# Copy environment template

cp env-example .env

# Configure environment variables

NEXT_PUBLIC_PARTNER_ID=default
POSTHOG_API_KEY=your_posthog_key
SENTRY_DSN=your_sentry_dsn
\`\`\`

### Partner Configuration

\`\`\`bash

# Test different partners

npm run dev

# Visit: http://localhost:3000?partner=partner1

# Visit: http://localhost:3000?partner=partner2

# Or use subdomain (in production)

# partner1.yourdomain.com

# partner2.yourdomain.com

\`\`\`

### Development Commands

\`\`\`bash
npm run dev # Start development server
npm run build # Build for production
npm run start # Start production server
npm run lint # Run ESLint
npm run type-check # TypeScript type checking
\`\`\`

## 🧪 Test Structure

### Test Categories

\`\`\`
tests/
├── cross-device/ # Cross-device compatibility tests
│ ├── home-page.spec.ts
│ ├── games-page.spec.ts
│ ├── roulette-game.spec.ts
│ ├── accessibility.spec.ts
│ └── performance.spec.ts
├── utils/ # Test utilities and helpers
│ ├── test-helpers.ts
│ └── device-manager.ts
└── test-data/ # Test data and configurations
└── devices.json
\`\`\`

### Test Scenarios

**Cross-Device Tests:**

- ✅ Home page loading and navigation
- ✅ Game selection and launching
- ✅ Roulette game functionality
- ✅ Partner switching
- ✅ Language switching
- ✅ Responsive design validation

**Accessibility Tests:**

- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Color contrast validation
- ✅ ARIA labels and roles

**Performance Tests:**

- ✅ Page load times
- ✅ Game loading performance
- ✅ Memory usage monitoring
- ✅ Network condition handling

### Running Specific Tests

\`\`\`bash

# Run tests by tag

npm run test -- --grep "@mobile"
npm run test -- --grep "@desktop"
npm run test -- --grep "@accessibility"
npm run test -- --grep "@performance"

# Run specific test files

npm run test tests/cross-device/home-page.spec.ts
npm run test tests/cross-device/roulette-game.spec.ts

# Run tests with specific browser

npm run test -- --project=chromium-desktop
npm run test -- --project=mobile-chrome
\`\`\`

## 📊 Test Reports

### Viewing Results

\`\`\`bash

# Generate and view HTML report

npm run test:report

# View test results in browser

open playwright-report/index.html

# View JSON results

cat test-results/results.json
\`\`\`

### Test Artifacts

\`\`\`
test-results/
├── screenshots/ # Failure screenshots
├── videos/ # Test execution videos
├── traces/ # Detailed execution traces
├── results.json # JSON test results
└── results.xml # JUnit XML results
\`\`\`

## 🚀 CI/CD Integration

### GitHub Actions Example

\`\`\`yaml
name: Cross-Device Tests

on: [push, pull_request]

jobs:
test:
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v3
- uses: actions/setup-node@v3
with:
node-version: '18'

      - name: Install dependencies
        run: npm ci
      
      - name: Run Playwright tests
        run: npm run test:docker
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

\`\`\`

## 🏢 Partner Configuration

### Adding New Partners

1. Create partner config file:
   \`\`\`bash
   cp config/default.json config/new-partner.json
   \`\`\`

2. Update configuration:
   \`\`\`json
   {
   "partnerId": "new-partner",
   "partnerName": "New Partner Casino",
   "features": {
   "roulette": { "enabled": true, "maxBet": 1000 }
   },
   "branding": {
   "primaryColor": "#ff6b35",
   "logo": "/assets/partners/new-partner/logo.png"
   }
   }
   \`\`\`

3. Test partner configuration:
   \`\`\`bash
   npm run dev

# Visit: http://localhost:3000?partner=new-partner

\`\`\`

## 🔍 Debugging

### Debug Tests

\`\`\`bash

# Debug mode (opens browser)

npm run test:debug

# Debug specific test

npm run test:debug tests/cross-device/home-page.spec.ts

# Interactive UI mode

npm run test:ui
\`\`\`

### Debug Application

\`\`\`bash

# Enable debug logging

DEBUG=* npm run dev

# View Sentry errors

npm run test:sentry

# Check PostHog events

# Visit PostHog dashboard

\`\`\`

## 📱 Device Testing Matrix

### Supported Devices

**Desktop:**

- Chrome, Firefox, Safari
- Resolutions: 1366x768, 1920x1080, 2560x1440

**Tablet:**

- iPad Pro (1024x1366)
- iPad Landscape (1366x1024)
- Android Tablet (800x1280)

**Mobile:**

- iPhone 12 (390x844)
- iPhone SE (375x667)
- Pixel 5 (393x851)
- Galaxy S21 (384x854)

### Test Coverage

- ✅ Layout responsiveness
- ✅ Touch interactions
- ✅ Game functionality
- ✅ Performance metrics
- ✅ Accessibility compliance

## 🛠️ Troubleshooting

### Common Issues

**1. Playwright Installation Issues**
\`\`\`bash

# Clear cache and reinstall

rm -rf node_modules package-lock.json
npm install
npm run setup:playwright
\`\`\`

**2. Docker Issues**
\`\`\`bash

# Restart Docker service

sudo systemctl restart docker

# Clean up Docker

docker system prune -a
\`\`\`

**3. Test Failures**
\`\`\`bash

# Run tests with more verbose output

npm run test -- --reporter=line

# Check test artifacts

ls test-results/
\`\`\`

**4. Port Conflicts**
\`\`\`bash

# Check what's using port 3000

lsof -i :3000

# Kill process

kill -9 <PID>
\`\`\`

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Testing Best Practices](./docs/testing-best-practices.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Run tests: `npm run test:docker`
4. Commit changes: `git commit -am 'Add new feature'`
5. Push to branch: `git push origin feature/new-feature`
6. Submit pull request

### Development Workflow

\`\`\`bash

# 1. Setup development environment

npm install
npm run setup:playwright

# 2. Start development

npm run dev

# 3. Run tests during development

npm run test:docker:mobile # Test mobile changes
npm run test:docker:desktop # Test desktop changes

# 4. Before committing

npm run test:docker # Full test suite
npm run lint # Code quality
npm run build # Production build test
\`\`\`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy Testing! 🎰✨**

For support, please open an issue or contact the development team.
