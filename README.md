# Patch Otherwise

A minimal, installable modular-synthesis strategy deck. 120 strategies, each with a short prompt and reverse-side detail. Tap the card to flip; tap New card to draw. No accounts, analytics, external libraries, notes, favorites, or saved history.

## Publish on GitHub Pages

1. Extract this ZIP on your computer.
2. Upload the CONTENTS of the patch-otherwise folder into your repository root. Replace the old index.html. Keep the icons folder intact. Do not upload the ZIP itself as the website.
3. Settings → Pages → Deploy from a branch → main → / (root) → Save.
4. Open the HTTPS address shown in Pages settings, normally https://YOUR-USERNAME.github.io/patch-otherwise/ .
5. All paths are relative; you can use a different repository name without editing the app.

Repository layout:

index.html
styles.css
app.js
strategies.json
manifest.webmanifest
sw.js
.nojekyll
icons/
README.md

If the browser upload interface hides .nojekyll, the plain files will normally still work with Pages' default processing; you can create the empty .nojekyll file separately on GitHub.

## Add to iPhone Home Screen

Open the published HTTPS address in Safari. Use Share → Add to Home Screen. Enable Open as Web App if offered, then Add. Launch from the Home Screen and keep it online briefly on the first launch so its files can cache. Then test by closing it, enabling airplane mode, and reopening from the icon. The first load needs an internet connection. Browser/OS storage cleanup can remove offline files; reconnect to restore them.

The package has not been tested on a physical iPhone. Test flip, draw, rotation, long-card sizing, and offline relaunch on your device after publishing.

## Edit the deck

Only edit strategies.json. It is a UTF-8 JSON array. Every card needs three nonempty string fields:

[
  {
    "id": "s001",
    "prompt": "Modulate your modulator.",
    "detail": "Change the rate, depth, or shape of something already creating movement."
  },
  {
    "id": "s002",
    "prompt": "Consider dynamics.",
    "detail": "Is every event equally important?"
  }
]

- Add: copy an object, give it a unique ID, and edit its text.
- Remove: delete the complete object and its adjacent separator as appropriate.
- Modify: edit prompt or detail; retain its ID.
- Reorder: move objects. The app still draws randomly.
- IDs can be any unique nonempty strings. You do not need to renumber after deletion.
- Use double quotes for JSON keys and strings. Separate objects with commas. No trailing comma, no comments.
- Escape quotes inside text as \" and line breaks as \n.
- Keep at least one card. The app validates all entries and duplicate IDs.
- Counts are calculated automatically; no UI code changes needed.
- Both faces determine card height, so longer entries can grow the card rather than spill out. Brief copy still works best.
- Everything in a public repository, including the strategy text, is publicly readable. Do not add secrets.

In GitHub, open strategies.json, select the pencil/Edit button, make changes, and commit. Wait for the Pages deployment to finish, then reopen/reload the app while online. An existing open session keeps its loaded deck until reload; edits do not interrupt a draw.

## Offline and update behavior

sw.js caches the page, code, deck, manifest, and icons. This is app-file storage only, not saved user activity. It checks the network on each new request and falls back to the cached copy on network failure or after four seconds. A late network response refreshes the cache for the next request. An invalid deck response does not replace a valid cached deck. If an online edit seems missing, allow the request to finish and reopen/reload once more.

JSON-only changes do NOT require changing the service worker version. For changes to code, layout, manifest, or icons, also bump VERSION in sw.js (for example 1.0.0 to 1.0.1). The updated worker waits for old app windows/tabs to close, then activates. Close all open copies of this app and reopen online to complete that transition. Cached data is scoped to this app path, so other Pages projects on the same account are not cleared.

Do not use root-relative /app.js or /strategies.json paths: GitHub project sites normally live inside a repository subdirectory.

## Local testing

Do not double-click index.html: browsers restrict fetching a separate JSON file from file:// URLs.

From the extracted app folder, with Python installed:

python3 -m http.server 8000

Open http://localhost:8000/ on that computer. Localhost permits service-worker testing. Opening the computer's plain HTTP LAN address on an iPhone does not provide the secure context needed for offline installation; use the published HTTPS site for device tests.

## Safety

These prompts are creative suggestions, not wiring specifications. Connect only compatible inputs and outputs, check voltage ranges, and use attenuation where appropriate. Start feedback experiments with return gain at zero and monitoring low.
