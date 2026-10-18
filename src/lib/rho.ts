import { gcd } from "./bigint.ts";
import { found, type FactorOptions, type FactorResult } from "./factor.ts";

const BATCH = 128;

/** Pollard rho, Brent variant with batched gcd. Runtime ~ √p where p is the smallest factor. N must be composite. */
export function pollardBrent(
  N: bigint,
  { maxIterations = Infinity, onProgress, progressEvery = 1 << 20 }: FactorOptions = {},
): FactorResult {
  if (N < 4n) return { status: "invalid", reason: "N doit être composé" };
  if ((N & 1n) === 0n) return found(N, 2n, 1);

  const absDiff = (a: bigint, b: bigint) => (a > b ? a - b : b - a);
  let iterations = 0;
  let nextReport = progressEvery;

  for (let c = 1n; iterations < maxIterations; c++) {
    const f = (v: bigint) => (v * v + c) % N;
    let y = 2n;
    let x = y;
    let ys = y;
    let q = 1n;
    let g = 1n;
    let r = 1;

    while (g === 1n && iterations < maxIterations) {
      x = y;
      for (let i = 0; i < r; i++) y = f(y);
      for (let k = 0; k < r && g === 1n; k += BATCH) {
        ys = y;
        const lim = Math.min(BATCH, r - k);
        for (let i = 0; i < lim; i++) {
          y = f(y);
          q = (q * absDiff(x, y)) % N;
        }
        g = gcd(q, N);
        iterations += lim;
        if (iterations >= nextReport) {
          onProgress?.(iterations);
          nextReport += progressEvery;
        }
      }
      r *= 2;
    }

    // Batch overshot (q ≡ 0): replay step by step from the last checkpoint.
    if (g === N) {
      do {
        ys = f(ys);
        g = gcd(absDiff(x, ys), N);
      } while (g === 1n);
    }
    if (g !== 1n && g !== N) return found(N, g, iterations, `c = ${c}`);
  }
  return { status: "limit", iterations };
}
