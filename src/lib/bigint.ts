/** Parses an integer typed by the user (spaces / underscores allowed). */
export function parseBigInt(raw: string): bigint | null {
  const s = raw.replace(/[\s_]/g, "");
  return /^-?\d+$/.test(s) ? BigInt(s) : null;
}

export const abs = (n: bigint): bigint => (n < 0n ? -n : n);

export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function bitLength(n: bigint): number {
  return n === 0n ? 0 : n.toString(2).length;
}

/** floor(sqrt(n)), exact for any size. */
export function isqrt(n: bigint): bigint {
  if (n < 0n) throw new RangeError("isqrt of negative number");
  if (n < 2n) return n;
  if (n < 1n << 52n) {
    // Float sqrt is exact enough here, just correct by ±1.
    let r = BigInt(Math.floor(Math.sqrt(Number(n))));
    while (r * r > n) r--;
    while ((r + 1n) * (r + 1n) <= n) r++;
    return r;
  }
  // Start Newton from a float estimate of the top 52 bits (an upper bound), so it converges in a few steps.
  const shift = (bitLength(n) - 52) & ~1;
  const top = Math.floor(Math.sqrt(Number(n >> BigInt(shift))));
  let x = BigInt(top + 2) << BigInt(shift >> 1);
  for (;;) {
    const y = (x + n / x) >> 1n;
    if (y >= x) return x;
    x = y;
  }
}

/** floor(cbrt(n)), n >= 0. */
export function icbrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = 1n << BigInt(Math.ceil(bitLength(n) / 3));
  for (;;) {
    const y = (2n * x + n / (x * x)) / 3n;
    if (y >= x) break;
    x = y;
  }
  while (x * x * x > n) x--;
  while ((x + 1n) ** 3n <= n) x++;
  return x;
}

// Squares modulo 64 / 63 / 65 / 11: rejects ~99% of non-squares without any sqrt.
const squaresMod = (m: number): Uint8Array => {
  const t = new Uint8Array(m);
  for (let i = 0; i < m; i++) t[(i * i) % m] = 1;
  return t;
};
const SQ64 = squaresMod(64);
const SQ63 = squaresMod(63);
const SQ65 = squaresMod(65);
const SQ11 = squaresMod(11);

export function isPerfectSquare(n: bigint): boolean {
  if (n < 0n) return false;
  if (!SQ64[Number(n & 63n)]) return false;
  const r = Number(n % 45045n); // 63 * 65 * 11
  if (!SQ63[r % 63] || !SQ65[r % 65] || !SQ11[r % 11]) return false;
  const s = isqrt(n);
  return s * s === n;
}

export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}
