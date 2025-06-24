// cypress/support/commands.ts

import { Cypress, cy, expect } from "cypress"
import type { LoadTestOptions, PerformanceMetrics } from "./types" // Assuming these types are defined in a separate file

// Load Testing Commands
Cypress.Commands.add("simulateLoad", (options: LoadTestOptions) => {
  const { users, duration, rampUp = 10, actions = ["visit", "navigate"] } = options

  cy.task("simulateConcurrentUsers", users)

  // Simulate load by performing actions repeatedly
  const iterations = Math.floor(duration / 5) // 5 seconds per iteration

  for (let i = 0; i < iterations; i++) {
    cy.then(() => {
      const startTime = Date.now()

      // Perform random actions
      const randomAction = actions[Math.floor(Math.random() * actions.length)]

      switch (randomAction) {
        case "visit":
          cy.visit("/")
          break
        case "navigate":
          cy.get('[data-testid="enter-games-btn"]').click()
          break
        case "game":
          cy.navigateToGame("roulette")
          break
      }

      cy.then(() => {
        const endTime = Date.now()
        const responseTime = endTime - startTime

        cy.task("measureResponseTime", {
          url: window.location.href,
          responseTime,
        })
      })

      // Wait between iterations
      cy.wait(5000)
    })
  }
})

Cypress.Commands.add("measurePerformance", (label: string) => {
  cy.window().then((win) => {
    if (win.performance) {
      win.performance.mark(`${label}-start`)

      return cy.wrap(null).then(() => {
        win.performance.mark(`${label}-end`)
        win.performance.measure(label, `${label}-start`, `${label}-end`)

        const measure = win.performance.getEntriesByName(label)[0]
        cy.task("logLoadMetrics", {
          label,
          duration: measure.duration,
          timestamp: Date.now(),
        })
      })
    }
  })
})

Cypress.Commands.add("waitForStableLoad", () => {
  // Wait for network to be idle
  cy.intercept("**/*").as("allRequests")

  // Wait for initial load
  cy.wait(2000)

  // Check if there are pending requests
  cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      let pendingRequests = 0

      const observer = new (win as any).PerformanceObserver((list: any) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.entryType === "resource") {
            pendingRequests++
          }
        })
      })

      observer.observe({ entryTypes: ["resource"] })

      setTimeout(() => {
        observer.disconnect()
        if (pendingRequests === 0) {
          resolve()
        }
      }, 3000)
    })
  })
})

Cypress.Commands.add("checkMemoryUsage", () => {
  cy.window().then((win) => {
    if ((win.performance as any).memory) {
      const memory = (win.performance as any).memory
      const memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      }

      cy.task("logLoadMetrics", {
        type: "memory",
        usage: memoryUsage,
        timestamp: Date.now(),
      })

      // Assert memory usage is reasonable (less than 100MB)
      expect(memoryUsage.used).to.be.lessThan(100 * 1024 * 1024)
    }
  })
})

Cypress.Commands.add("simulateConcurrentUsers", (userCount: number) => {
  // Simulate concurrent users by opening multiple tabs/contexts
  for (let i = 0; i < Math.min(userCount, 5); i++) {
    cy.window().then((win) => {
      win.open(Cypress.config("baseUrl"), `_blank_${i}`)
    })
  }

  cy.wait(2000) // Allow tabs to load
})

// Casino-specific commands
Cypress.Commands.add("navigateToGame", (gameType: string) => {
  cy.visit("/games")
  cy.get(`[data-testid="game-card-${gameType}"]`).click()
  cy.url().should("include", `/games/${gameType}`)
})

Cypress.Commands.add("placeBet", (amount: number) => {
  // Select chip denomination
  cy.get(`[data-testid="chip-${amount}"]`).click()

  // Place bet on red (example)
  cy.get('[data-testid="bet-area-red"]').click()
})

Cypress.Commands.add("spinRoulette", () => {
  cy.get('[data-testid="spin-button"]').click()
  cy.wait(3000) // Wait for spin animation
})

Cypress.Commands.add("buyChips", (amount: number) => {
  cy.get('[data-testid="buy-chips-btn"]').click()
  cy.get(`[data-testid="purchase-chip-${amount}"]`).click()
  cy.get('[data-testid="confirm-purchase"]').click()
})

// Performance monitoring commands
Cypress.Commands.add("startPerformanceMonitoring", () => {
  cy.window().then((win) => {
    win.performance.mark("test-start")
  })
})

Cypress.Commands.add("stopPerformanceMonitoring", () => {
  return cy.window().then((win) => {
    win.performance.mark("test-end")
    win.performance.measure("test-duration", "test-start", "test-end")

    const navigation = win.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    const measure = win.performance.getEntriesByName("test-duration")[0]

    const metrics: PerformanceMetrics = {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
    }

    // Get paint metrics if available
    const paintEntries = win.performance.getEntriesByType("paint")
    paintEntries.forEach((entry) => {
      if (entry.name === "first-contentful-paint") {
        metrics.firstContentfulPaint = entry.startTime
      }
    })

    // Get LCP if available
    if ("PerformanceObserver" in win) {
      const observer = new win.PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          metrics.largestContentfulPaint = lastEntry.startTime
        }
      })

      try {
        observer.observe({ entryTypes: ["largest-contentful-paint"] })
      } catch (e) {
        // LCP not supported
      }
    }

    return cy.wrap(metrics)
  })
})
