import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface GameState {
  // Balance state
  balance: number

  // Chip counts for each denomination
  chipCounts: Record<number, number>

  // Actions
  setBalance: (balance: number) => void
  updateBalance: (amount: number) => void
  setChipCounts: (chips: Record<number, number>) => void
  updateChipCount: (denomination: number, count: number) => void
  addChips: (denomination: number, count: number) => void
  removeChips: (denomination: number, count: number) => void
  resetChips: () => void

  // Computed values
  getTotalChipValue: () => number
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      balance: 1000,
      chipCounts: { 1: 0, 5: 0, 25: 0, 100: 0 },

      // Balance actions
      setBalance: (balance: number) => set({ balance }),

      updateBalance: (amount: number) => set((state) => ({ balance: state.balance + amount })),

      // Chip actions
      setChipCounts: (chips: Record<number, number>) => set({ chipCounts: chips }),

      updateChipCount: (denomination: number, count: number) =>
        set((state) => ({
          chipCounts: {
            ...state.chipCounts,
            [denomination]: count,
          },
        })),

      addChips: (denomination: number, count: number) =>
        set((state) => ({
          chipCounts: {
            ...state.chipCounts,
            [denomination]: state.chipCounts[denomination] + count,
          },
        })),

      removeChips: (denomination: number, count: number) =>
        set((state) => ({
          chipCounts: {
            ...state.chipCounts,
            [denomination]: Math.max(0, state.chipCounts[denomination] - count),
          },
        })),

      resetChips: () => set({ chipCounts: { 1: 0, 5: 0, 25: 0, 100: 0 } }),

      // Computed values
      getTotalChipValue: () => {
        const { chipCounts } = get()
        return Object.entries(chipCounts).reduce(
          (total, [denomination, count]) => total + Number(denomination) * count,
          0,
        )
      },
    }),
    {
      name: "roulette-game-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        balance: state.balance,
        chipCounts: state.chipCounts,
      }),
    },
  ),
)
