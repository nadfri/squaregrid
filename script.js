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

// Dimensions de la grille et des cellules
const columns = 150;
const rows = 80;
const cellSize = 20;

// Ajuster la taille du canvas
canvasElement.width = columns * cellSize;
canvasElement.height = rows * cellSize;

// Création de la grille (tableau 2D)
let grid = [];
for (let y = 0; y < rows; y++) {
  grid[y] = [];
  for (let x = 0; x < columns; x++) {
    grid[y][x] = 0; // 0: vide, 1: rempli
  }
}

// Variables pour l'interaction
let isMouseDown = false;
let cellState = 0;

// Variables pour les calculs
let startCount = parseInt(initInputElement.value) || 1;
let nValue = parseInt(nInputElement.value) || null;
let pValue = parseInt(pInputElement.value) || null;
let qValue = parseInt(qInputElement.value) || null;
let pqValue = null;

// Chargement des nombres premiers
const primesSet = new Set(primes); // primes doit être défini dans primes.js

// Fonction pour dessiner la grille
function drawGrid() {
  context.clearRect(0, 0, canvasElement.width, canvasElement.height);

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
        const count = getCount(x, y);
        const posX = x * cellSize;
        const posY = y * cellSize;

        // Déterminer la couleur de la cellule
        let fillColor = '#9e9e9e'; // Couleur par défaut
        if (count === nValue) {
          fillColor = 'gold';
        } else if (count === pqValue) {
          fillColor = 'purple';
        } else if (count === pValue || count === qValue) {
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
        const fontSize = Math.min(cellSize / 2, cellSize / (count.toString().length * 0.6));
        context.font = `${fontSize}px Roboto`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Afficher le numéro
        context.fillStyle = fillColor === 'gold' ? 'black' : 'white';
        context.fillText(count, posX + cellSize / 2, posY + cellSize / 2);
      }
    }
  }
}

// Fonction pour obtenir le numéro de la cellule
function getCount(x, y) {
  let count = startCount;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < columns; cx++) {
      if (grid[cy][cx] === 1) {
        if (cy < y || (cy === y && cx <= x)) {
          if (cy !== y || cx !== x) {
            count++;
          } else {
            return count;
          }
        }
      }
    }
  }
  return count;
}

// Gestion des événements de souris
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

// Fonction pour basculer l'état d'une cellule
function toggleCell(x, y) {
  grid[y][x] = cellState === 0 ? 1 : 0;
  updateDisplay();
}

// Obtenir la position de la souris dans la grille
function getMousePos(evt) {
  const rect = canvasElement.getBoundingClientRect();
  const x = Math.floor((evt.clientX - rect.left) / cellSize);
  const y = Math.floor((evt.clientY - rect.top) / cellSize);
  return { x, y };
}

// Mettre à jour l'affichage (compteur, etc.)
function updateDisplay() {
  // Mise à jour du compteur
  const count = grid.flat().filter((value) => value === 1).length;
  counterElement.textContent = count;
  drawGrid();
}

// Gestion des boutons et des entrées
initInputElement.addEventListener('input', () => {
  startCount = parseInt(initInputElement.value) || 1;
  updateDisplay();
});

nInputElement.addEventListener('input', () => {
  nValue = parseInt(nInputElement.value) || null;
  updateDisplay();
});

decrementButton.onclick = () => {
  initInputElement.value = parseInt(initInputElement.value) - 1;
  startCount = parseInt(initInputElement.value) || 1;
  updateDisplay();
};

incrementButton.onclick = () => {
  initInputElement.value = parseInt(initInputElement.value) + 1;
  startCount = parseInt(initInputElement.value) || 1;
  updateDisplay();
};

resetButton.onclick = () => {
  grid = grid.map((row) => row.map(() => 0));
  counterElement.textContent = 0;
  initInputElement.value = 1;
  startCount = 1;
  updateDisplay();
};

pInputElement.addEventListener('input', () => {
  pValue = parseInt(pInputElement.value) || null;
  updatePQ();
  updateDisplay();
});

qInputElement.addEventListener('input', () => {
  qValue = parseInt(qInputElement.value) || null;
  updatePQ();
  updateDisplay();
});

function updatePQ() {
  if (pValue && qValue) {
    pqValue = pValue * qValue;
    pqDisplayElement.textContent = pqValue;
  } else {
    pqValue = null;
    pqDisplayElement.textContent = '';
  }
}

// Initialisation
updatePQ();
updateDisplay();

function centerCanvas() {
  const offsetX = (canvasElement.width - window.innerWidth) / 2;
  // const offsetY = (canvasElement.height - window.innerHeight) / 2;
  window.scrollTo({
    top: 0,
    left: offsetX,
    behavior: 'smooth',
  });
}

// Attendre le chargement complet
window.addEventListener('load', centerCanvas);

// S'assurer que le canvas reste centré
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(centerCanvas, 100); // Petit délai pour s'assurer que tout est chargé
});

function generatePyramide() {
  // Réinitialiser la grille
  grid = grid.map((row) => row.map(() => 0));

  const n = Math.min(parseInt(nInputElement.value) || 100,5000);

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

  updateDisplay();
  centerCanvas();
}

pyramideButton.onclick = generatePyramide;

