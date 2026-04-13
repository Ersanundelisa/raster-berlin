# Landing Page Map Sketch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing page "What's New" section with a non-interactive B&W sketch map of Berlin showing gallery markers; clicking it navigates to the real interactive map.

**Architecture:** Three coordinated changes — HTML structure (remove old section, add sketch container), CSS (sketch map sizing and overlay), and JS (`initSketchMap()` function that creates a disabled Leaflet instance on `#sketchMapContainer` using the existing `spots` array).

**Tech Stack:** Leaflet.js (already loaded), CartoDB Positron tile layer (no API key), vanilla CSS/JS.

---

## Files

- Modify: `index.html` — remove `start-scroll-content` div (lines 284–329), add `map-sketch-section` after hero
- Modify: `css/style.css` — append sketch map rules at end of file
- Modify: `js/app.js` — add `initSketchMap()` function and call it before the closing `});` at line 1307

---

### Task 1: Remove "What's New" section and add sketch map HTML

**Files:**
- Modify: `index.html:284-329`

- [ ] **Step 1: Remove the `start-scroll-content` block and replace with sketch map HTML**

In `index.html`, replace lines 284–329 (from `<!-- SCROLL SECTIONS -->` to `<!-- END SCROLL SECTIONS -->`) with the following:

```html
      <!-- MAP SKETCH -->
      <div class="map-sketch-section" id="mapSketchSection">
        <span class="map-sketch-label">BERLIN · GALLERIES & MUSEUMS</span>
        <div id="sketchMapContainer"></div>
        <div class="map-sketch-overlay">
          <span class="map-sketch-cta">Explore the map →</span>
        </div>
      </div>
```

The exact old text to replace starts with:
```
      <!-- SCROLL SECTIONS -->
      <div class="start-scroll-content">
```
and ends with:
```
      </div>
      <!-- END SCROLL SECTIONS -->
```

- [ ] **Step 2: Verify HTML structure in browser**

Open `index.html` via `python3 serve.py` (or directly in browser). The landing page should show:
- Hero slider (unchanged)
- A white area below it where the map sketch will render (no "What's New" text)
- No JS errors in the console related to missing elements

---

### Task 2: Add CSS for the sketch map section

**Files:**
- Modify: `css/style.css` (append at end of file)

- [ ] **Step 1: Append sketch map styles to `css/style.css`**

Add at the very end of `css/style.css`:

```css
/* ============================================
   MAP SKETCH — Landing page preview
   ============================================ */

.map-sketch-section {
  position: relative;
  width: 100%;
  height: 70vh;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.map-sketch-label {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: #000;
  background: rgba(255,255,255,0.85);
  padding: 4px 10px;
  pointer-events: none;
}

#sketchMapContainer {
  width: 100%;
  height: 100%;
  filter: grayscale(1) contrast(1.3);
}

.map-sketch-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 24px;
  pointer-events: all;
}

.map-sketch-cta {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #000;
  background: rgba(255,255,255,0.9);
  padding: 6px 14px;
  text-transform: uppercase;
  pointer-events: none;
}

@media (min-width: 768px) {
  .map-sketch-section {
    height: 500px;
  }
}
```

- [ ] **Step 2: Verify layout in browser**

Reload the page. The area below the hero should now be `70vh` tall on mobile / `500px` on desktop, white background (Leaflet not yet initialized). No layout breakage on other pages.

---

### Task 3: Add `initSketchMap()` to app.js

**Files:**
- Modify: `js/app.js` — insert function + call before closing `});` at line 1307

- [ ] **Step 1: Add `initSketchMap` function and call before the closing `});`**

In `js/app.js`, find the very last two lines of the file:

```js

});
```

Replace them with:

```js

  // ============================================
  // SKETCH MAP — Landing page preview
  // ============================================
  function initSketchMap() {
    if (typeof L === 'undefined') return;
    const container = document.getElementById('sketchMapContainer');
    if (!container) return;

    const sketchMap = L.map('sketchMapContainer', {
      center: [52.52, 13.405],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(sketchMap);

    spots.forEach(spot => {
      L.circleMarker([spot.lat, spot.lng], {
        radius: 5,
        fillColor: '#000',
        color: '#000',
        weight: 1,
        fillOpacity: 0.85,
        interactive: false,
      }).addTo(sketchMap);
    });
  }

  initSketchMap();

  // Click handler: sketch map → real map
  const sketchSection = document.getElementById('mapSketchSection');
  if (sketchSection) {
    sketchSection.addEventListener('click', () => navigateToPage('map'));
  }

});
```

- [ ] **Step 2: Verify sketch map renders**

Reload the page. The landing page should show:
- Hero slider
- B&W sketch map of Berlin with ~17 black dot markers
- "BERLIN · GALLERIES & MUSEUMS" label at top center
- "EXPLORE THE MAP →" label at bottom center

- [ ] **Step 3: Verify click navigation**

Click anywhere on the sketch map. Should trigger the globe intro animation and then open the real interactive Gallery Map page. Clicking back to the home page (footer nav) should show the sketch map still rendered.

- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css js/app.js
git commit -m "feat: replace landing page editorial section with B&W sketch map preview"
```

---

## Self-Review

**Spec coverage:**
- ✅ Remove "What's New" section → Task 1
- ✅ Add sketch map below hero → Tasks 1+2+3
- ✅ CartoDB tiles + grayscale CSS filter → Task 2+3
- ✅ All Leaflet interactions disabled → Task 3
- ✅ Gallery markers from `spots` array → Task 3
- ✅ Click navigates to real map → Task 3
- ✅ Label "BERLIN · GALLERIES & MUSEUMS" → Task 1+2
- ✅ "Explore the map →" overlay CTA → Task 1+2
- ✅ Mobile 70vh / desktop 500px height → Task 2

**Placeholder scan:** No TBDs or incomplete steps.

**Type consistency:** `initSketchMap`, `sketchMap`, `sketchSection`, `mapSketchSection`, `sketchMapContainer` — used consistently across all tasks.
