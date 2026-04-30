# Artist Cards with Swipeable Photos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the Artists page with photo cards from `Artistsverzeichnis.csv`, each supporting left/right touch swipe to cycle photos, dot indicators, and icon links for website and Instagram.

**Architecture:** Lazy-load the CSV via `fetch()` on first Artists page visit. Build cards with the existing `mk()` helper. Attach swipe logic per card via touch events. Wire the existing alphabet filter buttons to show/hide cards by `data-letter`. SVG icons reuse the `SVG_INSTAGRAM` and `SVG_GLOBE` constants already defined in `buildGalleryCard`.

**Tech Stack:** Vanilla JS, CSS custom properties (existing design tokens), semicolon-delimited CSV.

---

### Task 1: Replace HTML placeholder with grid container

**Files:**
- Modify: `index.html` (around line 402)

- [ ] **Step 1: Replace the empty-state paragraph**

Find:
```html
        <div class="artists-list" id="artistsList">
          <p class="artists-empty">No artists listed yet.</p>
        </div>
```
Replace with:
```html
        <div class="artists-list" id="artistsList">
          <div id="artistsGrid" class="artists-grid"></div>
        </div>
```

- [ ] **Step 2: Commit**
```bash
git add index.html
git commit -m "feat: add artists grid container"
```

---

### Task 2: Add artist card CSS

**Files:**
- Modify: `css/style.css` — append after `.artists-item-gallery` block (after line 4325)

- [ ] **Step 1: Append styles to `css/style.css` after the `.artists-item-gallery` rule**

```css
/* Artist Cards Grid */
.artists-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 8px;
}

.artist-card {
  cursor: pointer;
  border-radius: 2px;
  overflow: hidden;
  background: var(--gray-50, #f8f8f8);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.artist-card-photos {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: var(--gray-100);
}

.artist-card-photos img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.artist-card-dots {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 5px;
}

.artist-card-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: background 0.15s;
}

.artist-card-dot.active {
  background: #fff;
}

.artist-card-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 6px 10px;
  gap: 6px;
}

.artist-card-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--black);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.artist-card-icons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.artist-card-icons a {
  color: var(--gray-400);
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: color 0.15s;
}

.artist-card-icons a:hover {
  color: var(--black);
}
```

- [ ] **Step 2: Commit**
```bash
git add css/style.css
git commit -m "feat: add artist card CSS"
```

---

### Task 3: Add artist card builder and CSV loader

**Files:**
- Modify: `js/app.js` — insert before the final closing `});` at line 1466

**Note:** `SVG_GLOBE` and `SVG_INSTAGRAM` are already declared inside `buildGalleryCard` on lines 1304–1305. Move these two `const` declarations to the top of the `loadGalleries` section (before `buildGalleryCard`) so they are accessible to `buildArtistCard` as well.

- [ ] **Step 1: Hoist SVG constants**

Find in `js/app.js` (inside `buildGalleryCard`):
```js
  const SVG_INSTAGRAM = '<svg width="13" ...>';
  const SVG_GLOBE     = '<svg width="13" ...>';
```
Move both `const` lines to just before `function buildGalleryCard(...)` so they are in the outer `DOMContentLoaded` scope, accessible to `buildArtistCard`.

- [ ] **Step 2: Add artist functions before the final `});`**

Insert the following block just before the closing `});` at the end of `app.js`:

