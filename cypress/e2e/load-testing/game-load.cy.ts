import { describe, it, expect } from "cypress"
import { cy } from "cypress"

describe("Game Load Testing", () => {
  const gameLoadConfig = {
    users: Number.parseInt(Cypress.env("LOAD_TEST_USERS") || "5"),
    duration: Number.parseInt(Cypress.env("LOAD_TEST_DURATION") || "30"),
  }

  it("should handle roulette game load", () => {
    // Simulate multiple users playing roulette
    cy.simulateLoad({
      users: gameLoadConfig.users,
      duration: gameLoadConfig.duration,
      actions: ["game"],
    })

    // Test actual game functionality under load
    cy.navigateToGame("roulette")

    // Wait for game to load
    cy.get("#roulette-phaser-container", { timeout: 30000 }).should("be.visible")

    // Simulate game actions under load
    for (let i = 0; i < 3; i++) {
      cy.measurePerformance(`game-action-${i}`)

      // Buy chips
      cy.get('[data-testid="buy-chips-btn"]').click()
      cy.wait(1000)

      // Place bet
      cy.get('[data-testid="chip-5"]').click()
      cy.get('[data-testid="bet-area-red"]').click()

      // Spin
      cy.get('[data-testid="spin-button"]').click()
      cy.wait(4000) // Wait for spin to complete

      cy.checkMemoryUsage()
    }
  })

  it("should handle concurrent game sessions", () => {
    // Test multiple concurrent game sessions
    cy.simulateConcurrentUsers(3)

    // Each user navigates to a different game
    const games = ["roulette", "slots", "blackjack"]

    games.forEach((game, index) => {
      cy.window().then((win) => {
        const newWindow = win.open(`${Cypress.config("baseUrl")}/games/${game}`, `game-${index}`)
        expect(newWindow).to.not.be.null
      })
    })

    cy.wait(5000) // Allow games to load

    // Verify main window still works
    cy.visit("/games")
    cy.get('[data-testid="game-card-roulette"]').should("be.visible")
  })

  it("should handle rapid game interactions", () => {
    cy.navigateToGame("roulette")
    cy.waitForStableLoad()

    const rapidActions = 10
    const actionTimes: number[] = []

    for (let i = 0; i < rapidActions; i++) {
      const startTime = Date.now()

      // Rapid chip selection
      const chipValues = [1, 5, 25, 100]
      const randomChip = chipValues[Math.floor(Math.random() * chipValues.length)]

      cy.get(`[data-testid="chip-${randomChip}"]`).click()

      cy.then(() => {
        const endTime = Date.now()
        actionTimes.push(endTime - startTime)
      })

      cy.wait(100) // Small delay between actions
    }

    cy.then(() => {
      const avgActionTime = actionTimes.reduce((a, b) => a + b, 0) / actionTimes.length

      // Actions should remain fast even with rapid clicking
      expect(avgActionTime).to.be.lessThan(500) // Less than 500ms average

      cy.task("logLoadMetrics", {
        test: "rapid-game-interactions",
        averageActionTime: avgActionTime,
        actionTimes,
        totalActions: rapidActions,
      })
    })
  })
})
