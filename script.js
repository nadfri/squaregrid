'use strict';

/*Récupération des éléments du DOM*/
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const counter = document.getElementById('counter');
const initInput = document.getElementById('init');
const nInput = document.getElementById('n');
const pInput = document.getElementById('p');
const qInput = document.getElementById('q');
const pqDisplay = document.getElementById('pq');
const decrementBtn = document.getElementById('decrement');
const incrementBtn = document.getElementById('increment');
const resetBtn = document.getElementById('reset');
const pyramideBtn = document.getElementById('pyramide');

/* Dimensions de la grille et des cellules */
const COLS = 150;
const ROWS = 80;
const CELL_SIZE = 20;
canvas.width = COLS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;
const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
const primesSet = new Set(primes);

/* Fonction pour déterminer la couleur d'une cellule */
function getCellColor(count, n, p, q, pq) {
  if (count === n) return 'gold';
  if ([p, q, pq].includes(count)) return 'purple';
  if (primesSet.has(Math.abs(count))) return 'blue';
  if (Number.isInteger(Math.sqrt(Math.abs(count)))) return 'green';
  return '#9e9e9e';
}

/* Fonction pour dessiner la grille */
function drawGrid() {
  ctx.strokeStyle = '#ddd';

  // Lignes horizontales
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(COLS * CELL_SIZE, y * CELL_SIZE);
    ctx.stroke();
  }

  // Lignes verticales
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, ROWS * CELL_SIZE);
    ctx.stroke();
  }
}

/* Fonction pour mettre à jour et dessiner la grille */
function updateGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  const n = parseInt(nInput.value) || null;
  const p = parseInt(pInput.value) || null;
  const q = parseInt(qInput.value) || null;
  const pq = p * q || null;
  const filledCount = grid.flat().filter((value) => value === 1).length;

  counter.textContent = filledCount;
  pqDisplay.textContent = pq || '';

  let count = parseInt(initInput.value) || 1;

  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 1) {
        const posX = x * CELL_SIZE;
        const posY = y * CELL_SIZE;
        const color = getCellColor(count, n, p, q, pq);

        // Dessiner la cellule
        ctx.fillStyle = color;
        ctx.fillRect(posX, posY, CELL_SIZE, CELL_SIZE);

        // Texte dans la cellule
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

/* Fonction pour réinitialiser la grille */
function resetGrid() {
  grid.forEach((row) => row.fill(0));
  counter.textContent = 0;
  initInput.value = 1;
  nInput.value = '';
  pInput.value = '';
  qInput.value = '';
  pqDisplay.textContent = '';
  updateGrid();
}

/* Fonction pour centrer le canvas */
function centerCanvas() {
  const offsetX = (canvas.width - window.innerWidth) / 2;
  window.scrollTo({ top: 0, left: offsetX, behavior: 'smooth' });
}

/* Fonction pour générer une pyramide de nombres */
function generatePyramide() {
  resetGrid();
  const n = Math.min(parseInt(nInput.value) || 100, 5000);
  let currentRow = 2; // Index 2 (3ème ligne)
  let currentCol = Math.floor(COLS / 2);
  let elementsInRow = 1;
  let totalElements = 0;

  while (totalElements < n && currentRow < ROWS) {
    const startCol = currentCol - Math.floor(elementsInRow / 2);
    for (let i = 0; i < elementsInRow; i++) {
      const x = startCol + i;
      if (x >= 0 && x < COLS) {
        grid[currentRow][x] = 1;
        totalElements++;
        if (totalElements >= n) break;
      }
    }
    currentRow++;
    elementsInRow += 2;
  }

  updateGrid();
  centerCanvas();
}

/* Fonction pour obtenir la position de la souris dans la grille */
function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((evt.clientX - rect.left) / CELL_SIZE);
  const y = Math.floor((evt.clientY - rect.top) / CELL_SIZE);
  return { x, y };
}

/* Gestion des événements de souris */
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

/* Initialisation */
drawGrid();
