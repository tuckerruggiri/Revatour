/* Charts: a dedicated multi-chart workspace (Trading day -> Charts).
   Several TradingView charts side by side, each with its own symbol, time frame, style and indicators.
   Pick a grid layout, drag the dividers to resize, link all panes to one symbol, use one-click multi-time-frame
   presets, and save/load named layouts (kept in your account when signed in, otherwise in this browser).
   Data and drawing tools come from TradingView's free embeddable chart. Education only, not advice. */
(function (root) {
  "use strict";
  var LAST = "ss-charts-last-v1", SAVED = "ss-charts-layouts-v1", MAXP = 8, seq = 0;
  var IVS = [["1", "1m"], ["3", "3m"], ["5", "5m"], ["15", "15m"], ["30", "30m"], ["60", "1h"], ["240", "4h"], ["D", "D"], ["W", "W"]];
  var STYLES = [["1", "Candles"], ["9", "Hollow candles"], ["8", "Heikin Ashi"], ["0", "Bars"], ["2", "Line"], ["3", "Area"]];
  var STUDIES = [["vol", "Volume", "Volume@tv-basicstudies"], ["ema", "EMA 9", "MAExp@tv-basicstudies"], ["sma", "SMA 200", "MASimple@tv-basicstudies"], ["vwap", "VWAP", "VWAP@tv-basicstudies"],
    ["bb", "Bollinger Bands", "BB@tv-basicstudies"], ["rsi", "RSI", "RSI@tv-basicstudies"], ["macd", "MACD", "MACD@tv-basicstudies"], ["atr", "ATR", "ATR@tv-basicstudies"],
    ["ichi", "Ichimoku", "IchimokuCloud@tv-basicstudies"], ["piv", "Pivot points", "PivotPointsStandard@tv-basicstudies"]];
  /* layouts: cols x rows grid; each cell [row0, col0, row1, col1] (end exclusive) */
  var LAYS = {
    "1": { n: "1 chart", c: 1, r: 1, cells: [[0, 0, 1, 1]] },
    "2h": { n: "2 side by side", c: 2, r: 1, cells: [[0, 0, 1, 1], [0, 1, 1, 2]] },
    "2v": { n: "2 stacked", c: 1, r: 2, cells: [[0, 0, 1, 1], [1, 0, 2, 1]] },
    "3L": { n: "1 big + 2", c: 2, r: 2, cells: [[0, 0, 2, 1], [0, 1, 1, 2], [1, 1, 2, 2]] },
    "3T": { n: "1 wide + 2", c: 2, r: 2, cells: [[0, 0, 1, 2], [1, 0, 2, 1], [1, 1, 2, 2]] },
    "3C": { n: "3 columns", c: 3, r: 1, cells: [[0, 0, 1, 1], [0, 1, 1, 2], [0, 2, 1, 3]] },
    "4": { n: "4 grid", c: 2, r: 2, cells: [[0, 0, 1, 1], [0, 1, 1, 2], [1, 0, 2, 1], [1, 1, 2, 2]] },
    "6": { n: "6 grid", c: 3, r: 2, cells: [[0, 0, 1, 1], [0, 1, 1, 2], [0, 2, 1, 3], [1, 0, 2, 1], [1, 1, 2, 2], [1, 2, 2, 3]] },
    "8": { n: "8 grid", c: 4, r: 2, cells: [[0, 0, 1, 1], [0, 1, 1, 2], [0, 2, 1, 3], [0, 3, 1, 4], [1, 0, 2, 1], [1, 1, 2, 2], [1, 2, 2, 3], [1, 3, 2, 4]] }
  };
  var MTF = [["MTF 2", ["5", "D"]], ["MTF 3", ["5", "60", "D"]], ["MTF 4", ["1", "5", "15", "D"]], ["MTF 6", ["1", "5", "15", "60", "D", "W"]]];
  var ALIAS = { TNX: "TVC:US10Y", "10Y": "TVC:US10Y", US10Y: "TVC:US10Y", TYX: "TVC:US30Y", "30Y": "TVC:US30Y", US30Y: "TVC:US30Y", FVX: "TVC:US05Y", "5Y": "TVC:US05Y", "2Y": "TVC:US02Y", US02Y: "TVC:US02Y", VIX: "TVC:VIX", DXY: "TVC:DXY", SPX: "SP:SPX", NDX: "NASDAQ:NDX", ES: "CME_MINI:ES1!", NQ: "CME_MINI:NQ1!", CL: "NYMEX:CL1!", GC: "COMEX:GC1!", BTC: "BITSTAMP:BTCUSD", ETH: "BITSTAMP:ETHUSD" };
  var CSS = [
    "#chartsv.wrap{max-width:none;width:100%;box-sizing:border-box;padding-left:20px;padding-right:20px}",
    ".cg-top{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:6px 0 8px}.cg-top h1{margin:0 12px 0 0;font-size:1.5rem}",
    ".cg-bar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:0 0 8px}.cg-grp{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.cg-lab{font-size:.7rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}",
    "#chartsv button,#chartsv select,#chartsv input{font:inherit;font-size:.82rem;margin:0}",
    ".cg-b{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:8px;padding:5px 10px;cursor:pointer;width:auto}.cg-b:hover{border-color:var(--accent)}.cg-b.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}.cg-b.p{background:var(--accent);color:var(--accent-ink,#fff);border-color:var(--accent)}",
    ".cg-in{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:8px;padding:5px 9px;width:auto!important}",
    ".cg-sym{width:130px!important;font-weight:700;text-transform:uppercase}",
    ".cg-lays{display:flex;gap:4px}.cg-lays button{padding:3px;width:34px;height:28px;border:1px solid var(--line);background:var(--panel);border-radius:6px;cursor:pointer;color:var(--mute)}.cg-lays button.on{border-color:var(--ink);color:var(--ink);background:var(--bg)}.cg-lays svg{width:100%;height:100%;display:block}",
    ".cg-chips{display:flex;gap:5px;flex-wrap:wrap;align-items:center;max-width:100%}.cg-chip{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:2px 10px;cursor:pointer;font-weight:700}.cg-chip:hover{border-color:var(--accent)}",
    ".cg-area{position:relative}.cg-grid{display:grid;gap:6px;height:calc(100vh - 215px);min-height:520px}",
    ".cg-pane{position:relative;display:flex;flex-direction:column;min-width:0;min-height:0;border:2px solid var(--line);border-radius:12px;background:var(--panel);overflow:hidden}.cg-pane.f{border-color:var(--accent)}",
    ".cg-ph{display:flex;align-items:center;gap:6px;padding:5px 8px;border-bottom:1px solid var(--line);flex-wrap:wrap;background:var(--panel)}.cg-ph .cg-in{padding:2px 7px;font-size:.8rem}.cg-ph .t{width:86px!important;font-weight:800;text-transform:uppercase}",
    ".cg-iv{display:inline-flex;border:1px solid var(--line);border-radius:7px;overflow:hidden}.cg-iv button{border:0;border-right:1px solid var(--line);background:none;color:var(--mute);padding:2px 7px;cursor:pointer;font-weight:700;font-size:.76rem;border-radius:0}.cg-iv button:last-child{border-right:0}.cg-iv button.on{background:var(--ink);color:var(--bg)}",
    ".cg-ph .sp{flex:1}.cg-ib{border:1px solid var(--line);background:none;color:var(--mute);border-radius:6px;padding:2px 7px;cursor:pointer;width:auto}.cg-ib:hover{color:var(--ink);border-color:var(--ink)}",
    ".cg-body{position:relative;flex:1;min-height:0}.cg-body>div{position:absolute;inset:0}.cg-msg{display:flex;align-items:center;justify-content:center;height:100%;color:var(--mute);font-size:.85rem;text-align:center;padding:10px}",
    ".cg-pop{position:absolute;z-index:30;top:34px;right:6px;min-width:190px;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.28);padding:8px}.cg-pop label{display:flex;gap:8px;align-items:center;padding:3px 4px;font-size:.82rem;cursor:pointer}.cg-pop input{width:auto!important}",
    ".cg-gut{position:absolute;z-index:10;background:transparent}.cg-gut:hover,.cg-gut.d{background:var(--accent);opacity:.55}.cg-gut.v{cursor:col-resize}.cg-gut.h{cursor:row-resize}",
    ".cg-max{position:absolute!important;inset:0;z-index:20;height:auto}",
    ".cg-note{margin:8px 2px 0;font-size:.74rem;color:var(--mute)}.cg-saved{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.cg-wrapfs:fullscreen{background:var(--bg);padding:10px;overflow:auto}.cg-wrapfs:fullscreen .cg-grid{height:calc(100vh - 150px)}"
  ].join("\n");
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function clean(sym) { var c = String(sym || "").toUpperCase().replace(/[^A-Z0-9.\-:!_]/g, "").slice(0, 24); return ALIAS[c] || c; }
  function dark() { try { var c = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255, 255, 255]; return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) < 140; } catch (e) { return false; } }
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function toast(m) { try { if (typeof root.toast === "function") root.toast(m); } catch (e) {} }
  function loadTV() {
    if (root.StockChart && root.StockChart.loadTV) return root.StockChart.loadTV();
    if (root.TradingView && root.TradingView.widget) return Promise.resolve();
    if (loadTV.p) return loadTV.p;
    loadTV.p = new Promise(function (ok, no) { var s = document.createElement("script"); s.src = "https://s3.tradingview.com/tv.js"; s.async = true; s.onload = ok; s.onerror = function () { loadTV.p = null; no(); }; document.head.appendChild(s); });
    return loadTV.p;
  }

  /* ---------- state ---------- */
  var S = null, host = null, focus = 0, maxed = -1, saved = { list: [], def: "" }, popOpen = -1, mounted = false;
  function defIv(i) { return ["5", "1", "15", "D", "60", "W", "30", "240"][i % 8]; }
  function newPane(i, sym) { return { sym: sym || "SPY", iv: defIv(i), st: "1", ind: ["vol", "ema", "vwap"] }; }
  function fresh() { var l = LAYS["4"]; return { lay: "4", cols: [1, 1], rows: [1, 1], link: true, sym: "SPY", theme: "auto", panes: [0, 1, 2, 3].map(function (i) { return newPane(i, "SPY"); }) }; }
  function fixShape() {
    var L = LAYS[S.lay] || LAYS["4"]; S.lay = LAYS[S.lay] ? S.lay : "4";
    if (!S.cols || S.cols.length !== L.c) S.cols = Array.apply(null, Array(L.c)).map(function () { return 1; });
    if (!S.rows || S.rows.length !== L.r) S.rows = Array.apply(null, Array(L.r)).map(function () { return 1; });
    S.cols = S.cols.map(function (x) { return +x > 0.05 ? +x : 1; }); S.rows = S.rows.map(function (x) { return +x > 0.05 ? +x : 1; });
    while (S.panes.length < L.cells.length) S.panes.push(newPane(S.panes.length, S.link ? S.sym : (S.panes[0] || {}).sym));
    S.panes = S.panes.slice(0, Math.min(MAXP, L.cells.length)); S.panes.forEach(function (p) { p.sym = clean(p.sym) || "SPY"; p.iv = p.iv || "5"; p.st = p.st || "1"; p.ind = Array.isArray(p.ind) ? p.ind : []; });
    if (focus >= S.panes.length) focus = 0; if (maxed >= S.panes.length) maxed = -1;
  }
  function persist() { lsSet(LAST, S); }
  function prefs() { return root.StockPrefs && root.StockPrefs.ready && root.StockPrefs.ready() ? root.StockPrefs : null; }
  function loadSaved() {
    saved = lsGet(SAVED, { list: [], def: "" }); if (!saved.list) saved.list = [];
    var P = prefs(); if (P && !loadSaved.p) { loadSaved.p = 1; P.get("chartlayouts").then(function (r) { if (r && r.list && (r.list.length >= saved.list.length)) { saved = { list: r.list, def: r.def || "" }; lsSet(SAVED, saved); if (host) paintSaved(); } }); }
  }
  function saveSaved() { lsSet(SAVED, saved); var P = prefs(); if (P) P.set("chartlayouts", { list: saved.list, def: saved.def, ts: Date.now() }); }

  /* ---------- widgets ---------- */
  function sig(p) { return [p.sym, p.iv, p.st, p.ind.join(","), S.theme, dark()].join("|"); }
  function buildWidget(i) {
    var p = S.panes[i], body = host.querySelector('.cg-pane[data-i="' + i + '"] .cg-body'); if (!body) return;
    var s = sig(p); if (body.dataset.sig === s && body.firstChild) return; body.dataset.sig = s;
    var cid = "cgtv-" + (++seq); body.innerHTML = '<div class="cg-msg">Loading ' + esc(p.sym) + '…</div>';
    loadTV().then(function () {
      if (body.dataset.sig !== s || !body.isConnected) return;
      body.innerHTML = '<div id="' + cid + '"></div>';
      var studies = STUDIES.filter(function (x) { return p.ind.indexOf(x[0]) > -1; }).map(function (x) { return x[2]; });
      var th = S.theme === "auto" ? (dark() ? "dark" : "light") : S.theme;
      new root.TradingView.widget({
        container_id: cid, autosize: true, symbol: p.sym, interval: p.iv, timezone: "America/New_York", theme: th, style: p.st, locale: "en", enable_publishing: false,
        allow_symbol_change: true, withdateranges: true, hide_side_toolbar: false, hide_top_toolbar: false, save_image: true, details: false, studies: studies,
        studies_overrides: { "moving average exponential.length": 9, "moving average.length": 200 }
      });
    }).catch(function () {
      body.innerHTML = '<div class="cg-msg">The chart could not load (offline or blocked).&nbsp;<a href="https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(p.sym) + '" target="_blank" rel="noopener">Open on TradingView &#8599;</a></div>';
    });
  }

  /* ---------- render ---------- */
  function layIcon(k) {
    var L = LAYS[k], W = 30, H = 22, g = 2, cw = (W - g * (L.c - 1)) / L.c, ch = (H - g * (L.r - 1)) / L.r;
    return '<svg viewBox="0 0 ' + W + " " + H + '">' + L.cells.map(function (c) { return '<rect x="' + (c[1] * (cw + g)).toFixed(1) + '" y="' + (c[0] * (ch + g)).toFixed(1) + '" width="' + ((c[3] - c[1]) * cw + (c[3] - c[1] - 1) * g).toFixed(1) + '" height="' + ((c[2] - c[0]) * ch + (c[2] - c[0] - 1) * g).toFixed(1) + '" rx="2" fill="currentColor" opacity=".75"/>'; }).join("") + '</svg>';
  }
  function frame() {
    var wl = []; try { wl = root.StockWatch && root.StockWatch.list ? root.StockWatch.list().slice(0, 14) : []; } catch (e) {}
    host.innerHTML = '<div class="cg-wrapfs" id="cgwrap"><div class="cg-top"><h1>Charts</h1><div class="cg-grp"><input id="cgsym" class="cg-in cg-sym" maxlength="24" placeholder="Symbol" aria-label="Symbol" autocomplete="off" autocapitalize="characters"><button type="button" class="cg-b p" id="cggo">Go</button>' +
      '<button type="button" class="cg-b" id="cglink" title="When on, the symbol you type goes to every chart">Link all charts</button></div><div class="cg-chips" id="cgwl">' + (wl.length ? '<span class="cg-lab">Watchlist</span>' + wl.map(function (s) { return '<button type="button" class="cg-chip" data-sym="' + esc(s) + '">' + esc(s) + '</button>'; }).join("") : "") + '</div></div>' +
      '<div class="cg-bar"><div class="cg-grp"><span class="cg-lab">Layout</span><div class="cg-lays" id="cglays">' + Object.keys(LAYS).map(function (k) { return '<button type="button" data-lay="' + k + '" title="' + esc(LAYS[k].n) + '" aria-label="' + esc(LAYS[k].n) + '">' + layIcon(k) + '</button>'; }).join("") + '</div></div>' +
      '<div class="cg-grp"><span class="cg-lab">Same symbol, many time frames</span>' + MTF.map(function (m, i) { return '<button type="button" class="cg-b" data-mtf="' + i + '" title="' + m[1].map(function (v) { return (IVS.filter(function (x) { return x[0] === v; })[0] || [0, v])[1]; }).join(" / ") + '">' + m[0] + '</button>'; }).join("") + '</div>' +
      '<div class="cg-grp"><span class="cg-lab">Theme</span><select id="cgth" class="cg-in" aria-label="Chart theme"><option value="auto">Match site</option><option value="dark">Dark</option><option value="light">Light</option></select></div>' +
      '<div class="cg-grp"><button type="button" class="cg-b" id="cgreset" title="Make all panes equal size">Equal sizes</button><button type="button" class="cg-b" id="cgfs" title="Full screen">Full screen</button></div></div>' +
      '<div class="cg-bar"><div class="cg-saved" id="cgsaved"></div></div>' +
      '<div class="cg-area" id="cgarea"><div class="cg-grid" id="cggrid"></div></div>' +
      '<p class="cg-note">Each chart is TradingView: use its left toolbar to draw trend lines, fib levels and more, and its top bar to add other indicators. Layouts remember symbols, time frames, styles, indicators and sizes. Drawings made inside a chart are not saved by this page (TradingView only saves those to its own account). Prices may be delayed. Not investment advice.</p></div>';
    $("cgth").value = S.theme; paintSaved(); paintTop(); grid();
  }
  function paintTop() {
    if (!host) return; var b = $("cglink"); if (b) { b.classList.toggle("on", !!S.link); b.textContent = S.link ? "Linked: all charts" : "Link all charts"; }
    [].forEach.call(host.querySelectorAll("[data-lay]"), function (x) { x.classList.toggle("on", x.dataset.lay === S.lay); });
    var si = $("cgsym"); if (si && document.activeElement !== si) si.value = (S.panes[focus] || {}).sym || S.sym || "";
  }
  function paintSaved() {
    var el = $("cgsaved"); if (!el) return;
    el.innerHTML = '<span class="cg-lab">My layouts</span><select id="cgsel" class="cg-in" aria-label="Saved layouts"><option value="">' + (saved.list.length ? "Choose a saved layout…" : "None saved yet") + '</option>' + saved.list.map(function (l) { return '<option value="' + esc(l.id) + '">' + (saved.def === l.id ? "★ " : "") + esc(l.name) + '</option>'; }).join("") + '</select>' +
      '<button type="button" class="cg-b" id="cgload">Load</button><button type="button" class="cg-b" id="cgstar" title="Open this layout automatically">★ Make default</button><button type="button" class="cg-b" id="cgdel">Delete</button>' +
      '<span class="cg-lab" style="margin-left:10px">Save current as</span><input id="cgname" class="cg-in" maxlength="40" placeholder="e.g. Morning scan" aria-label="Layout name"><button type="button" class="cg-b p" id="cgsave">Save layout</button>';
  }
  function paneHTML(i) {
    var p = S.panes[i];
    return '<div class="cg-pane' + (i === focus ? " f" : "") + (i === maxed ? " cg-max" : "") + '" data-i="' + i + '"><div class="cg-ph"><input class="cg-in t" value="' + esc(p.sym) + '" maxlength="24" aria-label="Symbol for chart ' + (i + 1) + '" data-psym="' + i + '">' +
      '<div class="cg-iv" role="group" aria-label="Time frame">' + IVS.filter(function (x) { return ["1", "5", "15", "30", "60", "240", "D", "W"].indexOf(x[0]) > -1 || x[0] === p.iv; }).map(function (x) { return '<button type="button" data-piv="' + i + '|' + x[0] + '" class="' + (x[0] === p.iv ? "on" : "") + '">' + x[1] + '</button>'; }).join("") + '</div>' +
      '<select class="cg-in" data-pst="' + i + '" aria-label="Chart style">' + STYLES.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === p.st ? " selected" : "") + '>' + x[1] + '</option>'; }).join("") + '</select>' +
      '<button type="button" class="cg-ib" data-pind="' + i + '" title="Indicators">Indicators (' + p.ind.length + ')</button><span class="sp"></span>' +
      '<button type="button" class="cg-ib" data-pmax="' + i + '" title="' + (i === maxed ? "Back to grid" : "Fill the whole area") + '">' + (i === maxed ? "Shrink" : "Expand") + '</button></div><div class="cg-body"></div></div>';
  }
  function grid() {
    var g = $("cggrid"); if (!g) return; fixShape(); var L = LAYS[S.lay];
    g.style.gridTemplateColumns = S.cols.map(function (x) { return x + "fr"; }).join(" "); g.style.gridTemplateRows = S.rows.map(function (x) { return x + "fr"; }).join(" ");
    g.innerHTML = S.panes.map(function (p, i) { var c = L.cells[i]; return paneHTML(i).replace('class="cg-pane', 'style="grid-area:' + (c[0] + 1) + " / " + (c[1] + 1) + " / " + (c[2] + 1) + " / " + (c[3] + 1) + '" class="cg-pane'); }).join("");
    S.panes.forEach(function (p, i) { buildWidget(i); }); gutters(); paintTop();
  }
  /* ---------- gutters (drag to resize) ---------- */
  function gutters() {
    var area = $("cgarea"), g = $("cggrid"); if (!area || !g) return; [].forEach.call(area.querySelectorAll(".cg-gut"), function (x) { x.remove(); });
    if (maxed > -1) return; var L = LAYS[S.lay], gap = 6, W = g.clientWidth, H = g.clientHeight;
    var cs = S.cols.reduce(function (a, b) { return a + b; }, 0), rs = S.rows.reduce(function (a, b) { return a + b; }, 0), tw = W - gap * (L.c - 1), th = H - gap * (L.r - 1);
    var cx = [0], ry = [0]; S.cols.forEach(function (f, i) { cx.push(cx[i] + f / cs * tw + gap); }); S.rows.forEach(function (f, i) { ry.push(ry[i] + f / rs * th + gap); });
    function spans(c, axis, k, o) { return axis === "c" ? (c[1] <= k && c[3] > k + 1 && c[0] <= o && c[2] > o) : (c[0] <= k && c[2] > k + 1 && c[1] <= o && c[3] > o); }
    for (var k = 0; k < L.c - 1; k++) {
      var runs = [], s0 = -1; for (var r = 0; r <= L.r; r++) { var blocked = r === L.r || L.cells.some(function (c) { return spans(c, "c", k, r); }); if (!blocked && s0 < 0) s0 = r; if (blocked && s0 >= 0) { runs.push([s0, r]); s0 = -1; } }
      runs.forEach(function (rn) { add("v", k, cx[k + 1] - gap, ry[rn[0]], gap, ry[rn[1]] - gap - ry[rn[0]] + (rn[1] === L.r ? 0 : 0) + gap * 0); });
    }
    for (var k2 = 0; k2 < L.r - 1; k2++) {
      var runs2 = [], s1 = -1; for (var c2 = 0; c2 <= L.c; c2++) { var bl = c2 === L.c || L.cells.some(function (c) { return spans(c, "r", k2, c2); }); if (!bl && s1 < 0) s1 = c2; if (bl && s1 >= 0) { runs2.push([s1, c2]); s1 = -1; } }
      runs2.forEach(function (rn) { add("h", k2, cx[rn[0]], ry[k2 + 1] - gap, cx[rn[1]] - gap - cx[rn[0]], gap); });
    }
    function add(dir, k, x, y, w, h) {
      var e = document.createElement("div"); e.className = "cg-gut " + dir; var pad = 4;
      e.style.left = (dir === "v" ? x - pad : x) + "px"; e.style.top = (dir === "h" ? y - pad : y) + "px"; e.style.width = (dir === "v" ? w + pad * 2 : w) + "px"; e.style.height = (dir === "h" ? h + pad * 2 : h) + "px";
      e.addEventListener("pointerdown", function (ev) {
        ev.preventDefault(); e.setPointerCapture(ev.pointerId); e.classList.add("d"); var arr = dir === "v" ? S.cols : S.rows, sum = dir === "v" ? cs : rs, tot = dir === "v" ? tw : th, p0 = dir === "v" ? ev.clientX : ev.clientY, a0 = arr[k], b0 = arr[k + 1];
        g.style.pointerEvents = "none"; [].forEach.call(g.querySelectorAll("iframe"), function (f) { f.style.pointerEvents = "none"; });
        function mv(m) { var d = ((dir === "v" ? m.clientX : m.clientY) - p0) / tot * sum, min = sum * 0.12; var na = Math.max(min, Math.min(a0 + b0 - min, a0 + d)); arr[k] = +na.toFixed(4); arr[k + 1] = +(a0 + b0 - na).toFixed(4); g.style[dir === "v" ? "gridTemplateColumns" : "gridTemplateRows"] = arr.map(function (x) { return x + "fr"; }).join(" "); }
        function up() { e.removeEventListener("pointermove", mv); e.removeEventListener("pointerup", up); e.classList.remove("d"); g.style.pointerEvents = ""; [].forEach.call(g.querySelectorAll("iframe"), function (f) { f.style.pointerEvents = ""; }); persist(); gutters(); }
        e.addEventListener("pointermove", mv); e.addEventListener("pointerup", up);
      });
      area.appendChild(e);
    }
  }
  /* ---------- actions ---------- */
  function setSym(i, sym) {
    sym = clean(sym); if (!sym) return; S.sym = sym;
    if (S.link) S.panes.forEach(function (p) { p.sym = sym; }); else if (S.panes[i]) S.panes[i].sym = sym;
    persist(); repaintHeads(); S.panes.forEach(function (p, k) { buildWidget(k); }); paintTop();
  }
  function repaintHeads() { S.panes.forEach(function (p, i) { var pane = host.querySelector('.cg-pane[data-i="' + i + '"]'); if (!pane) return; var n = paneHTML(i), t = document.createElement("div"); t.innerHTML = n; var nh = t.querySelector(".cg-ph"); pane.replaceChild(nh, pane.querySelector(".cg-ph")); }); }
  function setLayout(k) { if (!LAYS[k]) return; S.lay = k; S.cols = null; S.rows = null; maxed = -1; fixShape(); persist(); grid(); }
  function applyMtf(i) {
    var m = MTF[i], sym = S.panes[focus] ? S.panes[focus].sym : S.sym, n = m[1].length, k = n <= 2 ? "2h" : n === 3 ? "3L" : n === 4 ? "4" : "6";
    S.lay = k; S.cols = null; S.rows = null; S.link = true; S.sym = sym; maxed = -1; S.panes = m[1].map(function (iv, j) { var o = S.panes[j] || newPane(j, sym); return { sym: sym, iv: iv, st: o.st || "1", ind: o.ind && o.ind.length ? o.ind.slice() : ["vol", "ema", "vwap"] }; });
    fixShape(); persist(); grid();
  }
  function snapshot(name) { return { id: "l" + Date.now().toString(36), name: name, ts: Date.now(), state: JSON.parse(JSON.stringify(S)) }; }
  function loadLayout(id) { var l = saved.list.filter(function (x) { return x.id === id; })[0]; if (!l) return; S = JSON.parse(JSON.stringify(l.state)); maxed = -1; focus = 0; fixShape(); persist(); $("cgth").value = S.theme; grid(); toast("Loaded " + l.name); }

  function onClick(e) {
    var t = e.target.closest ? e.target : null; if (!t) return;
    var pane = t.closest(".cg-pane"); if (pane && +pane.dataset.i !== focus && !t.closest(".cg-pop")) { focus = +pane.dataset.i; [].forEach.call(host.querySelectorAll(".cg-pane"), function (x) { x.classList.toggle("f", +x.dataset.i === focus); }); paintTop(); }
    if (!t.closest(".cg-pop") && !t.closest("[data-pind]")) closePop();
    var b = t.closest("button"); if (!b || !host.contains(b)) return;
    if (b.dataset.sym) { setSym(focus, b.dataset.sym); return; }
    if (b.id === "cggo") { setSym(focus, $("cgsym").value); return; }
    if (b.id === "cglink") { S.link = !S.link; if (S.link) { var s = (S.panes[focus] || {}).sym; S.sym = s; S.panes.forEach(function (p) { p.sym = s; }); persist(); repaintHeads(); S.panes.forEach(function (p, k) { buildWidget(k); }); } persist(); paintTop(); return; }
    if (b.dataset.lay) { setLayout(b.dataset.lay); return; }
    if (b.dataset.mtf) { applyMtf(+b.dataset.mtf); return; }
    if (b.id === "cgreset") { S.cols = null; S.rows = null; fixShape(); persist(); var g = $("cggrid"); g.style.gridTemplateColumns = S.cols.map(function (x) { return x + "fr"; }).join(" "); g.style.gridTemplateRows = S.rows.map(function (x) { return x + "fr"; }).join(" "); gutters(); return; }
    if (b.id === "cgfs") { var w = $("cgwrap"); if (document.fullscreenElement) document.exitFullscreen(); else if (w.requestFullscreen) w.requestFullscreen(); setTimeout(gutters, 400); return; }
    if (b.dataset.piv) { var pv = b.dataset.piv.split("|"), pi = +pv[0]; S.panes[pi].iv = pv[1]; persist(); repaintHeads(); buildWidget(pi); return; }
    if (b.dataset.pmax) { var mi = +b.dataset.pmax; maxed = maxed === mi ? -1 : mi; persist(); [].forEach.call(host.querySelectorAll(".cg-pane"), function (x) { var i = +x.dataset.i; x.classList.toggle("cg-max", i === maxed); x.style.display = maxed > -1 && i !== maxed ? "none" : ""; }); repaintHeads(); gutters(); return; }
    if (b.dataset.pind) { var ii = +b.dataset.pind; if (popOpen === ii) { closePop(); return; } openPop(ii, b); return; }
    if (b.id === "cgsave") { var nm = $("cgname").value.trim(); if (!nm) { toast("Type a name for this layout first"); $("cgname").focus(); return; } var ex = saved.list.filter(function (x) { return x.name.toLowerCase() === nm.toLowerCase(); })[0], sn = snapshot(nm); if (ex) { sn.id = ex.id; saved.list[saved.list.indexOf(ex)] = sn; } else saved.list.push(sn); saveSaved(); paintSaved(); $("cgsel").value = sn.id; toast("Saved layout: " + nm); return; }
    if (b.id === "cgload") { var v = $("cgsel").value; if (!v) { toast("Pick a saved layout first"); return; } loadLayout(v); return; }
    if (b.id === "cgdel") { var v2 = $("cgsel").value; if (!v2) { toast("Pick a saved layout first"); return; } var l2 = saved.list.filter(function (x) { return x.id === v2; })[0]; if (!l2 || !confirm("Delete the layout \"" + l2.name + "\"?")) return; saved.list = saved.list.filter(function (x) { return x.id !== v2; }); if (saved.def === v2) saved.def = ""; saveSaved(); paintSaved(); return; }
    if (b.id === "cgstar") { var v3 = $("cgsel").value; if (!v3) { toast("Pick a saved layout first"); return; } saved.def = saved.def === v3 ? "" : v3; saveSaved(); paintSaved(); $("cgsel").value = v3; toast(saved.def ? "This layout opens automatically" : "No default layout"); return; }
  }
  function openPop(i, btn) {
    closePop(); popOpen = i; var p = S.panes[i], d = document.createElement("div"); d.className = "cg-pop"; d.innerHTML = '<b style="font-size:.78rem">Indicators</b>' + STUDIES.map(function (x) { return '<label><input type="checkbox" data-ind="' + x[0] + '"' + (p.ind.indexOf(x[0]) > -1 ? " checked" : "") + '> ' + x[1] + '</label>'; }).join("") +
      '<div style="margin-top:6px"><button type="button" class="cg-b" data-indall="' + i + '">Use on every chart</button></div>';
    btn.closest(".cg-pane").appendChild(d);
    d.addEventListener("change", function (e) { var c = e.target; if (!c.dataset.ind) return; var k = c.dataset.ind, a = p.ind; if (c.checked && a.indexOf(k) < 0) a.push(k); if (!c.checked) p.ind = a.filter(function (x) { return x !== k; }); persist(); btn.textContent = "Indicators (" + p.ind.length + ")"; buildWidget(i); });
    d.addEventListener("click", function (e) { var b = e.target.closest("[data-indall]"); if (!b) return; S.panes.forEach(function (q, k) { q.ind = p.ind.slice(); }); persist(); repaintHeads(); S.panes.forEach(function (q, k) { buildWidget(k); }); closePop(); toast("Indicators applied to every chart"); });
  }
  function closePop() { popOpen = -1; if (host) [].forEach.call(host.querySelectorAll(".cg-pop"), function (x) { x.remove(); }); }
  function onChange(e) {
    var t = e.target;
    if (t.dataset.psym != null) { setSym(+t.dataset.psym, t.value); return; }
    if (t.dataset.pst != null) { S.panes[+t.dataset.pst].st = t.value; persist(); buildWidget(+t.dataset.pst); return; }
    if (t.id === "cgth") { S.theme = t.value; persist(); S.panes.forEach(function (p, i) { buildWidget(i); }); return; }
    if (t.id === "cgsel") { return; }
  }
  function onKey(e) {
    if (e.key === "Enter") { var t = e.target; if (t.id === "cgsym") { setSym(focus, t.value); } else if (t.dataset && t.dataset.psym != null) { setSym(+t.dataset.psym, t.value); } else if (t.id === "cgname") { $("cgsave").click(); } }
    if (e.key === "Escape") { closePop(); if (maxed > -1) { maxed = -1; persist(); grid(); } }
  }
  var rt = 0; function onResize() { if (!host || !host.isConnected || host.hidden) return; clearTimeout(rt); rt = setTimeout(gutters, 120); }

  function mount(h) {
    host = h; if (!document.getElementById("cg-css")) { var st = document.createElement("style"); st.id = "cg-css"; st.textContent = CSS; document.head.appendChild(st); }
    if (!mounted) {
      loadSaved(); S = lsGet(LAST, null); var df = saved.list.filter(function (x) { return x.id === saved.def; })[0];
      if (df && !S) S = JSON.parse(JSON.stringify(df.state)); if (!S || !Array.isArray(S.panes)) S = fresh(); if (df && !lsGet(LAST, null)) S = JSON.parse(JSON.stringify(df.state));
      fixShape(); mounted = true;
      host.addEventListener("click", onClick); host.addEventListener("change", onChange); host.addEventListener("keydown", onKey); window.addEventListener("resize", onResize); document.addEventListener("fullscreenchange", function () { setTimeout(gutters, 300); });
      frame();
    } else { var wl = $("cgwl"); if (!$("cggrid")) frame(); else { try { var w = root.StockWatch && root.StockWatch.list ? root.StockWatch.list().slice(0, 14) : []; if (wl) wl.innerHTML = w.length ? '<span class="cg-lab">Watchlist</span>' + w.map(function (s) { return '<button type="button" class="cg-chip" data-sym="' + esc(s) + '">' + esc(s) + '</button>'; }).join("") : ""; } catch (e) {} setTimeout(gutters, 60); } }
    try { if (root.StockWatch && root.StockWatch.load) root.StockWatch.load().then(function () { var wl2 = $("cgwl"); if (wl2 && root.StockWatch.list) { var w = root.StockWatch.list().slice(0, 14); wl2.innerHTML = w.length ? '<span class="cg-lab">Watchlist</span>' + w.map(function (s) { return '<button type="button" class="cg-chip" data-sym="' + esc(s) + '">' + esc(s) + '</button>'; }).join("") : ""; } }); } catch (e) {}
    setTimeout(gutters, 80);
  }
  root.ChartsPage = { mount: mount, _state: function () { return S; } };
})(window);
