// Utility functions for partner detection and switching

export const PARTNER_DETECTION_METHODS = {
  URL_PARAM: "url_param",
  SUBDOMAIN: "subdomain",
  ENVIRONMENT: "environment",
  DEFAULT: "default",
} as const

export type PartnerDetectionMethod = (typeof PARTNER_DETECTION_METHODS)[keyof typeof PARTNER_DETECTION_METHODS]

export interface PartnerDetectionResult {
  partnerId: string
  method: PartnerDetectionMethod
  source: string
}

// Enhanced partner detection with detailed logging
export const detectPartnerWithDetails = (): PartnerDetectionResult => {
  // 1. Check URL parameters first (highest priority)
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search)
    const urlPartnerId = urlParams.get("partner") || urlParams.get("partnerId")

    if (urlPartnerId) {
      console.log(`🔍 Partner detected from URL parameter: ${urlPartnerId}`)
      return {
        partnerId: urlPartnerId,
        method: PARTNER_DETECTION_METHODS.URL_PARAM,
        source: window.location.search,
      }
    }

    // 2. Check subdomain
    const hostname = window.location.hostname
    const subdomain = hostname.split(".")[0]

    if (subdomain && subdomain !== "www" && subdomain !== "localhost" && !subdomain.includes("192.168")) {
      console.log(`🔍 Partner detected from subdomain: ${subdomain}`)
      return {
        partnerId: subdomain,
        method: PARTNER_DETECTION_METHODS.SUBDOMAIN,
        source: hostname,
      }
    }
  }

  // 3. Check environment variable
  if (process.env.NEXT_PUBLIC_PARTNER_ID) {
    console.log(`🔍 Partner detected from environment: ${process.env.NEXT_PUBLIC_PARTNER_ID}`)
    return {
      partnerId: process.env.NEXT_PUBLIC_PARTNER_ID,
      method: PARTNER_DETECTION_METHODS.ENVIRONMENT,
      source: "NEXT_PUBLIC_PARTNER_ID",
    }
  }

  // 4. Default fallback
  console.log(`🔍 Using default partner configuration`)
  return {
    partnerId: "default",
    method: PARTNER_DETECTION_METHODS.DEFAULT,
    source: "fallback",
  }
}

// Function to manually switch partner (useful for testing)
export const switchPartner = (partnerId: string) => {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href)
    url.searchParams.set("partner", partnerId)
    window.location.href = url.toString()
  }
}

// Function to clear partner override and use default detection
export const clearPartnerOverride = () => {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href)
    url.searchParams.delete("partner")
    url.searchParams.delete("partnerId")
    window.location.href = url.toString()
  }
}

// Get available partners from config files
export const getAvailablePartners = async (): Promise<string[]> => {
  const knownPartners = ["default", "partner1", "partner2"]
  const availablePartners: string[] = []

  for (const partnerId of knownPartners) {
    try {
      const response = await fetch(`/config/${partnerId}.json`)
      if (response.ok) {
        availablePartners.push(partnerId)
      }
    } catch (error) {
      console.warn(`Partner config not available: ${partnerId}`)
    }
  }

  return availablePartners
}
