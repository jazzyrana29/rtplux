export interface GameFeatures {
  enabled: boolean
  maxBet: number
  minBet: number
  allowedChips: number[]
  specialFeatures: Record<string, boolean>
}

export interface UIFeatures {
  darkMode: boolean
  animations: boolean
  sounds: boolean
  notifications: boolean
  languageSelector: boolean
  currencyDisplay: string
  theme: string
}

export interface AnalyticsFeatures {
  posthog: boolean
  sentry: boolean
  customEvents: boolean
  performanceTracking: boolean
}

export interface PaymentFeatures {
  deposits: boolean
  withdrawals: boolean
  cryptoPayments: boolean
  instantWithdrawals: boolean
}

export interface SocialFeatures {
  chat: boolean
  leaderboards: boolean
  achievements: boolean
  referrals: boolean
}

export interface LimitFeatures {
  dailyDepositLimit: number
  dailyWithdrawalLimit: number
  sessionTimeLimit: number
  maxConcurrentSessions: number
}

export interface Features {
  roulette: GameFeatures
  slots: GameFeatures
  blackjack: GameFeatures
  crash: GameFeatures
  ui: UIFeatures
  analytics: AnalyticsFeatures
  payments: PaymentFeatures
  social: SocialFeatures
  limits: LimitFeatures
}

export interface BrandingConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logo: string
  favicon: string
  backgroundImage?: string | null
}

export interface APIConfig {
  baseUrl: string
  version: string
  timeout: number
  retryAttempts: number
}

export interface PartnerConfig {
  partnerId: string
  partnerName: string
  features: Features
  branding: BrandingConfig
  api: APIConfig
  version: string
  lastUpdated: string
}

export type FeaturePath =
  | `roulette.${keyof GameFeatures}`
  | `slots.${keyof GameFeatures}`
  | `blackjack.${keyof GameFeatures}`
  | `crash.${keyof GameFeatures}`
  | `ui.${keyof UIFeatures}`
  | `analytics.${keyof AnalyticsFeatures}`
  | `payments.${keyof PaymentFeatures}`
  | `social.${keyof SocialFeatures}`
  | `limits.${keyof LimitFeatures}`
  | keyof Features

export type GameType = "roulette" | "slots" | "blackjack" | "crash"
