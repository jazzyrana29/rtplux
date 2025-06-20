'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import RouletteScene from '../../scenes/RouletteScene';
import { IFrame } from '@/components/IFrame';
import { useIsFocused } from '@react-navigation/core';
import {
  trackError,
  trackGameError,
  trackPerformance,
  trackUserAction,
} from '../../lib/sentry';
import * as Sentry from '@sentry/react-native';

const RouletteGameContent: React.FC = () => {
  const phaserRef = useRef<Phaser.Game | null>(null);
  const containerId = 'roulette-phaser-container';
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    const startTime = performance.now();

    try {
      // Track game initialization
      trackUserAction('game_initialization', {
        game: 'roulette',
        iframeLoaded,
        isFocused,
      });

      console.log('iframeLoaded => ', iframeLoaded);
      console.log('isFocused => ', isFocused);

      if (isFocused && iframeLoaded && iframeRef.current) {
        // Destroy existing instance if any
        if (phaserRef.current) {
          phaserRef.current.destroy(true);
          trackUserAction('phaser_game_destroyed');
        }

        const iframeDoc = iframeRef?.current.contentWindow?.document;
        if (!iframeDoc) {
          const error = new Error('IFrame document not ready yet');
          trackGameError(error, 'roulette', {
            step: 'iframe_document_access',
            iframeLoaded,
            isFocused,
          });
          console.warn('IFrame document not ready yet.');
          return;
        }

        const targetContainer = iframeDoc.getElementById(containerId);
        if (!targetContainer) {
          const error = new Error(
            'Could not find #phaser-container inside IFrame'
          );
          trackGameError(error, 'roulette', {
            step: 'container_not_found',
            containerId,
          });
          console.warn('Could not find #phaser-container inside IFrame.');
          return;
        }

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: 1024,
          height: 700,
          parent: targetContainer,
          scene: [RouletteScene],
          scale: {
            mode: Phaser.Scale.ScaleModes.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          backgroundColor: '#003300',
        };

        try {
          phaserRef.current = new Phaser.Game(config);

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
        } catch (phaserError) {
          trackGameError(phaserError as Error, 'roulette', {
            step: 'phaser_game_creation',
            config,
          });
          throw phaserError;
        }

        // Cleanup function
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
              game: 'roulette',
            });
          }
        };
      }
    } catch (error) {
      trackGameError(error as Error, 'roulette', {
        step: 'useEffect_main',
        iframeLoaded,
        isFocused,
        startTime,
      });
      console.error('Error in RouletteGame useEffect:', error);
    }
  }, [isFocused, iframeLoaded]);

  const handleIFrameLoad = () => {
    try {
      setIframeLoaded(true);
      trackUserAction('iframe_loaded', { game: 'roulette' });
    } catch (error) {
      trackError(error as Error, { context: 'iframe_load_handler' });
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 py-8 px-4">
      <h1 className="text-6xl font-extrabold text-yellow-400 mb-8">
        🎰 Custom Phaser Roulette
      </h1>

      {isFocused && (
        <IFrame
          ref={iframeRef}
          onLoad={handleIFrameLoad}
          allowedOrigin={window.location.origin}
          style={{
            width: 1024,
            height: 800,
          }}
        >
          <div
            id={containerId}
            className="w-full max-w-screen-lg aspect-w-4 aspect-h-3
                   border-8 border-yellow-500 rounded-2xl
                   shadow-[0_0_30px_rgba(0,0,0,0.8)]
                   overflow-y-scroll"
          />
        </IFrame>
      )}

      <p className="mt-6 text-gray-300 text-center max-w-2xl">
        Responsive board: resize your window and the table, chips, and button
        will scale to fit!
        <br />
        Container now stretches up to 1024×768 (4:3) or your screen's width,
        whichever is smaller.
      </p>
    </div>
  );
};

// Wrap with Sentry error boundary and profiler
const RouletteGame = Sentry.withProfiler(Sentry.wrap(RouletteGameContent), {
  name: 'RouletteGame',
});

export default RouletteGame;
