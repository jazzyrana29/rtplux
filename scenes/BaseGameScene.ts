import Phaser from 'phaser';
import {
  trackChipPurchase,
  trackGameEvent,
  trackWithdrawal,
} from '../lib/posthog';
import { useGameStore } from '../stores/gameStore';
import {
  trackAPIError,
  trackError,
  trackGameError,
  trackUserAction,
} from '../lib/sentry';
import { credit, debit } from '../services/wallet';
import { COMMON_CONSTANTS } from '../constants/common';
import i18n from '../lib/i18n';

export type BetType =
  // Roulette bet types
  | 'straight'
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low'
  | 'high'
  | 'dozen1'
  | 'dozen2'
  | 'dozen3'
  | 'column1'
  | 'column2'
  | 'column3'
  // Slots bet types
  | 'line1'
  | 'line2'
  | 'line3'
  | 'line4'
  | 'line5'
  | 'diagonal1'
  | 'diagonal2'
  | 'corners'
  | 'center_cross'
  | 'outer_frame'
  // BlackJack bet types (if needed)
  | 'main_bet'
  | 'insurance_bet'
  | 'side_bet';

type Bet = {
  number?: number;
  betType: BetType;
  numbers: number[];
  denom: number;
  sprite: Phaser.GameObjects.Image;
  payout: number;
};

export abstract class BaseGameScene extends Phaser.Scene {
  // Common UI elements - PROTECTED so child classes can access them
  protected balanceText!: Phaser.GameObjects.Text;
  protected outcomeText!: Phaser.GameObjects.Text;
  protected buyBtn!: Phaser.GameObjects.Text;
  protected withdrawBtn!: Phaser.GameObjects.Text;
  protected resetBtn!: Phaser.GameObjects.Text;
  protected infoBtn!: Phaser.GameObjects.Text;
  protected purchaseContainer!: Phaser.GameObjects.Container;
  protected infoContainer!: Phaser.GameObjects.Container;
  protected bets: Bet[] = [];
  // Common sounds - PROTECTED
  protected buyChipsSound!: Phaser.Sound.BaseSound;
  protected withdrawalSound!: Phaser.Sound.BaseSound;
  protected payoutSound!: Phaser.Sound.BaseSound;
  // Common state - PROTECTED
  protected selectedDenom = 1;
  protected chipImages: Record<number, Phaser.GameObjects.Image> = {};
  protected purchaseCounts: Record<number, number> = {
    1: 0,
    5: 0,
    25: 0,
    100: 0,
  };
  protected purchaseTotalText!: Phaser.GameObjects.Text;
  protected confirmBtn!: Phaser.GameObjects.Text;
  protected cancelBtn!: Phaser.GameObjects.Text;

  protected abstract buildInfoUI(): void;

  protected showInfoUI() {
    // Destroy existing info container if it exists
    if (this.infoContainer) {
      this.infoContainer.destroy();
    }
    this.buildInfoUI();
    this.infoContainer.setVisible(true);
  }

  protected hideInfoUI() {
    // Track info modal closed
    trackGameEvent('info_modal_closed', 'roulette');

    if (this.infoContainer) {
      this.infoContainer.setVisible(false);
      // Clean up the container properly
      this.infoContainer.removeAll(true);
    }
  }

  protected async withdrawChips() {
    try {
      const { getTotalChipValue, resetChips } = useGameStore.getState();
      const total = getTotalChipValue();

      if (total > 0) {
        trackUserAction('withdrawal_attempt', { total });

        // Track withdrawal
        trackWithdrawal(total);

        // Play withdrawal sound
        try {
          this.withdrawalSound.play();
        } catch (soundError) {
          trackError(soundError as Error, { context: 'withdrawal_sound' });
        }

        try {
          const cr = await credit(total);
          if (cr.success) {
            resetChips();
            this.outcomeText.setText(
              this.formatMessage(this.t(COMMON_CONSTANTS.WITHDRAW_SUCCESS), {
                amount: total,
              })
            );
          } else {
            this.outcomeText.setText(this.t(COMMON_CONSTANTS.WITHDRAW_FAILED));
            trackUserAction('withdrawal_failed', {
              total,
              reason: 'credit_failed',
            });
          }
        } catch (creditError) {
          trackAPIError('credit', creditError as Error, { amount: total });
          this.outcomeText.setText('Withdrawal failed');
        }
      } else {
        this.outcomeText.setText(this.t(COMMON_CONSTANTS.NO_CHIPS_TO_WITHDRAW));
        trackUserAction('withdrawal_failed', {
          total: 0,
          reason: 'no_chips',
        });
      }
    } catch (error) {
      trackGameError(error as Error, 'roulette', {
        step: 'chip_withdrawal',
      });
      this.outcomeText.setText('Error processing withdrawal');
    }
  }

