# CSV-Driven Gallery Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded gallery `<article>` blocks in `index.html` with cards dynamically generated from `Galeriverzeichnis.csv` via JavaScript.

**Architecture:** On `DOMContentLoaded`, `app.js` fetches `Galeriverzeichnis.csv`, parses each `;`-separated row, and calls `buildGalleryCard()` to generate article elements injected into `#galleries-grid`. The hardcoded cards are removed from `index.html`. Instagram/website icon links appear on the card front, right of the gallery name. All CSV text values are HTML-escaped before use in innerHTML.

**Tech Stack:** Vanilla JavaScript (fetch API), HTML, CSS — no build step required.

---

### Task 1: Add CSS for `.art-card-name-row` and `.art-card-social`

**Files:**
- Modify: `css/style.css` — append after the `.art-card-meta` block (line ~684)

- [ ] **Step 1: Add styles**

Open `css/style.css`. After the `.art-card-meta` block (around line 684), add:

```css
/* Gallery card — name row with social icons */
.art-card-name-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}
.art-card-social {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
  padding-top: 2px;
}
.art-card-social a {
  color: #aaa;
  line-height: 1;
  display: flex;
  align-items: center;
}
.art-card-social a:hover {
  color: #000;
}
```

---

### Task 2: Update `index.html` — remove hardcoded cards, add grid id

**Files:**
- Modify: `index.html` lines 283–392

- [ ] **Step 1: Replace the grid contents**

In `index.html`, find the line:
```html
    <div class="must-sees-grid reveal-stagger">
```
(line 283 — inside the `<section class="must-sees-section">` block)

Replace that line AND all `<article>` elements that follow it, up to and including the grid's closing `</div>` (line 392), with:

```html
    <div class="must-sees-grid reveal-stagger" id="galleries-grid"></div>
```

The `<section>` wrapper and `.must-sees-header` above it are untouched. Only the grid div and its contents change.

---

### Task 3: Add `loadGalleries()` and `buildGalleryCard()` to `app.js`

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Refactor `alternatingImages` setup into a reusable function**

Find the existing alternating images block (lines 26–37):

```js
  // Alternating images for art cards — store IDs so they can be cleared
  let altImgIntervals = [];
  const alternatingImages = document.querySelectorAll('.alternating-img');
  alternatingImages.forEach(img => {
    const images = JSON.parse(img.dataset.images || '[]');
    if (images.length > 1) {
      let idx = 0;
      altImgIntervals.push(setInterval(() => {
        idx = (idx + 1) % images.length;
        img.src = images[idx];
      }, 1500));
    }
  });
```

Replace it with:

```js
  // Alternating images for art cards — store IDs so they can be cleared
  let altImgIntervals = [];

  function initAlternatingImages(root = document) {
    root.querySelectorAll('.alternating-img').forEach(img => {
      const images = JSON.parse(img.dataset.images || '[]');
      if (images.length > 1) {
        let idx = 0;
        altImgIntervals.push(setInterval(() => {
          idx = (idx + 1) % images.length;
          img.src = images[idx];
        }, 1500));
      }
    });
  }

  initAlternatingImages();
```

- [ ] **Step 2: Add `buildGalleryCard()` and `loadGalleries()` before the closing `});`**

At the very end of `app.js`, just before the final `});` line, add:

