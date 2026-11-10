"use strict";

const $ = id => document.getElementById(id);
const card = $("card");
const inner = card.querySelector(".inner");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const MODES = {
  begin: {label: "Begin", description: "Choose a practical starting point."},
  explore: {label: "Explore", description: "Hear more in what is already happening."},
  disrupt: {label: "Disrupt", description: "Challenge a decision or break a habit."}
};
let cards = [];
let selectedMode = "begin";
let currentMode = null;
let current = -1;
let flipped = false;
let loading = false;
let drawing = false;
let bags = {begin: [], explore: [], disrupt: []};

function validateDeck(data, name = "Strategy deck") {
  if (!Array.isArray(data) || !data.length) throw new Error(`${name} must contain a nonempty array.`);
  const ids = new Set();
  data.forEach((c, i) => {
    if (!c || ![c.id, c.prompt, c.detail].every(v => typeof v === "string" && v.trim())) throw new Error(`${name}: card ${i + 1} needs nonempty id, prompt, and detail strings.`);
    if (ids.has(c.id)) throw new Error(`${name}: duplicate card ID ${c.id}.`);
    ids.add(c.id);
    if (!Array.isArray(c.modes) || !c.modes.length || c.modes.some(m => !Object.hasOwn(MODES, m)) || new Set(c.modes).size !== c.modes.length) throw new Error(`${name}: card ${c.id} needs unique modes chosen from begin, explore, and disrupt.`);
  });
  return data;
}

function combineDecks(base, starters) {
  validateDeck(base, "strategies.json");
  validateDeck(starters, "begin-strategies.json");
  if (starters.some(c => c.modes.length !== 1 || c.modes[0] !== "begin")) throw new Error('Every card in begin-strategies.json must have modes: ["begin"].');
  // Keep the existing file untouched. Its older abstract Begin cards no longer
  // enter Begin. Begin-only cards become Explore; shared cards keep other tags.
  const existing = base.map(c => {
    const modes = c.modes.filter(m => m !== "begin");
    return {...c, modes: modes.length ? modes : ["explore"]};
  });
  return validateDeck([...existing, ...starters], "Combined deck");
}

async function fetchDeck(path) {
  const response = await fetch(path, {cache: "no-store"});
  if (!response.ok) throw new Error(`Could not load ${path} (HTTP ${response.status}).`);
  return response.json();
}

