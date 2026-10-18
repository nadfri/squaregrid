import { abs, isPerfectSquare } from "./bigint.ts";
import { CellClass } from "./cell-class.ts";
import { isPrime } from "./primality.ts";

// Segmented sieve is used while the largest |value| stays below this (base primes up to 1e7).
const SIEVE_LIMIT = 100_000_000_000_000n;

function basePrimes(limit: number): Uint32Array {
  const composite = new Uint8Array(limit + 1);
  const out: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (composite[i]) continue;
    out.push(i);
    for (let j = i * i; j <= limit; j += i) composite[j] = 1;
  }
  return Uint32Array.from(out);
}

/** primality[v - lo] for v in [lo, hi], numbers only. */
function segmentedSieve(lo: number, hi: number): Uint8Array {
  const isPrimeSeg = new Uint8Array(hi - lo + 1).fill(1);
  for (let v = lo; v <= Math.min(hi, 1); v++) isPrimeSeg[v - lo] = 0;
  for (const p of basePrimes(Math.floor(Math.sqrt(hi)))) {
    const first = Math.max(p * p, Math.ceil(lo / p) * p);
    for (let m = first; m <= hi; m += p) isPrimeSeg[m - lo] = 0;
  }
  return isPrimeSeg;
}

/**
 * Class of each value start, start + 1, …, start + length - 1
 * (priority: target > marks > prime > square > other), based on |value|.
 */
export function classifyRange(
  start: bigint,
  length: number,
  target: bigint | null,
  marks: bigint[],
): Uint8Array {
  const classes = new Uint8Array(length);
  if (length === 0) return classes;

  const end = start + BigInt(length - 1);
  const maxAbs = abs(start) > abs(end) ? abs(start) : abs(end);

  if (maxAbs < SIEVE_LIMIT) {
    const s = Number(start);
    const minAbs =
      s <= 0 && s + length - 1 >= 0 ? 0 : Math.min(Math.abs(s), Math.abs(s + length - 1));
    const sieve = segmentedSieve(minAbs, Number(maxAbs));
    for (let i = 0; i < length; i++) {
      const v = Math.abs(s + i);
      if (sieve[v - minAbs]) classes[i] = CellClass.Prime;
      else {
        const r = Math.round(Math.sqrt(v));
        if (r * r === v) classes[i] = CellClass.Square;
      }
    }
  } else {
    for (let i = 0; i < length; i++) {
      const v = abs(start + BigInt(i));
      if (isPrime(v)) classes[i] = CellClass.Prime;
      else if (isPerfectSquare(v)) classes[i] = CellClass.Square;
    }
  }

  const mark = (v: bigint, cls: CellClass) => {
    const i = v - start;
    if (i >= 0n && i < BigInt(length)) classes[Number(i)] = cls;
  };
  marks.forEach((m) => mark(m, CellClass.Mark));
  if (target !== null) mark(target, CellClass.Target);
  return classes;
}
