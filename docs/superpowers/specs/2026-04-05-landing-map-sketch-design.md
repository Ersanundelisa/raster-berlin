# Landing Page Map Sketch — Design Spec
*2026-04-05*

## Summary

Replace the landing page's "What's New" editorial section with a full-width, non-interactive B&W map sketch of Berlin showing gallery markers. Clicking it navigates to the real interactive map.

---

## Page Structure

The landing page (`data-page="start"`) is simplified to two elements:

1. **Hero slider** — unchanged
2. **Map sketch section** — new, directly below the hero

The entire `start-scroll-content` div (currently holding the "What's New" exhibition block) is removed from `index.html`.

---

## Map Sketch Section

### HTML

A new `<div class="map-sketch-section">` is inserted inside the `data-page="start"` page, immediately after the `<header class="hero hero-slider">` closing tag.

Structure:
```
div.map-sketch-section            ← outer wrapper, cursor:pointer, click → navigateToPage('map')
  span.map-sketch-label           ← "BERLIN · GALLERIES & MUSEUMS"
  div#sketchMapContainer          ← Leaflet renders here
  div.map-sketch-overlay          ← transparent click interceptor + "Explore the map →" label
```

### Dimensions

- Mobile (≤767px): `height: 70vh`
- Desktop (≥768px): `height: 500px`, `max-width: 100%`

### Tile Layer

CartoDB Positron (no labels):
```
https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png
```
No API key required. Attribution: © OpenStreetMap contributors, © CARTO.

CSS filter applied to `#sketchMapContainer`:
```css
filter: grayscale(1) contrast(1.3);
```

### Map Configuration

- Center: `[52.52, 13.405]` (central Berlin)
- Zoom: `12`
- All interaction disabled:
  - `dragging: false`
  - `zoomControl: false`
  - `scrollWheelZoom: false`
  - `touchZoom: false`
  - `doubleClickZoom: false`
  - `boxZoom: false`
  - `keyboard: false`

### Gallery Markers

Small filled circle markers (no popups, no click events) using `L.circleMarker`:
- `radius: 5`
- `fillColor: '#000'`
- `color: '#000'`
- `weight: 1`
- `fillOpacity: 0.85`

Coordinates come from the same gallery data array already used by `initFoodMap()`. The sketch map initialization reads this array directly — no duplication of data.

### Overlay

A `div.map-sketch-overlay` absolutely positioned over the full map container:
- `background: transparent`
- `cursor: pointer`
- `pointer-events: all` (intercepts all mouse/touch so Leaflet never receives them)
- Contains a centered `<span>` with text `Explore the map →`
  - Style: small uppercase label, light opacity (~0.6), no background

### Click Behavior

`map-sketch-section` click handler calls `navigateToPage('map')`. The existing navigation flow handles the globe intro animation, then initializes `foodMap` with geolocation button already present.

---

## JavaScript

A new `initSketchMap()` function in `app.js`:
- Called once on `DOMContentLoaded`
- Creates a separate `sketchMap` Leaflet instance on `#sketchMapContainer`
- Adds the CartoDB tile layer
- Iterates the existing gallery coordinates array and adds `circleMarker` for each
- Does not interfere with `foodMap` initialization

The gallery coordinates array (already defined for `initFoodMap`) is referenced directly — no data is duplicated.

---

## CSS

New rules added to `css/style.css`:

```css
.map-sketch-section       — position:relative, overflow:hidden, cursor:pointer
.map-sketch-label         — small uppercase letter-spaced label above the map
#sketchMapContainer       — width:100%, height:100%, filter:grayscale(1) contrast(1.3)
.map-sketch-overlay       — position:absolute, inset:0, z-index above Leaflet tiles
                            flex center for the "Explore" label
```

---

## What Is Not Changed

- Hero slider and all its logic — untouched
- `initFoodMap()` and the real map page — untouched
- Navigation system — untouched
- All other pages (musts, artists, news) — untouched
