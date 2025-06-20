import { SENTRY_DSN } from '@env';
import { __DEV__ } from './utils';

// Import both Sentry SDKs statically
import * as SentryBrowser from '@sentry/browser';
import * as SentryRN from '@sentry/react-native';

// Determine which Sentry SDK to use
const getSentrySDK = () => {
  // Check if we're in a web environment
  if (typeof window !== 'undefined') {
    return SentryBrowser;
  } else {
    return SentryRN;
  }
};

let Sentry: typeof SentryBrowser | typeof SentryRN | null = null;

// Initialize Sentry with comprehensive configuration
export const initializeSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found in environment variables');
    return false;
  }

  try {
    Sentry = getSentrySDK();

    const isWeb = typeof window !== 'undefined';

    const config: any = {
      dsn: SENTRY_DSN,
      debug: __DEV__, // Enable debug in development
      environment: __DEV__ ? 'development' : 'production',

      // Performance monitoring
      tracesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% in dev, 10% in prod

      // Additional options
      attachStacktrace: true,

      // Filter out common noise
      beforeSend(event: any, hint: any) {
        // Filter out development errors in production
        if (!__DEV__ && event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            // Skip common development warnings
            if (
              error.message.includes('Warning:') ||
              error.message.includes('VirtualizedList')
            ) {
              return null;
            }
          }
        }
        return event;
      },

      // Add custom tags
      initialScope: {
        tags: {
          component: 'casino-app',
          platform: isWeb ? 'web' : 'native',
        },
      },
    };

    // Add web-specific options
    if (isWeb) {
      config.integrations = [SentryBrowser.browserTracingIntegration()];
    } else {
      // React Native specific options
      config.enableAutoSessionTracking = true;
      config.sessionTrackingIntervalMillis = 30000;
      config.enableNativeCrashHandling = true;
      config.enableNativeNagger = false;
      config.enableAutoPerformanceTracing = true;
    }

    Sentry.init(config);

    // Set user context
    Sentry.setUser({
      id: 'anonymous',
      segment: 'casino-player',
    });

    console.log(
      '✅ Sentry initialized successfully with DSN:',
      SENTRY_DSN.substring(0, 20) + '...'
    );
    console.log('📱 Platform:', isWeb ? 'Web' : 'React Native');

    // Test Sentry with a dummy event
    Sentry.addBreadcrumb({
      message: 'Sentry initialization completed',
      category: 'system',
      level: 'info',
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
    return false;
  }
};

// Safe wrapper for Sentry operations
const safeSentryOperation = (operation: () => void, fallback?: () => void) => {
  try {
    if (Sentry) {
      operation();
    } else if (__DEV__) {
      console.log('Sentry not available, skipping operation');
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Sentry operation failed:', error);
    }
    if (fallback) {
      fallback();
    }
  }
};

// Custom error tracking functions
export const trackError = (error: Error, context?: Record<string, any>) => {
  if (__DEV__) {
    console.error('🔴 Sentry Error:', error, context);
  }

  safeSentryOperation(() => {
    Sentry!.withScope((scope: any) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry!.captureException(error);
    });
  });
};

// Track game-specific errors
export const trackGameError = (
  error: Error,
  gameType: string,
  gameState?: Record<string, any>
) => {
  safeSentryOperation(() => {
    Sentry!.withScope((scope: any) => {
      scope.setTag('error_type', 'game_error');
      scope.setTag('game_type', gameType);
      scope.setContext('game_state', gameState || {});
      scope.setLevel('error');
      Sentry!.captureException(error);
    });
  });
};

// Track performance issues
export const trackPerformance = (operation: string, duration: number) => {
  safeSentryOperation(() => {
    Sentry!.addBreadcrumb({
      message: `Performance: ${operation}`,
      category: 'performance',
      data: { duration },
      level: 'info',
    });

    if (duration > 1000) {
      // Log slow operations
      Sentry!.captureMessage(
        `Slow operation: ${operation} took ${duration}ms`,
        'warning'
      );
    }
  });
};

// Track user actions with breadcrumbs
export const trackUserAction = (action: string, data?: Record<string, any>) => {
  safeSentryOperation(() => {
    Sentry!.addBreadcrumb({
      message: action,
      category: 'user_action',
      data,
      level: 'info',
    });
  });
};

// Track API errors
export const trackAPIError = (
  endpoint: string,
  error: Error,
  response?: any
) => {
  safeSentryOperation(() => {
    Sentry!.withScope((scope: any) => {
      scope.setTag('error_type', 'api_error');
      scope.setContext('api_call', {
        endpoint,
        response: response ? JSON.stringify(response) : null,
      });
      Sentry!.captureException(error);
    });
  });
};

// Set user context for tracking
export const setSentryUser = (userId: string, email?: string) => {
  safeSentryOperation(() => {
    Sentry!.setUser({
      id: userId,
      email,
      segment: 'casino-player',
    });
  });
};

// Clear user context (for logout)
export const clearSentryUser = () => {
  safeSentryOperation(() => {
    Sentry!.setUser(null);
  });
};

// Manual message capture
export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) => {
  safeSentryOperation(() => {
    Sentry!.captureMessage(message, level);
  });
};

// Test functions for Sentry
export const testSentryIntegration = () => {
  console.log('🧪 Testing Sentry integration...');

  // Test breadcrumb
  trackUserAction('sentry_test_started', {
    timestamp: new Date().toISOString(),
  });

  // Test message capture
  captureMessage('Sentry test message', 'info');

  // Test performance tracking
  trackPerformance('sentry_test_operation', 150);

  // Test warning
  captureMessage('Sentry test warning', 'warning');

  console.log('✅ Sentry test events sent');
};

export const testSentryError = () => {
  console.log('🧪 Testing Sentry error capture...');

  try {
    // Intentionally throw an error for testing
    throw new Error('This is a test error for Sentry integration');
  } catch (error) {
    trackError(error as Error, {
      test: true,
      timestamp: new Date().toISOString(),
      context: 'sentry_integration_test',
    });
    console.log('✅ Test error sent to Sentry');
  }
};

export const testSentryGameError = () => {
  console.log('🧪 Testing Sentry game error capture...');

  const testError = new Error('Test game error - roulette spin failed');
  trackGameError(testError, 'roulette', {
    test: true,
    betCount: 3,
    totalBetAmount: 50,
    gameState: 'spinning',
  });

  console.log('✅ Test game error sent to Sentry');
};
