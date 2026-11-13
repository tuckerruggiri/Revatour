/* Revatour Backtest Lab: "Teach it by marking" tab.
   Pick a real chart, highlight the part you care about, click candles and label them (HIGH, BREAK, LOWER HIGH, TRIGGER,
   RESTART, ENTRY, STOP, TARGET). The Lab reads your marks and writes the strategy rules from them. */
(function () {
  "use strict";
  var E = window.BTEngine, KEY = "revatour-bt-teach-v1", X = null, root = null;
  var T = { setups: [], cur: null, tool: "select", label: "HIGH", custom: "", sel: {}, made: null, msg: "" }, G = null, DR = null;
  var LABELS = [
    ["HIGH", "The marker candle the whole setup starts from", "#c0392b", 1],
    ["BREAK", "The candle that breaks the HIGH's low", "#e67e22", 1],
    ["LOWER HIGH", "A bounce that fails to reach the HIGH", "#8e44ad", 1],
    ["TRIGGER", "The signal candle (mark every one you would trade)", "#2471a3", 1],
    ["RESTART", "Price went above the HIGH, so the count starts over", "#5d6d7e", 1],
    ["ENTRY", "The candle you got in on", "#1e8449", 0],
    ["STOP", "The candle whose extreme is your stop", "#b9770e", 0],
    ["TARGET", "A candle where you took profit (mark 1 to 3)", "#117a65", 0]
  ];
  var LC = {}; LABELS.forEach(function (l) { LC[l[0]] = l[2]; });

  function ex() { return X || (X = window.BacktestLab && window.BacktestLab._x); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
  function uid() { return "m" + Date.now().toString(36) + Math.floor(Math.random() * 1e4); }
  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || "{}"); T.setups = d.setups || []; T.cur = d.cur || null; T.sel = d.sel || {}; } catch (e) { } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ setups: T.setups, cur: T.cur, sel: T.sel })); } catch (e) { } }
  function key(sc) { return sc.name + "|" + sc.c.length; }
  function pool() { var q = ex(), l = []; if (q && q.S.sim.c.length) l.push({ name: "Current chart", pc: q.S.sim.pc, tf: q.S.sim.tf, c: q.S.sim.c, vw: q.S.sim.vw, em: q.S.sim.em, gap: q.S.sim.gap }); if (q) q.S.scenes.forEach(function (s) { l.push(s); }); return l; }
  function sceneOf(s) { var l = pool(); for (var i = 0; i < l.length; i++) if (key(l[i]) === s.key) return l[i]; return null; }
  function cs() { return T.setups.filter(function (s) { return s.id === T.cur; })[0] || null; }
  function newSetup(sc) { var n = T.setups.filter(function (s) { return s.key === key(sc); }).length + 1, s = { id: uid(), key: key(sc), name: sc.name + " setup " + n, a: null, b: null, view: null, marks: [] }; T.setups.push(s); T.cur = s.id; save(); return s; }
  function clean() { var keys = pool().map(key); T.setups = T.setups.filter(function (s) { return keys.indexOf(s.key) >= 0; }); if (!cs()) T.cur = T.setups.length ? T.setups[0].id : null; }

  /* ---------- chart ---------- */
  function paint() {
    var el = root && root.querySelector("#tc-chart"); if (!el) return; var s = cs(), sc = s && sceneOf(s); if (!sc) { el.innerHTML = ""; return; }
    var P = E.prep(sc), n = P.n, vs = 0, ve = n - 1; if (s.view) { vs = Math.max(0, s.view[0]); ve = Math.min(n - 1, s.view[1]); }
    var W = Math.max(520, el.clientWidth || 900), padL = 8, padR = 62, top = 30, ph = 400, gap = 12, vh = 70, bot = 34, H = top + ph + gap + vh + bot, cnt = ve - vs + 1, sw = (W - padL - padR) / cnt, bw = Math.max(1.5, Math.min(26, sw * 0.62)), i;
    var lo = Infinity, hi = -Infinity, vmax = 1; for (i = vs; i <= ve; i++) { lo = Math.min(lo, P.L[i], P.vw[i], P.em[i]); hi = Math.max(hi, P.H[i], P.vw[i], P.em[i]); vmax = Math.max(vmax, P.V[i]); }
    var padp = (hi - lo) * 0.14 || 0.1; lo -= padp; hi += padp * 1.4;
    var Y = function (p) { return top + (hi - p) / (hi - lo) * ph; }, X0 = function (j) { return padL + (j - vs + 0.5) * sw; }, VY = function (v) { return top + ph + gap + vh - v / vmax * vh; };
    G = { padL: padL, sw: sw, vs: vs, ve: ve, W: W, top: top, ph: ph, H: H };
    var o = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="touch-action:none;user-select:none;display:block" role="img" aria-label="Candle chart">';
    for (i = 0; i <= 6; i++) { var pv = lo + (hi - lo) * i / 6; o += '<line x1="0" x2="' + (W - padR) + '" y1="' + Y(pv) + '" y2="' + Y(pv) + '" class="bt-g"/><text x="' + (W - padR + 6) + '" y="' + (Y(pv) + 4) + '" class="bt-ax">' + f2(pv) + '</text>'; }
    if (s.a != null) o += '<rect x="' + (X0(s.a) - sw / 2) + '" y="' + top + '" width="' + ((s.b - s.a + 1) * sw) + '" height="' + (ph + gap + vh) + '" fill="#d4a017" opacity=".13"/>';
    var step = Math.max(1, Math.ceil(cnt / Math.floor((W - padR) / 74)));
    for (i = vs; i <= ve; i++) {
      var x = X0(i), up = P.C[i] >= P.O[i], col = up ? "var(--gain)" : "var(--loss)", yb = Y(Math.max(P.O[i], P.C[i])), yt = Y(Math.min(P.O[i], P.C[i]));
      o += '<line x1="' + x + '" x2="' + x + '" y1="' + Y(P.H[i]) + '" y2="' + Y(P.L[i]) + '" stroke="' + col + '" stroke-width="1.4"/><rect x="' + (x - bw / 2) + '" y="' + yb + '" width="' + bw + '" height="' + Math.max(1.2, yt - yb) + '" fill="' + col + '"/><rect x="' + (x - Math.max(1, bw / 2)) + '" y="' + VY(P.V[i]) + '" width="' + Math.max(2, bw) + '" height="' + (top + ph + gap + vh - VY(P.V[i])) + '" fill="' + col + '" opacity=".45"/>';
      if ((i - vs) % step === 0) { var m = 570 + i * (sc.tf || 2); o += '<text x="' + x + '" y="' + (H - 18) + '" text-anchor="middle" class="bt-ax">' + Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2) + '</text><text x="' + x + '" y="' + (H - 5) + '" text-anchor="middle" class="bt-ax" style="opacity:.6">#' + (i + 1) + '</text>'; }
    }
    function line(arr, c) { var d = ""; for (var j = vs; j <= ve; j++) d += (j > vs ? "L" : "M") + X0(j).toFixed(1) + " " + Y(arr[j]).toFixed(1); return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="2"/>'; }
    o += line(P.vw, "#d4a017") + line(P.em, "#2b7de0") + '<text x="' + (padL + 4) + '" y="14" class="bt-ax"><tspan fill="#d4a017">&#9632; VWAP</tspan>  <tspan fill="#2b7de0">&#9632; 9 EMA</tspan></text>';
    var stackU = {}, stackD = {};
    (s.marks || []).slice().sort(function (a, b) { return a.i - b.i; }).forEach(function (mk) {
      if (mk.i < vs || mk.i > ve) return; var below = mk.l === "ENTRY" || mk.l === "STOP" || mk.l === "TARGET", c = LC[mk.l] || "#566573", w = mk.l.length * 6.4 + 12, x = X0(mk.i), st = below ? (stackD[mk.i] = (stackD[mk.i] || 0) + 1) : (stackU[mk.i] = (stackU[mk.i] || 0) + 1), y = below ? Y(P.L[mk.i]) + 8 + (st - 1) * 18 : Y(P.H[mk.i]) - 8 - st * 18 + 4;
      o += '<line x1="' + x + '" x2="' + x + '" y1="' + (below ? Y(P.L[mk.i]) : Y(P.H[mk.i])) + '" y2="' + (below ? y : y + 14) + '" stroke="' + c + '" stroke-width="1.4"/><rect x="' + (x - w / 2) + '" y="' + y + '" width="' + w + '" height="15" rx="4" fill="' + c + '"/><text x="' + x + '" y="' + (y + 11) + '" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">' + esc(mk.l) + '</text>';
    });
    o += '<rect id="tc-sel" x="0" y="' + top + '" width="0" height="' + ph + '" fill="#2b7de0" opacity=".18" pointer-events="none"/><rect id="tc-hit" x="0" y="0" width="' + W + '" height="' + H + '" fill="transparent" style="cursor:' + (T.tool === "mark" ? "pointer" : "crosshair") + '"/></svg><div id="tc-tip" class="tc-tip" hidden></div>';
    el.innerHTML = o;
  }
  function idxAt(cx) { var el = root.querySelector("#tc-chart svg"); if (!el || !G) return -1; var r = el.getBoundingClientRect(), i = G.vs + Math.floor((cx - r.left - G.padL) / G.sw); return Math.max(G.vs, Math.min(G.ve, i)); }

  /* ---------- facts about a candle ---------- */
  var SHAPES = ["doji", "hammer", "inv", "spin", "inside", "outside"];
  var SHN = { doji: "doji", hammer: "hammer", inv: "inverted hammer", spin: "spinning top", inside: "inside bar", outside: "outside bar" };
  function facts(P, i, a) {
    var o = {}; o.i = i; o.green = P.C[i] > P.O[i]; o.red = P.C[i] < P.O[i];
    ["bodyPct", "upWickPct", "loWickPct", "relVol", "vwapDist", "gapPct"].forEach(function (k) { o[k] = E.fv(P, k, i, a); });
    o.belowV = P.C[i] < P.vw[i]; o.aboveV = P.C[i] > P.vw[i]; o.belowE = P.C[i] < P.em[i]; o.aboveE = P.C[i] > P.em[i];
    o.newHod = E.isTest(P, "newHod", i); o.tags = SHAPES.filter(function (k) { return E.isTest(P, k, i); });
    o.lowOk = i > 0 && P.L[i] >= P.L[i - 1]; o.bounce = a >= 0 ? E.fv(P, "bouncePct", i, a) : NaN; o.lowerThanMarker = a >= 0 && P.H[i] < P.H[a];
    return o;
  }
  function desc(f) { return (f.red ? "red" : f.green ? "green" : "flat") + ", body " + Math.round(f.bodyPct) + "%, upper wick " + Math.round(f.upWickPct) + "%, lower wick " + Math.round(f.loWickPct) + "%" + (f.tags.length ? ", " + f.tags.map(function (t) { return SHN[t]; }).join("/") : "") + (f.belowV ? ", under VWAP" : f.aboveV ? ", over VWAP" : "") + (f.belowE ? ", under 9 EMA" : f.aboveE ? ", over 9 EMA" : ""); }
  function fl(x, st) { return Math.floor(x / st + 1e-9) * st; }
  function ce(x, st) { return Math.ceil(x / st - 1e-9) * st; }
  function all(list, fn) { return list.length > 0 && list.every(fn); }

  /* ---------- reading the marks ---------- */
  function groups(s) { var g = {}; s.marks.forEach(function (m) { (g[m.l] = g[m.l] || []).push(m.i); }); Object.keys(g).forEach(function (k) { g[k].sort(function (a, b) { return a - b; }); }); return g; }
  function prevHigh(g, i) { var h = g["HIGH"] || [], best = -1; h.forEach(function (x) { if (x <= i) best = x; }); return best; }
  function candRules(items, listName, grp, who, on) {
    var out = [], F = items, mk = function (id, text, cond, def) { out.push({ id: id, grp: grp, text: text, ev: who, on: def == null ? on : def, list: listName, cond: cond }); };
    if (all(F, function (f) { return f.red; })) mk(listName + ":red", "The candle is red", E.IZ("red"));
    else if (all(F, function (f) { return f.green; })) mk(listName + ":green", "The candle is green", E.IZ("green"));
    SHAPES.forEach(function (t) { if (all(F, function (f) { return f.tags.indexOf(t) >= 0; })) mk(listName + ":shape:" + t, "The candle is " + an(SHN[t]), E.IZ(t)); });
    if (all(F, function (f) { return f.newHod; })) mk(listName + ":hod", "The candle makes a new high of the day", E.IZ("newHod"));
    if (all(F, function (f) { return f.belowV; })) mk(listName + ":belowV", "The candle closes below VWAP", E.C("close", "<", "vwap")); else if (all(F, function (f) { return f.aboveV; })) mk(listName + ":aboveV", "The candle closes above VWAP", E.C("close", ">", "vwap"));
    if (all(F, function (f) { return f.belowE; })) mk(listName + ":belowE", "The candle closes below the 9 EMA", E.C("close", "<", "ema9")); else if (all(F, function (f) { return f.aboveE; })) mk(listName + ":aboveE", "The candle closes above the 9 EMA", E.C("close", ">", "ema9"));
    var mx = function (k) { return Math.max.apply(null, F.map(function (f) { return f[k]; })); }, mn = function (k) { return Math.min.apply(null, F.map(function (f) { return f[k]; })); };
    if (F.length && mn("upWickPct") >= 25) mk(listName + ":up", "Upper wick at least " + fl(mn("upWickPct") - 5, 5) + "% of the candle", E.C("upWickPct", ">=", fl(mn("upWickPct") - 5, 5)));
    if (F.length && mn("loWickPct") >= 25) mk(listName + ":lo", "Lower wick at least " + fl(mn("loWickPct") - 5, 5) + "% of the candle", E.C("loWickPct", ">=", fl(mn("loWickPct") - 5, 5)));
    if (F.length && mx("bodyPct") <= 70) mk(listName + ":body", "Body no more than " + ce(mx("bodyPct") + 5, 5) + "% of the candle", E.C("bodyPct", "<=", ce(mx("bodyPct") + 5, 5)));
    if (F.length && mn("relVol") >= 1.2) mk(listName + ":vol", "Volume at least " + (Math.floor(mn("relVol") * 2) / 2) + "x the last 10 candles", E.C("relVol", ">=", Math.floor(mn("relVol") * 2) / 2), false);
    return out;
  }
  function analyze() {
    var data = [], f = [], notes = [], votes = { short: 0, long: 0 };
    T.setups.forEach(function (s) { if (!s.marks.length) return; var sc = sceneOf(s); if (!sc) return; data.push({ s: s, sc: sc, P: E.prep(sc), g: groups(s) }); });
    if (!data.length) return { f: [], notes: ["Mark some candles to begin."], side: "short", n: 0 };
    data.forEach(function (d) { var h = d.g["HIGH"], b = d.g["BREAK"], t = d.g["TRIGGER"], P = d.P; if (h && b) { if (P.L[b[0]] < P.L[h[0]]) votes.short++; else if (P.H[b[0]] > P.H[h[0]]) votes.long++; } else if (h && t) { if (P.C[t[0]] < P.C[h[0]]) votes.short++; else votes.long++; } });
    var side = votes.long > votes.short ? "long" : "short", sh = side === "short";
    var hasHigh = data.some(function (d) { return d.g["HIGH"]; });
    var add = function (o) { f.push(o); }, num = 0;
    // marker
    if (hasHigh) {
      add({ id: "m:on", grp: "Marker candle", text: "Use a marker candle (your HIGH)", ev: data.filter(function (d) { return d.g["HIGH"]; }).length + " setup(s) with a HIGH", on: true, set: function (s) { s.anchor.on = true; s.anchor.once = true; } });
      var hi = []; data.forEach(function (d) { (d.g["HIGH"] || []).forEach(function (i) { hi.push(facts(d.P, i, -1)); }); });
      candRules(hi, "anchor", "Marker candle", "Your HIGH candle" + (hi.length > 1 ? "s all share this" : ": " + desc(hi[0])), true).forEach(add);
      // break
      var within = 0, anyBreak = false;
      data.forEach(function (d) { var h = d.g["HIGH"]; if (!h) return; var h0 = h[0], b = d.g["BREAK"], end = (d.g["TRIGGER"] || d.g["ENTRY"] || [d.P.n - 1])[0], j; if (b) { var bb = b.filter(function (x) { return x > h0; })[0]; if (bb != null) { within = Math.max(within, bb - h0); anyBreak = true; } } else for (j = h0 + 1; j <= end; j++) if (sh ? d.P.L[j] < d.P.L[h0] : d.P.H[j] > d.P.H[h0]) { within = Math.max(within, j - h0); anyBreak = true; break; } });
      if (anyBreak) add({ id: "m:break", grp: "After the marker", text: "Wait for price to break the HIGH's " + (sh ? "low" : "high") + ", within " + Math.max(1, within) + (Math.max(1, within) === 1 ? " candle" : " candles"), ev: "In your marks the break came " + within + " candle(s) after the HIGH (the longest across your setups).", on: true, set: function (s) { s.anchor.needBreak = true; s.anchor.within = Math.max(1, within); } });
      // never above / restart
      var neverOk = true, anyChk = false, restarts = [];
      data.forEach(function (d) { var h = d.g["HIGH"]; if (!h) return; var h0 = h[0], end = (d.g["TRIGGER"] || d.g["ENTRY"] || [])[0], j; if (end != null) { anyChk = true; for (j = h0 + 1; j <= end; j++) if (sh ? d.P.H[j] > d.P.H[h0] : d.P.L[j] < d.P.L[h0]) neverOk = false; } (d.g["RESTART"] || []).forEach(function (r) { restarts.push({ r: r, h0: prevHigh(d.g, r - 1), d: d }); }); });
      if ((anyChk && neverOk) || restarts.length) add({ id: "m:never", grp: "After the marker", text: "Cancel the setup if price goes " + (sh ? "above the HIGH's high" : "below the HIGH's low") + ", then start looking again", ev: restarts.length ? "You marked " + restarts.length + " RESTART candle(s): price took out the HIGH and the sequence began again. A candle that cancels the setup can become the next marker if it qualifies." : "In every marked setup, price never went back " + (sh ? "above the HIGH's high" : "below the HIGH's low") + " before your TRIGGER.", on: true, set: function (s) { s.anchor.never = true; } });
      else if (anyChk) notes.push("In your marks, price did go past the HIGH before the TRIGGER, so I did NOT add the 'cancel' rule. Mark a RESTART candle if that was meant to reset the setup.");
    }
    // lower high
    var lh = []; data.forEach(function (d) { (d.g["LOWER HIGH"] || []).forEach(function (i) { var a = prevHigh(d.g, i); lh.push({ f: facts(d.P, i, a), a: a, d: d, i: i }); }); });
    if (lh.length && hasHigh) {
      if (all(lh, function (x) { return x.a >= 0 && x.f.lowerThanMarker; })) add({ id: "t:lowerthan", grp: "Signal candle", text: "The signal candle's high stays below the HIGH's high", ev: "Your LOWER HIGH candle(s) all topped out below the HIGH.", on: true, list: "trig", cond: E.C("high", "<", "anchorHigh") });
      var bs = lh.filter(function (x) { return x.a >= 0 && !isNaN(x.f.bounce); }).map(function (x) { return x.f.bounce; });
      if (bs.length) { var thr = Math.max(5, fl(Math.min.apply(null, bs) * 0.8, 5)); add({ id: "t:bounce", grp: "Signal candle", text: "Price has bounced at least " + thr + "% of the drop from the HIGH", ev: "Your LOWER HIGH bounced " + bs.map(function (b) { return Math.round(b) + "%"; }).join(", ") + " of the drop; I gave a little room.", on: true, list: "trig", cond: E.C("bouncePct", ">=", thr) }); }
    }
    // trigger
    var tr = []; data.forEach(function (d) { (d.g["TRIGGER"] || []).forEach(function (i) { var a = prevHigh(d.g, i); tr.push({ f: facts(d.P, i, a), a: a, d: d, i: i }); }); });
    if (!tr.length) notes.push("Mark at least one TRIGGER candle so I can write the signal rules.");
    else {
      candRules(tr.map(function (x) { return x.f; }), "trig", "Signal candle", tr.length > 1 ? "Your " + tr.length + " TRIGGER candles all share this" : "Your TRIGGER: " + desc(tr[0].f), true).forEach(add);
      if (all(tr, function (x) { return x.f.lowOk; })) add({ id: "t:lowok", grp: "Signal candle", text: "The signal candle's low is not below the last candle's low", ev: "True for all your TRIGGER candles.", on: true, list: "trig", cond: E.C("low", ">=", "prevLow") });
      if (hasHigh && !lh.length && all(tr, function (x) { return x.a >= 0 && x.f.lowerThanMarker; })) add({ id: "t:lowerthan", grp: "Signal candle", text: "The signal candle's high stays below the HIGH's high", ev: "True for all your TRIGGER candles.", on: true, list: "trig", cond: E.C("high", "<", "anchorHigh") });
      var bt = tr.filter(function (x) { return x.a >= 0 && !isNaN(x.f.bounce); }).map(function (x) { return x.f.bounce; });
      if (bt.length && !lh.length) { var t2 = Math.max(5, fl(Math.min.apply(null, bt) * 0.8, 5)); add({ id: "t:bounce", grp: "Signal candle", text: "Price has bounced at least " + t2 + "% of the drop from the HIGH", ev: "Your TRIGGER came after a " + bt.map(function (b) { return Math.round(b); }).join("%, ") + "% bounce.", on: false, list: "trig", cond: E.C("bouncePct", ">=", t2) }); }
      var gp = tr.map(function (x) { return x.d.sc.gap; }).filter(function (g) { return typeof g === "number"; });
      if (gp.length && Math.min.apply(null, gp) >= 3) add({ id: "f:gap", grp: "Filters", text: "Only on days that gap up at least " + fl(Math.min.apply(null, gp), 1) + "%", ev: "Your marked days gapped " + gp.map(function (g) { return g + "%"; }).join(", ") + ". Off by default so it does not over-fit.", on: false, set: function (s) { s.filters.minGap = fl(Math.min.apply(null, gp), 1); } });
      var tm = tr.map(function (x) { return 570 + x.i * (x.d.sc.tf || 2); });
      add({ id: "f:time", grp: "Filters", text: "Only trade between " + hm(Math.max(570, Math.min.apply(null, tm) - 30)) + " and " + hm(Math.min(955, Math.max.apply(null, tm) + 30)), ev: "Your TRIGGER candles were at " + tm.map(hm).join(", ") + ". Off by default so it does not over-fit.", on: false, set: function (s) { s.window.start = hmn(Math.max(570, Math.min.apply(null, tm) - 30)); s.window.end = hmn(Math.min(955, Math.max.apply(null, tm) + 30)); } });
    }
    // entry
    var ent = null;
    data.forEach(function (d) { var t = d.g["TRIGGER"], e = d.g["ENTRY"]; if (!t || !e || ent) return; var t0 = t[t.length - 1], e0 = e.filter(function (x) { return x >= t0; })[0]; if (e0 == null) return; var P = d.P; if (e0 === t0) ent = { how: "close", within: 1 }; else if (sh ? P.L[e0] < P.L[t0] : P.H[e0] > P.H[t0]) ent = { how: "break", within: e0 - t0 }; else ent = { how: "nextopen", within: 1 }; });
    if (ent) add({ id: "e:how", grp: "Entry", text: ent.how === "close" ? "Enter at the close of the signal candle" : ent.how === "break" ? "Enter when price breaks the signal candle's " + (sh ? "low" : "high") + (ent.within > 1 ? " (waiting up to " + ent.within + " candles)" : " (next candle)") : "Enter at the open of the next candle", ev: "Read from your ENTRY mark.", on: true, set: function (s) { s.entry.how = ent.how; s.entry.within = Math.max(1, ent.within); } });
    else if (tr.length) notes.push("No ENTRY mark, so entry stays 'break of the signal candle'. Mark the candle you entered on if you want that read too.");
    // stop and targets
    var stopHow = null, stopV = 0;
    var entryPx = function (d, t0) { var P = d.P; return ent && ent.how === "close" ? P.C[t0] : ent && ent.how === "nextopen" && t0 + 1 < P.n ? P.O[t0 + 1] : (sh ? P.L[t0] - 0.02 : P.H[t0] + 0.02); };
    data.forEach(function (d) { var sm = d.g["STOP"], t = d.g["TRIGGER"]; if (!sm || !t || stopHow) return; var t0 = t[t.length - 1], s0 = sm[0], h = prevHigh(d.g, t0), P = d.P; if (s0 === t0) stopHow = "candle"; else if (h >= 0 && s0 === h) stopHow = "anchor"; else { stopHow = "fixed"; var lvl = sh ? P.H[s0] + 0.02 : P.L[s0] - 0.02; stopV = Math.max(0.05, Math.round(Math.abs(lvl - entryPx(d, t0)) * 100) / 100); } });
    if (stopHow) add({ id: "s:how", grp: "Stop", text: stopHow === "candle" ? "Stop just beyond the signal candle" : stopHow === "anchor" ? "Stop just beyond the HIGH candle" : "Stop $" + stopV.toFixed(2) + " from entry", ev: "Read from your STOP mark" + (stopHow === "fixed" ? " (the distance from your entry to that candle's extreme)." : "."), on: true, set: function (s) { s.stop.how = stopHow; if (stopHow === "fixed") s.stop.v = stopV; } });
    var tg = [];
    data.forEach(function (d) { var tm = d.g["TARGET"], t = d.g["TRIGGER"]; if (!tm || !t) return; var t0 = t[t.length - 1], P = d.P, h = prevHigh(d.g, t0), e = entryPx(d, t0), sp = stopHow === "anchor" && h >= 0 ? (sh ? P.H[h] + 0.02 : P.L[h] - 0.02) : stopHow === "fixed" ? (sh ? e + stopV : e - stopV) : (sh ? P.H[t0] + 0.02 : P.L[t0] - 0.02), risk = Math.abs(sp - e); if (!(risk > 0)) return; tm.forEach(function (i) { var lv = sh ? P.L[i] : P.H[i], r = (sh ? e - lv : lv - e) / risk; if (r >= 0.2) tg.push(Math.round(r * 10) / 10); }); });
    tg = tg.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; }).slice(0, 3);
    if (tg.length) add({ id: "g:t", grp: "Targets", text: "Take profit at " + tg.map(function (r) { return r + "R"; }).join(", "), ev: "Worked out from where your TARGET candles reached, measured in multiples of your risk. Shares are split evenly.", on: true, set: function (s) { var p = Math.floor(100 / tg.length); s.targets = tg.map(function (r, k) { return { kind: "r", v: r, pct: k === tg.length - 1 ? 100 - p * (tg.length - 1) : p }; }); } });
    var customs = []; data.forEach(function (d) { d.s.marks.forEach(function (m) { if (!LC[m.l] && customs.indexOf(m.l) < 0) customs.push(m.l); }); });
    if (customs.length) notes.push("Your own labels (" + customs.join(", ") + ") are kept as notes on the chart. I can only turn the built-in labels into rules.");
    return { f: f, notes: notes, side: side, n: data.length, data: data };
  }
  function an(w) { return (/^[aeiou]/i.test(w) ? "an " : "a ") + w; }
  function hm(m) { return Math.floor(m / 60) + ":" + ("0" + (m % 60)).slice(-2); }
  function hmn(m) { return Math.floor(m / 60) * 100 + m % 60; }
  function on(f) { return T.sel[f.id] == null ? f.on : T.sel[f.id]; }

  function build(A) {
    var s = E.blank(); s.side = A.side; s.name = "From marks: " + (A.data[0] ? A.data[0].sc.name : "chart"); s.trig.conds = [];
    A.f.forEach(function (f) { if (!on(f)) return; if (f.list) { var L = f.list === "anchor" ? s.anchor.conds : s.trig.conds; L.push(JSON.parse(JSON.stringify(f.cond))); } else if (f.set) f.set(s); });
    if (s.stop.how === "anchor" && !s.anchor.on) s.stop.how = "candle";
    return s;
  }
  function check(id) {
    var B = window.BTBuilder, s = B && B.get && B.get(id), q = ex(); if (!s) return null; var out = [];
    T.setups.forEach(function (st) {
      var sc = sceneOf(st); if (!sc || !st.marks.length) return; var tr = E.run(s, sc), d = tr.diag, P = E.prep(sc), g = groups(st), trg = g["TRIGGER"] || [], rows = [];
      trg.forEach(function (t) {
        var a = prevHigh(g, t), hit = d.sigIdx.indexOf(t) >= 0;
        if (hit) rows.push({ ok: true, text: "Signal fired on your TRIGGER, candle " + (t + 1) + "." });
        else { var bad = s.trig.conds.filter(function (c) { return !E.evalCond(P, c, t, a); }).map(E.describe); rows.push({ ok: false, text: "No signal on your TRIGGER, candle " + (t + 1) + (bad.length ? ". It failed: " + bad.join("; ") + "." : ". The signal rules pass there, so the marker rules (HIGH, break, cancel) blocked it.") }); }
      });
      var other = d.sigIdx.filter(function (i) { return trg.indexOf(i) < 0; });
      rows.push({ ok: other.length < 6, text: other.length ? "The strategy also signalled on " + other.length + " other candle(s) of this chart" + (other.length <= 8 ? ": #" + other.map(function (i) { return i + 1; }).join(", #") : "") + (other.length ? ". If those are not setups you would take, add a rule that rules them out." : ".") : "No other signals on this chart. Your setup is the only one it finds." });
      rows.push({ ok: true, text: "Trades taken: " + tr.filter(function (t) { return !t.open; }).length + (tr.length ? " (" + tr.map(function (t) { return (t.pnl >= 0 ? "+" : "-") + "$" + Math.abs(t.pnl).toFixed(2); }).join(", ") + ")" : "") });
      out.push({ name: st.name, rows: rows });
    });
    return out;
  }

  /* ---------- page ---------- */
  function css() {
    return '<style>.tc-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.tc-bar select,.tc-bar input{font:inherit;font-size:.86rem;padding:7px 10px;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:9px}.tc-pal{display:flex;flex-wrap:wrap;gap:6px}.tc-l{border:2px solid transparent;color:#fff;border-radius:9px;padding:7px 12px;font:inherit;font-weight:800;font-size:.78rem;cursor:pointer;opacity:.55}.tc-l.on{opacity:1;box-shadow:0 0 0 3px var(--panel),0 0 0 5px currentColor;border-color:#fff}.tc-l.gray{background:#566573}.tc-chart{position:relative;border:1px solid var(--line);border-radius:12px;background:var(--panel);overflow:hidden;width:100%}.tc-tip{position:absolute;pointer-events:none;background:var(--ink);color:var(--bg);border-radius:8px;padding:6px 9px;font-size:.74rem;line-height:1.45;z-index:5;white-space:nowrap}' +
      '.tc-find{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin:10px 0}.tc-find h4{margin:12px 0 4px;font-size:.88rem}.tc-find .tc-f{display:flex!important;flex-direction:row!important;gap:10px;align-items:flex-start;padding:8px 0;border-top:1px solid var(--line);width:auto!important;margin:0!important}.tc-find .tc-f input{width:auto!important;margin:3px 0 0;flex:none}.tc-find .tc-f>span{display:block}.tc-f b{font-size:.86rem}.tc-f small{display:block;color:var(--mute);font-size:.76rem;line-height:1.4}.tc-ok{color:var(--gain);font-weight:800}.tc-no{color:var(--loss);font-weight:800}.tc-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:4px 6px 4px 12px;font-size:.78rem;font-weight:700;margin:2px}.tc-chip.on{background:var(--ink);color:var(--bg)}.tc-chip button{border:0;background:none;color:inherit;cursor:pointer;font:inherit}.tc-pill{display:inline-block;color:#fff;border-radius:6px;padding:2px 8px;font-size:.72rem;font-weight:800}</style>';
  }
  function tip(i) {
    var s = cs(), sc = s && sceneOf(s); if (!sc || i < 0) return ""; var P = E.prep(sc), f = facts(P, i, -1), m = 570 + i * (sc.tf || 2);
    return "<b>#" + (i + 1) + "</b> " + hm(m) + "<br>O " + f2(P.O[i]) + "  H " + f2(P.H[i]) + "  L " + f2(P.L[i]) + "  C " + f2(P.C[i]) + "<br>Vol " + Math.round(P.V[i]).toLocaleString() + " (" + f2(f.relVol) + "x)<br>" + desc(f);
  }
  function html() {
    var q = ex(); if (!q) return ""; clean(); q.S.edit = "";
    var h = css(), pl = pool();
    if (!pl.length) return h + '<div class="bt-note">You need a real chart first. In <b>3. Build a strategy</b>, open the last step (Review and test) and press <b>Pull candles</b> (Schwab) or paste candles. Then come back here to mark them.</div><div class="bt-bar"><button type="button" class="bt-b on" data-tt-act="gobuild">Go to Build a strategy</button></div>';
    var s = cs(); if (!s) s = newSetup(pl[0]);
    h += '<div class="bt-note"><b>Teach it by marking.</b> 1) Pick a chart. 2) <b>Highlight</b> the part you care about (drag across the chart). 3) Switch to <b>Label candles</b>, pick a label, and click each candle. 4) Read what I found and press <b>Create strategy</b>. The more setups you mark (on this chart or others), the better the rules.</div>';
    h += '<div class="tc-bar"><label>Chart <select data-tt="scene">' + pl.map(function (c) { return '<option value="' + esc(key(c)) + '"' + (key(c) === s.key ? " selected" : "") + '>' + esc(c.name) + ' (' + c.c.length + ' candles)</option>'; }).join("") + '</select></label><button type="button" class="bt-b" data-tt-act="newsetup">+ New setup on this chart</button><button type="button" class="bt-b" data-tt-act="gobuild">Add or pull more charts</button></div>';
    var mine = T.setups; h += '<div>' + mine.map(function (x) { return '<span class="tc-chip' + (x.id === s.id ? " on" : "") + '"><button type="button" data-tt-act="pickset" data-id="' + x.id + '">' + esc(x.name) + ' &middot; ' + x.marks.length + ' marks</button><button type="button" data-tt-act="delset" data-id="' + x.id + '" title="Delete this setup">&times;</button></span>'; }).join("") + '</div>';
    h += '<div class="tc-bar"><span class="bb-seg2" style="display:inline-flex;border:1px solid var(--line);border-radius:9px;overflow:hidden"><button type="button" class="bt-b' + (T.tool === "select" ? " on" : "") + '" style="border:0;border-radius:0" data-tt-act="tool" data-v="select">1. Highlight a part of the chart</button><button type="button" class="bt-b' + (T.tool === "mark" ? " on" : "") + '" style="border:0;border-radius:0" data-tt-act="tool" data-v="mark">2. Label candles</button></span><button type="button" class="bt-b" data-tt-act="whole">Show whole day</button><button type="button" class="bt-b" data-tt-act="undo"' + (s.marks.length ? "" : " disabled") + '>Undo last mark</button><button type="button" class="bt-b" data-tt-act="clear"' + (s.marks.length ? "" : " disabled") + '>Clear marks</button></div>';
    if (T.tool === "mark") h += '<div class="tc-pal">' + LABELS.map(function (l) { return '<button type="button" class="tc-l' + (T.label === l[0] ? " on" : "") + '" style="background:' + l[2] + ';color:#fff" data-tt-act="label" data-v="' + l[0] + '" title="' + esc(l[1]) + '">' + l[0] + '</button>'; }).join("") + '<span class="tc-bar" style="margin:0 0 0 8px"><input data-tt="custom" placeholder="Your own label" value="' + esc(T.custom) + '" style="width:140px"><button type="button" class="tc-l gray' + (T.label === "@custom" ? " on" : "") + '" data-tt-act="label" data-v="@custom">Use it</button></span></div><div class="bt-hint" style="margin:6px 0">' + (T.label === "@custom" ? "Your own label is kept as a note on the chart." : esc((LABELS.filter(function (l) { return l[0] === T.label; })[0] || [0, ""])[1])) + '. Click a candle to put the label on it. Click the same candle again to remove it.</div>';
    else h += '<div class="bt-hint" style="margin:6px 0">Drag across the chart to highlight the part where your setup happens. The chart zooms to it.</div>';
    h += '<div id="tc-chart" class="tc-chart"></div>';
    // marks table
    var sc = sceneOf(s);
    if (sc && s.marks.length) { var P = E.prep(sc); h += '<div class="bt-tw"><table class="bt-t"><thead><tr><th>Label</th><th>Candle</th><th>Time</th><th>What the candle looks like</th><th></th></tr></thead><tbody>' + s.marks.slice().sort(function (a, b) { return a.i - b.i; }).map(function (m) { var f = facts(P, m.i, prevHigh(groups(s), m.i)); return '<tr><td><span class="tc-pill" style="background:' + (LC[m.l] || "#566573") + '">' + esc(m.l) + '</span></td><td>#' + (m.i + 1) + '</td><td>' + hm(570 + m.i * (sc.tf || 2)) + '</td><td>' + esc(desc(f)) + ', volume ' + f2(f.relVol) + 'x</td><td><button type="button" class="bb-x" style="border:0;background:none;cursor:pointer;font-size:1.2rem" data-tt-act="rmmark" data-i="' + m.i + '" data-l="' + esc(m.l) + '">&times;</button></td></tr>'; }).join("") + '</tbody></table></div>'; }
    // findings
    var A = analyze();
    h += '<div class="tc-find"><h3 class="bt-h" style="margin-top:0">What I read from your marks <small>(' + A.n + ' marked ' + (A.n === 1 ? "setup" : "setups") + ', looks like a ' + A.side + ' strategy)</small></h3>';
    if (!A.f.length) h += '<p class="bb-tip">' + esc(A.notes[0] || "Nothing yet.") + '</p>';
    else {
      var grp = {}, order = []; A.f.forEach(function (x) { if (!grp[x.grp]) { grp[x.grp] = []; order.push(x.grp); } grp[x.grp].push(x); });
      h += '<p class="bb-tip">Untick anything that is not part of your idea. Then create the strategy.</p>' + order.map(function (g) { return '<h4>' + g + '</h4>' + grp[g].map(function (x) { return '<label class="tc-f"><input type="checkbox" data-tt="f" data-id="' + esc(x.id) + '"' + (on(x) ? " checked" : "") + '><span><b>' + esc(x.text) + '</b><small>' + esc(x.ev) + '</small></span></label>'; }).join(""); }).join("");
    }
    A.notes.forEach(function (n, k) { if (A.f.length || k) h += '<div class="bt-note" style="border-left-color:var(--mute)">' + esc(n) + '</div>'; });
    if (A.f.length) h += '<div class="bt-bar"><button type="button" class="bt-b on" data-tt-act="create">Create strategy from my marks</button></div>';
    h += '</div>';
    if (T.msg) h += '<div class="bt-note">' + T.msg + '</div>';
    if (T.made) { var ck = check(T.made); if (ck && ck.length) h += '<div class="tc-find"><h3 class="bt-h" style="margin-top:0">Does the strategy find your setups?</h3>' + ck.map(function (c) { return '<h4>' + esc(c.name) + '</h4>' + c.rows.map(function (r) { return '<div class="tc-f"><span class="' + (r.ok ? "tc-ok" : "tc-no") + '">' + (r.ok ? "&#10003;" : "&#10007;") + '</span><span>' + esc(r.text) + '</span></div>'; }).join(""); }).join("") + '<div class="bt-bar"><button type="button" class="bt-b on" data-tt-act="openbuild">Open it in Build a strategy (edit, test, get bot code)</button></div></div>'; }
    return h;
  }
  function after(r) {
    root = r; paint();
    var s = cs(); if (s && s.a != null && !s.view) { /* range set without view */ }
  }

  /* ---------- events ---------- */
  function rerender() { save(); ex().render(); }
  function toggleMark(s, i, l) {
    var k = -1; s.marks.forEach(function (m, j) { if (m.i === i && m.l === l) k = j; });
    if (k >= 0) s.marks.splice(k, 1); else s.marks.push({ i: i, l: l }); T.made = null; T.msg = "";
  }
  function act(a, b) {
    var q = ex(), s = cs();
    if (a === "gobuild") { q.S.tab = "build"; q.render(); window.scrollTo(0, 0); return; }
    if (a === "openbuild") { q.S.tab = "build"; q.render(); window.scrollTo(0, 0); return; }
    if (a === "newsetup") { var sc = s && sceneOf(s) || pool()[0]; newSetup(sc); T.made = null; rerender(); return; }
    if (a === "pickset") { T.cur = b.getAttribute("data-id"); T.made = null; rerender(); return; }
    if (a === "delset") { if (!window.confirm("Delete this setup and its marks?")) return; T.setups = T.setups.filter(function (x) { return x.id !== b.getAttribute("data-id"); }); T.cur = T.setups.length ? T.setups[0].id : null; T.made = null; rerender(); return; }
    if (a === "tool") { T.tool = b.getAttribute("data-v"); rerender(); return; }
    if (a === "label") { var v = b.getAttribute("data-v"); if (v === "@custom" && !T.custom.trim()) { q.toast("Type your label first"); return; } T.label = v; T.tool = "mark"; rerender(); return; }
    if (!s) return;
    if (a === "whole") { s.view = null; s.a = null; s.b = null; rerender(); return; }
    if (a === "undo") { s.marks.pop(); T.made = null; rerender(); return; }
    if (a === "clear") { if (window.confirm("Remove all marks on this setup?")) { s.marks = []; T.made = null; rerender(); } return; }
    if (a === "rmmark") { var i = +b.getAttribute("data-i"), l = b.getAttribute("data-l"); toggleMark(s, i, l); rerender(); return; }
    if (a === "create") {
      var A = analyze(), st = build(A), B = window.BTBuilder; if (!B || !B.add) { q.toast("Builder is not loaded"); return; }
      st.name = "From marks: " + (s.name || "chart"); var id = B.add(st); T.made = id; T.msg = "Created <b>" + esc(st.name) + "</b> and saved it in <b>Build a strategy</b>. Below is how it does on the charts you marked."; rerender(); window.scrollTo(0, document.body.scrollHeight);
    }
  }
  function bind(r) {
    if (r.__tt) return; r.__tt = 1; root = r; load();
    r.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("[data-tt-act]"); if (b) { ev.preventDefault(); act(b.getAttribute("data-tt-act"), b); } });
    r.addEventListener("change", function (ev) {
      var t = ev.target, k = t.getAttribute && t.getAttribute("data-tt"); if (!k) return;
      if (k === "scene") { var pl = pool(), sc = pl.filter(function (c) { return key(c) === t.value; })[0]; if (sc) { var ex1 = T.setups.filter(function (x) { return x.key === key(sc); })[0]; if (ex1) T.cur = ex1.id; else newSetup(sc); T.made = null; rerender(); } return; }
      if (k === "custom") { T.custom = t.value; return; }
      if (k === "f") { T.sel[t.getAttribute("data-id")] = t.checked; T.made = null; save(); return; }
    });
    r.addEventListener("input", function (ev) { var t = ev.target; if (t.getAttribute && t.getAttribute("data-tt") === "custom") T.custom = t.value; });
    r.addEventListener("pointerdown", function (ev) { var hit = ev.target.id === "tc-hit"; if (!hit || !G) return; DR = { x0: ev.clientX, i0: idxAt(ev.clientX) }; try { ev.target.setPointerCapture(ev.pointerId); } catch (e) { } });
    r.addEventListener("pointermove", function (ev) {
      var hit = ev.target.id === "tc-hit"; if (!hit || !G) return; var i = idxAt(ev.clientX), box = root.querySelector("#tc-chart"), tp = root.querySelector("#tc-tip"), rc = box.getBoundingClientRect();
      if (DR && T.tool === "select") { var sel = root.querySelector("#tc-sel"), a = Math.min(DR.i0, i), b = Math.max(DR.i0, i); sel.setAttribute("x", G.padL + (a - G.vs) * G.sw); sel.setAttribute("width", (b - a + 1) * G.sw); }
      if (tp) { tp.hidden = false; tp.innerHTML = tip(i); var x = ev.clientX - rc.left + 14; if (x + 230 > rc.width) x = ev.clientX - rc.left - 240; tp.style.left = Math.max(4, x) + "px"; tp.style.top = Math.max(4, ev.clientY - rc.top - 70) + "px"; }
    });
    r.addEventListener("pointerout", function (ev) { if (ev.target.id !== "tc-hit") return; var tp = root.querySelector("#tc-tip"); if (tp) tp.hidden = true; });
    r.addEventListener("pointerup", function (ev) {
      if (!DR || ev.target.id !== "tc-hit") { DR = null; return; } var d = DR; DR = null; var i = idxAt(ev.clientX), s = cs(); if (!s) return;
      if (T.tool === "select") { if (Math.abs(ev.clientX - d.x0) < 6) return; var a = Math.min(d.i0, i), b = Math.max(d.i0, i); if (b - a < 2) return; s.a = a; s.b = b; s.view = [Math.max(0, a - 4), b + 4]; rerender(); return; }
      if (Math.abs(ev.clientX - d.x0) >= 6) return; var lab = T.label === "@custom" ? T.custom.trim() : T.label; if (!lab) return; toggleMark(s, i, lab); rerender();
    });
  }
  window.BTTeach = { _G: function () { return G; }, html: html, bind: bind, after: after, _analyze: analyze, _T: T };
})();
