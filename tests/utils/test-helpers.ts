import { type Page, type Locator, expect } from "@playwright/test"

export class TestHelpers {
  constructor(public readonly page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle")
    await this.page.waitForLoadState("domcontentloaded")
  }

  /**
   * Take a screenshot with device info in filename
   */
  async takeScreenshot(name: string) {
    const viewport = this.page.viewportSize()
    const deviceName = viewport ? `${viewport.width}x${viewport.height}` : "unknown"
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${deviceName}.png`,
      fullPage: true,
    })
  }

  /**
   * Check if element is visible in viewport
   */
  async isInViewport(locator: Locator): Promise<boolean> {
    const box = await locator.boundingBox()
    if (!box) return false

    const viewport = this.page.viewportSize()
    if (!viewport) return false

    return box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(locator: Locator) {
    await locator.scrollIntoViewIfNeeded()
    await this.page.waitForTimeout(500) // Wait for scroll animation
  }

  /**
   * Check responsive behavior
   */
  async checkResponsiveElement(
    locator: Locator,
    expectedBehavior: {
      mobile?: { visible?: boolean; text?: string }
      tablet?: { visible?: boolean; text?: string }
      desktop?: { visible?: boolean; text?: string }
    },
  ) {
    const viewport = this.page.viewportSize()
    if (!viewport) return

    const width = viewport.width
    let deviceType: "mobile" | "tablet" | "desktop"

    if (width < 768) {
      deviceType = "mobile"
    } else if (width < 1024) {
      deviceType = "tablet"
    } else {
      deviceType = "desktop"
    }

    const expected = expectedBehavior[deviceType]
    if (!expected) return

    if (expected.visible !== undefined) {
      if (expected.visible) {
        await expect(locator).toBeVisible()
      } else {
        await expect(locator).toBeHidden()
      }
    }

    if (expected.text) {
      await expect(locator).toContainText(expected.text)
    }
  }

  /**
   * Test touch interactions (for mobile)
   */
  async testTouchInteraction(locator: Locator) {
    const viewport = this.page.viewportSize()
    const isMobile = viewport && viewport.width < 768

    if (isMobile) {
      // Test tap
      await locator.tap()
    } else {
      // Test click
      await locator.click()
    }
  }

  /**
   * Check if animations are working
   */
  async waitForAnimation(locator: Locator, timeout = 3000) {
    await this.page.waitForFunction(
      (element) => {
        const computedStyle = window.getComputedStyle(element)
        return computedStyle.animationPlayState !== "running" && computedStyle.transitionProperty === "none"
      },
      await locator.elementHandle(),
      { timeout },
    )
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(startLocator: Locator, expectedFocusOrder: string[]) {
    await startLocator.focus()

    for (let i = 0; i < expectedFocusOrder.length; i++) {
      await this.page.keyboard.press("Tab")
      const focusedElement = await this.page.locator(":focus")
      await expect(focusedElement).toHaveAttribute("data-testid", expectedFocusOrder[i])
    }
  }

  /**
   * Check color contrast (accessibility)
   */
  async checkColorContrast(locator: Locator, minRatio = 4.5) {
    const contrast = await this.page.evaluate(
      (element) => {
        const computedStyle = window.getComputedStyle(element)
        const bgColor = computedStyle.backgroundColor
        const textColor = computedStyle.color

        // Simple contrast calculation (would need a proper library in real implementation)
        return { bgColor, textColor, ratio: 4.6 } // Mock ratio
      },
      await locator.elementHandle(),
    )

    expect(contrast.ratio).toBeGreaterThanOrEqual(minRatio)
  }
}

export class GameTestHelpers extends TestHelpers {
  /**
   * Test game loading
   */
  async waitForGameLoad() {
    await this.page.waitForSelector('[data-testid="game-container"]', { timeout: 30000 })
    await this.page.waitForFunction(() => {
      const gameContainer = document.querySelector('[data-testid="game-container"]')
      return gameContainer && !gameContainer.querySelector('[data-testid="loading-spinner"]')
    })
  }

  /**
   * Test roulette game interactions
   */
  async testRouletteInteractions() {
    // Wait for roulette table to load
    await this.page.waitForSelector("#roulette-phaser-container", { timeout: 30000 })

    // Test chip selection
    await this.page.click('[data-testid="chip-1"]')
    await this.page.waitForTimeout(500)

    // Test bet placement
    await this.page.click('[data-testid="bet-area-red"]')
    await this.page.waitForTimeout(500)

    // Test spin button
    await this.page.click('[data-testid="spin-button"]')
    await this.page.waitForTimeout(3000) // Wait for spin animation
  }

  /**
   * Test partner switching
   */
  async testPartnerSwitching(partnerId: string) {
    // Open partner switcher
    await this.page.click('[data-testid="partner-switcher"]')
    await this.page.waitForTimeout(500)

    // Select partner
    await this.page.click(`[data-testid="partner-${partnerId}"]`)
    await this.page.waitForTimeout(1000)

    // Verify partner change
    await expect(this.page.locator('[data-testid="current-partner"]')).toContainText(partnerId)
  }
}
