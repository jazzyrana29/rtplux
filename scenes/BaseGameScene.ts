import Phaser from 'phaser';
import { credit, debit } from '../services/wallet';
import { useGameStore } from '../stores/gameStore';
import { trackChipPurchase, trackGameEvent } from '../lib/posthog';
import { trackAPIError, trackError, trackGameError } from '../lib/sentry';
import i18n from '../lib/i18n';

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

  // Abstract methods that child classes must implement
  protected abstract getGameName(): string;

  protected abstract getBuyChipsConstant(): string;

  protected abstract getWithdrawConstant(): string;

  protected abstract getResetBetsConstant(): string;

  protected abstract getInfoConstant(): string;

  protected abstract getBalanceConstant(): string;

  protected abstract resetGameSpecificBets(): void;

  protected abstract buildGameSpecificInfoUI(): void;

  protected t(key: string): string {
    return i18n.t(key) || key;
  }

  protected formatMessage(
    template: string,
    params: Record<string, any>
  ): string {
    return template.replace(/\$\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  protected initializeCommonSounds() {
    try {
      this.buyChipsSound = this.sound.add('buyChipsSound');
      this.withdrawalSound = this.sound.add('withdrawalSound');
      this.payoutSound = this.sound.add('payoutSound');
    } catch (soundError) {
      trackGameError(soundError as Error, this.getGameName(), {
        step: 'common_sound_initialization',
      });
    }
  }

  protected createCommonUI() {
    try {
      const { balance } = useGameStore.getState();
      this.balanceText = this.add
        .text(20, 20, `${this.t(this.getBalanceConstant())}: $${balance}`, {
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
    } catch (error) {
      trackGameError(error as Error, this.getGameName(), {
        step: 'common_ui_creation',
      });
      throw error;
    }
  }

  protected createTopButtons() {
    const buttonY = 20;
    const buttonWidth = 100;

    // Buy chips button
    this.buyBtn = this.add
      .text(
        this.scale.width - 220,
        buttonY,
        this.t(this.getBuyChipsConstant()),
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

    // Withdraw button
    this.withdrawBtn = this.add
      .text(
        this.scale.width - 110,
        buttonY,
        this.t(this.getWithdrawConstant()),
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

    // Reset bet button
    this.resetBtn = this.add
      .text(
        this.scale.width - 220,
        buttonY + 40,
        this.t(this.getResetBetsConstant()),
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

    // Info button
    this.infoBtn = this.add
      .text(
        this.scale.width - 110,
        buttonY + 40,
        this.t(this.getInfoConstant()),
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
        .image(x, y, 'chips', `chip${d}.png`)
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
    trackGameEvent('chip_selected', this.getGameName(), {
      denomination: d,
    });

    // Allow child classes to handle additional logic
    this.onDenomSelected(d);
  }

  protected onDenomSelected(denomination: number) {
    // Override in child classes if needed
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

  protected subscribeToStoreChanges() {
    try {
      useGameStore.subscribe((state, prevState) => {
        try {
          if (state.balance !== prevState.balance) {
            this.balanceText.setText(
              `${this.t(this.getBalanceConstant())}: $${state.balance}`
            );
          }

          if (
            JSON.stringify(state.chipCounts) !==
            JSON.stringify(prevState.chipCounts)
          ) {
            this.updateChipPalette();
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

  protected resetBets() {
    this.resetGameSpecificBets();
    trackGameEvent('bets_reset', this.getGameName());
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

  protected showPurchaseUI() {
    trackGameEvent('purchase_modal_opened', this.getGameName());
    this.purchaseCounts = { 1: 0, 5: 0, 25: 0, 100: 0 };
    this.updatePurchaseUI();
    this.purchaseContainer.setVisible(true);
  }

  protected hidePurchaseUI() {
    trackGameEvent('purchase_modal_closed', this.getGameName());
    this.purchaseContainer.setVisible(false);
  }

  protected addPurchase(d: number) {
    const { balance } = useGameStore.getState();
    const total = Object.entries(this.purchaseCounts).reduce(
      (s, [den, c]) => s + Number(den) * c,
      0
    );
    if (total + d <= balance) {
      this.buyChipsSound.play();
      this.purchaseCounts[d]++;
      this.updatePurchaseUI();
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

  protected async confirmPurchase() {
    try {
      const total = Object.entries(this.purchaseCounts).reduce(
        (s, [den, c]) => s + Number(den) * c,
        0
      );

      if (total > 0) {
        try {
          const dr = await debit(total);
          if (dr.success) {
            const { addChips } = useGameStore.getState();

            Object.entries(this.purchaseCounts).forEach(([den, count]) => {
              if (count > 0) {
                trackChipPurchase(Number(den) * count, `chip_${den}`);
              }
            });

            Object.entries(this.purchaseCounts).forEach(([den, c]) => {
              addChips(Number(den), c);
            });

            this.hidePurchaseUI();
          } else {
            this.outcomeText.setText(dr.message || 'Purchase failed');
          }
        } catch (debitError) {
          trackAPIError('debit', debitError as Error, { amount: total });
          this.outcomeText.setText('Purchase failed');
        }
      }
    } catch (error) {
      trackGameError(error as Error, this.getGameName(), {
        step: 'purchase_confirmation',
      });
      this.outcomeText.setText('Error processing purchase');
    }
  }

  protected async withdrawChips() {
    try {
      const { getTotalChipValue, resetChips } = useGameStore.getState();
      const total = getTotalChipValue();

      if (total > 0) {
        try {
          this.withdrawalSound.play();
        } catch (soundError) {
          trackError(soundError as Error, { context: 'withdrawal_sound' });
        }

        try {
          const cr = await credit(total);
          if (cr.success) {
            resetChips();
            this.outcomeText.setText(`Withdrew ${total} chips`);
          } else {
            this.outcomeText.setText('Withdrawal failed');
          }
        } catch (creditError) {
          trackAPIError('credit', creditError as Error, { amount: total });
          this.outcomeText.setText('Withdrawal failed');
        }
      } else {
        this.outcomeText.setText('No chips to withdraw.');
      }
    } catch (error) {
      trackGameError(error as Error, this.getGameName(), {
        step: 'chip_withdrawal',
      });
      this.outcomeText.setText('Error processing withdrawal');
    }
  }

  protected showInfoUI() {
    if (this.infoContainer) {
      this.infoContainer.destroy();
    }
    this.buildGameSpecificInfoUI();
    this.infoContainer.setVisible(true);
  }

  protected hideInfoUI() {
    trackGameEvent('info_modal_closed', this.getGameName());

    if (this.infoContainer) {
      this.infoContainer.setVisible(false);
      this.infoContainer.removeAll(true);
    }
  }
}
