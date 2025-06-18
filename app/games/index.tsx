// File: app/games/index.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ScrollView, Text, View } from 'react-native';

const GameCard = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View className="mb-4 bg-casino-secondary rounded-xl p-4 shadow-xl border border-casino-accent">
    <Text className="text-white font-semibold mb-2">{title}</Text>
    <Text className="text-gray-300">{subtitle}</Text>
  </View>
);

export default function GamesScreen() {
  return (
    <ScrollView className="flex-1 bg-casino-primary">
      <View className="p-4">
        <Text className="text-2xl font-bold text-casino-gold mb-6">
          🎮 Game Library
        </Text>

        {/* Navigable Game Card for Roulette */}
        <Link href="/games/roulette">
          <GameCard title="🎯 Roulette" subtitle="Play Now" />
        </Link>

        <GameCard title="🎰 Slot Machine" subtitle="Coming Soon - Phase 2" />
        <GameCard title="🃏 Blackjack" subtitle="Coming Soon - Phase 5" />
        <GameCard title="📈 Crash" subtitle="Coming Soon - Phase 5" />
      </View>
    </ScrollView>
  );
}
