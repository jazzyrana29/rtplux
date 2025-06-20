"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type PostHog from "posthog-react-native"
import { initializePostHog } from "../lib/posthog"

interface PostHogContextType {
  posthog: PostHog | null
  isInitialized: boolean
}

const PostHogContext = createContext<PostHogContextType>({
  posthog: null,
  isInitialized: false,
})

export const usePostHog = () => {
  const context = useContext(PostHogContext)
  if (!context) {
    throw new Error("usePostHog must be used within a PostHogProvider")
  }
  return context
}

interface PostHogProviderProps {
  children: React.ReactNode
}

export const PostHogProvider: React.FC<PostHogProviderProps> = ({ children }) => {
  const [posthog, setPostHog] = useState<PostHog | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        const instance = await initializePostHog()
        setPostHog(instance)
        setIsInitialized(true)

        // Track app launch
        instance.capture("app_launched", {
          platform: "expo",
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Failed to initialize PostHog:", error)
        setIsInitialized(true) // Set to true even on error to prevent infinite loading
      }
    }

    initialize()
  }, [])

  return <PostHogContext.Provider value={{ posthog, isInitialized }}>{children}</PostHogContext.Provider>
}
