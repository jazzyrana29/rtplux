import { test, expect } from "@playwright/test"
import { TestHelpers } from "../utils/test-helpers"

test.describe("Accessibility Cross-Device Tests", () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test("should be keyboard navigable on desktop @desktop @accessibility", async ({ page }) => {
    await page.goto("/")
    await helpers.waitForPageLoad()

    // Test keyboard navigation
    await page.keyboard.press("Tab")
    let focusedElement = await page.locator(":focus")
    await expect(focusedElement).toBeVisible()

    // Continue tabbing through interactive elements
    const interactiveElements = await page.locator("button, a, input, select").count()

    for (let i = 0; i < Math.min(interactiveElements, 10); i++) {
      await page.keyboard.press("Tab")
      focusedElement = await page.locator(":focus")
      await expect(focusedElement).toBeVisible()
    }

    await helpers.takeScreenshot("keyboard-navigation")
  })

  test("should have proper ARIA labels @cross-device @accessibility", async ({ page }) => {
    await page.goto("/")
    await helpers.waitForPageLoad()

    // Check main navigation has proper labels
    const buttons = page.locator("button")
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute("aria-label")
      const text = await button.textContent()

      // Button should have either aria-label or visible text
      expect(ariaLabel || text).toBeTruthy()
    }
  })

  test("should have sufficient color contrast @cross-device @accessibility", async ({ page }) => {
    await page.goto("/")
    await helpers.waitForPageLoad()

    // Test main text elements
    const textElements = page.locator("h1, h2, h3, p, button, a")
    const elementCount = await textElements.count()

    for (let i = 0; i < Math.min(elementCount, 5); i++) {
      const element = textElements.nth(i)
      if (await element.isVisible()) {
        await helpers.checkColorContrast(element)
      }
    }
  })

  test("should support screen readers @cross-device @accessibility", async ({ page }) => {
    await page.goto("/")
    await helpers.waitForPageLoad()

    // Check for proper heading structure
    const h1Count = await page.locator("h1").count()
    expect(h1Count).toBe(1) // Should have exactly one h1

    // Check for proper landmark roles
    const main = page.locator('main, [role="main"]')
    await expect(main).toHaveCount(1)

    // Check for alt text on images
    const images = page.locator("img")
    const imageCount = await images.count()

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute("alt")
      const ariaLabel = await img.getAttribute("aria-label")

      // Images should have alt text or aria-label
      expect(alt || ariaLabel).toBeTruthy()
    }
  })

  test("should handle focus management in modals @cross-device @accessibility", async ({ page }) => {
    await page.goto("/")
    await helpers.waitForPageLoad()

    // Open language selector modal
    const languageBtn = page.locator("text=🌐 Language")
    if (await languageBtn.isVisible()) {
      await languageBtn.click()

      // Focus should move to modal
      await page.waitForSelector('[data-testid="language-modal"]')
      const modal = page.locator('[data-testid="language-modal"]')

      // Check if focus is trapped in modal
      await page.keyboard.press("Tab")
      const focusedElement = await page.locator(":focus")

      // Focused element should be within modal
      const isInModal = (await modal.locator(":focus").count()) > 0
      expect(isInModal).toBeTruthy()

      // Close modal with Escape
      await page.keyboard.press("Escape")
      await expect(modal).toBeHidden()
    }
  })
})
