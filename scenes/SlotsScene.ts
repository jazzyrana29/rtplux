import Phaser from 'phaser';
import { useGameStore } from '../stores/gameStore';
import { trackGameEvent, trackGameResult } from '../lib/posthog';
import { trackGameError, trackPerformance } from '../lib/sentry';
import { SLOTS_CONSTANTS } from '../constants/slots';
import { BaseGameScene } from './BaseGameScene';

type SlotSymbol =
  | 'cherry'
  | 'lemon'
  | 'orange'
  | 'plum'
  | 'bell'
  | 'bar'
  | 'seven';

export default class SlotsScene extends BaseGameScene {
  // Slots-specific sounds
  private spinSound!: Phaser.Sound.BaseSound;
  private stopSound!: Phaser.Sound.BaseSound;

  // Game state
  private reels: SlotSymbol[][] = [];
  private isSpinning = false;
  private currentBet = 1;
  private activePaylines = 5;

  // UI elements
  private reelSprites: Phaser.GameObjects.Rectangle[][] = [];
  private spinBtn!: Phaser.GameObjects.Text;
  private maxBetBtn!: Phaser.GameObjects.Text;
  private betText!: Phaser.GameObjects.Text;

  // Game constants
  private readonly REEL_COUNT = 5;
  private readonly SYMBOL_COUNT = 3;
  private readonly SYMBOLS: SlotSymbol[] = [
    'cherry',
    'lemon',
    'orange',
    'plum',
    'bell',
    'bar',
    'seven',
  ];
  private readonly SYMBOL_VALUES = {
    cherry: { 2: 2, 3: 5, 4: 10, 5: 20 },
    lemon: { 2: 2, 3: 5, 4: 10, 5: 20 },
    orange: { 2: 3, 3: 8, 4: 15, 5: 30 },
    plum: { 2: 3, 3: 8, 4: 15, 5: 30 },
    bell: { 2: 5, 3: 15, 4: 25, 5: 50 },
    bar: { 2: 8, 3: 25, 4: 50, 5: 100 },
    seven: { 2: 10, 3: 50, 4: 100, 5: 500 },
  };

  // Payline patterns (row indices for each reel)
  private readonly PAYLINES = [
    [1, 1, 1, 1, 1], // Middle row
    [0, 0, 0, 0, 0], // Top row
    [2, 2, 2, 2, 2], // Bottom row
    [0, 1, 2, 1, 0], // V shape
    [2, 1, 0, 1, 2], // Inverted V
  ];

  constructor() {
    super({ key: 'SlotsScene' });
  }

  preload(): void {
    const startTime = performance.now();

    try {
      trackGameEvent('game_loading_started', 'slots');

      // Load assets with correct paths
      this.load.atlas(
        'chips',
        '/assets/games/common/chips/chip_atlas.png',
        '/assets/games/common/chips/chip_atlas.json'
      );
      this.load.atlas(
        'confetti',
        '/assets/games/common/confetti_frames/confetti_atlas.png',
        '/assets/games/common/confetti_frames/confetti_atlas.json'
      );

      // Load sounds (reuse from roulette and common)
      this.load.audio(
        'spinSound',
        '/assets/games/roulette/audio/roulette_spin.mp3'
      );
      this.load.audio(
        'stopSound',
        '/assets/games/roulette/audio/ball_drop_click.mp3'
      );
      this.load.audio(
        'payoutSound',
        '/assets/games/common/audio/payout_jingle.mp3'
      );
      this.load.audio(
        'buyChipsSound',
        '/assets/games/common/audio/buy_chips.mp3'
      );
      this.load.audio(
        'withdrawalSound',
        '/assets/games/common/audio/withdrawal.mp3'
      );

      this.load.on('complete', () => {
        const loadTime = performance.now() - startTime;
        trackPerformance('slots_assets_loaded', loadTime);
      });

      this.load.on('loaderror', (file: any) => {
        const error = new Error(`Failed to load asset: ${file.key}`);
        trackGameError(error, 'slots', {
          asset: file.key,
          url: file.url,
          step: 'asset_loading',
        });
      });
    } catch (error) {
      trackGameError(error as Error, 'slots', { step: 'preload' });
      throw error;
    }
  }

