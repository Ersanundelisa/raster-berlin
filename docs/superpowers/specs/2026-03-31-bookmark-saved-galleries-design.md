# Bookmark & Saved Galleries — Design Spec
Date: 2026-03-31

## Overview
Add a bookmark icon to the back face of every gallery card on the Galleries page (`data-page="musts"`). Clicking it saves or unsaves the gallery. Saved galleries appear on the Saved page (footer bookmark icon, `data-target="saved"`).

---

## 1. Bookmark Button (Card Back)

**Placement:** Top-right corner of `.art-card-back-overlay`, positioned absolutely.

**Appearance:**
- Outline bookmark SVG = unsaved
- Filled bookmark SVG = saved
- Click toggles state, updates localStorage, re-renders icon

**Interaction:**
- `event.stopPropagation()` on click to prevent triggering the card flip
- On click: read current saved IDs from localStorage → add or remove this card's `data-dish` value → write back → update icon visually

**Saved ID:** Each card is identified by its `data-dish` attribute value (e.g. `"Galerie Judin"`).

---

## 2. Persistent Storage

**Key:** `artthis_saved` in `localStorage`
**Value:** JSON array of `data-dish` strings, e.g. `["Galerie Judin", "PACE"]`

**On page load:** All gallery cards read localStorage and render their bookmark icon in the correct state (filled or outline).

---

## 3. Saved Page

**HTML:** New `<div class="app-page" data-page="saved">` added to `index.html` before the footer nav. Contains:
- A header matching the style of other pages (section label, title)
- A `.must-sees-grid` div with id `savedGrid` (populated by JS)
- An empty-state message (hidden by default): "No saved galleries yet."

**JS behaviour on navigate to `saved`:**
1. Read `artthis_saved` from localStorage
2. Clear `#savedGrid`
3. If empty: show empty-state message, hide grid
4. If not empty: for each saved ID, find the matching `.art-card[data-dish="..."]` in the Galleries page, clone it (deep clone), append to `#savedGrid`
5. Re-initialize flip behavior on cloned cards
6. Re-initialize bookmark button state on cloned cards

**Unsaving from Saved page:** Clicking the bookmark on a cloned card removes it from localStorage and removes the cloned card from `#savedGrid` immediately. The original card's icon on the Galleries page is also updated.

---

## 4. Router Update

`app.js` — `validPages` array: add `'saved'` so `checkHash()` and `navigateToPage()` handle it correctly.

The `navigateToPage` function gets a hook for `pageName === 'saved'` to trigger the saved grid re-render on each visit.

---

## 5. CSS

- `.bookmark-btn`: absolute positioned, top-right of `.art-card-back-overlay`, 36×36px tap target, transparent background, no border
- `.bookmark-btn svg`: 20×20px, stroke white, filled state uses `fill: white`
- `.saved-empty-state`: centered text, muted color, shown only when grid is empty
