// ---------- STATE / PERSISTENCE ----------

// figure out which ticker is showing in the detail view
function getCurrentTickerFromDetailView() {
    // Example companyTitle text: "UNH — UnitedHealth Group"
    var titleEl = document.getElementById("companyTitle");
    if (!titleEl) return null;

    var raw = titleEl.textContent.trim();
    // Take the part before the first space or before the dash
    // e.g. "UNH — UnitedHealth Group" -> "UNH"
    var tickerGuess = raw.split(" ")[0];
    tickerGuess = tickerGuess.replace("—", "").replace("–", "").trim();
    return tickerGuess.toUpperCase();
}

// fetch live quote for a ticker (used in detail view refresh loop below)
async function fetchLiveQuoteForTicker(ticker) {
    try {
        const res = await fetch('/api/getQuote?ticker=' + encodeURIComponent(ticker));
        if (!res.ok) {
            console.error('Quote fetch failed for', ticker);
            return null;
        }
        const data = await res.json();
        if (data.error) {
            console.error('Quote API error for', ticker, data.error);
            return null;
        }
        // data should look like:
        // { ticker, currentPrice, prevClose, changePct }
        return data;
    } catch (err) {
        console.error('fetchLiveQuoteForTicker error', err);
        return null;
    }
}

// update the live price box in the company detail view
function renderLiveQuoteBox(quote) {
    var priceEl   = document.getElementById("livePriceValue");
    var prevEl    = document.getElementById("livePrevCloseValue");
    var changeEl  = document.getElementById("liveChangeValue");

    // might not be visible if we're on the map view
    if (!priceEl || !prevEl || !changeEl) {
        return;
    }

    if (!quote) {
        priceEl.textContent   = "n/a";
        prevEl.textContent    = "n/a";
        changeEl.textContent  = "n/a";
        changeEl.style.color  = "gray";
        return;
    }

    // Price now
    if (quote.currentPrice !== undefined && quote.currentPrice !== null) {
        priceEl.textContent = quote.currentPrice.toFixed(2);
    } else {
        priceEl.textContent = "n/a";
    }

    // Yesterday's close
    if (quote.prevClose !== undefined && quote.prevClose !== null) {
        prevEl.textContent = quote.prevClose.toFixed(2);
    } else {
        prevEl.textContent = "n/a";
    }

    // % change (and color)
    if (typeof quote.changePct === "number") {
        var pctString = quote.changePct.toFixed(2) + "%";
        changeEl.textContent = pctString;

        if (quote.changePct > 0) {
            changeEl.style.color = "green";
        } else if (quote.changePct < 0) {
            changeEl.style.color = "red";
        } else {
            changeEl.style.color = "gray";
        }
    } else {
        changeEl.textContent = "n/a";
        changeEl.style.color = "gray";
    }
}

// restore chats (per ticker notes) from localStorage
var chats = JSON.parse(localStorage.getItem("tickerChats") || "{}");

// restore watchlist (ticker -> true/false) from localStorage
var watchlist = JSON.parse(localStorage.getItem("tickerWatchlist") || "{}");

