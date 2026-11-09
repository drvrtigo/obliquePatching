"use strict";

const $ = id => document.getElementById(id);

const card = $("card");
const inner = card.querySelector(".inner");

let cards = [];
let bag = [];
let current = -1;
let flipped = false;
let loading = false;
let drawing = false;

// --------------------------------------------------
// Deck validation
// --------------------------------------------------

function validateDeck(data) {
  if (!Array.isArray(data) || !data.length) {
    throw new Error(
      "strategies.json must contain a nonempty array."
    );
  }

  const ids = new Set();

  for (let i = 0; i < data.length; i++) {
    const strategy = data[i];

    if (
      !strategy ||
      typeof strategy.id !== "string" ||
      !strategy.id.trim() ||
      typeof strategy.prompt !== "string" ||
      !strategy.prompt.trim() ||
      typeof strategy.detail !== "string" ||
      !strategy.detail.trim()
    ) {
      throw new Error(
        `Card ${i + 1} needs nonempty id, prompt, and detail strings.`
      );
    }

    if (ids.has(strategy.id)) {
      throw new Error(
        `Duplicate card ID: ${strategy.id}`
      );
    }

    ids.add(strategy.id);
  }

  return data;
}

// --------------------------------------------------
// Shuffle
// --------------------------------------------------

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

// --------------------------------------------------
// Card sizing
// --------------------------------------------------

function fitCard() {
  if (!cards.length) return;

  card.style.removeProperty("height");

  const requiredHeights = [
    ...card.querySelectorAll(".face")
  ].map(face => {
    const faceStyle = getComputedStyle(face);

    const contentHeight = [...face.children].reduce(
      (total, child) => {
        const childStyle = getComputedStyle(child);

        return (
          total +
          child.getBoundingClientRect().height +
          (parseFloat(childStyle.marginTop) || 0) +
          (parseFloat(childStyle.marginBottom) || 0)
        );
      },
      0
    );

    return (
      contentHeight +
      (parseFloat(faceStyle.paddingTop) || 0) +
      (parseFloat(faceStyle.paddingBottom) || 0) +
      24
    );
  });

  const height = Math.ceil(
    Math.max(
      card.getBoundingClientRect().height,
      ...requiredHeights
    )
  );

  card.style.height = `${height}px`;
}

// --------------------------------------------------
// Accessibility
// --------------------------------------------------

function describe() {
  if (current < 0 || !cards[current]) return;

  const strategy = cards[current];

  card.setAttribute(
    "aria-pressed",
    String(flipped)
  );

  card.setAttribute(
    "aria-label",
    flipped
      ? `${strategy.detail} Flip to prompt.`
      : `${strategy.prompt} Flip for detail.`
  );

  $("front").setAttribute(
    "aria-hidden",
    String(flipped)
  );

  $("back").setAttribute(
    "aria-hidden",
    String(!flipped)
  );

  $("announcement").textContent = flipped
    ? strategy.detail
    : strategy.prompt;
}

// --------------------------------------------------
// Immediate card update
// --------------------------------------------------

function renderNewCard() {
  if (!cards.length) return;

  if (!bag.length) {
    bag = shuffle(cards.map((_, index) => index));

    // Avoid an immediate repeat across shuffle boundaries.
    if (
      bag.length > 1 &&
      bag[bag.length - 1] === current
    ) {
      [bag[0], bag[bag.length - 1]] = [
        bag[bag.length - 1],
        bag[0]
      ];
    }
  }

  current = bag.pop();
  flipped = false;

  // Reset to the prompt side without a flip animation.
  inner.style.transition = "none";
  card.classList.remove("flipped");

  $("prompt").textContent = cards[current].prompt;
  $("detail").textContent = cards[current].detail;

  document.querySelectorAll(".number").forEach(element => {
    element.textContent =
      `${String(current + 1).padStart(3, "0")} / ${cards.length}`;
  });

  fitCard();

  // Apply the reset before restoring the flip transition.
  void inner.offsetHeight;
  inner.style.transition = "";

  describe();
}

// --------------------------------------------------
// Animated card draw
// --------------------------------------------------

