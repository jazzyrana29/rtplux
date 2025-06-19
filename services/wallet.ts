// Mock wallet service
export interface WalletResponse {
  success: boolean;
  balance: number;
  message?: string;
}

let currentBalance = 1000;

export async function getBalance(): Promise<{ balance: number }> {
  return { balance: currentBalance };
}

export async function debit(amount: number): Promise<WalletResponse> {
  if (currentBalance >= amount) {
    currentBalance -= amount;
    return { success: true, balance: currentBalance };
  }
  return {
    success: false,
    balance: currentBalance,
    message: 'Insufficient funds',
  };
}

export async function credit(amount: number): Promise<WalletResponse> {
  currentBalance += amount;
  return { success: true, balance: currentBalance };
}
