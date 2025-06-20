import Phaser from 'phaser';
import { credit, debit, getBalance } from '../services/wallet';
import { initRNG } from '../services/rng';

export default class RouletteScene extends Phaser.Scene {
  private wheel!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics;
  private spinBtn!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private balanceText!: Phaser.GameObjects.Text;
  private outcomeText!: Phaser.GameObjects.Text;
  private spinSound!: Phaser.Sound.BaseSound;
  private dropSound!: Phaser.Sound.BaseSound;
  private payoutSound!: Phaser.Sound.BaseSound;
  private isSpinning = false;

  constructor() {
    super({ key: 'RouletteScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;
    // ── Loading Bar ────────────────────────────────────────────────
    const box = this.add
      .graphics()
      .fillStyle(0x000000, 0.6)
      .fillRect(width / 2 - 160, height / 2 - 30, 320, 60);
    const bar = this.add.graphics();
    this.load.on('progress', (p: number) => {
      bar
        .clear()
        .fillStyle(0xffffff, 1)
        .fillRect(width / 2 - 150, height / 2 - 20, 300 * p, 40);
    });
    this.load.on('complete', () => {
      box.destroy();
      bar.destroy();
    });

    // ── Images & Atlases ──────────────────────────────────────────
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
      'digitAtlas',
      '/public/assets/games/roulette/digitAtlas.webp',
      '/public/assets/games/roulette/digitAtlas.json'
    );
    this.load.atlas(
      'confetti',
      '/public/assets/games/roulette/confetti-0.webp',
      '/public/assets/games/roulette/confetti-0.json'
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

    // ── Table & Wheel ───────────────────────────────────────────
    this.add.image(400, 300, 'tableBg').setDisplaySize(800, 600);
    if (this.textures.exists('rouletteSprites')) {
      this.wheel = this.add
        .sprite(400, 300, 'rouletteSprites', 'sprite.png')
        .setOrigin(0.5)
        .setDisplaySize(360, 360);
    } else {
      this.createFallbackWheel();
    }

    // ── Spin Button ──────────────────────────────────────────────
    this.spinBtn = this.textures.exists('spinButton')
      ? this.add
          .image(400, 530, 'spinButton')
          .setDisplaySize(160, 60)
          .setInteractive()
      : this.add.rectangle(400, 530, 160, 60, 0xffd700).setInteractive();
    if (!this.textures.exists('spinButton')) {
      this.add
        .text(400, 530, 'SPIN', {
          fontSize: '24px',
          color: '#000',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    // …your old hover / click handlers, now replaced with canvas zoom:
    const canvas = this.game.canvas as HTMLCanvasElement;
    this.spinBtn.on('pointerover', () => {
      this.spinBtn.setTint(0xffffaa); // slight glow
      canvas.style.transition = 'transform 0.3s ease';
      canvas.style.transform = 'scale(1.05)';
      canvas.style.zIndex = '1000';
    });
    this.spinBtn.on('pointerout', () => {
      this.spinBtn.clearTint();
      canvas.style.transform = 'scale(1)';
      canvas.style.zIndex = '';
    });
    this.spinBtn.on('pointerup', () => this.handleSpin());

    // ── Balance Text ────────────────────────────────────────────
    this.balanceText = this.add
      .text(20, 20, 'Balance: …', {
        fontSize: '24px',
        color: '#fff',
        fontStyle: 'bold',
      })
      .setShadow(2, 2, '#000', 2);
    const bal = await getBalance();
    this.balanceText.setText(`Balance: $${bal.balance}`);

    // ── Outcome Text (center top) ───────────────────────────────
    this.outcomeText = this.add
      .text(400, 150, '', {
        fontSize: '48px',
        color: '#ff0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000', 2);

    // ── Confetti Animation Setup ────────────────────────────────
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

  private createFallbackWheel() {
    // …same as before…
  }

  private async handleSpin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.spinBtn.disableInteractive();
    this.outcomeText.setText('');
    this.spinSound.play();

    const bet = 100;
    const dr = await debit(bet);
    if (!dr.success) {
      this.outcomeText.setText('Insufficient funds!');
      return this.resetSpin();
    }
    this.balanceText.setText(`Balance: $${dr.balance}`);

    const { seed } = await initRNG('roulette');
    const num = parseInt(seed.slice(-2), 36) % 37;
    const angle = 360 * 5 + (360 / 37) * num;

    this.tweens.add({
      targets: this.wheel,
      angle,
      duration: 3000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.dropSound.play();
        this.handleSpinResult(num, bet);
      },
    });
  }

  private async handleSpinResult(num: number, bet: number) {
    let payout = 0;
    let text = `Number: ${num}`;
    if (num !== 0 && num % 2 === 1) {
      payout = bet * 2;
      text += ' — WIN!';
      const cr = await credit(payout);
      this.balanceText.setText(`Balance: $${cr.balance}`);
      this.payoutSound.play();
      this.add.sprite(400, 300, 'confetti').play('confettiBurst').setScale(1.5);
    } else {
      text += ' — Try again!';
    }
    this.outcomeText.setText(text);
    this.showDigitalOutcome(num);
    this.time.delayedCall(2000, () => this.resetSpin());
  }

  private showDigitalOutcome(num: number) {
    if (!this.textures.exists('digitAtlas')) return;
    const s = num.toString().padStart(2, '0');
    s.split('').forEach((d, i) => {
      this.add
        .image(
          360 + i * 40,
          100,
          'digitAtlas',
          `casino_digits_pngs/digit_${d}.png`
        )
        .setDisplaySize(32, 56)
        .setDepth(10);
    });
  }

  private resetSpin() {
    this.isSpinning = false;
    this.spinBtn.setInteractive();
  }
}
