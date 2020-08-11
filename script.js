"use strict";
//Creation de la Grille
const div = document.createElement("div");
div.className = "box";

for(let i=0;i<1350;i++) container.appendChild(div.cloneNode(true));

const boxs  = document.querySelectorAll(".box");
let state;

//Fonction de gestion des boxs
function handlerBox(box)
{
    box.className = (state == "box")? "ball":"box";
    //box.className = (box.className == "box")? "ball" : "box";
    const balls = document.querySelectorAll(".ball");
    compteur.textContent = balls.length;
    let count = 1;

    for (let ball of balls)
    {
        ball.textContent = count;
        count++;
    }
}

//Gestion du clic
for (let box of boxs) box.onclick = () => handlerBox(box);

//Gestion de l'event mousemove + mousedown
let down = false;
document.onmousedown = (e) => {down = true; state = e.target.className;}; 
//save state of first box

document.onmouseup   = () => down = false;

for(let box of boxs) box.onmousemove = () => {if(down) handlerBox(box)};
//Bouton Reset de la grille
reset.onclick = () => 
{
    const balls = document.querySelectorAll(".ball");
    compteur.textContent = 0;
    for(let ball of balls) ball.className = "box";
};



//*************Service Worker ******************/
//Register service worker to control making site work offline
if('serviceWorker' in navigator)
{
	navigator.serviceWorker
			 .register('/squaregrid/sw.js', {scope: '/squaregrid/'})
			 .then(function() { console.log('Service Worker for squaregrid Registered'); });
}