  protected updatePurchaseUI() {
    this.purchaseContainer.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.Text && /^x\d/.test(child.text)) {
        const txt = child as Phaser.GameObjects.Text;
        const xPos = txt.x;
        const denom = [1, 5, 25, 100].find((d) => {
          return (
            this.purchaseContainer.list.find(
              (c) =>
                c instanceof Phaser.GameObjects.Image &&
                (c as Phaser.GameObjects.Image).frame.name ===
                  `chips/chip${d}.png` &&
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

  protected async confirmPurchase() {
    try {
      const total = Object.entries(this.purchaseCounts).reduce(
        (s, [den, c]) => s + Number(den) * c,
        0
      );

      if (total > 0) {
        trackUserAction('purchase_attempt', {
          total,
          counts: this.purchaseCounts,
        });

        try {
          const dr = await debit(total);
          if (dr.success) {
            const { addChips } = useGameStore.getState();

            // Track chip purchase
            Object.entries(this.purchaseCounts).forEach(([den, count]) => {
              if (count > 0) {
                trackChipPurchase(Number(den) * count, `chip_${den}`);
              }
            });

            // Add chips to store
            Object.entries(this.purchaseCounts).forEach(([den, c]) => {
              addChips(Number(den), c);
            });

            this.hidePurchaseUI();
            trackUserAction('purchase_successful', { total });
          } else {
            this.outcomeText.setText(dr.message || 'Purchase failed');
            trackUserAction('purchase_failed', {
              total,
              reason: dr.message || 'unknown',
            });
          }
        } catch (debitError) {
          trackAPIError('debit', debitError as Error, { amount: total });
          this.outcomeText.setText('Purchase failed');
        }
      }
    } catch (error) {
      trackGameError(error as Error, 'roulette', {
        step: 'purchase_confirmation',
      });
      this.outcomeText.setText('Error processing purchase');
    }
  }

  protected formatMessage(
    template: string,
    params: Record<string, any>
  ): string {
    return template.replace(/\$\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  protected drawChipPalette() {
    const denoms = [1, 5, 25, 100];
    const chipAreaWidth = Math.min(this.scale.width * 0.8, 600);
    const chipAreaX = (this.scale.width - chipAreaWidth) / 2;
    const segW = chipAreaWidth / 5;
    const y = this.scale.height - 100;
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

  protected selectDenom(d: number) {
    this.selectedDenom = d;
    Object.values(this.chipImages).forEach((img) => img.clearTint());
    this.chipImages[d].setTint(0x00ff00);

    // Track chip selection
    trackGameEvent('chip_selected', 'roulette', {
      denomination: d,
    });
  }

  protected updateChipPalette() {
    const { chipCounts } = useGameStore.getState();
    Object.entries(this.chipImages).forEach(([den, img]) => {
      const count = chipCounts[+den];
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

  protected createTopButtons() {
    const buttonY = 20;
    const buttonWidth = 150;

    // Buy chips button - fixed width
    this.buyBtn = this.add
      .text(
        this.scale.width - 350,
        buttonY,
        this.t(COMMON_CONSTANTS.BUY_CHIPS),
        {
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#0066cc',
          padding: { x: 12, y: 8 },
          fixedWidth: buttonWidth,
          align: 'center',
        }
      )
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.showPurchaseUI())
      .on('pointerover', () => this.buyBtn.setBackgroundColor('#0088ff'))
      .on('pointerout', () => this.buyBtn.setBackgroundColor('#0066cc'));

    // Withdraw button - fixed width
    this.withdrawBtn = this.add
      .text(
        this.scale.width - 210,
        buttonY,
        this.t(COMMON_CONSTANTS.WITHDRAW),
        {
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#00aa00',
          padding: { x: 12, y: 8 },
          fixedWidth: buttonWidth,
          align: 'center',
        }
      )
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.withdrawChips())
      .on('pointerover', () => this.withdrawBtn.setBackgroundColor('#00cc00'))
      .on('pointerout', () => this.withdrawBtn.setBackgroundColor('#00aa00'));

    // Reset bet button - fixed width
    this.resetBtn = this.add
      .text(
        this.scale.width - 350,
        buttonY + 40,
        this.t(COMMON_CONSTANTS.RESET_BETS),
        {
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#cc6600',
          padding: { x: 12, y: 8 },
          fixedWidth: buttonWidth,
          align: 'center',
        }
      )
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.resetBets())
      .on('pointerover', () => this.resetBtn.setBackgroundColor('#ff8800'))
      .on('pointerout', () => this.resetBtn.setBackgroundColor('#cc6600'));

    // Info button - fixed width to match others
    this.infoBtn = this.add
      .text(
        this.scale.width - 210,
        buttonY + 40,
        this.t(COMMON_CONSTANTS.INFO),
        {
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#6600cc',
          padding: { x: 12, y: 8 },
          fixedWidth: buttonWidth,
          align: 'center',
        }
      )
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.showInfoUI())
      .on('pointerover', () => this.infoBtn.setBackgroundColor('#8800ff'))
      .on('pointerout', () => this.infoBtn.setBackgroundColor('#6600cc'));
  }

  protected resetBets() {
    if (this.bets.length === 0) {
      this.outcomeText.setText(this.t(COMMON_CONSTANTS.NO_BETS_TO_RESET));
      return;
    }

    // Track bet reset
    trackGameEvent('bets_reset', 'roulette', {
      bet_count: this.bets.length,
      total_value: this.bets.reduce((sum, bet) => sum + bet.denom, 0),
    });

    // Play withdrawal sound
    this.withdrawalSound.play();

    const betCount = this.bets.length;
    const { addChips } = useGameStore.getState();

    // Return chips to player via store
    this.bets.forEach((bet) => {
      addChips(bet.denom, 1);
      bet.sprite.destroy();
    });

    // Clear all bets
    this.bets = [];

    this.outcomeText.setText(
      this.formatMessage(this.t(COMMON_CONSTANTS.RESET_BETS_SUCCESS), {
        count: betCount,
      })
    );
  }

  protected buildPurchaseUI() {
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
        .image(cx, cy, 'chips', `chips/chip${d}.png`)
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

  protected showPurchaseUI() {
    // Track purchase modal opened
    trackGameEvent('purchase_modal_opened', 'roulette');

    this.purchaseCounts = { 1: 0, 5: 0, 25: 0, 100: 0 };
    this.updatePurchaseUI();
    this.purchaseContainer.setVisible(true);
  }

  protected hidePurchaseUI() {
    // Track purchase modal closed
    trackGameEvent('purchase_modal_closed', 'roulette');

    this.purchaseContainer.setVisible(false);
  }

  protected addPurchase(d: number) {
    const { balance } = useGameStore.getState();
    const total = Object.entries(this.purchaseCounts).reduce(
      (s, [den, c]) => s + Number(den) * c,
      0
    );
    if (total + d <= balance) {
      // Play buy chips sound when adding chips to purchase
      this.buyChipsSound.play();

      this.purchaseCounts[d]++;
      this.updatePurchaseUI();
    }
  }

  protected t(key: string): string {
    return i18n.t(key) || key;
  }

  protected subscribeToStoreChanges() {
    try {
      // Subscribe to store changes
      useGameStore.subscribe((state, prevState) => {
        try {
          // Check if balance changed
          if (state.balance !== prevState.balance) {
            this.balanceText.setText(`Balance: $${state.balance}`);
            trackUserAction('balance_updated', {
              oldBalance: prevState.balance,
              newBalance: state.balance,
            });
          }

          // Check if chip counts changed
          if (
            JSON.stringify(state.chipCounts) !==
            JSON.stringify(prevState.chipCounts)
          ) {
            this.updateChipPalette();
            trackUserAction('chip_counts_updated', {
              oldCounts: prevState.chipCounts,
              newCounts: state.chipCounts,
            });
          }
        } catch (subscriptionError) {
          trackError(subscriptionError as Error, {
            context: 'store_subscription_callback',
          });
        }
      });
    } catch (error) {
      trackError(error as Error, { context: 'store_subscription_setup' });
      throw error;
    }
  }
}
