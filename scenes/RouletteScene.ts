// File: scenes/RouletteScene.ts

import Phaser from 'phaser';
import { credit, debit, getBalance } from '../services/wallet';
import { initRNG } from '../services/rng';

export default class RouletteScene extends Phaser.Scene {
  private wheel!: Phaser.GameObjects.Sprite;
  private button!: Phaser.GameObjects.Image;
  private isSpinning = false;
  private readonly betAmount = 100;
  private balanceText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'RouletteScene' });
  }

  preload(): void {
    // Multipage atlas: load both pages for rouletteSprites
    this.load.atlas(
      'rouletteSprites',
      require('../public/assets/games/roulette/roulette-0.webp'),
      require('../public/assets/games/roulette/roulette-0.json')
    );
    this.load.atlas(
      'rouletteSprites',
      require('..public/assets/games/roulette/roulette-1.webp'),
      require('../public/assets/games/roulette/roulette-1.json')
    );
    //
    // Chips atlas (likely single page)
    this.load.atlas(
      'chipsAtlas',
      require('../public/assets/games/roulette/chips.webp'),
      require('../assets/games/roulette/chips.json')
    );
    //
    // Single images
    this.load.image(
      'tableBg',
      require('../public/assets/games/roulette/tableBg.webp')
    );
    this.load.image(
      'spinButton',
      require('../public/assets/games/roulette/spin_button.webp')
    );

    // Confetti (multipage example)
    this.load.atlas(
      'confetti',
      require('assets/games/roulette/confetti_frames-0.webp'),
      require('assets/games/roulette/confetti_frames-0.json')
    );
    this.load.atlas(
      'confetti',
      require('assets/games/roulette/confetti_frames-1.webp'),
      require('assets/games/roulette/confetti_frames-1.json')
    );

    // Digits atlas
    this.load.atlas(
      'digitAtlas',
      require('assets/games/roulette/casino_digits_pngs.webp'),
      require('assets/games/roulette/casino_digits_pngs.json')
    );

    // Audio
    this.load.audio(
      'sfxSpin',
      require('../assets/games/roulette/audio/roulette_spin.mp3')
    );
    this.load.audio(
      'sfxDrop',
      require('assets/games/roulette/audio/ball_drop_click.mp3')
    );
    this.load.audio(
      'sfxWin',
      require('assets/games/roulette/audio/payout_jingle.mp3')
    );
  }

  async create(): Promise<void> {
    this.add.image(400, 300, 'tableBg');
    this.wheel = this.add
      .sprite(400, 300, 'rouletteSprites', 'wheel_0')
      .setOrigin(0.5);

    // Sample chips
    this.add.image(650, 500, 'chipsAtlas', 'chip_1');
    this.add.image(700, 500, 'chipsAtlas', 'chip_5');

    // Spin button
    this.button = this.add.image(400, 550, 'spinButton').setInteractive();
    this.button.on('pointerup', () => this.handleSpin());

    // Confetti animation
    this.anims.create({
      key: 'confettiBurst',
      frames: this.anims.generateFrameNames('confetti', {
        start: 0,
        end: 59,
        prefix: 'frame_',
        zeroPad: 3,
      }),
      frameRate: 60,
      repeat: 0,
    });

    // Balance display
    this.balanceText = this.add.text(50, 50, 'Balance: ...', {
      font: '20px Arial',
      color: '#ffffff',
    });
    const bal = await getBalance();
    this.balanceText.setText(`Balance: ${bal.balance}`);
  }

  update(): void {
    // future updates
  }

  private async handleSpin(): Promise<void> {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.button.disableInteractive();

    const debitRes = await debit(this.betAmount);
    if (!debitRes.success) {
      console.error('Debit failed');
      return this.resetSpin();
    }
    this.balanceText.setText(`Balance: ${debitRes.balance}`);

    const { seed } = await initRNG('roulette');
    const outcomeNum = parseInt(seed.slice(-2), 36) % 37;
    const segmentAngle = 360 / 37;
    const rotations = 5;
    const finalAngle = 360 * rotations + outcomeNum * segmentAngle;

    this.sound.play('sfxSpin');
    this.tweens.add({
      targets: this.wheel,
      angle: finalAngle,
      duration: 4000,
      ease: 'Cubic.easeOut',
      onComplete: async () => {
        let payout = 0;
        if (outcomeNum !== 0 && outcomeNum % 2 === 1) {
          payout = this.betAmount * 2;
        }
        if (payout > 0) {
          const creditRes = await credit(payout);
          this.balanceText.setText(`Balance: ${creditRes.balance}`);
          this.sound.play('sfxWin');
          this.add.sprite(400, 300, 'confetti').play('confettiBurst');
        } else {
          this.sound.play('sfxDrop');
        }
        this.showOutcome(outcomeNum);
        this.resetSpin();
      },
    });
  }

  private showOutcome(num: number): void {
    const str = num.toString().padStart(2, '0');
    str.split('').forEach((d, i) => {
      this.add.image(300 + i * 32, 100, 'digitAtlas', `digit_${d}`);
    });
  }

  private resetSpin(): void {
    this.isSpinning = false;
    this.button.setInteractive();
  }
}
