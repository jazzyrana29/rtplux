// File: app/games/roulette.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import RouletteScene from '../../scenes/RouletteScene';

const RouletteWrapper: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current as HTMLElement,
      scene: [RouletteScene],
      backgroundColor: '#000000',
      scale: {
        mode: Phaser.Scale.ScaleModes.FIT,
        autoCenter: Phaser.Scale.Center.CENTER_BOTH,
      },
      audio: {
        disableWebAudio: false,
      },
    };

    const game = new Phaser.Game(config);
    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
};

export default RouletteWrapper;
