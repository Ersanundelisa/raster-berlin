# Gallery Card Expand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the fly-to-center expand mechanic so gallery cards pop to the viewport center when clicked.

**Architecture:** Extract the click handler from the dead `artCards.forEach` loop into a named `attachCardExpand(card)` function, then call it inside `buildGalleryCard` so every dynamically loaded card is wired at creation time.

**Tech Stack:** Vanilla JS, single file `js/app.js`, no build step, no test framework.

---

### Task 1: Extract `attachCardExpand` and remove dead loop

**Files:**
- Modify: `js/app.js:404-472`

This replaces the `artCards.forEach` block (lines 404–472) with a named function that can be called per-card. The logic inside is identical except the `flipEl.classList.remove('flipped')` line is removed (no flip needed).

- [ ] **Step 1: Replace `artCards.forEach` block with `attachCardExpand` function**

Find this block in `js/app.js` (lines 404–472):

```js
  artCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.art-card-maps-btn')) return;

      // Another card is open → collapse it, don't open this one immediately
      if (activeCard && activeCard !== card) {
        collapseActiveCard();
        return;
      }

      if (cardState === 0) {
        // ── State 0 → 1: fly to viewport center via portal ──
        const rect    = card.getBoundingClientRect();
        const targetW = Math.min(340, window.innerWidth * 0.85);
        const scale   = targetW / rect.width;
        const dx      = window.innerWidth  / 2 - (rect.left + rect.width  / 2);
        const dy      = window.innerHeight / 2 - (rect.top  + rect.height / 2);

        const scene  = card.querySelector('.art-card-scene');
        const flipEl = scene.querySelector('.art-card-flip');
        flipEl?.classList.remove('flipped');

        // Build portal at exact card position (will animate out from here)
        const port = document.createElement('div');
        port.className = 'art-card-portal';
        port.style.cssText = [
          `position:fixed`,
          `left:${rect.left}px`,
          `top:${rect.top}px`,
          `width:${rect.width}px`,
          `height:${rect.height}px`,
          `z-index:9997`,
          `cursor:pointer`,
          `transform-origin:center center`,
          `transform:translate(0,0) scale(1)`,
          `transition:none`,
        ].join(';');

        port.appendChild(scene);       // move (not clone) scene into portal
        document.body.appendChild(port);
        card.style.opacity       = '0';
        card.style.visibility    = 'hidden';
        card.style.pointerEvents = 'none';

        activeCard   = card;
        activePortal = port;
        cardState    = 1;

        port.offsetHeight; // force reflow before transition

        port.style.transition = 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1)';
        port.style.transform  = `translate(${dx}px, ${dy}px) scale(${scale})`;

        artBackdrop.classList.add('active');

        // Portal handles its own clicks (state 1 → 0)
        // Icon clicks (maps, instagram, website) are allowed through without collapsing.
        port.addEventListener('click', (pe) => {
          if (pe.target.closest('.art-card-maps-btn')) return;
          if (pe.target.closest('.art-card-social a')) return;
          pe.stopPropagation();
          if (cardState === 1) {
            collapseActiveCard();
          }
        });

      }
    });
  });
```

Replace it with:

```js
  function attachCardExpand(card) {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.art-card-maps-btn')) return;

      if (activeCard && activeCard !== card) {
        collapseActiveCard();
        return;
      }

      if (cardState === 0) {
        const rect    = card.getBoundingClientRect();
        const targetW = Math.min(340, window.innerWidth * 0.85);
        const scale   = targetW / rect.width;
        const dx      = window.innerWidth  / 2 - (rect.left + rect.width  / 2);
        const dy      = window.innerHeight / 2 - (rect.top  + rect.height / 2);

        const scene = card.querySelector('.art-card-scene');

        const port = document.createElement('div');
        port.className = 'art-card-portal';
        port.style.cssText = [
          `position:fixed`,
          `left:${rect.left}px`,
          `top:${rect.top}px`,
          `width:${rect.width}px`,
          `height:${rect.height}px`,
          `z-index:9997`,
          `cursor:pointer`,
          `transform-origin:center center`,
          `transform:translate(0,0) scale(1)`,
          `transition:none`,
        ].join(';');

        port.appendChild(scene);
        document.body.appendChild(port);
        card.style.opacity       = '0';
        card.style.visibility    = 'hidden';
        card.style.pointerEvents = 'none';

        activeCard   = card;
        activePortal = port;
        cardState    = 1;

        port.offsetHeight;

        port.style.transition = 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1)';
        port.style.transform  = `translate(${dx}px, ${dy}px) scale(${scale})`;

        artBackdrop.classList.add('active');

        port.addEventListener('click', (pe) => {
          if (pe.target.closest('.art-card-maps-btn')) return;
          if (pe.target.closest('.art-card-social a')) return;
          pe.stopPropagation();
          if (cardState === 1) {
            collapseActiveCard();
          }
        });
      }
    });
  }
```

Also remove the now-unused `artCards` declaration on line 365:
```js
  const artCards = document.querySelectorAll('.art-card');
```
Delete that line entirely.

- [ ] **Step 2: Verify the file still looks correct**

Confirm `collapseActiveCard`, `artBackdrop`, `activeCard`, `activePortal`, `cardState` are all declared above `attachCardExpand` in the same closure. They are at lines 367–399 — no change needed there.

---

### Task 2: Call `attachCardExpand` inside `buildGalleryCard`

**Files:**
- Modify: `js/app.js` — `buildGalleryCard` function (ends with `return article;` around line 1438)

- [ ] **Step 1: Add `attachCardExpand(article)` call before `return article`**

Find the end of `buildGalleryCard`:
```js
    return article;
  }
```

Replace with:
```js
    attachCardExpand(article);
    return article;
  }
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "feat: wire gallery card expand to dynamically loaded cards"
```

---

### Task 3: Verify in browser

- [ ] **Step 1: Open the site** (via local file or dev server)

- [ ] **Step 2: Confirm a gallery card flies to center on click**
  - Card scales up to center of viewport
  - Backdrop appears behind it
  - Other cards are dimmed

- [ ] **Step 3: Confirm collapse works**
  - Click the expanded card → flies back to original position
  - Click the backdrop → same result
  - Press Escape → same result

- [ ] **Step 4: Confirm icon links still work**
  - Click Instagram / website / maps icon on an expanded card → opens link without collapsing
