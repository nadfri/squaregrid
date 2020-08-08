
"use strict";

const div = document.createElement("div");
div.className = "box";

for(let i=0;i<1250;i++) 
container.appendChild(div.cloneNode(true));


let boxs  = document.querySelectorAll(".box");

for (let box of boxs)
box.onmousedown = () =>
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


let down = false;
document.onmousedown = () => down = true;
document.onmouseup   = () => down = false;
document.onmousemove = () => {
    for(let box of boxs)
    {
        box.onmouseenter = () =>
        {
            if(down)
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
        }
    }
};


reset.onclick = () => {
    const balls = document.querySelectorAll(".ball");
    compteur.textContent = 0;

    for(let ball of balls)
    {
        ball.className = "box";
    }

}





//*************Service Worker ******************/
//Register service worker to control making site work offline
if('serviceWorker' in navigator)
{
	navigator.serviceWorker
			 .register('/squaregrid/sw.js', {scope: '/squaregrid/'})
			 .then(function() { console.log('Service Worker for squaregrid Registered'); });
}