/* Gurus › Mark Minervini: learn his SEPA method by playing with it.
   Tabs: Start, 4 Stages, Trend Template, VCP Lab, Patterns, Risk & Rules, Quiz, Scanner.
   Real prices come from /api/candles (Yahoo daily candles, signed-in users). Progress (XP) is saved in this browser. */
(function () {
  "use strict";
  var KEY = "ss-guru-mm-v1";
  var S = load();
  function load() { try { return Object.assign({ xp: 0, learned: {}, tab: "start", best: 0, custom: "", scan: null }, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { return { xp: 0, learned: {}, tab: "start", best: 0, custom: "", scan: null }; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pct(x, d) { return (x >= 0 ? "+" : "") + (x * 100).toFixed(d == null ? 1 : d) + "%"; }
  function money(x) { return "$" + (Math.abs(x) >= 1000 ? Math.round(x).toLocaleString() : x.toFixed(2)); }
  var host = null, T = { tab: S.tab || "start" };

  /* ---------------- XP + levels ---------------- */
  var LEVELS = [[0, "Rookie", "🌱"], [80, "Chart Reader", "👀"], [200, "Stage 2 Hunter", "🏹"], [400, "VCP Sniper", "🎯"], [700, "Superperformer", "🏆"]];
  function level(x) { var L = LEVELS[0], nx = null; for (var i = 0; i < LEVELS.length; i++) { if (x >= LEVELS[i][0]) { L = LEVELS[i]; nx = LEVELS[i + 1] || null; } } return { L: L, nx: nx }; }
  function addXp(n, why) {
    var before = level(S.xp).L[1]; S.xp += n; save();
    var after = level(S.xp); toast("+" + n + " XP" + (why ? " · " + why : ""));
    if (after.L[1] !== before) { confetti(); toast(after.L[2] + " Level up: " + after.L[1] + "!"); }
    paintXp();
  }
  function learn(id, n, why) { if (S.learned[id]) return false; S.learned[id] = 1; addXp(n || 10, why); return true; }
  function paintXp() {
    var el = host && host.querySelector(".gu-xp"); if (!el) return;
    var lv = level(S.xp), a = lv.L[0], b = lv.nx ? lv.nx[0] : a + 1, w = lv.nx ? Math.min(100, (S.xp - a) / (b - a) * 100) : 100;
    el.innerHTML = '<div class="gu-lv"><span class="gu-badge">' + lv.L[2] + '</span><div><b>' + esc(lv.L[1]) + '</b><small>' + S.xp + ' XP' + (lv.nx ? ' · ' + (b - S.xp) + ' to ' + esc(lv.nx[1]) : ' · max level') + '</small></div></div><div class="gu-bar"><i style="width:' + w + '%"></i></div>';
  }
  function toast(t) {
    var w = document.querySelector(".gu-toasts"); if (!w) { w = document.createElement("div"); w.className = "gu-toasts"; document.body.appendChild(w); }
    var d = document.createElement("div"); d.className = "gu-toast"; d.textContent = t; w.appendChild(d);
    setTimeout(function () { d.classList.add("out"); }, 1900); setTimeout(function () { d.remove(); }, 2400);
  }
  function confetti() {
    var c = ["#16a34a", "#f59e0b", "#2563eb", "#ec4899", "#a855f7", "#14b8a6"], w = document.createElement("div"); w.className = "gu-conf";
    for (var i = 0; i < 70; i++) { var s = document.createElement("i"); s.style.left = Math.random() * 100 + "%"; s.style.background = c[i % c.length]; s.style.animationDelay = Math.random() * .5 + "s"; s.style.transform = "rotate(" + Math.random() * 360 + "deg)"; w.appendChild(s); }
    document.body.appendChild(w); setTimeout(function () { w.remove(); }, 2600);
  }

  /* ---------------- math ---------------- */
  function sma(a, n) { var o = new Array(a.length).fill(null), s = 0; for (var i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; if (i >= n - 1) o[i] = s / n; } return o; }
  function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }
  function wperf(cl) {
    var n = cl.length, c = cl[n - 1];
    function p(k) { var j = Math.max(0, n - 1 - k); return c / cl[j] - 1; }
    return 0.4 * p(63) + 0.2 * p(126) + 0.2 * p(189) + 0.2 * p(252);
  }
  function rsFrom(ws, spyws) { var rel = (1 + ws) / (1 + (spyws == null ? 0.08 : spyws)) - 1; return Math.max(1, Math.min(99, Math.round(50 + 49 * Math.tanh(rel * 2.5)))); }
  function zigzag(K, from, th) {
    var piv = [], dir = 0, ei = from, ep = K[from].h, li = from, lp = K[from].l;
    piv.push({ i: from, p: K[from].h, t: "H" }); dir = -1; ep = K[from].l; ei = from;
    for (var i = from + 1; i < K.length; i++) {
      var k = K[i];
      if (dir === -1) {
        if (k.l < ep) { ep = k.l; ei = i; }
        else if (k.h >= ep * (1 + th)) { piv.push({ i: ei, p: ep, t: "L" }); dir = 1; ep = k.h; ei = i; }
      } else {
        if (k.h > ep) { ep = k.h; ei = i; }
        else if (k.l <= ep * (1 - th)) { piv.push({ i: ei, p: ep, t: "H" }); dir = -1; ep = k.l; ei = i; }
      }
    }
    piv.push({ i: ei, p: ep, t: dir === 1 ? "H" : "L", open: true });
    return piv;
  }
  function findVcp(K) {
    var n = K.length, a = Math.max(0, n - 110), b = n - 6, hi = a;
    for (var i = a; i <= b; i++) if (K[i].h > K[hi].h) hi = i;
    for (var i2 = Math.max(a, hi - 40); i2 < hi; i2++) if (K[i2].h >= K[hi].h * 0.975) { hi = i2; break; }
    var len = n - 1 - hi, out = { ok: false, cs: [], len: len, start: hi };
    if (len < 12) { out.why = "Too close to the high: no base yet"; return out; }
    var pv = zigzag(K, hi, 0.035), cs = [];
    for (var j = 0; j < pv.length - 1; j++) if (pv[j].t === "H" && pv[j + 1].t === "L") cs.push({ hi: pv[j].i, hp: pv[j].p, lo: pv[j + 1].i, lp: pv[j + 1].p, d: (pv[j].p - pv[j + 1].p) / pv[j].p });
    cs = cs.filter(function (c) { return c.d >= 0.025; }).slice(-5);
    out.cs = cs;
    if (!cs.length) { out.why = "No pullbacks found"; return out; }
    var dec = true; for (var q = 1; q < cs.length; q++) if (cs[q].d > cs[q - 1].d * 1.12) dec = false;
    var last = cs[cs.length - 1];
    out.pivot = last.hp;
    out.lastLow = last.lp; out.dec = dec;
    out.tight = last.d <= 0.12;
    out.ok = cs.length >= 2 && dec && out.tight && cs[0].d <= 0.5;
    out.why = out.ok ? "Pullbacks shrink: " + cs.map(function (c) { return Math.round(c.d * 100) + "%"; }).join(" → ") : (cs.length < 2 ? "Only one pullback so far" : !dec ? "Pullbacks are getting bigger, not smaller" : !out.tight ? "Last pullback is still too deep (over 12%)" : "First pullback too deep");
    return out;
  }
  function analyze(K, spyws) {
    if (!K || K.length < 220) return { err: "Needs about a year of daily prices" };
    var n = K.length, cl = K.map(function (k) { return k.c; }), vo = K.map(function (k) { return k.v || 0; });
    var m50 = sma(cl, 50), m150 = sma(cl, 150), m200 = sma(cl, 200), c = cl[n - 1];
    var a50 = m50[n - 1], a150 = m150[n - 1], a200 = m200[n - 1], a200p = m200[n - 23];
    var w = K.slice(-252), hi52 = Math.max.apply(null, w.map(function (k) { return k.h; })), lo52 = Math.min.apply(null, w.map(function (k) { return k.l; }));
    var ws = wperf(cl), rs = rsFrom(ws, spyws);
    var R = [
      { id: 1, ok: c > a150 && c > a200, txt: "Price above the 150 & 200-day", val: money(c) + " vs " + money(a150) + " / " + money(a200) },
      { id: 2, ok: a150 > a200, txt: "150-day above the 200-day", val: money(a150) + " vs " + money(a200) },
      { id: 3, ok: a200 > a200p, txt: "200-day rising for 1+ month", val: pct(a200 / a200p - 1) + " in a month" },
      { id: 4, ok: a50 > a150 && a50 > a200, txt: "50-day above the 150 & 200", val: money(a50) },
      { id: 5, ok: c > a50, txt: "Price above the 50-day", val: pct(c / a50 - 1) + " vs 50-day" },
      { id: 6, ok: c >= lo52 * 1.3, txt: "30%+ above the 52-week low", val: pct(c / lo52 - 1) + " above low" },
      { id: 7, ok: c >= hi52 * 0.75, txt: "Within 25% of the 52-week high", val: pct(c / hi52 - 1) + " from high" },
      { id: 8, ok: rs >= 70, txt: "Relative strength 70+", val: "RS " + rs }
    ];
    var pass = R.filter(function (r) { return r.ok; }).length, v = findVcp(K);
    var vd = avg(vo.slice(-10)) / (avg(vo.slice(-50)) || 1), vt = vo[n - 1] / (avg(vo.slice(-51, -1)) || 1);
    var dist = v.pivot ? (v.pivot - c) / v.pivot : null;
    var stop = v.pivot ? Math.max(v.lastLow * 0.995, v.pivot * 0.92) : c * 0.92;
    var status = "skip", label = "❌ Not in Stage 2";
    if (pass === 8) {
      status = "trend"; label = "✅ Trend only";
      if (v.cs.length && dist != null && dist < 0 && dist > -0.05 && vt > 1.4) { status = "break"; label = "🔥 Breaking out"; }
      else if (v.ok && dist != null && dist >= 0 && dist <= 0.03) { status = "near"; label = "🎯 At the pivot"; }
      else if (v.ok) { status = "vcp"; label = "🌀 VCP forming"; }
      else if (dist != null && dist < -0.05) { status = "ext"; label = "🚀 Extended"; }
    } else if (pass >= 6) { status = "close"; label = "🟡 Almost (" + pass + "/8)"; }
    return { c: c, m50: m50, m150: m150, m200: m200, hi52: hi52, lo52: lo52, rs: rs, R: R, pass: pass, vcp: v, vd: vd, vt: vt, dist: dist, stop: stop, status: status, label: label };
  }

  /* ---------------- synthetic charts (lessons, quiz) ---------------- */
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gen(spec, seed) {
    var r = rng(seed || 7), K = [], p = 50, total = spec.reduce(function (a, s) { return a + s[0]; }, 0), pad = Math.max(0, 300 - total);
    if (pad) spec = [[pad, 4, 0.012, 1]].concat(spec);
    var day = Date.now() - (total + pad) * 1.4 * 864e5;
    function rn() { return (r() + r() + r() - 1.5) / 1.5; }
    spec.forEach(function (sg) {
      var n = sg[0], tgt = p * (1 + sg[1] / 100), nz = sg[2], vm = sg[3], st = p;
      for (var i = 1; i <= n; i++) {
        var base = st * Math.pow(tgt / st, i / n), o = p, c = base * (1 + rn() * nz * 0.6);
        var h = Math.max(o, c) * (1 + Math.abs(rn()) * nz * 0.7), l = Math.min(o, c) * (1 - Math.abs(rn()) * nz * 0.7);
        day += 864e5; var dd = new Date(day).getDay(); if (dd === 6) day += 2 * 864e5; if (dd === 0) day += 864e5;
        K.push({ t: day, o: o, h: h, l: l, c: c, v: Math.round(1e6 * vm * (0.75 + r() * 0.5)) }); p = c;
      }
      p = tgt;
    });
    return K;
  }
  function down(d) { return Math.round((1 / (1 - d / 100) - 1) * 100 * 0.985); }
  var SHAPES = {
    vcp: function () { return [[150, 10, .012, 1], [80, 75, .013, 1.3], [10, -24, .016, 1.5], [14, down(24), .013, 1], [7, -12, .011, .8], [9, down(12), .009, .7], [5, -6, .007, .5], [6, down(6) - 1, .005, .42]]; },
    cup: function () { return [[150, 8, .012, 1], [70, 60, .013, 1.3], [22, -30, .015, 1.4], [16, 8, .012, .8], [24, 31, .012, .9], [7, -8, .008, .6], [5, 5, .006, .5]]; },
    power: function () { return [[190, 5, .012, 1], [35, 110, .02, 2.4], [16, -12, .012, .9], [10, 8, .007, .55]]; },
    flat: function () { return [[150, 6, .012, 1], [80, 55, .013, 1.3], [8, -9, .01, .9], [8, 8, .009, .8], [8, -7, .008, .7], [8, 7, .007, .6], [6, -4, .006, .5], [5, 3, .005, .45]]; },
    stage4: function () { return [[120, 50, .013, 1.2], [40, 0, .015, 1.4], [130, -45, .018, 1.3]]; },
    stage1: function () { return [[300, -2, .02, 0.9]]; },
    loose: function () { return [[150, 6, .012, 1], [70, 60, .014, 1.2], [6, -9, .014, 1], [7, 10, .014, 1], [9, -18, .02, 1.4], [9, 21, .02, 1.4], [12, -28, .024, 1.7], [8, 12, .02, 1.3]]; },
    broke50: function () { return [[150, 8, .012, 1], [90, 70, .013, 1.2], [25, -20, .016, 1.4]]; },
    extended: function () { return [[150, 8, .012, 1], [80, 50, .013, 1.2], [12, -10, .01, .8], [14, 32, .016, 1.8]]; }
  };

  /* ---------------- chart ---------------- */
  function css(v, d) { var x = getComputedStyle(host || document.body).getPropertyValue(v).trim(); return x || d; }
  function drawChart(cv, K, o) {
    o = o || {};
    var W = cv.parentElement.clientWidth || 600, H = o.h || 340, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    if (!K || !K.length) return;
    var show = Math.min(K.length, o.show || 170), s0 = K.length - show, cut = o.upto != null ? Math.max(s0 + 1, Math.min(K.length, o.upto)) : K.length;
    var V = K.slice(s0, cut), cl = K.map(function (k) { return k.c; });
    var mas = o.ma === false ? [] : [[sma(cl, 50), "#2563eb", "50"], [sma(cl, 150), "#f59e0b", "150"], [sma(cl, 200), "#a855f7", "200"]];
    var vis = K.slice(s0), lo = Infinity, hi = -Infinity;
    vis.forEach(function (k) { lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); });
    mas.forEach(function (m) { for (var i = s0; i < K.length; i++) if (m[0][i] != null) { lo = Math.min(lo, m[0][i]); hi = Math.max(hi, m[0][i]); } });
    if (o.stop) lo = Math.min(lo, o.stop); if (o.pivot) hi = Math.max(hi, o.pivot);
    var padR = 64, pTop = 14, pH = H * 0.76 - pTop, vTop = H * 0.8, vH = H * 0.2 - 4, bw = (W - padR) / show;
    var rr = hi - lo || 1; lo -= rr * 0.04; hi += rr * 0.04;
    function y(p) { return pTop + (hi - p) / (hi - lo) * pH; }
    function x(i) { return (i - s0) * bw + bw / 2; }
    var ink = css("--ink", "#111"), mute = css("--mute", "#777"), line = css("--line", "#ddd");
    g.font = "600 11px 'Instrument Sans',sans-serif"; g.strokeStyle = line; g.lineWidth = 1; g.fillStyle = mute;
    for (var gi = 0; gi <= 4; gi++) { var gp = lo + (hi - lo) * gi / 4, gy = y(gp); g.globalAlpha = .5; g.beginPath(); g.moveTo(0, gy); g.lineTo(W - padR, gy); g.stroke(); g.globalAlpha = 1; g.fillText(gp.toFixed(gp < 10 ? 2 : 0), W - padR + 6, gy + 4); }
    if (o.vcp && o.vcp.cs) o.vcp.cs.forEach(function (c, ci) {
      if (c.hi < s0 || c.hi >= cut) return;
      var x0 = x(c.hi) - bw / 2, x1 = x(Math.min(c.lo, cut - 1)) + bw / 2;
      g.fillStyle = "rgba(236,72,153,.10)"; g.fillRect(x0, y(c.hp), x1 - x0, y(c.lp) - y(c.hp));
      g.strokeStyle = "rgba(236,72,153,.75)"; g.setLineDash([]); g.lineWidth = 1.5; g.strokeRect(x0, y(c.hp), x1 - x0, y(c.lp) - y(c.hp));
      var lab = "T" + (ci + 1) + " −" + Math.round(c.d * 100) + "%"; g.font = "800 12px 'Instrument Sans',sans-serif";
      var tw = g.measureText(lab).width + 10, lx = Math.min(Math.max(x0, 2), W - padR - tw - 2), ly = y(c.lp) + 6;
      g.fillStyle = "#ec4899"; roundRect(g, lx, ly, tw, 18, 9); g.fill(); g.fillStyle = "#fff"; g.fillText(lab, lx + 5, ly + 13);
    });
    var mx = 0; V.forEach(function (k) { mx = Math.max(mx, k.v || 0); });
    V.forEach(function (k, j) {
      var i = s0 + j, X = x(i), up = k.c >= k.o, col = up ? "#16a34a" : "#ef4444";
      if (mx) { g.fillStyle = up ? "rgba(22,163,74,.35)" : "rgba(239,68,68,.35)"; var vh = (k.v || 0) / mx * vH; g.fillRect(X - bw * 0.35, vTop + vH - vh, Math.max(1, bw * 0.7), vh); }
      g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.moveTo(X, y(k.h)); g.lineTo(X, y(k.l)); g.stroke();
      g.fillStyle = col; var yo = y(k.o), yc = y(k.c); g.fillRect(X - bw * 0.35, Math.min(yo, yc), Math.max(1, bw * 0.7), Math.max(1, Math.abs(yc - yo)));
    });
    mas.forEach(function (m) { g.strokeStyle = m[1]; g.lineWidth = 2; g.beginPath(); var st = false; for (var i = s0; i < cut; i++) { var v = m[0][i]; if (v == null) continue; if (!st) { g.moveTo(x(i), y(v)); st = true; } else g.lineTo(x(i), y(v)); } g.stroke(); });
    function hline(p, col, txt) { var yy = y(p); g.strokeStyle = col; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(0, yy); g.lineTo(W - padR, yy); g.stroke(); g.setLineDash([]); g.font = "800 11px 'Instrument Sans',sans-serif"; var tw = g.measureText(txt).width + 10; g.fillStyle = col; roundRect(g, W - padR - tw - 4, yy - 9, tw, 18, 9); g.fill(); g.fillStyle = "#fff"; g.fillText(txt, W - padR - tw + 1, yy + 4); }
    if (o.pivot) hline(o.pivot, "#16a34a", "Pivot " + o.pivot.toFixed(2));
    if (o.stop) hline(o.stop, "#ef4444", "Stop " + o.stop.toFixed(2));
    if (o.mark) { var mk = o.mark, X2 = x(mk.i), Y2 = y(mk.p) - 10; g.fillStyle = "#16a34a"; g.beginPath(); g.moveTo(X2, Y2); g.lineTo(X2 - 7, Y2 - 12); g.lineTo(X2 + 7, Y2 - 12); g.closePath(); g.fill(); g.font = "800 12px 'Instrument Sans',sans-serif"; g.fillText(mk.t, Math.min(X2 - 20, W - padR - 70), Y2 - 18); }
    if (mas.length && o.legend !== false) { g.font = "700 11px 'Instrument Sans',sans-serif"; var lx2 = 8; mas.forEach(function (m) { g.fillStyle = m[1]; g.fillRect(lx2, 6, 14, 3); g.fillStyle = ink; g.fillText(m[2] + "-day", lx2 + 18, 11); lx2 += 70; }); }
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  /* ---------------- data ---------------- */
  var CK = {}, SPYW = null;
  function candles(sym) {
    if (CK[sym]) return CK[sym];
    var So = window.stockspotSocial;
    if (!So || !So.candles) return Promise.resolve({ error: "Sign in to load real prices." });
    var end = Date.now(), start = end - 430 * 864e5;
    CK[sym] = So.candles({ symbol: sym, interval: "1d", start: String(start), end: String(end) }).then(function (r) { if (!r || !r.candles || !r.candles.length) { delete CK[sym]; } return r || {}; }).catch(function () { delete CK[sym]; return { error: "Could not load " + sym }; });
    return CK[sym];
  }
  function spyW() { if (SPYW != null) return Promise.resolve(SPYW); return candles("SPY").then(function (r) { var k = r.candles || []; SPYW = k.length > 60 ? wperf(k.map(function (x) { return x.c; })) : 0.08; return SPYW; }); }

  var UNIVERSE = ("NVDA AVGO AMD ARM TSM MU ANET ALAB CLS VRT SMCI DELL PLTR CRWD PANW ZS NET DDOG SNOW MDB NOW CRM ORCL MSFT AAPL AMZN META GOOGL NFLX TSLA SHOP MELI UBER ABNB DASH APP HOOD COIN SOFI AFRM RKLB AXON TOST DUOL RDDT CVNA SPOT IBKR KKR BX GS JPM V MA PGR TJX ORLY AZO COST WMT LLY ISRG VRTX BSX GE GEV VST CEG ETN PWR FIX TT HWM TDG CAT URI DECK ONON CMG CAVA WING TXRH ELF CELH ANF FTAI CRS IONQ OKLO SN NU TTD DKNG").split(" ");

  /* ---------------- content ---------------- */
  var TABS = [["start", "🏁", "Start"], ["stages", "🎢", "4 Stages"], ["tt", "✅", "Trend Template"], ["vcp", "🌀", "VCP Lab"], ["pat", "🧩", "Patterns"], ["risk", "🛡️", "Risk & Rules"], ["quiz", "🎮", "Quiz"], ["scan", "🔎", "Scanner"]];
  var TT = [
    ["Price above the 150-day and 200-day", "The stock is above its long-term averages. Buyers are in control.", "📈"],
    ["150-day above the 200-day", "The medium-term trend is stronger than the long-term trend.", "🪜"],
    ["200-day rising for at least 1 month", "The slowest line is pointing up. He likes 4–5 months even better.", "⬆️"],
    ["50-day above the 150-day and 200-day", "All three lines stacked in order: 50 on top, then 150, then 200.", "🥞"],
    ["Price above the 50-day", "Short-term trend is up too. No broken stocks.", "💪"],
    ["At least 30% above the 52-week low", "It has already proven itself. Big winners are often 100%+ off the low. (His newer book says 25%.)", "🚀"],
    ["Within 25% of the 52-week high", "Close to the highs, not a beaten-down 'bargain'. Closer is better.", "🏔️"],
    ["Relative strength of 70 or more", "It beats at least 70% of stocks. He prefers 80s and 90s: the true leaders.", "🏆"]
  ];
  var STAGES = [
    ["Stage 1", "Neglect", "#94a3b8", "Flat and boring. The 200-day goes sideways. Big money is not buying yet. Minervini waits.", "😴"],
    ["Stage 2", "Advancing", "#16a34a", "Higher highs, higher lows, moving averages stacked and rising. THIS is the only stage he buys.", "🤑"],
    ["Stage 3", "Topping", "#f59e0b", "Wild swings, the trend stalls, big drops on high volume. Time to sell into strength.", "😬"],
    ["Stage 4", "Declining", "#ef4444", "Below a falling 200-day. Every rally gets sold. Never buy here, no matter how 'cheap' it looks.", "🪦"]
  ];
  var RULES = [
    ["✂️", "Cut losses fast", "Decide your stop BEFORE you buy. He never lets a loss get past 10%, and his average loss is far smaller."],
    ["💪", "Buy strength", "Buy stocks near new highs, not ones that crashed. Leaders lead before the crowd notices."],
    ["🔊", "Volume confirms", "Quiet volume while the base tightens. A breakout on volume well above average = big buyers stepping in."],
    ["⚖️", "Reward ≥ 3× risk", "If you risk $1 a share, aim to make $3. Then you can be wrong more often than right and still win."],
    ["🚫", "Never average down", "Adding to a loser turns a small mistake into a big one. Only add to winners."],
    ["🔒", "Protect breakeven", "Once a trade is up a few times your risk, raise the stop so a good trade can't turn into a loss."],
    ["🌡️", "Respect the market", "Most stocks fall in a bear market. When breakouts keep failing, trade smaller or step aside."],
    ["🧾", "Fundamentals matter", "His best winners had strong earnings and sales growth, often speeding up. A catalyst (new product, big news) helps."]
  ];
  var SEPA = [["T", "Trend", "Stage 2 only (Trend Template)", "tt"], ["F", "Fundamentals", "Earnings & sales growing fast", "risk"], ["C", "Catalyst", "Something new driving demand", "risk"], ["E", "Entry point", "Buy the pivot of a tight base", "vcp"], ["X", "Exit", "Stop set before you buy", "risk"]];
  var MCQ = [
    ["Which stage does Minervini buy?", ["Stage 1", "Stage 2", "Stage 3", "Stage 4"], 1, "Only Stage 2: the advancing phase."],
    ["How close to its 52-week high should a stock be?", ["Within 25%", "Within 50%", "At least 40% below", "Doesn't matter"], 0, "Within 25% of the high, and closer is better."],
    ["What does VCP stand for?", ["Very Cheap Price", "Volatility Contraction Pattern", "Volume Control Point", "Value Cycle Pattern"], 1, "Volatility Contraction Pattern: pullbacks get smaller and smaller."],
    ["In a VCP, each pullback should be…", ["Bigger than the last", "Smaller than the last", "Exactly 10%", "Random"], 1, "Smaller each time (like 25% → 12% → 6%). Sellers are running out."],
    ["What should volume do on the right side of the base?", ["Explode", "Dry up", "Stay the same", "Doesn't matter"], 1, "Dry up. Quiet volume means few people want to sell."],
    ["What should volume do on the breakout day?", ["Be light", "Be well above average", "Be zero", "Match yesterday"], 1, "Well above average: proof big buyers are in."],
    ["Which moving average must be rising for at least a month?", ["10-day", "20-day", "50-day", "200-day"], 3, "The 200-day. He prefers 4–5 months of uptrend."],
    ["What's the minimum relative strength rating?", ["30", "50", "70", "99"], 2, "70 minimum; he prefers 80–90+."],
    ["Your stock drops 6% below your entry and hits your stop. You…", ["Hold and hope", "Buy more", "Sell. Small loss, move on", "Wait for earnings"], 2, "Sell. Small losses keep you in the game."],
    ["What does SEPA stand for?", ["Stock Entry Price Action", "Specific Entry Point Analysis", "Super Earnings Per Annum", "Stage Entry Pattern Alert"], 1, "Specific Entry Point Analysis, his complete method."],
    ["A stock is 60% below its high and 'looks cheap'. Minervini…", ["Buys it", "Ignores it", "Shorts it", "Buys half"], 1, "Ignores it. He buys leaders near highs, not bargains."],
    ["The ideal reward-to-risk is at least…", ["1 to 1", "1 to 2", "3 to 1", "Doesn't matter"], 2, "About 3 to 1: make $3 for every $1 you risk."]
  ];

  /* ---------------- render ---------------- */
  function mount(el) {
    host = el; injectCss();
    el.innerHTML = '<div class="gu">' +
      '<header class="gu-hero"><div class="gu-hl"><p class="gu-eye">Gurus · Momentum</p><h1>Trade like <span>Mark Minervini</span></h1><p class="gu-sub">U.S. Investing Champion (1997) and author of <i>Trade Like a Stock Market Wizard</i>. His method, called SEPA, buys the strongest stocks in a Stage 2 uptrend at a tight, low-risk entry and cuts losses fast.</p></div>' +
      '<div class="gu-xp"></div></header>' +
      '<nav class="gu-tabs" role="tablist">' + TABS.map(function (t) { return '<button type="button" role="tab" data-gtab="' + t[0] + '"><i>' + t[1] + '</i>' + t[2] + '</button>'; }).join("") + '</nav>' +
      '<div class="gu-body"></div></div>';
    paintXp(); tab(T.tab);
  }
  function tab(t) {
    T.tab = t; S.tab = t; save();
    [].forEach.call(host.querySelectorAll("[data-gtab]"), function (b) { var on = b.dataset.gtab === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    var b = host.querySelector(".gu-body"); stopAnim();
    b.innerHTML = ({ start: pStart, stages: pStages, tt: pTT, vcp: pVcp, pat: pPat, risk: pRisk, quiz: pQuiz, scan: pScan })[t]();
    after(t);
  }
  function after(t) {
    if (t === "stages") stageSel(T.stage || 1);
    if (t === "vcp") vcpDraw();
    if (t === "pat") patDraw();
    if (t === "risk") riskCalc();
    if (t === "quiz") quizNext(T.qmode || "chart");
    if (t === "scan") scanPaint();
    if (t === "tt") ttPaintTest();
  }

  function pStart() {
    var done = Object.keys(S.learned).length;
    return '<section class="gu-card gu-big"><h2>The big idea, in one breath 🫁</h2><p class="gu-lead">Only buy <b>leaders</b> that are already in a <b>strong uptrend</b>, wait for them to <b>calm down</b> into a tight pattern, buy the moment they <b>break out</b>, and <b>sell fast</b> if you’re wrong.</p></section>' +
      '<h3 class="gu-h">His 5-step path: SEPA</h3><div class="gu-path">' + SEPA.map(function (s, i) { return '<button type="button" class="gu-stop" data-go="' + s[3] + '" style="--d:' + i * 80 + 'ms"><b>' + s[0] + '</b><span>' + s[1] + '</span><small>' + s[2] + '</small></button>'; }).join('<i class="gu-arrow">→</i>') + '</div>' +
      '<h3 class="gu-h">Your training plan</h3><div class="gu-grid4">' +
      [["stages", "🎢", "Learn the 4 stages", "Know when a stock is buyable"], ["tt", "✅", "Master the 8 rules", "The Trend Template"], ["vcp", "🌀", "Build a VCP", "Play with the pattern he buys"], ["quiz", "🎮", "Prove it", "Would Mark buy it?"], ["scan", "🔎", "Scan the market", "Find stocks that pass today"]].map(function (x) { return '<button type="button" class="gu-plan" data-go="' + x[0] + '"><i>' + x[1] + '</i><b>' + x[2] + '</b><small>' + x[3] + '</small></button>'; }).join("") +
      '</div><p class="gu-note">' + done + ' lessons finished · best quiz streak ' + (S.best || 0) + ' 🔥</p>';
  }

  function pStages() {
    return '<section class="gu-card"><h2>Every stock lives through 4 stages 🎢</h2><p class="gu-lead">Tap a stage. Minervini only buys one of them. Guess which before you tap.</p>' +
      '<div class="gu-stbtns">' + STAGES.map(function (s, i) { return '<button type="button" data-stg="' + (i + 1) + '" style="--c:' + s[2] + '"><b>' + s[4] + ' ' + s[0] + '</b><small>' + s[1] + '</small></button>'; }).join("") + '</div>' +
      '<svg class="gu-stsvg" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid meet" aria-label="Price path through the four stages">' +
      '<rect class="z" data-z="1" x="0" y="0" width="230" height="300" fill="#94a3b8"/><rect class="z" data-z="2" x="230" y="0" width="330" height="300" fill="#16a34a"/><rect class="z" data-z="3" x="560" y="0" width="190" height="300" fill="#f59e0b"/><rect class="z" data-z="4" x="750" y="0" width="250" height="300" fill="#ef4444"/>' +
      '<path class="gu-stp" d="M0 240 C40 225 80 250 120 238 S200 232 230 230 C280 215 300 180 340 170 S390 175 410 150 S470 110 500 95 S540 70 560 65 C590 40 610 90 640 60 S690 95 720 70 S745 100 750 105 C790 140 820 150 850 175 S900 200 930 230 S980 255 1000 262" fill="none" stroke-width="5" stroke-linecap="round"/>' +
      '<circle class="gu-dot" r="10" fill="#16a34a"/></svg><div class="gu-stinfo"></div></section>';
  }
  var stAnim = null;
  function stopAnim() { if (stAnim) cancelAnimationFrame(stAnim); stAnim = null; if (VA.t) { clearInterval(VA.t); VA.t = null; } }
  function stageSel(n) {
    T.stage = n; var s = STAGES[n - 1], box = host.querySelector(".gu-stinfo"); if (!box) return;
    [].forEach.call(host.querySelectorAll("[data-stg]"), function (b) { b.classList.toggle("on", +b.dataset.stg === n); });
    [].forEach.call(host.querySelectorAll(".gu-stsvg .z"), function (z) { z.style.opacity = +z.dataset.z === n ? .22 : .05; });
    box.innerHTML = '<div class="gu-stcard" style="--c:' + s[2] + '"><span class="gu-emo">' + s[4] + '</span><div><b>' + s[0] + ': ' + s[1] + (n === 2 ? ' <em class="gu-yes">BUY ZONE</em>' : ' <em class="gu-yes gu-nobuy">NO BUY</em>') + '</b><p>' + s[3] + '</p></div></div>';
    if (n === 2) learn("stage2", 15, "found the buy zone");
    var path = host.querySelector(".gu-stp"), dot = host.querySelector(".gu-dot"); if (!path || !dot) return;
    var L = path.getTotalLength(), x0 = [0, 230, 560, 750, 1000][n - 1], x1 = [0, 230, 560, 750, 1000][n], t0 = performance.now();
    function lenAt(xx) { var a = 0, b = L; for (var i = 0; i < 22; i++) { var m = (a + b) / 2; if (path.getPointAtLength(m).x < xx) a = m; else b = m; } return a; }
    var la = lenAt(x0 + 2), lb = lenAt(x1 - 2);
    if (stAnim) cancelAnimationFrame(stAnim);
    (function step(now) { var f = ((now - t0) / 2600) % 1, p = path.getPointAtLength(la + (lb - la) * f); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.setAttribute("fill", s[2]); stAnim = requestAnimationFrame(step); })(t0);
  }

  function pTT() {
    var n = TT.filter(function (r, i) { return S.learned["tt" + i]; }).length;
    return '<section class="gu-card"><h2>The Trend Template: 8 rules ✅</h2><p class="gu-lead">A stock must pass <b>all 8</b> before he even looks at it. Tap each card to flip it and earn XP. <b>' + n + '/8</b> learned.</p>' +
      '<div class="gu-ttgrid">' + TT.map(function (r, i) { return '<button type="button" class="gu-flip' + (S.learned["tt" + i] ? " done" : "") + '" data-tt="' + i + '"><span class="f"><i>' + r[2] + '</i><b>Rule ' + (i + 1) + '</b><span>' + esc(r[0]) + '</span><small>tap to flip</small></span><span class="b"><b>Why it matters</b><span>' + esc(r[1]) + '</span></span></button>'; }).join("") + '</div></section>' +
      '<section class="gu-card"><h2>Test any stock 🧪</h2><p class="gu-lead">Type a ticker and watch the 8 lights turn on (real daily prices).</p><form class="gu-row" data-ttform><input class="gu-in" name="t" placeholder="e.g. NVDA" maxlength="10" autocomplete="off" style="max-width:220px"><button class="gu-btn" type="submit">Check it</button></form><div class="gu-ttres"></div></section>';
  }
  function ttPaintTest() { if (T.ttK) ttShow(T.ttSym, T.ttK); }
  function ttCheck(sym) {
    sym = String(sym || "").toUpperCase().replace(/[^A-Z0-9.\-^]/g, ""); if (!sym) return;
    var box = host.querySelector(".gu-ttres"); box.innerHTML = '<p class="gu-note">Loading ' + esc(sym) + '…</p>';
    Promise.all([candles(sym), spyW()]).then(function (r) {
      var K = r[0].candles || []; if (!K.length) { box.innerHTML = '<p class="gu-warn">' + esc(r[0].error || "No prices for " + sym) + '</p>'; return; }
      T.ttSym = sym; T.ttK = K; T.ttW = r[1]; ttShow(sym, K); addXp(5, "checked " + sym);
    });
  }
  function ttShow(sym, K) {
    var box = host.querySelector(".gu-ttres"); if (!box) return; var a = analyze(K, T.ttW);
    if (a.err) { box.innerHTML = '<p class="gu-warn">' + esc(a.err) + '</p>'; return; }
    box.innerHTML = '<div class="gu-score"><b class="s' + (a.pass === 8 ? " ok" : "") + '">' + a.pass + '/8</b><span>' + esc(sym) + ' · ' + a.label + '</span></div><div class="gu-lights">' + a.R.map(function (r, i) { return '<div class="gu-light ' + (r.ok ? "ok" : "no") + '" style="--d:' + i * 120 + 'ms"><i>' + (r.ok ? "✓" : "✗") + '</i><b>' + esc(r.txt) + '</b><small>' + esc(r.val) + '</small></div>'; }).join("") + '</div><div class="gu-chart"><canvas></canvas></div>';
    drawChart(box.querySelector("canvas"), K, { vcp: a.vcp, pivot: a.pass === 8 ? a.vcp.pivot : null, h: 360 });
  }

  /* VCP lab */
  var VA = { n: 3, d1: 25, sh: 50, t: null, f: 1 };
  function vcpSpec() {
    var sp = [[150, 10, .012, 1], [80, 75, .013, 1.3]], d = VA.d1, vm = 1.5;
    for (var i = 0; i < VA.n; i++) { var len = Math.max(4, Math.round(12 - i * 2.5)); sp.push([len, -d, .006 + d / 1500, vm]); sp.push([len + 3, down(d) - (i === VA.n - 1 ? 1 : 0), .005 + d / 1800, vm * .75]); d = Math.max(2, d * (1 - VA.sh / 100)); vm *= .7; }
    sp.push([4, 9, .01, 2.8]); return sp;
  }
  function pVcp() {
    return '<section class="gu-card"><h2>VCP Lab: build the pattern he buys 🌀</h2><p class="gu-lead"><b>VCP = Volatility Contraction Pattern.</b> After a big run, the stock pulls back… then less… then even less. Sellers are drying up. When it pops through the top (the <b style="color:#16a34a">pivot</b>) on big volume, he buys.</p>' +
      '<div class="gu-ctl"><label>Pullbacks <b data-vo="n">' + VA.n + '</b><input type="range" min="2" max="5" value="' + VA.n + '" data-vs="n"></label><label>First pullback <b data-vo="d1">' + VA.d1 + '%</b><input type="range" min="10" max="40" value="' + VA.d1 + '" data-vs="d1"></label><label>Each one shrinks by <b data-vo="sh">' + VA.sh + '%</b><input type="range" min="-30" max="70" value="' + VA.sh + '" data-vs="sh"></label><button class="gu-btn" type="button" data-vplay>▶ Play it</button></div>' +
      '<div class="gu-chart"><canvas data-vc></canvas></div><div class="gu-vmsg"></div></section>' +
      '<section class="gu-card"><h2>How to read it 👇</h2><div class="gu-grid4"><div class="gu-mini"><i>🩷</i><b>T1, T2, T3…</b><span>Each pink box is a pullback. The numbers should shrink.</span></div><div class="gu-mini"><i>🔈</i><b>Volume dries up</b><span>Volume bars get smaller on the right side of the base.</span></div><div class="gu-mini"><i>🟢</i><b>Pivot</b><span>The top of the last, tightest pullback. Your buy point.</span></div><div class="gu-mini"><i>🔴</i><b>Stop</b><span>Just under the last pullback’s low. Tight = small risk.</span></div></div></section>';
  }
  function vcpDraw(upto) {
    var cv = host.querySelector("[data-vc]"); if (!cv) return;
    var K = gen(vcpSpec(), 11), core = K.slice(0, K.length - 4), a = findVcp(core), piv = a.cs.length ? a.cs[a.cs.length - 1].hp : null;
    var stop = piv ? Math.max(a.lastLow * 0.995, piv * 0.92) : null;
    var mark = upto == null || upto >= K.length ? { i: K.length - 3, p: K[K.length - 3].h, t: "BUY 🟢" } : null;
    drawChart(cv, K, { vcp: a, pivot: piv, stop: stop, h: 380, upto: upto, mark: mark });
    var m = host.querySelector(".gu-vmsg");
    if (m) m.innerHTML = a.ok ? '<p class="gu-ok">✅ Textbook VCP: ' + esc(a.why) + '. Risk from pivot to stop: ' + (piv ? ((piv - stop) / piv * 100).toFixed(1) : "–") + '%.</p>' : '<p class="gu-warn">⚠️ Not a VCP: ' + esc(a.why) + '. Try making each pullback smaller.</p>';
    return a;
  }

  function pPat() {
    var P = [["vcp", "Classic VCP", "2–5 pullbacks, each smaller. His signature setup."], ["cup", "Cup with handle", "A rounded U, then a small, quiet dip (the handle). Buy the handle high."], ["power", "Power play", "A huge run (100%+ in weeks), then a tight sideways flag that barely gives back."], ["flat", "Flat base", "After a run, it moves sideways in a tight range (about 10–15%) for several weeks."]];
    return '<section class="gu-card"><h2>Patterns he trades 🧩</h2><p class="gu-lead">They all share one idea: <b>a strong stock that tightens up</b>, then breaks out. Tap ▶ on any chart to replay it.</p><div class="gu-pgrid">' + P.map(function (p) { return '<div class="gu-pcard"><div class="gu-ph"><b>' + p[1] + '</b><button type="button" class="gu-pill" data-pplay="' + p[0] + '">▶</button></div><div class="gu-chart"><canvas data-pc="' + p[0] + '"></canvas></div><p>' + p[2] + '</p></div>'; }).join("") + '</div></section>' +
      '<section class="gu-card"><h2>Real-chart examples 🔍</h2><p class="gu-lead">Open the <b>Scanner</b> tab and tap any stock that shows 🌀 or 🎯. You’ll see its real chart with the pullbacks boxed in pink, just like these.</p><button type="button" class="gu-btn" data-go="scan">Go to the Scanner →</button></section>';
  }
  function patDraw(only, upto) {
    ["vcp", "cup", "power", "flat"].forEach(function (k) {
      if (only && k !== only) return; var cv = host.querySelector('[data-pc="' + k + '"]'); if (!cv) return;
      var K = gen(SHAPES[k]().concat([[3, 7, .01, 2.6]]), 21 + k.length), a = findVcp(K.slice(0, -3)), piv = a.cs.length ? a.cs[a.cs.length - 1].hp : null;
      if (k === "power" || k === "flat") { var base = K.slice(-34, -3); piv = Math.max.apply(null, base.map(function (x) { return x.h; })); a = { cs: [] }; }
      drawChart(cv, K, { vcp: a, pivot: piv, h: 230, show: 130, upto: upto, legend: false });
    });
  }

  function pRisk() {
    return '<section class="gu-card"><h2>His golden rules 🛡️</h2><p class="gu-lead">Tap each card to lock it in.</p><div class="gu-rgrid">' + RULES.map(function (r, i) { return '<button type="button" class="gu-rule' + (S.learned["r" + i] ? " done" : "") + '" data-rule="' + i + '"><i>' + r[0] + '</i><b>' + esc(r[1]) + '</b><span>' + esc(r[2]) + '</span></button>'; }).join("") + '</div></section>' +
      '<section class="gu-card"><h2>Position size calculator 🧮</h2><p class="gu-lead">He decides how much he can lose <b>before</b> buying. Most traders following him risk about 1–2.5% of the account per trade.</p>' +
      '<div class="gu-calc"><label>Account size $<input class="gu-in" data-rk="acct" type="number" value="' + (S.acct || 25000) + '"></label><label>Risk per trade %<input class="gu-in" data-rk="rp" type="number" step="0.25" value="' + (S.rp || 1.25) + '"></label><label>Entry (pivot) $<input class="gu-in" data-rk="en" type="number" step="0.01" value="' + (S.en || 100) + '"></label><label>Stop $<input class="gu-in" data-rk="sp" type="number" step="0.01" value="' + (S.sp || 94) + '"></label></div><div class="gu-calcout"></div></section>';
  }
  function riskCalc() {
    var g = function (k) { var e = host.querySelector('[data-rk="' + k + '"]'); return e ? parseFloat(e.value) : NaN; }, o = host.querySelector(".gu-calcout"); if (!o) return;
    var A = g("acct"), rp = g("rp"), en = g("en"), sp = g("sp");
    S.acct = A; S.rp = rp; S.en = en; S.sp = sp; save();
    if (!(A > 0 && rp > 0 && en > 0 && sp > 0) || sp >= en) { o.innerHTML = '<p class="gu-warn">Enter an account size, a risk %, and a stop below your entry.</p>'; return; }
    var rps = en - sp, sd = rps / en, dol = A * rp / 100, sh = Math.floor(dol / rps), pos = sh * en, pa = pos / A;
    var tone = sd > 0.10 ? ["no", "🚨 Stop is " + (sd * 100).toFixed(1) + "% away. Too wide: he never lets a loss pass 10%. Find a tighter entry."] : sd > 0.08 ? ["mid", "🟠 " + (sd * 100).toFixed(1) + "% stop is on the wide side. Tighter setups give smaller losses."] : ["ok", "🟢 " + (sd * 100).toFixed(1) + "% stop. Nice and tight, very Minervini."];
    o.innerHTML = '<div class="gu-stats"><div><small>Max loss</small><b>' + money(dol) + '</b></div><div><small>Shares</small><b>' + sh.toLocaleString() + '</b></div><div><small>Position</small><b>' + money(pos) + '</b><em>' + (pa * 100).toFixed(0) + '% of account</em></div><div><small>2R target</small><b>' + money(en + rps * 2) + '</b></div><div><small>3R target</small><b>' + money(en + rps * 3) + '</b></div></div><p class="gu-' + tone[0] + '">' + tone[1] + (pa > 0.5 ? " Position is over half your account: consider a smaller risk %." : "") + '</p>';
  }

  /* quiz */
  var Q = { streak: 0, cur: null, mi: 0 };
  function pQuiz() {
    return '<section class="gu-card"><div class="gu-qtop"><h2>Quiz time 🎮</h2><div class="gu-seg"><button type="button" data-qm="chart">Would Mark buy it?</button><button type="button" data-qm="mcq">Rule quiz</button></div><div class="gu-streak">🔥 <b data-streak>' + Q.streak + '</b> streak · best ' + (S.best || 0) + '</div></div><div class="gu-qbody"></div></section>';
  }
  function quizNext(mode) {
    T.qmode = mode; [].forEach.call(host.querySelectorAll("[data-qm]"), function (b) { b.classList.toggle("on", b.dataset.qm === mode); });
    var b = host.querySelector(".gu-qbody"); if (!b) return;
    if (mode === "mcq") {
      var q = MCQ[Q.mi % MCQ.length]; Q.cur = { mcq: q };
      b.innerHTML = '<p class="gu-q">' + esc(q[0]) + '</p><div class="gu-opts">' + q[1].map(function (o, i) { return '<button type="button" data-qa="' + i + '">' + esc(o) + '</button>'; }).join("") + '</div><div class="gu-qres"></div>';
      return;
    }
    var keys = ["vcp", "vcp", "cup", "flat", "stage4", "stage1", "loose", "broke50", "extended"], k = keys[Math.floor(Math.random() * keys.length)], seed = Math.floor(Math.random() * 1e6);
    var K = gen(SHAPES[k](), seed), a = analyze(K, 0.08), buy = a.pass === 8 && (a.status === "near" || a.status === "vcp");
    Q.cur = { K: K, a: a, buy: buy };
    b.innerHTML = '<p class="gu-q">Mystery stock 🕵️. Would Minervini buy it here?</p><div class="gu-chart"><canvas data-qc></canvas></div><div class="gu-opts two"><button type="button" data-qb="1" class="yes">🟢 Buy (or watch the pivot)</button><button type="button" data-qb="0" class="no">🔴 Pass</button></div><div class="gu-qres"></div>';
    drawChart(b.querySelector("[data-qc]"), K, { h: 340 });
  }
  function quizAnswer(right, html) {
    if (right) { Q.streak++; if (Q.streak > (S.best || 0)) { S.best = Q.streak; save(); } addXp(10 + Math.min(20, Q.streak * 2), Q.streak > 2 ? Q.streak + " in a row!" : "correct"); if (Q.streak % 5 === 0) confetti(); }
    else Q.streak = 0;
    var st = host.querySelector("[data-streak]"); if (st) st.textContent = Q.streak;
    var r = host.querySelector(".gu-qres"); r.innerHTML = '<div class="gu-verdict ' + (right ? "ok" : "no") + '">' + (right ? "🎉 Correct!" : "😅 Not quite") + '</div>' + html + '<button type="button" class="gu-btn" data-qnext>Next ➜</button>';
    [].forEach.call(host.querySelectorAll(".gu-opts button"), function (x) { x.disabled = true; });
  }

  /* scanner */
  var SC = { run: false, done: 0, total: 0, rows: [], filt: "all", sel: null, stop: false };
  function pScan() {
    var signed = !!(window.stockspotSocial && window.stockspotSocial.candles);
    return '<section class="gu-card"><div class="gu-qtop"><div><h2>Minervini Scanner 🔎</h2><p class="gu-lead" style="margin:0">Checks every stock against all 8 Trend Template rules, then looks for a VCP near its pivot. Daily prices.</p></div><div class="gu-row"><button class="gu-btn big" type="button" data-scan>' + (SC.run ? "■ Stop" : "▶ Run scan") + '</button></div></div>' +
      (signed ? "" : '<p class="gu-warn">Sign in to scan real prices.</p>') +
      '<details class="gu-det"><summary>What it scans (' + UNIVERSE.length + ' leaders + your tickers)</summary><p class="gu-note">' + UNIVERSE.join(", ") + '</p><label class="gu-note">Add your own tickers (comma separated):<input class="gu-in" data-custom value="' + esc(S.custom || "") + '" placeholder="e.g. HIMS, ASTS, CRDO"></label></details>' +
      '<div class="gu-prog"' + (SC.run ? "" : " hidden") + '><i></i><span></span></div>' +
      '<div class="gu-seg gu-filt">' + [["all", "All results"], ["pass", "✅ 8/8"], ["vcp", "🌀 VCP"], ["near", "🎯 At pivot / 🔥 Breakout"], ["close", "🟡 Almost"]].map(function (f) { return '<button type="button" data-flt="' + f[0] + '">' + f[1] + '</button>'; }).join("") + '</div>' +
      '<div class="gu-sum"></div><div class="gu-tablewrap"><table class="gu-t"><thead><tr><th>Stock</th><th>Status</th><th>8 rules</th><th class="r">Price</th><th class="r">RS</th><th class="r">From high</th><th>Pullbacks</th><th class="r">Pivot</th><th class="r">To pivot</th></tr></thead><tbody></tbody></table></div><div class="gu-detail"></div>' +
      '<p class="gu-note">RS here is an estimate: the stock’s weighted 3, 6, 9 and 12-month gain compared with the S&P 500 (SPY), scaled 1–99. It’s not IBD’s official rating. Educational only, not financial advice.</p></section>';
  }
  function scanList() { var c = String(S.custom || "").toUpperCase().split(/[\s,]+/).filter(function (x) { return /^[A-Z][A-Z0-9.\-]{0,9}$/.test(x); }); return Array.from(new Set(c.concat(UNIVERSE))); }
  function scanRun() {
    if (SC.run) { SC.stop = true; return; }
    if (!(window.stockspotSocial && window.stockspotSocial.candles)) { toast("Sign in first to scan real prices"); return; }
    var list = scanList(); SC = { run: true, done: 0, total: list.length, rows: [], filt: SC.filt, sel: null, stop: false }; scanPaint();
    spyW().then(function (w) {
      var qi = 0, live = 0;
      function next() {
        if (SC.stop || qi >= list.length) { if (!live) finish(); return; }
        var sym = list[qi++]; live++;
        candles(sym).then(function (r) {
          var K = r.candles || [], a = K.length ? analyze(K, w) : { err: r.error || "no data" };
          if (!a.err) SC.rows.push({ sym: sym, a: a, K: K });
        }).catch(function () {}).then(function () { live--; SC.done++; scanProg(); if (SC.done % 6 === 0) scanTable(); next(); });
      }
      for (var i = 0; i < 4; i++) next();
    });
    function finish() {
      SC.run = false; scanPaint();
      S.scan = { t: Date.now(), rows: SC.rows.map(function (r) { return { sym: r.sym, a: slim(r.a) }; }) }; save();
      var hits = SC.rows.filter(function (r) { return r.a.pass === 8; }).length; addXp(15, "ran a scan"); toast(hits + " stocks passed all 8 rules");
    }
  }
  function slim(a) { return { c: a.c, rs: a.rs, pass: a.pass, R: a.R.map(function (r) { return { ok: r.ok, txt: r.txt, val: r.val }; }), status: a.status, label: a.label, hi52: a.hi52, dist: a.dist, stop: a.stop, vcp: { ok: a.vcp.ok, why: a.vcp.why, pivot: a.vcp.pivot, cs: a.vcp.cs.map(function (c) { return { d: c.d }; }) } }; }
  function scanProg() { var p = host.querySelector(".gu-prog"); if (!p) return; p.hidden = !SC.run; p.querySelector("i").style.width = (SC.total ? SC.done / SC.total * 100 : 0) + "%"; p.querySelector("span").textContent = "Scanning " + SC.done + " / " + SC.total + "…"; }
  function scanRows() {
    var rows = SC.rows.length || SC.run ? SC.rows : (S.scan && S.scan.rows || []);
    var order = { break: 0, near: 1, vcp: 2, trend: 3, ext: 4, close: 5, skip: 6 };
    rows = rows.filter(function (r) { var s = r.a.status; return SC.filt === "all" ? true : SC.filt === "pass" ? r.a.pass === 8 : SC.filt === "vcp" ? (s === "vcp" || s === "near" || s === "break") : SC.filt === "near" ? (s === "near" || s === "break") : s === "close"; });
    return rows.sort(function (x, y) { return (order[x.a.status] - order[y.a.status]) || (y.a.rs - x.a.rs); });
  }
  function scanPaint() {
    var b = host.querySelector("[data-scan]"); if (b) b.textContent = SC.run ? "■ Stop" : "▶ Run scan";
    [].forEach.call(host.querySelectorAll("[data-flt]"), function (x) { x.classList.toggle("on", x.dataset.flt === SC.filt); });
    scanProg(); scanTable();
  }
  function scanTable() {
    var tb = host.querySelector(".gu-t tbody"); if (!tb) return;
    var all = SC.rows.length || SC.run ? SC.rows : (S.scan && S.scan.rows || []), rows = scanRows(), sum = host.querySelector(".gu-sum");
    if (sum) { var c = function (f) { return all.filter(f).length; };
      sum.innerHTML = all.length ? '<div class="gu-chips"><span>📊 ' + all.length + ' scanned</span><span class="g">✅ ' + c(function (r) { return r.a.pass === 8; }) + ' pass 8/8</span><span class="p">🌀 ' + c(function (r) { return /vcp|near|break/.test(r.a.status); }) + ' VCP</span><span class="o">🎯 ' + c(function (r) { return /near|break/.test(r.a.status); }) + ' at pivot</span>' + (!SC.run && !SC.rows.length && S.scan ? '<span>🕒 last scan ' + ago(S.scan.t) + '</span>' : "") + '</div>' : '<p class="gu-note">Press <b>Run scan</b>. It takes about a minute to check ' + scanList().length + ' stocks.</p>'; }
    tb.innerHTML = rows.length ? rows.map(function (r) {
      var a = r.a, cs = a.vcp.cs || [];
      return '<tr data-row="' + esc(r.sym) + '" class="' + (SC.sel === r.sym ? "sel" : "") + '"><td><b>' + esc(r.sym) + '</b></td><td><span class="gu-tag ' + a.status + '">' + esc(a.label) + '</span></td><td><span class="gu-dots">' + a.R.map(function (x) { return '<i class="' + (x.ok ? "ok" : "") + '" title="' + esc(x.txt) + '"></i>'; }).join("") + '</span></td><td class="r">' + money(a.c) + '</td><td class="r"><b class="' + (a.rs >= 80 ? "gu-g" : a.rs >= 70 ? "" : "gu-r") + '">' + a.rs + '</b></td><td class="r">' + pct(a.c / a.hi52 - 1) + '</td><td>' + (cs.length ? cs.map(function (c) { return Math.round(c.d * 100) + "%"; }).join(" → ") : "–") + '</td><td class="r">' + (a.vcp.pivot ? money(a.vcp.pivot) : "–") + '</td><td class="r">' + (a.dist != null ? pct(-a.dist) : "–") + '</td></tr>';
    }).join("") : (all.length ? '<tr><td colspan="9" class="gu-note">Nothing matches this filter right now.</td></tr>' : "");
  }
  function ago(t) { var m = Math.round((Date.now() - t) / 6e4); return m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " days ago"; }
  function scanDetail(sym) {
    SC.sel = sym; scanTable(); var d = host.querySelector(".gu-detail"); d.innerHTML = '<p class="gu-note">Loading ' + esc(sym) + '…</p>';
    Promise.all([candles(sym), spyW()]).then(function (r) {
      var K = r[0].candles || []; if (!K.length) { d.innerHTML = '<p class="gu-warn">Could not load ' + esc(sym) + '.</p>'; return; }
      var a = analyze(K, r[1]), piv = a.vcp.pivot, risk = piv ? (piv - a.stop) / piv : null;
      d.innerHTML = '<div class="gu-dcard"><div class="gu-dh"><h3>' + esc(sym) + ' <span class="gu-tag ' + a.status + '">' + esc(a.label) + '</span></h3><button type="button" class="gu-x" data-dclose aria-label="Close">✕</button></div>' +
        '<div class="gu-chart"><canvas></canvas></div>' +
        '<div class="gu-dgrid"><div class="gu-lights sm">' + a.R.map(function (x) { return '<div class="gu-light ' + (x.ok ? "ok" : "no") + '"><i>' + (x.ok ? "✓" : "✗") + '</i><b>' + esc(x.txt) + '</b><small>' + esc(x.val) + '</small></div>'; }).join("") + '</div>' +
        '<div class="gu-plan2"><h4>🌀 Setup</h4><p>' + esc(a.vcp.why || "") + '</p><p>Volume last 10 days vs 50-day average: <b>' + (a.vd * 100).toFixed(0) + '%</b> ' + (a.vd < 0.85 ? "🟢 drying up" : "🟠 not quiet yet") + '</p>' +
        (piv && a.pass === 8 ? '<h4>🎯 Minervini-style plan</h4><div class="gu-stats"><div><small>Buy at pivot</small><b>' + money(piv) + '</b></div><div><small>Stop</small><b>' + money(a.stop) + '</b><em>' + (risk * 100).toFixed(1) + '% risk</em></div><div><small>3R target</small><b>' + money(piv + (piv - a.stop) * 3) + '</b></div></div><button type="button" class="gu-btn" data-tocalc="' + piv.toFixed(2) + "|" + a.stop.toFixed(2) + '">Size this trade in the calculator →</button>' : '<p class="gu-note">No buy plan: it needs all 8 rules plus a tight setup first.</p>') + '</div></div></div>';
      drawChart(d.querySelector("canvas"), K, { vcp: a.vcp, pivot: a.pass === 8 ? piv : null, stop: a.pass === 8 && piv ? a.stop : null, h: 400 });
      d.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  /* ---------------- events ---------------- */
  document.addEventListener("click", function (e) {
    if (!host || !host.contains(e.target)) return; var t = e.target, el;
    if ((el = t.closest("[data-gtab]"))) return tab(el.dataset.gtab);
    if ((el = t.closest("[data-go]"))) { tab(el.dataset.go); host.scrollIntoView({ behavior: "smooth" }); return; }
    if ((el = t.closest("[data-stg]"))) return stageSel(+el.dataset.stg);
    if ((el = t.closest("[data-tt]"))) { el.classList.toggle("flip"); if (learn("tt" + el.dataset.tt, 10, "rule " + (+el.dataset.tt + 1))) el.classList.add("done"); if (Object.keys(S.learned).filter(function (k) { return /^tt/.test(k); }).length === 8 && learn("ttall", 30, "all 8 rules!")) confetti(); return; }
    if ((el = t.closest("[data-rule]"))) { el.classList.add("done", "pop"); setTimeout(function () { el.classList.remove("pop"); }, 400); learn("r" + el.dataset.rule, 8, "golden rule"); return; }
    if (t.closest("[data-vplay]")) {
      if (VA.t) clearInterval(VA.t); var K = gen(vcpSpec(), 11), i = K.length - 150; VA.t = setInterval(function () { i += 2; vcpDraw(i); if (i >= K.length) { clearInterval(VA.t); VA.t = null; var a = vcpDraw(); if (a && a.ok) learn("vcp", 20, "built a VCP"); } }, 28); return;
    }
    if ((el = t.closest("[data-pplay]"))) { var k = el.dataset.pplay, Kp = gen(SHAPES[k]().concat([[3, 7, .01, 2.6]]), 21 + k.length), j = Kp.length - 130, tm = setInterval(function () { j += 2; patDraw(k, j); if (j >= Kp.length) { clearInterval(tm); patDraw(k); learn("pat-" + k, 6, "pattern"); } }, 25); return; }
    if ((el = t.closest("[data-qm]"))) return quizNext(el.dataset.qm);
    if ((el = t.closest("[data-qa]"))) {
      var q = Q.cur.mcq, ok = +el.dataset.qa === q[2]; el.classList.add(ok ? "right" : "wrong");
      host.querySelector('[data-qa="' + q[2] + '"]').classList.add("right"); Q.mi++;
      return quizAnswer(ok, '<p>' + esc(q[3]) + '</p>');
    }
    if ((el = t.closest("[data-qb]"))) {
      var c = Q.cur, said = el.dataset.qb === "1", okc = said === c.buy;
      var fails = c.a.R.filter(function (r) { return !r.ok; });
      var why = c.buy ? '<p>All 8 rules pass ✅ and the base is tight: ' + esc(c.a.vcp.why) + '. He’d buy at the green pivot with a stop under the last pullback.</p>'
        : fails.length ? '<p>It breaks ' + fails.length + ' rule' + (fails.length > 1 ? "s" : "") + ':</p><ul class="gu-ul">' + fails.map(function (r) { return '<li>✗ ' + esc(r.txt) + ' <small>(' + esc(r.val) + ')</small></li>'; }).join("") + '</ul>'
          : '<p>The trend passes all 8 rules, but there’s no tight, low-risk entry right now (' + esc(c.a.status === "ext" ? "it’s extended above its pivot: chasing means a wide stop" : c.a.vcp.why) + '). He waits.</p>';
      drawChart(host.querySelector("[data-qc]"), c.K, { h: 340, vcp: c.a.vcp, pivot: c.buy ? c.a.vcp.pivot : null, stop: c.buy ? c.a.stop : null });
      return quizAnswer(okc, why);
    }
    if (t.closest("[data-qnext]")) return quizNext(T.qmode);
    if (t.closest("[data-scan]")) return scanRun();
    if ((el = t.closest("[data-flt]"))) { SC.filt = el.dataset.flt; return scanPaint(); }
    if ((el = t.closest("[data-row]"))) return scanDetail(el.dataset.row);
    if (t.closest("[data-dclose]")) { host.querySelector(".gu-detail").innerHTML = ""; SC.sel = null; return scanTable(); }
    if ((el = t.closest("[data-tocalc]"))) { var pr = el.dataset.tocalc.split("|"); S.en = +pr[0]; S.sp = +pr[1]; save(); tab("risk"); return; }
  });
  document.addEventListener("input", function (e) {
    if (!host || !host.contains(e.target)) return; var t = e.target;
    if (t.dataset.vs) { VA[t.dataset.vs] = +t.value; var o = host.querySelector('[data-vo="' + t.dataset.vs + '"]'); if (o) o.textContent = t.value + (t.dataset.vs === "n" ? "" : "%"); vcpDraw(); return; }
    if (t.dataset.rk) return riskCalc();
    if (t.hasAttribute("data-custom")) { S.custom = t.value; save(); }
  });
  document.addEventListener("submit", function (e) {
    if (!host || !host.contains(e.target)) return;
    if (e.target.hasAttribute("data-ttform")) { e.preventDefault(); ttCheck(e.target.t.value); }
  });
  var rz = null; window.addEventListener("resize", function () { if (!host || host.hidden || !host.querySelector(".gu")) return; clearTimeout(rz); rz = setTimeout(function () { after(T.tab === "quiz" ? "" : T.tab); if (T.tab === "quiz" && Q.cur && Q.cur.K) drawChart(host.querySelector("[data-qc]"), Q.cur.K, { h: 340 }); }, 150); });

  /* ---------------- styles ---------------- */
  function injectCss() {
    if (document.getElementById("gu-css")) return;
    var c = '#guruv{max-width:none!important;width:100%;box-sizing:border-box;padding-left:28px;padding-right:28px}@media(max-width:760px){#guruv{padding-left:12px;padding-right:12px}}.gu{--g:#16a34a;--g2:#22c55e;--gold:#f59e0b;--pk:#ec4899;--bl:#2563eb;--pu:#a855f7;width:100%;padding:8px 0 40px;font-family:"Instrument Sans",sans-serif;color:var(--ink)}' +
      '.gu-hero{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:20px;padding:30px 32px;border-radius:24px;color:#fff;background:radial-gradient(1200px 300px at 0% 0%,#22c55e55,transparent),radial-gradient(800px 300px at 100% 100%,#f59e0b44,transparent),linear-gradient(135deg,#052e1a,#0b3d2a 55%,#11221a);position:relative;overflow:hidden}' +
      '.gu-hero::after{content:"";position:absolute;right:-40px;top:-30px;width:320px;height:200px;background:repeating-linear-gradient(90deg,transparent 0 14px,#ffffff10 14px 22px);transform:skewY(-12deg)}' +
      '.gu-hl{max-width:900px;position:relative;z-index:1}.gu-eye{margin:0 0 6px;font:800 .72rem "Instrument Sans",sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#86efac}.gu-hero h1{margin:0;font:800 clamp(2rem,4vw,3.3rem)/1.02 "Instrument Sans",sans-serif;letter-spacing:-.02em}.gu-hero h1 span{background:linear-gradient(90deg,#86efac,#fde047);-webkit-background-clip:text;background-clip:text;color:transparent}.gu-sub{margin:12px 0 0;font-size:1.05rem;line-height:1.5;color:#d1fae5;max-width:780px}' +
      '.gu-xp{position:relative;z-index:1;min-width:260px;background:#ffffff14;border:1px solid #ffffff2a;border-radius:18px;padding:14px 16px;backdrop-filter:blur(4px)}.gu-lv{display:flex;align-items:center;gap:12px}.gu-badge{font-size:2rem;line-height:1}.gu-lv b{display:block;font-size:1.05rem}.gu-lv small{color:#bbf7d0}.gu-bar{margin-top:10px;height:10px;border-radius:9px;background:#ffffff22;overflow:hidden}.gu-bar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#22c55e,#fde047);transition:width .6s cubic-bezier(.2,.8,.2,1)}' +
      '.gu-tabs{position:sticky;top:0;z-index:5;display:flex;gap:8px;overflow-x:auto;padding:14px 2px;margin:4px 0 6px;background:var(--bg);scrollbar-width:none}.gu-tabs button{flex:none;display:flex;align-items:center;gap:8px;padding:11px 18px;border-radius:999px;border:1.5px solid var(--line);background:var(--panel);color:var(--ink);font:700 .95rem "Instrument Sans",sans-serif;cursor:pointer;transition:transform .15s,background .15s}.gu-tabs button i{font-style:normal;font-size:1.1rem}.gu-tabs button:hover{transform:translateY(-2px);border-color:var(--g)}.gu-tabs button.on{background:var(--g);border-color:var(--g);color:#fff;box-shadow:0 6px 18px #16a34a55}' +
      '.gu-body{animation:guIn .35s ease}@keyframes guIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
      '.gu-card{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:24px 26px;margin:0 0 18px}.gu-card h2{margin:0 0 6px;font:800 1.45rem "Instrument Sans",sans-serif}.gu-lead{margin:0 0 16px;font-size:1.04rem;line-height:1.55;color:var(--mute)}.gu-lead b{color:var(--ink)}.gu-big .gu-lead{font-size:1.3rem;color:var(--ink)}.gu-h{margin:22px 4px 12px;font:800 .8rem "Instrument Sans",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}.gu-note{color:var(--mute);font-size:.88rem;line-height:1.5}' +
      '.gu-path{display:flex;align-items:stretch;gap:8px;flex-wrap:wrap}.gu-arrow{align-self:center;font-style:normal;font-size:1.4rem;color:var(--mute)}.gu-stop{flex:1 1 150px;display:flex;flex-direction:column;gap:4px;align-items:flex-start;text-align:left;padding:18px;border-radius:18px;border:1.5px solid var(--line);background:var(--panel);color:var(--ink);cursor:pointer;animation:guIn .5s both;animation-delay:var(--d);transition:transform .15s}.gu-stop:hover{transform:translateY(-3px) rotate(-.5deg);border-color:var(--g)}.gu-stop b{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--g);color:#fff;font-size:1.2rem}.gu-stop span{font-weight:800;font-size:1.05rem}.gu-stop small{color:var(--mute)}' +
      '.gu-grid4{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}.gu-plan,.gu-mini{display:flex;flex-direction:column;gap:4px;align-items:flex-start;text-align:left;padding:18px;border-radius:18px;border:1.5px solid var(--line);background:var(--panel);color:var(--ink)}.gu-plan{cursor:pointer;transition:transform .15s}.gu-plan:hover{transform:translateY(-3px);border-color:var(--g);box-shadow:0 10px 24px #16a34a22}.gu-plan i,.gu-mini i{font-style:normal;font-size:1.8rem}.gu-plan b,.gu-mini b{font-size:1.02rem}.gu-plan small,.gu-mini span{color:var(--mute);line-height:1.45}' +
      '.gu-stbtns{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.gu-stbtns button{padding:14px;border-radius:16px;border:2px solid var(--c);background:color-mix(in srgb,var(--c) 10%,var(--panel));color:var(--ink);cursor:pointer;text-align:left;transition:transform .15s}.gu-stbtns button:hover{transform:translateY(-2px)}.gu-stbtns button.on{background:var(--c);color:#fff}.gu-stbtns b{display:block;font-size:1.05rem}.gu-stbtns small{opacity:.8}' +
      '.gu-stsvg{width:100%;height:auto;max-height:360px;display:block;border-radius:16px;background:color-mix(in srgb,var(--ink) 3%,transparent)}.gu-stsvg .z{transition:opacity .3s}.gu-stp{stroke:var(--ink);stroke-dasharray:3000;stroke-dashoffset:3000;animation:guDraw 1.6s ease forwards}@keyframes guDraw{to{stroke-dashoffset:0}}.gu-dot{filter:drop-shadow(0 0 6px #0006)}' +
      '.gu-stcard{display:flex;gap:16px;align-items:center;margin-top:14px;padding:16px 18px;border-radius:16px;border-left:6px solid var(--c);background:color-mix(in srgb,var(--c) 10%,var(--panel));animation:guIn .3s}.gu-emo{font-size:2.6rem}.gu-stcard p{margin:4px 0 0;line-height:1.5}.gu-yes{font-style:normal;margin-left:8px;padding:3px 10px;border-radius:99px;font-size:.72rem;letter-spacing:.08em;color:#fff;background:var(--g)}.gu-yes.gu-nobuy{background:#ef4444}' +
      '.gu-ttgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.gu-flip{position:relative;height:190px;border:0;padding:0;background:none;cursor:pointer;perspective:900px;color:var(--ink)}.gu-flip>span{position:absolute;inset:0;display:flex;flex-direction:column;gap:6px;justify-content:center;align-items:flex-start;text-align:left;padding:18px;border-radius:18px;backface-visibility:hidden;transition:transform .55s cubic-bezier(.2,.8,.2,1);border:1.5px solid var(--line);background:var(--panel)}.gu-flip .f i{font-style:normal;font-size:1.9rem}.gu-flip .f b{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--g)}.gu-flip .f span{font-weight:800;font-size:1.05rem;line-height:1.3}.gu-flip .f small{color:var(--mute);margin-top:auto}.gu-flip .b{transform:rotateY(180deg);background:linear-gradient(135deg,#16a34a,#0f766e);color:#fff;border:0}.gu-flip .b span{line-height:1.5}.gu-flip.flip .f{transform:rotateY(-180deg)}.gu-flip.flip .b{transform:rotateY(0)}.gu-flip.done .f{border-color:var(--g)}.gu-flip.done .f::after{content:"✓ learned";position:absolute;top:14px;right:14px;font:800 .7rem "Instrument Sans",sans-serif;color:var(--g)}' +
      '.gu-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.gu-in{box-sizing:border-box;width:100%;padding:11px 14px;border:1.5px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font:600 1rem "Instrument Sans",sans-serif}.gu-in:focus{outline:0;border-color:var(--g)}.gu-btn{padding:11px 20px;border:0;border-radius:12px;background:var(--g);color:#fff;font:800 .95rem "Instrument Sans",sans-serif;cursor:pointer;transition:transform .15s,box-shadow .15s}.gu-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px #16a34a44}.gu-btn.big{padding:14px 26px;font-size:1.05rem}' +
      '.gu-score{display:flex;align-items:center;gap:14px;margin:16px 0 10px}.gu-score .s{font-size:2.4rem;font-weight:800;color:#ef4444}.gu-score .s.ok{color:var(--g)}.gu-score span{font-weight:700;font-size:1.05rem}' +
      '.gu-lights{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-bottom:14px}.gu-light{display:grid;grid-template-columns:30px 1fr;gap:0 10px;align-items:center;padding:10px 12px;border-radius:14px;border:1.5px solid var(--line);animation:guPop .4s both;animation-delay:var(--d,0ms)}.gu-light i{grid-row:span 2;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:800;color:#fff;background:#ef4444}.gu-light.ok i{background:var(--g);box-shadow:0 0 12px #22c55e88}.gu-light.ok{border-color:#16a34a66}.gu-light b{font-size:.9rem}.gu-light small{color:var(--mute);font-size:.8rem}@keyframes guPop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}.gu-lights.sm{grid-template-columns:1fr}' +
      '.gu-chart{width:100%;margin:6px 0}.gu-chart canvas{display:block;border-radius:14px;background:color-mix(in srgb,var(--ink) 2.5%,transparent)}' +
      '.gu-ctl{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;align-items:end;margin-bottom:12px}.gu-ctl label{display:flex;flex-direction:column;gap:6px;font-weight:700;font-size:.9rem}.gu-ctl label b{color:var(--pk)}.gu-ctl input[type=range]{accent-color:#ec4899;width:100%}' +
      '.gu-ok,.gu-warn,.gu-mid,.gu-no{padding:12px 14px;border-radius:12px;font-weight:600;line-height:1.5}.gu-ok{background:#16a34a1a;color:var(--ink);border-left:4px solid var(--g)}.gu-warn,.gu-no{background:#ef44441a;border-left:4px solid #ef4444}.gu-mid{background:#f59e0b1f;border-left:4px solid var(--gold)}' +
      '.gu-pgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}.gu-pcard{border:1.5px solid var(--line);border-radius:18px;padding:14px 16px}.gu-pcard p{margin:6px 0 0;color:var(--mute);line-height:1.45}.gu-ph{display:flex;justify-content:space-between;align-items:center}.gu-ph b{font-size:1.08rem}.gu-pill{width:34px;height:34px;border-radius:50%;border:0;background:var(--g);color:#fff;cursor:pointer;font-size:.85rem}' +
      '.gu-rgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}.gu-rule{display:flex;flex-direction:column;gap:6px;align-items:flex-start;text-align:left;padding:18px;border-radius:18px;border:1.5px solid var(--line);background:var(--panel);color:var(--ink);cursor:pointer;transition:transform .15s}.gu-rule:hover{transform:translateY(-2px)}.gu-rule i{font-style:normal;font-size:1.8rem}.gu-rule b{font-size:1.05rem}.gu-rule span{color:var(--mute);line-height:1.5}.gu-rule.done{border-color:var(--g);background:color-mix(in srgb,#16a34a 7%,var(--panel))}.gu-rule.pop{animation:guPop .35s}' +
      '.gu-calc{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.gu-calc label{display:flex;flex-direction:column;gap:6px;font-weight:700;font-size:.88rem}.gu-calcout{margin-top:14px}.gu-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:12px}.gu-stats div{padding:14px;border-radius:14px;background:color-mix(in srgb,var(--ink) 4%,transparent)}.gu-stats small{display:block;color:var(--mute);font-weight:700;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em}.gu-stats b{font-size:1.35rem}.gu-stats em{display:block;font-style:normal;color:var(--mute);font-size:.8rem}' +
      '.gu-qtop{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.gu-seg{display:flex;gap:6px;flex-wrap:wrap}.gu-seg button{padding:9px 16px;border-radius:99px;border:1.5px solid var(--line);background:var(--panel);color:var(--ink);font:700 .88rem "Instrument Sans",sans-serif;cursor:pointer}.gu-seg button.on{background:var(--ink);color:var(--panel);border-color:var(--ink)}.gu-streak{font-weight:700;padding:8px 14px;border-radius:99px;background:#f59e0b22}' +
      '.gu-q{font:800 1.2rem "Instrument Sans",sans-serif;margin:4px 0 12px}.gu-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.gu-opts.two{grid-template-columns:1fr 1fr}.gu-opts button{padding:16px;border-radius:16px;border:2px solid var(--line);background:var(--panel);color:var(--ink);font:700 1rem "Instrument Sans",sans-serif;cursor:pointer;transition:transform .12s}.gu-opts button:hover:not(:disabled){transform:translateY(-2px);border-color:var(--g)}.gu-opts button.yes{border-color:#16a34a88}.gu-opts button.no{border-color:#ef444488}.gu-opts button:disabled{cursor:default;color:var(--ink)}.gu-opts button:disabled:not(.right):not(.wrong){opacity:.45}.gu-opts button.right{background:var(--g);color:#fff!important;border-color:var(--g)}.gu-opts button.wrong{background:#ef4444;color:#fff!important;border-color:#ef4444;animation:guShake .4s}@keyframes guShake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}' +
      '.gu-qres{margin-top:14px}.gu-qres p{line-height:1.55}.gu-verdict{font:800 1.4rem "Instrument Sans",sans-serif;animation:guPop .35s}.gu-verdict.ok{color:var(--g)}.gu-verdict.no{color:#ef4444;background:none;border:0;padding:0}.gu-ul{margin:4px 0 12px;padding-left:4px;list-style:none;line-height:1.7}' +
      '.gu-det{margin:4px 0 12px}.gu-det summary{cursor:pointer;font-weight:700}.gu-det label{display:flex;flex-direction:column;gap:6px;max-width:520px}.gu-prog{position:relative;height:30px;border-radius:99px;background:color-mix(in srgb,var(--ink) 6%,transparent);overflow:hidden;margin:6px 0 12px}.gu-prog i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#16a34a,#22c55e,#fde047);transition:width .3s}.gu-prog span{position:relative;display:block;text-align:center;line-height:30px;font-weight:800;font-size:.85rem}' +
      '.gu-filt{margin:6px 0 10px}.gu-chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px}.gu-chips span{padding:7px 12px;border-radius:99px;font-weight:700;font-size:.85rem;background:color-mix(in srgb,var(--ink) 6%,transparent)}.gu-chips .g{background:#16a34a22}.gu-chips .p{background:#ec489922}.gu-chips .o{background:#f59e0b22}' +
      '.gu-tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:16px}.gu-t{width:100%;border-collapse:collapse;font-size:.92rem}.gu-t th{text-align:left;padding:11px 12px;font:800 .72rem "Instrument Sans",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);border-bottom:1px solid var(--line);white-space:nowrap}.gu-t td{padding:10px 12px;border-bottom:1px solid var(--line);white-space:nowrap}.gu-t .r{text-align:right}.gu-t tbody tr{cursor:pointer;transition:background .12s}.gu-t tbody tr:hover,.gu-t tbody tr.sel{background:color-mix(in srgb,#16a34a 9%,transparent)}.gu-g{color:var(--g)}.gu-r{color:#ef4444}' +
      '.gu-dots{display:inline-flex;gap:3px}.gu-dots i{width:10px;height:10px;border-radius:50%;background:#ef444466}.gu-dots i.ok{background:var(--g)}.gu-tag{display:inline-block;padding:4px 10px;border-radius:99px;font-weight:700;font-size:.8rem;background:color-mix(in srgb,var(--ink) 7%,transparent)}.gu-tag.break{background:#f9731633;color:var(--ink)}.gu-tag.near{background:#f59e0b33}.gu-tag.vcp{background:#ec489926}.gu-tag.trend{background:#16a34a26}.gu-tag.ext{background:#2563eb22}.gu-tag.close{background:#eab30826}' +
      '.gu-dcard{margin-top:16px;padding:18px;border:2px solid var(--g);border-radius:20px;animation:guIn .3s}.gu-dh{display:flex;justify-content:space-between;align-items:center}.gu-dh h3{margin:0;font:800 1.4rem "Instrument Sans",sans-serif;display:flex;gap:10px;align-items:center}.gu-x{width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:var(--panel);color:var(--ink);cursor:pointer}.gu-dgrid{display:grid;grid-template-columns:minmax(260px,1fr) 2fr;gap:16px;margin-top:8px}.gu-plan2 h4{margin:4px 0 8px;font:800 1rem "Instrument Sans",sans-serif}.gu-plan2 p{margin:0 0 10px;line-height:1.5}' +
      '.gu-toasts{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none}.gu-toast{padding:12px 16px;border-radius:14px;background:#0b3d2a;color:#fff;font:800 .95rem "Instrument Sans",sans-serif;box-shadow:0 10px 30px #0005;animation:guToast .35s cubic-bezier(.2,1.4,.4,1)}.gu-toast.out{opacity:0;transform:translateY(10px);transition:.4s}@keyframes guToast{from{opacity:0;transform:translateY(16px) scale(.9)}to{opacity:1;transform:none}}' +
      '.gu-conf{position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden}.gu-conf i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:guFall 2.2s ease-in forwards}@keyframes guFall{to{top:105%;transform:rotate(720deg) translateX(40px)}}' +
      '@media(max-width:760px){.gu-hero{padding:22px 18px}.gu-card{padding:18px 16px}.gu-stbtns{grid-template-columns:1fr 1fr}.gu-dgrid{grid-template-columns:1fr}.gu-opts.two{grid-template-columns:1fr}.gu-pgrid{grid-template-columns:1fr}.gu-arrow{display:none}}' +
      '@media(prefers-reduced-motion:reduce){.gu *{animation:none!important;transition:none!important}.gu-stp{stroke-dashoffset:0}}';
    var st = document.createElement("style"); st.id = "gu-css"; st.textContent = c; document.head.appendChild(st);
  }

  window.Gurus = { mount: mount, _analyze: analyze, _gen: gen, _shapes: SHAPES, _findVcp: findVcp };
})();