```js
  // ============================================
  // ARTIST CARDS
  // ============================================
  let artistsLoaded = false;

  function buildArtistCard(name, website, instagram, photos) {
    const card = mk('div', 'artist-card');
    card.dataset.letter = name.trim()[0].toUpperCase();

    const photoWrap = card.appendChild(mk('div', 'artist-card-photos'));
    const img = photoWrap.appendChild(mk('img'));
    img.src = 'Artists%20Photos/' + encodeURIComponent(photos[0]);
    img.alt = name;
    img.loading = 'lazy';

    let dotsEls = [];
    if (photos.length > 1) {
      const dotsWrap = photoWrap.appendChild(mk('div', 'artist-card-dots'));
      photos.forEach((_, i) => {
        const dot = dotsWrap.appendChild(mk('span', i === 0 ? 'artist-card-dot active' : 'artist-card-dot'));
        dotsEls.push(dot);
      });
    }

    let currentIdx = 0;
    function showPhoto(idx) {
      currentIdx = (idx + photos.length) % photos.length;
      img.src = 'Artists%20Photos/' + encodeURIComponent(photos[currentIdx]);
      dotsEls.forEach((d, i) => d.classList.toggle('active', i === currentIdx));
    }

    if (photos.length > 1) {
      let touchStartX = 0;
      let touchStartY = 0;
      let didSwipe = false;
      photoWrap.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        didSwipe = false;
      }, { passive: true });
      photoWrap.addEventListener('touchmove', e => {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) didSwipe = true;
      }, { passive: true });
      photoWrap.addEventListener('touchend', e => {
        if (!didSwipe) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 30) return;
        showPhoto(dx < 0 ? currentIdx + 1 : currentIdx - 1);
      });
    }

    const info = card.appendChild(mk('div', 'artist-card-info'));
    const nameEl = info.appendChild(mk('span', 'artist-card-name'));
    nameEl.textContent = name;

    const iconsRow = info.appendChild(mk('div', 'artist-card-icons'));
    if (website) {
      const a = iconsRow.appendChild(mk('a'));
      a.href = website;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', 'Website');
      a.addEventListener('click', e => e.stopPropagation());
      a.innerHTML = SVG_GLOBE;
    }
    if (instagram) {
      const a = iconsRow.appendChild(mk('a'));
      a.href = instagram;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', 'Instagram');
      a.addEventListener('click', e => e.stopPropagation());
      a.innerHTML = SVG_INSTAGRAM;
    }

    card.addEventListener('click', () => {
      const url = website || instagram;
      if (url) window.open(url, '_blank', 'noopener');
    });

    return card;
  }

  function loadArtists() {
    const grid = document.getElementById('artistsGrid');
    if (!grid) return;
    fetch('Artistsverzeichnis.csv')
      .then(res => {
        if (!res.ok) throw new Error('CSV fetch failed: ' + res.status);
        return res.text();
      })
      .then(text => {
        const rows = text.trim().split('\n');
        rows.slice(1).forEach(row => {
          const cols = row.split(';');
          const name      = (cols[1] || '').trim();
          if (!name) return;
          const website   = (cols[2] || '').trim();
          const instagram = (cols[3] || '').trim();
          const photos    = [cols[4], cols[5], cols[6], cols[7]]
            .map(p => (p || '').trim())
            .filter(Boolean);
          if (!photos.length) return;
          grid.appendChild(buildArtistCard(name, website, instagram, photos));
        });
        initArtistsAlphaFilter();
      })
      .catch(err => console.warn('Artists load failed:', err));
  }

  function maybeLoadArtists() {
    if (!artistsLoaded) {
      artistsLoaded = true;
      loadArtists();
    }
  }

  function initArtistsAlphaFilter() {
    const btns = document.querySelectorAll('.artists-alpha-btn');
    const grid = document.getElementById('artistsGrid');
    if (!btns.length || !grid) return;
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const letter = btn.dataset.letter;
        grid.querySelectorAll('.artist-card').forEach(card => {
          card.style.display = (letter === 'all' || card.dataset.letter === letter) ? '' : 'none';
        });
      });
    });
  }
```

- [ ] **Step 3: Commit**
```bash
git add js/app.js
git commit -m "feat: add buildArtistCard, loadArtists, alpha filter"
```

---

### Task 4: Wire lazy-load into page navigation

**Files:**
- Modify: `js/app.js` — inside `navigateToPage()` around line 1133

- [ ] **Step 1: Add `maybeLoadArtists()` call**

Find:
```js
        // Lazy-load gallery cards on first visit
        if (pageName === 'musts') {
          maybeLoadGalleries();
        }
```
Add immediately after:
```js
        if (pageName === 'artists') {
          maybeLoadArtists();
        }
```

- [ ] **Step 2: Commit**
```bash
git add js/app.js
git commit -m "feat: lazy-load artists on page visit"
```

---

### Task 5: Smoke test and push

- [ ] **Step 1: Start local server**
```bash
python3 serve.py
```
Open `http://localhost:8000`. Navigate to **Artists**. Verify:
- Cards appear for Irving Ramo and Sungmi Kim
- Photos load
- Swipe (or DevTools touch emulation) cycles photos and dots update
- Globe and Instagram icons open correct URLs in new tab
- Tapping the card opens the website
- Alphabet filter **I** shows only Irving Ramo, **S** only Sungmi Kim, **All** shows both

- [ ] **Step 2: Push**
```bash
git push
```
