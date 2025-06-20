// public/roulette.bundle.ts
import Phaser from 'phaser';
import RouletteScene from '../scenes/RouletteScene';

declare global {
  interface Window {
    initGame: (params: { betSize: number; currency: string }) => void;
    _phaserGame?: Phaser.Game;
  }
}

window.initGame = ({ betSize, currency }) => {
  // tear down old instance
  if (window._phaserGame) {
    window._phaserGame.destroy(true);
    window._phaserGame = undefined;
  }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1024,
    height: 768,
    scene: [RouletteScene],
    scale: {
      mode: Phaser.Scale.ScaleModes.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    backgroundColor: '#003300',
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
  };

  const game = new Phaser.Game(config);
  window._phaserGame = game;
  game.scene.start('RouletteScene', { betSize, currency });
};
