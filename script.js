"use strict";
//Creation de la Grille
const div = document.createElement("div");
div.className = "box";

const boxs = [];
for (let i = 0; i < 5000; i++) {
  const newBox = div.cloneNode(true);
  container.appendChild(newBox);
  boxs.push(newBox);
}
let state;

//scroll to center of page
setTimeout(
  () =>
    window.scrollTo({
      left: 800,
    }),
  200
);

//Fonction de gestion des boxs
function handlerBox(box) {
  box.className = state == 'box' ? 'ball' : 'box';
  updateDisplay();
}

const updateDisplay = () => {
  const balls = boxs.filter((box) => box.className.includes('ball'));
  compteur.textContent = balls.length;
  let count = init.value || 1;

  for (let ball of balls) {
    ball.textContent = count;
    if (count == nb_p.value) ball.className = 'ball nxq';
    else if (count == nb_q.value) ball.className = 'ball nxq';
    else if (count == pq.textContent) ball.className = 'ball nxq';
    else if (count == n.value && n.value !== '') ball.className = 'ball n';
    else if (primes.includes(Math.abs(count))) ball.className = 'ball prime';
    else if (Math.abs(count) ** 0.5 % 1 == 0) ball.className = 'ball square';
    else ball.className = 'ball';

    count++;
    count == 0 && count++;
  }
};

//Gestion du clic
for (let box of boxs) box.onclick = () => handlerBox(box);
//Gestion du init
init.oninput = updateDisplay;
n.oninput = updateDisplay;
moins.onclick = () => {
  init.value--;
  init.value == 0 && init.value--;
  updateDisplay();
};
plus.onclick = () => {
  init.value++;
  init.value == 0 && init.value++;
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
  compteur.textContent = 0;
  init.value = 1;
  for (let box of boxs) box.className = 'box';
};

//Gestion p*q
const multiplication = (p, q) => {
  pq.textContent = (+p || 1) * (+q || 1);
  updateDisplay();
};

nb_p.oninput = () => multiplication(nb_p.value, nb_q.value);
nb_q.oninput = () => multiplication(nb_p.value, nb_q.value);