// ---------- MAP SETUP ----------
var map = L.map('map').setView([37.8, -96], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// data structures
var markersByTicker = {};      // ticker -> Leaflet marker
var companiesData = [];        // full list from fetchData.js
var activeSectorFilter = "ALL";
var priceChart = null;

// helper to fetch stock quotes from backend (used both in detail view and map recolor)
async function fetchLiveQuote(ticker) {
    try {
        const res = await fetch('/api/getQuote?ticker=' + encodeURIComponent(ticker));
        if (!res.ok) {
            console.error('Quote fetch failed for', ticker);
            return null;
        }
        const data = await res.json();
        if (data.error) {
            console.error('Quote API error for', ticker, data.error);
            return null;
        }
        return data; // { ticker, currentPrice, prevClose, changePct }
    } catch (err) {
        console.error('fetchLiveQuote error', err);
        return null;
    }
}


// ---------- HELPER: build ticker badge style ----------
function getTickerHTML(company) {
    // decide initial color by static changePct from fetchData.js
    // (we'll override live in updateMarkerColor once we fetch real data)
    let bg, border;
    if (company.changePct > 0.2) {
        bg = "#2ecc71"; // green-ish
        border = "#1b9a52";
    } else if (company.changePct < -0.2) {
        bg = "#e74c3c"; // red-ish
        border = "#9e2f22";
    } else {
        bg = "#888";    // neutral gray
        border = "#555";
    }

    return `
      <div class="ticker-label"
           style="
             background-color:${bg};
             border-color:${border};
           ">
        ${company.ticker}
      </div>
    `;
}


// ---------- DRAW MARKERS ----------
function drawCompaniesOnMap() {
    if (!window.companyHQs || window.companyHQs.length === 0) {
        setTimeout(drawCompaniesOnMap, 200);
        return;
    }

    companiesData = window.companyHQs;

    // clear old markers if any
    Object.values(markersByTicker).forEach(m => {
        map.removeLayer(m);
    });
    markersByTicker = {};

    // add markers that match sector filter
    companiesData.forEach(function(company) {
        if (activeSectorFilter !== "ALL" && company.sector !== activeSectorFilter) {
            return; // skip if not in selected sector
        }

        var tickerIcon = L.divIcon({
            className: 'ticker-icon',
            html: getTickerHTML(company),
            iconSize: [60, 25],
            iconAnchor: [30, 12]
        });

        var marker = L.marker([company.lat, company.lon], { icon: tickerIcon }).addTo(map);

        marker.bindPopup(
            `<b>${company.name}</b><br>` +
            `Ticker: ${company.ticker}<br>` +
            `Sector: ${company.sector}<br>` +
            `Change: ${company.changePct}%<br><br>` +
            `<button class="openDetailBtn" data-ticker="${company.ticker}">View details</button>`
        );

        markersByTicker[company.ticker.toUpperCase()] = marker;
    });

    // hook up "View details" buttons when a popup opens
    map.on('popupopen', function(e) {
        var btn = e.popup._contentNode.querySelector('.openDetailBtn');
        if (btn) {
            btn.addEventListener('click', function() {
                var t = btn.getAttribute('data-ticker');
                openCompanyView(t);
            });
        }
    });
}


// ---------- SEARCH ----------
function searchCompanies(query) {
    if (!query) return [];
    query = query.trim().toLowerCase();

    return companiesData.filter(function (company) {
        const tickerMatch = company.ticker.toLowerCase().includes(query);
        const nameMatch = company.name.toLowerCase().includes(query);
        return tickerMatch || nameMatch;
    });
}

function zoomOnMap(company) {
    map.setView([company.lat, company.lon], 10);
    var marker = markersByTicker[company.ticker.toUpperCase()];
    if (marker) {
        marker.openPopup();
    }
}

function showResults(matches) {
    var resultsDiv = document.getElementById("results");
    if (!resultsDiv) return;

    if (matches.length === 0) {
        resultsDiv.innerHTML = "<div>No matches found.</div>";
        return;
    }

    var html = matches.map(function(company, idx) {
        return `
            <div class="result-item"
                 data-idx="${idx}"
                 style="padding:6px 0; border-bottom:1px solid #ddd; cursor:pointer; text-align:left;">
                <strong>${company.ticker}</strong> — ${company.name}
                <button data-ticker="${company.ticker}"
                        style="margin-left:8px; font-size:12px; border:1px solid #007bff; background:#fff; color:#007bff; border-radius:4px; cursor:pointer;">
                    Open
                </button>
            </div>
        `;
    }).join("");

    resultsDiv.innerHTML = html;

    var items = resultsDiv.querySelectorAll(".result-item");
    items.forEach(function(item) {
        item.addEventListener("click", function(e) {
            if (e.target.tagName.toLowerCase() === "button") return;
            var idx = parseInt(item.getAttribute("data-idx"), 10);
            var chosen = matches[idx];
            zoomOnMap(chosen);
        });
    });

    var openButtons = resultsDiv.querySelectorAll("button[data-ticker]");
    openButtons.forEach(function(btn) {
        btn.addEventListener("click", function(e) {
            e.stopPropagation();
            var ticker = btn.getAttribute("data-ticker");
            openCompanyView(ticker);
        });
    });
}


// search UI events
var searchButton = document.getElementById("searchButton");
var searchInput = document.getElementById("searchInput");

if (searchButton && searchInput) {
    searchButton.addEventListener("click", function() {
        var q = searchInput.value;
        var matches = searchCompanies(q);
        showResults(matches);

        if (matches.length === 1) {
            zoomOnMap(matches[0]);
        }
    });

    searchInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            var q = searchInput.value;
            var matches = searchCompanies(q);
            showResults(matches);
            if (matches.length === 1) {
                zoomOnMap(matches[0]);
            }
        }
    });
}


