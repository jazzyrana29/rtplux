'use client';

import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { motion } from 'framer-motion';
import { usePostHog } from '../contexts/PostHogProvider';
import { trackEvent } from '../lib/posthog';
import {
  captureMessage,
  testSentryError,
  testSentryGameError,
  trackError,
  trackUserAction,
} from '../lib/sentry';
import {
  AnimatedButton,
  AnimatedText,
  AnimatedView,
  FloatingElement,
  LoadingSpinner,
  PulsingElement,
  TypewriterText,
} from '@/components/AnimatedComponents';
import {
  containerVariants,
  pageTransition,
  pageVariants,
} from '../lib/animations';
import { useTranslation } from '../hooks/useTranslation';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { getTextDirection } from '../lib/i18n';
import { HOME_CONSTANTS } from '../constants/home';
import { LanguageSelector } from '@/components/LanguageSelector';
import { FeatureFlagDebugPanel } from '@/components/FeatureFlagDebugPanel';
import { PartnerSwitcher } from '@/components/PartnerSwitcher';

function HomeScreenContent() {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const { posthog, isInitialized } = usePostHog();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const { t, currentLanguage, isRTL, isReady } = useTranslation();
  const {
    config,
    partnerId,
    isFeatureEnabled,
    getBrandingConfig,
    isInitialized: featureFlagsInitialized,
  } = useFeatureFlags();

  // Effects must also be called unconditionally
  useEffect(() => {
    if (!isReady || !isInitialized || !featureFlagsInitialized) return;

    try {
      // Track screen view in Sentry
      trackUserAction('screen_view', {
        screen_name: 'home',
        partner_id: partnerId,
        partner_name: config?.partnerName,
      });

      if (posthog) {
        // Track screen view in PostHog
        posthog.capture('screen_view', {
          screen_name: 'home',
          partner_id: partnerId,
          partner_name: config?.partnerName!,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      trackError(error as Error, { screen: 'home', action: 'screen_view' });
    }
  }, [
    isInitialized,
    posthog,
    isReady,
    featureFlagsInitialized,
    partnerId,
    config,
  ]);

  // Event handlers
  const handleEnterGames = () => {
    try {
      trackUserAction('navigation_click', {
        from: 'home',
        to: 'games',
        action: 'enter_games_clicked',
        partner_id: partnerId,
      });

      trackEvent('navigation', {
        from: 'home',
        to: 'games',
        action: 'enter_games_clicked',
        partner_id: partnerId,
      });
    } catch (error) {
      trackError(error as Error, { action: 'enter_games_click' });
    }
  };

  const handleTestSentry = () => {
    console.log('🧪 Running Sentry tests...');

    // Test different types of Sentry events
    captureMessage('User clicked test Sentry button', 'info');

    setTimeout(() => testSentryError(), 1000);
    setTimeout(() => testSentryGameError(), 2000);
  };

  // Get branding configuration
  const brandingConfig = getBrandingConfig();

  // CONDITIONAL RENDERING ONLY AFTER ALL HOOKS
  if (!isReady || !isInitialized || !featureFlagsInitialized) {
    return (
      <AnimatedView
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 bg-casino-primary justify-center items-center"
      >
        <LoadingSpinner size={60} />
        <AnimatedText className="text-white mt-4 text-lg">
          {!isReady
            ? 'Loading translations...'
            : !featureFlagsInitialized
              ? 'Loading partner configuration...'
              : t(HOME_CONSTANTS.LOADING_CASINO)}
        </AnimatedText>
        {partnerId && (
          <AnimatedText className="text-gray-400 mt-2 text-sm">
            Partner: {partnerId}
          </AnimatedText>
        )}
      </AnimatedView>
    );
  }

  return (
    <AnimatedView
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
      className="flex-1 bg-casino-primary"
      style={{
        backgroundColor: brandingConfig?.secondaryColor || '#1a1a2e',
      }}
    >
      {/* Debug Panel Toggle (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <motion.button
          className="fixed top-4 right-4 z-30 bg-purple-600 text-white px-3 py-1 rounded text-xs"
          onClick={() => setShowDebugPanel(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🚩 Debug
        </motion.button>
      )}

      {/* Partner Switcher (Development only) */}
      <PartnerSwitcher />

      {/* Background decorative elements */}
      <FloatingElement className="absolute top-20 left-10">
        <AnimatedText className="text-6xl opacity-10">🎰</AnimatedText>
      </FloatingElement>

      <FloatingElement className="absolute top-40 right-10">
        <AnimatedText className="text-4xl opacity-10">🎲</AnimatedText>
      </FloatingElement>

      <FloatingElement className="absolute bottom-40 left-20">
        <AnimatedText className="text-5xl opacity-10">🃏</AnimatedText>
      </FloatingElement>

      <AnimatedView
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 justify-center items-center p-4"
        style={{
          direction: getTextDirection(currentLanguage),
        }}
      >
        {/* Partner Branding */}
        {config?.partnerName && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <AnimatedText
              className="text-sm text-gray-400 text-center"
              style={{ color: brandingConfig?.accentColor || '#0f3460' }}
            >
              Powered by {config.partnerName}
            </AnimatedText>
          </motion.div>
        )}

        {/* Main Title with Typewriter Effect */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <PulsingElement>
            <AnimatedText
              className="text-6xl font-bold mb-4 text-center"
              style={{ color: brandingConfig?.primaryColor || '#ffd700' }}
            >
              {t(HOME_CONSTANTS.TITLE)}
            </AnimatedText>
          </PulsingElement>
        </motion.div>

        {/* Subtitle with Typewriter Effect */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <TypewriterText
            text={t(HOME_CONSTANTS.SUBTITLE)}
            delay={800}
            speed={80}
            className="text-lg text-gray-300 mb-8 text-center"
          />
        </motion.div>

        {/* Main Action Button */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
        >
          <Link href="/games" asChild>
            <AnimatedButton
              variant="primary"
              size="lg"
              onPress={handleEnterGames}
              className="mb-6"
            >
              {t(HOME_CONSTANTS.ENTER_GAMES)}
            </AnimatedButton>
          </Link>
        </motion.div>

        {/* Language Selector Button - Only if enabled */}
        {isFeatureEnabled('ui.languageSelector') && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.3, type: 'spring', stiffness: 200 }}
          >
            <AnimatedButton
              variant="secondary"
              size="md"
              onPress={() => setShowLanguageSelector(true)}
              className="mb-4"
            >
              {t(HOME_CONSTANTS.SELECT_LANGUAGE)}
            </AnimatedButton>
          </motion.div>
        )}

        {/* Test Button - Only if analytics enabled */}
        {isFeatureEnabled('analytics.sentry') && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            <AnimatedButton
              variant="danger"
              size="sm"
              onPress={handleTestSentry}
              className="mb-8"
            >
              {t(HOME_CONSTANTS.TEST_SENTRY)}
            </AnimatedButton>
          </motion.div>
        )}

        {/* Status Card */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.6, type: 'spring', stiffness: 150 }}
          className="bg-casino-secondary rounded-xl p-6 shadow-xl border border-casino-accent max-w-sm"
          style={{
            backgroundColor: brandingConfig?.secondaryColor
              ? `${brandingConfig.secondaryColor}dd`
              : '#16213e',
            borderColor: brandingConfig?.accentColor || '#0f3460',
          }}
        >
          <AnimatedText className="text-white text-center font-semibold mb-2">
            {t(HOME_CONSTANTS.DEVELOPMENT_PHASE)}
          </AnimatedText>
          <AnimatedText className="text-white text-center mb-3">
            {t(HOME_CONSTANTS.FOUNDATION_SETUP)}
          </AnimatedText>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '75%' }}
            transition={{ delay: 2, duration: 1.5 }}
            className="h-2 rounded-full mb-3"
            style={{
              backgroundColor: brandingConfig?.primaryColor || '#ffd700',
            }}
          />
          <AnimatedText className="text-gray-300 text-center text-sm">
            {t(HOME_CONSTANTS.TEST_SENTRY_DESCRIPTION)}
          </AnimatedText>

          {/* Partner Info */}
          {partnerId && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <AnimatedText className="text-gray-400 text-center text-xs">
                Partner: {partnerId} | Version: {config?.version}
              </AnimatedText>
            </div>
          )}
        </motion.div>

        {/* Floating Casino Icons */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                rotate: [-5, 5, -5],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 2,
              }}
            >
              <AnimatedText className="text-2xl">
                {['🎯', '💎', '🎪', '⭐', '🎊', '🔥'][i]}
              </AnimatedText>
            </motion.div>
          ))}
        </motion.div>

        {/* Language Selector Modal */}
        <LanguageSelector
          isVisible={showLanguageSelector}
          onClose={() => setShowLanguageSelector(false)}
        />

        {/* Feature Flag Debug Panel */}
        <FeatureFlagDebugPanel
          isVisible={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
        />
      </AnimatedView>
    </AnimatedView>
  );
}

export default HomeScreenContent;
