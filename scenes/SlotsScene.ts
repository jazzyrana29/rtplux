import Phaser from 'phaser';
import { useGameStore } from '../stores/gameStore';
import { trackGameEvent } from '../lib/posthog';
import {
  trackAPIError,
  trackError,
  trackGameError,
  trackPerformance,
  trackUserAction,
} from '../lib/sentry';
import { BaseGameScene, type BetType } from './BaseGameScene';
import { ROULETTE_CONSTANTS } from '../constants/roulette';
import { initRNG } from '../services/rng';

type SlotSymbol =
  | 'cherry'
  | 'lemon'
  | 'orange'
  | 'plum'
  | 'bell'
  | 'beer'
  | 'seven';

interface SlotGrid {
  symbols: SlotSymbol[][];
}

interface PaylineResult {
  line: BetType;
  symbols: SlotSymbol[];
  payout: number;
  positions: { row: number; col: number }[];
}

export default class SlotsScene extends BaseGameScene {
  protected spinSound!: Phaser.Sound.BaseSound;
  protected dropSound!: Phaser.Sound.BaseSound;
  // Slot-specific properties
  private slotGrid: SlotGrid = { symbols: [] };
  private symbolSprites: Phaser.GameObjects.Image[][] = [];
  private isSpinning = false;

  // Layout properties
  private gridX!: number;
  private gridY!: number;
  private cellSize!: number;
  private gridContainer!: Phaser.GameObjects.Container;

