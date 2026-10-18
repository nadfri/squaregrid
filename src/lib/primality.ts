import { abs, isPerfectSquare, modPow } from "./bigint.ts";

const TRIAL_LIMIT = 1000;

const SMALL_PRIMES: bigint[] = (() => {
  const sieve = new Uint8Array(TRIAL_LIMIT);
  const out: bigint[] = [];
  for (let i = 2; i < TRIAL_LIMIT; i++) {
    if (sieve[i]) continue;
    out.push(BigInt(i));
    for (let j = i * i; j < TRIAL_LIMIT; j += i) sieve[j] = 1;
  }
  return out;
})();

// Miller-Rabin with the first 13 primes as bases is deterministic below this bound.
const MR_DETERMINISTIC_LIMIT = 3_317_044_064_679_887_385_961_981n;
const MR_BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n];

function millerRabin(n: bigint, d: bigint, s: number, a: bigint): boolean {
  let x = modPow(a, d, n);
  if (x === 1n || x === n - 1n) return true;
  for (let r = 1; r < s; r++) {
    x = (x * x) % n;
    if (x === n - 1n) return true;
  }
  return false;
}

function jacobi(a: bigint, n: bigint): number {
  a %= n;
  if (a < 0n) a += n;
  let result = 1;
  while (a !== 0n) {
    while ((a & 1n) === 0n) {
      a >>= 1n;
      const r = n & 7n;
      if (r === 3n || r === 5n) result = -result;
    }
    [a, n] = [n, a];
    if ((a & 3n) === 3n && (n & 3n) === 3n) result = -result;
    a %= n;
  }
  return n === 1n ? result : 0;
}

/** Strong Lucas probable-prime test (Selfridge method A). */
function strongLucas(n: bigint): boolean {
  // No suitable D exists for perfect squares.
  if (isPerfectSquare(n)) return false;

  let D = 5n;
  for (;;) {
    const j = jacobi(D, n);
    if (j === -1) break;
    if (j === 0 && abs(D) !== n) return false;
    D = D > 0n ? -(D + 2n) : -(D - 2n);
  }
  const P = 1n;
  const Q = (1n - D) / 4n;

  const mod = (x: bigint) => {
    const r = x % n;
    return r < 0n ? r + n : r;
  };
  const half = (x: bigint) => (x & 1n ? x + n : x) >> 1n;
  const Dm = mod(D);
  const Qm = mod(Q);

  let d = n + 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }

  let U = 1n;
  let V = P;
  let Qk = Qm;
  const bits = d.toString(2);
  for (let i = 1; i < bits.length; i++) {
    U = (U * V) % n;
    V = mod(V * V - 2n * Qk);
    Qk = (Qk * Qk) % n;
    if (bits[i] === "1") {
      const u = mod(P * U + V);
      const v = mod(Dm * U + P * V);
      U = half(u);
      V = half(v);
      Qk = (Qk * Qm) % n;
    }
  }

  if (U === 0n || V === 0n) return true;
  for (let r = 1; r < s; r++) {
    V = mod(V * V - 2n * Qk);
    if (V === 0n) return true;
    Qk = (Qk * Qk) % n;
  }
  return false;
}

/**
 * Deterministic below 3.3e24 (Miller-Rabin), BPSW above
 * (no known counter-example).
 */
export function isPrime(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of SMALL_PRIMES) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  if (n < BigInt(TRIAL_LIMIT * TRIAL_LIMIT)) return true;

  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }

  if (n < MR_DETERMINISTIC_LIMIT) return MR_BASES.every((a) => millerRabin(n, d, s, a));
  return millerRabin(n, d, s, 2n) && strongLucas(n);
}
