import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { SupportedLanguage } from "../lib/i18n"
import { setLanguage, isRTL } from "../lib/i18n"

export interface LanguageState {
  // Current language
  currentLanguage: SupportedLanguage

  // RTL state
  isRTL: boolean

  // Actions
  setCurrentLanguage: (language: SupportedLanguage) => void
  toggleLanguage: () => void
  initializeLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentLanguage: "en",
      isRTL: false,

      // Set current language and update i18n
      setCurrentLanguage: (language: SupportedLanguage) => {
        set({
          currentLanguage: language,
          isRTL: isRTL(language),
        })

        // Update i18n instance
        setLanguage(language)

        // Update document direction for web
        if (typeof document !== "undefined") {
          document.documentElement.dir = isRTL(language) ? "rtl" : "ltr"
          document.documentElement.lang = language
        }
      },

      // Toggle between languages (for quick testing)
      toggleLanguage: () => {
        const { currentLanguage } = get()
        const languages: SupportedLanguage[] = ["en", "ar", "es"]
        const currentIndex = languages.indexOf(currentLanguage)
        const nextIndex = (currentIndex + 1) % languages.length
        const nextLanguage = languages[nextIndex]

        get().setCurrentLanguage(nextLanguage)
      },

      // Initialize language on app start
      initializeLanguage: () => {
        const { currentLanguage } = get()

        // Set initial language in i18n
        setLanguage(currentLanguage)

        // Set initial document direction
        if (typeof document !== "undefined") {
          document.documentElement.dir = isRTL(currentLanguage) ? "rtl" : "ltr"
          document.documentElement.lang = currentLanguage
        }
      },
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentLanguage: state.currentLanguage,
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize language after rehydration
        if (state) {
          state.initializeLanguage()
        }
      },
    },
  ),
)