  // Paylines and their positions
  private readonly PAYLINES: Record<BetType, { row: number; col: number }[]> = {
    line1: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ],
    line2: [
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
    ],
    line3: [
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
    ],
    line4: [
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
    ],
    line5: [
      { row: 4, col: 0 },
      { row: 4, col: 1 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
    ],
    diagonal1: [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 3 },
      { row: 4, col: 4 },
    ],
    diagonal2: [
      { row: 4, col: 0 },
      { row: 3, col: 1 },
      { row: 2, col: 2 },
      { row: 1, col: 3 },
      { row: 0, col: 4 },
    ],
    corners: [
      { row: 0, col: 0 },
      { row: 0, col: 4 },
      { row: 2, col: 2 },
      { row: 4, col: 0 },
      { row: 4, col: 4 },
    ],
    center_cross: [
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
    ],
    outer_frame: [
      { row: 0, col: 0 },
      { row: 0, col: 4 },
      { row: 2, col: 0 },
      { row: 2, col: 4 },
      { row: 4, col: 0 },
    ],
    // Roulette types (not used in slots)
    straight: [],
    red: [],
    black: [],
    even: [],
    odd: [],
    low: [],
    high: [],
    dozen1: [],
    dozen2: [],
    dozen3: [],
    column1: [],
    column2: [],
    column3: [],
  };

  // Symbol payouts (for 3, 4, 5 matches)
  private readonly SYMBOL_PAYOUTS: Record<
    SlotSymbol,
    [number, number, number]
  > = {
    cherry: [2, 5, 10],
    lemon: [2, 5, 10],
    orange: [3, 8, 15],
    plum: [3, 8, 15],
    bell: [5, 12, 25],
    beer: [5, 12, 25],
    seven: [10, 25, 50],
  };

  private readonly SYMBOLS: SlotSymbol[] = [
    'cherry',
    'lemon',
    'orange',
    'plum',
    'bell',
    'beer',
    'seven',
  ];

  constructor() {
    super({ key: 'SlotsScene' });
  }

  preload(): void {
    const startTime = performance.now();

    try {
      trackGameEvent('game_loading_started', 'slots');
      trackUserAction('slots_preload_started');

      // Load chip atlas
      this.load.atlas(
        'chips',
        '/public/assets/games/common/chips.webp',
        '/public/assets/games/common/chips.json'
      );

      // Load slots sprites
      this.load.atlas(
        'slotsSprites',
        '/public/assets/games/slots/slotsSprites.webp',
        '/public/assets/games/slots/slotsSprites.json'
      );

      // Load spin button
      this.load.image(
        'spinButton',
        '/public/assets/games/common/spin_button.webp'
      );

      // Load confetti atlas
      this.load.atlas(
        'confetti',
        '/public/assets/games/common/confetti-0.webp',
        '/public/assets/games/common/confetti-0.json'
      );

      // Load sounds
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
        'spinSound',
        '/public/assets/games/common/audio/spin.mp3'
      );
      this.load.audio(
        'withdrawalSound',
        '/public/assets/games/common/audio/withdrawal.mp3'
      );

      this.load.on('complete', () => {
        const loadTime = performance.now() - startTime;
        trackPerformance('slots_assets_loaded', loadTime);
        trackUserAction('slots_preload_completed', { loadTime });
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
      try {
        this.spinSound = this.sound.add('spinSound');
        this.dropSound = this.sound.add('dropSound');
        this.payoutSound = this.sound.add('payoutSound');
        this.buyChipsSound = this.sound.add('buyChipsSound');
        this.withdrawalSound = this.sound.add('withdrawalSound');
      } catch (soundError) {
        trackGameError(soundError as Error, 'slots', {
          step: 'sound_initialization',
        });
      }

      const createTime = performance.now() - startTime;
      trackPerformance('slots_scene_creation', createTime);

      const { balance } = useGameStore.getState();
      trackGameEvent('game_session_started', 'slots', {
        initial_balance: balance,
      });

      // Draw table and calculate metrics
      try {
        this.drawTable();
        trackUserAction('slots_table_drawn');
      } catch (tableError) {
        trackGameError(tableError as Error, 'slots', { step: 'table_drawing' });
        throw tableError;
      }

      // Get balance from store and display
      try {
        this.balanceText = this.add
          .text(20, 20, `${this.t(ROULETTE_CONSTANTS.BALANCE)}: $${balance}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
          })
          .setShadow(2, 2, '#000', 2);

        this.outcomeText = this.add
          .text(20, 60, '', {
            fontSize: '18px',
            color: '#ffff00',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0);

        trackUserAction('slots_ui_texts_created', { balance });
      } catch (uiError) {
        trackGameError(uiError as Error, 'slots', { step: 'ui_creation' });
        throw uiError;
      }

      // Build UI controls
      try {
        this.createTopButtons();
        this.drawChipPalette();
        this.createSpinButton();
        this.enablePaylineBetting();
        this.buildPurchaseUI();
        trackUserAction('slots_controls_created');
      } catch (controlsError) {
        trackGameError(controlsError as Error, 'slots', {
          step: 'controls_creation',
        });
        throw controlsError;
      }

      // Initialize slot grid
      this.initializeSlotGrid();

      // Subscribe to store changes
      this.subscribeToStoreChanges();
    } catch (error) {
      trackGameError(error as Error, 'slots', {
        step: 'create_method',
        startTime,
      });
      throw error;
    }
  }

  protected buildInfoUI(): void {
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

    const contentContainer = this.add.container(0, 0);
    this.infoContainer.add(contentContainer);

    const maskY = py + 60;
    const maskHeight = ph - 120;
    const scrollMask = this.add.graphics();
    scrollMask.fillStyle(0x000000, 0);
    scrollMask.fillRect(px + 10, maskY, pw - 20, maskHeight);
    contentContainer.setMask(scrollMask.createGeometryMask());

    let currentY = maskY + 10;
    const leftMargin = px + 20;
    const rightMargin = px + pw - 100;
    const lineHeight = 22;

    const slotsInfo = [
      { title: 'HOW TO PLAY SLOTS', color: '#ffff00', isHeader: true },
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
        text: '3. Click on payline betting areas to place bets',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '4. Click SPIN button to start the round',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '5. Match 3+ symbols on active paylines to win',
        payout: '',
        color: '#ffffff',
      },
      '',
      { title: 'PAYLINES', color: '#ffff00', isHeader: true },
      {
        text: 'Line 1-5: Horizontal rows (top to bottom)',
        payout: '',
        color: '#ffffff',
      },
      {
        text: 'Diagonal 1: Top-left to bottom-right',
        payout: '',
        color: '#ffffff',
      },
      {
        text: 'Diagonal 2: Bottom-left to top-right',
        payout: '',
        color: '#ffffff',
      },
      { text: 'Corners: Four corners + center', payout: '', color: '#ffffff' },
      { text: 'Center Cross: Middle row', payout: '', color: '#ffffff' },
      {
        text: 'Outer Frame: Outer edge positions',
        payout: '',
        color: '#ffffff',
      },
      '',
      { title: 'SYMBOL PAYOUTS', color: '#ffff00', isHeader: true },
      { text: 'Cherry/Lemon: 3=2x, 4=5x, 5=10x', payout: '', color: '#ffffff' },
      { text: 'Orange/Plum: 3=3x, 4=8x, 5=15x', payout: '', color: '#ffffff' },
      { text: 'Bell/Beer: 3=5x, 4=12x, 5=25x', payout: '', color: '#ffffff' },
      { text: 'Seven: 3=10x, 4=25x, 5=50x', payout: '', color: '#ffffff' },
      '',
      { title: 'WINNING EXAMPLES', color: '#ffff00', isHeader: true },
      { text: 'Bet $5 on Line 1, get 3 Sevens:', payout: '', color: '#ffffff' },
      { text: '→ Win $50 (10x multiplier)', payout: '', color: '#00ff00' },
      {
        text: 'Bet $10 on Diagonal, get 5 Bells:',
        payout: '',
        color: '#ffffff',
      },
      { text: '→ Win $250 (25x multiplier)', payout: '', color: '#00ff00' },
      '',
      { title: 'STRATEGY TIPS', color: '#ffff00', isHeader: true },
      {
        text: '• Bet on multiple paylines for better chances',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '• Higher value symbols = bigger payouts',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '• 5 matching symbols give maximum payout',
        payout: '',
        color: '#ffffff',
      },
      {
        text: '• Manage your bankroll carefully',
        payout: '',
        color: '#ffffff',
      },
    ];

    slotsInfo.forEach((info) => {
      if (typeof info === 'string') {
        currentY += lineHeight * 0.4;
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
      }
    });

    // Scroll functionality
    let scrollY = 0;
    const maxScroll = Math.max(0, currentY - (maskY + maskHeight - 20));

    this.input.on(
      'wheel',
      (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
        if (this.infoContainer.visible) {
          scrollY = Phaser.Math.Clamp(scrollY + deltaY * 0.5, -maxScroll, 0);
          contentContainer.setY(scrollY);
        }
      }
    );

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

  protected drawChipPalette() {
    const denoms = [1, 5, 25, 100];
    const chipAreaWidth = Math.min(this.scale.width * 0.8, 600);
    const chipAreaX = (this.scale.width - chipAreaWidth) / 2;
    const segW = chipAreaWidth / 5;
    const y = this.scale.height - 60; // Changed from -100 to -60 to move chips down
    const iconSize = Math.min(segW * 0.8, 70);

    denoms.forEach((d, i) => {
      const x = chipAreaX + segW * (i + 0.5);
      this.chipImages[d] = this.add
        .image(x, y, 'chips', `chips/chip${d}.png`)
        .setDisplaySize(iconSize, iconSize)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.selectDenom(d));

      // Get initial chip count from store
      const { chipCounts } = useGameStore.getState();
      this.add
        .text(x, y + iconSize * 0.7, `x${chipCounts[d]}`, {
          fontSize: '18px',
          color: '#fff',
        })
        .setOrigin(0.5);

      if (i === 0) {
        this.selectDenom(d);
      }
    });
  }

  private createSpinButton(): void {
    const chipAreaWidth = Math.min(this.scale.width * 0.8, 600);
    const chipAreaX = (this.scale.width - chipAreaWidth) / 2;
    const segW = chipAreaWidth / 5;
    const x = chipAreaX + segW * 4.5;
    const y = this.scale.height - 60; // Changed from -100 to -60 to match chips
    const size = Math.min(segW * 0.8, 70);

    this.add
      .image(x, y, 'spinButton')
      .setDisplaySize(size, size)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.handleSpin());
  }

  private drawTable(): void {
    const { width, height } = this.scale;

    // Calculate grid dimensions
    this.cellSize = Math.min(width * 0.12, height * 0.12, 80);
    const gridWidth = this.cellSize * 5;
    const gridHeight = this.cellSize * 5;
    this.gridX = (width - gridWidth) / 2;
    this.gridY = height * 0.15;

    // Create background
    const tableBg = this.add
      .rectangle(
        this.gridX + gridWidth / 2,
        this.gridY + gridHeight / 2 + 60,
        gridWidth + 40,
        gridHeight + 200,
        0x003300
      )
      .setDepth(-1);

    // Create grid container
    this.gridContainer = this.add.container(0, 0).setDepth(1);

    // Draw grid cells
    const g = this.add.graphics();
    g.setDepth(0);

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const x = this.gridX + col * this.cellSize;
        const y = this.gridY + row * this.cellSize;

        g.fillStyle(0x001100);
        g.fillRect(x, y, this.cellSize, this.cellSize);
        g.lineStyle(2, 0xffffff, 1);
        g.strokeRect(x, y, this.cellSize, this.cellSize);
      }
    }

    // Draw payline betting areas
    this.drawPaylineBets(g);
  }

  private drawPaylineBets(g: Phaser.GameObjects.Graphics): void {
    const betAreaY = this.gridY + this.cellSize * 5 + 30; // Increased from 20 to 30
    const betAreaWidth = this.cellSize * 5;
    const betAreaHeight = 25; // Reduced from 30 to 25 to make more compact

    const paylines = [
      { key: 'line1', label: 'Line 1', color: 0x006600 },
      { key: 'line2', label: 'Line 2', color: 0x006600 },
      { key: 'line3', label: 'Line 3', color: 0x006600 },
      { key: 'line4', label: 'Line 4', color: 0x006600 },
      { key: 'line5', label: 'Line 5', color: 0x006600 },
      { key: 'diagonal1', label: 'Diag 1', color: 0x660066 },
      { key: 'diagonal2', label: 'Diag 2', color: 0x660066 },
      { key: 'corners', label: 'Corners', color: 0x666600 },
      { key: 'center_cross', label: 'Cross', color: 0x666600 },
      { key: 'outer_frame', label: 'Frame', color: 0x666600 },
    ];

    paylines.forEach((payline, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      const x = this.gridX + col * (betAreaWidth / 5);
      const y = betAreaY + row * (betAreaHeight + 8); // Increased spacing from 5 to 8
      const w = betAreaWidth / 5 - 2;

      g.fillStyle(payline.color);
      g.fillRect(x, y, w, betAreaHeight);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeRect(x, y, w, betAreaHeight);

      this.add
        .text(x + w / 2, y + betAreaHeight / 2, payline.label, {
          fontSize: '9px', // Reduced from 10px to 9px
          color: '#fff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(1);
    });
  }

  private enablePaylineBetting(): void {
    const betAreaY = this.gridY + this.cellSize * 5 + 30; // Match drawPaylineBets
    const betAreaWidth = this.cellSize * 5;
    const betAreaHeight = 25; // Match drawPaylineBets

    const paylines: BetType[] = [
      'line1',
      'line2',
      'line3',
      'line4',
      'line5',
      'diagonal1',
      'diagonal2',
      'corners',
      'center_cross',
      'outer_frame',
    ];

    paylines.forEach((payline, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      const x = this.gridX + col * (betAreaWidth / 5);
      const y = betAreaY + row * (betAreaHeight + 8); // Match spacing
      const w = betAreaWidth / 5 - 2;

      this.add
        .rectangle(x + w / 2, y + betAreaHeight / 2, w, betAreaHeight, 0, 0)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.placeBet(payline));
    });
  }

  private async placeBet(betType: BetType): Promise<void> {
    try {
      const { chipCounts, removeChips } = useGameStore.getState();

      if (chipCounts[this.selectedDenom] <= 0) {
        this.outcomeText.setText(`No $${this.selectedDenom} chips left!`);
        trackUserAction('bet_placement_failed', {
          reason: 'insufficient_chips',
          denomination: this.selectedDenom,
        });
        return;
      }

      trackUserAction('bet_placed_slots', {
        denomination: this.selectedDenom,
        betType,
        game: 'slots',
      });

      try {
        this.buyChipsSound.play();
      } catch (soundError) {
        trackError(soundError as Error, { context: 'bet_placement_sound' });
      }

      removeChips(this.selectedDenom, 1);

      // Position chip on betting area
      const position = this.getPaylineBetPosition(betType);
      const iconSize = 20;

      const existing = this.bets.filter((b) => b.betType === betType).length;
      const offsets: [number, number][] = [
        [-0.3, -0.3],
        [0.3, -0.3],
        [-0.3, 0.3],
        [0.3, 0.3],
      ];
      const [ox, oy] = offsets[existing % offsets.length];

      const sprite = this.add
        .image(
          position.x + ox * 15,
          position.y + oy * 10,
          'chips',
          `chips/chip${this.selectedDenom}.png`
        )
        .setDisplaySize(iconSize, iconSize)
        .setDepth(1);

      this.bets.push({
        betType,
        numbers: [], // Not used for slots
        denom: this.selectedDenom,
        sprite,
        payout: 1, // Will be calculated based on symbols
      });

      trackUserAction('bet_placed_successfully', {
        totalBets: this.bets.length,
        betValue: this.selectedDenom,
      });
    } catch (error) {
      trackGameError(error as Error, 'slots', {
        step: 'bet_placement',
        betType,
        denomination: this.selectedDenom,
      });
      this.outcomeText.setText('Error placing bet');
    }
  }

  private getPaylineBetPosition(betType: BetType): { x: number; y: number } {
    const betAreaY = this.gridY + this.cellSize * 5 + 20;
    const betAreaWidth = this.cellSize * 5;
    const betAreaHeight = 30;

    const paylines: BetType[] = [
      'line1',
      'line2',
      'line3',
      'line4',
      'line5',
      'diagonal1',
      'diagonal2',
      'corners',
      'center_cross',
      'outer_frame',
    ];

    const index = paylines.indexOf(betType);
    const row = Math.floor(index / 5);
    const col = index % 5;
    const x = this.gridX + col * (betAreaWidth / 5) + betAreaWidth / 5 / 2;
    const y = betAreaY + row * (betAreaHeight + 5) + betAreaHeight / 2;

    return { x, y };
  }

  private initializeSlotGrid(): void {
    this.slotGrid.symbols = [];
    this.symbolSprites = [];

    for (let row = 0; row < 5; row++) {
      this.slotGrid.symbols[row] = [];
      this.symbolSprites[row] = [];

      for (let col = 0; col < 5; col++) {
        const symbol = this.getRandomSymbol();
        this.slotGrid.symbols[row][col] = symbol;

        const x = this.gridX + col * this.cellSize + this.cellSize / 2;
        const y = this.gridY + row * this.cellSize + this.cellSize / 2;

        const sprite = this.add
          .image(x, y, 'slotsSprites', `spriteIcons/${symbol}.png`)
          .setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8)
          .setDepth(2);

        this.symbolSprites[row][col] = sprite;
        this.gridContainer.add(sprite);
      }
    }
  }

  private getRandomSymbol(): SlotSymbol {
    return this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)];
  }

  private async handleSpin(): Promise<void> {
    if (this.isSpinning) return;

    const startTime = performance.now();

    try {
      if (this.bets.length === 0) {
        this.outcomeText.setText('Place a bet first!');
        trackUserAction('spin_failed', { reason: 'no_bets' });
        return;
      }

      this.isSpinning = true;
      const totalBetAmount = this.bets.reduce((sum, bet) => sum + bet.denom, 0);

      trackGameEvent('spin_started', 'slots', {
        bet_count: this.bets.length,
        total_bet_amount: totalBetAmount,
      });

      try {
        this.spinSound.play();
      } catch (soundError) {
        trackError(soundError as Error, { context: 'spin_sound' });
      }

      // Generate new symbols using RNG
      let newGrid: SlotSymbol[][];
      try {
        const { seed } = await initRNG('slots');
        newGrid = this.generateGridFromSeed(seed);
      } catch (rngError) {
        trackAPIError('initRNG', rngError as Error);
        newGrid = this.generateRandomGrid();
      }

      // Animate spinning
      await this.animateSpinning(newGrid);

      // Update grid
      this.slotGrid.symbols = newGrid;
      this.updateSymbolSprites();

      // Resolve bets
      await this.resolveBets();

      this.isSpinning = false;

      const spinTime = performance.now() - startTime;
      trackPerformance('slots_spin_complete', spinTime);
    } catch (error) {
      this.isSpinning = false;
      trackGameError(error as Error, 'slots', { step: 'handle_spin' });
      this.outcomeText.setText('Error during spin');
    }
  }

  private generateGridFromSeed(seed: string): SlotSymbol[][] {
    const grid: SlotSymbol[][] = [];
    let seedIndex = 0;

    for (let row = 0; row < 5; row++) {
      grid[row] = [];
      for (let col = 0; col < 5; col++) {
        const charCode = seed.charCodeAt(seedIndex % seed.length);
        const symbolIndex = charCode % this.SYMBOLS.length;
        grid[row][col] = this.SYMBOLS[symbolIndex];
        seedIndex++;
      }
    }

    return grid;
  }

  private generateRandomGrid(): SlotSymbol[][] {
    const grid: SlotSymbol[][] = [];
    for (let row = 0; row < 5; row++) {
      grid[row] = [];
      for (let col = 0; col < 5; col++) {
        grid[row][col] = this.getRandomSymbol();
      }
    }
    return grid;
  }

  private async animateSpinning(newGrid: SlotSymbol[][]): Promise<void> {
    return new Promise((resolve) => {
      const spinDuration = 2000;
      const spinSpeed = 100;

      // Create spinning effect by rapidly changing symbols
      const spinInterval = setInterval(() => {
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            const randomSymbol = this.getRandomSymbol();
            this.symbolSprites[row][col].setTexture(
              'slotsSprites',
              `spriteIcons/${randomSymbol}.png`
            );
          }
        }
      }, spinSpeed);

      // Stop spinning and show final result
      setTimeout(() => {
        clearInterval(spinInterval);

        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            this.symbolSprites[row][col].setTexture(
              'slotsSprites',
              `spriteIcons/${newGrid[row][col]}.png`
            );
          }
        }

        try {
          this.dropSound.play();
        } catch (soundError) {
          trackError(soundError as Error, { context: 'drop_sound' });
        }

        resolve();
      }, spinDuration);
    });
  }

  private updateSymbolSprites(): void {
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const symbol = this.slotGrid.symbols[row][col];
        this.symbolSprites[row][col].setTexture(
          'slotsSprites',
          `spriteIcons/${symbol}.png`
        );
      }
    }
  }

  private async resolveBets(): Promise<void> {
    try {
      let totalWon = 0;
      let winningBets = 0;
      const totalBetAmount = this.bets.reduce((sum, bet) => sum + bet.denom, 0);
      const { addChips } = useGameStore.getState();
      const winningPaylines: PaylineResult[] = [];
      const winDetails: string[] = [];

      // Check each bet for wins
      this.bets.forEach((bet) => {
        try {
          bet.sprite.destroy();

          const paylinePositions = this.PAYLINES[bet.betType];
          if (paylinePositions && paylinePositions.length > 0) {
            const symbols = paylinePositions.map(
              (pos) => this.slotGrid.symbols[pos.row][pos.col]
            );
            const payout = this.calculatePayout(symbols);

            if (payout > 0) {
              const winAmount = bet.denom * payout;
              totalWon += winAmount;
              addChips(bet.denom, payout);
              winningBets++;

              // Get winning symbol details
              const winningSymbol = this.getWinningSymbol(symbols);
              const symbolCount = this.getSymbolCount(symbols, winningSymbol);

              winDetails.push(
                `${bet.betType.toUpperCase()}: ${symbolCount}x ${winningSymbol.toUpperCase()} = $${winAmount}`
              );

              winningPaylines.push({
                line: bet.betType,
                symbols,
                payout,
                positions: paylinePositions,
              });
            }
          }
        } catch (betError) {
          trackError(betError as Error, {
            context: 'bet_resolution',
            betType: bet.betType,
            denomination: bet.denom,
          });
        }
      });

      this.bets = [];

      // Track results
      const result = totalWon > 0 ? 'win' : 'lose';
      trackGameEvent('game_result', 'slots', {
        result,
        total_bet_amount: totalBetAmount,
        total_won: totalWon,
      });

      trackGameEvent('spin_completed', 'slots', {
        total_bet_amount: totalBetAmount,
        total_won: totalWon,
        winning_bets: winningBets,
        result,
        winning_paylines: winningPaylines.length,
      });

      if (totalWon > 0) {
        try {
          this.payoutSound.play();
        } catch (soundError) {
          trackError(soundError as Error, { context: 'payout_sound' });
        }

        // Enhanced win message with details
        let winMessage = `🎉 BIG WIN! $${totalWon} from ${winningBets} payline${winningBets > 1 ? 's' : ''}!\n`;
        winDetails.forEach((detail) => {
          winMessage += `• ${detail}\n`;
        });

        this.outcomeText.setText(winMessage);

        // Show confetti
        try {
          const confetti = this.add
            .sprite(
              this.gridX + this.cellSize * 2.5,
              this.gridY + this.cellSize * 2.5,
              'confetti'
            )
            .setScale(1.5);
          this.time.delayedCall(2000, () => confetti.destroy(), [], this);
        } catch (confettiError) {
          trackError(confettiError as Error, { context: 'confetti_animation' });
        }

        // Highlight winning paylines
        this.highlightWinningPaylines(winningPaylines);
      } else {
        this.outcomeText.setText(
          `No winning combinations this time.\nBet: $${totalBetAmount} • Result: No matches\nTry betting on more paylines!`
        );
      }
    } catch (error) {
      trackGameError(error as Error, 'slots', { step: 'bet_resolution' });
      this.outcomeText.setText('Error resolving bets');
    }
  }

  private calculatePayout(symbols: SlotSymbol[]): number {
    if (symbols.length < 3) return 0;

    // Count symbol occurrences
    const symbolCounts: Record<SlotSymbol, number> = {
      cherry: 0,
      lemon: 0,
      orange: 0,
      plum: 0,
      bell: 0,
      beer: 0,
      seven: 0,
    };

    symbols.forEach((symbol) => {
      symbolCounts[symbol]++;
    });

    // Find the highest count and corresponding symbol
    let maxCount = 0;
    let winningSymbol: SlotSymbol | null = null;

    Object.entries(symbolCounts).forEach(([symbol, count]) => {
      if (count >= 3 && count > maxCount) {
        maxCount = count;
        winningSymbol = symbol as SlotSymbol;
      }
    });

    if (!winningSymbol || maxCount < 3) return 0;

    // Return payout based on symbol and count
    const payouts = this.SYMBOL_PAYOUTS[winningSymbol];
    if (maxCount === 3) return payouts[0];
    if (maxCount === 4) return payouts[1];
    if (maxCount >= 5) return payouts[2];

    return 0;
  }

  private getWinningSymbol(symbols: SlotSymbol[]): SlotSymbol {
    const symbolCounts: Record<SlotSymbol, number> = {
      cherry: 0,
      lemon: 0,
      orange: 0,
      plum: 0,
      bell: 0,
      beer: 0,
      seven: 0,
    };

    symbols.forEach((symbol) => {
      symbolCounts[symbol]++;
    });

    let maxCount = 0;
    let winningSymbol: SlotSymbol = 'cherry';

    Object.entries(symbolCounts).forEach(([symbol, count]) => {
      if (count >= 3 && count > maxCount) {
        maxCount = count;
        winningSymbol = symbol as SlotSymbol;
      }
    });

    return winningSymbol;
  }

  private getSymbolCount(
    symbols: SlotSymbol[],
    targetSymbol: SlotSymbol
  ): number {
    return symbols.filter((symbol) => symbol === targetSymbol).length;
  }

  private highlightWinningPaylines(winningPaylines: PaylineResult[]): void {
    // Clear previous highlights
    this.children.list
      .filter((child) => child.name === 'winHighlight')
      .forEach((child) => child.destroy());

    winningPaylines.forEach((payline, index) => {
      payline.positions.forEach((pos) => {
        const x = this.gridX + pos.col * this.cellSize + this.cellSize / 2;
        const y = this.gridY + pos.row * this.cellSize + this.cellSize / 2;

        const highlight = this.add
          .rectangle(x, y, this.cellSize, this.cellSize, 0xffff00, 0.3)
          .setDepth(3)
          .setName('winHighlight');

        // Animate highlight
        this.tweens.add({
          targets: highlight,
          alpha: { from: 0.3, to: 0.7 },
          duration: 500,
          yoyo: true,
          repeat: 3,
          onComplete: () => highlight.destroy(),
        });
      });
    });
  }
}
