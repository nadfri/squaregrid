'use strict';

/* DOM elements */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const counter = document.getElementById('counter');
const rowCounter = document.getElementById('rowCounter'); // Nouvel élément
const initInput = document.getElementById('init');
const nInput = document.getElementById('n');
const pInput = document.getElementById('p');
const qInput = document.getElementById('q');
const pqDisplay = document.getElementById('pq');
const decrementBtn = document.getElementById('decrement');
const incrementBtn = document.getElementById('increment');
const resetBtn = document.getElementById('reset');
const pyramideBtn = document.getElementById('pyramide');

/* Grid and cell dimensions */
const COLS = 150;
const ROWS = 80;
const CELL_SIZE = 20;
canvas.width = COLS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;
const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
const primesSet = new Set(primes);

/* Draw the grid */
function drawGrid() {
  ctx.strokeStyle = '#ddd';

  // Horizontal lines
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(COLS * CELL_SIZE, y * CELL_SIZE);
    ctx.stroke();
  }

  // Vertical lines
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, ROWS * CELL_SIZE);
    ctx.stroke();
  }
}

/* Number of occupied rows */
function countOccupiedRows() {
  return grid.reduce((count, row) => {
    return count + (row.some((cell) => cell === 1) ? 1 : 0);
  }, 0);
}

/* Update the grid */
function updateGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  const n = parseInt(nInput.value) || null;
  const p = parseInt(pInput.value) || null;
  const q = parseInt(qInput.value) || null;
  const pq = p * q || null;

  rowCounter.textContent = countOccupiedRows();

  pqDisplay.textContent = pq || '';

  let count = parseInt(initInput.value) || 1;

  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 1) {
        const posX = x * CELL_SIZE;
        const posY = y * CELL_SIZE;
        const color = getCellColor(count, n, p, q, pq);

        // Draw the cell
        ctx.fillStyle = color;
        ctx.fillRect(posX, posY, CELL_SIZE, CELL_SIZE);

        // Text in the cell
        const fontSize = Math.min(
          CELL_SIZE / 2,
          CELL_SIZE / (count.toString().length * 0.6)
        );
        ctx.font = `${fontSize}px Roboto`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color === 'gold' ? 'black' : 'white';
        ctx.fillText(count, posX + CELL_SIZE / 2, posY + CELL_SIZE / 2);

        count++;
      }
    });
  });
}

/* Determine the color of a cell */
function getCellColor(count, n, p, q, pq) {
  if (count === n) return 'gold';
  if ([p, q, pq].includes(count)) return 'purple';
  if (primesSet.has(Math.abs(count))) return 'blue';
  if (Number.isInteger(Math.sqrt(Math.abs(count)))) return 'green';
  return '#9e9e9e';
}

/* Reset the grid */
function resetGrid() {
  grid.forEach((row) => row.fill(0));
  initInput.value = 1;
  nInput.value = '';
  pInput.value = '';
  qInput.value = '';
  pqDisplay.textContent = '';
  updateGrid();
}

/* Center the canvas */
function centerCanvas() {
  const offsetX = (canvas.width - window.innerWidth) / 2;
  window.scrollTo({ top: 0, left: offsetX, behavior: 'smooth' });
}

/* Generate a pyramid of numbers */
function generatePyramide() {
  grid.forEach((row) => row.fill(0)); // Reset

  const n = Math.min(parseInt(nInput.value) || 100, 5000);
  let currentRow = 2; // Index 2 (3rd row)
  let currentCol = Math.floor(COLS / 2); // Middle column
  let elementsInRow = 1;
  let totalElements = 0;

  while (totalElements < n) {
    let startCol = currentCol - Math.floor(elementsInRow / 2);
    for (let i = 0; i < elementsInRow; i++) {
      if (startCol + i >= 0 && startCol + i < COLS) {
        grid[currentRow][startCol + i] = 1;
      }
    }
    totalElements += elementsInRow;
    currentRow++;
    elementsInRow += 2;
  }

  updateGrid();
  centerCanvas();
}

/* Get the mouse position in the grid */
function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((evt.clientX - rect.left) / CELL_SIZE);
  const y = Math.floor((evt.clientY - rect.top) / CELL_SIZE);
  return { x, y };
}

/* Mouse event handlers */
let isDrawing = false;
let cellState = 0;

canvas.addEventListener('mousedown', handleMouseEvent);
canvas.addEventListener('mousemove', handleMouseEvent);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

function handleMouseEvent(e) {
  const { x, y } = getMousePos(e);

  if (e.type === 'mousedown') {
    isDrawing = true;
    cellState = grid[y][x];
  }

  if (isDrawing) {
    grid[y][x] = cellState === 0 ? 1 : 0;
    updateGrid();
  }
}

function stopDrawing() {
  isDrawing = false;
}

resetBtn.addEventListener('click', resetGrid);

pyramideBtn.addEventListener('click', generatePyramide);

decrementBtn.addEventListener('click', () => {
  initInput.value = parseInt(initInput.value) - 1;
  updateGrid();
});

incrementBtn.addEventListener('click', () => {
  initInput.value = parseInt(initInput.value) + 1;
  updateGrid();
});

[nInput, pInput, qInput, initInput].forEach((input) => {
  input.addEventListener('input', updateGrid);
});

window.addEventListener('load', centerCanvas);

/* Initialization */
drawGrid();
