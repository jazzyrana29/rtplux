import { useGameStore } from '../stores/gameStore';

// Mock wallet service with Zustand integration
export interface WalletResponse {
  success: boolean;
  balance: number;
  message?: string;
}

export async function getBalance(): Promise<{ balance: number }> {
  const balance = useGameStore.getState().balance;
  return { balance };
}

export async function debit(amount: number): Promise<WalletResponse> {
  const { balance, setBalance } = useGameStore.getState();

  if (balance >= amount) {
    const newBalance = balance - amount;
    setBalance(newBalance);
    return { success: true, balance: newBalance };
  }

  return {
    success: false,
    balance,
    message: 'Insufficient funds',
  };
}

export async function credit(amount: number): Promise<WalletResponse> {
  const { balance, setBalance } = useGameStore.getState();
  const newBalance = balance + amount;
  setBalance(newBalance);
  return { success: true, balance: newBalance };
}
