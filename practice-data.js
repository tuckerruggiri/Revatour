/* Practice chart data: scripted, repeatable fake gapper stocks (5 sessions each).
   Master candles are built on the 2-minute chart (your main chart) and split into two 1-minute bars each,
   so the 1, 2, 5 and 15 minute charts always agree. Setups are planted with your rules, and each one is
   checked by an independent test (see qa()). Nothing here is real market data. */
(function (root) {
  "use strict";
  var PER = 195, MIN = 390, NDAY = 5;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function r2(x) { return Math.round(x * 100) / 100; }

  var RULES = {
    "SL1 RV": ["First candle to touch the 9 EMA", "Opposite-color candle makes a new {hl}", "{hlow} hammer / doji / inside bar = TRIGGER", "Next candle breaks the trigger {hl2}: ENTRY"],
    "FP9-A": ["First pullback touches the 9 EMA and holds", "Small candle at the EMA = TRIGGER", "Next candle breaks the trigger {hl2}: ENTRY"],
    "FP9-V": ["Pullback comes down to VWAP and holds", "Small candle at VWAP = TRIGGER", "Next candle breaks the trigger {hl2}: ENTRY"],
    "FP9-S": ["First bounce reaches the 9 EMA and fails", "Small candle at the EMA = TRIGGER", "Next candle breaks the trigger low: ENTRY"]
  };

  /* SL1-RV-2' short (your rule): a run of candles that keep breaking each other's highs, then the FIRST NEW LOW (candle i).
     After it, the first green candle (g) starts the search, then a trigger candle t (green or red, never the new-low candle)
     with a lower high and a smaller range than the new-low candle. The short is the next candle breaking the trigger's low. */
  function v2shape(C, t, top) { // what kind of small trigger candle is this? ('' = not a trigger shape)
    var c = C[t], rg = c.h - c.l; if (rg <= 0 || c.h >= top) return "";
    var body = Math.abs(c.c - c.o), up = c.h - Math.max(c.o, c.c), dn = Math.min(c.o, c.c) - c.l;
    if (t > 0 && c.h <= C[t - 1].h && c.l >= C[t - 1].l) return "inside bar";
    if (body <= 0.15 * rg) return "doji";
    if (body <= 0.4 * rg && up >= 0.5 * rg && dn <= 0.2 * rg) return "inverted hammer";
    return "";
  }
  function v2find(C, E, i) {
    if (i < 5 || i + 3 >= C.length) return null; var day = Math.floor(i / PER); if (Math.floor((i + 3) / PER) !== day) return null;
    if (!(C[i].l < C[i - 1].l)) return null;
    var j = i - 1, back = 0;
    while (j > 0 && !(C[j].h > C[j - 1].h) && back < 2) { if (C[j].l < C[j - 1].l) return null; j--; back++; }
    var run = 0, k = j; while (k > 0 && Math.floor((k - 1) / PER) === day && C[k].h > C[k - 1].h) { run++; k--; } // the run only needs higher highs (a wick below the last low does not cancel it)
    if (run < 3 || !(C[i - 1].h > E[i - 1])) return null; // the candle before the new low may sit right on the 9 EMA
    var top = 0; for (var q = k + 1; q <= i - 1; q++) if (C[q].h > top) top = C[q].h;
    if (top < E[i - 1] * 1.004) return null;
    var g = -1; for (q = i + 1; q <= i + 3; q++) if (C[q].c > C[q].o) { g = q; break; } if (g < 0) return null;
    var skipped = null;
    for (var t = g; t <= g + 3 && t + 1 < C.length && Math.floor((t + 1) / PER) === day; t++) {
      var T = C[t], Eb = C[t + 1], sh = v2shape(C, t, top); if (!sh || (T.h - T.l) >= (C[i].h - C[i].l)) continue;
      if (Eb.l < T.l && Eb.h < r2(T.h + 0.02)) return { runStart: k + 1, runEnd: j, nl: i, g: g, t: t, e: t + 1, shape: sh, skipped: skipped };
      if (!skipped) skipped = { i: t, shape: sh }; // looked like a trigger, but the next candle never broke its low: keep moving
    }
    return null;
  }

  /* SL-1-RV 2' long = the mirror: a run of candles that keep breaking each other's lows (it reaches the 9 EMA), then the FIRST NEW HIGH (candle i).
     After it, the first red candle (g) starts the search, then a trigger candle t (green or red, never the new-high candle) with a higher low
     and a smaller range than the new-high candle. The long is the next candle breaking the trigger's high. Stop is 2 cents below the trigger low. */
  function v2shapeL(C, t, bot) {
    var c = C[t], rg = c.h - c.l; if (rg <= 0 || c.l <= bot) return "";
    var body = Math.abs(c.c - c.o), up = c.h - Math.max(c.o, c.c), dn = Math.min(c.o, c.c) - c.l;
    if (t > 0 && c.h <= C[t - 1].h && c.l >= C[t - 1].l) return "inside bar";
    if (body <= 0.15 * rg) return "doji";
    if (body <= 0.4 * rg && dn >= 0.5 * rg && up <= 0.2 * rg) return "hammer";
    return "";
  }
  function v2findL(C, E, i) {
    if (i < 5 || i + 3 >= C.length) return null; var day = Math.floor(i / PER); if (Math.floor((i + 3) / PER) !== day) return null;
    if (!(C[i].h > C[i - 1].h)) return null;
    var j = i - 1, back = 0;
    while (j > 0 && !(C[j].l < C[j - 1].l) && back < 2) { if (C[j].h > C[j - 1].h) return null; j--; back++; }
    var run = 0, k = j; while (k > 0 && Math.floor((k - 1) / PER) === day && C[k].l < C[k - 1].l && C[k].h <= C[k - 1].h) { run++; k--; }
    if (run < 1 || !(C[j].c < C[j].o)) return null; // the low is a red candle that makes a lower low
    var bot = 1e9; for (var q = k + 1; q <= i - 1; q++) if (C[q].l < bot) bot = C[q].l;
    if (bot > E[i - 1] * 1.004) return null; // the pullback reaches the 9 EMA
    var g = -1; for (q = i + 1; q <= i + 3; q++) if (C[q].c < C[q].o) { g = q; break; } if (g < 0) return null;
    var skipped = null;
    for (var t = g; t <= g + 3 && t + 1 < C.length && Math.floor((t + 1) / PER) === day; t++) {
      var T = C[t], Eb = C[t + 1], sh = v2shapeL(C, t, bot); if (!sh || (T.h - T.l) >= (C[i].h - C[i].l)) continue;
      if (Eb.h > T.h && Eb.l > r2(T.l - 0.02)) return { runStart: k + 1, runEnd: j, nl: i, g: g, t: t, e: t + 1, shape: sh, skipped: skipped };
      if (!skipped) skipped = { i: t, shape: sh };
    }
    return null;
  }

  function build(cfg) {
    var R = rng(cfg.seed), u = cfg.start * 0.004, C = [], M = [], E = [], V = [], S = [], D = [], MA = [], csum = 0, ema = 0, pv = 0, vv = 0, vw = 0, prev = cfg.start, sid = 0;
    function lc() { return C[C.length - 1].c; }
    function prof(d) { return 0.5 + 2.6 * Math.exp(-d / 9) + (d > 170 ? 0.45 * (d - 170) / 25 : 0); }
    function bar(o, c, H, L, hH, hL, v) {
      var mx = Math.max(o, c), mn = Math.min(o, c), h = hH ? H : r2(mx + (H - mx) * R() * 0.6), l = hL ? L : r2(mn - (mn - L) * R() * 0.6);
      h = Math.max(h, mx); l = Math.min(l, mn); pv += (h + l + c) / 3 * v; vv += v; vw = pv / vv;
      return { o: o, h: h, l: l, c: c, v: v, w: vw };
    }
    function push(o, h, l, c, vm) {
      o = r2(o); c = r2(c); h = r2(Math.max(h, o, c)); l = r2(Math.min(l, o, c));
      var i = C.length, d = i % PER, body = Math.abs(c - o) / u;
      var v = Math.max(1000, Math.round(cfg.vol * prof(d) * (0.75 + 0.5 * R()) * (1 + 0.25 * body) * (vm || 1) / 100) * 100);
      C.push({ o: o, h: h, l: l, c: c, v: v }); csum += c; if (C.length > 200) csum -= C[C.length - 201].c; MA.push(csum / Math.min(C.length, 200)); ema = i ? ema + 0.2 * (c - ema) : c; E.push(ema);
      var m = r2(o + (c - o) * (0.35 + 0.3 * R())), hf = R() < 0.5, lf = R() < 0.5, v1 = Math.round(v * (0.45 + 0.1 * R()) / 100) * 100, v2 = v - v1;
      M.push(bar(o, m, h, l, hf, lf, v1), bar(m, c, h, l, !hf, !lf, v2)); V.push(vw);
      return i;
    }
    function K(s, o, c, ag, wi, vm) { return s > 0 ? push(o, wi, ag, c, vm) : push(o, ag, wi, c, vm); }
    function wiOf(s, i) { return s > 0 ? C[i].h : C[i].l; }
    function agOf(s, i) { return s > 0 ? C[i].l : C[i].h; }
    function walk(n, pct, vol) {
      vol = vol || 1; var tgt = lc() * (1 + pct / 100);
      for (var k = 0; k < n; k++) {
        var o = lc(), step = (tgt - o) / (n - k), c = o + step + (R() - 0.5) * 2 * u * 0.9 * vol;
        push(o, Math.max(o, c) + (R() * 0.55 * vol + 0.1) * u, Math.min(o, c) - (R() * 0.55 * vol + 0.1) * u, c, 1);
      }
    }
    function startDay(d) {
      pv = 0; vv = 0; var op = r2(prev * 1.025); D.push({ open: op, prev: prev, i0: C.length });
      var c = op + 1.6 * u; push(op, c + 0.4 * u, op - 0.5 * u, c, 2.6);
    }
    function fnEma() { return ema; } function fnVw() { return vw; }
    function ensure(s, pct, fn) { var n = 0; while (s * (lc() - fn()) < pct / 100 * lc() && n++ < 40) { var o = lc(), c = o + s * (1 + 0.8 * R()) * u; K(s, o, c, o - s * 0.2 * u * R(), c + s * 0.3 * u * R(), 1.1); } }
    function clear(s, fn, n) { // push with-trend candles until the last n candles are all clear of the anchor
      var g = 0; function bad() { for (var q = 1; q <= n; q++) { var i = C.length - q; if (i < 0) break; var a = fn === fnEma ? E[i] : V[i]; if (s * (agOf(s, i) - a) <= 0) return true; } return false; }
      while (bad() && g++ < 14) { var o = lc(), c = o + s * (0.7 + 0.5 * R()) * u; K(s, o, c, o - s * 0.15 * u * R(), c + s * 0.25 * u * R(), 1); }
    }
    function approach(s, fn) {
      var n = 0; while (n++ < 30) {
        var o = lc(), d = s * (o - fn()); if (d <= 2.4 * u) break;
        var st = Math.max(0.6 * u, (d - 1.6 * u) * 0.5), c = o - s * st; K(s, o, c, c - s * (0.1 + 0.25 * R()) * u, o + s * (0.1 + 0.2 * R()) * u, 0.9);
      }
    }
    function touch(s, anchor) {
      var o = lc(), wi = o + s * 0.2 * u, c, ag;
      if (anchor === "ema") { c = r2(ema + s * 0.6 * u); ag = (ema + 0.2 * (c - ema)) - s * 0.25 * u; }
      else { c = r2(vw + s * 0.7 * u); ag = vw - s * 0.3 * u; }
      return K(s, o, c, ag, wi, 1);
    }
    function trigger(s, wick) { var o = lc(), c = o + s * 0.1 * u; return K(s, o, c, o - s * wick * u, c + s * 0.12 * u, 0.8); }
    function run(s, entry, Rr, mult, n) {
      var T = entry + s * mult * Rr, c0 = lc(), end = T + s * 0.1 * Rr;
      for (var k = 0; k < n; k++) {
        var o = lc(), last = k === n - 1, c = last ? end : c0 + (end - c0) * (k + 1) / n + (R() - 0.5) * 0.3 * u;
        var ext = (s > 0 ? Math.max(o, c) : Math.min(o, c)) + s * (0.15 + 0.3 * R()) * u; if (last) ext = s > 0 ? Math.max(ext, T + 0.3 * Rr) : Math.min(ext, T - 0.3 * Rr);
        K(s, o, c, o - s * 0.1 * u * R(), ext, 1.5);
      }
    }
    function settle(s, entry, Rr, n) {
      for (var k = 0; k < n; k++) { var o = lc(), c = entry + s * (0.45 + 0.3 * R()) * Rr; K(s, o, c, Math.min(o, c) - 0 + (s > 0 ? -0.1 : 0.1) * u * R(), (s > 0 ? Math.max(o, c) : Math.min(o, c)) + s * 0.15 * u * R(), 0.8); }
    }
    function lose(s, stop) {
      var o = lc(), c = stop - s * 0.5 * u; K(s, o, c, c - s * 0.2 * u, o + s * 0.1 * u, 1.6);
      o = lc(); c = o - s * 0.6 * u; K(s, o, c, c - s * 0.2 * u, o + s * 0.1 * u, 1.2);
    }
    function finish(s, ti, out) {
      var entry = r2(wiOf(s, ti) + s * 0.01), stop = r2(agOf(s, ti) - s * 0.01), Rr = Math.abs(entry - stop);
      var k = { win5: 0.8, win15: 0.6, win07: 0.3, loss: 0.08 }[out]; if (k === undefined) throw new Error("bad outcome " + out);
      var o = lc(), c = entry + s * k * Rr, ei = K(s, o, c, o - s * 0.1 * u, c + s * 0.15 * Rr, 1.8);
      if (out === "win5") run(s, entry, Rr, 5, 9); else if (out === "win15") run(s, entry, Rr, 1.55, 4); else if (out === "win07") { run(s, entry, Rr, 0.75, 2); settle(s, entry, Rr, 3); } else lose(s, stop);
      return { ei: ei, entry: entry, stop: stop, R: Rr, end: C.length - 1 };
    }
    function hl(s) { return s > 0 ? "high" : "low"; }
    function reg(o) { o.id = ++sid; S.push(o); return o; }

    function SL1(s, variant, out) {
      ensure(s, 1.0, fnEma); clear(s, fnEma, 6); approach(s, fnEma); var t = touch(s, "ema");
      var o = lc(), wi = wiOf(s, t) + s * 0.5 * u, c = o + s * Math.min(1.5 * u, s * (wi - o) - 0.25 * u), r = K(s, o, c, o - s * 0.15 * u, wi, 1.2);
      if (s > 0) { o = lc(); c = o - 0.5 * u; K(s, o, c, c - 0.2 * u, o + 0.1 * u, 0.8); } // the red candle after the new high (SL-1-RV 2' long needs it)
      if (variant === "B") { o = lc(); c = o - s * 0.5 * u; K(s, o, c, c - s * 0.2 * u, o + s * 0.1 * u, 0.8); }
      var ti;
      if (s > 0) { o = lc(); c = o + 0.15 * u; ti = K(s, o, c, o - 0.45 * u, c + 0.05 * u, 0.8); } else ti = trigger(s, 1.0); // long: small hammer with a higher low
      var f = finish(s, ti, out);
      return; // both directions are labeled by the SL-1-RV 2' rule scans below
    }
    function FP9(s, anchor, out) {
      var fn = anchor === "ema" ? fnEma : fnVw; ensure(s, anchor === "ema" ? 1.0 : 1.3, fn); clear(s, fn, 6); approach(s, fn);
      var t = touch(s, anchor), ti = trigger(s, 0.5), f = finish(s, ti, out);
      var nm = s < 0 ? "FP9-S" : (anchor === "ema" ? "FP9-A" : "FP9-V"), what = anchor === "ema" ? "9 EMA" : "VWAP";
      var first = s < 0 ? "First bounce reaches the " + what + " and fails" : (anchor === "ema" ? "First pullback touches the 9 EMA and holds" : "Pullback comes down to VWAP and holds");
      reg({ name: nm, s: s, kind: "setup", steps: [{ i: t, t: "1  " + first }, { i: ti, t: "2  Small candle at the " + what + " = TRIGGER", trig: 1 }, { i: f.ei, t: "3  Next candle breaks the trigger " + (s > 0 ? "high" : "low") + ": ENTRY", entry: 1 }], trig: ti, ent: f.ei, entry: f.entry, stop: f.stop, R: f.R, end: f.end });
    }
    function drift(s, n) { for (var k = 0; k < n; k++) { var o = lc(), c = o - s * (0.8 + 0.4 * R()) * u; K(s, o, c, c - s * 0.2 * u, o + s * 0.15 * u, 1); } }
    function SL1S(out) { // SL1 RV short, version 2 (your read): extended red candle, new low, green inside-bar trigger
      var s = -1; ensure(1, 1.7, fnEma); var o = lc(), c = o + (0.9 + 0.4 * R()) * u; K(1, o, c, o - 0.1 * u, c + 0.2 * u, 1.2); // a green push so the red candle is the FIRST red
      o = lc(); c = o - 0.9 * u; var A = K(1, o, c, c - 0.2 * u, o + 0.15 * u, 1.3); // step 1: red candle, still above the EMA and extended
      o = lc(); c = o - 0.7 * u; var B = K(1, o, c, c - 0.25 * u, o + 0.1 * u, 1.2); // step 2: breaks the low of step 1
      o = lc(); c = o + 0.45 * u; var T = K(1, o, c, o - 0.05 * u, c + 0.1 * u, 0.8); // step 3: green inside bar, lower high = trigger
      var f = finish(s, T, out);
      void A; void B; void T; void f; // labeled by the rule scan below
    }
    function IB15(out) { // SL-15 (IB): gap-up stock fades into the 200 MA, small 15m inside bar holds it, long above its high, room up to VWAP
      var s = 1, need = (15 - (C.length % PER) % 15) % 15, ma0 = MA[C.length - 1];
      if (need === 0 && lc() < ma0 + 6 * u) need = 15;
      if (need > 0) { var tg = Math.max(lc(), ma0 + 22 * u); walk(need, (tg / lc() - 1) * 100); }
      var lc0 = lc(), n0 = C.length, L0 = r2(MA[n0 - 1] + 0.4 * u);
      for (var it = 0; it < 4; it++) { // where will the slowly moving 200 MA be once this block is built? keep the inside bar just above it
        var sm = csum, nn = n0, cl = [], q2;
        for (q2 = 1; q2 <= 7; q2++) cl.push(lc0 - (lc0 - (L0 + 0.3 * u)) * q2 / 7); for (q2 = 0; q2 < 8; q2++) cl.push(L0 + 0.55 * u);
        cl.forEach(function (x) { sm += x; if (nn >= 200) sm -= C[nn - 200].c; nn++; });
        L0 = r2(sm / Math.min(nn, 200) + 0.1 * u);
      }
      var D0 = lc0 - (L0 + 0.3 * u); if (D0 < 4 * u) throw new Error("sl15 fade too small");
      var o, c, k, step = D0 / 7;
      for (k = 0; k < 7; k++) { o = lc(); c = k === 6 ? L0 + 0.3 * u : o - step + (R() - 0.5) * 0.3 * u; K(s, o, c, k === 6 ? L0 : c - 0.2 * u * R(), o + 0.15 * u * R(), 1.2); } // the pullback bar: 7 red candles down to the 200 MA
      var IBL = r2(L0 + 0.2 * u), IBH = r2(IBL + 0.9 * u), mid = IBL + 0.55 * u;
      for (k = 0; k < 8; k++) { // the inside bar: 8 tiny candles inside the band, holding above the MA
        o = lc(); c = k === 7 ? IBH - 0.35 * u : mid + (R() - 0.5) * 0.5 * u; c = Math.min(IBH - 0.15 * u, Math.max(IBL + 0.15 * u, c));
        var lo = k === 5 ? IBL : Math.max(IBL, Math.min(o, c) - 0.05 * u * R()), hi = k === 3 ? IBH : Math.min(IBH, Math.max(o, c) + 0.15 * u * R());
        K(s, o, c, lo, hi, 0.6);
      }
      var entry = r2(IBH + 0.01), stop = r2(IBL - 0.01), Rr = Math.abs(entry - stop); o = lc(); c = r2(entry + 0.5 * Rr);
      K(s, o, c, Math.max(stop + 0.02, o - 0.1 * u * R()), c + 0.15 * Rr, 1.8);
      var mult = (vw - entry) / Rr; if (mult < 2.3) throw new Error("sl15 VWAP room " + mult.toFixed(2)); void out;
      run(s, entry, Rr, mult, 7);
    }
    function dBroken() {
      var s = 1; ensure(s, 1.0, fnEma); approach(s, fnEma);
      var o = lc(), c = r2(ema - 0.9 * u), t = K(s, o, c, c - 0.3 * u, o + 0.2 * u, 1.2); // new low, closes through the EMA
      o = lc(); c = o + 0.1 * u; var ti = K(s, o, c, o - 0.5 * u, c + 0.12 * u, 0.8); // first green candle after the new low
      o = lc(); c = o + 0.5 * u; var ei = K(s, o, c, o - 0.1 * u, c + 0.9 * u, 1); // small green inverted hammer: long wick above the 9 EMA = trigger
      drift(s, 3);
      reg({ name: "FP9-A", s: 1, kind: "decoy", maybe: ei, steps: [{ i: t, t: "1  Pullback CLOSES below the 9 EMA (it did not hold)", bad: 1 }, { i: ti, t: "2  A small candle forms, but it is below the EMA, so it is not a trigger" }, { i: ei, t: "3  Bounce fails and price keeps falling" }], trig: ti, end: C.length - 1, why: "The pullback closed below the 9 EMA, so the EMA did not hold. This only looks like an FP9-A trigger. No trade." });
    }
    function dNoBreak() {
      var s = 1; ensure(s, 1.0, fnEma); approach(s, fnEma); var t = touch(s, "ema");
      var o = lc(), wi = wiOf(s, t) + 0.5 * u, c = o + Math.min(1.5 * u, wi - o - 0.25 * u), r = K(s, o, c, o - 0.15 * u, wi, 1.2);
      var ti = trigger(s, 1.0); o = lc(); c = o - 0.4 * u; var nb = K(s, o, c, c - 0.2 * u, o, 0.7); drift(s, 3);
      reg({ name: "SL1 RV", label: "SL-1-RV 2' (L)", s: s, kind: "decoy", steps: [{ i: t, t: "1  First candle to touch the 9 EMA" }, { i: r, t: "2  Opposite-color candle makes a new high" }, { i: ti, t: "3  Higher-low hammer = TRIGGER" }, { i: nb, t: "4  Next candle does NOT break the trigger high: no entry", bad: 1 }], trig: ti, end: C.length - 1, why: "Everything formed except the last step. The next candle never broke the trigger high, so you never enter. This is where you stay out." });
    }

    var ops = cfg.plan, d = -1;
    function day(list) {
      d++; if (d) prev = lc(); startDay(d);
      list.forEach(function (op) {
        var k = op[0];
        if (k === "walk") walk(op[1], op[2], op[3]);
        else if (k === "sl1") SL1(op[1], op[2], op[3]);
        else if (k === "fp9a") FP9(op[1], "ema", op[2]);
        else if (k === "fp9v") FP9(op[1], "vwap", op[2]);
        else if (k === "sl1s") SL1S(op[1]);
        else if (k === "sl15") IB15(op[1]);
        else if (k === "broken") dBroken();
        else if (k === "noBreak") dNoBreak();
        else throw new Error("bad op " + k);
      });
      var rem = (d + 1) * PER - C.length; if (rem < 1) throw new Error(cfg.sym + " day " + (d + 1) + " is " + (-rem) + " candles too long"); if (rem > 0) walk(rem, ((cfg.pad || [])[d]) || 0);
    }
    ops.forEach(day);
    if (C.length !== PER * NDAY) throw new Error("length " + C.length);
    // Every spot that matches your SL1-RV-2' short rule gets labeled, planted or not, so the list tells the truth.
    (function () {
      var used = {};
      for (var i = 5; i < C.length - 3; i++) {
        var m = v2find(C, E, i); if (!m || used[m.t]) continue;
        var T = C[m.t], entry = r2(T.l - 0.01), stop = r2(T.h + 0.02), Rr = Math.abs(entry - stop); if (Rr < 0.04) continue;
        if (!(entry > V[m.t] && entry - V[m.t] >= 2 * Rr)) continue; // never short below VWAP, and only with 2R+ of room down to VWAP
        var dEnd = (Math.floor(m.e / PER) + 1) * PER - 1, won = false; // only label matches that clearly work as shorts: 1.5R before the stop (no losing examples)
        for (var jj = m.e; jj <= dEnd; jj++) { if (jj > m.e && C[jj].h >= stop) break; if (C[jj].l <= entry - 1.5 * Rr) { won = true; break; } }
        if (!won) continue;
        var steps = [{ i: m.runEnd, t: "Candles keep breaking each other's highs, above the 9 EMA (this is the high)" }, { i: m.nl, t: "First new low after that run" }];
        if (m.g !== m.t) steps.push({ i: m.g, t: m.skipped && m.skipped.i === m.g ? "First green candle (" + m.skipped.shape + ") looks like a trigger, but the next candle never breaks its low, so keep moving" : "First green candle after the new low: start looking for the trigger" });
        if (m.skipped && m.skipped.i !== m.g && m.skipped.i !== m.t) steps.push({ i: m.skipped.i, t: "Another " + m.skipped.shape + " that the next candle never breaks: keep moving" });
        steps.push({ i: m.t, t: (m.g === m.t ? "The first green candle is itself a small " + m.shape : "Small " + (T.c > T.o ? "green" : "red") + " " + m.shape) + " below the high = TRIGGER", trig: 1 });
        steps.push({ i: m.e, t: "Next candle breaks the trigger low: ENTRY (stop 2 cents above the trigger high)", entry: 1 });
        steps.forEach(function (x, q) { x.t = (q + 1) + "  " + x.t; });
        reg({ name: "SL1 RV", s: -1, ver: 2, label: "SL-1-RV 2' (S)", kind: "setup", sub: "Short version 2: the first new low after a run of higher highs, then a green candle, then a small trigger candle (inside bar, inverted hammer or doji, green or red) whose low breaks. Stop is 2 cents above the trigger high. Only taken above VWAP with 2R+ of room down to it.", steps: steps, v2: m, trig: m.t, ent: m.e, entry: entry, stop: stop, R: Rr, end: m.e });
        used[m.t] = 1;
      }
      for (var i = 5; i < C.length - 3; i++) {
        var m = v2findL(C, E, i); if (!m || used[m.t]) continue;
        var T = C[m.t], entry = r2(T.h + 0.01), stop = r2(T.l - 0.02), Rr = Math.abs(entry - stop); if (Rr < 0.04) continue;
        var dEnd = (Math.floor(m.e / PER) + 1) * PER - 1, won = false;
        for (var jj = m.e; jj <= dEnd; jj++) { if (jj > m.e && C[jj].l <= stop) break; if (C[jj].h >= entry + 1.5 * Rr) { won = true; break; } }
        if (!won) continue;
        var steps = [{ i: m.runEnd, t: "Candles keep breaking each other's lows, down to the 9 EMA (this is the low)" }, { i: m.nl, t: "First new high after that run" }];
        if (m.g !== m.t) steps.push({ i: m.g, t: m.skipped && m.skipped.i === m.g ? "First red candle (" + m.skipped.shape + ") looks like a trigger, but the next candle never breaks its high, so keep moving" : "First red candle after the new high: start looking for the trigger" });
        if (m.skipped && m.skipped.i !== m.g && m.skipped.i !== m.t) steps.push({ i: m.skipped.i, t: "Another " + m.skipped.shape + " that the next candle never breaks: keep moving" });
        steps.push({ i: m.t, t: (m.g === m.t ? "The first red candle is itself a small " + m.shape : "Small " + (T.c > T.o ? "green" : "red") + " " + m.shape) + " above the low = TRIGGER", trig: 1 });
        steps.push({ i: m.e, t: "Next candle breaks the trigger high: ENTRY (stop 2 cents below the trigger low)", entry: 1 });
        steps.forEach(function (x, q) { x.t = (q + 1) + "  " + x.t; });
        reg({ name: "SL1 RV", s: 1, ver: 2, label: "SL-1-RV 2' (L)", kind: "setup", sub: "Long version 2: the first new high after a run of lower lows into the 9 EMA, then a red candle, then a small trigger candle (inside bar, hammer or doji, green or red) whose high breaks. Stop is 2 cents below the trigger low.", steps: steps, v2: m, trig: m.t, ent: m.e, entry: entry, stop: stop, R: Rr, end: m.e });
        used[m.t] = 1;
      }
      (function () { // SL-15 (IB): found by rule on the 15 minute bars (a small inside bar holding the 200 MA, 2R+ below VWAP)
        var B = agg(M, 15), per = MIN / 15;
        for (var j = 2; j < B.length - 1; j++) {
          if (Math.floor((j + 1) / per) !== Math.floor((j - 1) / per) || j % per < 2) continue;
          var A = B[j - 1], I = B[j], m1 = Math.floor((15 * j + 14) / 2), ma = MA[m1], rA = A.h - A.l, rI = I.h - I.l;
          if (!(I.h < A.h && I.l > A.l && A.c < A.o && rI <= 0.45 * rA)) continue; // small inside bar after a pullback bar
          if (!(I.l >= ma && I.c > ma && I.l - ma <= 2 * rI)) continue; // sitting on the 200 MA and holding it
          var entry = r2(I.h + 0.01), stop = r2(I.l - 0.01), Rr = r2(entry - stop); if (Rr < 0.04 || !(V[m1] - entry >= 2 * Rr)) continue;
          var dEnd = (Math.floor(m1 / PER) + 1) * PER - 1, ei = -1, won = false;
          for (var jj = m1 + 1; jj <= dEnd && jj <= m1 + 8; jj++) { if (C[jj].l <= stop) break; if (C[jj].h >= entry) { ei = jj; break; } }
          if (ei < 0) continue;
          for (jj = ei; jj <= dEnd; jj++) { if (jj > ei && C[jj].l <= stop) break; if (C[jj].h >= entry + 1.5 * Rr) { won = true; break; } }
          if (!won) continue;
          var mA = Math.ceil(15 * (j - 1) / 2), steps = [{ i: mA, t: "1  Stock gapped up, then this pullback bar fades down into the 200 MA" }, { i: m1, t: "2  Small inside bar (inside the bar before it) sitting on the 200 MA and holding it = TRIGGER", trig: 1 }, { i: ei, t: "3  Next candle breaks the inside-bar high: ENTRY (stop under the inside-bar low). VWAP is 2R+ above", entry: 1 }];
          reg({ name: "SL15 IB", s: 1, label: "SL-15 (IB)", kind: "setup", sub: "15 minute chart. A stock that gapped up pulls back into the 200 MA. A small inside bar holds the 200 MA with room up to VWAP. Long above the inside-bar high, stop under its low. Needs 2R+ of room to VWAP.", steps: steps, ib: { j: j, m1: m1 }, trig: m1, ent: ei, entry: entry, stop: stop, R: Rr, end: ei });
        }
      })();
      var v2s = S.filter(function (x) { return x.ver === 2; });
      for (var q = S.length - 1; q >= 0; q--) if (S[q].kind === "decoy" && v2s.some(function (x) { return x.steps[0].i <= S[q].end && x.ent >= S[q].steps[0].i; })) S.splice(q, 1);
    })();
    // Outcomes read from the data after the fact (what price really did after entry).
    S.forEach(function (st) {
      if (st.kind !== "setup") return;
      var s = st.s, dayEnd = (Math.floor(st.ent / PER) + 1) * PER - 1, hit = [false, false, false], T = [0.7, 1.5, 5].map(function (m) { return r2(st.entry + s * m * st.R); }), stopped = false, last = st.ent;
      for (var j = st.ent; j <= dayEnd; j++) {
        if (j > st.ent && s * (st.stop - (s > 0 ? C[j].l : C[j].h)) >= 0) { stopped = true; break; }
        for (var q = 0; q < 3; q++) if (s * ((s > 0 ? C[j].h : C[j].l) - T[q]) >= 0) hit[q] = true;
        last = j;
      }
      st.T = T; st.hit = hit; st.stopped = stopped; st.span = [Math.min.apply(null, st.steps.map(function (x) { return x.i; })), Math.min(dayEnd, st.end + 2)]; st.lastI = last;
    });
    S.forEach(function (st) { if (st.kind === "decoy") st.span = [st.steps[0].i, st.end]; });
    return { sym: cfg.sym, name: cfg.name, C: C, M: M, E: E, V: V, MA: MA, S: S.sort(function (a, b) { return a.trig - b.trig; }), D: D };
  }

  /* Day plans. ops: ["walk",candles,%move] ["fp9a",dir,outcome] ["fp9v",dir,outcome] ["sl1",dir,"A"|"B",outcome] ["sl1s",outcome] (SL1 RV short v2) ["broken"] ["noBreak"].
     dir 1 = long, -1 = short. outcomes: win5, win15, win07, loss. Each day is padded to 195 candles automatically. */
  function plans(k) {
    var W = ["win15", "win5", "win07", "win15"]; // no losing trades: a failed long reads as a short setup (and the reverse)
    function o(i) { return W[(i + k) % 4]; }
    return [
      [["walk", 8, 2.2], ["fp9a", 1, "win15"], ["walk", 14, 1.6], ["fp9v", 1, o(2)], ["walk", 10, 1.4], ["sl1", 1, "A", "win5"], ["walk", 16, 0.3], ["sl1s", "win15"], ["walk", 24, -1.8], ["fp9a", -1, "win15"], ["walk", 6, -0.6], ["sl1", -1, "B", "win07"]],
      [["walk", 5, 2.6], ["sl15", "win15"], ["sl1", 1, "B", o(1)], ["walk", 18, 1.8], ["fp9a", 1, o(0)], ["walk", 14, 1.2], ["broken"], ["walk", 20, -1.4], ["fp9v", 1, "win15"], ["walk", 12, 1.1], ["sl1", 1, "A", o(3)]],
      [["walk", 10, 3.0], ["fp9a", 1, "win5"], ["walk", 12, 0.8], ["noBreak"], ["walk", 20, 1.3], ["sl1", 1, "A", "win15"], ["walk", 18, 0.6], ["fp9v", 1, "win07"], ["walk", 28, -2.4], ["fp9a", -1, o(1)], ["walk", 8, -0.8]],
      [["walk", 8, 1.8], ["sl1", 1, "A", "win15"], ["walk", 12, 1.5], ["sl1s", o(1)], ["walk", 8, -1.2], ["fp9v", 1, o(0)], ["walk", 12, 1.2], ["fp9a", 1, "win5"], ["walk", 14, -2.0], ["sl1", -1, "A", "win15"], ["walk", 6, -0.7], ["noBreak"]],
      [["walk", 7, 2.0], ["fp9a", 1, "win07"], ["walk", 16, 1.8], ["sl1", 1, "B", "win5"], ["walk", 14, 0.4], ["broken"], ["walk", 24, -2.2], ["fp9a", -1, "win15"], ["walk", 10, -0.9], ["sl1", -1, "A", o(2)], ["walk", 8, 0.5], ["fp9v", 1, "win15"]]
    ];
  }
  var STOCKS = [
    { sym: "ZLTR", name: "Zeltra Biologics", start: 24.6, vol: 90000, seed: 11 },
    { sym: "BRVX", name: "Bravix Energy", start: 41.2, vol: 60000, seed: 23 },
    { sym: "KNDL", name: "Kindle Robotics", start: 58.4, vol: 45000, seed: 37 }
  ];
  var cache = {};
  function get(i) {
    if (!cache[i]) { var s = STOCKS[i], d = build({ sym: s.sym, name: s.name, start: s.start, vol: s.vol, seed: s.seed, plan: plans(i), pad: [-0.4, 0.5, -0.6, -0.3, 0.4] }); cache[i] = d; }
    return cache[i];
  }

  function agg(M, tf) {
    var out = [], n = M.length / tf, ema = 0;
    for (var j = 0; j < n; j++) {
      var a = M[j * tf], b = M[j * tf + tf - 1], h = -1e9, l = 1e9, v = 0;
      for (var q = 0; q < tf; q++) { var m = M[j * tf + q]; if (m.h > h) h = m.h; if (m.l < l) l = m.l; v += m.v; }
      ema = j ? ema + 0.2 * (b.c - ema) : b.c; out.push({ o: a.o, h: h, l: l, c: b.c, v: v, w: b.w, e: ema });
    }
    return out;
  }

  /* Independent checks: gaps, timeframe agreement, and every planted rule re-tested from the final data. */
  function qa() {
    var rep = [], bad = 0;
    function chk(ok, msg) { if (!ok) { bad++; rep.push("FAIL " + msg); } }
    STOCKS.forEach(function (st, si) {
      var d = get(si), C = d.C, E = d.E, V = d.V;
      d.D.forEach(function (dd, k) { var g = dd.open / dd.prev - 1; chk(Math.abs(g - 0.025) < 0.0006, st.sym + " day " + (k + 1) + " gap " + (g * 100).toFixed(3) + "%"); });
      var a2 = agg(d.M, 2); chk(a2.length === C.length && a2.every(function (b, i) { return b.o === C[i].o && b.c === C[i].c && Math.abs(b.h - C[i].h) < 1e-9 && Math.abs(b.l - C[i].l) < 1e-9; }), st.sym + " 2-min matches master");
      chk(C.every(function (c) { return c.c >= 10 && c.l >= 10; }), st.sym + " price above $10");
      d.S.forEach(function (S) {
        if (S.kind !== "setup") return; var s = S.s, t = S.steps[0].i, tg = S.trig, ei = S.ent, id = st.sym + " " + S.name + " #" + S.id;
        if (S.name === "SL15 IB") {
          var B = agg(d.M, 15), jx = S.ib.j, A = B[jx - 1], I = B[jx], ma = d.MA[S.ib.m1];
          chk(I.h < A.h && I.l > A.l && A.c < A.o, id + " is a small inside bar after a red pullback bar");
          chk(I.l >= ma && I.c > ma, id + " holds the 200 MA"); chk(Math.abs(S.entry - (I.h + 0.01)) < 0.0101 && Math.abs(S.stop - (I.l - 0.01)) < 0.0101, id + " entry/stop sit on the inside bar");
          chk(C[ei].h >= S.entry && C[ei].l > S.stop, id + " entry candle breaks the inside bar high"); chk(V[S.ib.m1] - S.entry >= 2 * S.R - 0.0001, id + " has 2R+ room to VWAP"); return;
        }
        function wi(i) { return s > 0 ? C[i].h : C[i].l; } function ag(i) { return s > 0 ? C[i].l : C[i].h; }
        function touches(i, fn) { return s * (ag(i) - fn(i)) <= 0; }
        chk(s * (wi(ei) - wi(tg)) > 0, id + " entry candle breaks trigger");
        chk(s * (ag(ei) - S.stop) > 0, id + " entry candle stays above stop");
        chk(Math.abs(S.entry - wi(tg)) < 0.0101 && Math.abs(S.stop - ag(tg)) < (S.ver === 2 ? 0.0201 : 0.0101), id + " entry/stop sit on trigger candle");
        if (S.ver === 2) {
          var m2 = (s > 0 ? v2findL : v2find)(C, E, S.v2.nl); chk(m2 && m2.t === S.v2.t && m2.e === ei, id + " matches the SL1-RV-2' rule");
          chk(S.v2.t > S.v2.nl && S.v2.g > S.v2.nl, id + " trigger is not the new-low candle");
          if (s < 0) chk(S.entry > V[tg] && S.entry - V[tg] >= 2 * S.R - 0.0001, id + " short has 2R+ room to VWAP and is above VWAP");
        } else if (S.name === "SL1 RV") {
          var r = S.steps[1].i;
          chk(touches(t, function (i) { return E[i]; }), id + " touch candle reaches EMA");
          for (var q = 1; q <= 5; q++) chk(s * (ag(t - q) - E[t - q]) > 0, id + " touch is first (candle " + q + " earlier clear of EMA)");
          chk(s * (C[r].c - C[r].o) > 0 && s * (wi(r) - wi(t)) > 0, id + " opposite color candle new " + (s > 0 ? "high" : "low"));
          chk(tg - r <= 2 && s * (ag(tg) - ag(t)) > 0, id + " trigger is within 2 candles with a higher low");
          var inside = s * (wi(tg) - wi(r)) <= 0 && s * (ag(tg) - ag(r)) >= 0, ham = Math.abs(C[tg].c - C[tg].o) <= 0.15 * Math.abs(wi(tg) - ag(tg));
          chk(inside || ham, id + " trigger is hammer/doji/inside");
        } else {
          var fn = S.name === "FP9-V" ? function (i) { return V[i]; } : function (i) { return E[i]; };
          chk(touches(t, fn), id + " touch candle reaches " + (S.name === "FP9-V" ? "VWAP" : "EMA"));
          chk(s * (C[t].c - fn(t)) > 0, id + " touch candle closes on the holding side");
          chk(s * (C[tg].c - fn(tg)) > 0, id + " trigger closes on the holding side");
          chk(tg === t + 1, id + " trigger follows the touch candle");
        }
      });
      rep.push(st.sym + ": " + d.S.filter(function (x) { return x.kind === "setup"; }).length + " setups, " + d.S.filter(function (x) { return x.kind === "decoy"; }).length + " not-a-setup examples; " + d.M.length + " one-minute bars");
    });
    return { ok: bad === 0, fails: bad, report: rep };
  }

  root.PracticeData = { STOCKS: STOCKS, get: get, agg: agg, qa: qa, PER: PER, MIN: MIN, NDAY: NDAY, RULES: RULES };
  if (typeof module !== "undefined") module.exports = root.PracticeData;
})(typeof window !== "undefined" ? window : globalThis);