```js
  // ============================================
  // GALLERY CARDS — built from Galeriverzeichnis.csv
  // ============================================

  function esc(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildGalleryCard(name, address, hours, instagram, website, photo) {
    const photoPath = photo ? 'pics%20galleries/' + encodeURIComponent(photo) : '';

    const imgFront = photoPath
      ? `<img src="${photoPath}" alt="${esc(name)}" class="alternating-img" data-images='["${photoPath}"]' loading="lazy">`
      : '';

    const imgBack = photoPath
      ? `<img class="art-card-back-img" src="${photoPath}" alt="${esc(name)}">`
      : '';

    const instagramIcon = instagram
      ? `<a href="${esc(instagram)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" aria-label="Instagram">
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
           </svg>
         </a>`
      : '';

    const websiteIcon = website
      ? `<a href="${esc(website)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" aria-label="Website">
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
           </svg>
         </a>`
      : '';

    const socialDiv = (instagramIcon || websiteIcon)
      ? `<div class="art-card-social">${instagramIcon}${websiteIcon}</div>`
      : '';

    const mapsUrl = address
      ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name + ', ' + address)
      : '';

    const addressRow = address
      ? `<div class="art-card-info-rows">
           <div class="art-card-info-row">
             <span class="art-card-info-label">Adresse</span>
             <span class="art-card-info-val">${esc(address)}</span>
           </div>
         </div>
         <a class="art-card-maps-btn" href="${esc(mapsUrl)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
           <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>Google Maps
         </a>`
      : '';

    const hoursHtml = hours
      ? `<div class="art-card-back-desc">${esc(hours)}</div>`
      : '';

    const article = document.createElement('article');
    article.className = 'art-card';
    article.dataset.dish = name;
    article.dataset.restaurant = name;
    article.dataset.desc = hours;
    article.dataset.address = address;
    article.dataset.img = photoPath;
    article.dataset.img2 = photoPath;

    article.innerHTML = `
      <div class="art-card-scene"><div class="art-card-shell"><div class="art-card-flip">
        <div class="art-card-face art-card-front">
          <div class="art-card-shine"></div>
          <div class="art-card-img-wrap">${imgFront}</div>
          <div class="art-card-body">
            <div class="art-card-name-row">
              <h3 class="art-card-dish">${esc(name)}</h3>
              ${socialDiv}
            </div>
            <p class="art-card-restaurant">Galerie</p>
            <div class="art-card-meta"></div>
          </div>
        </div>
        <div class="art-card-face art-card-back">
          <div class="art-card-shine"></div>
          ${imgBack}
          <div class="art-card-back-overlay">
            <div class="art-card-back-restaurant">${esc(name)}</div>
            <hr class="art-card-divider art-card-divider-dark">
            ${hoursHtml}
            ${addressRow}
          </div>
        </div>
      </div></div></div>`;

    return article;
  }

  function loadGalleries() {
    const grid = document.getElementById('galleries-grid');
    if (!grid) return;

    fetch('Galeriverzeichnis.csv')
      .then(res => {
        if (!res.ok) throw new Error('CSV fetch failed: ' + res.status);
        return res.text();
      })
      .then(text => {
        const rows = text.trim().split('\n');
        // Skip header row (index 0)
        rows.slice(1).forEach(row => {
          const cols = row.split(';');
          // cols[0] = empty, [1] = Name, [2] = Address, [3] = Contact,
          // [4] = Opening Hours, [5] = Instagram, [6] = Website, [7] = Photo
          const name      = (cols[1] || '').trim();
          if (!name) return;
          const address   = (cols[2] || '').trim();
          const hours     = (cols[4] || '').trim();
          const instagram = (cols[5] || '').trim();
          const website   = (cols[6] || '').trim();
          const photo     = (cols[7] || '').trim();
          grid.appendChild(buildGalleryCard(name, address, hours, instagram, website, photo));
        });
        initAlternatingImages(grid);
      })
      .catch(err => console.warn('Gallery load failed:', err));
  }

  loadGalleries();
```

- [ ] **Step 3: Verify**

Reload the page via `python3 serve.py`. Check:
- All galleries from the CSV appear as cards
- Schinkel Pavillon is gone
- Galerie Judin shows Instagram + website icons on the front face
- Cards flip correctly showing address and opening hours on the back
- Google Maps button works

- [ ] **Step 4: Commit**

```bash
git add index.html js/app.js css/style.css
git commit -m "feat: generate gallery cards dynamically from Galeriverzeichnis.csv"
```

---

## Self-Review

**Spec coverage:**
- ✅ CSV as single source of truth — `loadGalleries()` fetches and parses it
- ✅ Hardcoded cards removed, grid container has `id="galleries-grid"`
- ✅ Card structure mirrors existing HTML exactly
- ✅ Instagram + website icons on card front, right of name, only when column is filled
- ✅ Photos from `pics galleries/` via Photo column, URL-encoded
- ✅ Google Maps button on back only when address is present
- ✅ `fetch()` failure logged as console warning, grid stays empty
- ✅ Rows with no Name silently skipped
- ✅ `initAlternatingImages(grid)` called after cards are injected
- ✅ All CSV text values passed through `esc()` before use in innerHTML

**Placeholder scan:** None found.

**Type consistency:** `buildGalleryCard(name, address, hours, instagram, website, photo)` — same 6-param signature at definition and call site in `loadGalleries()`. `initAlternatingImages(root)` defined in Task 3 Step 1, called with no arg (uses `document` default) on page load, and with `grid` element after gallery inject.
