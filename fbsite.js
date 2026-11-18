/* Flipbook — the product site inside Revatour.
   Clean white click-through pages: Overview, Example book, Build your book, Clear page, Pricing, Ideas.
   Drafts and the ideas checklist save privately to the signed-in user's account (docs flipbook/draft, flipbook/ideas). */
(function () {
  "use strict";
  var PAGES = [
    ["home", "Overview", "navfbhome"],
    ["example", "Example book", "navfbex"],
    ["build", "Build your book", "navfbbuild"],
    ["clear", "Clear page", "navfbclear"],
    ["pricing", "Pricing", "navfbprice"],
    ["ideas", "Ideas checklist", "navfbideas"]
  ];
  var host = null, cur = "home", D = null, I = null, loaded = false, flipAt = 0, ideaF = "all";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(m) { try { if (window.toast) window.toast(m); } catch (e) {} }
  function db() { try { return window.store && window.store.db; } catch (e) { return null; } }
  function todayISO() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

  /* ---------- data ---------- */
  function defDraft() {
    return { style: "trading", asset: "stocks", range: "rth", tickers: [{ id: uid(), t: "NVDA", from: todayISO(), to: "", asset: "stocks" }],
      marks: { entry: true, target: true, exit: true, stop: true, partial: false, notes: true },
      ind: ["vwap", "ema9", "sma20"], fib: [0.382, 0.5, 0.618], spy: "1y", spyFrom: "", spyTo: "", spyMarks: true,
      tier: "classic", cadence: "monthly", email: "" };
  }
  var SEED = [
    ["Product", "Hardcover ring binder with clear-sleeve pages that snap in"],
    ["Product", "Clear acetate overlay for every chart page: entries, stops, targets, exits"],
    ["Product", "Two books: Trading (intraday to 4 weeks) and Investing (1 month and up)"],
    ["Product", "Monthly report card page: win rate, best and worst trade, P&L curve"],
    ["Product", "SPY context page: what the market did around your trades"],
    ["Product", "Personal cover: name, year, trader handle foil-stamped"],
    ["Pages", "Pre-market + after-hours shading on intraday pages"],
    ["Pages", "Fibonacci, VWAP, SMA and EMA layers the customer picks"],
    ["Pages", "Notes margin printed with the customer's own trade notes"],
    ["Pages", "QR code on each page that opens the live chart on Revatour"],
    ["Pages", "Year-end 'best trades' highlight spread"],
    ["Growth", "Drop the link in trading Discords and X threads (traders first, not everyone)"],
    ["Growth", "Free sample page: upload one trade, get a PDF of the page"],
    ["Growth", "Prop-firm angle: 'frame your funded payout' page"],
    ["Growth", "Referral: give a month, get a month"],
    ["Growth", "Unboxing videos from traders with a following"],
    ["Pricing", "Starter book one-time + refill subscription (weekly / monthly / quarterly)"],
    ["Pricing", "Gift version: 'a year of trades' boxed set"],
    ["Pricing", "Team / trading-room bulk pricing"],
    ["Tech", "Pull fills automatically from Schwab, then other brokers"],
    ["Tech", "Print partner with on-demand binding and acetate printing (2–4 day ship)"],
    ["Tech", "Digital flipbook for people who don't want paper"],
    ["Brand", "Name: Flipbook — 'Your trades, bound.'"],
    ["Brand", "Clean white, premium, Apple-like look (different from the Revatour app)"],
    ["Brand", "Every page says 'For education and memories, not investment advice'"]
  ];
  function defIdeas() { return { items: SEED.map(function (x) { return { id: uid(), c: x[0], t: x[1], s: "open", why: "" }; }) }; }
  async function load() {
    if (loaded) return; loaded = true;
    try {
      var s = db(), a = null, b = null;
      if (s) { var r1 = await s.doc("flipbook/draft").get(), r2 = await s.doc("flipbook/ideas").get(); a = r1 && r1.exists ? r1.data() : null; b = r2 && r2.exists ? r2.data() : null; }
      else { a = JSON.parse(localStorage.getItem("fb-draft") || "null"); b = JSON.parse(localStorage.getItem("fb-ideas") || "null"); }
      D = Object.assign(defDraft(), a || {}); I = b && b.items ? b : defIdeas();
    } catch (e) { D = defDraft(); I = defIdeas(); }
  }
  var svT = 0;
  function saveD() { clearTimeout(svT); svT = setTimeout(function () { var s = db(); try { if (s) s.doc("flipbook/draft").set(Object.assign({}, D, { updated: Date.now() })); else localStorage.setItem("fb-draft", JSON.stringify(D)); } catch (e) {} }, 400); }
  function saveI() { var s = db(); try { if (s) s.doc("flipbook/ideas").set({ items: I.items, updated: Date.now() }); else localStorage.setItem("fb-ideas", JSON.stringify(I)); } catch (e) { toast("Could not save"); } }

  /* ---------- chart drawing (sample data, seeded) ---------- */
  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function candles(n, seed, start, vol, drift) {
    var r = rng(seed), p = start, out = [];
    for (var i = 0; i < n; i++) { var o = p, c = o * (1 + (r() - 0.5 + (drift || 0)) * vol), h = Math.max(o, c) * (1 + r() * vol * 0.5), l = Math.min(o, c) * (1 - r() * vol * 0.5); out.push({ o: o, h: h, l: l, c: c, v: 0.4 + r() }); p = c; }
    return out;
  }
  function sma(C, n) { return C.map(function (_, i) { if (i < n - 1) return null; var s = 0; for (var j = i - n + 1; j <= i; j++) s += C[j].c; return s / n; }); }
  function ema(C, n) { var k = 2 / (n + 1), e = null; return C.map(function (c) { e = e == null ? c.c : c.c * k + e * (1 - k); return e; }); }
  function vwap(C) { var pv = 0, vv = 0; return C.map(function (c) { var tp = (c.h + c.l + c.c) / 3; pv += tp * c.v; vv += c.v; return pv / vv; }); }
  function boll(C, n) { var m = sma(C, n); return C.map(function (_, i) { if (m[i] == null) return null; var s = 0; for (var j = i - n + 1; j <= i; j++) s += Math.pow(C[j].c - m[i], 2); var sd = Math.sqrt(s / n); return [m[i] + 2 * sd, m[i] - 2 * sd]; }); }
  var IND = [
    ["vwap", "VWAP", "#7C4DCC"], ["avwap", "Anchored VWAP", "#A47BEA"], ["ema9", "EMA 9", "#E0662B"], ["ema21", "EMA 21", "#C2364A"], ["ema50", "EMA 50", "#8B1E3F"],
    ["sma9", "SMA 9", "#0F8A8A"], ["sma20", "SMA 20", "#2F6FE4"], ["sma50", "SMA 50", "#1B3A8A"], ["sma200", "SMA 200", "#111"],
    ["fib", "Fibonacci", "#B08D57"], ["boll", "Bollinger Bands", "#8A93A3"], ["pdl", "Prior day H / L / C", "#5B6472"], ["pm", "Pre-market high / low", "#D4A017"],
    ["or", "Opening range", "#17845B"], ["vol", "Volume", "#B9BFCB"], ["rsi", "RSI", "#6366F1"], ["macd", "MACD", "#EC4899"], ["vp", "Volume profile", "#94A3B8"]
  ];
  function chartSVG(o) {
    var C = o.C, W = o.W || 640, H = o.H || 300, pl = 8, pr = o.pr == null ? 46 : o.pr, pt = 12, pb = o.pb == null ? 18 : o.pb, n = C.length;
    var lo = Infinity, hi = -Infinity; C.forEach(function (c) { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); });
    if (o.marks) { var e00 = C[Math.floor(n * 0.3)].c; if (o.marks.stop) lo = Math.min(lo, e00 * 0.985); if (o.marks.target) hi = Math.max(hi, e00 * 1.03); }
    if ((o.ind || []).indexOf("pdl") >= 0) { hi = Math.max(hi, C[0].o * 1.012); lo = Math.min(lo, C[0].o * 0.991); }
    var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    var X = function (i) { return pl + (i + 0.5) * (W - pl - pr) / n; }, Y = function (v) { return pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb); }, bw = (W - pl - pr) / n * 0.62;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="fbx-svg" role="img" aria-label="' + esc(o.label || "Sample chart") + '">';
    for (var g = 1; g < 4; g++) s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (pt + g * (H - pt - pb) / 4) + '" y2="' + (pt + g * (H - pt - pb) / 4) + '" stroke="#EEF0F3"/>';
    if (o.ext) { var a = Math.floor(n * 0.16), b = Math.floor(n * 0.86); s += '<rect x="' + pl + '" y="' + pt + '" width="' + (X(a) - pl) + '" height="' + (H - pt - pb) + '" fill="#F3F5F8"/><rect x="' + X(b) + '" y="' + pt + '" width="' + (W - pr - X(b)) + '" height="' + (H - pt - pb) + '" fill="#F3F5F8"/><text x="' + (pl + 4) + '" y="' + (pt + 12) + '" class="fbx-ax">PRE</text><text x="' + (X(b) + 4) + '" y="' + (pt + 12) + '" class="fbx-ax">AFTER</text>'; }
    if (o.vol) C.forEach(function (c, i) { var vh = c.v / 1.4 * (H - pt - pb) * 0.18; s += '<rect x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + (H - pb - vh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + vh.toFixed(1) + '" fill="#E6E9EE"/>'; });
    C.forEach(function (c, i) { var up = c.c >= c.o, col = o.mono ? "#C9CED6" : up ? "#16A34A" : "#DC2626", y0 = Y(Math.max(c.o, c.c)), hh = Math.max(1.2, Math.abs(Y(c.o) - Y(c.c)));
      s += '<line x1="' + X(i).toFixed(1) + '" x2="' + X(i).toFixed(1) + '" y1="' + Y(c.h).toFixed(1) + '" y2="' + Y(c.l).toFixed(1) + '" stroke="' + col + '" stroke-width="1"/><rect x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + col + '" rx="0.8"/>'; });
    var line = function (arr, col, w, dash) { var d = ""; arr.forEach(function (v, i) { if (v == null) return; d += (d ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1); }); return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 1.8) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' stroke-linejoin="round"/>'; };
    var hl = function (v, col, lab, dash) { return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="' + col + '" stroke-width="1.4"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/><text x="' + (W - pr + 4) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" class="fbx-lab" fill="' + col + '">' + lab + '</text>'; };
    (o.ind || []).forEach(function (k) {
      var c = (IND.filter(function (x) { return x[0] === k; })[0] || [])[2];
      if (k === "vwap") s += line(vwap(C), c, 2);
      else if (k === "avwap") { var a0 = Math.floor(n * 0.35), sub = vwap(C.slice(a0)); s += line(C.map(function (_, i) { return i < a0 ? null : sub[i - a0]; }), c, 1.6, "5 3"); }
      else if (/^ema/.test(k)) s += line(ema(C, +k.slice(3)), c, 1.6);
      else if (/^sma/.test(k)) s += line(sma(C, Math.min(+k.slice(3), n - 1)), c, 1.6);
      else if (k === "boll") { var B = boll(C, 20); s += line(B.map(function (x) { return x && x[0]; }), c, 1, "3 3") + line(B.map(function (x) { return x && x[1]; }), c, 1, "3 3"); }
      else if (k === "fib") { var lo2 = Infinity, hi2 = -Infinity; C.forEach(function (x) { lo2 = Math.min(lo2, x.l); hi2 = Math.max(hi2, x.h); }); [0].concat(o.fib || [0.382, 0.5, 0.618]).concat([1]).forEach(function (f) { s += hl(hi2 - (hi2 - lo2) * f, c, (f * 100).toFixed(1).replace(".0", "") + "%", "2 4"); }); }
      else if (k === "pdl") { s += hl(C[0].o * 1.012, c, "PDH", "6 4") + hl(C[0].o * 0.991, c, "PDL", "6 4"); }
      else if (k === "pm") { s += hl(C[0].o * 1.006, c, "PMH", "2 3") + hl(C[0].o * 0.996, c, "PML", "2 3"); }
      else if (k === "or") { var orH = Math.max.apply(null, C.slice(0, 6).map(function (x) { return x.h; })), orL = Math.min.apply(null, C.slice(0, 6).map(function (x) { return x.l; })); s += '<rect x="' + pl + '" y="' + Y(orH) + '" width="' + (W - pr - pl) + '" height="' + (Y(orL) - Y(orH)) + '" fill="' + c + '" opacity=".07"/>' + hl(orH, c, "ORH") + hl(orL, c, "ORL"); }
    });
    if (o.marks) { var M = o.marks, e0 = C[Math.floor(n * 0.3)].c, stp = e0 * 0.985, tg = e0 * 1.03, ex = C[Math.floor(n * 0.72)].c, ix = Math.floor(n * 0.3), ox = Math.floor(n * 0.72);
      if (M.stop) s += hl(stp, "#DC2626", "STOP", "5 3");
      if (M.target) s += hl(tg, "#16A34A", "TARGET", "5 3");
      if (M.entry) s += '<circle cx="' + X(ix) + '" cy="' + Y(e0) + '" r="7" fill="#2F6FE4" stroke="#fff" stroke-width="2"/><text x="' + (X(ix) - 8) + '" y="' + (Y(e0) + 22) + '" class="fbx-tag" fill="#2F6FE4">BUY</text>';
      if (M.partial) { var px = Math.floor(n * 0.55); s += '<circle cx="' + X(px) + '" cy="' + Y(C[px].c) + '" r="6" fill="#E0662B" stroke="#fff" stroke-width="2"/><text x="' + (X(px) - 14) + '" y="' + (Y(C[px].c) - 12) + '" class="fbx-tag" fill="#E0662B">TRIM ½</text>'; }
      if (M.exit) s += '<circle cx="' + X(ox) + '" cy="' + Y(ex) + '" r="7" fill="#111" stroke="#fff" stroke-width="2"/><text x="' + (X(ox) - 10) + '" y="' + (Y(ex) - 13) + '" class="fbx-tag" fill="#111">SELL</text>';
      if (M.notes) s += '<g transform="translate(' + (X(Math.floor(n * 0.08))) + ',' + (pt + 8) + ')"><rect width="150" height="34" rx="8" fill="#FFF8D6" stroke="#EAD98A"/><text x="10" y="15" class="fbx-note">Waited for VWAP reclaim.</text><text x="10" y="27" class="fbx-note">Stop under the flag.</text></g>';
    }
    return s + '</svg>';
  }

  /* ---------- the 3D book (pure CSS) ---------- */
  function book3d() {
    var C = candles(46, 7, 100, 0.012, 0.02);
    return '<div class="fbx-3d" aria-hidden="true"><div class="fbx-stage">' +
      '<div class="fbx-bk"><div class="fbx-cov"><div class="fbx-cov-in"><small>2026</small><b>Flipbook</b><span>Tucker’s trading year</span></div></div>' +
      '<div class="fbx-pg"><div class="fbx-pgh"><b>$NVDA</b><span>Oct 14 · intraday</span></div>' + chartSVG({ C: C, W: 520, H: 300, mono: false, ind: ["vwap", "ema9"], pr: 8, pb: 6 }) + '</div>' +
      '<div class="fbx-ace">' + chartSVG({ C: C, W: 520, H: 300, mono: true, marks: { entry: 1, stop: 1, target: 1, exit: 1 }, pr: 8, pb: 6 }).replace(/<rect[^>]*fill="#C9CED6"[^>]*\/>|<line[^>]*stroke="#C9CED6"[^>]*\/>/g, "").replace(/<line[^>]*stroke="#EEF0F3"\/>/g, "") + '<i class="fbx-gloss"></i></div>' +
      '<div class="fbx-refill"><i></i><i></i><i></i></div></div></div>' +
      '<div class="fbx-shadow"></div></div>';
  }

  /* ---------- shared bits ---------- */
  function shell(id, body) {
    var ix = PAGES.findIndex(function (p) { return p[0] === id; }), prev = PAGES[ix - 1], next = PAGES[ix + 1];
    return '<div class="fbx">' +
      '<nav class="fbx-top"><span class="fbx-logo"><i></i>Flipbook</span><div class="fbx-steps">' + PAGES.map(function (p, i) { return '<button type="button" data-fbgo="' + p[0] + '" class="' + (p[0] === id ? "on" : i < ix ? "done" : "") + '"><b>' + (i + 1) + '</b>' + p[1] + '</button>'; }).join("") + '</div></nav>' +
      body +
      '<footer class="fbx-nav">' + (prev ? '<button type="button" class="fbx-btn ghost" data-fbgo="' + prev[0] + '">&larr; ' + prev[1] + '</button>' : '<span></span>') + (next ? '<button type="button" class="fbx-btn" data-fbgo="' + next[0] + '">Next: ' + next[1] + ' &rarr;</button>' : '<span></span>') + '</footer>' +
      '<p class="fbx-legal">Flipbook is a keepsake and learning tool. Charts show your own history. Nothing here is investment advice.</p></div>';
  }
  function chip(group, v, label, on, extra) { return '<button type="button" class="fbx-chip' + (on ? " on" : "") + '" data-fbset="' + group + '" data-v="' + esc(v) + '" aria-pressed="' + !!on + '">' + (extra || "") + label + '</button>'; }

  /* ---------- pages ---------- */
  function pHome() {
    return shell("home",
      '<section class="fbx-hero"><div class="fbx-hero-t"><p class="fbx-kick">For traders &amp; investors</p><h1>Your trades,<br><em>bound.</em></h1>' +
      '<p class="fbx-lead">Flipbook turns your real trades into beautifully printed chart pages, with a crystal-clear overlay that shows exactly where you got in, where you got out and where your stop was. Snap each page into your book. Watch your year grow.</p>' +
      '<div class="fbx-cta"><button type="button" class="fbx-btn big" data-fbgo="build">Build my book &rarr;</button><button type="button" class="fbx-btn ghost big" data-fbgo="example">See an example</button></div>' +
      '<div class="fbx-proof"><span>&#9733;&#9733;&#9733;&#9733;&#9733;</span> The trading journal you can actually hold.</div></div>' + book3d() + '</section>' +
      '<section class="fbx-sec"><h2>How it works</h2><div class="fbx-how">' +
      [["1", "Connect or upload", "Link your broker, or type the tickers and dates you traded."], ["2", "Pick your book", "Trading (intraday to 4 weeks) or Investing (1 month and up)."], ["3", "Design the clear page", "Entries, stops, targets, exits, VWAP, moving averages, Fibonacci."], ["4", "Snap it in", "Pages arrive weekly, monthly or quarterly. Your book grows with you."]]
        .map(function (s) { return '<div class="fbx-step"><b>' + s[0] + '</b><h3>' + s[1] + '</h3><p>' + s[2] + '</p></div>'; }).join("") + '</div></section>' +
      '<section class="fbx-sec"><h2>Who it’s for</h2><div class="fbx-who">' +
      [["&#9889;", "Day traders", "Every intraday trade, with pre-market and after-hours shading."], ["&#128200;", "Swing traders", "2-day to 4-week holds on hourly or daily candles."], ["&#127974;", "Long-term investors", "Your 401(k) and buys against the S&amp;P 500, month by month."], ["&#127942;", "Funded traders", "Frame the evaluation you passed and the payout you earned."]]
        .map(function (w) { return '<div class="fbx-card"><span class="fbx-em">' + w[0] + '</span><h3>' + w[1] + '</h3><p>' + w[2] + '</p></div>'; }).join("") + '</div></section>' +
      '<section class="fbx-sec fbx-split"><div><h2>Trading or investing?<br>We pick the right chart.</h2><p class="fbx-mut">A printed page stays sharp with about 80 to 150 candles. So the length of the trade decides the book:</p></div>' +
      '<div class="fbx-cut">' + [["Intraday", "1–5 min candles", "Same day", "t"], ["Intraday + pre / after", "1–5 min, extended hours", "4am – 8pm", "t"], ["Multi-day", "15 min – 1 hour", "2 – 5 days", "t"], ["Swing", "1 hour – daily", "1 – 4 weeks", "t"], ["Investing", "Daily – weekly", "1 month and up", "i"]]
        .map(function (r) { return '<div class="fbx-cutr ' + r[3] + '"><b>' + r[0] + '</b><span>' + r[2] + '</span><small>' + r[1] + '</small><em>' + (r[3] === "t" ? "Trading book" : "Investing book") + '</em></div>'; }).join("") +
      '<p class="fbx-mut" style="margin:10px 0 0">The cutoff: <b>4 weeks (20 trading days)</b>. Anything longer moves to the Investing book automatically.</p></div></section>');
  }
  function pExample() {
    var C1 = candles(78, 11, 182, 0.006, 0.01), C2 = candles(60, 23, 541, 0.004, 0.006), S = candles(120, 3, 420, 0.012, 0.03);
    var spread = [
      ['<div class="fbx-ex-cov"><small>2026 · Trading book</small><b>Flipbook</b><span>@tucker_trades</span><i>Volume 1 · Oct – Dec</i></div>', "The cover", "Your name and year, foil-stamped."],
      ['<div class="fbx-ex-pg"><h4>October at a glance</h4><p>S&amp;P 500 (SPY) · last 6 months, your trades marked</p>' + chartSVG({ C: S, W: 560, H: 260, ind: ["sma50"], marks: { entry: 1, exit: 1 } }) + '<div class="fbx-ex-st"><div><b>14</b><span>trades</span></div><div><b>64%</b><span>win rate</span></div><div><b class="g">+$2,310</b><span>net</span></div></div></div>', "Market context", "What SPY did around your trades."],
      ['<div class="fbx-ex-pg"><h4>$NVDA · Oct 14 · 5-min · pre &amp; after hours</h4>' + chartSVG({ C: C1, W: 560, H: 300, ext: 1, vol: 1, ind: ["vwap", "ema9"] }) + '</div>', "A trade page", "The chart by itself, clean."],
      ['<div class="fbx-ex-pg"><h4>$NVDA · Oct 14 · with the clear page on top</h4>' + chartSVG({ C: C1, W: 560, H: 300, ext: 1, vol: 1, ind: ["vwap", "ema9"], marks: { entry: 1, stop: 1, target: 1, exit: 1, notes: 1 } }) + '</div>', "The clear page", "Lay the acetate on top: buy, stop, target, sell and your note."],
      ['<div class="fbx-ex-pg"><h4>$ES futures · 3-day swing · 15-min</h4>' + chartSVG({ C: C2, W: 560, H: 300, ind: ["fib", "sma20"], fib: [0.382, 0.5, 0.618], marks: { entry: 1, stop: 1, exit: 1 } }) + '</div>', "Futures too", "Multi-day page with Fibonacci levels."],
      ['<div class="fbx-ex-pg"><h4>Report card · October</h4><div class="fbx-rc"><div><b>A–</b><span>Discipline</span></div><div><b>1.9R</b><span>Avg winner</span></div><div><b>0.8R</b><span>Avg loser</span></div><div><b>9 / 14</b><span>Stops honored</span></div></div><p class="fbx-mut">Best trade: $NVDA +$840 · Worst: $TSLA −$310 · Most traded: semis</p></div>', "Report card", "How you did, in one look."]
    ];
    flipAt = Math.max(0, Math.min(spread.length - 1, flipAt));
    var p = spread[flipAt];
    return shell("example", '<section class="fbx-sec"><p class="fbx-kick">Example book</p><h1 class="fbx-h1">Flip through a real-looking book.</h1><p class="fbx-lead">Sample data. Yours is built from your actual trades.</p>' +
      '<div class="fbx-flip"><button type="button" class="fbx-arrow" data-fbflip="-1" aria-label="Previous page"' + (flipAt ? "" : " disabled") + '>&#8249;</button>' +
      '<div class="fbx-sheet" key="' + flipAt + '">' + p[0] + '</div>' +
      '<button type="button" class="fbx-arrow" data-fbflip="1" aria-label="Next page"' + (flipAt < spread.length - 1 ? "" : " disabled") + '>&#8250;</button></div>' +
      '<div class="fbx-cap"><b>' + p[1] + '</b> &middot; ' + p[2] + '</div>' +
      '<div class="fbx-dots">' + spread.map(function (_, i) { return '<button type="button" data-fbpage="' + i + '" class="' + (i === flipAt ? "on" : "") + '" aria-label="Page ' + (i + 1) + '"></button>'; }).join("") + '</div></section>');
  }
  function pBuild() {
    var signed = !!(window.stockspotAuth && window.stockspotAuth.email), T = D.style === "trading";
    var R = [["rth", "Intraday", "9:30am – 4pm"], ["ext", "Intraday + pre / after", "4am – 8pm"], ["multi", "A few days", "2 – 5 days"], ["swing", "Swing", "1 – 4 weeks"]];
    var RI = [["1m", "1 – 3 months"], ["6m", "3 – 12 months"], ["1y", "1 – 3 years"], ["3y", "3+ years"]];
    var A = [["stocks", "&#128200; Stocks & ETFs"], ["futures", "&#128202; Futures"], ["options", "&#127922; Options"], ["crypto", "&#129689; Crypto"], ["forex", "&#128177; Forex"]];
    return shell("build", '<section class="fbx-sec"><p class="fbx-kick">Build your book</p><h1 class="fbx-h1">Four quick steps.</h1>' +
      '<div class="fbx-blk"><h3><b>1</b> Your account</h3><div class="fbx-row2"><div class="fbx-card' + (signed ? " ok" : "") + '"><h4>' + (signed ? "&#10003; Signed in" : "Create your account") + '</h4><p>' + (signed ? esc(window.stockspotAuth.email) : "Sign up free on Revatour to save your book.") + '</p></div>' +
      '<div class="fbx-card"><h4>&#128279; Link a broker (optional)</h4><p>Pull your trades automatically. Schwab works today.</p><button type="button" class="fbx-btn ghost sm" data-fbbroker="1">Open Connections</button></div></div></div>' +
      '<div class="fbx-blk"><h3><b>2</b> Which book?</h3><div class="fbx-row2"><button type="button" class="fbx-pick' + (T ? " on" : "") + '" data-fbset="style" data-v="trading"><span>&#9889;</span><b>Trading book</b><small>Intraday to 4 weeks · minute and hourly candles</small></button><button type="button" class="fbx-pick' + (!T ? " on" : "") + '" data-fbset="style" data-v="investing"><span>&#127793;</span><b>Investing book</b><small>1 month and up · daily and weekly candles</small></button></div>' +
      '<p class="fbx-lab2">What do you trade?</p><div class="fbx-chips">' + A.map(function (a) { return chip("asset", a[0], a[1], D.asset === a[0]); }).join("") + '</div>' +
      '<p class="fbx-lab2">How long are your trades?</p><div class="fbx-chips">' + (T ? R : RI).map(function (r) { return chip("range", r[0], '<b>' + r[1] + '</b> <small>' + (r[2] || "") + '</small>', D.range === r[0]); }).join("") + '</div></div>' +
      '<div class="fbx-blk"><h3><b>3</b> Tickers and dates</h3><p class="fbx-mut">Add each trade or position you want printed. Or paste lines like <code>NVDA, 2026-10-14</code>.</p><div class="fbx-tk">' +
      D.tickers.map(function (t) { return '<div class="fbx-tkr" data-tk="' + t.id + '"><input data-tkf="t" value="' + esc(t.t) + '" placeholder="Ticker (NVDA, ES)" maxlength="12" aria-label="Ticker"><input type="date" data-tkf="from" value="' + esc(t.from) + '" aria-label="Date"><input type="date" data-tkf="to" value="' + esc(t.to) + '" aria-label="End date (optional)"><select data-tkf="asset" aria-label="Type">' + A.map(function (a) { return '<option value="' + a[0] + '"' + (t.asset === a[0] ? " selected" : "") + '>' + a[1].replace(/&#\d+; /, "").replace("&amp;", "&") + '</option>'; }).join("") + '</select><button type="button" class="fbx-x" data-tkdel="' + t.id + '" aria-label="Remove">&#10005;</button></div>'; }).join("") +
      '</div><div class="fbx-cta sm"><button type="button" class="fbx-btn ghost sm" data-tkadd="1">+ Add a ticker</button><label class="fbx-btn ghost sm fbx-up">&#11014; Upload CSV<input type="file" accept=".csv,.txt" data-tkcsv="1" hidden></label></div>' +
      '<textarea class="fbx-paste" data-tkpaste="1" rows="2" placeholder="Paste a list here: TSLA, 2026-10-02 (one per line)"></textarea></div>' +
      '<div class="fbx-blk"><h3><b>4</b> Design the clear page</h3><p class="fbx-mut">Pick what gets printed on the see-through overlay.</p><button type="button" class="fbx-btn" data-fbgo="clear">Design my clear page &rarr;</button></div></section>');
  }
  function pClear() {
    var C = candles(78, 11, 182, 0.006, 0.01), S = candles(D.spy === "3y" ? 156 : D.spy === "2y" ? 104 : D.spy === "1y" ? 120 : D.spy === "6m" ? 126 : D.spy === "3m" ? 63 : D.spy === "1m" ? 21 : 90, 3, 420, D.spy.slice(-1) === "y" ? 0.02 : 0.01, 0.03);
    var MK = [["entry", "&#128309; Entries"], ["target", "&#127919; Targets"], ["exit", "&#9899; Exits"], ["stop", "&#128721; Stops"], ["partial", "&#9986; Partial sells"], ["notes", "&#128221; My notes"]];
    var many = D.ind.length > 4;
    return shell("clear", '<section class="fbx-sec"><p class="fbx-kick">The clear page</p><h1 class="fbx-h1">Design your overlay.</h1><p class="fbx-lead">Everything you pick is printed on clear film that lays right on top of the chart. Tap to try. The preview updates live.</p>' +
      '<div class="fbx-clear"><div class="fbx-ctrl">' +
      '<h3>Map out your trade</h3><div class="fbx-chips">' + MK.map(function (m) { return chip("mark", m[0], m[1], D.marks[m[0]]); }).join("") + '</div>' +
      '<h3>Indicators <small>' + D.ind.length + ' picked' + (many ? ' · 4 or fewer keeps the page clean' : '') + '</small></h3><div class="fbx-chips">' + IND.map(function (x) { return chip("ind", x[0], x[1], D.ind.indexOf(x[0]) >= 0, '<i class="sw" style="background:' + x[2] + '"></i>'); }).join("") + '</div>' +
      (D.ind.indexOf("fib") >= 0 ? '<h3>Fibonacci levels</h3><div class="fbx-chips">' + [0.236, 0.382, 0.5, 0.618, 0.786, 1.272, 1.618].map(function (f) { return chip("fib", f, (f * 100).toFixed(1).replace(".0", "") + "%", D.fib.indexOf(f) >= 0); }).join("") + '</div>' : '') +
      '<h3>Show the S&amp;P 500 (SPY) behind it?</h3><div class="fbx-chips">' + [["1m", "1 month"], ["3m", "3 months"], ["6m", "6 months"], ["1y", "1 year"], ["2y", "2 years"], ["3y", "3 years"], ["custom", "Custom"], ["off", "No SPY page"]].map(function (s) { return chip("spy", s[0], s[1], D.spy === s[0]); }).join("") + '</div>' +
      (D.spy === "custom" ? '<div class="fbx-row2 sm"><label>From <input type="date" data-fbin="spyFrom" value="' + esc(D.spyFrom) + '"></label><label>To <input type="date" data-fbin="spyTo" value="' + esc(D.spyTo) + '"></label></div>' : '') +
      (D.spy !== "off" ? '<label class="fbx-tg"><input type="checkbox" data-fbin="spyMarks"' + (D.spyMarks ? " checked" : "") + '> Mark my trades on the SPY chart</label>' : '') +
      '</div><div class="fbx-prev"><div class="fbx-prevcard"><div class="fbx-pgh"><b>$NVDA</b><span>Preview · sample data</span></div>' + chartSVG({ C: C, W: 640, H: 330, ext: D.range === "ext", vol: D.ind.indexOf("vol") >= 0, ind: D.ind, fib: D.fib, marks: D.marks }) + '</div>' +
      (D.spy !== "off" ? '<div class="fbx-prevcard sm"><div class="fbx-pgh"><b>SPY</b><span>' + (D.spy === "custom" ? (D.spyFrom || "start") + " → " + (D.spyTo || "today") : ({ "1m": "1 month", "3m": "3 months", "6m": "6 months", "1y": "1 year", "2y": "2 years", "3y": "3 years" })[D.spy]) + ' · context page</span></div>' + chartSVG({ C: S, W: 640, H: 170, ind: ["sma50"], marks: D.spyMarks ? { entry: 1, exit: 1 } : null, pb: 6 }) + '</div>' : '') + '</div></div></section>');
  }
  function pPricing() {
    var cad = D.cadence, PR = { weekly: [12, "/week", "5 trading-day pages + 5 clear pages, every Friday"], monthly: [29, "/month", "4 weekly spreads + month report card + SPY page + 8 clear pages"], quarterly: [79, "/quarter", "12 weekly spreads + quarter report + SPY page + 24 clear pages · save 9%"] };
    var subs = Math.round(50e6 / 12 / 29);
    return shell("pricing", '<section class="fbx-sec"><p class="fbx-kick">Pricing</p><h1 class="fbx-h1">One book. Fresh pages on your schedule.</h1>' +
      '<h3 class="fbx-h3">1 · Your book (one time)</h3><div class="fbx-price">' +
      [["classic", "Classic", 79, ["Linen hardcover ring binder", "20 page sleeves + 10 clear pages", "Name and year stamped on the cover", "First month of pages included"]], ["signature", "Signature", 149, ["Vegan-leather cover, gold foil", "40 page sleeves + 25 clear pages", "Archival slipcase and ribbon", "First month of pages included"]]]
        .map(function (t) { return '<button type="button" class="fbx-plan' + (D.tier === t[0] ? " on" : "") + '" data-fbset="tier" data-v="' + t[0] + '">' + (t[0] === "signature" ? '<em>Most loved</em>' : '') + '<b>' + t[1] + '</b><span class="fbx-amt">$' + t[2] + '</span><ul>' + t[3].map(function (x) { return '<li>' + x + '</li>'; }).join("") + '</ul></button>'; }).join("") + '</div>' +
      '<h3 class="fbx-h3">2 · Your pages (subscription)</h3><div class="fbx-seg">' + ["weekly", "monthly", "quarterly"].map(function (c) { return '<button type="button" data-fbset="cadence" data-v="' + c + '" class="' + (cad === c ? "on" : "") + '">' + c[0].toUpperCase() + c.slice(1) + '</button>'; }).join("") + '</div>' +
      '<div class="fbx-sub"><span class="fbx-amt">$' + PR[cad][0] + '<small>' + PR[cad][1] + '</small></span><p>' + PR[cad][2] + '</p><p class="fbx-mut">Trading or Investing book. Pause or cancel anytime. Free shipping in the US.</p></div>' +
      '<div class="fbx-total"><div><small>First order</small><b>$' + (D.tier === "signature" ? 149 : 79) + '</b><span>book, ships with month one</span></div><div><small>Then</small><b>$' + PR[cad][0] + PR[cad][1] + '</b><span>' + cad + ' pages</span></div>' +
      '<div class="fbx-cta"><input type="email" data-fbin="email" value="' + esc(D.email) + '" placeholder="Email for early access" aria-label="Email"><button type="button" class="fbx-btn" data-fbreserve="1">Reserve my book</button></div><p class="fbx-mut" style="margin:6px 0 0">No charge today. Reserving saves your choices to your account.</p></div>' +
      '<h3 class="fbx-h3">The $50 million math</h3><div class="fbx-math"><div><b>' + subs.toLocaleString() + '</b><span>monthly subscribers at $29</span></div><div class="op">=</div><div><b>$50M</b><span>a year in page revenue</span></div><div class="op">+</div><div><b>$79–$149</b><span>per book up front</span></div></div>' +
      '<p class="fbx-mut">Rough unit costs to check with a print partner: page print $0.60–$1.20, clear film $0.30–$0.50, binder $14–$28, shipping $4–$6 a month.</p></section>');
  }
  function pIdeas() {
    var L = I.items, F = ideaF, cats = [], seen = {};
    L.forEach(function (x) { if (!seen[x.c]) { seen[x.c] = 1; cats.push(x.c); } });
    var shown = L.filter(function (x) { return F === "all" || x.s === F; }), done = L.filter(function (x) { return x.s === "done"; }).length, cut = L.filter(function (x) { return x.s === "cut"; }).length;
    return shell("ideas", '<section class="fbx-sec"><p class="fbx-kick">Ideas checklist</p><h1 class="fbx-h1">Build the $50M idea, one box at a time.</h1>' +
      '<div class="fbx-ibar"><div class="fbx-prog"><i style="width:' + (L.length ? done / L.length * 100 : 0) + '%"></i></div><span>' + done + ' done · ' + cut + ' crossed out · ' + (L.length - done - cut) + ' open</span></div>' +
      '<form class="fbx-iadd" data-fbiadd="1"><select data-iacat aria-label="Category">' + cats.concat(["New category…"]).map(function (c) { return '<option>' + esc(c) + '</option>'; }).join("") + '</select><input data-iatxt placeholder="Add an idea…" maxlength="300" aria-label="New idea"><button type="submit" class="fbx-btn">Add</button></form>' +
      '<div class="fbx-seg">' + [["all", "All"], ["open", "Open"], ["done", "Done"], ["cut", "Crossed out"]].map(function (f) { return '<button type="button" data-ifil="' + f[0] + '" class="' + (F === f[0] ? "on" : "") + '">' + f[1] + '</button>'; }).join("") + '</div>' +
      cats.map(function (c) { var it = shown.filter(function (x) { return x.c === c; }); if (!it.length) return ""; return '<div class="fbx-icat"><h3>' + esc(c) + '</h3>' + it.map(function (x) {
        return '<div class="fbx-idea s-' + x.s + '" data-iid="' + x.id + '"><button type="button" class="fbx-ick" data-idone="' + x.id + '" aria-label="' + (x.s === "done" ? "Mark open" : "Mark done") + '">' + (x.s === "done" ? "&#10003;" : "") + '</button>' +
          '<div class="fbx-itx"><span>' + esc(x.t) + '</span>' + (x.s === "cut" ? '<input class="fbx-why" data-iwhy="' + x.id + '" value="' + esc(x.why) + '" placeholder="What didn’t we like about it?" maxlength="300">' : '') + '</div>' +
          '<button type="button" class="fbx-icut" data-icut="' + x.id + '">' + (x.s === "cut" ? "Bring back" : "Cross out") + '</button><button type="button" class="fbx-x" data-idel="' + x.id + '" aria-label="Delete idea">&#10005;</button></div>'; }).join("") + '</div>'; }).join("") +
      (shown.length ? "" : '<p class="fbx-mut">Nothing here yet.</p>') + '</section>');
  }

  /* ---------- render + events ---------- */
  function render() {
    if (!host) return;
    var f = { home: pHome, example: pExample, build: pBuild, clear: pClear, pricing: pPricing, ideas: pIdeas }[cur] || pHome;
    host.innerHTML = f();
    PAGES.forEach(function (p) { var b = document.getElementById(p[2]); if (b) b.classList.toggle("on", p[0] === cur); });
  }
  function go(p) { cur = p; render(); try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { window.scrollTo(0, 0); } }
  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
  function addTickers(text) {
    var n = 0; String(text || "").split(/\r?\n/).forEach(function (ln) {
      var p = ln.split(/[,\t;]+/).map(function (x) { return x.trim(); }); if (!p[0] || /ticker|symbol/i.test(p[0])) return;
      var t = p[0].replace(/^\$/, "").toUpperCase().slice(0, 12); if (!/^[A-Z0-9.\/=!-]{1,12}$/.test(t)) return;
      var d = (p[1] || "").replace(/\//g, "-"), m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(d); if (m) d = m[3] + "-" + ("0" + m[1]).slice(-2) + "-" + ("0" + m[2]).slice(-2);
      var dd = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ""; if (D.tickers.some(function (x) { return x.t === t && x.from === dd; })) return;
      D.tickers.push({ id: uid(), t: t, from: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "", to: /^\d{4}-\d{2}-\d{2}$/.test(p[2] || "") ? p[2] : "", asset: D.asset }); n++;
    });
    D.tickers = D.tickers.filter(function (t) { return t.t; }).slice(0, 500); saveD(); render(); toast(n ? "Added " + n + " ticker" + (n > 1 ? "s" : "") : "No tickers found. Use lines like NVDA, 2026-10-14");
  }
  function onClick(ev) {
    var b = ev.target.closest("button"); if (!b || !host.contains(b)) return;
    var d = b.dataset;
    if (d.fbgo) return go(d.fbgo);
    if (d.fbflip) { flipAt += +d.fbflip; return render(); }
    if (d.fbpage) { flipAt = +d.fbpage; return render(); }
    if (d.fbset) {
      var g = d.fbset, v = d.v;
      if (g === "style") { D.style = v; D.range = v === "trading" ? "rth" : "1y"; }
      else if (g === "mark") D.marks[v] = !D.marks[v];
      else if (g === "ind") toggleIn(D.ind, v);
      else if (g === "fib") { toggleIn(D.fib, +v); D.fib.sort(); }
      else D[g] = v;
      saveD(); return render();
    }
    if (d.fbbroker) { var s = document.getElementById("navset"); if (s) s.click(); setTimeout(function () { var c = document.getElementById("st-conn"); if (c) c.scrollIntoView({ behavior: "smooth" }); }, 400); return; }
    if (d.tkadd) { D.tickers.push({ id: uid(), t: "", from: todayISO(), to: "", asset: D.asset }); saveD(); render(); var ins = host.querySelectorAll('[data-tkf="t"]'); if (ins.length) ins[ins.length - 1].focus(); return; }
    if (d.tkdel) { D.tickers = D.tickers.filter(function (t) { return t.id !== d.tkdel; }); saveD(); return render(); }
    if (d.fbreserve) { if (D.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(D.email)) { toast("Check that email"); return; } D.reserved = Date.now(); saveD(); toast("Reserved! Your choices are saved. No charge."); return; }
    if (d.ifil) { ideaF = d.ifil; return render(); }
    var it = function (id) { return I.items.filter(function (x) { return x.id === id; })[0]; };
    if (d.idone) { var x = it(d.idone); x.s = x.s === "done" ? "open" : "done"; saveI(); return render(); }
    if (d.icut) { var y = it(d.icut); y.s = y.s === "cut" ? "open" : "cut"; saveI(); render(); if (y.s === "cut") { var w = host.querySelector('[data-iwhy="' + y.id + '"]'); if (w) w.focus(); } return; }
    if (d.idel) { if (!confirm("Delete this idea?")) return; I.items = I.items.filter(function (z) { return z.id !== d.idel; }); saveI(); return render(); }
  }
  function onInput(ev) {
    var t = ev.target; if (!host.contains(t)) return;
    var row = t.closest("[data-tk]");
    if (row && t.dataset.tkf) { var k = D.tickers.filter(function (x) { return x.id === row.dataset.tk; })[0]; if (k) { k[t.dataset.tkf] = t.dataset.tkf === "t" ? t.value.toUpperCase().replace(/^\$/, "") : t.value; saveD(); } return; }
    if (t.dataset.fbin) { D[t.dataset.fbin] = t.type === "checkbox" ? t.checked : t.value; saveD(); if (t.type === "checkbox" || t.type === "date") render(); return; }
    if (t.dataset.iwhy) { var x = I.items.filter(function (z) { return z.id === t.dataset.iwhy; })[0]; if (x) { x.why = t.value; clearTimeout(onInput.t); onInput.t = setTimeout(saveI, 500); } }
  }
  function onChange(ev) {
    var t = ev.target; if (!host.contains(t)) return;
    if (t.dataset.tkcsv && t.files && t.files[0]) { var fr = new FileReader(); fr.onload = function () { addTickers(fr.result); }; fr.readAsText(t.files[0]); return; }
    if (t.dataset.tkpaste != null && t.value.trim()) { var v = t.value; t.value = ""; setTimeout(function () { addTickers(v); }, 0); return; }
    if (t.dataset.fbin && (t.type === "checkbox" || t.type === "date")) return;
    if (t.matches("[data-iacat]") && t.value === "New category…") { var n = prompt("New category name"); if (n) { var o = document.createElement("option"); o.textContent = n.slice(0, 30); t.insertBefore(o, t.lastChild); t.value = o.textContent; } else t.selectedIndex = 0; }
  }
  function onSubmit(ev) {
    var f = ev.target; if (!host.contains(f) || !f.dataset.fbiadd) return; ev.preventDefault();
    var tx = f.querySelector("[data-iatxt]").value.trim(); if (!tx) return;
    I.items.push({ id: uid(), c: f.querySelector("[data-iacat]").value, t: tx, s: "open", why: "" }); saveI(); render(); toast("Idea added");
  }
  function onKey(ev) {
    if (!host || host.hidden || !host.offsetParent || cur !== "example") return;
    if (/input|textarea|select/i.test(ev.target.tagName)) return;
    if (ev.key === "ArrowRight") { flipAt++; render(); } else if (ev.key === "ArrowLeft") { flipAt--; render(); }
  }

  function css() {
    if (document.getElementById("fbxcss")) return;
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap"; document.head.appendChild(l);
    var s = document.createElement("style"); s.id = "fbxcss";
    s.textContent = [
      "#fbsv.wrap{max-width:none;width:100%;box-sizing:border-box;padding:0}",
      ".fbx{--k:#0B0B0C;--g:#6B6F76;--h:#ECECEF;--bl:#0A66FF;--gold:#B08D57;background:#fff;color:var(--k);font-family:Inter,system-ui,sans-serif;min-height:100vh;padding:0 clamp(16px,4vw,56px) 40px;-webkit-font-smoothing:antialiased;color-scheme:light}",
      ".fbx section{background:none!important;border:0!important;border-radius:0!important;margin:0!important;box-shadow:none!important}.fbx section.fbx-sec{border-top:1px solid var(--h)!important;padding:44px 0!important}.fbx section.fbx-hero{padding:56px 0 40px!important}.fbx section.fbx-hero+.fbx-sec{border-top:0!important}.fbx *{box-sizing:border-box}.fbx h1,.fbx h2,.fbx h3,.fbx h4{color:var(--k);margin:0}.fbx p{margin:0}",
      ".fbx-top{position:sticky;top:0;z-index:5;background:rgba(255,255,255,.88);-webkit-backdrop-filter:saturate(180%) blur(16px);backdrop-filter:saturate(180%) blur(16px);display:flex;align-items:center;gap:20px;padding:14px 0;border-bottom:1px solid var(--h);margin:0 0 8px;flex-wrap:wrap}",
      ".fbx-logo{display:flex;align-items:center;gap:9px;font:700 20px Fraunces,serif;letter-spacing:-.01em}.fbx-logo i{width:22px;height:26px;border-radius:3px 6px 6px 3px;background:linear-gradient(90deg,#0B0B0C 0 22%,#2a2a2e 22%);box-shadow:3px 3px 0 #D9DCE1}",
      ".fbx-steps{display:flex;gap:4px;flex-wrap:wrap;margin-left:auto}.fbx-steps button{border:0;background:none;color:var(--g);font:600 13px Inter,sans-serif;padding:8px 12px;border-radius:999px;cursor:pointer;display:flex;align-items:center;gap:7px}.fbx-steps b{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:11px;background:#F2F3F5;color:var(--g)}.fbx-steps button:hover{color:var(--k);background:#F6F7F9}.fbx-steps .on{color:var(--k);background:#F2F3F5}.fbx-steps .on b{background:var(--k);color:#fff}.fbx-steps .done b{background:#E8F1FF;color:var(--bl)}",
      ".fbx-btn{border:1px solid var(--k);background:var(--k);color:#fff;border-radius:999px;padding:11px 20px;font:600 14px Inter,sans-serif;cursor:pointer;transition:transform .15s,box-shadow .15s;display:inline-flex;align-items:center;gap:6px;text-decoration:none}.fbx-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.12)}.fbx-btn.ghost{background:#fff;color:var(--k);border-color:#D6D8DD}.fbx-btn.big{padding:15px 26px;font-size:16px}.fbx-btn.sm{padding:8px 14px;font-size:13px}",
      ".fbx-hero{display:grid;grid-template-columns:minmax(320px,1fr) minmax(360px,1.1fr);gap:40px;align-items:center;padding:56px 0 40px}@media(max-width:980px){.fbx-hero{grid-template-columns:1fr}}",
      ".fbx-kick{font:700 12px Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:0 0 14px!important}",
      ".fbx-hero h1{font:700 clamp(48px,7vw,92px)/.95 Fraunces,serif;letter-spacing:-.03em}.fbx-hero h1 em{font-style:italic;color:#3A3A40}.fbx-lead{font-size:18px;line-height:1.55;color:#3D4048;margin:20px 0 26px!important;max-width:560px}",
      ".fbx-cta{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.fbx-cta.sm{margin-top:10px}.fbx-proof{margin-top:24px;color:var(--g);font-size:14px}.fbx-proof span{color:var(--gold);letter-spacing:2px;margin-right:6px}",
      ".fbx-3d{position:relative;height:460px;perspective:1600px}.fbx-stage{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(52deg) rotateZ(-28deg) translateY(-20px);animation:fbxfloat 7s ease-in-out infinite}@keyframes fbxfloat{50%{transform:rotateX(50deg) rotateZ(-25deg) translateY(-34px)}}",
      ".fbx-bk{position:absolute;left:12%;top:8%;width:78%;height:74%;transform-style:preserve-3d}",
      ".fbx-cov{position:absolute;inset:0;border-radius:6px 14px 14px 6px;background:linear-gradient(135deg,#1A1B1F,#0B0B0C);transform:translateZ(-18px);box-shadow:0 0 0 1px #000}.fbx-cov::before{content:'';position:absolute;left:-14px;top:0;bottom:0;width:18px;border-radius:6px 0 0 6px;background:linear-gradient(90deg,#000,#26272c)}.fbx-cov-in{position:absolute;right:-6%;top:-26%;width:56%;height:46%;border-radius:10px;background:linear-gradient(135deg,#17181c,#0B0B0C);transform:rotateZ(8deg) translateZ(-30px);color:#fff;padding:18px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 30px 50px rgba(0,0,0,.35)}.fbx-cov-in small{color:var(--gold);font-weight:700;letter-spacing:.2em;font-size:10px}.fbx-cov-in b{font:700 28px Fraunces,serif;color:#fff}.fbx-cov-in span{font-size:11px;color:#C7C9CF}",
      ".fbx-pg{position:absolute;inset:4% 3% 4% 4%;background:#fff;border-radius:4px;transform:translateZ(0);box-shadow:0 1px 0 #E5E7EB,0 2px 0 #F1F2F4,0 3px 0 #E5E7EB,0 4px 0 #F1F2F4,0 6px 14px rgba(0,0,0,.12);padding:12px}.fbx-pgh{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}.fbx-pgh b{font:700 18px Fraunces,serif}.fbx-pgh span{font-size:11px;color:var(--g)}",
      ".fbx-ace{position:absolute;inset:4% 3% 4% 4%;padding:12px;padding-top:38px;border-radius:4px;background:linear-gradient(120deg,rgba(255,255,255,.28),rgba(220,235,255,.12) 40%,rgba(255,255,255,.3));border:1px solid rgba(160,190,230,.6);box-shadow:0 18px 30px rgba(10,40,80,.18);transform:translateZ(70px);animation:fbxace 7s ease-in-out infinite;overflow:hidden}@keyframes fbxace{0%,100%{transform:translateZ(70px)}45%,60%{transform:translateZ(6px)}}.fbx-gloss{position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.65) 48%,transparent 56%);animation:fbxgl 7s ease-in-out infinite}@keyframes fbxgl{0%{transform:translateX(-30%)}100%{transform:translateX(30%)}}",
      ".fbx-refill{position:absolute;right:-30%;bottom:-18%;width:40%;height:46%;transform:translateZ(10px) rotateZ(12deg)}.fbx-refill i{position:absolute;inset:0;background:#fff;border-radius:4px;box-shadow:0 6px 16px rgba(0,0,0,.12);border:1px solid #ECEDEF}.fbx-refill i:nth-child(2){transform:translate(8px,-8px)}.fbx-refill i:nth-child(3){transform:translate(16px,-16px);background:linear-gradient(#fff,#fff) padding-box,linear-gradient(90deg,#16A34A,#DC2626) border-box}",
      ".fbx-shadow{position:absolute;left:18%;right:8%;bottom:2%;height:40px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.18),transparent);filter:blur(8px)}",
      ".fbx-sec{padding:44px 0;border-top:1px solid var(--h)}.fbx-hero+.fbx-sec{border-top:0}.fbx-sec h2{font:700 clamp(30px,3.4vw,44px)/1.05 Fraunces,serif;letter-spacing:-.02em;margin-bottom:22px}.fbx-h1{font:700 clamp(36px,4.6vw,60px)/1.02 Fraunces,serif!important;letter-spacing:-.02em}.fbx-h3{font:700 22px Fraunces,serif!important;margin:30px 0 12px!important}",
      ".fbx-how,.fbx-who{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.fbx-step{padding:22px;border-radius:20px;background:#FAFAFB;border:1px solid var(--h)}.fbx-step b{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--k);color:#fff;font-size:14px;margin-bottom:14px}.fbx-step h3,.fbx-card h3{font:700 18px Inter,sans-serif;margin-bottom:6px}.fbx-step p,.fbx-card p{color:var(--g);font-size:14.5px;line-height:1.5}",
      ".fbx-card{padding:20px;border-radius:20px;border:1px solid var(--h);background:#fff;transition:transform .2s,box-shadow .2s}.fbx-card:hover{transform:translateY(-3px);box-shadow:0 16px 30px rgba(0,0,0,.06)}.fbx-card.ok{border-color:#16A34A;background:#F3FBF5}.fbx-card h4{font:700 16px Inter,sans-serif;margin-bottom:4px}.fbx-card .fbx-btn{margin-top:12px}.fbx-em{font-size:30px;display:block;margin-bottom:10px}",
      ".fbx-split{display:grid;grid-template-columns:minmax(260px,.8fr) 1.2fr;gap:36px;align-items:start}@media(max-width:900px){.fbx-split{grid-template-columns:1fr}}.fbx-mut{color:var(--g);font-size:14.5px;line-height:1.55}",
      ".fbx-cut{display:flex;flex-direction:column;gap:8px}.fbx-cutr{display:grid;grid-template-columns:1.2fr 1fr 1.2fr auto;gap:12px;align-items:center;padding:14px 18px;border-radius:16px;background:#FAFAFB;border:1px solid var(--h)}.fbx-cutr b{font-size:15px}.fbx-cutr span{font-weight:600}.fbx-cutr small{color:var(--g)}.fbx-cutr em{font-style:normal;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;background:#E8F1FF;color:var(--bl)}.fbx-cutr.i{background:#F6F2EA;border-color:#EADFCB}.fbx-cutr.i em{background:#EFE3CC;color:#7A5B2A}",
      ".fbx-flip{display:flex;align-items:center;gap:20px;justify-content:center;margin:30px 0 14px;perspective:2000px}.fbx-arrow{width:52px;height:52px;border-radius:50%;border:1px solid #D6D8DD;background:#fff;font-size:28px;cursor:pointer;flex:0 0 52px}.fbx-arrow:disabled{opacity:.3;cursor:default}",
      ".fbx-sheet{width:min(820px,100%);aspect-ratio:1.45;background:#fff;border-radius:6px 16px 16px 6px;box-shadow:-10px 0 0 -4px #F1F2F4,-14px 0 0 -6px #E5E7EB,0 30px 60px rgba(0,0,0,.14),0 0 0 1px #ECEDEF;padding:28px 34px;animation:fbxturn .55s cubic-bezier(.2,.8,.2,1);transform-origin:left center;position:relative;overflow:hidden}.fbx-sheet::before{content:'';position:absolute;left:0;top:0;bottom:0;width:30px;background:linear-gradient(90deg,rgba(0,0,0,.06),transparent)}@keyframes fbxturn{from{transform:rotateY(-70deg);opacity:.2}to{transform:none;opacity:1}}",
      ".fbx-ex-cov{position:absolute;inset:0;padding:40px;background:linear-gradient(135deg,#17181c,#0B0B0C);color:#fff;display:flex;flex-direction:column;justify-content:center;border-radius:6px 16px 16px 6px}.fbx-ex-cov small{color:var(--gold);letter-spacing:.2em;font-weight:700;font-size:12px;text-transform:uppercase}.fbx-ex-cov b{font:700 clamp(48px,7vw,84px) Fraunces,serif}.fbx-ex-cov span{font-size:18px;color:#D8DADF}.fbx-ex-cov i{margin-top:auto;color:#8F939C;font-size:13px}",
      ".fbx-ex-pg h4{font:700 20px Fraunces,serif;margin-bottom:4px}.fbx-ex-pg>p{font-size:13px;color:var(--g);margin-bottom:6px}.fbx-ex-st,.fbx-rc{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}.fbx-rc{grid-template-columns:repeat(2,1fr);margin:18px 0}.fbx-ex-st div,.fbx-rc div{background:#FAFAFB;border-radius:14px;padding:12px}.fbx-ex-st b,.fbx-rc b{display:block;font:700 26px Fraunces,serif}.fbx-ex-st b.g{color:#16A34A}.fbx-ex-st span,.fbx-rc span{font-size:12px;color:var(--g)}",
      ".fbx-cap{text-align:center;font-size:15px;color:#3D4048}.fbx-dots{display:flex;justify-content:center;gap:8px;margin-top:14px}.fbx-dots button{width:9px;height:9px;border-radius:50%;border:0;background:#D6D8DD;cursor:pointer;padding:0}.fbx-dots .on{background:var(--k);width:26px;border-radius:9px}",
      ".fbx-svg{width:100%;height:auto;display:block}.fbx-ax{font:700 9px Inter,sans-serif;fill:#9AA0A8;letter-spacing:.08em}.fbx-lab{font:700 9.5px Inter,sans-serif}.fbx-tag{font:800 10px Inter,sans-serif;letter-spacing:.06em}.fbx-note{font:600 9.5px Inter,sans-serif;fill:#6B5A12}",
      ".fbx-blk{margin-top:28px;padding:26px;border-radius:22px;border:1px solid var(--h);background:#fff}.fbx-blk>h3{display:flex;align-items:center;gap:12px;font:700 20px Inter,sans-serif;margin-bottom:14px}.fbx-blk>h3 b{width:30px;height:30px;border-radius:50%;background:var(--k);color:#fff;display:grid;place-items:center;font-size:14px}",
      ".fbx-row2{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.fbx-row2.sm{margin-top:10px;grid-template-columns:repeat(auto-fit,minmax(160px,220px))}.fbx-row2 label{display:flex!important;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:var(--g)}",
      ".fbx-pick{text-align:left;border:1.5px solid #E2E4E8;background:#fff;border-radius:20px;padding:20px;cursor:pointer;font:inherit;color:var(--k);display:flex;flex-direction:column;gap:4px;transition:all .15s}.fbx-pick span{font-size:28px}.fbx-pick b{font-size:18px}.fbx-pick small{color:var(--g);font-size:13.5px}.fbx-pick.on{border-color:var(--k);box-shadow:0 0 0 3px rgba(11,11,12,.08);background:#FAFAFB}",
      ".fbx-lab2{font:700 13px Inter,sans-serif;margin:20px 0 8px!important;color:var(--k)}.fbx-chips{display:flex;flex-wrap:wrap;gap:8px}.fbx-chip{border:1px solid #E2E4E8;background:#fff;color:var(--k);border-radius:999px;padding:9px 14px;font:500 13.5px Inter,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:all .15s}.fbx-chip:hover{border-color:#B9BDC5}.fbx-chip small{color:var(--g);font-size:12px}.fbx-chip.on{background:var(--k);color:#fff;border-color:var(--k)}.fbx-chip.on small{color:#C7C9CF}.fbx-chip .sw{width:10px;height:10px;border-radius:50%}",
      ".fbx-tk{display:flex;flex-direction:column;gap:8px;margin-top:12px}.fbx-tkr{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr auto;gap:8px}@media(max-width:700px){.fbx-tkr{grid-template-columns:1fr 1fr}}.fbx input,.fbx select,.fbx textarea{border:1px solid #E2E4E8!important;background:#fff!important;color:var(--k)!important;border-radius:12px!important;padding:10px 12px!important;font:500 14px Inter,sans-serif!important;width:100%;margin:0!important;box-shadow:none!important}.fbx input:focus,.fbx select:focus,.fbx textarea:focus{outline:2px solid var(--bl)!important;outline-offset:1px}",
      ".fbx-x{border:0;background:#F4F5F7;color:var(--g);width:38px;height:38px;border-radius:50%;cursor:pointer}.fbx-x:hover{background:#FDE8E8;color:#C2364A}.fbx-up{cursor:pointer}.fbx-paste{margin-top:10px!important;resize:vertical}.fbx code{background:#F4F5F7;padding:1px 6px;border-radius:6px;font-size:13px}",
      ".fbx-clear{display:grid;grid-template-columns:minmax(300px,.9fr) 1.3fr;gap:28px;margin-top:26px;align-items:start}@media(max-width:1000px){.fbx-clear{grid-template-columns:1fr}}.fbx-ctrl h3{font:700 15px Inter,sans-serif;margin:22px 0 10px}.fbx-ctrl h3:first-child{margin-top:0}.fbx-ctrl h3 small{font-weight:500;color:var(--g);font-size:12.5px;margin-left:6px}",
      ".fbx-prev{position:sticky;top:80px;display:flex;flex-direction:column;gap:14px}.fbx-prevcard{border-radius:22px;padding:18px;background:#fff;border:1px solid var(--h);box-shadow:0 24px 50px rgba(0,0,0,.08)}.fbx-tg{display:flex!important;flex-direction:row!important;align-items:center;gap:8px;margin-top:12px;font-size:14px;cursor:pointer}.fbx-tg input{width:auto!important}",
      ".fbx-price{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.fbx-plan{position:relative;text-align:left;border:1.5px solid #E2E4E8;background:#fff;border-radius:24px;padding:24px;cursor:pointer;font:inherit;color:var(--k);transition:all .15s}.fbx-plan.on{border-color:var(--k);box-shadow:0 0 0 3px rgba(11,11,12,.08)}.fbx-plan em{position:absolute;top:18px;right:18px;font-style:normal;font-size:11px;font-weight:700;color:var(--gold);background:#F6F2EA;padding:4px 10px;border-radius:999px}.fbx-plan>b{font:700 22px Fraunces,serif;display:block}.fbx-amt{display:block;font:700 46px Fraunces,serif;margin:6px 0 10px}.fbx-amt small{font:500 15px Inter,sans-serif;color:var(--g)}.fbx-plan ul{margin:0;padding-left:18px;color:#3D4048;font-size:14px;line-height:1.75}",
      ".fbx-seg{display:inline-flex;background:#F2F3F5;border-radius:999px;padding:4px;gap:2px;margin-bottom:14px;flex-wrap:wrap}.fbx-seg button{border:0;background:none;color:var(--g);font:600 14px Inter,sans-serif;padding:9px 18px;border-radius:999px;cursor:pointer}.fbx-seg .on{background:#fff;color:var(--k);box-shadow:0 1px 4px rgba(0,0,0,.1)}",
      ".fbx-sub{padding:24px;border-radius:24px;background:#FAFAFB;border:1px solid var(--h);max-width:640px}.fbx-sub p{margin-top:4px!important}",
      ".fbx-total{margin-top:18px;display:flex;gap:24px;flex-wrap:wrap;align-items:center;padding:22px;border-radius:24px;background:#0B0B0C;color:#fff}.fbx-total>div:not(.fbx-cta){min-width:130px}.fbx-total small{color:#9A9DA4;font-size:12px;display:block}.fbx-total b{font:700 30px Fraunces,serif;color:#fff;display:block}.fbx-total span{color:#C7C9CF;font-size:12px}.fbx-total .fbx-cta{margin-left:auto}.fbx-total .fbx-cta input{min-width:220px;width:auto!important}.fbx-total .fbx-btn{background:#fff;color:#0B0B0C;border-color:#fff}.fbx-total .fbx-mut{color:#9A9DA4;flex-basis:100%}",
      ".fbx-math{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin:4px 0 12px}.fbx-math>div:not(.op){padding:18px 22px;border-radius:20px;background:#F6F2EA;min-width:180px}.fbx-math b{display:block;font:700 34px Fraunces,serif;color:#7A5B2A}.fbx-math span{font-size:13px;color:#7A6A50}.fbx-math .op{font:700 28px Fraunces,serif;color:#C7B79A}",
      ".fbx-ibar{display:flex;align-items:center;gap:14px;margin:18px 0}.fbx-prog{flex:1;max-width:520px;height:10px;border-radius:99px;background:#F2F3F5;overflow:hidden}.fbx-prog i{display:block;height:100%;background:linear-gradient(90deg,#16A34A,#4ADE80);transition:width .4s}.fbx-ibar span{color:var(--g);font-size:13px}",
      ".fbx-iadd{display:grid;grid-template-columns:200px 1fr auto;gap:8px;margin-bottom:16px;max-width:900px}@media(max-width:640px){.fbx-iadd{grid-template-columns:1fr}}",
      ".fbx-icat{margin-top:18px}.fbx-icat h3{font:700 13px Inter,sans-serif!important;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)!important;margin-bottom:8px!important}",
      ".fbx-idea{display:grid;grid-template-columns:auto 1fr auto auto;gap:12px;align-items:center;padding:12px 14px;border-radius:16px;border:1px solid var(--h);margin-bottom:8px;background:#fff;transition:all .2s}.fbx-idea:hover{box-shadow:0 8px 20px rgba(0,0,0,.05)}",
      ".fbx-ick{width:26px;height:26px;border-radius:8px;border:2px solid #C9CDD3;background:#fff;color:#fff;font-weight:800;cursor:pointer;display:grid;place-items:center}.s-done .fbx-ick{background:#16A34A;border-color:#16A34A}.s-done .fbx-itx span{color:var(--g)}",
      ".fbx-itx span{font-size:15px;line-height:1.4}.s-cut{background:#FBFBFC}.s-cut .fbx-itx span{text-decoration:line-through;text-decoration-color:#DC2626;text-decoration-thickness:2px;color:#9AA0A8}.fbx-why{margin-top:6px!important;font-size:13px!important;background:#FFF7F7!important;border-color:#F5D0D0!important}",
      ".fbx-icut{border:1px solid #E2E4E8;background:#fff;color:var(--g);border-radius:999px;padding:6px 12px;font:600 12px Inter,sans-serif;cursor:pointer;white-space:nowrap}.fbx-icut:hover{color:#C2364A;border-color:#F5C2C2}.s-cut .fbx-icut{color:#16A34A}",
      ".fbx-nav{display:flex;justify-content:space-between;gap:10px;padding:30px 0 10px;border-top:1px solid var(--h);margin-top:30px}.fbx-legal{color:#9AA0A8;font-size:12px;text-align:center;margin-top:10px!important}",
      "@media(prefers-reduced-motion:reduce){.fbx-stage,.fbx-ace,.fbx-gloss,.fbx-sheet{animation:none!important}}"
    ].join("");
    document.head.appendChild(s);
  }

  var wired = false;
  window.FbSite = {
    pages: PAGES,
    mount: async function (el, page) {
      host = el; css();
      if (!wired) { wired = true; document.addEventListener("click", function (e) { if (host && host.contains(e.target)) onClick(e); }); document.addEventListener("input", onInput); document.addEventListener("change", onChange); document.addEventListener("submit", onSubmit); document.addEventListener("keydown", onKey); }
      if (page) cur = page;
      if (!loaded) { el.innerHTML = '<div class="fbx"><p style="padding:40px 0;color:#6B6F76">Loading…</p></div>'; await load(); }
      render();
    }
  };
})();
