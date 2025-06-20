import PostHog from 'posthog-react-native';
import { POSTHOG_API_KEY, POSTHOG_HOST } from '@env';
import { __DEV__ } from './utils';

let posthogInstance: PostHog | null = null;

export const initializePostHog = async (): Promise<PostHog> => {
  if (posthogInstance) {
    return posthogInstance;
  }

  if (!POSTHOG_API_KEY || !POSTHOG_HOST) {
    console.warn('PostHog API key or host not found in environment variables');
    // Return a mock instance for development
    return {
      capture: () => {},
      identify: () => {},
      alias: () => {},
      reset: () => {},
      isFeatureEnabled: () => false,
      getFeatureFlag: () => undefined,
      reloadFeatureFlags: () => {},
      group: () => {},
      register: () => {},
      unregister: () => {},
      getDistinctId: () => 'unknown',
      flush: () => Promise.resolve(),
      shutdown: () => Promise.resolve(),
    } as any;
  }

  try {
    posthogInstance = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      // Flush events more frequently in development
      flushAt: __DEV__ ? 1 : 20,
      flushInterval: __DEV__ ? 1000 : 30000,
      // Enable/disable based on development mode
      disabled: false,
    });

    // Enable debug logging in development
    if (__DEV__) {
      console.log('PostHog initialized in development mode');
    }

    console.log('PostHog initialized successfully');
    return posthogInstance;
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
    // Return mock instance on error
    return {
      capture: () => {},
      identify: () => {},
      alias: () => {},
      reset: () => {},
      isFeatureEnabled: () => false,
      getFeatureFlag: () => undefined,
      reloadFeatureFlags: () => {},
      group: () => {},
      register: () => {},
      unregister: () => {},
      getDistinctId: () => 'unknown',
      flush: () => Promise.resolve(),
      shutdown: () => Promise.resolve(),
    } as any;
  }
};

export const getPostHog = (): PostHog | null => {
  return posthogInstance;
};

// Analytics helper functions with debug logging
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  const posthog = getPostHog();
  if (posthog) {
    if (__DEV__) {
      console.log(`[PostHog] Tracking event: ${eventName}`, properties);
    }
    posthog.capture(eventName, properties);
  }
};

export const identifyUser = (
  userId: string,
  properties?: Record<string, any>
) => {
  const posthog = getPostHog();
  if (posthog) {
    if (__DEV__) {
      console.log(`[PostHog] Identifying user: ${userId}`, properties);
    }
    posthog.identify(userId, properties);
  }
};

export const resetUser = () => {
  const posthog = getPostHog();
  if (posthog) {
    if (__DEV__) {
      console.log('[PostHog] Resetting user');
    }
    posthog.reset();
  }
};

// Game-specific analytics events
export const trackGameEvent = (
  action: string,
  gameType: string,
  properties?: Record<string, any>
) => {
  trackEvent('game_action', {
    action,
    game_type: gameType,
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

export const trackBetPlaced = (
  amount: number,
  betType: string,
  gameType: string
) => {
  trackEvent('bet_placed', {
    amount,
    bet_type: betType,
    game_type: gameType,
    timestamp: new Date().toISOString(),
  });
};

export const trackGameResult = (
  result: 'win' | 'lose',
  amount: number,
  gameType: string,
  winAmount?: number
) => {
  trackEvent('game_result', {
    result,
    bet_amount: amount,
    win_amount: winAmount || 0,
    game_type: gameType,
    timestamp: new Date().toISOString(),
  });
};

export const trackChipPurchase = (amount: number, chipType: string) => {
  trackEvent('chip_purchase', {
    amount,
    chip_type: chipType,
    timestamp: new Date().toISOString(),
  });
};

export const trackWithdrawal = (amount: number) => {
  trackEvent('withdrawal', {
    amount,
    timestamp: new Date().toISOString(),
  });
};
