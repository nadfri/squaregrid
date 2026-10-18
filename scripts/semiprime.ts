// Random balanced semiprime for testing external factoring tools: node scripts/semiprime.ts [digits]
import { randomBytes } from "node:crypto";
import { isPrime } from "../src/lib/primality.ts";

const digits = Number(process.argv[2] ?? 100);
const half = Math.ceil(digits / 2);

function randomPrime(len: number): bigint {
  for (;;) {
    const hex = randomBytes(len).toString("hex");
    const raw = BigInt("0x" + hex) % 10n ** BigInt(len);
    const candidate = raw + 10n ** BigInt(len - 1) * (raw < 10n ** BigInt(len - 1) ? 1n : 0n);
    if (isPrime(candidate | 1n)) return candidate | 1n;
  }
}

const p = randomPrime(half);
const q = randomPrime(digits - half);
console.log(`p = ${p}\nq = ${q}\nN = ${p * q} (${(p * q).toString().length} chiffres)`);
