"use strict";
// Change VERSION whenever you change the HTML, CSS, JS, manifest, or icons.
// JSON-only deck edits do not require a version change.
const VERSION="1.0.3";
const BASE=self.registration.scope;
const PREFIX="patch-otherwise-"+encodeURIComponent(new URL(BASE).pathname)+"-";
const CACHE=PREFIX+VERSION;
const PATHS=["./","./index.html","./styles.css","./app.js","./strategies.json","./manifest.webmanifest","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png"];
const URLS=new Set(PATHS.map(p=>new URL(p,BASE).href));
function validDeck(data){
 if(!Array.isArray(data)||!data.length)return false;
 const ids=new Set();
 return data.every(c=>{if(!c||![c.id,c.prompt,c.detail].every(s=>typeof s==="string"&&s.trim())||ids.has(c.id))return false;ids.add(c.id);return true});
}
async function check(response,url){
 if(!response.ok)throw new Error("Network response unavailable");
 if(url===new URL("./strategies.json",BASE).href&&!validDeck(await response.clone().json()))throw new Error("Invalid deck; keeping the cached version");
 return response;
}
self.addEventListener("install",event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await Promise.all([...URLS].map(async url=>{const response=await check(await fetch(url,{cache:"reload"}),url);await cache.put(url,response)}));
 // Let an existing session finish on its current worker. Activate after old windows close.
})()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=="GET"||!URLS.has(url.href))return;
 // Network first for editable content; cached copy after four seconds or network failure.
 const network=(async()=>{
  const response=await check(await fetch(event.request,{cache:"no-store"}),url.href);
  const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());return response;
 })();
 event.waitUntil(network.then(()=>{},()=>{}));
 event.respondWith((async()=>{
  let timer;
  try{return await Promise.race([network,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("Network timeout")),4000)})])}
  catch(error){const cache=await caches.open(CACHE);const cached=await cache.match(event.request);if(cached)return cached;return await network}
  finally{clearTimeout(timer)}
 })());
});
