export type FactorResult =
  | { status: "found"; p: bigint; q: bigint; iterations: number; note?: string }
  | { status: "limit"; iterations: number }
  | { status: "invalid"; reason: string };

export interface FactorOptions {
  maxIterations?: number;
  onProgress?: (iterations: number) => void;
  progressEvery?: number;
}

/** Orders the split so that p <= q. */
export function found(n: bigint, d: bigint, iterations: number, note?: string): FactorResult {
  const other = n / d;
  const [p, q] = d <= other ? [d, other] : [other, d];
  return { status: "found", p, q, iterations, note };
}

// 64 * 63 * 65 * 11: y² - N is tracked modulo M with plain numbers,
// BigInt is only touched when the residue is a possible square (~0.8% of steps).
export const M = 2_882_880;
let squaresModM: Uint8Array | null = null;

export function getSquaresModM(): Uint8Array {
  if (!squaresModM) {
    squaresModM = new Uint8Array(M);
    for (let i = 0; i < M; i++) squaresModM[(i * i) % M] = 1;
  }
  return squaresModM;
}
