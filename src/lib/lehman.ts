import { bitLength, gcd, icbrt, isqrt } from "./bigint.ts";
import { found, getSquaresModM, M, type FactorOptions, type FactorResult } from "./factor.ts";

// Trial division runs on base-2^20 limbs with plain numbers: rem * 2^20 + limb must stay < 2^53.
const LIMB_BITS = 20;
const MAX_TRIAL_DIVISOR = 2 ** 33;

function trialDivision(N: bigint, limit: number): bigint | null {
  const limbs: number[] = [];
  for (let v = N; v > 0n; v >>= BigInt(LIMB_BITS))
    limbs.unshift(Number(v & ((1n << BigInt(LIMB_BITS)) - 1n)));
  const base = 2 ** LIMB_BITS;
  const divides = (d: number) => {
    let rem = 0;
    for (const limb of limbs) rem = (rem * base + limb) % d;
    return rem === 0;
  };

  if (divides(2)) return 2n;
  if (divides(3)) return 3n;
  for (let d = 5; d <= limit; d += 6) {
    if (divides(d)) return BigInt(d);
    if (divides(d + 2)) return BigInt(d + 2);
  }
  return null;
}

/** log2(N) as a float, valid for any size. */
function log2(N: bigint): number {
  const shift = Math.max(0, bitLength(N) - 53);
  return shift + Math.log2(Number(N >> BigInt(shift)));
}

/**
 * Lehman: Fermat on 4kN for k = 1..N^(1/3), each over a short range of a,
 * completed by trial division up to N^(1/3). Guaranteed in O(N^(1/3)).
 */
export function lehman(
  N: bigint,
  { onProgress, progressEvery = 1 << 18 }: FactorOptions = {},
): FactorResult {
  if (N < 4n) return { status: "invalid", reason: "N doit être composé" };

  const B = icbrt(N) + 1n;
  const table = getSquaresModM();
  const bigM = BigInt(M);
  const N6 = 2 ** (log2(N) / 6);
  const fourN = 4n * N;
  const kMax = Number(B);
  let iterations = 0;
  let nextReport = progressEvery;

  for (let k = 1; k <= kMax; k++) {
    const kN4 = fourN * BigInt(k);
    const root = isqrt(kN4);
    const a0 = root * root === kN4 ? root : root + 1n;
    const span = Math.floor(N6 / (4 * Math.sqrt(k))) + 1;

    let r = Number((a0 * a0 - kN4) % bigM);
    let step = Number((2n * a0 + 1n) % bigM);
    for (let i = 0; i < span; i++) {
      if (table[r]) {
        const a = a0 + BigInt(i);
        const b2 = a * a - kN4;
        const b = isqrt(b2);
        if (b * b === b2) {
          const g = gcd(a + b, N);
          if (g > 1n && g < N) {
            const m = 4n * BigInt(k);
            const alpha = gcd(a + b, m);
            return found(N, g, iterations + i + 1, `k = ${k}, m = ${m} = ${alpha} × ${m / alpha}`);
          }
        }
      }
      r += step;
      if (r >= M) r -= M;
      step += 2;
      if (step >= M) step -= M;
    }

    iterations += span;
    if (k >= nextReport) {
      onProgress?.(iterations);
      nextReport += progressEvery;
    }
  }

  if (kMax > MAX_TRIAL_DIVISOR) return { status: "invalid", reason: "Lehman : N trop grand" };
  const d = trialDivision(N, kMax);
  return d
    ? found(N, d, iterations + Number(d), "division")
    : { status: "invalid", reason: "N est premier" };
}
