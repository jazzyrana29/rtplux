// src/scenes/RouletteScene.ts

import Phaser from 'phaser';
import { credit, debit, getBalance } from '../services/wallet';
import { initRNG } from '../services/rng';

type Bet = {
  number: number;
  amount: number;
  sprite: Phaser.GameObjects.Image;
};

const CELL_WIDTH = 80;
const CELL_HEIGHT = 40;

export default class RouletteScene extends Phaser.Scene {
  private wheel!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics;
  private spinBtn!: Phaser.GameObjects.Image;
  private clearBtn!: Phaser.GameObjects.Text;
  private balanceText!: Phaser.GameObjects.Text;
  private outcomeText!: Phaser.GameObjects.Text;
  private spinSound!: Phaser.Sound.BaseSound;
  private dropSound!: Phaser.Sound.BaseSound;
  private payoutSound!: Phaser.Sound.BaseSound;
  private isSpinning = false;

  // betting state
  private selectedDenom = 1;
  private chipImages: Record<number, Phaser.GameObjects.Image> = {};
  private bets: Bet[] = [];

  constructor() {
    super({ key: 'RouletteScene' });
  }

  preload(): void {
    // ── Background, button, wheel & confetti ─────────────────────
    this.load.image('tableBg', '/public/assets/games/roulette/tableBg.webp');
    this.load.image(
      'spinButton',
      '/public/assets/games/roulette/spin_button.webp'
    );
    this.load.atlas(
      'rouletteSprites',
      '/public/assets/games/roulette/rouletteSprites.webp',
      '/public/assets/games/roulette/rouletteSprites.json'
    );
    this.load.atlas(
      'confetti',
      '/public/assets/games/roulette/confetti-0.webp',
      '/public/assets/games/roulette/confetti-0.json'
    );

    // ── NEW: single atlas for all four chip graphics ─────────────
    this.load.atlas(
      'chips',
      '/public/assets/games/roulette/chips.png',
      '/public/assets/games/roulette/chips.json'
    );

    // ── Audio ────────────────────────────────────────────────────
    this.load.audio(
      'spinSound',
      '/public/assets/games/roulette/audio/roulette_spin.mp3'
    );
    this.load.audio(
      'dropSound',
      '/public/assets/games/roulette/audio/ball_drop_click.mp3'
    );
    this.load.audio(
      'payoutSound',
      '/public/assets/games/roulette/audio/payout_jingle.mp3'
    );
  }

