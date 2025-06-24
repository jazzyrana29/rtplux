import { useGameStore } from '../stores/gameStore';
import { trackGameEvent } from '../lib/posthog';
import {
  trackGameError,
  trackPerformance,
  trackUserAction,
} from '../lib/sentry';
import { BaseGameScene } from './BaseGameScene';
import { ROULETTE_CONSTANTS } from '../constants/roulette';

type SlotSymbol =
  | 'cherry'
  | 'lemon'
  | 'orange'
  | 'plum'
  | 'bell'
  | 'bar'
  | 'seven';

export default class SlotsScene extends BaseGameScene {
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

      // Draw table and calculate metrics
      try {
        this.drawTable();
        trackUserAction('slots_table_drawn');
      } catch (tableError) {
        trackGameError(tableError as Error, 'slots', {
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
        trackUserAction('slots_controls_created');
      } catch (controlsError) {
        trackGameError(controlsError as Error, 'slots', {
          step: 'controls_creation',
        });
        throw controlsError;
      }
    } catch (error) {
      trackGameError(error as Error, 'slots', {
        step: 'create_method',
        startTime,
      });
      throw error;
    }
  }

  protected buildInfoUI(): void {}

  private createSpinButton(): void {}

  private drawTable(): void {}
}
