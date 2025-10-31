(function () {
  'use strict';

  // ========================================
  // API BASE (local vs vercel)
  // ========================================
  const API_BASE =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : ''; // on vercel, same origin

  // ========================================
  // DOM CACHE
  // ========================================
  const dom = {
    // Sidebar
    watchlistList: document.getElementById('watchlistList'),
    tickerSearchInput: document.getElementById('tickerSearchInput'),
    tickerSearchGo: document.getElementById('tickerSearchGo'),

    // Snapshot
    snapTicker: document.getElementById('snapTicker'),
    snapName: document.getElementById('snapName'),
    snapPrice: document.getElementById('snapPrice'),
    snapChange: document.getElementById('snapChange'),
    snapMktCap: document.getElementById('snapMktCap'),
    snapShares: document.getElementById('snapShares'),
    snapRange: document.getElementById('snapRange'),
    snapVol: document.getElementById('snapVol'),
    snapConfidence: document.getElementById('snapConfidence'),

    // Composer
    composeTicker: document.getElementById('composeTicker'),
    forumPostForm: document.getElementById('forumPostForm'),
    forumPostText: document.getElementById('forumPostText'),
    forumConfidence: document.getElementById('forumConfidence'),
    forumPostImage: document.getElementById('forumPostImage'),
    forumFileName: document.getElementById('forumFileName'),

    // Thread list
    forumThreadList: document.getElementById('forumThreadList')
  };

  // ========================================
  // STATE
  // ========================================
  let currentTicker = 'AAPL';
  let watchlist = [];
  let forumPosts = [];

  // ========================================
  // UTILITIES
  // ========================================
  function getTickerFromURL() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('ticker') || 'AAPL').toUpperCase();
  }

  function setTickerInURL(ticker) {
    const url = new URL(window.location);
    url.searchParams.set('ticker', ticker);
    window.history.pushState({}, '', url);
  }

  function formatTimeAgo(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;

    const min = 60 * 1000;
    const hour = 60 * min;
    const day = 24 * hour;

    if (diffMs < min) return 'Just now';
    if (diffMs < hour) {
      const m = Math.floor(diffMs / min);
      return `${m}m ago`;
    }
    if (diffMs < day) {
      const h = Math.floor(diffMs / hour);
      return `${h}h ago`;
    }
    const d = Math.floor(diffMs / day);
    return `${d}d ago`;
  }

  function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return '—';
    if (typeof num !== 'number') {
      const maybeNum = Number(num);
      if (Number.isNaN(maybeNum)) return '—';
      num = maybeNum;
    }
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    return num.toFixed(decimals);
  }

  async function readFileAsDataURL(file) {
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

  // ========================================
  // API CALLS
  // ========================================
  async function fetchFundamentals(ticker) {
    try {
      // server now accepts ticker OR symbol, but we send ticker
      const res = await fetch(
        `${API_BASE}/api/fundamentals?ticker=${encodeURIComponent(ticker)}`
      );
      if (!res.ok) {
        console.error('Fundamentals API failed:', res.status);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error('fetchFundamentals error:', err);
      return null;
    }
  }

  async function fetchWatchlist() {
    try {
      const res = await fetch(`${API_BASE}/api/getWatchlist`);
      if (!res.ok) {
        console.error('getWatchlist failed:', res.status);
        return [];
      }
      const data = await res.json();
      // backend returns [{symbol: 'AAPL'}], so normalize
      const arr = data.watchlist || [];
      return arr.map((item) => {
        if (typeof item === 'string') return item;
        if (item && item.symbol) return item.symbol;
        if (item && item.ticker) return item.ticker;
        return 'UNKNOWN';
      });
    } catch (err) {
      console.error('fetchWatchlist error:', err);
      return [];
    }
  }

  async function toggleWatchlist(ticker, watching) {
    try {
      const res = await fetch(`${API_BASE}/api/toggleWatchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, watching })
      });
      if (!res.ok) {
        console.error('toggleWatchlist failed:', res.status);
        return false;
      }
      return true;
    } catch (err) {
      console.error('toggleWatchlist error:', err);
      return false;
    }
  }

  async function fetchForumPosts(ticker) {
    try {
      const res = await fetch(
        `${API_BASE}/api/getForumPosts?ticker=${encodeURIComponent(ticker)}`
      );
      if (!res.ok) {
        console.error('getForumPosts failed:', res.status);
        return [];
      }
      const data = await res.json();
      return data.posts || [];
    } catch (err) {
      console.error('fetchForumPosts error:', err);
      return [];
    }
  }

  async function saveForumPost(ticker, text, confidence, imageData) {
    try {
      const res = await fetch(`${API_BASE}/api/saveForumPost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          // your backend might expect "content" not "text"
          content: text,
          text, // keep both to be safe
          confidence,
          image_data: imageData
        })
      });
      if (!res.ok) {
        console.error('saveForumPost failed:', res.status);
        return null;
      }
      const data = await res.json();
      // if backend doesn't return the post, make one locally
      return (
        data.post || {
          ticker,
          text,
          content: text,
          confidence,
          image_data: imageData,
          author: 'You',
          created_at: new Date().toISOString()
        }
      );
    } catch (err) {
      console.error('saveForumPost error:', err);
      return null;
    }
  }

  // ========================================
  // RENDER
  // ========================================
  function renderWatchlist() {
    if (!dom.watchlistList) return;
    dom.watchlistList.innerHTML = '';

    if (!watchlist || watchlist.length === 0) {
      dom.watchlistList.innerHTML = `
        <li class="empty-state" style="padding: 12px; font-size: 13px;">
          No tickers in watchlist
        </li>
      `;
      return;
    }

    watchlist.forEach((ticker) => {
      const li = document.createElement('li');
      li.className = 'watchlist-row';
      li.innerHTML = `
        <button class="watchlist-ticker-btn" data-ticker="${ticker}">
          <span class="watchlist-symbol">${ticker}</span>
          <span class="watchlist-chevron">›</span>
        </button>
      `;
      dom.watchlistList.appendChild(li);
    });

    dom.watchlistList.querySelectorAll('.watchlist-ticker-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ticker = btn.getAttribute('data-ticker');
        loadTicker(ticker);
      });
    });
  }

  function calculateCommunityConfidence(posts) {
    if (!posts || posts.length === 0) return null;
    const sum = posts.reduce((acc, post) => acc + (post.confidence || 3), 0);
    return sum / posts.length;
  }

  async function renderSnapshot(ticker) {
    // initial UI state
    if (dom.snapTicker) dom.snapTicker.textContent = ticker;
    if (dom.snapName) dom.snapName.textContent = 'Loading...';
    if (dom.snapPrice) dom.snapPrice.textContent = '$0.00';
    if (dom.snapChange) {
      dom.snapChange.textContent = '+0.0%';
      dom.snapChange.style.color = '';
    }
    if (dom.snapMktCap) dom.snapMktCap.textContent = '—';
    if (dom.snapShares) dom.snapShares.textContent = '—';
    if (dom.snapRange) dom.snapRange.textContent = '—';
    if (dom.snapVol) dom.snapVol.textContent = '—';
    if (dom.snapConfidence) dom.snapConfidence.textContent = '— / 5';
    if (dom.composeTicker) dom.composeTicker.textContent = ticker;

    const data = await fetchFundamentals(ticker);
    if (!data) {
      if (dom.snapName) dom.snapName.textContent = 'Unable to load data';
      return;
    }

    const symbol = data.ticker || data.symbol || ticker;
    const name = data.name || symbol;
    const rawPrice = Number(data.price);
    const hasPrice = !Number.isNaN(rawPrice);
    const rawChangePct = Number(data.changePercent);
    const hasChange = !Number.isNaN(rawChangePct);

    if (dom.snapTicker) dom.snapTicker.textContent = symbol;
    if (dom.snapName) dom.snapName.textContent = name;

    if (dom.snapPrice) {
      dom.snapPrice.textContent = hasPrice ? `$${rawPrice.toFixed(2)}` : '$0.00';
    }

    if (dom.snapChange) {
      if (hasChange) {
        const sign = rawChangePct >= 0 ? '+' : '';
        dom.snapChange.textContent = `${sign}${rawChangePct.toFixed(2)}%`;
        dom.snapChange.style.color = rawChangePct >= 0 ? '#059669' : '#dc2626';
      } else {
        dom.snapChange.textContent = '+0.0%';
        dom.snapChange.style.color = '';
      }
    }

    if (dom.snapMktCap) dom.snapMktCap.textContent = formatNumber(data.marketCap);
    if (dom.snapShares) dom.snapShares.textContent = formatNumber(data.sharesOut);
    if (dom.snapRange) dom.snapRange.textContent = '—';
    if (dom.snapVol) dom.snapVol.textContent = '—';

    const avgConfidence = calculateCommunityConfidence(forumPosts);
    if (dom.snapConfidence) {
      dom.snapConfidence.textContent = avgConfidence
        ? `${avgConfidence.toFixed(1)} / 5`
        : '— / 5';
    }
  }

  function renderForumPosts() {
    if (!dom.forumThreadList) return;
    dom.forumThreadList.innerHTML = '';

    if (!forumPosts || forumPosts.length === 0) {
      dom.forumThreadList.innerHTML = `
        <div class="empty-state">
          <p>No posts yet for <strong>${currentTicker}</strong>.
          Be the first to start the conversation.</p>
        </div>
      `;
      return;
    }

    forumPosts.forEach((post) => {
      const article = document.createElement('article');
      article.className = 'forum-post-card card';

      const avatar = post.author ? post.author.slice(0, 2).toUpperCase() : 'AN';

      let imageHTML = '';
      if (post.image_data) {
        imageHTML = `
          <div class="feed-image-frame">
            <img src="${post.image_data}" alt="Post attachment" />
          </div>
        `;
      }

      article.innerHTML = `
        <header class="forum-post-head">
          <div class="forum-post-left">
            <div class="forum-avatar">${avatar}</div>
            <div>
              <div class="forum-author">${post.author || 'Anonymous'}</div>
              <div class="forum-meta">
                <span class="forum-time">${formatTimeAgo(
                  post.created_at || new Date().toISOString()
                )}</span>
                <span class="forum-conf">Conf: ${post.confidence || 3}/5</span>
              </div>
            </div>
          </div>
        </header>

        <div class="forum-post-body">
          <p>${post.text || post.content || ''}</p>
          ${imageHTML}
        </div>
      `;

      dom.forumThreadList.appendChild(article);
    });
  }

  // ========================================
  // MAIN LOAD
  // ========================================
  async function loadTicker(ticker) {
    currentTicker = ticker.toUpperCase();
    setTickerInURL(currentTicker);

    // snapshot first (so UI looks alive)
    await renderSnapshot(currentTicker);

    // then forum posts
    forumPosts = await fetchForumPosts(currentTicker);
    renderForumPosts();

    // update snapshot confidence after we get posts
    const avgConfidence = calculateCommunityConfidence(forumPosts);
    if (dom.snapConfidence) {
      dom.snapConfidence.textContent = avgConfidence
        ? `${avgConfidence.toFixed(1)} / 5`
        : '— / 5';
    }
  }

  // ========================================
  // EVENTS
  // ========================================
  function wireSearch() {
    const handleSearch = () => {
      const ticker = dom.tickerSearchInput.value.trim().toUpperCase();
      if (!ticker) return;
      loadTicker(ticker);
      dom.tickerSearchInput.value = '';
    };

    dom.tickerSearchGo.addEventListener('click', handleSearch);
    dom.tickerSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    });
  }

  function wireImageInput() {
    dom.forumPostImage.addEventListener('change', () => {
      dom.forumFileName.textContent = dom.forumPostImage.files[0]
        ? dom.forumPostImage.files[0].name
        : 'No file selected';
    });
  }

  function wirePostForm() {
    dom.forumPostForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const text = dom.forumPostText.value.trim();
      if (!text) {
        dom.forumPostText.focus();
        return;
      }

      const confidence = parseInt(dom.forumConfidence.value, 10);

      let imageData = null;
      try {
        imageData = await readFileAsDataURL(dom.forumPostImage.files[0]);
      } catch (err) {
        console.error('Failed to read image:', err);
      }

      const newPost = await saveForumPost(currentTicker, text, confidence, imageData);

      if (newPost) {
        forumPosts.unshift(newPost);
        renderForumPosts();

        const avgConfidence = calculateCommunityConfidence(forumPosts);
        if (dom.snapConfidence) {
          dom.snapConfidence.textContent = avgConfidence
            ? `${avgConfidence.toFixed(1)} / 5`
            : '— / 5';
        }

        dom.forumPostForm.reset();
        dom.forumFileName.textContent = 'No file selected';
      } else {
        alert('Failed to save post. Please try again.');
      }
    });
  }

  // ========================================
  // INIT
  // ========================================
  async function init() {
    currentTicker = getTickerFromURL();

    // load watchlist first
    watchlist = await fetchWatchlist();
    renderWatchlist();

    // interactions
    wireSearch();
    wireImageInput();
    wirePostForm();

    // load first ticker
    await loadTicker(currentTicker);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
