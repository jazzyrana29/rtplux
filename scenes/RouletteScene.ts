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

    // ── Draw table & record metrics ──────────────────────────────
    this.drawTable();

    // ── Balance display & initial load ──────────────────────────
    const bal = await getBalance();
    this.currentBalance = bal.balance;
    this.balanceText = this.add
      .text(this.tableX, this.tableY - 40, `Balance: $${this.currentBalance}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setShadow(2, 2, '#000', 2);

    // ── Outcome text (for errors/wins) ──────────────────────────
    this.outcomeText = this.add
      .text(this.scale.width / 2, this.tableY - 40, '', {
        fontSize: '32px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // ── Controls: Buy, Withdraw, Chips, Spin ────────────────────
    this.createBuyButton();
    this.drawWithdraw();
    this.drawChipPalette();
    this.createSpinButton();

    // ── Betting interaction ─────────────────────────────────────
    this.enableTableBetting();

    // ── Purchase UI (hidden until Buy clicked) ──────────────────
    this.buildPurchaseUI();

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

  // ── Draws the roulette table grid via Graphics/Text ─────────
  private drawTable() {
    const { width, height } = this.scale;
    this.tableW = width * 0.8;
    this.tableH = height * 0.6;
    this.tableX = (width - this.tableW) / 2;
    this.tableY = (height - this.tableH) / 2;
    this.cellW = this.tableW / 3;
    this.cellH = this.tableH / 13; // zero + 12 rows

    const g = this.add.graphics().lineStyle(2, 0xffffff);
    // zero
    g.strokeRect(this.tableX, this.tableY, this.tableW, this.cellH);
    this.add
      .text(this.tableX + this.tableW / 2, this.tableY + this.cellH / 2, '0', {
        fontSize: '20px',
        color: '#fff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // 1–36
    for (let n = 1; n <= 36; n++) {
      const row = Math.floor((n - 1) / 3),
        col = (n - 1) % 3;
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

  // ── Enables clicking on each table cell to place bets ────────
  private enableTableBetting() {
    // zero slot
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

    // 1–36 slots
    for (let n = 1; n <= 36; n++) {
      const row = Math.floor((n - 1) / 3),
        col = (n - 1) % 3;
      const x = this.tableX + col * this.cellW + this.cellW / 2;
      const y = this.tableY + this.cellH + row * this.cellH + this.cellH / 2;
      this.add
        .rectangle(x, y, this.cellW, this.cellH, 0, 0)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.placeBet(n, x, y));
    }
  }

  // ── Place a chip on the board if available ──────────────────
  private async placeBet(num: number, x: number, y: number) {
    if (this.chipCounts[this.selectedDenom] <= 0) {
      this.outcomeText.setText(`No $${this.selectedDenom} chips left!`);
      return;
    }
    this.chipCounts[this.selectedDenom]--;
    this.updateChipPalette();

    const segW = this.tableW / 5;
    const iconSize = segW * 0.6;
    const sprite = this.add
      .image(x, y, 'chips', `chip${this.selectedDenom}.png`)
      .setDisplaySize(iconSize, iconSize);

    this.bets.push({ number: num, denom: this.selectedDenom, sprite });
  }

  // ── Draws the 4‐chip palette below the table ────────────────
  private drawChipPalette() {
    const denoms = [1, 5, 25, 100];
    const segW = this.tableW / 5;
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

  // ── Adds a “Buy chips” button next to Withdraw ───────────────
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

  // ── Builds the purchase overlay UI (initially hidden) ───────
  private buildPurchaseUI() {
    this.purchaseContainer = this.add.container(0, 0).setVisible(false);

    // overlay
    const overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000, 0.6)
      .setOrigin(0, 0);
    this.purchaseContainer.add(overlay);

    // panel
    const w = this.scale.width * 0.6,
      h = this.scale.height * 0.5;
    const x = (this.scale.width - w) / 2,
      y = (this.scale.height - h) / 2;
    const panel = this.add
      .rectangle(x, y, w, h, 0x003300)
      .setOrigin(0, 0)
      .setStrokeStyle(4, 0xffff00);
    this.purchaseContainer.add(panel);

    // title
    const title = this.add
      .text(this.scale.width / 2, y + 30, 'Buy Chips', {
        fontSize: '32px',
        color: '#ff0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.purchaseContainer.add(title);

    // chip options
    const denoms = [1, 5, 25, 100];
    const startX = x + w * 0.15;
    const gapX = (w * 0.7) / (denoms.length - 1);
    denoms.forEach((d, i) => {
      const px = startX + gapX * i;
      const py = y + h * 0.3;
      const icon = this.add
        .image(px, py, 'chips', `chip${d}.png`)
        .setDisplaySize(64, 64)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.addPurchase(d));
      this.purchaseContainer.add(icon);

      const txt = this.add
        .text(px, py + 50, 'x0', { fontSize: '20px', color: '#fff' })
        .setOrigin(0.5);
      this.purchaseContainer.add(txt);
    });

    // total
    this.purchaseTotalText = this.add
      .text(this.scale.width / 2, y + h * 0.6, 'Total: $0', {
        fontSize: '24px',
        color: '#fff',
      })
      .setOrigin(0.5);
    this.purchaseContainer.add(this.purchaseTotalText);

    // confirm & cancel
    this.confirmBtn = this.add
      .text(this.scale.width / 2 - 80, y + h * 0.8, 'Confirm', {
        fontSize: '20px',
        color: '#0f0',
        backgroundColor: '#003300',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.confirmPurchase());
    this.cancelBtn = this.add
      .text(this.scale.width / 2 + 80, y + h * 0.8, 'Cancel', {
        fontSize: '20px',
        color: '#f44',
        backgroundColor: '#300',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.hidePurchaseUI());
    this.purchaseContainer.add([this.confirmBtn, this.cancelBtn]);
  }

  private showPurchaseUI() {
    this.purchaseCounts = { 1: 0, 5: 0, 25: 0, 100: 0 };
    this.updatePurchaseUI();
    this.purchaseContainer.setVisible(true);
  }

  private hidePurchaseUI() {
    this.purchaseContainer.setVisible(false);
  }

  private addPurchase(denom: number) {
    const totalSoFar = Object.entries(this.purchaseCounts).reduce(
      (sum, [d, c]) => sum + Number(d) * c,
      0
    );
    if (totalSoFar + denom > this.currentBalance) return;
    this.purchaseCounts[denom]++;
    this.updatePurchaseUI();
  }

  private updatePurchaseUI() {
    // update each “x#” below chips
    this.purchaseContainer.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.Text && /^x\d/.test(child.text)) {
        // Narrow the type so .x and .text are available
        const txt = child as Phaser.GameObjects.Text;
        const xPos = txt.x;

        // Find the matching chip icon by comparing its x‐coordinate
        const denom = [1, 5, 25, 100].find((d) => {
          const img = this.purchaseContainer.list.find(
            (c) =>
              c instanceof Phaser.GameObjects.Image &&
              (c as Phaser.GameObjects.Image).frame.name === `chip${d}.png` &&
              Math.abs((c as Phaser.GameObjects.Image).x - xPos) < 2
          );
          return !!img;
        });

        if (denom !== undefined) {
          txt.setText(`x${this.purchaseCounts[denom]}`);
        }
      }
    });

    // update the total cost
    const total = Object.entries(this.purchaseCounts).reduce(
      (s, [d, c]) => s + Number(d) * c,
      0
    );
    this.purchaseTotalText.setText(`Total: $${total}`);
  }

  private async confirmPurchase() {
    const total = Object.entries(this.purchaseCounts).reduce(
      (s, [d, c]) => s + Number(d) * c,
      0
    );
    if (total <= 0) return;
    const dr = await debit(total);
    this.currentBalance = dr.balance;
    this.balanceText.setText(`Balance: $${dr.balance}`);
    Object.entries(this.purchaseCounts).forEach(([d, c]) => {
      this.chipCounts[+d] += c;
    });
    this.updateChipPalette();
    this.hidePurchaseUI();
  }

  // ── Withdraw chips back to balance ───────────────────────────
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
      (s, [d, c]) => s + Number(d) * c,
      0
    );
    if (total === 0) {
      this.outcomeText.setText('No chips to withdraw.');
      return;
    }
    const cr = await credit(total);
    this.currentBalance = cr.balance;
    this.balanceText.setText(`Balance: $${cr.balance}`);
    this.chipCounts = { 1: 0, 5: 0, 25: 0, 100: 0 };
    this.updateChipPalette();
    this.outcomeText.setText(`Withdrew ${total} chips`);
  }

  // ── SPIN button in segment 5 ────────────────────────────────
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
