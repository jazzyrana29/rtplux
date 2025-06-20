// src/scenes/RouletteScene.ts

import Phaser from 'phaser';
import { credit, debit, getBalance } from '../services/wallet';
import { initRNG } from '../services/rng';

type Bet = { number: number; denom: number; sprite: Phaser.GameObjects.Image };

export default class RouletteScene extends Phaser.Scene {
  // Text & sound refs
  private balanceText!: Phaser.GameObjects.Text;
  private outcomeText!: Phaser.GameObjects.Text;
  private spinSound!: Phaser.Sound.BaseSound;
  private dropSound!: Phaser.Sound.BaseSound;
  private payoutSound!: Phaser.Sound.BaseSound;

  // Betting state
  private chipCounts: Record<number, number> = { 1: 0, 5: 0, 25: 0, 100: 0 };
  private selectedDenom = 1;
  private chipImages: Record<number, Phaser.GameObjects.Image> = {};
  private bets: Bet[] = [];

  // Layout metrics
  private tableX!: number;
  private tableY!: number;
  private tableW!: number;
  private tableH!: number;
  private cellW!: number;
  private cellH!: number;

  constructor() {
    super({ key: 'RouletteScene' });
  }

  preload(): void {
    this.load.atlas(
      'chips',
      '/public/assets/games/roulette/chips.png',
      '/public/assets/games/roulette/chips.json'
    );
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

    // ── Draw the table and record metrics ────────────────────────
    this.drawTable();

    // ── Show balance & ask to buy $1 chips ───────────────────────
    const bal = await getBalance();
    this.balanceText = this.add
      .text(this.tableX, this.tableY - 40, `Balance: $${bal.balance}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setShadow(2, 2, '#000', 2);
    await this.buyChips(bal.balance);

    // ── Outcome text (centered above table) ─────────────────────
    this.outcomeText = this.add
      .text(this.scale.width / 2, this.tableY - 40, '', {
        fontSize: '32px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // ── Draw controls: chips, withdraw, spin ────────────────────
    this.drawChipPalette();
    this.drawWithdraw();
    this.createSpinButton();

    // ── Enable betting by clicking cells ────────────────────────
    this.enableTableBetting();

    // ── Prepare confetti animation ──────────────────────────────
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

  private async buyChips(balance: number) {
    const qtyStr =
      prompt(`You have $${balance}. How many $1 chips to buy?`, `${balance}`) ||
      '0';
    const qty = Math.min(Math.max(parseInt(qtyStr, 10) || 0, 0), balance);
    if (qty > 0) {
      const dr = await debit(qty);
      this.balanceText.setText(`Balance: $${dr.balance}`);
      this.chipCounts[1] = qty;
    }
  }

  private drawTable() {
    const { width, height } = this.scale;
    // 80% width, 60% height, centered
    this.tableW = width * 0.8;
    this.tableH = height * 0.6;
    this.tableX = (width - this.tableW) / 2;
    this.tableY = (height - this.tableH) / 2;
    this.cellW = this.tableW / 3;
    this.cellH = this.tableH / 13; // 1 row for zero + 12 rows of three

    const g = this.add.graphics().lineStyle(2, 0xffffff);

    // Zero row
    g.strokeRect(this.tableX, this.tableY, this.tableW, this.cellH);
    this.add
      .text(this.tableX + this.tableW / 2, this.tableY + this.cellH / 2, '0', {
        fontSize: '20px',
        color: '#fff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Rows 1–36
    for (let n = 1; n <= 36; n++) {
      const row = Math.floor((n - 1) / 3);
      const col = (n - 1) % 3;
      const x = this.tableX + col * this.cellW;
      const y = this.tableY + this.cellH + row * this.cellH;
      g.strokeRect(x, y, this.cellW, this.cellH);
      this.add
        .text(x + this.cellW / 2, y + this.cellH / 2, `${n}`, {
          fontSize: '18px',
          color: '#fff',
        })
        .setOrigin(0.5);
    }
  }

  private enableTableBetting() {
    // Zero cell
    this.add
      .rectangle(
        this.tableX + this.tableW / 2,
        this.tableY + this.cellH / 2,
        this.tableW,
        this.cellH,
        0,
        0
      )
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () =>
        this.placeBet(
          0,
          this.tableX + this.tableW / 2,
          this.tableY + this.cellH / 2
        )
      );

    // 1–36 cells
    for (let n = 1; n <= 36; n++) {
      const row = Math.floor((n - 1) / 3);
      const col = (n - 1) % 3;
      const x = this.tableX + col * this.cellW + this.cellW / 2;
      const y = this.tableY + this.cellH + row * this.cellH + this.cellH / 2;
      this.add
        .rectangle(x, y, this.cellW, this.cellH, 0, 0)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.placeBet(n, x, y));
    }
  }

  private async placeBet(num: number, x: number, y: number) {
    if (this.chipCounts[this.selectedDenom] <= 0) {
      this.outcomeText.setText(`No $${this.selectedDenom} chips left!`);
      return;
    }
    this.chipCounts[this.selectedDenom]--;
    this.updateChipPalette();

    // bottom row has 5 equal segments
    const segments = 5;
    const segW = this.tableW / segments;
    // icon size = 60% of segment width
    const iconSize = segW * 0.6;

    const sprite = this.add
      .image(x, y, 'chips', `chip${this.selectedDenom}.png`)
      .setDisplaySize(iconSize, iconSize);
    this.bets.push({ number: num, denom: this.selectedDenom, sprite });
  }

  private drawChipPalette() {
    const denoms = [1, 5, 25, 100];
    const segments = 5; // 4 chips + SPIN
    const segW = this.tableW / segments;
    const y = this.tableY + this.tableH + this.cellH * 1.5;
    const iconSize = segW * 0.6;

    denoms.forEach((d, i) => {
      const x = this.tableX + segW * (i + 0.5);
      const img = this.add
        .image(x, y, 'chips', `chip${d}.png`)
        .setDisplaySize(iconSize, iconSize)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.selectDenom(d));
      this.chipImages[d] = img;

      this.add
        .text(x, y + iconSize * 0.6, `x${this.chipCounts[d]}`, {
          fontSize: '20px',
          color: '#fff',
        })
        .setOrigin(0.5);

      if (i === 0) this.selectDenom(d);
    });
  }

  private selectDenom(d: number) {
    this.selectedDenom = d;
    Object.values(this.chipImages).forEach((img) => img.clearTint());
    this.chipImages[d].setTint(0x00ff00);
  }

  private updateChipPalette() {
    Object.entries(this.chipImages).forEach(([den, img]) => {
      const count = this.chipCounts[+den];
      this.children.list.forEach((c) => {
        if (
          c instanceof Phaser.GameObjects.Text &&
          Math.abs(c.x - img.x) < 1 &&
          c.y > img.y
        ) {
          c.setText(`x${count}`);
        }
      });
    });
  }

  private drawWithdraw() {
    this.add
      .text(this.tableX + this.tableW - 100, this.tableY - 40, 'Withdraw', {
        fontSize: '18px',
        color: '#88ff88',
        backgroundColor: '#003300',
        padding: { x: 8, y: 4 },
      })
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.withdrawChips());
  }

  private async withdrawChips() {
    const total = Object.entries(this.chipCounts).reduce(
      (sum, [d, c]) => sum + Number(d) * c,
      0
    );
    if (total === 0) {
      this.outcomeText.setText('No chips to withdraw.');
      return;
    }
    const cr = await credit(total);
    this.balanceText.setText(`Balance: $${cr.balance}`);
    this.chipCounts = { 1: 0, 5: 0, 25: 0, 100: 0 };
    this.updateChipPalette();
    this.outcomeText.setText(`Withdrew ${total} chips`);
  }

  private createSpinButton() {
    const segments = 5;
    const segW = this.tableW / segments;
    const x = this.tableX + segW * (segments - 0.5);
    const y = this.tableY + this.tableH + this.cellH * 1.5;
    const size = segW * 0.6;

    this.add
      .image(x, y, 'spinButton')
      .setDisplaySize(size, size)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.handleSpin());
  }

  private async handleSpin() {
    if (this.bets.length === 0) {
      this.outcomeText.setText('Place at least one bet!');
      return;
    }
    this.spinSound.play();

    const { seed } = await initRNG('roulette');
    const win = parseInt(seed.slice(-2), 36) % 37;

    const wheel = this.add
      .sprite(
        this.tableX + this.tableW / 2,
        this.tableY + this.tableH / 2,
        'rouletteSprites',
        'sprite.png'
      )
      .setDisplaySize(this.tableW * 0.45, this.tableW * 0.45);

    this.tweens.add({
      targets: wheel,
      angle: 360 * 5 + (360 / 37) * win,
      duration: 3000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        wheel.destroy();
        this.dropSound.play();
        this.resolveBets(win);
      },
    });
  }

  private async resolveBets(win: number) {
    let won = 0;
    this.bets.forEach((b) => {
      b.sprite.destroy();
      if (b.number === win) {
        won += b.denom * 2;
        this.chipCounts[b.denom] += 2;
      }
    });
    this.bets = [];
    this.updateChipPalette();

    if (won > 0) {
      this.payoutSound.play();
      this.outcomeText.setText(`Hit ${win}! +${won} chips`);
      this.add
        .sprite(
          this.tableX + this.tableW / 2,
          this.tableY + this.tableH / 2,
          'confetti'
        )
        .play('confettiBurst')
        .setScale(1.5);
    } else {
      this.outcomeText.setText(`No hits—${win}`);
    }
  }
}
