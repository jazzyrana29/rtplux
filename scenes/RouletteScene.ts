import Phaser from 'phaser';
import { initRNG } from '../services/rng';
import { useGameStore } from '../stores/gameStore';
import {
  trackBetPlaced,
  trackGameEvent,
  trackGameResult,
} from '../lib/posthog';
import {
  trackAPIError,
  trackError,
  trackGameError,
  trackPerformance,
  trackUserAction,
} from '../lib/sentry';
import { ROULETTE_CONSTANTS } from '../constants/roulette';
import { BaseGameScene, BetType } from './BaseGameScene';

export default class RouletteScene extends BaseGameScene {
  // Text & sounds

  private spinSound!: Phaser.Sound.BaseSound;
  private dropSound!: Phaser.Sound.BaseSound;

  // Layout metrics
  private tableX!: number;
  private tableY!: number;
  private tableW!: number;
  private tableH!: number;
  private cellW!: number;
  private cellH!: number;

  // Roulette number colors
  private readonly RED_NUMBERS = [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ];
  private readonly BLACK_NUMBERS = [
    2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
  ];

  constructor() {
    super({ key: 'RouletteScene' });
  }

  preload(): void {
    const startTime = performance.now();

    try {
      // Track game loading
      trackGameEvent('game_loading_started', 'roulette');
      trackUserAction('roulette_preload_started');

      // Load chip atlas
      this.load.atlas(
        'chips',
        '/public/assets/games/common/chips.webp',
        '/public/assets/games/common/chips.json'
      );
      // Load spin button
      this.load.image(
        'spinButton',
        '/public/assets/games/common/spin_button.webp'
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
        '/public/assets/games/common/confetti-0.webp',
        '/public/assets/games/common/confetti-0.json'
      );
      // Load digits atlas for result display (optimized assets)
      this.load.atlas(
        'digits',
        '/public/assets/games/common/digitAtlas.webp',
        '/public/assets/games/common/digitAtlas.json'
      );
      // Load sounds
      this.load.audio(
        'spinSound',
        '/public/assets/games/common/audio/spin.mp3'
      );
      this.load.audio(
        'dropSound',
        '/public/assets/games/common/audio/ball_drop_click.mp3'
      );
      this.load.audio(
        'payoutSound',
        '/public/assets/games/common/audio/payout_jingle.mp3'
      );
      this.load.audio(
        'buyChipsSound',
        '/public/assets/games/common/audio/buy_chips.mp3'
      );
      this.load.audio(
        'withdrawalSound',
        '/public/assets/games/common/audio/withdrawal.mp3'
      );

      // Track loading completion
      this.load.on('complete', () => {
        const loadTime = performance.now() - startTime;
        trackPerformance('roulette_assets_loaded', loadTime);
        trackUserAction('roulette_preload_completed', { loadTime });
      });

      // Track loading errors
      this.load.on('loaderror', (file: any) => {
        const error = new Error(`Failed to load asset: ${file.key}`);
        trackGameError(error, 'roulette', {
          asset: file.key,
          url: file.url,
          step: 'asset_loading',
        });
      });
    } catch (error) {
      trackGameError(error as Error, 'roulette', { step: 'preload' });
      throw error;
    }
  }

