"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useFeatureFlagsStore } from "../stores/featureFlagsStore"
import type { PartnerConfig } from "../types/featureFlags"
import { LoadingSpinner } from "./AnimatedComponents"
import { AnimatedText, AnimatedView } from "./AnimatedComponents"

interface FeatureFlagContextType {
  config: PartnerConfig | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  config: null,
  isLoading: false,
  isInitialized: false,
  error: null,
})

export const useFeatureFlagContext = () => {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error("useFeatureFlagContext must be used within a FeatureFlagProvider")
  }
  return context
}

interface FeatureFlagProviderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  partnerId?: string
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children, fallback, partnerId }) => {
  const [isReady, setIsReady] = useState(false)
  const { config, isLoading, isInitialized, error, loadPartnerConfig } = useFeatureFlagsStore()

  useEffect(() => {
    const initializeFeatureFlags = async () => {
      if (!isInitialized && !isLoading) {
        await loadPartnerConfig(partnerId)
      }
      setIsReady(true)
    }

    initializeFeatureFlags()
  }, [isInitialized, isLoading, loadPartnerConfig, partnerId])

  // Show loading state
  if (!isReady || isLoading) {
    return (
      fallback || (
        <AnimatedView className="flex-1 bg-casino-primary justify-center items-center">
          <LoadingSpinner size={60} color="#ffd700" />
          <AnimatedText className="text-white mt-4 text-lg">Loading partner configuration...</AnimatedText>
        </AnimatedView>
      )
    )
  }

  // Show error state
  if (error) {
    return (
      <AnimatedView className="flex-1 bg-casino-primary justify-center items-center p-4">
        <AnimatedText className="text-red-400 text-xl font-bold mb-4">Configuration Error</AnimatedText>
        <AnimatedText className="text-white text-center mb-4">{error}</AnimatedText>
        <AnimatedText className="text-gray-400 text-sm text-center">
          Please check your partner configuration or try again later.
        </AnimatedText>
      </AnimatedView>
    )
  }

  return (
    <FeatureFlagContext.Provider
      value={{
        config,
        isLoading,
        isInitialized,
        error,
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  )
}
