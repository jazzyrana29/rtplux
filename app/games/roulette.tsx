'use client';

import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import RouletteScene from '../../scenes/RouletteScene';
import { IFrame } from '@/components/IFrame';
import { useIsFocused } from '@react-navigation/core';

const RouletteGame: React.FC = () => {
  const phaserRef = useRef<Phaser.Game | null>(null);
  const containerId = 'roulette-phaser-container';

  // Ref to the <IFrame> on web or <WebView> on native
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // Track whether the iframe (or WebView) content has loaded
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    console.log('iframeLoaded => ', iframeLoaded);
    console.log('isFocused => ', isFocused);

    if (isFocused && iframeLoaded && iframeRef.current) {
      // Destroy existing instance if any
      phaserRef.current?.destroy(true);

      // On web: iframeRef.current is an <iframe>, so contentWindow.document is available.
      // On native: iframeRef.current is a <WebView> reference. react-native-webview exposes contentWindow/document.
      const iframeDoc = iframeRef?.current.contentWindow?.document;
      if (!iframeDoc) {
        console.warn('IFrame document not ready yet.');
        return;
      }

      // Find the <div id="phaser-container"> inside the iframe’s HTML
      const targetContainer = iframeDoc.getElementById(containerId);
      if (!targetContainer) {
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
      phaserRef.current = new Phaser.Game(config);
      // Cleanup when screen loses focus or on unmount
      return (): void => {
        if (phaserRef.current) {
          phaserRef.current.destroy(true);
          phaserRef.current = null;
        }
      };
    } else {
    }
  }, [isFocused, iframeLoaded]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 py-8 px-4">
      <h1 className="text-6xl font-extrabold text-yellow-400 mb-8">
        🎰 Custom Phaser Roulette
      </h1>

      {isFocused && (
        <IFrame
          ref={iframeRef}
          onLoad={() => {
            setIframeLoaded(true);
            // if (!posthog) {
            //   console.warn(
            //     "PostHog not found in iframe—make sure parent injected it",
            //   );
            // } else {
            //   posthog.capture("Iframe launched");
            //   console.log("PostHog found in iframe capturing event");
            // }
          }}
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
        Container now stretches up to 1024×768 (4:3) or your screen’s width,
        whichever is smaller.
      </p>
    </div>
  );
};

export default RouletteGame;
