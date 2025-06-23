import type { Browser, BrowserContext, Page } from "@playwright/test"
import deviceData from "../test-data/devices.json"

export class DeviceManager {
  private browser: Browser
  private contexts: Map<string, BrowserContext> = new Map()

  constructor(browser: Browser) {
    this.browser = browser
  }

  async createDeviceContext(deviceType: "desktop" | "tablet" | "mobile", deviceName: string): Promise<BrowserContext> {
    const device = deviceData.devices[deviceType][deviceName as keyof typeof deviceData.devices.desktop]

    if (!device) {
      throw new Error(`Device ${deviceName} not found in ${deviceType} category`)
    }

    const context = await this.browser.newContext({
      viewport: device.viewport,
      userAgent: device.userAgent,
      deviceScaleFactor: deviceType === "mobile" ? 2 : 1,
      isMobile: deviceType === "mobile",
      hasTouch: deviceType !== "desktop",
    })

    const contextKey = `${deviceType}-${deviceName}`
    this.contexts.set(contextKey, context)

    return context
  }

  async createPageForDevice(deviceType: "desktop" | "tablet" | "mobile", deviceName: string): Promise<Page> {
    const context = await this.createDeviceContext(deviceType, deviceName)
    return await context.newPage()
  }

  async closeAllContexts(): Promise<void> {
    for (const context of this.contexts.values()) {
      await context.close()
    }
    this.contexts.clear()
  }

  getDeviceInfo(deviceType: "desktop" | "tablet" | "mobile", deviceName: string) {
    return deviceData.devices[deviceType][deviceName as keyof typeof deviceData.devices.desktop]
  }

  getAllDevices() {
    return deviceData.devices
  }

  getTestScenarios() {
    return deviceData.testScenarios
  }
}