  async create(): Promise<void> {
    const startTime = performance.now();

    try {
      trackGameEvent('game_loaded', 'slots');

      // Initialize sounds
      this.initializeCommonSounds();
      this.spinSound = this.sound.add('spinSound');
      this.stopSound = this.sound.add('stopSound');

      // Initialize reels with random symbols
      this.initializeReels();

      // Draw the slot machine
      this.drawSlotMachine();

      // Create common UI
      this.createCommonUI();

      // Create game-specific UI
      this.createSlotsUI();

      // Build purchase overlay (hidden)
      this.buildPurchaseUI();

      // Prepare confetti animation
      if (this.textures.exists('confetti')) {
        this.anims.create({
          key: 'confettiBurst',
          frames: this.anims.generateFrameNames('confetti', {
            start: 0,
            end: 59,
            prefix: 'frame_',
            suffix: '.png',
            zeroPad: 3,
          }),
          frameRate: 30,
          repeat: 0,
        });
      }

      // Subscribe to store changes
      this.subscribeToStoreChanges();

      const createTime = performance.now() - startTime;
      trackPerformance('slots_scene_creation', createTime);

      const { balance } = useGameStore.getState();
      trackGameEvent('game_session_started', 'slots', {
        initial_balance: balance,
      });
    } catch (error) {
      trackGameError(error as Error, 'slots', {
        step: 'create_method',
        startTime,
      });
      throw error;
    }
  }

  protected getGameName(): string {
    return 'slots';
  }

  protected getBuyChipsConstant(): string {
    return SLOTS_CONSTANTS.BUY_CHIPS;
  }

  protected getWithdrawConstant(): string {
    return SLOTS_CONSTANTS.WITHDRAW;
  }

  protected getResetBetsConstant(): string {
    return SLOTS_CONSTANTS.RESET_BETS;
  }

  protected getInfoConstant(): string {
    return SLOTS_CONSTANTS.INFO;
  }

  protected getBalanceConstant(): string {
    return SLOTS_CONSTANTS.BALANCE;
  }

  protected resetGameSpecificBets(): void {
    if (this.currentBet <= 1) {
      this.outcomeText.setText('Bet already at minimum');
      return;
    }

    this.withdrawalSound.play();
    this.currentBet = 1;
    this.updateBetDisplay();
    this.outcomeText.setText('Bet reset to minimum');
  }

