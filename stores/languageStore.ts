import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Language } from '../lib/i18n';
import i18n, { SUPPORTED_LANGUAGES } from '../lib/i18n'; // Declare or import SUPPORTED_LANGUAGES

export interface LanguageState {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  initializeLanguage: () => void;
  isInitialized: boolean;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      currentLanguage: 'en',
      isInitialized: false,

      setLanguage: (language: Language) => {
        set({ currentLanguage: language });
        i18n.changeLanguage(language).then((r) => console.log(r));
      },

      initializeLanguage: () => {
        const { currentLanguage, isInitialized } = get();

        if (!isInitialized) {
          // Initialize i18n with stored language or detected language
          const storedLang = localStorage.getItem('i18nextLng') as Language;
          const langToUse =
            storedLang && SUPPORTED_LANGUAGES.includes(storedLang)
              ? storedLang
              : currentLanguage;

          i18n.changeLanguage(langToUse).then(() => {
            set({
              currentLanguage: langToUse,
              isInitialized: true,
            });
          });
        }
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentLanguage: state.currentLanguage,
      }),
    }
  )
);
