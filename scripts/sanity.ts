// Sanity checks: node scripts/sanity.ts
import { isPrime } from "../src/lib/primality.ts";
import { fermat } from "../src/lib/fermat.ts";
import { lehman } from "../src/lib/lehman.ts";
import { pollardBrent } from "../src/lib/rho.ts";
import { icbrt, isqrt, isPerfectSquare } from "../src/lib/bigint.ts";
import { classifyRange } from "../src/lib/classify.ts";
import { CellClass } from "../src/lib/cell-class.ts";
import { allowedResidues, flagImpossibleSquares, squaresMod } from "../src/lib/modular.ts";

let failures = 0;
const check = (label: string, ok: boolean) => {
  if (!ok) {
    failures++;
    console.error("FAIL", label);
  }
};

// Primality vs. sieve up to 2e6
const LIMIT = 2_000_000;
const sieve = new Uint8Array(LIMIT);
for (let i = 2; i * i < LIMIT; i++)
  if (!sieve[i]) for (let j = i * i; j < LIMIT; j += i) sieve[j] = 1;
for (let i = 0; i < LIMIT; i++)
  check(`isPrime(${i})`, isPrime(BigInt(i)) === (i >= 2 && !sieve[i]));

const M61 = 2n ** 61n - 1n;
const M89 = 2n ** 89n - 1n;
const M127 = 2n ** 127n - 1n;
const M521 = 2n ** 521n - 1n;
const cases: [bigint, boolean][] = [
  [M61, true],
  [M89, true],
  [M127, true],
  [M521, true],
  [2n ** 128n + 1n, false],
  [M61 * M89, false],
  [M89 * M89, false],
  [3825123056546413051n, false], // strong pseudoprime to bases 2..23
  [318665857834031151167461n, false], // strong pseudoprime to bases 2..37
  [3317044064679887385961981n, false], // strong pseudoprime to bases 2..41
];
for (const [n, expected] of cases) check(`isPrime(${n})`, isPrime(n) === expected);

for (const n of [0n, 1n, 15n, 16n, M127 * M127, M127 * M127 + 1n, M127 * M127 - 1n]) {
  const r = isqrt(n);
  check(`isqrt(${n})`, r * r <= n && (r + 1n) * (r + 1n) > n);
}
check("isPerfectSquare", isPerfectSquare(M127 * M127) && !isPerfectSquare(M127 * M127 + 1n));
for (let i = 0n; i < 3000n; i += 7n)
  check(`isqrt(${i})`, isqrt(i * i) === i && isqrt(i * i + 2n * i) === i);
for (const n of [0n, 1n, 7n, 8n, 26n, 27n, M127, M127 ** 3n, M127 ** 3n - 1n]) {
  const r = icbrt(n);
  check(`icbrt(${n})`, r ** 3n <= n && (r + 1n) ** 3n > n);
}

// Fermat
const t0 = performance.now();
const f = fermat(1999n * 10037n, { maxIterations: 1e9 });
check("fermat 1999*10037", f.status === "found" && f.p === 1999n && f.q === 10037n);
const big = 1000000000000000003n * 1000000000000000009n;
const g = fermat(big, { maxIterations: 1e9 });
check("fermat big", g.status === "found" && g.p * g.q === big && g.p === 1000000000000000003n);
check("fermat 2 mod 4", fermat(6n, { maxIterations: 10 }).status === "invalid");
const h = fermat(1999n * 1000003n, { maxIterations: 1e9 });
check("fermat far factors", h.status === "found" && h.p === 1999n);
console.log(
  "fermat far factors iterations",
  h.status === "found" && h.iterations,
  `${(performance.now() - t0).toFixed(0)} ms`,
);

// Lehman & rho: all splits of products of primes
const splits = (n: bigint, r: ReturnType<typeof lehman>) =>
  r.status === "found" && r.p > 1n && r.p * r.q === n;
for (const [a, b] of [
  [3n, 5n],
  [1009n, 1013n],
  [999983n, 1000003n],
  [100000000103n, 900000000269n],
  [2n, 1000000007n],
]) {
  const n = a * b;
  check(`lehman(${n})`, splits(n, lehman(n)));
  check(`rho(${n})`, splits(n, pollardBrent(n)));
}
// Small factor of a 27-digit N: rho's case (Lehman would need ~N^(1/3) = 1e9 steps).
const smallFactor = 1000000007n * 1000000000000000003n;
check("rho(small factor)", splits(smallFactor, pollardBrent(smallFactor)));
for (let n = 4n; n < 3000n; n++) {
  if (isPrime(n)) continue;
  check(`lehman(${n})`, splits(n, lehman(n)));
  check(`rho(${n})`, splits(n, pollardBrent(n)));
}

// Grid classification: sieve path vs BigInt path, ranges crossing zero, marks priority
const expectedClass = (v: bigint) => {
  const a = v < 0n ? -v : v;
  return isPrime(a) ? CellClass.Prime : isPerfectSquare(a) ? CellClass.Square : CellClass.Other;
};
for (const [start, length] of [
  [1n, 5000],
  [-2500n, 5000],
  [99_999_999_990_000n, 20000], // around the sieve limit: both paths
  [10n ** 30n, 300],
] as const) {
  const got = classifyRange(start, length, null, []);
  let ok = true;
  for (let i = 0; i < length; i++) if (got[i] !== expectedClass(start + BigInt(i))) ok = false;
  check(`classifyRange(${start}, ${length})`, ok);
}
const marked = classifyRange(1n, 100, 50n, [7n, 50n, 1000n]);
check("classify marks", marked[6] === CellClass.Mark && marked[49] === CellClass.Target);

// Modular filter
check("allowedResidues(133, 8)", allowedResidues(133n, 8).join() === "2,6");
const flags = new Uint8Array(8);
flagImpossibleSquares(flags, 0n, [4]);
check("flagImpossibleSquares mod 4", [...flags].map((f) => (f ? 1 : 0)).join("") === "00110011");
for (let x = 0n; x < 200n; x++) {
  const v = 133n + x * x;
  if (isPerfectSquare(v))
    check(
      `square ${v} passes mod filter`,
      [3, 5, 7, 8, 9, 11].every((m) => squaresMod(m)[Number(v % BigInt(m))] === 1),
    );
}

const userN = 90000000119600000027707n;
for (const [name, run] of [
  ["lehman", lehman],
  ["rho", pollardBrent],
] as const) {
  const t = performance.now();
  const res = run(userN);
  check(`${name}(userN)`, splits(userN, res));
  console.log(
    name,
    res.status === "found" && `${res.p} × ${res.q} (${res.note})`,
    `${(performance.now() - t).toFixed(0)} ms`,
  );
}

console.log(failures ? `${failures} failure(s)` : "All sanity checks passed");
process.exit(failures ? 1 : 0);
