# Gallery Card Expand — Design Spec
**Date:** 2026-04-18

## Problem
Gallery cards are loaded dynamically from `Galeriverzeichnis.csv` after page init. The fly-to-center expand mechanic in `js/app.js` attaches click handlers via `document.querySelectorAll('.art-card')` at init time, before any cards exist — so nothing happens on click.

## Solution
Attach the click handler inside `buildGalleryCard` at card creation time.

## Changes — `js/app.js`

1. **Extract `attachCardExpand(card)`** — wrap the click handler block currently in `artCards.forEach` (lines 405–471) into a standalone named function in the same closure scope. All shared state (`activeCard`, `activePortal`, `cardState`, `artBackdrop`, `collapseActiveCard`) remains accessible.

2. **Call `attachCardExpand(article)` at the end of `buildGalleryCard`** — every dynamically created card gets the handler immediately.

3. **Remove `flipEl.classList.remove('flipped')`** — no flip animation, so the reset is unnecessary.

4. **Remove the dead `artCards.forEach` loop** — no static `.art-card` elements exist in the HTML.

## Interaction
- Click gallery card → flies to viewport center, scales up (max 340px / 85vw)
- Backdrop appears
- Click card or backdrop → collapses back to original position
- Escape key also collapses

## Out of scope
- No changes to CSS, HTML, collapse/backdrop logic, or back-face content
- No flip animation
