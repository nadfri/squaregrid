"use strict";
//Creation de la Grille
const div = document.createElement("div");
div.className = "box";

for (let i = 0; i < 5000; i++) container.appendChild(div.cloneNode(true));

const boxs = document.querySelectorAll(".box");
let state;

//scroll to center of page
setTimeout(()=>window.scrollTo({
  left:750,
}),200);

//Fonction de gestion des boxs
function handlerBox(box) {
  box.className = state == "box" ? "ball" : "box";
  updateDisplay();

}

const updateDisplay = () => {
  const balls = document.querySelectorAll(".ball");
  compteur.textContent = balls.length;
  let count = init.valueAsNumber || 1;

  for (let ball of balls) {
    ball.textContent = count;
    if (primes.includes(Math.abs(count))) ball.className="ball prime";
    else if((Math.abs(count)**0.5)%1==0) ball.className="ball square";
    else ball.className = "ball";
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

//Delete SW
navigator.serviceWorker.getRegistrations().then( function(registrations) { for(let registration of registrations) { registration.unregister(); } }); 

//Fonction de calcul des nombres premiers
