// src/scenes/RouletteScene.ts

import Phaser from 'phaser';
import { credit, debit, getBalance } from '../services/wallet';
import { initRNG } from '../services/rng';

type Bet = { number: number; denom: number; sprite: Phaser.GameObjects.Image };

export default class RouletteScene extends Phaser.Scene {
  // Text & sounds
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

  // Purchase UI
  private buyBtn!: Phaser.GameObjects.Text;
  private purchaseContainer!: Phaser.GameObjects.Container;
  private purchaseCounts: Record<number, number> = {
    1: 0,
    5: 0,
    25: 0,
    100: 0,
  };
  private purchaseTotalText!: Phaser.GameObjects.Text;
  private confirmBtn!: Phaser.GameObjects.Text;
  private cancelBtn!: Phaser.GameObjects.Text;

  // Current dollar balance
  private currentBalance = 0;

  constructor() {
    super({ key: 'RouletteScene' });
  }

  preload(): void {
    // Load chip atlas
    this.load.atlas(
      'chips',
      '/public/assets/games/roulette/chips.png',
      '/public/assets/games/roulette/chips.json'
    );
    // Load spin button
    this.load.image(
      'spinButton',
      '/public/assets/games/roulette/spin_button.webp'
    );
    // Load wheel sprites
    this.load.atlas(
      'rouletteSprites',
      '/public/assets/games/roulette/rouletteSprites.webp',
      '/public/assets/games/roulette/rouletteSprites.json'
    );
    // Load confetti atlas
    this.load.atlas(
      'confetti',
      '/public/assets/games/roulette/confetti-0.webp',
      '/public/assets/games/roulette/confetti-0.json'
    );
    // Load digits atlas for result display (optimized assets)
    this.load.atlas(
      'digits',
      '/public/assets/games/roulette/digitAtlas.png',
      '/public/assets/games/roulette/digitAtlas.json'
    );
    // Load sounds
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
    // Initialize sounds
    this.spinSound = this.sound.add('spinSound');
    this.dropSound = this.sound.add('dropSound');
    this.payoutSound = this.sound.add('payoutSound');

    // Draw table and calculate metrics
    this.drawTable();

    // Fetch and display balance
    const bal = await getBalance();
    this.currentBalance = bal.balance;
    this.balanceText = this.add
      .text(this.tableX, this.tableY - 40, `Balance: $${this.currentBalance}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setShadow(2, 2, '#000', 2);

    // Outcome text (top-left info)
    this.outcomeText = this.add
      .text(this.tableX, this.tableY - this.cellH * 2.8, '', {
        fontSize: '18px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    // Build UI controls
    this.createBuyButton();
    this.drawWithdraw();
    this.drawChipPalette();
    this.createSpinButton();

    // Enable betting on table
    this.enableTableBetting();

    // Build purchase overlay (hidden)
    this.buildPurchaseUI();

    // Prepare confetti animation
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

  private drawTable() {
    const { width, height } = this.scale;
    this.tableW = width * 0.8;
    this.tableH = height * 0.6;
    this.tableX = (width - this.tableW) / 2;
    this.tableY = (height - this.tableH) / 2;
    this.cellW = this.tableW / 3;
    this.cellH = this.tableH / 13;

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

    // 1–36 grid
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
      .on('pointerup', () => this.placeBet(0));

    // Cells 1–36
    for (let n = 1; n <= 36; n++) {
      const row = Math.floor((n - 1) / 3);
      const col = (n - 1) % 3;
      const cx = this.tableX + col * this.cellW + this.cellW / 2;
      const cy = this.tableY + this.cellH + row * this.cellH + this.cellH / 2;
      this.add
        .rectangle(cx, cy, this.cellW, this.cellH, 0, 0)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.placeBet(n));
    }
  }

  private async placeBet(num: number) {
    if (this.chipCounts[this.selectedDenom] <= 0) {
      this.outcomeText.setText(`No $${this.selectedDenom} chips left!`);
      return;
    }
    this.chipCounts[this.selectedDenom]--;
    this.updateChipPalette();

    // Determine cell center
    let cx: number, cy: number;
    if (num === 0) {
      cx = this.tableX + this.tableW / 2;
      cy = this.tableY + this.cellH / 2;
    } else {
      const row = Math.floor((num - 1) / 3);
      const col = (num - 1) % 3;
      cx = this.tableX + col * this.cellW + this.cellW / 2;
      cy = this.tableY + this.cellH + row * this.cellH + this.cellH / 2;
    }

    // Compute multi-chip offsets
    const existing = this.bets.filter((b) => b.number === num).length;
    const offsets: [number, number][] = [
      [-0.2, -0.2],
      [0.2, -0.2],
      [-0.2, 0.2],
      [0.2, 0.2],
    ];
    const [ox, oy] = offsets[existing % offsets.length];

    // Chip size fits inside the cell
    const iconSize = Math.min(this.cellW, this.cellH) * 0.5;
    const x = cx + ox * this.cellW * 0.4;
    const y = cy + oy * this.cellH * 0.4;

    const sprite = this.add
      .image(x, y, 'chips', `chip${this.selectedDenom}.png`)
      .setDisplaySize(iconSize, iconSize)
      .setDepth(1);
    this.bets.push({ number: num, denom: this.selectedDenom, sprite });
  }

  private drawChipPalette() {
    const denoms = [1, 5, 25, 100];
    const segW = this.tableW / 5;
    const y = this.tableY + this.tableH + this.cellH * 1.5;
    const iconSize = segW * 0.6;

    denoms.forEach((d, i) => {
      const x = this.tableX + segW * (i + 0.5);
      this.chipImages[d] = this.add
        .image(x, y, 'chips', `chip${d}.png`)
        .setDisplaySize(iconSize, iconSize)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.selectDenom(d));
      this.add
        .text(x, y + iconSize * 0.6, `x${this.chipCounts[d]}`, {
          fontSize: '20px',
          color: '#fff',
        })
        .setOrigin(0.5);

      if (i === 0) {
        this.selectDenom(d);
      }
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

  private createBuyButton() {
    this.buyBtn = this.add
      .text(this.tableX + this.tableW - 300, this.tableY - 40, 'Buy chips', {
        fontSize: '18px',
        color: '#88ffff',
        backgroundColor: '#003333',
        padding: { x: 10, y: 5 },
      })
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.showPurchaseUI());
  }

  private buildPurchaseUI() {
    this.purchaseContainer = this.add
      .container(0, 0)
      .setVisible(false)
      .setDepth(1000);
    const overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6)
      .setOrigin(0, 0);
    this.purchaseContainer.add(overlay);

    const pw = this.scale.width * 0.6;
    const ph = this.scale.height * 0.5;
    const px = (this.scale.width - pw) / 2;
    const py = (this.scale.height - ph) / 2;
    const panel = this.add
      .rectangle(px, py, pw, ph, 0x003300)
      .setOrigin(0, 0)
      .setStrokeStyle(4, 0xffff00);
    this.purchaseContainer.add(panel);

    const title = this.add
      .text(this.scale.width / 2, py + 30, 'Buy Chips', {
        fontSize: '32px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.purchaseContainer.add(title);

    const denoms = [1, 5, 25, 100];
    const startX = px + pw * 0.15;
    const gapX = (pw * 0.7) / (denoms.length - 1);
    denoms.forEach((d, i) => {
      const cx = startX + gapX * i;
      const cy = py + ph * 0.3;
      const icon = this.add
        .image(cx, cy, 'chips', `chip${d}.png`)
        .setDisplaySize(64, 64)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.addPurchase(d));
      const txt = this.add
        .text(cx, cy + 50, 'x0', { fontSize: '20px', color: '#fff' })
        .setOrigin(0.5);
      this.purchaseContainer.add(icon);
      this.purchaseContainer.add(txt);
    });

    this.purchaseTotalText = this.add
      .text(this.scale.width / 2, py + ph * 0.6, 'Total: $0', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.purchaseContainer.add(this.purchaseTotalText);

    this.confirmBtn = this.add
      .text(this.scale.width / 2 - 80, py + ph * 0.8, 'Confirm', {
        fontSize: '20px',
        color: '#00ff00',
        backgroundColor: '#003300',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.confirmPurchase());
    this.cancelBtn = this.add
      .text(this.scale.width / 2 + 80, py + ph * 0.8, 'Cancel', {
        fontSize: '20px',
        color: '#ff4444',
        backgroundColor: '#330000',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.hidePurchaseUI());
    this.purchaseContainer.add(this.confirmBtn);
    this.purchaseContainer.add(this.cancelBtn);
  }

  private showPurchaseUI() {
    this.purchaseCounts = { 1: 0, 5: 0, 25: 0, 100: 0 };
    this.updatePurchaseUI();
    this.purchaseContainer.setVisible(true);
  }

  private hidePurchaseUI() {
    this.purchaseContainer.setVisible(false);
  }

  private addPurchase(d: number) {
    const total = Object.entries(this.purchaseCounts).reduce(
      (s, [den, c]) => s + Number(den) * c,
      0
    );
    if (total + d <= this.currentBalance) {
      this.purchaseCounts[d]++;
      this.updatePurchaseUI();
    }
  }

  private updatePurchaseUI() {
    this.purchaseContainer.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.Text && /^x\d/.test(child.text)) {
        const txt = child as Phaser.GameObjects.Text;
        const xPos = txt.x;
        const denom = [1, 5, 25, 100].find((d) => {
          return (
            this.purchaseContainer.list.find(
              (c) =>
                c instanceof Phaser.GameObjects.Image &&
                (c as Phaser.GameObjects.Image).frame.name === `chip${d}.png` &&
                Math.abs((c as Phaser.GameObjects.Image).x - xPos) < 2
            ) != null
          );
        });
        if (denom !== undefined) {
          txt.setText(`x${this.purchaseCounts[denom]}`);
        }
      }
    });
    const total = Object.entries(this.purchaseCounts).reduce(
      (s, [den, c]) => s + Number(den) * c,
      0
    );
    this.purchaseTotalText.setText(`Total: $${total}`);
  }

  private async confirmPurchase() {
    const total = Object.entries(this.purchaseCounts).reduce(
      (s, [den, c]) => s + Number(den) * c,
      0
    );
    if (total > 0) {
      const dr = await debit(total);
      this.currentBalance = dr.balance;
      this.balanceText.setText(`Balance: $${dr.balance}`);
      Object.entries(this.purchaseCounts).forEach(
        ([den, c]) => (this.chipCounts[+den] += c)
      );
      this.updateChipPalette();
      this.hidePurchaseUI();
    }
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
      (s, [den, c]) => s + Number(den) * c,
      0
    );
    if (total > 0) {
      const cr = await credit(total);
      this.currentBalance = cr.balance;
      this.balanceText.setText(`Balance: $${cr.balance}`);
      this.chipCounts = { 1: 0, 5: 0, 25: 0, 100: 0 };
      this.updateChipPalette();
      this.outcomeText.setText(`Withdrew ${total} chips`);
    } else {
      this.outcomeText.setText('No chips to withdraw.');
    }
  }

  private createSpinButton() {
    const segW = this.tableW / 5;
    const x = this.tableX + segW * 4.5;
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
    // RNG draw
    const { seed } = await initRNG('roulette');
    const win = parseInt(seed.slice(-2), 36) % 37;
    // Wheel animation
    const wheel = this.add
      .sprite(
        this.tableX + this.tableW / 2,
        this.tableY + this.tableH / 2,
        'rouletteSprites',
        'sprite.png'
      )
      .setDisplaySize(this.tableW * 0.45, this.tableW * 0.45)
      .setDepth(1000);
    this.tweens.add({
      targets: wheel,
      angle: 360 * 5 + (360 / 37) * win,
      duration: 3000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        wheel.destroy();
        this.dropSound.play();
        this.showResultDigits(win);
        this.resolveBets(win);
      },
    });
  }

  // Display the win digits above the table header
  // Display the win digits above the header using the digits atlas
  private showResultDigits(win: number) {
    // Convert number to string (no padding) so we pick the actual digits
    const digits = win.toString().split('');

    // Clear out any existing result digits
    this.children.list
      .filter((c) => c.name === 'resultDigit')
      .forEach((c) => c.destroy());

    // Calculate placement
    const size = this.cellH; // square size
    const totalWidth = size * digits.length;
    const startX = this.tableX + (this.tableW - totalWidth) / 2;
    const y = this.tableY - this.cellH * 2.5; // high above header

    // Render each digit
    digits.forEach((d, i) => {
      this.add
        .image(
          startX + i * size,
          y,
          'digits',
          `casino_digits_pngs/digit_${d}.png`
        )
        .setDisplaySize(size, size)
        .setDepth(500)
        .setName('resultDigit');
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
      this.outcomeText.setText(`Hit +${won} chips`);
      const confetti = this.add
        .sprite(
          this.tableX + this.tableW / 2,
          this.tableY + this.tableH / 2,
          'confetti'
        )
        .setScale(1.5);

      // after 2 seconds, destroy it
      this.time.delayedCall(
        2000, // delay in ms
        () => confetti.destroy(), // callback
        [], // args
        this // callback context
      );
    } else {
      this.outcomeText.setText(`No hits`);
    }
  }
}
