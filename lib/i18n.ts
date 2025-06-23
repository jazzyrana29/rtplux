import { useLanguageStore } from "../stores/languageStore"

export type Language = "en" | "es" | "ar"

export const SUPPORTED_LANGUAGES: Language[] = ["en", "es", "ar"]

export const LANGUAGE_NAMES = {
  en: "English",
  es: "Español",
  ar: "العربية",
} as const

// Language detection utility
export const detectLanguage = (): Language => {
  if (typeof window !== "undefined") {
    const browserLang = navigator.language.split("-")[0] as Language
    return SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : "en"
  }
  return "en"
}

// Translation hook
export const useTranslation = () => {
  const { currentLanguage, translations, setLanguage } = useLanguageStore()

  const t = (key: string, screen?: string): string => {
    try {
      const keys = key.split(".")
      let value: any = screen ? translations[screen] : translations

      for (const k of keys) {
        value = value?.[k]
      }

      return value || key
    } catch (error) {
      console.warn(`Translation key not found: ${key}`)
      return key
    }
  }

  const changeLanguage = (language: Language) => {
    setLanguage(language)
  }

  return {
    t,
    currentLanguage,
    changeLanguage,
    isRTL: currentLanguage === "ar",
  }
}

// RTL support utility
export const getTextDirection = (language: Language): "ltr" | "rtl" => {
  return language === "ar" ? "rtl" : "ltr"
}

export const getFlexDirection = (language: Language, defaultDirection: "row" | "column" = "row") => {
  if (language === "ar" && defaultDirection === "row") {
    return "row-reverse"
  }
  return defaultDirection
}
