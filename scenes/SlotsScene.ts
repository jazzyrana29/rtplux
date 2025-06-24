import Phaser from 'phaser';
import { useGameStore } from '../stores/gameStore';
import { trackGameEvent } from '../lib/posthog';
import {
  trackGameError,
  trackPerformance,
  trackUserAction,
} from '../lib/sentry';
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
      // Track game loading
      trackGameEvent('game_loading_started', 'slots');
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
        '/public/assets/games/roulette/spin_button.webp'
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

      // Track loading completion
      this.load.on('complete', () => {
        const loadTime = performance.now() - startTime;
        trackPerformance('slots_assets_loaded', loadTime);
        trackUserAction('slots_preload_completed', { loadTime });
      });

      // Track loading errors
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
}
