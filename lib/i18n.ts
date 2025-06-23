import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// Import translation resources directly
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';
import arTranslations from '../locales/ar.json';

export type Language = 'en' | 'es' | 'ar';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'es', 'ar'];

export const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Español',
  ar: 'العربية',
} as const;

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,

    // Add resources directly instead of dynamic loading
    resources: {
      en: {
        translation: enTranslations,
      },
      es: {
        translation: esTranslations,
      },
      ar: {
        translation: arTranslations,
      },
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense for React Native compatibility
    },

    // Namespace configuration
    ns: ['translation'],
    defaultNS: 'translation',

    // Debug in development
    debug: process.env.NODE_ENV === 'development',
  });

// Language detection utility
export const detectLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const browserLang = navigator.language.split('-')[0] as Language;
    return SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : 'en';
  }
  return 'en';
};

// RTL support utility
export const getTextDirection = (language: Language): 'ltr' | 'rtl' => {
  return language === 'ar' ? 'rtl' : 'ltr';
};

export const getFlexDirection = (
  language: Language,
  defaultDirection: 'row' | 'column' = 'row'
) => {
  if (language === 'ar' && defaultDirection === 'row') {
    return 'row-reverse';
  }
  return defaultDirection;
};

export default i18n;
