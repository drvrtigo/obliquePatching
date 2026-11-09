"use strict";
const $=id=>document.getElementById(id);
const card=$("card"),inner=card.querySelector(".inner");
let cards=[],bag=[],current=-1,flipped=false,loading=false;
function validateDeck(data){
 if(!Array.isArray(data)||!data.length)throw new Error("strategies.json must contain a nonempty array.");
 const ids=new Set();
 for(let i=0;i<data.length;i++){
  const c=data[i];
  if(!c||typeof c.id!=="string"||!c.id.trim()||typeof c.prompt!=="string"||!c.prompt.trim()||typeof c.detail!=="string"||!c.detail.trim())throw new Error(`Card ${i+1} needs nonempty id, prompt, and detail strings.`);
  if(ids.has(c.id))throw new Error(`Duplicate card ID: ${c.id}`);ids.add(c.id);
 }
 return data;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function fitCard(){
 if(!cards.length)return;
 card.style.removeProperty("height");
 const required=[...card.querySelectorAll(".face")].map(face=>{
  const style=getComputedStyle(face);
  return [...face.children].reduce((sum,child)=>{const s=getComputedStyle(child);return sum+child.getBoundingClientRect().height+parseFloat(s.marginTop)+parseFloat(s.marginBottom)},0)+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)+24;
 });
 card.style.height=Math.ceil(Math.max(card.getBoundingClientRect().height,...required))+"px";
}
function describe(){
 const c=cards[current];card.setAttribute("aria-pressed",String(flipped));
 card.setAttribute("aria-label",flipped?`${c.detail} Flip to prompt.`:`${c.prompt} Flip for detail.`);
 $("front").setAttribute("aria-hidden",String(flipped));$("back").setAttribute("aria-hidden",String(!flipped));
 $("announcement").textContent=flipped?c.detail:c.prompt;
}
function draw(){
 if(!cards.length)return;
 if(!bag.length){bag=shuffle(cards.map((_,i)=>i));if(bag.length>1&&bag[bag.length-1]===current)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]]}
 current=bag.pop();flipped=false;inner.style.transition="none";card.classList.remove("flipped");
 $("prompt").textContent=cards[current].prompt;$("detail").textContent=cards[current].detail;
 document.querySelectorAll(".number").forEach(el=>el.textContent=`${String(current+1).padStart(3,"0")} / ${cards.length}`);
 fitCard();void inner.offsetHeight;inner.style.transition="";describe();
}
async function loadDeck(){
 if(loading)return;loading=true;$("next").disabled=true;$("error").hidden=true;
 try{
  const response=await fetch("./strategies.json",{cache:"no-store"});
  if(!response.ok)throw new Error(`Could not load strategies.json (HTTP ${response.status}).`);
  cards=validateDeck(await response.json());bag=[];current=-1;card.disabled=false;$("next").textContent="New card ↗";draw();
 }catch(error){
  card.disabled=true;$("prompt").textContent="The deck could not load.";$("next").textContent="Try again";
  $("error").hidden=false;$("error").textContent=location.protocol==="file:"?"Open the hosted GitHub Pages address, not the downloaded HTML. For local testing, use the server instructions in README.md.":`${error.message} Check the JSON file and your connection, then try again.`;
 }finally{loading=false;$("next").disabled=false}
}
card.addEventListener("click",()=>{if(!cards.length)return;flipped=!flipped;card.classList.toggle("flipped",flipped);describe()});
$("next").addEventListener("click",()=>cards.length?draw():loadDeck());
document.addEventListener("keydown",e=>{if(e.code==="Space"&&!e.target.closest("button,input,textarea,select")&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();if(!e.repeat&&cards.length)draw()}});
let resizeTimer;window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fitCard,100)});
if(document.fonts)document.fonts.ready.then(fitCard);
loadDeck();
if("serviceWorker" in navigator&&window.isSecureContext){
 window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{scope:"./",updateViaCache:"none"}).catch(error=>console.warn("Offline caching unavailable:",error)));
}
