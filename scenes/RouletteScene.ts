import Phaser from 'phaser';
import { credit, debit, getBalance } from '../services/wallet';
import { initRNG } from '../services/rng';

export default class RouletteScene extends Phaser.Scene {
  private wheel!: Phaser.GameObjects.Sprite;
  private button!: Phaser.GameObjects.Image;
  private isSpinning = false;
  private readonly betAmount = 100;
  private balanceText!: Phaser.GameObjects.Text;
  private outcomeText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'RouletteScene' });
  }

  preload(): void {
    // Remove the base URL setting and use relative paths
    // this.load.setBaseURL("/")

    // Load images with proper Next.js public paths
    this.load.image('tableBg', '/public/assets/games/roulette/tableBg.webp');
    this.load.image(
      'spinButton',
      '/public/assets/games/roulette/spin_button.webp'
    );

    // Load atlases with proper paths
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

    // Add more robust error handling
    this.load.on('loaderror', (file: any) => {
      console.error(`Failed to load ${file.key} from ${file.url}:`, file);
    });

    this.load.on('filecomplete', (key: string) => {
      console.log(`Successfully loaded: ${key}`);
    });

    this.load.on('complete', () => {
      console.log('Asset loading complete');
    });
  }

  async create(): Promise<void> {
    // Background
    this.add.image(400, 300, 'tableBg').setDisplaySize(800, 600);

    // Create a simple wheel using graphics if atlas fails
    if (this.textures.exists('rouletteSprites')) {
      try {
        this.wheel = this.add
          .sprite(400, 300, 'rouletteSprites', 'sprite.png')
          .setOrigin(0.5)
          .setDisplaySize(200, 200);
      } catch (error) {
        console.warn('Failed to create wheel from atlas, using fallback');
        this.createFallbackWheel();
      }
    } else {
      this.createFallbackWheel();
    }

    // Spin button
    if (this.textures.exists('spinButton')) {
      this.button = this.add
        .image(400, 500, 'spinButton')
        .setDisplaySize(150, 50)
        .setInteractive();
    } else {
      // Fallback button
      const buttonBg = this.add.rectangle(400, 500, 150, 50, 0x4caf50);
      const buttonText = this.add
        .text(400, 500, 'SPIN', {
          fontSize: '20px',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      this.button = buttonBg.setInteractive();
    }

    this.button.on('pointerup', () => this.handleSpin());
    this.button.on('pointerover', () => this.button.setTint(0xcccccc));
    this.button.on('pointerout', () => this.button.clearTint());

    // UI Text
    this.balanceText = this.add.text(50, 50, 'Balance: ...', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });

    this.outcomeText = this.add
      .text(400, 150, '', {
        fontSize: '32px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Load initial balance
    const bal = await getBalance();
    this.balanceText.setText(`Balance: $${bal.balance}`);

    // Create confetti animation if available
    this.createConfettiAnimation();
  }

  private createFallbackWheel(): void {
    console.log('Falback wheel created');
    // Create a simple wheel using graphics
    const graphics = this.add.graphics();
    graphics.fillStyle(0x8b4513); // Brown
    graphics.fillCircle(0, 0, 100);
    graphics.fillStyle(0x000000); // Black
    graphics.fillCircle(0, 0, 90);

    // Add some segments
    for (let i = 0; i < 37; i++) {
      const angle = (i / 37) * Math.PI * 2;
      const color = i === 0 ? 0x00ff00 : i % 2 === 0 ? 0xff0000 : 0x000000;
      graphics.fillStyle(color);
      graphics.slice(0, 0, 85, angle, angle + (Math.PI * 2) / 37, false);
      graphics.fillPath();
    }

    graphics.x = 400;
    graphics.y = 300;
    this.wheel = graphics as any;
  }

  private createConfettiAnimation(): void {
    if (this.textures.exists('confetti')) {
      try {
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
      } catch (error) {
        console.warn('Failed to create confetti animation:', error);
      }
    }
  }

  private async handleSpin(): Promise<void> {
    if (this.isSpinning) return;

    this.isSpinning = true;
    this.button.disableInteractive();
    this.outcomeText.setText('');

    // Debit bet amount
    const debitRes = await debit(this.betAmount);
    if (!debitRes.success) {
      this.outcomeText.setText('Insufficient funds!');
      this.resetSpin();
      return;
    }

    this.balanceText.setText(`Balance: $${debitRes.balance}`);

    // Generate outcome
    const { seed } = await initRNG('roulette');
    const outcomeNum = Number.parseInt(seed.slice(-2), 36) % 37;
    const finalAngle = 360 * 5 + (360 / 37) * outcomeNum;

    // Spin animation
    this.tweens.add({
      targets: this.wheel,
      angle: finalAngle,
      duration: 3000,
      ease: 'Cubic.easeOut',
      onComplete: async () => {
        await this.handleSpinResult(outcomeNum);
      },
    });
  }

  private async handleSpinResult(outcomeNum: number): Promise<void> {
    let payout = 0;
    let resultText = `Number: ${outcomeNum}`;

    // Simple payout logic - win on odd numbers (except 0)
    if (outcomeNum !== 0 && outcomeNum % 2 === 1) {
      payout = this.betAmount * 2;
      resultText += ' - WIN!';

      const creditRes = await credit(payout);
      this.balanceText.setText(`Balance: $${creditRes.balance}`);

      // Show confetti if available
      if (this.anims.exists('confettiBurst')) {
        try {
          this.add.sprite(400, 300, 'confetti').play('confettiBurst');
        } catch (error) {
          console.warn('Failed to show confetti:', error);
        }
      }
    } else {
      resultText += ' - Try again!';
    }

    this.outcomeText.setText(resultText);
    this.showOutcome(outcomeNum);

    // Reset after delay
    this.time.delayedCall(2000, () => {
      this.resetSpin();
    });
  }

  private showOutcome(num: number): void {
    // Try to show digital outcome if atlas is available
    if (this.textures.exists('digitAtlas')) {
      try {
        const str = num.toString().padStart(2, '0');
        str.split('').forEach((d, i) => {
          this.add
            .image(
              350 + i * 40,
              100,
              'digitAtlas',
              `casino_digits_pngs/digit_${d}.png`
            )
            .setDisplaySize(30, 50);
        });
      } catch (error) {
        console.warn('Failed to show digital outcome:', error);
      }
    }
  }

  private resetSpin(): void {
    this.isSpinning = false;
    this.button.setInteractive();
  }
}
