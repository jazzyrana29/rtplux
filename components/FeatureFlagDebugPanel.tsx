"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useFeatureFlags } from "../hooks/useFeatureFlags"
import { AnimatedButton, AnimatedText } from "./AnimatedComponents"
import { modalVariants, overlayVariants } from "../lib/animations"

interface FeatureFlagDebugPanelProps {
  isVisible: boolean
  onClose: () => void
}

export const FeatureFlagDebugPanel: React.FC<FeatureFlagDebugPanelProps> = ({ isVisible, onClose }) => {
  const {
    config,
    partnerId,
    isLoading,
    isInitialized,
    error,
    refreshConfig,
    setPartnerId,
    isFeatureEnabled,
    isGameEnabled,
  } = useFeatureFlags()

  const [newPartnerId, setNewPartnerId] = useState(partnerId || "")

  const handlePartnerChange = () => {
    if (newPartnerId.trim()) {
      setPartnerId(newPartnerId.trim())
    }
  }

  const gameTypes = ["roulette", "slots", "blackjack", "crash"] as const
  const featureCategories = [
    { name: "UI Features", prefix: "ui" },
    { name: "Analytics", prefix: "analytics" },
    { name: "Payments", prefix: "payments" },
    { name: "Social", prefix: "social" },
  ]

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black bg-opacity-70 z-50"
            onClick={onClose}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-4 bg-casino-secondary rounded-xl border-2 border-casino-gold z-50 p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <AnimatedText className="text-2xl font-bold text-casino-gold">🚩 Feature Flags Debug Panel</AnimatedText>
              <AnimatedButton variant="danger" size="sm" onPress={onClose}>
                ✕
              </AnimatedButton>
            </div>

            {/* Partner Info */}
            <div className="mb-6 p-4 bg-casino-primary rounded-lg">
              <AnimatedText className="text-lg font-semibold text-white mb-2">Partner Configuration</AnimatedText>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <AnimatedText className="text-gray-400">Partner ID:</AnimatedText>
                  <AnimatedText className="text-white font-mono">{partnerId || "None"}</AnimatedText>
                </div>
                <div>
                  <AnimatedText className="text-gray-400">Partner Name:</AnimatedText>
                  <AnimatedText className="text-white">{config?.partnerName || "Unknown"}</AnimatedText>
                </div>
                <div>
                  <AnimatedText className="text-gray-400">Status:</AnimatedText>
                  <AnimatedText
                    className={`font-semibold ${
                      isInitialized ? "text-green-400" : error ? "text-red-400" : "text-yellow-400"
                    }`}
                  >
                    {isLoading ? "Loading..." : isInitialized ? "Loaded" : error ? "Error" : "Not Loaded"}
                  </AnimatedText>
                </div>
                <div>
                  <AnimatedText className="text-gray-400">Version:</AnimatedText>
                  <AnimatedText className="text-white font-mono">{config?.version || "N/A"}</AnimatedText>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-900 rounded border border-red-600">
                  <AnimatedText className="text-red-300 text-sm">{error}</AnimatedText>
                </div>
              )}
            </div>

            {/* Partner Switcher */}
            <div className="mb-6 p-4 bg-casino-accent rounded-lg">
              <AnimatedText className="text-lg font-semibold text-white mb-3">Switch Partner</AnimatedText>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPartnerId}
                  onChange={(e) => setNewPartnerId(e.target.value)}
                  placeholder="Enter partner ID"
                  className="flex-1 px-3 py-2 bg-casino-primary text-white rounded border border-casino-gold"
                />
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onPress={handlePartnerChange}
                  disabled={!newPartnerId.trim() || isLoading}
                >
                  Switch
                </AnimatedButton>
                <AnimatedButton variant="secondary" size="sm" onPress={refreshConfig} disabled={isLoading}>
                  Refresh
                </AnimatedButton>
              </div>
              <div className="flex gap-2 mt-2">
                {["default", "partner1", "partner2"].map((pid) => (
                  <button
                    key={pid}
                    onClick={() => setNewPartnerId(pid)}
                    className="px-2 py-1 text-xs bg-casino-primary text-white rounded hover:bg-casino-gold hover:text-casino-primary"
                  >
                    {pid}
                  </button>
                ))}
              </div>
            </div>

            {/* Games Status */}
            <div className="mb-6">
              <AnimatedText className="text-lg font-semibold text-white mb-3">🎮 Games Status</AnimatedText>
              <div className="grid grid-cols-2 gap-3">
                {gameTypes.map((game) => (
                  <div
                    key={game}
                    className={`p-3 rounded border ${
                      isGameEnabled(game) ? "bg-green-900 border-green-600" : "bg-red-900 border-red-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <AnimatedText className="text-white font-semibold capitalize">{game}</AnimatedText>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          isGameEnabled(game) ? "bg-green-600 text-white" : "bg-red-600 text-white"
                        }`}
                      >
                        {isGameEnabled(game) ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                    {config?.features[game] && (
                      <div className="mt-2 text-xs text-gray-300">
                        <div>Min: ${config.features[game].minBet}</div>
                        <div>Max: ${config.features[game].maxBet}</div>
                        <div>Chips: {config.features[game].allowedChips.join(", ")}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Categories */}
            {featureCategories.map((category) => (
              <div key={category.prefix} className="mb-4">
                <AnimatedText className="text-lg font-semibold text-white mb-2">{category.name}</AnimatedText>
                <div className="grid grid-cols-3 gap-2">
                  {config?.features[category.prefix as keyof typeof config.features] &&
                    Object.entries(config.features[category.prefix as keyof typeof config.features]).map(
                      ([key, value]) => (
                        <div key={key} className="p-2 bg-casino-primary rounded text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">{key}</span>
                            <span
                              className={`px-1 rounded ${
                                typeof value === "boolean"
                                  ? value
                                    ? "bg-green-600 text-white"
                                    : "bg-red-600 text-white"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              {typeof value === "boolean" ? (value ? "✓" : "✗") : String(value)}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                </div>
              </div>
            ))}

            {/* Raw Config */}
            <div className="mt-6">
              <AnimatedText className="text-lg font-semibold text-white mb-2">📄 Raw Configuration</AnimatedText>
              <pre className="bg-casino-primary p-4 rounded text-xs text-gray-300 overflow-auto max-h-64">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
