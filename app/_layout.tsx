'use client';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PostHogProvider } from '../contexts/PostHogProvider';
import { RTLProvider } from '../components/RTLProvider';
import { initializeSentry, testSentryIntegration } from '../lib/sentry';
import { useEffect } from 'react';
import '../global.css';

export default function RootLayout() {
  useEffect(() => {
    try {
      const success = initializeSentry();

      if (success) {
        setTimeout(() => {
          testSentryIntegration();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to initialize Sentry in layout:', error);
    }
  }, []);

  return (
    <RTLProvider>
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
    </RTLProvider>
  );
}
