# 🎰 RTPLUX Casino Platform

A modern, cross-platform casino gaming platform built with Next.js, React Native, and Phaser.js, featuring comprehensive
testing with Playwright.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

\`\`\`bash

# 1. Install dependencies

npm install --force

# 2. Setup environment

cp env-example .env.local

# 3. Setup Playwright (one-time)

npm run setup:playwright

# 4. Start development

npm run dev

# 5. Run tests

npm run test:ui
\`\`\`

## 🌐 Environment Configuration

### APP_URL Configuration

The application URL is configurable via the `APP_URL` environment variable:

\`\`\`bash

# Local development (default)

APP_URL=http://localhost:3000

# Custom port

APP_URL=http://localhost:4000

# Production/Staging

APP_URL=https://myapp.vercel.app
APP_URL=https://staging.myapp.com
\`\`\`

### Usage Examples

\`\`\`bash

# Test with custom URL

APP_URL=https://myapp.com npm run test

# Development with custom port

APP_URL=http://localhost:4000 npm run dev
APP_URL=http://localhost:4000 npm run test:ui

# CI/CD with staging URL

APP_URL=https://staging.myapp.com npm run test
\`\`\`

## 🎭 Testing with Playwright

### Quick Commands

\`\`\`bash

# Interactive UI (recommended for development)

npm run test:ui

# All tests with browser UI

npm run test:headed

# Specific test types

npm run test:mobile
npm run test:desktop
npm run test:accessibility

# Advanced test runner

npm run test:run mobile --headed
npm run test:run accessibility
\`\`\`

### Environment-Specific Testing

\`\`\`bash

# Test against local development

APP_URL=http://localhost:3000 npm run test

# Test against staging

APP_URL=https://staging.myapp.com npm run test

# Test against production

APP_URL=https://myapp.com npm run test:mobile
\`\`\`

### Test Configuration

- **Workers**: 4 parallel workers for optimal performance
- **Browsers**: Chromium, Firefox, WebKit
- **Devices**: Desktop, tablet, mobile viewports
- **Reports**: HTML, JSON, JUnit formats

## 🎮 Features

### Multi-Language Support (i18n)

- **Languages**: English, Spanish, Arabic
- **Implementation**: Zustand store with persistence
- **Structure**: JSON files organized by screen
- **Constants**: Screen-specific constant files

### Partner System

- **Multi-tenant**: Support for multiple casino partners
- **Configuration**: JSON-based partner configs
- **Feature Flags**: Partner-specific feature toggles
- **Branding**: Customizable themes and assets

### Games

- **Roulette**: Full-featured roulette game with Phaser.js
- **Cross-platform**: Web and React Native support
- **Assets**: Optimized game assets with packing system

### Testing

- **Cross-device**: Comprehensive device compatibility testing
- **Accessibility**: WCAG compliance testing
- **Performance**: Load time and interaction testing
- **Visual**: Screenshot comparison testing

## 📁 Project Structure

\`\`\`
├── app/ # Next.js app directory
├── components/ # Shared React components
├── constants/ # Screen-specific constants
├── hooks/ # Custom React hooks
├── lib/ # Utility libraries
├── locales/ # i18n translation files
├── scenes/ # Phaser.js game scenes
├── stores/ # Zustand state stores
├── tests/ # Playwright test suites
├── scripts/ # Build and setup scripts
└── assets/ # Game assets and media
\`\`\`

## 🛠️ Development Workflow

### 1. Start Development

\`\`\`bash

# Terminal 1: Development server

npm run dev

# Terminal 2: Interactive testing

npm run test:ui
\`\`\`

### 2. Testing Workflow

\`\`\`bash

# Quick test during development

npm run test:headed --project=chromium-desktop

# Full cross-device testing

npm run test:run cross-device

# Accessibility testing

npm run test:run accessibility
\`\`\`

### 3. Asset Management

\`\`\`bash

# Pack game assets

npm run pack:assets

# Setup permissions (if needed)

npm run setup:permissions
\`\`\`

## 🔧 Scripts Reference

### Setup Scripts

- `setup:playwright` - Complete Playwright setup
- `setup:quick` - Quick development setup
- `setup:permissions` - Fix script permissions

### Testing Scripts

- `test` - Run all tests (4 workers)
- `test:ui` - Interactive test UI
- `test:headed` - Tests with browser UI
- `test:mobile` - Mobile device tests
- `test:desktop` - Desktop browser tests
- `test:accessibility` - Accessibility tests
- `test:run` - Advanced test runner

### Development Scripts

- `dev` - Start Next.js development server
- `build` - Build for production
- `start` - Start production server
- `pack:assets` - Pack game assets

## 🌍 Internationalization

### Language Structure

\`\`\`json
{
"home": {
"welcome": "Welcome to RTPLUX",
"selectGame": "Select a Game"
},
"games": {
"roulette": "Roulette",
"loading": "Loading..."
}
}
\`\`\`

### Usage

\`\`\`typescript
import { useTranslation } from '@/hooks/useTranslation'

const { t } = useTranslation()
const welcomeText = t('home.welcome')
\`\`\`

## 🎯 Testing Strategy

### Cross-Device Testing

- **Desktop**: 1920x1080, 1366x768, 2560x1440
- **Tablet**: iPad Pro (portrait/landscape)
- **Mobile**: iPhone 12, Pixel 5, Galaxy S9+

### Test Categories

- **Functional**: Core game functionality
- **Visual**: UI consistency across devices
- **Performance**: Load times and responsiveness
- **Accessibility**: WCAG 2.1 compliance
- **Localization**: Multi-language support

### CI/CD Integration

\`\`\`yaml

# GitHub Actions example

- name: Run Playwright Tests
  run: |
  APP_URL=${{ secrets.STAGING_URL }} npm run test
  env:
  CI: true
  \`\`\`

## 🚀 Deployment

### Environment Variables

\`\`\`bash

# Required

APP_URL=https://your-domain.com
NEXT_PUBLIC_PARTNER_ID=partner1

# Optional

NEXT_PUBLIC_POSTHOG_KEY=your_key
NEXT_PUBLIC_SENTRY_DSN=your_dsn
\`\`\`

### Build Process

\`\`\`bash

# Production build

npm run build

# Test production build

APP_URL=http://localhost:3000 npm start &
APP_URL=http://localhost:3000 npm run test
\`\`\`

## 🔍 Troubleshooting

### Common Issues

#### Playwright Setup Issues

\`\`\`bash

# Fix system dependencies

bash scripts/fix-system-deps.sh

# Manual browser installation

npx playwright install --with-deps
\`\`\`

#### Permission Errors

\`\`\`bash

# Fix script permissions

npm run setup:permissions

# Or manually

chmod +x scripts/*.sh
\`\`\`

#### Port Conflicts

\`\`\`bash

# Check port usage

lsof -i :3000

# Use different port

APP_URL=http://localhost:4000 npm run dev
\`\`\`

#### Test Failures

\`\`\`bash

# Debug specific test

npx playwright test tests/specific-test.spec.ts --debug

# Check test results

ls test-results/
\`\`\`

## 📊 Performance

### Optimization Features

- **4 parallel workers** for fast test execution
- **Asset packing** for optimized game loading
- **Lazy loading** for improved initial load times
- **Responsive design** for all device types

### Monitoring

- **PostHog**: User analytics and feature flags
- **Sentry**: Error tracking and performance monitoring
- **Playwright**: Automated performance testing

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch
3. Setup environment: `npm run setup:playwright`
4. Start development: `npm run dev`
5. Run tests: `npm run test:ui`
6. Submit pull request

### Testing Requirements

- All new features must include tests
- Cross-device compatibility required
- Accessibility compliance (WCAG 2.1)
- Performance benchmarks maintained

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for the modern casino gaming experience** 🎰✨