  async create(): Promise<void> {
    // ── Sounds ───────────────────────────────────────────────────
    this.spinSound = this.sound.add('spinSound');
    this.dropSound = this.sound.add('dropSound');
    this.payoutSound = this.sound.add('payoutSound');

    // ── Table background & wheel ────────────────────────────────
    this.add.image(400, 300, 'tableBg').setDisplaySize(800, 600);
    if (this.textures.exists('rouletteSprites')) {
      this.wheel = this.add
        .sprite(400, 300, 'rouletteSprites', 'sprite.png')
        .setOrigin(0.5)
        .setDisplaySize(360, 360);
    } else {
      this.createFallbackWheel();
    }

    // ── Balance display ─────────────────────────────────────────
    const bal = await getBalance();
    this.balanceText = this.add
      .text(20, 20, `Balance: $${bal.balance}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setShadow(2, 2, '#000000', 2);

    // ── Chip palette (load from new 'chips' atlas) ──────────────
    this.drawChipPalette();

    // ── Clear Bets button ───────────────────────────────────────
    this.clearBtn = this.add
      .text(700, 20, '[Clear Bets]', {
        fontSize: '18px',
        color: '#ff4444',
        fontStyle: 'bold',
      })
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.clearAllBets());

    // ── Spin button ─────────────────────────────────────────────
    this.spinBtn = this.add
      .image(400, 530, 'spinButton')
      .setDisplaySize(160, 60)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.handleSpin());

    // ── Outcome text ────────────────────────────────────────────
    this.outcomeText = this.add
      .text(400, 150, '', {
        fontSize: '48px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 2);

    // ── Enable betting on each number‐cell ──────────────────────
    this.enableTableBetting();

    // ── Confetti animation setup ────────────────────────────────
    if (this.textures.exists('confetti')) {
      this.anims.create({
        key: 'confettiBurst',
        frames: this.anims.generateFrameNames('confetti', {
          start: 0,
          end: 59,
          prefix: 'confetti_frames/frame_',
          suffix: '.png',
          zeroPad: 3,
        }),
        frameRate: 30,
        repeat: 0,
      });
    }
  }

  private drawChipPalette() {
    const denominations = [1, 5, 25, 100];
    const y = 550;
    denominations.forEach((d, i) => {
      const x = 150 + i * 120;
      const img = this.add
        .image(x, y, 'chips', `chip_${d}.png`)
        .setDisplaySize(64, 64)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.selectChip(d));

      this.chipImages[d] = img;

      // label below
      this.add
        .text(x, y + 40, `$${d}`, {
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      if (i === 0) this.selectChip(d);
    });
  }

  private selectChip(denom: number) {
    this.selectedDenom = denom;
    // clear all tints
    Object.values(this.chipImages).forEach((img) => img.clearTint());
    // highlight selected
    this.chipImages[denom].setTint(0x00ff00);
  }

  private enableTableBetting() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const startX = centerX - CELL_WIDTH;
    const startY = centerY - (12 * CELL_HEIGHT) / 2 + CELL_HEIGHT / 2;

    // zero cell
    this.add
      .rectangle(
        centerX,
        startY - CELL_HEIGHT,
        CELL_WIDTH * 3,
        CELL_HEIGHT,
        0,
        0
      )
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.placeBet(0, centerX, startY - CELL_HEIGHT));

    // 1–36 grid
    for (let n = 1; n <= 36; n++) {
      const row = Math.floor((n - 1) / 3);
      const col = (n - 1) % 3;
      const x = startX + col * CELL_WIDTH;
      const y = startY + row * CELL_HEIGHT;

      this.add
        .rectangle(x, y, CELL_WIDTH, CELL_HEIGHT, 0, 0)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.placeBet(n, x, y));
    }
  }

  private async placeBet(num: number, x: number, y: number) {
    const denom = this.selectedDenom;
    // debit stake
    const dr = await debit(denom);
    if (!dr.success) {
      this.outcomeText.setText('Insufficient funds!');
      return;
    }
    this.balanceText.setText(`Balance: $${dr.balance}`);

    // show chip on board
    const sprite = this.add
      .image(x, y, 'chips', `chip_${denom}.png`)
      .setDisplaySize(32, 32);

    this.bets.push({ number: num, amount: denom, sprite });
  }

  private async clearAllBets() {
    if (this.bets.length === 0) {
      this.outcomeText.setText('No bets to clear.');
      return;
    }
    const refund = this.bets.reduce((sum, b) => sum + b.amount, 0);
    const cr = await credit(refund);
    this.balanceText.setText(`Balance: $${cr.balance}`);
    this.bets.forEach((b) => b.sprite.destroy());
    this.bets = [];
    this.outcomeText.setText('Bets cleared');
  }

  private async handleSpin() {
    if (this.isSpinning) return;
    if (this.bets.length === 0) {
      this.outcomeText.setText('Place at least one bet!');
      return;
    }
    this.isSpinning = true;
    this.spinBtn.disableInteractive();
    this.outcomeText.setText('');
    this.spinSound.play();

    const { seed } = await initRNG('roulette');
    const outcomeNum = parseInt(seed.slice(-2), 36) % 37;
    const angle = 360 * 5 + (360 / 37) * outcomeNum;

    this.tweens.add({
      targets: this.wheel,
      angle,
      duration: 3000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.dropSound.play();
        this.resolveBets(outcomeNum);
      },
    });
  }

  private async resolveBets(winningNum: number) {
    let payoutTotal = 0;
    this.bets.forEach((b) => {
      if (b.number === winningNum) {
        payoutTotal += b.amount * 36; // 35:1 + stake
      }
      b.sprite.destroy();
    });
    this.bets = [];

    if (payoutTotal > 0) {
      const cr = await credit(payoutTotal);
      this.balanceText.setText(`Balance: $${cr.balance}`);
      this.payoutSound.play();
      this.add.sprite(400, 300, 'confetti').play('confettiBurst').setScale(1.5);
      this.outcomeText.setText(`Number ${winningNum}! You win $${payoutTotal}`);
    } else {
      this.outcomeText.setText(`No hits—try again! (${winningNum})`);
    }

    this.time.delayedCall(2000, () => this.resetSpin());
  }

  private resetSpin() {
    this.isSpinning = false;
    this.spinBtn.setInteractive({ cursor: 'pointer' });
  }

  private createFallbackWheel(): void {
    const graphics = this.add.graphics({ x: 400, y: 300 });
    graphics.fillStyle(0x8b4513);
    graphics.fillCircle(0, 0, 180);
    graphics.fillStyle(0x000000);
    graphics.fillCircle(0, 0, 170);
    for (let i = 0; i < 37; i++) {
      const start = (i / 37) * Math.PI * 2;
      const end = start + (Math.PI * 2) / 37;
      const color = i === 0 ? 0x00ff00 : i % 2 === 0 ? 0xff0000 : 0x000000;
      graphics.fillStyle(color);
      graphics.slice(0, 0, 160, start, end, false);
      graphics.fillPath();
    }
    this.wheel = graphics as any;
  }
}
