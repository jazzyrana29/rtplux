import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Language } from "../lib/i18n"
import { detectLanguage } from "../lib/i18n"

// Import translation files
import enTranslations from "../locales/en.json"
import esTranslations from "../locales/es.json"
import arTranslations from "../locales/ar.json"

const translations = {
  en: enTranslations,
  es: esTranslations,
  ar: arTranslations,
}

export interface LanguageState {
  currentLanguage: Language
  translations: typeof enTranslations
  setLanguage: (language: Language) => void
  initializeLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      currentLanguage: "en",
      translations: enTranslations,

      setLanguage: (language: Language) => {
        set({
          currentLanguage: language,
          translations: translations[language],
        })
      },

      initializeLanguage: () => {
        const { currentLanguage } = get()
        if (!currentLanguage) {
          const detectedLanguage = detectLanguage()
          get().setLanguage(detectedLanguage)
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
        if (state) {
          // Ensure translations are loaded after rehydration
          state.translations = translations[state.currentLanguage]
        }
      },
    },
  ),
)
