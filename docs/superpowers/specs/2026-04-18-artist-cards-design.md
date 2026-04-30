# Artist Cards with Swipeable Photos — Design Spec

**Date:** 2026-04-18

## Overview

Populate the Artists page with photo cards loaded from `Artistsverzeichnis.csv`. Each card shows the artist's photos with a left/right swipe gesture, dot indicators, and links to their website and Instagram.

## Data Source

- **File:** `Artistsverzeichnis.csv` (semicolon-delimited)
- **Columns:** [0] empty, [1] Name, [2] Website, [3] Instagram, [4] Photo 1, [5] Photo 2, [6] Photo 3, [7] Photo 4
- **Photo folder:** `Artists Photos/` (filenames match the CSV photo columns exactly)
- **Loading:** Lazy-loaded via `fetch()` on first visit to the Artists page, same pattern as `loadGalleries()` for `Galeriverzeichnis.csv`

## Card Layout

2-column CSS grid below the existing alphabet filter bar.

```
┌─────────────────────┐
│                     │
│      PHOTO          │  ← swipeable area
│                     │
│    ● ○ ○            │  ← dots (hidden if only 1 photo)
├─────────────────────┤
│  Name         🌐 📷 │  ← name left, icons right
└─────────────────────┘
```

- Photo area: square or portrait aspect ratio, `object-fit: cover`
- Name: left-aligned, same typographic style as existing artist list items
- Globe icon (website) + Instagram icon — right-aligned in the name row
- Icons: same SVG style as existing `SVG_GLOBE` and `SVG_INSTAGRAM` constants in `app.js`

## Swipe Interaction

- Touch `touchstart` / `touchmove` / `touchend` events on the photo area
- Drag threshold: 30px horizontal movement distinguishes a swipe from a tap
- Swipe left → next photo (wraps from last back to first)
- Swipe right → previous photo (wraps from first back to last)
- Photo transition: instant swap (no CSS animation needed for v1)
- Dot indicators update to reflect the current photo index

## Tap Interaction

- A touch that moves < 30px horizontally is treated as a tap
- Tap opens the artist's **website** in a new tab (`target="_blank"`, `rel="noopener"`)
- If no website URL, tap falls back to opening the **Instagram** URL
- Tapping the globe or Instagram icon opens the respective URL and does NOT trigger the card tap

## Alphabet Filter

- The existing `.artists-alpha-btn` buttons filter by first letter of `Name`
- Each artist card gets a `data-letter` attribute (uppercased first character of name)
- Filtering shows/hides cards; no re-render needed

## Implementation Scope

Changes are confined to:
1. `js/app.js` — add `loadArtists()`, `buildArtistCard()`, swipe logic, lazy-load trigger on Artists page navigation
2. `css/style.css` — add `.artist-card`, `.artist-card-photos`, `.artist-card-dots`, `.artist-card-info` styles
3. `index.html` — replace the `<p class="artists-empty">` placeholder with an empty `<div id="artistsGrid">` container

## Out of Scope

- Flip animation (not needed; artists cards are simpler than gallery cards)
- Auto-cycling photos (user explicitly wants manual swipe)
- Detail/expand modal
- Search within artists