// ---------- SECTOR FILTER ----------
var sectorFilter = document.getElementById("sectorFilter");
if (sectorFilter) {
    sectorFilter.addEventListener("change", function() {
        activeSectorFilter = sectorFilter.value;
        drawCompaniesOnMap();
    });
}


// ---------- WATCHLIST PANEL ON MAP ----------
function renderWatchlistPanel() {
    var panel = document.getElementById("watchlistPanel");
    if (!panel) return;

    // build a list from watchlist {}
    var watchedTickers = Object.keys(watchlist).filter(t => watchlist[t]);

    if (watchedTickers.length === 0) {
        panel.innerHTML = `<div class="emptyMsg">Nothing watched yet.</div>`;
        return;
    }

    var html = watchedTickers.map(function(tkr) {
        var c = getCompanyByTicker(tkr);
        if (!c) return "";
        return `
            <div class="watchItem">
                <div>
                    <strong>${c.ticker}</strong><br>
                    <span style="font-size:12px; color:#555;">${c.name}</span>
                </div>
                <button class="watchOpenBtn" data-ticker="${c.ticker}">Open</button>
            </div>
        `;
    }).join("");

    panel.innerHTML = html;

    // wire up open buttons
    panel.querySelectorAll(".watchOpenBtn").forEach(function(btn){
        btn.addEventListener("click", function() {
            var t = btn.getAttribute("data-ticker");
            openCompanyView(t);
        });
    });
}


// ---------- COMPANY DETAIL VIEW ----------
function getCompanyByTicker(ticker) {
    ticker = ticker.toUpperCase();
    return companiesData.find(c => c.ticker.toUpperCase() === ticker);
}

function openCompanyView(ticker) {
    var c = getCompanyByTicker(ticker);
    if (!c) return;

    document.getElementById("mapView").style.display = "none";
    document.getElementById("companyView").style.display = "block";

    document.getElementById("companyTitle").textContent = `${c.ticker} — ${c.name}`;
    document.getElementById("companySector").textContent = `Sector: ${c.sector || "N/A"}`;
    document.getElementById("companyHQ").textContent = `HQ: ${c.hq || "N/A"}`;
   document.getElementById("companyAbout").textContent = c.about || "No description yet.";
    
    renderPeers(c);
    renderWatchState(c.ticker);
    renderPriceChart(c);
    loadChatMessages(c.ticker);

    // 🔥 NEW: pull live quote from backend and update UI + marker color
    fetchLiveQuoteForTicker(c.ticker).then(function(q) {
             console.log("LIVE QUOTE RESULT FOR", c.ticker, q);

        // fill "Live Price / Prev Close / Change"
        renderLiveQuoteBox(q);

        // recolor this company's marker on the map based on today's real change
        if (q && typeof q.changePct === "number") {
            updateMarkerColor(c.ticker, q.changePct);
        }
    });
}


function backToMap() {
    document.getElementById("companyView").style.display = "none";
    document.getElementById("mapView").style.display = "block";

    // redraw markers so filter still applies
    drawCompaniesOnMap();
    // also update watchlist panel in case watchlist changed
    renderWatchlistPanel();
}

var backBtn = document.getElementById("backToMapBtn");
if (backBtn) {
    backBtn.addEventListener("click", backToMap);
}


// ---------- PEERS ----------
function renderPeers(company) {
    var peersDiv = document.getElementById("companyPeers");
    peersDiv.innerHTML = "";

    if (!company.peers || company.peers.length === 0) {
        peersDiv.textContent = "No peers listed.";
        return;
    }

    company.peers.forEach(function(peerTicker) {
        var peerCompany = getCompanyByTicker(peerTicker);
        var pill = document.createElement("span");
        pill.className = "peer-pill";
        pill.textContent = peerTicker + (peerCompany ? ` (${peerCompany.name})` : "");
        pill.addEventListener("click", function() {
            openCompanyView(peerTicker);
        });
        peersDiv.appendChild(pill);
    });
}


