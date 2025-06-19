'use client';

import type React from 'react';
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import AssetRouletteScene from '../../scenes/RouletteScene';

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
      scene: [AssetRouletteScene],
      backgroundColor: '#1a5f1a',
      scale: {
        mode: Phaser.Scale.ScaleModes.FIT,
        autoCenter: Phaser.Scale.Center.CENTER_BOTH,
      },
    };

    console.log('🚀 Starting Phaser game with your assets...');
    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-4xl font-bold text-white mb-4">
        🎰 Your Custom Roulette
      </h1>
      <div
        ref={containerRef}
        className="border-4 border-yellow-500 rounded-lg overflow-hidden shadow-2xl"
        style={{ width: '800px', height: '600px' }}
      />
      <div className="mt-4 text-white text-center">
        <p className="text-lg">Using YOUR provided assets!</p>
        <p className="text-sm text-gray-400">
          Check console for asset loading details
        </p>
      </div>
    </div>
  );
};

export default RouletteGame;