function pool(mode) {
  return cards.map((_, i) => i).filter(i => cards[i].modes.includes(mode));
}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function updateControls() {
  const busy = loading || drawing;
  card.disabled = busy || current < 0;
  $("next").disabled = busy || (cards.length > 0 && !pool(selectedMode).length);
  modeButtons.forEach(button => {
    const mode = button.dataset.mode;
    button.setAttribute("aria-pressed", String(mode === selectedMode));
    button.disabled = busy || !pool(mode).length;
  });
  if (!cards.length) return;
  $("hint").textContent = currentMode && currentMode !== selectedMode
    ? `${MODES[selectedMode].label} selected for the next card · Current card unchanged`
    : "Tap the card to flip · Space for a new card";
  $("next").setAttribute("aria-label", `New ${MODES[selectedMode].label.toLowerCase()} card`);
}
function selectMode(mode) {
  if (loading || drawing || !Object.hasOwn(MODES, mode) || !pool(mode).length) return;
  selectedMode = mode;
  updateControls();
  $("announcement").textContent = `${MODES[mode].label}. ${MODES[mode].description} Applies to your next draw.`;
}
function fitCard() {
  if (!cards.length) return;
  card.style.removeProperty("height");
  const required = [...card.querySelectorAll(".face")].map(face => {
    const style = getComputedStyle(face);
    const content = [...face.children].reduce((sum, child) => {
      const s = getComputedStyle(child);
      return sum + child.offsetHeight + (parseFloat(s.marginTop) || 0) + (parseFloat(s.marginBottom) || 0);
    }, 0);
    return content + (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0) + 24;
  });
  card.style.height = `${Math.ceil(Math.max(card.offsetHeight, ...required))}px`;
}
function describe() {
  if (current < 0 || !cards[current]) return;
  const c = cards[current];
  card.setAttribute("aria-pressed", String(flipped));
  card.setAttribute("aria-label", flipped ? `${c.detail} Flip to prompt.` : `${MODES[currentMode].label}. ${c.prompt} Flip for detail.`);
  $("front").setAttribute("aria-hidden", String(flipped));
  $("back").setAttribute("aria-hidden", String(!flipped));
  $("announcement").textContent = flipped ? c.detail : `${MODES[currentMode].label}. ${c.prompt}`;
}
function renderNewCard() {
  const eligible = pool(selectedMode);
  if (!eligible.length) return;
  if (!bags[selectedMode].length) bags[selectedMode] = shuffle([...eligible]);
  const bag = bags[selectedMode];
  if (bag[bag.length - 1] === current && bag.length > 1) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
  current = bag.pop(); currentMode = selectedMode; flipped = false;
  inner.style.transition = "none";
  card.classList.remove("flipped");
  $("card-mode").textContent = MODES[currentMode].label;
  $("prompt").textContent = cards[current].prompt;
  $("detail").textContent = cards[current].detail;
  document.querySelectorAll(".number").forEach(el => el.textContent = `${String(eligible.indexOf(current) + 1).padStart(3, "0")} / ${eligible.length}`);
  fitCard();
  void inner.offsetHeight;
  inner.style.transition = "";
  describe(); updateControls();
}
async function draw() {
  if (!cards.length || loading || drawing || !pool(selectedMode).length) return;
  if (current === -1 || matchMedia("(prefers-reduced-motion: reduce)").matches || typeof card.animate !== "function") {renderNewCard(); return;}
  drawing = true; updateControls(); card.setAttribute("aria-busy", "true");
  const text = [...card.querySelectorAll(".label, .prompt, .detail, .foot")];
  let outgoing = [], incoming = [];
  try {
    outgoing = text.map(el => el.animate([{opacity: 1}, {opacity: 0}], {duration: 160, easing: "ease-in", fill: "forwards"}));
    await Promise.all(outgoing.map(a => a.finished));
    renderNewCard();
    incoming = text.map(el => el.animate([{opacity: 0}, {opacity: 1}], {duration: 240, easing: "ease-out", fill: "forwards"}));
    outgoing.forEach(a => a.cancel());
    await Promise.all(incoming.map(a => a.finished));
  } catch (error) {
    if (error.name !== "AbortError") console.warn("Card transition failed:", error);
  } finally {
    [...outgoing, ...incoming].forEach(a => a.cancel());
    drawing = false; card.removeAttribute("aria-busy"); updateControls();
  }
}
async function loadDeck() {
  if (loading || drawing) return;
  loading = true; updateControls(); $("error").hidden = true;
  try {
    const [base, starters] = await Promise.all([fetchDeck("./strategies.json"), fetchDeck("./begin-strategies.json")]);
    cards = combineDecks(base, starters);
    bags = {begin: [], explore: [], disrupt: []}; current = -1; currentMode = null;
    if (!pool(selectedMode).length) selectedMode = Object.keys(MODES).find(mode => pool(mode).length);
    $("next-label").textContent = "New card ↗"; renderNewCard();
  } catch (error) {
    cards = []; current = -1; currentMode = null; flipped = false;
    inner.style.transition = "none"; card.classList.remove("flipped"); void inner.offsetHeight; inner.style.transition = "";
    card.setAttribute("aria-pressed", "false"); card.setAttribute("aria-label", "The deck could not load.");
    $("front").setAttribute("aria-hidden", "false"); $("back").setAttribute("aria-hidden", "true");
    $("card-mode").textContent = "A different direction"; $("prompt").textContent = "The deck could not load."; $("detail").textContent = "";
    $("announcement").textContent = "The deck could not load.";
    document.querySelectorAll(".number").forEach(el => el.textContent = "");
    $("next-label").textContent = "Try again"; $("error").hidden = false;
    $("error").textContent = location.protocol === "file:"
      ? "Open the hosted GitHub Pages address, or use a local HTTP server. A downloaded HTML file cannot fetch its JSON decks directly."
      : `${error.message} Check both deck files and your connection, then try again.`;
  } finally {loading = false; updateControls();}
}
card.addEventListener("click", () => {
  if (loading || drawing || current < 0) return;
  flipped = !flipped; card.classList.toggle("flipped", flipped); describe();
});
$("next").addEventListener("click", () => {if (!loading && !drawing) cards.length ? draw() : loadDeck();});
modeButtons.forEach(button => button.addEventListener("click", () => selectMode(button.dataset.mode)));
document.addEventListener("keydown", event => {
  const interactive = event.target instanceof Element && event.target.closest("button, input, textarea, select, a, summary, [contenteditable]");
  if (event.code !== "Space" || interactive || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
  event.preventDefault(); if (!event.repeat && cards.length && !loading && !drawing) draw();
});
let resizeTimer;
window.addEventListener("resize", () => {clearTimeout(resizeTimer); resizeTimer = setTimeout(fitCard, 100)});
if (document.fonts) document.fonts.ready.then(fitCard);
function enableTapRipple(button) {
  const layer = document.createElement("span"); layer.className = "tap-ripple-layer"; layer.setAttribute("aria-hidden", "true"); button.appendChild(layer);
  button.addEventListener("pointerdown", event => {
    if (button.disabled || loading || drawing || !event.isPrimary || event.button !== 0 || matchMedia("(prefers-reduced-motion: reduce)").matches || typeof button.animate !== "function") return;
    const bounds = button.getBoundingClientRect(); const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
    const radius = Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y));
    layer.replaceChildren();
    const ripple = document.createElement("span"); ripple.className = "tap-ripple";
    Object.assign(ripple.style, {width: `${radius * 2}px`, height: `${radius * 2}px`, left: `${x - radius}px`, top: `${y - radius}px`}); layer.appendChild(ripple);
    const animation = ripple.animate([{transform: "scale(0)", opacity: .8}, {transform: "scale(1)", opacity: 0}], {duration: 480, easing: "cubic-bezier(.2,.7,.2,1)"});
    animation.finished.catch(() => {}).finally(() => ripple.remove());
  });
}
enableTapRipple(card); enableTapRipple($("next"));
loadDeck();
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js", {scope: "./", updateViaCache: "none"}).catch(error => console.warn("Offline caching unavailable:", error)));
}