// ---------- WATCHLIST (detail view) ----------
function renderWatchState(ticker) {
    var watchBtn = document.getElementById("watchToggleBtn");
    var watchStatus = document.getElementById("watchStatus");

    var isWatching = !!watchlist[ticker];

    if (isWatching) {
        watchBtn.textContent = "Remove from Watch";
        watchBtn.classList.add("watchBtn","watching");
        watchStatus.textContent = "You are watching this ticker.";
    } else {
        watchBtn.textContent = "Add to Watch";
        watchBtn.classList.add("watchBtn");
        watchBtn.classList.remove("watching");
        watchStatus.textContent = "Not watching this ticker.";
    }

    watchBtn.onclick = function() {
        watchlist[ticker] = !watchlist[ticker];

        // persist watchlist
        localStorage.setItem("tickerWatchlist", JSON.stringify(watchlist));

        renderWatchState(ticker);
        renderWatchlistPanel(); // update map view's watchlist panel
    };
}


// ---------- CHART ----------
function renderPriceChart(company) {
    var ctx = document.getElementById('priceChart').getContext('2d');

    if (priceChart) {
        priceChart.destroy();
    }

    var labels = (company.samplePrices || []).map((_, i) => `Day ${i+1}`);

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: company.ticker + " price (sample)",
                data: company.samplePrices || [],
                fill: false
            }]
        },
        options: {
            responsive: false,
            scales: {
                x: { ticks: { font: { size: 10 } } },
                y: { ticks: { font: { size: 10 } } }
            }
        }
    });
}


// ---------- CHAT / NOTES ----------
function loadChatMessages(ticker) {
    var box = document.getElementById("chatMessages");
    box.innerHTML = "";

    if (!chats[ticker]) {
        chats[ticker] = [];
    }

    chats[ticker].forEach(function(msg) {
        var div = document.createElement("div");
        div.style.padding = "4px 0";
        div.style.borderBottom = "1px solid #eee";
        div.textContent = msg;
        box.appendChild(div);
    });

    wireChatSend(ticker);
}

function wireChatSend(ticker) {
    var sendBtn = document.getElementById("chatSendBtn");
    var input = document.getElementById("chatInput");
    var box = document.getElementById("chatMessages");

    sendBtn.onclick = function() {
        var text = input.value.trim();
        if (!text) return;
        if (!chats[ticker]) chats[ticker] = [];
        chats[ticker].push(text);

        // persist chats
        localStorage.setItem("tickerChats", JSON.stringify(chats));

        var div = document.createElement("div");
        div.style.padding = "4px 0";
        div.style.borderBottom = "1px solid #eee";
        div.textContent = text;
        box.appendChild(div);

        input.value = "";
        box.scrollTop = box.scrollHeight;
    };
}


// recolor a ticker's marker using real % change
function updateMarkerColor(ticker, changePct) {
    ticker = ticker.toUpperCase();

    var marker = markersByTicker[ticker];
    if (!marker) return;

    // decide colors based on live changePct
    let bg, border;
    if (changePct > 0) {
        bg = "#2ecc71"; // green
        border = "#1b9a52";
    } else if (changePct < 0) {
        bg = "#e74c3c"; // red
        border = "#9e2f22";
    } else {
        bg = "#888";
        border = "#555";
    }

    // Rebuild the icon HTML with new colors
    var html = `
      <div class="ticker-label"
           style="
             background-color:${bg};
             border-color:${border};
           ">
        ${ticker}
      </div>
    `;

    var tickerIcon = L.divIcon({
        className: 'ticker-icon',
        html: html,
        iconSize: [60, 25],
        iconAnchor: [30, 12]
    });

    // Leaflet trick: setIcon on the marker
    marker.setIcon(tickerIcon);
}


// ---------- INITIALIZE ----------
drawCompaniesOnMap();
renderWatchlistPanel();
