import './styles/theme.css';
import './styles/grid.css';
import { isPerfectSquare, isqrt, parseBigInt } from './lib/bigint.ts';
import { CellClass, IMPOSSIBLE_SQUARE } from './lib/cell-class.ts';
import { allowedResidues, parseModuli, squaresMod } from './lib/modular.ts';
import type { ClassifyRequest, ClassifyResponse } from './classify.worker.ts';

const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;

/* DOM elements */
const canvas = $<HTMLCanvasElement>('canvas');
const ctx = canvas.getContext('2d', { alpha: false })!;
const toolbar = document.querySelector<HTMLElement>('.toolbar')!;
const initInput = $<HTMLInputElement>('init');
const nInput = $<HTMLInputElement>('n');
const pInput = $<HTMLInputElement>('p');
const qInput = $<HTMLInputElement>('q');
const pqDisplay = $<HTMLOutputElement>('pq');
const rowCounter = $('rowCounter');
const cellCounter = $('cellCounter');
const statusEl = $('status');
const zoomLevel = $('zoomLevel');
const modeDrawBtn = $('modeDraw');
const modePanBtn = $('modePan');
const modeSelectBtn = $('modeSelect');
const selectionActions = $('selectionActions');
const prefixBox = $('prefix');
const prefixValue = $('prefixValue');
const tooltip = $('tooltip');
const tooltipValue = $('tooltipValue');
const tooltipSwatch = $('tooltipSwatch');
const tooltipTag = $('tooltipTag');
const tooltipPos = $('tooltipPos');
const fermatPanel = $('fermatPanel');
const fermatBody = $('fermatBody');
const moduliInput = $<HTMLInputElement>('moduli');
const tooltipMod = $('tooltipMod');

/* Constants */
const DEFAULT_COLS = 150;
const DEFAULT_ROWS = 80;
const DEFAULT_SCALE = 20;
const FIT_MAX_SCALE = 2 * DEFAULT_SCALE;
const MAX_PYRAMIDE = 1_000_000;
const MAX_FERMAT_ROWS = 1000;
const MIN_SCALE = 0.2;
const MAX_SCALE = 200;
const GRID_MIN_SCALE = 4; // below this, grid lines would be denser than the cells
const GRID_COLOR = 'rgba(148, 163, 184, 0.16)';
const DEFAULT_PYRAMIDE = 100;
const DEFAULT_CARRE_SIDE = 10;
const EDGE_MARGIN = 3; // drawing this close to a side grows the board there
const GROW_STEP = 40;
const MAX_DIM = 2000; // cap per side, the bitmap is rebuilt on every edit
const MIN_FONT = 7; // smallest readable label, in px
const CHAR_WIDTH = 0.62; // monospace glyph width / font size

