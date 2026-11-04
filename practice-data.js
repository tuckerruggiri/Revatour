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

  function build(cfg) {
    var R = rng(cfg.seed), u = cfg.start * 0.004, C = [], M = [], E = [], V = [], S = [], D = [], ema = 0, pv = 0, vv = 0, vw = 0, prev = cfg.start, sid = 0;
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
      C.push({ o: o, h: h, l: l, c: c, v: v }); ema = i ? ema + 0.2 * (c - ema) : c; E.push(ema);
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
      if (variant === "B") { o = lc(); c = o - s * 0.5 * u; K(s, o, c, c - s * 0.2 * u, o + s * 0.1 * u, 0.8); }
      var ti = trigger(s, 1.0), f = finish(s, ti, out);
      reg({ name: "SL1 RV", s: s, kind: "setup", steps: [{ i: t, t: "1  First candle to touch the 9 EMA" }, { i: r, t: "2  Opposite-color candle makes a new " + hl(s) }, { i: ti, t: "3  " + (s > 0 ? "Higher-low hammer/doji/inside bar" : "Lower-high inverted hammer/doji/inside bar") + " = TRIGGER", trig: 1 }, { i: f.ei, t: "4  Next candle breaks the trigger " + (s > 0 ? "high" : "low") + ": ENTRY", entry: 1 }], trig: ti, ent: f.ei, entry: f.entry, stop: f.stop, R: f.R, end: f.end });
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
      reg({ name: "SL1 RV", s: s, ver: 2, kind: "setup", sub: "Short version 2: extended red candle, new low, then a green inside bar with a lower high", steps: [{ i: A, t: "1  First red candle, extended above the 9 EMA" }, { i: B, t: "2  Next candle breaks that low (new low)" }, { i: T, t: "3  Green inside bar with a lower high = TRIGGER", trig: 1 }, { i: f.ei, t: "4  Next candle breaks the trigger low: ENTRY", entry: 1 }], trig: T, ent: f.ei, entry: f.entry, stop: f.stop, R: f.R, end: f.end });
    }
    function dBroken() {
      var s = 1; ensure(s, 1.0, fnEma); approach(s, fnEma);
      var o = lc(), c = r2(ema - 0.9 * u), t = K(s, o, c, c - 0.3 * u, o + 0.2 * u, 1.2);
      o = lc(); c = o + 0.1 * u; var ti = K(s, o, c, o - 0.5 * u, c + 0.12 * u, 0.8);
      o = lc(); c = o + 0.5 * u; var ei = K(s, o, c, o - 0.1 * u, c + 0.1 * u, 1); drift(s, 3);
      reg({ name: "FP9-A", s: s, kind: "decoy", steps: [{ i: t, t: "1  Pullback CLOSES below the 9 EMA (it did not hold)", bad: 1 }, { i: ti, t: "2  A small candle forms, but it is below the EMA, so it is not a trigger" }, { i: ei, t: "3  Bounce fails and price keeps falling" }], trig: ti, end: C.length - 1, why: "The pullback closed below the 9 EMA, so the EMA did not hold. This only looks like an FP9-A trigger. No trade." });
    }
    function dNoBreak() {
      var s = 1; ensure(s, 1.0, fnEma); approach(s, fnEma); var t = touch(s, "ema");
      var o = lc(), wi = wiOf(s, t) + 0.5 * u, c = o + Math.min(1.5 * u, wi - o - 0.25 * u), r = K(s, o, c, o - 0.15 * u, wi, 1.2);
      var ti = trigger(s, 1.0); o = lc(); c = o - 0.4 * u; var nb = K(s, o, c, c - 0.2 * u, o, 0.7); drift(s, 3);
      reg({ name: "SL1 RV", s: s, kind: "decoy", steps: [{ i: t, t: "1  First candle to touch the 9 EMA" }, { i: r, t: "2  Opposite-color candle makes a new high" }, { i: ti, t: "3  Higher-low hammer = TRIGGER" }, { i: nb, t: "4  Next candle does NOT break the trigger high: no entry", bad: 1 }], trig: ti, end: C.length - 1, why: "Everything formed except the last step. The next candle never broke the trigger high, so you never enter. This is where you stay out." });
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
        else if (k === "broken") dBroken();
        else if (k === "noBreak") dNoBreak();
        else throw new Error("bad op " + k);
      });
      var rem = (d + 1) * PER - C.length; if (rem < 1) throw new Error(cfg.sym + " day " + (d + 1) + " is " + (-rem) + " candles too long"); if (rem > 0) walk(rem, ((cfg.pad || [])[d]) || 0);
    }
    ops.forEach(day);
    if (C.length !== PER * NDAY) throw new Error("length " + C.length);
    // Any spot that matches your SL1-RV-2' short rule gets labeled too, so the list tells the truth.
    (function () {
      var used = {}; S.forEach(function (x) { if (x.ver === 2) used[x.steps[0].i] = 1; });
      for (var i = 1; i < C.length - 3; i++) {
        var A = C[i], B = C[i + 1], T = C[i + 2], Eb = C[i + 3];
        if (Math.floor(i / PER) !== Math.floor((i + 3) / PER) || used[i]) continue;
        if (!(A.c < A.o && C[i - 1].c > C[i - 1].o && A.l > E[i] && (A.o - E[i]) >= 0.012 * A.o)) continue;
        if (!(B.c < B.o && B.l < A.l)) continue;
        if (!(T.c > T.o && T.h < B.h && T.l >= B.l)) continue;
        if (!(Eb.l < T.l && Eb.h < T.h + 0.01)) continue;
        var entry = r2(T.l - 0.01), stop = r2(T.h + 0.01), Rr = Math.abs(entry - stop); if (Rr < 0.04) continue;
        reg({ name: "SL1 RV", s: -1, ver: 2, kind: "setup", sub: "Short version 2: extended red candle, new low, then a green inside bar with a lower high", steps: [{ i: i, t: "1  First red candle, extended above the 9 EMA" }, { i: i + 1, t: "2  Next candle breaks that low (new low)" }, { i: i + 2, t: "3  Green inside bar with a lower high = TRIGGER", trig: 1 }, { i: i + 3, t: "4  Next candle breaks the trigger low: ENTRY", entry: 1 }], trig: i + 2, ent: i + 3, entry: entry, stop: stop, R: Rr, end: i + 3 });
        used[i] = 1;
      }
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
    return { sym: cfg.sym, name: cfg.name, C: C, M: M, E: E, V: V, S: S.sort(function (a, b) { return a.trig - b.trig; }), D: D };
  }

  /* Day plans. ops: ["walk",candles,%move] ["fp9a",dir,outcome] ["fp9v",dir,outcome] ["sl1",dir,"A"|"B",outcome] ["sl1s",outcome] (SL1 RV short v2) ["broken"] ["noBreak"].
     dir 1 = long, -1 = short. outcomes: win5, win15, win07, loss. Each day is padded to 195 candles automatically. */
  function plans(k) {
    var W = ["win15", "win5", "win07", "win15"]; // no losing trades: a failed long reads as a short setup (and the reverse)
    function o(i) { return W[(i + k) % 4]; }
    return [
      [["walk", 8, 2.2], ["fp9a", 1, "win15"], ["walk", 14, 1.6], ["fp9v", 1, o(2)], ["walk", 10, 1.4], ["sl1", 1, "A", "win5"], ["walk", 16, 0.3], ["sl1s", "win15"], ["walk", 24, -1.8], ["fp9a", -1, "win15"], ["walk", 6, -0.6], ["sl1", -1, "B", "win07"]],
      [["walk", 6, 1.4], ["walk", 12, -2.2], ["sl1", 1, "B", o(1)], ["walk", 18, 1.8], ["fp9a", 1, o(0)], ["walk", 14, 1.2], ["broken"], ["walk", 20, -1.4], ["fp9v", 1, "win15"], ["walk", 12, 1.1], ["sl1", 1, "A", o(3)]],
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
        function wi(i) { return s > 0 ? C[i].h : C[i].l; } function ag(i) { return s > 0 ? C[i].l : C[i].h; }
        function touches(i, fn) { return s * (ag(i) - fn(i)) <= 0; }
        chk(s * (wi(ei) - wi(tg)) > 0, id + " entry candle breaks trigger");
        chk(s * (ag(ei) - S.stop) > 0, id + " entry candle stays above stop");
        chk(Math.abs(S.entry - wi(tg)) < 0.0101 && Math.abs(S.stop - ag(tg)) < 0.0101, id + " entry/stop sit on trigger candle");
        if (S.ver === 2) {
          var A = S.steps[0].i, B = S.steps[1].i;
          chk(C[A].c < C[A].o && C[A].l > E[A], id + " step 1 is a red candle still above the EMA");
          chk(C[A].o - E[A] >= 1.5 * 0.004 * st.start, id + " step 1 is extended above the EMA");
          chk(C[A - 1].c > C[A - 1].o, id + " step 1 is the first red candle (green before it)");
          chk(C[B].l < C[A].l, id + " step 2 breaks the low of step 1");
          chk(C[tg].c > C[tg].o && C[tg].h < C[B].h && C[tg].l >= C[B].l, id + " trigger is a green inside bar with a lower high");
          chk(tg === B + 1 && ei === tg + 1, id + " steps follow each other");
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