async function draw() {
  if (!cards.length || drawing || loading) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Initial load and reduced-motion mode update instantly.
  if (
    current === -1 ||
    reduceMotion ||
    typeof card.animate !== "function"
  ) {
    renderNewCard();
    return;
  }

  drawing = true;
  card.disabled = true;
  $("next").disabled = true;

  card.setAttribute("aria-busy", "true");

  let fadeOut;
  let fadeIn;

  try {
    fadeOut = card.animate(
      [
        { opacity: 1 },
        { opacity: 0 }
      ],
      {
        duration: 160,
        easing: "ease-in",
        fill: "forwards"
      }
    );

    await fadeOut.finished;

    // Replace the content while the card is invisible.
    renderNewCard();

    fadeIn = card.animate(
      [
        { opacity: 0 },
        { opacity: 1 }
      ],
      {
        duration: 240,
        easing: "ease-out",
        fill: "forwards"
      }
    );

    fadeOut.cancel();

    await fadeIn.finished;
  } catch (error) {
    // Cancelled animations should not leave controls locked.
    if (error.name !== "AbortError") {
      console.warn("Card transition failed:", error);
    }
  } finally {
    fadeOut?.cancel();
    fadeIn?.cancel();

    drawing = false;
    card.disabled = false;
    $("next").disabled = false;

    card.removeAttribute("aria-busy");
  }
}

// --------------------------------------------------
// Load strategies
// --------------------------------------------------

async function loadDeck() {
  if (loading || drawing) return;

  loading = true;
  card.disabled = true;
  $("next").disabled = true;
  $("error").hidden = true;

  try {
    const response = await fetch("./strategies.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `Could not load strategies.json (HTTP ${response.status}).`
      );
    }

    const data = await response.json();

    cards = validateDeck(data);
    bag = [];
    current = -1;
    flipped = false;

    $("next").textContent = "New card ↗";

    // Render the initial card without a transition.
    renderNewCard();

    card.disabled = false;
  } catch (error) {
    cards = [];
    bag = [];
    current = -1;
    flipped = false;

    inner.style.transition = "none";
    card.classList.remove("flipped");
    void inner.offsetHeight;
    inner.style.transition = "";

    card.disabled = true;
    card.setAttribute("aria-pressed", "false");
    card.setAttribute("aria-label", "The deck could not load.");

    $("front").setAttribute("aria-hidden", "false");
    $("back").setAttribute("aria-hidden", "true");

    $("prompt").textContent = "The deck could not load.";
    $("detail").textContent = "";
    $("announcement").textContent = "The deck could not load.";

    document.querySelectorAll(".number").forEach(element => {
      element.textContent = "";
    });

    $("next").textContent = "Try again";
    $("error").hidden = false;

    $("error").textContent =
      location.protocol === "file:"
        ? "Open the hosted GitHub Pages address, not the downloaded HTML. For local testing, use the server instructions in README.md."
        : `${error.message} Check the JSON file and your connection, then try again.`;
  } finally {
    loading = false;
    $("next").disabled = false;
  }
}

// --------------------------------------------------
// Interaction
// --------------------------------------------------

card.addEventListener("click", () => {
  if (!cards.length || loading || drawing) return;

  flipped = !flipped;

  card.classList.toggle("flipped", flipped);

  describe();
});

$("next").addEventListener("click", () => {
  if (loading || drawing) return;

  if (cards.length) {
    draw();
  } else {
    loadDeck();
  }
});

document.addEventListener("keydown", event => {
  const isInteractiveTarget =
    event.target instanceof Element &&
    event.target.closest(
      "button, input, textarea, select, a, summary, [contenteditable]"
    );

  if (
    event.code !== "Space" ||
    isInteractiveTarget ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();

  if (
    !event.repeat &&
    cards.length &&
    !loading &&
    !drawing
  ) {
    draw();
  }
});

// --------------------------------------------------
// Responsive sizing
// --------------------------------------------------

let resizeTimer;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(fitCard, 100);
});

if (document.fonts) {
  document.fonts.ready.then(fitCard);
}

// --------------------------------------------------
// Startup
// --------------------------------------------------

loadDeck();

// --------------------------------------------------
// Offline support
// --------------------------------------------------

if (
  "serviceWorker" in navigator &&
  window.isSecureContext
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", {
        scope: "./",
        updateViaCache: "none"
      })
      .catch(error => {
        console.warn(
          "Offline caching unavailable:",
          error
        );
      });
  });
}