/* Palette, read from CSS variables */
const css = getComputedStyle(document.documentElement);
const cssVar = (name: string) => css.getPropertyValue(name).trim();
const hexToRgb = (hex: string): [number, number, number] => {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const CLASS_VAR: Record<CellClass, string> = {
  [CellClass.Other]: '--cell-other',
  [CellClass.Prime]: '--cell-prime',
  [CellClass.Square]: '--cell-square',
  [CellClass.Mark]: '--cell-mark',
  [CellClass.Target]: '--cell-target',
  [CellClass.Pending]: '--cell-pending',
};
const CLASS_LABEL: Record<CellClass, string> = {
  [CellClass.Other]: 'Composé',
  [CellClass.Prime]: 'Premier',
  [CellClass.Square]: 'Carré parfait',
  [CellClass.Mark]: 'p, q ou pq',
  [CellClass.Target]: 'N',
  [CellClass.Pending]: 'Calcul…',
};
const palette = Object.fromEntries(
  Object.entries(CLASS_VAR).map(([cls, name]) => [cls, hexToRgb(cssVar(name))]),
) as unknown as Record<CellClass, [number, number, number]>;
const BG = cssVar('--bg');
const BOARD = cssVar('--board');
const MONO = cssVar('--mono');
const boardRgb = hexToRgb(BOARD);
/** Colors of cells that cannot be squares modulo m: mostly faded into the board. */
const dimPalette = Object.fromEntries(
  Object.entries(palette).map(([cls, rgb]) => [
    cls,
    rgb.map((c, k) => Math.round(c * 0.25 + boardRgb[k] * 0.75)),
  ]),
) as unknown as Record<CellClass, [number, number, number]>;

/* Grid model: 1 byte per cell, numbers follow filled cells in row-major order */
let cols = DEFAULT_COLS;
let rows = DEFAULT_ROWS;
let cells = new Uint8Array(cols * rows);
/** rowPrefix[y] = filled cells before row y */
let rowPrefix = new Int32Array(rows + 1);
let classes: Uint8Array | null = null;
/** Cells of N and p/q/pq, highlighted with a ring at any zoom level. */
let specials: { i: number; cls: CellClass }[] = [];

type FermatSolution = { x: number; y: bigint; cell: number };
/** Fermat pyramid: N on top, then rows of 1, 3, 5… numbers, so row X ends on N + X². */
let fermat: {
  n: bigint;
  rows: number;
  apex: number;
  last: number;
  solutions: FermatSolution[];
} | null = null;

/** One pixel per cell, scaled up with nearest-neighbour when rendering. */
const bitmap = document.createElement('canvas');
const bctx = bitmap.getContext('2d')!;

/* View: cell size in CSS px and grid origin in viewport */
let scale = DEFAULT_SCALE;
let ox = 0;
let oy = 0;
let vw = window.innerWidth;
let vh = window.innerHeight;
let dpr = window.devicePixelRatio || 1;

let mode: 'draw' | 'pan' | 'select' = 'draw';
let spaceHeld = false;
/** Selected cells, inclusive bounds in grid coordinates. */
let selection: { x0: number; y0: number; x1: number; y1: number } | null = null;
let hovered = -1;
let focused = -1;

/* ---------- Params ---------- */

const readInit = () => parseBigInt(initInput.value) ?? 1n;

function readParams() {
  const n = parseBigInt(nInput.value);
  const p = parseBigInt(pInput.value);
  const q = parseBigInt(qInput.value);
  const pq = p !== null && q !== null ? p * q : null;
  pqDisplay.textContent = pq?.toString() ?? '';
  pqDisplay.title = pqDisplay.textContent;
  const marks = [p, q, pq].filter((v): v is bigint => v !== null);
  return { init: readInit(), n, marks };
}

/* ---------- Model ---------- */

function resizeGrid(newCols: number, newRows: number) {
  cols = newCols;
  rows = newRows;
  cells = new Uint8Array(cols * rows);
  rowPrefix = new Int32Array(rows + 1);
  hovered = -1;
  focused = -1;
  selection = null;
}

/**
 * Adds empty rows/columns on the sides touched by cell i, keeping the view in place.
 * Returns the new index of cell i. The number order is unchanged (row-major, empty cells skipped).
 */
function growAround(i: number): number {
  const x = i % cols;
  const y = Math.floor(i / cols);
  const addLeft = x < EDGE_MARGIN ? Math.min(GROW_STEP, MAX_DIM - cols) : 0;
  const addRight =
    x >= cols - EDGE_MARGIN ? Math.min(GROW_STEP, MAX_DIM - cols - addLeft) : 0;
  const addTop = y < EDGE_MARGIN ? Math.min(GROW_STEP, MAX_DIM - rows) : 0;
  const addBottom =
    y >= rows - EDGE_MARGIN ? Math.min(GROW_STEP, MAX_DIM - rows - addTop) : 0;
  if (Math.max(addLeft, addRight, addTop, addBottom) <= 0) return i;

  const oldCols = cols;
  const newCols = cols + addLeft + addRight;
  const newRows = rows + addTop + addBottom;
  const next = new Uint8Array(newCols * newRows);
  for (let r = 0; r < rows; r++)
    next.set(
      cells.subarray(r * oldCols, (r + 1) * oldCols),
      (r + addTop) * newCols + addLeft,
    );
  const remap = (c: number) =>
    c < 0 ? c : (Math.floor(c / oldCols) + addTop) * newCols + (c % oldCols) + addLeft;

  cells = next;
  cols = newCols;
  rows = newRows;
  rowPrefix = new Int32Array(rows + 1);
  hovered = remap(hovered);
  focused = remap(focused);
  specials = specials.map((s) => ({ ...s, i: remap(s.i) }));
  if (selection)
    selection = {
      x0: selection.x0 + addLeft,
      y0: selection.y0 + addTop,
      x1: selection.x1 + addLeft,
      y1: selection.y1 + addTop,
    };
  ox -= addLeft * scale;
  oy -= addTop * scale;
  return remap(i);
}

const filledCount = () => rowPrefix[rows];

function recount() {
  let total = 0;
  let occupied = 0;
  for (let y = 0; y < rows; y++) {
    rowPrefix[y] = total;
    let c = 0;
    const base = y * cols;
    for (let x = 0; x < cols; x++) c += cells[base + x];
    total += c;
    if (c) occupied++;
  }
  rowPrefix[rows] = total;
  rowCounter.textContent = occupied.toLocaleString();
  cellCounter.textContent = total.toLocaleString();
}

/** Sequence index (0-based) of a filled cell. */
function indexOfCell(i: number): number {
  const y = Math.floor(i / cols);
  let idx = rowPrefix[y];
  for (let j = y * cols; j < i; j++) idx += cells[j];
  return idx;
}

/** Cell holding sequence index idx, or -1. */
function cellOfIndex(idx: number): number {
  if (idx < 0 || idx >= filledCount()) return -1;
  let lo = 0;
  let hi = rows - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (rowPrefix[mid] <= idx) lo = mid;
    else hi = mid - 1;
  }
  let k = idx - rowPrefix[lo];
  for (let i = lo * cols; i < (lo + 1) * cols; i++) {
    if (cells[i] && k-- === 0) return i;
  }
  return -1;
}

