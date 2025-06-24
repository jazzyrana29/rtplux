// Environment variable utilities with type safety

export const env = {
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  PARTNER_ID: process.env.PARTNER_ID || "partner1",
  POSTHOG_KEY: process.env.POSTHOG_KEY || "",
  POSTHOG_HOST: process.env.POSTHOG_HOST || "https://app.posthog.com",
  SENTRY_DSN: process.env.SENTRY_DSN || "",
  CI: process.env.CI === "true",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const

// Type-safe environment variable getter
export function getEnvVar(key: keyof typeof env): string {
  const value = env[key]
  if (typeof value === "boolean") {
    return value.toString()
  }
  return value
}

// Validate required environment variables
export function validateEnv(): void {
  const required = ["APP_URL"] as const

  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }
}

// Check if running in development
export const isDev = env.NODE_ENV === "development"

// Check if running in production
export const isProd = env.NODE_ENV === "production"

// Check if running in test
export const isTest = env.NODE_ENV === "test"

// Check if running in CI
export const isCI = env.CI
