// Core types for the casino platform
export interface GameConfig {
  id: string
  name: string
  type: "slot" | "roulette" | "blackjack" | "crash"
  minBet: number
  maxBet: number
  enabled: boolean
}

export interface BetRequest {
  gameId: string
  betSize: number
  currency: string
}

export interface GameResult {
  winAmount: number
  outcomeRNGSeed: string
  gameData?: any
}

export interface WalletBalance {
  amount: number
  currency: string
}

export interface FeatureFlags {
  [key: string]: boolean
}
