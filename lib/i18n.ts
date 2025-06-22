"use client"

import { I18n } from "i18n-js"

// Define supported languages
export const SUPPORTED_LANGUAGES = {
  en: "English",
  ar: "العربية",
  es: "Español",
} as const

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES

// Check if language is RTL
export const isRTL = (language: SupportedLanguage): boolean => {
  return language === "ar"
}

// Translation keys interface for type safety
export interface TranslationKeys {
  // Common
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    confirm: string
    close: string
    save: string
    back: string
    next: string
    previous: string
    yes: string
    no: string
    ok: string
  }

  // Home Screen
  home: {
    title: string
    subtitle: string
    enterGames: string
    testSentry: string
    developmentPhase: string
    foundationSetup: string
    testSentryDescription: string
    selectLanguage: string
  }

  // Games
  games: {
    title: string
    library: string
    comingSoon: string
    moreGamesComingSoon: string
    developmentProgress: string
    playNow: string
    phase2: string
    phase5: string
    roulette: {
      title: string
      description: string
    }
    slots: {
      title: string
      description: string
    }
    blackjack: {
      title: string
      description: string
    }
    crash: {
      title: string
      description: string
    }
  }

  // Roulette Game
  roulette: {
    title: string
    howToPlay: string
    loading: string
    resizeHint: string
    basicControls: string
    bettingOptions: string
    controls: {
      buyChips: string
      selectChip: string
      placeBets: string
      clickSpin: string
    }
    betting: {
      singleNumbers: string
      redBlack: string
      evenOdd: string
      dozens: string
      columns: string
      highLow: string
    }
    ui: {
      balance: string
      buyChips: string
      withdraw: string
      resetBets: string
      info: string
      spin: string
      confirm: string
      cancel: string
      total: string
    }
    messages: {
      noChipsLeft: string
      placeBet: string
      hit: string
      noHits: string
      number: string
      color: string
      resetBets: string
      chipsReturned: string
      withdrew: string
      noChipsToWithdraw: string
      purchaseFailed: string
      withdrawalFailed: string
      insufficientFunds: string
    }
    colors: {
      red: string
      black: string
      green: string
    }
    betTypes: {
      straight: string
      red: string
      black: string
      even: string
      odd: string
      low: string
      high: string
      dozen1: string
      dozen2: string
      dozen3: string
      column1: string
      column2: string
      column3: string
    }
  }

  // Language Selection
  language: {
    select: string
    current: string
    english: string
    arabic: string
    spanish: string
    changed: string
  }
}

