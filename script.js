(function () {
  // ----------------------------------
  // CONSTANTS / STORAGE KEYS
  // ----------------------------------
  const PIN_STORAGE_KEY = 'revatour:pins';
  const FEED_STORAGE_KEY = 'revatour:feed';
  const KNOWN_TICKERS_KEY = 'revatour:knownTickers';

  // ----------------------------------
  // DEFAULT CONTENT (first run)
  // ----------------------------------
  const nowTs = Date.now();
  const defaultPins = [
    {
      id: `pin-${nowTs}-AAPL`,
      ticker: 'AAPL',
      note: 'Opened a long-term position after earnings beat expectations.',
      imageData: null,
      createdAt: new Date().toISOString()
    },
    {
      id: `pin-${nowTs}-TSLA`,
      ticker: 'TSLA',
      note: 'Tracked my swing trade from Austin factory expansion news.',
      imageData: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
    }
  ];

  const defaultFeed = [
    {
      id: 'feed-sample-1',
      author: 'Avery Value',
      avatar: 'AV',
      text: 'Rebalancing dividend holdings and adding to $JNJ. Yield keeps compounding!',
      ticker: 'JNJ',
      imageData: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      source: 'following'
    },
    {
      id: 'feed-sample-2',
      author: 'Mila Momentum',
      avatar: 'MM',
      text: 'Scaled out of my NVDA call spread after that AI keynote rally. Onto the next setup.',
      ticker: 'NVDA',
      imageData: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      source: 'following'
    }
  ];

  // ----------------------------------
  // DOM CACHE
  // ----------------------------------
  const dom = {
    map: document.getElementById('map'),

    tickerSearchInput: document.getElementById('tickerSearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    openAddPinBtn: document.getElementById('openAddPinBtn'),

    // modal
    addPinModal: document.getElementById('addPinModal'),
    closeAddPinBtn: document.getElementById('closeAddPinBtn'),
    cancelAddPinBtn: document.getElementById('cancelAddPinBtn'),
    addPinForm: document.getElementById('addPinForm'),
    pinTickerInput: document.getElementById('pinTicker'),
    pinNoteInput: document.getElementById('pinNote'),
    pinImageInput: document.getElementById('pinImage'),
    pinFileName: document.getElementById('pinFileName'),

    // sidebar pins
    pinCards: document.getElementById('pinCards'),
    pinCount: document.getElementById('pinCount'),

    // sections / nav
    mapSection: document.getElementById('mapSection'),
    wallSection: document.getElementById('wallSection'),
    viewMapBtn: document.getElementById('viewMapBtn'),
    viewWallBtn: document.getElementById('viewWallBtn'),
    brandHomeBtn: document.querySelector('.brand'),

    // wall post form
    wallPostForm: document.getElementById('wallPostForm'),
    wallPostText: document.getElementById('wallPostText'),
    wallPostTicker: document.getElementById('wallPostTicker'),
    wallPostImage: document.getElementById('wallPostImage'),
    wallFileName: document.getElementById('wallFileName'),

    // wall feed
    feedList: document.getElementById('feedList'),

    // ticker autocomplete <datalist>
    tickerOptions: document.getElementById('tickerOptions')
  };

  // ----------------------------------
  // APP STATE
  // ----------------------------------
  let pins = loadPins();
  let feed = loadFeed();
  let dynamicCompanyMap = {};

  // Leaflet map init
  const map = L.map('map').setView([37.8, -96], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let markersById = {};

  // ----------------------------------
  // PERSISTENCE HELPERS
  // ----------------------------------
  function loadPins() {
    try {
      const stored = localStorage.getItem(PIN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load pins', err);
    }
    return defaultPins;
  }

  function savePins() {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pins));
  }

  function loadFeed() {
    try {
      const stored = localStorage.getItem(FEED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load feed', err);
    }
    return defaultFeed;
  }

  function saveFeed() {
    localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(feed));
  }

  function persistCompanyMap() {
    localStorage.setItem(KNOWN_TICKERS_KEY, JSON.stringify(dynamicCompanyMap));
  }

  // ----------------------------------
  // COMPANY BOOTSTRAP / LOOKUP
  // ----------------------------------
  function bootstrapCompanyMap() {
    try {
      const raw = localStorage.getItem(KNOWN_TICKERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          Object.values(parsed).forEach(c => {
            if (c && c.ticker) {
              dynamicCompanyMap[c.ticker.toUpperCase()] = c;
            }
          });
        }
      }
    } catch (e) {
      console.warn('could not restore knownTickers', e);
    }

    const builtIns = [
      { ticker: 'AAPL', name: 'Apple Inc.', lat: 37.3349, lon: -122.0090 },
      { ticker: 'MSFT', name: 'Microsoft Corporation', lat: 47.6426, lon: -122.1391 },
      { ticker: 'GOOGL', name: 'Alphabet Inc.', lat: 37.4220, lon: -122.0841 },
      { ticker: 'AMZN', name: 'Amazon.com, Inc.', lat: 47.6225, lon: -122.3365 },
      { ticker: 'TSLA', name: 'Tesla, Inc.', lat: 30.2672, lon: -97.7431 },
      { ticker: 'NVDA', name: 'NVIDIA Corporation', lat: 37.3705, lon: -121.9620 },
      { ticker: 'META', name: 'Meta Platforms, Inc.', lat: 37.4845, lon: -122.1483 },
      { ticker: 'JNJ',  name: 'Johnson & Johnson', lat: 40.4862, lon: -74.4518 }
    ];
    builtIns.forEach(c => {
      const u = c.ticker.toUpperCase();
      if (!dynamicCompanyMap[u]) {
        dynamicCompanyMap[u] = c;
      }
    });

    persistCompanyMap();
  }

  function getAllCompanies() {
    return Object.values(dynamicCompanyMap);
  }

  function findCompany(tickerLike) {
    if (!tickerLike) return null;
    const t = tickerLike.trim().toUpperCase();
    return dynamicCompanyMap[t] || null;
  }

  function findCompanyLoose(query) {
    if (!query) return null;
    const q = query.trim().toLowerCase();
    const direct = dynamicCompanyMap[q.toUpperCase()];
    if (direct) return direct;
    let best = null;
    Object.values(dynamicCompanyMap).forEach(c => {
      if (
        c.ticker.toLowerCase() === q ||
        c.name.toLowerCase().includes(q)
      ) {
        best = c;
      }
    });
    return best;
  }

  // ----------------------------------
  // UTIL: TIMESTAMP → "2h ago"
  // ----------------------------------
  function formatTimestamp(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return 'Just now';
    if (diff < hour) {
      const mins = Math.floor(diff / minute);
      return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    }
    if (diff < day) {
      const hrs = Math.floor(diff / hour);
      return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    }
    if (diff < day * 7) {
      const days = Math.floor(diff / day);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    return date.toLocaleDateString();
  }

  // ----------------------------------
  // RENDER: <datalist>
  // ----------------------------------
  function renderTickerOptions() {
    if (!dom.tickerOptions) return;
    dom.tickerOptions.innerHTML = '';

    getAllCompanies()
      .sort((a, b) => a.ticker.localeCompare(b.ticker))
      .forEach(company => {
        const option = document.createElement('option');
        option.value = company.ticker;
        option.textContent = `${company.ticker} — ${company.name}`;
        dom.tickerOptions.appendChild(option);
      });
  }

  // ----------------------------------
  // RENDER: MAP
  // ----------------------------------
  function renderMap() {
    Object.values(markersById).forEach(marker => {
      map.removeLayer(marker);
    });
    markersById = {};

    const validPins = pins.filter(pin => !!findCompany(pin.ticker));

    if (validPins.length === 0) {
      map.setView([37.8, -96], 4);
    }

    validPins.forEach(pin => {
      const company = findCompany(pin.ticker);
      if (!company) return;

      const marker = L.marker([company.lat, company.lon], {
        icon: L.divIcon({
          className: 'ticker-icon',
          html: `<div class="ticker-label">${company.ticker}</div>`,
          iconSize: [80, 32],
          iconAnchor: [40, 16]
        })
      }).addTo(map);

      const popupPieces = [];
      popupPieces.push(`<h3>${company.ticker} — ${company.name}</h3>`);
      popupPieces.push(`<p>${pin.note ? pin.note : 'No note yet. Document why this ticker matters to you.'}</p>`);
      if (pin.imageData) {
        popupPieces.push(
          '<div class="media-frame">' +
            `<img src="${pin.imageData}" alt="${company.ticker} pin image">` +
          '</div>'
        );
      }
      popupPieces.push(`
        <div class="popup-actions">
          <button class="share-btn" data-pin-id="${pin.id}">Share to Wall</button>
          <button class="forum-btn" data-ticker="${company.ticker}">Go to Forum</button>
          <button class="remove-btn" data-pin-id="${pin.id}">Remove</button>
        </div>
      `);

      marker.bindPopup(popupPieces.join(''));
      markersById[pin.id] = marker;
    });

    if (validPins.length > 0) {
      const firstCompany = findCompany(validPins[0].ticker);
      if (firstCompany) {
        map.setView([firstCompany.lat, firstCompany.lon], 5);
      }
    }
  }

  // ----------------------------------
  // RENDER: PIN SIDEBAR
  // ----------------------------------
  function renderPinCards() {
    dom.pinCards.innerHTML = '';
    dom.pinCount.textContent = pins.length.toString();

    if (pins.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <p>Your map is waiting for its first ticker.
        Tap <strong>Add to MyMap</strong> to drop a pin.</p>`;
      dom.pinCards.appendChild(empty);
      return;
    }

    pins
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach(pin => {
        const company = findCompany(pin.ticker);
        if (!company) return;

        const card = document.createElement('article');
        card.className = 'pin-card';
        card.innerHTML = `
          <header>
            <h3>${company.ticker}</h3>
            <span>${formatTimestamp(pin.createdAt)}</span>
          </header>

          <p class="pin-note">${
            pin.note ? pin.note : 'No note yet. Click share to add a story on your wall.'
          }</p>

          ${
            pin.imageData
              ? (
                '<div class="media-frame">' +
                  `<img src="${pin.imageData}" alt="${company.ticker} journal image">` +
                '</div>'
              )
              : ''
          }

          <div class="pin-actions">
            <button class="share-btn" data-pin-id="${pin.id}">Share to Wall</button>
            <button class="remove-btn" data-pin-id="${pin.id}">Remove</button>
          </div>
        `;
        dom.pinCards.appendChild(card);
      });

    dom.pinCards.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pinId = btn.getAttribute('data-pin-id');
        sharePin(pinId);
      });
    });

    dom.pinCards.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pinId = btn.getAttribute('data-pin-id');
        removePin(pinId);
      });
    });
  }

  // ----------------------------------
  // RENDER: WALL FEED
  // ----------------------------------
  function renderFeed() {
    dom.feedList.innerHTML = '';

    if (feed.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <p>Your wall is quiet.
        Share a thought from your MyMap or post something new!</p>`;
      dom.feedList.appendChild(empty);
      return;
    }

    feed
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach(post => {
        const card = document.createElement('article');
        card.className = 'feed-card';

        const author = post.author || 'You';
        const avatar =
          post.avatar ||
          (author ? author.slice(0, 2).toUpperCase() : 'YO');

        const showDelete = author === 'You';

        const imageBlock = post.imageData
          ? (
            '<div class="feed-image-frame">' +
              `<img src="${post.imageData}" alt="Post attachment">` +
            '</div>'
          )
          : '';

        card.innerHTML = `
          <header>
            <div class="author">
              <span class="avatar">${avatar}</span>
              <div>
                <strong>${author}${
                  post.source === 'pin' ? ' · Shared from MyMap' : ''
                }</strong>
                <div class="timestamp">${formatTimestamp(
                  post.createdAt
                )}</div>
              </div>
            </div>

            <div class="feed-header-right">
              ${
                post.ticker
                  ? `<span class="ticker-tag">${post.ticker}</span>`
                  : ''
              }

              ${
                showDelete
                  ? `<button class="delete-post-btn" data-post-id="${post.id}">Delete</button>`
                  : ''
              }
            </div>
          </header>

          <p>${post.text}</p>

          ${imageBlock}
        `;

        dom.feedList.appendChild(card);
      });

    dom.feedList.querySelectorAll('.delete-post-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const postId = btn.getAttribute('data-post-id');
        deletePost(postId);
      });
    });
  }

  // ----------------------------------
  // ACTIONS
  // ----------------------------------
  function openModal() {
    dom.addPinModal.classList.remove('hidden');
    dom.pinTickerInput.focus();
  }

  function closeModal() {
    dom.addPinModal.classList.add('hidden');
    dom.addPinForm.reset();
    dom.pinFileName.textContent = 'No file selected';
  }

  function removePin(pinId) {
    pins = pins.filter(pin => pin.id !== pinId);
    savePins();
    renderPinCards();
    renderMap();
  }

  function sharePin(pinId) {
    const pin = pins.find(p => p.id === pinId);
    if (!pin) return;

    const company = findCompany(pin.ticker);

    const text =
      pin.note && pin.note.trim().length > 0
        ? pin.note
        : `Sharing ${company ? company.ticker : pin.ticker} from MyMap.`;

    const newPost = {
      id: `feed-${Date.now()}`,
      author: 'You',
      avatar: 'YOU',
      text,
      ticker: company ? company.ticker : pin.ticker,
      imageData: pin.imageData,
      createdAt: new Date().toISOString(),
      source: 'pin'
    };

    feed.push(newPost);
    saveFeed();
    renderFeed();

    switchToWall();
    window.location.hash = '#wall';
  }

  function deletePost(postId) {
    feed = feed.filter(p => p.id !== postId);
    saveFeed();
    renderFeed();
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function switchToMap() {
    dom.mapSection.classList.add('active');
    dom.wallSection.classList.remove('active');
    dom.viewMapBtn.classList.add('active');
    dom.viewWallBtn.classList.remove('active');

    if (window.location.hash !== '#map') {
      window.location.hash = '#map';
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }

  function switchToWall() {
    dom.wallSection.classList.add('active');
    dom.mapSection.classList.remove('active');
    dom.viewWallBtn.classList.add('active');
    dom.viewMapBtn.classList.remove('active');

    if (window.location.hash !== '#wall') {
      window.location.hash = '#wall';
    }
  }

  function prefillTickerFromSearch() {
    const query = dom.tickerSearchInput.value.trim();
    if (!query) return;
    const company = findCompanyLoose(query);
    if (company) {
      dom.pinTickerInput.value = company.ticker;
    } else {
      dom.pinTickerInput.value = query.toUpperCase();
    }
  }

  // ----------------------------------
  // FORM HANDLERS
  // ----------------------------------
  async function handleAddPinSubmit(event) {
    event.preventDefault();

    const rawTicker = dom.pinTickerInput.value.trim();
    const note = dom.pinNoteInput.value.trim();

    if (!rawTicker) {
      dom.pinTickerInput.focus();
      return;
    }

    let company = findCompanyLoose(rawTicker);
    if (!company) {
      // In your earlier code you tried to fetch fundamentals/geocode here.
      // For now we just fallback to ticker-only:
      company = { ticker: rawTicker.toUpperCase(), name: rawTicker.toUpperCase(), lat: 37.8, lon: -96 };
      dynamicCompanyMap[company.ticker] = company;
      persistCompanyMap();
      renderTickerOptions();
    }

    readFileAsDataURL(dom.pinImageInput.files[0])
      .then(imageData => {
        const newPin = {
          id: `pin-${Date.now()}`,
          ticker: company.ticker,
          note,
          imageData,
          createdAt: new Date().toISOString()
        };

        pins.push(newPin);
        savePins();

        renderPinCards();
        renderMap();
        closeModal();

        dom.tickerSearchInput.value = '';
        refreshClearBtn();
      })
      .catch(err => {
        console.error('Failed to read file', err);
      });
  }

  async function handleWallPostSubmit(event) {
    event.preventDefault();

    const text = dom.wallPostText.value.trim();
    if (!text) {
      dom.wallPostText.focus();
      return;
    }

    const rawTicker = dom.wallPostTicker.value.trim();
    let tickerResolved = '';

    if (rawTicker) {
      let company = findCompanyLoose(rawTicker);
      if (!company) {
        company = { ticker: rawTicker.toUpperCase(), name: rawTicker.toUpperCase() };
        dynamicCompanyMap[company.ticker] = company;
        persistCompanyMap();
        renderTickerOptions();
      }
      tickerResolved = company ? company.ticker : rawTicker.toUpperCase();
    }

    readFileAsDataURL(dom.wallPostImage.files[0])
      .then(imageData => {
        const newPost = {
          id: `feed-${Date.now()}`,
          author: 'You',
          avatar: 'YOU',
          text,
          ticker: tickerResolved || null,
          imageData,
          createdAt: new Date().toISOString(),
          source: 'wall'
        };

        feed.push(newPost);
        saveFeed();
        renderFeed();

        dom.wallPostForm.reset();
        dom.wallFileName.textContent = 'No file selected';

        switchToWall();
        window.location.hash = '#wall';
      })
      .catch(err => {
        console.error('Failed to read post attachment', err);
      });
  }

  // ----------------------------------
  // LISTENERS
  // ----------------------------------
  function wireModalEvents() {
    dom.openAddPinBtn.addEventListener('click', () => {
      prefillTickerFromSearch();
      openModal();
    });

    dom.closeAddPinBtn.addEventListener('click', closeModal);
    dom.cancelAddPinBtn.addEventListener('click', closeModal);

    dom.addPinForm.addEventListener('submit', handleAddPinSubmit);

    dom.pinImageInput.addEventListener('change', () => {
      dom.pinFileName.textContent = dom.pinImageInput.files[0]
        ? dom.pinImageInput.files[0].name
        : 'No file selected';
    });
  }

  function wireNavigation() {
    dom.viewMapBtn.addEventListener('click', switchToMap);
    dom.viewWallBtn.addEventListener('click', switchToWall);

    if (dom.brandHomeBtn) {
      dom.brandHomeBtn.style.cursor = 'pointer';
      dom.brandHomeBtn.addEventListener('click', () => {
        switchToMap();
      });
    }
  }

  function wireSearchInput() {
    if (!dom.tickerSearchInput) return;
    dom.tickerSearchInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        prefillTickerFromSearch();
        openModal();
      }
    });
  }

  function refreshClearBtn() {
    if (!dom.clearSearchBtn || !dom.tickerSearchInput) return;
    if (dom.tickerSearchInput.value.trim().length > 0) {
      dom.clearSearchBtn.style.display = 'inline-block';
    } else {
      dom.clearSearchBtn.style.display = 'none';
    }
  }

  function wireSearchClear() {
    if (!dom.tickerSearchInput || !dom.clearSearchBtn) return;

    dom.tickerSearchInput.addEventListener('input', refreshClearBtn);

    dom.clearSearchBtn.addEventListener('click', () => {
      dom.tickerSearchInput.value = '';
      refreshClearBtn();
      dom.tickerSearchInput.focus();
    });

    refreshClearBtn();
  }

  function wireWallForm() {
    dom.wallPostForm.addEventListener('submit', handleWallPostSubmit);

    dom.wallPostImage.addEventListener('change', () => {
      dom.wallFileName.textContent = dom.wallPostImage.files[0]
        ? dom.wallPostImage.files[0].name
        : 'No file selected';
    });
  }

  function wireMapPopups() {
    map.on('popupopen', e => {
      const popupRoot = e.popup._contentNode;

      const shareBtn = popupRoot.querySelector('.share-btn');
      const forumBtn = popupRoot.querySelector('.forum-btn');
      const removeBtn = popupRoot.querySelector('.remove-btn');

      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          const pinId = shareBtn.getAttribute('data-pin-id');
          sharePin(pinId);
          map.closePopup();
        });
      }

      if (forumBtn) {
        forumBtn.addEventListener('click', () => {
          const ticker = forumBtn.getAttribute('data-ticker');
          window.location = `ticker.html?ticker=${encodeURIComponent(ticker)}`;
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          const pinId = removeBtn.getAttribute('data-pin-id');
          removePin(pinId);
          map.closePopup();
        });
      }
    });
  }

  function wireHashRouting() {
    function applyHashRoute() {
      if (window.location.hash === '#wall') {
        switchToWall();
      } else {
        switchToMap();
      }
    }

    window.addEventListener('hashchange', applyHashRoute);
    applyHashRoute();
  }

  // ----------------------------------
  // INIT
  // ----------------------------------
  function init() {
    bootstrapCompanyMap();

    renderTickerOptions();
    renderPinCards();
    renderFeed();
    renderMap();

    wireModalEvents();
    wireNavigation();
    wireSearchInput();
    wireSearchClear();
    wireWallForm();
    wireMapPopups();
    wireHashRouting();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();  // ✅ END OF YOUR BIG APP


// =======================
// ✅ FINNHUB LIVE QUOTE
// =======================
(() => {
  const FINNHUB_TOKEN = "d40vbk9r01qhkm8b33v0d40vbk9r01qhkm8b33vg";

  async function fetchLiveQuoteForTicker(ticker) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_TOKEN}`;
    try {
      const resp = await fetch(url);
      const raw = await resp.json();
      if (!resp.ok || raw.error || typeof raw.c === "undefined") {
        console.error(`Finnhub error for ${ticker}:`, raw.error || raw);
        return null;
      }
      const data = {
        symbol: ticker,
        price: raw.c,
        change: raw.d,
        percent_change: raw.dp,
        high: raw.h,
        low: raw.l,
        open: raw.o,
        prev_close: raw.pc,
        timestamp: raw.t ? new Date(raw.t * 1000) : null,
      };
      console.log("LIVE QUOTE RESULT FOR", ticker, data);
      return data;
    } catch (err) {
      console.error("Quote fetch failed for", ticker, err);
      return null;
    }
  }

  window.fetchLiveQuoteForTicker = fetchLiveQuoteForTicker;
})();

async function renderQuote(ticker) {
  const q = await fetchLiveQuoteForTicker(ticker);
  if (!q) return;

  const priceEl = document.getElementById("quotePrice");
  const changeEl = document.getElementById("quoteChange");
  const timeEl = document.getElementById("quoteTime");

  if (priceEl) priceEl.textContent = q.price.toFixed(2);
  if (changeEl) {
    const sign = q.change >= 0 ? "+" : "";
    changeEl.textContent = `${sign}${q.change.toFixed(2)} (${sign}${q.percent_change.toFixed(2)}%)`;
    changeEl.style.color = q.change >= 0 ? "var(--green, #1a7f37)" : "var(--red, #b42318)";
  }
  if (timeEl && q.timestamp) {
    timeEl.textContent = q.timestamp.toLocaleString();
  }
}
window.renderQuote = renderQuote;

document.addEventListener("DOMContentLoaded", () => {
  renderQuote("AAPL");
});
