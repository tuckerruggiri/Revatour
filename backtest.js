/* Backtest Lab: (1) trade log built from your saved trades, with stats per strategy and CSV/JSON export,
   (2) candle simulator (add trigger, doji, hammer, inverted hammer, inside bar and normal candles with one click, drag
   candles / VWAP / 9 EMA, set gap from yesterday's close and volume), (3) no-code strategy builder that backtests on
   your scenes, and (4) a generator that writes the Python bot code from the same rules. */
(function () {
  "use strict";
  var KEY = "revatour-bt-v1", H = window.StockBT || {}, root = null, host = null;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var f2 = function (x) { return (Math.round(x * 100) / 100).toFixed(2); };
  var money = function (x) { return (x < 0 ? "-$" : "$") + Math.abs(x).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var sgn = function (x) { return (x > 0 ? "+" : "") + money(x).replace("$-", "-$"); };
  var rr = function (x) { return x == null || isNaN(x) ? "-" : (x > 0 ? "+" : "") + (Math.round(x * 100) / 100) + "R"; };

  /* ---------------- state ---------------- */
  var DEFRULES = { tradeShort: true, tradeLong: false, riskDollars: 50, t1SellPct: 80, t1R: 0.7, t2SellPct: 20, t2R: 2, useT3: false, t3R: 3, entryOffset: 0.02, stopMode: "beyond", midStopOffset: 0, stopOffset: 0.02, slippage: 0.03, minRiskPS: 0.10, trigNotBelowPrev: true, maxBounceHH: 1, breakGreenCounts: false, midMoveR: 0.5, beMoveR: 0.7, beLevel: "low", minPrice: 0, minGapPct: 0, maxSetupBars: 6, startTime: 934, endTime: 1548, requireBreak: true, waitAfter: "any", requireHOD: false, swingBars: 20, maxDrops: 2, minBouncePct: 30, trigBelowEMA: true, minTrigATR: 0, cancelOnHigherHigh: true, longMaxBars: 10, requireEMATouch: false, maxBodyPct: 35, insideMaxBodyPct: 80, vwapRule: "room", vwapRoomR: 2, needGreen: true, noGreenNewLow: true, testMode: false, shapes: { inv: true, inside: true, doji: true, spin: true, wick: true, hammer: true } };
  var S = { tab: "log", cres: null, manual: [], scenes: [], rules: null, sim: null, sel: -1, edit: "", res: null, code: "", f: { strat: "", tk: "", side: "", per: "all" }, vol: 1, kind: "normal", col: "g", drift: 0 };
  function newSim() { return { pc: 10, gap: 8, size: 0.008, vb: 100000, tf: 2, c: [], vw: {}, em: {} }; }
  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || "{}"); S.manual = d.manual || []; S.scenes = d.scenes || []; S.rules = d.rules && d.rules.riskDollars ? d.rules : null; S.sim = d.sim || null; S.rules = Object.assign({}, DEFRULES, S.rules || {}); S.rules.shapes = Object.assign({}, DEFRULES.shapes, S.rules.shapes || {}); if (!S.sim || !S.sim.c) S.sim = newSim(); } catch (e) { S.rules = Object.assign({}, DEFRULES); S.sim = newSim(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ manual: S.manual, scenes: S.scenes, rules: S.rules, sim: S.sim })); } catch (e) { } }
  function toast(m) { try { (H.toast || window.alert)(m); } catch (e) { } }

  /* ---------------- trade log ---------------- */
  function logRows() {
    var rows = [], t = []; try { t = H.trades ? H.trades() : []; } catch (e) { }
    t.forEach(function (x) { rows.push({ d: x.d, t: x.t, s: x.s, q: x.q, e: x.e, x: x.x, p: x.p, u: x.u || "", n: x.n || "", src: "Studio" }); });
    S.manual.forEach(function (x, i) { rows.push({ d: x.d, t: x.t, s: x.s, q: x.q, e: x.e, x: x.x, p: x.p, u: x.u || "", n: x.n || "", src: "Added", mi: i }); });
    rows.forEach(function (r) { var u = H.r1For ? H.r1For(r.d) : 0; r.R = u > 0 ? r.p / u : null; });
    rows.sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; });
    return rows;
  }
  function filt(rows) {
    var f = S.f, now = new Date().toISOString().slice(0, 10);
    return rows.filter(function (r) {
      if (f.strat && (r.u || "(untagged)") !== f.strat) return false;
      if (f.tk && String(r.t || "").toUpperCase().indexOf(f.tk.toUpperCase()) < 0) return false;
      if (f.side && String(r.s || "").toLowerCase() !== f.side) return false;
      if (f.per === "year" && r.d.slice(0, 4) !== now.slice(0, 4)) return false;
      if (f.per === "month" && r.d.slice(0, 7) !== now.slice(0, 7)) return false;
      return true;
    });
  }
  function stat(rows) {
    var n = rows.length, w = 0, gw = 0, gl = 0, net = 0, rs = 0, rn = 0;
    rows.forEach(function (r) { net += r.p; if (r.p > 0) { w++; gw += r.p; } else gl += -r.p; if (r.R != null) { rs += r.R; rn++; } });
    return { n: n, wr: n ? w / n : 0, pf: gl > 0 ? gw / gl : (gw > 0 ? Infinity : 0), net: net, avgR: rn ? rs / rn : null, sumR: rn ? rs : null, aw: w ? gw / w : 0, al: n - w ? gl / (n - w) : 0 };
  }
  function byStrat(rows) {
    var m = {}; rows.forEach(function (r) { var k = r.u || "(untagged)"; (m[k] = m[k] || []).push(r); });
    return Object.keys(m).map(function (k) { var s = stat(m[k]); s.k = k; return s; }).sort(function (a, b) { return b.n - a.n; });
  }
  function csv(rows) {
    var q = function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return ["date,ticker,side,qty,entry,exit,pnl,r,strategy,note"].concat(rows.map(function (r) { return [r.d, r.t, r.s, r.q, r.e, r.x, r.p, r.R == null ? "" : f2(r.R), r.u, r.n].map(q).join(","); })).join("\n");
  }
  function download(name, text, type) {
    try { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type || "text/plain" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); } catch (e) { toast("Could not download"); }
  }
  function logHtml() {
    var all = logRows(), rows = filt(all), st = stat(rows), strat = byStrat(all), names = strat.map(function (s) { return s.k; });
    var h = '<div class="bt-note">Your trades come in by themselves from Studio and Schwab pulls. No typing needed. Tag a strategy on each trade in Studio and it shows up here.</div>';
    h += '<div class="bt-tiles">' + tile(st.n, "Trades") + tile(Math.round(st.wr * 100) + "%", "Win rate", "", "<b>Win rate</b> is the share of trades that made money.") +
      tile(st.pf === Infinity ? "n/a" : f2(st.pf), "Profit factor", "", "<b>Profit factor</b> is dollars won divided by dollars lost. Above 1 means profitable. 2 or more is great.") +
      tile(st.avgR == null ? "set 1R" : rr(st.avgR), "Avg R per trade", st.avgR == null ? "" : st.avgR >= 0 ? "gain" : "loss", "<b>Expectancy.</b> On average, how many R each trade makes. Positive means the strategy has an edge. Set your 1R in Profile or Trading day.") +
      tile(sgn(st.net), "Net", st.net >= 0 ? "gain" : "loss") + '</div>';
    h += '<h3 class="bt-h">By strategy <small>click one to filter</small></h3><div class="bt-tw"><table class="bt-t"><thead><tr><th>Strategy</th><th>Trades</th><th>Win %</th><th>Profit factor</th><th>Avg R</th><th>Net</th></tr></thead><tbody>' +
      (strat.length ? strat.map(function (s) { return '<tr data-strat="' + esc(s.k) + '" class="' + (S.f.strat === s.k ? "on" : "") + '"><td><b>' + esc(s.k) + '</b></td><td>' + s.n + '</td><td>' + Math.round(s.wr * 100) + '%</td><td>' + (s.pf === Infinity ? "n/a" : f2(s.pf)) + '</td><td class="' + (s.avgR >= 0 ? "gain" : "loss") + '">' + rr(s.avgR) + '</td><td class="' + (s.net >= 0 ? "gain" : "loss") + '">' + sgn(s.net) + '</td></tr>'; }).join("") : '<tr><td colspan="6" class="hint">No trades yet. Pull trades in Studio first.</td></tr>') + '</tbody></table></div>';
    h += '<div class="bt-bar"><select data-f="strat"><option value="">All strategies</option>' + names.map(function (n) { return '<option' + (S.f.strat === n ? " selected" : "") + ' value="' + esc(n) + '">' + esc(n) + '</option>'; }).join("") + '</select>' +
      '<input data-f="tk" placeholder="Ticker" value="' + esc(S.f.tk) + '" style="width:90px"><select data-f="side"><option value="">Long and short</option><option value="long"' + (S.f.side === "long" ? " selected" : "") + '>Long</option><option value="short"' + (S.f.side === "short" ? " selected" : "") + '>Short</option></select>' +
      '<select data-f="per"><option value="all">All time</option><option value="year"' + (S.f.per === "year" ? " selected" : "") + '>This year</option><option value="month"' + (S.f.per === "month" ? " selected" : "") + '>This month</option></select>' +
      '<span class="bt-sp"></span><button class="bt-b" data-a="csv">Download CSV</button><button class="bt-b" data-a="json">Download JSON</button></div>';
    h += '<div class="bt-tw"><table class="bt-t"><thead><tr><th>Date</th><th>Ticker</th><th>Side</th><th>Qty</th><th>Entry</th><th>Exit</th><th>P&amp;L</th><th>R</th><th>Strategy</th><th></th></tr></thead><tbody>' +
      rows.slice(0, 400).map(function (r) { return '<tr><td>' + esc(r.d) + '</td><td><b>' + esc(r.t) + '</b></td><td>' + esc(r.s) + '</td><td>' + esc(r.q) + '</td><td>' + esc(r.e) + '</td><td>' + esc(r.x) + '</td><td class="' + (r.p >= 0 ? "gain" : "loss") + '">' + sgn(r.p) + '</td><td>' + rr(r.R) + '</td><td>' + esc(r.u || "") + '</td><td>' + (r.src === "Added" ? '<button class="bt-x" data-del="' + r.mi + '" title="Remove">&times;</button>' : "") + '</td></tr>'; }).join("") +
      (rows.length ? "" : '<tr><td colspan="10" class="hint">Nothing matches.</td></tr>') + '</tbody></table></div>' + (rows.length > 400 ? '<p class="hint">Showing the latest 400. Downloads include everything that matches.</p>' : "");
    h += '<details class="bt-add"><summary>Add a trade that is not in Studio</summary><form id="bt-addf" class="bt-bar"><input name="d" type="date" value="' + new Date().toISOString().slice(0, 10) + '" required><input name="t" placeholder="Ticker" style="width:90px" required><select name="s"><option>Long</option><option>Short</option></select><input name="q" inputmode="decimal" placeholder="Shares" style="width:90px" required><input name="e" inputmode="decimal" placeholder="Entry" style="width:90px" required><input name="x" inputmode="decimal" placeholder="Exit" style="width:90px" required><input name="u" placeholder="Strategy" list="bt-sl" style="width:140px"><datalist id="bt-sl">' + names.map(function (n) { return '<option value="' + esc(n) + '">'; }).join("") + '</datalist><button class="bt-b on" type="submit">Add</button></form></details>';
    return h;
  }
  function tile(v, l, c, tip) {
    return '<div class="bt-tile' + (tip ? " tipw" : "") + '"' + (tip ? ' tabindex="0"' : "") + '><b' + (c ? ' class="' + c + '"' : "") + '>' + v + '</b><span>' + l + (tip ? ' <i class="tipq">?</i>' : "") + '</span>' + (tip ? '<div class="tipb">' + tip + '</div>' : "") + '</div>';
  }

  /* ---------------- candle model ---------------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function prevClose() { var c = S.sim.c; return c.length ? c[c.length - 1].c : S.sim.pc * (1 + S.sim.gap / 100); }
  function volMul() { return [0.5, 1, 2.5, 6][S.vol] || 1; }
  function mk(kind, col) {
    var sm = S.sim, c = sm.c, o = prevClose(), r = o * sm.size, up = col === "g", d = up ? 1 : -1, prev = c[c.length - 1], v = sm.vb * volMul() * rnd(0.9, 1.1), bd, hi, lo, cl, op = o;
    if (kind === "normal") { bd = r * rnd(0.5, 0.7); cl = o + d * bd; hi = Math.max(o, cl) + r * rnd(0.05, 0.2); lo = Math.min(o, cl) - r * rnd(0.05, 0.2); }
    else if (kind === "trigger") { bd = r * rnd(1.6, 2.1); cl = o + d * bd; hi = Math.max(o, cl) + r * 0.08; lo = Math.min(o, cl) - r * 0.08; v *= 1.8; }
    else if (kind === "doji") { bd = r * 0.04; cl = o + d * bd; hi = Math.max(o, cl) + r * rnd(0.45, 0.6); lo = Math.min(o, cl) - r * rnd(0.45, 0.6); }
    else if (kind === "hammer") { bd = r * 0.25; cl = o + d * bd; hi = Math.max(o, cl) + r * 0.03; lo = Math.min(o, cl) - r * rnd(1, 1.2); }
    else if (kind === "inv") { bd = r * 0.25; cl = o + d * bd; hi = Math.max(o, cl) + r * rnd(1, 1.2); lo = Math.min(o, cl) - r * 0.03; }
    else if (kind === "inside") {
      if (!prev) { toast("Add a first candle, then an inside bar."); return null; }
      var pr = prev.h - prev.l, mid = (prev.h + prev.l) / 2; hi = prev.h - pr * 0.08; lo = prev.l + pr * 0.08;
      op = up ? mid - pr * 0.15 : mid + pr * 0.15; cl = up ? mid + pr * 0.15 : mid - pr * 0.15; v *= 0.6;
    }
    var q = function (x) { return Math.round(x * 100) / 100; };
    return { o: q(op), h: q(hi), l: q(lo), c: q(cl), v: Math.round(v), k: kind };
  }
  function addCandle(kind, col) { var c = mk(kind, col); if (!c) return; S.sim.c.push(c); S.sel = S.sim.c.length - 1; save(); render(); }
  function addRandom(n) {
    var sm = S.sim;
    for (var i = 0; i < n; i++) {
      var o = prevClose(), r = o * sm.size, d = S.drift * 0.25 + rnd(-0.55, 0.55), cl = o + d * r * 1.2, q = function (x) { return Math.round(x * 100) / 100; };
      sm.c.push({ o: q(o), h: q(Math.max(o, cl) + r * rnd(0.05, 0.35)), l: q(Math.min(o, cl) - r * rnd(0.05, 0.35)), c: q(cl), v: Math.round(sm.vb * volMul() * rnd(0.6, 1.4)), k: "normal" });
    }
    S.sel = sm.c.length - 1; save(); render();
  }
  function calc() {
    var c = S.sim.c, vw = [], em = [], pv = 0, cv = 0, e = 0;
    c.forEach(function (x, i) { var tp = (x.h + x.l + x.c) / 3; pv += tp * x.v; cv += x.v; vw[i] = cv ? pv / cv : x.c; e = i ? e + (2 / 10) * (x.c - e) : x.c; em[i] = e; });
    for (var k in S.sim.vw) if (S.sim.vw[k] != null && vw[k] != null) vw[k] = S.sim.vw[k];
    for (k in S.sim.em) if (S.sim.em[k] != null && em[k] != null) em[k] = S.sim.em[k];
    return { vw: vw, em: em };
  }
  function setGap(g) {
    var sm = S.sim; g = isNaN(g) ? 0 : g; var old = sm.c.length ? sm.c[0].o : null, no = sm.pc * (1 + g / 100); sm.gap = g;
    if (old != null) { var dl = no - old; sm.c.forEach(function (x) { x.o = r2(x.o + dl); x.h = r2(x.h + dl); x.l = r2(x.l + dl); x.c = r2(x.c + dl); }); [sm.vw, sm.em].forEach(function (m) { for (var k in m) if (m[k] != null) m[k] = r2(m[k] + dl); }); }
    save(); render();
  }
  function r2(x) { return Math.round(x * 100) / 100; }
  function setPC(p) { var sm = S.sim; if (!(p > 0)) return; var old = sm.c.length ? sm.c[0].o : null; sm.pc = p; if (old != null) setGap(sm.gap); else { save(); render(); } }

  /* ---------------- chart ---------------- */
  var VW = null, DR = null;
  var LAYOUT = { padL: 10, padR: 62, top: 12, ph: 360, gap: 14, vh: 90, bot: 22 };
  function chartSvg() {
    var RS = S.tab === "build" ? S.cres : S.res, sm = S.sim, c = sm.c, W = Math.max(520, (host && host.clientWidth) || 900), L = LAYOUT, Ht = L.top + L.ph + L.gap + L.vh + L.bot, ind = calc();
    var maxVis = Math.max(20, Math.floor((W - L.padL - L.padR) / 10)), st = Math.max(0, c.length - maxVis), vis = c.slice(st);
    var slots = Math.max(vis.length + 5, 18), sw = Math.min(60, (W - L.padL - L.padR) / slots), bw = Math.max(3, sw * 0.62);
    var pcl = sm.pc, lo = c.length ? Infinity : pcl, hi = c.length ? -Infinity : pcl;
    vis.forEach(function (x, i) { lo = Math.min(lo, x.l); hi = Math.max(hi, x.h); var j = st + i; lo = Math.min(lo, ind.vw[j], ind.em[j]); hi = Math.max(hi, ind.vw[j], ind.em[j]); });
    if (!c.length) { hi = pcl * (1 + Math.max(0.02, sm.gap / 100) + 0.02); lo = pcl * 0.98; }
    var pad = (hi - lo) * 0.1 || pcl * 0.02; lo -= pad; hi += pad;
    if (DR && DR.range) { lo = DR.range[0]; hi = DR.range[1]; }
    var vmax = Math.max.apply(null, vis.map(function (x) { return x.v; }).concat([sm.vb])) * 1.15;
    if (DR && DR.vmax) vmax = DR.vmax;
    var Y = function (p) { return L.top + (hi - p) / (hi - lo) * L.ph; }, X = function (i) { return L.padL + (i - st + 0.5) * sw; }, VY = function (v) { return L.top + L.ph + L.gap + L.vh - v / vmax * L.vh; };
    VW = { Y: Y, X: X, VY: VY, lo: lo, hi: hi, st: st, sw: sw, vmax: vmax, L: L, W: W, Ht: Ht, inv: function (y) { return hi - (y - L.top) / L.ph * (hi - lo); }, invV: function (y) { return (L.top + L.ph + L.gap + L.vh - y) / L.vh * vmax; } };
    var s = '<svg viewBox="0 0 ' + W + ' ' + Ht + '" width="' + W + '" height="' + Ht + '" role="img" aria-label="Candle simulator" style="touch-action:none;user-select:none">';
    var step = niceStep((hi - lo) / 6);
    for (var p = Math.ceil(lo / step) * step; p <= hi; p += step) s += '<line x1="' + L.padL + '" x2="' + (W - L.padR) + '" y1="' + Y(p) + '" y2="' + Y(p) + '" class="bt-g"/><text x="' + (W - L.padR + 6) + '" y="' + (Y(p) + 4) + '" class="bt-ax">' + f2(p) + '</text>';
    if (pcl >= lo && pcl <= hi) s += '<line x1="' + L.padL + '" x2="' + (W - L.padR) + '" y1="' + Y(pcl) + '" y2="' + Y(pcl) + '" class="bt-pc"/><text x="' + (L.padL + 4) + '" y="' + (Y(pcl) - 4) + '" class="bt-pct">Yesterday close ' + f2(pcl) + '</text>';
    else s += '<text x="' + (W - L.padR - 4) + '" y="' + (pcl < lo ? L.top + L.ph - 6 : L.top + 12) + '" text-anchor="end" class="bt-pct">' + (pcl < lo ? "\u2193" : "\u2191") + ' Yesterday close ' + f2(pcl) + ' (' + (sm.gap >= 0 ? "gap up " : "gap down ") + f2(Math.abs(sm.gap)) + '%)</text>';
    vis.forEach(function (x, ii) {
      var i = st + ii, cx = X(i), up = x.c >= x.o, col = up ? "var(--gain)" : "var(--loss)", yt = Y(Math.max(x.o, x.c)), yb = Y(Math.min(x.o, x.c));
      s += '<g data-i="' + i + '" class="bt-c' + (S.sel === i ? " sel" : "") + '"><rect x="' + (cx - sw / 2) + '" y="' + L.top + '" width="' + sw + '" height="' + (L.ph + L.gap + L.vh) + '" fill="transparent"/>' +
        '<line x1="' + cx + '" x2="' + cx + '" y1="' + Y(x.h) + '" y2="' + Y(x.l) + '" stroke="' + col + '" stroke-width="1.6"/><rect x="' + (cx - bw / 2) + '" y="' + yt + '" width="' + bw + '" height="' + Math.max(1.5, yb - yt) + '" fill="' + col + '" rx="1"/>' +
        '<rect x="' + (cx - bw / 2) + '" y="' + VY(x.v) + '" width="' + bw + '" height="' + (L.top + L.ph + L.gap + L.vh - VY(x.v)) + '" fill="' + col + '" opacity=".55"/></g>';
      if (S.sel === i) s += '<rect x="' + (cx - sw / 2) + '" y="' + L.top + '" width="' + sw + '" height="' + (L.ph + L.gap + L.vh) + '" fill="var(--ink)" opacity=".05" pointer-events="none"/>';
    });
    function path(arr, cls) { var d = ""; vis.forEach(function (x, ii) { var i = st + ii; d += (ii ? "L" : "M") + X(i).toFixed(1) + " " + Y(arr[i]).toFixed(1); }); return '<path d="' + d + '" class="' + cls + '" fill="none" pointer-events="none"/>'; }
    if (vis.length > 1) { s += path(ind.vw, "bt-vw") + path(ind.em, "bt-em"); }
    s += '<text x="' + (L.padL + 4) + '" y="' + (L.top + 12) + '" class="bt-lg"><tspan fill="#d4a017">&#9632; VWAP</tspan>  <tspan fill="#2b7de0">&#9632; 9 EMA</tspan></text>';
    // trade markers
    if (RS && RS.cur) RS.cur.forEach(function (t) {
      if (t.ei < st) return; var x1 = X(t.ei), x2 = X(t.xi), win = t.R > 0;
      s += '<line x1="' + x1 + '" x2="' + x2 + '" y1="' + Y(t.entry) + '" y2="' + Y(t.exit) + '" stroke="' + (win ? "var(--gain)" : "var(--loss)") + '" stroke-width="2" stroke-dasharray="4 3" pointer-events="none"/>' +
        '<line x1="' + x1 + '" x2="' + Math.max(x2, x1 + sw) + '" y1="' + Y(t.stop) + '" y2="' + Y(t.stop) + '" class="bt-stop" pointer-events="none"/><line x1="' + x1 + '" x2="' + Math.max(x2, x1 + sw) + '" y1="' + Y(t.tgt) + '" y2="' + Y(t.tgt) + '" class="bt-tgt" pointer-events="none"/>' +
        '<path d="M' + x1 + ' ' + (Y(t.entry) - 1) + 'l-6 11h12z" fill="' + (t.dir > 0 ? "var(--gain)" : "var(--loss)") + '" pointer-events="none" transform="' + (t.dir > 0 ? "" : "rotate(180 " + x1 + " " + (Y(t.entry) + 4) + ")") + '"/><circle cx="' + x2 + '" cy="' + Y(t.exit) + '" r="4.5" fill="' + (win ? "var(--gain)" : "var(--loss)") + '" stroke="var(--panel)" stroke-width="1.5" pointer-events="none"/>' +
        '<text x="' + (x2 + 7) + '" y="' + (Y(t.exit) - 6) + '" class="bt-rt ' + (win ? "gain" : "loss") + '" pointer-events="none">' + rr(t.R) + '</text>';
    });
    if (RS && RS.A) { var AA = RS.A, seen = {};
      for (var q = 0; q < AA.n; q++) if (AA.nh[q] && !seen[AA.hi[q]] && AA.hi[q] >= st) { seen[AA.hi[q]] = 1; s += '<text x="' + X(AA.hi[q]) + '" y="' + (Y(AA.H[AA.hi[q]]) - 6) + '" text-anchor="middle" class="bt-tag hi" pointer-events="none">HIGH</text>'; }
      (RS.cur || []).forEach(function (t) { if (t.si >= st) s += '<text x="' + X(t.si) + '" y="' + (t.dir < 0 ? Y(S.sim.c[t.si].h) - 6 : Y(S.sim.c[t.si].l) + 14) + '" text-anchor="middle" class="bt-tag trg" pointer-events="none">TRG</text>'; }); }
    if (RS && RS.cust) { (RS.cur || []).forEach(function (t) { if (t.ai >= st && t.ai < c.length) s += '<text x="' + X(t.ai) + '" y="' + (t.dir < 0 ? Y(c[t.ai].h) - 6 : Y(c[t.ai].l) + 14) + '" text-anchor="middle" class="bt-tag hi" pointer-events="none">MARKER</text>'; if (t.si >= st && t.si < c.length) s += '<text x="' + X(t.si) + '" y="' + (t.dir < 0 ? Y(c[t.si].h) - (t.ai === t.si ? 18 : 6) : Y(c[t.si].l) + 14) + '" text-anchor="middle" class="bt-tag trg" pointer-events="none">SIGNAL</text>'; }); }
    // edit handles
    var sc = S.sim.c[S.sel];
    if (S.edit === "vw" || S.edit === "em") { var arr = S.edit === "vw" ? ind.vw : ind.em; vis.forEach(function (x, ii) { var i = st + ii; s += '<circle data-line="' + S.edit + '" data-i="' + i + '" cx="' + X(i) + '" cy="' + Y(arr[i]) + '" r="6" class="bt-hl ' + S.edit + '"/>'; }); }
    else if (sc && S.sel >= st) {
      var cx = X(S.sel), hs = [["h", sc.h], ["o", sc.o], ["c", sc.c], ["l", sc.l]];
      hs.forEach(function (a) { s += '<circle data-h="' + a[0] + '" cx="' + (a[0] === "o" ? cx - bw / 2 : a[0] === "c" ? cx + bw / 2 : cx) + '" cy="' + Y(a[1]) + '" r="6" class="bt-hd"/>'; });
      s += '<rect data-h="v" x="' + (cx - bw / 2 - 2) + '" y="' + (VY(sc.v) - 5) + '" width="' + (bw + 4) + '" height="9" rx="3" class="bt-hv"/>';
    }
    // x labels
    for (var k = 0; k < vis.length; k += Math.max(1, Math.round(40 / sw))) s += '<text x="' + X(st + k) + '" y="' + (Ht - 6) + '" class="bt-ax" text-anchor="middle">' + (st + k + 1) + '</text>';
    if (!c.length) s += '<text x="' + W / 2 + '" y="' + (L.top + L.ph / 2) + '" text-anchor="middle" class="bt-empty">Press a candle button below to start. The first one opens at the gap.</text>';
    return s + '</svg>';
  }
  function niceStep(x) { var p = Math.pow(10, Math.floor(Math.log10(x || 1))), m = x / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }

  function pickCandle(x) { if (!VW) return -1; var i = Math.floor((x - VW.L.padL) / VW.sw) + VW.st; return i >= 0 && i < S.sim.c.length ? i : -1; }
  function onDown(ev) {
    var t = ev.target, rect = host.querySelector("svg").getBoundingClientRect(), ln = t.getAttribute && t.getAttribute("data-line"), hd = t.getAttribute && t.getAttribute("data-h");
    if (ln) { DR = { kind: "line", line: ln, i: +t.getAttribute("data-i"), range: [VW.lo, VW.hi] }; S.sel = DR.i; }
    else if (hd) { DR = { kind: "h", h: hd, range: [VW.lo, VW.hi], vmax: VW.vmax }; }
    else { var i = pickCandle(ev.clientX - rect.left); if (i < 0) return; S.sel = i; save(); render(); return; }
    host.setPointerCapture(ev.pointerId); ev.preventDefault();
  }
  function onMove(ev) {
    if (!DR) return; var rect = host.querySelector("svg").getBoundingClientRect(), y = ev.clientY - rect.top, sm = S.sim;
    if (DR.kind === "line") { var m = DR.line === "vw" ? sm.vw : sm.em; m[DR.i] = r2(VW.inv(y)); }
    else {
      var c = sm.c[S.sel]; if (!c) return;
      if (DR.h === "v") c.v = Math.max(100, Math.round(VW.invV(y)));
      else { var p = r2(VW.inv(y)); c[DR.h] = p; if (DR.h === "h") c.h = Math.max(p, c.o, c.c); else if (DR.h === "l") c.l = Math.min(p, c.o, c.c); else { c.h = Math.max(c.h, c.o, c.c); c.l = Math.min(c.l, c.o, c.c); } c.k = "edited"; }
    }
    S.res = null; paint();
  }
  function onUp() { if (!DR) return; DR = null; save(); render(); }

  /* ---------------- strategy engine (same rules as the SL-1-RV thinkscript, candle by candle) ---------------- */
  function indOf(sc) {
    var c = sc.c, vw = [], em = [], pv = 0, cv = 0, e = 0;
    c.forEach(function (x, i) { var tp = (x.h + x.l + x.c) / 3; pv += tp * x.v; cv += x.v; vw[i] = cv ? pv / cv : x.c; e = i ? e + 0.2 * (x.c - e) : x.c; em[i] = e; });
    for (var k in (sc.vw || {})) if (sc.vw[k] != null && vw[k] != null) vw[k] = sc.vw[k]; for (k in (sc.em || {})) if (sc.em[k] != null && em[k] != null) em[k] = sc.em[k];
    return { vw: vw, em: em };
  }
  function hm(v) { v = Math.round(v); return Math.floor(v / 100) * 60 + v % 100; }
  function rhu(x) { return Math.floor(x + 0.5); }
  function analyze(sc, P, ind) {
    var c = sc.c, n = c.length, tf = sc.tf || P.tf || 2, O = [], H = [], L = [], C = [], V = [], T = [], i, j;
    ind = ind || indOf(sc); var vwap = ind.vw, ema = ind.em;
    for (i = 0; i < n; i++) { O[i] = c[i].o; H[i] = c[i].h; L[i] = c[i].l; C[i] = c[i].c; V[i] = c[i].v; T[i] = 570 + i * tf; }
    var rng = [], body = [], upw = [], low_w = [], avg = [], S = P.shapes, ss = [], ls = [];
    for (i = 0; i < n; i++) { rng[i] = H[i] - L[i]; body[i] = Math.abs(C[i] - O[i]); upw[i] = H[i] - Math.max(O[i], C[i]); low_w[i] = Math.min(O[i], C[i]) - L[i]; var a = rng.slice(Math.max(0, i - 19), i + 1); avg[i] = a.reduce(function (x, y) { return x + y; }, 0) / a.length; }
    for (i = 0; i < n; i++) {
      var r = rng[i], b = body[i], u = upw[i], w = low_w[i], small = r > 0 && b <= r * P.maxBodyPct / 100;
      var inv = S.inv && r > 0 && u >= 2 * b && w <= u, ham = S.hammer && r > 0 && w >= 2 * b && u <= w, doji = S.doji && r > 0 && b <= r * 0.10, spin = S.spin && small && u > b && w > b,
        ins = S.inside && i > 0 && H[i] <= H[i - 1] && L[i] >= L[i - 1] && b <= r * P.insideMaxBodyPct / 100, wick = S.wick && r > 0 && u >= b && u >= w && b <= r * 0.60;
      ss[i] = !!(inv || doji || spin || ins || wick); ls[i] = !!(ham || doji || spin || ins);
    }
    function isHod(j) { if (j === 0) return true; var m = -Infinity; for (var k = 0; k < j; k++) m = Math.max(m, H[k]); return H[j] > m; }
    function swingOk(i) { var sb = P.swingBars; if (sb <= 0) return true; if (i < 2) return false; var m = -Infinity; for (var k = Math.max(0, i - 1 - sb); k < i - 1; k++) m = Math.max(m, H[k]); return H[i - 1] >= m; }
    function hhCancel(i, off) {
      var offH = Math.min(off, 60), brk = 0, k, m;
      for (k = 1; k < offH; k++) { if (L[i - (offH - k)] < L[i - offH]) { brk = k; break; } }
      var startM = brk > 0 ? brk + 1 : offH, postMax = 0, green = false;
      for (m = startM; m < offH; m++) { var jj = i - (offH - m); postMax = Math.max(postMax, H[jj]); if (C[jj] > O[jj]) green = true; }
      return brk > 0 && green && postMax > 0 && H[i] > postMax;
    }
    var msb = P.maxSetupBars, hi = [], nh = [], nhH = [], nhL = [], snh = [], gs = [], bd = [], dc = [], bhh = [], pbl = [], gnl = [];
    for (i = 0; i < n; i++) { hi[i] = -1; nh[i] = false; nhH[i] = 0; nhL[i] = 0; snh[i] = 999; gs[i] = 0; bd[i] = 0; dc[i] = 0; bhh[i] = 0; pbl[i] = 0; gnl[i] = false; }
    if (n) { nhH[0] = H[0]; nhL[0] = L[0]; pbl[0] = L[0]; }
    for (i = 1; i < n; i++) {
      var brkPrev = L[i] < L[i - 1] && H[i] <= H[i - 1], hod = P.requireHOD ? isHod(i - 1) : swingOk(i), hp = hi[i - 1], cur;
      if (hp < 0) cur = (brkPrev && hod) ? i - 1 : -1;
      else {
        var d = i - hp, dd = Math.min(d, msb + 1), hh = H[i - dd];
        if (H[i] > hh) cur = -1;
        else if (P.cancelOnHigherHigh && !ss[i] && hhCancel(i, dd)) cur = -1;
        else if (d > msb) cur = (brkPrev && hod) ? i - 1 : -1;
        else if (brkPrev && hod && H[i - 1] > hh) cur = i - 1;
        else cur = hp;
      }
      hi[i] = cur; var isNew = cur >= 0 && cur !== hi[i - 1]; nh[i] = isNew; var isg = C[i] >= O[i];
      if (isNew) { nhH[i] = H[i - 1]; nhL[i] = L[i - 1]; snh[i] = 1; gs[i] = (P.breakGreenCounts && isg) ? 1 : 0; bd[i] = 1; dc[i] = 0; bhh[i] = 0; pbl[i] = L[i]; }
      else { nhH[i] = nhH[i - 1]; nhL[i] = nhL[i - 1]; snh[i] = snh[i - 1] + 1; gs[i] = isg ? 1 : gs[i - 1]; bd[i] = L[i] < nhL[i] ? 1 : bd[i - 1]; dc[i] = dc[i - 1] + (L[i] < L[i - 1] ? 1 : 0); bhh[i] = bhh[i - 1] + (H[i] > H[i - 1] ? 1 : 0); pbl[i] = Math.min(pbl[i - 1], L[i]); }
      gnl[i] = !isNew && C[i] > O[i] && L[i] < pbl[i - 1];
    }
    var nlL = [], nlH = [], snl = [], bu = [], ra = [], nl = [];
    for (i = 0; i < n; i++) { nlL[i] = 0; nlH[i] = 0; snl[i] = 999; bu[i] = 0; ra[i] = 0; nl[i] = false; }
    if (n) { nlL[0] = L[0]; nlH[0] = H[0]; }
    for (i = 1; i < n; i++) {
      var nlw = i >= 2 && L[i] < Math.min(L[i - 1], L[i - 2]); nl[i] = nlw;
      if (nlw) { nlL[i] = L[i]; nlH[i] = H[i]; snl[i] = 0; bu[i] = 0; ra[i] = 0; }
      else { nlL[i] = nlL[i - 1]; nlH[i] = nlH[i - 1]; snl[i] = snl[i - 1] + 1; bu[i] = (bu[i - 1] === 0 && H[i] > nlH[i]) ? 1 : bu[i - 1]; ra[i] = (bu[i - 1] === 1 && C[i] < O[i]) ? 1 : ra[i - 1]; }
    }
    var gap = n && sc.pc > 0 ? (O[0] / sc.pc - 1) * 100 : 0, sMin = hm(P.startTime), eMin = hm(P.endTime), midStop = P.stopMode === "mid";
    var goS = [], goL = [], entS = [], entL = [], stpS = [], stpL = [], shS = [], shL = [], q1s = [], q2s = [], q3s = [], q1l = [], q2l = [], q3l = [];
    var fun = { shape: 0, afterHigh: 0, broke: 0, green: 0, vwap: 0, other: 0, time: 0 };
    for (i = 0; i < n; i++) {
      var touched = false; for (j = Math.max(0, i - 5); j <= i; j++) if (L[j] <= ema[j] && H[j] >= ema[j]) touched = true;
      var pw = P.vwapRule, room = P.vwapRoomR * rng[i];
      var vokS = pw === "above" ? C[i] > vwap[i] : pw === "below" ? C[i] < vwap[i] : pw === "room" ? (L[i] - vwap[i]) >= room : true;
      var vokL = pw === "above" ? C[i] > vwap[i] : pw === "below" ? C[i] < vwap[i] : pw === "room" ? (vwap[i] - H[i]) >= room : true;
      var test = P.testMode, sigS = false, sigL = false, seqS = false, other = false;
      if (i >= 1) {
        seqS = hi[i] >= 0 && !nh[i] && snh[i] >= 2 && snh[i] <= msb && H[i] <= nhH[i] && (gs[i] === 1 || !P.needGreen) && (bd[i] === 1 || !P.requireBreak) && !(P.noGreenNewLow && gnl[i]);
        var dropsOk = P.maxDrops <= 0 || dc[i - 1] <= P.maxDrops, hhOk = P.maxBounceHH <= 0 || bhh[i] <= P.maxBounceHH, notBelow = !P.trigNotBelowPrev || L[i] >= L[i - 1];
        var bp = nhH[i] - pbl[i] > 0 ? (H[i] - pbl[i]) / (nhH[i] - pbl[i]) * 100 : 0, bounceOk = P.minBouncePct <= 0 || bp >= P.minBouncePct, emaOk = !P.trigBelowEMA || C[i] < ema[i];
        var sizeOk = P.minTrigATR <= 0 || rng[i] >= P.minTrigATR * avg[i], touchOk = !P.requireEMATouch || touched;
        other = bounceOk && emaOk && sizeOk && dropsOk && hhOk && notBelow && touchOk;
        sigS = !!(P.tradeShort && ss[i] && seqS && (test || vokS) && other);
        var seqL = !nl[i] && ra[i - 1] === 1 && snl[i] <= P.longMaxBars && L[i] > nlL[i];
        sigL = !!(P.tradeLong && ls[i] && seqL && touchOk && vokL);
      }
      var filt = test || (C[i] >= P.minPrice && (P.minGapPct <= 0 || gap >= P.minGapPct)), nxt = T[i] + tf, et = nxt >= sMin && nxt <= eMin;
      entS[i] = L[i] - P.entryOffset; entL[i] = H[i] + P.entryOffset;
      stpS[i] = midStop ? (H[i] + L[i]) / 2 + P.midStopOffset : H[i] + P.stopOffset; stpL[i] = midStop ? (H[i] + L[i]) / 2 - P.midStopOffset : L[i] - P.stopOffset;
      var sl = P.slippage;
      shS[i] = stpS[i] - entS[i] > 0 ? Math.floor(P.riskDollars / (Math.max(stpS[i] - entS[i], P.minRiskPS) + 2 * sl)) : 0;
      shL[i] = entL[i] - stpL[i] > 0 ? Math.floor(P.riskDollars / (Math.max(entL[i] - stpL[i], P.minRiskPS) + 2 * sl)) : 0;
      [[shS, q1s, q2s, q3s], [shL, q1l, q2l, q3l]].forEach(function (g) {
        var s_ = g[0][i], a1 = Math.min(s_, rhu(s_ * P.t1SellPct / 100)), b1 = P.useT3 ? Math.min(s_ - a1, rhu(s_ * P.t2SellPct / 100)) : s_ - a1, c1 = P.useT3 ? s_ - a1 - b1 : 0;
        g[1][i] = a1; g[2][i] = b1; g[3][i] = c1;
      });
      var gl = sigL && filt && et && shL[i] >= 1, gsr = sigS && filt && et && shS[i] >= 1;
      goL[i] = !!gl; goS[i] = !!(gsr && !gl);
      if (i >= 1 && P.tradeShort && ss[i]) {
        fun.shape++;
        if (hi[i] >= 0 && snh[i] <= msb && !nh[i] && H[i] < nhH[i]) {
          fun.afterHigh++;
          if (bd[i] === 1 || !P.requireBreak) {
            fun.broke++;
            if ((gs[i] === 1 || !P.needGreen) && !(P.noGreenNewLow && gnl[i]) && snh[i] >= 2) { fun.green++; if (test || vokS) { fun.vwap++; if (other) { fun.other++; if (filt && et) fun.time++; } } }
          }
        }
      }
    }
    return { n: n, O: O, H: H, L: L, C: C, T: T, ema: ema, vwap: vwap, hi: hi, nh: nh, goS: goS, goL: goL, entS: entS, entL: entL, stpS: stpS, stpL: stpL, shS: shS, shL: shL, q: { 1: [q1s, q1l], 2: [q2s, q2l], 3: [q3s, q3l] }, fun: fun, tf: tf };
  }
  function track(A, tr, i, P) {
    var O = A.O, H = A.H, L = A.L, t = tr.T, side = tr.side, tHi = H[t], tLo = L[t], rt = tHi - tLo, slip = P.slippage, m1 = P.t1R, m2 = P.t2R, m3 = P.useT3 ? P.t3R : 0, midR = P.midMoveR, beR = P.beMoveR, mid = P.stopMode === "mid", k;
    var stop0, lv, best, reached, midT = (tHi + tLo) / 2;
    if (side > 0) { stop0 = mid ? midT - P.midStopOffset : tLo - P.stopOffset; lv = function (r) { return tHi + r * rt; }; best = 0; for (k = t + 1; k < i; k++) best = Math.max(best, H[k]); reached = function (x) { return best >= x; }; }
    else { stop0 = mid ? midT + P.midStopOffset : tHi + P.stopOffset; lv = function (r) { return tLo - r * rt; }; best = 999999; for (k = t + 1; k < i; k++) best = Math.min(best, L[k]); reached = function (x) { return best <= x; }; }
    var L1 = lv(m1), L2 = lv(m2), L3 = lv(m3), LM = lv(midR), LB = lv(beR), r1b = reached(L1), r2b = reached(L2), r3b = m3 > 0 && reached(L3), rmb = midR > 0 && reached(LM), rbb = beR > 0 && reached(LB);
    var beStop = P.beLevel === "entry" ? tr.ent : (side > 0 ? tHi : tLo), s1, stopNow, hit, touch, px;
    if (side > 0) { s1 = rmb ? Math.max(stop0, midT) : stop0; stopNow = (rbb || r1b) ? Math.max(s1, beStop) : s1; hit = L[i] <= stopNow; touch = function (x) { return A.H[i] >= x; }; px = Math.min(O[i], stopNow) - slip; }
    else { s1 = rmb ? Math.min(stop0, midT) : stop0; stopNow = (rbb || r1b) ? Math.min(s1, beStop) : s1; hit = H[i] >= stopNow; touch = function (x) { return A.L[i] <= x; }; px = Math.max(O[i], stopNow) + slip; }
    var r1 = r1b || (!hit && touch(L1)), r2 = r2b || (!hit && touch(L2)), r3 = r3b || (m3 > 0 && !hit && touch(L3)), last = m3 > 0 ? r3 : r2;
    return { ex: !!(hit || last), px: px, r1: r1, r2: r2, r3: r3, r1b: r1b, r2b: r2b, r3b: r3b, hit: !!hit, stop: stopNow, L: [L1, L2, L3], t1Seen: r1b, stop0: stop0 };
  }
  function backtest(sc, P, ind) {
    var A = analyze(sc, P, ind), n = A.n, O = A.O, H = A.H, L = A.L, T = A.T, slip = P.slippage, trades = [], pos = null, blockHi = -1, i;
    for (i = 1; i < n; i++) {
      var t, side;
      if (!pos) {
        t = i - 1;
        if (A.goL[t] && H[i] >= A.entL[t]) side = 1;
        else if (A.goS[t] && L[i] <= A.entS[t] && (P.waitAfter === "never" || A.hi[t] !== blockHi)) side = -1;
        else continue;
        var ent, qs, qty;
        if (side > 0) { ent = Math.max(O[i], H[t] + P.entryOffset) + slip; qs = [A.q[1][1][t], A.q[2][1][t], A.q[3][1][t]]; qty = A.shL[t]; }
        else { ent = Math.min(O[i], L[t] - P.entryOffset) - slip; qs = [A.q[1][0][t], A.q[2][0][t], A.q[3][0][t]]; qty = A.shS[t]; }
        pos = { T: t, side: side, ent: ent, ei: i, qs: qs, qty: qty };
        continue;
      }
      var eod = T[i] + A.tf >= 956, tr = track(A, pos, i, P);
      if (!(eod || tr.ex)) continue;
      side = pos.side; t = pos.T; var rt = H[t] - L[t];
      var stopPx = eod ? (side < 0 ? O[i] + slip : O[i] - slip) : tr.px, g1 = eod ? tr.r1b : tr.r1, g2 = eod ? tr.r2b : tr.r2, g3 = eod ? tr.r3b : tr.r3;
      var p = function (r) { return side > 0 ? H[t] + r * rt - slip : L[t] - r * rt + slip; };
      var parts = [["T1", pos.qs[0], g1, p(P.t1R)], ["T2", pos.qs[1], g2, p(P.t2R)], ["T3", pos.qs[2], g3, p(P.t3R)]], qa = pos.qs[0] + pos.qs[1] + pos.qs[2], exPx = stopPx;
      if (qa > 0) exPx = parts.reduce(function (a, x) { return a + x[1] * (x[2] ? x[3] : stopPx); }, 0) / qa;
      var pnl = side * (exPx - pos.ent) * pos.qty, why = eod ? "EOD" : (tr.hit ? "stop" : "all targets");
      if (why === "stop" && tr.t1Seen) why = "stop after T1";
      trades.push({ si: t, hi: A.hi[t], ei: pos.ei, xi: i, entry: r2(pos.ent), exit: r2(exPx), stop: r2(tr.stop0), tgt: r2(tr.L[1]), dir: side, shares: pos.qty, pnl: r2(pnl), R: pnl / P.riskDollars, why: why, parts: parts.filter(function (x) { return x[1] > 0 && x[2]; }).map(function (x) { return x[0]; }) });
      blockHi = (P.waitAfter === "any" || (P.waitAfter === "loss" && !tr.t1Seen)) ? A.hi[t] : -1;
      pos = null;
    }
    if (pos) trades.push({ si: pos.T, hi: A.hi[pos.T], ei: pos.ei, xi: n - 1, entry: r2(pos.ent), exit: r2(pos.ent), stop: r2(pos.side > 0 ? L[pos.T] - P.stopOffset : H[pos.T] + P.stopOffset), tgt: r2(pos.ent), dir: pos.side, shares: pos.qty, pnl: 0, R: 0, why: "still open", open: true, parts: [] });
    trades.fun = A.fun; trades.A = A; return trades;
  }
  function runAll() {
    var P = S.rules, scenes = [{ name: "Current chart", pc: S.sim.pc, tf: S.sim.tf, c: S.sim.c, vw: S.sim.vw, em: S.sim.em }].concat(S.scenes), all = [], cur = null, fun = null, curA = null;
    scenes.forEach(function (sc, i) {
      var t = backtest(sc, P, indOf(sc)); if (i === 0) { cur = t.slice(); fun = t.fun; curA = t.A; }
      t.forEach(function (x) { x.scene = sc.name; all.push(x); });
    });
    var done = all.filter(function (t) { return !t.open; }), w = done.filter(function (t) { return t.pnl > 0; }), gw = w.reduce(function (a, t) { return a + t.pnl; }, 0), gl = done.filter(function (t) { return t.pnl <= 0; }).reduce(function (a, t) { return a - t.pnl; }, 0);
    var net = done.reduce(function (a, t) { return a + t.pnl; }, 0), sumR = done.reduce(function (a, t) { return a + t.R; }, 0);
    S.res = { all: all, cur: cur, n: done.length, wr: done.length ? w.length / done.length : 0, pf: gl > 0 ? gw / gl : (gw > 0 ? Infinity : 0), net: net, sumR: sumR, exp: done.length ? sumR / done.length : 0, scenes: scenes.length, fun: fun, A: curA };
    S.code = ""; render();
  }
  function r2(x) { return Math.round(x * 100) / 100; }

  /* ---------------- bot code ---------------- */
  var PYTPL = "__HEADER__\nimport csv\nimport json\nimport sys\n\nRULES = json.loads(r'''__RULES__''')\nPREV_CLOSE = __PREV_CLOSE__    # yesterday's close (used for the gap filter)\nTF = __TF__                     # candle size in minutes of your candles.csv\n\n\ndef hhmm_to_min(v):\n    v = int(v)\n    return (v // 100) * 60 + v % 100\n\n\ndef load_candles(path):\n    \"\"\"candles.csv columns: time,open,high,low,close,volume   (time like 09:30, one trading day per file)\"\"\"\n    rows = []\n    with open(path, newline=\"\") as f:\n        for r in csv.DictReader(f):\n            hh, mm = r[\"time\"].strip()[-5:].split(\":\")\n            rows.append({\"t\": int(hh) * 60 + int(mm), \"o\": float(r[\"open\"]), \"h\": float(r[\"high\"]),\n                         \"l\": float(r[\"low\"]), \"c\": float(r[\"close\"]), \"v\": float(r[\"volume\"])})\n    return rows\n\n\ndef analyze(rows, prev_close=None):\n    \"\"\"Every rule of the strategy, candle by candle. Returns the per-candle series the backtest uses.\"\"\"\n    P = RULES\n    prev_close = PREV_CLOSE if prev_close is None else prev_close\n    n = len(rows)\n    O = [r[\"o\"] for r in rows]\n    H = [r[\"h\"] for r in rows]\n    L = [r[\"l\"] for r in rows]\n    C = [r[\"c\"] for r in rows]\n    V = [r[\"v\"] for r in rows]\n    T = [r[\"t\"] for r in rows]\n    S = P[\"shapes\"]\n    tf = TF\n    # indicators\n    ema = []\n    vwap = []\n    pv = cv = e = 0.0\n    for i in range(n):\n        tp = (H[i] + L[i] + C[i]) / 3\n        pv += tp * V[i]\n        cv += V[i]\n        vwap.append(pv / cv if cv else C[i])\n        e = C[i] if i == 0 else e + 0.2 * (C[i] - e)\n        ema.append(e)\n    rng = [H[i] - L[i] for i in range(n)]\n    body = [abs(C[i] - O[i]) for i in range(n)]\n    upw = [H[i] - max(O[i], C[i]) for i in range(n)]\n    low_w = [min(O[i], C[i]) - L[i] for i in range(n)]\n    avg_rng = [sum(rng[max(0, i - 19):i + 1]) / len(rng[max(0, i - 19):i + 1]) for i in range(n)]\n\n    short_shape, long_shape = [], []\n    for i in range(n):\n        r, b, u, w = rng[i], body[i], upw[i], low_w[i]\n        small = r > 0 and b <= r * P[\"maxBodyPct\"] / 100\n        inv = S[\"inv\"] and r > 0 and u >= 2 * b and w <= u\n        ham = S[\"hammer\"] and r > 0 and w >= 2 * b and u <= w\n        doji = S[\"doji\"] and r > 0 and b <= r * 0.10\n        spin = S[\"spin\"] and small and u > b and w > b\n        ins = S[\"inside\"] and i > 0 and H[i] <= H[i - 1] and L[i] >= L[i - 1] and b <= r * P[\"insideMaxBodyPct\"] / 100\n        wick = S[\"wick\"] and r > 0 and u >= b and u >= w and b <= r * 0.60\n        short_shape.append(bool(inv or doji or spin or ins or wick))\n        long_shape.append(bool(ham or doji or spin or ins))\n\n    def is_hod(j):\n        return j == 0 or H[j] > max(H[:j])\n\n    def swing_ok(i):\n        sb = P[\"swingBars\"]\n        if sb <= 0:\n            return True\n        if i < 2:\n            return False\n        return H[i - 1] >= max(H[max(0, i - 1 - sb):i - 1])\n\n    def hh_cancel(i, off):\n        off_h = min(off, 60)\n        brk = 0\n        for k in range(1, off_h):\n            if L[i - (off_h - k)] < L[i - off_h]:\n                brk = k\n                break\n        start_m = brk + 1 if brk > 0 else off_h\n        post_max = 0.0\n        green = False\n        for m in range(start_m, off_h):\n            j = i - (off_h - m)\n            post_max = max(post_max, H[j])\n            if C[j] > O[j]:\n                green = True\n        return brk > 0 and green and post_max > 0 and H[i] > post_max\n\n    msb = P[\"maxSetupBars\"]\n    hi = [-1] * n\n    new_high = [False] * n\n    nh_high = [0.0] * n\n    nh_low = [0.0] * n\n    since_nh = [999] * n\n    green_seen = [0] * n\n    broke_dn = [0] * n\n    drop_count = [0] * n\n    bounce_hh = [0] * n\n    pb_low = [0.0] * n\n    green_new_low = [False] * n\n    nh_high[0], nh_low[0], pb_low[0] = H[0], L[0], L[0]\n    for i in range(1, n):\n        brk_prev = L[i] < L[i - 1] and H[i] <= H[i - 1]\n        hod = is_hod(i - 1) if P[\"requireHOD\"] else swing_ok(i)\n        hp = hi[i - 1]\n        if hp < 0:\n            cur = i - 1 if (brk_prev and hod) else -1\n        else:\n            d = i - hp\n            dd = min(d, msb + 1)\n            hh = H[i - dd]\n            if H[i] > hh:\n                cur = -1\n            elif P[\"cancelOnHigherHigh\"] and not short_shape[i] and hh_cancel(i, dd):\n                cur = -1\n            elif d > msb:\n                cur = i - 1 if (brk_prev and hod) else -1\n            elif brk_prev and hod and H[i - 1] > hh:\n                cur = i - 1\n            else:\n                cur = hp\n        hi[i] = cur\n        nh = cur >= 0 and cur != hi[i - 1]\n        new_high[i] = nh\n        isg = C[i] >= O[i]\n        if nh:\n            nh_high[i], nh_low[i] = H[i - 1], L[i - 1]\n            since_nh[i] = 1\n            green_seen[i] = 1 if (P[\"breakGreenCounts\"] and isg) else 0\n            broke_dn[i] = 1\n            drop_count[i] = 0\n            bounce_hh[i] = 0\n            pb_low[i] = L[i]\n        else:\n            nh_high[i], nh_low[i] = nh_high[i - 1], nh_low[i - 1]\n            since_nh[i] = since_nh[i - 1] + 1\n            green_seen[i] = 1 if isg else green_seen[i - 1]\n            broke_dn[i] = 1 if L[i] < nh_low[i] else broke_dn[i - 1]\n            drop_count[i] = drop_count[i - 1] + (1 if L[i] < L[i - 1] else 0)\n            bounce_hh[i] = bounce_hh[i - 1] + (1 if H[i] > H[i - 1] else 0)\n            pb_low[i] = min(pb_low[i - 1], L[i])\n        green_new_low[i] = (not nh) and C[i] > O[i] and L[i] < pb_low[i - 1]\n\n    # long side bookkeeping\n    nl_low = [0.0] * n\n    nl_high = [0.0] * n\n    since_nl = [999] * n\n    broke_up = [0] * n\n    red_after = [0] * n\n    new_low = [False] * n\n    nl_low[0], nl_high[0] = L[0], H[0]\n    for i in range(1, n):\n        nlw = i >= 2 and L[i] < min(L[i - 1], L[i - 2])\n        new_low[i] = nlw\n        if nlw:\n            nl_low[i], nl_high[i], since_nl[i], broke_up[i], red_after[i] = L[i], H[i], 0, 0, 0\n        else:\n            nl_low[i], nl_high[i] = nl_low[i - 1], nl_high[i - 1]\n            since_nl[i] = since_nl[i - 1] + 1\n            broke_up[i] = 1 if (broke_up[i - 1] == 0 and H[i] > nl_high[i]) else broke_up[i - 1]\n            red_after[i] = 1 if (broke_up[i - 1] == 1 and C[i] < O[i]) else red_after[i - 1]\n\n    gap_pct = (O[0] / prev_close - 1) * 100 if prev_close > 0 and n else 0\n    start_min, end_min = hhmm_to_min(P[\"startTime\"]), hhmm_to_min(P[\"endTime\"])\n    mid_stop = P[\"stopMode\"] == \"mid\"\n    go_s, go_l = [False] * n, [False] * n\n    ent_s, ent_l, stp_s, stp_l = [0.0] * n, [0.0] * n, [0.0] * n, [0.0] * n\n    sh_s, sh_l = [0] * n, [0] * n\n    q1s, q2s, q3s, q1l, q2l, q3l = ([0] * n for _ in range(6))\n    funnel = {\"shape\": 0, \"afterHigh\": 0, \"broke\": 0, \"green\": 0, \"vwap\": 0, \"other\": 0, \"time\": 0}\n    for i in range(n):\n        touched = any(L[j] <= ema[j] and H[j] >= ema[j] for j in range(max(0, i - 5), i + 1))\n        pw = P[\"vwapRule\"]\n        room = P[\"vwapRoomR\"] * rng[i]\n        vok_s = (C[i] > vwap[i]) if pw == \"above\" else (C[i] < vwap[i]) if pw == \"below\" else ((L[i] - vwap[i]) >= room) if pw == \"room\" else True\n        vok_l = (C[i] > vwap[i]) if pw == \"above\" else (C[i] < vwap[i]) if pw == \"below\" else ((vwap[i] - H[i]) >= room) if pw == \"room\" else True\n        test = P[\"testMode\"]\n        if i >= 1:\n            seq_s = (hi[i] >= 0 and not new_high[i] and since_nh[i] >= 2 and since_nh[i] <= msb and H[i] <= nh_high[i]\n                     and (green_seen[i] == 1 or not P[\"needGreen\"]) and (broke_dn[i] == 1 or not P[\"requireBreak\"])\n                     and not (P[\"noGreenNewLow\"] and green_new_low[i]))\n            drops_ok = P[\"maxDrops\"] <= 0 or drop_count[i - 1] <= P[\"maxDrops\"]\n            hh_ok = P[\"maxBounceHH\"] <= 0 or bounce_hh[i] <= P[\"maxBounceHH\"]\n            not_below = (not P[\"trigNotBelowPrev\"]) or L[i] >= L[i - 1]\n            bp = (H[i] - pb_low[i]) / (nh_high[i] - pb_low[i]) * 100 if nh_high[i] - pb_low[i] > 0 else 0\n            bounce_ok = P[\"minBouncePct\"] <= 0 or bp >= P[\"minBouncePct\"]\n            ema_ok = (not P[\"trigBelowEMA\"]) or C[i] < ema[i]\n            size_ok = P[\"minTrigATR\"] <= 0 or rng[i] >= P[\"minTrigATR\"] * avg_rng[i]\n            touch_ok = (not P[\"requireEMATouch\"]) or touched\n            other = bounce_ok and ema_ok and size_ok and drops_ok and hh_ok and not_below and touch_ok\n            short_sig = P[\"tradeShort\"] and short_shape[i] and seq_s and (test or vok_s) and other\n            seq_l = (not new_low[i]) and red_after[i - 1] == 1 and since_nl[i] <= P[\"longMaxBars\"] and L[i] > nl_low[i]\n            long_sig = P[\"tradeLong\"] and long_shape[i] and seq_l and touch_ok and vok_l\n        else:\n            short_sig = long_sig = False\n            seq_s = other = False\n        filters_ok = test or (C[i] >= P[\"minPrice\"] and (P[\"minGapPct\"] <= 0 or gap_pct >= P[\"minGapPct\"]))\n        nxt = T[i] + tf\n        entry_time = nxt >= start_min and nxt <= end_min\n        ent_s[i] = L[i] - P[\"entryOffset\"]\n        ent_l[i] = H[i] + P[\"entryOffset\"]\n        stp_s[i] = (H[i] + L[i]) / 2 + P[\"midStopOffset\"] if mid_stop else H[i] + P[\"stopOffset\"]\n        stp_l[i] = (H[i] + L[i]) / 2 - P[\"midStopOffset\"] if mid_stop else L[i] - P[\"stopOffset\"]\n        sl = P[\"slippage\"]\n        sh_s[i] = int((P[\"riskDollars\"] / (max(stp_s[i] - ent_s[i], P[\"minRiskPS\"]) + 2 * sl)) // 1) if stp_s[i] - ent_s[i] > 0 else 0\n        sh_l[i] = int((P[\"riskDollars\"] / (max(ent_l[i] - stp_l[i], P[\"minRiskPS\"]) + 2 * sl)) // 1) if ent_l[i] - stp_l[i] > 0 else 0\n        for shs, qa, qb, qc in ((sh_s, q1s, q2s, q3s), (sh_l, q1l, q2l, q3l)):\n            s_ = shs[i]\n            a = min(s_, int(round_half_up(s_ * P[\"t1SellPct\"] / 100)))\n            b = min(s_ - a, int(round_half_up(s_ * P[\"t2SellPct\"] / 100))) if P[\"useT3\"] else s_ - a\n            c = s_ - a - b if P[\"useT3\"] else 0\n            qa[i], qb[i], qc[i] = a, b, c\n        gl = long_sig and filters_ok and entry_time and sh_l[i] >= 1\n        gs = short_sig and filters_ok and entry_time and sh_s[i] >= 1\n        go_l[i] = bool(gl)\n        go_s[i] = bool(gs and not gl)\n        if i >= 1 and P[\"tradeShort\"]:\n            if short_shape[i]:\n                funnel[\"shape\"] += 1\n                if hi[i] >= 0 and since_nh[i] <= msb and not new_high[i] and H[i] < nh_high[i]:\n                    funnel[\"afterHigh\"] += 1\n                    if broke_dn[i] == 1 or not P[\"requireBreak\"]:\n                        funnel[\"broke\"] += 1\n                        if (green_seen[i] == 1 or not P[\"needGreen\"]) and not (P[\"noGreenNewLow\"] and green_new_low[i]) and since_nh[i] >= 2:\n                            funnel[\"green\"] += 1\n                            if test or vok_s:\n                                funnel[\"vwap\"] += 1\n                                if other:\n                                    funnel[\"other\"] += 1\n                                    if filters_ok and entry_time:\n                                        funnel[\"time\"] += 1\n    return {\"n\": n, \"O\": O, \"H\": H, \"L\": L, \"C\": C, \"T\": T, \"ema\": ema, \"vwap\": vwap, \"hi\": hi,\n            \"go_s\": go_s, \"go_l\": go_l, \"ent_s\": ent_s, \"ent_l\": ent_l, \"stp_s\": stp_s, \"stp_l\": stp_l,\n            \"sh_s\": sh_s, \"sh_l\": sh_l, \"q\": {1: (q1s, q1l), 2: (q2s, q2l), 3: (q3s, q3l)}, \"funnel\": funnel, \"new_high\": new_high}\n\n\ndef round_half_up(x):\n    import math\n    return math.floor(x + 0.5)\n\n\ndef track(A, tr, i):\n    \"\"\"Where is an open trade on candle i? Mirrors the strategy's exit rules (stop moves, T1, T2, T3).\"\"\"\n    P = RULES\n    O, H, L, C = A[\"O\"], A[\"H\"], A[\"L\"], A[\"C\"]\n    t, side = tr[\"T\"], tr[\"side\"]\n    t_hi, t_lo = H[t], L[t]\n    rng_t = t_hi - t_lo\n    slip = P[\"slippage\"]\n    m1, m2 = P[\"t1R\"], P[\"t2R\"]\n    m3 = P[\"t3R\"] if P[\"useT3\"] else 0\n    mid_r, be_r = P[\"midMoveR\"], P[\"beMoveR\"]\n    mid = P[\"stopMode\"] == \"mid\"\n    if side > 0:\n        stop0 = (t_hi + t_lo) / 2 - P[\"midStopOffset\"] if mid else t_lo - P[\"stopOffset\"]\n        lv = lambda r: t_hi + r * rng_t\n        best = max(H[t + 1:i]) if i > t + 1 else 0\n        reached = lambda lvl: best >= lvl\n    else:\n        stop0 = (t_hi + t_lo) / 2 + P[\"midStopOffset\"] if mid else t_hi + P[\"stopOffset\"]\n        lv = lambda r: t_lo - r * rng_t\n        best = min(L[t + 1:i]) if i > t + 1 else 999999\n        reached = lambda lvl: best <= lvl\n    L1, L2, L3, LM, LB = lv(m1), lv(m2), lv(m3), lv(mid_r), lv(be_r)\n    r1b, r2b = reached(L1), reached(L2)\n    r3b = m3 > 0 and reached(L3)\n    rmb = mid_r > 0 and reached(LM)\n    rbb = be_r > 0 and reached(LB)\n    mid_t = (t_hi + t_lo) / 2\n    be_stop = tr[\"ent\"] if P[\"beLevel\"] == \"entry\" else (t_hi if side > 0 else t_lo)\n    if side > 0:\n        s1 = max(stop0, mid_t) if rmb else stop0\n        stop_now = max(s1, be_stop) if (rbb or r1b) else s1\n        hit = L[i] <= stop_now\n        touch = lambda lvl: H[i] >= lvl\n        px = min(O[i], stop_now) - slip\n    else:\n        s1 = min(stop0, mid_t) if rmb else stop0\n        stop_now = min(s1, be_stop) if (rbb or r1b) else s1\n        hit = H[i] >= stop_now\n        touch = lambda lvl: L[i] <= lvl\n        px = max(O[i], stop_now) + slip\n    r1 = r1b or ((not hit) and touch(L1))\n    r2 = r2b or ((not hit) and touch(L2))\n    r3 = r3b or (m3 > 0 and (not hit) and touch(L3))\n    last_done = r3 if m3 > 0 else r2\n    return {\"ex\": bool(hit or last_done), \"px\": px, \"r1\": r1, \"r2\": r2, \"r3\": r3, \"r1b\": r1b, \"r2b\": r2b, \"r3b\": r3b,\n            \"hit\": bool(hit), \"stop\": stop_now, \"L\": (L1, L2, L3), \"t1_seen\": r1b}\n\n\ndef backtest(rows, prev_close=None, A=None):\n    P = RULES\n    A = A or analyze(rows, prev_close)\n    n = A[\"n\"]\n    O, H, L, C, T = A[\"O\"], A[\"H\"], A[\"L\"], A[\"C\"], A[\"T\"]\n    slip = P[\"slippage\"]\n    trades = []\n    pos = None\n    block_hi = -1\n    for i in range(1, n):\n        if pos is None:\n            t = i - 1\n            if A[\"go_l\"][t] and H[i] >= A[\"ent_l\"][t]:\n                side = 1\n            elif A[\"go_s\"][t] and L[i] <= A[\"ent_s\"][t] and (P[\"waitAfter\"] == \"never\" or A[\"hi\"][t] != block_hi):\n                side = -1\n            else:\n                continue\n            if side > 0:\n                ent = max(O[i], H[t] + P[\"entryOffset\"]) + slip\n                qs = [A[\"q\"][k][1][t] for k in (1, 2, 3)]\n                qty = A[\"sh_l\"][t]\n            else:\n                ent = min(O[i], L[t] - P[\"entryOffset\"]) - slip\n                qs = [A[\"q\"][k][0][t] for k in (1, 2, 3)]\n                qty = A[\"sh_s\"][t]\n            pos = {\"T\": t, \"side\": side, \"ent\": ent, \"ei\": i, \"qs\": qs, \"qty\": qty}\n            continue\n        eod = T[i] + TF >= 956\n        tr = track(A, pos, i)\n        if not (eod or tr[\"ex\"]):\n            continue\n        side, t = pos[\"side\"], pos[\"T\"]\n        rng_t = H[t] - L[t]\n        stop_px = (O[i] + slip if side < 0 else O[i] - slip) if eod else tr[\"px\"]\n        g1 = tr[\"r1b\"] if eod else tr[\"r1\"]\n        g2 = tr[\"r2b\"] if eod else tr[\"r2\"]\n        g3 = tr[\"r3b\"] if eod else tr[\"r3\"]\n        if side > 0:\n            p = lambda r: H[t] + r * rng_t - slip\n        else:\n            p = lambda r: L[t] - r * rng_t + slip\n        q1, q2, q3 = pos[\"qs\"]\n        q_all = q1 + q2 + q3\n        parts = [(\"T1\", q1, g1, p(P[\"t1R\"])), (\"T2\", q2, g2, p(P[\"t2R\"])), (\"T3\", q3, g3, p(P[\"t3R\"]))]\n        if q_all > 0:\n            ex_px = sum(q * (px if g else stop_px) for _, q, g, px in parts) / q_all\n        else:\n            ex_px = stop_px\n        pnl = side * (ex_px - pos[\"ent\"]) * pos[\"qty\"]\n        why = \"EOD\" if eod else (\"stop\" if tr[\"hit\"] else \"all targets\")\n        if why == \"stop\" and tr[\"t1_seen\"]:\n            why = \"stop after T1\"\n        trades.append({\"side\": \"long\" if side > 0 else \"short\", \"trigger_bar\": t, \"entry_bar\": pos[\"ei\"], \"exit_bar\": i,\n                       \"entry\": round(pos[\"ent\"], 2), \"exit\": round(ex_px, 2), \"shares\": pos[\"qty\"],\n                       \"pnl\": round(pnl, 2), \"r\": round(pnl / P[\"riskDollars\"], 2), \"why\": why})\n        if P[\"waitAfter\"] == \"any\" or (P[\"waitAfter\"] == \"loss\" and not tr[\"t1_seen\"]):\n            block_hi = A[\"hi\"][t]\n        else:\n            block_hi = -1\n        pos = None\n    if pos is not None:\n        i = n - 1\n        tr = track(A, pos, i) if i > pos[\"T\"] + 1 else None\n        side, t = pos[\"side\"], pos[\"T\"]\n        rng_t = H[t] - L[t]\n        trades.append({\"side\": \"long\" if side > 0 else \"short\", \"trigger_bar\": t, \"entry_bar\": pos[\"ei\"], \"exit_bar\": None,\n                       \"entry\": round(pos[\"ent\"], 2), \"exit\": None, \"shares\": pos[\"qty\"], \"pnl\": 0.0, \"r\": 0.0, \"why\": \"still open\"})\n    return trades\n\n\ndef live_plan(rows, prev_close=None):\n    \"\"\"Call on each NEW CLOSED candle. If that candle is a signal, returns the order to place on the next candle.\"\"\"\n    P = RULES\n    A = analyze(rows, prev_close)\n    i = A[\"n\"] - 1\n    if i < 1:\n        return None\n    if A[\"go_s\"][i]:\n        side, ent, stp, shares = \"short\", A[\"ent_s\"][i], A[\"stp_s\"][i], A[\"sh_s\"][i]\n        rng_t = A[\"H\"][i] - A[\"L\"][i]\n        targets = [A[\"L\"][i] - r * rng_t for r in (P[\"t1R\"], P[\"t2R\"], P[\"t3R\"] if P[\"useT3\"] else None) if r is not None]\n    elif A[\"go_l\"][i]:\n        side, ent, stp, shares = \"long\", A[\"ent_l\"][i], A[\"stp_l\"][i], A[\"sh_l\"][i]\n        rng_t = A[\"H\"][i] - A[\"L\"][i]\n        targets = [A[\"H\"][i] + r * rng_t for r in (P[\"t1R\"], P[\"t2R\"], P[\"t3R\"] if P[\"useT3\"] else None) if r is not None]\n    else:\n        return None\n    return {\"side\": side, \"entry_if_trades_through\": round(ent, 2), \"stop\": round(stp, 2), \"shares\": shares,\n            \"targets\": [round(x, 2) for x in targets]}\n    # To trade it: send the order with your broker here. Start on a PAPER account.\n\n\ndef main(path):\n    rows = load_candles(path)\n    A = analyze(rows)\n    result = backtest(rows, A=A)\n    done = [t for t in result if t[\"exit_bar\"] is not None]\n    wins = [t for t in done if t[\"pnl\"] > 0]\n    print(\"Funnel (candles passing each rule):\", A[\"funnel\"])\n    print(len(done), \"trades,\", f\"{(len(wins) / len(done) * 100 if done else 0):.0f}% wins,\",\n          \"total P/L $%.2f\" % sum(t[\"pnl\"] for t in done), \", total R %.2f\" % sum(t[\"r\"] for t in done))\n    for t in result:\n        print(t)\n\n\nif __name__ == \"__main__\":\n    main(sys.argv[1] if len(sys.argv) > 1 else \"candles.csv\")\n";
  function botCode() {
    var P = S.rules, ls = "";
    try { var l = byStrat(logRows()); if (l.length) ls = "Your logged results by strategy (from the Trade log):\n" + l.slice(0, 8).map(function (s) { return "  " + s.k + ": " + s.n + " trades, " + Math.round(s.wr * 100) + "% wins, avg " + rr(s.avgR); }).join("\n") + "\n"; } catch (e) { }
    var res = S.res ? "Backtest in the simulator: " + S.res.n + " trades, " + Math.round(S.res.wr * 100) + "% wins, total " + sgn(S.res.net) + " (" + rr(S.res.sumR) + ").\n" : "";
    var head = '"""\nBot strategy: SL-1-RV style ' + (P.tradeShort ? "short" : "") + (P.tradeShort && P.tradeLong ? " + " : "") + (P.tradeLong ? "long" : "") + '\nBuilt in the Revatour Backtest Lab on ' + new Date().toISOString().slice(0, 10) + '.\n' + res + ls + '\nHow to use (Windows):\n  1. Install Python from python.org (tick "Add Python to PATH"). Nothing else to install.\n  2. Save your candles as candles.csv with columns: time,open,high,low,close,volume   (e.g. 09:30, one day per file)\n  3. Set PREV_CLOSE and TF below, then run:  python bot.py\n  4. In your own code call live_plan(rows) on each new closed candle to get the order to place. Use a PAPER account first.\n"""';
    return PYTPL.replace("__HEADER__", head).replace("__RULES__", JSON.stringify(P, null, 2)).replace("__PREV_CLOSE__", f2(S.sim.pc)).replace("__TF__", String(S.sim.tf || 2));
  }
  function exportCandles() {
    var p2 = function (v) { return (v < 10 ? "0" : "") + v; }, tf = S.sim.tf || 2;
    return "time,open,high,low,close,volume\n" + S.sim.c.map(function (x, i) { var m = 570 + i * tf; return p2(Math.floor(m / 60)) + ":" + p2(m % 60) + "," + [x.o, x.h, x.l, x.c, x.v].join(","); }).join("\n");
  }

  /* ---------------- UI ---------------- */
  var KINDS = [["normal", "Normal"], ["trigger", "Trigger"], ["doji", "Doji"], ["hammer", "Hammer"], ["inv", "Inverted hammer"], ["inside", "Inside bar"]];
  var SIGN = [["any", "Any candle"], ["hammer", "Hammer"], ["inv", "Inverted hammer"], ["doji", "Doji"], ["inside", "Inside bar"], ["trigger", "Trigger candle"], ["green", "Green candle"], ["red", "Red candle"]];
  function sel(id, v, opts) { return '<select data-r="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select>'; }
  function miniIcon(k, col) {
    var c = col === "g" ? "var(--gain)" : "var(--loss)", sh = { normal: [14, 8, 26, 8, 22, 34], trigger: [4, 4, 30, 4, 30, 36], doji: [2, 20, 22, 18, 20, 38], hammer: [10, 6, 18, 6, 18, 34], inv: [2, 8, 30, 8, 26, 36], inside: [8, 12, 26, 12, 24, 30] }[k];
    return '<svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true"><line x1="20" x2="20" y1="' + (k === "doji" ? 3 : sh[0] === 14 ? 4 : 3) + '" y2="37" stroke="' + c + '" stroke-width="2"/><rect x="14" y="' + { normal: 12, trigger: 6, doji: 19, hammer: 8, inv: 24, inside: 14 }[k] + '" width="12" height="' + { normal: 16, trigger: 26, doji: 2, hammer: 9, inv: 9, inside: 12 }[k] + '" fill="' + c + '" rx="1"/></svg>';
  }
  function simHtml() {
    var sm = S.sim, c = sm.c, sc = c[S.sel], R = S.rules;
    var h = '<div class="bt-bar"><label>Yesterday\'s close $<input id="bt-pc" inputmode="decimal" value="' + sm.pc + '" style="width:80px"></label>' +
      '<label>Gap %<input id="bt-gap" type="range" min="-30" max="60" step="0.5" value="' + sm.gap + '"><input id="bt-gapn" inputmode="decimal" value="' + sm.gap + '" style="width:64px"></label>' +
      '<span class="bt-hint">Opens at ' + f2(sm.pc * (1 + sm.gap / 100)) + '</span><span class="bt-sp"></span>' +
      '<label>Chart<select id="bt-tf">' + [1, 2, 5, 15].map(function (m) { return '<option value="' + m + '"' + ((sm.tf || 2) === m ? " selected" : "") + '>' + m + ' minute</option>'; }).join("") + '</select></label><button class="bt-b" data-a="example">Insert example setup</button><label>Candle size<select id="bt-size">' + [[0.004, "Small"], [0.008, "Medium"], [0.015, "Big"], [0.03, "Huge"]].map(function (o) { return '<option value="' + o[0] + '"' + (sm.size === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select></label></div>';
    h += '<div class="bt-bar bt-pal"><span class="bt-lbl">Add a candle</span>' + KINDS.map(function (k) { return '<button class="bt-cb' + (S.kind === k[0] ? " on" : "") + '" data-add="' + k[0] + '">' + miniIcon(k[0], S.col) + '<span>' + k[1] + '</span></button>'; }).join("") +
      '<span class="bt-seg"><button data-col="g" class="' + (S.col === "g" ? "on g" : "") + '">Green</button><button data-col="r" class="' + (S.col === "r" ? "on r" : "") + '">Red</button></span>' +
      '<span class="bt-lbl">Volume</span><span class="bt-seg">' + ["Low", "Normal", "High", "Huge"].map(function (n, i) { return '<button data-vol="' + i + '" class="' + (S.vol === i ? "on" : "") + '">' + n + '</button>'; }).join("") + '</span></div>';
    h += '<div class="bt-bar"><button class="bt-b" data-a="rand5">+5 random</button><button class="bt-b" data-a="rand20">+20 random</button><label>Drift<select id="bt-drift"><option value="1"' + (S.drift === 1 ? " selected" : "") + '>Up</option><option value="0"' + (S.drift === 0 ? " selected" : "") + '>Flat</option><option value="-1"' + (S.drift === -1 ? " selected" : "") + '>Down</option></select></label><span class="bt-sp"></span>' +
      '<button class="bt-b' + (S.edit === "vw" ? " on" : "") + '" data-edit="vw">Drag VWAP</button><button class="bt-b' + (S.edit === "em" ? " on" : "") + '" data-edit="em">Drag 9 EMA</button><button class="bt-b" data-a="resetlines">Reset lines</button>' +
      '<span class="bt-sp"></span><button class="bt-b" data-a="undo">Undo last</button><button class="bt-b" data-a="del"' + (sc ? "" : " disabled") + '>Delete selected</button><button class="bt-b" data-a="clear">Clear chart</button></div>';
    h += '<div class="bt-hint2">' + (S.edit ? 'Drag the dots on the ' + (S.edit === "vw" ? "VWAP" : "9 EMA") + ' line up or down. Press the button again to go back to candles.' : sc ? 'Candle ' + (S.sel + 1) + ' selected. Drag its dots to move the high, open, close and low. Drag the bar under the chart to change its volume.' : 'Click a candle to select it, then drag its dots.') + '</div>';
    if (Object.keys(sm.vw).length || Object.keys(sm.em).length) h += '<div class="bt-note">You dragged the VWAP or 9 EMA line, so the backtest uses your dragged line. The bot code always uses the real VWAP and 9 EMA. Press "Reset lines" to go back.</div>';
    h += '<div id="bt-chart" class="bt-chart"></div>';
    // scenes
    h += '<div class="bt-bar"><input id="bt-sn" placeholder="Name this chart (e.g. Gap up hammer)" style="width:240px"><button class="bt-b" data-a="savescene"' + (c.length ? "" : " disabled") + '>Save chart as a scene</button><span class="bt-hint">Save a few different scenes. The backtest runs on all of them.</span></div>';
    if (S.scenes.length) h += '<div class="bt-sc">' + S.scenes.map(function (x, i) { return '<span class="bt-chip"><button data-ls="' + i + '" title="Load into the chart">' + esc(x.name) + ' <small>' + x.c.length + ' candles</small></button><button data-ds="' + i + '" title="Delete">&times;</button></span>'; }).join("") + '</div>';
    // rules
    h += '<h3 class="bt-h">Strategy rules <small>every setting from your SL-1-RV code. Defaults are your v46 short.</small></h3>' + rulesHtml();
    h += '<div class="bt-bar"><button class="bt-b on" data-a="run">Run backtest</button><button class="bt-b" data-a="code">Build bot code</button><button class="bt-b" data-a="resetrules">Reset rules to my v46 defaults</button><span class="bt-hint">The chart marks each HIGH, trigger (TRG), entry, stop and targets.</span></div>';
    if (S.res) {
      var r = S.res;
      h += '<div class="bt-tiles">' + tile(r.n, "Trades (" + r.scenes + (r.scenes === 1 ? " chart" : " charts") + ")") + tile(Math.round(r.wr * 100) + "%", "Win rate", "", "<b>Win rate</b> is the share of trades that made money.") + tile(r.pf === Infinity ? "n/a" : f2(r.pf), "Profit factor", "", "<b>Profit factor</b> is dollars won divided by dollars lost. Above 1 is profitable.") + tile(sgn(r.net), "Net P/L", r.net >= 0 ? "gain" : "loss") + tile(rr(r.sumR), "Total R", r.sumR >= 0 ? "gain" : "loss", "R here is profit divided by your risk per trade (" + money(S.rules.riskDollars) + ").") + tile(rr(r.exp), "Avg per trade", r.exp >= 0 ? "gain" : "loss", "<b>Expectancy.</b> Average R each trade makes. Positive means an edge.") + '</div>';
      if (r.fun) h += '<div class="bt-note">Where setups drop out (current chart): shape ' + r.fun.shape + ' &rarr; after a HIGH ' + r.fun.afterHigh + ' &rarr; broke its low ' + r.fun.broke + ' &rarr; green seen ' + r.fun.green + ' &rarr; VWAP ' + r.fun.vwap + ' &rarr; other filters ' + r.fun.other + ' &rarr; time and gap ' + r.fun.time + ' &rarr; trades ' + r.all.filter(function (t) { return t.scene === "Current chart"; }).length + '</div>';
      if (!r.all.length) h += '<p class="hint">No trades on these charts. Try "Insert example setup", or loosen a rule (the drop-out line above shows which rule stops it).</p>';
      else h += '<div class="bt-tw"><table class="bt-t"><thead><tr><th>Chart</th><th>Side</th><th>Entry bar</th><th>Entry</th><th>Exit</th><th>Shares</th><th>P/L</th><th>R</th><th>How it ended</th></tr></thead><tbody>' + r.all.slice(0, 120).map(function (t) { return '<tr><td>' + esc(t.scene) + '</td><td>' + (t.dir > 0 ? "Long" : "Short") + '</td><td>' + (t.ei + 1) + '</td><td>' + f2(t.entry) + '</td><td>' + (t.open ? "-" : f2(t.exit)) + '</td><td>' + t.shares + '</td><td class="' + (t.pnl >= 0 ? "gain" : "loss") + '">' + sgn(t.pnl) + '</td><td>' + rr(t.R) + '</td><td>' + t.why + (t.parts.length ? " (" + t.parts.join(", ") + " filled)" : "") + '</td></tr>'; }).join("") + '</tbody></table></div>';
    }
    return h;
  }
  var GROUPS = [
    ["1. The HIGH candle", "A candle becomes the HIGH only when the very next candle trades below its low without going above its high. If any later candle trades above the HIGH candle, the setup is thrown out and the search starts over. Then a candle must break the HIGH candle's low for the setup to play out.", [
      ["swingBars", "HIGH must be the highest of the last N candles (0 = off)", "n"], ["requireHOD", "Must also be a new high of the day", "b"],
      ["requireBreak", "A later candle must trade below the HIGH candle's low", "b"], ["cancelOnHigherHigh", "Cancel if a candle goes above the highest high since the break (after a green)", "b"], ["maxSetupBars", "Setup expires N candles after the HIGH", "n"]]],
    ["2. What must happen after the break", "", [
      ["needGreen", "A green candle must print after the HIGH (the trigger can be that green; a flat doji counts)", "b"], ["breakGreenCounts", "A green candle right after the HIGH counts as the green", "b"], ["noGreenNewLow", "A green candle that makes the new low can never be the trigger", "b"],
      ["maxDrops", "Skip if more than N candles made a lower low before the trigger (0 = off)", "n"], ["maxBounceHH", "Max higher highs in the bounce, trigger included (0 = off)", "n"], ["minBouncePct", "Trigger must bounce at least this % of the drop from the HIGH (0 = off)", "n"]]],
    ["3. Signal candles (the trigger)", "Tick every shape that is allowed to be the trigger. Any color.", [
      ["shape:inv", "Inverted hammer", "b"], ["shape:inside", "Inside bar", "b"], ["shape:doji", "Doji (tiny body)", "b"], ["shape:spin", "Spinning top (small body, both wicks bigger than the body)", "b"], ["shape:wick", "Top wick at least as big as the body (body 60% or less)", "b"], ["shape:hammer", "Hammer (for longs)", "b"],
      ["maxBodyPct", "Small body means at most this % of the candle", "n"], ["insideMaxBodyPct", "Inside bar body at most this %", "n"], ["trigNotBelowPrev", "Trigger low can't be below the previous candle's low", "b"], ["trigBelowEMA", "Trigger must close below the 9 EMA", "b"], ["requireEMATouch", "Must touch the 9 EMA in the last 6 candles", "b"], ["minTrigATR", "Trigger at least this many average candles tall (0 = off)", "n"]]],
    ["4. VWAP, gap, time and limits", "", [
      ["vwapRule", "VWAP rule", "s", [["room", "VWAP in front of the trade with room"], ["above", "Trigger closes above VWAP"], ["below", "Trigger closes below VWAP"], ["any", "Ignore VWAP"]]], ["vwapRoomR", "Room needed (x the trigger candle size)", "n"],
      ["minGapPct", "Smallest gap up % from yesterday's close (0 = off)", "n"], ["minPrice", "Smallest price", "n"], ["startTime", "Fills allowed from (HHMM)", "n"], ["endTime", "...until (HHMM)", "n"],
      ["tradeShort", "Trade shorts", "b"], ["tradeLong", "Trade longs", "b"], ["waitAfter", "After a trade from a HIGH", "s", [["any", "No more trades from that HIGH"], ["loss", "Only block after a losing trade"], ["never", "No limit"]]], ["testMode", "Test mode: ignore VWAP, gap and price filters", "b"]]],
    ["5. Entry, stop, targets and size", "", [
      ["riskDollars", "Risk per trade ($)", "n"], ["entryOffset", "Entry offset (beyond the trigger)", "n"], ["slippage", "Slippage per side", "n"], ["minRiskPS", "Size as if the stop is at least this far (per share)", "n"],
      ["stopMode", "Stop", "s", [["beyond", "Beyond the trigger candle"], ["mid", "Middle of the trigger candle"]]], ["stopOffset", "Stop offset (beyond the trigger)", "n"], ["midStopOffset", "Extra beyond the middle (middle stop)", "n"],
      ["t1SellPct", "T1: % of shares sold", "n"], ["t1R", "T1 at (R from the trigger)", "n"], ["t2R", "T2 at (R)", "n"], ["useT3", "Use a third target", "b"], ["t2SellPct", "T2: % sold (when T3 is on, else takes the rest)", "n"], ["t3R", "T3 at (R)", "n"],
      ["midMoveR", "Stop to the trigger middle at this R (0 = off)", "n"], ["beMoveR", "Stop to breakeven at this R (0 = only at T1)", "n"], ["beLevel", "Breakeven means", "s", [["low", "The trigger candle's exact low/high"], ["entry", "Your entry price"]]]]]
  ];
  function ruleField(f) {
    var k = f[0], v = k.indexOf("shape:") === 0 ? S.rules.shapes[k.slice(6)] : S.rules[k], attr = k.indexOf("shape:") === 0 ? 'data-shape="' + k.slice(6) + '"' : 'data-r="' + k + '" data-t="' + f[2] + '"';
    if (f[2] === "b") return '<label class="bt-ck"><input type="checkbox" ' + attr + (v ? " checked" : "") + '><span>' + f[1] + '</span></label>';
    if (f[2] === "s") return '<div class="bt-rf"><label>' + f[1] + '</label><select ' + attr + '>' + f[3].map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select></div>';
    return '<div class="bt-rf"><label>' + f[1] + '</label><input ' + attr + ' inputmode="decimal" value="' + v + '"></div>';
  }
  function rulesHtml() {
    return GROUPS.map(function (g, gi) { return '<details class="bt-grp"' + (gi < 2 ? " open" : "") + '><summary>' + g[0] + '</summary>' + (g[1] ? '<p class="bt-gp">' + g[1] + '</p>' : "") + '<div class="bt-rules">' + g[2].map(ruleField).join("") + '</div></details>'; }).join("");
  }
  function codeHtml() {
    if (!S.code) S.code = botCode();
    return '<div class="bt-note">This Python file is built from your rules. It runs the same backtest on any candles.csv, and has a <b>live_signal</b> function ready to plug into a broker (use a paper account first). Change the rules on the Simulator tab, then press Build bot code again.</div>' +
      '<div class="bt-bar"><button class="bt-b on" data-a="copycode">Copy code</button><button class="bt-b" data-a="dlcode">Download bot.py</button><button class="bt-b" data-a="dlcandles">Download chart as candles.csv</button><button class="bt-b" data-a="rebuild">Rebuild from rules</button></div><pre class="bt-code" id="bt-code">' + esc(S.code) + '</pre>';
  }
  function head() {
    return '<div class="bt-top"><h1>Backtest Lab</h1><div class="bt-tabs">' + [["log", "1. Trade log"], ["sim", "2. Simulator (SL-1-RV)"], ["build", "3. Build a strategy"], ["code", "4. SL-1-RV bot code"]].map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (S.tab === t[0] ? "on" : "") + '">' + t[1] + '</button>'; }).join("") + '</div></div>';
  }
  function paint() { var ch = root.querySelector("#bt-chart"); if (ch) { host = ch; ch.innerHTML = chartSvg(); } }
  function render() {
    if (!root) return; var y = window.scrollY, ae = document.activeElement, aid = ae && (ae.id || ae.getAttribute("data-r") || ae.getAttribute("data-f")), pos = ae && ae.selectionStart;
    root.innerHTML = css() + head() + '<div class="bt-body">' + (S.tab === "log" ? logHtml() : S.tab === "sim" ? simHtml() : S.tab === "build" ? (window.BTBuilder ? window.BTBuilder.html() : "<p>Builder is loading...</p>") : codeHtml()) + '</div>';
    if (S.tab === "sim" || S.tab === "build") paint();
    if (aid) { var el = root.querySelector('[id="' + aid + '"],[data-r="' + aid + '"],[data-f="' + aid + '"]'); if (el && el.tagName === "INPUT" && el.type !== "checkbox" && el.type !== "range") { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) { } } }
    window.scrollTo(0, y);
  }
  function css() {
    return '<style>#btv.wrap{max-width:none;width:100%;box-sizing:border-box;padding:14px 20px 40px}#btv h1{font-size:1.4rem;margin:0}.bt-top{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-bottom:10px}.bt-tabs{display:flex;gap:6px;flex-wrap:wrap}.bt-tabs button{border:1px solid var(--line);background:var(--panel);color:var(--ink);padding:8px 14px;border-radius:999px;font:inherit;font-weight:800;font-size:.85rem;cursor:pointer}.bt-tabs button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}' +
      '#btv .bt-note{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--gain);border-radius:10px;padding:10px 14px;font-size:.88rem;margin:6px 0 12px;line-height:1.5}.bt-h{margin:16px 0 6px;font-size:1rem}.bt-h small{color:var(--mute);font-weight:500;font-size:.78rem;margin-left:6px}.hint,.bt-hint{color:var(--mute);font-size:.8rem}.bt-hint2{color:var(--mute);font-size:.82rem;margin:2px 0 6px}' +
      '.bt-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:8px 0}.bt-tile{position:relative;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px}.bt-tile b{display:block;font-size:1.35rem}.bt-tile span{font-size:.78rem;color:var(--mute)}' +
      '.bt-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.bt-bar label{display:flex!important;flex-direction:row!important;align-items:center;gap:6px;font-size:.82rem;font-weight:700;margin:0!important;width:auto!important}.bt-bar input[type=range]{width:150px!important;padding:0}.bt-bar input,.bt-bar select,.bt-rf input:not([type=checkbox]),.bt-rf select{padding:7px 9px;font:inherit;font-size:.85rem;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink);width:auto}.bt-sp{flex:1}.bt-lbl{font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--mute);margin-left:4px}' +
      '.bt-b{border:1px solid var(--line);background:var(--panel);color:var(--ink);padding:7px 13px;border-radius:9px;font:inherit;font-weight:700;font-size:.82rem;cursor:pointer}.bt-b.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}.bt-b:disabled{opacity:.4;cursor:default}' +
      '.bt-cb{display:flex;flex-direction:column;align-items:center;gap:1px;border:1px solid var(--line);background:var(--panel);color:var(--ink);padding:6px 12px;border-radius:12px;cursor:pointer;font:inherit;font-size:.74rem;font-weight:800;min-width:74px}.bt-cb:hover,.bt-cb.on{border-color:var(--ink)}.bt-cb:active{transform:scale(.96)}' +
      '.bt-seg{display:inline-flex;border:1px solid var(--line);border-radius:9px;overflow:hidden}.bt-seg button{border:0;background:var(--panel);color:var(--ink);padding:8px 11px;font:inherit;font-weight:800;font-size:.8rem;cursor:pointer}.bt-seg button.on{background:var(--ink);color:var(--bg)}.bt-seg button.on.g{background:var(--gain);color:#fff}.bt-seg button.on.r{background:var(--loss);color:#fff}' +
      '.bt-chart{border:1px solid var(--line);border-radius:12px;background:var(--panel);overflow:hidden;width:100%}.bt-chart svg{display:block}.bt-g{stroke:var(--line);stroke-dasharray:3 4}.bt-ax{fill:var(--mute);font-size:11px}.bt-pc{stroke:var(--mute);stroke-dasharray:6 4}.bt-pct{fill:var(--mute);font-size:11px;font-weight:700}.bt-vw{stroke:#d4a017;stroke-width:2}.bt-em{stroke:#2b7de0;stroke-width:2}.bt-lg{font-size:11px;font-weight:800}.bt-c{cursor:pointer}.bt-empty{fill:var(--mute);font-size:14px}' +
      '.bt-hd{fill:var(--panel);stroke:var(--ink);stroke-width:2;cursor:ns-resize}.bt-hv{fill:var(--ink);opacity:.7;cursor:ns-resize}.bt-hl{fill:var(--panel);stroke-width:2.5;cursor:ns-resize}.bt-hl.vw{stroke:#d4a017}.bt-hl.em{stroke:#2b7de0}.bt-stop{stroke:var(--loss);stroke-width:1.3}.bt-tgt{stroke:var(--gain);stroke-width:1.3}.bt-rt{font-size:12px;font-weight:800}' +
      '.bt-rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px}.bt-rf{display:flex;flex-direction:column;gap:4px}.bt-rf>label{font-size:.76rem;font-weight:800;color:var(--mute)}.bt-rf label.bt-chk{display:flex;flex-direction:row;align-items:center;gap:6px;font-size:.85rem;font-weight:700;color:var(--ink);margin:0;width:auto}.bt-rf input[type=checkbox]{width:18px;height:18px}' +
      '.bt-tw{overflow:auto;border:1px solid var(--line);border-radius:12px;background:var(--panel);margin:8px 0}.bt-t{width:100%;border-collapse:collapse;font-size:.84rem}.bt-t th,.bt-t td{text-align:left;padding:7px 11px;border-bottom:1px solid var(--line);white-space:nowrap}.bt-t th{font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--mute)}tr[data-strat]{cursor:pointer}tr[data-strat]:hover,tr[data-strat].on{background:rgba(127,127,127,.12)}.bt-x{border:0;background:none;color:var(--mute);font-size:1.1rem;cursor:pointer}' +
      '.bt-add{margin:12px 0;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 14px}.bt-add summary{cursor:pointer;font-weight:800;font-size:.88rem}.bt-sc{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px}.bt-chip{display:inline-flex;border:1px solid var(--line);border-radius:999px;background:var(--panel);overflow:hidden}.bt-chip button{border:0;background:none;color:var(--ink);padding:6px 10px;font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}.bt-chip small{color:var(--mute);font-weight:500}' +
      '.bt-grp{background:var(--panel);border:1px solid var(--line);border-radius:12px;margin:8px 0;padding:0 14px}.bt-grp>summary{cursor:pointer;font-weight:800;font-size:.92rem;padding:11px 0}.bt-gp{font-size:.82rem;color:var(--mute);margin:0 0 8px;line-height:1.5}.bt-grp .bt-rules{border:0;padding:0 0 12px;background:none}.bt-grp label.bt-ck{display:flex!important;flex-direction:row!important;align-items:center;gap:9px;font-size:.84rem;font-weight:600;line-height:1.3;cursor:pointer;margin:0!important;width:auto!important;color:var(--ink)}.bt-ck input{width:18px!important;height:18px;flex:none;margin:0}.bt-tag{font-size:10px;font-weight:800;fill:var(--mute)}.bt-tag.trg{fill:#ec4899}.bt-tag.hi{fill:var(--mute)}.bt-code{background:#0d1117;color:#e6edf3;border-radius:12px;padding:14px 16px;overflow:auto;font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;max-height:70vh;white-space:pre}</style>';
  }

  /* ---------------- events ---------------- */
  function bind() {
    if (window.BTBuilder) window.BTBuilder.bind(root);
    root.addEventListener("click", function (ev) {
      var t = ev.target, b;
      if ((b = t.closest("[data-tab]"))) { S.tab = b.getAttribute("data-tab"); if (S.tab === "code" && !S.code) S.code = botCode(); render(); window.scrollTo(0, 0); return; }
      if ((b = t.closest("[data-strat]"))) { var k = b.getAttribute("data-strat"); S.f.strat = S.f.strat === k ? "" : k; render(); return; }
      if ((b = t.closest("[data-del]"))) { S.manual.splice(+b.getAttribute("data-del"), 1); save(); render(); return; }
      if ((b = t.closest("[data-add]"))) { S.kind = b.getAttribute("data-add"); addCandle(S.kind, S.col); return; }
      if ((b = t.closest("[data-col]"))) { S.col = b.getAttribute("data-col"); render(); return; }
      if ((b = t.closest("[data-vol]"))) { S.vol = +b.getAttribute("data-vol"); var c = S.sim.c[S.sel]; if (c && S.edit === "") { c.v = Math.round(S.sim.vb * volMul()); S.res = null; save(); } render(); return; }
      if ((b = t.closest("[data-edit]"))) { var e = b.getAttribute("data-edit"); S.edit = S.edit === e ? "" : e; render(); return; }
      if ((b = t.closest("[data-ls]"))) { var sc = S.scenes[+b.getAttribute("data-ls")]; S.sim = { pc: sc.pc, gap: sc.gap, tf: sc.tf || 2, size: S.sim.size, vb: S.sim.vb, c: JSON.parse(JSON.stringify(sc.c)), vw: Object.assign({}, sc.vw), em: Object.assign({}, sc.em) }; S.sel = -1; S.res = null; save(); render(); return; }
      if ((b = t.closest("[data-ds]"))) { S.scenes.splice(+b.getAttribute("data-ds"), 1); save(); render(); return; }
      if ((b = t.closest("[data-a]"))) act(b.getAttribute("data-a"));
    });
    root.addEventListener("change", function (ev) {
      var t = ev.target, f = t.getAttribute("data-f"), r = t.getAttribute("data-r");
      if (f) { S.f[f] = t.value; render(); return; }
      if (t.getAttribute("data-shape")) { S.rules.shapes[t.getAttribute("data-shape")] = t.checked; S.res = null; S.code = ""; save(); return; }
      if (r) { var ty = t.getAttribute("data-t"), v = ty === "b" ? t.checked : ty === "n" ? parseFloat(t.value) : t.value; if (ty === "n") { if (isNaN(v) || v < 0) v = t.value.trim() === "" && DEFRULES[r] !== undefined && /\(0 =/.test((t.parentNode.querySelector("label") || {}).textContent || "") ? 0 : DEFRULES[r]; if (["t1R", "t2R", "t3R", "riskDollars"].indexOf(r) >= 0 && v <= 0) v = DEFRULES[r]; } S.rules[r] = v; S.res = null; S.code = ""; save(); if (ty === "n") t.value = v; return; }
      if (t.id === "bt-pc") { setPC(parseFloat(t.value)); return; }
      if (t.id === "bt-gapn") { setGap(parseFloat(t.value)); return; }
      if (t.id === "bt-gap") { setGap(parseFloat(t.value)); return; }
      if (t.id === "bt-size") { S.sim.size = parseFloat(t.value); save(); return; }
      if (t.id === "bt-tf") { S.sim.tf = parseInt(t.value, 10); S.res = null; save(); render(); return; }
      if (t.id === "bt-drift") { S.drift = parseInt(t.value, 10); return; }
    });
    root.addEventListener("input", function (ev) { var t = ev.target; if (t.getAttribute("data-t") === "n" && t.getAttribute("data-r")) { var nv = parseFloat(t.value); if (!isNaN(nv) && nv >= 0) { S.rules[t.getAttribute("data-r")] = nv; S.res = null; S.code = ""; save(); } } if (t.getAttribute("data-f") === "tk") { S.f.tk = t.value; render(); } if (t.id === "bt-gap") { var n = root.querySelector("#bt-gapn"); if (n) n.value = t.value; } });
    root.addEventListener("submit", function (ev) {
      if (ev.target.id !== "bt-addf") return; ev.preventDefault(); var fd = new FormData(ev.target), o = {}; fd.forEach(function (v, k) { o[k] = v; });
      var q = parseFloat(o.q), e = parseFloat(o.e), x = parseFloat(o.x); if (!(q > 0) || isNaN(e) || isNaN(x)) { toast("Check shares, entry and exit"); return; }
      var long = o.s === "Long"; S.manual.push({ d: o.d, t: String(o.t).toUpperCase(), s: o.s, q: q, e: e, x: x, p: r2((x - e) * q * (long ? 1 : -1)), u: o.u || "" }); save(); render(); toast("Trade added");
    });
    root.addEventListener("pointerdown", function (ev) { if (ev.target.closest && ev.target.closest("#bt-chart")) onDown(ev); });
    root.addEventListener("pointermove", onMove); root.addEventListener("pointerup", onUp); root.addEventListener("pointercancel", onUp);
    document.addEventListener("keydown", function (ev) { if (!root || root.hidden || S.tab !== "sim") return; if ((ev.key === "Delete" || ev.key === "Backspace") && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && S.sel >= 0) { ev.preventDefault(); act("del"); } });
  }
  function exampleSetup() {
    var raw = [[10.80, 10.95, 10.78, 10.92], [10.92, 11.15, 10.90, 11.10], [11.10, 11.45, 11.08, 11.40], [11.40, 11.90, 11.38, 11.85], [11.85, 12.35, 11.82, 12.30], [12.30, 12.70, 12.25, 12.62],
      [12.60, 12.66, 12.20, 12.26], [12.26, 12.30, 11.98, 12.00], [12.00, 12.04, 11.76, 11.78], [11.78, 12.10, 11.77, 12.04], [11.89, 12.05, 11.84, 11.86], [11.86, 11.87, 11.62, 11.65], [11.65, 11.68, 11.30, 11.36], [11.36, 11.40, 11.20, 11.25], [11.25, 11.30, 11.12, 11.18]];
    var vol = [6000, 1500, 900, 800, 700, 600, 500, 500, 400, 350, 300, 500, 600, 350, 300];
    if (S.sim.c.length && !window.confirm("Replace the chart with the example setup?")) return;
    S.sim = { pc: 10, gap: 8, tf: S.sim.tf || 2, size: S.sim.size, vb: 100000, c: raw.map(function (x, i) { return { o: x[0], h: x[1], l: x[2], c: x[3], v: vol[i] * 1000, k: "normal" }; }), vw: {}, em: {} };
    S.sel = -1; S.res = null; save(); render(); toast("Example loaded: HIGH is candle 6, break is 7, trigger is 11");
  }
  function act(a) {
    var sm = S.sim;
    if (a === "csv") download("trade-log.csv", csv(filt(logRows())), "text/csv");
    else if (a === "json") download("trade-log.json", JSON.stringify({ exported: new Date().toISOString(), trades: filt(logRows()), by_strategy: byStrat(filt(logRows())).map(function (s) { return { strategy: s.k, trades: s.n, win_rate: +s.wr.toFixed(3), profit_factor: s.pf === Infinity ? null : +s.pf.toFixed(2), avg_r: s.avgR == null ? null : +s.avgR.toFixed(2), net: +s.net.toFixed(2) }; }) }, null, 2), "application/json");
    else if (a === "rand5") addRandom(5); else if (a === "rand20") addRandom(20);
    else if (a === "undo") { sm.c.pop(); [sm.vw, sm.em].forEach(function (m) { delete m[sm.c.length]; }); S.sel = sm.c.length - 1; S.res = null; save(); render(); }
    else if (a === "del") { if (S.sel < 0) return; sm.c.splice(S.sel, 1); sm.vw = {}; sm.em = {}; S.sel = Math.min(S.sel, sm.c.length - 1); S.res = null; save(); render(); }
    else if (a === "clear") { if (sm.c.length && !window.confirm("Clear all candles on the chart?")) return; sm.c = []; sm.vw = {}; sm.em = {}; S.sel = -1; S.res = null; save(); render(); }
    else if (a === "resetlines") { sm.vw = {}; sm.em = {}; S.res = null; save(); render(); }
    else if (a === "savescene") { var n = (root.querySelector("#bt-sn").value || "").trim() || "Scene " + (S.scenes.length + 1); S.scenes.push({ name: n, pc: sm.pc, gap: sm.gap, tf: sm.tf || 2, c: JSON.parse(JSON.stringify(sm.c)), vw: Object.assign({}, sm.vw), em: Object.assign({}, sm.em) }); save(); render(); toast("Scene saved"); }
    else if (a === "resetrules") { S.rules = JSON.parse(JSON.stringify(DEFRULES)); S.res = null; S.code = ""; save(); render(); toast("Rules reset"); }
    else if (a === "example") { exampleSetup(); }
    else if (a === "run") { if (!sm.c.length && !S.scenes.length) { toast("Add some candles first"); return; } runAll(); }
    else if (a === "code") { runAll(); S.code = botCode(); S.tab = "code"; render(); window.scrollTo(0, 0); }
    else if (a === "rebuild") { S.code = botCode(); render(); }
    else if (a === "copycode") { try { navigator.clipboard.writeText(S.code).then(function () { toast("Code copied"); }, function () { toast("Could not copy"); }); } catch (e) { toast("Could not copy"); } }
    else if (a === "dlcode") download("bot.py", S.code, "text/x-python");
    else if (a === "dlcandles") download("candles.csv", exportCandles(), "text/csv");
  }

  function mount(el) { H = window.StockBT || H; root = el; if (!S.rules) load(); if (!root.__bt) { root.__bt = 1; bind(); } host = null; render(); }
  window.BacktestLab = { mount: mount, _x: { S: S, save: save, render: render, esc: esc, f2: f2, money: money, sgn: sgn, rr: rr, tile: tile, download: download, toast: toast, exportCandles: exportCandles, paint: paint },  _e: { backtest: backtest, analyze: analyze, DEF: DEFRULES, indOf: indOf } };
  load();
})();
