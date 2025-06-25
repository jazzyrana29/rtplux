import Phaser from 'phaser';
import { useGameStore } from '../stores/gameStore';
import { trackGameEvent } from '../lib/posthog';
import {
  trackError,
  trackGameError,
  trackPerformance,
  trackUserAction,
} from '../lib/sentry';
import { BaseGameScene } from './BaseGameScene';
import { ROULETTE_CONSTANTS } from '../constants/roulette';

type Suit = 'diamonds' | 'hearts' | 'clubs' | 'spades';
type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // For display purposes
  aceValue?: 'high' | 'low'; // For aces
}

interface Hand {
  cards: Card[];
  value: number;
  isBlackjack: boolean;
  isBusted: boolean;
  isSoft: boolean; // Contains ace counted as 11
}

type GameState =
  | 'betting'
  | 'dealing'
  | 'playing'
  | 'dealer_turn'
  | 'game_over';
type PlayerAction =
  | 'hit'
  | 'stand'
  | 'double'
  | 'split'
  | 'surrender'
  | 'insurance';

export default class BlackJackScene extends BaseGameScene {
  // Game state
  private gameState: GameState = 'betting';
  private deck: Card[] = [];
  private playerHand: Hand = {
    cards: [],
    value: 0,
    isBlackjack: false,
    isBusted: false,
    isSoft: false,
  };
  private dealerHand: Hand = {
    cards: [],
    value: 0,
    isBlackjack: false,
    isBusted: false,
    isSoft: false,
  };
  private currentBet = 0;
  private insuranceBet = 0;
  private canDoubleDown = false;
  private canSplit = false;
  private canSurrender = false;
  private canInsurance = false;

  // UI Elements
  private dealButton!: Phaser.GameObjects.Image;
  private hitButton!: Phaser.GameObjects.Text;
  private standButton!: Phaser.GameObjects.Text;
  private doubleButton!: Phaser.GameObjects.Text;
  private splitButton!: Phaser.GameObjects.Text;
  private surrenderButton!: Phaser.GameObjects.Text;
  private insuranceButton!: Phaser.GameObjects.Text;
  private actionContainer!: Phaser.GameObjects.Container;

  // Card display
  private playerCardContainer!: Phaser.GameObjects.Container;
  private dealerCardContainer!: Phaser.GameObjects.Container;
  private playerValueText!: Phaser.GameObjects.Text;
  private dealerValueText!: Phaser.GameObjects.Text;

