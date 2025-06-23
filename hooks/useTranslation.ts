'use client';

import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useLanguageStore } from '../stores/languageStore';
import type { Language } from '../lib/i18n';
import { getTextDirection } from '../lib/i18n';
import { useEffect } from 'react';

export const useTranslation = () => {
  const { t, i18n, ready } = useI18nTranslation();
  const { currentLanguage, setLanguage, initializeLanguage, isInitialized } =
    useLanguageStore();

  // Initialize language store on first use
  useEffect(() => {
    if (!isInitialized) {
      initializeLanguage();
    }
  }, [isInitialized, initializeLanguage]);

  const changeLanguage = (language: Language) => {
    setLanguage(language);
    i18n.changeLanguage(language);
  };

  // Template interpolation helper
  const formatMessage = (
    template: string,
    params: Record<string, any>
  ): string => {
    return template.replace(/\$\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  };

  return {
    t,
    currentLanguage: (i18n.language as Language) || currentLanguage,
    changeLanguage,
    isRTL:
      getTextDirection((i18n.language as Language) || currentLanguage) ===
      'rtl',
    formatMessage,
    isReady: ready && isInitialized,
  };
};
