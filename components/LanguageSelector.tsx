'use client';

import type React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import {
  getTextDirection,
  type Language,
  LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
} from '../lib/i18n';
import {
  AnimatedButton,
  AnimatedText,
  AnimatedView,
} from './AnimatedComponents';
import { modalVariants, overlayVariants } from '../lib/animations';
import { HOME_CONSTANTS } from '../constants/home';

interface LanguageSelectorProps {
  isVisible: boolean;
  onClose: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  isVisible,
  onClose,
}) => {
  const { t, currentLanguage, changeLanguage, isRTL } = useTranslation();

  const handleLanguageSelect = (language: Language) => {
    changeLanguage(language);
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <AnimatedView
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black bg-opacity-70 z-40"
            onTouchEnd={onClose}
          />

          {/* Modal */}
          <AnimatedView
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-4 bg-casino-secondary rounded-xl border-2 border-casino-gold z-50 p-6"
            style={{
              direction: getTextDirection(currentLanguage),
            }}
          >
            <AnimatedText className="text-2xl font-bold text-casino-gold mb-6 text-center">
              {t(HOME_CONSTANTS.LANGUAGE_SELECTION)}
            </AnimatedText>

            <AnimatedView className="space-y-4">
              {SUPPORTED_LANGUAGES.map((language, index) => (
                <motion.div
                  key={language}
                  initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Pressable
                    onPress={() => handleLanguageSelect(language)}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200
                      ${
                        currentLanguage === language
                          ? 'bg-casino-gold border-casino-gold'
                          : 'bg-casino-primary border-casino-accent hover:border-casino-gold'
                      }
                    `}
                  >
                    <View
                      className={`flex-row items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <Text
                        className={`text-lg font-semibold ${
                          currentLanguage === language
                            ? 'text-casino-primary'
                            : 'text-white'
                        }`}
                        style={{
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                      >
                        {LANGUAGE_NAMES[language]}
                      </Text>

                      {currentLanguage === language && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-casino-primary rounded-full flex items-center justify-center"
                        >
                          <Text className="text-casino-gold text-sm">✓</Text>
                        </motion.div>
                      )}
                    </View>

                    {/* Language code indicator */}
                    <Text
                      className={`text-sm mt-1 ${
                        currentLanguage === language
                          ? 'text-casino-primary opacity-70'
                          : 'text-gray-400'
                      }`}
                      style={{
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                    >
                      {language.toUpperCase()}
                    </Text>
                  </Pressable>
                </motion.div>
              ))}
            </AnimatedView>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <AnimatedButton
                variant="danger"
                onPress={onClose}
                className="w-full"
              >
                {t('common.close')}
              </AnimatedButton>
            </motion.div>
          </AnimatedView>
        </>
      )}
    </AnimatePresence>
  );
};
