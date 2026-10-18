import { classifyRange } from "./lib/classify.ts";
import { flagImpossibleSquares } from "./lib/modular.ts";

export type ClassifyRequest = {
  id: number;
  start: bigint;
  length: number;
  target: bigint | null;
  marks: bigint[];
  moduli: number[];
};
export type ClassifyResponse = { id: number; classes: Uint8Array };

onmessage = ({ data }: MessageEvent<ClassifyRequest>) => {
  const classes = classifyRange(data.start, data.length, data.target, data.marks);
  flagImpossibleSquares(classes, data.start, data.moduli);
  const response: ClassifyResponse = { id: data.id, classes };
  postMessage(response, { transfer: [classes.buffer] });
};