/* ---------- Classification (worker) ---------- */

const worker = new Worker(new URL('./classify.worker.ts', import.meta.url), {
  type: 'module',
});
let requestId = 0;
let inFlight = false;
let pending = false;

function classify() {
  if (inFlight) {
    pending = true;
    return;
  }
  inFlight = true;
  pending = false;
  const { init, n, marks } = readParams();
  const request: ClassifyRequest = {
    id: ++requestId,
    start: init,
    length: filledCount(),
    target: n,
    marks,
    moduli: parseModuli(moduliInput.value),
  };
  statusEl.textContent = 'Calcul…';
  worker.postMessage(request);
}

worker.onmessage = ({ data }: MessageEvent<ClassifyResponse>) => {
  inFlight = false;
  classes = data.classes;
  specials = [];
  classes.forEach((raw, idx) => {
    const cls = raw & ~IMPOSSIBLE_SQUARE;
    if (cls === CellClass.Mark || cls === CellClass.Target)
      specials.push({ i: cellOfIndex(idx), cls });
  });
  rebuildBitmap();
  if (pending) return classify();
  statusEl.textContent = '';
};

function classOf(idx: number): CellClass {
  return classes && idx < classes.length
    ? ((classes[idx] & ~IMPOSSIBLE_SQUARE) as CellClass)
    : CellClass.Pending;
}

const isImpossible = (idx: number) =>
  !!classes && idx < classes.length && (classes[idx] & IMPOSSIBLE_SQUARE) !== 0;

function rebuildBitmap() {
  if (bitmap.width !== cols || bitmap.height !== rows) {
    bitmap.width = cols;
    bitmap.height = rows;
  }
  const img = bctx.createImageData(cols, rows);
  const data = img.data;
  let idx = 0;
  for (let i = 0; i < cells.length; i++) {
    if (!cells[i]) continue;
    const [r, g, b] = (isImpossible(idx) ? dimPalette : palette)[classOf(idx)];
    idx++;
    const o = i * 4;
    data[o] = r;
    data[o + 1] = g;
    data[o + 2] = b;
    data[o + 3] = 255;
  }
  bctx.putImageData(img, 0, 0);
  scheduleRender();
}

/** Full refresh after the grid or the params changed. */
function refresh() {
  recount();
  rebuildBitmap();
  classify();
}

/* ---------- Rendering ---------- */

let frame = 0;
function scheduleRender() {
  if (!frame) frame = requestAnimationFrame(render);
}

function resizeCanvas() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);
  scheduleRender();
}

function visibleRange() {
  return {
    x0: Math.max(0, Math.floor(-ox / scale)),
    x1: Math.min(cols, Math.ceil((vw - ox) / scale)),
    y0: Math.max(0, Math.floor(-oy / scale)),
    y1: Math.min(rows, Math.ceil((vh - oy) / scale)),
  };
}

function render() {
  frame = 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, vw, vh);

  const gw = cols * scale;
  const gh = rows * scale;
  ctx.fillStyle = BOARD;
  ctx.fillRect(ox, oy, gw, gh);

  // Below 1px per cell, smoothing averages cells into a density map instead of aliasing.
  ctx.imageSmoothingEnabled = scale < 1;
  ctx.drawImage(bitmap, ox, oy, gw, gh);

  const range = visibleRange();
  if (scale >= GRID_MIN_SCALE) drawGrid(range);
  drawLabels(range);
  drawSpecialRings();
  drawFermat();
  drawSelection();
  outlineCell(focused, cssVar('--cell-target'), 3);
  outlineCell(hovered, '#ffffff', 2);

  zoomLevel.textContent = `${Math.round((scale / DEFAULT_SCALE) * 100)}%`;
  selectionActions.hidden = !selection;
}

/** Cell borders over the whole board, so empty cells stay visible. */
function drawGrid({ x0, x1, y0, y1 }: ReturnType<typeof visibleRange>) {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const top = Math.max(oy, 0);
  const bottom = Math.min(oy + rows * scale, vh);
  const left = Math.max(ox, 0);
  const right = Math.min(ox + cols * scale, vw);
  for (let x = x0; x <= x1; x++) {
    const px = ox + x * scale;
    ctx.moveTo(px, top);
    ctx.lineTo(px, bottom);
  }
  for (let y = y0; y <= y1; y++) {
    const py = oy + y * scale;
    ctx.moveTo(left, py);
    ctx.lineTo(right, py);
  }
  ctx.stroke();
}

/**
 * Labels are drawn only if readable. When full numbers don't fit, visible
 * numbers sharing the same leading digits are shortened to their suffix and
 * the common prefix is shown aside.
 */