  protected buildGameSpecificInfoUI(): void {
    trackGameEvent('info_modal_opened', 'slots');

    this.infoContainer = this.add
      .container(0, 0)
      .setVisible(false)
      .setDepth(1000);

    const overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setInteractive();
    this.infoContainer.add(overlay);

    const pw = this.scale.width * 0.85;
    const ph = this.scale.height * 0.85;
    const px = (this.scale.width - pw) / 2;
    const py = (this.scale.height - ph) / 2;

    const panel = this.add
      .rectangle(px + pw / 2, py + ph / 2, pw, ph, 0x003300)
      .setStrokeStyle(4, 0xffff00);
    this.infoContainer.add(panel);

    const title = this.add
      .text(this.scale.width / 2, py + 25, 'Slots Game Guide', {
        fontSize: '26px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.infoContainer.add(title);

    // Add basic info content
    const infoText = this.add
      .text(
        px + 20,
        py + 80,
        'HOW TO PLAY:\n\n' +
          "1. Buy chips using the 'Buy chips' button\n" +
          '2. Select chip denomination at bottom\n' +
          '3. Adjust bet per line with +/- buttons\n' +
          '4. Click SPIN to start the reels\n' +
          '5. Win by matching symbols on paylines\n\n' +
          'PAYLINES:\n' +
          '• 5 active paylines on every spin\n' +
          '• Match 2+ symbols from left to right\n' +
          '• Total bet = Bet per line × 5 paylines\n\n' +
          'SYMBOL VALUES:\n' +
          '• Seven: Highest paying (10x-500x)\n' +
          '• Bar: High paying (8x-100x)\n' +
          '• Bell: Medium paying (5x-50x)\n' +
          '• Fruits: Lower paying (2x-30x)',
        {
          fontSize: '16px',
          color: '#ffffff',
          wordWrap: { width: pw - 40 },
        }
      )
      .setOrigin(0, 0);
    this.infoContainer.add(infoText);

    const closeBtn = this.add
      .text(this.scale.width / 2, py + ph - 35, 'Close', {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#cc0000',
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.hideInfoUI())
      .on('pointerover', () => closeBtn.setBackgroundColor('#ff0000'))
      .on('pointerout', () => closeBtn.setBackgroundColor('#cc0000'));
    this.infoContainer.add(closeBtn);
  }

  private initializeReels() {
    this.reels = [];
    for (let reel = 0; reel < this.REEL_COUNT; reel++) {
      this.reels[reel] = [];
      for (let symbol = 0; symbol < this.SYMBOL_COUNT; symbol++) {
        this.reels[reel][symbol] =
          this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)];
      }
    }
  }

  private drawSlotMachine() {
    const { width, height } = this.scale;
    const machineWidth = Math.min(width * 0.7, 600);
    const machineHeight = height * 0.4;
    const machineX = (width - machineWidth) / 2;
    const machineY = height * 0.25;

    // Machine background
    const machineBg = this.add
      .rectangle(
        machineX + machineWidth / 2,
        machineY + machineHeight / 2,
        machineWidth + 40,
        machineHeight + 40,
        0x2a2a2a
      )
      .setStrokeStyle(4, 0xffffff);

    // Reel backgrounds and symbols
    const reelWidth = machineWidth / this.REEL_COUNT;
    const symbolHeight = machineHeight / this.SYMBOL_COUNT;

    this.reelSprites = [];
    for (let reel = 0; reel < this.REEL_COUNT; reel++) {
      this.reelSprites[reel] = [];
      const reelX = machineX + reel * reelWidth;

      // Reel background
      this.add
        .rectangle(
          reelX + reelWidth / 2,
          machineY + machineHeight / 2,
          reelWidth - 4,
          machineHeight - 4,
          0x1a1a1a
        )
        .setStrokeStyle(2, 0x666666);

      for (let symbol = 0; symbol < this.SYMBOL_COUNT; symbol++) {
        const symbolX = reelX + reelWidth / 2;
        const symbolY = machineY + symbol * symbolHeight + symbolHeight / 2;

        // Create symbol placeholder
        const symbolSprite = this.add
          .rectangle(
            symbolX,
            symbolY,
            reelWidth - 10,
            symbolHeight - 10,
            this.getSymbolColor(this.reels[reel][symbol])
          )
          .setStrokeStyle(1, 0xffffff);

        // Add symbol text
        const symbolText = this.add
          .text(
            symbolX,
            symbolY,
            this.getSymbolDisplay(this.reels[reel][symbol]),
            {
              fontSize: '16px',
              color: '#ffffff',
              fontStyle: 'bold',
            }
          )
          .setOrigin(0.5);

        this.reelSprites[reel][symbol] = symbolSprite;
      }
    }

    // Draw paylines
    this.drawPaylines(machineX, machineY, reelWidth, symbolHeight);
  }

  private drawPaylines(
    machineX: number,
    machineY: number,
    reelWidth: number,
    symbolHeight: number
  ) {
    const paylineGraphics = this.add.graphics();
    paylineGraphics.setDepth(5);

    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];

    this.PAYLINES.forEach((payline, index) => {
      paylineGraphics.lineStyle(3, colors[index], 0.7);

      let prevX = machineX + reelWidth / 2;
      let prevY = machineY + payline[0] * symbolHeight + symbolHeight / 2;

      paylineGraphics.moveTo(prevX, prevY);

      for (let reel = 1; reel < this.REEL_COUNT; reel++) {
        const x = machineX + reel * reelWidth + reelWidth / 2;
        const y = machineY + payline[reel] * symbolHeight + symbolHeight / 2;
        paylineGraphics.lineTo(x, y);
        prevX = x;
        prevY = y;
      }

      paylineGraphics.strokePath();
    });
  }

