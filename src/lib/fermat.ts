import { isqrt } from "./bigint.ts";
import { found, getSquaresModM, M, type FactorOptions, type FactorResult } from "./factor.ts";

/** Fermat factorisation: finds the smallest y ≥ ⌈√N⌉ such that y² - N = x², then N = (y - x)(y + x). */
export function fermat(
  N: bigint,
  { maxIterations = Infinity, onProgress, progressEvery = 1 << 24 }: FactorOptions = {},
): FactorResult {
  if (N <= 0n) return { status: "invalid", reason: "N doit être strictement positif" };
  if (N % 4n === 2n)
    return { status: "invalid", reason: "N ≡ 2 (mod 4) : N ne s’écrit pas Y² − X²" };

  const table = getSquaresModM();
  const root = isqrt(N);
  const y0 = root * root === N ? root : root + 1n;
  const bigM = BigInt(M);

  let r = Number((y0 * y0 - N) % bigM); // (y0 + k)² - N mod M
  let step = Number((2n * y0 + 1n) % bigM); // 2(y0 + k) + 1 mod M
  let nextReport = progressEvery;

  for (let k = 0; k < maxIterations; k++) {
    if (table[r]) {
      const y = y0 + BigInt(k);
      const x2 = y * y - N;
      const x = isqrt(x2);
      if (x * x === x2) return found(N, y - x, k + 1);
    }
    r += step;
    if (r >= M) r -= M;
    step += 2;
    if (step >= M) step -= M;

    if (k === nextReport) {
      onProgress?.(k);
      nextReport += progressEvery;
    }
  }
  return { status: "limit", iterations: maxIterations };
}
