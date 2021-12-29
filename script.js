"use strict";
//Creation de la Grille
const div = document.createElement("div");
div.className = "box";

for (let i = 0; i < 2280; i++) container.appendChild(div.cloneNode(true));

const boxs = document.querySelectorAll(".box");
let state;

//Fonction de gestion des boxs
function handlerBox(box) {
  box.className = state == "box" ? "ball" : "box";
  updateDisplay();
}

const updateDisplay = () => {
  const balls = document.querySelectorAll(".ball");
  compteur.textContent = balls.length;
  let count = init.value || 1;

  for (let ball of balls) {
    ball.textContent = count;
    if (primes.includes(Math.abs(count))) ball.classList.add("prime");
    else ball.classList.remove("prime");
    count++;
  }
};

//Gestion du clic
for (let box of boxs) box.onclick = () => handlerBox(box);
//Gestion du init
init.oninput = updateDisplay;
moins.onclick = () => {
  init.value--;
  updateDisplay();
};
plus.onclick = () => {
  init.value++;
  updateDisplay();
};

//Gestion de l'event mousemove + mousedown
let down = false;
document.onmousedown = (e) => {
  down = true;
  state = e.target.className;
};
//save state of first box

document.onmouseup = () => (down = false);

for (let box of boxs)
  box.onmousemove = () => {
    if (down) handlerBox(box);
  };
//Bouton Reset de la grille
reset.onclick = () => {
  const balls = document.querySelectorAll(".ball");
  compteur.textContent = 0;
  for (let ball of balls) ball.className = "box";
};
