"use client"

import type React from "react"
import { useEffect } from "react"
import { useLanguageStore } from "../stores/languageStore"

interface RTLProviderProps {
  children: React.ReactNode
}

export const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  const { isRTL, currentLanguage, initializeLanguage } = useLanguageStore()

  useEffect(() => {
    // Initialize language on mount
    initializeLanguage()
  }, [initializeLanguage])

  useEffect(() => {
    // Update document direction and language
    if (typeof document !== "undefined") {
      document.documentElement.dir = isRTL ? "rtl" : "ltr"
      document.documentElement.lang = currentLanguage

      // Add RTL class to body for additional styling
      if (isRTL) {
        document.body.classList.add("rtl")
      } else {
        document.body.classList.remove("rtl")
      }
    }
  }, [isRTL, currentLanguage])

  return (
    <div
      className={`${isRTL ? "rtl" : "ltr"}`}
      style={{
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      {children}
    </div>
  )
}
