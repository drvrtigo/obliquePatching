# obliquePatching — Begin / Explore / Disrupt

Prepared from repository commit 993982fb3b2eba47e6855a2275adebb55c8a28b7.
This is a replacement-files update, not a complete clone. Keep your existing icons/ folder.
No repository files have been pushed or deployed by this package.

## Install this update

1. Extract the ZIP.
2. Upload these six files to the ROOT of drvrtigo/obliquePatching, replacing their current versions:
   index.html
   styles.css
   app.js
   strategies.json
   manifest.webmanifest
   sw.js
3. Optionally replace README.md with this file.
4. KEEP the existing icons/ directory and any other repository configuration. The ZIP deliberately does not replace the icons.
5. Commit the replacement files together. Do not nest them inside a new folder in the repository.
6. Wait for the Pages build and deploy jobs to succeed.
7. Open the site online. Close every open copy of this app (browser tabs and Home Screen window), then reopen so the new service worker can activate. If necessary use Chrome's Application → Service Workers → Bypass for network to inspect deployed files, then uncheck it for offline tests.

Service worker VERSION is now 1.1.0 (the inspected baseline was 1.0.4).
The old cache namespace is deliberately retained so activation can remove only this app's previous caches. It is not displayed as the product name.

## Interaction

- Explore is the initial selection on each fresh load. No mode or activity is persisted.
- Begin: find a premise, constraint, or first relationship. Works from an empty or nearly empty patch.
- Explore: hear possibilities within something already happening.
- Disrupt: challenge a decision, break a habit, or escape a familiar result.
- Selecting a mode changes the NEXT draw only. Your current card, its face, and its interpretation remain untouched. The hint states when another mode is queued.
- The card's top label names the mode it was drawn from, not a subsequently queued mode.
- Tap the card to flip. Tap New card to draw with a text-only fade.
- The card background does not fade. The reverse still has the existing slightly green tint and resets to the front at the draw midpoint.
- Space draws when focus is outside an interactive element. There is no N shortcut.
- Each mode has an independent shuffle bag for this session. Shared cards can occur in multiple modes; switching mode is not a global no-repeat guarantee. A different next card is preferred when a bag contains another choice.
- The footer is the card's position within the displayed mode's source list / that mode's size. It is not session progress.
- Empty modes are disabled. A one-card mode remains usable.
- No saved history, favorites, notes, accounts, or analytics.

## Deck changes

156 unique strategies:
- Begin: 51 eligible cards.
- Explore: 107 eligible cards.
- Disrupt: 57 eligible cards.

These counts overlap because a strategy can suit multiple intentions.

All original 120 IDs, prompts, and details are retained. Their original JSON, before adding mode tags, was reconstructed and verified against the repository's Git blob SHA (4f36d14f26b2f68bab32a5730d7e94323e3c7a01).

The 36 new strategies are:
- s121–s144: 24 dedicated Begin prompts.
- s145–s154: 10 open-ended Explore prompts.
- s155–s156: 2 Disrupt prompts.

The front offers a short invitation; the reverse offers one possible interpretation, not a required solution.

## Editing strategies.json

Each object needs:

{
  "id": "s157",
  "modes": ["begin", "explore"],
  "prompt": "A short invitation.",
  "detail": "One possible way to interpret it."
}

Allowed mode names are exactly: begin, explore, disrupt.

- Give each card at least one mode, with no duplicate tags.
- Keep IDs unique. IDs do not have to be sequential.
- Add/remove/edit whole objects in the existing JSON array.
- Double quotes are required; no comments or trailing commas.
- Keep at least one valid card in the file. A mode with no cards is disabled, not an app error.
- Counts and pools are computed automatically.
- JSON-only edits do not require a service worker version bump.
- An open session keeps its loaded data until reload. Reload online after the Pages deployment to fetch deck changes.

## Preserved and adjusted

- Hidden header is retained.
- App title, Apple title, hidden heading, and manifest names use exact capitalization: obliquePatching.
- Text-only draw fade: 160 ms out / 240 ms in.
- Tap ripple remains on the card and New card button.
- Reduced-motion settings skip animations as before.
- Ripple layer is no longer accidentally removed when updating the New card label: its text has a dedicated span.
- Card sizing now uses untransformed element heights for both faces.
- Relative URLs remain suitable for the existing GitHub Pages project path.
- Offline cache remains network-first with a four-second cached fallback.
- Both app and service worker validate the new mode tags.

## Checks performed

- JavaScript syntax validation for app.js and sw.js using Node.
- Original deck Git blob SHA verification.
- JSON schema checks and unique IDs.
- Mode pool counts and within-pool shuffle cycles.
- Mode selection leaves the current card unchanged.
- Text animation targets do not include the card/background.
- Draw controls unlock after the fade.
- Invalid deck and duplicate-ID rejection.
- Single-card mode and disabled empty-mode handling.

Behavior tests used a small simulated DOM, not a real browser. Visual rendering, actual Safari/iPhone behavior, and live service-worker installation have NOT been tested in this environment.

## Suggested device checks after publishing

1. Confirm Explore is selected and the header is hidden.
2. Flip a card, select Begin, and confirm that card stays on its reverse.
3. Draw and confirm a Begin prompt arrives on the front, fading text only.
4. Try each mode and rapid taps during a draw.
5. Confirm ripples still work after the initial deck load.
6. Rotate the phone and check long reverse-side text.
7. Relaunch offline after a successful online launch and completed caching.

## Local testing

From this folder, with Python installed:

python3 -m http.server 8000

Open http://localhost:8000/ on the computer. For local icon/offline installation checks, copy your existing icons/ directory alongside these files. For iPhone testing use the published HTTPS site.
