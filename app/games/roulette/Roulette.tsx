'use client';

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import RouletteScene from '../../../scenes/RouletteScene';

const RouletteGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1024,
      height: 768,
      parent: containerRef.current,
      scene: [RouletteScene],
      scale: {
        mode: Phaser.Scale.ScaleModes.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      backgroundColor: '#003300',
    };
    gameRef.current = new Phaser.Game(config);
    return () => gameRef.current?.destroy(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 py-8 px-4">
      <h1 className="text-6xl font-extrabold text-yellow-400 mb-8">
        🎰 Custom Phaser Roulette
      </h1>
      <div
        ref={containerRef}
        className="w-full max-w-screen-lg aspect-w-4 aspect-h-3
                   border-8 border-yellow-500 rounded-2xl
                   shadow-[0_0_30px_rgba(0,0,0,0.8)]
                   overflow-hidden"
      />
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
