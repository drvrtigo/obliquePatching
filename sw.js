"use strict";
// Bump for code, CSS, manifest, or icon updates; JSON-only edits need no bump.
const VERSION = "1.2.0";
const BASE = self.registration.scope;
const PREFIX = "patch-otherwise-" + encodeURIComponent(new URL(BASE).pathname) + "-";
const CACHE = PREFIX + VERSION;
const PATHS = ["./", "./index.html", "./styles.css", "./app.js", "./strategies.json", "./begin-strategies.json", "./manifest.webmanifest", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"];
const URLS = new Set(PATHS.map(p => new URL(p, BASE).href));
function validDeck(data, beginOnly = false) {
  if (!Array.isArray(data) || !data.length) return false;
  const ids = new Set();
  return data.every(c => {
    if (!c || ![c.id, c.prompt, c.detail].every(s => typeof s === "string" && s.trim()) || ids.has(c.id) || !Array.isArray(c.modes) || !c.modes.length || c.modes.some(m => !["begin", "explore", "disrupt"].includes(m)) || new Set(c.modes).size !== c.modes.length) return false;
    if (beginOnly && (c.modes.length !== 1 || c.modes[0] !== "begin")) return false;
    ids.add(c.id); return true;
  });
}
async function check(response, url) {
  if (!response.ok) throw new Error("Network response unavailable");
  const isBase = url === new URL("./strategies.json", BASE).href;
  const isBegin = url === new URL("./begin-strategies.json", BASE).href;
  if ((isBase || isBegin) && !validDeck(await response.clone().json(), isBegin)) throw new Error("Invalid deck; keeping the cached version");
  return response;
}
self.addEventListener("install", event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await Promise.all([...URLS].map(async url => {
    const response = await check(await fetch(url, {cache: "reload"}), url);
    await cache.put(url, response);
  }));
})()));
self.addEventListener("activate", event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || !URLS.has(url.href)) return;
  const network = (async () => {
    const response = await check(await fetch(event.request, {cache: "no-store"}), url.href);
    const cache = await caches.open(CACHE); await cache.put(event.request, response.clone()); return response;
  })();
  event.waitUntil(network.then(() => {}, () => {}));
  event.respondWith((async () => {
    let timer;
    try {return await Promise.race([network, new Promise((_, reject) => {timer = setTimeout(() => reject(new Error("Network timeout")), 4000)})]);}
    catch (error) {const cached = await (await caches.open(CACHE)).match(event.request); if (cached) return cached; return await network;}
    finally {clearTimeout(timer);}
  })());
});
