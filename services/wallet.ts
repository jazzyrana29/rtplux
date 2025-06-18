// File: services/wallet.ts
export async function getBalance(): Promise<{ balance: number }> {
  // dummy starting balance
  return { balance: 1000 };
}

export async function debit(
  amount: number
): Promise<{ success: boolean; balance: number }> {
  // simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  // always succeed for now
  return { success: true, balance: 1000 - amount };
}

export async function credit(
  amount: number
): Promise<{ success: boolean; balance: number }> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { success: true, balance: 1000 + amount };
}
