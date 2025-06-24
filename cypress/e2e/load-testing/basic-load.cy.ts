import { describe, it, beforeEach, expect, Cypress } from "cypress"

describe("Basic Load Testing", () => {
  const loadTestConfig = {
    users: Number.parseInt(Cypress.env("LOAD_TEST_USERS") || "10"),
    duration: Number.parseInt(Cypress.env("LOAD_TEST_DURATION") || "60"),
  }

  beforeEach(() => {
    cy.startPerformanceMonitoring()
  })

  it("should handle basic load on home page", () => {
    cy.simulateLoad({
      users: loadTestConfig.users,
      duration: 30, // 30 seconds for basic test
      actions: ["visit"],
    })

    // Verify page still loads correctly under load
    cy.visit("/")
    cy.get("h1").should("contain", "RTPLUX")
    cy.get('[data-testid="enter-games-btn"]').should("be.visible")

    cy.stopPerformanceMonitoring().then((metrics) => {
      expect(metrics.loadTime).to.be.lessThan(5000) // Less than 5 seconds
      cy.task("logLoadMetrics", {
        test: "basic-load-home",
        metrics,
        users: loadTestConfig.users,
      })
    })
  })

  it("should handle navigation load", () => {
    cy.simulateLoad({
      users: Math.floor(loadTestConfig.users / 2),
      duration: 30,
      actions: ["visit", "navigate"],
    })

    // Test navigation under load
    cy.visit("/")
    cy.get('[data-testid="enter-games-btn"]').click()
    cy.url().should("include", "/games")

    cy.checkMemoryUsage()
  })

  it("should maintain performance under sustained load", () => {
    const iterations = 5
    const responseTimesArray: number[] = []

    for (let i = 0; i < iterations; i++) {
      cy.measurePerformance(`iteration-${i}`)

      const startTime = Date.now()
      cy.visit("/")
      cy.waitForStableLoad()

      cy.then(() => {
        const endTime = Date.now()
        const responseTime = endTime - startTime
        responseTimesArray.push(responseTime)

        // Response time should not degrade significantly
        if (i > 0) {
          const previousTime = responseTimesArray[i - 1]
          const degradation = (responseTime - previousTime) / previousTime
          expect(degradation).to.be.lessThan(0.5) // Less than 50% degradation
        }
      })

      cy.wait(2000) // Wait between iterations
    }

    cy.then(() => {
      const avgResponseTime = responseTimesArray.reduce((a, b) => a + b, 0) / responseTimesArray.length
      cy.task("logLoadMetrics", {
        test: "sustained-load",
        averageResponseTime: avgResponseTime,
        responseTimesArray,
        iterations,
      })
    })
  })
})
