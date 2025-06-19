// Mock RNG service
export interface RNGResponse {
  seed: string;
}

export async function initRNG(game: string): Promise<RNGResponse> {
  // Generate a random seed
  const seed = Math.random().toString(36).substring(2, 15);
  return { seed };
}
