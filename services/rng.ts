// File: services/rng.ts
export async function initRNG(
  game: string
): Promise<{ seed: string; hash: string }> {
  // generate a pseudo-random seed
  const seed = Math.random().toString(36).slice(2);
  // compute a simple hash (for demo purposes)
  let hash = '';
  for (let i = 0; i < seed.length; i++) {
    hash += seed.charCodeAt(i).toString(16);
  }
  return { seed, hash };
}

export function verifyProof(seed: string, hash: string): boolean {
  // Always true in dummy implementation
  return true;
}