  private createSlotsUI() {
    // Create top buttons using base class
    this.createTopButtons();

    // Create chip palette using base class
    this.drawChipPalette();

    // Bet controls
    const controlsY = this.scale.height - 160;

    // Bet amount display
    this.betText = this.add
      .text(
        this.scale.width / 2,
        controlsY,
        `Bet per line: ${this.currentBet}`,
        {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
        }
      )
      .setOrigin(0.5);

    // Bet adjustment buttons
    const decreaseBetBtn = this.add
      .text(this.scale.width / 2 - 100, controlsY, '-', {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#cc6600',
        padding: { x: 15, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.adjustBet(-1))
      .on('pointerover', () => decreaseBetBtn.setBackgroundColor('#ff8800'))
      .on('pointerout', () => decreaseBetBtn.setBackgroundColor('#cc6600'));

    const increaseBetBtn = this.add
      .text(this.scale.width / 2 + 100, controlsY, '+', {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#cc6600',
        padding: { x: 15, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.adjustBet(1))
      .on('pointerover', () => increaseBetBtn.setBackgroundColor('#ff8800'))
      .on('pointerout', () => increaseBetBtn.setBackgroundColor('#cc6600'));

    // Max bet button
    this.maxBetBtn = this.add
      .text(this.scale.width / 2 - 80, this.scale.height - 40, 'MAX BET', {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#0066cc',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.setMaxBet())
      .on('pointerover', () => this.maxBetBtn.setBackgroundColor('#0088ff'))
      .on('pointerout', () => this.maxBetBtn.setBackgroundColor('#0066cc'));

    // Spin button
    this.spinBtn = this.add
      .text(this.scale.width / 2 + 80, this.scale.height - 40, 'SPIN', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#cc0000',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.spin())
      .on('pointerover', () => this.spinBtn.setBackgroundColor('#ff0000'))
      .on('pointerout', () => this.spinBtn.setBackgroundColor('#cc0000'));
  }

  private adjustBet(delta: number) {
    const newBet = Math.max(1, Math.min(10, this.currentBet + delta));
    if (newBet !== this.currentBet) {
      this.currentBet = newBet;
      this.updateBetDisplay();
    }
  }

  private setMaxBet() {
    this.currentBet = 10;
    this.updateBetDisplay();
  }

  private updateBetDisplay() {
    const totalBet = this.currentBet * this.activePaylines;
    this.betText.setText(
      `Bet per line: ${this.currentBet} (Total: ${totalBet})`
    );
  }

  private async spin() {
    if (this.isSpinning) return;

    const totalBet = this.currentBet * this.activePaylines;
    const { getTotalChipValue, removeChips } = useGameStore.getState();

    // Check if player has enough chips
    if (getTotalChipValue() < totalBet) {
      this.outcomeText.setText('Not enough chips!');
      return;
    }

    // Deduct bet from chips (simplified)
    removeChips(this.selectedDenom, Math.ceil(totalBet / this.selectedDenom));

    this.isSpinning = true;
    this.spinBtn.setAlpha(0.5);
    this.outcomeText.setText('Spinning...');

    try {
      // Play spin sound
      this.spinSound.play();

      // Generate new reel results
      for (let reel = 0; reel < this.REEL_COUNT; reel++) {
        for (let symbol = 0; symbol < this.SYMBOL_COUNT; symbol++) {
          this.reels[reel][symbol] =
            this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)];
        }
      }

      // Animate reels (simplified)
      await this.animateReels();

      // Check for wins
      const wins = this.checkWins();
      this.processWins(wins, totalBet);
    } catch (error) {
      trackGameError(error as Error, 'slots', { step: 'spin_execution' });
      this.outcomeText.setText('Spin failed');
    } finally {
      this.isSpinning = false;
      this.spinBtn.setAlpha(1);
    }
  }

  private async animateReels(): Promise<void> {
    return new Promise((resolve) => {
      // Update reel display
      for (let reel = 0; reel < this.REEL_COUNT; reel++) {
        for (let symbol = 0; symbol < this.SYMBOL_COUNT; symbol++) {
          const sprite = this.reelSprites[reel][symbol];
          const newSymbol = this.reels[reel][symbol];

          // Update color and text
          sprite.setFillStyle(this.getSymbolColor(newSymbol));

          // Find and update the text
          this.children.list.forEach((child) => {
            if (
              child instanceof Phaser.GameObjects.Text &&
              Math.abs(child.x - sprite.x) < 1 &&
              Math.abs(child.y - sprite.y) < 1
            ) {
              child.setText(this.getSymbolDisplay(newSymbol));
            }
          });
        }
      }

      // Play stop sound after delay
      this.time.delayedCall(1500, () => {
        this.stopSound.play();
        resolve();
      });
    });
  }

  private checkWins() {
    const wins: Array<{
      payline: number;
      symbol: SlotSymbol;
      count: number;
      payout: number;
    }> = [];

    this.PAYLINES.forEach((payline, paylineIndex) => {
      const symbols = payline.map((row, reel) => this.reels[reel][row]);
      const firstSymbol = symbols[0];

      // Count consecutive matching symbols from left
      let count = 1;
      for (let i = 1; i < symbols.length; i++) {
        if (symbols[i] === firstSymbol) {
          count++;
        } else {
          break;
        }
      }

      // Check if we have a winning combination
      if (
        count >= 2 &&
        this.SYMBOL_VALUES[firstSymbol][
          count as keyof (typeof this.SYMBOL_VALUES)[SlotSymbol]
        ]
      ) {
        const payout =
          this.SYMBOL_VALUES[firstSymbol][
            count as keyof (typeof this.SYMBOL_VALUES)[SlotSymbol]
          ] * this.currentBet;
        wins.push({
          payline: paylineIndex,
          symbol: firstSymbol,
          count,
          payout,
        });
      }
    });

    return wins;
  }

  private processWins(
    wins: Array<{
      payline: number;
      symbol: SlotSymbol;
      count: number;
      payout: number;
    }>,
    totalBet: number
  ) {
    const totalWinnings = wins.reduce((sum, win) => sum + win.payout, 0);

    if (totalWinnings > 0) {
      // Play payout sound
      this.payoutSound.play();

      // Add winnings back as chips
      const { addChips } = useGameStore.getState();
      addChips(
        this.selectedDenom,
        Math.ceil(totalWinnings / this.selectedDenom)
      );

      // Show win message
      this.outcomeText.setText(
        `WIN! ${wins.length} paylines - Won $${totalWinnings}`
      );

      // Show confetti for big wins
      if (totalWinnings >= totalBet * 5 && this.anims.exists('confettiBurst')) {
        const confetti = this.add.sprite(
          this.scale.width / 2,
          this.scale.height / 2,
          'confetti'
        );
        confetti.play('confettiBurst');
        confetti.on('animationcomplete', () => confetti.destroy());
      }

      // Track win
      trackGameResult('win', totalBet, this.getGameName(), totalWinnings);
    } else {
      this.outcomeText.setText('No wins this spin');
      trackGameResult('lose', totalBet, this.getGameName(), 0);
    }
  }

  private getSymbolColor(symbol: SlotSymbol): number {
    const colors = {
      cherry: 0xff0000,
      lemon: 0xffff00,
      orange: 0xff8800,
      plum: 0x8800ff,
      bell: 0x00ff00,
      bar: 0x666666,
      seven: 0xff00ff,
    };
    return colors[symbol];
  }

  private getSymbolDisplay(symbol: SlotSymbol): string {
    const displays = {
      cherry: '🍒',
      lemon: '🍋',
      orange: '🍊',
      plum: '🟣',
      bell: '🔔',
      bar: 'BAR',
      seven: '7',
    };
    return displays[symbol];
  }
}