  async create(): Promise<void> {
    const startTime = performance.now();

    try {
      // Track game loaded
      trackGameEvent('game_loaded', 'roulette');
      trackUserAction('roulette_create_started');

      // Initialize sounds with error handling
      try {
        this.spinSound = this.sound.add('spinSound');
        this.dropSound = this.sound.add('dropSound');
        this.payoutSound = this.sound.add('payoutSound');
        this.buyChipsSound = this.sound.add('buyChipsSound');
        this.withdrawalSound = this.sound.add('withdrawalSound');
        trackUserAction('roulette_sounds_initialized');
      } catch (soundError) {
        trackGameError(soundError as Error, 'roulette', {
          step: 'sound_initialization',
        });
        // Continue without sounds
      }

      // Draw table and calculate metrics
      try {
        this.drawTable();
        trackUserAction('roulette_table_drawn');
      } catch (tableError) {
        trackGameError(tableError as Error, 'roulette', {
          step: 'table_drawing',
        });
        throw tableError;
      }

      // Get balance from store and display
      try {
        const { balance } = useGameStore.getState();
        this.balanceText = this.add
          .text(20, 20, `${this.t(ROULETTE_CONSTANTS.BALANCE)}: $${balance}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
          })
          .setShadow(2, 2, '#000', 2);

        // Outcome text - position at top left below balance
        this.outcomeText = this.add
          .text(20, 60, '', {
            fontSize: '18px',
            color: '#ffff00',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0);

        trackUserAction('roulette_ui_texts_created', { balance });
      } catch (uiError) {
        trackGameError(uiError as Error, 'roulette', { step: 'ui_creation' });
        throw uiError;
      }

      // Build UI controls
      try {
        this.createTopButtons();
        this.drawChipPalette();
        this.createSpinButton();
        trackUserAction('roulette_controls_created');
      } catch (controlsError) {
        trackGameError(controlsError as Error, 'roulette', {
          step: 'controls_creation',
        });
        throw controlsError;
      }

      // Enable betting on table
      try {
        this.enableTableBetting();
        trackUserAction('roulette_betting_enabled');
      } catch (bettingError) {
        trackGameError(bettingError as Error, 'roulette', {
          step: 'betting_setup',
        });
        throw bettingError;
      }

      // Build purchase overlay (hidden)
      try {
        this.buildPurchaseUI();
        trackUserAction('roulette_purchase_ui_built');
      } catch (purchaseError) {
        trackGameError(purchaseError as Error, 'roulette', {
          step: 'purchase_ui_creation',
        });
        // Continue without purchase UI
      }

      // Prepare confetti animation
      try {
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
          trackUserAction('roulette_confetti_animation_created');
        }
      } catch (confettiError) {
        trackGameError(confettiError as Error, 'roulette', {
          step: 'confetti_animation',
        });
        // Continue without confetti
      }

      // Subscribe to store changes for real-time updates
      try {
        this.subscribeToStoreChanges();
        trackUserAction('roulette_store_subscription_setup');
      } catch (storeError) {
        trackGameError(storeError as Error, 'roulette', {
          step: 'store_subscription',
        });
        // Continue without store subscription
      }

      const createTime = performance.now() - startTime;
      trackPerformance('roulette_scene_creation', createTime);

      // Track game session started
      const { balance } = useGameStore.getState();
      trackGameEvent('game_session_started', 'roulette', {
        initial_balance: balance,
      });
      trackUserAction('roulette_create_completed', {
        createTime,
        balance,
      });
    } catch (error) {
      trackGameError(error as Error, 'roulette', {
        step: 'create_method',
        startTime,
      });
      throw error;
    }
  }

  protected buildInfoUI() {
    // Track info modal opened
    trackGameEvent('info_modal_opened', 'roulette');

    // Create container first
    this.infoContainer = this.add
      .container(0, 0)
      .setVisible(false)
      .setDepth(1000);

    // Semi-transparent overlay
    const overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setInteractive(); // Make overlay interactive to prevent clicks behind it
    this.infoContainer.add(overlay);

    const pw = this.scale.width * 0.85;
    const ph = this.scale.height * 0.85;
    const px = (this.scale.width - pw) / 2;
    const py = (this.scale.height - ph) / 2;

    // Main panel with proper styling
    const panel = this.add
      .rectangle(px + pw / 2, py + ph / 2, pw, ph, 0x003300)
      .setStrokeStyle(4, 0xffff00);
    this.infoContainer.add(panel);

    const title = this.add
      .text(this.scale.width / 2, py + 25, 'Roulette Betting Guide', {
        fontSize: '26px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.infoContainer.add(title);

    // Create scrollable content container
    const contentContainer = this.add.container(0, 0);
    this.infoContainer.add(contentContainer);

    // Create mask for scrolling area - FIXED: Use transparent mask instead of white
    const maskY = py + 60;
    const maskHeight = ph - 120;
    const scrollMask = this.add.graphics();
    scrollMask.fillStyle(0x000000, 0); // Transparent mask
    scrollMask.fillRect(px + 10, maskY, pw - 20, maskHeight);
    contentContainer.setMask(scrollMask.createGeometryMask());

    // Content starting position
    let currentY = maskY + 10;
    const leftMargin = px + 20;
    const rightMargin = px + pw - 100;
    const lineHeight = 22;

    const bettingInfo = [
      { title: 'INSIDE BETS', color: '#ffff00', isHeader: true },
      {
        text: 'Straight-Up: Click any single number (0-36)',
        payout: '35:1',
        color: '#ffffff',
        example: 'Bet $5 on number 17 → Win $175 + $5 back = $180 total',
      },
      {
        text: '• Highest payout but lowest probability (2.7%)',
        payout: '',
        color: '#cccccc',
      },
      {
        text: '• Covers only 1 number out of 37',
        payout: '',
        color: '#cccccc',
      },
      '',
      { title: 'OUTSIDE BETS', color: '#ffff00', isHeader: true },
      {
        text: 'Red/Black: Click RED or BLACK areas',
        payout: '1:1',
        color: '#ffffff',
        example: 'Bet $10 on Red → Win $10 + $10 back = $20 total',
      },
      {
        text: '• Bet on the color of winning number',
        payout: '',
        color: '#cccccc',
      },
      {
        text: '• Covers 18 numbers, probability: 48.6%',
        payout: '',
        color: '#cccccc',
      },
      '',
      {
        text: 'Even/Odd: Click EVEN or ODD areas',
        payout: '1:1',
        color: '#ffffff',
        example: 'Bet $15 on Even → Win $15 + $15 back = $30 total',
      },
      {
        text: '• Bet on whether number is even or odd',
        payout: '',
        color: '#cccccc',
      },
      {
        text: '• Covers 18 numbers, probability: 48.6%',
        payout: '',
        color: '#cccccc',
      },
      '',
      {
        text: 'Low/High: Click 1-18 or 19-36 areas',
        payout: '1:1',
        color: '#ffffff',
        example: 'Bet $20 on High (19-36) → Win $20 + $20 back = $40 total',
      },
      {
        text: '• Bet on low (1-18) or high (19-36) numbers',
        payout: '',
        color: '#cccccc',
      },
      {
        text: '• Covers 18 numbers, probability: 48.6%',
        payout: '',
        color: '#cccccc',
      },
      '',
      {
        text: 'Dozens: Click 1st 12, 2nd 12, or 3rd 12',
        payout: '2:1',
        color: '#ffffff',
        example: 'Bet $6 on 2nd 12 (13-24) → Win $12 + $6 back = $18 total',
      },
      {
        text: '• 1st 12 (1-12), 2nd 12 (13-24), 3rd 12 (25-36)',
        payout: '',
        color: '#cccccc',
      },
      {
        text: '• Covers 12 numbers, probability: 32.4%',
        payout: '',
        color: '#cccccc',
      },
      '',
      {
        text: 'Columns: Click 2:1 areas on the right',
        payout: '2:1',
        color: '#ffffff',
        example: 'Bet $8 on Column 1 → Win $16 + $8 back = $24 total',
      },
      {
        text: '• Bet on vertical columns of numbers',
        payout: '',
        color: '#cccccc',
      },
      {
        text: '• Covers 12 numbers, probability: 32.4%',
        payout: '',
        color: '#cccccc',
      },
      '',
      { title: 'HOW TO PLAY', color: '#ffff00', isHeader: true },
      {
        text: "1. Buy chips using the 'Buy chips' button",
        payout: '',
        color: '#ffffff',
      },
      {
        text: '2. Select chip denomination at bottom',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '3. Click on betting areas to place chips',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '4. Click SPIN button to start the round',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '5. Winning bets pay according to odds',
        payout: '',
        color: '#ffffff',
      },
      {
        text: "6. Use 'Reset Bets' to clear all bets",
        payout: '',
        color: '#ffffff',
      },
      {
        text: "7. Use 'Withdraw' to cash out chips",
        payout: '',
        color: '#ffffff',
      },
      '',
      { title: 'PROBABILITY & STRATEGY', color: '#ffff00', isHeader: true },
      {
        text: '• House Edge: 2.7% (due to the 0)',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '• Higher payouts = Lower probability',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '• Outside bets: Safer, lower payouts',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '• Inside bets: Riskier, higher payouts',
        payout: '',
        color: '#ffffff',
      },
      '',
      { title: 'MULTIPLE BET EXAMPLES', color: '#ffff00', isHeader: true },
      {
        text: 'Scenario 1: Bet $5 on Red + $5 on Even',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '• If 18 (Red, Even) wins: Get $20 back',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '• If 19 (Red, Odd) wins: Get $10 back',
        payout: '',
        color: '#ffffff',
      },
      '',
      {
        text: 'Scenario 2: Bet $10 on number 7 + $5 on 1st 12',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '• If 7 wins: Get $360 + $15 = $375 total',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '• If other 1st 12 number wins: Get $15 back',
        payout: '',
        color: '#ffffff',
      },
      '',
      { title: 'TIPS FOR BEGINNERS', color: '#ffff00', isHeader: true },
      {
        text: '• Start with outside bets (Red/Black, Even/Odd)',
        payout: '',
        color: '#ffffff',
      },
      { text: '• Set a budget and stick to it', payout: '', color: '#ffffff' },
      {
        text: "• Use 'Reset Bets' if you change your mind",
        payout: '',
        color: '#ffffff',
      },
      {
        text: '• Remember: 0 wins for the house on most bets',
        payout: '',
        color: '#ffffff',
      },
    ];

    // Add all content to the scrollable container
    bettingInfo.forEach((info, index) => {
      if (typeof info === 'string') {
        currentY += lineHeight * 0.4; // Empty line spacing
        return;
      }

      if (info.isHeader) {
        const headerText = this.add
          .text(leftMargin, currentY, info.title, {
            fontSize: '18px',
            color: info.color,
            fontStyle: 'bold',
          })
          .setOrigin(0, 0);
        contentContainer.add(headerText);
        currentY += lineHeight * 1.3;
      } else {
        if (info?.text) {
          const mainText = this.add
            .text(leftMargin, currentY, info.text, {
              fontSize: '14px',
              color: info.color,
            })
            .setOrigin(0, 0);
          contentContainer.add(mainText);
        }

        if (info.payout) {
          const payoutText = this.add
            .text(rightMargin, currentY, info.payout, {
              fontSize: '14px',
              color: '#00ff00',
              fontStyle: 'bold',
            })
            .setOrigin(0, 0);
          contentContainer.add(payoutText);
        }

        currentY += lineHeight;

        // Add example if available
        if (info.example) {
          const exampleText = this.add
            .text(leftMargin + 15, currentY, `Example: ${info.example}`, {
              fontSize: '13px',
              color: '#ffaa00',
              fontStyle: 'italic',
            })
            .setOrigin(0, 0);
          contentContainer.add(exampleText);
          currentY += lineHeight;
        }
      }
    });

    // Add scroll functionality
    let scrollY = 0;
    const maxScroll = Math.max(0, currentY - (maskY + maskHeight - 20));

    // Scroll instructions
    const scrollInstructions = this.add
      .text(
        px + pw - 150,
        py + ph - 80,
        'Use mouse wheel\nor arrow keys\nto scroll',
        {
          fontSize: '12px',
          color: '#888888',
          align: 'center',
        }
      )
      .setOrigin(0, 0);
    this.infoContainer.add(scrollInstructions);

    // Mouse wheel scrolling
    this.input.on(
      'wheel',
      (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
        if (this.infoContainer.visible) {
          scrollY = Phaser.Math.Clamp(scrollY + deltaY * 0.5, -maxScroll, 0);
          contentContainer.setY(scrollY);
        }
      }
    );

    // Keyboard scrolling
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors) {
      this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (this.infoContainer.visible) {
          if (event.code === 'ArrowUp') {
            scrollY = Phaser.Math.Clamp(scrollY + 30, -maxScroll, 0);
            contentContainer.setY(scrollY);
          } else if (event.code === 'ArrowDown') {
            scrollY = Phaser.Math.Clamp(scrollY - 30, -maxScroll, 0);
            contentContainer.setY(scrollY);
          }
        }
      });
    }

    // Close button
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

  private drawTable() {
    const { width, height } = this.scale;
    this.tableW = Math.min(width * 0.85, 800);
    this.tableH = height * 0.45;
    this.tableX = (width - this.tableW) / 2;
    this.tableY = height * 0.2;
    this.cellW = this.tableW / 3;
    this.cellH = this.tableH / 13;

    // Create solid background rectangle first
    const tableBg = this.add
      .rectangle(
        this.tableX + this.tableW / 2,
        this.tableY + this.tableH / 2 + 60,
        this.tableW + 40,
        this.tableH + 140,
        0x003300
      )
      .setDepth(-1);

    // Create graphics for table elements
    const g = this.add.graphics();
    g.setDepth(0);

    // Zero row
    g.fillStyle(0x00aa00); // Green for zero
    g.fillRect(this.tableX, this.tableY, this.tableW, this.cellH);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeRect(this.tableX, this.tableY, this.tableW, this.cellH);

    this.add
      .text(this.tableX + this.tableW / 2, this.tableY + this.cellH / 2, '0', {
        fontSize: '20px',
        color: '#fff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(1);

    // 1–36 grid with proper colors
    for (let n = 1; n <= 36; n++) {
      const row = Math.floor((n - 1) / 3);
      const col = (n - 1) % 3;
      const x = this.tableX + col * this.cellW;
      const y = this.tableY + this.cellH + row * this.cellH;

      // Set cell color based on roulette colors
      if (this.RED_NUMBERS.includes(n)) {
        g.fillStyle(0xaa0000); // Red
      } else {
        g.fillStyle(0x000000); // Black
      }
      g.fillRect(x, y, this.cellW, this.cellH);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeRect(x, y, this.cellW, this.cellH);

      this.add
        .text(x + this.cellW / 2, y + this.cellH / 2, `${n}`, {
          fontSize: '18px',
          color: '#fff',
        })
        .setOrigin(0.5)
        .setDepth(1);
    }

    // Draw outside betting areas
    this.drawOutsideBets(g);
  }

  private drawOutsideBets(g: Phaser.GameObjects.Graphics) {
    const outsideY = this.tableY + this.tableH + 15;
    const outsideW = this.tableW / 6;
    const outsideH = this.cellH * 0.9;

    // First row of outside bets
    const firstRowBets = [
      { label: '1-18', color: 0x006600 },
      { label: 'EVEN', color: 0x006600 },
      { label: 'RED', color: 0xaa0000 },
      { label: 'BLACK', color: 0x000000 },
      { label: 'ODD', color: 0x006600 },
      { label: '19-36', color: 0x006600 },
    ];

    firstRowBets.forEach((bet, i) => {
      const x = this.tableX + i * outsideW;
      g.fillStyle(bet.color);
      g.fillRect(x, outsideY, outsideW, outsideH);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeRect(x, outsideY, outsideW, outsideH);

      this.add
        .text(x + outsideW / 2, outsideY + outsideH / 2, bet.label, {
          fontSize: '11px',
          color: '#fff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(1);
    });

    // Second row - Dozens
    const dozenY = outsideY + outsideH + 5;
    const dozenW = this.tableW / 3;
    const dozens = ['1st 12', '2nd 12', '3rd 12'];

    dozens.forEach((label, i) => {
      const x = this.tableX + i * dozenW;
      g.fillStyle(0x006600);
      g.fillRect(x, dozenY, dozenW, outsideH);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeRect(x, dozenY, dozenW, outsideH);

      this.add
        .text(x + dozenW / 2, dozenY + outsideH / 2, label, {
          fontSize: '12px',
          color: '#fff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(1);
    });

    // Columns
    const columnX = this.tableX + this.tableW + 5;
    const columnW = 35;
    const columnH = this.cellH * 4;

    for (let i = 0; i < 3; i++) {
      const y = this.tableY + this.cellH + i * columnH;
      g.fillStyle(0x006600);
      g.fillRect(columnX, y, columnW, columnH);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeRect(columnX, y, columnW, columnH);

      this.add
        .text(columnX + columnW / 2, y + columnH / 2, '2:1', {
          fontSize: '10px',
          color: '#fff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(1);
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
      .on('pointerup', () => this.placeBet(0, 'straight', [0], 35));

    // Cells 1–36
    for (let n = 1; n <= 36; n++) {
      const row = Math.floor((n - 1) / 3);
      const col = (n - 1) % 3;
      const cx = this.tableX + col * this.cellW + this.cellW / 2;
      const cy = this.tableY + this.cellH + row * this.cellH + this.cellH / 2;
      this.add
        .rectangle(cx, cy, this.cellW, this.cellH, 0, 0)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.placeBet(n, 'straight', [n], 35));
    }

    // Outside bets - First row
    const outsideY = this.tableY + this.tableH + 20;
    const outsideW = this.tableW / 6;
    const outsideH = this.cellH;

    const outsideBets = [
      {
        betType: 'low' as BetType,
        numbers: Array.from({ length: 18 }, (_, i) => i + 1),
        payout: 1,
      },
      {
        betType: 'even' as BetType,
        numbers: Array.from({ length: 18 }, (_, i) => (i + 1) * 2).filter(
          (n) => n <= 36
        ),
        payout: 1,
      },
      { betType: 'red' as BetType, numbers: this.RED_NUMBERS, payout: 1 },
      { betType: 'black' as BetType, numbers: this.BLACK_NUMBERS, payout: 1 },
      {
        betType: 'odd' as BetType,
        numbers: Array.from({ length: 18 }, (_, i) => i * 2 + 1).filter(
          (n) => n <= 36
        ),
        payout: 1,
      },
      {
        betType: 'high' as BetType,
        numbers: Array.from({ length: 18 }, (_, i) => i + 19),
        payout: 1,
      },
    ];

    outsideBets.forEach((bet, i) => {
      const x = this.tableX + i * outsideW;
      this.add
        .rectangle(
          x + outsideW / 2,
          outsideY + outsideH / 2,
          outsideW,
          outsideH,
          0,
          0
        )
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () =>
          this.placeBet(undefined, bet.betType, bet.numbers, bet.payout)
        );
    });

    // Dozens
    const dozenY = outsideY + outsideH + 5;
    const dozenW = this.tableW / 3;
    const dozenBets = [
      {
        betType: 'dozen1' as BetType,
        numbers: Array.from({ length: 12 }, (_, i) => i + 1),
        payout: 2,
      },
      {
        betType: 'dozen2' as BetType,
        numbers: Array.from({ length: 12 }, (_, i) => i + 13),
        payout: 2,
      },
      {
        betType: 'dozen3' as BetType,
        numbers: Array.from({ length: 12 }, (_, i) => i + 25),
        payout: 2,
      },
    ];

    dozenBets.forEach((bet, i) => {
      const x = this.tableX + i * dozenW;
      this.add
        .rectangle(
          x + dozenW / 2,
          dozenY + outsideH / 2,
          dozenW,
          outsideH,
          0,
          0
        )
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () =>
          this.placeBet(undefined, bet.betType, bet.numbers, bet.payout)
        );
    });

    // Columns
    const columnX = this.tableX + this.tableW + 10;
    const columnW = 40;
    const columnH = this.cellH * 4;
    const columnBets = [
      {
        betType: 'column1' as BetType,
        numbers: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
        payout: 2,
      },
      {
        betType: 'column2' as BetType,
        numbers: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
        payout: 2,
      },
      {
        betType: 'column3' as BetType,
        numbers: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
        payout: 2,
      },
    ];

    columnBets.forEach((bet, i) => {
      const y = this.tableY + this.cellH + i * columnH;
      this.add
        .rectangle(
          columnX + columnW / 2,
          y + columnH / 2,
          columnW,
          columnH,
          0,
          0
        )
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () =>
          this.placeBet(undefined, bet.betType, bet.numbers, bet.payout)
        );
    });
  }

  private async placeBet(
    num: number | undefined,
    betType: BetType,
    numbers: number[],
    payout: number
  ) {
    try {
      const { chipCounts, removeChips } = useGameStore.getState();

      if (chipCounts[this.selectedDenom] <= 0) {
        this.outcomeText.setText(
          this.formatMessage(this.t(ROULETTE_CONSTANTS.NO_CHIPS_LEFT), {
            denomination: this.selectedDenom,
          })
        );
        trackUserAction('bet_placement_failed', {
          reason: 'insufficient_chips',
          denomination: this.selectedDenom,
        });
        return;
      }

      // Track bet placement
      trackBetPlaced(this.selectedDenom, betType, 'roulette');
      trackUserAction('bet_placed', {
        betType,
        denomination: this.selectedDenom,
        numbers,
        payout,
        number: num,
      });

      // Play buy chips sound when placing a bet
      try {
        this.buyChipsSound.play();
      } catch (soundError) {
        trackError(soundError as Error, { context: 'bet_placement_sound' });
      }

      // Remove chip from store
      removeChips(this.selectedDenom, 1);

      // Determine chip placement position
      let cx: number, cy: number;

      if (betType === 'straight') {
        if (num === 0) {
          cx = this.tableX + this.tableW / 2;
          cy = this.tableY + this.cellH / 2;
        } else {
          const row = Math.floor((num! - 1) / 3);
          const col = (num! - 1) % 3;
          cx = this.tableX + col * this.cellW + this.cellW / 2;
          cy = this.tableY + this.cellH + row * this.cellH + this.cellH / 2;
        }
      } else {
        // Position chips on outside betting areas
        const position = this.getOutsideBetPosition(betType);
        cx = position.x;
        cy = position.y;
      }

      // Compute multi-chip offsets for same bet area
      const existing = this.bets.filter(
        (b) =>
          b.betType === betType &&
          (betType === 'straight' ? b.number === num : true)
      ).length;
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

      this.bets.push({
        number: num,
        betType,
        numbers,
        denom: this.selectedDenom,
        sprite,
        payout,
      });

      trackUserAction('bet_placed_successfully', {
        totalBets: this.bets.length,
        betValue: this.selectedDenom,
      });
    } catch (error) {
      trackGameError(error as Error, 'roulette', {
        step: 'bet_placement',
        betType,
        denomination: this.selectedDenom,
        number: num,
      });
      this.outcomeText.setText('Error placing bet');
    }
  }

  private getOutsideBetPosition(betType: BetType): { x: number; y: number } {
    const outsideY = this.tableY + this.tableH + 20;
    const outsideW = this.tableW / 6;
    const outsideH = this.cellH;
    const dozenY = outsideY + outsideH + 5;
    const dozenW = this.tableW / 3;
    const columnX = this.tableX + this.tableW + 10;
    const columnW = 40;
    const columnH = this.cellH * 4;

    switch (betType) {
      case 'low':
        return { x: this.tableX + outsideW / 2, y: outsideY + outsideH / 2 };
      case 'even':
        return { x: this.tableX + outsideW * 1.5, y: outsideY + outsideH / 2 };
      case 'red':
        return { x: this.tableX + outsideW * 2.5, y: outsideY + outsideH / 2 };
      case 'black':
        return { x: this.tableX + outsideW * 3.5, y: outsideY + outsideH / 2 };
      case 'odd':
        return { x: this.tableX + outsideW * 4.5, y: outsideY + outsideH / 2 };
      case 'high':
        return { x: this.tableX + outsideW * 5.5, y: outsideY + outsideH / 2 };
      case 'dozen1':
        return { x: this.tableX + dozenW / 2, y: dozenY + outsideH / 2 };
      case 'dozen2':
        return { x: this.tableX + dozenW * 1.5, y: dozenY + outsideH / 2 };
      case 'dozen3':
        return { x: this.tableX + dozenW * 2.5, y: dozenY + outsideH / 2 };
      case 'column1':
        return {
          x: columnX + columnW / 2,
          y: this.tableY + this.cellH + columnH / 2,
        };
      case 'column2':
        return {
          x: columnX + columnW / 2,
          y: this.tableY + this.cellH + columnH * 1.5,
        };
      case 'column3':
        return {
          x: columnX + columnW / 2,
          y: this.tableY + this.cellH + columnH * 2.5,
        };
      default:
        return { x: 0, y: 0 };
    }
  }

  private createSpinButton() {
    const chipAreaWidth = Math.min(this.scale.width * 0.8, 600);
    const chipAreaX = (this.scale.width - chipAreaWidth) / 2;
    const segW = chipAreaWidth / 5;
    const x = chipAreaX + segW * 4.5;
    const y = this.scale.height - 100; // Match chip position
    const size = Math.min(segW * 0.8, 70); // Match chip size
    this.add
      .image(x, y, 'spinButton')
      .setDisplaySize(size, size)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.handleSpin());
  }

  private async handleSpin() {
    const startTime = performance.now();

    try {
      if (this.bets.length === 0) {
        this.outcomeText.setText(this.t(ROULETTE_CONSTANTS.PLACE_BET));
        trackUserAction('spin_failed', { reason: 'no_bets' });
        return;
      }

      // Track spin started
      const totalBetAmount = this.bets.reduce((sum, bet) => sum + bet.denom, 0);
      trackGameEvent('spin_started', 'roulette', {
        bet_count: this.bets.length,
        total_bet_amount: totalBetAmount,
      });
      trackUserAction('spin_started', {
        betCount: this.bets.length,
        totalBetAmount,
        bets: this.bets.map((b) => ({ betType: b.betType, denom: b.denom })),
      });

      try {
        this.spinSound.play();
      } catch (soundError) {
        trackError(soundError as Error, { context: 'spin_sound' });
      }

      // RNG draw with error handling
      let win: number;
      try {
        const { seed } = await initRNG('roulette');
        win = Number.parseInt(seed.slice(-2), 36) % 37;
        trackUserAction('rng_generated', { seed, winningNumber: win });
      } catch (rngError) {
        trackAPIError('initRNG', rngError as Error);
        // Fallback to local random
        win = Math.floor(Math.random() * 37);
        trackUserAction('rng_fallback_used', { winningNumber: win });
      }

      // Wheel animation with error handling
      try {
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
            try {
              wheel.destroy();
              this.dropSound.play();
              this.showResultDigits(win);
              this.resolveBets(win);

              const spinTime = performance.now() - startTime;
              trackPerformance('roulette_spin_complete', spinTime);
              trackUserAction('spin_animation_completed', {
                winningNumber: win,
                spinTime,
              });
            } catch (completionError) {
              trackGameError(completionError as Error, 'roulette', {
                step: 'spin_completion',
                winningNumber: win,
              });
            }
          },
        });
      } catch (animationError) {
        trackGameError(animationError as Error, 'roulette', {
          step: 'wheel_animation',
          winningNumber: win,
        });
        // Fallback: resolve bets immediately
        this.showResultDigits(win);
        this.resolveBets(win);
      }
    } catch (error) {
      trackGameError(error as Error, 'roulette', {
        step: 'handle_spin',
        betCount: this.bets.length,
      });
      this.outcomeText.setText('Error during spin');
    }
  }

  private showResultDigits(win: number) {
    const digits = win.toString().split('');

    this.children.list
      .filter((c) => c.name === 'resultDigit')
      .forEach((c) => c.destroy());

    const size = Math.min(this.cellH, 60); // Responsive size
    const totalWidth = size * digits.length;
    const startX = (this.scale.width - totalWidth) / 2; // Center horizontally
    const y = 100; // Fixed position at top center

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
    try {
      let totalWon = 0;
      let winningBets = 0;
      const totalBetAmount = this.bets.reduce((sum, bet) => sum + bet.denom, 0);
      const { addChips } = useGameStore.getState();

      this.bets.forEach((b) => {
        try {
          b.sprite.destroy();
          if (b.numbers.includes(win)) {
            const winAmount = b.denom * (b.payout + 1); // +1 to return original bet
            totalWon += winAmount;
            addChips(b.denom, b.payout + 1); // Add payout + original bet to store
            winningBets++;
          }
        } catch (betError) {
          trackError(betError as Error, {
            context: 'bet_resolution',
            betType: b.betType,
            denomination: b.denom,
          });
        }
      });

      this.bets = [];

      // Track game result
      const result = totalWon > 0 ? 'win' : 'lose';
      trackGameResult(result, totalBetAmount, 'roulette', totalWon);

      // Track specific spin result
      trackGameEvent('spin_completed', 'roulette', {
        winning_number: win,
        winning_color: this.getNumberColor(win),
        total_bet_amount: totalBetAmount,
        total_won: totalWon,
        winning_bets: winningBets,
        result,
      });

      trackUserAction('bets_resolved', {
        winningNumber: win,
        winningColor: this.getNumberColor(win),
        totalBetAmount,
        totalWon,
        winningBets,
        result,
      });

      if (totalWon > 0) {
        try {
          this.payoutSound.play();
        } catch (soundError) {
          trackError(soundError as Error, { context: 'payout_sound' });
        }

        this.outcomeText.setText(
          this.formatMessage(this.t(ROULETTE_CONSTANTS.HIT_WON), {
            amount: totalWon,
            bets: winningBets,
          })
        );

        try {
          const confetti = this.add
            .sprite(
              this.tableX + this.tableW / 2,
              this.tableY + this.tableH / 2,
              'confetti'
            )
            .setScale(1.5);

          this.time.delayedCall(2000, () => confetti.destroy(), [], this);
        } catch (confettiError) {
          trackError(confettiError as Error, { context: 'confetti_animation' });
        }
      } else {
        this.outcomeText.setText(
          this.formatMessage(this.t(ROULETTE_CONSTANTS.NO_HITS), {
            number: win,
            color: this.getNumberColor(win),
          })
        );
      }
    } catch (error) {
      trackGameError(error as Error, 'roulette', {
        step: 'bet_resolution',
        winningNumber: win,
      });
      this.outcomeText.setText('Error resolving bets');
    }
  }

  private getNumberColor(num: number): string {
    if (num === 0) return 'GREEN';
    return this.RED_NUMBERS.includes(num) ? 'RED' : 'BLACK';
  }
}
