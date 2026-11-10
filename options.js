/* Options school: a picture-first, easy-English options course modeled on thinkorswim.
   Tabs: Start here, Payoff lab, Strategies, Option chain (live via Schwab when connected, else a clearly-labeled MODELED practice chain),
   Good option / save money, Greeks & time, Hedge & income, TOS guide, Risk & quiz.
   All prices in the lab are Black-Scholes MODEL estimates, not quotes. Education only, not advice. */
(function (root) {
  "use strict";
  var R = 0.045, MOD = "Model estimate. Real prices differ.";
  var CSS = [
    "#optv.wrap{max-width:none;width:100%;box-sizing:border-box;padding-left:28px;padding-right:28px}",
    ".op-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 18px}",
    ".op-tabs button{border:1px solid var(--line);border-radius:99px;padding:8px 16px;background:var(--panel);color:var(--ink);font:inherit;font-size:14px;cursor:pointer}",
    ".op-tabs button:hover{border-color:var(--accent)}.op-tabs button.on,.op-tabs button.on:hover{background:var(--accent);border-color:var(--accent);color:var(--accent-ink,#fff)}",
    ".op-h{margin:26px 0 10px;font-size:20px}.op-h:first-child{margin-top:4px}.op-sub{color:var(--mute);margin:-4px 0 12px;font-size:14px}",
    ".op-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}",
    ".op-card{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:14px;display:grid;gap:6px;align-content:start}",
    ".op-card h3{margin:0;font-size:16px}.op-card p{margin:0;font-size:14px;color:var(--mute);line-height:1.45}.op-card .ic{font-size:28px;line-height:1}",
    ".op-card.g{border-left:5px solid var(--gain)}.op-card.r{border-left:5px solid var(--loss)}.op-card.y{border-left:5px solid #d97706}.op-card.b{border-left:5px solid #2563eb}",
    ".op-tag{display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;border-radius:6px;padding:2px 7px;background:var(--bg);border:1px solid var(--line);color:var(--mute)}",
    ".op-tag.g{background:rgba(22,163,74,.16);color:var(--gain);border-color:transparent}.op-tag.r{background:rgba(220,38,38,.16);color:var(--loss);border-color:transparent}.op-tag.y{background:rgba(217,119,6,.18);color:#d97706;border-color:transparent}",
    ".op-fig{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:10px}.op-fig svg{width:100%;height:auto;display:block}.op-fig figcaption{font-size:13px;color:var(--mute);margin:4px 4px 0}",
    ".op-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}@media(max-width:900px){.op-2{grid-template-columns:1fr}}",
    ".op-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}@media(max-width:1000px){.op-3{grid-template-columns:1fr}}",
    ".op-btn{border:1px solid var(--line);border-radius:10px;padding:7px 12px;background:var(--panel);color:var(--ink);font:inherit;font-size:13px;cursor:pointer}.op-btn:hover{border-color:var(--accent)}",
    ".op-btn.p{background:var(--accent);border-color:var(--accent);color:var(--accent-ink,#fff)}.op-btn.sm{padding:3px 8px;font-size:12px}",
    ".op-note{border:1px dashed var(--line);border-radius:12px;padding:10px 12px;font-size:13px;color:var(--mute);background:var(--bg)}.op-note.w{border-color:var(--loss);color:var(--ink)}",
    ".op-ctl{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:10px}.op-ctl label{display:grid;gap:3px;font-size:12px;color:var(--mute)}",
    ".op-ctl input,.op-ctl select,.op-legs input,.op-legs select{border:1px solid var(--line);border-radius:8px;padding:6px 8px;background:var(--bg);color:var(--ink);font:inherit;font-size:14px;width:96px;box-sizing:border-box}",
    ".op-ctl input[type=range]{padding:0;width:200px}",
    ".op-legs{width:100%;border-collapse:collapse;font-size:13px}.op-legs th{text-align:left;color:var(--mute);font-weight:600;padding:4px}.op-legs td{padding:3px 4px}.op-legs input{width:76px;padding:4px 6px}",
    ".op-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:10px 0}.op-stat{border:1px solid var(--line);border-radius:12px;padding:8px 10px;background:var(--panel)}.op-stat b{display:block;font-size:19px}.op-stat span{font-size:12px;color:var(--mute)}",
    ".op-plain{border:2px solid var(--accent);border-radius:14px;background:var(--panel);padding:12px 16px;margin:0 0 12px;display:grid;gap:8px}.op-plain h4{margin:0;font-size:17px}.op-plain p{margin:0;font-size:15px;line-height:1.5}.op-plain p.ex{background:var(--bg);border-radius:10px;padding:8px 10px}.op-plain p.sm{font-size:13px;color:var(--mute);margin-top:4px}",
    ".op-exs{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px}.op-ex{border-radius:12px;padding:8px 10px;display:grid;gap:2px;border:1px solid var(--line);border-left:5px solid}.op-ex.w{border-left-color:var(--gain)}.op-ex.l{border-left-color:var(--loss)}.op-ex span{font-size:12px;color:var(--mute)}.op-ex i{font-style:normal;font-size:13px}.op-ex b{font-size:18px}.op-ex.w b{color:var(--gain)}.op-ex.l b{color:var(--loss)}",
    "#opch,#opst{position:relative;z-index:1}.op-spot{position:relative;isolation:isolate;contain:paint}.op-bld{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:18px;align-items:start;margin-top:14px}@media(max-width:1100px){.op-bld{grid-template-columns:1fr}}",
    "#opch{max-width:1100px}#opch svg{width:100%;height:auto}.op-gain{color:var(--gain)}.op-loss{color:var(--loss)}",
    ".op-rep{display:grid;gap:6px;margin-top:8px}.op-rep div{display:flex;gap:8px;font-size:13px;line-height:1.4;align-items:baseline}.op-rep i{font-style:normal;flex:none;width:20px}",
    ".op-chain{display:grid;grid-template-columns:minmax(0,1fr) 520px;gap:14px;align-items:start}@media(max-width:1250px){.op-chain{grid-template-columns:1fr}}",
    ".op-tw{overflow:auto;max-height:420px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}",
    ".op-t{width:100%;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums}.op-t th{position:sticky;top:0;background:var(--bg);color:var(--mute);padding:5px 6px;text-align:right;font-weight:600;z-index:1}",
    ".op-t td{padding:4px 6px;text-align:right;border-top:1px solid var(--line)}.op-t td.k{text-align:center;font-weight:700;background:var(--bg)}.op-t td.itm{background:rgba(37,99,235,.08)}",
    ".op-t tr.atm td{border-top:2px solid var(--accent);border-bottom:2px solid var(--accent)}.op-t td.c{cursor:pointer}.op-t td.c:hover{background:var(--accent);color:var(--accent-ink,#fff)}",
    ".op-t td.sel{outline:2px solid var(--accent);outline-offset:-2px;font-weight:700}.op-t th.hc{text-align:center;font-size:13px;color:var(--ink)}",
    ".op-spot{height:300px;border-radius:12px;overflow:hidden;border:1px solid var(--line);margin-bottom:10px;background:#000}",
    ".op-q{display:grid;gap:8px;margin-bottom:12px}.op-q .a{display:flex;gap:8px;flex-wrap:wrap}.op-q .a button.ok{background:rgba(22,163,74,.2);border-color:var(--gain)}.op-q .a button.no{background:rgba(220,38,38,.18);border-color:var(--loss)}",
    ".op-tos{border:1px solid var(--line);border-radius:12px;background:#10151c;color:#d6dde6;padding:10px;font-size:12px;display:grid;gap:6px;font-family:ui-monospace,Menlo,monospace}.op-tos .bar{display:flex;gap:6px;flex-wrap:wrap}.op-tos .bar span{padding:3px 9px;border-radius:5px;background:#222b36}.op-tos .bar span.on{background:#2563eb;color:#fff}",
    ".op-tos .pin{display:inline-block;background:#f59e0b;color:#000;border-radius:50%;width:18px;height:18px;text-align:center;font-weight:700;line-height:18px;margin-right:6px}"
  ].join("\n");

  /* ---------- math ---------- */
  function ncdf(x) { var t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2), p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }
  function npdf(x) { return 0.3989423 * Math.exp(-x * x / 2); }
  function bs(t, S, K, T, v) {
    if (T <= 0 || v <= 0) { var iv = t === "c" ? Math.max(S - K, 0) : Math.max(K - S, 0); return { p: iv, d: t === "c" ? (S > K ? 1 : 0) : (S < K ? -1 : 0), g: 0, th: 0, vg: 0 }; }
    var sq = v * Math.sqrt(T), d1 = (Math.log(S / K) + (R + v * v / 2) * T) / sq, d2 = d1 - sq, df = Math.exp(-R * T), p, d, th;
    if (t === "c") { p = S * ncdf(d1) - K * df * ncdf(d2); d = ncdf(d1); th = -S * npdf(d1) * v / (2 * Math.sqrt(T)) - R * K * df * ncdf(d2); }
    else { p = K * df * ncdf(-d2) - S * ncdf(-d1); d = ncdf(d1) - 1; th = -S * npdf(d1) * v / (2 * Math.sqrt(T)) + R * K * df * ncdf(-d2); }
    return { p: p, d: d, g: npdf(d1) / (S * sq), th: th / 365, vg: S * npdf(d1) * Math.sqrt(T) / 100 };
  }
  function step(S) { return S < 10 ? 0.5 : S < 50 ? 1 : S < 200 ? 2.5 : 5; }
  function rk(S, x) { var s = step(S); return Math.max(s, Math.round(x / s) * s); }
  function r2(x) { return Math.round(x * 100) / 100; }
  function $$(n, d) { if (n === Infinity) return "Unlimited"; if (n === -Infinity) return "Unlimited loss"; var a = Math.abs(n); if (n < 0 && Math.round(a * Math.pow(10, d == null ? 0 : d)) === 0) n = 0; return (n < 0 ? "-$" : "$") + a.toLocaleString("en-US", { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d == null ? 0 : d }); }
  function legVal(l, S, T, iv) { if (l.t === "s") return S; if (T <= 0) return l.t === "c" ? Math.max(S - l.k, 0) : Math.max(l.k - S, 0); return bs(l.t, S, l.k, T, iv).p; }
  function pl(legs, S, T, iv) { var s = 0; legs.forEach(function (l) { s += l.side * l.q * (l.t === "s" ? 100 : 100) * (legVal(l, S, T, iv) - l.prem); }); return s; }
  function analyze(legs, S, dte, iv) {
    var ks = legs.map(function (l) { return l.k; }), cands = [0].concat(ks), big = Math.max.apply(null, ks.concat([S])) * 6, o = { maxP: 0, maxL: 0, be: [], pop: null };
    if (!legs.length) return o;
    var vals = cands.map(function (x) { return pl(legs, x, 0, iv); }), up = pl(legs, big + 1, 0, iv) - pl(legs, big, 0, iv);
    o.maxP = up > 1e-9 ? Infinity : Math.max.apply(null, vals); o.maxL = up < -1e-9 ? -Infinity : Math.min.apply(null, vals);
    var n = 1500, hi = big, prev = pl(legs, 0.0001, 0, iv);
    for (var i = 1; i <= n; i++) { var x = hi * i / n, y = pl(legs, x, 0, iv); if ((prev < 0 && y >= 0) || (prev > 0 && y <= 0)) { var x0 = hi * (i - 1) / n; o.be.push(x0 + (x - x0) * (0 - prev) / (y - prev)); } prev = y; }
    var T = dte / 365, sg = iv * Math.sqrt(T), w = 0, tot = 0;
    for (var j = 0; j <= 400; j++) { var z = -4 + 8 * j / 400, ph = npdf(z), ST = S * Math.exp(-0.5 * sg * sg + sg * z); tot += ph; if (pl(legs, ST, 0, iv) > 0.5) w += ph; }
    o.pop = tot ? w / tot : null; o.em = S * sg; return o;
  }

  /* ---------- state ---------- */
  var L = { tab: "start", S: 100, iv: 0.35, dte: 30, day: 0, mark: null, legs: [], sym: "", src: "none", chain: null, exp: 0, rng: 8, loading: false, msg: "" };
  var el = null, quizDone = {};

  function mkLeg(t, side, k, q, S, dte, iv) {
    var prem = t === "s" ? S : Math.max(0.01, r2(bs(t, S, k, dte / 365, iv).p));
    return { t: t, side: side, k: t === "s" ? r2(S) : k, prem: prem, q: q || 1 };
  }
  var STR = [
    { id: "lc", n: "Long call", ic: "🚀", v: "Bullish", lv: "Starter", c: "g", legs: [["c", 1, 5]], one: "Pay a small price for the right to buy at a locked price. You win if the stock climbs a lot.", win: "Stock rises well past your strike", bad: "Stock stays flat or falls: lose what you paid (that is the limit)" },
    { id: "lp", n: "Long put", ic: "🛡️", v: "Bearish", lv: "Starter", c: "r", legs: [["p", 1, -5]], one: "Pay a small price for the right to sell at a locked price. You win if the stock drops.", win: "Stock falls well below your strike", bad: "Stock stays flat or rises: lose what you paid (limit)" },
    { id: "cc", n: "Covered call", ic: "💵", v: "Income", lv: "Core", c: "g", legs: [["s", 1, 0], ["c", -1, 5]], one: "You own 100 shares and sell someone the right to buy them higher. You get paid today.", win: "Stock stays below the strike: keep shares and the cash", bad: "Stock falls (you still own it) or rockets (shares get called away; you miss the upside)" },
    { id: "csp", n: "Cash-secured put", ic: "🎣", v: "Income", lv: "Core", c: "g", legs: [["p", -1, -5]], one: "Get paid to wait. If the stock dips to your price you buy 100 shares at a discount. Keep the cash to cover it.", win: "Stock stays above the strike: keep the premium", bad: "Stock crashes: you must buy at the strike, far above the market" },
    { id: "pp", n: "Protective put", ic: "☂️", v: "Hedge", lv: "Core", c: "b", legs: [["s", 1, 0], ["p", 1, -5]], one: "Own shares + buy a put = insurance. Your loss is capped, your upside stays open.", win: "Stock rises: you keep nearly all of it minus the insurance cost", bad: "Insurance cost is lost if the stock does not fall" },
    { id: "col", n: "Collar", ic: "🧢", v: "Hedge", lv: "Core", c: "b", legs: [["s", 1, 0], ["p", 1, -5], ["c", -1, 7.5]], one: "Shares + a put you buy + a call you sell. The call income pays for the put. Cheap protection, capped upside.", win: "Stock drifts up a little or sits still", bad: "Big rally above the call: upside is capped" },
    { id: "bcs", n: "Bull call spread", ic: "📈", v: "Bullish", lv: "Spread", c: "g", legs: [["c", 1, 0], ["c", -1, 10]], one: "Buy a call, sell a higher call to cut the cost. Cheaper than a plain call, but profit is capped.", win: "Stock rises to the upper strike or beyond", bad: "Stock falls: lose what you paid (limit)" },
    { id: "bps", n: "Bear put spread", ic: "📉", v: "Bearish", lv: "Spread", c: "r", legs: [["p", 1, 0], ["p", -1, -10]], one: "Buy a put, sell a lower put to cut the cost. Cheaper than a plain put, profit is capped.", win: "Stock falls to the lower strike or below", bad: "Stock rises: lose what you paid (limit)" },
    { id: "bpc", n: "Bull put spread (credit)", ic: "🧱", v: "Bullish / neutral", lv: "Spread", c: "g", legs: [["p", -1, -5], ["p", 1, -10]], one: "Sell a put, buy a cheaper one lower down as a seatbelt. You collect cash up front with a known worst case.", win: "Stock stays above the short strike", bad: "Stock drops below the long strike: max loss = width minus credit" },
    { id: "bcc", n: "Bear call spread (credit)", ic: "🧊", v: "Bearish / neutral", lv: "Spread", c: "r", legs: [["c", -1, 5], ["c", 1, 10]], one: "Sell a call, buy a higher call as a seatbelt. Collect cash up front, known worst case.", win: "Stock stays below the short strike", bad: "Stock rises above the long strike: max loss = width minus credit" },
    { id: "ic", n: "Iron condor", ic: "🦅", v: "Neutral", lv: "Advanced", c: "y", legs: [["p", -1, -5], ["p", 1, -10], ["c", -1, 5], ["c", 1, 10]], one: "Two credit spreads at once: win if the stock stays inside a range.", win: "Stock stays between the two short strikes", bad: "Big move either way: max loss = width minus credit" },
    { id: "ls", n: "Long straddle", ic: "🎢", v: "Big move", lv: "Advanced", c: "y", legs: [["c", 1, 0], ["p", 1, 0]], one: "Buy a call and a put at the same strike. You win if it moves a lot, either way.", win: "A big move up or down, larger than the cost", bad: "Stock stays put: lose both premiums (time works against you)" },
    { id: "lg", n: "Long strangle", ic: "↔️", v: "Big move", lv: "Advanced", c: "y", legs: [["c", 1, 5], ["p", 1, -5]], one: "Like a straddle, but cheaper with strikes further out. Needs an even bigger move.", win: "A very large move either way", bad: "Stock stays in the middle: lose the whole cost" },
    { id: "nc", n: "Naked short call", ic: "🔥", v: "Bearish / neutral", lv: "DANGER", c: "r", legs: [["c", -1, 5]], one: "Sell a call without owning shares. You keep the cash if the stock stays low. If it rockets, losses have no ceiling.", win: "Stock stays below the strike: keep the premium (small, capped win)", bad: "Stock soars: loss is UNLIMITED and your broker can force-close you" },
    { id: "np", n: "Naked short put", ic: "⚠️", v: "Bullish / neutral", lv: "DANGER", c: "r", legs: [["p", -1, -5]], one: "Sell a put without setting aside the full cash. Small win, huge possible loss if the stock collapses.", win: "Stock stays above the strike: keep the premium", bad: "Stock collapses: loss up to strike x 100 minus the premium, on margin" }
  ];
  function stratLegs(s, S, dte, iv) { return s.legs.map(function (g) { return g[0] === "s" ? mkLeg("s", 1, S, 1, S, dte, iv) : mkLeg(g[0], g[1], rk(S, S * (1 + g[2] / 100)), 1, S, dte, iv); }); }

  /* ---------- svg ---------- */
  function miniSvg(legs, S, iv, w, h) {
    w = w || 240; h = h || 100; var lo = S * 0.75, hi = S * 1.25, N = 80, pts = [], mn = 0, mx = 0, i;
    for (i = 0; i <= N; i++) { var x = lo + (hi - lo) * i / N, y = pl(legs, x, 0, iv); pts.push([x, y]); mn = Math.min(mn, y); mx = Math.max(mx, y); }
    if (mx - mn < 1) { mx += 50; mn -= 50; } var pad = (mx - mn) * 0.12; mx += pad; mn -= pad;
    var X = function (v) { return (v - lo) / (hi - lo) * w; }, Y = function (v) { return (mx - v) / (mx - mn) * h; }, y0 = Y(0), d = "";
    pts.forEach(function (p, j) { d += (j ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); });
    var area = d + "L" + w + " " + y0.toFixed(1) + "L0 " + y0.toFixed(1) + "Z", id = "m" + Math.random().toString(36).slice(2, 7);
    return '<svg viewBox="0 0 ' + w + " " + h + '" role="img"><defs><clipPath id="' + id + 'a"><rect x="0" y="0" width="' + w + '" height="' + y0.toFixed(1) + '"/></clipPath><clipPath id="' + id + 'b"><rect x="0" y="' + y0.toFixed(1) + '" width="' + w + '" height="' + h + '"/></clipPath></defs>' +
      '<path d="' + area + '" fill="rgba(22,163,74,.28)" clip-path="url(#' + id + 'a)"/><path d="' + area + '" fill="rgba(220,38,38,.28)" clip-path="url(#' + id + 'b)"/>' +
      '<line x1="0" x2="' + w + '" y1="' + y0.toFixed(1) + '" y2="' + y0.toFixed(1) + '" stroke="currentColor" stroke-opacity=".35"/><line x1="' + X(S).toFixed(1) + '" x2="' + X(S).toFixed(1) + '" y1="0" y2="' + h + '" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="3 3"/>' +
      '<path d="' + d + '" fill="none" stroke="var(--ink)" stroke-width="2.2"/></svg>';
  }
  var G = null;
  function chartSvg() {
    var legs = L.legs; if (!legs.length) return '<div class="op-note">Add a leg (or pick a strategy) to see the profit picture.</div>';
    var S = L.S, iv = L.iv, T = Math.max(L.dte - L.day, 0) / 365, em = S * iv * Math.sqrt(L.dte / 365), wd = Math.max(0.12, Math.min(0.6, 2.4 * em / S)), lo = S * (1 - wd), hi = S * (1 + wd), N = 160, W = 900, H = 320, m = { l: 62, r: 14, t: 14, b: 30 }, i, ex = [], td = [], mn = 0, mx = 0;
    for (i = 0; i <= N; i++) { var x = lo + (hi - lo) * i / N, a = pl(legs, x, 0, iv), b = pl(legs, x, T, iv); ex.push([x, a]); td.push([x, b]); mn = Math.min(mn, a, b); mx = Math.max(mx, a, b); }
    var pd = (mx - mn || 100) * 0.1; mx += pd; mn -= pd;
    var X = function (v) { return m.l + (v - lo) / (hi - lo) * (W - m.l - m.r); }, Y = function (v) { return m.t + (mx - v) / (mx - mn) * (H - m.t - m.b); }, y0 = Y(0);
    var path = function (p) { return p.map(function (q, j) { return (j ? "L" : "M") + X(q[0]).toFixed(1) + " " + Y(q[1]).toFixed(1); }).join(""); };
    var area = path(ex) + "L" + X(hi).toFixed(1) + " " + y0.toFixed(1) + "L" + X(lo).toFixed(1) + " " + y0.toFixed(1) + "Z", g = "";
    for (i = 0; i <= 4; i++) { var v = mn + (mx - mn) * i / 4; g += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="currentColor" stroke-opacity=".1"/><text x="' + (m.l - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".6">' + $$(v) + "</text>"; }
    for (i = 0; i <= 5; i++) { var xv = lo + (hi - lo) * i / 5; g += '<text x="' + X(xv).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".6">$' + xv.toFixed(xv < 20 ? 2 : 0) + "</text>"; }
    var mk = L.mark == null ? S : L.mark, A = analyze(legs, S, L.dte, iv), be = "";
    A.be.forEach(function (b) { if (b > lo && b < hi) be += '<circle cx="' + X(b).toFixed(1) + '" cy="' + y0.toFixed(1) + '" r="4.5" fill="#f59e0b" stroke="#000" stroke-opacity=".4"/><text x="' + X(b).toFixed(1) + '" y="' + (y0 - 9).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#f59e0b">$' + b.toFixed(2) + "</text>"; });
    G = { lo: lo, hi: hi, W: W, m: m };
    return '<svg id="opsvg" viewBox="0 0 ' + W + " " + H + '" style="cursor:crosshair"><defs><clipPath id="opca"><rect x="0" y="0" width="' + W + '" height="' + y0.toFixed(1) + '"/></clipPath><clipPath id="opcb"><rect x="0" y="' + y0.toFixed(1) + '" width="' + W + '" height="' + H + '"/></clipPath></defs>' + g +
      '<rect x="' + X(Math.max(lo, S - em)).toFixed(1) + '" y="' + m.t + '" width="' + (X(Math.min(hi, S + em)) - X(Math.max(lo, S - em))).toFixed(1) + '" height="' + (H - m.t - m.b) + '" fill="#2563eb" fill-opacity=".07"/>' +
      '<path d="' + area + '" fill="rgba(22,163,74,.3)" clip-path="url(#opca)"/><path d="' + area + '" fill="rgba(220,38,38,.3)" clip-path="url(#opcb)"/>' +
      '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y0.toFixed(1) + '" y2="' + y0.toFixed(1) + '" stroke="currentColor" stroke-opacity=".5"/>' +
      '<line x1="' + X(S).toFixed(1) + '" x2="' + X(S).toFixed(1) + '" y1="' + m.t + '" y2="' + (H - m.b) + '" stroke="currentColor" stroke-opacity=".4" stroke-dasharray="4 4"/><text x="' + (X(S) + 4).toFixed(1) + '" y="' + (m.t + 11) + '" font-size="11" fill="currentColor" fill-opacity=".7">Now $' + S.toFixed(2) + "</text>" +
      (L.day > 0 ? '<path d="' + path(td) + '" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 4"/>' : "") +
      '<path d="' + path(ex) + '" fill="none" stroke="var(--ink)" stroke-width="2.4"/>' + be +
      '<line id="opmk" x1="' + X(mk).toFixed(1) + '" x2="' + X(mk).toFixed(1) + '" y1="' + m.t + '" y2="' + (H - m.b) + '" stroke="#f59e0b" stroke-width="1.5"/>' +
      '<rect id="ophov" x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="transparent"/></svg>' +
      '<div class="fu-sub" style="margin:4px 2px">Solid line = result on expiration day. ' + (L.day > 0 ? "Blue dashed = result " + L.day + " day(s) from now. " : "") + 'Blue band = the market\'s rough "expected move". Orange dots = break-even. Hover to read any price.</div>';
  }

  /* ---------- builder (legs, chart, numbers, report) ---------- */
  function legRows() {
    if (!L.legs.length) return '<div class="op-note">No legs yet. Click a strategy, or use the + buttons.</div>';
    return '<table class="op-legs"><tr><th>Buy/Sell</th><th>Type</th><th>Strike</th><th>Price</th><th>Qty</th><th></th></tr>' + L.legs.map(function (l, i) {
      return "<tr><td>" + (l.side > 0 ? '<span class="op-tag g">BUY</span>' : '<span class="op-tag r">SELL</span>') + '</td><td>' + (l.t === "s" ? "100 shares" : l.t === "c" ? "CALL" : "PUT") + '</td><td><input data-li="' + i + '" data-f="k" type="number" step="any" value="' + l.k + '"' + (l.t === "s" ? " title=\"your cost per share\"" : "") + '></td><td><input data-li="' + i + '" data-f="prem" type="number" step="0.01" value="' + l.prem + '"' + (l.t === "s" ? " disabled" : "") + '></td><td><input data-li="' + i + '" data-f="q" type="number" min="1" step="1" value="' + l.q + '"></td><td><button class="op-btn sm" data-o="rm" data-i="' + i + '">✕</button></td></tr>';
    }).join("") + "</table>";
  }
  function builderHtml() {
    var adds = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">' + ["c|1|Buy call", "c|-1|Sell call", "p|1|Buy put", "p|-1|Sell put", "s|1|Buy 100 shares"].map(function (a) { var p = a.split("|"); return '<button class="op-btn sm" data-o="add" data-t="' + p[0] + '" data-s="' + p[1] + '">+ ' + p[2] + "</button>"; }).join("") + '<button class="op-btn sm" data-o="clear">Clear</button></div>';
    return '<div class="op-bld"><div><div id="oplegs">' + legRows() + "</div>" + adds +
      '<div class="op-ctl"><label>Stock price<input data-g="S" type="number" step="any" value="' + L.S + '"></label><label>IV % (how jumpy)<input data-g="iv" type="number" step="1" value="' + Math.round(L.iv * 100) + '"></label><label>Days to expiration<input data-g="dte" type="number" min="1" step="1" value="' + L.dte + '"></label></div></div><div>' +
      '<div id="oppl"></div><div id="opch"></div><div class="op-ctl" style="margin-top:8px"><label>Time travel: day <b id="opdayv">0</b><input data-g="day" type="range" min="0" max="' + L.dte + '" value="' + L.day + '"></label><label>What if price is <b id="opmkv"></b><input data-g="mark" type="range" step="any"></label></div>' +
      '<div id="opst"></div></div></div>';
  }
  function paintLab() {
    var c = el.querySelector("#opch"); if (!c) return;
    var legs = L.legs, iv = L.iv, S = L.S; c.innerHTML = chartSvg();
    var mkR = el.querySelector('[data-g="mark"]'), em = S * iv * Math.sqrt(L.dte / 365), wd = Math.max(0.12, Math.min(0.6, 2.4 * em / S)); if (mkR) { mkR.min = (S * (1 - wd)).toFixed(2); mkR.max = (S * (1 + wd)).toFixed(2); mkR.value = L.mark == null ? S : L.mark; }
    var dr = el.querySelector('[data-g="day"]'); if (dr) { dr.max = L.dte; dr.value = L.day; }
    var mk = L.mark == null ? S : L.mark, T = Math.max(L.dte - L.day, 0) / 365, st = el.querySelector("#opst"); el.querySelector("#opdayv").textContent = L.day; el.querySelector("#opmkv").textContent = "$" + (+mk).toFixed(2);
    if (!legs.length) { st.innerHTML = ""; var p0 = el.querySelector("#oppl"); if (p0) p0.innerHTML = ""; return; }
    var A = analyze(legs, S, L.dte, iv), now = pl(legs, mk, T, iv), cost = 0; legs.forEach(function (l) { if (l.t !== "s") cost += l.side * l.q * 100 * l.prem; });
    var cls = function (v) { return v >= 0 ? "op-gain" : "op-loss"; };
    var stat = function (b, s, c) { return '<div class="op-stat"><b class="' + (c || "") + '">' + b + "</b><span>" + s + "</span></div>"; };
    var html = '<div class="op-stats">' + stat($$(now), "If stock is $" + (+mk).toFixed(2) + (L.day ? " on day " + L.day : " at expiration"), cls(now)) + stat(cost > 0 ? $$(cost) : $$(-cost), cost > 0 ? "You pay up front" : "You get paid up front", "") + stat(A.maxP === Infinity ? "No limit 🚀" : $$(A.maxP), "Most you can MAKE", A.maxP > 0 ? "op-gain" : "") + stat(A.maxL === -Infinity ? "No limit 😬" : $$(A.maxL), "Most you can LOSE", A.maxL < 0 ? "op-loss" : "") + stat(A.pop == null ? "—" : Math.round(A.pop * 100) + " in 100", "Rough odds you make money (a guess)", "") + stat(A.be.length ? A.be.map(function (b) { return "$" + b.toFixed(2); }).join(" · ") : "—", "Stock must get here so you break even", "") + "</div>";
    var rep = [], ok = "✅", wr = "⚠️", bd = "❌";
    if (A.maxL === -Infinity) rep.push([bd, "<b>You can lose a LOT.</b> Selling a call with no shares behind it has no ceiling on losses. Real accounts need special approval for this."]);
    else if (A.maxL < -L.S * 100 * 0.5 && legs.some(function (l) { return l.side < 0; })) rep.push([wr, "Worst case is " + $$(A.maxL) + ". Only do it if losing that much would not hurt."]);
    else if (A.maxL < 0) rep.push([ok, "You can't lose more than " + $$(-A.maxL) + " on this. Know that number before you click."]);
    if (A.be.length && A.em) { var b0 = A.be[0], mv = (b0 - S) / S * 100, emp = A.em / S * 100; rep.push([Math.abs(mv) < emp * 0.7 ? ok : wr, "The stock has to move " + (mv >= 0 ? "up " : "down ") + Math.abs(mv).toFixed(1) + "% for you to break even. The market thinks a normal move by then is about " + emp.toFixed(1) + "%. " + (Math.abs(mv) < emp * 0.7 ? "That is a fairly easy bar." : "That is a tall order.")]); }
    if (L.dte < 14) rep.push([wr, "Less than 2 weeks left. The option loses value fast. Bad for buyers, good for sellers."]);
    liqCheck().forEach(function (x) { rep.push(x); });
    if (L.src !== "live") rep.push(["ℹ️", "These prices are made up by a math model (" + MOD + "). In TOS, always check the real bid/ask and volume first."]);
    html += '<div class="op-rep">' + rep.map(function (r) { return "<div><i>" + r[0] + "</i><span>" + r[1] + "</span></div>"; }).join("") + '</div><p class="op-sub" style="margin-top:8px">Just for learning. Not advice and not a prediction.</p>';
    st.innerHTML = html; var pe = el.querySelector("#oppl"); if (pe) pe.innerHTML = plainHtml(A, cost, mk, now, S);
  }

  function plainHtml(A, cost, mk, now, S) {
    var legs = L.legs, exp = new Date(Date.now() + L.dte * 864e5).toLocaleDateString("en-US", { month: "short", day: "numeric" }), lines = legs.map(function (l) {
      var n = l.q > 1 ? l.q + " " : "1 ", d = $$(l.prem * l.q * 100, 0);
      if (l.t === "s") return "🏠 You <b>own 100 shares</b> bought at $" + l.k + ".";
      var nm = "$" + l.k + " " + (l.t === "c" ? "call" : "put");
      if (l.side > 0 && l.t === "c") return "🟢 You <b>BUY " + n + nm + "</b> and pay <b>" + d + "</b>. That gives you the right to buy 100 shares at $" + l.k + ", even if the stock costs more.";
      if (l.side > 0) return "🟢 You <b>BUY " + n + nm + "</b> and pay <b>" + d + "</b>. That gives you the right to sell 100 shares at $" + l.k + ", even if the stock is worth less.";
      if (l.t === "c") return "🔴 You <b>SELL " + n + nm + "</b> and get paid <b>" + d + "</b> today. In return you promise to sell 100 shares at $" + l.k + " if the buyer asks.";
      return "🔴 You <b>SELL " + n + nm + "</b> and get paid <b>" + d + "</b> today. In return you promise to buy 100 shares at $" + l.k + " if the buyer asks.";
    });
    var head = cost > 0 ? "You pay <b>" + $$(cost) + "</b> to start." : cost < 0 ? "You get paid <b>" + $$(-cost) + "</b> to start." : "No money changes hands to start.";
    head += A.maxL === -Infinity ? " The most you can <b class=\"op-loss\">lose is unlimited</b>." : A.maxL < 0 ? " The most you can <b class=\"op-loss\">lose is " + $$(-A.maxL) + "</b>." : "";
    head += A.maxP === Infinity ? " The most you can <b class=\"op-gain\">make is unlimited</b>." : A.maxP > 0 ? " The most you can <b class=\"op-gain\">make is " + $$(A.maxP) + "</b>." : "";
    var be = A.be.length ? " You start making money once the stock is " + (A.be[0] > S ? "above" : "below") + " <b>$" + A.be[0].toFixed(2) + "</b> on " + exp + "." : "";
    var pts = [-0.1, -0.05, 0, 0.05, 0.1].map(function (p) { var px = S * (1 + p), v = pl(legs, px, 0, L.iv); return '<div class="op-ex ' + (v >= 0 ? "w" : "l") + '"><span>' + (p === 0 ? "Stock stays" : p > 0 ? "Stock goes up " + p * 100 + "%" : "Stock drops " + (-p * 100) + "%") + "</span><i>$" + px.toFixed(2) + "</i><b>" + (v >= 0 ? "+" : "-") + $$(Math.abs(v)).replace("-", "") + "</b></div>"; }).join("");
    var ex = "";
    if (legs.length === 1 && legs[0].t === "c" && legs[0].side > 0) ex = "Think of it like putting a <b>deposit</b> on a game console that costs $" + legs[0].k + ". If the price jumps to $" + (legs[0].k + 10) + ", your deposit lets you still pay $" + legs[0].k + ", so you win. If the price never gets there, you just lose the deposit. That is all.";
    else if (legs.length === 1 && legs[0].t === "c" && legs[0].side < 0) ex = "Think of it like <b>selling a coupon</b> for your game console. You keep the money for the coupon. But if the console's price shoots way up, you still have to hand it over at the old price. That is why this one is risky.";
    else if (legs.length === 1 && legs[0].t === "p" && legs[0].side > 0) ex = "Think of it like <b>insurance</b> on your phone. You pay a small fee. If the phone breaks (the stock drops), the insurance pays. If nothing happens, the fee is gone.";
    else if (legs.length === 1 && legs[0].t === "p" && legs[0].side < 0) ex = "Think of it like <b>getting paid to put an item on layaway</b>. You collect a fee. If the price falls below your price, you have to buy it anyway at the higher price you promised.";
    else if (legs.some(function (l) { return l.t === "s"; }) && legs.some(function (l) { return l.t === "c" && l.side < 0; })) ex = "You own the stock and <b>rent out the upside</b>. You collect rent today. If the stock jumps past the strike, your shares get sold at that price, so you miss the extra gain.";
    else if (legs.some(function (l) { return l.t === "s"; }) && legs.some(function (l) { return l.t === "p" && l.side > 0; })) ex = "You own the stock and bought <b>insurance</b>. If it crashes, the put limits how much you lose. The insurance costs money, so your gains are a little smaller.";
    else if (legs.length >= 2) ex = "This trade has " + legs.length + " pieces. Some pieces you buy (they cost money, they can pay off). Some you sell (you get paid, but you take on a promise). Together they set a floor and a ceiling on what you can win or lose.";
    return '<div class="op-plain"><h4>🧒 In plain English</h4>' + lines.map(function (x) { return "<p>" + x + "</p>"; }).join("") + "<p>" + head + be + "</p>" + (ex ? '<p class="ex">💡 ' + ex + "</p>" : "") + '<p class="sm"><b>Try it:</b> if you do this on a $' + S.toFixed(2) + " stock, here is what happens on " + exp + " (the day it expires):</p>" + '<div class="op-exs">' + pts + "</div></div>";
  }
  function liqCheck() {
    var out = []; if (L.src !== "live" || !L.chain) return out; var ex = L.chain.exps[L.exp]; if (!ex) return out;
    L.legs.forEach(function (l) { if (l.t === "s") return; var row = (l.t === "c" ? ex.calls : ex.puts).filter(function (r) { return r.k === l.k; })[0]; if (!row) return; var mid = (row.b + row.a) / 2, sp = mid > 0 ? (row.a - row.b) / mid : 1;
      out.push([sp <= 0.1 ? "✅" : sp <= 0.25 ? "⚠️" : "❌", l.k + (l.t === "c" ? "C" : "P") + ": bid/ask gap " + Math.round(sp * 100) + "% of price" + (sp > 0.1 ? " (wide gap = you lose money just getting in and out)" : " (tight, good)") + (row.oi != null ? ". Open interest " + row.oi.toLocaleString() + (row.oi < 100 ? " (thin)" : "") : "")]); });
    return out;
  }

  /* ---------- tabs ---------- */
  var TABS = [["start", "1 · Start here"], ["lab", "2 · Payoff lab"], ["strat", "3 · Strategies"], ["chain", "4 · Option chain (live)"], ["good", "5 · Pick a good option / save money"], ["greeks", "6 · Greeks & time"], ["hedge", "7 · Hedge & income"], ["tos", "8 · thinkorswim guide"], ["quiz", "9 · Risk & quiz"]];
  function fig(svg, cap) { return '<figure class="op-fig" style="margin:0">' + svg + (cap ? "<figcaption>" + cap + "</figcaption>" : "") + "</figure>"; }
  function four() {
    var S = 100, iv = 0.3, d = 30, one = function (t, s, k) { return [mkLeg(t, s, k, 1, S, d, iv)]; };
    var items = [
      ["Buy a CALL", "g", "Bet it goes UP. You pay cash now for the right to buy at the strike. Worst case: you lose what you paid.", one("c", 1, 105)],
      ["Sell a CALL", "r", "You get paid now, but you promise to sell shares at the strike. Own the shares = covered (safe-ish). Don't own them = naked (dangerous).", one("c", -1, 105)],
      ["Buy a PUT", "r", "Bet it goes DOWN, or insure shares you own. Worst case: you lose what you paid.", one("p", 1, 95)],
      ["Sell a PUT", "g", "You get paid now, but you promise to buy shares at the strike if asked. Fine if you'd love to own it at that price.", one("p", -1, 95)]
    ];
    return '<div class="op-grid">' + items.map(function (it) { return '<div class="op-card ' + it[1] + '"><h3>' + it[0] + "</h3>" + fig(miniSvg(it[3], S, iv), "Green = money made, red = money lost, at expiration") + "<p>" + it[2] + "</p></div>"; }).join("") + "</div>";
  }
  function moneySvg() {
    var W = 720, H = 120, x = function (v) { return 40 + (v - 80) / 40 * 640; }, ks = [90, 100, 110];
    return '<svg viewBox="0 0 ' + W + " " + H + '"><line x1="40" x2="680" y1="60" y2="60" stroke="currentColor" stroke-opacity=".4" stroke-width="3"/>' + [80, 90, 100, 110, 120].map(function (v) { return '<text x="' + x(v) + '" y="84" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity=".6">$' + v + "</text>"; }).join("") +
      '<circle cx="' + x(104) + '" cy="60" r="9" fill="#f59e0b"/><text x="' + x(104) + '" y="38" text-anchor="middle" font-size="12" font-weight="700" fill="#f59e0b">stock $104</text>' +
      '<text x="' + x(88) + '" y="108" text-anchor="middle" font-size="12" fill="#2563eb">CALLS: in the money (cheap to buy at strike)</text><text x="' + x(112) + '" y="108" text-anchor="middle" font-size="12" fill="#2563eb">CALLS: out of the money</text>' +
      '<line x1="' + x(100) + '" x2="' + x(100) + '" y1="48" y2="72" stroke="var(--ink)" stroke-width="2"/><text x="' + x(100) + '" y="20" text-anchor="middle" font-size="12" fill="currentColor">strike $100 call</text></svg>';
  }
  function tStart() {
    return '<h3 class="op-h">An option is a coupon on 100 shares</h3><div class="op-grid">' +
      '<div class="op-card b"><div class="ic">🎟️</div><h3>The coupon idea</h3><p>An option is a contract. It lets you buy or sell 100 shares at a price locked in today, until a date.</p></div>' +
      '<div class="op-card g"><div class="ic">📞</div><h3>CALL = right to BUY</h3><p>You want it to go UP. "I can buy at $100 even if it is $120."</p></div>' +
      '<div class="op-card r"><div class="ic">📉</div><h3>PUT = right to SELL</h3><p>You want it to go DOWN, or you want insurance. "I can sell at $100 even if it is $80."</p></div>' +
      '<div class="op-card y"><div class="ic">🏷️</div><h3>Premium</h3><p>The price of the coupon. Quoted per share. A $2.00 option costs $200 (x100).</p></div>' +
      '<div class="op-card y"><div class="ic">🎯</div><h3>Strike</h3><p>The locked-in price in the contract.</p></div>' +
      '<div class="op-card y"><div class="ic">⏳</div><h3>Expiration</h3><p>The coupon dies on this date. Time is part of the price, and it melts every day.</p></div></div>' +
      '<h3 class="op-h">The 4 basic moves (every fancy trade is made of these)</h3>' + four() +
      '<h3 class="op-h">In the money / out of the money</h3><div class="op-2">' + fig(moneySvg(), "ITM = already has built-in value. OTM = only time value, needs a move.") +
      '<div class="op-card"><h3>Buyer vs seller in one line</h3><p><b>Buyers</b> pay a small amount, can lose it all, can win big. <b>Sellers</b> collect cash now, win small most of the time, and can lose big when wrong. Time melts the coupon, which helps sellers and hurts buyers.</p><p>Want the picture of any trade? Go to <b>Payoff lab</b> and click a strategy.</p><div><button class="op-btn p" data-o="tab" data-t="lab">Open the Payoff lab →</button></div></div></div>';
  }
  function tLab() {
    return '<h3 class="op-h">Payoff lab: build any trade and see the picture</h3><p class="op-sub">Drag the sliders. Green is profit, red is loss. Prices are modeled. Pick a quick start:</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' + STR.map(function (s) { return '<button class="op-btn sm" data-o="strat" data-id="' + s.id + '">' + s.ic + " " + s.n + "</button>"; }).join("") + "</div>" + builderHtml();
  }
  function tStrat() {
    return '<h3 class="op-h">Strategies: pick by what you think the stock will do</h3><p class="op-sub">Shapes are drawn from modeled prices on a $100 stock, 30 days, 30% IV. Click "Try it" to load into the lab at the live price.</p><div class="op-grid" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">' +
      STR.map(function (s) { var legs = stratLegs(s, 100, 30, 0.3); return '<div class="op-card ' + s.c + '"><div style="display:flex;justify-content:space-between;gap:6px;align-items:center"><h3>' + s.ic + " " + s.n + '</h3><span class="op-tag ' + (s.lv === "DANGER" ? "r" : s.lv === "Advanced" ? "y" : "g") + '">' + s.lv + "</span></div>" + fig(miniSvg(legs, 100, 0.3)) + "<p>" + s.one + '</p><p><b class="op-gain">Win:</b> ' + s.win + '</p><p><b class="op-loss">Risk:</b> ' + s.bad + '</p><div><span class="op-tag">' + s.v + '</span> <button class="op-btn sm p" data-o="strat" data-id="' + s.id + '" data-go="1">Try it in the lab</button></div></div>'; }).join("") + "</div>";
  }
  function tChain() {
    return '<h3 class="op-h">Option chain, thinkorswim style</h3><p class="op-sub">Calls on the left, puts on the right, strikes in the middle. Click an <b>Ask</b> to BUY it, click a <b>Bid</b> to SELL it. The trade builds on the right.</p>' +
      '<div class="op-ctl"><label>Ticker<input id="opsym" type="text" value="' + (L.sym || "SPY") + '" style="text-transform:uppercase"></label><button class="op-btn p" data-o="load">Load chain</button>' + (L.chain ? '<label>Strikes shown<select data-g="rng"><option value="5"' + (L.rng == 5 ? " selected" : "") + '>±5</option><option value="8"' + (L.rng == 8 ? " selected" : "") + '>±8</option><option value="15"' + (L.rng == 15 ? " selected" : "") + '>±15</option></select></label>' : "") + (L.chain && L.src !== "live" ? '<label>Price<input data-g="cp" type="number" step="any" value="' + L.S + '"></label><label>IV %<input data-g="civ" type="number" step="1" value="' + Math.round(L.iv * 100) + '"></label>' : "") + "</div>" +
      (L.loading ? '<div class="op-note">Loading…</div>' : "") + (L.msg ? '<div class="op-note">' + L.msg + "</div>" : "") +
      (L.chain ? '<div class="op-chain"><div><div id="opexps" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"></div><div class="op-tw" id="optw"></div></div><div><div class="op-spot" id="opspot"></div></div></div>' + builderHtml() : '<div class="op-note">Enter a ticker and press Load chain. If your Schwab account is connected and has market data you get the real chain. If not, you get a practice chain built from the model, clearly marked.</div>');
  }
  function paintChain() {
    var ch = L.chain; if (!ch) return; var ex = ch.exps[L.exp] || ch.exps[0]; if (!ex) return;
    var bx = el.querySelector("#opexps"), tw = el.querySelector("#optw");
    bx.innerHTML = '<span class="op-tag ' + (L.src === "live" ? "g" : "y") + '">' + (L.src === "live" ? "LIVE · Schwab" : "MODELED PRACTICE CHAIN") + "</span> <b>" + ch.sym + " $" + (+L.S).toFixed(2) + "</b> " + ch.exps.map(function (e, i) { return '<button class="op-btn sm' + (i === L.exp ? " p" : "") + '" data-o="exp" data-i="' + i + '">' + e.exp.slice(5) + " · " + e.dte + "d</button>"; }).join("");
    var strikes = {}; ex.calls.concat(ex.puts).forEach(function (r) { strikes[r.k] = 1; }); var ks = Object.keys(strikes).map(Number).sort(function (a, b) { return a - b; });
    var ai = 0, bd = 1e9; ks.forEach(function (k, i) { if (Math.abs(k - L.S) < bd) { bd = Math.abs(k - L.S); ai = i; } }); ks = ks.slice(Math.max(0, ai - L.rng), ai + L.rng + 1);
    var f = function (x, d) { return x == null ? "—" : (+x).toFixed(d == null ? 2 : d); }, sel = function (t, k, s) { return L.legs.some(function (l) { return l.t === t && l.k === k && l.side === s; }) ? " sel" : ""; };
    var get = function (arr, k) { return arr.filter(function (r) { return r.k === k; })[0] || {}; };
    var h = '<table class="op-t"><tr><th colspan="6" class="hc">CALLS</th><th class="hc">STRIKE</th><th colspan="6" class="hc">PUTS</th></tr><tr><th>OI</th><th>Vol</th><th>IV</th><th>Delta</th><th>Bid</th><th>Ask</th><th>Strike</th><th>Bid</th><th>Ask</th><th>Delta</th><th>IV</th><th>Vol</th><th>OI</th></tr>';
    var atK = ks[ai - Math.max(0, ai - L.rng)];
    ks.forEach(function (k, i) {
      var c = get(ex.calls, k), p = get(ex.puts, k), cl = k < L.S ? " itm" : "", pc = k > L.S ? " itm" : "", at = k === atK;
      h += '<tr' + (at ? ' class="atm"' : "") + '><td class="' + cl + '">' + (c.oi == null ? "—" : c.oi.toLocaleString()) + '</td><td class="' + cl + '">' + (c.v == null ? "—" : c.v.toLocaleString()) + '</td><td class="' + cl + '">' + (c.iv == null ? "—" : f(c.iv, 1)) + '</td><td class="' + cl + '">' + f(c.d) + '</td><td class="c' + cl + sel("c", k, -1) + '" data-o="chain" data-t="c" data-s="-1" data-k="' + k + '">' + f(c.b) + '</td><td class="c' + cl + sel("c", k, 1) + '" data-o="chain" data-t="c" data-s="1" data-k="' + k + '">' + f(c.a) + '</td><td class="k">' + k + '</td><td class="c' + pc + sel("p", k, -1) + '" data-o="chain" data-t="p" data-s="-1" data-k="' + k + '">' + f(p.b) + '</td><td class="c' + pc + sel("p", k, 1) + '" data-o="chain" data-t="p" data-s="1" data-k="' + k + '">' + f(p.a) + '</td><td class="' + pc + '">' + f(p.d) + '</td><td class="' + pc + '">' + (p.iv == null ? "—" : f(p.iv, 1)) + '</td><td class="' + pc + '">' + (p.v == null ? "—" : p.v.toLocaleString()) + '</td><td class="' + pc + '">' + (p.oi == null ? "—" : p.oi.toLocaleString()) + "</td></tr>";
    });
    tw.innerHTML = h + "</table>";
    var sp = el.querySelector("#opspot"); if (sp && sp.dataset.sym !== ch.sym) { sp.dataset.sym = ch.sym; sp.innerHTML = ""; try { if (window.StockChart && window.StockChart.embed) window.StockChart.embed(sp, ch.sym, "15", { mini: true }); else sp.innerHTML = '<div class="op-note" style="margin:10px">Live chart unavailable.</div>'; } catch (e) { sp.innerHTML = '<div class="op-note" style="margin:10px">Live chart unavailable.</div>'; } }
  }
  function buildModel(sym, S, iv) {
    var exps = [7, 14, 30, 45, 60, 90].map(function (dte) {
      var dt = new Date(Date.now() + dte * 864e5), ex = dt.toISOString().slice(0, 10), st = step(S), a = Math.round(S / st) * st, rows = { c: [], p: [] };
      for (var i = -20; i <= 20; i++) { var k = r2(a + i * st); if (k <= 0) continue; ["c", "p"].forEach(function (t) {
        var sk = 1 + (t === "p" ? 0.18 : 0.06) * Math.max(0, (S - k) / S) * (t === "p" ? 1 : -0.3) + (t === "c" ? 0.04 * Math.max(0, (k - S) / S) : 0), v = Math.max(0.08, iv * (t === "p" ? 1 + 0.5 * Math.max(0, (S - k) / S) : 1 + 0.2 * Math.max(0, (k - S) / S))), g = bs(t, S, k, dte / 365, v), mid = Math.max(0.01, g.p), sp = Math.max(0.01, mid * 0.03);
        rows[t].push({ k: k, b: Math.max(0, r2(mid - sp / 2)), a: r2(mid + sp / 2), v: null, oi: null, iv: v * 100, d: g.d, t: g.th, vg: g.vg }); }); }
      return { exp: ex, dte: dte, calls: rows.c, puts: rows.p };
    });
    return { sym: sym, exps: exps };
  }
  function liveTo(j) {
    var clean = function (x) { return x == null || Math.abs(x) >= 900 ? null : x; };
    var fix = function (e) { return { exp: e.exp, dte: e.dte, rows: e.rows.map(function (r) { return { k: r.k, b: r.b == null ? 0 : r.b, a: r.a == null ? 0 : r.a, v: r.v, oi: r.oi, iv: clean(r.iv), d: clean(r.d), t: clean(r.t), vg: clean(r.vg) }; }) }; };
    var cs = (j.calls || []).map(fix), ps = (j.puts || []).map(fix), exps = cs.map(function (c, i) { var p = ps.filter(function (x) { return x.exp === c.exp; })[0] || { rows: [] }; return { exp: c.exp, dte: c.dte, calls: c.rows, puts: p.rows }; });
    return { sym: j.sym, exps: exps.sort(function (a, b) { return a.dte - b.dte; }).filter(function (e) { return e.dte >= 0; }).slice(0, 8) };
  }
  async function loadChain(sym) {
    sym = (sym || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "SPY"; L.sym = sym; L.loading = true; L.msg = ""; draw();
    var So = window.stockspotSocial, got = false, price = null;
    try { if (So && So.schwab) { var j = await So.schwab("chain", { symbol: sym }); if (j && j.calls && j.calls.length && j.price) { L.chain = liveTo(j); L.src = "live"; L.S = r2(j.price); if (j.iv) L.iv = Math.max(0.05, Math.min(3, j.iv / 100)); got = true; } else if (j && j.reconnect) L.msg = "Schwab needs reconnecting for live chains. Showing a modeled practice chain."; else if (j && j.noMarket) L.msg = "Your Schwab app does not have the Market Data product yet, so this is a modeled practice chain."; } } catch (e) { }
    if (!got) {
      try { if (So && So.schwab) { var q = await So.schwab("quotes", { symbols: sym }); if (q && q.quotes && q.quotes[sym]) price = q.quotes[sym].p; } } catch (e) { }
      if (price == null) { try { if (So && So.quotes) { var q2 = await So.quotes([sym]); var o = q2 && (q2[sym] || (q2.quotes && q2.quotes[sym])); price = o && (o.p || o.price || o.last); } } catch (e) { } }
      if (price && isFinite(+price)) L.S = r2(+price); else if (!L.msg) L.msg = "Couldn't get a live price, so the practice chain uses $" + L.S + ". Edit the price box to match."; else if (!L.S) L.S = 100;
      L.chain = buildModel(sym, L.S, L.iv); L.src = "model"; if (!L.msg) L.msg = "Practice chain: prices are modeled (" + MOD + ") and volume / open interest are not available.";
    }
    L.legs = []; L.exp = Math.min(L.exp, L.chain.exps.length - 1); L.dte = Math.max(1, L.chain.exps[L.exp].dte); L.day = 0; L.mark = null; L.loading = false; draw();
  }
  function tGood() {
    var S = 100, iv = 0.3, d = 45, call = bs("c", S, 100, d / 365, iv).p, csp = bs("p", S, 95, d / 365, iv).p;
    var bars = [["Buy 100 shares", S * 100, "#2563eb"], ["1 call (stock-replacement)", call * 100, "#16a34a"], ["Bull call spread", (call - bs("c", S, 110, d / 365, iv).p) * 100, "#16a34a"], ["Cash-secured put (cash set aside)", 95 * 100, "#d97706"]];
    var mxv = bars[0][1], bsvg = '<svg viewBox="0 0 720 190">' + bars.map(function (b, i) { var w = Math.max(6, b[1] / mxv * 440); return '<text x="4" y="' + (28 + i * 44) + '" font-size="12" fill="currentColor">' + b[0] + '</text><rect x="210" y="' + (14 + i * 44) + '" width="' + w.toFixed(0) + '" height="22" rx="5" fill="' + b[2] + '"/><text x="' + (216 + w) + '" y="' + (30 + i * 44) + '" font-size="12" font-weight="700" fill="currentColor">' + $$(b[1]) + "</text>"; }).join("") + "</svg>";
    return '<h3 class="op-h">What makes an option "good"?</h3><p class="op-sub">Six quick checks. Use the Option chain tab, they show up there with real numbers.</p><div class="op-grid">' +
      '<div class="op-card g"><div class="ic">💧</div><h3>1. Easy to trade</h3><p>Tight bid/ask (under about 10% of price) and decent open interest. Wide gaps quietly cost you money.</p></div>' +
      '<div class="op-card b"><div class="ic">📏</div><h3>2. Delta = rough odds</h3><p>A 0.30 delta option is roughly a 30% chance to finish in the money. Sellers often like 0.15–0.30. Buyers often like 0.50–0.70.</p></div>' +
      '<div class="op-card y"><div class="ic">⏱️</div><h3>3. Enough time</h3><p>Buyers: give yourself 45+ days so time melts slowly. Sellers: 30–45 days is where melting is fastest.</p></div>' +
      '<div class="op-card r"><div class="ic">🎢</div><h3>4. Is it priced high or low?</h3><p>High IV = expensive options (better to SELL). Low IV = cheap options (better to BUY). Compare to what the stock normally runs.</p></div>' +
      '<div class="op-card y"><div class="ic">🎯</div><h3>5. Break-even vs expected move</h3><p>If the stock must move more than the market expects just to break even, skip it. The lab shows both.</p></div>' +
      '<div class="op-card r"><div class="ic">📅</div><h3>6. Earnings / events</h3><p>Before earnings options are pricey, then IV drops after ("IV crush"). Buyers can be right on direction and still lose.</p></div></div>' +
      '<h3 class="op-h">How options can save you money</h3><div class="op-2">' + fig(bsvg, "Cost to play a $100 stock, 45 days, modeled. Options control 100 shares for less cash up front.") +
      '<div class="op-grid" style="grid-template-columns:1fr"><div class="op-card g"><h3>💸 Buy cheaper than shares</h3><p>A call or a spread controls 100 shares for a fraction of the cash. Your risk is capped at what you paid.</p></div><div class="op-card g"><h3>🎣 Buy shares at a discount</h3><p>Sell a cash-secured put at a price you like. Paid to wait. If it never hits, you keep the cash and repeat.</p></div><div class="op-card b"><h3>🛡️ Pay for protection, cheaply</h3><p>A collar uses the call you sell to fund the put you buy.</p></div><div class="op-card y"><h3>💵 Rent your shares</h3><p>Covered calls turn shares you already hold into income.</p></div></div></div>' +
      '<p class="op-note" style="margin-top:12px">Savings are never free. Cheaper cost usually means capped profit, or you take an obligation (to buy or sell shares). Check the worst case in the lab first.</p>';
  }
  function curveSvg(w, h, fn, lo, hi, labx, opts) {
    var N = 100, pts = [], mx = 0, i; for (i = 0; i <= N; i++) { var x = lo + (hi - lo) * i / N; pts.push([x, fn(x)]); mx = Math.max(mx, pts[i][1]); } mx = mx || 1;
    var X = function (v) { return 40 + (v - lo) / (hi - lo) * (w - 54); }, Y = function (v) { return 14 + (1 - v / mx) * (h - 44); };
    var d = pts.map(function (p, j) { return (j ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join("");
    return '<svg viewBox="0 0 ' + w + " " + h + '"><path d="' + d + '" fill="none" stroke="var(--ink)" stroke-width="2.5"/><line x1="40" x2="' + (w - 14) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="currentColor" stroke-opacity=".4"/><text x="' + (w / 2) + '" y="' + (h - 6) + '" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity=".7">' + labx + '</text><text x="4" y="22" font-size="11" fill="currentColor" fill-opacity=".7">' + $$(mx, 2) + "</text>" + (opts && opts.mark != null ? '<circle cx="' + X(opts.mark) + '" cy="' + Y(fn(opts.mark)) + '" r="6" fill="#f59e0b"/>' : "") + "</svg>";
  }
  var GR = { t: "c", S: 100, K: 100, dte: 30, iv: 0.35 };
  function greeksBody() {
    var g = bs(GR.t, GR.S, GR.K, GR.dte / 365, GR.iv), cls = "";
    var decay = curveSvg(360, 190, function (d) { return bs(GR.t, GR.S, GR.K, d / 365, GR.iv).p * 100; }, 0, Math.max(GR.dte, 5), "days left →  (watch the price melt as it nears 0)", { mark: GR.dte });
    var pxc = curveSvg(360, 190, function (s) { return bs(GR.t, s, GR.K, GR.dte / 365, GR.iv).p * 100; }, GR.K * 0.75, GR.K * 1.25, "stock price →", { mark: GR.S });
    var em = GR.S * GR.iv * Math.sqrt(GR.dte / 365);
    return '<div class="op-stats">' + [["Option price", $$(g.p * 100, 0) + " per contract", ""], ["Delta " + g.d.toFixed(2), "If stock moves $1, option moves about " + $$(Math.abs(g.d) * 100) + ". Also rough odds of finishing in the money.", ""], ["Gamma " + g.g.toFixed(3), "How fast delta itself changes. High near expiry at the strike (wild ride).", ""], ["Theta " + $$(g.th * 100, 2) + "/day", "What a buyer loses (a seller earns) each day if nothing moves.", g.th < 0 ? "op-loss" : ""], ["Vega " + $$(g.vg * 100, 2), "Change per 1 point of IV. Why earnings 'crush' hurts buyers.", ""], ["Expected move ±" + $$(em, 2), "Roughly where the market thinks it can be by expiry (1 standard deviation).", ""]].map(function (a) { return '<div class="op-stat"><b class="' + a[2] + '">' + a[0] + "</b><span>" + a[1] + "</span></div>"; }).join("") + '</div><div class="op-2"><figure class="op-fig" style="margin:0">' + decay + '<figcaption>Time decay: the curve steepens near expiry.</figcaption></figure><figure class="op-fig" style="margin:0">' + pxc + '<figcaption>Price vs stock price today (the orange dot is you).</figcaption></figure></div>';
  }
  function tGreeks() {
    return '<h3 class="op-h">The Greeks, in plain English</h3><p class="op-sub">Move the sliders. Everything updates live (modeled).</p><div class="op-ctl"><label>Type<select data-gr="t"><option value="c">Call</option><option value="p"' + (GR.t === "p" ? " selected" : "") + '>Put</option></select></label><label>Stock $<input data-gr="S" type="number" step="any" value="' + GR.S + '"></label><label>Strike $<input data-gr="K" type="number" step="any" value="' + GR.K + '"></label><label>Days left: <b id="grd">' + GR.dte + '</b><input data-gr="dte" type="range" min="1" max="180" value="' + GR.dte + '"></label><label>IV %: <b id="gri">' + Math.round(GR.iv * 100) + '</b><input data-gr="iv" type="range" min="10" max="150" value="' + Math.round(GR.iv * 100) + '"></label></div><div id="grbody">' + greeksBody() + '</div>' +
      '<div class="op-grid" style="margin-top:12px"><div class="op-card b"><div class="ic">🏎️</div><h3>Delta = speed</h3><p>How much the option moves per $1 in the stock.</p></div><div class="op-card r"><div class="ic">🧊</div><h3>Theta = ice cube</h3><p>Melts every day. Buyers fight it, sellers collect it.</p></div><div class="op-card y"><div class="ic">🌊</div><h3>Vega = waves</h3><p>Rises with fear/jumpiness (IV). After earnings, waves flatten and prices drop.</p></div><div class="op-card g"><div class="ic">🚦</div><h3>Gamma = gas pedal</h3><p>How quickly your speed changes. Spikes at the strike near expiration.</p></div></div>';
  }
  function wheelSvg() {
    var c = [["1 · Sell a cash-secured put", "Paid to wait. Stock stays up? Keep cash, repeat", 0, "#16a34a"], ["2 · Stock dips: you buy 100 shares", "Bought at a discount", 1, "#d97706"], ["3 · Sell covered calls", "Get paid while you hold", 2, "#2563eb"], ["4 · Shares called away", "You sold at a profit, go to step 1", 3, "#16a34a"]];
    return '<svg viewBox="0 0 720 250"><defs><marker id="ar" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="currentColor"/></marker></defs>' + c.map(function (b, i) { var x = 20 + (i === 1 || i === 2 ? 360 : 0), y = 16 + (i > 1 ? 120 : 0); return '<rect x="' + x + '" y="' + y + '" width="320" height="86" rx="14" fill="' + b[3] + '" fill-opacity=".16" stroke="' + b[3] + '"/><text x="' + (x + 14) + '" y="' + (y + 36) + '" font-size="15" font-weight="700" fill="currentColor">' + b[0] + '</text><text x="' + (x + 14) + '" y="' + (y + 62) + '" font-size="13" fill="currentColor" fill-opacity=".75">' + b[1] + "</text>"; }).join("") +
      '<path d="M340 58 L376 58" stroke="currentColor" stroke-width="2" marker-end="url(#ar)"/><path d="M520 104 L520 134" stroke="currentColor" stroke-width="2" marker-end="url(#ar)"/><path d="M376 178 L340 178" stroke="currentColor" stroke-width="2" marker-end="url(#ar)"/><path d="M180 134 L180 106" stroke="currentColor" stroke-width="2" marker-end="url(#ar)"/><text x="360" y="244" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity=".7">That loop is "the Wheel". Only use stocks you would be happy to own.</text></svg>';
  }
  function tHedge() {
    var S = 100, iv = 0.3, d = 45, stock = [mkLeg("s", 1, S, 1, S, d, iv)], hedged = stock.concat([mkLeg("p", 1, 95, 1, S, d, iv)]), col = stock.concat([mkLeg("p", 1, 95, 1, S, d, iv), mkLeg("c", -1, 107.5, 1, S, d, iv)]), nk = [mkLeg("c", -1, 105, 1, S, d, iv)];
    return '<h3 class="op-h">Hedge: protect what you own</h3><div class="op-3"><div class="op-card"><h3>Just shares</h3>' + fig(miniSvg(stock, S, iv)) + "<p>Loss grows all the way to zero.</p></div><div class=\"op-card b\"><h3>Shares + put (insurance)</h3>" + fig(miniSvg(hedged, S, iv)) + "<p>Loss stops at the put strike. You pay a premium for that floor.</p></div><div class=\"op-card b\"><h3>Collar</h3>" + fig(miniSvg(col, S, iv)) + "<p>Call income pays for the put. Floor AND ceiling.</p></div></div>" +
      '<h3 class="op-h">Income: the Wheel</h3>' + fig(wheelSvg(), "A popular income loop: sell puts, maybe own shares, sell calls. Only use stocks you are happy to own.") +
      '<h3 class="op-h">Naked vs covered: why one is dangerous</h3><div class="op-3"><div class="op-card g"><h3>Covered call</h3>' + fig(miniSvg(stock.concat([mkLeg("c", -1, 105, 1, S, d, iv)]), S, iv)) + "<p>You own the shares, so if it soars you just sell them at the strike. Missed upside, not a disaster.</p></div><div class=\"op-card r\"><h3>Naked short call</h3>" + fig(miniSvg(nk, S, iv)) + "<p>You don't own shares. If it soars you must buy at the market to deliver. The red goes up forever.</p></div><div class=\"op-card r\"><h3>Naked short put</h3>" + fig(miniSvg([mkLeg("p", -1, 95, 1, S, d, iv)], S, iv)) + "<p>Loss runs from the strike down toward $0 (large, not infinite). Margin calls are real.</p></div></div>" +
      '<div class="op-note w" style="margin-top:12px"><b>Naked selling in plain words:</b> you collect a small premium and carry a big or unlimited loss. Brokers require special approval and margin for it, and can close you out. A spread (add a cheaper protective option) turns it into a trade with a known worst case. Most beginners should start with spreads and covered trades.</div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="op-btn p" data-o="strat" data-id="cc" data-go="1">Try covered call</button><button class="op-btn" data-o="strat" data-id="col" data-go="1">Try collar</button><button class="op-btn" data-o="strat" data-id="nc" data-go="1">See naked call in the lab</button></div>';
  }
  function tTos() {
    var steps = [["Open the Trade tab", "Top of TOS, then pick a ticker. The option chain sits under 'Option Chain'."], ["Pick an expiration", "Click the date rows to expand. Same idea as the date pills in our chain."], ["Read the chain", "Calls left, puts right, strikes center. Delta, IV, volume and open interest columns are the same ones we show. Add them via the column gear if missing."], ["Click Bid to sell, Ask to buy", "Right-click on a price gives a menu with Buy / Sell choices (e.g. Single or Vertical). The order ticket appears at the bottom."], ["Check the Analyze tab first", "Analyze > Risk Profile draws the same profit picture as our lab, with a date slider. Use Add Simulated Trade."], ["Use paper trading", "TOS has paperMoney. Practice every new strategy there before real cash."], ["Check the numbers in the ticket", "Max loss, buying-power effect, and the limit price. Try the mid price first, work up toward the ask."], ["Mind your approval level", "Your broker limits which strategies you can place (covered, spreads, naked). Check your account's options approval to see what you're allowed."]];
    return '<h3 class="op-h">Doing it in thinkorswim</h3><p class="op-sub">Menu names can differ a little by TOS version. Use this as a map, not a manual.</p><div class="op-2"><div class="op-tos"><div class="bar"><span>MarketWatch</span><span>Analyze</span><span class="on">Trade</span><span>Charts</span></div><div class="bar"><span>All Products</span><span class="on">Option Chain</span><span>Trade Grid</span></div><div><span class="pin">2</span>Nov 20 (11)  Nov 27 (18)  Dec 18 (39)</div><div><span class="pin">3</span>CALLS · OI · VOL · IV · DELTA · BID · ASK | STRIKE | BID · ASK · DELTA · IV · VOL · OI · PUTS</div><div><span class="pin">4</span>Click ASK to BUY, BID to SELL</div><div><span class="pin">5</span>Order ticket at bottom: price, qty, Confirm and Send</div><div><span class="pin">6</span>Analyze tab > Risk Profile = payoff chart</div></div><div class="op-grid" style="grid-template-columns:1fr">' + steps.map(function (s, i) { return '<div class="op-card"><h3>' + (i + 1) + ". " + s[0] + "</h3><p>" + s[1] + "</p></div>"; }).join("") + '</div></div><div style="margin-top:12px"><button class="op-btn p" data-o="tab" data-t="chain">Practice on the chain →</button></div>';
  }
  var QZ = [["You buy a call for $2.00. What is the most you can lose?", ["$2", "$200", "Unlimited"], 1, "The price is per share and a contract is 100 shares, so $200."], ["Which trade has unlimited loss?", ["Covered call", "Naked short call", "Bull call spread"], 1, "A call sold with no shares behind it has no ceiling on losses."], ["You own shares and want cheap protection. What fits?", ["Collar", "Naked short put", "Long straddle"], 0, "A collar = shares + bought put + sold call."], ["High IV usually means options are...", ["Cheap", "Expensive", "Free money"], 1, "High IV = pricey options. Sellers like that, buyers pay more."], ["Why do buyers lose when nothing happens?", ["Delta", "Theta (time decay)", "Gamma"], 1, "Theta melts time value every day."], ["A credit spread caps your loss because...", ["You bought a farther protective option", "Brokers guarantee it", "Time is on your side"], 0, "The long leg limits the loss to the width minus credit."]];
  function tQuiz() {
    return '<h3 class="op-h">Rules that keep you alive</h3><div class="op-grid"><div class="op-card r"><h3>1. Know your max loss</h3><p>Say the number out loud before you click Send.</p></div><div class="op-card r"><h3>2. Small size</h3><p>Risk a small slice of your account per trade. Options move fast.</p></div><div class="op-card y"><h3>3. Avoid illiquid chains</h3><p>Wide bid/ask and low open interest drain you.</p></div><div class="op-card y"><h3>4. Expiration week is a coin-flip zone</h3><p>Assignment risk and wild gamma. Plan to close or roll early.</p></div><div class="op-card b"><h3>5. Paper-trade each new strategy</h3><p>Use TOS paperMoney until it feels boring.</p></div><div class="op-card b"><h3>6. Not advice</h3><p>This page teaches. It does not predict or tell you what to trade.</p></div></div><h3 class="op-h">Quick quiz</h3>' + QZ.map(function (q, i) { return '<div class="op-q"><b>' + (i + 1) + ". " + q[0] + '</b><div class="a">' + q[1].map(function (a, j) { return '<button class="op-btn" data-o="qz" data-q="' + i + '" data-a="' + j + '">' + a + "</button>"; }).join("") + '</div><div class="fu-sub" id="opqx' + i + '"></div></div>'; }).join("");
  }
  var VIEWS = { start: tStart, lab: tLab, strat: tStrat, chain: tChain, good: tGood, greeks: tGreeks, hedge: tHedge, tos: tTos, quiz: tQuiz };

  function draw() {
    if (!el) return;
    var keep = el.querySelector("#opsym"), sv = keep ? keep.value : null; if (sv) L.sym = sv.toUpperCase();
    el.innerHTML = '<h2 style="margin:0">Options school</h2><p class="op-sub" style="margin:4px 0 0">Easy English, pictures first. Modeled on thinkorswim. Education only, not advice.</p><div class="op-tabs">' + TABS.map(function (t) { return '<button data-o="tab" data-t="' + t[0] + '" class="' + (L.tab === t[0] ? "on" : "") + '">' + t[1] + "</button>"; }).join("") + '</div><div id="optab">' + VIEWS[L.tab]() + "</div>";
    after();
  }
  function after() { if (L.tab === "lab") paintLab(); if (L.tab === "chain") { paintChain(); paintLab(); } }

  function bind() {
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-o]"); if (!b || !el.contains(b)) return; var o = b.dataset.o;
      if (o === "tab") { L.tab = b.dataset.t; draw(); window.scrollTo(0, 0); }
      else if (o === "strat") { var s = STR.filter(function (x) { return x.id === b.dataset.id; })[0]; if (s) { L.legs = stratLegs(s, L.S, L.dte, L.iv); L.day = 0; L.mark = null; if (b.dataset.go || L.tab !== "lab") { L.tab = "lab"; } draw(); if (b.dataset.go) window.scrollTo(0, 0); } }
      else if (o === "add") { var t = b.dataset.t; L.legs.push(mkLeg(t, +b.dataset.s, t === "s" ? L.S : rk(L.S, L.S), 1, L.S, L.dte, L.iv)); redoLegs(); }
      else if (o === "rm") { L.legs.splice(+b.dataset.i, 1); redoLegs(); }
      else if (o === "clear") { L.legs = []; redoLegs(); }
      else if (o === "load") { var v = el.querySelector("#opsym"); loadChain(v && v.value); }
      else if (o === "exp") { L.exp = +b.dataset.i; L.dte = Math.max(1, L.chain.exps[L.exp].dte); L.legs = []; L.day = 0; L.mark = null; draw(); }
      else if (o === "chain") {
        var ex = L.chain.exps[L.exp], t2 = b.dataset.t, k = +b.dataset.k, sd = +b.dataset.s, row = (t2 === "c" ? ex.calls : ex.puts).filter(function (r) { return r.k === k; })[0]; if (!row) return;
        var px = sd > 0 ? row.a : row.b, ix = L.legs.findIndex(function (l) { return l.t === t2 && l.k === k && l.side === sd; });
        if (ix > -1) L.legs.splice(ix, 1); else L.legs.push({ t: t2, side: sd, k: k, prem: Math.max(0.01, r2(px)), q: 1 });
        paintChain(); redoLegs();
      }
      else if (o === "qz") { var q = QZ[+b.dataset.q], a = +b.dataset.a, host = b.parentNode; [].forEach.call(host.children, function (x) { x.classList.remove("ok", "no"); }); b.classList.add(a === q[2] ? "ok" : "no"); el.querySelector("#opqx" + b.dataset.q).textContent = (a === q[2] ? "✅ Right. " : "❌ Not quite. ") + q[3]; }
    });
    el.addEventListener("input", function (e) {
      var t = e.target, li = t.dataset.li, g = t.dataset.g, gr = t.dataset.gr;
      if (li != null) { var l = L.legs[+li], f = t.dataset.f, v = parseFloat(t.value); if (!l || !isFinite(v) || v <= 0) return; l[f] = f === "q" ? Math.max(1, Math.round(v)) : v; if (l.t === "s" && f === "k") l.prem = v; paintLab(); }
      else if (g) {
        var v2 = parseFloat(t.value); if (!isFinite(v2)) return;
        if (g === "S") { if (v2 > 0) { L.S = v2; L.mark = null; paintLab(); } }
        else if (g === "iv") { if (v2 > 0) { L.iv = Math.min(3, v2 / 100); paintLab(); } }
        else if (g === "dte") { if (v2 >= 1) { L.dte = Math.round(v2); L.day = Math.min(L.day, L.dte); paintLab(); } }
        else if (g === "day") { L.day = Math.round(v2); paintLab(); } else if (g === "mark") { L.mark = v2; paintLab(); }
        else if (g === "rng") { L.rng = +v2; paintChain(); }
        else if (g === "cp" && v2 > 0) { L.S = v2; L.chain = buildModel(L.sym, L.S, L.iv); paintChain(); paintLab(); }
        else if (g === "civ" && v2 > 0) { L.iv = Math.min(3, v2 / 100); L.chain = buildModel(L.sym, L.S, L.iv); paintChain(); paintLab(); }
      } else if (gr) { var gv = t.value; GR[gr] = gr === "t" ? gv : gr === "iv" ? +gv / 100 : +gv; if (!(GR.S > 0 && GR.K > 0)) return; var bd = el.querySelector("#grbody"); if (bd) bd.innerHTML = greeksBody(); var a = el.querySelector("#grd"), b2 = el.querySelector("#gri"); if (a) a.textContent = GR.dte; if (b2) b2.textContent = Math.round(GR.iv * 100); }
    });
    el.addEventListener("change", function (e) { if (e.target.dataset.gr === "t") { GR.t = e.target.value; var bd = el.querySelector("#grbody"); if (bd) bd.innerHTML = greeksBody(); } if (e.target.dataset.g === "rng") { L.rng = +e.target.value; paintChain(); } });
    el.addEventListener("mousemove", function (e) {
      if (!e.target || e.target.id !== "ophov" || !G) return; var svg = el.querySelector("#opsvg"), r = svg.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * G.W, S = G.lo + (vx - G.m.l) / (G.W - G.m.l - G.m.r) * (G.hi - G.lo);
      L.mark = Math.max(G.lo, Math.min(G.hi, S)); var rs = el.querySelector('[data-g="mark"]'); if (rs) rs.value = L.mark; paintLabLight();
    });
  }
  var lt = 0; function paintLabLight() { var n = Date.now(); if (n - lt < 40) return; lt = n; paintLab(); }
  function redoLegs() { var c = el.querySelector("#oplegs"); if (c) c.innerHTML = legRows(); paintLab(); if (L.tab === "chain") paintChain(); }

  var bound = false;
  function mount(host) {
    if (!document.getElementById("op-css")) { var s = document.createElement("style"); s.id = "op-css"; s.textContent = CSS; document.head.appendChild(s); }
    el = host; if (!bound || host._opb !== true) { host._opb = true; bound = true; bind(); }
    draw();
  }
  root.OptionsPage = { mount: mount, _bs: bs, _analyze: analyze };
})(window);
