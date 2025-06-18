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
    // Atlases
    this.load.atlas(
      'rouletteSprites',
      'assets/games/roulette/roulette.webp',
      'assets/games/roulette/roulette.json'
    );
    this.load.atlas(
      'chipsAtlas',
      'assets/games/roulette/chips.webp',
      'assets/games/roulette/chips.json'
    );
    // Single images
    this.load.image('tableBg', 'assets/games/roulette/tableBg.webp');
    this.load.image('spinButton', 'assets/games/roulette/spin_button.webp');
    this.load.atlas(
      'iconsAtlas',
      'assets/games/roulette/icons.webp',
      'assets/games/roulette/icons.json'
    );
    // Confetti
    this.load.atlas(
      'confetti',
      'assets/games/roulette/confetti.webp',
      'assets/games/roulette/confetti.json'
    );
    // Digits
    this.load.atlas(
      'digitAtlas',
      'assets/games/roulette/casino_digits_sprite_sheet.webp',
      'assets/games/roulette/casino_digits_sprite_sheet.json'
    );
    // Audio
    this.load.audio('sfxSpin', 'assets/games/roulette/roulette_spin.mp3');
    this.load.audio('sfxDrop', 'assets/games/roulette/ball_drop_click.mp3');
    this.load.audio('sfxWin', 'assets/games/roulette/payout_jingle.mp3');
  }

  async create(): Promise<void> {
    // Background\
    this.add.image(400, 300, 'tableBg');
    // Wheel
    this.wheel = this.add.sprite(400, 300, 'rouletteSprites', 'wheel_0');
    this.wheel.setOrigin(0.5);
    // Chips sample
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
    // Balance text
    this.balanceText = this.add.text(50, 50, 'Balance: ...', {
      font: '20px Arial',
      color: '#ffffff',
    });
    const bal = await getBalance();
    this.balanceText.setText(`Balance: ${bal.balance}`);
  }

  update(time: number, delta: number): void {
    // future updates
  }

  private async handleSpin(): Promise<void> {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.button.disableInteractive();

    // Debit bet
    const debitRes = await debit(this.betAmount);
    if (!debitRes.success) {
      console.error('Debit failed');
      this.resetSpin();
      return;
    }
    this.balanceText.setText(`Balance: ${debitRes.balance}`);

    // Init RNG
    const { seed, hash } = await initRNG('roulette');
    // Determine outcome (dummy): parse seed
    const outcomeNum = parseInt(seed.slice(-2), 36) % 37;
    const segmentAngle = 360 / 37;
    const rotations = 5;
    const finalAngle = 360 * rotations + outcomeNum * segmentAngle;

    // Play spin sound
    this.sound.play('sfxSpin');
    // Animate wheel
    this.tweens.add({
      targets: this.wheel,
      angle: finalAngle,
      duration: 4000,
      ease: 'Cubic.easeOut',
      onComplete: async () => {
        // Determine payout: dummy rule (odd numbers pay 2x)
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
    // Display outcome digits
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
