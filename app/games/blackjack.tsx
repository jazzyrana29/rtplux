'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { AnimatePresence, motion } from 'framer-motion';
import BlackJackScene from '../../scenes/BlackJackScene';
import { IFrame } from '@/components/IFrame';
import { useIsFocused } from '@react-navigation/core';
import {
  trackError,
  trackGameError,
  trackPerformance,
  trackUserAction,
} from '../../lib/sentry';
import {
  AnimatedButton,
  AnimatedText,
  AnimatedView,
  LoadingSpinner,
} from '@/components/AnimatedComponents';
import {
  modalVariants,
  overlayVariants,
  pageTransition,
  pageVariants,
} from '../../lib/animations';
import { useTranslation } from '../../hooks/useTranslation';
import { getTextDirection } from '../../lib/i18n';
import { BLACK_JACK_CONSTANTS } from '../../constants/blackJack';

const BlackJackGameContent: React.FC = () => {
  const phaserRef = useRef<Phaser.Game | null>(null);
  const containerId = 'blackJack-phaser-container';
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [gameLoading, setGameLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const isFocused = useIsFocused();
  const { t, currentLanguage, isReady } = useTranslation();

  useEffect(() => {
    const startTime = performance.now();

    try {
      trackUserAction('game_initialization', {
        game: 'blackJack',
        iframeLoaded,
        isFocused,
      });

      if (isFocused && iframeLoaded && iframeRef.current) {
        setGameLoading(true);

        // Destroy existing instance if any
        if (phaserRef.current) {
          phaserRef.current.destroy(true);
          trackUserAction('phaser_game_destroyed');
        }

        const iframeDoc = iframeRef?.current.contentWindow?.document;
        if (!iframeDoc) {
          const error = new Error('IFrame document not ready yet');
          trackGameError(error, 'blackJack', {
            step: 'iframe_document_access',
            iframeLoaded,
            isFocused,
          });
          return;
        }

        const targetContainer = iframeDoc.getElementById(containerId);
        if (!targetContainer) {
          const error = new Error(
            'Could not find #phaser-container inside IFrame'
          );
          trackGameError(error, 'blackJack', {
            step: 'container_not_found',
            containerId,
          });
          return;
        }

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: 1024,
          height: 700,
          parent: targetContainer,
          scene: [BlackJackScene],
          scale: {
            mode: Phaser.Scale.ScaleModes.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          backgroundColor: '#003300',
        };

        try {
          phaserRef.current = new Phaser.Game(config);

          // Add loading completion handler
          setTimeout(() => {
            setGameLoading(false);
            const initTime = performance.now() - startTime;
            trackPerformance('phaser_game_initialization', initTime);
            trackUserAction('phaser_game_created', {
              initTime,
              config: {
                width: config.width,
                height: config.height,
                backgroundColor: config.backgroundColor,
              },
            });
          }, 2000);
        } catch (phaserError) {
          trackGameError(phaserError as Error, 'blackJack', {
            step: 'phaser_game_creation',
            config,
          });
          setGameLoading(false);
          throw phaserError;
        }

        return (): void => {
          try {
            if (phaserRef.current) {
              phaserRef.current.destroy(true);
              phaserRef.current = null;
              trackUserAction('phaser_game_cleanup');
            }
          } catch (cleanupError) {
            trackError(cleanupError as Error, {
              context: 'phaser_cleanup',
              game: 'blackJack',
            });
          }
        };
      }
    } catch (error) {
      trackGameError(error as Error, 'blackJack', {
        step: 'useEffect_main',
        iframeLoaded,
        isFocused,
        startTime,
      });
      setGameLoading(false);
    }
  }, [isFocused, iframeLoaded]);

  const handleIFrameLoad = () => {
    try {
      setIframeLoaded(true);
      trackUserAction('iframe_loaded', { game: 'blackJack' });
    } catch (error) {
      trackError(error as Error, { context: 'iframe_load_handler' });
    }
  };

  // Add this loading check
  if (!isReady) {
    return (
      <AnimatedView className="flex-1 bg-gradient-to-br from-green-900 via-green-800 to-green-900 min-h-screen justify-center items-center">
        <LoadingSpinner size={60} color="#ffd700" />
        <AnimatedText className="text-yellow-400 text-xl font-bold mt-4">
          Loading translations...
        </AnimatedText>
      </AnimatedView>
    );
  }

  return (
    <AnimatedView
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
      className="flex-1 bg-gradient-to-br from-green-900 via-green-800 to-green-900 min-h-screen"
      style={{
        direction: getTextDirection(currentLanguage),
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="p-4 text-center"
      >
        <AnimatedText className="text-4xl font-bold text-yellow-400 mb-2">
          {t(BLACK_JACK_CONSTANTS.TITLE)}
        </AnimatedText>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '200px' }}
          transition={{ delay: 0.8, duration: 1 }}
          className="h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded mx-auto mb-4"
        />

        <AnimatedButton
          variant="secondary"
          size="sm"
          onPress={() => setShowInstructions(true)}
          className="mb-4"
        >
          {t(BLACK_JACK_CONSTANTS.HOW_TO_PLAY)}
        </AnimatedButton>
      </motion.div>

      {/* Game Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
        className="flex-1 flex items-center justify-center px-4"
      >
        {isFocused && (
          <motion.div
            className="relative"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {/* Game Frame */}
            <motion.div
              className="border-8 border-yellow-500 rounded-2xl shadow-2xl overflow-hidden"
              animate={{
                boxShadow: [
                  '0 0 30px rgba(255, 215, 0, 0.3)',
                  '0 0 50px rgba(255, 215, 0, 0.5)',
                  '0 0 30px rgba(255, 215, 0, 0.3)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
              }}
            >
              <IFrame
                ref={iframeRef}
                onLoad={handleIFrameLoad}
                allowedOrigin={window.location.origin}
                style={{
                  width: 1024,
                  height: 800,
                }}
              >
                <div id={containerId} className="w-full h-full bg-green-800" />
              </IFrame>
            </motion.div>

            {/* Loading Overlay */}
            <AnimatePresence>
              {gameLoading && (
                <motion.div
                  variants={overlayVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center rounded-2xl"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <LoadingSpinner
                      size={60}
                      color="#ffd700"
                      className="mb-4"
                    />
                    <AnimatedText className="text-yellow-400 text-xl font-bold mb-2">
                      {t(BLACK_JACK_CONSTANTS.LOADING_TABLE)}
                    </AnimatedText>
                    <motion.div
                      className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-black bg-opacity-70 z-40"
              onClick={() => setShowInstructions(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-4 bg-gradient-to-br from-casino-secondary to-casino-accent rounded-xl border-2 border-casino-gold z-50 p-6 overflow-y-auto"
            >
              <AnimatedText className="text-2xl font-bold text-casino-gold mb-4 text-center">
                {t(BLACK_JACK_CONSTANTS.HOW_TO_PLAY_TITLE)}
              </AnimatedText>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4 text-white"
              >
                <div>
                  <AnimatedText className="font-bold text-yellow-400 mb-2">
                    {t(BLACK_JACK_CONSTANTS.BASIC_CONTROLS)}
                  </AnimatedText>
                  <AnimatedText className="text-sm">
                    {t(BLACK_JACK_CONSTANTS.BASIC_CONTROLS_TEXT)}
                  </AnimatedText>
                </div>

                <div>
                  <AnimatedText className="font-bold text-yellow-400 mb-2">
                    {t(BLACK_JACK_CONSTANTS.BETTING_OPTIONS)}
                  </AnimatedText>
                  <AnimatedText className="text-sm">
                    {t(BLACK_JACK_CONSTANTS.BETTING_OPTIONS_TEXT)}
                  </AnimatedText>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <AnimatedButton
                  variant="primary"
                  onPress={() => setShowInstructions(false)}
                  className="w-full"
                >
                  {t(BLACK_JACK_CONSTANTS.GOT_IT)}
                </AnimatedButton>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-4 text-center"
      >
        <AnimatedText className="text-gray-300 text-sm">
          {t(BLACK_JACK_CONSTANTS.RESPONSIVE_TABLE)}
        </AnimatedText>
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          <AnimatedText className="text-yellow-400 text-xs mt-1">
            {t(BLACK_JACK_CONSTANTS.RESIZE_WINDOW)}
          </AnimatedText>
        </motion.div>
      </motion.div>
    </AnimatedView>
  );
};

export default BlackJackGameContent;
