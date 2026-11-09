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
    '.sc-body{flex:1;min-height:0;position:relative}.sc-body>div{position:absolute;inset:0}.sc-msg{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;height:100%;color:var(--mute,#777);padding:20px;text-align:center}' +
    '.sc-ft{padding:6px 14px;border-top:1px solid var(--line,#ddd);font-size:11px;color:var(--mute,#777)}' +
    '.sc-sv{position:relative;display:inline-block}.sc-pn{position:absolute;right:0;top:calc(100% + 6px);z-index:5;width:min(360px,86vw);background:var(--panel,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd);border-radius:12px;padding:10px;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:13px;text-align:left}.sc-pn[hidden]{display:none}.sc-pn h4{margin:0 0 6px;font-size:13px}.sc-pn .sv-r{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--line,#eee)}.sc-pn .sv-r a{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--accent,#2b7de0);text-decoration:none;font-weight:600}.sc-pn .sv-r button{border:0;background:none;color:var(--mute,#777);cursor:pointer;font-size:14px}.sc-pn input{width:100%;box-sizing:border-box;margin-top:6px;padding:6px 8px;border:1px solid var(--line,#ddd);border-radius:8px;background:var(--bg,#f6f6f6);color:inherit;font:inherit}.sc-pn .sv-n{color:var(--mute,#777);font-size:11px;margin-top:6px;line-height:1.4}' +
    '[data-chart]{cursor:pointer}.pl-tk,.mv-tk{background:none;border:0;border-bottom:1px dotted currentColor;color:inherit;font:inherit;font-weight:700;padding:0 1px;margin:0;cursor:pointer}.pl-tk:hover,.mv-tk:hover{color:var(--accent)}' +
    '.sc-ic{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-left:5px;padding:0;vertical-align:middle;border:1px solid var(--line,#ddd);border-radius:6px;background:var(--bg,#f6f6f6);color:var(--mute,#777);cursor:pointer}.sc-ic:hover{color:var(--accent,#2b7de0);border-color:var(--accent,#2b7de0)}' +
    '.sc-inl{margin:14px 0;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--panel,#fff);overflow:visible}.sc-inl .sc-hd{padding:8px 12px}.sc-inl .sc-body{height:min(70vh,560px)}' +
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

  /* Saved TradingView charts: the embedded widget cannot sign in, so we keep links to the user's own saved layouts
     (they open in the user's logged-in TradingView tab) and sync them with their account when possible. */
  var SV = null, SVK = "ss-tvcharts";
  function svLoad() {
    if (SV) return SV;
    try { SV = JSON.parse(localStorage.getItem(SVK) || "[]"); } catch (e) { SV = []; }
    if (window.StockPrefs && window.StockPrefs.ready && window.StockPrefs.ready() && !svLoad.p) { svLoad.p = 1; window.StockPrefs.get("tvcharts").then(function (r) { if (r && r.list && r.list.length >= SV.length) { SV = r.list; try { localStorage.setItem(SVK, JSON.stringify(SV)); } catch (e) {} } }); }
    return SV;
  }
  function svSave() { try { localStorage.setItem(SVK, JSON.stringify(SV)); } catch (e) {} if (window.StockPrefs && window.StockPrefs.ready && window.StockPrefs.ready()) window.StockPrefs.set("tvcharts", { list: SV, ts: Date.now() }); }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function svBtn(sym) { return '<span class="sc-sv"><button type="button" class="sc-lk" data-svt>My charts ▾</button><div class="sc-pn" hidden data-svp="' + sym + '"></div></span><a class="sc-lk" target="_blank" rel="tvmine" href="https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(sym) + '">My TradingView ↗</a>'; }
  function svPanel(p) {
    var sym = p.getAttribute("data-svp"), l = svLoad();
    p.innerHTML = '<h4>Saved charts</h4>' + (l.length ? l.map(function (c, i) { return '<div class="sv-r"><a target="tvmine" rel="noopener" href="' + esc(c.url) + '">' + esc(c.name) + '</a><button type="button" data-svd="' + i + '" title="Remove">✕</button></div>'; }).join("") : '<div class="sv-n">Nothing saved yet.</div>') +
      '<input data-svn placeholder="Name (e.g. ' + esc(sym) + ' 5m setup)"><input data-svu placeholder="Paste your TradingView chart link, press Enter">' +
      '<div class="sv-n">In TradingView, sign in once and use Save (Ctrl+S) to save a layout. Then copy its address from the browser and paste it here. Links open in your signed-in TradingView tab, with your drawings and indicators. The chart on this page is TradingView\'s free embed, which cannot sign in.</div>';
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-svt]");
    if (t) { var p = t.parentNode.querySelector(".sc-pn"); if (p.hidden) svPanel(p); p.hidden = !p.hidden; return; }
    var d = e.target.closest && e.target.closest("[data-svd]");
    if (d) { svLoad().splice(+d.getAttribute("data-svd"), 1); svSave(); svPanel(d.closest(".sc-pn")); return; }
    if (!e.target.closest || !e.target.closest(".sc-pn")) [].forEach.call(document.querySelectorAll(".sc-pn"), function (p) { p.hidden = true; });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || !e.target.matches || !e.target.matches("[data-svu]")) return;
    var p = e.target.closest(".sc-pn"), u = e.target.value.trim(), n = p.querySelector("[data-svn]").value.trim();
    if (!/^https:\/\/([a-z]+\.)?tradingview\.com\//i.test(u)) { e.target.value = ""; e.target.placeholder = "That is not a tradingview.com link"; return; }
    svLoad().push({ name: n || p.getAttribute("data-svp") + " chart", url: u }); svSave(); svPanel(p);
  }, true);
  function frames(cur2) {
    return FRAMES.map(function (f) { return '<button type="button" data-scf="' + f[0] + '" class="' + (f[0] === (cur2 || iv) ? "on" : "") + '">' + f[1] + '</button>'; }).join("");
  }
  /* embedded chart that fills a container on a page (used by each ticker page) */
  function embed(host, sym, iv0, opt) {
    opt = opt || {};
    sym = clean(sym); if (!sym || !host) return;
    ensureCss();
    var f = iv0 || "D"; host.className = (host.className + " sc-inl").trim();
    host.innerHTML = '<div class="sc-hd"><b>' + sym + ' chart</b><div class="sc-fr">' + frames(f) + '</div><span class="sc-sp"></span>' + (opt.mini ? '<a class="sc-lk" target="tvmine" rel="noopener" href="https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(sym) + '" title="Open in your TradingView">↗</a>' : svBtn(sym)) + '</div><div class="sc-body"></div>';
    host.onclick = function (e) {
      var b = e.target.closest("[data-scf]"); if (!b) return;
      f = b.getAttribute("data-scf"); [].forEach.call(host.querySelectorAll("[data-scf]"), function (x) { x.classList.toggle("on", x === b); }); draw(host, sym, f, false); if (opt.onframe) opt.onframe(f);
    };
    draw(host, sym, f, false);
  }
  function ensureCss() { if (!document.getElementById("sc-css")) { var st = document.createElement("style"); st.id = "sc-css"; st.textContent = CSS; document.head.appendChild(st); } }
  function open(sym) {
    sym = clean(sym); if (!sym) return;
    cur = sym; close();
    ensureCss();
    box = document.createElement("div"); box.className = "sc-mod"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", sym + " chart");
    box.innerHTML = '<div class="sc-box"><div class="sc-hd"><span class="sc-t"></span><div class="sc-fr">' + frames() + '</div><span class="sc-sp"></span>' +
      '<button type="button" class="tp-watch" data-wl="' + sym + '" data-wlbig="1"></button>' + svBtn(sym) + '<button type="button" class="sc-x" data-scx>Close ✕</button></div>' +
      '<div class="sc-body"></div><div class="sc-ft">Candles with a 9 EMA, 200 MA, VWAP and volume. Use the toolbar to change time frame, draw lines and add indicators. Chart by TradingView; prices may be delayed. Not investment advice.</div></div>';
    box.querySelector(".sc-t").textContent = sym;
    document.body.appendChild(box); if (window.StockChart && window.StockChart.syncWatch) window.StockChart.syncWatch();
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
  /* chart icon + watchlist star after every ticker on any page */
  var PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function watching(s) { return !!(window.StockWatch && window.StockWatch.has(s)); }
  var wlAsked = false;
  function setHtml(n, html) { if (n.__h !== html) { n.__h = html; n.innerHTML = html; } }
  function syncWl() {
    if (window.StockWatch && !window.StockWatch.ready() && !wlAsked && document.documentElement.classList.contains("authed") && document.querySelector("[data-wl]")) { wlAsked = true; window.StockWatch.load(); }
    [].forEach.call(document.querySelectorAll("[data-wl]"), function (n) {
      var s = n.getAttribute("data-wl"), on = watching(s);
      n.classList.toggle("on", on);
      if (n.hasAttribute("data-wlbig")) setHtml(n, (on ? CHECK : PLUS) + (on ? "On your watchlist" : "Add to watchlist"));
      else if (n.classList.contains("sc-wl")) { setHtml(n, (on ? CHECK : PLUS) + (n.getAttribute("data-lbl") ? (on ? "Watching" : "Watch") : "")); n.title = on ? "Remove " + s + " from watchlist" : "Add " + s + " to watchlist"; }
    });
    qwSync();
  }
  function wlBtn(s, label) {
    var b = document.createElement("button"); b.type = "button"; b.className = "sc-wl"; b.setAttribute("data-wl", s);
    if (label) b.setAttribute("data-lbl", "1"); b.setAttribute("aria-label", "Toggle " + s + " on watchlist"); return b;
  }
  function dec(root) {
    if (!root.querySelectorAll) return;
    var items = root.querySelectorAll('.tk[data-tk],[data-tk2],.mv-tk[data-chart],.pl-tk[data-chart]'), added = false;
    [].forEach.call(items, function (n) {
      if (n.getAttribute("data-sci") || n.closest(".sc-mod,.sc-inl,.al-strip,.qw-pop")) return;
      var s = clean(n.getAttribute("data-tk") || n.getAttribute("data-tk2") || n.getAttribute("data-chart")); if (!/^[A-Z]{1,5}(\.[A-Z])?$/.test(s)) return;
      n.setAttribute("data-sci", "1"); added = true;
      var anchor = n;
      if (!n.hasAttribute("data-chart")) {
        var b = document.createElement("button"); b.type = "button"; b.className = "sc-ic"; b.setAttribute("data-chart", s); b.title = "Open " + s + " chart"; b.setAttribute("aria-label", "Open " + s + " chart"); b.innerHTML = ICON;
        n.insertAdjacentElement("afterend", b); anchor = b;
      }
      anchor.insertAdjacentElement("afterend", wlBtn(s, n.classList.contains("mv-tk")));
    });
    if (added) syncWl();
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-wl]"); if (!t) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (window.StockWatch) window.StockWatch.toggle(t.getAttribute("data-wl")).then(syncWl);
  }, true);
  document.addEventListener("wl-change", syncWl);

  /* floating quick-add button on every page */
  var qw = null, fab = null;
  function qwSync() {
    if (!qw || !window.StockWatch) return;
    var l = window.StockWatch.list(), pop = ["SPY", "QQQ", "AAPL", "NVDA", "TSLA", "MSFT", "AMD", "META"].filter(function (s) { return l.indexOf(s) < 0; }).slice(0, 6);
    setHtml(qw.querySelector(".qw-have"), l.length ? l.map(function (s) { return '<button type="button" class="qw-chip" data-tk="' + s + '">' + s + '</button>'; }).join("") : '<span style="color:var(--mute);font-size:.85rem">Nothing yet. Add your first ticker above.</span>');
    setHtml(qw.querySelector(".qw-sug"), pop.map(function (s) { return '<button type="button" class="qw-chip add" data-qwadd="' + s + '">' + s + '</button>'; }).join(""));
    qw.querySelector(".qw-sugw").style.display = pop.length ? "" : "none";
  }
  function qwToggle(force) {
    if (!qw) return;
    var show = force == null ? qw.hidden : force; qw.hidden = !show;
    if (show) { if (window.StockWatch) window.StockWatch.load(); qwSync(); setTimeout(function () { var i = qw.querySelector("input"); if (i) i.focus(); }, 30); }
  }
  function qwInit() {
    if (fab || !document.body) return;
    fab = document.createElement("button"); fab.type = "button"; fab.className = "qw-fab"; fab.setAttribute("aria-label", "Add a stock to your watchlist"); fab.innerHTML = PLUS + "Add to watchlist";
    qw = document.createElement("div"); qw.className = "qw-pop"; qw.hidden = true;
    qw.innerHTML = '<h3>Add to your watchlist</h3><p>Type a ticker, or tap one below. It shows on your Home screen.</p><form class="qw-form" autocomplete="off"><input type="text" maxlength="7" placeholder="Ticker, like NVDA" aria-label="Ticker symbol"><button type="submit">Add</button></form><div class="qw-l">Quick add</div><div class="qw-chips qw-sugw"><span class="qw-sug qw-chips"></span></div><div class="qw-l">Your watchlist</div><div class="qw-chips qw-have"></div>';
    document.body.appendChild(qw); document.body.appendChild(fab);
    fab.addEventListener("click", function () { qwToggle(); });
    qw.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault(); var i = qw.querySelector("input"), v = i.value;
      if (window.StockWatch) window.StockWatch.add(v).then(function (ok) { if (ok) i.value = ""; syncWl(); i.focus(); });
    });
    qw.addEventListener("click", function (e) {
      var a = e.target.closest("[data-qwadd]");
      if (a && window.StockWatch) { window.StockWatch.add(a.getAttribute("data-qwadd")).then(syncWl); return; }
      if (e.target.closest("[data-tk]")) qwToggle(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") qwToggle(false); });
    document.addEventListener("click", function (e) { if (qw && !qw.hidden && e.target.isConnected && !qw.contains(e.target) && !fab.contains(e.target)) qwToggle(false); });
  }
  var pend = false;
  function schedule() { if (pend) return; pend = true; (window.requestAnimationFrame || setTimeout)(function () { pend = false; dec(document.body); syncWl(); }); }
  function start() { qwInit(); dec(document.body); new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

  window.StockChart = { syncWatch: syncWl, open: open, close: close, link: link, embed: embed, icon: ICON };
})();
