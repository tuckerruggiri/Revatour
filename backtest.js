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
  var DEFRULES = { side: "long", signal: "hammer", vwap: "above", ema: "any", minGap: 0, minVol: 0, entry: "break", stop: "sigLow", stopPct: 1, target: 2, trail: false };
  var S = { tab: "log", manual: [], scenes: [], rules: null, sim: null, sel: -1, edit: "", res: null, code: "", f: { strat: "", tk: "", side: "", per: "all" }, vol: 1, kind: "normal", col: "g", drift: 0 };
  function newSim() { return { pc: 10, gap: 8, size: 0.008, vb: 100000, c: [], vw: {}, em: {} }; }
  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || "{}"); S.manual = d.manual || []; S.scenes = d.scenes || []; S.rules = d.rules || null; S.sim = d.sim || null; S.rules = Object.assign({}, DEFRULES, S.rules || {}); if (!S.sim || !S.sim.c) S.sim = newSim(); } catch (e) { S.rules = Object.assign({}, DEFRULES); S.sim = newSim(); } }
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
    var sm = S.sim, c = sm.c, W = Math.max(520, (host && host.clientWidth) || 900), L = LAYOUT, Ht = L.top + L.ph + L.gap + L.vh + L.bot, ind = calc();
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
    if (S.res && S.res.cur) S.res.cur.forEach(function (t) {
      if (t.ei < st) return; var x1 = X(t.ei), x2 = X(t.xi), win = t.R > 0;
      s += '<line x1="' + x1 + '" x2="' + x2 + '" y1="' + Y(t.entry) + '" y2="' + Y(t.exit) + '" stroke="' + (win ? "var(--gain)" : "var(--loss)") + '" stroke-width="2" stroke-dasharray="4 3" pointer-events="none"/>' +
        '<line x1="' + x1 + '" x2="' + Math.max(x2, x1 + sw) + '" y1="' + Y(t.stop) + '" y2="' + Y(t.stop) + '" class="bt-stop" pointer-events="none"/><line x1="' + x1 + '" x2="' + Math.max(x2, x1 + sw) + '" y1="' + Y(t.tgt) + '" y2="' + Y(t.tgt) + '" class="bt-tgt" pointer-events="none"/>' +
        '<path d="M' + x1 + ' ' + (Y(t.entry) - 1) + 'l-6 11h12z" fill="' + (t.dir > 0 ? "var(--gain)" : "var(--loss)") + '" pointer-events="none" transform="' + (t.dir > 0 ? "" : "rotate(180 " + x1 + " " + (Y(t.entry) + 4) + ")") + '"/><circle cx="' + x2 + '" cy="' + Y(t.exit) + '" r="4.5" fill="' + (win ? "var(--gain)" : "var(--loss)") + '" stroke="var(--panel)" stroke-width="1.5" pointer-events="none"/>' +
        '<text x="' + (x2 + 7) + '" y="' + (Y(t.exit) - 6) + '" class="bt-rt ' + (win ? "gain" : "loss") + '" pointer-events="none">' + rr(t.R) + '</text>';
    });
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

  /* ---------------- strategy engine ---------------- */
  function shape(c, i, cs, k) {
    var rng = c.h - c.l, body = Math.abs(c.c - c.o), up = c.h - Math.max(c.o, c.c), lo = Math.min(c.o, c.c) - c.l;
    if (k === "any") return true; if (rng <= 0) return false;
    if (k === "doji") return body <= 0.1 * rng;
    if (k === "hammer") return lo >= 0.55 * rng && up <= 0.15 * rng;
    if (k === "inv") return up >= 0.55 * rng && lo <= 0.15 * rng;
    if (k === "inside") return i > 0 && c.h < cs[i - 1].h && c.l > cs[i - 1].l;
    if (k === "trigger") { var pr = cs.slice(Math.max(0, i - 5), i), ab = pr.length ? pr.reduce(function (a, x) { return a + Math.abs(x.c - x.o); }, 0) / pr.length : 0; return body >= 0.6 * rng && (!pr.length || body >= 1.3 * ab); }
    if (k === "green") return c.c > c.o; if (k === "red") return c.c < c.o;
    return true;
  }
  function backtest(sc, R, ind) {
    var cs = sc.c, out = [], n = cs.length, dir = R.side === "short" ? -1 : 1, gap = n ? (cs[0].o / sc.pc - 1) * 100 : 0;
    if (R.minGap > 0 && gap < R.minGap) return out;
    for (var s = 0; s < n - 1; s++) {
      var g = cs[s]; if (!shape(g, s, cs, R.signal)) continue;
      if (R.vwap === "above" && !(g.c > ind.vw[s])) continue; if (R.vwap === "below" && !(g.c < ind.vw[s])) continue;
      if (R.ema === "above" && !(g.c > ind.em[s])) continue; if (R.ema === "below" && !(g.c < ind.em[s])) continue;
      if (R.minVol > 0) { var pr = cs.slice(Math.max(0, s - 5), s); if (pr.length) { var av = pr.reduce(function (a, x) { return a + x.v; }, 0) / pr.length; if (g.v < R.minVol * av) continue; } }
      var entry, j = s + 1;
      if (R.entry === "close") entry = g.c;
      else { var nx = cs[j]; if (dir > 0 ? nx.h < g.h : nx.l > g.l) continue; entry = dir > 0 ? Math.max(g.h, nx.o) : Math.min(g.l, nx.o); }
      var stop;
      if (R.stop === "sigLow") stop = dir > 0 ? g.l - 0.01 : g.h + 0.01; else stop = entry * (1 - dir * R.stopPct / 100);
      var risk = (entry - stop) * dir; if (!(risk > 0)) continue;
      var tgt = entry + dir * R.target * risk, xi = n - 1, exit = cs[n - 1].c, why = "end";
      for (var k = j; k < n; k++) {
        var c = cs[k];
        if (dir > 0 ? c.l <= stop : c.h >= stop) { xi = k; exit = dir > 0 ? Math.min(stop, c.o) : Math.max(stop, c.o); why = "stop"; break; }
        if (dir > 0 ? c.h >= tgt : c.l <= tgt) { xi = k; exit = tgt; why = "target"; break; }
        if (R.trail && (dir > 0 ? c.c < ind.em[k] : c.c > ind.em[k]) && k > j) { xi = k; exit = c.c; why = "9 EMA"; break; }
      }
      out.push({ si: s, ei: j, xi: xi, entry: r2(entry), exit: r2(exit), stop: r2(stop), tgt: r2(tgt), dir: dir, R: (exit - entry) * dir / risk, why: why });
      s = xi;
    }
    return out;
  }
  function indOf(sc) {
    var c = sc.c, vw = [], em = [], pv = 0, cv = 0, e = 0;
    c.forEach(function (x, i) { var tp = (x.h + x.l + x.c) / 3; pv += tp * x.v; cv += x.v; vw[i] = cv ? pv / cv : x.c; e = i ? e + 0.2 * (x.c - e) : x.c; em[i] = e; });
    for (var k in (sc.vw || {})) if (sc.vw[k] != null && vw[k] != null) vw[k] = sc.vw[k]; for (k in (sc.em || {})) if (sc.em[k] != null && em[k] != null) em[k] = sc.em[k];
    return { vw: vw, em: em };
  }
  function runAll() {
    var R = S.rules, scenes = [{ name: "Current chart", pc: S.sim.pc, c: S.sim.c, vw: S.sim.vw, em: S.sim.em }].concat(S.scenes.map(function (x) { return x; })), all = [], cur = null;
    scenes.forEach(function (sc, i) { var t = backtest(sc, R, indOf(sc)); if (i === 0) cur = t; t.forEach(function (x) { x.scene = sc.name; all.push(x); }); });
    var w = all.filter(function (t) { return t.R > 0; }), gw = w.reduce(function (a, t) { return a + t.R; }, 0), gl = all.filter(function (t) { return t.R <= 0; }).reduce(function (a, t) { return a - t.R; }, 0), sum = all.reduce(function (a, t) { return a + t.R; }, 0);
    S.res = { all: all, cur: cur, n: all.length, wr: all.length ? w.length / all.length : 0, pf: gl > 0 ? gw / gl : (gw > 0 ? Infinity : 0), sumR: sum, exp: all.length ? sum / all.length : 0, scenes: scenes.length };
    S.code = ""; render();
  }

  /* ---------------- bot code ---------------- */
  function botCode() {
    var R = S.rules, nm = (R.signal === "any" ? "any candle" : { doji: "doji", hammer: "hammer", inv: "inverted hammer", inside: "inside bar", trigger: "trigger candle", green: "green candle", red: "red candle" }[R.signal]);
    var spec = { name: R.side + " " + nm, side: R.side, signal: { doji: "doji", hammer: "hammer", inv: "inverted_hammer", inside: "inside_bar", trigger: "trigger", green: "green", red: "red", any: "any" }[R.signal], vwap: R.vwap, ema9: R.ema, min_gap_pct: +R.minGap, min_volume_x: +R.minVol, entry: R.entry === "break" ? "break_of_signal" : "signal_close", stop: R.stop === "sigLow" ? "signal_extreme" : "percent", stop_pct: +R.stopPct, target_r: +R.target, exit_on_9ema: !!R.trail };
    var lg = ""; try { var ls = byStrat(logRows()); if (ls.length) lg = "\n# Your logged results by strategy (from the Trade log):\n" + ls.slice(0, 8).map(function (s) { return "#   " + s.k + ": " + s.n + " trades, " + Math.round(s.wr * 100) + "% wins, avg " + rr(s.avgR); }).join("\n") + "\n"; } catch (e) { }
    var res = S.res ? "# Backtest in the simulator: " + S.res.n + " trades, " + Math.round(S.res.wr * 100) + "% wins, total " + rr(S.res.sumR) + ", avg " + rr(S.res.exp) + " per trade.\n" : "";
    return '"""\nBot strategy: ' + spec.name + '\nBuilt in the Revatour Backtest Lab on ' + new Date().toISOString().slice(0, 10) + '.\n' + res + lg.replace(/^\n/, "") + '\nHow to use (Windows):\n  1. Install Python from python.org (tick "Add Python to PATH").\n  2. Open Command Prompt and run:  pip install pandas\n  3. Save your candles as candles.csv with columns: time,open,high,low,close,volume\n  4. Set PREV_CLOSE below to yesterday\'s close, then run:  python bot.py\n"""\nimport json\nimport pandas as pd\n\nRULES = json.loads(r\'\'\'' + JSON.stringify(spec, null, 2) + '\'\'\')\nPREV_CLOSE = ' + f2(S.sim.pc) + '   # yesterday\'s close, used for the gap\nRISK_DOLLARS = ' + (H.r1For ? Math.round(H.r1For(new Date().toISOString().slice(0, 10)) || 100) : 100) + '   # your 1R in dollars\nTICK = 0.01\n\n\ndef add_indicators(df):\n    df = df.copy()\n    tp = (df.high + df.low + df.close) / 3\n    df["vwap"] = (tp * df.volume).cumsum() / df.volume.cumsum()\n    df["ema9"] = df.close.ewm(span=9, adjust=False).mean()\n    return df\n\n\ndef is_signal(df, i):\n    row = df.iloc[i]\n    rng = row.high - row.low\n    body = abs(row.close - row.open)\n    upper = row.high - max(row.open, row.close)\n    lower = min(row.open, row.close) - row.low\n    k = RULES["signal"]\n    if k != "any" and rng <= 0:\n        return False\n    if k == "doji":\n        ok = body <= 0.1 * rng\n    elif k == "hammer":\n        ok = lower >= 0.55 * rng and upper <= 0.15 * rng\n    elif k == "inverted_hammer":\n        ok = upper >= 0.55 * rng and lower <= 0.15 * rng\n    elif k == "inside_bar":\n        ok = i > 0 and row.high < df.high.iloc[i - 1] and row.low > df.low.iloc[i - 1]\n    elif k == "trigger":\n        prior = df.iloc[max(0, i - 5):i]\n        avg_body = (prior.close - prior.open).abs().mean() if len(prior) else 0\n        ok = body >= 0.6 * rng and (len(prior) == 0 or body >= 1.3 * avg_body)\n    elif k == "green":\n        ok = row.close > row.open\n    elif k == "red":\n        ok = row.close < row.open\n    else:\n        ok = True\n    if not ok:\n        return False\n    if RULES["vwap"] == "above" and not row.close > row.vwap:\n        return False\n    if RULES["vwap"] == "below" and not row.close < row.vwap:\n        return False\n    if RULES["ema9"] == "above" and not row.close > row.ema9:\n        return False\n    if RULES["ema9"] == "below" and not row.close < row.ema9:\n        return False\n    if RULES["min_volume_x"] > 0:\n        prior = df.iloc[max(0, i - 5):i]\n        if len(prior) and row.volume < RULES["min_volume_x"] * prior.volume.mean():\n            return False\n    return True\n\n\ndef plan_trade(df, i, entry_price):\n    """Stop and target for a signal on bar i, given the entry price."""\n    d = 1 if RULES["side"] == "long" else -1\n    sig = df.iloc[i]\n    if RULES["stop"] == "signal_extreme":\n        stop = sig.low - TICK if d > 0 else sig.high + TICK\n    else:\n        stop = entry_price * (1 - d * RULES["stop_pct"] / 100)\n    risk = (entry_price - stop) * d\n    if risk <= 0:\n        return None\n    target = entry_price + d * RULES["target_r"] * risk\n    return {"stop": stop, "target": target, "risk": risk, "shares": int(RISK_DOLLARS / risk)}\n\n\ndef backtest(df):\n    df = add_indicators(df).reset_index(drop=True)\n    d = 1 if RULES["side"] == "long" else -1\n    gap = (df.open.iloc[0] / PREV_CLOSE - 1) * 100\n    trades = []\n    if RULES["min_gap_pct"] > 0 and gap < RULES["min_gap_pct"]:\n        return trades\n    s = 0\n    while s < len(df) - 1:\n        if not is_signal(df, s):\n            s += 1\n            continue\n        sig, nxt = df.iloc[s], df.iloc[s + 1]\n        if RULES["entry"] == "signal_close":\n            entry = sig.close\n        else:\n            if (d > 0 and nxt.high < sig.high) or (d < 0 and nxt.low > sig.low):\n                s += 1\n                continue\n            entry = max(sig.high, nxt.open) if d > 0 else min(sig.low, nxt.open)\n        plan = plan_trade(df, s, entry)\n        if plan is None:\n            s += 1\n            continue\n        exit_i, exit_price, why = len(df) - 1, df.close.iloc[-1], "end"\n        for k in range(s + 1, len(df)):\n            bar = df.iloc[k]\n            if (d > 0 and bar.low <= plan["stop"]) or (d < 0 and bar.high >= plan["stop"]):\n                exit_i, why = k, "stop"\n                exit_price = min(plan["stop"], bar.open) if d > 0 else max(plan["stop"], bar.open)\n                break\n            if (d > 0 and bar.high >= plan["target"]) or (d < 0 and bar.low <= plan["target"]):\n                exit_i, exit_price, why = k, plan["target"], "target"\n                break\n            if RULES["exit_on_9ema"] and k > s + 1 and ((d > 0 and bar.close < bar.ema9) or (d < 0 and bar.close > bar.ema9)):\n                exit_i, exit_price, why = k, bar.close, "9 EMA"\n                break\n        r = (exit_price - entry) * d / plan["risk"]\n        trades.append({"signal_bar": int(s), "entry": round(float(entry), 2), "exit": round(float(exit_price), 2), "exit_bar": int(exit_i), "r": round(float(r), 2), "why": why})\n        s = exit_i + 1\n    return trades\n\n\ndef live_signal(df):\n    """Call this on each new closed candle. Returns the plan when the last bar is a signal, else None."""\n    df = add_indicators(df).reset_index(drop=True)\n    i = len(df) - 1\n    if i < 0 or not is_signal(df, i):\n        return None\n    d = 1 if RULES["side"] == "long" else -1\n    sig = df.iloc[i]\n    entry = sig.close if RULES["entry"] == "signal_close" else (sig.high if d > 0 else sig.low)\n    plan = plan_trade(df, i, entry)\n    if plan:\n        plan.update({"entry": entry, "side": RULES["side"]})\n    return plan\n    # To trade it, send an order with your broker here. Start on a PAPER account.\n    # Example idea (Alpaca paper): TradingClient(KEY, SECRET, paper=True).submit_order(...)\n\n\nif __name__ == "__main__":\n    data = pd.read_csv("candles.csv")\n    result = backtest(data)\n    wins = [t for t in result if t["r"] > 0]\n    print(len(result), "trades,", f"{(len(wins) / len(result) * 100 if result else 0):.0f}% wins, total R:", round(sum(t["r"] for t in result), 2))\n    for t in result:\n        print(t)\n';
  }
  function exportCandles() {
    var p2 = function (v) { return (v < 10 ? "0" : "") + v; };
    return "time,open,high,low,close,volume\n" + S.sim.c.map(function (x, i) { var m = 570 + i; return p2(Math.floor(m / 60)) + ":" + p2(m % 60) + "," + [x.o, x.h, x.l, x.c, x.v].join(","); }).join("\n");
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
      '<label>Candle size<select id="bt-size">' + [[0.004, "Small"], [0.008, "Medium"], [0.015, "Big"], [0.03, "Huge"]].map(function (o) { return '<option value="' + o[0] + '"' + (sm.size === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select></label></div>';
    h += '<div class="bt-bar bt-pal"><span class="bt-lbl">Add a candle</span>' + KINDS.map(function (k) { return '<button class="bt-cb' + (S.kind === k[0] ? " on" : "") + '" data-add="' + k[0] + '">' + miniIcon(k[0], S.col) + '<span>' + k[1] + '</span></button>'; }).join("") +
      '<span class="bt-seg"><button data-col="g" class="' + (S.col === "g" ? "on g" : "") + '">Green</button><button data-col="r" class="' + (S.col === "r" ? "on r" : "") + '">Red</button></span>' +
      '<span class="bt-lbl">Volume</span><span class="bt-seg">' + ["Low", "Normal", "High", "Huge"].map(function (n, i) { return '<button data-vol="' + i + '" class="' + (S.vol === i ? "on" : "") + '">' + n + '</button>'; }).join("") + '</span></div>';
    h += '<div class="bt-bar"><button class="bt-b" data-a="rand5">+5 random</button><button class="bt-b" data-a="rand20">+20 random</button><label>Drift<select id="bt-drift"><option value="1"' + (S.drift === 1 ? " selected" : "") + '>Up</option><option value="0"' + (S.drift === 0 ? " selected" : "") + '>Flat</option><option value="-1"' + (S.drift === -1 ? " selected" : "") + '>Down</option></select></label><span class="bt-sp"></span>' +
      '<button class="bt-b' + (S.edit === "vw" ? " on" : "") + '" data-edit="vw">Drag VWAP</button><button class="bt-b' + (S.edit === "em" ? " on" : "") + '" data-edit="em">Drag 9 EMA</button><button class="bt-b" data-a="resetlines">Reset lines</button>' +
      '<span class="bt-sp"></span><button class="bt-b" data-a="undo">Undo last</button><button class="bt-b" data-a="del"' + (sc ? "" : " disabled") + '>Delete selected</button><button class="bt-b" data-a="clear">Clear chart</button></div>';
    h += '<div class="bt-hint2">' + (S.edit ? 'Drag the dots on the ' + (S.edit === "vw" ? "VWAP" : "9 EMA") + ' line up or down. Press the button again to go back to candles.' : sc ? 'Candle ' + (S.sel + 1) + ' selected. Drag its dots to move the high, open, close and low. Drag the bar under the chart to change its volume.' : 'Click a candle to select it, then drag its dots.') + '</div>';
    h += '<div id="bt-chart" class="bt-chart"></div>';
    // scenes
    h += '<div class="bt-bar"><input id="bt-sn" placeholder="Name this chart (e.g. Gap up hammer)" style="width:240px"><button class="bt-b" data-a="savescene"' + (c.length ? "" : " disabled") + '>Save chart as a scene</button><span class="bt-hint">Save a few different scenes. The backtest runs on all of them.</span></div>';
    if (S.scenes.length) h += '<div class="bt-sc">' + S.scenes.map(function (x, i) { return '<span class="bt-chip"><button data-ls="' + i + '" title="Load into the chart">' + esc(x.name) + ' <small>' + x.c.length + ' candles</small></button><button data-ds="' + i + '" title="Delete">&times;</button></span>'; }).join("") + '</div>';
    // rules
    h += '<h3 class="bt-h">Strategy rules <small>pick from the lists, no code</small></h3><div class="bt-rules">' +
      rf("Trade direction", sel("side", R.side, [["long", "Long (buy)"], ["short", "Short (sell)"]])) + rf("Signal candle", sel("signal", R.signal, SIGN)) +
      rf("Signal closes vs VWAP", sel("vwap", R.vwap, [["any", "Don't care"], ["above", "Above VWAP"], ["below", "Below VWAP"]])) + rf("Signal closes vs 9 EMA", sel("ema", R.ema, [["any", "Don't care"], ["above", "Above 9 EMA"], ["below", "Below 9 EMA"]])) +
      rf("Smallest gap % to trade", '<input data-r="minGap" inputmode="decimal" value="' + R.minGap + '">') + rf("Signal volume at least (x avg of last 5)", '<input data-r="minVol" inputmode="decimal" value="' + R.minVol + '">') +
      rf("Enter", sel("entry", R.entry, [["break", "When price breaks the signal candle"], ["close", "At the signal candle close"]])) + rf("Stop loss", sel("stop", R.stop, [["sigLow", "Other end of the signal candle"], ["pct", "Fixed % from entry"]])) +
      (R.stop === "pct" ? rf("Stop %", '<input data-r="stopPct" inputmode="decimal" value="' + R.stopPct + '">') : "") + rf("Profit target (R)", '<input data-r="target" inputmode="decimal" value="' + R.target + '">') +
      rf("Also exit when a candle closes past the 9 EMA", '<label class="bt-chk"><input type="checkbox" data-r="trail"' + (R.trail ? " checked" : "") + '> Yes</label>') + '</div>';
    h += '<div class="bt-bar"><button class="bt-b on" data-a="run">Run backtest</button><button class="bt-b" data-a="code">Build bot code</button><span class="bt-hint">1 R = the distance from your entry to your stop.</span></div>';
    if (S.res) {
      var r = S.res;
      h += '<div class="bt-tiles">' + tile(r.n, "Trades (" + r.scenes + (r.scenes === 1 ? " chart" : " charts") + ")") + tile(Math.round(r.wr * 100) + "%", "Win rate", "", "<b>Win rate</b> is the share of trades that made money.") + tile(r.pf === Infinity ? "n/a" : f2(r.pf), "Profit factor", "", "<b>Profit factor</b> is R won divided by R lost. Above 1 is profitable.") + tile(rr(r.sumR), "Total R", r.sumR >= 0 ? "gain" : "loss") + tile(rr(r.exp), "Avg per trade", r.exp >= 0 ? "gain" : "loss", "<b>Expectancy.</b> Average R each trade makes. Positive means an edge.") + '</div>';
      if (!r.n) h += '<p class="hint">No trades matched these rules on your chart. Try adding the signal candle you picked, or loosen a rule.</p>';
      else h += '<div class="bt-tw"><table class="bt-t"><thead><tr><th>Chart</th><th>Entry bar</th><th>Entry</th><th>Exit</th><th>Why</th><th>R</th></tr></thead><tbody>' + r.all.slice(0, 80).map(function (t) { return '<tr><td>' + esc(t.scene) + '</td><td>' + (t.ei + 1) + '</td><td>' + f2(t.entry) + '</td><td>' + f2(t.exit) + '</td><td>' + t.why + '</td><td class="' + (t.R > 0 ? "gain" : "loss") + '">' + rr(t.R) + '</td></tr>'; }).join("") + '</tbody></table></div>';
    }
    return h;
  }
  function rf(l, ctl) { return '<div class="bt-rf"><label>' + l + '</label>' + ctl + '</div>'; }
  function codeHtml() {
    if (!S.code) S.code = botCode();
    return '<div class="bt-note">This Python file is built from your rules. It runs the same backtest on any candles.csv, and has a <b>live_signal</b> function ready to plug into a broker (use a paper account first). Change the rules on the Simulator tab, then press Build bot code again.</div>' +
      '<div class="bt-bar"><button class="bt-b on" data-a="copycode">Copy code</button><button class="bt-b" data-a="dlcode">Download bot.py</button><button class="bt-b" data-a="dlcandles">Download chart as candles.csv</button><button class="bt-b" data-a="rebuild">Rebuild from rules</button></div><pre class="bt-code" id="bt-code">' + esc(S.code) + '</pre>';
  }
  function head() {
    return '<div class="bt-top"><h1>Backtest Lab</h1><div class="bt-tabs">' + [["log", "1. Trade log"], ["sim", "2. Simulator and strategy"], ["code", "3. Bot code"]].map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (S.tab === t[0] ? "on" : "") + '">' + t[1] + '</button>'; }).join("") + '</div></div>';
  }
  function paint() { var ch = root.querySelector("#bt-chart"); if (ch) { host = ch; ch.innerHTML = chartSvg(); } }
  function render() {
    if (!root) return; var y = window.scrollY, ae = document.activeElement, aid = ae && (ae.id || ae.getAttribute("data-r") || ae.getAttribute("data-f")), pos = ae && ae.selectionStart;
    root.innerHTML = css() + head() + '<div class="bt-body">' + (S.tab === "log" ? logHtml() : S.tab === "sim" ? simHtml() : codeHtml()) + '</div>';
    if (S.tab === "sim") paint();
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
      '.bt-code{background:#0d1117;color:#e6edf3;border-radius:12px;padding:14px 16px;overflow:auto;font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;max-height:70vh;white-space:pre}</style>';
  }

  /* ---------------- events ---------------- */
  function bind() {
    root.addEventListener("click", function (ev) {
      var t = ev.target, b;
      if ((b = t.closest("[data-tab]"))) { S.tab = b.getAttribute("data-tab"); if (S.tab === "code" && !S.code) S.code = botCode(); render(); window.scrollTo(0, 0); return; }
      if ((b = t.closest("[data-strat]"))) { var k = b.getAttribute("data-strat"); S.f.strat = S.f.strat === k ? "" : k; render(); return; }
      if ((b = t.closest("[data-del]"))) { S.manual.splice(+b.getAttribute("data-del"), 1); save(); render(); return; }
      if ((b = t.closest("[data-add]"))) { S.kind = b.getAttribute("data-add"); addCandle(S.kind, S.col); return; }
      if ((b = t.closest("[data-col]"))) { S.col = b.getAttribute("data-col"); render(); return; }
      if ((b = t.closest("[data-vol]"))) { S.vol = +b.getAttribute("data-vol"); var c = S.sim.c[S.sel]; if (c && S.edit === "") { c.v = Math.round(S.sim.vb * volMul()); S.res = null; save(); } render(); return; }
      if ((b = t.closest("[data-edit]"))) { var e = b.getAttribute("data-edit"); S.edit = S.edit === e ? "" : e; render(); return; }
      if ((b = t.closest("[data-ls]"))) { var sc = S.scenes[+b.getAttribute("data-ls")]; S.sim = { pc: sc.pc, gap: sc.gap, size: S.sim.size, vb: S.sim.vb, c: JSON.parse(JSON.stringify(sc.c)), vw: Object.assign({}, sc.vw), em: Object.assign({}, sc.em) }; S.sel = -1; S.res = null; save(); render(); return; }
      if ((b = t.closest("[data-ds]"))) { S.scenes.splice(+b.getAttribute("data-ds"), 1); save(); render(); return; }
      if ((b = t.closest("[data-a]"))) act(b.getAttribute("data-a"));
    });
    root.addEventListener("change", function (ev) {
      var t = ev.target, f = t.getAttribute("data-f"), r = t.getAttribute("data-r");
      if (f) { S.f[f] = t.value; render(); return; }
      if (r) { var v = t.type === "checkbox" ? t.checked : t.value; if (["minGap", "minVol", "stopPct", "target"].indexOf(r) >= 0) { v = parseFloat(v); if (isNaN(v) || v < 0) v = 0; if (r === "target" && v <= 0) v = 1; if (r === "stopPct" && v <= 0) v = 1; } S.rules[r] = v; S.res = null; S.code = ""; save(); render(); return; }
      if (t.id === "bt-pc") { setPC(parseFloat(t.value)); return; }
      if (t.id === "bt-gapn") { setGap(parseFloat(t.value)); return; }
      if (t.id === "bt-gap") { setGap(parseFloat(t.value)); return; }
      if (t.id === "bt-size") { S.sim.size = parseFloat(t.value); save(); return; }
      if (t.id === "bt-drift") { S.drift = parseInt(t.value, 10); return; }
    });
    root.addEventListener("input", function (ev) { var t = ev.target; if (t.getAttribute("data-f") === "tk") { S.f.tk = t.value; render(); } if (t.id === "bt-gap") { var n = root.querySelector("#bt-gapn"); if (n) n.value = t.value; } });
    root.addEventListener("submit", function (ev) {
      if (ev.target.id !== "bt-addf") return; ev.preventDefault(); var fd = new FormData(ev.target), o = {}; fd.forEach(function (v, k) { o[k] = v; });
      var q = parseFloat(o.q), e = parseFloat(o.e), x = parseFloat(o.x); if (!(q > 0) || isNaN(e) || isNaN(x)) { toast("Check shares, entry and exit"); return; }
      var long = o.s === "Long"; S.manual.push({ d: o.d, t: String(o.t).toUpperCase(), s: o.s, q: q, e: e, x: x, p: r2((x - e) * q * (long ? 1 : -1)), u: o.u || "" }); save(); render(); toast("Trade added");
    });
    root.addEventListener("pointerdown", function (ev) { if (ev.target.closest && ev.target.closest("#bt-chart")) onDown(ev); });
    root.addEventListener("pointermove", onMove); root.addEventListener("pointerup", onUp); root.addEventListener("pointercancel", onUp);
    document.addEventListener("keydown", function (ev) { if (!root || root.hidden || S.tab !== "sim") return; if ((ev.key === "Delete" || ev.key === "Backspace") && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && S.sel >= 0) { ev.preventDefault(); act("del"); } });
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
    else if (a === "savescene") { var n = (root.querySelector("#bt-sn").value || "").trim() || "Scene " + (S.scenes.length + 1); S.scenes.push({ name: n, pc: sm.pc, gap: sm.gap, c: JSON.parse(JSON.stringify(sm.c)), vw: Object.assign({}, sm.vw), em: Object.assign({}, sm.em) }); save(); render(); toast("Scene saved"); }
    else if (a === "run") { if (!sm.c.length && !S.scenes.length) { toast("Add some candles first"); return; } runAll(); }
    else if (a === "code") { runAll(); S.code = botCode(); S.tab = "code"; render(); window.scrollTo(0, 0); }
    else if (a === "rebuild") { S.code = botCode(); render(); }
    else if (a === "copycode") { try { navigator.clipboard.writeText(S.code).then(function () { toast("Code copied"); }, function () { toast("Could not copy"); }); } catch (e) { toast("Could not copy"); } }
    else if (a === "dlcode") download("bot.py", S.code, "text/x-python");
    else if (a === "dlcandles") download("candles.csv", exportCandles(), "text/csv");
  }

  function mount(el) { H = window.StockBT || H; root = el; if (!S.rules) load(); if (!root.__bt) { root.__bt = 1; bind(); } host = null; render(); }
  window.BacktestLab = { mount: mount };
  load();
})();
