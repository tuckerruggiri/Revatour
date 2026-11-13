/* Revatour Backtest Lab: generic strategy engine (pure functions, no page access).
   A strategy is plain JSON. run(strategy, scene) walks the candles one by one and returns the trades.
   The Python bot code written by the builder is a line-by-line port of run(). */
(function (G) {
  "use strict";
  var HM = function (v) { v = Math.round(v); return Math.floor(v / 100) * 60 + v % 100; };
  var r2 = function (x) { return Math.round(x * 100) / 100; };

  var FIELDS = [
    ["close", "Close", "This candle"], ["open", "Open", "This candle"], ["high", "High", "This candle"], ["low", "Low", "This candle"],
    ["prevClose", "Last candle's close", "Last candle"], ["prevOpen", "Last candle's open", "Last candle"], ["prevHigh", "Last candle's high", "Last candle"], ["prevLow", "Last candle's low", "Last candle"],
    ["vwap", "VWAP", "Lines"], ["ema9", "9 EMA", "Lines"], ["ema20", "20 EMA", "Lines"],
    ["hod", "High of day so far", "The day"], ["lod", "Low of day so far", "The day"], ["dayOpen", "Today's open", "The day"], ["yClose", "Yesterday's close", "The day"],
    ["anchorHigh", "Marker candle high", "Marker candle"], ["anchorLow", "Marker candle low", "Marker candle"], ["anchorMid", "Marker candle middle", "Marker candle"], ["bouncePct", "Bounce since the marker (% of the drop from its high)", "Marker candle"],
    ["bodyPct", "Body size (% of the candle)", "Candle size"], ["upWickPct", "Upper wick (% of the candle)", "Candle size"], ["loWickPct", "Lower wick (% of the candle)", "Candle size"], ["range", "Candle size in $ (high to low)", "Candle size"], ["atr", "Average candle size (ATR 14)", "Candle size"],
    ["volume", "Volume", "Volume and gap"], ["relVol", "Volume vs the last 10 candles (x times)", "Volume and gap"], ["gapPct", "Gap % at the open", "Volume and gap"], ["vwapDist", "Distance from VWAP (%)", "Volume and gap"], ["barNo", "Candle number of the day", "Volume and gap"]
  ];
  var FMAP = {}; FIELDS.forEach(function (f) { FMAP[f[0]] = f; });
  var IS = [["green", "a green candle"], ["red", "a red candle"], ["doji", "a doji (tiny body)"], ["hammer", "a hammer (long lower wick)"], ["inv", "an inverted hammer (long upper wick)"], ["spin", "a spinning top"], ["inside", "an inside bar"], ["outside", "an outside bar (swallows the last candle)"], ["newHod", "a new high of the day"], ["newLod", "a new low of the day"], ["higherHigh", "a higher high than the last candle"], ["lowerLow", "a lower low than the last candle"], ["touchVwap", "touching VWAP"], ["touchEma", "touching the 9 EMA"], ["gapUp", "on a gap-up day"], ["gapDown", "on a gap-down day"]];
  var OPS = [[">", "is above"], ["<", "is below"], [">=", "is at least"], ["<=", "is at most"], ["crossUp", "crosses above"], ["crossDn", "crosses below"]];

  function blank() {
    return {
      id: "s" + Date.now().toString(36) + Math.floor(Math.random() * 1e4), name: "My strategy", side: "short",
      anchor: { on: false, conds: [], mode: "all", needBreak: true, within: 6, never: true, once: true },
      trig: { mode: "all", conds: [] },
      entry: { how: "break", offset: 0.02, within: 1 },
      stop: { how: "candle", offset: 0.02, v: 0.5 },
      targets: [{ kind: "r", v: 1, pct: 50 }, { kind: "r", v: 2, pct: 50 }],
      mgmt: { beAtR: 0, beAfterT1: true, trail: false },
      exit: { conds: [], mode: "any", maxBars: 0, eod: 1556 },
      window: { start: 934, end: 1548 },
      limits: { maxTrades: 0, stopAfterLosses: 0, cooldown: 0 },
      filters: { minPrice: 0, minGap: 0, maxGap: 0 },
      risk: { dollars: 50, slip: 0.02, minRiskPS: 0.05 }
    };
  }
  function C(a, op, b) { return { t: "cmp", a: a, op: op, b: String(b) }; }
  function IZ(v, not) { return { t: "is", v: v, not: !!not }; }
  var TEMPLATES = [
    { key: "blank", name: "Blank page", pic: "blank", text: "Start empty and add every rule yourself.", make: function () { return blank(); } },
    { key: "fade", name: "Short: red candle under VWAP", pic: "short", text: "Short when a red candle closes under both VWAP and the 9 EMA. Stop above it, sell half at 1R and the rest at 2R.", make: function () { var s = blank(); s.name = "Short under VWAP"; s.trig.conds = [IZ("red"), C("close", "<", "vwap"), C("close", "<", "ema9")]; return s; } },
    { key: "pull", name: "Long: bounce off the 9 EMA", pic: "long", text: "Long when a green candle touches the 9 EMA but closes back above it, with price above VWAP.", make: function () { var s = blank(); s.name = "Long 9 EMA bounce"; s.side = "long"; s.trig.conds = [IZ("green"), IZ("touchEma"), C("close", ">", "ema9"), C("close", ">", "vwap")]; return s; } },
    { key: "marker", name: "Short: marker candle, then break its low", pic: "marker", text: "A red candle with a long top wick is the marker. Wait for price to break its low, then short a small candle below VWAP. Cancelled if price goes above the marker's high.", make: function () { var s = blank(); s.name = "Marker candle short"; s.anchor.on = true; s.anchor.conds = [C("upWickPct", ">=", 40)]; s.trig.conds = [C("close", "<", "vwap"), C("bodyPct", "<=", 50)]; s.stop.how = "anchor"; s.stop.offset = 0.02; s.targets = [{ kind: "r", v: 1, pct: 50 }, { kind: "r", v: 2, pct: 50 }]; return s; } },
    { key: "gap", name: "Short: gap-up fade", pic: "gap", text: "Only on days that gap up 8%+. Short the first red candle after a new high of the day that closes under the 9 EMA.", make: function () { var s = blank(); s.name = "Gap-up fade"; s.trig.conds = [C("gapPct", ">=", 8), IZ("red"), C("high", ">=", "hod"), C("close", "<", "ema9")]; return s; } }
  ];

  /* ---------- candles to numbers ---------- */
  function prep(sc) {
    var c = sc.c, n = c.length, tf = sc.tf || 2, P = { n: n, tf: tf, O: [], H: [], L: [], C: [], V: [], T: [], vw: [], em: [], e20: [], atr: [], hod: [], lod: [], avgV: [], tr: [] };
    var pv = 0, cv = 0, e = 0, e2 = 0, i, x, k, s;
    for (i = 0; i < n; i++) {
      x = c[i]; P.O[i] = x.o; P.H[i] = x.h; P.L[i] = x.l; P.C[i] = x.c; P.V[i] = x.v; P.T[i] = 570 + i * tf;
      var tp = (x.h + x.l + x.c) / 3; pv += tp * x.v; cv += x.v; P.vw[i] = cv ? pv / cv : x.c;
      e = i ? e + 0.2 * (x.c - e) : x.c; P.em[i] = e; e2 = i ? e2 + (2 / 21) * (x.c - e2) : x.c; P.e20[i] = e2;
      P.hod[i] = i ? Math.max(P.hod[i - 1], x.h) : x.h; P.lod[i] = i ? Math.min(P.lod[i - 1], x.l) : x.l;
      P.tr[i] = i ? Math.max(x.h - x.l, Math.abs(x.h - c[i - 1].c), Math.abs(x.l - c[i - 1].c)) : x.h - x.l;
      s = 0; for (k = Math.max(0, i - 13); k <= i; k++) s += P.tr[k]; P.atr[i] = s / (i - Math.max(0, i - 13) + 1);
      if (i) { s = 0; for (k = Math.max(0, i - 10); k < i; k++) s += P.V[k]; P.avgV[i] = s / (i - Math.max(0, i - 10)); } else P.avgV[i] = x.v;
    }
    var o1 = sc.vw || {}, o2 = sc.em || {}, key;
    for (key in o1) if (o1[key] != null && P.vw[key] != null) P.vw[key] = o1[key];
    for (key in o2) if (o2[key] != null && P.em[key] != null) P.em[key] = o2[key];
    P.pc = sc.pc > 0 ? sc.pc : 0; P.gap = P.pc > 0 && n ? (P.O[0] / P.pc - 1) * 100 : 0;
    return P;
  }
  function fv(P, id, i, a) {
    var o = P.O[i], h = P.H[i], l = P.L[i], c = P.C[i], rg = h - l;
    switch (id) {
      case "close": return c; case "open": return o; case "high": return h; case "low": return l;
      case "prevClose": return i > 0 ? P.C[i - 1] : NaN; case "prevOpen": return i > 0 ? P.O[i - 1] : NaN; case "prevHigh": return i > 0 ? P.H[i - 1] : NaN; case "prevLow": return i > 0 ? P.L[i - 1] : NaN;
      case "vwap": return P.vw[i]; case "ema9": return P.em[i]; case "ema20": return P.e20[i];
      case "hod": return P.hod[i]; case "lod": return P.lod[i]; case "dayOpen": return P.O[0]; case "yClose": return P.pc > 0 ? P.pc : NaN;
      case "anchorHigh": return a >= 0 ? P.H[a] : NaN; case "anchorLow": return a >= 0 ? P.L[a] : NaN; case "anchorMid": return a >= 0 ? (P.H[a] + P.L[a]) / 2 : NaN;
      case "bouncePct": { if (a < 0 || a > i) return NaN; var lo = Infinity, k; for (k = a; k <= i; k++) lo = Math.min(lo, P.L[k]); var den = P.H[a] - lo; return den > 0 ? (h - lo) / den * 100 : 0; }
      case "bodyPct": return rg > 0 ? Math.abs(c - o) / rg * 100 : 0; case "upWickPct": return rg > 0 ? (h - Math.max(o, c)) / rg * 100 : 0; case "loWickPct": return rg > 0 ? (Math.min(o, c) - l) / rg * 100 : 0;
      case "range": return rg; case "atr": return P.atr[i];
      case "volume": return P.V[i]; case "relVol": return P.avgV[i] > 0 ? P.V[i] / P.avgV[i] : 0; case "gapPct": return P.gap; case "vwapDist": return P.vw[i] ? (c - P.vw[i]) / P.vw[i] * 100 : 0; case "barNo": return i + 1;
    }
    return NaN;
  }
  function val(P, s, i, a) { return FMAP[s] ? fv(P, s, i, a) : parseFloat(s); }
  function isTest(P, id, i) {
    var o = P.O[i], h = P.H[i], l = P.L[i], c = P.C[i], rg = h - l, body = Math.abs(c - o), up = h - Math.max(o, c), lw = Math.min(o, c) - l;
    switch (id) {
      case "green": return c > o; case "red": return c < o;
      case "doji": return rg > 0 && body <= rg * 0.10;
      case "spin": return rg > 0 && body <= rg * 0.30 && up >= rg * 0.25 && lw >= rg * 0.25;
      case "hammer": return rg > 0 && lw >= rg * 0.6 && body <= rg * 0.35 && up <= rg * 0.2;
      case "inv": return rg > 0 && up >= rg * 0.6 && body <= rg * 0.35 && lw <= rg * 0.2;
      case "inside": return i > 0 && h <= P.H[i - 1] && l >= P.L[i - 1];
      case "outside": return i > 0 && h > P.H[i - 1] && l < P.L[i - 1];
      case "newHod": return i === 0 || h > P.hod[i - 1]; case "newLod": return i === 0 || l < P.lod[i - 1];
      case "higherHigh": return i > 0 && h > P.H[i - 1]; case "lowerLow": return i > 0 && l < P.L[i - 1];
      case "touchVwap": return l <= P.vw[i] && h >= P.vw[i]; case "touchEma": return l <= P.em[i] && h >= P.em[i];
      case "gapUp": return P.gap > 0; case "gapDown": return P.gap < 0;
    }
    return false;
  }
  function evalCond(P, c, i, a) {
    if (c.t === "is") { var r = isTest(P, c.v, i); return c.not ? !r : r; }
    if (c.t === "run") { for (var k = 0; k < c.n; k++) { var j = i - k; if (j < 0 || !(c.color === "green" ? P.C[j] > P.O[j] : P.C[j] < P.O[j])) return false; } return true; }
    var x = val(P, c.a, i, a), y = val(P, c.b, i, a);
    switch (c.op) {
      case ">": return x > y; case "<": return x < y; case ">=": return x >= y; case "<=": return x <= y;
      case "crossUp": return i >= 1 && val(P, c.a, i - 1, a) <= val(P, c.b, i - 1, a) && x > y;
      case "crossDn": return i >= 1 && val(P, c.a, i - 1, a) >= val(P, c.b, i - 1, a) && x < y;
    }
    return false;
  }
  function evalList(P, list, mode, i, a, counts) {
    if (!list.length) return true; var any = false, all = true, k;
    for (k = 0; k < list.length; k++) { var r = evalCond(P, list[k], i, a); if (counts && r) counts[k]++; any = any || r; all = all && r; }
    return mode === "any" ? any : all;
  }

  /* ---------- the strategy walk ---------- */
  function run(st, sc) {
    var P = prep(sc), n = P.n, dir = st.side === "long" ? 1 : -1, RK = st.risk, slip = RK.slip || 0, A = st.anchor, TR = st.trig, EN = st.entry, SP = st.stop, MG = st.mgmt, EX = st.exit, WN = st.window, LM = st.limits, FL = st.filters || {};
    var trades = [], pos = null, pend = -1, pendAnc = -1, anc = -1, brk = -1, used = {}, nT = 0, losses = 0, lastExit = -1e9;
    var diag = { bars: n, anchors: 0, broken: 0, sigBars: 0, signals: 0, entries: 0, sigIdx: [], conds: TR.conds.map(function () { return 0; }) };
    var eodMin = HM(EX.eod || 1556), t0 = HM(WN.start), t1 = HM(WN.end), i;
    var tgs = (st.targets || []).filter(function (t) { return t.pct > 0 && (t.kind === "vwap" || t.v > 0); });
    var bw = Math.max(1, EN.within || 1);

    function stopPx(t, ai, ent) {
      var off = SP.offset || 0;
      switch (SP.how) {
        case "mid": return (P.H[t] + P.L[t]) / 2 + (dir < 0 ? off : -off);
        case "fixed": return ent - dir * SP.v;
        case "pct": return ent * (1 - dir * SP.v / 100);
        case "atr": return ent - dir * SP.v * P.atr[t];
        case "anchor": if (ai >= 0) return dir < 0 ? P.H[ai] + off : P.L[ai] - off;
      }
      return dir < 0 ? P.H[t] + off : P.L[t] - off;
    }
    function tryEnter(bar, t, ai, px) {
      var tm = P.T[bar];
      if (tm < t0 || tm > t1) return false;
      if (LM.maxTrades > 0 && nT >= LM.maxTrades) return false;
      if (LM.stopAfterLosses > 0 && losses >= LM.stopAfterLosses) return false;
      if (bar - lastExit <= (LM.cooldown || 0)) return false;
      if (FL.minPrice > 0 && P.C[t] < FL.minPrice) return false;
      if (FL.minGap > 0 && P.gap < FL.minGap) return false;
      if (FL.maxGap > 0 && P.gap > FL.maxGap) return false;
      var ent = px + dir * slip, sp = stopPx(t, ai, ent);
      if (dir < 0 ? sp <= ent : sp >= ent) return false;
      var rps = Math.abs(sp - ent), qty = Math.floor(RK.dollars / Math.max(rps, RK.minRiskPS || 0));
      if (qty < 1) return false;
      var rem = qty, cum = 0, tg = tgs.map(function (g) {
        cum += g.pct; var q = cum >= 99.99 ? rem : Math.min(rem, Math.floor(qty * g.pct / 100 + 0.5)); rem -= q;
        return { kind: g.kind, v: g.v, q: q, lv: g.kind === "r" ? ent + dir * g.v * rps : g.kind === "usd" ? ent + dir * g.v : NaN, hit: false };
      });
      pos = { t: t, ai: ai, ei: bar, ent: ent, stop0: sp, stop: sp, rps: rps, qty: qty, rem: qty, tg: tg, fills: [], mfe: 0, any: false };
      pend = -1; nT++; diag.entries++;
      if (A.on && A.once && ai >= 0) { used[ai] = 1; anc = -1; brk = -1; }
      return true;
    }
    function fill(lab, q, px) { if (q > 0) { pos.fills.push({ lab: lab, q: q, px: px }); pos.rem -= q; } }
    function close(bar, px, why, open) {
      if (pos.rem > 0) fill("rest", pos.rem, px);
      var pnl = 0, qs = 0, ps = 0, parts = [];
      pos.fills.forEach(function (f) { pnl += dir * (f.px - pos.ent) * f.q; qs += f.q; ps += f.q * f.px; if (f.lab !== "rest") parts.push(f.lab); });
      var first = pos.tg.length ? (isNaN(pos.tg[0].lv) ? P.vw[pos.ei] : pos.tg[0].lv) : pos.ent;
      trades.push({ si: pos.t, ai: pos.ai, ei: pos.ei, xi: bar, entry: r2(pos.ent), exit: r2(qs ? ps / qs : pos.ent), stop: r2(pos.stop0), tgt: r2(first), dir: dir, shares: pos.qty, pnl: r2(pnl), R: pnl / RK.dollars, why: why, parts: parts, open: !!open, custom: true });
      if (!open) { if (pnl < 0) losses++; lastExit = bar; }
      pos = null;
    }
    function manage(bar) {
      var o = P.O[bar], px;
      if (P.T[bar] >= eodMin) { close(bar, o - dir * slip, "end of day"); return true; }
      var hit = dir < 0 ? P.H[bar] >= pos.stop : P.L[bar] <= pos.stop;
      if (hit) { px = dir < 0 ? Math.max(pos.stop, o) + slip : Math.min(pos.stop, o) - slip; close(bar, px, pos.any ? "stop after a target" : "stop"); return true; }
      var k, g, lvl;
      for (k = 0; k < pos.tg.length; k++) {
        g = pos.tg[k]; if (g.hit) continue; lvl = g.kind === "vwap" ? P.vw[bar] : g.lv;
        if (g.kind === "vwap" && !(dir < 0 ? lvl < pos.ent : lvl > pos.ent)) continue;
        if (dir < 0 ? P.L[bar] <= lvl : P.H[bar] >= lvl) { px = dir < 0 ? Math.min(lvl, o) + slip : Math.max(lvl, o) - slip; fill("T" + (k + 1), g.q, px); g.hit = true; pos.any = true; }
      }
      if (pos.rem <= 0) { close(bar, pos.ent, "all targets"); return true; }
      var fav = dir < 0 ? pos.ent - P.L[bar] : P.H[bar] - pos.ent; if (fav > pos.mfe) pos.mfe = fav;
      var be = (MG.beAtR > 0 && pos.mfe >= MG.beAtR * pos.rps) || (MG.beAfterT1 && pos.any);
      if (be) pos.stop = dir < 0 ? Math.min(pos.stop, pos.ent) : Math.max(pos.stop, pos.ent);
      if (MG.trail && pos.any) pos.stop = dir < 0 ? Math.min(pos.stop, P.H[bar]) : Math.max(pos.stop, P.L[bar]);
      if (EX.conds.length && evalList(P, EX.conds, EX.mode, bar, -1, null)) { close(bar, P.C[bar] - dir * slip, "exit rule"); return true; }
      if (EX.maxBars > 0 && bar - pos.ei >= EX.maxBars) { close(bar, P.C[bar] - dir * slip, "held too long"); return true; }
      return false;
    }

    for (i = 0; i < n; i++) {
      var closedNow = false;
      if (pos && i > pos.ei) closedNow = manage(i);
      if (A.on) {
        if (anc >= 0) {
          var bad = dir < 0 ? P.H[i] > P.H[anc] : P.L[i] < P.L[anc];
          if (A.never && bad) { anc = -1; brk = -1; }
          else if (brk < 0) {
            var broke = dir < 0 ? P.L[i] < P.L[anc] : P.H[i] > P.H[anc];
            if (broke) { brk = i; diag.broken++; }
            else if (A.within > 0 && i - anc >= A.within) { anc = -1; }
          }
        }
        if (anc < 0 && !used[i] && evalList(P, A.conds, A.mode || "all", i, -1, null)) { anc = i; diag.anchors++; if (!A.needBreak) { brk = i; diag.broken++; } else brk = -1; }
      }
      if (pos || closedNow) continue;
      if (pend >= 0) {
        var t = pend, filled = false;
        if (EN.how === "nextopen") { if (i === t + 1) filled = tryEnter(i, t, pendAnc, P.O[i]); if (i >= t + 1) pend = -1; }
        else if (EN.how === "break" && i >= t + 1 && i <= t + bw) {
          var trig = dir < 0 ? P.L[t] - EN.offset : P.H[t] + EN.offset;
          if (dir < 0 ? P.L[i] <= trig : P.H[i] >= trig) { filled = tryEnter(i, t, pendAnc, dir < 0 ? Math.min(P.O[i], trig) : Math.max(P.O[i], trig)); }
        }
        if (!filled && pend >= 0 && i >= t + bw) pend = -1;
        if (filled) continue;
      }
      if (i >= 1 && (!A.on || (anc >= 0 && brk >= 0 && i > brk))) {
        diag.sigBars++;
        if (evalList(P, TR.conds, TR.mode, i, anc, diag.conds)) {
          diag.signals++; diag.sigIdx.push(i);
          if (EN.how === "close") tryEnter(i, i, anc, P.C[i]);
          else { pend = i; pendAnc = anc; }
        }
      }
    }
    if (pos) close(n - 1, pos.ent, "still open", true);
    trades.diag = diag; trades.P = P;
    return trades;
  }

  function summarize(tr, risk) {
    var d = tr.filter(function (t) { return !t.open; }), w = d.filter(function (t) { return t.pnl > 0; }), gw = 0, gl = 0, net = 0, sr = 0, best = 0, worst = 0, run = 0, pk = 0, dd = 0;
    d.forEach(function (t) { net += t.pnl; sr += t.R; if (t.pnl > 0) gw += t.pnl; else gl -= t.pnl; run += t.pnl; pk = Math.max(pk, run); dd = Math.max(dd, pk - run); });
    return { n: d.length, wins: w.length, wr: d.length ? w.length / d.length : 0, pf: gl > 0 ? gw / gl : (gw > 0 ? Infinity : 0), net: net, sumR: sr, exp: d.length ? sr / d.length : 0, dd: dd };
  }

  /* ---------- plain-English text ---------- */
  function fname(s) { return FMAP[s] ? FMAP[s][1].replace(/ \(.*\)$/, "").replace(/^Last candle's/, "last candle's") : String(s); }
  function opName(o) { return OPS.filter(function (x) { return x[0] === o; }).map(function (x) { return x[1]; })[0] || o; }
  function describe(c) {
    if (c.t === "is") { var nm = IS.filter(function (x) { return x[0] === c.v; }).map(function (x) { return x[1]; })[0] || c.v; return "the candle is " + (c.not ? "NOT " : "") + nm; }
    if (c.t === "run") return c.n + " " + c.color + " candles in a row";
    return fname(c.a).replace(/^./, function (m) { return m.toLowerCase(); }) + " " + opName(c.op) + " " + (FMAP[c.b] ? fname(c.b).toLowerCase() : c.b);
  }
  function sentence(st) {
    var L = [], sh = st.side === "short", e = st.entry, sp = st.stop, lst = function (a, m) { return a.map(describe).join(m === "any" ? " OR " : " AND "); };
    if (st.anchor.on) L.push("Find a marker candle where " + (lst(st.anchor.conds, st.anchor.mode) || "any candle works") + "." + (st.anchor.needBreak ? " Wait for price to break its " + (sh ? "low" : "high") + (st.anchor.within > 0 ? " within " + st.anchor.within + " candles" : "") + "." : "") + (st.anchor.never ? " Cancel it if price goes " + (sh ? "above its high" : "below its low") + "." : "") + (st.anchor.once ? " Trade each marker only once." : ""));
    L.push("Signal candle: " + (lst(st.trig.conds, st.trig.mode) || "any candle") + ".");
    L.push((sh ? "Short" : "Buy") + " " + (e.how === "break" ? "when price breaks the signal candle's " + (sh ? "low" : "high") + " by $" + e.offset + (e.within > 1 ? " (within " + e.within + " candles)" : " (next candle only)") : e.how === "close" ? "at the close of the signal candle" : "at the open of the next candle") + ".");
    L.push("Stop: " + ({ candle: "just beyond the signal candle ($" + sp.offset + " past it)", mid: "the middle of the signal candle", fixed: "$" + sp.v + " from entry", pct: sp.v + "% from entry", atr: sp.v + " x the average candle size from entry", anchor: "just beyond the marker candle ($" + sp.offset + " past it)" }[sp.how]) + ".");
    var tg = (st.targets || []).filter(function (t) { return t.pct > 0; });
    L.push(tg.length ? "Targets: " + tg.map(function (t, i) { return "sell " + t.pct + "% at " + (t.kind === "r" ? t.v + "R" : t.kind === "usd" ? "$" + t.v + " a share" : "VWAP"); }).join(", then ") + "." : "No targets: the trade ends at the stop or end of day.");
    var mv = []; if (st.mgmt.beAtR > 0) mv.push("move the stop to breakeven at " + st.mgmt.beAtR + "R"); if (st.mgmt.beAfterT1) mv.push("move the stop to breakeven after the first target"); if (st.mgmt.trail) mv.push("trail the stop behind each candle after the first target");
    if (mv.length) L.push("Then " + mv.join(", and ") + ".");
    var xr = []; if (st.exit.conds.length) xr.push("exit early if " + lst(st.exit.conds, st.exit.mode)); if (st.exit.maxBars > 0) xr.push("exit after " + st.exit.maxBars + " candles"); xr.push("exit everything at " + Math.floor(st.exit.eod / 100) + ":" + ("0" + st.exit.eod % 100).slice(-2));
    L.push(xr.join("; ") + ".");
    L.push("Only enter between " + Math.floor(st.window.start / 100) + ":" + ("0" + st.window.start % 100).slice(-2) + " and " + Math.floor(st.window.end / 100) + ":" + ("0" + st.window.end % 100).slice(-2) + "." + (st.limits.maxTrades > 0 ? " Max " + st.limits.maxTrades + " trades per chart." : "") + (st.limits.stopAfterLosses > 0 ? " Stop after " + st.limits.stopAfterLosses + " losses." : "") + (st.filters && st.filters.minPrice > 0 ? " Price at least $" + st.filters.minPrice + "." : "") + (st.filters && st.filters.minGap > 0 ? " Gap at least " + st.filters.minGap + "%." : "") + (st.filters && st.filters.maxGap > 0 ? " Gap at most " + st.filters.maxGap + "%." : ""));
    L.push("Risk $" + st.risk.dollars + " per trade, with $" + st.risk.slip + " slippage each way.");
    return L;
  }

  /* ---------- practice days ---------- */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function randomDay(seed, tf) {
    var R = mulberry(seed * 7919 + 13), rn = function (a, b) { return a + R() * (b - a); }, pc = r2(rn(3, 30)), gap = r2(rn(-4, 25)), o = r2(pc * (1 + gap / 100)), drift = rn(-0.03, 0.03), size = rn(0.004, 0.012), bars = Math.floor(390 / (tf || 2)), c = [], i;
    for (i = 0; i < bars; i++) {
      var r = o * size, d = drift + rn(-0.6, 0.6), cl = o + d * r * 1.2, hi = Math.max(o, cl) + r * rn(0.05, 0.4), lo = Math.min(o, cl) - r * rn(0.05, 0.4);
      c.push({ o: r2(o), h: r2(hi), l: r2(lo), c: r2(cl), v: Math.round(100000 * rn(0.5, 1.6) * (i < 12 ? 3.5 - i * 0.2 : 1)), k: "normal" }); o = cl;
    }
    return { name: "Practice day " + seed, pc: pc, gap: gap, tf: tf || 2, c: c, vw: {}, em: {} };
  }

  var PYTPL = "__HEADER__\nimport csv\nimport json\nimport math\nimport sys\n\nSTRATEGY = json.loads(r'''__STRATEGY__''')\nPREV_CLOSE = __PREV_CLOSE__    # yesterday's close (used by gap rules)\nTF = __TF__                     # candle size in minutes of your candles.csv\nNAN = float(\"nan\")\n\n\ndef hm(v):\n    v = int(round(v))\n    return (v // 100) * 60 + v % 100\n\n\ndef rnd2(x):\n    return math.floor(x * 100 + 0.5) / 100\n\n\ndef load_candles(path):\n    \"\"\"candles.csv columns: time,open,high,low,close,volume   (time like 09:30, one trading day per file)\"\"\"\n    rows = []\n    with open(path, newline=\"\") as f:\n        for r in csv.DictReader(f):\n            hh, mm = r[\"time\"].strip()[-5:].split(\":\")\n            rows.append({\"t\": int(hh) * 60 + int(mm), \"o\": float(r[\"open\"]), \"h\": float(r[\"high\"]),\n                         \"l\": float(r[\"low\"]), \"c\": float(r[\"close\"]), \"v\": float(r[\"volume\"])})\n    return rows\n\n\ndef prep(rows, pc):\n    n = len(rows)\n    P = {\"n\": n, \"O\": [r[\"o\"] for r in rows], \"H\": [r[\"h\"] for r in rows], \"L\": [r[\"l\"] for r in rows],\n         \"C\": [r[\"c\"] for r in rows], \"V\": [r[\"v\"] for r in rows], \"T\": [r[\"t\"] for r in rows],\n         \"vw\": [], \"em\": [], \"e20\": [], \"atr\": [], \"hod\": [], \"lod\": [], \"avgV\": [], \"tr\": []}\n    pv = cv = e = e2 = 0.0\n    for i in range(n):\n        h, l, c, v = P[\"H\"][i], P[\"L\"][i], P[\"C\"][i], P[\"V\"][i]\n        pv += (h + l + c) / 3 * v\n        cv += v\n        P[\"vw\"].append(pv / cv if cv else c)\n        e = e + 0.2 * (c - e) if i else c\n        P[\"em\"].append(e)\n        e2 = e2 + (2 / 21) * (c - e2) if i else c\n        P[\"e20\"].append(e2)\n        P[\"hod\"].append(max(P[\"hod\"][i - 1], h) if i else h)\n        P[\"lod\"].append(min(P[\"lod\"][i - 1], l) if i else l)\n        P[\"tr\"].append(max(h - l, abs(h - P[\"C\"][i - 1]), abs(l - P[\"C\"][i - 1])) if i else h - l)\n        lo = max(0, i - 13)\n        P[\"atr\"].append(sum(P[\"tr\"][lo:i + 1]) / (i - lo + 1))\n        if i:\n            lo = max(0, i - 10)\n            P[\"avgV\"].append(sum(P[\"V\"][lo:i]) / (i - lo))\n        else:\n            P[\"avgV\"].append(v)\n    P[\"pc\"] = pc if pc > 0 else 0\n    P[\"gap\"] = (P[\"O\"][0] / P[\"pc\"] - 1) * 100 if P[\"pc\"] > 0 and n else 0\n    return P\n\n\ndef fv(P, f, i, a):\n    o, h, l, c = P[\"O\"][i], P[\"H\"][i], P[\"L\"][i], P[\"C\"][i]\n    rg = h - l\n    if f == \"close\": return c\n    if f == \"open\": return o\n    if f == \"high\": return h\n    if f == \"low\": return l\n    if f == \"prevClose\": return P[\"C\"][i - 1] if i > 0 else NAN\n    if f == \"prevOpen\": return P[\"O\"][i - 1] if i > 0 else NAN\n    if f == \"prevHigh\": return P[\"H\"][i - 1] if i > 0 else NAN\n    if f == \"prevLow\": return P[\"L\"][i - 1] if i > 0 else NAN\n    if f == \"vwap\": return P[\"vw\"][i]\n    if f == \"ema9\": return P[\"em\"][i]\n    if f == \"ema20\": return P[\"e20\"][i]\n    if f == \"hod\": return P[\"hod\"][i]\n    if f == \"lod\": return P[\"lod\"][i]\n    if f == \"dayOpen\": return P[\"O\"][0]\n    if f == \"yClose\": return P[\"pc\"] if P[\"pc\"] > 0 else NAN\n    if f == \"anchorHigh\": return P[\"H\"][a] if a >= 0 else NAN\n    if f == \"anchorLow\": return P[\"L\"][a] if a >= 0 else NAN\n    if f == \"anchorMid\": return (P[\"H\"][a] + P[\"L\"][a]) / 2 if a >= 0 else NAN\n    if f == \"bouncePct\":\n        if a < 0 or a > i: return NAN\n        lo = min(P[\"L\"][a:i + 1])\n        den = P[\"H\"][a] - lo\n        return (h - lo) / den * 100 if den > 0 else 0\n    if f == \"bodyPct\": return abs(c - o) / rg * 100 if rg > 0 else 0\n    if f == \"upWickPct\": return (h - max(o, c)) / rg * 100 if rg > 0 else 0\n    if f == \"loWickPct\": return (min(o, c) - l) / rg * 100 if rg > 0 else 0\n    if f == \"range\": return rg\n    if f == \"atr\": return P[\"atr\"][i]\n    if f == \"volume\": return P[\"V\"][i]\n    if f == \"relVol\": return P[\"V\"][i] / P[\"avgV\"][i] if P[\"avgV\"][i] > 0 else 0\n    if f == \"gapPct\": return P[\"gap\"]\n    if f == \"vwapDist\": return (c - P[\"vw\"][i]) / P[\"vw\"][i] * 100 if P[\"vw\"][i] else 0\n    if f == \"barNo\": return i + 1\n    return NAN\n\n\nFIELD_IDS = set(\"close open high low prevClose prevOpen prevHigh prevLow vwap ema9 ema20 hod lod dayOpen yClose anchorHigh anchorLow anchorMid bouncePct bodyPct upWickPct loWickPct range atr volume relVol gapPct vwapDist barNo\".split())\n\n\ndef val(P, s, i, a):\n    if s in FIELD_IDS:\n        return fv(P, s, i, a)\n    try:\n        return float(s)\n    except ValueError:\n        return NAN\n\n\ndef is_test(P, k, i):\n    o, h, l, c = P[\"O\"][i], P[\"H\"][i], P[\"L\"][i], P[\"C\"][i]\n    rg = h - l\n    body = abs(c - o)\n    up = h - max(o, c)\n    lw = min(o, c) - l\n    if k == \"green\": return c > o\n    if k == \"red\": return c < o\n    if k == \"doji\": return rg > 0 and body <= rg * 0.10\n    if k == \"spin\": return rg > 0 and body <= rg * 0.30 and up >= rg * 0.25 and lw >= rg * 0.25\n    if k == \"hammer\": return rg > 0 and lw >= rg * 0.6 and body <= rg * 0.35 and up <= rg * 0.2\n    if k == \"inv\": return rg > 0 and up >= rg * 0.6 and body <= rg * 0.35 and lw <= rg * 0.2\n    if k == \"inside\": return i > 0 and h <= P[\"H\"][i - 1] and l >= P[\"L\"][i - 1]\n    if k == \"outside\": return i > 0 and h > P[\"H\"][i - 1] and l < P[\"L\"][i - 1]\n    if k == \"newHod\": return i == 0 or h > P[\"hod\"][i - 1]\n    if k == \"newLod\": return i == 0 or l < P[\"lod\"][i - 1]\n    if k == \"higherHigh\": return i > 0 and h > P[\"H\"][i - 1]\n    if k == \"lowerLow\": return i > 0 and l < P[\"L\"][i - 1]\n    if k == \"touchVwap\": return l <= P[\"vw\"][i] <= h\n    if k == \"touchEma\": return l <= P[\"em\"][i] <= h\n    if k == \"gapUp\": return P[\"gap\"] > 0\n    if k == \"gapDown\": return P[\"gap\"] < 0\n    return False\n\n\ndef eval_cond(P, c, i, a):\n    t = c[\"t\"]\n    if t == \"is\":\n        r = is_test(P, c[\"v\"], i)\n        return (not r) if c.get(\"not\") else r\n    if t == \"run\":\n        for k in range(int(c[\"n\"])):\n            j = i - k\n            if j < 0:\n                return False\n            ok = P[\"C\"][j] > P[\"O\"][j] if c[\"color\"] == \"green\" else P[\"C\"][j] < P[\"O\"][j]\n            if not ok:\n                return False\n        return True\n    x, y = val(P, c[\"a\"], i, a), val(P, c[\"b\"], i, a)\n    op = c[\"op\"]\n    if op == \">\": return x > y\n    if op == \"<\": return x < y\n    if op == \">=\": return x >= y\n    if op == \"<=\": return x <= y\n    if op == \"crossUp\": return i >= 1 and val(P, c[\"a\"], i - 1, a) <= val(P, c[\"b\"], i - 1, a) and x > y\n    if op == \"crossDn\": return i >= 1 and val(P, c[\"a\"], i - 1, a) >= val(P, c[\"b\"], i - 1, a) and x < y\n    return False\n\n\ndef eval_list(P, lst, mode, i, a):\n    if not lst:\n        return True\n    rs = [eval_cond(P, c, i, a) for c in lst]\n    return any(rs) if mode == \"any\" else all(rs)\n\n\ndef run_day(rows, prev_close=None, st=None):\n    \"\"\"Walks the candles one by one. Returns (trades, state). state describes a signal waiting on the last candle.\"\"\"\n    st = st or STRATEGY\n    P = prep(rows, PREV_CLOSE if prev_close is None else prev_close)\n    n = P[\"n\"]\n    d = 1 if st[\"side\"] == \"long\" else -1\n    RK, A, TR, EN, SP, MG, EX, WN, LM = st[\"risk\"], st[\"anchor\"], st[\"trig\"], st[\"entry\"], st[\"stop\"], st[\"mgmt\"], st[\"exit\"], st[\"window\"], st[\"limits\"]\n    FL = st.get(\"filters\") or {}\n    slip = RK.get(\"slip\", 0) or 0\n    S = {\"trades\": [], \"pos\": None, \"pend\": -1, \"pend_anc\": -1, \"anc\": -1, \"brk\": -1, \"used\": set(), \"nT\": 0, \"losses\": 0, \"last_exit\": -1e9}\n    eod_min, t0, t1 = hm(EX.get(\"eod\") or 1556), hm(WN[\"start\"]), hm(WN[\"end\"])\n    tgs = [t for t in (st.get(\"targets\") or []) if t[\"pct\"] > 0 and (t[\"kind\"] == \"vwap\" or t[\"v\"] > 0)]\n    bw = max(1, EN.get(\"within\") or 1)\n\n    def stop_px(t, ai, ent):\n        off = SP.get(\"offset\") or 0\n        how = SP[\"how\"]\n        if how == \"mid\": return (P[\"H\"][t] + P[\"L\"][t]) / 2 + (off if d < 0 else -off)\n        if how == \"fixed\": return ent - d * SP[\"v\"]\n        if how == \"pct\": return ent * (1 - d * SP[\"v\"] / 100)\n        if how == \"atr\": return ent - d * SP[\"v\"] * P[\"atr\"][t]\n        if how == \"anchor\" and ai >= 0: return P[\"H\"][ai] + off if d < 0 else P[\"L\"][ai] - off\n        return P[\"H\"][t] + off if d < 0 else P[\"L\"][t] - off\n\n    def try_enter(bar, t, ai, px):\n        tm = P[\"T\"][bar]\n        if tm < t0 or tm > t1: return False\n        if LM.get(\"maxTrades\", 0) > 0 and S[\"nT\"] >= LM[\"maxTrades\"]: return False\n        if LM.get(\"stopAfterLosses\", 0) > 0 and S[\"losses\"] >= LM[\"stopAfterLosses\"]: return False\n        if bar - S[\"last_exit\"] <= (LM.get(\"cooldown\") or 0): return False\n        if FL.get(\"minPrice\", 0) > 0 and P[\"C\"][t] < FL[\"minPrice\"]: return False\n        if FL.get(\"minGap\", 0) > 0 and P[\"gap\"] < FL[\"minGap\"]: return False\n        if FL.get(\"maxGap\", 0) > 0 and P[\"gap\"] > FL[\"maxGap\"]: return False\n        ent = px + d * slip\n        sp = stop_px(t, ai, ent)\n        if (sp <= ent) if d < 0 else (sp >= ent): return False\n        rps = abs(sp - ent)\n        qty = int(math.floor(RK[\"dollars\"] / max(rps, RK.get(\"minRiskPS\") or 0)))\n        if qty < 1: return False\n        rem, cum, tg = qty, 0.0, []\n        for g in tgs:\n            cum += g[\"pct\"]\n            q = rem if cum >= 99.99 else min(rem, int(math.floor(qty * g[\"pct\"] / 100 + 0.5)))\n            rem -= q\n            lv = ent + d * g[\"v\"] * rps if g[\"kind\"] == \"r\" else (ent + d * g[\"v\"] if g[\"kind\"] == \"usd\" else NAN)\n            tg.append({\"kind\": g[\"kind\"], \"q\": q, \"lv\": lv, \"hit\": False})\n        S[\"pos\"] = {\"t\": t, \"ai\": ai, \"ei\": bar, \"ent\": ent, \"stop0\": sp, \"stop\": sp, \"rps\": rps, \"qty\": qty, \"rem\": qty,\n                    \"tg\": tg, \"fills\": [], \"mfe\": 0.0, \"any\": False}\n        S[\"pend\"] = -1\n        S[\"nT\"] += 1\n        if A[\"on\"] and A.get(\"once\") and ai >= 0:\n            S[\"used\"].add(ai)\n            S[\"anc\"], S[\"brk\"] = -1, -1\n        return True\n\n    def fill(lab, q, px):\n        pos = S[\"pos\"]\n        if q > 0:\n            pos[\"fills\"].append((lab, q, px))\n            pos[\"rem\"] -= q\n\n    def close(bar, px, why, is_open=False):\n        pos = S[\"pos\"]\n        if pos[\"rem\"] > 0:\n            fill(\"rest\", pos[\"rem\"], px)\n        pnl = qs = ps = 0.0\n        parts = []\n        for lab, q, p in pos[\"fills\"]:\n            pnl += d * (p - pos[\"ent\"]) * q\n            qs += q\n            ps += q * p\n            if lab != \"rest\":\n                parts.append(lab)\n        first = pos[\"ent\"]\n        if pos[\"tg\"]:\n            first = P[\"vw\"][pos[\"ei\"]] if math.isnan(pos[\"tg\"][0][\"lv\"]) else pos[\"tg\"][0][\"lv\"]\n        S[\"trades\"].append({\"signal_bar\": pos[\"t\"], \"entry_bar\": pos[\"ei\"], \"exit_bar\": bar, \"side\": \"long\" if d > 0 else \"short\",\n                            \"entry\": rnd2(pos[\"ent\"]), \"exit\": rnd2(ps / qs if qs else pos[\"ent\"]), \"stop\": rnd2(pos[\"stop0\"]),\n                            \"target1\": rnd2(first), \"shares\": pos[\"qty\"], \"pnl\": rnd2(pnl), \"R\": pnl / RK[\"dollars\"],\n                            \"why\": why, \"parts\": parts, \"open\": is_open})\n        if not is_open:\n            if pnl < 0: S[\"losses\"] += 1\n            S[\"last_exit\"] = bar\n        S[\"pos\"] = None\n\n    def manage(bar):\n        pos = S[\"pos\"]\n        o = P[\"O\"][bar]\n        if P[\"T\"][bar] >= eod_min:\n            close(bar, o - d * slip, \"end of day\")\n            return True\n        hit = P[\"H\"][bar] >= pos[\"stop\"] if d < 0 else P[\"L\"][bar] <= pos[\"stop\"]\n        if hit:\n            px = max(pos[\"stop\"], o) + slip if d < 0 else min(pos[\"stop\"], o) - slip\n            close(bar, px, \"stop after a target\" if pos[\"any\"] else \"stop\")\n            return True\n        for k, g in enumerate(pos[\"tg\"]):\n            if g[\"hit\"]:\n                continue\n            lvl = P[\"vw\"][bar] if g[\"kind\"] == \"vwap\" else g[\"lv\"]\n            if g[\"kind\"] == \"vwap\" and not ((lvl < pos[\"ent\"]) if d < 0 else (lvl > pos[\"ent\"])):\n                continue\n            if (P[\"L\"][bar] <= lvl) if d < 0 else (P[\"H\"][bar] >= lvl):\n                px = min(lvl, o) + slip if d < 0 else max(lvl, o) - slip\n                fill(\"T%d\" % (k + 1), g[\"q\"], px)\n                g[\"hit\"] = True\n                pos[\"any\"] = True\n        if pos[\"rem\"] <= 0:\n            close(bar, pos[\"ent\"], \"all targets\")\n            return True\n        fav = pos[\"ent\"] - P[\"L\"][bar] if d < 0 else P[\"H\"][bar] - pos[\"ent\"]\n        if fav > pos[\"mfe\"]:\n            pos[\"mfe\"] = fav\n        be = (MG.get(\"beAtR\", 0) > 0 and pos[\"mfe\"] >= MG[\"beAtR\"] * pos[\"rps\"]) or (MG.get(\"beAfterT1\") and pos[\"any\"])\n        if be:\n            pos[\"stop\"] = min(pos[\"stop\"], pos[\"ent\"]) if d < 0 else max(pos[\"stop\"], pos[\"ent\"])\n        if MG.get(\"trail\") and pos[\"any\"]:\n            pos[\"stop\"] = min(pos[\"stop\"], P[\"H\"][bar]) if d < 0 else max(pos[\"stop\"], P[\"L\"][bar])\n        if EX[\"conds\"] and eval_list(P, EX[\"conds\"], EX.get(\"mode\", \"any\"), bar, -1):\n            close(bar, P[\"C\"][bar] - d * slip, \"exit rule\")\n            return True\n        if EX.get(\"maxBars\", 0) > 0 and bar - pos[\"ei\"] >= EX[\"maxBars\"]:\n            close(bar, P[\"C\"][bar] - d * slip, \"held too long\")\n            return True\n        return False\n\n    for i in range(n):\n        closed_now = False\n        if S[\"pos\"] is not None and i > S[\"pos\"][\"ei\"]:\n            closed_now = manage(i)\n        if A[\"on\"]:\n            if S[\"anc\"] >= 0:\n                anc = S[\"anc\"]\n                bad = P[\"H\"][i] > P[\"H\"][anc] if d < 0 else P[\"L\"][i] < P[\"L\"][anc]\n                if A.get(\"never\") and bad:\n                    S[\"anc\"], S[\"brk\"] = -1, -1\n                elif S[\"brk\"] < 0:\n                    broke = P[\"L\"][i] < P[\"L\"][anc] if d < 0 else P[\"H\"][i] > P[\"H\"][anc]\n                    if broke:\n                        S[\"brk\"] = i\n                    elif A.get(\"within\", 0) > 0 and i - anc >= A[\"within\"]:\n                        S[\"anc\"] = -1\n            if S[\"anc\"] < 0 and i not in S[\"used\"] and eval_list(P, A[\"conds\"], A.get(\"mode\", \"all\"), i, -1):\n                S[\"anc\"] = i\n                S[\"brk\"] = -1 if A.get(\"needBreak\") else i\n        if S[\"pos\"] is not None or closed_now:\n            continue\n        if S[\"pend\"] >= 0:\n            t = S[\"pend\"]\n            filled = False\n            if EN[\"how\"] == \"nextopen\":\n                if i == t + 1:\n                    filled = try_enter(i, t, S[\"pend_anc\"], P[\"O\"][i])\n                if i >= t + 1:\n                    S[\"pend\"] = -1\n            elif EN[\"how\"] == \"break\" and t + 1 <= i <= t + bw:\n                trig = P[\"L\"][t] - EN[\"offset\"] if d < 0 else P[\"H\"][t] + EN[\"offset\"]\n                if (P[\"L\"][i] <= trig) if d < 0 else (P[\"H\"][i] >= trig):\n                    filled = try_enter(i, t, S[\"pend_anc\"], min(P[\"O\"][i], trig) if d < 0 else max(P[\"O\"][i], trig))\n            if not filled and S[\"pend\"] >= 0 and i >= t + bw:\n                S[\"pend\"] = -1\n            if filled:\n                continue\n        if i >= 1 and (not A[\"on\"] or (S[\"anc\"] >= 0 and S[\"brk\"] >= 0 and i > S[\"brk\"])):\n            if eval_list(P, TR[\"conds\"], TR[\"mode\"], i, S[\"anc\"]):\n                if EN[\"how\"] == \"close\":\n                    try_enter(i, i, S[\"anc\"], P[\"C\"][i])\n                else:\n                    S[\"pend\"], S[\"pend_anc\"] = i, S[\"anc\"]\n    if S[\"pos\"] is not None:\n        close(n - 1, S[\"pos\"][\"ent\"], \"still open\", True)\n    state = {\"pending_signal_bar\": S[\"pend\"] if S[\"pend\"] == n - 1 else -1, \"P\": P, \"anchor\": S[\"pend_anc\"], \"dir\": d}\n    return S[\"trades\"], state\n\n\ndef summarize(trades):\n    done = [t for t in trades if not t[\"open\"]]\n    wins = [t for t in done if t[\"pnl\"] > 0]\n    gw = sum(t[\"pnl\"] for t in wins)\n    gl = -sum(t[\"pnl\"] for t in done if t[\"pnl\"] <= 0)\n    net = sum(t[\"pnl\"] for t in done)\n    n = len(done)\n    return {\"trades\": n, \"win_rate\": len(wins) / n if n else 0, \"profit_factor\": (gw / gl) if gl > 0 else None,\n            \"net\": round(net, 2), \"total_R\": round(sum(t[\"R\"] for t in done), 2)}\n\n\ndef live_plan(rows, prev_close=None):\n    \"\"\"Call after each NEW CLOSED candle. Returns the order to place for the next candle, or None.\"\"\"\n    trades, state = run_day(rows, prev_close)\n    t = state[\"pending_signal_bar\"]\n    if t < 0:\n        return None\n    P, d, st = state[\"P\"], state[\"dir\"], STRATEGY\n    EN = st[\"entry\"]\n    if EN[\"how\"] == \"break\":\n        trig = P[\"L\"][t] - EN[\"offset\"] if d < 0 else P[\"H\"][t] + EN[\"offset\"]\n        kind = \"stop order at \" + (\"%.2f\" % trig) + \" (good for %d candle(s))\" % max(1, EN.get(\"within\") or 1)\n    elif EN[\"how\"] == \"nextopen\":\n        trig, kind = None, \"market order at the open of the next candle\"\n    else:\n        trig, kind = None, \"already entered at the close\"\n    return {\"side\": \"sell short\" if d < 0 else \"buy\", \"signal_candle\": t, \"order\": kind, \"trigger_price\": trig,\n            \"note\": \"Stop, size and targets are worked out when the order fills (see run_day).\"}\n\n\nif __name__ == \"__main__\":\n    path = sys.argv[1] if len(sys.argv) > 1 else \"candles.csv\"\n    rows = load_candles(path)\n    trades, _ = run_day(rows)\n    for t in trades:\n        print(t)\n    print(summarize(trades))\n";
  function pythonCode(st, meta) {
    meta = meta || {};
    var head = '"""\nBot strategy: ' + st.name.replace(/"""/g, "") + '\nBuilt in the Revatour Backtest Lab on ' + new Date().toISOString().slice(0, 10) + '.\n' + (meta.result ? meta.result + "\n" : "") + '\nIn plain English:\n' + sentence(st).map(function (l) { return "  - " + l; }).join("\n") + '\n\nHow to use (Windows):\n  1. Install Python from python.org (tick "Add Python to PATH"). Nothing else to install.\n  2. Save your candles as candles.csv with columns: time,open,high,low,close,volume   (e.g. 09:30, one day per file)\n  3. Set PREV_CLOSE and TF below, then run:  python bot.py\n  4. In your own code call live_plan(rows) after each new closed candle to get the order to place. Use a PAPER account first.\n"""';
    return PYTPL.replace("__HEADER__", function () { return head; }).replace("__STRATEGY__", function () { return JSON.stringify(st, null, 2); }).replace("__PREV_CLOSE__", function () { return String(meta.pc || 0); }).replace("__TF__", function () { return String(meta.tf || 2); });
  }

  G.BTEngine = { fv: fv, isTest: isTest, val: val, evalCond: evalCond, FIELDS: FIELDS, FMAP: FMAP, IS: IS, OPS: OPS, TEMPLATES: TEMPLATES, blank: blank, C: C, IZ: IZ, run: run, prep: prep, summarize: summarize, describe: describe, sentence: sentence, randomDay: randomDay, pythonCode: pythonCode, HM: HM };
  if (typeof module !== "undefined" && module.exports) module.exports = G.BTEngine;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
