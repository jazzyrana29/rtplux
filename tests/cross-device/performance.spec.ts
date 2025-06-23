import { test, expect } from "@playwright/test"
import { TestHelpers } from "../utils/test-helpers"

test.describe("Performance Cross-Device Tests", () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test("should load quickly on desktop @desktop @performance", async ({ page }) => {
    const startTime = Date.now()

    await page.goto("/")
    await helpers.waitForPageLoad()

    const loadTime = Date.now() - startTime

    // Desktop should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)

    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const metrics: any = {}

          entries.forEach((entry) => {
            if (entry.entryType === "navigation") {
              metrics.loadTime = entry.loadEventEnd - entry.loadEventStart
            }
          })

          resolve(metrics)
        }).observe({ entryTypes: ["navigation"] })
      })
    })

    console.log("Desktop metrics:", metrics)
  })

  test("should load acceptably on mobile @mobile @performance", async ({ page }) => {
    const startTime = Date.now()

    await page.goto("/")
    await helpers.waitForPageLoad()

    const loadTime = Date.now() - startTime

    // Mobile should load within 5 seconds (slower network)
    expect(loadTime).toBeLessThan(5000)

    await helpers.takeScreenshot("mobile-performance")
  })

  test("should handle memory usage efficiently @cross-device @performance", async ({ page }) => {
    await page.goto("/")
    await helpers.waitForPageLoad()

    // Navigate through different pages
    await page.click("text=🎮 Enter Games")
    await helpers.waitForPageLoad()

    await page.click('[data-testid="game-card-roulette"]')
    await helpers.waitForPageLoad()

    // Check for memory leaks (basic check)
    const jsHeapSize = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })

    if (jsHeapSize > 0) {
      // Should not exceed 100MB
      expect(jsHeapSize).toBeLessThan(100 * 1024 * 1024)
    }
  })

  test("should handle network conditions @cross-device @performance", async ({ page, context }) => {
    // Simulate slow 3G
    await context.route("**/*", (route) => {
      setTimeout(() => route.continue(), 100) // Add 100ms delay
    })

    const startTime = Date.now()
    await page.goto("/")
    await helpers.waitForPageLoad()
    const loadTime = Date.now() - startTime

    // Should still load within reasonable time on slow network
    expect(loadTime).toBeLessThan(10000)

    await helpers.takeScreenshot("slow-network")
  })

  test("should optimize images for different devices @cross-device @performance", async ({ page }) => {
    await page.goto("/")
    await helpers.waitForPageLoad()

    // Check image loading
    const images = page.locator("img")
    const imageCount = await images.count()

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const src = await img.getAttribute("src")

      if (src) {
        // Check if image loads successfully
        const response = await page.request.get(src)
        expect(response.status()).toBe(200)

        // Check image size is reasonable
        const contentLength = response.headers()["content-length"]
        if (contentLength) {
          const size = Number.parseInt(contentLength)
          expect(size).toBeLessThan(1024 * 1024) // Less than 1MB
        }
      }
    }
  })
})
