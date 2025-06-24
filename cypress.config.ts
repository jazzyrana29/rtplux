import { defineConfig } from "cypress"

export default defineConfig({
  e2e: {
    baseUrl: process.env.APP_URL || "http://localhost:8081",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    videosFolder: "cypress/videos",
    screenshotsFolder: "cypress/screenshots",
    downloadsFolder: "cypress/downloads",
    fixturesFolder: "cypress/fixtures",

    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,

    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,

    // Retry settings
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Video and screenshot settings
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,

    // Load testing specific settings
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 5,

    setupNodeEvents(on, config) {
      // Load testing event handlers
      on("task", {
        // Custom task for load testing metrics
        logLoadMetrics(metrics) {
          console.log("Load Test Metrics:", metrics)
          return null
        },

        // Task to simulate concurrent users
        simulateConcurrentUsers(userCount) {
          console.log(`Simulating ${userCount} concurrent users`)
          return null
        },

        // Task to measure response times
        measureResponseTime(data) {
          const { url, responseTime } = data
          console.log(`Response time for ${url}: ${responseTime}ms`)
          return null
        },
      })

      // Plugin for generating reports
      on("after:run", (results) => {
        console.log("Test run completed:", results)
      })

      return config
    },
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
  },

  // Environment variables
  env: {
    APP_URL: process.env.APP_URL || "http://localhost:8081",
    LOAD_TEST_USERS: process.env.LOAD_TEST_USERS || "10",
    LOAD_TEST_DURATION: process.env.LOAD_TEST_DURATION || "60",
    PARTNER_ID: process.env.PARTNER_ID || "default",
  },
})
