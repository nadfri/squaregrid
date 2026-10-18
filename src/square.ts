import "./styles/theme.css";
import "./styles/square.css";
import { gcd, parseBigInt } from "./lib/bigint.ts";
import { isPrime } from "./lib/primality.ts";
import { bindArrowStep } from "./lib/arrow-step.ts";
import type { FactorResult } from "./lib/factor.ts";
import type { FactorMessage, FactorRequest, Method } from "./factor.worker.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const form = $<HTMLFormElement>("form");
const inputP = $<HTMLInputElement>("inputP");
const inputQ = $<HTMLInputElement>("inputQ");
const inputN = $<HTMLInputElement>("inputN");
const inputCoef = $<HTMLInputElement>("inputCoef");
const inputPowCoef = $<HTMLInputElement>("inputPowCoef");
const spanN = $("spanN");
const spanN2 = $("spanN2");
const spanDigits = $("spanDigits");
const spanCalcul = $("spanCalcul");
const spanMethod = $("spanMethod");
const spanX = $("spanX");
const spanX2 = $("spanX2");
const spanY = $("spanY");
const spanY2 = $("spanY2");
const spanP = $("spanP");
const spanQ = $("spanQ");
const labelP = $("labelP");
const labelQ = $("labelQ");
const factorsN = $("factorsN");
const spanFactors = $("spanFactors");
const error = $("error");
const btnFind = $<HTMLButtonElement>("btnFind");
const btnLehman = $<HTMLButtonElement>("btnLehman");

const METHODS: Record<Method, string> = {
  fermat: "Fermat",
  lehman: "Lehman",
  rho: "Pollard-Brent ρ",
};

/** N actually factored (may be baseN × coef^pow). */
let N = 1n;
let baseN = 1n;
let workers: Worker[] = [];

const fmt = (n: bigint | number) => n.toLocaleString();
const read = (input: HTMLInputElement) => parseBigInt(input.value);

function showError(message: string) {
  error.textContent = message;
  error.style.display = "block";
}

function setN(value: bigint, base = value) {
  stop();
  error.style.display = "none";
  factorsN.hidden = true;
  N = value;
  baseN = base;
  spanN2.textContent = fmt(N);
  spanDigits.textContent = String(N.toString().replace("-", "").length);
}

function calculN() {
  inputCoef.value = "";
  inputPowCoef.value = "";
  setN((read(inputP) || 1n) * (read(inputQ) || 1n));
  spanN.textContent = fmt(N);
  inputN.value = N.toString();
}

function calculNCoef() {
  if (inputPowCoef.valueAsNumber < 1) inputPowCoef.valueAsNumber = 1;
  const pow = read(inputPowCoef) || 2n;
  const base = read(inputN) || 1n;
  setN(base * (read(inputCoef) || 1n) ** pow, base);
  console.log("N with coef", N);
}

function onInputN() {
  inputP.value = "";
  inputQ.value = "";
  inputCoef.value = "";
  inputPowCoef.value = "";
  spanN.textContent = "";
  setN(read(inputN) || 1n);
}

function stop() {
  workers.forEach((w) => w.terminate());
  workers = [];
  btnFind.textContent = "Calculer";
  btnLehman.disabled = false;
  delete btnFind.dataset.running;
}

function showResult(
  method: Method,
  result: Extract<FactorResult, { status: "found" }>,
  ms: number,
) {
  const { p, q, iterations, note } = result;
  // N = Y² − X² with Y = (p + q) / 2, X = (q − p) / 2, only when p + q is even.
  const even = ((p + q) & 1n) === 0n;
  const y = even ? fmt((p + q) / 2n) : "—";
  const x = even ? fmt((q - p) / 2n) : "—";
  spanY.textContent = y;
  spanY2.textContent = y;
  spanX.textContent = x;
  spanX2.textContent = x;
  spanP.textContent = fmt(p);
  spanQ.textContent = fmt(q);
  labelP.textContent = "p = Y − X";
  labelQ.textContent = "q = Y + X";
  spanCalcul.textContent = fmt(iterations);
  spanMethod.textContent = `${METHODS[method]}${note ? ` (${note})` : ""} – ${ms.toFixed(0)} ms`;
  if (N !== baseN) {
    // Y ± X split m·N; each side carries one factor of N plus part of the multiplier.
    const g = gcd(p, baseN);
    const d = g === 1n || g === baseN ? gcd(q, baseN) : g;
    const [np, nq] = d < baseN / d ? [d, baseN / d] : [baseN / d, d];
    spanP.textContent = fmt(np);
    spanQ.textContent = fmt(nq);
    labelP.textContent = "p = pgcd(Y − X, N)";
    labelQ.textContent = "q = N / p";
    spanFactors.textContent = `${fmt(p)} ; ${fmt(q)}`;
    factorsN.hidden = false;
  }
}

function find(requested?: Method[]) {
  if (workers.length) return stop();

  error.style.display = "none";
  factorsN.hidden = true;
  if (N < 4n || isPrime(N)) {
    spanMethod.textContent = "—";
    return showError(N < 4n ? "N doit être ≥ 4" : "N est premier");
  }

  const startedAt = performance.now();
  const progress: Partial<Record<Method, string>> = {};
  const failures: string[] = [];
  const renderProgress = () =>
    (spanCalcul.textContent = Object.entries(progress)
      .map(([m, v]) => `${METHODS[m as Method]} ${v}`)
      .join(" · "));

  spanCalcul.textContent = "…";
  spanMethod.textContent = "…";
  btnFind.textContent = "Stop";
  btnFind.dataset.running = "";
  btnLehman.disabled = true;

  // With a multiplier the point is to watch Fermat on m·N; rho/Lehman would just pull out the multiplier's own factors.
  const methods: Method[] =
    requested ?? (N === baseN ? (Object.keys(METHODS) as Method[]) : ["fermat"]);
  workers = methods.map((method) => {
    const worker = new Worker(new URL("./factor.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = ({ data }: MessageEvent<FactorMessage>) => {
      if (data.type === "progress") {
        progress[method] = fmt(data.iterations);
        return renderProgress();
      }

      const { result } = data;
      if (result.status === "found") {
        stop();
        showResult(method, result, performance.now() - startedAt);
        console.log(`${METHODS[method]} gagne`, result);
        return;
      }

      worker.terminate();
      workers = workers.filter((w) => w !== worker);
      delete progress[method];
      failures.push(
        `${METHODS[method]} : ${result.status === "invalid" ? result.reason : "limite atteinte"}`,
      );
      if (!workers.length) {
        stop();
        showError(failures.join(" — "));
      }
    };
    const request: FactorRequest = { method, n: N };
    worker.postMessage(request);
    return worker;
  });
}

form.onsubmit = (e) => e.preventDefault();
inputCoef.oninput = calculNCoef;
inputPowCoef.oninput = calculNCoef;
inputP.oninput = calculN;
inputQ.oninput = calculN;
inputN.oninput = onInputN;
btnFind.onclick = () => find();
btnLehman.onclick = () => find(["lehman"]);

[inputP, inputQ, inputN].forEach((input) => bindArrowStep(input));

calculN();
