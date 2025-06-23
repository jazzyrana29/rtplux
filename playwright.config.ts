import { defineConfig, devices } from "@playwright/test"

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/results.xml" }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3000",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Take screenshot on failure */
    screenshot: "only-on-failure",
    /* Record video on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers and devices */
  projects: [
    // Desktop Browsers
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "firefox-desktop",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "webkit-desktop",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Tablet Devices
    {
      name: "tablet-portrait",
      use: {
        ...devices["iPad Pro"],
        viewport: { width: 1024, height: 1366 },
      },
    },
    {
      name: "tablet-landscape",
      use: {
        ...devices["iPad Pro landscape"],
        viewport: { width: 1366, height: 1024 },
      },
    },

    // Mobile Devices
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
    {
      name: "mobile-samsung",
      use: { ...devices["Galaxy S9+"] },
    },

    // Custom Viewports
    {
      name: "small-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: "large-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 2560, height: 1440 },
      },
    },
    {
      name: "mobile-small",
      use: {
        ...devices["iPhone SE"],
        viewport: { width: 375, height: 667 },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Global test timeout */
  timeout: 30 * 1000,
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 5000,
  },

  /* Test output directory */
  outputDir: "test-results/",
})
