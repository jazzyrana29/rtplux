import { test, expect } from "@playwright/test"
import { TestHelpers } from "../utils/test-helpers"

test.describe("Games Page Cross-Device Tests", () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    await page.goto("/games")
    await helpers.waitForPageLoad()
  })

  test("should display game cards correctly on desktop @desktop @cross-device", async ({ page }) => {
    await helpers.takeScreenshot("games-desktop")

    // Check all game cards are visible
    const gameCards = page.locator('[data-testid="game-card"]')
    await expect(gameCards).toHaveCount(4)

    // Check roulette card is enabled
    const rouletteCard = page.locator('[data-testid="game-card-roulette"]')
    await expect(rouletteCard).toBeVisible()
    await expect(rouletteCard).toContainText("🎯 Roulette")

    // Test hover effects on desktop
    await rouletteCard.hover()
    await page.waitForTimeout(500)
    await helpers.takeScreenshot("games-desktop-hover")
  })

  test("should display game cards correctly on tablet @tablet @cross-device", async ({ page }) => {
    await helpers.takeScreenshot("games-tablet")

    // Check responsive grid layout
    const gameCards = page.locator('[data-testid="game-card"]')
    const cardCount = await gameCards.count()

    // Cards should be properly spaced
    for (let i = 0; i < cardCount; i++) {
      const card = gameCards.nth(i)
      await expect(card).toBeVisible()

      const box = await card.boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThan(200) // Minimum card width
      }
    }
  })

  test("should display game cards correctly on mobile @mobile @cross-device", async ({ page }) => {
    await helpers.takeScreenshot("games-mobile")

    // Check mobile layout - cards should stack vertically
    const gameCards = page.locator('[data-testid="game-card"]')
    const firstCard = gameCards.first()
    const secondCard = gameCards.nth(1)

    const firstBox = await firstCard.boundingBox()
    const secondBox = await secondCard.boundingBox()

    if (firstBox && secondBox) {
      // Cards should be stacked vertically with some spacing
      expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height)
    }

    // Test touch interactions
    await helpers.testTouchInteraction(page.locator('[data-testid="game-card-roulette"]'))
  })

  test("should navigate to roulette game @cross-device", async ({ page }) => {
    // Click on roulette card
    await page.click('[data-testid="game-card-roulette"]')

    // Should navigate to roulette page
    await page.waitForURL("**/games/roulette")
    await helpers.waitForPageLoad()

    // Verify roulette page loaded
    await expect(page.locator("h1")).toContainText("Roulette")

    await helpers.takeScreenshot("roulette-loaded")
  })

  test("should show disabled games correctly @cross-device", async ({ page }) => {
    // Check that disabled games are properly marked
    const slotsCard = page.locator('[data-testid="game-card-slots"]')
    await expect(slotsCard).toContainText("Coming Soon")

    // Disabled cards should not be clickable
    const isClickable = await slotsCard.evaluate((el) => {
      return window.getComputedStyle(el).pointerEvents !== "none"
    })

    // Should either be non-clickable or show appropriate feedback
    if (isClickable) {
      await slotsCard.click()
      // Should not navigate away from games page
      expect(page.url()).toContain("/games")
    }
  })

  test("should handle feature flags correctly @cross-device", async ({ page }) => {
    // Test with different partner configurations
    await page.goto("/games?partner=partner2")
    await helpers.waitForPageLoad()

    // Partner2 should have more games enabled
    const gameCards = page.locator('[data-testid="game-card"]')
    const enabledCards = gameCards.filter({ hasNotText: "Coming Soon" })

    // Should have at least roulette enabled
    await expect(enabledCards).toHaveCountGreaterThanOrEqual(1)

    await helpers.takeScreenshot("games-partner2")
  })
})
