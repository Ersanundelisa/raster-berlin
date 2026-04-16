/* ============================================
   EAT THIS — Interactions & Animations
   ============================================ */

// Lock to portrait mode on mobile
if (window.innerWidth <= 767 && screen.orientation?.lock) {
  screen.orientation.lock('portrait').catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // BODY OVERFLOW MANAGER
  // Prevents scroll-state conflicts when multiple modals are used
  // ============================================
  const bodyOverflow = (() => {
    let count = 0;
    return {
      lock()   { count++; document.body.style.overflow = 'hidden'; },
      unlock() { count = Math.max(0, count - 1); if (!count) document.body.style.overflow = ''; }
    };
  })();
  window.bodyOverflow = bodyOverflow;

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

  // ============================================
  // HERO SLIDER
  // ============================================
  const heroSlides = document.querySelectorAll('.hero-slide');
  let heroInterval = null;
  let currentSlide = 0;
  const slideInterval = 800;

  function nextSlide() {
    if (!heroSlides.length) return;
    heroSlides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % heroSlides.length;
    heroSlides[currentSlide].classList.add('active');
  }

  if (heroSlides.length > 0) {
    heroInterval = setInterval(nextSlide, slideInterval);
  }

  // Hero slide → gallery card navigation
  heroSlides.forEach(slide => {
    const dish = slide.dataset.linkDish;
    const restaurant = slide.dataset.linkRestaurant;
    if (!dish) return;
    slide.addEventListener('click', () => {
      navigateToPage('musts');
      setTimeout(() => {
        const card = Array.from(document.querySelectorAll('.art-card')).find(
          c => c.dataset.dish === dish && c.dataset.restaurant === restaurant
        );
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.click();
        }
      }, 400);
    });
  });

  // ============================================
  // NOTIFICATIONS
  // ============================================
  function showNotification(message, duration = 3000) {
    let notification = document.querySelector('.notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification';
      document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, duration);
  }
  window.showNotification = showNotification;

  // Add notification styles
  const notificationStyle = document.createElement('style');
  notificationStyle.textContent = `
    .notification {
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: var(--black);
      color: var(--white);
      padding: 14px 24px;
      border-radius: 100px;
      font-size: 0.9rem;
      font-weight: 500;
      z-index: 10000;
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: none;
    }
    .notification.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;
  document.head.appendChild(notificationStyle);
  
  // ============================================
  // SEARCH
  // ============================================
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchClose = document.getElementById('searchClose');
  const searchTrigger = document.getElementById('searchTrigger');

  const mustEatsData = [];

  const newsData = Array.from(document.querySelectorAll('.news-card')).map(card => ({
    title: card.dataset.title || '',
    category: card.dataset.categoryLabel || '',
    date: card.dataset.date || '',
    img: card.dataset.img || '',
    type: 'news'
  }));

  function openSearch() {
    if (searchOverlay) {
      searchOverlay.classList.add('active');
      bodyOverflow.lock();
      // On desktop focus immediately; on mobile wait for slide-up animation
      // to finish before focusing so the iOS keyboard doesn't hide the sheet
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, window.innerWidth > 767 ? 100 : 400);
    }
  }

  function closeSearch() {
    if (searchOverlay) {
      searchOverlay.classList.remove('active');
      bodyOverflow.unlock();
      if (searchInput) searchInput.value = '';
      if (searchResults) {
        searchResults.innerHTML = '<div class="search-hint">Tippe um zu suchen...</div>';
      }
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function search(query) {
    const q = query.toLowerCase().trim();

    if (!q) {
      searchResults.innerHTML = '<div class="search-hint">Tippe um zu suchen...</div>';
      return;
    }

    const results = [];
    const queryWords = q.split(' ').filter(w => w.length > 1);

    mustEatsData.forEach(item => {
      const searchable = `${item.dish} ${item.restaurant} ${item.district}`.toLowerCase();
      const matchScore = queryWords.filter(word => searchable.includes(word)).length;
      if (matchScore === queryWords.length) {
        results.push({ ...item, matchScore });
      }
    });

    newsData.forEach(item => {
      const searchable = `${item.title} ${item.category} ${item.date}`.toLowerCase();
      const matchScore = queryWords.filter(word => searchable.includes(word)).length;
      if (matchScore === queryWords.length) {
        results.push({ ...item, matchScore });
      }
    });

    results.sort((a, b) => b.matchScore - a.matchScore);

    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="search-no-results">
          <p>Keine Ergebnisse für &ldquo;${escapeHtml(query)}&rdquo;</p>
          <span>Versuche einen anderen Suchbegriff</span>
        </div>
      `;
      return;
    }

    let html = '';
    const mustEatsResults = results.filter(r => r.type === 'must-see');
    const newsResults_arr = results.filter(r => r.type === 'news');

    if (mustEatsResults.length > 0) {
      html += '<div class="search-section-title">Must Eats</div>';
      mustEatsResults.slice(0, 5).forEach(item => {
        html += `
          <div class="search-result-item" data-type="must-see" data-dish="${escapeHtml(item.dish)}" data-restaurant="${escapeHtml(item.restaurant)}">
            <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.dish)}" class="search-result-img">
            <div class="search-result-content">
              <div class="search-result-dish">${escapeHtml(item.dish)}</div>
              <div class="search-result-restaurant">${escapeHtml(item.restaurant)} · ${escapeHtml(item.district)} · ${escapeHtml(item.price)}</div>
            </div>
          </div>
        `;
      });
    }

    if (newsResults_arr.length > 0) {
      html += '<div class="search-section-title">News</div>';
      newsResults_arr.slice(0, 3).forEach(item => {
        html += `
          <div class="search-result-item" data-type="news" data-title="${escapeHtml(item.title)}">
            <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.title)}" class="search-result-img">
            <div class="search-result-content">
              <div class="search-result-title">${escapeHtml(item.title)}</div>
              <div class="search-result-meta">${escapeHtml(item.category)} · ${escapeHtml(item.date)}</div>
            </div>
            <span class="search-result-type">News</span>
          </div>
        `;
      });
    }

    searchResults.innerHTML = html;

    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.type;
        if (type === 'must-see') {
          closeSearch();
          setTimeout(() => {
            navigateToPage('musts');
            window.location.hash = 'musts';
            setTimeout(() => {
              const dish = item.dataset.dish;
              const restaurant = item.dataset.restaurant;
              const card = Array.from(document.querySelectorAll('.art-card')).find(
                c => c.dataset.dish === dish && c.dataset.restaurant === restaurant
              );
              if (card) card.click();
            }, 400);
          }, 100);
        } else if (type === 'news') {
          closeSearch();
          setTimeout(() => {
            navigateToPage('news');
            window.location.hash = 'news';
            setTimeout(() => {
              const title = item.dataset.title;
              const article = Array.from(document.querySelectorAll('.news-featured, .news-card')).find(
                a => a.dataset.title === title
              );
              if (article) {
                const link = article.querySelector('a');
                if (link) link.click();
              }
            }, 500);
          }, 100);
        }
      });
    });
  }

  if (searchTrigger) {
    searchTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      openSearch();
    });
  }

  if (searchClose) {
    searchClose.addEventListener('click', closeSearch);
  }

  if (searchOverlay) {
    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) closeSearch();
    });
  }

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        search(e.target.value);
      }, 200);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSearch();
      closeCookieSettings();
      closeCookieInfoModal();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  // --- Navbar scroll state (disabled for app mode) ---
  const navbar = document.getElementById('navbar');

  function updateNavbar() {
    if (window.innerWidth > 767) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }, { passive: true });
    }
  }
  updateNavbar();

  // --- Anchor links for non-app navigation (desktop) ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      
      const targetPage = anchor.closest('.app-page');
      if (targetPage) return;
      
      if (window.innerWidth > 767) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = 80;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  });

  // --- 3D Retro Eat Card: expand → flip → collapse state machine ---
  // Uses a portal (fixed element on body) to escape the overflow:hidden parent.
  const artCards = document.querySelectorAll('.art-card');

  const artBackdrop = document.createElement('div');
  artBackdrop.className = 'art-card-backdrop';
  document.body.appendChild(artBackdrop);

  let activeCard   = null;   // card element currently expanded
  let activePortal = null;   // the fixed portal div on body
  let cardState    = 0;      // 0: idle, 1: expanded, 2: expanded+flipped

  function collapseActiveCard() {
    if (!activeCard || !activePortal) return;
    const card   = activeCard;
    const portal = activePortal;

    // Unflip
    portal.querySelector('.art-card-flip')?.classList.remove('flipped');

    // Animate portal back to its original fixed position (left/top set at expand time)
    portal.style.transition = 'transform 0.42s cubic-bezier(0.32, 0, 0.67, 0), box-shadow 0.42s ease';
    portal.style.transform  = 'translate(0, 0) scale(1)';
    portal.style.boxShadow  = '';

    artBackdrop.classList.remove('active');

    activeCard   = null;
    activePortal = null;
    cardState    = 0;

    setTimeout(() => {
      const scene = portal.querySelector('.art-card-scene');
      if (scene) card.appendChild(scene);
      card.style.opacity       = '';
      card.style.visibility    = '';
      card.style.pointerEvents = '';
      portal.remove();
    }, 440);
  }

  artBackdrop.addEventListener('click', collapseActiveCard);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') collapseActiveCard(); });

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

        // Portal handles its own clicks (state 1 → 2 → 0)
        port.addEventListener('click', (pe) => {
          if (pe.target.closest('.art-card-maps-btn')) return;
          pe.stopPropagation();
          if (cardState === 1) {
            cardState = 2;
            port.querySelector('.art-card-flip')?.classList.add('flipped');
            port.style.transition = 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1)';
            port.style.boxShadow = '';
          } else if (cardState === 2) {
            collapseActiveCard();
          }
        });

      }
    });
  });

  // --- Must Eat Modal (kept for other potential uses) ---
  const modal = document.getElementById('artModal');
  const modalClose = document.getElementById('modalClose');

  function closeModal() {
    modal.classList.remove('active');
    bodyOverflow.unlock();
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // --- Food Map (Leaflet) ---
  let foodMap = null;
  let mapInitialized = false;

  const spots = [
      { name: 'Galerie Judin', district: 'Tiergarten', type: 'Galerie', mustEat: 'Tuesday-Saturday 11:00-18:00', address: 'Potsdamer Strasse 83, 10785 Berlin', lat: 52.5063, lng: 13.3686 },
      { name: 'PACE', district: 'Schöneberg', type: 'Galerie', mustEat: 'Tuesday-Sunday 11:00-18:00', address: 'Bülowstraße 18, 10783 Berlin', lat: 52.4977, lng: 13.3614 },
      { name: 'Galerie Max Hetzler', district: 'Tiergarten', type: 'Galerie', mustEat: 'Tuesday-Saturday 11:00-18:00', address: 'Potsdamer Strasse 77-87, 10785 Berlin', lat: 52.5060, lng: 13.3683 },
      { name: 'Galerie Max Hetzler', district: 'Charlottenburg', type: 'Galerie', mustEat: 'Tuesday-Saturday 11:00-18:00', address: 'Bleibtreustr. 45, 10623 Berlin', lat: 52.5041, lng: 13.3200 },
      { name: 'Galerie Max Hetzler', district: 'Charlottenburg', type: 'Galerie', mustEat: 'Tuesday-Saturday 11:00-18:00', address: 'Goethestr. 2-3, 10623 Berlin', lat: 52.5067, lng: 13.3337 },
      { name: 'KÖNIG GALERIE', district: 'Kreuzberg', type: 'Galerie', mustEat: 'Tuesday-Sunday 11:00-18:00', address: 'Alexandrinenstr. 118-121, 10969 Berlin', lat: 52.4996, lng: 13.3968 },
      { name: 'Eigen + Art', district: 'Mitte', type: 'Galerie', mustEat: 'zeitgenössische Kunst', address: 'Berlin', lat: 52.5270, lng: 13.4016 },
      { name: 'Sprüth Magers', district: 'Mitte', type: 'Galerie', mustEat: 'zeitgenössische Kunst', address: 'Berlin', lat: 52.5276, lng: 13.3970 },
      { name: 'Esther Schipper', district: 'Tiergarten', type: 'Galerie', mustEat: 'Tuesday-Saturday 11:00-18:00', address: 'Potsdamer Strasse 81E, 10785 Berlin', lat: 52.5061, lng: 13.3681 },
      { name: 'Société', district: 'Wilmersdorf', type: 'Galerie', mustEat: 'Tuesday-Saturday 11:00-18:00', address: 'Wielandstr. 26, 10707 Berlin', lat: 52.5018, lng: 13.3301 },
      { name: 'Galerie Robert Grunenberg', district: 'Berlin', type: 'Galerie', mustEat: 'zeitgenössische Kunst', address: 'Berlin', lat: 52.5200, lng: 13.4050 },
      { name: 'Galerie Michael Werner', district: 'Berlin', type: 'Galerie', mustEat: 'zeitgenössische Kunst', address: 'Berlin', lat: 52.5195, lng: 13.4044 },
      { name: 'KORNFELD Galerie Berlin', district: 'Charlottenburg', type: 'Galerie', mustEat: 'Tuesday-Saturday 11:00-18:00', address: 'Fasanenstr. 26, 10719 Berlin', lat: 52.5017, lng: 13.3250 },
      { name: 'Kristin Hjellegjerde Gallery', district: 'Tiergarten', type: 'Galerie', mustEat: 'zeitgenössische Kunst', address: 'Potsdamer Strasse 77-87, 10785 Berlin', lat: 52.5058, lng: 13.3680 },
      { name: 'Galerie Neu', district: 'Mitte', type: 'Galerie', mustEat: 'zeitgenössische Kunst', address: 'Linienstr. 119, 10115 Berlin', lat: 52.5282, lng: 13.3980 },
      { name: "KLEMM'S", district: 'Mitte', type: 'Galerie', mustEat: 'Wednesday-Saturday 12:00-18:00', address: 'Leipziger Str. 57-58, 10117 Berlin', lat: 52.5084, lng: 13.3850 },
      { name: 'Schlachter 151', district: 'Berlin', type: 'Galerie', mustEat: 'zeitgenössische Kunst', address: 'Berlin', lat: 52.5100, lng: 13.4100 },
    ];

  let globeShown = false;

  function showGlobeIntro(onComplete) {
    if (typeof THREE === 'undefined' || globeShown) { onComplete(); return; }
    globeShown = true;

    const mapEl = document.getElementById('foodMap');
    if (!mapEl) { onComplete(); return; }

    const w = window.innerWidth || 390;
    const h = window.innerHeight || 520;

    // Overlay — space background
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;z-index:500;background:#000000;overflow:hidden;cursor:pointer';

    const glCanvas = document.createElement('canvas');
    overlay.appendChild(glCanvas);

    const pulseStyle = document.createElement('style');
    pulseStyle.textContent = `
      @keyframes globeMeteor1 {
        0%   { transform:translate(0,0) rotate(-42deg); opacity:0; }
        4%   { opacity:1; }
        20%  { opacity:0.85; }
        28%  { opacity:0; }
        100% { transform:translate(-520px,380px) rotate(-42deg); opacity:0; }
      }
      @keyframes globeMeteor2 {
        0%   { transform:translate(0,0) rotate(-38deg); opacity:0; }
        5%   { opacity:0.8; }
        24%  { opacity:0.7; }
        32%  { opacity:0; }
        100% { transform:translate(-380px,280px) rotate(-38deg); opacity:0; }
      }
      @keyframes globeMeteor3 {
        0%   { transform:translate(0,0) rotate(-45deg); opacity:0; }
        3%   { opacity:0.9; }
        16%  { opacity:0.8; }
        22%  { opacity:0; }
        100% { transform:translate(-300px,220px) rotate(-45deg); opacity:0; }
      }
    `;
    document.head.appendChild(pulseStyle);

    // Meteors — moving across the globe overlay
    [
      { top:'8%',  left:'82%', w:'130px', h:'2px',   delay:'0.8s', dur:'7s',  anim:'globeMeteor1' },
      { top:'22%', left:'90%', w:'85px',  h:'1.5px', delay:'4s',   dur:'9s',  anim:'globeMeteor2' },
      { top:'58%', left:'76%', w:'65px',  h:'1.5px', delay:'2.5s', dur:'11s', anim:'globeMeteor3' },
    ].forEach(m => {
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;top:${m.top};left:${m.left};width:${m.w};height:${m.h};border-radius:2px;background:linear-gradient(90deg,rgba(255,255,255,0.95),rgba(255,255,255,0));opacity:0;pointer-events:none;animation:${m.anim} ${m.dur} linear ${m.delay} infinite;`;
      overlay.appendChild(el);
    });




    // Hide location button, zoom control and filters during globe; expand foodMap to full screen
    mapEl.classList.add('globe-active');
    mapEl.style.cssText = 'position:fixed;inset:0;z-index:9990;width:100%!important;height:100%!important;min-height:0!important';
    const mapPage = document.querySelector('.app-page[data-page="map"]');
    if (mapPage) mapPage.classList.add('globe-active');
    const locBtn = document.getElementById('mapLocationBtnFixed');
    if (locBtn) locBtn.style.display = 'none';
    const zoomCtrl = document.querySelector('.leaflet-control-zoom');
    if (zoomCtrl) zoomCtrl.style.display = 'none';

    mapEl.appendChild(overlay);

    const aspect = w / h;
    // Portrait (mobile): keep globe just inside horizontal FOV
    // Landscape (desktop/tablet): bring globe much closer to fill screen height
    const globeStartZ = aspect >= 1 ? 5.5 : 6.8;
    const globeEndZ   = aspect >= 1 ? 2.5 : 2.5;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 1000);
    camera.position.z = globeStartZ;

    const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000);

    // Globe sphere — Lambert material + satellite texture
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshLambertMaterial({ color: 0x2266aa });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globe.rotation.x = 0.3;
    scene.add(globe);

    // Stars — random points in space
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(18000);
    for (let i = 0; i < 18000; i += 3) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 70 + Math.random() * 30;
      starPos[i]   = r * Math.sin(phi) * Math.cos(theta);
      starPos[i+1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i+2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.22 })));

    // Subtle lighting — no harsh highlights, just enough for depth
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xfff0e0, 0.8);
    sun.position.set(5, 2, 4);
    scene.add(sun);

    // Load NASA Blue Marble satellite texture
    new THREE.TextureLoader().load(
      'pics/globe.webp',
      tex => { globeMat.map = tex; globeMat.color.set(0xffffff); globeMat.needsUpdate = true; }
    );

    let phase = 'idle';
    let phaseStart = null;
    let rotY = 0;
    let animFrame;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function easeOut3(t) { return 1 - Math.pow(1 - t, 3); }
    function easeOut5(t) { return 1 - Math.pow(1 - t, 5); }
    function shortestDelta(from, to) {
      let d = ((to - from) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      if (d > Math.PI) d -= 2 * Math.PI;
      return d;
    }

    let alignStartY, alignTargetY, alignStartX, userLat, userLng;

    function startZoom() {
      if (phase !== 'idle') return;
      phase = 'zoom';
      phaseStart = Date.now();

      const targetLng = (userLng !== undefined ? userLng : 13.4) * Math.PI / 180;
      const targetLat = (userLat !== undefined ? userLat : 52.5) * Math.PI / 180;

      alignStartY = rotY;
      // Three.js SphereGeometry UV offset: front at rotY=0 shows lng -90°W.
      // To show longitude L: rotY = -(π/2 + L_rad)
      alignTargetY = rotY + shortestDelta(rotY, -(Math.PI / 2 + targetLng));
      alignStartX = globe.rotation.x;
      // Positive rotX tilts north pole toward camera → shows northern latitudes
      globe._targetX = targetLat;

      setTimeout(() => { if (typeof initFoodMap === 'function') initFoodMap(); }, 50);
    }

    overlay.addEventListener('click', startZoom);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { userLat = pos.coords.latitude; userLng = pos.coords.longitude; },
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
      );
    }

    function tick() {
      animFrame = requestAnimationFrame(tick);

      if (phase === 'idle') {
        rotY += 0.004;
        globe.rotation.y = rotY;
      } else if (phase === 'zoom') {
        const duration = 1800;
        const p = Math.min((Date.now() - phaseStart) / duration, 1);
        globe.rotation.y = lerp(alignStartY, alignTargetY, easeOut5(p));
        globe.rotation.x = lerp(alignStartX, globe._targetX || 0.3, easeOut5(p));
        rotY = globe.rotation.y;
        // Zoom in close to globe surface (responsive start/end)
        camera.position.z = globeStartZ - easeOut3(p) * (globeStartZ - globeEndZ);
        if (p >= 1) { phase = 'fade'; phaseStart = Date.now(); }
      } else if (phase === 'fade') {
        const p = Math.min((Date.now() - phaseStart) / 700, 1);
        overlay.style.opacity = String(1 - p);
        if (p >= 1) {
          cancelAnimationFrame(animFrame);
          overlay.remove();
          pulseStyle.remove();
          renderer.dispose();
          mapEl.classList.remove('globe-active');
          mapEl.style.cssText = '';
          if (mapPage) mapPage.classList.remove('globe-active');
          if (locBtn) locBtn.style.display = '';
          if (zoomCtrl) zoomCtrl.style.display = '';
          onComplete();
          return;
        }
      }
      renderer.render(scene, camera);
    }
    tick();
  }

  function initFoodMap() {
    if (mapInitialized || typeof L === 'undefined') return;
    const mapEl = document.getElementById('foodMap');
    if (!mapEl) return;

    // Ensure the container is visible and has dimensions before initializing
    const rect = mapEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setTimeout(initFoodMap, 100);
      return;
    }

    try {
      foodMap = L.map('foodMap', {
        zoomControl: false,
        attributionControl: false,
      }).setView([52.5050, 13.4100], 11);
    } catch (e) {
      showNotification('Karte konnte nicht geladen werden');
      return;
    }
    mapInitialized = true;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
    }).addTo(foodMap);

    L.control.zoom({ position: 'bottomright' }).addTo(foodMap);

    // User location
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: '<div class="user-location-dot"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const logoIcon = L.divIcon({
      className: '',
      html: '<div style="width:10px;height:10px;background:#111;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });

    // Try to get user location
    const defaultCenter = [52.52, 13.405];
    let locationFound = false;
    let userMarker = null;
    
    function setDefaultView() {
      if (!locationFound) {
        foodMap.setView(defaultCenter, 13);
      }
    }
    
    // Set default view after 3 seconds as fallback
    setTimeout(setDefaultView, 3000);
    
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            locationFound = true;
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            // Check if location is in Berlin area (rough check)
            if (userLat > 52.3 && userLat < 52.7 && userLng > 13.1 && userLng < 13.8) {
              userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(foodMap);
              foodMap.setView([userLat, userLng], 13, { animate: true });
            } else {
              // User is outside Berlin, show Berlin anyway
              setDefaultView();
            }
          },
          () => {
            setDefaultView();
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      } else {
        setDefaultView();
      }
    } catch (e) {
      setDefaultView();
    }

    const markers = [];
    const mapSpotOverlay = document.getElementById('mapSpotOverlay');
    const mapSpotContent = document.getElementById('mapSpotContent');
    const mapSpotClose = document.getElementById('mapSpotClose');

    function getSpotPhoto(spot) {
      const map = {
        'Galerie Judin': 'pics/Galerie Judin.jpg',
        'PACE': 'pics/PACE.webp',
        'KÖNIG GALERIE': 'pics/König Galerie.webp',
        'Eigen + Art': 'pics/Eigen + Art.jpg',
        'Sprüth Magers': 'pics/Sprüth Magers.webp',
        'Esther Schipper': 'pics/Esther Shipper.webp',
        'Société': 'pics/Societe.jpg',
        'Galerie Michael Werner': 'pics/Galerie Werner Michael.jpg',
      };
      // For Max Hetzler, differentiate by address
      if (spot.name === 'Galerie Max Hetzler') {
        if (spot.address && spot.address.includes('Bleibtreustr')) return 'pics/Hetzler Bleibtreustr.jpg';
        if (spot.address && spot.address.includes('Goethestr')) return 'pics/hetzler Goethestr.jpg';
        return 'pics/Hetzler Potsdamer.jpg';
      }
      return map[spot.name] || 'https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=400&q=80';
    }

    function getSpotCategory(type) {
      const t = type.toLowerCase();
      if (t.includes('café') || t.includes('cafe') || t.includes('coffee') || t.includes('kaffee') || t.includes('tee &') || t === 'pflanzliches café') return 'café';
      if (t.includes('bäckerei') || t === 'frühstück' || t.includes('brunch') || t === 'donuts') return 'breakfast';
      if (t === 'burger') return 'fastfood';
      if (t === 'lunch') return 'lunch';
      return 'dinner';
    }

    function showSpotDetail(spot) {
      const mapsUrl = spot.lat && spot.lng
        ? 'https://www.google.com/maps/dir/?api=1&destination=' + spot.lat + ',' + spot.lng + '&destination_place_id=' + encodeURIComponent(spot.name)
        : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(spot.name + ', ' + spot.address);
      const photo = getSpotPhoto(spot);

      const card = document.getElementById('mapSpotCard');
      mapSpotContent.innerHTML = '';

      const img = document.createElement('img');
      img.src = photo;
      img.className = 'map-spot-photo';
      img.alt = spot.name;
      img.loading = 'lazy';

      const body = document.createElement('div');
      body.className = 'map-spot-body';

      const header = document.createElement('div');
      header.className = 'map-spot-header';
      const districtSpan = document.createElement('span');
      districtSpan.className = 'map-spot-district';
      districtSpan.textContent = spot.district;
      const typeSpan = document.createElement('span');
      typeSpan.className = 'map-spot-type';
      typeSpan.textContent = spot.type;
      header.appendChild(districtSpan);
      header.appendChild(typeSpan);

      const name = document.createElement('h3');
      name.className = 'map-spot-name';
      name.textContent = spot.name;

      const mustsee = document.createElement('div');
      mustsee.className = 'map-spot-mustsee';
      const label = document.createElement('span');
      label.className = 'map-spot-label';
      label.textContent = 'See: ';
      mustsee.appendChild(label);
      mustsee.appendChild(document.createTextNode(spot.mustEat));

      const address = document.createElement('div');
      address.className = 'map-spot-address';
      address.textContent = spot.address;

      const btn = document.createElement('a');
      btn.href = mapsUrl;
      btn.target = '_blank';
      btn.rel = 'noopener';
      btn.className = 'map-spot-btn';
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="flex-shrink:0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>In Google Maps öffnen';

      body.appendChild(header);
      body.appendChild(name);
      body.appendChild(mustsee);
      body.appendChild(address);
      body.appendChild(btn);

      mapSpotContent.appendChild(img);
      mapSpotContent.appendChild(body);

      mapSpotOverlay.classList.add('active');
      bodyOverflow.lock();
    }

    function hideSpotDetail() {
      mapSpotOverlay.classList.remove('active');
      bodyOverflow.unlock();
    }

    if (mapSpotClose) {
      mapSpotClose.addEventListener('click', hideSpotDetail);
    }
    
    if (mapSpotOverlay) {
      mapSpotOverlay.addEventListener('click', (e) => {
        if (e.target === mapSpotOverlay) {
          hideSpotDetail();
        }
      });
    }

    spots.forEach((spot, i) => {
      const marker = L.marker([spot.lat, spot.lng], { icon: logoIcon }).addTo(foodMap);
      marker.spotType = spot.type;
      marker.spotDistrict = spot.district;
      marker.spotData = spot;
      marker.on('click', () => {
        showSpotDetail(spot);
      });
      markers.push(marker);
    });
    
    // Close spot detail when clicking on map background
    const mapContainer = document.getElementById('foodMap');
    if (mapContainer) {
      mapContainer.addEventListener('click', (e) => {
        if (e.target === mapContainer || e.target.classList.contains('leaflet-pane') || e.target.classList.contains('leaflet-map-pane')) {
          hideSpotDetail();
        }
      });
    }

    // Filter functionality
    const filterBtns = document.querySelectorAll('.map-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        markers.forEach(marker => {
          const show = filter === 'all' || marker.spotType.toLowerCase() === filter;
          if (show) {
            marker.addTo(foodMap);
          } else {
            marker.remove();
          }
        });
      });
    });

    // Location button
    const mapLocationBtn = document.getElementById('mapLocationBtnFixed');
    
    if (mapLocationBtn) {
      mapLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
          showNotification('Geolocation wird von diesem Gerät nicht unterstützt');
          return;
        }
        
        mapLocationBtn.classList.add('loading');
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            mapLocationBtn.classList.remove('loading');
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            if (userMarker) {
              userMarker.setLatLng([userLat, userLng]);
            } else {
              userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(foodMap);
            }
            
            foodMap.setView([userLat, userLng], 14, { animate: true });
          },
          (error) => {
            mapLocationBtn.classList.remove('loading');
            let msg = 'Standort konnte nicht ermittelt werden';
            if (error.code === 1) {
              msg = 'Standortzugriff erlauben in den Einstellungen';
            } else if (error.code === 2) {
              msg = 'Standort nicht verfügbar';
            }
            showNotification(msg);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }

    setTimeout(() => foodMap.invalidateSize(), 100);
  }

  // --- News Article Modal ---
  const newsModal = document.getElementById('newsModal');
  const newsModalClose = document.getElementById('newsModalClose');
  const newsArticles = document.querySelectorAll('.news-featured, .news-card');
  let currentShareData = { title: '', text: '', url: window.location.href };

  function openNewsModal(article) {
    const title = article.dataset.title;
    const img = article.dataset.img;
    const category = article.dataset.categoryLabel;
    const date = article.dataset.date;
    const content = article.dataset.content;

    document.getElementById('newsModalImg').src = img;
    document.getElementById('newsModalImg').alt = title;
    document.getElementById('newsModalCategory').textContent = category;
    document.getElementById('newsModalTitle').textContent = title;
    document.getElementById('newsModalDate').textContent = date;
    document.getElementById('newsModalContent').innerHTML = content;

    currentShareData = {
      title: title,
      text: article.dataset.excerpt || title,
      url: window.location.href
    };

    newsModal.classList.add('active');
    bodyOverflow.lock();

    const modalInner = newsModal.querySelector('.news-modal');
    if (modalInner) modalInner.scrollTop = 0;
  }

  function closeNewsModal() {
    newsModal.classList.remove('active');
    bodyOverflow.unlock();
  }

  newsArticles.forEach(article => {
    const link = article.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openNewsModal(article);
      });
    }
  });

  if (newsModalClose) {
    newsModalClose.addEventListener('click', closeNewsModal);
  }

  if (newsModal) {
    newsModal.addEventListener('click', (e) => {
      if (e.target === newsModal) closeNewsModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNewsModal();
  });

  // --- Share Buttons ---
  const shareTwitter = document.getElementById('shareTwitter');
  const shareWhatsapp = document.getElementById('shareWhatsapp');
  const shareNative = document.getElementById('shareNative');

  if (shareTwitter) {
    shareTwitter.addEventListener('click', () => {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(currentShareData.title)}&url=${encodeURIComponent(currentShareData.url)}`;
      window.open(url, '_blank', 'noopener');
    });
  }

  if (shareWhatsapp) {
    shareWhatsapp.addEventListener('click', () => {
      const url = `https://wa.me/?text=${encodeURIComponent(currentShareData.title + ' ' + currentShareData.url)}`;
      window.open(url, '_blank', 'noopener');
    });
  }

  if (shareNative) {
    shareNative.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share(currentShareData);
        } catch (err) {
          // User cancelled or error
        }
      } else {
        navigator.clipboard.writeText(currentShareData.url);
      }
    });
  }

  // --- App Page Navigation ---
  let isMobile = window.innerWidth <= 767;
  const appFooter = document.getElementById('appFooter');
  const appPages = document.querySelectorAll('.app-page');
  const navbarBrand = document.querySelector('.navbar-brand');

  let currentPage = 'start';

  function navigateToPage(pageName) {
    if (pageName === currentPage) return;

    // Clear start-page intervals when leaving
    if (currentPage === 'start' && pageName !== 'start') {
      if (heroInterval) { clearInterval(heroInterval); heroInterval = null; }
      altImgIntervals.forEach(id => clearInterval(id));
      altImgIntervals = [];
    }

    // Restart hero slider when returning to start
    if (pageName === 'start' && heroSlides.length > 0 && !heroInterval) {
      heroInterval = setInterval(nextSlide, slideInterval);
    }
    
    const targetPage = document.querySelector(`.app-page[data-page="${pageName}"]`);
    if (!targetPage) return;
    
    appPages.forEach(page => {
      if (page.dataset.page === pageName) {
        page.classList.add('active');
        page.classList.remove('hidden');
        
        // Globe intro → then init map
        if (pageName === 'map') {
          showGlobeIntro(() => {
            // Called after globe fades (or immediately on repeat visits)
            if (typeof initFoodMap === 'function') initFoodMap();
            if (foodMap) {
              foodMap.invalidateSize();
              setTimeout(() => { if (foodMap) foodMap.invalidateSize(); }, 300);
            }
          });
        }
      } else {
        page.classList.remove('active');
        page.classList.add('hidden');
      }
    });

    const appFooterItems = document.querySelectorAll('.app-footer-item');
    appFooterItems.forEach(item => {
      item.classList.toggle('active', item.dataset.target === pageName);
    });

    currentPage = pageName;
  }

  if (appFooter && appPages.length) {
    const appFooterItems = document.querySelectorAll('.app-footer-item[data-target]');

    appFooterItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.dataset.target;
        navigateToPage(target);
        window.location.hash = target;
      });
    });

    if (navbarBrand) {
      navbarBrand.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToPage('start');
        window.location.hash = 'start';
      });
    }

    function checkHash() {
      const hash = window.location.hash.replace('#', '') || 'start';
      const validPages = ['start', 'news', 'musts', 'map'];
      if (validPages.includes(hash)) {
        navigateToPage(hash);
      }
    }

    window.addEventListener('hashchange', checkHash);
    checkHash();

    let resizeTimer;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        isMobile = window.innerWidth <= 767;
        navigateToPage(currentPage);
      }, 150);
    }

    window.addEventListener('resize', handleResize);
    handleResize();
    
  }

  // ============================================
  // MODAL FACTORY
  // Creates open/close for any modal with consistent bodyOverflow handling
  // ============================================
  function createModal(modalEl, opts = {}) {
    if (!modalEl) return { open: () => {}, close: () => {} };
    function open() { modalEl.classList.add('active'); bodyOverflow.lock(); }
    function close() { modalEl.classList.remove('active'); bodyOverflow.unlock(); }
    if (opts.closeBtn) opts.closeBtn.addEventListener('click', close);
    if (opts.backdrop) opts.backdrop.addEventListener('click', close);
    if (opts.trigger) opts.trigger.addEventListener('click', open);
    return { open, close };
  }

  // Burger Menu
  const burgerDrawer = document.getElementById('burgerDrawer');
  const burger = createModal(burgerDrawer, {
    trigger: document.getElementById('burgerBtn'),
    closeBtn: document.getElementById('burgerClose'),
    backdrop: document.getElementById('burgerBackdrop'),
  });
  function openBurger() { burger.open(); }
  function closeBurger() { burger.close(); }

  // Cookie Info Modal
  const cookieInfoModalEl = document.getElementById('cookieInfoModal');
  const cookieInfoModal = createModal(cookieInfoModalEl, {
    trigger: document.getElementById('cookieInfoTrigger'),
    closeBtn: document.getElementById('cookieInfoClose'),
    backdrop: document.getElementById('cookieInfoBackdrop'),
  });
  function closeCookieInfoModal() { cookieInfoModal.close(); }

  // AGB Modal
  const agbModal = createModal(document.getElementById('agbModal'), {
    trigger: document.getElementById('agbTrigger'),
    closeBtn: document.getElementById('agbClose'),
    backdrop: document.getElementById('agbBackdrop'),
  });
  const agbFromBurger = document.getElementById('openAgbFromBurger');
  if (agbFromBurger) agbFromBurger.addEventListener('click', () => { closeBurger(); agbModal.open(); });

  // Datenschutz Modal
  const datenschutzModal = createModal(document.getElementById('datenschutzModal'), {
    trigger: document.getElementById('datenschutzTrigger'),
    closeBtn: document.getElementById('datenschutzClose'),
    backdrop: document.getElementById('datenschutzBackdrop'),
  });
  const datenschutzFromBurger = document.getElementById('openDatenschutzFromBurger');
  if (datenschutzFromBurger) datenschutzFromBurger.addEventListener('click', () => { closeBurger(); datenschutzModal.open(); });

  // Info modals (about, contact, press, impressum) — opened from burger
  ['about', 'contact', 'press', 'impressum'].forEach(id => {
    const cap = id.charAt(0).toUpperCase() + id.slice(1);
    const m = createModal(document.getElementById(id + 'Modal'), {
      closeBtn: document.getElementById(id + 'Close'),
      backdrop: document.getElementById(id + 'Backdrop'),
    });
    const trigger = document.getElementById('open' + cap);
    if (trigger) trigger.addEventListener('click', () => { closeBurger(); m.open(); });
  });

  // Cookie Consent
  const cookieConsent = document.getElementById('cookieConsent');
  const cookieAccept = document.getElementById('cookieAccept');
  const cookieDecline = document.getElementById('cookieDecline');
  
  function closeCookieSettings() {
    if (cookieConsent) {
      cookieConsent.classList.remove('show');
    }
  }
  
  if (cookieConsent && !localStorage.getItem('cookieConsent')) {
    setTimeout(() => {
      cookieConsent.classList.add('show');
    }, 1000);
  }
  
  if (cookieAccept) {
    cookieAccept.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'accepted');
      closeCookieSettings();
    });
  }
  
  if (cookieDecline) {
    cookieDecline.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'declined');
      closeCookieSettings();
    });
  }

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

  // ============================================
  // GALLERY CARDS — built from Galeriverzeichnis.csv
  // ============================================

  const SVG_INSTAGRAM = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>';
  const SVG_GLOBE     = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>';
  const SVG_MAPS      = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  function mk(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  function buildGalleryCard(name, address, hours, instagram, website, photo) {
    const photoPath = photo ? 'pics%20galleries/' + encodeURIComponent(photo) : '';

    const article = mk('article', 'art-card');
    article.dataset.dish = name;
    article.dataset.restaurant = name;
    article.dataset.desc = hours;
    article.dataset.address = address;
    article.dataset.img = photoPath;
    article.dataset.img2 = photoPath;

    const flip = article
      .appendChild(mk('div', 'art-card-scene'))
      .appendChild(mk('div', 'art-card-shell'))
      .appendChild(mk('div', 'art-card-flip'));

    // ── FRONT ──
    const front = flip.appendChild(mk('div', 'art-card-face art-card-front'));
    front.appendChild(mk('div', 'art-card-shine'));

    const imgWrap = front.appendChild(mk('div', 'art-card-img-wrap'));
    if (photoPath) {
      const img = imgWrap.appendChild(mk('img'));
      img.src = photoPath;
      img.alt = name;
      img.className = 'alternating-img';
      img.dataset.images = JSON.stringify([photoPath]);
      img.loading = 'lazy';
    }

    const body = front.appendChild(mk('div', 'art-card-body'));
    const nameRow = body.appendChild(mk('div', 'art-card-name-row'));

    const h3 = nameRow.appendChild(mk('h3', 'art-card-dish'));
    h3.textContent = name;

    if (instagram || website) {
      const social = nameRow.appendChild(mk('div', 'art-card-social'));
      if (instagram) {
        const a = social.appendChild(mk('a'));
        a.href = instagram;
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', 'Instagram');
        a.addEventListener('click', e => e.stopPropagation());
        a.innerHTML = SVG_INSTAGRAM;
      }
      if (website) {
        const a = social.appendChild(mk('a'));
        a.href = website;
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', 'Website');
        a.addEventListener('click', e => e.stopPropagation());
        a.innerHTML = SVG_GLOBE;
      }
    }

    body.appendChild(mk('p', 'art-card-restaurant')).textContent = 'Galerie';
    body.appendChild(mk('div', 'art-card-meta'));

    // ── BACK ──
    const back = flip.appendChild(mk('div', 'art-card-face art-card-back'));
    back.appendChild(mk('div', 'art-card-shine'));

    if (photoPath) {
      const backImg = back.appendChild(mk('img', 'art-card-back-img'));
      backImg.src = photoPath;
      backImg.alt = name;
    }

    const overlay = back.appendChild(mk('div', 'art-card-back-overlay'));
    overlay.appendChild(mk('div', 'art-card-back-restaurant')).textContent = name;
    overlay.appendChild(mk('hr', 'art-card-divider art-card-divider-dark'));

    if (hours) {
      overlay.appendChild(mk('div', 'art-card-back-desc')).textContent = hours;
    }

    if (address) {
      const infoRows = overlay.appendChild(mk('div', 'art-card-info-rows'));
      const infoRow  = infoRows.appendChild(mk('div', 'art-card-info-row'));
      infoRow.appendChild(mk('span', 'art-card-info-label')).textContent = 'Adresse';
      infoRow.appendChild(mk('span', 'art-card-info-val')).textContent = address;

      const mapsBtn = overlay.appendChild(mk('a', 'art-card-maps-btn'));
      mapsBtn.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name + ', ' + address);
      mapsBtn.target = '_blank';
      mapsBtn.rel = 'noopener';
      mapsBtn.addEventListener('click', e => e.stopPropagation());
      mapsBtn.innerHTML = SVG_MAPS + 'Google Maps';
    }

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
        rows.slice(1).forEach(row => {
          const cols = row.split(';');
          // [0]=empty [1]=Name [2]=Address [3]=Contact [4]=Hours [5]=Instagram [6]=Website [7]=Photo
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

});
