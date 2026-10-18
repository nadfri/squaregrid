import { fermat } from "./lib/fermat.ts";
import { lehman } from "./lib/lehman.ts";
import { pollardBrent } from "./lib/rho.ts";
import type { FactorResult } from "./lib/factor.ts";

const RUNNERS = { fermat, lehman, rho: pollardBrent };

export type Method = keyof typeof RUNNERS;
export type FactorRequest = { method: Method; n: bigint };
export type FactorMessage =
  | { type: "progress"; iterations: number }
  | { type: "result"; result: FactorResult };

const send = (msg: FactorMessage) => postMessage(msg);

onmessage = ({ data }: MessageEvent<FactorRequest>) => {
  const result = RUNNERS[data.method](data.n, {
    onProgress: (iterations) => send({ type: "progress", iterations }),
  });
  send({ type: "result", result });
};
