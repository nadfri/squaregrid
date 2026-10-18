// Fermat iterations for N × m, for small multipliers m: node scripts/multipliers.ts N
import { fermat } from "../src/lib/fermat.ts";
import { pollardBrent } from "../src/lib/rho.ts";

const N = BigInt(process.argv[2] ?? "20063963");
const f = pollardBrent(N);
if (f.status === "found")
  console.log(`N = ${f.p} × ${f.q}, q/p ≈ ${(Number(f.q) / Number(f.p)).toFixed(3)}`);

const rows: string[] = [];
for (let m = 1n; m <= 60n; m++) {
  const r = fermat(N * m, { maxIterations: 1e8 });
  if (r.status === "found")
    rows.push(
      `m = ${m}`.padEnd(8) + `${r.iterations}`.padStart(10) + ` it.   ${N * m} = ${r.p} × ${r.q}`,
    );
}
console.log(rows.join("\n"));
