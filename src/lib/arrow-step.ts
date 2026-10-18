import { parseBigInt } from "./bigint.ts";

/** ArrowUp / ArrowDown add or subtract 1 on a text input holding an integer. */
export function bindArrowStep(input: HTMLInputElement) {
  input.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const value = parseBigInt(input.value) ?? 0n;
    e.preventDefault();
    input.value = (e.key === "ArrowUp" ? value + 1n : value - 1n).toString();
    input.dispatchEvent(new Event("input"));
  });
}
