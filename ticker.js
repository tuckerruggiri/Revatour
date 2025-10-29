(function () {
    // --------------------------
    // Fake data so UI works
    // --------------------------

    // pretend this is your user's saved watchlist
    const watchlist = ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN"];

    // pretend fundamental snapshot data
    const fundamentalsByTicker = {
        AAPL: {
            name: "Apple Inc.",
            price: 227.12,
            changePct: +1.24,
            marketCap: "3.5T",
            sharesOut: "15.6B",
            range52w: "164 - 233",
            volume: "42M",
            confidenceAvg: 4.2,
        },
        NVDA: {
            name: "NVIDIA Corp.",
            price: 118.77,
            changePct: -0.83,
            marketCap: "2.9T",
            sharesOut: "2.46B",
            range52w: "39 - 140",
            volume: "61M",
            confidenceAvg: 4.6,
        },
        TSLA: {
            name: "Tesla, Inc.",
            price: 242.15,
            changePct: +0.4,
            marketCap: "770B",
            sharesOut: "3.19B",
            range52w: "138 - 299",
            volume: "89M",
            confidenceAvg: 3.1,
        },
        MSFT: {
            name: "Microsoft Corp.",
            price: 432.88,
            changePct: +0.9,
            marketCap: "3.2T",
            sharesOut: "7.45B",
            range52w: "309 - 441",
            volume: "21M",
            confidenceAvg: 4.4,
        },
        AMZN: {
            name: "Amazon.com Inc.",
            price: 191.64,
            changePct: +0.2,
            marketCap: "2.0T",
            sharesOut: "10.3B",
            range52w: "118 - 201",
            volume: "38M",
            confidenceAvg: 4.0,
        },
    };

    // pretend thread posts (per ticker)
    // later: you can attach replies[] inside each post
    const forumPosts = {
        AAPL: [
            {
                id: "p1",
                author: "ValueDude",
                avatar: "VD",
                text: "iPhone cycle isn't dead. ASP keeps climbing 📈",
                confidence: 4,
                timestamp: Date.now() - 1000 * 60 * 30, // 30 min ago
                replies: [
                    {
                        author: "ChartGirl",
                        text: "Also services margin is insane.",
                        timestamp: Date.now() - 1000 * 60 * 10,
                    },
                ],
            },
        ],
        NVDA: [
            {
                id: "p2",
                author: "ChipQueen",
                avatar: "CQ",
                text: "Datacenter demand is still ridiculous. AI buildout has legs.",
                confidence: 5,
                timestamp: Date.now() - 1000 * 60 * 90,
                replies: [],
            },
        ],
        TSLA: [
            {
                id: "p3",
                author: "EVmax",
                avatar: "EV",
                text: "Energy storage is the sleeper unit. Everyone staring at autos lol.",
                confidence: 3,
                timestamp: Date.now() - 1000 * 60 * 180,
                replies: [
                    {
                        author: "BearishBob",
                        text: "Margins still compressing though.",
                        timestamp: Date.now() - 1000 * 60 * 100,
                    },
                ],
            },
        ],
    };

    // --------------------------
    // DOM cache
    // --------------------------
    const dom = {
        // sidebar
        watchlistList: document.getElementById("watchlistList"),
        tickerSearchInput: document.getElementById("tickerSearchInputForum"),
        tickerSearchGo: document.getElementById("tickerSearchGo"),

        // snapshot
        snapTicker: document.getElementById("snapTicker"),
        snapName: document.getElementById("snapName"),
        snapPrice: document.getElementById("snapPrice"),
        snapChange: document.getElementById("snapChange"),
        snapMktCap: document.getElementById("snapMktCap"),
        snapShares: document.getElementById("snapShares"),
        snapRange: document.getElementById("snapRange"),
        snapVol: document.getElementById("snapVol"),
        snapConfidence: document.getElementById("snapConfidence"),

        // composer
        composeTicker: document.getElementById("composeTicker"),
        forumPostText: document.getElementById("forumPostText"),
        forumConfidence: document.getElementById("forumConfidence"),
        forumPostImage: document.getElementById("forumPostImage"),
        forumFileName: document.getElementById("forumFileName"),
        forumSubmitBtn: document.getElementById("forumSubmitBtn"),

        // thread list
        forumThreadList: document.getElementById("forumThreadList"),
    };

    // --------------------------
    // Utils
    // --------------------------
    function getTickerFromURL() {
        const params = new URLSearchParams(window.location.search);
        const t = params.get("ticker");
        if (!t) return "AAPL"; // default
        return t.toUpperCase();
    }

    function setTickerInURL(ticker) {
        // hard nav so each ticker "has its own page"
        window.location = `ticker.html?ticker=${encodeURIComponent(ticker)}`;
    }

    function formatTimeAgo(ts) {
        const diffMs = Date.now() - ts;
        const min = 60 * 1000;
        const hour = 60 * min;
        const day = 24 * hour;

        if (diffMs < min) return "Just now";
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

    // --------------------------
    // Render sidebar
    // --------------------------
    function renderWatchlist() {
        dom.watchlistList.innerHTML = "";
        watchlist.forEach(ticker => {
            const li = document.createElement("li");
            li.className = "watchlist-row";
            li.innerHTML = `
                <button class="watchlist-ticker-btn" data-ticker="${ticker}">
                    <span class="watchlist-symbol">${ticker}</span>
                    <span class="watchlist-chevron">›</span>
                </button>
            `;
            dom.watchlistList.appendChild(li);
        });

        dom.watchlistList
            .querySelectorAll(".watchlist-ticker-btn")
            .forEach(btn => {
                btn.addEventListener("click", () => {
                    const t = btn.getAttribute("data-ticker");
                    setTickerInURL(t);
                });
            });
    }

    // --------------------------
    // Render snapshot / fundamentals
    // --------------------------
    function renderSnapshot(ticker) {
        const snap = fundamentalsByTicker[ticker] || {
            name: "Unknown Co.",
            price: 0,
            changePct: 0,
            marketCap: "–",
            sharesOut: "–",
            range52w: "–",
            volume: "–",
            confidenceAvg: "–",
        };

        dom.snapTicker.textContent = ticker;
        dom.snapName.textContent = snap.name;
        dom.snapPrice.textContent = `$${snap.price}`;
        dom.snapChange.textContent =
            (snap.changePct >= 0 ? "+" : "") + snap.changePct + "%";
        dom.snapChange.style.color = snap.changePct >= 0 ? "#059669" : "#dc2626";

        dom.snapMktCap.textContent = snap.marketCap;
        dom.snapShares.textContent = snap.sharesOut;
        dom.snapRange.textContent = snap.range52w;
        dom.snapVol.textContent = snap.volume;
        dom.snapConfidence.textContent = `${snap.confidenceAvg} / 5`;

        dom.composeTicker.textContent = ticker;
    }

    // --------------------------
    // Render thread list
    // --------------------------
    function renderThreads(ticker) {
        dom.forumThreadList.innerHTML = "";

        const posts = forumPosts[ticker] || [];

        if (posts.length === 0) {
            dom.forumThreadList.innerHTML = `
                <div class="empty-state">
                    <p>No posts yet for <strong>${ticker}</strong>.
                    Be the first to start the conversation.</p>
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            const wrapper = document.createElement("article");
            wrapper.className = "forum-post-card card";

            // replies list HTML
            let repliesHTML = "";
            if (post.replies && post.replies.length > 0) {
                repliesHTML = `
                    <div class="forum-replies">
                        ${post.replies
                            .map(
                                r => `
                            <div class="forum-reply">
                                <div class="forum-reply-header">
                                    <span class="forum-reply-author">${r.author}</span>
                                    <span class="forum-reply-time">${formatTimeAgo(
                                        r.timestamp
                                    )}</span>
                                </div>
                                <div class="forum-reply-body">
                                    ${r.text}
                                </div>
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                `;
            }

            wrapper.innerHTML = `
                <header class="forum-post-head">
                    <div class="forum-post-left">
                        <div class="forum-avatar">${post.avatar}</div>
                        <div>
                            <div class="forum-author">${post.author}</div>
                            <div class="forum-meta">
                                <span class="forum-time">${formatTimeAgo(
                                    post.timestamp
                                )}</span>
                                <span class="forum-conf">Conf: ${post.confidence}/5</span>
                            </div>
                        </div>
                    </div>
                    <div class="forum-post-right">
                        <button class="reply-btn" data-post-id="${post.id}">Reply</button>
                    </div>
                </header>

                <div class="forum-post-body">
                    <p>${post.text}</p>
                </div>

                ${repliesHTML}

                <div class="forum-inline-reply hidden" data-reply-box="${post.id}">
                    <textarea
                        class="forum-reply-input"
                        placeholder="Reply…"
                    ></textarea>
                    <button class="primary-btn small-btn send-reply-btn" data-send-reply="${post.id}">
                        Send
                    </button>
                </div>
            `;

            dom.forumThreadList.appendChild(wrapper);
        });

        // wire reply buttons
        dom.forumThreadList.querySelectorAll(".reply-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const postId = btn.getAttribute("data-post-id");
                const box = dom.forumThreadList.querySelector(
                    `[data-reply-box="${postId}"]`
                );
                if (box) {
                    box.classList.toggle("hidden");
                }
            });
        });

        // wire send reply buttons (demo only, doesn't persist yet)
        dom.forumThreadList.querySelectorAll(".send-reply-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const postId = btn.getAttribute("data-send-reply");
                const box = dom.forumThreadList.querySelector(
                    `[data-reply-box="${postId}"]`
                );
                if (!box) return;
                const ta = box.querySelector(".forum-reply-input");
                if (!ta.value.trim()) return;
                alert("Reply sent: " + ta.value.trim());
                ta.value = "";
                box.classList.add("hidden");
            });
        });
    }

    // --------------------------
    // Wire interactions
    // --------------------------
    function wireSearch() {
        dom.tickerSearchGo.addEventListener("click", () => {
            const t = dom.tickerSearchInput.value.trim().toUpperCase();
            if (!t) return;
            setTickerInURL(t);
        });

        dom.tickerSearchInput.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                const t = dom.tickerSearchInput.value.trim().toUpperCase();
                if (!t) return;
                setTickerInURL(t);
            }
        });
    }

    function wireImageInput() {
        const fileInput = dom.forumPostImage;
        const fileNameLabel = dom.forumFileName;
        fileInput.addEventListener("change", () => {
            fileNameLabel.textContent = fileInput.files[0]
                ? fileInput.files[0].name
                : "No file selected";
        });
    }

    function wireSubmitPost(currentTicker) {
        dom.forumSubmitBtn.addEventListener("click", () => {
            const text = dom.forumPostText.value.trim();
            if (!text) {
                dom.forumPostText.focus();
                return;
            }
            const confidence = parseInt(dom.forumConfidence.value, 10);

            // NOTE: not persisting yet, just simulating append
            const newPost = {
                id: "new-" + Date.now(),
                author: "You",
                avatar: "YOU",
                text,
                confidence,
                timestamp: Date.now(),
                replies: [],
            };

            if (!forumPosts[currentTicker]) {
                forumPosts[currentTicker] = [];
            }
            forumPosts[currentTicker].unshift(newPost);

            dom.forumPostText.value = "";
            dom.forumConfidence.value = "3";
            dom.forumPostImage.value = "";
            dom.forumFileName.textContent = "No file selected";

            renderThreads(currentTicker);
        });
    }

    // --------------------------
    // Init
    // --------------------------
    function init() {
        const ticker = getTickerFromURL();

        // sidebar
        renderWatchlist();
        wireSearch();

        // snapshot
        renderSnapshot(ticker);

        // posts
        renderThreads(ticker);

        // composer / form
        wireImageInput();
        wireSubmitPost(ticker);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
