export const CellClass = {
  Other: 0,
  Prime: 1,
  Square: 2,
  Mark: 3,
  Target: 4,
  Pending: 5,
} as const;

export type CellClass = (typeof CellClass)[keyof typeof CellClass];

/** Bit added to a class when the value cannot be a square modulo the chosen moduli. */
export const IMPOSSIBLE_SQUARE = 0x80;
