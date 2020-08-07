
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


let down = false;
document.onmousedown = () => down = true;
document.onmouseup   = () => down = false;
document.onmousemove = () => {
    for(let box of boxs)
    {
        box.onmousemove = () =>
        {
            if(down)
            {
                box.classList.add("ball");
                let balls = document.querySelectorAll(".ball");
                compteur.textContent = balls.length;
        
                let count = 1;
                for (let ball of balls)
                {
                    ball.textContent = count;
                    count++;
                }
            }
        }
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