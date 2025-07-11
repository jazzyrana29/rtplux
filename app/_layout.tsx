'use client';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PostHogProvider } from '../contexts/PostHogProvider';
import { FeatureFlagProvider } from '@/components/FeatureFlagProvider';
import { initializeSentry, testSentryIntegration } from '../lib/sentry';
import { useEffect } from 'react';
import '../global.css';
import { useLanguageStore } from '../stores/languageStore';
import '../lib/i18n'; // Initialize i18n

export default function RootLayout() {
  useEffect(() => {
    // Initialize i18n and language store
    try {
      useLanguageStore.getState().initializeLanguage();
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
    }

    // Initialize Sentry as early as possible with error handling
    try {
      const success = initializeSentry();

      if (success) {
        // Test Sentry integration after successful initialization
        setTimeout(() => {
          testSentryIntegration();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to initialize Sentry in layout:', error);
      // Continue app initialization even if Sentry fails
    }
  }, []);

  return (
    <FeatureFlagProvider>
      <PostHogProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a1a2e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Casino Platform' }} />
          <Stack.Screen name="games" options={{ title: 'Games' }} />
        </Stack>
        <StatusBar style="light" />
      </PostHogProvider>
    </FeatureFlagProvider>
  );
}
