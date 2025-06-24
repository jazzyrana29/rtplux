'use client';

import { useEffect } from 'react';
import { useFeatureFlagsStore } from '../stores/featureFlagsStore';
import type { FeaturePath, GameType } from '@/types/featureFlags';
import { trackUserAction } from '../lib/sentry';

export const useFeatureFlags = () => {
  const store = useFeatureFlagsStore();

  // Auto-initialize on first use
  useEffect(() => {
    if (!store.isInitialized && !store.isLoading) {
      store.loadPartnerConfig().then((r) => console.log(r));
    }
  }, [store.isInitialized, store.isLoading, store.loadPartnerConfig]);

  // Helper function with logging
  const isFeatureEnabled = (featurePath: FeaturePath): boolean => {
    const enabled = store.isFeatureEnabled(featurePath);

    // Track feature flag usage for analytics
    trackUserAction('feature_flag_checked', {
      feature_path: featurePath,
      enabled,
      partner_id: store.partnerId,
    });

    return enabled;
  };

  // Helper function for game-specific checks
  const isGameEnabled = (gameType: GameType): boolean => {
    const enabled = store.isGameEnabled(gameType);

    trackUserAction('game_availability_checked', {
      game_type: gameType,
      enabled,
      partner_id: store.partnerId,
    });

    return enabled;
  };

  return {
    // State
    config: store.config,
    partnerId: store.partnerId,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    error: store.error,

    // Actions
    loadPartnerConfig: store.loadPartnerConfig,
    setPartnerId: store.setPartnerId,
    refreshConfig: store.refreshConfig,
    resetConfig: store.resetConfig,

    // Feature checks with analytics
    isFeatureEnabled,
    isGameEnabled,
    getFeatureValue: store.getFeatureValue,

    // Game-specific helpers
    getGameConfig: store.getGameConfig,
    canPlaceBet: store.canPlaceBet,
    getAllowedChips: store.getAllowedChips,
    getMaxBet: store.getMaxBet,
    getMinBet: store.getMinBet,

    // Configuration getters
    getBrandingConfig: store.getBrandingConfig,
    getAPIConfig: store.getAPIConfig,
    getLimits: store.getLimits,
  };
};
