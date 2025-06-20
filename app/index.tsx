'use client';

import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { usePostHog } from '../contexts/PostHogProvider';
import { trackEvent } from '../lib/posthog';

export default function HomeScreen() {
  const { posthog, isInitialized } = usePostHog();

  useEffect(() => {
    if (isInitialized && posthog) {
      // Track screen view
      posthog.capture('screen_view', {
        screen_name: 'home',
        timestamp: new Date().toISOString(),
      });
    }
  }, [isInitialized, posthog]);

  const handleEnterGames = () => {
    trackEvent('navigation', {
      from: 'home',
      to: 'games',
      action: 'enter_games_clicked',
    });
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
          className="bg-casino-gold text-casino-primary font-bold py-3 px-6 rounded-lg shadow-lg"
          onPress={handleEnterGames}
        >
          <Text className="text-casino-primary font-bold text-lg">
            Enter Games
          </Text>
        </Pressable>
      </Link>

      <View className="mt-8 bg-casino-secondary rounded-xl p-4 shadow-xl border border-casino-accent">
        <Text className="text-white text-center">
          🚧 Development Phase 0 - Foundation Setup
        </Text>
      </View>
    </View>
  );
}
