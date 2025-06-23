import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  FeaturePath,
  GameType,
  PartnerConfig,
} from '@/types/featureFlags';
import { trackError, trackUserAction } from '../lib/sentry';
import { trackEvent } from '../lib/posthog';
import { detectPartnerWithDetails } from '../lib/partnerDetection';

export interface FeatureFlagsState {
  // State
  config: PartnerConfig | null;
  partnerId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastFetchTime: number | null;
  detectionMethod: string | null;

  // Actions
  loadPartnerConfig: (partnerId?: string) => Promise<void>;
  setPartnerId: (partnerId: string) => void;
  refreshConfig: () => Promise<void>;
  resetConfig: () => void;

  // Feature flag getters
  isFeatureEnabled: (featurePath: FeaturePath) => boolean;
  getFeatureValue: <T = any>(featurePath: FeaturePath) => T | undefined;
  isGameEnabled: (gameType: GameType) => boolean;
  getGameConfig: (gameType: GameType) => any;
  getBrandingConfig: () => any;
  getAPIConfig: () => any;
  getLimits: () => any;

  // Utility methods
  canPlaceBet: (gameType: GameType, amount: number) => boolean;
  getAllowedChips: (gameType: GameType) => number[];
  getMaxBet: (gameType: GameType) => number;
  getMinBet: (gameType: GameType) => number;
}

// Helper function to get nested property value
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  persist(
    (set, get) => ({
      // Initial state
      config: null,
      partnerId: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      lastFetchTime: null,
      detectionMethod: null,

      // Load partner configuration
      loadPartnerConfig: async (partnerId?: string) => {
        const detectionResult = partnerId
          ? { partnerId, method: 'manual', source: 'manual_override' }
          : detectPartnerWithDetails();

        const targetPartnerId = detectionResult.partnerId;

        set({
          isLoading: true,
          error: null,
          partnerId: targetPartnerId,
          detectionMethod: detectionResult.method,
        });

        try {
          trackUserAction('feature_flags_loading_started', {
            partnerId: targetPartnerId,
            detectionMethod: detectionResult.method,
            detectionSource: detectionResult.source,
          });

          // Try to load partner-specific config first
          let configUrl = `/config/${targetPartnerId}.json`;
          let response = await fetch(configUrl);

          // If partner config doesn't exist, fall back to default
          if (!response.ok) {
            console.warn(
              `Partner config not found for ${targetPartnerId}, falling back to default`
            );
            configUrl = '/config/default.json';
            response = await fetch(configUrl);
          }

          if (!response.ok) {
            throw new Error(
              `Failed to load config: ${response.status} ${response.statusText}`
            );
          }

          const config: PartnerConfig = await response.json();

          // Validate config structure
          if (!config.features || !config.partnerId) {
            throw new Error('Invalid config structure');
          }

          set({
            config,
            partnerId: config.partnerId,
            isLoading: false,
            isInitialized: true,
            error: null,
            lastFetchTime: Date.now(),
          });

          // Track successful load
          trackUserAction('feature_flags_loaded', {
            partnerId: config.partnerId,
            partnerName: config.partnerName,
            version: config.version,
            configUrl,
            detectionMethod: detectionResult.method,
          });

          trackEvent('feature_flags_loaded', {
            partner_id: config.partnerId,
            partner_name: config.partnerName,
            version: config.version,
            features_count: Object.keys(config.features).length,
            detection_method: detectionResult.method,
          });

          console.log(
            `✅ Feature flags loaded for partner: ${config.partnerName} (${config.partnerId})`
          );
          console.log(
            `🔍 Detection method: ${detectionResult.method} from ${detectionResult.source}`
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

          set({
            isLoading: false,
            error: errorMessage,
            isInitialized: false,
          });

          trackError(error as Error, {
            context: 'feature_flags_loading',
            partnerId: targetPartnerId,
            configUrl: `/config/${targetPartnerId}.json`,
            detectionMethod: detectionResult.method,
          });

          console.error('❌ Failed to load feature flags:', error);
        }
      },

      // Set partner ID and reload config
      setPartnerId: (partnerId: string) => {
        const { loadPartnerConfig } = get();
        loadPartnerConfig(partnerId);
      },

      // Refresh current configuration
      refreshConfig: async () => {
        const { partnerId, loadPartnerConfig } = get();
        if (partnerId) {
          await loadPartnerConfig(partnerId);
        } else {
          // Re-detect partner if none set
          await loadPartnerConfig();
        }
      },

      // Reset configuration
      resetConfig: () => {
        set({
          config: null,
          partnerId: null,
          isLoading: false,
          isInitialized: false,
          error: null,
          lastFetchTime: null,
          detectionMethod: null,
        });
      },

      // Check if a feature is enabled
      isFeatureEnabled: (featurePath: FeaturePath): boolean => {
        const { config } = get();
        if (!config?.features) return false;

        const value = getNestedValue(config.features, featurePath);
        return Boolean(value);
      },

      // Get feature value
      getFeatureValue: <T = any>(featurePath: FeaturePath): T | undefined => {
        const { config } = get();
        if (!config?.features) return undefined;

        return getNestedValue(config.features, featurePath) as T;
      },

      // Check if a game is enabled
      isGameEnabled: (gameType: GameType): boolean => {
        const { config } = get();
        return config?.features?.[gameType]?.enabled ?? false;
      },

      // Get game configuration
      getGameConfig: (gameType: GameType) => {
        const { config } = get();
        return config?.features?.[gameType];
      },

      // Get branding configuration
      getBrandingConfig: () => {
        const { config } = get();
        return config?.branding;
      },

      // Get API configuration
      getAPIConfig: () => {
        const { config } = get();
        return config?.api;
      },

      // Get limits configuration
      getLimits: () => {
        const { config } = get();
        return config?.features?.limits;
      },

      // Check if bet amount is allowed
      canPlaceBet: (gameType: GameType, amount: number): boolean => {
        const { config } = get();
        const gameConfig = config?.features?.[gameType];

        if (!gameConfig?.enabled) return false;

        return amount >= gameConfig.minBet && amount <= gameConfig.maxBet;
      },

      // Get allowed chip denominations
      getAllowedChips: (gameType: GameType): number[] => {
        const { config } = get();
        return config?.features?.[gameType]?.allowedChips ?? [];
      },

      // Get maximum bet for game
      getMaxBet: (gameType: GameType): number => {
        const { config } = get();
        return config?.features?.[gameType]?.maxBet ?? 0;
      },

      // Get minimum bet for game
      getMinBet: (gameType: GameType): number => {
        const { config } = get();
        return config?.features?.[gameType]?.minBet ?? 1;
      },
    }),
    {
      name: 'feature-flags-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        partnerId: state.partnerId,
        lastFetchTime: state.lastFetchTime,
        config: state.config, // Cache config for offline use
        detectionMethod: state.detectionMethod,
      }),
    }
  )
);
