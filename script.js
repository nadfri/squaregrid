'use strict';

// Récupération des éléments du DOM
const canvasElement = document.getElementById('canvas');
const context = canvasElement.getContext('2d');
const counterElement = document.getElementById('counter');
const initInputElement = document.getElementById('init');
const nInputElement = document.getElementById('n');
const pInputElement = document.getElementById('p');
const qInputElement = document.getElementById('q');
const pqDisplayElement = document.getElementById('pq');
const decrementButton = document.getElementById('decrement');
const incrementButton = document.getElementById('increment');
const resetButton = document.getElementById('reset');
const pyramideButton = document.getElementById('pyramide');

/* Dimensions de la grille et des cellules*/
const columns = 150;
const rows = 80;
const cellSize = 20;
canvasElement.width = columns * cellSize;
canvasElement.height = rows * cellSize;

// Création de la grille (tableau 2D)
const grid = Array.from({ length: rows }, () => Array(columns).fill(0));

// Variables pour l'interaction
let isMouseDown = false;
let cellState = 0;
const primesSet = new Set(primes);

// Fonction pour dessiner la grille
function drawGrid() {
  context.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Initialisation des variables
  const nValue = parseInt(nInputElement.value) || null;
  const pValue = parseInt(pInputElement.value) || null;
  const qValue = parseInt(qInputElement.value) || null;
  const pqValue = pValue * qValue;
  pqDisplayElement.textContent = pqValue || '';

  const countElements = grid.flat().filter((value) => value === 1).length;
  counterElement.textContent = countElements;

  let count = parseInt(initInputElement.value) ?? 1;

  // Dessiner le quadrillage
  context.strokeStyle = '#ddd';
  for (let y = 0; y <= rows; y++) {
    context.beginPath();
    context.moveTo(0, y * cellSize);
    context.lineTo(columns * cellSize, y * cellSize);
    context.stroke();
  }
  for (let x = 0; x <= columns; x++) {
    context.beginPath();
    context.moveTo(x * cellSize, 0);
    context.lineTo(x * cellSize, rows * cellSize);
    context.stroke();
  }

  // Parcourir la grille pour dessiner les cellules remplies
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      if (grid[y][x] === 1) {
        const posX = x * cellSize;
        const posY = y * cellSize;

        // Déterminer la couleur de la cellule
        let fillColor = '#9e9e9e'; // Couleur par défaut
        if (count === nValue) {
          fillColor = 'gold';
        } else if (count === pValue || count === qValue || count === pqValue) {
          fillColor = 'purple';
        } else if (primesSet.has(Math.abs(count))) {
          fillColor = 'blue';
        } else if (Math.sqrt(Math.abs(count)) % 1 === 0) {
          fillColor = 'green';
        }

        // Dessiner la cellule
        context.fillStyle = fillColor;
        context.fillRect(posX, posY, cellSize, cellSize);

        // Adapter la taille de la police pour qu'elle tienne dans la case
        const fontSize = Math.min(
          cellSize / 2,
          cellSize / (count.toString().length * 0.6)
        );
        context.font = `${fontSize}px Roboto`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Afficher le numéro
        context.fillStyle = fillColor === 'gold' ? 'black' : 'white';
        context.fillText(count, posX + cellSize / 2, posY + cellSize / 2);

        // Incrémenter le compteur après chaque cellule remplie
        count++;
      }
    }
  }
}

// Fonction pour basculer l'état d'une cellule
function toggleCell(x, y) {
  grid[y][x] = cellState === 0 ? 1 : 0;
  drawGrid();
}

// Obtenir la position de la souris dans la grille
function getMousePos(evt) {
  const rect = canvasElement.getBoundingClientRect();
  const x = Math.floor((evt.clientX - rect.left) / cellSize);
  const y = Math.floor((evt.clientY - rect.top) / cellSize);
  return { x, y };
}

/*Réinitialiser la grille*/
function reset() {
  grid.forEach((row) => row.fill(0)); // Réinitialiser toutes les cellules à 0
  counterElement.textContent = 0;
  initInputElement.value = 1;
  nInputElement.value = '';
  pInputElement.value = '';
  qInputElement.value = '';

  drawGrid();
}

function centerCanvas() {
  const offsetX = (canvasElement.width - window.innerWidth) / 2;
  // const offsetY = (canvasElement.height - window.innerHeight) / 2;
  window.scrollTo({
    top: 0,
    left: offsetX,
    behavior: 'smooth',
  });
}

/*Generer une pyramide de nombres*/
function generatePyramide() {
  // Réinitialiser la grille
  grid.forEach((row) => row.fill(0));

  const n = Math.min(parseInt(nInputElement.value) || 100, 5000);

  let currentRow = 2; // La 3ème ligne (index 2)
  let currentCol = Math.floor(columns / 2); // Milieu de la rangée
  let elementsInRow = 1;
  let totalElements = 0;

  while (totalElements < n) {
    let startCol = currentCol - Math.floor(elementsInRow / 2);
    for (let i = 0; i < elementsInRow; i++) {
      if (startCol + i >= 0 && startCol + i < columns) {
        grid[currentRow][startCol + i] = 1;
      }
    }
    totalElements += elementsInRow;
    currentRow++;
    elementsInRow += 2;
  }

  drawGrid();
  centerCanvas();
}

/* Gestion des événements*/
canvasElement.addEventListener('mousedown', function (e) {
  isMouseDown = true;
  const { x, y } = getMousePos(e);
  cellState = grid[y][x];
  toggleCell(x, y);
});

canvasElement.addEventListener('mousemove', function (e) {
  if (isMouseDown) {
    const { x, y } = getMousePos(e);
    toggleCell(x, y);
  }
});

canvasElement.addEventListener('mouseup', function () {
  isMouseDown = false;
});

pInputElement.addEventListener('input', drawGrid);
qInputElement.addEventListener('input', drawGrid);
nInputElement.addEventListener('input', drawGrid);
initInputElement.addEventListener('input', drawGrid);

window.addEventListener('load', centerCanvas);

decrementButton.onclick = () => {
  initInputElement.value = parseInt(initInputElement.value) - 1;
  drawGrid();
};

incrementButton.onclick = () => {
  initInputElement.value = parseInt(initInputElement.value) + 1;
  drawGrid();
};

pyramideButton.onclick = generatePyramide;
resetButton.onclick = reset;

// Initialisation
drawGrid();
