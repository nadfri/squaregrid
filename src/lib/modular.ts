import { abs } from "./bigint.ts";
import { IMPOSSIBLE_SQUARE } from "./cell-class.ts";

const MAX_MODULUS = 10_000;
const MAX_MODULI = 8;
const cache = new Map<number, Uint8Array>();

/** squares[r] = 1 when r is a square modulo m. */
export function squaresMod(m: number): Uint8Array {
  let t = cache.get(m);
  if (!t) {
    t = new Uint8Array(m);
    for (let i = 0; i < m; i++) t[(i * i) % m] = 1;
    cache.set(m, t);
  }
  return t;
}

/** "8, 3 5" → [8, 3, 5] (2 ≤ m ≤ 10 000, no duplicates). */
export function parseModuli(raw: string): number[] {
  const values = raw
    .split(/[^\d]+/)
    .filter(Boolean)
    .map(Number)
    .filter((m) => m >= 2 && m <= MAX_MODULUS);
  return [...new Set(values)].slice(0, MAX_MODULI);
}

/** Flags the values start + i that cannot be a square modulo one of the moduli (based on |value|). */
export function flagImpossibleSquares(classes: Uint8Array, start: bigint, moduli: number[]) {
  for (const m of moduli) {
    const squares = squaresMod(m);
    if (start >= 0n) {
      let r = Number(start % BigInt(m));
      for (let i = 0; i < classes.length; i++) {
        if (!squares[r]) classes[i] |= IMPOSSIBLE_SQUARE;
        if (++r === m) r = 0;
      }
    } else {
      const bigM = BigInt(m);
      for (let i = 0; i < classes.length; i++) {
        if (!squares[Number(abs(start + BigInt(i)) % bigM)]) classes[i] |= IMPOSSIBLE_SQUARE;
      }
    }
  }
}

/** Residues x mod m for which N + x² can still be a square modulo m. */
export function allowedResidues(n: bigint, m: number): number[] {
  const squares = squaresMod(m);
  const r = Number(((n % BigInt(m)) + BigInt(m)) % BigInt(m));
  const out: number[] = [];
  for (let x = 0; x < m; x++) if (squares[(r + ((x * x) % m)) % m]) out.push(x);
  return out;
}
