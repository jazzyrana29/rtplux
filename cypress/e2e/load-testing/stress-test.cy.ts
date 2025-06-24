import { describe, it, expect } from "cypress"
import Cypress from "cypress"

describe("Stress Testing", () => {
  const stressConfig = {
    maxUsers: Number.parseInt(Cypress.env("LOAD_TEST_USERS") || "20"),
    duration: Number.parseInt(Cypress.env("LOAD_TEST_DURATION") || "120"),
  }

  it("should handle stress load on application", () => {
    // Gradually increase load
    const rampUpSteps = 5
    const usersPerStep = Math.floor(stressConfig.maxUsers / rampUpSteps)

    for (let step = 1; step <= rampUpSteps; step++) {
      const currentUsers = usersPerStep * step

      Cypress.log(`Stress test step ${step}: ${currentUsers} users`)

      Cypress.simulateLoad({
        users: currentUsers,
        duration: 20, // 20 seconds per step
        rampUp: 5,
        actions: ["visit", "navigate", "game"],
      })

      // Verify application still responds
      Cypress.visit("/")
      Cypress.get("h1").should("contain", "RTPLUX")

      // Check response time doesn't degrade too much
      Cypress.measurePerformance(`stress-step-${step}`)

      Cypress.stopPerformanceMonitoring().then((metrics) => {
        // Response time should not exceed 10 seconds even under stress
        expect(metrics.loadTime).to.be.lessThan(10000)

        Cypress.task("logLoadMetrics", {
          test: "stress-test",
          step,
          users: currentUsers,
          metrics,
        })
      })

      Cypress.startPerformanceMonitoring() // Reset for next step
    }
  })

  it("should recover from peak load", () => {
    // Apply maximum load
    Cypress.simulateLoad({
      users: stressConfig.maxUsers,
      duration: 30,
      actions: ["visit", "navigate"],
    })

    // Wait for load to subside
    Cypress.wait(10000)

    // Test recovery
    Cypress.visit("/")
    Cypress.waitForStableLoad()

    Cypress.stopPerformanceMonitoring().then((metrics) => {
      // Should recover to normal performance
      expect(metrics.loadTime).to.be.lessThan(3000)

      Cypress.task("logLoadMetrics", {
        test: "stress-recovery",
        metrics,
        maxUsers: stressConfig.maxUsers,
      })
    })
  })

  it("should handle memory pressure", () => {
    // Create memory pressure by loading large amounts of data
    const memoryPressureActions = 20

    for (let i = 0; i < memoryPressureActions; i++) {
      Cypress.visit("/")
      Cypress.get('[data-testid="enter-games-btn"]').click()
      Cypress.visit("/games/roulette")
      Cypress.wait(2000)

      // Check memory usage every 5 iterations
      if (i % 5 === 0) {
        Cypress.checkMemoryUsage()
      }
    }

    // Final memory check
    Cypress.window().then((win) => {
      if ((win.performance as any).memory) {
        const memory = (win.performance as any).memory
        const memoryUsageMB = memory.usedJSHeapSize / (1024 * 1024)

        // Memory usage should not exceed 200MB even under pressure
        expect(memoryUsageMB).to.be.lessThan(200)

        Cypress.task("logLoadMetrics", {
          test: "memory-pressure",
          memoryUsageMB,
          actions: memoryPressureActions,
        })
      }
    })
  })
})
