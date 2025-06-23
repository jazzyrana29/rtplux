'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import {
  clearPartnerOverride,
  detectPartnerWithDetails,
  getAvailablePartners,
  switchPartner,
} from '../lib/partnerDetection';

interface PartnerSwitcherProps {
  showInProduction?: boolean;
}

export const PartnerSwitcher: React.FC<PartnerSwitcherProps> = ({
  showInProduction = false,
}) => {
  const { partnerId, config, setPartnerId } = useFeatureFlags();
  const [availablePartners, setAvailablePartners] = useState<string[]>([]);
  const [detectionDetails, setDetectionDetails] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development unless explicitly enabled for production
  const shouldShow = process.env.NODE_ENV === 'development' || showInProduction;

  useEffect(() => {
    // Get detection details
    const details = detectPartnerWithDetails();
    setDetectionDetails(details);

    // Load available partners
    getAvailablePartners().then(setAvailablePartners);
  }, []);

  if (!shouldShow) return null;

  const handlePartnerSwitch = (newPartnerId: string) => {
    if (newPartnerId === partnerId) return;

    console.log(`🔄 Switching partner from ${partnerId} to ${newPartnerId}`);

    // Use URL parameter method for immediate switching
    switchPartner(newPartnerId);
  };

  const handleClearOverride = () => {
    console.log(`🧹 Clearing partner override`);
    clearPartnerOverride();
  };

  return (
    <motion.div
      className="fixed bottom-4 left-4 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
    >
      <motion.div
        className="bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-400/30 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm"
        animate={{
          width: isExpanded ? 360 : 140,
          height: isExpanded ? 'auto' : 48,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Header */}
        <motion.button
          className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold flex items-center justify-between hover:from-indigo-400 hover:to-purple-400 transition-all duration-200 shadow-lg"
          onClick={() => setIsExpanded(!isExpanded)}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🏢</span>
            <span className="truncate">
              {config?.partnerName || partnerId || 'Default'}
            </span>
          </div>
          <motion.span
            className="text-white/80 ml-2"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        </motion.button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Current Partner Info */}
              <div className="mb-4 p-3 bg-white/80 dark:bg-gray-700/80 rounded-lg border border-indigo-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                    Current Partner
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-indigo-300 to-transparent"></div>
                </div>

                <div className="text-gray-800 dark:text-white font-mono text-sm mb-1">
                  {config?.partnerName || partnerId}
                </div>

                {detectionDetails && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="font-medium">
                        {detectionDetails.method}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Source:</span>
                      <span className="font-medium truncate ml-2">
                        {detectionDetails.source}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Partner Selection */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
                    Switch Partner
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-purple-300 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {availablePartners.map((partner) => (
                    <motion.button
                      key={partner}
                      className={`p-3 text-sm rounded-lg transition-all duration-200 flex items-center justify-between ${
                        partner === partnerId
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                          : 'bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                      }`}
                      onClick={() => handlePartnerSwitch(partner)}
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={partner === partnerId}
                    >
                      <div className="flex items-center gap-2">
                        {partner === partnerId && (
                          <span className="text-white">✓</span>
                        )}
                        <span className="font-medium">{partner}</span>
                        {partner === 'default' && (
                          <span className="text-xs opacity-70">(fallback)</span>
                        )}
                      </div>

                      {partner === partnerId && (
                        <motion.div
                          className="w-2 h-2 bg-white rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                          }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Clear Override Button */}
              {detectionDetails?.method === 'url_param' && (
                <motion.button
                  className="w-full p-3 text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-400 hover:to-red-400 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                  onClick={handleClearOverride}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🧹</span>
                  <span className="font-medium">Clear URL Override</span>
                </motion.button>
              )}

              {/* Quick URLs Reference */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                  Quick URLs:
                </div>
                <div className="space-y-1">
                  {availablePartners
                    .filter((p) => p !== 'default')
                    .map((partner) => (
                      <div
                        key={partner}
                        className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                      >
                        <span className="text-indigo-600 dark:text-indigo-400">
                          ?partner={partner}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