// English translations
const en: TranslationKeys = {
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    save: "Save",
    back: "Back",
    next: "Next",
    previous: "Previous",
    yes: "Yes",
    no: "No",
    ok: "OK",
  },
  home: {
    title: "RTPLUX",
    subtitle: "Real-Time Premium Luxury Casino Experience",
    enterGames: "🎮 Enter Games",
    testSentry: "🧪 Test Sentry",
    developmentPhase: "🚧 Development Phase 0",
    foundationSetup: "Foundation Setup",
    testSentryDescription: 'Click "Test Sentry" to verify error tracking',
    selectLanguage: "🌐 Language",
  },
  games: {
    title: "Game Library",
    library: "🎮 Game Library",
    comingSoon: "Coming Soon",
    moreGamesComingSoon: "🚀 More Games Coming Soon!",
    developmentProgress: "Development Progress",
    playNow: "Play Now",
    phase2: "Coming Soon - Phase 2",
    phase5: "Coming Soon - Phase 5",
    roulette: {
      title: "🎯 Roulette",
      description: "Classic European Roulette with smooth animations",
    },
    slots: {
      title: "🎰 Slot Machine",
      description: "Multi-line slots with bonus rounds",
    },
    blackjack: {
      title: "🃏 Blackjack",
      description: "Classic 21 with side bets",
    },
    crash: {
      title: "📈 Crash",
      description: "High-stakes multiplier game",
    },
  },
  roulette: {
    title: "🎰 Roulette Royale",
    howToPlay: "📖 How to Play",
    loading: "Loading Roulette Table...",
    resizeHint: "✨ Resize your window to see the adaptive layout",
    basicControls: "🎮 Basic Controls:",
    bettingOptions: "💰 Betting Options:",
    controls: {
      buyChips: 'Click "Buy chips" to purchase betting chips',
      selectChip: "Select chip denomination at the bottom",
      placeBets: "Click on betting areas to place chips",
      clickSpin: "Click SPIN to start the round",
    },
    betting: {
      singleNumbers: "Single Numbers (35:1 payout)",
      redBlack: "Red/Black, Even/Odd (1:1 payout)",
      evenOdd: "Even/Odd (1:1 payout)",
      dozens: "Dozens, Columns (2:1 payout)",
      columns: "Columns (2:1 payout)",
      highLow: "High/Low (1:1 payout)",
    },
    ui: {
      balance: "Balance",
      buyChips: "Buy chips",
      withdraw: "Withdraw",
      resetBets: "Reset Bets",
      info: "Info",
      spin: "SPIN",
      confirm: "Confirm",
      cancel: "Cancel",
      total: "Total",
    },
    messages: {
      noChipsLeft: "No chips left!",
      placeBet: "Place at least one bet!",
      hit: "Hit! Won",
      noHits: "No hits - Number:",
      number: "Number",
      color: "Color",
      resetBets: "Reset bets - chips returned",
      chipsReturned: "chips returned",
      withdrew: "Withdrew",
      noChipsToWithdraw: "No chips to withdraw.",
      purchaseFailed: "Purchase failed",
      withdrawalFailed: "Withdrawal failed",
      insufficientFunds: "Insufficient funds",
    },
    colors: {
      red: "RED",
      black: "BLACK",
      green: "GREEN",
    },
    betTypes: {
      straight: "Straight",
      red: "RED",
      black: "BLACK",
      even: "EVEN",
      odd: "ODD",
      low: "1-18",
      high: "19-36",
      dozen1: "1st 12",
      dozen2: "2nd 12",
      dozen3: "3rd 12",
      column1: "2:1",
      column2: "2:1",
      column3: "2:1",
    },
  },
  language: {
    select: "Select Language",
    current: "Current Language",
    english: "English",
    arabic: "Arabic",
    spanish: "Spanish",
    changed: "Language changed successfully",
  },
}

