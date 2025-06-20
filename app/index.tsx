'use client';

import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { usePostHog } from '../contexts/PostHogProvider';
import { trackEvent } from '../lib/posthog';
import {
  captureMessage,
  testSentryError,
  testSentryGameError,
  trackError,
  trackUserAction,
} from '../lib/sentry';

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

  return (
    <View className="flex-1 bg-casino-primary justify-center items-center p-4">
      <Text className="text-4xl font-bold text-casino-gold mb-8 text-center">
        🎰 RTPLUX
      </Text>

      <Text className="text-lg text-gray-300 mb-8 text-center">
        Real-Time Premium Luxury Casino Experience
      </Text>

      <Link href="/games" asChild>
        <Pressable
          className="bg-casino-gold text-casino-primary font-bold py-3 px-6 rounded-lg shadow-lg mb-4"
          onPress={handleEnterGames}
        >
          <Text className="text-casino-primary font-bold text-lg">
            Enter Games
          </Text>
        </Pressable>
      </Link>

      {/* Test Sentry Button */}
      <Pressable
        className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg mb-4"
        onPress={handleTestSentry}
      >
        <Text className="text-white font-bold text-sm">🧪 Test Sentry</Text>
      </Pressable>

      <View className="mt-8 bg-casino-secondary rounded-xl p-4 shadow-xl border border-casino-accent">
        <Text className="text-white text-center">
          🚧 Development Phase 0 - Foundation Setup
        </Text>
        <Text className="text-gray-300 text-center text-sm mt-2">
          Click "Test Sentry" to verify error tracking is working
        </Text>
      </View>
    </View>
  );
}

export default HomeScreenContent;
