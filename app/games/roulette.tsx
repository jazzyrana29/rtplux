'use client';

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import RouletteScene from '../../scenes/RouletteScene';

const RouletteGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      scene: [RouletteScene],
      backgroundColor: '#003300',
      scale: {
        mode: Phaser.Scale.ScaleModes.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };
    gameRef.current = new Phaser.Game(config);
    return () => gameRef.current?.destroy(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
      <h1 className="text-5xl font-extrabold text-yellow-400 mb-6">
        🎰 Custom Phaser Roulette
      </h1>

      <div
        ref={containerRef}
        className="roulette-container relative rounded-2xl
                   border-8 border-yellow-500
                   shadow-[0_0_20px_rgba(0,0,0,0.8)]
                   overflow-visible"
        style={{
          width: 800,
          height: 600,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease',
        }}
      />

      <p className="mt-4 text-gray-300 text-center max-w-lg">
        Hover over SPIN to zoom the entire board and border, click to play. Wins
        on odd numbers (except 0). Audio & animations loaded from your assets!
      </p>
    </div>
  );
};

export default RouletteGame;