// Arabic translations (RTL)
const ar: TranslationKeys = {
  common: {
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجح",
    cancel: "إلغاء",
    confirm: "تأكيد",
    close: "إغلاق",
    save: "حفظ",
    back: "رجوع",
    next: "التالي",
    previous: "السابق",
    yes: "نعم",
    no: "لا",
    ok: "موافق",
  },
  home: {
    title: "آر تي بي لوكس",
    subtitle: "تجربة كازينو فاخرة في الوقت الفعلي",
    enterGames: "🎮 دخول الألعاب",
    testSentry: "🧪 اختبار سنتري",
    developmentPhase: "🚧 مرحلة التطوير 0",
    foundationSetup: "إعداد الأساس",
    testSentryDescription: 'انقر على "اختبار سنتري" للتحقق من تتبع الأخطاء',
    selectLanguage: "🌐 اللغة",
  },
  games: {
    title: "مكتبة الألعاب",
    library: "🎮 مكتبة الألعاب",
    comingSoon: "قريباً",
    moreGamesComingSoon: "🚀 المزيد من الألعاب قريباً!",
    developmentProgress: "تقدم التطوير",
    playNow: "العب الآن",
    phase2: "قريباً - المرحلة 2",
    phase5: "قريباً - المرحلة 5",
    roulette: {
      title: "🎯 الروليت",
      description: "ر��ليت أوروبي كلاسيكي مع رسوم متحركة سلسة",
    },
    slots: {
      title: "🎰 ماكينة القمار",
      description: "ماكينات قمار متعددة الخطوط مع جولات مكافآت",
    },
    blackjack: {
      title: "🃏 بلاك جاك",
      description: "21 كلاسيكية مع رهانات جانبية",
    },
    crash: {
      title: "📈 كراش",
      description: "لعبة مضاعف عالية المخاطر",
    },
  },
  roulette: {
    title: "🎰 روليت رويال",
    howToPlay: "📖 كيفية اللعب",
    loading: "جاري تحميل طاولة الروليت...",
    resizeHint: "✨ قم بتغيير حجم النافذة لرؤية التخطيط التكيفي",
    basicControls: "🎮 التحكم الأساسي:",
    bettingOptions: "💰 خيارات الرهان:",
    controls: {
      buyChips: 'انقر على "شراء رقائق" لشراء رقائق الرهان',
      selectChip: "اختر فئة الرقاقة في الأسفل",
      placeBets: "انقر على مناطق الرهان لوضع الرقائق",
      clickSpin: "انقر على دوران لبدء الجولة",
    },
    betting: {
      singleNumbers: "أرقام مفردة (دفع 35:1)",
      redBlack: "أحمر/أسود، زوجي/فردي (دفع 1:1)",
      evenOdd: "زوجي/فردي (دفع 1:1)",
      dozens: "عشرات، أعمدة (دفع 2:1)",
      columns: "أعمدة (دفع 2:1)",
      highLow: "عالي/منخفض (دفع 1:1)",
    },
    ui: {
      balance: "الرصيد",
      buyChips: "شراء رقائق",
      withdraw: "سحب",
      resetBets: "إعادة تعيين الرهانات",
      info: "معلومات",
      spin: "دوران",
      confirm: "تأكيد",
      cancel: "إلغاء",
      total: "المجموع",
    },
    messages: {
      noChipsLeft: "لا توجد رقائق متبقية!",
      placeBet: "ضع رهاناً واحداً على الأقل!",
      hit: "فوز! ربحت",
      noHits: "لا توجد إصابات - الرقم:",
      number: "الرقم",
      color: "اللون",
      resetBets: "إعادة تعيين الرهانات - تم إرجاع الرقائق",
      chipsReturned: "تم إرجاع الرقائق",
      withdrew: "تم السحب",
      noChipsToWithdraw: "لا توجد رقائق للسحب.",
      purchaseFailed: "فشل الشراء",
      withdrawalFailed: "فشل السحب",
      insufficientFunds: "أموال غير كافية",
    },
    colors: {
      red: "أحمر",
      black: "أسود",
      green: "أخضر",
    },
    betTypes: {
      straight: "مباشر",
      red: "أحمر",
      black: "أسود",
      even: "زوجي",
      odd: "فردي",
      low: "1-18",
      high: "19-36",
      dozen1: "الـ12 الأولى",
      dozen2: "الـ12 الثانية",
      dozen3: "الـ12 الثالثة",
      column1: "2:1",
      column2: "2:1",
      column3: "2:1",
    },
  },
  language: {
    select: "اختر اللغة",
    current: "اللغة الحالية",
    english: "الإنجليزية",
    arabic: "العربية",
    spanish: "الإسبانية",
    changed: "تم تغيير اللغة بنجاح",
  },
}

