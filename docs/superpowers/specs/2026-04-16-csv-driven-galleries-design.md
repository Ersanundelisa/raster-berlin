# CSV-Driven Gallery Cards — Design Spec
**Date:** 2026-04-16

## Goal
Replace hardcoded gallery cards in `index.html` with dynamically generated cards driven by `Galeriverzeichnis.csv`. Adding, removing, or updating a gallery requires only editing the CSV — no HTML changes needed.

---

## Data Source

**File:** `Galeriverzeichnis.csv`
**Separator:** `;`
**Columns:** `(empty)`, `Name`, `Address`, `Contact`, `Opening Hours`, `Instagram`, `Website`, `Photo`

The first column is always empty (legacy format artifact). The header row is skipped. Rows with no `Name` value are skipped.

**Photo filenames** reference files in `pics galleries/`. The JS prepends `pics%20galleries/` to build the full path. If the `Photo` column is empty, no image is shown.

---

## Architecture

### `index.html` changes
- Remove all hardcoded `<article class="art-card">` elements inside `.must-sees-grid`
- Leave the grid container in place: `<div class="must-sees-grid reveal-stagger" id="galleries-grid"></div>`

### `app.js` changes
Add a `loadGalleries()` function that:
1. `fetch()`es `Galeriverzeichnis.csv`
2. Parses the text into rows, splits each row on `;`
3. Skips the header row and any row with an empty `Name`
4. For each valid row, calls `buildGalleryCard(data)` to create an `<article>` element
5. Appends all cards into `#galleries-grid`
6. Re-runs the existing `alternatingImages` setup for newly added images

`loadGalleries()` is called inside the existing `DOMContentLoaded` listener.

---

## Card HTML Structure

Each card mirrors the existing hardcoded structure exactly:

```
article.art-card [data-dish, data-restaurant, data-desc, data-address, data-img, data-img2]
  div.art-card-scene > div.art-card-shell > div.art-card-flip
    div.art-card-face.art-card-front
      div.art-card-shine
      div.art-card-img-wrap
        img.alternating-img [if photo exists]
      div.art-card-body
        div.art-card-name-row
          h3.art-card-dish        ← gallery name
          div.art-card-social     ← NEW: icon links (right side)
            a[instagram link]     ← only if Instagram column is filled
            a[website link]       ← only if Website column is filled
        p.art-card-restaurant     ← "Galerie"
        div.art-card-meta
    div.art-card-face.art-card-back
      img.art-card-back-img [if photo exists]
      div.art-card-back-overlay
        div.art-card-back-restaurant
        hr.art-card-divider
        div.art-card-back-desc    ← opening hours
        div.art-card-info-rows
          div.art-card-info-row   ← address [only if address exists]
        a.art-card-maps-btn       ← Google Maps link [only if address exists]
```

---

## Instagram + Website Icons

- Rendered inside a new `div.art-card-social` on the front face, to the right of the gallery name
- `art-card-name-row` wraps both `h3.art-card-dish` and `div.art-card-social` as a flex row (space-between)
- Icons: Instagram SVG logo + globe SVG icon (consistent with existing SVG style in the codebase)
- Icon size: ~14px, color: `#aaa`, hover: `#000`
- Links open in `target="_blank" rel="noopener"`
- `onclick="event.stopPropagation()"` prevents triggering the card flip
- Only rendered when the respective CSV column is non-empty

---

## CSS changes (`style.css`)

Add:
```css
.art-card-name-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}
.art-card-social {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  padding-top: 2px;
}
.art-card-social a {
  color: #aaa;
  line-height: 1;
}
.art-card-social a:hover {
  color: #000;
}
```

---

## Error Handling

- If `fetch()` fails (e.g. opened as local file without server): log a console warning, grid stays empty
- Rows missing `Name`: silently skipped
- Missing `Photo`: image elements omitted, card renders without image
- Missing `Address`: address row and Maps button omitted from card back

---

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Remove hardcoded `article.art-card` blocks; add `id="galleries-grid"` to grid container |
| `js/app.js` | Add `loadGalleries()` and `buildGalleryCard()` functions |
| `css/style.css` | Add `.art-card-name-row` and `.art-card-social` styles |