  // Sounds
  private cardShuffleSound!: Phaser.Sound.BaseSound;
  private cardDealSound!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'BlackJackScene' });
  }

  preload(): void {
    const startTime = performance.now();

    try {
      trackGameEvent('game_loading_started', 'blackjack');
      trackUserAction('blackjack_preload_started');

      // Load chip atlas
      this.load.atlas(
        'chips',
        '/public/assets/games/common/chips.webp',
        '/public/assets/games/common/chips.json'
      );

      // Load card atlases for all suits
      const suits: Suit[] = ['hearts', 'clubs', 'spades', 'diamonds'];
      suits.forEach((suit) => {
        this.load.atlas(
          `cards_${suit}`,
          `/public/assets/games/cards/${suit}Atlas.webp`,
          `/public/assets/games/cards/${suit}Atlas.json`
        );
      });

      // Load card back
      this.load.image('cardBack', '/public/assets/games/cards/cardBack.webp');

      // Load start button
      this.load.image(
        'dealButton',
        '/public/assets/games/common/startButton.webp'
      );

      // Load digits atlas for results
      this.load.atlas(
        'digits',
        '/public/assets/games/common/digitAtlas.webp',
        '/public/assets/games/common/digitAtlas.json'
      );

      // Load confetti atlas
      this.load.atlas(
        'confetti',
        '/public/assets/games/common/confetti-0.webp',
        '/public/assets/games/common/confetti-0.json'
      );

      // Load sounds
      this.load.audio(
        'cardShuffle',
        '/public/assets/games/cards/audio/card_shuffle.mp3'
      );
      this.load.audio(
        'cardDeal',
        '/public/assets/games/cards/audio/single_card_deal.mp3'
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

      this.load.on('complete', () => {
        const loadTime = performance.now() - startTime;
        trackPerformance('blackjack_assets_loaded', loadTime);
        trackUserAction('blackjack_preload_completed', { loadTime });
      });

      this.load.on('loaderror', (file: any) => {
        const error = new Error(`Failed to load asset: ${file.key}`);
        trackGameError(error, 'blackjack', {
          asset: file.key,
          url: file.url,
          step: 'asset_loading',
        });
      });
    } catch (error) {
      trackGameError(error as Error, 'blackjack', { step: 'preload' });
      throw error;
    }
  }

  async create(): Promise<void> {
    const startTime = performance.now();

    try {
      trackGameEvent('game_loaded', 'blackjack');

      // Initialize sounds
      try {
        this.cardShuffleSound = this.sound.add('cardShuffle');
        this.cardDealSound = this.sound.add('cardDeal');
        this.payoutSound = this.sound.add('payoutSound');
        this.buyChipsSound = this.sound.add('buyChipsSound');
        this.withdrawalSound = this.sound.add('withdrawalSound');
      } catch (soundError) {
        trackGameError(soundError as Error, 'blackjack', {
          step: 'sound_initialization',
        });
      }

      const { balance } = useGameStore.getState();
      trackGameEvent('game_session_started', 'blackjack', {
        initial_balance: balance,
      });

      // Create UI elements
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

        trackUserAction('blackjack_ui_texts_created', { balance });
      } catch (uiError) {
        trackGameError(uiError as Error, 'blackjack', { step: 'ui_creation' });
        throw uiError;
      }

      // Build UI controls
      try {
        this.createTopButtons();
        this.drawChipPalette();
        this.createGameTable();
        this.createActionButtons();
        this.buildPurchaseUI();
        trackUserAction('blackjack_controls_created');
      } catch (controlsError) {
        trackGameError(controlsError as Error, 'blackjack', {
          step: 'controls_creation',
        });
        throw controlsError;
      }

      // Initialize deck
      this.initializeDeck();

      // Subscribe to store changes
      this.subscribeToStoreChanges();

      const createTime = performance.now() - startTime;
      trackPerformance('blackjack_scene_creation', createTime);
    } catch (error) {
      trackGameError(error as Error, 'blackjack', {
        step: 'create_method',
        startTime,
      });
      throw error;
    }
  }

  protected buildInfoUI(): void {
    trackGameEvent('info_modal_opened', 'blackjack');

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
      .text(this.scale.width / 2, py + 25, 'BlackJack Rules & Guide', {
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
    const lineHeight = 22;

    const blackjackInfo = [
      { title: 'OBJECTIVE', color: '#ffff00', isHeader: true },
      {
        text: 'Beat the dealer by getting closer to 21 without going over (busting)',
        color: '#ffffff',
      },
      '',
      { title: 'CARD VALUES', color: '#ffff00', isHeader: true },
      { text: '• Number cards (2-10): Face value', color: '#ffffff' },
      { text: '• Face cards (J, Q, K): Worth 10 points', color: '#ffffff' },
      { text: '• Ace: Worth 1 or 11 (whichever is better)', color: '#ffffff' },
      '',
      { title: 'HOW TO PLAY', color: '#ffff00', isHeader: true },
      { text: '1. Place your bet using chips', color: '#ffffff' },
      { text: '2. Click DEAL to start the game', color: '#ffffff' },
      {
        text: '3. You get 2 cards face up, dealer gets 1 up, 1 down',
        color: '#ffffff',
      },
      {
        text: '4. Choose your action: Hit, Stand, Double, Split, etc.',
        color: '#ffffff',
      },
      {
        text: '5. Dealer plays after you (must hit until 17+)',
        color: '#ffffff',
      },
      '',
      { title: 'PLAYER ACTIONS', color: '#ffff00', isHeader: true },
      { text: '• HIT: Take another card', color: '#ffffff' },
      { text: '• STAND: Keep current hand, end turn', color: '#ffffff' },
      {
        text: '• DOUBLE DOWN: Double bet, take 1 card, then stand',
        color: '#ffffff',
      },
      {
        text: '• SPLIT: Split pairs into 2 hands (equal bets)',
        color: '#ffffff',
      },
      { text: '• SURRENDER: Forfeit half bet, end hand', color: '#ffffff' },
      {
        text: '• INSURANCE: Bet against dealer blackjack (when dealer shows Ace)',
        color: '#ffffff',
      },
      '',
      { title: 'WINNING & PAYOUTS', color: '#ffff00', isHeader: true },
      { text: '• BLACKJACK (Ace + 10-value): Pays 3:2', color: '#00ff00' },
      {
        text: '  Example: Bet $10 → Win $15 + $10 back = $25 total',
        color: '#00ff00',
      },
      { text: '• REGULAR WIN: Pays 1:1', color: '#00ff00' },
      {
        text: '  Example: Bet $10 → Win $10 + $10 back = $20 total',
        color: '#00ff00',
      },
      { text: '• PUSH (Tie): Get your bet back', color: '#ffaa00' },
      { text: '• BUST/LOSE: Lose your bet', color: '#ff4444' },
      { text: '• INSURANCE WIN: Pays 2:1', color: '#00ff00' },
      '',
      { title: 'DEALER RULES', color: '#ffff00', isHeader: true },
      { text: '• Must hit on 16 or less', color: '#ffffff' },
      { text: '• Must stand on 17 or more', color: '#ffffff' },
      { text: '• Dealer hits soft 17 (Ace + 6)', color: '#ffffff' },
      '',
      { title: 'SPECIAL SITUATIONS', color: '#ffff00', isHeader: true },
      {
        text: '• Natural Blackjack beats 21 made with 3+ cards',
        color: '#ffffff',
      },
      { text: '• Split Aces get only 1 card each', color: '#ffffff' },
      { text: '• Double Down only allowed on first 2 cards', color: '#ffffff' },
      { text: '• Surrender only allowed on first 2 cards', color: '#ffffff' },
      '',
      { title: 'STRATEGY TIPS', color: '#ffff00', isHeader: true },
      { text: '• Always split Aces and 8s', color: '#ffffff' },
      { text: '• Never split 10s, 5s, or 4s', color: '#ffffff' },
      { text: '• Hit on soft 17 (Ace + 6)', color: '#ffffff' },
      { text: '• Stand on hard 17 or higher', color: '#ffffff' },
      { text: '• Double on 11 vs dealer 2-10', color: '#ffffff' },
      { text: '• Take insurance only if counting cards', color: '#ffffff' },
    ];

    blackjackInfo.forEach((info) => {
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

  protected resetBets(): void {
    if (this.gameState !== 'betting') {
      this.outcomeText.setText('Cannot reset bets during active game!');
      return;
    }
    super.resetBets();
  }

  protected drawChipPalette(): void {
    const denoms = [1, 5, 25, 100];
    const chipAreaWidth = Math.min(this.scale.width * 0.8, 600);
    const chipAreaX = (this.scale.width - chipAreaWidth) / 2;
    const segW = chipAreaWidth / 5;
    const y = this.scale.height - 60;
    const iconSize = Math.min(segW * 0.8, 70);

    denoms.forEach((d, i) => {
      const x = chipAreaX + segW * (i + 0.5);
      this.chipImages[d] = this.add
        .image(x, y, 'chips', `chips/chip${d}.png`)
        .setDisplaySize(iconSize, iconSize)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.placeBet(d));

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

    // Create deal button in chip area
    const dealX = chipAreaX + segW * 4.5;
    this.dealButton = this.add
      .image(dealX, y, 'dealButton')
      .setDisplaySize(iconSize, iconSize)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.startGame())
      .setVisible(false);
  }

  private createGameTable(): void {
    const { width, height } = this.scale;

    // Create table background
    const tableWidth = width * 0.8;
    const tableHeight = height * 0.6;
    const tableX = (width - tableWidth) / 2;
    const tableY = height * 0.2;

    const tableBg = this.add
      .rectangle(
        tableX + tableWidth / 2,
        tableY + tableHeight / 2,
        tableWidth,
        tableHeight,
        0x003300
      )
      .setStrokeStyle(4, 0xffff00)
      .setDepth(-1);

    // Create card containers
    this.dealerCardContainer = this.add.container(0, 0).setDepth(1);
    this.playerCardContainer = this.add.container(0, 0).setDepth(1);

    // Create value display texts
    this.dealerValueText = this.add
      .text(width / 2, tableY + 60, 'Dealer: ', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.playerValueText = this.add
      .text(width / 2, tableY + tableHeight - 60, 'Player: ', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Create deal button
    this.dealButton = this.add
      .image(width / 2, tableY + tableHeight / 2, 'dealButton')
      .setDisplaySize(100, 50)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.startGame())
      .setVisible(false);
  }

  private createActionButtons(): void {
    this.actionContainer = this.add
      .container(0, 0)
      .setVisible(false)
      .setDepth(2);

    const buttonY = this.scale.height * 0.85;
    const buttonWidth = 100;
    const buttonHeight = 40;
    const spacing = 110;

    const buttons = [
      { key: 'hit', label: 'HIT', color: '#006600' },
      { key: 'stand', label: 'STAND', color: '#cc6600' },
      { key: 'double', label: 'DOUBLE', color: '#0066cc' },
      { key: 'split', label: 'SPLIT', color: '#6600cc' },
      { key: 'surrender', label: 'SURRENDER', color: '#cc0000' },
      { key: 'insurance', label: 'INSURANCE', color: '#666600' },
    ];

    buttons.forEach((btn, index) => {
      const x =
        this.scale.width / 2 -
        (buttons.length * spacing) / 2 +
        index * spacing +
        spacing / 2;

      const button = this.add
        .text(x, buttonY, btn.label, {
          fontSize: '14px',
          color: '#ffffff',
          backgroundColor: btn.color,
          padding: { x: 8, y: 6 },
          fixedWidth: buttonWidth,
          align: 'center',
        })
        .setOrigin(0.5)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerover', () =>
          button.setBackgroundColor(this.lightenColor(btn.color))
        )
        .on('pointerout', () => button.setBackgroundColor(btn.color));

      switch (btn.key) {
        case 'hit':
          this.hitButton = button.on('pointerup', () =>
            this.playerAction('hit')
          );
          break;
        case 'stand':
          this.standButton = button.on('pointerup', () =>
            this.playerAction('stand')
          );
          break;
        case 'double':
          this.doubleButton = button.on('pointerup', () =>
            this.playerAction('double')
          );
          break;
        case 'split':
          this.splitButton = button.on('pointerup', () =>
            this.playerAction('split')
          );
          break;
        case 'surrender':
          this.surrenderButton = button.on('pointerup', () =>
            this.playerAction('surrender')
          );
          break;
        case 'insurance':
          this.insuranceButton = button.on('pointerup', () =>
            this.playerAction('insurance')
          );
          break;
      }

      this.actionContainer.add(button);
    });
  }

  private lightenColor(color: string): string {
    const colorMap: Record<string, string> = {
      '#006600': '#00aa00',
      '#cc6600': '#ff8800',
      '#0066cc': '#0088ff',
      '#6600cc': '#8800ff',
      '#cc0000': '#ff0000',
      '#666600': '#999900',
    };
    return colorMap[color] || color;
  }

  private getCardTextureName(card: Card): string {
    const { suit, rank } = card;

    // Handle special cases
    if (rank === 'A') {
      return `${suit}/ace_of_${suit}.png`;
    }

    if (rank === 'J') {
      return `${suit}/jack_of_${suit}.png`;
    }

    if (rank === 'Q') {
      // Special case for queen of spades
      if (suit === 'spades') {
        return `${suit}/queen_of_${suit}2.png`;
      }
      return `${suit}/queen_of_${suit}.png`;
    }

    if (rank === 'K') {
      return `${suit}/king_of_${suit}.png`;
    }

    // Number cards (2-10)
    return `${suit}/${rank}_of_${suit}.png`;
  }

  private placeBet(denomination: number): void {
    if (this.gameState !== 'betting') {
      this.outcomeText.setText('Cannot place bets during active game!');
      return;
    }

    const { chipCounts, removeChips } = useGameStore.getState();

    if (chipCounts[denomination] <= 0) {
      this.outcomeText.setText(`No $${denomination} chips left!`);
      return;
    }

    try {
      this.buyChipsSound.play();
    } catch (soundError) {
      trackError(soundError as Error, { context: 'bet_placement_sound' });
    }

    removeChips(denomination, 1);
    this.currentBet += denomination;

    this.outcomeText.setText(`Current bet: $${this.currentBet}`);
    this.dealButton.setVisible(this.currentBet > 0);

    trackUserAction('bet_placed_blackjack', {
      denomination,
      totalBet: this.currentBet,
    });
  }

  private initializeDeck(): void {
    this.deck = [];
    const suits: Suit[] = ['diamonds', 'hearts', 'clubs', 'spades'];
    const ranks: Rank[] = [
      'A',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
    ];

    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        let value = 0;
        if (rank === 'A')
          value = 11; // Default ace value
        else if (['J', 'Q', 'K'].includes(rank)) value = 10;
        else value = Number.parseInt(rank);

        this.deck.push({ suit, rank, value });
      });
    });

    this.shuffleDeck();
  }

  private shuffleDeck(): void {
    try {
      this.cardShuffleSound.play();
    } catch (soundError) {
      trackError(soundError as Error, { context: 'shuffle_sound' });
    }

    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  private dealCard(hand: Hand, faceUp = true): Card {
    if (this.deck.length === 0) {
      this.initializeDeck();
    }

    const card = this.deck.pop()!;
    hand.cards.push(card);

    try {
      this.cardDealSound.play();
    } catch (soundError) {
      trackError(soundError as Error, { context: 'deal_sound' });
    }

    this.updateHandValue(hand);
    return card;
  }

  private updateHandValue(hand: Hand): void {
    let value = 0;
    let aces = 0;

    hand.cards.forEach((card) => {
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else {
        value += card.value;
      }
    });

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    hand.value = value;
    hand.isSoft = aces > 0 && value <= 21;
    hand.isBusted = value > 21;
    hand.isBlackjack = hand.cards.length === 2 && value === 21;
  }

  private async startGame(): Promise<void> {
    if (this.currentBet === 0) {
      this.outcomeText.setText('Place a bet first!');
      return;
    }

    this.gameState = 'dealing';
    this.dealButton.setVisible(false);

    // Disable chip palette
    Object.values(this.chipImages).forEach((img) => {
      img.disableInteractive();
      img.setTint(0x666666);
    });

    // Clear previous hands
    this.clearHands();

    // Deal initial cards
    this.dealCard(this.playerHand); // Player card 1
    this.dealCard(this.dealerHand); // Dealer card 1 (face up)
    this.dealCard(this.playerHand); // Player card 2
    this.dealCard(this.dealerHand, false); // Dealer card 2 (face down)

    this.displayCards();
    this.updateValueDisplays();

    // Check for blackjacks
    if (this.playerHand.isBlackjack || this.dealerHand.isBlackjack) {
      await this.handleBlackjacks();
    } else {
      this.gameState = 'playing';
      this.updateActionButtons();
      this.actionContainer.setVisible(true);

      // Check for insurance
      if (this.dealerHand.cards[0].rank === 'A') {
        this.canInsurance = true;
        this.updateActionButtons();
      }
    }

    trackGameEvent('blackjack_game_started', 'blackjack', {
      bet_amount: this.currentBet,
      player_cards: this.playerHand.cards.map((c) => `${c.rank}${c.suit[0]}`),
      dealer_up_card: `${this.dealerHand.cards[0].rank}${this.dealerHand.cards[0].suit[0]}`,
    });
  }

  private clearHands(): void {
    this.playerHand = {
      cards: [],
      value: 0,
      isBlackjack: false,
      isBusted: false,
      isSoft: false,
    };
    this.dealerHand = {
      cards: [],
      value: 0,
      isBlackjack: false,
      isBusted: false,
      isSoft: false,
    };
    this.playerCardContainer.removeAll(true);
    this.dealerCardContainer.removeAll(true);
  }

  private displayCards(): void {
    const cardWidth = 60;
    const cardHeight = 84;
    const spacing = 70;

    // Display player cards
    this.playerHand.cards.forEach((card, index) => {
      const x =
        this.scale.width / 2 -
        (this.playerHand.cards.length * spacing) / 2 +
        index * spacing;
      const y = this.scale.height * 0.7;

      const cardSprite = this.add
        .image(x, y, `cards_${card.suit}`, this.getCardTextureName(card))
        .setDisplaySize(cardWidth, cardHeight)
        .setDepth(2);

      this.playerCardContainer.add(cardSprite);
    });

    // Display dealer cards
    this.dealerHand.cards.forEach((card, index) => {
      const x =
        this.scale.width / 2 -
        (this.dealerHand.cards.length * spacing) / 2 +
        index * spacing;
      const y = this.scale.height * 0.35;

      let cardSprite: Phaser.GameObjects.Image;

      if (index === 1 && this.gameState !== 'game_over') {
        // Face down card
        cardSprite = this.add
          .image(x, y, 'cardBack')
          .setDisplaySize(cardWidth, cardHeight)
          .setDepth(2);
      } else {
        cardSprite = this.add
          .image(x, y, `cards_${card.suit}`, this.getCardTextureName(card))
          .setDisplaySize(cardWidth, cardHeight)
          .setDepth(2);
      }

      this.dealerCardContainer.add(cardSprite);
    });
  }

  private updateValueDisplays(): void {
    this.playerValueText.setText(
      `Player: ${this.playerHand.value}${this.playerHand.isSoft ? ' (soft)' : ''}`
    );

    if (this.gameState === 'game_over') {
      this.dealerValueText.setText(
        `Dealer: ${this.dealerHand.value}${this.dealerHand.isSoft ? ' (soft)' : ''}`
      );
    } else {
      // Only show first card value
      const firstCardValue =
        this.dealerHand.cards[0].rank === 'A'
          ? 11
          : this.dealerHand.cards[0].value;
      this.dealerValueText.setText(`Dealer: ${firstCardValue}`);
    }
  }

  private updateActionButtons(): void {
    this.canDoubleDown =
      this.playerHand.cards.length === 2 &&
      this.currentBet <= this.getTotalChipValue();
    this.canSplit =
      this.playerHand.cards.length === 2 &&
      this.playerHand.cards[0].value === this.playerHand.cards[1].value &&
      this.currentBet <= this.getTotalChipValue();
    this.canSurrender = this.playerHand.cards.length === 2;

    this.hitButton.setAlpha(1).setInteractive();
    this.standButton.setAlpha(1).setInteractive();
    this.doubleButton
      .setAlpha(this.canDoubleDown ? 1 : 0.3)
      .setInteractive(this.canDoubleDown);
    this.splitButton
      .setAlpha(this.canSplit ? 1 : 0.3)
      .setInteractive(this.canSplit);
    this.surrenderButton
      .setAlpha(this.canSurrender ? 1 : 0.3)
      .setInteractive(this.canSurrender);
    this.insuranceButton
      .setAlpha(this.canInsurance ? 1 : 0.3)
      .setInteractive(this.canInsurance);
  }

  private getTotalChipValue(): number {
    const { chipCounts } = useGameStore.getState();
    return Object.entries(chipCounts).reduce(
      (total, [denom, count]) => total + Number.parseInt(denom) * count,
      0
    );
  }

  private async playerAction(action: PlayerAction): Promise<void> {
    trackUserAction('blackjack_player_action', {
      action,
      hand_value: this.playerHand.value,
    });

    switch (action) {
      case 'hit':
        this.dealCard(this.playerHand);
        this.displayCards();
        this.updateValueDisplays();

        if (this.playerHand.isBusted) {
          await this.endGame();
        } else if (this.playerHand.value === 21) {
          await this.dealerTurn();
        } else {
          this.updateActionButtons();
        }
        break;

      case 'stand':
        await this.dealerTurn();
        break;

      case 'double':
        if (this.canDoubleDown) {
          const { removeChips } = useGameStore.getState();
          removeChips(this.selectedDenom, this.currentBet / this.selectedDenom);
          this.currentBet *= 2;

          this.dealCard(this.playerHand);
          this.displayCards();
          this.updateValueDisplays();

          if (this.playerHand.isBusted) {
            await this.endGame();
          } else {
            await this.dealerTurn();
          }
        }
        break;

      case 'surrender':
        if (this.canSurrender) {
          const { addChips } = useGameStore.getState();
          const halfBet = Math.floor(this.currentBet / 2);
          addChips(
            this.selectedDenom,
            Math.floor(halfBet / this.selectedDenom)
          );
          this.outcomeText.setText(
            `Surrendered! Lost $${this.currentBet - halfBet}`
          );
          await this.endGame();
        }
        break;

      case 'insurance':
        if (this.canInsurance) {
          const insuranceAmount = Math.floor(this.currentBet / 2);
          const { removeChips } = useGameStore.getState();
          removeChips(
            this.selectedDenom,
            Math.floor(insuranceAmount / this.selectedDenom)
          );
          this.insuranceBet = insuranceAmount;
          this.canInsurance = false;
          this.updateActionButtons();
          this.outcomeText.setText(`Insurance bet: $${insuranceAmount}`);
        }
        break;

      case 'split':
        // Simplified split - not fully implemented for brevity
        this.outcomeText.setText('Split not implemented in this demo');
        break;
    }
  }

  private async dealerTurn(): Promise<void> {
    this.gameState = 'dealer_turn';
    this.actionContainer.setVisible(false);

    // Reveal hole card
    this.displayCards();
    this.updateValueDisplays();

    // Dealer must hit until 17+
    while (
      this.dealerHand.value < 17 ||
      (this.dealerHand.value === 17 && this.dealerHand.isSoft)
    ) {
      await this.delay(1000);
      this.dealCard(this.dealerHand);
      this.displayCards();
      this.updateValueDisplays();
    }

    await this.endGame();
  }

  private async handleBlackjacks(): Promise<void> {
    this.gameState = 'game_over';
    this.displayCards();
    this.updateValueDisplays();

    const { addChips } = useGameStore.getState();

    if (this.playerHand.isBlackjack && this.dealerHand.isBlackjack) {
      // Push
      addChips(this.selectedDenom, this.currentBet / this.selectedDenom);
      this.outcomeText.setText('Push! Both have Blackjack');
      this.showResultDigits(0);
    } else if (this.playerHand.isBlackjack) {
      // Player blackjack wins 3:2
      const winAmount = Math.floor(this.currentBet * 1.5);
      addChips(
        this.selectedDenom,
        Math.floor((this.currentBet + winAmount) / this.selectedDenom)
      );
      this.outcomeText.setText(`🎉 BLACKJACK! Won $${winAmount}`);
      this.showResultDigits(winAmount);
      this.payoutSound.play();
    } else {
      // Dealer blackjack
      this.outcomeText.setText(`Dealer Blackjack! Lost $${this.currentBet}`);
      this.showResultDigits(-this.currentBet);
    }

    await this.delay(3000);
    this.resetGame();
  }

  private async endGame(): Promise<void> {
    this.gameState = 'game_over';
    this.actionContainer.setVisible(false);

    const { addChips } = useGameStore.getState();
    let winAmount = 0;
    let message = '';

    // Handle insurance first
    if (this.insuranceBet > 0) {
      if (this.dealerHand.isBlackjack) {
        const insuranceWin = this.insuranceBet * 2;
        addChips(
          this.selectedDenom,
          Math.floor(insuranceWin / this.selectedDenom)
        );
        winAmount += insuranceWin;
        message += `Insurance won $${insuranceWin}! `;
      } else {
        message += `Insurance lost $${this.insuranceBet}. `;
      }
    }

    // Main hand resolution
    if (this.playerHand.isBusted) {
      message += `Busted! Lost $${this.currentBet}`;
      winAmount -= this.currentBet;
    } else if (this.dealerHand.isBusted) {
      addChips(
        this.selectedDenom,
        Math.floor((this.currentBet * 2) / this.selectedDenom)
      );
      winAmount += this.currentBet;
      message += `Dealer busted! Won $${this.currentBet}`;
      this.payoutSound.play();
    } else if (this.playerHand.value > this.dealerHand.value) {
      addChips(
        this.selectedDenom,
        Math.floor((this.currentBet * 2) / this.selectedDenom)
      );
      winAmount += this.currentBet;
      message += `Won! ${this.playerHand.value} vs ${this.dealerHand.value} - $${this.currentBet}`;
      this.payoutSound.play();
    } else if (this.playerHand.value < this.dealerHand.value) {
      message += `Lost! ${this.playerHand.value} vs ${this.dealerHand.value} - $${this.currentBet}`;
      winAmount -= this.currentBet;
    } else {
      // Push
      addChips(
        this.selectedDenom,
        Math.floor(this.currentBet / this.selectedDenom)
      );
      message += `Push! Both have ${this.playerHand.value}`;
    }

    this.outcomeText.setText(message);
    this.showResultDigits(winAmount);

    trackGameEvent('blackjack_game_ended', 'blackjack', {
      player_value: this.playerHand.value,
      dealer_value: this.dealerHand.value,
      result: winAmount > 0 ? 'win' : winAmount < 0 ? 'lose' : 'push',
      win_amount: winAmount,
      bet_amount: this.currentBet,
    });

    await this.delay(3000);
    this.resetGame();
  }

  private showResultDigits(amount: number): void {
    // Clear previous result digits
    this.children.list
      .filter((child) => child.name === 'resultDigit')
      .forEach((child) => child.destroy());

    if (amount === 0) return;

    const digits = Math.abs(amount).toString().split('');
    const size = 40;
    const totalWidth = size * digits.length;
    const startX = this.scale.width / 2 - totalWidth / 2;
    const y = this.scale.height * 0.5;

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
        .setName('resultDigit')
        .setTint(amount > 0 ? 0x00ff00 : 0xff0000);
    });
  }

  private resetGame(): void {
    this.gameState = 'betting';
    this.currentBet = 0;
    this.insuranceBet = 0;
    this.canDoubleDown = false;
    this.canSplit = false;
    this.canSurrender = false;
    this.canInsurance = false;

    // Re-enable chip palette
    Object.values(this.chipImages).forEach((img) => {
      img.setInteractive();
      img.clearTint();
    });

    this.actionContainer.setVisible(false);
    this.dealButton.setVisible(false);
    this.outcomeText.setText('Place your bet to start a new game');

    // Clear result digits
    this.children.list
      .filter((child) => child.name === 'resultDigit')
      .forEach((child) => child.destroy());
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