// Spanish translations
const es: TranslationKeys = {
  common: {
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    cancel: "Cancelar",
    confirm: "Confirmar",
    close: "Cerrar",
    save: "Guardar",
    back: "Atrás",
    next: "Siguiente",
    previous: "Anterior",
    yes: "Sí",
    no: "No",
    ok: "OK",
  },
  home: {
    title: "RTPLUX",
    subtitle: "Experiencia de Casino de Lujo Premium en Tiempo Real",
    enterGames: "🎮 Entrar a Juegos",
    testSentry: "🧪 Probar Sentry",
    developmentPhase: "🚧 Fase de Desarrollo 0",
    foundationSetup: "Configuración Base",
    testSentryDescription: 'Haz clic en "Probar Sentry" para verificar el seguimiento de errores',
    selectLanguage: "🌐 Idioma",
  },
  games: {
    title: "Biblioteca de Juegos",
    library: "🎮 Biblioteca de Juegos",
    comingSoon: "Próximamente",
    moreGamesComingSoon: "🚀 ¡Más Juegos Próximamente!",
    developmentProgress: "Progreso de Desarrollo",
    playNow: "Jugar Ahora",
    phase2: "Próximamente - Fase 2",
    phase5: "Próximamente - Fase 5",
    roulette: {
      title: "🎯 Ruleta",
      description: "Ruleta Europea clásica con animaciones suaves",
    },
    slots: {
      title: "🎰 Máquina Tragamonedas",
      description: "Tragamonedas multi-línea con rondas de bonificación",
    },
    blackjack: {
      title: "🃏 Blackjack",
      description: "21 clásico con apuestas laterales",
    },
    crash: {
      title: "📈 Crash",
      description: "Juego multiplicador de alto riesgo",
    },
  },
  roulette: {
    title: "🎰 Ruleta Real",
    howToPlay: "📖 Cómo Jugar",
    loading: "Cargando Mesa de Ruleta...",
    resizeHint: "✨ Redimensiona tu ventana para ver el diseño adaptativo",
    basicControls: "🎮 Controles Básicos:",
    bettingOptions: "💰 Opciones de Apuesta:",
    controls: {
      buyChips: 'Haz clic en "Comprar fichas" para comprar fichas de apuesta',
      selectChip: "Selecciona la denominación de ficha en la parte inferior",
      placeBets: "Haz clic en las áreas de apuesta para colocar fichas",
      clickSpin: "Haz clic en GIRAR para comenzar la ronda",
    },
    betting: {
      singleNumbers: "Números Individuales (pago 35:1)",
      redBlack: "Rojo/Negro, Par/Impar (pago 1:1)",
      evenOdd: "Par/Impar (pago 1:1)",
      dozens: "Docenas, Columnas (pago 2:1)",
      columns: "Columnas (pago 2:1)",
      highLow: "Alto/Bajo (pago 1:1)",
    },
    ui: {
      balance: "Saldo",
      buyChips: "Comprar fichas",
      withdraw: "Retirar",
      resetBets: "Reiniciar Apuestas",
      info: "Info",
      spin: "GIRAR",
      confirm: "Confirmar",
      cancel: "Cancelar",
      total: "Total",
    },
    messages: {
      noChipsLeft: "¡No quedan fichas!",
      placeBet: "¡Coloca al menos una apuesta!",
      hit: "¡Acierto! Ganaste",
      noHits: "Sin aciertos - Número:",
      number: "Número",
      color: "Color",
      resetBets: "Reiniciar apuestas - fichas devueltas",
      chipsReturned: "fichas devueltas",
      withdrew: "Retirado",
      noChipsToWithdraw: "No hay fichas para retirar.",
      purchaseFailed: "Compra fallida",
      withdrawalFailed: "Retiro fallido",
      insufficientFunds: "Fondos insuficientes",
    },
    colors: {
      red: "ROJO",
      black: "NEGRO",
      green: "VERDE",
    },
    betTypes: {
      straight: "Directo",
      red: "ROJO",
      black: "NEGRO",
      even: "PAR",
      odd: "IMPAR",
      low: "1-18",
      high: "19-36",
      dozen1: "1er 12",
      dozen2: "2do 12",
      dozen3: "3er 12",
      column1: "2:1",
      column2: "2:1",
      column3: "2:1",
    },
  },
  language: {
    select: "Seleccionar Idioma",
    current: "Idioma Actual",
    english: "Inglés",
    arabic: "Árabe",
    spanish: "Español",
    changed: "Idioma cambiado exitosamente",
  },
}

// Create i18n instance
export const i18n = new I18n({
  en,
  ar,
  es,
})

// Set default language
i18n.defaultLocale = "en"
i18n.locale = "en"

// Enable fallbacks
i18n.enableFallback = true

// Translation helper function with type safety
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options)
}

// Get nested translation with dot notation
export const getNestedTranslation = (keys: string[], language?: SupportedLanguage): string => {
  const currentLocale = language || (i18n.locale as SupportedLanguage)
  const translations = i18n.translations[currentLocale] as any

  let result = translations
  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) {
      return keys.join(".")
    }
  }

  return result || keys.join(".")
}

// Set language and update i18n
export const setLanguage = (language: SupportedLanguage): void => {
  i18n.locale = language
}

// Get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.locale as SupportedLanguage
}

// Get language display name
export const getLanguageDisplayName = (language: SupportedLanguage): string => {
  return SUPPORTED_LANGUAGES[language]
}
