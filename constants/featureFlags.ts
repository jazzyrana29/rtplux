export const FEATURE_FLAG_CONSTANTS = {
  // Game Features
  ROULETTE_ENABLED: "roulette.enabled",
  ROULETTE_MAX_BET: "roulette.maxBet",
  ROULETTE_MIN_BET: "roulette.minBet",
  ROULETTE_AUTO_SPIN: "roulette.specialFeatures.autoSpin",
  ROULETTE_QUICK_BET: "roulette.specialFeatures.quickBet",
  ROULETTE_BET_HISTORY: "roulette.specialFeatures.betHistory",

  SLOTS_ENABLED: "slots.enabled",
  SLOTS_AUTO_PLAY: "slots.specialFeatures.autoPlay",
  SLOTS_TURBO_MODE: "slots.specialFeatures.turboMode",

  BLACKJACK_ENABLED: "blackjack.enabled",
  BLACKJACK_SIDE_BETS: "blackjack.specialFeatures.sideBets",
  BLACKJACK_INSURANCE: "blackjack.specialFeatures.insurance",

  CRASH_ENABLED: "crash.enabled",
  CRASH_AUTO_CASHOUT: "crash.specialFeatures.autoCashout",
  CRASH_MULTIPLE_BETS: "crash.specialFeatures.multipleBets",

  // UI Features
  UI_DARK_MODE: "ui.darkMode",
  UI_ANIMATIONS: "ui.animations",
  UI_SOUNDS: "ui.sounds",
  UI_NOTIFICATIONS: "ui.notifications",
  UI_LANGUAGE_SELECTOR: "ui.languageSelector",
  UI_CURRENCY_DISPLAY: "ui.currencyDisplay",
  UI_THEME: "ui.theme",

  // Analytics Features
  ANALYTICS_POSTHOG: "analytics.posthog",
  ANALYTICS_SENTRY: "analytics.sentry",
  ANALYTICS_CUSTOM_EVENTS: "analytics.customEvents",
  ANALYTICS_PERFORMANCE_TRACKING: "analytics.performanceTracking",

  // Payment Features
  PAYMENTS_DEPOSITS: "payments.deposits",
  PAYMENTS_WITHDRAWALS: "payments.withdrawals",
  PAYMENTS_CRYPTO: "payments.cryptoPayments",
  PAYMENTS_INSTANT_WITHDRAWALS: "payments.instantWithdrawals",

  // Social Features
  SOCIAL_CHAT: "social.chat",
  SOCIAL_LEADERBOARDS: "social.leaderboards",
  SOCIAL_ACHIEVEMENTS: "social.achievements",
  SOCIAL_REFERRALS: "social.referrals",

  // Limits
  LIMITS_DAILY_DEPOSIT: "limits.dailyDepositLimit",
  LIMITS_DAILY_WITHDRAWAL: "limits.dailyWithdrawalLimit",
  LIMITS_SESSION_TIME: "limits.sessionTimeLimit",
  LIMITS_MAX_SESSIONS: "limits.maxConcurrentSessions",
} as const
