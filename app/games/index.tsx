'use client';
import Link from 'next/link';
import { ScrollView, View } from 'react-native';
import { motion } from 'framer-motion';
import {
  AnimatedCard,
  AnimatedText,
  AnimatedView,
  FloatingElement,
  LoadingSpinner,
} from '@/components/AnimatedComponents';
import {
  containerVariants,
  pageTransition,
  pageVariants,
} from '../../lib/animations';
import { useTranslation } from '../../hooks/useTranslation';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { getTextDirection } from '../../lib/i18n';
import { GAMES_CONSTANTS } from '../../constants/games';

const GamesScreenComponent = () => {
  // ALL HOOKS FIRST
  const { t, currentLanguage, isReady } = useTranslation();
  const {
    isGameEnabled,
    getGameConfig,
    getBrandingConfig,
    isInitialized: featureFlagsInitialized,
  } = useFeatureFlags();

  // CONDITIONAL RENDERING ONLY AFTER ALL HOOKS
  if (!isReady || !featureFlagsInitialized) {
    return (
      <AnimatedView className="flex-1 bg-casino-primary justify-center items-center">
        <LoadingSpinner size={60} />
        <AnimatedText className="text-white mt-4 text-lg">
          {!isReady
            ? 'Loading translations...'
            : 'Loading game configuration...'}
        </AnimatedText>
      </AnimatedView>
    );
  }

  const brandingConfig = getBrandingConfig();

  const gamesList = [
    {
      id: 'roulette',
      title: t(GAMES_CONSTANTS.ROULETTE.TITLE),
      subtitle: t(GAMES_CONSTANTS.ROULETTE.SUBTITLE),
      description: t(GAMES_CONSTANTS.ROULETTE.DESCRIPTION),
      available: isGameEnabled('roulette'),
      href: '/games/roulette',
      color: 'from-red-600 to-red-800',
      config: getGameConfig('roulette'),
    },
    {
      id: 'slots',
      title: t(GAMES_CONSTANTS.SLOTS.TITLE),
      subtitle: t(GAMES_CONSTANTS.SLOTS.SUBTITLE),
      description: t(GAMES_CONSTANTS.SLOTS.DESCRIPTION),
      available: isGameEnabled('slots'),
      href: '/games/slots',
      color: 'from-purple-600 to-purple-800',
      config: getGameConfig('slots'),
    },
    {
      id: 'blackjack',
      title: t(GAMES_CONSTANTS.BLACKJACK.TITLE),
      subtitle: t(GAMES_CONSTANTS.BLACKJACK.SUBTITLE),
      description: t(GAMES_CONSTANTS.BLACKJACK.DESCRIPTION),
      available: isGameEnabled('blackjack'),
      href: '/games/blackjack',
      color: 'from-green-600 to-green-800',
      config: getGameConfig('blackjack'),
    },
  ];

  const GameCard = ({
    game,
    index,
  }: {
    game: (typeof gamesList)[0];
    index: number;
  }) => {
    const cardContent = (
      <AnimatedCard
        delay={index * 0.1}
        className={`mb-4 bg-gradient-to-br ${game.color} relative overflow-hidden`}
      >
        {/* Background Pattern */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>\')',
          }}
        />

        <AnimatedView className="relative z-10">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <AnimatedText className="text-white font-bold text-xl mb-2">
              {game.title}
            </AnimatedText>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <AnimatedText
              className={`text-sm mb-2 ${game.available ? 'text-green-300' : 'text-yellow-300'}`}
            >
              {game.subtitle}
            </AnimatedText>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <AnimatedText className="text-gray-200 text-sm">
              {game.description}
            </AnimatedText>
          </motion.div>

          {/* Game Configuration Info */}
          {game.config && game.available && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="mt-3 p-2 bg-black bg-opacity-30 rounded text-xs"
            >
              <div className="flex justify-between">
                <span className="text-gray-300">Min Bet:</span>
                <span className="text-white">${game.config.minBet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Max Bet:</span>
                <span className="text-white">${game.config.maxBet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Chips:</span>
                <span className="text-white">
                  {game.config.allowedChips.join(', ')}
                </span>
              </div>
            </motion.div>
          )}

          {/* Availability Indicator */}
          <motion.div
            className="absolute top-4 right-4"
            animate={
              game.available
                ? {
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
            }}
          >
            <View
              className={`w-3 h-3 rounded-full ${game.available ? 'bg-green-400' : 'bg-red-400'}`}
            />
          </motion.div>
        </AnimatedView>
      </AnimatedCard>
    );

    if (game.available && game.href) {
      return (
        <Link href={game.href} key={game.id}>
          {cardContent}
        </Link>
      );
    }

    return <div key={game.id}>{cardContent}</div>;
  };

  return (
    <AnimatedView
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
      className="flex-1 bg-casino-primary"
      style={{
        direction: getTextDirection(currentLanguage),
        backgroundColor: brandingConfig?.secondaryColor || '#1a1a2e',
      }}
    >
      <ScrollView className="flex-1">
        {/* Background Elements */}
        <FloatingElement className="absolute top-10 right-10 z-0">
          <AnimatedText className="text-8xl opacity-5">🎮</AnimatedText>
        </FloatingElement>

        <FloatingElement className="absolute top-60 left-5 z-0">
          <AnimatedText className="text-6xl opacity-5">🎲</AnimatedText>
        </FloatingElement>

        <AnimatedView
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-4 relative z-10"
        >
          {/* Header */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <AnimatedText
              className="text-4xl font-bold mb-2"
              style={{ color: brandingConfig?.primaryColor || '#ffd700' }}
            >
              {t(GAMES_CONSTANTS.TITLE)}
            </AnimatedText>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-1 rounded mb-6"
              style={{
                background: `linear-gradient(to right, ${brandingConfig?.primaryColor || '#ffd700'}, transparent)`,
              }}
            />
          </motion.div>

          {/* Games Grid */}
          <AnimatedView
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {gamesList.map((game, index) => (
              <GameCard key={game.id} game={game} index={index} />
            ))}
          </AnimatedView>

          {/* Coming Soon Banner */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 150 }}
            className="mt-8 rounded-xl p-6 border"
            style={{
              background: `linear-gradient(to right, ${brandingConfig?.secondaryColor || '#16213e'}, ${brandingConfig?.accentColor || '#0f3460'})`,
              borderColor: brandingConfig?.primaryColor || '#ffd700',
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
              }}
            >
              <AnimatedText
                className="font-bold text-xl text-center mb-2"
                style={{ color: brandingConfig?.primaryColor || '#ffd700' }}
              >
                {t(GAMES_CONSTANTS.COMING_SOON)}
              </AnimatedText>
            </motion.div>

            <AnimatedText className="text-white text-center">
              {t(GAMES_CONSTANTS.COMING_SOON_DESCRIPTION)}
            </AnimatedText>

            <motion.div
              className="mt-4 h-2 rounded-full"
              style={{
                backgroundColor: brandingConfig?.primaryColor || '#ffd700',
              }}
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ delay: 1.5, duration: 2 }}
            />

            <AnimatedText className="text-gray-300 text-sm text-center mt-2">
              {t(GAMES_CONSTANTS.DEVELOPMENT_PROGRESS)}
            </AnimatedText>
          </motion.div>
        </AnimatedView>
      </ScrollView>
    </AnimatedView>
  );
};

export default GamesScreenComponent;
