"use strict";
//Creation de la Grille
const div = document.createElement("div");
div.className = "box";
for(let i=0;i<1250;i++) container.appendChild(div.cloneNode(true));
const boxs  = document.querySelectorAll(".box");

//Gestion du clic
function handlerBox(box)
{
    box.className = (box.className == "box")? "ball" : "box";
    
    const balls = document.querySelectorAll(".ball");
    compteur.textContent = balls.length;
    let count = 1;
    for (let ball of balls)
    {
        ball.textContent = count;
        count++;
    }
}

//Ajout des events click sur toute les div "box"
for (let box of boxs) box.onmousedown = () => handlerBox(box);

//Gestion de l'event mouse enter + mousedown
let down = false;
document.onmousedown = () => down = true;
document.onmouseup   = () => down = false;
for(let box of boxs) box.onmouseenter = () => {if(down) handlerBox(box)};
    
//Bouton Reset de la grille
reset.onclick = () => {
    const balls = document.querySelectorAll(".ball");
    compteur.textContent = 0;

    for(let ball of balls)
    {
        ball.className = "box";
    }
};



//*************Service Worker ******************/
//Register service worker to control making site work offline
if('serviceWorker' in navigator)
{
	navigator.serviceWorker
			 .register('/squaregrid/sw.js', {scope: '/squaregrid/'})
			 .then(function() { console.log('Service Worker for squaregrid Registered'); });
}