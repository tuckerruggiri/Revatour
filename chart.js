/* Stock chart popup. Any element with data-chart="TICKER" opens a full candlestick chart
   (moving averages, VWAP, volume, every time frame) without leaving the site.
   The chart is TradingView's free embeddable chart, so there is no data key or server to run. */
(function () {
  "use strict";
  var TV_SRC = "https://s3.tradingview.com/tv.js", loading = null, cur = null, iv = "D", box = null;
  var FRAMES = [["1", "1m"], ["5", "5m"], ["15", "15m"], ["60", "1h"], ["D", "Daily"], ["W", "Weekly"]];
  var STOP = { TIPS: 1, IF: 1, THEN: 1, AND: 1, NEW: 1 };

  var CSS = '.sc-mod{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:2vh 2vw}' +
    '.sc-box{width:100%;max-width:1700px;height:100%;background:var(--panel,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd);border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4)}' +
    '.sc-hd{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 14px;border-bottom:1px solid var(--line,#ddd)}.sc-t{font-size:22px;font-weight:800;letter-spacing:.5px}.sc-sub{color:var(--mute,#777);font-size:12px}' +
    '.sc-fr{display:flex;gap:6px;flex-wrap:wrap}.sc-fr button,.sc-x,.sc-lk{border:1px solid var(--line,#ddd);background:var(--bg,#f6f6f6);color:var(--ink,#111);border-radius:999px;padding:5px 12px;font:inherit;font-size:13px;cursor:pointer;text-decoration:none}' +
    '.sc-fr button.on{background:var(--accent,#2b7de0);color:var(--accent-ink,#fff);border-color:var(--accent,#2b7de0);font-weight:700}.sc-sp{flex:1}' +
    '.sc-body{flex:1;min-height:0;position:relative}.sc-body>div{position:absolute;inset:0}.sc-msg{display:grid;place-items:center;height:100%;color:var(--mute,#777);padding:20px;text-align:center}' +
    '.sc-ft{padding:6px 14px;border-top:1px solid var(--line,#ddd);font-size:11px;color:var(--mute,#777)}' +
    '[data-chart]{cursor:pointer}.pl-tk,.mv-tk{background:none;border:0;border-bottom:1px dotted currentColor;color:inherit;font:inherit;font-weight:700;padding:0 1px;margin:0;cursor:pointer}.pl-tk:hover,.mv-tk:hover{color:var(--accent)}' +
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
  function draw() {
    var body = box.querySelector(".sc-body");
    body.innerHTML = '<div class="sc-msg">Loading chart…</div>';
    loadTV().then(function () {
      if (!box) return;
      body.innerHTML = '<div id="sc-tv"></div>';
      new window.TradingView.widget({
        container_id: "sc-tv", autosize: true, symbol: cur, interval: iv, timezone: "America/New_York",
        theme: dark() ? "dark" : "light", style: "1", locale: "en", enable_publishing: false,
        allow_symbol_change: true, withdateranges: true, hide_side_toolbar: false, save_image: true, details: false,
        studies: ["Volume@tv-basicstudies", "MAExp@tv-basicstudies", "MASimple@tv-basicstudies", "VWAP@tv-basicstudies"],
        studies_overrides: { "moving average exponential.length": 9, "moving average.length": 200 }
      });
    }).catch(function () {
      body.innerHTML = '<div class="sc-msg">The chart could not load (offline or blocked). <a href="https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(cur) + '" target="_blank" rel="noopener" style="margin-left:6px">Open on TradingView ↗</a></div>';
    });
  }
  function frames() {
    return FRAMES.map(function (f) { return '<button type="button" data-scf="' + f[0] + '" class="' + (f[0] === iv ? "on" : "") + '">' + f[1] + '</button>'; }).join("");
  }
  function open(sym) {
    sym = clean(sym); if (!sym) return;
    cur = sym; close();
    if (!document.getElementById("sc-css")) { var st = document.createElement("style"); st.id = "sc-css"; st.textContent = CSS; document.head.appendChild(st); }
    box = document.createElement("div"); box.className = "sc-mod"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", sym + " chart");
    box.innerHTML = '<div class="sc-box"><div class="sc-hd"><span class="sc-t"></span><div class="sc-fr">' + frames() + '</div><span class="sc-sp"></span>' +
      '<a class="sc-lk" target="_blank" rel="noopener" href="https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(sym) + '">Full TradingView ↗</a><button type="button" class="sc-x" data-scx>Close ✕</button></div>' +
      '<div class="sc-body"></div><div class="sc-ft">Candles with a 9 EMA, 200 MA, VWAP and volume. Use the toolbar to change time frame, draw lines and add indicators. Chart by TradingView; prices may be delayed. Not investment advice.</div></div>';
    box.querySelector(".sc-t").textContent = sym;
    document.body.appendChild(box);
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.closest("[data-scx]")) return close();
      var b = e.target.closest("[data-scf]");
      if (b) { iv = b.getAttribute("data-scf"); [].forEach.call(box.querySelectorAll("[data-scf]"), function (x) { x.classList.toggle("on", x === b); }); draw(); }
    });
    draw();
  }
  function close() { if (box && box.parentNode) box.parentNode.removeChild(box); box = null; }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-chart]");
    if (t) { e.preventDefault(); open(t.getAttribute("data-chart")); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box) close(); });

  /* turn ticker-looking words (JPM, ITB, XLF) in a trusted label into clickable buttons; everything else stays text */
  function link(text, cls) {
    return String(text == null ? "" : text).split(/(\s+)/).map(function (w) {
      var esc = w.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
      return /^[A-Z]{2,5}$/.test(w) && !STOP[w] ? '<button type="button" class="' + (cls || "pl-tk") + '" data-chart="' + w + '" title="Open ' + w + ' chart">' + w + '</button>' : esc;
    }).join("");
  }
  window.StockChart = { open: open, close: close, link: link };
})();
