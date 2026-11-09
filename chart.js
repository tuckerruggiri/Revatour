/* Stock chart popup. Any element with data-chart="TICKER" opens a full candlestick chart
   (moving averages, VWAP, volume, every time frame) without leaving the site.
   The chart is TradingView's free embeddable chart, so there is no data key or server to run. */
(function () {
  "use strict";
  var TV_SRC = "https://s3.tradingview.com/tv.js", loading = null, cur = null, iv = "D", box = null, seq = 0;
  var FRAMES = [["1", "1m"], ["5", "5m"], ["15", "15m"], ["60", "1h"], ["D", "Daily"], ["W", "Weekly"]];
  var ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 3v4M7 17v4M17 6v3M17 15v5"/><rect x="4.5" y="7" width="5" height="10" rx="1"/><rect x="14.5" y="9" width="5" height="6" rx="1"/></svg>';
  var STOP = { TIPS: 1, IF: 1, THEN: 1, AND: 1, NEW: 1 };

  var CSS = '.sc-mod{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:2vh 2vw}' +
    '.sc-box{width:100%;max-width:1700px;height:100%;background:var(--panel,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd);border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4)}' +
    '.sc-hd{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 14px;border-bottom:1px solid var(--line,#ddd)}.sc-t{font-size:22px;font-weight:800;letter-spacing:.5px}.sc-sub{color:var(--mute,#777);font-size:12px}' +
    '.sc-fr{display:flex;gap:6px;flex-wrap:wrap}.sc-fr button,.sc-x,.sc-lk{border:1px solid var(--line,#ddd);background:var(--bg,#f6f6f6);color:var(--ink,#111);border-radius:999px;padding:5px 12px;font:inherit;font-size:13px;cursor:pointer;text-decoration:none}' +
    '.sc-fr button.on{background:var(--accent,#2b7de0);color:var(--accent-ink,#fff);border-color:var(--accent,#2b7de0);font-weight:700}.sc-sp{flex:1}' +
    '.sc-body{flex:1;min-height:0;position:relative}.sc-body>div{position:absolute;inset:0}.sc-msg{display:grid;place-items:center;height:100%;color:var(--mute,#777);padding:20px;text-align:center}' +
    '.sc-ft{padding:6px 14px;border-top:1px solid var(--line,#ddd);font-size:11px;color:var(--mute,#777)}' +
    '[data-chart]{cursor:pointer}.pl-tk,.mv-tk{background:none;border:0;border-bottom:1px dotted currentColor;color:inherit;font:inherit;font-weight:700;padding:0 1px;margin:0;cursor:pointer}.pl-tk:hover,.mv-tk:hover{color:var(--accent)}' +
    '.sc-ic{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-left:5px;padding:0;vertical-align:middle;border:1px solid var(--line,#ddd);border-radius:6px;background:var(--bg,#f6f6f6);color:var(--mute,#777);cursor:pointer}.sc-ic:hover{color:var(--accent,#2b7de0);border-color:var(--accent,#2b7de0)}' +
    '.sc-inl{margin:14px 0;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--panel,#fff);overflow:hidden}.sc-inl .sc-hd{padding:8px 12px}.sc-inl .sc-body{height:min(70vh,560px)}' +
    '@media(max-width:700px){.sc-mod{padding:0}.sc-box{border-radius:0}}';

  function dark() {
    try {
      var c = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255, 255, 255];
      return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) < 140;
    } catch (e) { return false; }
  }
  function loadTV() {
    if (window.TradingView && window.TradingView.widget) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (ok, no) {
      var s = document.createElement("script"); s.src = TV_SRC; s.async = true;
      s.onload = ok; s.onerror = function () { loading = null; no(); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function clean(sym) { return String(sym || "").toUpperCase().replace(/[^A-Z0-9.\-:]/g, "").slice(0, 20); }
  function draw(root, sym, interval, isOpen) {
    root = root || box; sym = sym || cur; interval = interval || iv;
    var body = root.querySelector(".sc-body"), cid = "sc-tv-" + (++seq);
    body.innerHTML = '<div class="sc-msg">Loading chart…</div>';
    loadTV().then(function () {
      if (!root.isConnected || (isOpen !== false && root === box && !box)) return;
      body.innerHTML = '<div id="' + cid + '"></div>';
      new window.TradingView.widget({
        container_id: cid, autosize: true, symbol: sym, interval: interval, timezone: "America/New_York",
        theme: dark() ? "dark" : "light", style: "1", locale: "en", enable_publishing: false,
        allow_symbol_change: true, withdateranges: true, hide_side_toolbar: false, save_image: true, details: false,
        studies: ["Volume@tv-basicstudies", "MAExp@tv-basicstudies", "MASimple@tv-basicstudies", "VWAP@tv-basicstudies"],
        studies_overrides: { "moving average exponential.length": 9, "moving average.length": 200 }
      });
    }).catch(function () {
      body.innerHTML = '<div class="sc-msg">The chart could not load (offline or blocked). <a href="https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(sym) + '" target="_blank" rel="noopener" style="margin-left:6px">Open on TradingView ↗</a></div>';
    });
  }
  function frames(cur2) {
    return FRAMES.map(function (f) { return '<button type="button" data-scf="' + f[0] + '" class="' + (f[0] === (cur2 || iv) ? "on" : "") + '">' + f[1] + '</button>'; }).join("");
  }
  /* inline chart: lives inside a page (used on each ticker's own page) */
  function mount(host, sym) {
    sym = clean(sym); if (!sym || !host) return;
    ensureCss();
    var wrap = document.createElement("div"); wrap.className = "sc-inl"; wrap.id = "tkchart"; var f = "D";
    wrap.innerHTML = '<div class="sc-hd"><b>Chart</b><div class="sc-fr">' + frames(f) + '</div><span class="sc-sp"></span><button type="button" class="sc-lk" data-chart="' + sym + '">Expand ⤢</button></div><div class="sc-body"></div>';
    host.insertAdjacentElement("afterend", wrap);
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-scf]"); if (!b) return;
      f = b.getAttribute("data-scf"); [].forEach.call(wrap.querySelectorAll("[data-scf]"), function (x) { x.classList.toggle("on", x === b); }); draw(wrap, sym, f, false);
    });
    draw(wrap, sym, f, false);
  }
  function ensureCss() { if (!document.getElementById("sc-css")) { var st = document.createElement("style"); st.id = "sc-css"; st.textContent = CSS; document.head.appendChild(st); } }
  function open(sym) {
    sym = clean(sym); if (!sym) return;
    cur = sym; close();
    ensureCss();
    box = document.createElement("div"); box.className = "sc-mod"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", sym + " chart");
    box.innerHTML = '<div class="sc-box"><div class="sc-hd"><span class="sc-t"></span><div class="sc-fr">' + frames() + '</div><span class="sc-sp"></span>' +
      '<a class="sc-lk" target="_blank" rel="noopener" href="https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(sym) + '">Full TradingView ↗</a><button type="button" class="sc-x" data-scx>Close ✕</button></div>' +
      '<div class="sc-body"></div><div class="sc-ft">Candles with a 9 EMA, 200 MA, VWAP and volume. Use the toolbar to change time frame, draw lines and add indicators. Chart by TradingView; prices may be delayed. Not investment advice.</div></div>';
    box.querySelector(".sc-t").textContent = sym;
    document.body.appendChild(box);
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.closest("[data-scx]")) return close();
      var b = e.target.closest("[data-scf]");
      if (b) { iv = b.getAttribute("data-scf"); [].forEach.call(box.querySelectorAll("[data-scf]"), function (x) { x.classList.toggle("on", x === b); }); draw(box, cur, iv); }
    });
    draw(box, cur, iv);
  }
  function close() { if (box && box.parentNode) box.parentNode.removeChild(box); box = null; }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-chart]");
    if (t) { e.preventDefault(); e.stopImmediatePropagation(); open(t.getAttribute("data-chart")); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box) close(); });

  /* turn ticker-looking words (JPM, ITB, XLF) in a trusted label into clickable buttons; everything else stays text */
  function link(text, cls) {
    return String(text == null ? "" : text).split(/(\s+)/).map(function (w) {
      var esc = w.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
      return /^[A-Z]{2,5}$/.test(w) && !STOP[w] ? '<button type="button" class="' + (cls || "pl-tk") + '" data-chart="' + w + '" title="Open ' + w + ' chart">' + w + '</button>' : esc;
    }).join("");
  }
  /* add a small chart button after every $TICKER chip, alert, news tag and watchlist row on any page */
  function dec(root) {
    if (!root.querySelectorAll) return;
    var items = root.querySelectorAll('.tk[data-tk],[data-tk2],.wl-tk[data-wlsel]');
    [].forEach.call(items, function (n) {
      if (n.getAttribute("data-sci") || n.closest(".sc-mod,.sc-inl")) return;
      var s = clean(n.getAttribute("data-tk") || n.getAttribute("data-tk2") || n.getAttribute("data-wlsel")); if (!/^[A-Z]{1,5}(\.[A-Z])?$/.test(s)) return;
      n.setAttribute("data-sci", "1");
      var b = document.createElement("button"); b.type = "button"; b.className = "sc-ic"; b.setAttribute("data-chart", s); b.title = "Open " + s + " chart"; b.setAttribute("aria-label", "Open " + s + " chart"); b.innerHTML = ICON;
      n.insertAdjacentElement("afterend", b);
    });
    var tq = root.id === "tickerv" ? root : root.querySelector && root.querySelector("#tickerv");
    var h1 = tq && tq.querySelector("h1"), q = tq && tq.querySelector("#tkquote");
    if (h1 && q && !tq.querySelector("#tkchart")) { var sym = clean((h1.textContent || "").replace("$", "")); if (/^[A-Z]{1,5}(\.[A-Z])?$/.test(sym)) { ensureCss(); mount(q, sym); } }
  }
  var pend = false;
  function schedule() { if (pend) return; pend = true; (window.requestAnimationFrame || setTimeout)(function () { pend = false; dec(document.body); }); }
  function start() { dec(document.body); new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

  window.StockChart = { open: open, close: close, link: link, mount: mount, icon: ICON };
})();
