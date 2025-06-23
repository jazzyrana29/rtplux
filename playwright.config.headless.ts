import { defineConfig, devices } from "@playwright/test"

/**
 * Headless configuration for CI/CD and environments with limited display support
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/results.xml" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Force headless mode
    headless: true,
  },

  projects: [
    // Minimal browser set for CI
    {
      name: "chromium-headless",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
        // Ensure headless
        launchOptions: {
          headless: true,
        },
      },
    },
    {
      name: "mobile-chrome-headless",
      use: {
        ...devices["Pixel 5"],
        launchOptions: {
          headless: true,
        },
      },
    },
    {
      name: "tablet-headless",
      use: {
        ...devices["iPad Pro"],
        launchOptions: {
          headless: true,
        },
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  outputDir: "test-results/",
})