function drawLabels({ x0, x1, y0, y1 }: ReturnType<typeof visibleRange>) {
  prefixBox.hidden = true;
  if (scale * 0.45 < MIN_FONT || x0 >= x1 || y0 >= y1) return;

  const init = readInit();
  const firstIdx = firstVisibleIndex(x0, x1, y0, y1);
  if (firstIdx < 0) return;
  const lastIdx = Math.min(rowPrefix[y1], filledCount()) - 1;

  const first = (init + BigInt(firstIdx)).toString();
  const last = (init + BigInt(lastIdx)).toString();
  const fullFont = Math.min(
    scale * 0.42,
    (scale * 0.88) / (Math.max(first.length, last.length) * CHAR_WIDTH),
  );

  let cut = 0;
  if (fullFont < MIN_FONT && first.length === last.length && first[0] !== '-') {
    while (cut < first.length - 1 && first[cut] === last[cut]) cut++;
    if (cut > 0) {
      prefixBox.hidden = false;
      prefixValue.textContent = `${first.slice(0, cut)}…`;
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let currentFont = '';

  for (let y = y0; y < y1; y++) {
    const base = y * cols;
    let idx = rowPrefix[y];
    for (let x = 0; x < x0; x++) idx += cells[base + x];

    for (let x = x0; x < x1; x++) {
      if (!cells[base + x]) continue;
      const label = (init + BigInt(idx)).toString().slice(cut);
      const fontSize = Math.min(
        scale * 0.42,
        (scale * 0.88) / (label.length * CHAR_WIDTH),
      );
      if (fontSize >= MIN_FONT) {
        const font = `600 ${fontSize.toFixed(1)}px ${MONO}`;
        if (font !== currentFont) ctx.font = currentFont = font;
        ctx.fillStyle = isImpossible(idx)
          ? 'rgba(255, 255, 255, 0.35)'
          : classOf(idx) === CellClass.Target
            ? '#111827'
            : 'rgba(255, 255, 255, 0.92)';
        ctx.fillText(label, ox + (x + 0.5) * scale, oy + (y + 0.5) * scale);
      }
      idx++;
    }
  }
}

function firstVisibleIndex(x0: number, x1: number, y0: number, y1: number): number {
  for (let y = y0; y < y1; y++) {
    const base = y * cols;
    for (let x = x0; x < x1; x++) if (cells[base + x]) return indexOfCell(base + x);
  }
  return -1;
}

function drawSpecialRings() {
  if (scale >= 12) return;
  ctx.lineWidth = 2;
  for (const { i, cls } of specials) {
    if (i < 0) continue;
    const cx = ox + ((i % cols) + 0.5) * scale;
    const cy = oy + (Math.floor(i / cols) + 0.5) * scale;
    ctx.strokeStyle = cssVar(CLASS_VAR[cls]);
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(8, scale), 0, Math.PI * 2);
    ctx.stroke();
  }
}

function cellCenter(i: number): [number, number] {
  return [ox + ((i % cols) + 0.5) * scale, oy + (Math.floor(i / cols) + 0.5) * scale];
}

function drawPill(text: string, x: number, y: number, color: string, alignRight = false) {
  ctx.font = `600 12px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 12;
  if (alignRight) x -= w;
  ctx.fillStyle = 'rgba(11, 16, 32, 0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y - 11, w, 22, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillText(text, x + 6, y);
}

function drawSelection() {
  if (!selection) return;
  const { x0, y0, x1, y1 } = selection;
  const x = ox + x0 * scale;
  const y = oy + y0 * scale;
  const w = (x1 - x0 + 1) * scale;
  const h = (y1 - y0 + 1) * scale;
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = cssVar('--accent');
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = cssVar('--accent');
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/** Diagonal N → N + X² (right ends of the rows) and the squares found on it. */
function drawFermat() {
  if (!fermat) return;
  const [ax, ay] = cellCenter(fermat.apex);
  const [lx, ly] = cellCenter(fermat.last);
  const squareColor = cssVar('--cell-square');

  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(165, 180, 252, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(lx, ly);
  ctx.stroke();
  ctx.restore();

  fermat.solutions.forEach(({ x, y, cell }, rank) => {
    const [cx, cy] = cellCenter(cell);
    ctx.strokeStyle = squareColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(10, scale * 0.75), 0, Math.PI * 2);
    ctx.stroke();

    const offset = Math.max(14, scale * 0.9);
    // Row X spans 2X − 1 cells ending on the square.
    const [rowLeft] = cellCenter(cell - Math.max(0, 2 * x - 2));
    drawPill(
      `X = ${x} ligne${x > 1 ? 's' : ''}`,
      rowLeft - offset,
      cy,
      squareColor,
      true,
    );
    if (rank === 0) {
      const n = fermat!.n;
      const big = BigInt(x);
      drawPill(`${n} + ${x}² = ${y}²`, cx + offset, cy - 14, squareColor);
      drawPill(`p = ${y - big} · q = ${y + big}`, cx + offset, cy + 14, squareColor);
    }
  });
}

function outlineCell(i: number, color: string, width: number) {
  if (i < 0 || i >= cells.length) return;
  const x = i % cols;
  const y = Math.floor(i / cols);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  const pad = Math.min(width, scale / 4);
  ctx.strokeRect(
    ox + x * scale - pad / 2,
    oy + y * scale - pad / 2,
    scale + pad,
    scale + pad,
  );
}

/* ---------- View ---------- */

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

function zoomAt(cx: number, cy: number, factor: number) {
  const next = clampScale(scale * factor);
  ox = cx - ((cx - ox) * next) / scale;
  oy = cy - ((cy - oy) * next) / scale;
  scale = next;
  scheduleRender();
}

function viewport() {
  const top = toolbar.getBoundingClientRect().bottom + 12;
  return { left: 12, top, width: vw - 24, height: Math.max(100, vh - top - 70) };
}

function fitToCells() {
  let minX = cols;
  let minY = rows;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < rows; y++) {
    if (rowPrefix[y + 1] === rowPrefix[y]) continue;
    const base = y * cols;
    for (let x = 0; x < cols; x++) {
      if (!cells[base + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      minY = Math.min(minY, y);
      maxY = y;
    }
  }
  if (maxX < 0) [minX, minY, maxX, maxY] = [0, 0, cols - 1, rows - 1];

  const v = viewport();
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  scale = clampScale(Math.min(v.width / w, v.height / h, FIT_MAX_SCALE));
  ox = v.left + (v.width - w * scale) / 2 - minX * scale;
  oy = v.top + (v.height - h * scale) / 2 - minY * scale;
  scheduleRender();
}

function centerOnCell(i: number, minScale: number) {
  const v = viewport();
  scale = clampScale(Math.max(scale, minScale));
  ox = v.left + v.width / 2 - ((i % cols) + 0.5) * scale;
  oy = v.top + v.height / 2 - (Math.floor(i / cols) + 0.5) * scale;
  scheduleRender();
}

function focusN() {
  const { init, n } = readParams();
  if (n === null) return flash('Saisir N');
  const idx = n - init;
  const i = idx >= 0n && idx < BigInt(filledCount()) ? cellOfIndex(Number(idx)) : -1;
  if (i < 0) return flash('N est hors de la grille');
  focused = i;
  // Enough zoom to read the varying suffix of nearby numbers (the common prefix is shown aside).
  const digits = Math.min(n.toString().length, String(filledCount()).length + 1);
  centerOnCell(i, (MIN_FONT * 1.6 * digits * CHAR_WIDTH) / 0.88);
}

function flash(message: string) {
  statusEl.textContent = message;
  setTimeout(() => statusEl.textContent === message && (statusEl.textContent = ''), 2500);
}

function setMode(next: 'draw' | 'pan' | 'select') {
  mode = next;
  canvas.dataset.mode = next;
  modeDrawBtn.setAttribute('aria-pressed', String(next === 'draw'));
  modePanBtn.setAttribute('aria-pressed', String(next === 'pan'));
  modeSelectBtn.setAttribute('aria-pressed', String(next === 'select'));
  if (next !== 'select') clearSelection();
}

function clearSelection() {
  selection = null;
  scheduleRender();
}

/** Sets the selected cells to `value`: 1 adds squares, 0 removes them. */
function applySelection(value: 0 | 1) {
  if (!selection) return;
  const { x0, y0, x1, y1 } = selection;
  for (let y = y0; y <= y1; y++) cells.fill(value, y * cols + x0, y * cols + x1 + 1);
  clearFermat();
  refresh();
}

/* ---------- Actions ---------- */

function resetGrid() {
  initInput.value = '1';
  nInput.value = '';
  pInput.value = '';
  qInput.value = '';
  clearFermat();
  resizeGrid(DEFAULT_COLS, DEFAULT_ROWS);
  refresh();
  centerOnCell(Math.floor(rows / 2) * cols + Math.floor(cols / 2), FIT_MAX_SCALE);
}

/** Pyramid: row r holds 2r + 1 numbers, so row r ends on a square (r + 1)². */
function generatePyramide(requested: bigint | null) {
  clearFermat();
  const count =
    !requested || requested < 1n
      ? DEFAULT_PYRAMIDE
      : requested > BigInt(MAX_PYRAMIDE)
        ? MAX_PYRAMIDE
        : Number(requested);
  const pyramidRows = Math.ceil(Math.sqrt(count));
  const boardRows = Math.max(DEFAULT_ROWS, 2 * pyramidRows + 4);
  const top = Math.floor((boardRows - pyramidRows) / 2);
  resizeGrid(Math.max(DEFAULT_COLS, 2 * pyramidRows + 5), boardRows);

  const center = Math.floor(cols / 2);
  for (let r = 0; r < pyramidRows; r++) {
    const base = (top + r) * cols;
    cells.fill(1, base + center - r, base + center + r + 1);
  }
  if (requested && requested > BigInt(MAX_PYRAMIDE))
    flash(`Pyramide limitée à ${MAX_PYRAMIDE.toLocaleString()} nombres`);
  refresh();
  fitToCells();
}

/** Square of side ⌊√N⌋, centred; the N − side² left-over cells fill rows below it, within its width. */
function generateSquare(requested: bigint | null) {
  clearFermat();
  if (requested && requested > BigInt(MAX_PYRAMIDE))
    flash(`Carré limité à ${MAX_PYRAMIDE.toLocaleString()} nombres`);
  const count =
    !requested || requested < 1n
      ? DEFAULT_CARRE_SIDE * DEFAULT_CARRE_SIDE
      : requested > BigInt(MAX_PYRAMIDE)
        ? MAX_PYRAMIDE
        : Number(requested);
  const side = Math.floor(Math.sqrt(count));
  const extra = count - side * side;
  const extraRows = Math.ceil(extra / side);
  const height = side + extraRows;
  const boardRows = Math.max(DEFAULT_ROWS, height + 4);
  resizeGrid(Math.max(DEFAULT_COLS, side + 5), boardRows);

  const r0 = Math.floor((boardRows - height) / 2);
  const c0 = Math.floor((cols - side) / 2);
  for (let r = 0; r < side; r++) {
    const base = (r0 + r) * cols + c0;
    cells.fill(1, base, base + side);
  }
  for (let r = 0; r < extraRows; r++) {
    const base = (r0 + side + r) * cols + c0;
    cells.fill(1, base, base + Math.min(side, extra - r * side));
  }
  refresh();
  fitToCells();
}

/**
 * Fermat pyramid: N alone on top, then rows of 1, 3, 5… numbers.
 * After X rows the last number is N + X²; when it is a square Y², N = (Y − X)(Y + X).
 */
function generateFermat() {
  const n = parseBigInt(nInput.value);
  if (n === null || n < 1n) return flash('Saisir N ≥ 1');

  const solutions: Omit<FermatSolution, 'cell'>[] = [];
  for (let x = 0; x <= MAX_FERMAT_ROWS && solutions.length < 3; x++) {
    const v = n + BigInt(x) ** 2n;
    if (isPerfectSquare(v)) solutions.push({ x, y: isqrt(v) });
  }

  const shown = solutions.length ? Math.max(solutions[0].x + 2, 6) : MAX_FERMAT_ROWS;
  const top = 2;
  resizeGrid(
    Math.max(DEFAULT_COLS, 2 * shown + 6),
    Math.max(DEFAULT_ROWS, top + shown + 3),
  );
  const c = Math.floor((cols - 2) / 2);
  const at = (row: number, col: number) => (top + row) * cols + col;

  cells[at(0, c)] = 1;
  for (let x = 1; x <= shown; x++) cells.fill(1, at(x, c + 2 - x), at(x, c + x) + 1);

  initInput.value = n.toString();
  fermat = {
    n,
    rows: shown,
    apex: at(0, c),
    last: at(shown, c + shown),
    solutions: solutions
      .filter((s) => s.x <= shown)
      .map((s) => ({ ...s, cell: at(s.x, c + s.x) })),
  };
  renderFermatPanel();
  refresh();
  fitToCells();
}

function renderFermatPanel() {
  fermatBody.replaceChildren();
  if (!fermat) return void (fermatPanel.hidden = true);
  const { n, solutions } = fermat;
  const impossible = n % 4n === 2n;

  const line = (text: string, className = '') => {
    const p = document.createElement('p');
    p.className = className;
    p.textContent = text;
    fermatBody.append(p);
    return p;
  };

  if (impossible) line('N ≡ 2 (mod 4) : N + X² n’est jamais un carré.', 'muted');
  else if (!solutions.length)
    line(
      `Aucun carré au bout des ${MAX_FERMAT_ROWS} premières lignes : p et q sont éloignés (X > ${MAX_FERMAT_ROWS}). Essaie k·N sur la page Factoriser.`,
      'muted',
    );

  for (const { x, y, cell } of solutions) {
    const big = BigInt(x);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'solution';
    const title = document.createElement('span');
    title.className = 'num';
    title.textContent = `X = ${x} ligne${x > 1 ? 's' : ''} → ${n} + ${x}² = ${y}²`;
    const result = document.createElement('span');
    result.className = 'num result';
    const p = y - big;
    result.textContent = `p = ${y} − ${x} = ${p} · q = ${y} + ${x} = ${y + big}${p === 1n ? ' (triviale)' : ''}`;
    button.append(title, result);
    button.addEventListener('click', () => centerOnCell(cell, 36));
    fermatBody.append(button);
  }
  renderModularHints(line);
  fermatPanel.hidden = false;
}

/** Which X are still possible on the right edge, for each modulus. */
function renderModularHints(line: (text: string, className?: string) => HTMLElement) {
  const moduli = parseModuli(moduliInput.value);
  if (!fermat || !moduli.length) return;
  const { n, rows } = fermat;

  line('Filtre modulo m (bord droit N + X²)', 'hint-title');
  for (const m of moduli) {
    const allowed = allowedResidues(n, m);
    const shown =
      allowed.length > 12 ? `${allowed.slice(0, 12).join(', ')}, …` : allowed.join(', ');
    line(
      `mod ${m} : X ≡ ${shown || '∅'}  (${allowed.length}/${m} possibles)`,
      'num muted',
    );
  }

  let alive = 0;
  for (let x = 0; x <= rows; x++) {
    const v = n + BigInt(x) ** 2n;
    if (moduli.every((m) => squaresMod(m)[Number(v % BigInt(m))])) alive++;
  }
  const pct = ((alive / (rows + 1)) * 100).toFixed(1);
  line(
    `Bord droit : ${alive} / ${rows + 1} cases encore possibles (${pct} %), les autres sont grisées.`,
  );
}

function clearFermat() {
  if (!fermat) return;
  fermat = null;
  renderFermatPanel();
  scheduleRender();
}

/* ---------- Pointer & keyboard ---------- */

type Drag =
  | { kind: 'draw'; value: 0 | 1; last: number }
  | { kind: 'pan'; x: number; y: number }
  | { kind: 'select'; ax: number; ay: number }
  | { kind: 'pinch'; dist: number; mx: number; my: number };

const pointers = new Map<number, { x: number; y: number }>();
let drag: Drag | null = null;

function cellAt(clientX: number, clientY: number): number {
  const x = Math.floor((clientX - ox) / scale);
  const y = Math.floor((clientY - oy) / scale);
  return x >= 0 && x < cols && y >= 0 && y < rows ? y * cols + x : -1;
}

function cellXYAt(clientX: number, clientY: number) {
  return {
    x: Math.min(cols - 1, Math.max(0, Math.floor((clientX - ox) / scale))),
    y: Math.min(rows - 1, Math.max(0, Math.floor((clientY - oy) / scale))),
  };
}

function pinchState() {
  const [a, b] = [...pointers.values()];
  return {
    dist: Math.hypot(a.x - b.x, a.y - b.y),
    mx: (a.x + b.x) / 2,
    my: (a.y + b.y) / 2,
  };
}

function setCell(i: number, value: 0 | 1) {
  if (i < 0 || cells[i] === value) return;
  clearFermat();
  cells[i] = value;
  if (value) {
    const moved = growAround(i);
    if (drag?.kind === 'draw') drag.last = moved;
  }
  refresh();
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  hideTooltip();

  if (pointers.size === 2) {
    drag = { kind: 'pinch', ...pinchState() };
    return;
  }
  if (mode === 'pan' || spaceHeld || e.button === 1) {
    drag = { kind: 'pan', x: e.clientX, y: e.clientY };
    canvas.dataset.dragging = 'pan';
    return;
  }
  if (mode === 'select') {
    if (e.button !== 0 || cellAt(e.clientX, e.clientY) < 0) return;
    const { x, y } = cellXYAt(e.clientX, e.clientY);
    drag = { kind: 'select', ax: x, ay: y };
    selection = { x0: x, y0: y, x1: x, y1: y };
    scheduleRender();
    return;
  }
  const i = cellAt(e.clientX, e.clientY);
  if (i < 0 || e.button !== 0) return;
  const value = cells[i] ? 0 : 1;
  drag = { kind: 'draw', value, last: i };
  setCell(i, value);
});

canvas.addEventListener('pointermove', (e) => {
  if (pointers.has(e.pointerId))
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (drag?.kind === 'pinch' && pointers.size === 2) {
    const next = pinchState();
    ox += next.mx - drag.mx;
    oy += next.my - drag.my;
    zoomAt(next.mx, next.my, next.dist / drag.dist);
    drag = { kind: 'pinch', ...next };
  } else if (drag?.kind === 'pan') {
    ox += e.clientX - drag.x;
    oy += e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    scheduleRender();
  } else if (drag?.kind === 'select') {
    const { x, y } = cellXYAt(e.clientX, e.clientY);
    selection = {
      x0: Math.min(drag.ax, x),
      y0: Math.min(drag.ay, y),
      x1: Math.max(drag.ax, x),
      y1: Math.max(drag.ay, y),
    };
    scheduleRender();
  } else if (drag?.kind === 'draw') {
    const i = cellAt(e.clientX, e.clientY);
    if (i !== drag.last) {
      drag.last = i;
      setCell(i, drag.value);
    }
  } else if (e.pointerType === 'mouse') {
    updateHover(e.clientX, e.clientY);
  }
});

const endPointer = (e: PointerEvent) => {
  pointers.delete(e.pointerId);
  if (pointers.size === 0) drag = null;
  else if (pointers.size === 1 && drag?.kind === 'pinch') {
    const [p] = pointers.values();
    drag = { kind: 'pan', x: p.x, y: p.y };
  }
  delete canvas.dataset.dragging;
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => {
  hovered = -1;
  hideTooltip();
  scheduleRender();
});

// Mouse wheel and trackpad pinch (ctrlKey) zoom; trackpad two-finger scrolling pans.
const isMouseWheel = (e: WheelEvent) =>
  e.deltaMode !== WheelEvent.DOM_DELTA_PIXEL ||
  (e.deltaX === 0 && Math.abs(e.deltaY) >= 40);

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    hideTooltip();
    if (e.ctrlKey || e.metaKey) {
      const delta = Math.max(-60, Math.min(60, e.deltaY));
      zoomAt(e.clientX, e.clientY, Math.exp(-delta * 0.01));
    } else if (isMouseWheel(e)) {
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.2 : 1 / 1.2);
    } else {
      ox -= e.deltaX;
      oy -= e.deltaY;
      scheduleRender();
    }
  },
  { passive: false },
);

function updateHover(clientX: number, clientY: number) {
  const i = cellAt(clientX, clientY);
  const next = i >= 0 && cells[i] ? i : -1;
  if (next !== hovered) {
    hovered = next;
    scheduleRender();
  }
  if (next < 0) return hideTooltip();

  const idx = indexOfCell(next);
  const value = readInit() + BigInt(idx);
  const cls = classOf(idx);
  tooltipValue.textContent = value.toLocaleString();
  tooltipSwatch.style.background = `var(${CLASS_VAR[cls]})`;
  const abs = value < 0n ? -value : value;
  tooltipTag.textContent =
    cls === CellClass.Square ? `Carré parfait (${isqrt(abs)}²)` : CLASS_LABEL[cls];
  tooltipPos.textContent = `Ligne ${Math.floor(next / cols) + 1} · colonne ${(next % cols) + 1} · #${(idx + 1).toLocaleString()}`;
  const residues = parseModuli(moduliInput.value).map((m) => {
    const r = Number(abs % BigInt(m));
    return `≡ ${r} (mod ${m})${squaresMod(m)[r] ? '' : ' ✗'}`;
  });
  tooltipMod.textContent = residues.length
    ? `${residues.join(' · ')}${isImpossible(idx) ? ' → pas un carré' : ''}`
    : '';
  tooltipMod.hidden = !residues.length;
  tooltip.hidden = false;

  const { width, height } = tooltip.getBoundingClientRect();
  const left = clientX + 16 + width > vw ? clientX - 16 - width : clientX + 16;
  const top = clientY + 16 + height > vh ? clientY - 16 - height : clientY + 16;
  tooltip.style.translate = `${Math.max(8, left)}px ${Math.max(8, top)}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
}

const isTyping = () => document.activeElement instanceof HTMLInputElement;

window.addEventListener('keydown', (e) => {
  if (isTyping() || e.metaKey || e.ctrlKey || e.altKey) return;
  switch (e.key) {
    case ' ':
      e.preventDefault();
      spaceHeld = true;
      canvas.dataset.mode = 'pan';
      break;
    case '+':
    case '=':
      zoomAt(vw / 2, vh / 2, 1.5);
      break;
    case '-':
      zoomAt(vw / 2, vh / 2, 1 / 1.5);
      break;
    case 'f':
    case '0':
      fitToCells();
      break;
    case 'd':
      setMode('draw');
      break;
    case 'h':
      setMode('pan');
      break;
    case 's':
      setMode('select');
      break;
    case 'Enter':
      if (selection) applySelection(1);
      break;
    case 'Delete':
    case 'Backspace':
      if (selection) applySelection(0);
      break;
    case 'Escape':
      clearSelection();
      break;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === ' ') {
    spaceHeld = false;
    canvas.dataset.mode = mode;
  }
});

/* ---------- Wiring ---------- */

$('reset').addEventListener('click', resetGrid);
$('pyramide').addEventListener('click', () =>
  generatePyramide(parseBigInt(nInput.value)),
);
$('carre').addEventListener('click', () => generateSquare(parseBigInt(nInput.value)));
$('fermat').addEventListener('click', generateFermat);
$('focusN').addEventListener('click', focusN);
$('fit').addEventListener('click', () => fitToCells());
$('zoomIn').addEventListener('click', () => zoomAt(vw / 2, vh / 2, 1.5));
$('zoomOut').addEventListener('click', () => zoomAt(vw / 2, vh / 2, 1 / 1.5));
modeDrawBtn.addEventListener('click', () => setMode('draw'));
modePanBtn.addEventListener('click', () => setMode('pan'));
modeSelectBtn.addEventListener('click', () => setMode('select'));
$('selAdd').addEventListener('click', () => applySelection(1));
$('selRemove').addEventListener('click', () => applySelection(0));
$('selClear').addEventListener('click', clearSelection);

$('decrement').addEventListener('click', () => {
  clearFermat();
  initInput.value = (readInit() - 1n).toString();
  classify();
});
$('increment').addEventListener('click', () => {
  clearFermat();
  initInput.value = (readInit() + 1n).toString();
  classify();
});

[nInput, initInput].forEach((input) => input.addEventListener('input', clearFermat));

[nInput, pInput, qInput, initInput, moduliInput].forEach((input) => {
  input.addEventListener('input', () => {
    focused = -1;
    classify();
    scheduleRender();
  });
});

moduliInput.addEventListener('input', renderFermatPanel);

window.addEventListener('resize', resizeCanvas);

/* Initialization */
setMode('draw');
resizeCanvas();
generatePyramide(BigInt(DEFAULT_PYRAMIDE));
