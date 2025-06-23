import { test, expect } from "@playwright/test"
import { TestHelpers } from "../utils/test-helpers"

test.describe("Home Page Cross-Device Tests", () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    await page.goto("/")
    await helpers.waitForPageLoad()
  })

  test("should display correctly on desktop @desktop @cross-device", async ({ page }) => {
    await helpers.takeScreenshot("home-desktop")

    // Check main title is visible
    await expect(page.locator("h1")).toContainText("RTPLUX")

    // Check navigation buttons are properly sized
    const enterGamesBtn = page.locator("text=🎮 Enter Games")
    await expect(enterGamesBtn).toBeVisible()

    // Check layout is not cramped
    const viewport = page.viewportSize()
    expect(viewport?.width).toBeGreaterThan(1200)

    // Test hover effects (desktop only)
    await enterGamesBtn.hover()
    await page.waitForTimeout(500)
    await helpers.takeScreenshot("home-desktop-hover")
  })

  test("should display correctly on tablet @tablet @cross-device", async ({ page }) => {
    await helpers.takeScreenshot("home-tablet")

    // Check responsive layout
    await helpers.checkResponsiveElement(page.locator('[data-testid="main-title"]'), {
      tablet: { visible: true, text: "RTPLUX" },
    })

    // Check buttons are touch-friendly
    const buttons = page.locator("button")
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44) // Minimum touch target
      }
    }
  })

  test("should display correctly on mobile @mobile @cross-device", async ({ page }) => {
    await helpers.takeScreenshot("home-mobile")

    // Check mobile layout
    const viewport = page.viewportSize()
    expect(viewport?.width).toBeLessThan(768)

    // Check text is readable
    const title = page.locator("h1")
    await expect(title).toBeVisible()

    // Check buttons stack vertically on mobile
    const buttons = page.locator("button").filter({ hasText: /Enter Games|Language/ })
    const firstButton = buttons.first()
    const secondButton = buttons.nth(1)

    const firstBox = await firstButton.boundingBox()
    const secondBox = await secondButton.boundingBox()

    if (firstBox && secondBox) {
      expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height)
    }

    // Test touch interactions
    await helpers.testTouchInteraction(page.locator("text=🎮 Enter Games"))
  })

  test("should handle language switching across devices @cross-device", async ({ page }) => {
    // Open language selector
    const languageBtn = page.locator("text=🌐 Language")
    await languageBtn.click()

    // Wait for modal
    await page.waitForSelector('[data-testid="language-modal"]', { timeout: 5000 })

    // Test Spanish selection
    await page.click("text=Español")
    await page.waitForTimeout(1000)

    // Verify language change
    await expect(page.locator("h1")).toContainText("RTPLUX")
    await expect(page.locator("text=Entrar a Juegos")).toBeVisible()

    await helpers.takeScreenshot("home-spanish")
  })

  test("should handle partner switching @cross-device", async ({ page }) => {
    // Only test in development mode
    const partnerSwitcher = page.locator('[data-testid="partner-switcher"]')

    if (await partnerSwitcher.isVisible()) {
      await partnerSwitcher.click()
      await page.waitForTimeout(500)

      // Switch to partner1
      await page.click('[data-testid="partner-partner1"]')
      await page.waitForTimeout(2000) // Wait for page reload

      // Verify partner change
      await expect(page.locator('[data-testid="partner-name"]')).toContainText("Premium Casino")
    }
  })

  test("should maintain performance across devices @cross-device", async ({ page }) => {
    // Measure page load time
    const startTime = Date.now()
    await page.goto("/")
    await helpers.waitForPageLoad()
    const loadTime = Date.now() - startTime

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)

    // Check for console errors
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text())
      }
    })

    await page.reload()
    await helpers.waitForPageLoad()

    // Should have minimal console errors
    expect(errors.length).toBeLessThan(3)
  })
})
