import { defineConfig, devices } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:8081';
const CI = process.env.CI === 'true';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!CI,
  retries: CI ? 2 : 0,
  workers: 4,
  reporter: CI
    ? [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['github'],
      ]
    : [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['list'],
      ],

  use: {
    baseURL: APP_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Desktop browsers (for web version)
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile devices
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet devices
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // For Expo projects, we typically don't auto-start the server
  // Users should start Expo manually: npx expo start --web
  webServer:
    APP_URL.includes('localhost') && !CI
      ? {
          command: 'expo start --web --port 8081',
          url: APP_URL,
          reuseExistingServer: true, // Don't kill existing Expo server
          timeout: 120 * 1000,
          stdout: 'pipe',
          stderr: 'pipe',
        }
      : undefined,

  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },

  outputDir: 'test-results/',
});
