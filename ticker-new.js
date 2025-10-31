(function () {
  'use strict';

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
  // UTILITY FUNCTIONS
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

  // Fetch fundamentals from your Vercel backend
  async function fetchFundamentals(ticker) {
    try {
      const res = await fetch(`/api/fundamentals?symbol=${encodeURIComponent(ticker)}`);
      if (!res.ok) {
        console.error('Fundamentals API failed:', res.status);
        return null;
      }
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('fetchFundamentals error:', err);
      return null;
    }
  }

  // Fetch watchlist from Supabase via your backend
  async function fetchWatchlist() {
    try {
      const res = await fetch('/api/getWatchlist');
      if (!res.ok) {
        console.error('getWatchlist failed:', res.status);
        return [];
      }
      const data = await res.json();
      return data.watchlist || [];
    } catch (err) {
      console.error('fetchWatchlist error:', err);
      return [];
    }
  }

  // Toggle watchlist (add/remove ticker)
  async function toggleWatchlist(ticker, watching) {
    try {
      const res = await fetch('/api/toggleWatchlist', {
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

  // Fetch forum posts for a ticker
  async function fetchForumPosts(ticker) {
    try {
      const res = await fetch(`/api/getForumPosts?ticker=${encodeURIComponent(ticker)}`);
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

  // Save a new forum post
  async function saveForumPost(ticker, text, confidence, imageData) {
    try {
      const res = await fetch('/api/saveForumPost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          text,
          confidence,
          image_data: imageData
        })
      });
      if (!res.ok) {
        console.error('saveForumPost failed:', res.status);
        return null;
      }
      const data = await res.json();
      return data.post || null;
    } catch (err) {
      console.error('saveForumPost error:', err);
      return null;
    }
  }

  // ========================================
  // RENDER FUNCTIONS
  // ========================================

  function renderWatchlist() {
    dom.watchlistList.innerHTML = '';

    if (watchlist.length === 0) {
      dom.watchlistList.innerHTML = `
        <li class="empty-state" style="padding: 12px; font-size: 13px;">
          No tickers in watchlist
        </li>
      `;
      return;
    }

    watchlist.forEach(ticker => {
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

    // Wire click events
    dom.watchlistList.querySelectorAll('.watchlist-ticker-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ticker = btn.getAttribute('data-ticker');
        loadTicker(ticker);
      });
    });
  }

  async function renderSnapshot(ticker) {
    dom.snapTicker.textContent = ticker;
    dom.snapName.textContent = 'Loading...';
    dom.snapPrice.textContent = '$0.00';
    dom.snapChange.textContent = '+0.0%';
    dom.snapMktCap.textContent = '—';
    dom.snapShares.textContent = '—';
    dom.snapRange.textContent = '—';
    dom.snapVol.textContent = '—';
    dom.snapConfidence.textContent = '— / 5';
    dom.composeTicker.textContent = ticker;

    const data = await fetchFundamentals(ticker);
    if (!data) {
      dom.snapName.textContent = 'Unable to load data';
      return;
    }

    dom.snapTicker.textContent = data.ticker || ticker;
    dom.snapName.textContent = data.name || 'Unknown Company';
    
    if (data.price !== null) {
      dom.snapPrice.textContent = `$${data.price.toFixed(2)}`;
    }

    if (data.changePercent !== null) {
      const sign = data.changePercent >= 0 ? '+' : '';
      dom.snapChange.textContent = `${sign}${data.changePercent.toFixed(2)}%`;
      dom.snapChange.style.color = data.changePercent >= 0 ? '#059669' : '#dc2626';
    }

    dom.snapMktCap.textContent = formatNumber(data.marketCap);
    dom.snapShares.textContent = formatNumber(data.sharesOut);
    dom.snapRange.textContent = '—'; // Finnhub doesn't provide 52w range in profile
    dom.snapVol.textContent = '—'; // You'd need to get this from quote endpoint

    // Calculate community confidence (average of all post confidences)
    const avgConfidence = calculateCommunityConfidence(forumPosts);
    dom.snapConfidence.textContent = avgConfidence ? `${avgConfidence.toFixed(1)} / 5` : '— / 5';
  }

  function calculateCommunityConfidence(posts) {
    if (!posts || posts.length === 0) return null;
    const sum = posts.reduce((acc, post) => acc + (post.confidence || 3), 0);
    return sum / posts.length;
  }

  function renderForumPosts() {
    dom.forumThreadList.innerHTML = '';

    if (forumPosts.length === 0) {
      dom.forumThreadList.innerHTML = `
        <div class="empty-state">
          <p>No posts yet for <strong>${currentTicker}</strong>.
          Be the first to start the conversation.</p>
        </div>
      `;
      return;
    }

    forumPosts.forEach(post => {
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
                <span class="forum-time">${formatTimeAgo(post.created_at)}</span>
                <span class="forum-conf">Conf: ${post.confidence}/5</span>
              </div>
            </div>
          </div>
        </header>

        <div class="forum-post-body">
          <p>${post.text}</p>
          ${imageHTML}
        </div>
      `;

      dom.forumThreadList.appendChild(article);
    });
  }

  // ========================================
  // MAIN LOAD TICKER FUNCTION
  // ========================================
  async function loadTicker(ticker) {
    currentTicker = ticker.toUpperCase();
    setTickerInURL(currentTicker);

    // Load snapshot
    await renderSnapshot(currentTicker);

    // Load forum posts
    forumPosts = await fetchForumPosts(currentTicker);
    renderForumPosts();
  }

  // ========================================
  // EVENT HANDLERS
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

      // Save to backend
      const newPost = await saveForumPost(currentTicker, text, confidence, imageData);
      
      if (newPost) {
        // Add to local state and re-render
        forumPosts.unshift(newPost);
        renderForumPosts();

        // Update community confidence
        const avgConfidence = calculateCommunityConfidence(forumPosts);
        dom.snapConfidence.textContent = avgConfidence ? `${avgConfidence.toFixed(1)} / 5` : '— / 5';

        // Reset form
        dom.forumPostForm.reset();
        dom.forumFileName.textContent = 'No file selected';
      } else {
        alert('Failed to save post. Please try again.');
      }
    });
  }

  // ========================================
  // INITIALIZATION
  // ========================================
  async function init() {
    // Get ticker from URL
    currentTicker = getTickerFromURL();

    // Load watchlist
    watchlist = await fetchWatchlist();
    renderWatchlist();

    // Wire up interactions
    wireSearch();
    wireImageInput();
    wirePostForm();

    // Load initial ticker data
    await loadTicker(currentTicker);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();