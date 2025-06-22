"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguageStore } from "../stores/languageStore"
import { SUPPORTED_LANGUAGES, type SupportedLanguage, getLanguageDisplayName, t } from "../lib/i18n"
import { AnimatedView, AnimatedText, AnimatedButton } from "./AnimatedComponents"
import { modalVariants, overlayVariants, containerVariants } from "../lib/animations"

interface LanguageSelectorProps {
  variant?: "button" | "modal" | "dropdown"
  className?: string
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = "button", className = "" }) => {
  const { currentLanguage, isRTL, setCurrentLanguage } = useLanguageStore()
  const [showModal, setShowModal] = useState(false)

  const handleLanguageChange = (language: SupportedLanguage) => {
    setCurrentLanguage(language)
    setShowModal(false)

    // Show success message (you can integrate with toast system)
    console.log(`Language changed to: ${getLanguageDisplayName(language)}`)
  }

  const LanguageButton = ({ language, isSelected }: { language: SupportedLanguage; isSelected: boolean }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => handleLanguageChange(language)}
      className={`
        p-4 rounded-xl border-2 transition-all duration-300
        ${
          isSelected
            ? "border-casino-gold bg-casino-gold bg-opacity-20 text-casino-gold"
            : "border-casino-accent bg-casino-secondary text-white hover:border-casino-gold hover:bg-casino-gold hover:bg-opacity-10"
        }
        ${isRTL ? "text-right" : "text-left"}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-lg">{getLanguageDisplayName(language)}</div>
          <div className="text-sm opacity-70">
            {language === "en" && "English"}
            {language === "ar" && "العربية"}
            {language === "es" && "Español"}
          </div>
        </div>
        <div className="text-2xl ml-3">
          {language === "en" && "🇺🇸"}
          {language === "ar" && "🇸🇦"}
          {language === "es" && "🇪🇸"}
        </div>
      </div>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 bg-casino-gold rounded-full flex items-center justify-center"
        >
          <span className="text-casino-primary text-sm">✓</span>
        </motion.div>
      )}
    </motion.button>
  )

  if (variant === "button") {
    return (
      <>
        <AnimatedButton
          variant="secondary"
          size="sm"
          onPress={() => setShowModal(true)}
          className={`${className} ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <span className="mr-2">🌐</span>
          {getLanguageDisplayName(currentLanguage)}
        </AnimatedButton>

        <AnimatePresence>
          {showModal && (
            <>
              <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-black bg-opacity-70 z-40"
                onClick={() => setShowModal(false)}
              />
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`
                  fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                  bg-casino-secondary rounded-xl border-2 border-casino-gold z-50 p-6 w-96 max-w-[90vw]
                  ${isRTL ? "text-right" : "text-left"}
                `}
              >
                <AnimatedText className="text-2xl font-bold text-casino-gold mb-6 text-center">
                  🌐 {t("language.select")}
                </AnimatedText>

                <AnimatedView variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                  {Object.keys(SUPPORTED_LANGUAGES).map((lang, index) => (
                    <motion.div
                      key={lang}
                      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      <LanguageButton language={lang as SupportedLanguage} isSelected={currentLanguage === lang} />
                    </motion.div>
                  ))}
                </AnimatedView>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6"
                >
                  <AnimatedButton variant="danger" onPress={() => setShowModal(false)} className="w-full">
                    {t("common.close")}
                  </AnimatedButton>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  return null
}

// Quick language toggle for development
export const LanguageToggle: React.FC = () => {
  const { toggleLanguage, currentLanguage } = useLanguageStore()

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 bg-casino-gold text-casino-primary p-2 rounded-full shadow-lg"
    >
      <span className="text-sm font-bold">{currentLanguage.toUpperCase()}</span>
    </motion.button>
  )
}
