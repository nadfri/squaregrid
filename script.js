
"use strict";

const div = document.createElement("div");
div.className = "box";

for(let i=0;i<1250;i++) 
container.appendChild(div.cloneNode(true));


let boxs  = document.querySelectorAll(".box");


for (let box of boxs)
box.onclick = () =>
{
    box.className = (box.className == "box")? "ball" : "box";
    
    let balls = document.querySelectorAll(".ball");
    compteur.textContent = balls.length;
    let count = 1;
    for (let ball of balls)
    {
        ball.textContent = count;
        count++;
    }
}





/*** */
