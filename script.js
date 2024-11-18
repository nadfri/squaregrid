'use strict';

// Récupération des éléments du DOM
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const compteur = document.getElementById('compteur');
const initInput = document.getElementById('init');
const nInput = document.getElementById('n');
const nbPInput = document.getElementById('nb_p');
const nbQInput = document.getElementById('nb_q');
const pqElement = document.getElementById('pq');
const moins = document.getElementById('moins');
const plus = document.getElementById('plus');
const resetBtn = document.getElementById('reset');

// Dimensions de la grille et des cellules
const cols = 100;
const rows = 100;
const cellSize = 20;

// Ajuster la taille du canvas
canvas.width = cols * cellSize;
canvas.height = rows * cellSize;

// Création de la grille (tableau 2D)
let grid = [];
for (let y = 0; y < rows; y++) {
  grid[y] = [];
  for (let x = 0; x < cols; x++) {
    grid[y][x] = 0; // 0: vide, 1: rempli
  }
}

// Variables pour l'interaction
let isMouseDown = false;
let state = 0;

// Variables pour les calculs
let startCount = parseInt(initInput.value) || 1;
let nValue = parseInt(nInput.value) || null;
let nbPValue = parseInt(nbPInput.value) || null;
let nbQValue = parseInt(nbQInput.value) || null;
let pqValue = null;

// Chargement des nombres premiers
const primesSet = new Set(primes); // primes doit être défini dans primes.js

// Fonction pour dessiner la grille
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${cellSize / 2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Dessiner le quadrillage
  ctx.strokeStyle = '#ddd';
  for (let y = 0; y <= rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(cols * cellSize, y * cellSize);
    ctx.stroke();
  }
  for (let x = 0; x <= cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, rows * cellSize);
    ctx.stroke();
  }

  // Parcourir la grille pour dessiner les cellules remplies
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
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
        } else if (count === nbPValue || count === nbQValue) {
          fillColor = 'purple';
        } else if (primesSet.has(Math.abs(count))) {
          fillColor = 'blue';
        } else if (Math.sqrt(Math.abs(count)) % 1 === 0) {
          fillColor = 'green';
        }

        // Dessiner la cellule
        ctx.fillStyle = fillColor;
        ctx.fillRect(posX, posY, cellSize, cellSize);

        // Afficher le numéro
        ctx.fillStyle = fillColor === 'gold' ? 'black' : 'white';
        ctx.fillText(count, posX + cellSize / 2, posY + cellSize / 2);
      }
    }
  }
}

// Fonction pour obtenir le numéro de la cellule
function getCount(x, y) {
  let count = startCount;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
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
canvas.addEventListener('mousedown', function (e) {
  isMouseDown = true;
  const { x, y } = getMousePos(e);
  state = grid[y][x];
  toggleCell(x, y);
});

canvas.addEventListener('mousemove', function (e) {
  if (isMouseDown) {
    const { x, y } = getMousePos(e);
    toggleCell(x, y);
  }
});

canvas.addEventListener('mouseup', function () {
  isMouseDown = false;
});

// Fonction pour basculer l'état d'une cellule
function toggleCell(x, y) {
  grid[y][x] = state === 0 ? 1 : 0;
  updateDisplay();
}

// Obtenir la position de la souris dans la grille
function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((evt.clientX - rect.left) / cellSize);
  const y = Math.floor((evt.clientY - rect.top) / cellSize);
  return { x, y };
}

// Mettre à jour l'affichage (compteur, etc.)
function updateDisplay() {
  // Mise à jour du compteur
  const count = grid.flat().filter((value) => value === 1).length;
  compteur.textContent = count;
  drawGrid();
}

// Gestion des boutons et des entrées
initInput.addEventListener('input', () => {
  startCount = parseInt(initInput.value) || 1;
  updateDisplay();
});

nInput.addEventListener('input', () => {
  nValue = parseInt(nInput.value) || null;
  updateDisplay();
});

moins.onclick = () => {
  initInput.value = parseInt(initInput.value) - 1;
  startCount = parseInt(initInput.value) || 1;
  updateDisplay();
};

plus.onclick = () => {
  initInput.value = parseInt(initInput.value) + 1;
  startCount = parseInt(initInput.value) || 1;
  updateDisplay();
};

resetBtn.onclick = () => {
  grid = grid.map((row) => row.map(() => 0));
  compteur.textContent = 0;
  initInput.value = 1;
  startCount = 1;
  updateDisplay();
};

nbPInput.addEventListener('input', () => {
  nbPValue = parseInt(nbPInput.value) || null;
  updatePQ();
  updateDisplay();
});

nbQInput.addEventListener('input', () => {
  nbQValue = parseInt(nbQInput.value) || null;
  updatePQ();
  updateDisplay();
});

function updatePQ() {
  if (nbPValue && nbQValue) {
    pqValue = nbPValue * nbQValue;
    pqElement.textContent = pqValue;
  } else {
    pqValue = null;
    pqElement.textContent = '';
  }
}

// Initialisation
updatePQ();
updateDisplay();

function centerCanvas() {
  const offsetX = (canvas.width - window.innerWidth) / 2;
  const offsetY = (canvas.height - window.innerHeight) / 2;
  window.scrollTo({
    top: offsetY,
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
