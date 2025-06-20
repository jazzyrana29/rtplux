// public/roulette.bundle.ts

import Phaser from 'phaser';
import RouletteScene from '../scenes/RouletteScene';

// Extend window to include our globals
declare global {
  interface Window {
    initGame: (params: { betSize: number; currency: string }) => void;
    _phaserGame?: Phaser.Game;
  }
}

// Ensure our game reference is initialized
window._phaserGame = window._phaserGame ?? undefined;

/**
 * Called by the iframe via postMessage on INIT
 * @param params.betSize  Size of the bet
 * @param params.currency Currency code (e.g., "USD")
 */
window.initGame = ({
  betSize,
  currency,
}: {
  betSize: number;
  currency: string;
}): void => {
  // Destroy any existing game instance
  if (window._phaserGame) {
    window._phaserGame.destroy(true);
    window._phaserGame = undefined;
  }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [RouletteScene],
  };

  // Instantiate and start the game
  const game = new Phaser.Game(config);
  window._phaserGame = game;
  game.scene.start('RouletteScene', { betSize, currency });
};

export {};
