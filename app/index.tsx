'use client';

import { useEffect } from 'react';
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

function HomeScreenContent() {
  const { posthog, isInitialized } = usePostHog();

  useEffect(() => {
    try {
      // Track screen view in Sentry
      trackUserAction('screen_view', { screen_name: 'home' });

      if (isInitialized && posthog) {
        // Track screen view in PostHog
        posthog.capture('screen_view', {
          screen_name: 'home',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      trackError(error as Error, { screen: 'home', action: 'screen_view' });
    }
  }, [isInitialized, posthog]);

  const handleEnterGames = () => {
    try {
      trackUserAction('navigation_click', {
        from: 'home',
        to: 'games',
        action: 'enter_games_clicked',
      });

      trackEvent('navigation', {
        from: 'home',
        to: 'games',
        action: 'enter_games_clicked',
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

  if (!isInitialized) {
    return (
      <AnimatedView
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 bg-casino-primary justify-center items-center"
      >
        <LoadingSpinner size={60} />
        <AnimatedText className="text-white mt-4 text-lg">
          Loading Casino...
        </AnimatedText>
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
    >
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
      >
        {/* Main Title with Typewriter Effect */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <PulsingElement>
            <AnimatedText className="text-6xl font-bold text-casino-gold mb-4 text-center">
              🎰 RTPLUX
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
            text="Real-Time Premium Luxury Casino Experience"
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
              🎮 Enter Games
            </AnimatedButton>
          </Link>
        </motion.div>

        {/* Test Button */}
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
            🧪 Test Sentry
          </AnimatedButton>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.6, type: 'spring', stiffness: 150 }}
          className="bg-casino-secondary rounded-xl p-6 shadow-xl border border-casino-accent max-w-sm"
        >
          <AnimatedText className="text-white text-center font-semibold mb-2">
            🚧 Development Phase 0
          </AnimatedText>
          <AnimatedText className="text-white text-center mb-3">
            Foundation Setup
          </AnimatedText>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '75%' }}
            transition={{ delay: 2, duration: 1.5 }}
            className="bg-casino-gold h-2 rounded-full mb-3"
          />
          <AnimatedText className="text-gray-300 text-center text-sm">
            Click "Test Sentry" to verify error tracking
          </AnimatedText>
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
      </AnimatedView>
    </AnimatedView>
  );
}

export default HomeScreenContent;
