/* Flipbook — the product site inside Revatour.
   Clean white click-through pages: Overview, Example book, Build your book, Clear page, Pricing, Goals, Ideas.
   Drafts, strategies, goals and ideas save privately to the signed-in user's account (docs flipbook/draft, flipbook/ideas). */
(function () {
  "use strict";
  var PAGES = [
    ["home", "Overview", "navfbhome"],
    ["example", "Example book", "navfbex"],
    ["build", "Build your book", "navfbbuild"],
    ["clear", "Clear page", "navfbclear"],
    ["pricing", "Pricing", "navfbprice"],
    ["goals", "Goals", "navfbgoals"],
    ["ideas", "Ideas checklist", "navfbideas"]
  ];
  var host = null, cur = "home", D = null, I = null, loaded = false, flipAt = 0, ideaF = "all", indCat = "pop", indQ = "", tool = "", dcol = "#2F6FE4", G = null, drag = null, REAL = null, REALKEY = "";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(m) { try { if (window.toast) window.toast(m); } catch (e) {} }
  function db() { try { return window.store && window.store.db; } catch (e) { return null; } }
  function pad2(n) { return ("0" + n).slice(-2); }
  function iso(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function todayISO() { return iso(new Date()); }
  function pd(s) { var p = String(s || "").split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function money(v) { return v == null || !isFinite(v) ? "" : "$" + (+v).toLocaleString(undefined, { minimumFractionDigits: v < 10 ? 2 : 2, maximumFractionDigits: 2 }); }
  function hash(str) { var h = 7; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 2147483647; return h || 7; }
  var DN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtClock(m) { var h = Math.floor(m / 60), mm = m % 60; return ((h % 12) || 12) + ":" + pad2(mm) + (h < 12 ? "am" : "pm"); }

  /* ---------- data ---------- */
  function lastTradingDay() { var d = new Date(); if (d.getHours() < 16) d.setDate(d.getDate() - 1); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1); return iso(d); }
  function defDraft() {
    var ld = lastTradingDay();
    return { style: "trading", asset: "stocks", range: "rth", cFrom: ld + "T09:30", cTo: ld + "T16:00", cExt: false, iRange: "1y", iFrom: "", iTo: "",
      tickers: [{ id: uid(), t: "NVDA", from: ld, to: "", asset: "stocks" }],
      marks: { entry: true, target: true, exit: true, stop: true, partial: true, notes: true },
      execs: [], stop: "", targets: [""], note: "",
      ind: ["vwap", "ema9", "pm"], cma: [], fib: [0.382, 0.5, 0.618], draw: [], strats: [], strat: { name: "", entry: "", exit: "", risk: "" },
      spy: "1y", spyFrom: "", spyTo: "", spyMarks: true, icol: {}, zlen: "fill", rr: false, rrEntry: "",
      tier: "pro", cadence: "monthly", email: "",
      goals: { rev: 50000000, price: 29, book: 129, cost: { page: 0.9, film: 0.4, ship: 5, binder: 22 }, perMonth: 14, ms: {} } };
  }
  var SEED = [
    ["Product", "Ring binder that grows: starts slim, holds hundreds of pages, add volumes anytime"],
    ["Product", "Clear acetate overlay for every chart page: entries, stops, targets, exits"],
    ["Product", "Two books: Trading (up to 4 weeks) and Investing (1 month and up)"],
    ["Product", "Monthly report card page: win rate, best and worst trade, P&L curve"],
    ["Product", "SPY context page: what the market did around your trades"],
    ["Product", "Personal cover and numbered spine: name, year, volume"],
    ["Pages", "Pre-market + after-hours shading on intraday pages"],
    ["Pages", "Custom time frame per page, from 1-minute to weekly candles"],
    ["Pages", "ICT / smart-money layers: FVG, IFVG, order blocks, liquidity"],
    ["Pages", "Notes margin printed with the trader's own notes and strategy"],
    ["Pages", "QR code on each page that opens the live chart on Revatour"],
    ["Pages", "Year-end 'best trades' highlight spread"],
    ["Growth", "Drop the link in trading Discords and X threads (traders first)"],
    ["Growth", "Free sample page: upload one trade, get a PDF of the page"],
    ["Growth", "Prop-firm angle: 'frame your funded payout' page"],
    ["Growth", "Referral: give a month, get a month"],
    ["Growth", "Unboxing videos from traders with a following"],
    ["Pricing", "Book one-time + page subscription (weekly / monthly / quarterly)"],
    ["Pricing", "Gift version: 'a year of trades' boxed set"],
    ["Pricing", "Team / trading-room bulk pricing"],
    ["Tech", "Pull fills + real candles from Schwab, then other brokers"],
    ["Tech", "Print partner with on-demand binding and acetate printing"],
    ["Tech", "Digital flipbook for people who don't want paper"],
    ["Brand", "Name: Flipbook — 'Your trades, bound.'"],
    ["Brand", "Every page says 'For education and memories, not investment advice'"]
  ];
  function defIdeas() { return { items: SEED.map(function (x) { return { id: uid(), c: x[0], t: x[1], s: "open", why: "" }; }) }; }
  async function load() {
    if (loaded) return; loaded = true;
    try {
      var s = db(), a = null, b = null;
      if (s) { var r1 = await s.doc("flipbook/draft").get(), r2 = await s.doc("flipbook/ideas").get(); a = r1 && r1.exists ? r1.data() : null; b = r2 && r2.exists ? r2.data() : null; }
      else { a = JSON.parse(localStorage.getItem("fb-draft") || "null"); b = JSON.parse(localStorage.getItem("fb-ideas") || "null"); }
      var d0 = defDraft(); D = Object.assign(d0, a || {}); D.goals = Object.assign(d0.goals, (a && a.goals) || {}); D.goals.cost = Object.assign(defDraft().goals.cost, D.goals.cost || {}); D.goals.ms = D.goals.ms || {};
      D.marks = Object.assign(d0.marks, (a && a.marks) || {}); ["execs", "draw", "strats", "cma", "targets"].forEach(function (k) { if (!Array.isArray(D[k])) D[k] = d0[k]; });
      if (["classic", "signature"].indexOf(D.tier) >= 0) D.tier = D.tier === "classic" ? "starter" : "pro";
      I = b && b.items ? b : defIdeas();
    } catch (e) { D = defDraft(); I = defIdeas(); }
  }
  var svT = 0;
  function saveD() { clearTimeout(svT); svT = setTimeout(function () { var s = db(); try { if (s) s.doc("flipbook/draft").set(Object.assign({}, D, { updated: Date.now() })); else localStorage.setItem("fb-draft", JSON.stringify(D)); } catch (e) {} }, 400); }
  function saveI() { var s = db(); try { if (s) s.doc("flipbook/ideas").set({ items: I.items, updated: Date.now() }); else localStorage.setItem("fb-ideas", JSON.stringify(I)); } catch (e) { toast("Could not save"); } }

  /* ---------- time frames ---------- */
  function tdaysFrom(start, end) { var out = [], d = pd(start), e = pd(end); for (var i = 0; i < 2000 && d <= e; i++) { if (d.getDay() > 0 && d.getDay() < 6) out.push(iso(d)); d.setDate(d.getDate() + 1); } return out; }
  function tdaysN(start, n) { var out = [], d = pd(start); while (out.length < n) { if (d.getDay() > 0 && d.getDay() < 6) out.push(iso(d)); d.setDate(d.getDate() + 1); } return out; }
  function backDays(endIso, n) { var out = [], d = pd(endIso); while (out.length < n) { if (d.getDay() > 0 && d.getDay() < 6) out.unshift(iso(d)); d.setDate(d.getDate() - 1); } return out; }
  function fwdDays(day, n) { var d = tdaysN(day, n), l = lastTradingDay(); return d[d.length - 1] > l ? backDays(l, n) : d; }
  function tkr() { var t = (D.tickers || []).filter(function (x) { return x.t; })[0]; return t || { t: "NVDA", from: lastTradingDay() }; }
  function baseDay() { var f = tkr().from || lastTradingDay(), d = pd(f); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1); return iso(d); }
  var STEPS = [1, 2, 3, 5, 10, 15, 30, 60, 120, 240], CSZ = [["auto", "Auto"], [1, "1m"], [2, "2m"], [3, "3m"], [5, "5m"], [10, "10m"], [15, "15m"], [30, "30m"], [60, "1h"], [120, "2h"], [240, "4h"], ["D", "Daily"]];
  function frame() {
    var F = { times: [], intra: true, step: 5, days: [], label: "", long: false, ext: false };
    var addDay = function (day, a, b, st) { var d = pd(day); for (var m = a; m < b; m += st) F.times.push(d.getTime() + m * 6e4); };
    if (D.style === "investing") {
      F.intra = false; var end = D.iRange === "custom" && D.iTo ? D.iTo : lastTradingDay(), n = { "1m": 21, "3m": 63, "6m": 126, "1y": 52, "3y": 156, "5y": 260 }[D.iRange] || 126, wk = D.iRange === "1y" || D.iRange === "3y" || D.iRange === "5y";
      if (D.iRange === "custom" && D.iFrom) { var dd = tdaysFrom(D.iFrom, end); wk = dd.length > 150; n = wk ? Math.ceil(dd.length / 5) : dd.length; }
      if (wk) { var e = pd(end); for (var i = n - 1; i >= 0; i--) { var w = new Date(e); w.setDate(e.getDate() - i * 7); F.times.push(w.getTime()); } F.step = "W"; }
      else { backDays(end, Math.max(5, n)).forEach(function (x) { F.times.push(pd(x).getTime()); }); F.step = "D"; }
      F.label = (wk ? "Weekly" : "Daily") + " candles · " + F.times.length + " candles";
      return F;
    }
    var day = baseDay(), r = D.range, wins, auto;
    if (r === "rth") { F.days = [day]; wins = [[day, 570, 960]]; auto = 5; }
    else if (r === "ext") { F.days = [day]; F.ext = true; wins = [[day, 240, 1200]]; auto = 10; }
    else if (r === "multi") { F.days = fwdDays(day, 3); wins = F.days.map(function (x) { return [x, 570, 960]; }); auto = 15; }
    else if (r === "swing") { F.days = fwdDays(day, 15); wins = F.days.map(function (x) { return [x, 570, 960]; }); auto = 60; }
    else {
      var a = String(D.cFrom || day + "T09:30"), b = String(D.cTo || day + "T16:00"); if (b < a) { var t = a; a = b; b = t; }
      var ad = a.slice(0, 10), bd = b.slice(0, 10), am = +a.slice(11, 13) * 60 + +a.slice(14, 16), bm = +b.slice(11, 13) * 60 + +b.slice(14, 16);
      var s0 = D.cExt ? 240 : 570, s1 = D.cExt ? 1200 : 960; F.ext = !!D.cExt || am < 570 || bm > 960;
      F.days = tdaysFrom(ad, bd); if (!F.days.length) F.days = [ad];
      wins = F.days.map(function (x, i) { var lo = i === 0 ? Math.max(Math.min(am, s1), F.ext ? 240 : 0) : s0, hi = i === F.days.length - 1 ? Math.min(Math.max(bm, lo + 1), 1200) : s1; if (F.days.length === 1) { lo = am; hi = Math.max(bm, am + 5); } return [x, lo, hi]; });
    }
    var mins = wins.reduce(function (t, w) { return t + Math.max(0, w[2] - w[1]); }, 0);
    F.long = F.days.length > 20;
    if (!auto) auto = STEPS.filter(function (s) { return mins / s <= 150; })[0] || "D";
    var cs = D.cs && D.cs !== "auto" ? (D.cs === "D" ? "D" : +D.cs) : auto;
    if (F.long && cs !== "D" && mins / cs > 1200) cs = "D";
    if (typeof cs === "number" && mins / cs > 1200) cs = STEPS.filter(function (s) { return mins / s <= 1200; })[0] || "D";
    F.auto = auto; F.cs = cs;
    if (cs === "D") { F.intra = false; F.step = "D"; F.days.forEach(function (x) { F.times.push(pd(x).getTime()); }); }
    else { F.step = cs; wins.forEach(function (w) { addDay(w[0], w[1], w[2], cs); }); }
    F.pages = Math.max(1, Math.ceil(F.times.length / 160));
    var a0 = new Date(F.times[0]), b0 = new Date(F.times[F.times.length - 1] + (typeof F.step === "number" ? F.step * 6e4 : 0));
    F.label = (F.intra ? (F.days.length > 1 ? F.days.length + " trading days · " : "") + fmtStep(F.step) + " candles · " + fmtClock(a0.getHours() * 60 + a0.getMinutes()) + " – " + fmtClock(b0.getHours() * 60 + b0.getMinutes()) : "Daily candles") + " · " + F.times.length + " candles";
    return F;
  }
  function fmtStep(s) { return s === "D" ? "Daily" : s === "W" ? "Weekly" : s >= 60 ? (s / 60) + "-hour" : s + "-min"; }
  function frameRange(F) { var a = new Date(F.times[0]), b = new Date(F.times[F.times.length - 1]); var same = iso(a) === iso(b); return same ? DN[a.getDay()] + " " + MN[a.getMonth()] + " " + a.getDate() + ", " + a.getFullYear() : MN[a.getMonth()] + " " + a.getDate() + " – " + MN[b.getMonth()] + " " + b.getDate() + ", " + b.getFullYear(); }

  /* ---------- candles: real (Schwab) or sample ---------- */
  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function sample(F, sym, base) {
    var r = rng(hash(sym + F.times[0] + F.times.length)), p = base || (40 + hash(sym) % 400), vol = F.intra ? 0.0035 * Math.sqrt(typeof F.step === "number" ? F.step / 5 : 1) : 0.014, out = [];
    F.times.forEach(function (t, i) { var o = p, c = o * (1 + (r() - 0.48) * vol * 2), h = Math.max(o, c) * (1 + r() * vol * 0.7), l = Math.min(o, c) * (1 - r() * vol * 0.7); out.push({ t: t, o: o, h: h, l: l, c: c, v: (0.4 + r()) * (F.intra && i < F.times.length * 0.12 ? 1.8 : 1) }); p = c; });
    return out;
  }
  /* real candles (Yahoo Finance via /api/candles), cached per symbol + frame */
  var RC = {};
  function ySym(sym, asset) {
    var s = String(sym || "").toUpperCase().replace(/^\$/, "").replace(/^\//, "");
    var IDX = { SPX: "^GSPC", NDX: "^NDX", DJI: "^DJI", VIX: "^VIX", RUT: "^RUT" }; if (IDX[s]) return IDX[s];
    if (asset === "futures" && !/[=]/.test(s)) return s.replace(/[A-Z]\d{1,2}$/, "") + "=F";
    if (asset === "crypto" && !/-/.test(s)) return s.replace(/USDT?$/, "") + "-USD";
    if (asset === "forex" && !/=/.test(s)) return s.replace("/", "") + "=X";
    return s;
  }
  function stepMsOf(F) { return typeof F.step === "number" ? F.step * 6e4 : F.step === "W" ? 7 * 864e5 : 864e5; }
  function pickIv(F) {
    var age = (Date.now() - F.times[0]) / 864e5, st = F.step, iv, note = "";
    if (st === "D") iv = "1d"; else if (st === "W") iv = "1wk";
    else iv = { 1: "1m", 2: "2m", 3: "1m", 5: "5m", 10: "5m", 15: "15m", 30: "30m", 60: "60m", 120: "60m", 240: "60m" }[st] || "5m";
    if (iv === "1m" && age > 29) { iv = "5m"; note = "1-minute history only goes back 30 days"; }
    if (/^(1m|2m|5m|15m|30m)$/.test(iv) && age > 59) { iv = "60m"; note = "Minute history only goes back 60 days"; }
    if (iv === "60m" && age > 720) { iv = "1d"; note = "Hourly history only goes back 2 years"; }
    return [iv, note];
  }
  function realKey(F, sym) { return sym + "|" + F.times[0] + "|" + F.times.length + "|" + F.step + "|" + (F.ext ? 1 : 0); }
  function fetchReal(F, sym, asset, key) {
    var So = window.stockspotSocial; if (!So || !So.candles) { RC[key] = { st: "err", msg: "Sign in to load real candles" }; return; }
    var pk = pickIv(F), stepMs = stepMsOf(F), end = Math.min(Date.now(), F.times[F.times.length - 1] + stepMs);
    RC[key] = { st: "loading" };
    So.candles({ symbol: ySym(sym, asset), interval: pk[0], start: String(F.times[0] - (typeof F.step === "number" ? 0 : stepMs)), end: String(end + 60e3), ext: F.ext ? "1" : "0" }).then(function (r) {
      var got = (r && r.candles) || [];
      if (!got.length) { RC[key] = { st: "err", msg: r && r.error ? r.error : "No real candles for $" + sym + " in this time frame (market closed?)" }; return done(); }
      var out = [];
      if (typeof F.step !== "number") { out = got.filter(function (k) { return k.t >= F.times[0] - stepMs && k.t <= end; }); }
      else {
        var B = [], j = 0;
        got.forEach(function (k) { while (j < F.times.length - 1 && k.t >= F.times[j + 1]) j++; if (k.t < F.times[0] || k.t >= F.times[j] + stepMs) return; var b = B[j]; if (!b) B[j] = { t: F.times[j], o: k.o, h: k.h, l: k.l, c: k.c, v: k.v }; else { b.h = Math.max(b.h, k.h); b.l = Math.min(b.l, k.l); b.c = k.c; b.v += k.v; } });
        out = B.filter(Boolean);
      }
      if (out.length < 3) { RC[key] = { st: "err", msg: "Not enough real candles for $" + sym + " in this time frame" }; return done(); }
      var mx = Math.max.apply(null, out.map(function (b) { return b.v; })) || 1; out.forEach(function (b) { b.v = b.v / mx * 1.6 + 0.05; });
      RC[key] = { st: "ok", C: out, src: r.source || "market data", note: pk[1], name: r.name || "" }; done();
    }).catch(function () { RC[key] = { st: "err", msg: "Could not load real candles. Try again." }; done(); });
    function done() { if (host && !host.hidden && (cur === "build" || cur === "clear")) render(); }
  }
  function getCandles(F) {
    var sym = tkr().t || "NVDA", key = sym + "|" + F.times[0] + "|" + F.times.length + "|" + F.step;
    if (REAL && REALKEY === key && REAL.length > 5) return { C: REAL, real: true, F: F, src: "Schwab" };
    var rk = realKey(F, sym), R0 = RC[rk];
    if (!R0) { fetchReal(F, sym, (tkr().asset || D.asset), rk); R0 = RC[rk]; }
    if (R0 && R0.st === "ok") { var F2 = Object.assign({}, F, { times: R0.C.map(function (c) { return c.t; }) }); return { C: R0.C, real: true, F: F2, src: R0.src, note: R0.note }; }
    var px = execList().map(function (e) { return +e.price; }).filter(function (x) { return x > 0; });
    var base = px.length ? px.reduce(function (a, b) { return a + b; }, 0) / px.length : null;
    return { C: fitToExecs(sample(F, sym, base), F), real: false, F: F, loading: R0 && R0.st === "loading", msg: R0 && R0.msg };
  }
  function execList() { return (D.execs || []).filter(function (e) { return +e.price > 0; }); }

  function fitToExecs(C, F) {
    var ex = execList(); if (!ex.length) return C;
    var pts = ex.map(function (e) { return [idxAt(F, e.time), +e.price]; }).filter(function (p) { return p[0] != null; }).sort(function (a, b) { return a[0] - b[0]; });
    if (!pts.length) return C;
    var off = pts.map(function (p) { return [p[0], p[1] - C[p[0]].c]; });
    return C.map(function (c, i) {
      var d; if (i <= off[0][0]) d = off[0][1]; else if (i >= off[off.length - 1][0]) d = off[off.length - 1][1];
      else { for (var k = 0; k < off.length - 1; k++) if (i >= off[k][0] && i <= off[k + 1][0]) { var f = (i - off[k][0]) / Math.max(1, off[k + 1][0] - off[k][0]); d = off[k][1] + (off[k + 1][1] - off[k][1]) * f; break; } }
      return { t: c.t, o: c.o + d, h: c.h + d, l: c.l + d, c: c.c + d, v: c.v };
    });
  }
  function idxAt(F, time) {
    if (!time) return null; var ms = new Date(time).getTime(); if (!isFinite(ms)) return null;
    var best = null; for (var i = 0; i < F.times.length; i++) { if (F.times[i] <= ms) best = i; else break; }
    if (best == null) return ms < F.times[0] && F.times[0] - ms < 864e5 ? 0 : null;
    var stepMs = typeof F.step === "number" ? F.step * 6e4 : F.step === "W" ? 7 * 864e5 : 864e5;
    return ms - F.times[best] > stepMs * 3 && best === F.times.length - 1 ? null : best;
  }

  /* ---------- indicator catalog ---------- */
  // [id, name, category, kind, color, assets ("" = all), extra]
  var CATS = [["pop", "&#11088; Popular"], ["trend", "Moving averages"], ["vwap", "VWAP & volume"], ["lvl", "Key levels"], ["smart", "ICT / smart money"], ["sd", "Supply & demand"], ["fib", "Fibonacci"], ["band", "Bands & channels"], ["mom", "Momentum (lower panel)"], ["fut", "Futures"], ["opt", "Options"], ["fx", "Crypto & forex"], ["inv", "Investing"]];
  var IND = [
    ["ema9", "EMA 9", "trend", "ma", "#E0662B", "", { t: "ema", n: 9 }], ["ema21", "EMA 21", "trend", "ma", "#C2364A", "", { t: "ema", n: 21 }], ["ema50", "EMA 50", "trend", "ma", "#8B1E3F", "", { t: "ema", n: 50 }], ["ema200", "EMA 200", "trend", "ma", "#3B0A1E", "", { t: "ema", n: 200 }],
    ["sma9", "SMA 9", "trend", "ma", "#0F8A8A", "", { t: "sma", n: 9 }], ["sma20", "SMA 20", "trend", "ma", "#2F6FE4", "", { t: "sma", n: 20 }], ["sma50", "SMA 50", "trend", "ma", "#1B3A8A", "", { t: "sma", n: 50 }], ["sma200", "SMA 200", "trend", "ma", "#111111", "", { t: "sma", n: 200 }],
    ["wma20", "WMA 20", "trend", "ma", "#7C4DCC", "", { t: "wma", n: 20 }], ["hma21", "Hull MA 21", "trend", "ma", "#D946EF", "", { t: "hma", n: 21 }], ["tema20", "TEMA 20", "trend", "ma", "#0EA5E9", "", { t: "tema", n: 20 }],
    ["st", "Supertrend", "trend", "st", "#16A34A", ""], ["psar", "Parabolic SAR", "trend", "psar", "#F59E0B", ""], ["ichi", "Ichimoku cloud", "trend", "ichi", "#64748B", ""],
    ["vwap", "VWAP", "vwap", "vwap", "#7C4DCC", ""], ["vwapb", "VWAP bands (±1, ±2)", "vwap", "vwapb", "#A47BEA", ""], ["avwap", "Anchored VWAP (from entry)", "vwap", "avwap", "#C084FC", ""],
    ["vol", "Volume bars", "vwap", "vol", "#B9BFCB", ""], ["vp", "Volume profile (POC, VAH, VAL)", "vwap", "vp", "#94A3B8", ""], ["rvol", "Relative volume (RVOL)", "vwap", "osc", "#0EA5E9", ""], ["cvd", "Cumulative delta", "vwap", "osc", "#14B8A6", ""], ["obv", "On-balance volume", "vwap", "osc", "#475569", ""],
    ["pm", "Pre-market high / low", "lvl", "lvl", "#D4A017", ""], ["pd", "Prior day high / low / close", "lvl", "lvl", "#5B6472", ""], ["hodlod", "High / low of day", "lvl", "lvl", "#0B0B0C", ""], ["or5", "Opening range 5 min", "lvl", "or", "#17845B", "", { m: 5 }], ["or15", "Opening range 15 min", "lvl", "or", "#15803D", "", { m: 15 }], ["or30", "Opening range 30 min", "lvl", "or", "#166534", "", { m: 30 }],
    ["pw", "Prior week high / low", "lvl", "lvl", "#6B7280", ""], ["dopen", "Daily open", "lvl", "lvl", "#2563EB", ""], ["wopen", "Weekly / monthly open", "lvl", "lvl", "#1D4ED8", ""], ["round", "Round numbers ($1 / $5 / $10)", "lvl", "lvl", "#9CA3AF", ""],
    ["piv", "Pivot points (P, R1-R2, S1-S2)", "lvl", "lvl", "#B45309", ""], ["cam", "Camarilla pivots", "lvl", "lvl", "#92400E", ""], ["gap", "Gap + half-gap fill", "lvl", "lvl", "#DB2777", ""], ["sr", "Support / resistance (auto)", "lvl", "lvl", "#334155", ""], ["tl", "Trendlines (auto)", "lvl", "tl", "#1E293B", ""],
    ["fvg", "Fair value gaps (FVG)", "smart", "zone", "#3B82F6", ""], ["ifvg", "Inverse FVG (IFVG)", "smart", "zone", "#F97316", ""], ["ob", "Order blocks", "smart", "zone", "#8B5CF6", ""], ["brk", "Breaker blocks", "smart", "zone", "#EC4899", ""],
    ["liq", "Liquidity pools (BSL / SSL)", "smart", "liq", "#0EA5E9", ""], ["bos", "Market structure (BOS / CHoCH)", "smart", "bos", "#0B0B0C", ""], ["sweep", "Liquidity sweeps", "smart", "sweep", "#DC2626", ""],
    ["pdz", "Premium / discount (50%)", "smart", "zone", "#6366F1", ""], ["ote", "OTE zone (62–79%)", "smart", "zone", "#B08D57", ""], ["kz", "Kill zones (London / NY)", "smart", "time", "#F43F5E", ""], ["sb", "Silver bullet (10–11am)", "smart", "time", "#A855F7", ""],
    ["sup", "Supply zones", "sd", "zone", "#DC2626", ""], ["dem", "Demand zones", "sd", "zone", "#16A34A", ""], ["flip", "Flip zones (S/R flip)", "sd", "zone", "#F59E0B", ""], ["wyck", "Wyckoff range", "sd", "zone", "#64748B", ""],
    ["fibr", "Fibonacci retracement", "fib", "fib", "#B08D57", ""], ["fibx", "Fibonacci extensions", "fib", "fibx", "#A16207", ""],
    ["boll", "Bollinger Bands", "band", "band", "#8A93A3", "", { t: "boll" }], ["kelt", "Keltner channel", "band", "band", "#0F766E", "", { t: "kelt" }], ["donch", "Donchian channel", "band", "band", "#7C3AED", "", { t: "donch" }], ["atrb", "ATR bands", "band", "band", "#EA580C", "", { t: "atr" }], ["lr", "Linear regression channel", "band", "lr", "#2563EB", ""],
    ["rsi", "RSI", "mom", "osc", "#6366F1", ""], ["macd", "MACD", "mom", "osc", "#EC4899", ""], ["stoch", "Stochastic", "mom", "osc", "#10B981", ""], ["srsi", "Stochastic RSI", "mom", "osc", "#14B8A6", ""], ["adx", "ADX / DMI", "mom", "osc", "#F59E0B", ""],
    ["cci", "CCI", "mom", "osc", "#8B5CF6", ""], ["wr", "Williams %R", "mom", "osc", "#0EA5E9", ""], ["mfi", "Money flow index", "mom", "osc", "#22C55E", ""], ["roc", "Rate of change", "mom", "osc", "#E11D48", ""], ["atr", "ATR", "mom", "osc", "#EA580C", ""], ["sqz", "TTM squeeze", "mom", "osc", "#DC2626", ""],
    ["on", "Overnight (Globex) high / low", "fut", "lvl", "#7C3AED", "futures"], ["ib", "Initial balance (first hour)", "fut", "lvl", "#0F766E", "futures"], ["svwap", "Session VWAP", "fut", "vwap", "#9333EA", "futures"], ["tpo", "Market profile (TPO)", "fut", "vp", "#64748B", "futures"], ["sett", "Settlement price", "fut", "lvl", "#475569", "futures"],
    ["em", "Expected move", "opt", "lvl", "#0EA5E9", "options"], ["walls", "Call wall / put wall (GEX)", "opt", "lvl", "#DC2626", "options"], ["mp", "Max pain", "opt", "lvl", "#7C3AED", "options"], ["strike", "My strike price", "opt", "lvl", "#111111", "options"], ["be", "Break-even at expiration", "opt", "lvl", "#16A34A", "options"],
    ["sess", "Session opens (Asia / London / NY)", "fx", "lvl", "#0891B2", "crypto,forex"], ["fund", "Funding rate (lower panel)", "fx", "osc", "#F59E0B", "crypto"], ["asr", "Asia session range", "fx", "time", "#06B6D4", "crypto,forex"],
    ["w52", "52-week high / low", "inv", "lvl", "#0B0B0C", ""], ["gx", "Golden / death cross", "inv", "gx", "#D4A017", ""], ["earn", "Earnings dates", "inv", "mark", "#2563EB", ""], ["div", "Dividends", "inv", "mark", "#16A34A", ""], ["cost", "My cost basis", "inv", "lvl", "#B08D57", ""]
  ];
  var POP = ["vwap", "ema9", "ema21", "sma200", "pm", "pd", "hodlod", "or15", "fvg", "ifvg", "ob", "liq", "bos", "sup", "dem", "fibr", "vp", "rsi", "macd", "boll"];
  var PRESETS = [
    ["clean", "&#10024; Clean & simple", ["vwap", "ema9"]],
    ["scalp", "&#9889; Momentum scalper", ["vwap", "ema9", "ema21", "pm", "hodlod", "rvol"]],
    ["ict", "&#127919; ICT / smart money", ["fvg", "ifvg", "ob", "liq", "bos", "kz", "ote"]],
    ["sd", "&#129521; Supply & demand", ["sup", "dem", "flip", "vp"]],
    ["orb", "&#128640; Opening range breakout", ["or15", "vwap", "pd", "pm"]],
    ["fib", "&#127744; Fibonacci swing", ["fibr", "fibx", "ema21"]],
    ["trend", "&#128200; Trend follower", ["ema21", "sma50", "st", "adx"]],
    ["fut", "&#128202; Futures pro", ["svwap", "on", "ib", "vp", "pd"]],
    ["opt", "&#127922; Options trader", ["em", "walls", "mp", "strike", "vwap"]],
    ["inv", "&#127793; Long-term investor", ["sma50", "sma200", "w52", "earn", "cost"]]
  ];
  function indDef0(id) { if (/^cma:/.test(id)) { var p = id.split(":"); return [id, p[1].toUpperCase() + " " + p[2], "trend", "ma", p[3] || "#111", "", { t: p[1], n: +p[2] }]; } return IND.filter(function (x) { return x[0] === id; })[0]; }
  function indDef(id) { var d = indDef0(id); if (d && D && D.icol && D.icol[id]) { d = d.slice(); d[4] = D.icol[id]; } return d; }
  function ucol(k, def) { return (D && D.icol && D.icol[k]) || def; }
  function fitsAsset(x) { return !x[5] || x[5].split(",").indexOf(D.asset) >= 0; }

  /* ---------- math ---------- */
  function sma(a, n) { return a.map(function (_, i) { if (i < n - 1) return null; var s = 0; for (var j = i - n + 1; j <= i; j++) s += a[j]; return s / n; }); }
  function emaA(a, n) { var k = 2 / (n + 1), e = null; return a.map(function (v) { if (v == null) return null; e = e == null ? v : v * k + e * (1 - k); return e; }); }
  function wma(a, n) { return a.map(function (_, i) { if (i < n - 1) return null; var s = 0, w = 0; for (var j = 0; j < n; j++) { s += a[i - j] * (n - j); w += n - j; } return s / w; }); }
  function maOf(C, t, n) {
    var a = C.map(function (c) { return c.c; }); n = Math.max(2, Math.min(n, C.length - 1));
    if (t === "sma") return sma(a, n); if (t === "wma") return wma(a, n);
    if (t === "hma") { var h = Math.max(2, Math.round(n / 2)), w1 = wma(a, h), w2 = wma(a, n), d = a.map(function (_, i) { return w1[i] == null || w2[i] == null ? null : 2 * w1[i] - w2[i]; }), s = Math.max(2, Math.round(Math.sqrt(n))); var first = d.findIndex(function (x) { return x != null; }), out = wma(d.slice(first), s); return a.map(function (_, i) { return i < first ? null : out[i - first]; }); }
    if (t === "tema" || t === "dema") { var e1 = emaA(a, n), e2 = emaA(e1, n), e3 = emaA(e2, n); return a.map(function (_, i) { return t === "dema" ? 2 * e1[i] - e2[i] : 3 * e1[i] - 3 * e2[i] + e3[i]; }); }
    return emaA(a, n);
  }
  function vwapOf(C, from) { var pv = 0, vv = 0, sq = 0; return C.map(function (c, i) { if (i < (from || 0)) return null; var tp = (c.h + c.l + c.c) / 3; pv += tp * c.v; vv += c.v; var m = pv / vv; sq += c.v * Math.pow(tp - m, 2); return [m, Math.sqrt(sq / vv)]; }); }
  function atrOf(C, n) { var tr = C.map(function (c, i) { var p = i ? C[i - 1].c : c.o; return Math.max(c.h - c.l, Math.abs(c.h - p), Math.abs(c.l - p)); }); return emaA(tr, n || 14); }
  function swings(C, k) { var hi = [], lo = []; k = k || 3; for (var i = k; i < C.length - k; i++) { var H = true, L = true; for (var j = 1; j <= k; j++) { if (C[i - j].h >= C[i].h || C[i + j].h > C[i].h) H = false; if (C[i - j].l <= C[i].l || C[i + j].l < C[i].l) L = false; } if (H) hi.push(i); if (L) lo.push(i); } return { hi: hi, lo: lo }; }
  function rsiOf(C, n) { n = n || 14; var g = 0, l = 0, out = []; C.forEach(function (c, i) { if (!i) { out.push(null); return; } var d = c.c - C[i - 1].c; g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; out.push(i < 3 ? null : 100 - 100 / (1 + g / (l || 1e-9))); }); return out; }
  function stochOf(C, n) { n = n || 14; return C.map(function (c, i) { if (i < 3) return null; var s = C.slice(Math.max(0, i - n + 1), i + 1), h = Math.max.apply(null, s.map(function (x) { return x.h; })), l = Math.min.apply(null, s.map(function (x) { return x.l; })); return (c.c - l) / ((h - l) || 1) * 100; }); }
  function oscSeries(id, C) {
    var cl = C.map(function (c) { return c.c; });
    if (id === "rsi") return { s: [rsiOf(C)], lv: [30, 70], rng: [0, 100] };
    if (id === "stoch") { var k = stochOf(C); return { s: [k, sma(k.map(function (x) { return x == null ? 50 : x; }), 3)], lv: [20, 80], rng: [0, 100] }; }
    if (id === "srsi") { var r = rsiOf(C), o = r.map(function (v, i) { if (v == null || i < 16) return null; var s = r.slice(i - 13, i + 1).filter(function (x) { return x != null; }), h = Math.max.apply(null, s), l = Math.min.apply(null, s); return (v - l) / ((h - l) || 1) * 100; }); return { s: [o], lv: [20, 80], rng: [0, 100] }; }
    if (id === "macd") { var e12 = emaA(cl, 12), e26 = emaA(cl, 26), m = cl.map(function (_, i) { return e12[i] - e26[i]; }), sg = emaA(m, 9); return { s: [m, sg], hist: m.map(function (v, i) { return v - sg[i]; }), lv: [0] }; }
    if (id === "adx") { var a = atrOf(C, 14), o2 = C.map(function (c, i) { return i < 14 ? null : 15 + 25 * Math.abs(Math.sin(i / 9)) + Math.abs(c.c - C[i - 14].c) / (a[i] || 1) * 3; }); return { s: [o2], lv: [25], rng: [0, 70] }; }
    if (id === "cci") { var tp = C.map(function (c) { return (c.h + c.l + c.c) / 3; }), ms = sma(tp, 20); return { s: [tp.map(function (v, i) { if (ms[i] == null) return null; var md = 0; for (var j = i - 19; j <= i; j++) md += Math.abs(tp[j] - ms[i]); return (v - ms[i]) / (0.015 * (md / 20) || 1); })], lv: [-100, 100] }; }
    if (id === "wr") return { s: [stochOf(C).map(function (v) { return v == null ? null : v - 100; })], lv: [-80, -20], rng: [-100, 0] };
    if (id === "mfi") { var r2 = rsiOf(C, 14); return { s: [r2.map(function (v, i) { return v == null ? null : Math.max(0, Math.min(100, v * 0.8 + C[i].v * 12)); })], lv: [20, 80], rng: [0, 100] }; }
    if (id === "roc") return { s: [cl.map(function (v, i) { return i < 10 ? null : (v / cl[i - 10] - 1) * 100; })], lv: [0] };
    if (id === "atr") return { s: [atrOf(C, 14)] };
    if (id === "obv" || id === "cvd") { var t = 0; return { s: [C.map(function (c, i) { t += (i && c.c >= C[i - 1].c ? 1 : -1) * c.v * (id === "cvd" ? (c.c - c.o) / ((c.h - c.l) || 1) : 1); return t; })] }; }
    if (id === "rvol") return { s: [C.map(function (c, i) { return c.v / (C.slice(Math.max(0, i - 20), i + 1).reduce(function (a, x) { return a + x.v; }, 0) / Math.min(i + 1, 21)); })], lv: [1], bars: true };
    if (id === "sqz") return { hist: cl.map(function (v, i) { var e = emaA(cl, 20)[i]; return v - e; }), s: [], lv: [0] };
    if (id === "fund") return { hist: cl.map(function (_, i) { return Math.sin(i / 7) * 0.01 + 0.004; }), s: [], lv: [0] };
    return { s: [cl] };
  }

  /* ---------- the big chart (time axis, indicators, your trade, your drawings) ---------- */
  function rrOut(R) { return R ? '<span class="fbx-rrout"><b>1 : ' + (R.risk > 0 ? (R.rew / R.risk).toFixed(2) : "–") + '</b><small>Risk ' + R.risk.toFixed(2) + ' · Reward ' + R.rew.toFixed(2) + '</small></span>' : '<span class="fbx-rrout" hidden></span>'; }
  function softPreview() {
    var w = host && host.querySelector(".fbx-cwrap"); if (!w || cur !== "clear") return false;
    var CC = getCandles(frame()); w.innerHTML = pageChart({ F: CC.F, C: CC.C, ind: D.ind.filter(function (id) { var d = indDef(id); return d && fitsAsset(d); }), W: 980, H: 380 });
    var o = host.querySelector(".fbx-rrout"); if (o && D.rr) { var tmp = document.createElement("div"); tmp.innerHTML = rrOut(rrVals(0, execList(), CC.F)); o.replaceWith(tmp.firstChild); }
    return true;
  }
  function rrVals(e0, ex, F) {
    var first = (ex || []).filter(function (e) { return +e.price > 0; })[0], entry = +D.rrEntry || (first ? +first.price : e0); if (!(entry > 0)) return null;
    var stop = +D.stop || +(entry * 0.985).toFixed(2), tgt = +((D.targets || [])[0]) || +(entry + 2 * (entry - stop)).toFixed(2), i = first && F ? idxAt(F, first.time) : null;
    return { entry: entry, stop: stop, target: tgt, risk: Math.abs(entry - stop), rew: Math.abs(tgt - entry), i: i != null ? i : Math.floor(((F && F.times.length) || 100) * 0.3) };
  }
  function placeLabels(svg, G2, C) {
    var X = G2.X, Y = G2.Y, n = C.length, bw = Math.max(1, (G2.W - G2.pl - G2.pr) / n), top = G2.pt, bot = G2.pt + G2.mainH, placed = [];
    var hitC = function (x0, x1, y0, y1) { var a = Math.max(0, Math.floor((x0 - G2.pl) / bw) - 1), b = Math.min(n - 1, Math.ceil((x1 - G2.pl) / bw) + 1), mn = Infinity, mx = -Infinity, hit = false; for (var i = a; i <= b; i++) { var cx = X(i); if (cx + bw / 2 < x0 || cx - bw / 2 > x1) continue; var ch = Y(C[i].h), cl = Y(C[i].l); mn = Math.min(mn, ch); mx = Math.max(mx, cl); if (ch < y1 && cl > y0) hit = true; } return { hit: hit, mn: mn, mx: mx }; };
    var hitL = function (b) { return placed.some(function (p) { return b.x0 < p.x1 && b.x1 > p.x0 && b.y0 < p.y1 && b.y1 > p.y0; }); };
    return svg.replace(/<text x="([\d.\-]+)" y="([\d.\-]+)"((?: dy="[\d.\-]+")?)((?: text-anchor="(?:start|middle|end)")?) class="fbx-lab" fill="([^"]+)">([^<]*)<\/text>/g, function (m, xs, ys, dys, anc, col, txt) {
      var x = +xs, y = +ys + (dys ? +dys.replace(/[^\d.\-]/g, "") : 0);
      var pill = /^PILL\|/.test(txt), dotY = 0; if (pill) { var pp = txt.split("|"); dotY = +pp[1]; txt = pp.slice(2).join("|"); }
      if (!pill && (y < top + 2 || y > bot + 2)) return m;
      var len = txt.replace(/&[a-z#0-9]+;/gi, "x").length, w = pill ? len * 5.8 + 12 : len * 5.7 + 4, a = /middle/.test(anc) ? "m" : /end/.test(anc) ? "e" : "s";
      var x0 = a === "s" ? x - 2 : a === "e" ? x - w + 2 : x - w / 2; if (pill) x0 = Math.max(G2.pl + 2, Math.min(G2.W - G2.pr - w - 2, x0)); var x1 = x0 + w, B = function (yy) { return pill ? { x0: x0, x1: x1, y0: yy - 12, y1: yy + 6 } : { x0: x0, x1: x1, y0: yy - 9, y1: yy + 2 }; };
      if (pill) {
        var hp = hitC(x0, x1, top, bot), up = y < dotY, cs = [y].concat(up ? [hp.mn - 9, hp.mx + 18, hp.mn - 28, hp.mx + 38] : [hp.mx + 18, hp.mn - 9, hp.mx + 38, hp.mn - 28]).filter(function (v) { return v > top + 12 && v < bot - 6; });
        var py = null; for (var q = 0; q < cs.length; q++) { var pb = B(cs[q]); if (!hitC(x0, x1, pb.y0, pb.y1).hit && !hitL(pb)) { py = cs[q]; break; } }
        if (py == null) { py = cs[0] != null ? cs[0] : y; for (var z = 0; z < 6 && hitL(B(py)); z++) py += up ? -20 : 20; }
        placed.push(B(py)); var cx = (x0 + x1) / 2, ex2 = py < dotY ? py + 6 : py - 12;
        return '<line x1="' + x.toFixed(1) + '" y1="' + dotY.toFixed(1) + '" x2="' + cx.toFixed(1) + '" y2="' + ex2.toFixed(1) + '" stroke="' + col + '" stroke-width="1.2" stroke-dasharray="2 2" opacity=".8"/><g transform="translate(' + cx.toFixed(1) + ',' + py.toFixed(1) + ')"><rect x="' + (-w / 2).toFixed(1) + '" y="-11" width="' + w.toFixed(1) + '" height="16" rx="8" fill="' + col + '"/><text text-anchor="middle" y="1" class="fbx-tag" fill="#fff">' + txt + '</text></g>';
      }
      var h = hitC(x0, x1, y - 9, y + 2);
      if (!h.hit && !hitL(B(y))) { placed.push(B(y)); return m; }
      var cands = [h.mn - 5, h.mx + 12, h.mn - 18, h.mx + 25].filter(function (v) { return v > top + 9 && v < bot - 1; }).sort(function (p, q) { return Math.abs(p - y) - Math.abs(q - y); });
      var ny = null; for (var k = 0; k < cands.length; k++) { var bb = B(cands[k]); if (!hitC(x0, x1, bb.y0, bb.y1).hit && !hitL(bb)) { ny = cands[k]; break; } }
      if (ny == null) ny = cands[0] != null ? cands[0] : y;
      placed.push(B(ny));
      var lx = (x0 + x1) / 2, ay = y - 4, ly = ny < y ? ny + 3 : ny - 10;
      var lead = Math.abs(ny - y) > 6 ? '<line x1="' + lx.toFixed(1) + '" y1="' + ly.toFixed(1) + '" x2="' + lx.toFixed(1) + '" y2="' + ay.toFixed(1) + '" stroke="' + col + '" stroke-width="1" stroke-dasharray="2 2"/><circle cx="' + lx.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="2.2" fill="' + col + '"/>' : "";
      return lead + '<text x="' + xs + '" y="' + ny.toFixed(1) + '"' + anc + ' class="fbx-lab" fill="' + col + '">' + txt + '</text>';
    });
  }
  function pageChart(o) {
    var F = o.F, C = o.C, n = C.length, W = o.W || 900, ids = (o.ind || []).filter(function (id) { var d = indDef(id); return d && fitsAsset(d); });
    var osc = ids.filter(function (id) { return indDef(id)[3] === "osc"; }).slice(0, 2), hasVol = ids.indexOf("vol") >= 0;
    var pl = 10, pr = 74, pt = 14, mainH = o.H || 380, ph = 78, pb = 26, H = pt + mainH + osc.length * (ph + 8) + pb;
    var ex = execList(), stop = +D.stop || null, tg = (D.targets || []).map(Number).filter(function (x) { return x > 0; });
    var lo = Infinity, hi = -Infinity; C.forEach(function (c) { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); });
    var useDemo = !ex.length && o.demo !== false, e0 = C[Math.floor(n * 0.3)].c;
    var marksP = ex.map(function (e) { return +e.price; }).concat(stop ? [stop] : []).concat(tg);
    if (useDemo) marksP.push(e0 * 0.985, e0 * 1.03);
    if (D.rr) { var RV = rrVals(e0, ex, F); if (RV) marksP.push(RV.entry, RV.stop, RV.target); }
    marksP.forEach(function (p) { if (p > 0 && p < hi * 1.6 && p > lo * 0.4) { lo = Math.min(lo, p); hi = Math.max(hi, p); } });
    (D.draw || []).forEach(function (d) { [d.p1, d.p2].forEach(function (p) { if (p > 0 && p < hi * 1.4 && p > lo * 0.6) { lo = Math.min(lo, p); hi = Math.max(hi, p); } }); });
    var padv = (hi - lo) * 0.07; lo -= padv; hi += padv;
    var X = function (i) { return pl + (i + 0.5) * (W - pl - pr) / n; }, Y = function (v) { return pt + (1 - (v - lo) / (hi - lo)) * mainH; }, bw = Math.max(1, (W - pl - pr) / n * 0.64), y2p = function (y) { return lo + (1 - (y - pt) / mainH) * (hi - lo); };
    G = { W: W, H: H, pl: pl, pr: pr, pt: pt, mainH: mainH, n: n, lo: lo, hi: hi, y2p: y2p, X: X, Y: Y };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="fbx-svg fbx-big' + (tool ? " drawing t-" + tool : "") + '" id="fbxchart" role="img" aria-label="' + esc((tkr().t || "") + " chart preview") + '">';
    s += '<defs><clipPath id="fbxclip"><rect x="' + pl + '" y="' + pt + '" width="' + (W - pl - pr) + '" height="' + mainH + '"/></clipPath></defs>';
    // grid + price labels
    for (var g = 0; g <= 4; g++) { var gy = pt + g * mainH / 4, gp = y2p(gy); s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + gy + '" y2="' + gy + '" stroke="#EEF0F3"/><text x="' + (W - pr + 6) + '" y="' + (gy + 3) + '" class="fbx-ax">' + gp.toFixed(gp < 10 ? 3 : 2) + '</text>'; }
    // session shading (pre / after hours) + day separators + time axis
    var ticks = [], lastDay = "";
    C.forEach(function (c, i) { var d = new Date(c.t), m = d.getHours() * 60 + d.getMinutes(), day = iso(d);
      if (F.intra && (m < 570 || m >= 960)) s += '<rect x="' + (X(i) - (W - pl - pr) / n / 2).toFixed(1) + '" y="' + pt + '" width="' + ((W - pl - pr) / n + 0.5).toFixed(1) + '" height="' + mainH + '" fill="#F3F5F8"/>';
      if (F.intra && day !== lastDay && i) s += '<line x1="' + (X(i) - (W - pl - pr) / n / 2).toFixed(1) + '" x2="' + (X(i) - (W - pl - pr) / n / 2).toFixed(1) + '" y1="' + pt + '" y2="' + (pt + mainH) + '" stroke="#D6D9DF" stroke-dasharray="3 4"/>';
      if (day !== lastDay) ticks.push([i, "day"]); lastDay = day; });
    var every = Math.max(1, Math.round(n / 8)); for (var k = 0; k < n; k += every) ticks.push([k, "t"]);
    var usedX = [], axY = H - 8;
    ticks.sort(function (a, b) { return (a[1] === "day" ? 0 : 1) - (b[1] === "day" ? 0 : 1) || a[0] - b[0]; }).forEach(function (tk) {
      var i = tk[0], d = new Date(C[i].t), m = d.getHours() * 60 + d.getMinutes(); if (usedX.some(function (x) { return Math.abs(x - X(i)) < (tk[1] === "day" ? 60 : 78); })) return; usedX.push(X(i));
      var lab = !F.intra ? (F.step === "W" ? MN[d.getMonth()] + " '" + String(d.getFullYear()).slice(2) : MN[d.getMonth()] + " " + d.getDate()) : (tk[1] === "day" && F.days.length > 1 ? DN[d.getDay()] + " " + MN[d.getMonth()] + " " + d.getDate() : fmtClock(m).replace(":00", ""));
      s += '<line x1="' + X(i) + '" x2="' + X(i) + '" y1="' + (pt + mainH) + '" y2="' + (pt + mainH + 4) + '" stroke="#B9BFCB"/><text x="' + X(i) + '" y="' + axY + '" text-anchor="' + (X(i) < pl + 40 ? "start" : X(i) > W - pr - 40 ? "end" : "middle") + '" class="fbx-ax' + (tk[1] === "day" ? " b" : "") + '">' + lab + '</text>';
    });
    if (F.intra && F.ext) { s += '<text x="' + (pl + 4) + '" y="' + (pt + 11) + '" class="fbx-ax">PRE / AFTER HOURS SHADED</text>'; }
    s += '<g clip-path="url(#fbxclip)">';
    // time-based shading indicators
    ids.forEach(function (id) { var d = indDef(id); if (d[3] !== "time" || !F.intra) return;
      var wins = id === "kz" ? [[120, 300, "London"], [510, 660, "NY AM"], [810, 960, "NY PM"]] : id === "sb" ? [[600, 660, "Silver bullet"]] : [[0, 240, "Asia"]];
      wins.forEach(function (w) { var a = -1, b = -1; C.forEach(function (c, i) { var dd = new Date(c.t), m = dd.getHours() * 60 + dd.getMinutes(); if (m >= w[0] && m < w[1]) { if (a < 0) a = i; b = i; } }); if (a >= 0) s += '<rect x="' + (X(a) - bw) + '" y="' + pt + '" width="' + (X(b) - X(a) + bw * 2) + '" height="' + mainH + '" fill="' + d[4] + '" opacity=".045"/><text x="' + (X(a) - bw + 3) + '" y="' + (pt + mainH - 5) + '" class="fbx-lab" fill="' + d[4] + '">' + w[2] + '</text>'; }); });
    // zones under candles
    var sw = swings(C, n > 60 ? 3 : 2), avgBody = C.reduce(function (a, c) { return a + Math.abs(c.c - c.o); }, 0) / n;
    var box = function (i0, i1, a, b, col, lab, op) { var y1 = Y(Math.max(a, b)), y2 = Y(Math.min(a, b)); return '<rect x="' + (X(i0) - bw / 2).toFixed(1) + '" y="' + y1.toFixed(1) + '" width="' + Math.max(4, X(i1) - X(i0) + bw).toFixed(1) + '" height="' + Math.max(2, y2 - y1).toFixed(1) + '" fill="' + col + '" opacity="' + (op || 0.13) + '" rx="2"/><rect x="' + (X(i0) - bw / 2).toFixed(1) + '" y="' + y1.toFixed(1) + '" width="' + Math.max(4, X(i1) - X(i0) + bw).toFixed(1) + '" height="' + Math.max(2, y2 - y1).toFixed(1) + '" fill="none" stroke="' + col + '" stroke-opacity=".5" rx="2"/>' + (lab ? '<text x="' + (X(i0) + 2).toFixed(1) + '" y="' + (y1 + 10).toFixed(1) + '" class="fbx-lab" fill="' + col + '">' + lab + '</text>' : ''); };
    var zEnd = function (i0, natural) { var z = D.zlen || "fill"; if (z === "edge") return n - 1; if (z === "short") return Math.min(n - 1, i0 + 14); return natural >= 0 ? natural : n - 1; };
    ids.forEach(function (id) {
      var d = indDef(id), col = d[4]; if (d[3] !== "zone" && d[3] !== "vp") return;
      if (id === "fvg" || id === "ifvg") { var got = 0; for (var i = 2; i < n && got < 4; i++) { var bull = C[i - 2].h < C[i].l, bear = C[i - 2].l > C[i].h; if (!bull && !bear) continue; var a = bull ? C[i - 2].h : C[i].h, b = bull ? C[i].l : C[i - 2].l, filled = -1; for (var j = i + 1; j < n; j++) if (bull ? C[j].c < a : C[j].c > b) { filled = j; break; } if (id === "fvg" && filled < 0) { s += box(i - 1, zEnd(i - 1, -1), a, b, col, "FVG"); got++; } if (id === "ifvg" && filled >= 0) { s += box(filled, zEnd(filled, -1), a, b, col, "IFVG"); got++; } } }
      if (id === "ob" || id === "brk") { var got2 = 0; for (var i2 = n - 4; i2 > 2 && got2 < 3; i2--) { var mv = C[i2 + 1].c - C[i2 + 1].o, opp = (C[i2].c - C[i2].o) * mv < 0; if (opp && Math.abs(mv) > avgBody * 2) { var broke = false; for (var j2 = i2 + 2; j2 < n; j2++) if (mv > 0 ? C[j2].c < C[i2].l : C[j2].c > C[i2].h) { broke = true; break; } if ((id === "ob") !== broke) { s += box(i2, zEnd(i2, -1), C[i2].h, C[i2].l, id === "ob" ? (D.icol.ob || (mv > 0 ? "#16A34A" : "#DC2626")) : col, id === "ob" ? (mv > 0 ? "Bull OB" : "Bear OB") : "Breaker"); got2++; } } } }
      if (id === "sup" || id === "dem" || id === "flip") { var L = id === "dem" ? sw.lo : sw.hi; L.slice(-2).forEach(function (i3) { var c = C[i3], a3 = id === "dem" ? c.l : c.h, b3 = id === "dem" ? Math.min(c.o, c.c) : Math.max(c.o, c.c); if (Math.abs(a3 - b3) < avgBody * 0.4) b3 = id === "dem" ? a3 + avgBody : a3 - avgBody; s += box(i3, zEnd(i3, n - 1), a3, b3, col, id === "dem" ? "Demand" : id === "sup" ? "Supply" : "Flip", 0.12); }); }
      if (id === "wyck") { var mid = Math.floor(n * 0.25), seg = C.slice(mid, mid + Math.floor(n * 0.4)); s += box(mid, mid + seg.length - 1, Math.max.apply(null, seg.map(function (x) { return x.h; })), Math.min.apply(null, seg.map(function (x) { return x.l; })), col, "Wyckoff range", 0.06); }
      if (id === "pdz" || id === "ote") { var H2 = Math.max.apply(null, C.map(function (x) { return x.h; })), L2 = Math.min.apply(null, C.map(function (x) { return x.l; })); if (id === "pdz") { s += box(0, n - 1, H2, (H2 + L2) / 2, "#DC2626", "Premium", 0.05) + box(0, n - 1, (H2 + L2) / 2, L2, "#16A34A", "Discount", 0.05); } else s += box(Math.floor(n * 0.5), n - 1, H2 - (H2 - L2) * 0.62, H2 - (H2 - L2) * 0.79, col, "OTE 62–79%", 0.16); }
      if (d[3] === "vp") { var bins = 24, hist = new Array(bins).fill(0); C.forEach(function (c) { var b4 = Math.min(bins - 1, Math.max(0, Math.floor((c.c - lo) / (hi - lo) * bins))); hist[b4] += c.v; }); var mx = Math.max.apply(null, hist), poc = hist.indexOf(mx), bh = mainH / bins; hist.forEach(function (v, b5) { var w = v / mx * (W - pl - pr) * 0.22; s += '<rect x="' + (W - pr - w).toFixed(1) + '" y="' + (pt + mainH - (b5 + 1) * bh + 1).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (bh - 2).toFixed(1) + '" fill="' + (b5 === poc ? "#F59E0B" : col) + '" opacity=".35"/>'; }); var pocP = lo + (poc + 0.5) / bins * (hi - lo); s += hline(pocP, "#F59E0B", "POC", "", 1.4); s += hline(pocP + (hi - lo) * 0.12, col, "VAH", "4 3") + hline(pocP - (hi - lo) * 0.12, col, "VAL", "4 3"); }
    });
    function hline(p, col, lab, dash, w) { if (!(p > lo && p < hi)) return ""; var y = Y(p).toFixed(1); return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" stroke="' + col + '" stroke-width="' + (w || 1.2) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/><text x="' + (W - pr - 4) + '" y="' + (+y - 3) + '" text-anchor="end" class="fbx-lab" fill="' + col + '">' + lab + '</text>'; }
    if (hasVol) C.forEach(function (c, i) { var vh = c.v / 2.2 * mainH * 0.22; s += '<rect x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + (pt + mainH - vh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + vh.toFixed(1) + '" fill="' + (c.c >= c.o ? "#BBF7D0" : "#FECACA") + '"/>'; });
    // candles
    C.forEach(function (c, i) { var up = c.c >= c.o, col = up ? "#16A34A" : "#DC2626", y0 = Y(Math.max(c.o, c.c)), hh = Math.max(1, Math.abs(Y(c.o) - Y(c.c)));
      s += '<line x1="' + X(i).toFixed(1) + '" x2="' + X(i).toFixed(1) + '" y1="' + Y(c.h).toFixed(1) + '" y2="' + Y(c.l).toFixed(1) + '" stroke="' + col + '"/><rect x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + (up ? "#fff" : col) + '" stroke="' + col + '" stroke-width="1"/>'; });
    var path = function (arr, col, w, dash) { var dd = ""; arr.forEach(function (v, i) { if (v == null || !isFinite(v)) return; dd += (dd ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1); }); return dd ? '<path d="' + dd + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 1.8) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' stroke-linejoin="round"/>' : ""; };
    var dOpen = C[0].o, H0 = Math.max.apply(null, C.map(function (x) { return x.h; })), L0 = Math.min.apply(null, C.map(function (x) { return x.l; })), rngP = H0 - L0;
    ids.forEach(function (id) {
      var d = indDef(id), col = d[4], kind = d[3];
      if (kind === "ma") s += path(maOf(C, d[6].t, d[6].n), col, 1.7);
      else if (kind === "vwap") { var vw = vwapOf(C); s += path(vw.map(function (x) { return x && x[0]; }), col, 2.2); }
      else if (kind === "vwapb") { var vb = vwapOf(C); [1, 2].forEach(function (m) { s += path(vb.map(function (x) { return x && x[0] + m * x[1]; }), col, 1, "4 3") + path(vb.map(function (x) { return x && x[0] - m * x[1]; }), col, 1, "4 3"); }); }
      else if (kind === "avwap") { var ai = ex.length ? idxAt(F, ex[0].time) : Math.floor(n * 0.35); if (ai == null) ai = Math.floor(n * 0.35); s += path(vwapOf(C, ai).map(function (x) { return x && x[0]; }), col, 1.8, "6 3"); }
      else if (kind === "band") { var t = d[6].t, mid, up, dn; if (t === "boll") { mid = sma(C.map(function (c) { return c.c; }), Math.min(20, n - 1)); var sd = mid.map(function (m, i) { if (m == null) return null; var q = 0, k0 = Math.min(20, n - 1); for (var j = i - k0 + 1; j <= i; j++) q += Math.pow(C[j].c - m, 2); return Math.sqrt(q / k0); }); up = mid.map(function (m, i) { return m == null ? null : m + 2 * sd[i]; }); dn = mid.map(function (m, i) { return m == null ? null : m - 2 * sd[i]; }); }
        else if (t === "donch") { up = C.map(function (_, i) { return i < 19 ? null : Math.max.apply(null, C.slice(i - 19, i + 1).map(function (x) { return x.h; })); }); dn = C.map(function (_, i) { return i < 19 ? null : Math.min.apply(null, C.slice(i - 19, i + 1).map(function (x) { return x.l; })); }); }
        else { mid = maOf(C, "ema", 20); var at = atrOf(C, 14), mlt = t === "atr" ? 2.5 : 2; up = mid.map(function (m, i) { return m + mlt * at[i]; }); dn = mid.map(function (m, i) { return m - mlt * at[i]; }); }
        s += path(up, col, 1.1, "3 3") + path(dn, col, 1.1, "3 3") + (mid ? path(mid, col, 1, "1 4") : ""); }
      else if (kind === "lr") { var xs = C.map(function (_, i) { return i; }), mx = (n - 1) / 2, my = C.reduce(function (a, c) { return a + c.c; }, 0) / n, num = 0, den = 0; C.forEach(function (c, i) { num += (i - mx) * (c.c - my); den += (i - mx) * (i - mx); }); var sl = num / den, b = my - sl * mx, dev = Math.sqrt(C.reduce(function (a, c, i) { return a + Math.pow(c.c - (b + sl * i), 2); }, 0) / n) * 2; [0, dev, -dev].forEach(function (o2, z) { s += path(xs.map(function (i) { return b + sl * i + o2; }), col, z ? 1 : 1.6, z ? "4 3" : ""); }); }
      else if (kind === "st") { var at2 = atrOf(C, 10), dir = 1, line = []; C.forEach(function (c, i) { var m2 = (c.h + c.l) / 2, upb = m2 + 3 * at2[i], dnb = m2 - 3 * at2[i]; if (i && dir > 0 && c.c < line[i - 1]) dir = -1; else if (i && dir < 0 && c.c > line[i - 1]) dir = 1; line.push(dir > 0 ? Math.max(dnb, i && dir > 0 && line[i - 1] < c.c ? line[i - 1] : dnb) : Math.min(upb, i && line[i - 1] > c.c ? line[i - 1] : upb)); }); s += path(line, col, 2); }
      else if (kind === "psar") C.forEach(function (c, i) { if (i % 2) return; var up2 = i > 3 && c.c > C[i - 3].c; s += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(up2 ? c.l - rngP * 0.02 : c.h + rngP * 0.02).toFixed(1) + '" r="1.8" fill="' + col + '"/>'; });
      else if (kind === "ichi") { var hl = function (k1, i) { var sl2 = C.slice(Math.max(0, i - k1 + 1), i + 1); return (Math.max.apply(null, sl2.map(function (x) { return x.h; })) + Math.min.apply(null, sl2.map(function (x) { return x.l; }))) / 2; }; var ten = C.map(function (_, i) { return hl(9, i); }), kij = C.map(function (_, i) { return hl(26, i); }), sa = ten.map(function (v, i) { return (v + kij[i]) / 2; }), sb = C.map(function (_, i) { return hl(52, i); }); var poly = sa.map(function (v, i) { return X(i).toFixed(1) + "," + Y(v).toFixed(1); }).concat(sb.map(function (v, i) { return X(i).toFixed(1) + "," + Y(v).toFixed(1); }).reverse()).join(" "); s += '<polygon points="' + poly + '" fill="#16A34A" opacity=".08"/>' + path(ten, "#2563EB", 1) + path(kij, "#DC2626", 1); }
      else if (kind === "or") { var mins0 = d[6].m, cnt = Math.max(1, Math.round(mins0 / (typeof F.step === "number" ? F.step : 5))), seg = C.slice(0, cnt), oh = Math.max.apply(null, seg.map(function (x) { return x.h; })), ol = Math.min.apply(null, seg.map(function (x) { return x.l; })); s += '<rect x="' + pl + '" y="' + Y(oh) + '" width="' + (W - pr - pl) + '" height="' + (Y(ol) - Y(oh)) + '" fill="' + col + '" opacity=".06"/>' + hline(oh, col, "OR" + mins0 + " H") + hline(ol, col, "OR" + mins0 + " L"); }
      else if (kind === "fib" || kind === "fibx") { var levels = kind === "fib" ? [0].concat(D.fib || []).concat([1]) : [1.272, 1.414, 1.618, 2, 2.618]; levels.forEach(function (f) { var p = kind === "fib" ? H0 - rngP * f : L0 + rngP * f; s += hline(p, col, (f * 100).toFixed(1).replace(".0", "") + "%", "2 4"); }); }
      else if (kind === "tl") { var hs = sw.hi.slice(-2), ls = sw.lo.slice(-2); [[hs, "h", "#DC2626"], [ls, "l", "#16A34A"]].forEach(function (z) { if (z[0].length < 2) return; var a = z[0][0], b2 = z[0][1], pa = C[a][z[1]], pb2 = C[b2][z[1]], sl3 = (pb2 - pa) / (b2 - a); s += '<line x1="' + X(a) + '" y1="' + Y(pa) + '" x2="' + X(n - 1) + '" y2="' + Y(pa + sl3 * (n - 1 - a)) + '" stroke="' + z[2] + '" stroke-width="1.6"/>'; }); }
      else if (kind === "liq") { sw.hi.slice(-2).forEach(function (i) { s += '<line x1="' + X(i) + '" x2="' + (W - pr) + '" y1="' + Y(C[i].h) + '" y2="' + Y(C[i].h) + '" stroke="' + col + '" stroke-dasharray="2 3"/><text x="' + (X(i) + 3) + '" y="' + (Y(C[i].h) - 3) + '" class="fbx-lab" fill="' + col + '">$$$ BSL</text>'; }); sw.lo.slice(-2).forEach(function (i) { s += '<line x1="' + X(i) + '" x2="' + (W - pr) + '" y1="' + Y(C[i].l) + '" y2="' + Y(C[i].l) + '" stroke="' + col + '" stroke-dasharray="2 3"/><text x="' + (X(i) + 3) + '" y="' + (Y(C[i].l) + 10) + '" class="fbx-lab" fill="' + col + '">$$$ SSL</text>'; }); }
      else if (kind === "bos") { var lastH = null, lastL = null, trend = 0, cnt2 = 0; for (var i4 = 0; i4 < n && cnt2 < 6; i4++) { if (sw.hi.indexOf(i4 - 3) >= 0) lastH = i4 - 3; if (sw.lo.indexOf(i4 - 3) >= 0) lastL = i4 - 3; if (lastH != null && C[i4].c > C[lastH].h) { s += '<line x1="' + X(lastH) + '" x2="' + X(i4) + '" y1="' + Y(C[lastH].h) + '" y2="' + Y(C[lastH].h) + '" stroke="' + col + '"/><text x="' + ((X(lastH) + X(i4)) / 2) + '" y="' + (Y(C[lastH].h) - 3) + '" text-anchor="middle" class="fbx-lab" fill="' + col + '">' + (trend < 0 ? "CHoCH" : "BOS") + '</text>'; trend = 1; lastH = null; cnt2++; } if (lastL != null && C[i4].c < C[lastL].l) { s += '<line x1="' + X(lastL) + '" x2="' + X(i4) + '" y1="' + Y(C[lastL].l) + '" y2="' + Y(C[lastL].l) + '" stroke="#DC2626"/><text x="' + ((X(lastL) + X(i4)) / 2) + '" y="' + (Y(C[lastL].l) + 10) + '" text-anchor="middle" class="fbx-lab" fill="#DC2626">' + (trend > 0 ? "CHoCH" : "BOS") + '</text>'; trend = -1; lastL = null; cnt2++; } } }
      else if (kind === "sweep") { sw.hi.concat(sw.lo).forEach(function (i) { for (var j = i + 2; j < Math.min(n, i + 25); j++) { var isH = sw.hi.indexOf(i) >= 0; if (isH ? C[j].h > C[i].h && C[j].c < C[i].h : C[j].l < C[i].l && C[j].c > C[i].l) { s += '<text x="' + X(j) + '" y="' + Y(isH ? C[j].h : C[j].l) + '" dy="' + (isH ? -5 : 12) + '" text-anchor="middle" class="fbx-lab" fill="' + col + '">&#10007; sweep</text>'; break; } } }); }
      else if (kind === "gx") { var s50 = maOf(C, "sma", Math.min(50, n - 2)), s20 = maOf(C, "sma", Math.min(20, n - 2)); s += path(s50, "#1B3A8A", 1.4) + path(s20, "#0F8A8A", 1.4); for (var i5 = 1; i5 < n; i5++) if (s50[i5 - 1] != null && s20[i5 - 1] != null && (s20[i5 - 1] - s50[i5 - 1]) * (s20[i5] - s50[i5]) < 0) s += '<text x="' + X(i5) + '" y="' + (Y(s20[i5]) - 8) + '" text-anchor="middle" class="fbx-tag" fill="' + col + '">' + (s20[i5] > s50[i5] ? "&#10022; GOLDEN" : "&#10006; DEATH") + '</text>'; }
      else if (kind === "mark") { [0.33, 0.8].forEach(function (f) { var i6 = Math.floor(n * f); s += '<g transform="translate(' + X(i6) + ',' + (pt + mainH - 14) + ')"><circle r="8" fill="' + col + '"/><text y="3.5" text-anchor="middle" class="fbx-tag" fill="#fff">' + (id === "earn" ? "E" : "D") + '</text></g>'; }); }
      else if (kind === "lvl") {
        var L3 = [];
        if (id === "pm") L3 = [[dOpen + rngP * 0.25, "PM high"], [dOpen - rngP * 0.18, "PM low"]];
        else if (id === "pd") L3 = [[H0 + rngP * 0.08, "PD high"], [L0 - rngP * 0.06, "PD low"], [dOpen - rngP * 0.03, "PD close"]];
        else if (id === "hodlod") L3 = [[H0, "HOD"], [L0, "LOD"]];
        else if (id === "pw") L3 = [[H0 + rngP * 0.15, "PW high"], [L0 - rngP * 0.12, "PW low"]];
        else if (id === "dopen") L3 = [[dOpen, "Daily open"]];
        else if (id === "wopen") L3 = [[dOpen - rngP * 0.1, "Weekly open"], [dOpen + rngP * 0.2, "Monthly open"]];
        else if (id === "round") { var st2 = rngP > 40 ? 10 : rngP > 8 ? 5 : 1; for (var v = Math.ceil(lo / st2) * st2; v < hi; v += st2) L3.push([v, "$" + v]); }
        else if (id === "piv" || id === "cam") { var P = (H0 + L0 + C[n - 1].c) / 3; L3 = id === "piv" ? [[P, "P"], [2 * P - L0, "R1"], [P + rngP, "R2"], [2 * P - H0, "S1"], [P - rngP, "S2"]] : [[C[n - 1].c + rngP * 1.1 / 4, "H3"], [C[n - 1].c + rngP * 1.1 / 2, "H4"], [C[n - 1].c - rngP * 1.1 / 4, "L3"], [C[n - 1].c - rngP * 1.1 / 2, "L4"]]; }
        else if (id === "gap") L3 = [[dOpen - rngP * 0.2, "Gap fill"], [dOpen - rngP * 0.1, "Half gap"]];
        else if (id === "sr") { sw.hi.slice(-2).forEach(function (i) { L3.push([C[i].h, "R"]); }); sw.lo.slice(-2).forEach(function (i) { L3.push([C[i].l, "S"]); }); }
        else if (id === "on") L3 = [[H0 + rngP * 0.05, "ON high"], [L0 - rngP * 0.04, "ON low"]];
        else if (id === "ib") { var cnt3 = Math.max(1, Math.round(60 / (typeof F.step === "number" ? F.step : 60))), sg = C.slice(0, cnt3); L3 = [[Math.max.apply(null, sg.map(function (x) { return x.h; })), "IB high"], [Math.min.apply(null, sg.map(function (x) { return x.l; })), "IB low"]]; }
        else if (id === "sett") L3 = [[dOpen + rngP * 0.04, "Settle"]];
        else if (id === "em") L3 = [[dOpen + rngP * 0.55, "+EM"], [dOpen - rngP * 0.55, "−EM"]];
        else if (id === "walls") L3 = [[Math.ceil(H0 / 5) * 5, "Call wall"], [Math.floor(L0 / 5) * 5, "Put wall"]];
        else if (id === "mp") L3 = [[Math.round((H0 + L0) / 2), "Max pain"]];
        else if (id === "strike") L3 = [[Math.round(C[n - 1].c), "My strike"]];
        else if (id === "be") L3 = [[Math.round(C[n - 1].c) + rngP * 0.15, "Break-even"]];
        else if (id === "sess") L3 = [[dOpen, "NY open"], [dOpen - rngP * 0.12, "London open"], [dOpen + rngP * 0.07, "Asia open"]];
        else if (id === "w52") L3 = [[H0, "52-wk high"], [L0, "52-wk low"]];
        else if (id === "cost") { var buys = ex.filter(function (e) { return e.side === "buy"; }), q = buys.reduce(function (a, e) { return a + (+e.qty || 1); }, 0); L3 = [[q ? buys.reduce(function (a, e) { return a + e.price * (+e.qty || 1); }, 0) / q : C[Math.floor(n * 0.4)].c, "Cost basis"]]; }
        L3.forEach(function (l) { s += hline(l[0], col, l[1], "6 4"); });
      }
    });
    // your drawings
    (D.draw || []).forEach(function (d) {
      var c = d.col || "#2F6FE4", lab = d.label ? esc(d.label) : "";
      if (d.k === "h") s += '<g data-dw="' + d.id + '"><line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(d.p1) + '" y2="' + Y(d.p1) + '" stroke="' + c + '" stroke-width="2"/><line class="hit" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(d.p1) + '" y2="' + Y(d.p1) + '" stroke="transparent" stroke-width="12"/><text x="' + (pl + 6) + '" y="' + (Y(d.p1) - 4) + '" class="fbx-lab" fill="' + c + '">' + (lab || (+d.p1).toFixed(2)) + '</text></g>';
      else if (d.k === "t") s += '<g data-dw="' + d.id + '"><line x1="' + X(d.i1) + '" y1="' + Y(d.p1) + '" x2="' + X(d.i2) + '" y2="' + Y(d.p2) + '" stroke="' + c + '" stroke-width="2"/><line class="hit" x1="' + X(d.i1) + '" y1="' + Y(d.p1) + '" x2="' + X(d.i2) + '" y2="' + Y(d.p2) + '" stroke="transparent" stroke-width="12"/>' + (lab ? '<text x="' + X(d.i2) + '" y="' + (Y(d.p2) - 5) + '" class="fbx-lab" fill="' + c + '">' + lab + '</text>' : '') + '</g>';
      else if (d.k === "z") s += '<g data-dw="' + d.id + '">' + box(Math.min(d.i1, d.i2), Math.max(d.i1, d.i2), d.p1, d.p2, c, lab || "Zone", 0.16) + '</g>';
      else if (d.k === "n") s += '<g data-dw="' + d.id + '" transform="translate(' + X(d.i1) + ',' + Y(d.p1) + ')"><rect x="-4" y="-16" width="' + Math.min(220, 12 + d.label.length * 5.6) + '" height="22" rx="6" fill="#FFF8D6" stroke="#EAD98A"/><text x="4" y="-1" class="fbx-note">' + esc(d.label) + '</text></g>';
    });
    s += '</g>';
    // your trade: stop, targets, executions
    if (D.rr) s += rrBox();
    else { if (stop) s += hline(stop, ucol("stop", "#DC2626"), "STOP " + stop, "5 3", 1.6);
    tg.forEach(function (t, i) { s += hline(t, ucol("target", "#16A34A"), "TARGET " + (tg.length > 1 ? i + 1 + " " : "") + t, "5 3", 1.6); }); }
    function rrBox() {
      var R = rrVals(e0, ex, F); if (!R) return "";
      var i0 = R.i, i1 = Math.min(n - 1, i0 + Math.max(10, Math.round(n * 0.32))), x0 = X(i0) - bw / 2, x1 = X(i1) + bw / 2, ye = Y(R.entry), ys = Y(R.stop), yt = Y(R.target), cg = ucol("target", "#16A34A"), cr = ucol("stop", "#DC2626"), o = "";
      o += '<rect x="' + x0.toFixed(1) + '" y="' + Math.min(ye, yt).toFixed(1) + '" width="' + (x1 - x0).toFixed(1) + '" height="' + Math.abs(yt - ye).toFixed(1) + '" fill="' + cg + '" opacity=".16"/>';
      o += '<rect x="' + x0.toFixed(1) + '" y="' + Math.min(ye, ys).toFixed(1) + '" width="' + (x1 - x0).toFixed(1) + '" height="' + Math.abs(ys - ye).toFixed(1) + '" fill="' + cr + '" opacity=".16"/>';
      [["target", yt, cg, "Target " + R.target.toFixed(2) + "  (" + (R.rew >= 0 ? "+" : "") + R.rew.toFixed(2) + ")"], ["entry", ye, "#334155", "Entry " + R.entry.toFixed(2)], ["stop", ys, cr, "Stop " + R.stop.toFixed(2) + "  (-" + R.risk.toFixed(2) + ")"]].forEach(function (l) {
        o += '<g data-rr="' + l[0] + '" class="fbx-rrl"><line x1="' + x0.toFixed(1) + '" x2="' + x1.toFixed(1) + '" y1="' + l[1].toFixed(1) + '" y2="' + l[1].toFixed(1) + '" stroke="' + l[2] + '" stroke-width="1.6"/><line class="hit" x1="' + x0.toFixed(1) + '" x2="' + x1.toFixed(1) + '" y1="' + l[1].toFixed(1) + '" y2="' + l[1].toFixed(1) + '" stroke="transparent" stroke-width="14"/><circle cx="' + x1.toFixed(1) + '" cy="' + l[1].toFixed(1) + '" r="4.5" fill="#fff" stroke="' + l[2] + '" stroke-width="1.6"/></g><text x="' + (x1 + 8).toFixed(1) + '" y="' + (l[1] + 3).toFixed(1) + '" class="fbx-lab" fill="' + l[2] + '">' + l[3] + '</text>';
      });
      var ratio = R.risk > 0 ? R.rew / R.risk : 0, my = (Math.min(ye, yt) + Math.max(ye, yt)) / 2;
      o += '<g transform="translate(' + ((x0 + x1) / 2).toFixed(1) + ',' + my.toFixed(1) + ')"><rect x="-44" y="-11" width="88" height="20" rx="10" fill="#0B0B0C"/><text text-anchor="middle" y="3.5" class="fbx-tag" fill="#fff">R:R 1 : ' + ratio.toFixed(2) + '</text></g>';
      return o;
    }
    var COLS = { buy: "#2F6FE4", sell: "#0B0B0C", short: "#7C4DCC", cover: "#E0662B" }, posQ = 0;
    var demo = useDemo ? [{ side: "buy", qty: 100, price: e0, i: Math.floor(n * 0.3) }, { side: "sell", qty: 50, price: C[Math.floor(n * 0.55)].c, i: Math.floor(n * 0.55) }, { side: "sell", qty: 50, price: C[Math.floor(n * 0.75)].c, i: Math.floor(n * 0.75) }] : ex.map(function (e) { return { side: e.side, qty: +e.qty || 0, price: +e.price, i: idxAt(F, e.time) }; }).filter(function (e) { return e.i != null; });
    if (useDemo && !D.rr) { s += hline(e0 * 0.985, "#DC2626", "STOP (example)", "5 3", 1.6) + hline(e0 * 1.03, "#16A34A", "TARGET (example)", "5 3", 1.6); }
    var M = D.marks || {}, pills = [];
    demo.forEach(function (e, k) {
      var before = posQ; posQ += (e.side === "buy" || e.side === "cover" ? 1 : -1) * (e.qty || 0);
      var closing = (e.side === "sell" && before > 0) || (e.side === "cover" && before < 0), partial = closing && (e.qty || 0) < Math.abs(before);
      var lab = (partial ? "PARTIAL " : "") + (e.side === "buy" ? "BUY" : e.side === "sell" ? "SELL" : e.side === "short" ? "SHORT" : "COVER") + (e.qty ? " " + e.qty : "") + " @ " + (+e.price).toFixed(2);
      var show = partial ? M.partial : (e.side === "buy" || e.side === "short") ? M.entry : M.exit; if (!show) return;
      var x = X(e.i), y = Y(e.price), col = partial ? "#E0662B" : COLS[e.side] || "#111", up = e.side === "buy" || e.side === "cover", ty = up ? y + 24 : y - 16;
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6.5" fill="' + col + '" stroke="#fff" stroke-width="2"/>'; pills.push('<text x="' + x.toFixed(1) + '" y="' + ty.toFixed(1) + '" text-anchor="middle" class="fbx-lab" fill="' + col + '">PILL|' + y.toFixed(1) + '|' + lab + '</text>');
    });
    s += pills.join("");
    if (M.notes && (D.note || useDemo)) { var nt = (D.note || "Waited for the VWAP reclaim. Stop under the flag.").slice(0, 90); s += '<g transform="translate(' + (pl + 8) + ',' + (pt + 8) + ')"><rect width="' + Math.min(W * 0.5, nt.length * 5.4 + 20) + '" height="24" rx="8" fill="#FFF8D6" stroke="#EAD98A"/><text x="10" y="16" class="fbx-note">&#128221; ' + esc(nt) + '</text></g>'; }
    // lower panels
    osc.forEach(function (id, k) {
      var d = indDef(id), o2 = oscSeries(id, C), top = pt + mainH + 8 + k * (ph + 8), vals = []; (o2.s || []).forEach(function (a) { a.forEach(function (v) { if (v != null && isFinite(v)) vals.push(v); }); }); (o2.hist || []).forEach(function (v) { if (isFinite(v)) vals.push(v); });
      var mn = o2.rng ? o2.rng[0] : Math.min.apply(null, vals.concat(o2.lv || [])), mx2 = o2.rng ? o2.rng[1] : Math.max.apply(null, vals.concat(o2.lv || [])); if (mx2 === mn) mx2 = mn + 1;
      var Y2 = function (v) { return top + (1 - (v - mn) / (mx2 - mn)) * ph; };
      s += '<rect x="' + pl + '" y="' + top + '" width="' + (W - pl - pr) + '" height="' + ph + '" fill="#FAFAFB" stroke="#EEF0F3"/><text x="' + (pl + 6) + '" y="' + (top + 12) + '" class="fbx-lab" fill="' + d[4] + '">' + esc(d[1]) + '</text>';
      (o2.lv || []).forEach(function (l) { s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y2(l) + '" y2="' + Y2(l) + '" stroke="#D6D9DF" stroke-dasharray="3 3"/><text x="' + (W - pr + 6) + '" y="' + (Y2(l) + 3) + '" class="fbx-ax">' + l + '</text>'; });
      (o2.hist || []).forEach(function (v, i) { if (!isFinite(v)) return; var z = Y2(Math.max(0, mn)); s += '<rect x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + Math.min(z, Y2(v)).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.abs(Y2(v) - z).toFixed(1) + '" fill="' + (v >= 0 ? "#86EFAC" : "#FCA5A5") + '"/>'; });
      (o2.s || []).forEach(function (a, z) { var dd = ""; a.forEach(function (v, i) { if (v == null || !isFinite(v)) return; dd += (dd ? "L" : "M") + X(i).toFixed(1) + "," + Y2(v).toFixed(1); }); if (o2.bars) a.forEach(function (v, i) { s += '<rect x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + Y2(v).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (top + ph - Y2(v)).toFixed(1) + '" fill="' + (v > 1.5 ? d[4] : "#CBD5E1") + '"/>'; }); else s += '<path d="' + dd + '" fill="none" stroke="' + (z ? "#F59E0B" : d[4]) + '" stroke-width="1.5"/>'; });
    });
    if (tool && tool !== "erase") s += '<rect class="fbx-catch" x="' + pl + '" y="' + pt + '" width="' + (W - pl - pr) + '" height="' + mainH + '" fill="transparent"/>';
    return placeLabels(s, G, C) + '</svg>';
  }
  function candles(n, seed, start, vol, drift) {
    var r = rng(seed), p = start, out = [];
    for (var i = 0; i < n; i++) { var o = p, c = o * (1 + (r() - 0.5 + (drift || 0)) * vol), h = Math.max(o, c) * (1 + r() * vol * 0.5), l = Math.min(o, c) * (1 - r() * vol * 0.5); out.push({ o: o, h: h, l: l, c: c, v: 0.4 + r() }); p = c; }
    return out;
  }
  function osma(C, n) { return C.map(function (_, i) { if (i < n - 1) return null; var s = 0; for (var j = i - n + 1; j <= i; j++) s += C[j].c; return s / n; }); }
  function oema(C, n) { var k = 2 / (n + 1), e = null; return C.map(function (c) { e = e == null ? c.c : c.c * k + e * (1 - k); return e; }); }
  function ovwap(C) { var pv = 0, vv = 0; return C.map(function (c) { var tp = (c.h + c.l + c.c) / 3; pv += tp * c.v; vv += c.v; return pv / vv; }); }
  function oboll(C, n) { var m = osma(C, n); return C.map(function (_, i) { if (m[i] == null) return null; var s = 0; for (var j = i - n + 1; j <= i; j++) s += Math.pow(C[j].c - m[i], 2); var sd = Math.sqrt(s / n); return [m[i] + 2 * sd, m[i] - 2 * sd]; }); }
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
      var c = ({ vwap: "#7C4DCC", avwap: "#A47BEA", ema9: "#E0662B", ema21: "#C2364A", sma20: "#2F6FE4", sma50: "#1B3A8A", fib: "#B08D57", boll: "#8A93A3", pdl: "#5B6472", pm: "#D4A017", or: "#17845B" })[k] || "#111";
      if (k === "vwap") s += line(ovwap(C), c, 2);
      else if (k === "avwap") { var a0 = Math.floor(n * 0.35), sub = ovwap(C.slice(a0)); s += line(C.map(function (_, i) { return i < a0 ? null : sub[i - a0]; }), c, 1.6, "5 3"); }
      else if (/^ema/.test(k)) s += line(oema(C, +k.slice(3)), c, 1.6);
      else if (/^sma/.test(k)) s += line(osma(C, Math.min(+k.slice(3), n - 1)), c, 1.6);
      else if (k === "boll") { var B = oboll(C, 20); s += line(B.map(function (x) { return x && x[0]; }), c, 1, "3 3") + line(B.map(function (x) { return x && x[1]; }), c, 1, "3 3"); }
      else if (k === "fib") { var lo2 = Infinity, hi2 = -Infinity; C.forEach(function (x) { lo2 = Math.min(lo2, x.l); hi2 = Math.max(hi2, x.h); }); [0].concat(o.fib || [0.382, 0.5, 0.618]).concat([1]).forEach(function (f) { s += hl(hi2 - (hi2 - lo2) * f, c, (f * 100).toFixed(1).replace(".0", "") + "%", "2 4"); }); }
      else if (k === "pdl") { s += hl(C[0].o * 1.012, c, "PDH", "6 4") + hl(C[0].o * 0.991, c, "PDL", "6 4"); }
      else if (k === "pm") { s += hl(C[0].o * 1.006, c, "PMH", "2 3") + hl(C[0].o * 0.996, c, "PML", "2 3"); }
      else if (k === "or") { var orH = Math.max.apply(null, C.slice(0, 6).map(function (x) { return x.h; })), orL = Math.min.apply(null, C.slice(0, 6).map(function (x) { return x.l; })); s += '<rect x="' + pl + '" y="' + Y(orH) + '" width="' + (W - pr - pl) + '" height="' + (Y(orL) - Y(orH)) + '" fill="' + c + '" opacity=".07"/>' + hl(orH, c, "ORH") + hl(orL, c, "ORL"); }
    });
    if (o.marks) { var M = o.marks, e0 = C[Math.floor(n * 0.3)].c, stp = e0 * 0.985, tg = e0 * 1.03, ex = C[Math.floor(n * 0.72)].c, ix = Math.floor(n * 0.3), ox = Math.floor(n * 0.72);
      if (M.stop) s += hl(stp, "#DC2626", "STOP", "5 3");
      if (M.target) s += hl(tg, "#16A34A", "TARGET", "5 3");
      if (M.entry) s += '<circle cx="' + X(ix) + '" cy="' + Y(e0) + '" r="7" fill="#2F6FE4" stroke="#fff" stroke-width="2"/><text x="' + (X(ix) - 8) + '" y="' + (Y(e0) + 22) + '" class="fbx-tag" fill="#2F6FE4">BUY</text>';
      if (M.partial) { var px = Math.floor(n * 0.55); s += '<circle cx="' + X(px) + '" cy="' + Y(C[px].c) + '" r="6" fill="#E0662B" stroke="#fff" stroke-width="2"/><text x="' + (X(px) - 14) + '" y="' + (Y(C[px].c) - 12) + '" class="fbx-tag" fill="#E0662B">PARTIAL</text>'; }
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
  function cdot(k, def) { var c = ucol(k, def); return '<span class="fbx-cdot" style="background:' + c + '" title="Change color"><input type="color" data-icol="' + esc(k) + '" value="' + c + '" aria-label="Change color"></span>'; }
  function chip(group, v, label, on, extra) { return '<button type="button" class="fbx-chip' + (on ? " on" : "") + '" data-fbset="' + group + '" data-v="' + esc(v) + '" aria-pressed="' + !!on + '">' + (extra || "") + label + '</button>'; }

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


  /* ---------- shared bits ---------- */
  function shell(id, body) {
    var ix = PAGES.findIndex(function (p) { return p[0] === id; }), prev = PAGES[ix - 1], next = PAGES[ix + 1];
    return '<div class="fbx">' +
      '<nav class="fbx-top"><span class="fbx-logo"><i></i>Flipbook</span><div class="fbx-steps">' + PAGES.map(function (p, i) { return '<button type="button" data-fbgo="' + p[0] + '" class="' + (p[0] === id ? "on" : i < ix ? "done" : "") + '"><b>' + (i + 1) + '</b>' + p[1] + '</button>'; }).join("") + '</div></nav>' +
      body +
      '<footer class="fbx-nav">' + (prev ? '<button type="button" class="fbx-btn ghost" data-fbgo="' + prev[0] + '">&larr; ' + prev[1] + '</button>' : '<span></span>') + (next ? '<button type="button" class="fbx-btn" data-fbgo="' + next[0] + '">Next: ' + next[1] + ' &rarr;</button>' : '<span></span>') + '</footer>' +
      '<p class="fbx-legal">Flipbook is a keepsake and learning tool. Charts show your own history. Nothing here is investment advice.</p></div>';
  }
  function cdot(k, def) { var c = ucol(k, def); return '<span class="fbx-cdot" style="background:' + c + '" title="Change color"><input type="color" data-icol="' + esc(k) + '" value="' + c + '" aria-label="Change color"></span>'; }
  function chip(group, v, label, on, extra) { return '<button type="button" class="fbx-chip' + (on ? " on" : "") + '" data-fbset="' + group + '" data-v="' + esc(v) + '" aria-pressed="' + !!on + '">' + (extra || "") + label + '</button>'; }

  /* ---------- example book: hundreds of pages ---------- */
  var EXN = 314, SYMS = ["NVDA", "TSLA", "AAPL", "AMD", "META", "SPY", "QQQ", "ES", "NQ", "SMCI", "PLTR", "MSFT"];
  var KINDS = [["5-min · 9:30am – 4pm", 78, 0.006], ["5-min · pre & after hours", 96, 0.006], ["15-min · 3 days", 78, 0.008], ["1-hour · 3-week swing", 105, 0.012], ["1-min · first hour", 60, 0.004]];
  function exPage(i) {
    if (i === 0) return ['<div class="fbx-ex-cov"><small>2026 · Trading book</small><b>Flipbook</b><span>@tucker_trades</span><i>Volume 1 of 2 · ' + EXN + ' pages</i></div>', "Cover"];
    if (i === 1) return ['<div class="fbx-ex-pg"><h4>Contents</h4><div class="fbx-toc">' + MN.map(function (m, k) { var a = 2 + k * 26; return '<button type="button" data-fbpage="' + a + '"><b>' + m + '</b><span>p. ' + (a + 1) + '–' + (a + 26) + '</span></button>'; }).join("") + '</div></div>', "Contents"];
    var k = i - 2, mo = Math.floor(k / 26), j = k % 26, M = MN[mo % 12];
    if (j === 0) { var S = candles(120, 3 + mo, 420 + mo * 6, 0.012, 0.03); return ['<div class="fbx-ex-pg"><h4>' + M + ' at a glance</h4><p>S&amp;P 500 (SPY) · 6 months · your trades marked</p>' + chartSVG({ C: S, W: 560, H: 250, ind: ["sma50"], marks: { entry: 1, exit: 1 } }) + '<div class="fbx-ex-st"><div><b>' + (12 + (mo * 7) % 11) + '</b><span>trades</span></div><div><b>' + (52 + (mo * 13) % 23) + '%</b><span>win rate</span></div><div><b class="g">+$' + (800 + (mo * 977) % 2600).toLocaleString() + '</b><span>net</span></div></div></div>', M + " · market context"]; }
    if (j === 25) return ['<div class="fbx-ex-pg"><h4>Report card · ' + M + '</h4><div class="fbx-rc"><div><b>' + ["A", "A–", "B+", "B"][mo % 4] + '</b><span>Discipline</span></div><div><b>' + (1.4 + (mo % 5) / 5).toFixed(1) + 'R</b><span>Avg winner</span></div><div><b>0.' + (6 + mo % 4) + 'R</b><span>Avg loser</span></div><div><b>' + (8 + mo % 6) + ' / 14</b><span>Stops honored</span></div></div><p class="fbx-mut">Best trade: $' + SYMS[mo % 12] + ' · Most traded: ' + SYMS[(mo + 3) % 12] + '</p></div>', M + " · report card"];
    var sym = SYMS[(i * 7) % SYMS.length], kd = KINDS[i % KINDS.length], C = candles(kd[1], 11 + i * 13, 50 + (hash(sym) % 400), kd[2], 0.01);
    return ['<div class="fbx-ex-pg"><h4>$' + sym + ' · ' + M + ' ' + (1 + (j % 28)) + ' · ' + kd[0] + '</h4>' + chartSVG({ C: C, W: 560, H: 290, ext: i % 5 === 1, vol: 1, ind: [["vwap", "ema9"], ["fib", "sma20"], ["vwap", "boll"], ["ema21", "pm"], ["or", "vwap"]][i % 5], marks: { entry: 1, stop: 1, target: 1, exit: 1, partial: i % 3 === 0, notes: i % 4 === 0 } }) + '</div>', M + " · trade " + (j) + " of 24"];
  }
  function pExample() {
    flipAt = Math.max(0, Math.min(EXN - 1, flipAt));
    var p = exPage(flipAt), vol = flipAt < 300 ? 1 : 2, thumbs = [];
    for (var t = Math.max(0, flipAt - 4); t <= Math.min(EXN - 1, flipAt + 4); t++) thumbs.push(t);
    return shell("example", '<section class="fbx-sec"><p class="fbx-kick">Example book</p><h1 class="fbx-h1">A real book. Hundreds of pages.</h1><p class="fbx-lead">A full year of trading fills about 300 pages. Your book starts slim and grows: add pages every week, and a second volume snaps into the same slipcase when you need it. Sample data shown.</p>' +
      '<div class="fbx-flip"><button type="button" class="fbx-arrow" data-fbflip="-1" aria-label="Previous page"' + (flipAt ? "" : " disabled") + '>&#8249;</button>' +
      '<div class="fbx-bookwrap"><div class="fbx-spine" style="--th:' + Math.max(8, Math.min(46, flipAt / EXN * 46)) + 'px"><span>Vol ' + vol + '</span></div><div class="fbx-sheet" key="' + flipAt + '">' + p[0] + '<span class="fbx-pno">' + (flipAt + 1) + '</span></div><div class="fbx-edge" style="--th:' + Math.max(6, (1 - flipAt / EXN) * 46) + 'px"></div></div>' +
      '<button type="button" class="fbx-arrow" data-fbflip="1" aria-label="Next page"' + (flipAt < EXN - 1 ? "" : " disabled") + '>&#8250;</button></div>' +
      '<div class="fbx-cap"><b>' + p[1] + '</b> &middot; page ' + (flipAt + 1) + ' of ' + EXN + '</div>' +
      '<div class="fbx-scrub"><span>1</span><input type="range" min="1" max="' + EXN + '" value="' + (flipAt + 1) + '" data-fbscrub="1" aria-label="Jump to page"><span>' + EXN + '</span></div>' +
      '<div class="fbx-thumbs">' + thumbs.map(function (t) { return '<button type="button" data-fbpage="' + t + '" class="' + (t === flipAt ? "on" : "") + '" aria-label="Page ' + (t + 1) + '"><i class="' + (t === 0 ? "cov" : (t - 2) % 26 === 0 ? "mo" : "") + '"></i><span>' + (t + 1) + '</span></button>'; }).join("") + '</div></section>');
  }

  /* ---------- build your book ---------- */
  function pBuild() {
    var signed = !!(window.stockspotAuth && window.stockspotAuth.email), T = D.style === "trading", F = frame(), CC = getCandles(F);
    var R = [["rth", "Intraday", "9:30am – 4pm"], ["ext", "Intraday + pre / after", "4am – 8pm"], ["multi", "A few days", "3 days"], ["swing", "Swing", "3 weeks"], ["custom", "&#9881; Custom", "any start + end"]];
    var RI = [["1m", "1 month"], ["3m", "3 months"], ["6m", "6 months"], ["1y", "1 year"], ["3y", "3 years"], ["5y", "5 years"], ["custom", "&#9881; Custom"]];
    var A = [["stocks", "&#128200; Stocks & ETFs"], ["futures", "&#128202; Futures"], ["options", "&#127922; Options"], ["crypto", "&#129689; Crypto"], ["forex", "&#128177; Forex"]];
    var custom = T ? D.range === "custom" : D.iRange === "custom";
    return shell("build", '<section class="fbx-sec"><p class="fbx-kick">Build your book</p><h1 class="fbx-h1">Four quick steps.</h1>' +
      '<div class="fbx-blk"><h3><b>1</b> Your account</h3><div class="fbx-row2"><div class="fbx-card' + (signed ? " ok" : "") + '"><h4>' + (signed ? "&#10003; Signed in" : "Create your account") + '</h4><p>' + (signed ? esc(window.stockspotAuth.email) : "Sign up free on Revatour to save your book.") + '</p></div>' +
      '<div class="fbx-card"><h4>&#128279; Link a broker (optional)</h4><p>Pull your trades and real charts automatically. Schwab works today.</p><button type="button" class="fbx-btn ghost sm" data-fbbroker="1">Open Connections</button></div></div></div>' +
      '<div class="fbx-blk"><h3><b>2</b> Which book, and what time frame?</h3><div class="fbx-row2"><button type="button" class="fbx-pick' + (T ? " on" : "") + '" data-fbset="style" data-v="trading"><span>&#9889;</span><b>Trading book</b><small>Up to 4 weeks · 1-minute to daily candles</small></button><button type="button" class="fbx-pick' + (!T ? " on" : "") + '" data-fbset="style" data-v="investing"><span>&#127793;</span><b>Investing book</b><small>1 month and up · daily and weekly candles</small></button></div>' +
      '<p class="fbx-lab2">What do you trade?</p><div class="fbx-chips">' + A.map(function (a) { return chip("asset", a[0], a[1], D.asset === a[0]); }).join("") + '</div>' +
      '<p class="fbx-lab2">Time frame</p><div class="fbx-chips">' + (T ? R.map(function (r) { return chip("range", r[0], '<b>' + r[1] + '</b> <small>' + r[2] + '</small>', D.range === r[0]); }) : RI.map(function (r) { return chip("iRange", r[0], '<b>' + r[1] + '</b>', D.iRange === r[0]); })).join("") + '</div>' +
      (custom && T ? '<div class="fbx-custom"><label>Start<input type="datetime-local" data-fbin="cFrom" value="' + esc(D.cFrom) + '"></label><label>End<input type="datetime-local" data-fbin="cTo" value="' + esc(D.cTo) + '"></label><label class="fbx-tg"><input type="checkbox" data-fbin="cExt"' + (D.cExt ? " checked" : "") + '> Include pre-market &amp; after hours</label>' +
        '<div class="fbx-quick">' + [["open", "Opening hour"], ["power", "Power hour"], ["pre", "Pre-market only"], ["day", "Full day"], ["3d", "Last 3 days"], ["2w", "Last 2 weeks"]].map(function (q) { return '<button type="button" data-fbq="' + q[0] + '">' + q[1] + '</button>'; }).join("") + '</div></div>' : '') +
      (T ? '<p class="fbx-lab2">Candle size</p><div class="fbx-chips fbx-cs">' + CSZ.map(function (c) { var on = String(D.cs || "auto") === String(c[0]); return chip("cs", c[0], c[0] === "auto" ? "Auto (" + fmtStep(F.auto) + ")" : c[1], on); }).join("") + '</div>' : '') +
      (custom && !T ? '<div class="fbx-custom"><label>From<input type="date" data-fbin="iFrom" value="' + esc(D.iFrom) + '"></label><label>To<input type="date" data-fbin="iTo" value="' + esc(D.iTo) + '"></label></div>' : '') +
      '<div class="fbx-frame"><div class="fbx-fhead"><div><b>$' + esc(tkr().t || "NVDA") + '</b> <span>' + esc(frameRange(F)) + '</span></div><span class="fbx-badge">' + esc(F.label) + '</span>' + (F.pages > 1 ? '<span class="fbx-badge warn">' + F.times.length + ' candles: prints across ' + F.pages + ' pages so they stay sharp</span>' : '') + (T && F.long ? '<span class="fbx-badge warn">Longer than 4 weeks: this prints in your Investing book <button type="button" data-fbset="style" data-v="investing">Switch</button></span>' : T ? '<span class="fbx-badge ok">&#10003; Fits the Trading book</span>' : '') + '</div>' + pageChart({ F: CC.F, C: CC.C, ind: [], W: 980, H: 200, demo: false }) + srcLine(CC) + '</div></div>' +
      '<div class="fbx-blk"><h3><b>3</b> Tickers and dates</h3><p class="fbx-mut">The first ticker is the one you design next. Add as many as you want printed, or paste lines like <code>NVDA, 2026-10-14</code>.</p><div class="fbx-tk">' +
      D.tickers.map(function (t) { return '<div class="fbx-tkr" data-tk="' + t.id + '"><input data-tkf="t" value="' + esc(t.t) + '" placeholder="Ticker (NVDA, ES)" maxlength="12" aria-label="Ticker"><input type="date" data-tkf="from" value="' + esc(t.from) + '" aria-label="Date"><input type="date" data-tkf="to" value="' + esc(t.to) + '" aria-label="End date (optional)"><select data-tkf="asset" aria-label="Type">' + A.map(function (a) { return '<option value="' + a[0] + '"' + (t.asset === a[0] ? " selected" : "") + '>' + a[1].replace(/&#\d+; /, "").replace("&amp;", "&") + '</option>'; }).join("") + '</select><button type="button" class="fbx-x" data-tkdel="' + t.id + '" aria-label="Remove">&#10005;</button></div>'; }).join("") +
      '</div><div class="fbx-cta sm"><button type="button" class="fbx-btn ghost sm" data-tkadd="1">+ Add a ticker</button><label class="fbx-btn ghost sm fbx-up">&#11014; Upload CSV<input type="file" accept=".csv,.txt" data-tkcsv="1" hidden></label></div>' +
      '<textarea class="fbx-paste" data-tkpaste="1" rows="2" placeholder="Paste a list here: TSLA, 2026-10-02 (one per line)"></textarea></div>' +
      '<div class="fbx-blk"><h3><b>4</b> Design the clear page</h3><p class="fbx-mut">Your prices, your indicators, your lines. It&rsquo;s the fun part.</p><button type="button" class="fbx-btn" data-fbgo="clear">Design my clear page &rarr;</button></div></section>');
  }

  var SPYC = {};
  function spyData(F) {
    var endD = new Date(F.times[F.times.length - 1]), end = Math.min(Date.now(), endD.getTime() + 864e5), days = { "1m": 31, "3m": 92, "6m": 183, "1y": 366, "2y": 731, "3y": 1096 }[D.spy] || 366, start = end - days * 864e5;
    if (D.spy === "custom") { if (D.spyFrom) start = pd(D.spyFrom).getTime(); if (D.spyTo) end = pd(D.spyTo).getTime() + 864e5; }
    var iv = (end - start) / 864e5 > 400 ? "1wk" : "1d", key = D.spy + "|" + Math.round(start / 864e5) + "|" + Math.round(end / 864e5), R = SPYC[key];
    if (!R) { var So = window.stockspotSocial; if (!So || !So.candles) return { msg: "Sign in to load SPY" }; R = SPYC[key] = { st: "loading" };
      So.candles({ symbol: "SPY", interval: iv, start: String(start), end: String(end) }).then(function (r) { SPYC[key] = r && r.candles && r.candles.length > 3 ? { st: "ok", C: r.candles } : { st: "err", msg: (r && r.error) || "No SPY data" }; if (host && cur === "clear") render(); }).catch(function () { SPYC[key] = { st: "err", msg: "Could not load SPY" }; }); }
    return R.st === "ok" ? { C: R.C } : { loading: R.st === "loading", msg: R.msg };
  }
  function spyChart(C, markA, markB) {
    var W = 980, H = 170, pl = 8, pr = 60, pt = 10, pb = 22, n = C.length, lo = Math.min.apply(null, C.map(function (c) { return c.l; })), hi = Math.max.apply(null, C.map(function (c) { return c.h; })), pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
    var X = function (i) { return pl + (i + 0.5) * (W - pl - pr) / n; }, Y = function (v) { return pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb); }, bw = Math.max(1, (W - pl - pr) / n * 0.62);
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="fbx-svg" role="img" aria-label="SPY daily candles">';
    for (var g = 0; g <= 3; g++) { var gy = pt + g * (H - pt - pb) / 3; s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + gy + '" y2="' + gy + '" stroke="#EEF0F3"/><text x="' + (W - pr + 6) + '" y="' + (gy + 3) + '" class="fbx-ax">' + (hi - (hi - lo) * g / 3).toFixed(0) + '</text>'; }
    if (markA) { var a = -1, b = -1, ny = function (t) { try { return new Date(t).toLocaleDateString("en-CA", { timeZone: "America/New_York" }); } catch (e) { return iso(new Date(t)); } }, dA = iso(new Date(markA)), dB = iso(new Date(markB)), weekly = n > 1 && (C[1].t - C[0].t) > 3 * 864e5;
      C.forEach(function (c, i) { var dc = ny(c.t); if (weekly) { var nx = C[i + 1] ? ny(C[i + 1].t) : "9999"; if (dc <= dB && nx > dA) { if (a < 0) a = i; b = i; } } else if (dc >= dA && dc <= dB) { if (a < 0) a = i; b = i; } }); if (a >= 0) s += '<rect x="' + (X(a) - bw) + '" y="' + pt + '" width="' + Math.max(4, X(b) - X(a) + bw * 2) + '" height="' + (H - pt - pb) + '" fill="#2F6FE4" opacity=".12"/><text x="' + X(a) + '" y="' + (pt + 10) + '" text-anchor="' + (X(a) > W - 140 ? "end" : "start") + '" class="fbx-tag" fill="#2F6FE4">&#9660; YOUR TRADE</text>'; }
    C.forEach(function (c, i) { var up = c.c >= c.o, col = up ? "#16A34A" : "#DC2626"; s += '<line x1="' + X(i).toFixed(1) + '" x2="' + X(i).toFixed(1) + '" y1="' + Y(c.h).toFixed(1) + '" y2="' + Y(c.l).toFixed(1) + '" stroke="' + col + '"/><rect x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + Y(Math.max(c.o, c.c)).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, Math.abs(Y(c.o) - Y(c.c))).toFixed(1) + '" fill="' + col + '"/>'; });
    var used = []; for (var k = 0; k < n; k += Math.max(1, Math.round(n / 7))) { var d = new Date(C[k].t), x = X(k); if (used.some(function (u) { return Math.abs(u - x) < 70; })) continue; used.push(x); s += '<text x="' + x + '" y="' + (H - 6) + '" text-anchor="' + (k === 0 ? "start" : "middle") + '" class="fbx-ax">' + MN[d.getMonth()] + ' ' + (n > 260 ? "'" + String(d.getFullYear()).slice(2) : d.getDate()) + '</text>'; }
    return s + '</svg>';
  }
  function srcLine(CC) { return CC.real ? '<p class="fbx-src">&#9679; Real ' + esc(CC.src) + ' candles' + (CC.note ? ' · ' + esc(CC.note) + ', so this uses a bigger candle' : '') + '.</p>' : CC.loading ? '<p class="fbx-src load">Loading the real candles for this day…</p>' : '<p class="fbx-src warn">Showing sample candles: ' + esc(CC.msg || "real data not loaded") + '.</p>'; }
  /* ---------- clear page designer ---------- */
  var INTRA_ONLY = ["pm", "or5", "or15", "or30", "kz", "sb", "ib", "on", "asr", "hodlod", "dopen", "svwap", "sess"];
  function pClear() {
    var F0 = frame(), CC = getCandles(F0), F = CC.F, C = CC.C, sym = tkr().t || "NVDA";
    var avail = IND.filter(function (x) { return fitsAsset(x) && (F.intra || INTRA_ONLY.indexOf(x[0]) < 0); });
    var q = indQ.trim().toLowerCase(), list = q ? avail.filter(function (x) { return (x[1] + " " + x[2]).toLowerCase().indexOf(q) >= 0; }) : indCat === "pop" ? POP.map(indDef).filter(function (x) { return x && avail.indexOf(x) >= 0; }) : avail.filter(function (x) { return x[2] === indCat; });
    var cats = CATS.filter(function (c) { return c[0] === "pop" || avail.some(function (x) { return x[2] === c[0]; }); });
    var sel = D.ind.filter(function (id) { var d = indDef(id); return d && fitsAsset(d); });
    var MK = [["entry", "&#128309; Entries"], ["exit", "&#9899; Exits"], ["partial", "&#9986; Partials"], ["stop", "&#128721; Stop"], ["target", "&#127919; Targets"], ["notes", "&#128221; Note"]];
    var execRows = (D.execs.length ? D.execs : []).map(function (e) { return '<div class="fbx-exr" data-ex="' + e.id + '"><select data-exf="side" aria-label="Buy or sell">' + [["buy", "Buy"], ["sell", "Sell"], ["short", "Short"], ["cover", "Cover"]].map(function (o) { return '<option value="' + o[0] + '"' + (e.side === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select><input data-exf="qty" type="number" min="0" step="any" value="' + esc(e.qty) + '" placeholder="Qty" aria-label="Quantity"><input data-exf="price" type="number" min="0" step="any" value="' + esc(e.price) + '" placeholder="Price" aria-label="Price"><button type="button" class="fbx-del" data-exdel="' + e.id + '" aria-label="Delete this row" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><input data-exf="time" type="datetime-local" value="' + esc(e.time) + '" aria-label="Time"></div>'; }).join("");
    var spyLbl = { "1m": "1 month", "3m": "3 months", "6m": "6 months", "1y": "1 year", "2y": "2 years", "3y": "3 years" };
    var SP = spyData(F0);
    var TOOLS = [["", "&#9995;", "Move"], ["h", "&#9472;", "Line"], ["t", "&#10187;", "Trendline"], ["z", "&#9645;", "Zone"], ["n", "&#9998;", "Note"], ["erase", "&#9003;", "Erase"]];
    return shell("clear", '<section class="fbx-sec"><p class="fbx-kick">The clear page</p><h1 class="fbx-h1">Design your overlay.</h1><p class="fbx-lead">Enter your real prices, pick your indicators, draw your own lines. Everything on the right prints on clear film that lays over the chart.</p>' +
      '<div class="fbx-clear"><div class="fbx-ctrl">' +
      '<div class="fbx-pnl"><h3><span>1</span> Your trade</h3>' +
      '<div class="fbx-sym"><select data-fbsym="1" aria-label="Ticker">' + D.tickers.filter(function (t) { return t.t; }).map(function (t) { return '<option value="' + t.id + '"' + (t === tkr() ? " selected" : "") + '>$' + esc(t.t) + (t.from ? " · " + esc(t.from) : "") + '</option>'; }).join("") + '</select><button type="button" class="fbx-btn sm schwab" data-fbschwab="1">&#9889; Use my Schwab trade</button></div><p class="fbx-hint" id="fbxsch"></p>' +
      '<div class="fbx-exh"><span>Side</span><span>Qty</span><span>Price</span><span></span></div>' + (execRows || '<p class="fbx-hint">No prices yet: the preview shows an example trade. Add your buys and sells below.</p>') +
      '<div class="fbx-cta sm"><button type="button" class="fbx-btn ghost sm" data-exadd="buy">+ Buy</button><button type="button" class="fbx-btn ghost sm" data-exadd="sell">+ Sell</button><button type="button" class="fbx-btn ghost sm" data-exadd="short">+ Short</button><button type="button" class="fbx-btn ghost sm" data-exadd="cover">+ Cover</button></div>' +
      '<div class="fbx-row3"><label for="fbxstop"><span class="fbx-lt">' + cdot("stop", "#DC2626") + ' Stop</span><input id="fbxstop" type="number" step="any" min="0" data-fbin="stop" value="' + esc(D.stop) + '" placeholder="e.g. 179.50"></label>' + D.targets.map(function (t, i) { return '<label for="fbxtg' + i + '"><span class="fbx-lt">' + (i ? "" : cdot("target", "#16A34A")) + ' Target ' + (D.targets.length > 1 ? i + 1 : "") + '</span><span class="fbx-inl"><input id="fbxtg' + i + '" type="number" step="any" min="0" data-tg="' + i + '" value="' + esc(t) + '" placeholder="e.g. 188">' + (i ? '<button type="button" class="fbx-x sm" data-tgdel="' + i + '" aria-label="Remove target">&#10005;</button>' : '') + '</span></label>'; }).join("") + '<button type="button" class="fbx-link" data-tgadd="1">+ another target</button></div>' +
      '<div class="fbx-rr"><label class="fbx-tg"><input type="checkbox" data-fbin="rr"' + (D.rr ? " checked" : "") + '> &#128208; Risk / reward box</label>' + (D.rr ? (function () { var R = rrVals(0, execList(), F); return '<div class="fbx-rrrow"><label>Entry<input type="number" step="any" min="0" data-fbin="rrEntry" value="' + esc(D.rrEntry) + '" placeholder="' + (R ? R.entry.toFixed(2) : "e.g. 182") + '"></label>' + rrOut(R) + '</div><p class="fbx-hint">Type Entry, Stop and Target, or drag the three lines on the chart.</p>'; })() : '') + '</div>' +
      '<label class="fbx-full">&#128221; Note on the page<input data-fbin="note" maxlength="90" value="' + esc(D.note) + '" placeholder="Why you took it, in one line"></label></div>' +
      '<div class="fbx-pnl"><h3><span>2</span> Indicators <small>' + sel.length + ' on' + (sel.length > 6 ? ' · 6 or fewer reads cleanest' : '') + '</small></h3>' +
      '<p class="fbx-lab2" style="margin-top:0!important">Start from a style <small class="fbx-hint">one tap</small></p><div class="fbx-pregrid">' + PRESETS.concat((D.strats || []).map(function (s) { return ["my:" + s.id, "&#9733; " + esc(s.name), s.ind]; })).map(function (p) { var on = p[2].length === sel.length && p[2].every(function (x) { return sel.indexOf(x) >= 0; }); return '<button type="button" class="fbx-pre' + (on ? " on" : "") + '" data-fbpre="' + p[0] + '"><b>' + p[1] + '</b><small>' + p[2].map(function (x) { var d = indDef(x); return d ? esc(d[1]) : ""; }).filter(Boolean).slice(0, 4).join(" · ") + '</small></button>'; }).join("") + '</div>' +
      '<p class="fbx-lab2">Or pick one by one <small class="fbx-hint">tap to turn on or off</small></p>' +
      (sel.length ? '<div class="fbx-tray"><div class="fbx-trh"><b>On your chart</b><small>tap a color dot to change it</small><button type="button" class="fbx-link" data-indclear="1">Clear all</button></div>' + sel.map(function (id) { var d = indDef(id); return '<span class="fbx-sel" style="--c:' + d[4] + '">' + cdot(id, indDef0(id)[4]) + '<em>' + esc(d[1]) + '</em><button type="button" data-fbset="ind" data-v="' + esc(id) + '" aria-label="Remove ' + esc(d[1]) + '" title="Remove"><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></span>'; }).join("") +
        (sel.some(function (id) { var d = indDef(id); return d && d[3] === "zone"; }) ? '<div class="fbx-zlen"><span>Zone length</span>' + [["short", "Short"], ["fill", "Until price fills it"], ["edge", "All the way right"]].map(function (z) { return '<button type="button" data-fbset="zlen" data-v="' + z[0] + '" class="' + ((D.zlen || "fill") === z[0] ? "on" : "") + '">' + z[1] + '</button>'; }).join("") + '</div>' : '') + '</div>' : '') +
      '<input type="search" class="fbx-isearch" data-indq="1" value="' + esc(indQ) + '" placeholder="&#128269; Search ' + avail.length + ' indicators (VWAP, FVG, RSI…)" aria-label="Search indicators">' +
      (q ? '' : '<div class="fbx-cats">' + cats.map(function (c) { return '<button type="button" data-indcat="' + c[0] + '" class="' + (indCat === c[0] ? "on" : "") + '">' + c[1] + '</button>'; }).join("") + '</div>') +
      '<div class="fbx-itiles">' + list.map(function (x) { var on = sel.indexOf(x[0]) >= 0; return '<button type="button" class="fbx-itile' + (on ? " on" : "") + '" data-fbset="ind" data-v="' + esc(x[0]) + '" aria-pressed="' + on + '" style="--c:' + x[4] + '"><i class="ck">' + (on ? "&#10003;" : "") + '</i><b>' + esc(x[1]) + '</b><span class="sw"></span></button>'; }).join("") + (list.length ? "" : '<p class="fbx-hint">No match. Try another word.</p>') + '</div>' +
      (sel.indexOf("fibr") >= 0 ? '<p class="fbx-lab2">Fibonacci levels</p><div class="fbx-chips">' + [0.236, 0.382, 0.5, 0.618, 0.705, 0.786].map(function (f) { return chip("fib", f, (f * 100).toFixed(1).replace(".0", "") + "%", D.fib.indexOf(f) >= 0); }).join("") + '</div>' : '') +
      '<details class="fbx-cma"><summary>+ Build your own moving average</summary><div class="fbx-cmar"><select data-cmat aria-label="Type"><option value="ema">EMA</option><option value="sma">SMA</option><option value="wma">WMA</option><option value="hma">Hull</option><option value="dema">DEMA</option><option value="tema">TEMA</option></select><input data-cman type="number" min="2" max="400" value="34" aria-label="Length"><input data-cmac type="color" value="#0EA5E9" aria-label="Color"><button type="button" class="fbx-btn sm" data-cmaadd="1">Add</button></div></details></div>' +
      '<div class="fbx-pnl"><h3><span>3</span> Your strategy</h3><p class="fbx-hint">Name it, write your rules, draw your own lines on the chart, then save it to reuse on every page.</p>' +
      '<input data-strat="name" value="' + esc(D.strat.name) + '" placeholder="Strategy name (e.g. VWAP reclaim)" maxlength="40"><textarea data-strat="entry" rows="2" placeholder="Entry rules" maxlength="400">' + esc(D.strat.entry) + '</textarea><textarea data-strat="exit" rows="2" placeholder="Exit + stop rules" maxlength="400">' + esc(D.strat.exit) + '</textarea>' +
      '<div class="fbx-cta sm"><button type="button" class="fbx-btn sm" data-stsave="1">&#9733; Save strategy</button>' + (D.strats.length ? D.strats.map(function (s) { return '<span class="fbx-mystrat">' + esc(s.name) + '<button type="button" data-stdel="' + s.id + '" aria-label="Delete strategy">&#10005;</button></span>'; }).join("") : '') + '</div></div>' +
      '<div class="fbx-pnl"><h3><span>4</span> What prints</h3><div class="fbx-chips">' + MK.map(function (m) { return chip("mark", m[0], m[1], D.marks[m[0]]); }).join("") + '</div>' +
      '<p class="fbx-lab2">S&amp;P 500 (SPY) context page</p><div class="fbx-chips">' + [["1m", "1M"], ["3m", "3M"], ["6m", "6M"], ["1y", "1Y"], ["2y", "2Y"], ["3y", "3Y"], ["custom", "Custom"], ["off", "Off"]].map(function (s) { return chip("spy", s[0], s[1], D.spy === s[0]); }).join("") + '</div>' +
      (D.spy === "custom" ? '<div class="fbx-row3"><label>From<input type="date" data-fbin="spyFrom" value="' + esc(D.spyFrom) + '"></label><label>To<input type="date" data-fbin="spyTo" value="' + esc(D.spyTo) + '"></label></div>' : '') +
      (D.spy !== "off" ? '<label class="fbx-tg"><input type="checkbox" data-fbin="spyMarks"' + (D.spyMarks ? " checked" : "") + '> Mark my trades on the SPY chart</label>' : '') + '</div>' +
      '</div><div class="fbx-prev"><div class="fbx-prevcard"><div class="fbx-pgh"><b>$' + esc(sym) + '</b><span>' + esc(frameRange(F)) + ' · ' + esc(F.label) + '</span><em class="' + (CC.real ? "real" : CC.loading ? "load" : "") + '">' + (CC.real ? "&#9679; Real candles · " + esc(CC.src) : CC.loading ? "Loading real candles…" : "Sample candles") + '</em></div>' +
      (D.strat.name ? '<div class="fbx-stratbar">&#9733; ' + esc(D.strat.name) + (D.strat.entry ? ' · <span>' + esc(D.strat.entry.slice(0, 80)) + '</span>' : '') + '</div>' : '') +
      (D.style === "trading" ? '<div class="fbx-csbar"><span>Candles</span>' + CSZ.map(function (c) { var on = String(D.cs || "auto") === String(c[0]); return '<button type="button" data-fbset="cs" data-v="' + c[0] + '" class="' + (on ? "on" : "") + '">' + (c[0] === "auto" ? "Auto" : c[1]) + '</button>'; }).join("") + '</div>' : '') +
      '<div class="fbx-tools" role="toolbar" aria-label="Drawing tools">' + TOOLS.map(function (t) { return '<button type="button" data-fbtool="' + t[0] + '" class="' + (tool === t[0] ? "on" : "") + '" title="' + t[2] + '"><span>' + t[1] + '</span>' + t[2] + '</button>'; }).join("") +
      '<span class="fbx-cols">' + ["#2F6FE4", "#16A34A", "#DC2626", "#F59E0B", "#7C4DCC", "#0B0B0C"].map(function (c) { return '<button type="button" data-fbcol="' + c + '" class="' + (dcol === c ? "on" : "") + '" style="background:' + c + '" aria-label="Color"></button>'; }).join("") + '</span><input class="fbx-dlab" data-fbdlab="1" placeholder="Label" maxlength="24" aria-label="Label for new lines">' + (D.draw.length ? '<button type="button" class="fbx-link" data-drawclear="1">Clear lines</button>' : '') + '</div>' +
      '<div class="fbx-cwrap">' + pageChart({ F: F, C: C, ind: sel, W: 980, H: 380 }) + '</div>' + srcLine(CC) + '<p class="fbx-hint">' + (tool === "h" ? "Click the chart to drop a line." : tool === "t" || tool === "z" ? "Press and drag on the chart." : tool === "n" ? "Click where the note goes." : tool === "erase" ? "Click a line or zone to erase it." : "Drag your own lines up or down to move them.") + '</p></div>' +
      (D.spy !== "off" ? '<div class="fbx-prevcard sm"><div class="fbx-pgh"><b>SPY</b><span>' + (D.spy === "custom" ? (D.spyFrom || "start") + " → " + (D.spyTo || "today") : spyLbl[D.spy]) + ' · context page</span></div>' + (SP.C ? spyChart(SP.C, D.spyMarks ? F.times[0] : null, F.times[F.times.length - 1]) : '<p class="fbx-src ' + (SP.loading ? "load" : "warn") + '">' + (SP.loading ? "Loading real SPY candles…" : esc(SP.msg || "Could not load SPY")) + '</p>') + '</div>' : '') + '</div></div></section>');
  }

  /* ---------- pricing ---------- */
  var TIERS = [["starter", "Starter", 79, 150, "1.5\" ring binder, linen hardcover", ["Holds up to 150 pages", "20 page sleeves + 10 clear pages to start", "Name and year on the cover", "First month of pages included"]], ["pro", "Pro", 129, 350, "3\" D-ring, vegan leather, gold foil", ["Holds up to 350 pages (a full year)", "40 page sleeves + 25 clear pages", "Numbered spine, ribbon marker", "First month of pages included"]], ["archive", "Archive", 199, 700, "2-volume slipcase set", ["Holds up to 700 pages", "Two Pro volumes in an archival slipcase", "Year tabs + index pages", "First month of pages included"]]];
  var CAD = { weekly: [12, "/week", "5 trade pages + 5 clear pages every Friday", 260], monthly: [29, "/month", "12 trade pages + month report card + SPY page + 12 clear pages", 168], quarterly: [79, "/quarter", "36 trade pages + quarter report + SPY pages + 36 clear pages · save 9%", 160] };
  function pPricing() {
    var cad = D.cadence, t = TIERS.filter(function (x) { return x[0] === D.tier; })[0] || TIERS[1], perYr = CAD[cad][3], fits = perYr <= t[3];
    return shell("pricing", '<section class="fbx-sec"><p class="fbx-kick">Pricing</p><h1 class="fbx-h1">One book that grows. Fresh pages on your schedule.</h1>' +
      '<h3 class="fbx-h3">1 · Your book (one time)</h3><div class="fbx-price">' +
      TIERS.map(function (x) { return '<button type="button" class="fbx-plan' + (D.tier === x[0] ? " on" : "") + '" data-fbset="tier" data-v="' + x[0] + '">' + (x[0] === "pro" ? '<em>Most loved</em>' : '') + '<b>' + x[1] + '</b><span class="fbx-amt">$' + x[2] + '</span><small class="fbx-cap2">' + x[4] + '</small><div class="fbx-capbar"><i style="width:' + (x[3] / 700 * 100) + '%"></i><span>' + x[3] + ' pages</span></div><ul>' + x[5].map(function (y) { return '<li>' + y + '</li>'; }).join("") + '</ul></button>'; }).join("") + '</div>' +
      '<div class="fbx-addon"><b>&#10133; Add a volume anytime</b> · +350 pages in a matching binder · $49. Your spine numbers continue: Vol 1, Vol 2, Vol 3…</div>' +
      '<h3 class="fbx-h3">2 · Your pages (subscription)</h3><div class="fbx-seg">' + ["weekly", "monthly", "quarterly"].map(function (c) { return '<button type="button" data-fbset="cadence" data-v="' + c + '" class="' + (cad === c ? "on" : "") + '">' + c[0].toUpperCase() + c.slice(1) + '</button>'; }).join("") + '</div>' +
      '<div class="fbx-sub"><span class="fbx-amt">$' + CAD[cad][0] + '<small>' + CAD[cad][1] + '</small></span><p>' + CAD[cad][2] + '</p><p class="fbx-mut">Trading or Investing book. Extra page packs: 10 pages for $9. Pause or cancel anytime. Free US shipping.</p></div>' +
      '<div class="fbx-fill"><div><b>~' + perYr + '</b><span>pages a year on ' + cad + '</span></div><div class="fbx-fillbar"><i style="width:' + Math.min(100, perYr / t[3] * 100) + '%" class="' + (fits ? "" : "over") + '"></i></div><div><b>' + t[3] + '</b><span>fit in ' + t[1] + '</span></div><p class="fbx-mut">' + (fits ? "&#10003; A full year fits in your " + t[1] + " book." : "Your year needs about " + Math.ceil(perYr / 350) + " volume" + (perYr > 350 ? "s" : "") + ". Pick Archive or add a volume when it fills up.") + '</p></div>' +
      '<div class="fbx-total"><div><small>First order</small><b>$' + t[2] + '</b><span>' + t[1] + ' book, ships with month one</span></div><div><small>Then</small><b>$' + CAD[cad][0] + CAD[cad][1] + '</b><span>' + cad + ' pages</span></div>' +
      '<div class="fbx-cta"><input type="email" data-fbin="email" value="' + esc(D.email) + '" placeholder="Email for early access" aria-label="Email"><button type="button" class="fbx-btn" data-fbreserve="1">Reserve my book</button></div><p class="fbx-mut" style="margin:6px 0 0">No charge today. Reserving saves your choices to your account.</p></div></section>');
  }

  /* ---------- goals (private planning) ---------- */
  function pGoals() {
    var g = D.goals, c = g.cost, subs = Math.ceil(g.rev / 12 / Math.max(1, g.price)), costMo = g.perMonth * (+c.page + +c.film) + +c.ship, marg = g.price - costMo, mp = marg / g.price * 100;
    var MS = [10, 100, 1000, 10000, 50000, subs];
    var num = function (k, v, pre, step) { return '<label class="fbx-gin">' + pre + '<input type="number" step="' + (step || 1) + '" min="0" data-goal="' + k + '" value="' + v + '"></label>'; };
    return shell("goals", '<section class="fbx-sec"><p class="fbx-kick">Goals &middot; private</p><h1 class="fbx-h1">The $50 million plan.</h1><p class="fbx-lead">Change any number and the plan updates. Only you can see this page.</p>' +
      '<div class="fbx-goalgrid"><div class="fbx-gcard"><h3>Revenue goal</h3>' + num("rev", g.rev, "$ a year", 1000000) + num("price", g.price, "$ per month, per subscriber", 1) + num("book", g.book, "$ average book price", 1) + '</div>' +
      '<div class="fbx-gcard"><h3>Cost per subscriber, per month</h3>' + num("perMonth", g.perMonth, "pages a month", 1) + num("c.page", c.page, "$ print per page", 0.05) + num("c.film", c.film, "$ clear film per page", 0.05) + num("c.ship", c.ship, "$ shipping a month", 0.5) + num("c.binder", c.binder, "$ binder (one time)", 1) + '</div></div>' +
      '<div class="fbx-math"><div><b>' + subs.toLocaleString() + '</b><span>subscribers needed</span></div><div class="op">&times;</div><div><b>$' + g.price + '</b><span>a month</span></div><div class="op">=</div><div><b>$' + (subs * g.price * 12 / 1e6).toFixed(1) + 'M</b><span>a year in pages</span></div><div class="op">+</div><div><b>$' + (subs * g.book / 1e6).toFixed(1) + 'M</b><span>in books (one time)</span></div></div>' +
      '<div class="fbx-unit"><div><small>Cost a month</small><b>$' + costMo.toFixed(2) + '</b></div><div><small>Profit a month</small><b class="' + (marg >= 0 ? "g" : "r") + '">$' + marg.toFixed(2) + '</b></div><div><small>Gross margin</small><b>' + mp.toFixed(0) + '%</b></div><div><small>Book profit</small><b>$' + (g.book - c.binder).toFixed(0) + '</b></div></div>' +
      '<h3 class="fbx-h3">Milestones</h3><div class="fbx-ms">' + MS.map(function (m) { var k = String(m), on = !!g.ms[k]; return '<button type="button" class="fbx-msr' + (on ? " on" : "") + '" data-ms="' + k + '"><i>' + (on ? "&#10003;" : "") + '</i><b>' + m.toLocaleString() + ' subscribers</b><span>$' + Math.round(m * g.price * 12).toLocaleString() + ' a year</span></button>'; }).join("") + '</div>' +
      '<p class="fbx-mut" style="margin-top:12px">Unit costs are estimates to confirm with a print partner.</p></section>');
  }

  /* ---------- render + events ---------- */
  function render() {
    if (!host) return;
    var f = { home: pHome, example: pExample, build: pBuild, clear: pClear, pricing: pPricing, goals: pGoals, ideas: pIdeas }[cur] || pHome;
    var keep = host.querySelector(".fbx-ctrl"), sc = keep ? keep.scrollTop : 0;
    host.innerHTML = f();
    PAGES.forEach(function (p) { var b = document.getElementById(p[2]); if (b) b.classList.toggle("on", p[0] === cur); });
  }
  function go(p) { cur = p; tool = ""; render(); try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { window.scrollTo(0, 0); } }
  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
  function localDT(ms) { var d = new Date(ms); return iso(d) + "T" + pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
  function addTickers(text) {
    var n = 0; String(text || "").split(/\r?\n/).forEach(function (ln) {
      var p = ln.split(/[,\t;]+/).map(function (x) { return x.trim(); }); if (!p[0] || /ticker|symbol/i.test(p[0])) return;
      var t = p[0].replace(/^\$/, "").toUpperCase().slice(0, 12); if (!/^[A-Z0-9.\/=!-]{1,12}$/.test(t)) return;
      var d = (p[1] || "").replace(/\//g, "-"), m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(d); if (m) d = m[3] + "-" + pad2(m[1]) + "-" + pad2(m[2]);
      var dd = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ""; if (D.tickers.some(function (x) { return x.t === t && x.from === dd; })) return;
      D.tickers.push({ id: uid(), t: t, from: dd, to: /^\d{4}-\d{2}-\d{2}$/.test(p[2] || "") ? p[2] : "", asset: D.asset }); n++;
    });
    D.tickers = D.tickers.filter(function (t) { return t.t; }).slice(0, 500); saveD(); render(); toast(n ? "Added " + n + " ticker" + (n > 1 ? "s" : "") : "No tickers found. Use lines like NVDA, 2026-10-14");
  }
  function quick(q) {
    var day = baseDay(), set = function (a, b, ext) { D.cFrom = a; D.cTo = b; D.cExt = !!ext; };
    if (q === "open") set(day + "T09:30", day + "T10:30");
    else if (q === "power") set(day + "T15:00", day + "T16:00");
    else if (q === "pre") set(day + "T04:00", day + "T09:30", true);
    else if (q === "day") set(day + "T09:30", day + "T16:00");
    else if (q === "3d") { var d3 = backDays(day, 3); set(d3[0] + "T09:30", day + "T16:00"); }
    else if (q === "2w") { var d10 = backDays(day, 10); set(d10[0] + "T09:30", day + "T16:00"); }
    saveD(); render();
  }
  /* Schwab: pull the real fills for this ticker + the real candles for this time frame */
  async function useSchwab() {
    var msg = function (t) { var e = host.querySelector("#fbxsch"); if (e) e.innerHTML = t; };
    var So = window.stockspotSocial; if (!So || !So.schwab) { msg("Sign in to Revatour first."); return; }
    msg("Checking your Schwab connection…");
    var st; try { st = await So.schwab("status"); } catch (e) { st = null; }
    if (!st || !st.configured) { msg("Schwab isn&rsquo;t set up on this site yet."); return; }
    if (!st.connected) { msg('Connect Schwab first: <button type="button" class="fbx-link" data-fbbroker="1">Settings &rarr; Connections</button>'); return; }
    var F = frame(), sym = (tkr().t || "").toUpperCase(), from = iso(new Date(F.times[0])), to = iso(new Date(F.times[F.times.length - 1]));
    msg("Pulling your " + sym + " trades from Schwab (" + from + (to !== from ? " to " + to : "") + ")…");
    var r; try { r = await So.schwab("trades", { from: from, to: to }); } catch (e) { msg("Could not reach Schwab. Try again in a minute."); return; }
    if (r.reconnect) { msg('Your Schwab sign-in expired. <button type="button" class="fbx-link" data-fbbroker="1">Reconnect</button>'); return; }
    var fills = (r.fills || []).filter(function (f) { return String(f.symbol).toUpperCase() === sym; }), others = Array.from(new Set((r.fills || []).map(function (f) { return f.symbol; }))).filter(function (s) { return s !== sym; });
    if (fills.length) {
      D.execs = fills.map(function (f) { var open = /OPEN/.test(f.effect); return { id: uid(), side: f.side === "BUY" ? (open ? "buy" : "cover") : (open ? "sell" : "sell"), qty: f.qty, price: f.price, time: f.ms ? localDT(f.ms) : "" }; });
      D.execs.forEach(function (e, i) { var f = fills[i]; if (f.side === "SELL" && /OPEN/.test(f.effect)) e.side = "short"; });
      saveD();
    }
    // real candles
    var stepMs = typeof F.step === "number" ? F.step * 6e4 : F.step === "W" ? 7 * 864e5 : 864e5, ft = typeof F.step === "number" ? "minute" : F.step === "W" ? "weekly" : "daily";
    var fq = typeof F.step === "number" ? ([30, 15, 10, 5, 1].filter(function (x) { return F.step % x === 0; })[0] || 1) : 1, h = null;
    try { h = await So.schwab("history", { symbol: sym, start: String(F.times[0] - 864e5 * (ft === "minute" ? 0 : 7)), end: String(F.times[F.times.length - 1] + stepMs), ft: ft, fq: String(fq), ext: F.ext ? "1" : "0" }); } catch (e) { h = null; }
    var got = h && h.candles && h.candles.length ? h.candles : null;
    if (got) {
      var B = F.times.map(function (t) { return null; }), j = 0;
      got.forEach(function (k) { while (j < F.times.length - 1 && k.t >= F.times[j + 1]) j++; if (k.t < F.times[0] || k.t >= F.times[j] + stepMs) return; var b = B[j]; if (!b) B[j] = { t: F.times[j], o: k.o, h: k.h, l: k.l, c: k.c, v: k.v }; else { b.h = Math.max(b.h, k.h); b.l = Math.min(b.l, k.l); b.c = k.c; b.v += k.v; } });
      var last = null; B = B.map(function (b, i) { if (b) { last = b; return b; } var p = last ? last.c : got[0].o; return { t: F.times[i], o: p, h: p, l: p, c: p, v: 0 }; });
      var mx = Math.max.apply(null, B.map(function (b) { return b.v; })) || 1; B.forEach(function (b) { b.v = b.v / mx * 1.6 + 0.05; });
      REAL = B; REALKEY = sym + "|" + F.times[0] + "|" + F.times.length + "|" + F.step;
    }
    render();
    msg((fills.length ? "&#10003; Loaded " + fills.length + " Schwab fill" + (fills.length > 1 ? "s" : "") + " for $" + sym + ". " : "No $" + sym + " trades in this time frame." + (others.length ? " You traded: " + others.slice(0, 8).map(function (s) { return '<button type="button" class="fbx-link" data-fbswap="' + esc(s) + '">$' + esc(s) + '</button>'; }).join(" ") : "") + " ") + (got ? "Real candles loaded." : h && h.noMarket ? "Real candles need Schwab&rsquo;s Market Data access, so the chart shows sample candles." : ""));
  }
  function svgPoint(ev) { var svg = host.querySelector("#fbxchart"); if (!svg || !G) return null; var p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; var m = svg.getScreenCTM(); if (!m) return null; var q = p.matrixTransform(m.inverse()); return { x: q.x, y: q.y, price: G.y2p(q.y), i: Math.max(0, Math.min(G.n - 1, Math.round((q.x - G.pl) / ((G.W - G.pl - G.pr) / G.n) - 0.5))) }; }
  function onDown(ev) {
    if (!host || cur !== "clear") return;
    var svg = ev.target.closest && ev.target.closest("#fbxchart"); if (!svg) return;
    var p = svgPoint(ev); if (!p) return;
    var lab = (host.querySelector("[data-fbdlab]") || {}).value || "";
    if (tool === "erase") { var g0 = ev.target.closest("[data-dw]"); if (g0) { D.draw = D.draw.filter(function (d) { return d.id !== g0.dataset.dw; }); saveD(); render(); } return; }
    if (tool === "h") { D.draw.push({ id: uid(), k: "h", p1: +p.price.toFixed(2), col: dcol, label: lab }); saveD(); render(); return; }
    if (tool === "n") { var t = prompt("Note text", lab || ""); if (t) { D.draw.push({ id: uid(), k: "n", i1: p.i, p1: p.price, label: t.slice(0, 60), col: dcol }); saveD(); render(); } return; }
    if (tool === "t" || tool === "z") { ev.preventDefault(); drag = { mode: "new", d: { id: uid(), k: tool, i1: p.i, i2: p.i, p1: p.price, p2: p.price, col: dcol, label: lab } }; return; }
    if (!tool) { var rg = ev.target.closest("[data-rr]"); if (rg) { ev.preventDefault(); drag = { mode: "rr", k: rg.dataset.rr }; return; } }
    if (!tool) { var g = ev.target.closest("[data-dw]"); if (g) { var d0 = D.draw.filter(function (d) { return d.id === g.dataset.dw; })[0]; if (d0 && (d0.k === "h" || d0.k === "z" || d0.k === "t" || d0.k === "n")) { ev.preventDefault(); drag = { mode: "move", d: d0, sp: p.price, si: p.i, o: JSON.parse(JSON.stringify(d0)) }; } } }
  }
  var mvT = 0;
  function onMove(ev) {
    if (!drag) return; var p = svgPoint(ev); if (!p) return; ev.preventDefault();
    if (drag.mode === "rr") { var pv = +p.price.toFixed(2); if (drag.k === "entry") D.rrEntry = pv; else if (drag.k === "stop") D.stop = pv; else { D.targets = D.targets.length ? D.targets : [""]; D.targets[0] = pv; } }
    else if (drag.mode === "new") { drag.d.i2 = p.i; drag.d.p2 = p.price; }
    else { var dp = p.price - drag.sp, di = p.i - drag.si; drag.d.p1 = drag.o.p1 + dp; if (drag.o.p2 != null) drag.d.p2 = drag.o.p2 + dp; if (drag.o.i1 != null && drag.d.k !== "h") { drag.d.i1 = Math.max(0, drag.o.i1 + di); if (drag.o.i2 != null) drag.d.i2 = Math.max(0, drag.o.i2 + di); } }
    if (!mvT) mvT = requestAnimationFrame(function () { mvT = 0; var w = host.querySelector(".fbx-cwrap"); if (!w) return; if (drag && drag.mode === "new" && D.draw.indexOf(drag.d) < 0) { D.draw.push(drag.d); drag.added = true; } var CC = getCandles(frame()); w.innerHTML = pageChart({ F: CC.F, C: CC.C, ind: D.ind.filter(function (id) { var d = indDef(id); return d && fitsAsset(d); }), W: 980, H: 380 }); });
  }
  function onUp() { if (!drag) return; var d = drag; drag = null; if (d.mode === "rr") {} else if (d.mode === "new") { if (D.draw.indexOf(d.d) < 0) D.draw.push(d.d); if (d.d.i1 === d.d.i2 && Math.abs(d.d.p1 - d.d.p2) < 1e-9) D.draw = D.draw.filter(function (x) { return x !== d.d; }); } else { ["p1", "p2"].forEach(function (k) { if (d.d[k] != null) d.d[k] = +(+d.d[k]).toFixed(2); }); } saveD(); render(); }
  function onClick(ev) {
    var b = ev.target.closest("button"); if (!b || !host.contains(b)) return;
    var d = b.dataset;
    if (d.fbgo) return go(d.fbgo);
    if (d.fbflip) { flipAt += +d.fbflip; return render(); }
    if (d.fbpage) { flipAt = +d.fbpage; return render(); }
    if (d.fbset) {
      var g = d.fbset, v = d.v;
      if (g === "style") { D.style = v; if (v === "trading" && D.range === "custom") {} else D.range = D.range || "rth"; }
      else if (g === "mark") D.marks[v] = !D.marks[v];
      else if (g === "ind") toggleIn(D.ind, v);
      else if (g === "fib") { toggleIn(D.fib, +v); D.fib.sort(); }
      else D[g] = v;
      REAL = null; saveD(); return render();
    }
    if (d.fbq) return quick(d.fbq);
    if (d.fbbroker) { var s = document.getElementById("navset"); if (s) s.click(); setTimeout(function () { var c = document.getElementById("st-conn"); if (c) c.scrollIntoView({ behavior: "smooth" }); }, 400); return; }
    if (d.fbschwab) { useSchwab(); return; }
    if (d.fbswap) { var tk = D.tickers.filter(function (x) { return x.t === d.fbswap; })[0]; if (!tk) { tk = { id: uid(), t: d.fbswap, from: baseDay(), to: "", asset: D.asset }; D.tickers.push(tk); } D.tickers = [tk].concat(D.tickers.filter(function (x) { return x !== tk; })); saveD(); REAL = null; render(); useSchwab(); return; }
    if (d.tkadd) { D.tickers.push({ id: uid(), t: "", from: baseDay(), to: "", asset: D.asset }); saveD(); render(); var ins = host.querySelectorAll('[data-tkf="t"]'); if (ins.length) ins[ins.length - 1].focus(); return; }
    if (d.tkdel) { D.tickers = D.tickers.filter(function (t) { return t.id !== d.tkdel; }); saveD(); return render(); }
    if (d.exadd) { var F = frame(), ex = execList(), li = ex.length ? idxAt(F, ex[ex.length - 1].time) : null, lastT = localDT(F.times[Math.min(F.times.length - 1, li != null ? li + Math.max(3, Math.round(F.times.length / 6)) : Math.floor(F.times.length * 0.3))]), lastP = ex.length ? ex[ex.length - 1].price : ""; D.execs.push({ id: uid(), side: d.exadd, qty: ex.length ? ex[0].qty : 100, price: lastP, time: lastT }); saveD(); render(); var pr = host.querySelectorAll('[data-exf="price"]'); if (pr.length) pr[pr.length - 1].focus(); return; }
    if (d.exdel) { D.execs = D.execs.filter(function (e) { return e.id !== d.exdel; }); saveD(); return render(); }
    if (d.tgadd) { D.targets.push(""); saveD(); return render(); }
    if (d.tgdel) { D.targets.splice(+d.tgdel, 1); saveD(); return render(); }
    if (d.fbpre) { var pre = PRESETS.filter(function (p) { return p[0] === d.fbpre; })[0]; if (!pre && /^my:/.test(d.fbpre)) { var st = D.strats.filter(function (x) { return "my:" + x.id === d.fbpre; })[0]; if (st) { D.ind = st.ind.slice(); D.fib = (st.fib || D.fib).slice(); D.strat = { name: st.name, entry: st.entry, exit: st.exit, risk: st.risk || "" }; if (st.draw) D.draw = JSON.parse(JSON.stringify(st.draw)); } } else if (pre) { var isOn = pre[2].length === D.ind.length && pre[2].every(function (x) { return D.ind.indexOf(x) >= 0; }); D.ind = isOn ? [] : pre[2].slice(); saveD(); toast(isOn ? "Style turned off" : "Style applied"); return render(); } saveD(); toast("Preset applied"); return render(); }
    if (d.indclear) { D.ind = []; saveD(); return render(); }
    if (d.indcat) { indCat = d.indcat; return render(); }
    if (d.cmaadd) { var t2 = host.querySelector("[data-cmat]").value, n2 = Math.max(2, Math.min(400, +host.querySelector("[data-cman]").value || 34)), c2 = host.querySelector("[data-cmac]").value; var id = "cma:" + t2 + ":" + n2 + ":" + c2; if (D.ind.indexOf(id) < 0) D.ind.push(id); saveD(); toast(t2.toUpperCase() + " " + n2 + " added"); return render(); }
    if (d.stsave) { if (!D.strat.name.trim()) { toast("Give your strategy a name first"); var nm = host.querySelector('[data-strat="name"]'); if (nm) nm.focus(); return; } var ex2 = D.strats.filter(function (x) { return x.name.toLowerCase() === D.strat.name.trim().toLowerCase(); })[0], obj = { id: ex2 ? ex2.id : uid(), name: D.strat.name.trim(), entry: D.strat.entry, exit: D.strat.exit, ind: D.ind.slice(), fib: D.fib.slice(), draw: JSON.parse(JSON.stringify(D.draw)) }; if (ex2) D.strats[D.strats.indexOf(ex2)] = obj; else D.strats.push(obj); saveD(); toast("Strategy saved. It's now a preset."); return render(); }
    if (d.stdel) { D.strats = D.strats.filter(function (x) { return x.id !== d.stdel; }); saveD(); return render(); }
    if (d.fbtool != null) { tool = d.fbtool; return render(); }
    if (d.fbcol) { dcol = d.fbcol; return render(); }
    if (d.drawclear) { if (!confirm("Remove all your drawn lines?")) return; D.draw = []; saveD(); return render(); }
    if (d.fbreserve) { if (D.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(D.email)) { toast("Check that email"); return; } D.reserved = Date.now(); saveD(); toast("Reserved! Your choices are saved. No charge."); return; }
    if (d.ms) { D.goals.ms[d.ms] = !D.goals.ms[d.ms]; saveD(); return render(); }
    if (d.ifil) { ideaF = d.ifil; return render(); }
    var it = function (id) { return I.items.filter(function (x) { return x.id === id; })[0]; };
    if (d.idone) { var x = it(d.idone); x.s = x.s === "done" ? "open" : "done"; saveI(); return render(); }
    if (d.icut) { var y = it(d.icut); y.s = y.s === "cut" ? "open" : "cut"; saveI(); render(); if (y.s === "cut") { var w = host.querySelector('[data-iwhy="' + y.id + '"]'); if (w) w.focus(); } return; }
    if (d.idel) { if (!confirm("Delete this idea?")) return; I.items = I.items.filter(function (z) { return z.id !== d.idel; }); saveI(); return render(); }
  }
  var rT = 0;
  function later() { clearTimeout(rT); var a0 = document.activeElement; if (cur === "clear" && a0 && a0.closest && a0.closest(".fbx-ctrl") && /^(number|text|search|datetime-local|date|time)$/.test(a0.type || "")) { rT = setTimeout(function () { if (!softPreview()) render(); }, 250); return; } rT = setTimeout(function () { var a = document.activeElement, sel = a && a.dataset ? Object.keys(a.dataset)[0] : null, key = sel ? '[data-' + sel.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); }) + '="' + a.dataset[sel] + '"]' : null, row = a && a.closest && a.closest("[data-ex],[data-tk]"), rk = row ? (row.dataset.ex ? '[data-ex="' + row.dataset.ex + '"] ' : '[data-tk="' + row.dataset.tk + '"] ') : "", pos = a && a.selectionStart; render(); if (key) { var n = host.querySelector(rk + key); if (n) { n.focus(); try { if (pos != null) n.setSelectionRange(pos, pos); else if (n.type === "number") { var vv = n.value; n.type = "text"; n.setSelectionRange(vv.length, vv.length); n.type = "number"; } } catch (e) {} } } }, 450); }
  function onInput(ev) {
    var t = ev.target; if (!host || !host.contains(t)) return;
    var row = t.closest("[data-tk]");
    if (row && t.dataset.tkf) { var k = D.tickers.filter(function (x) { return x.id === row.dataset.tk; })[0]; if (k) { k[t.dataset.tkf] = t.dataset.tkf === "t" ? t.value.toUpperCase().replace(/^\$/, "") : t.value; REAL = null; saveD(); if (t.dataset.tkf !== "t") later(); } return; }
    var er = t.closest("[data-ex]");
    if (er && t.dataset.exf) { var e = D.execs.filter(function (x) { return x.id === er.dataset.ex; })[0]; if (e) { e[t.dataset.exf] = t.value; saveD(); later(); } return; }
    if (t.dataset.tg != null) { D.targets[+t.dataset.tg] = t.value; saveD(); later(); return; }
    if (t.dataset.strat) { D.strat[t.dataset.strat] = t.value; saveD(); if (t.dataset.strat === "name") later(); return; }
    if (t.dataset.indq != null) { indQ = t.value; later(); return; }
    if (t.dataset.fbscrub) { flipAt = +t.value - 1; clearTimeout(onInput.s); onInput.s = setTimeout(function () { render(); var r = host.querySelector("[data-fbscrub]"); if (r) r.focus(); }, 60); return; }
    if (t.dataset.goal) { var v = +t.value; if (!isFinite(v)) return; if (/^c\./.test(t.dataset.goal)) D.goals.cost[t.dataset.goal.slice(2)] = v; else D.goals[t.dataset.goal] = v; saveD(); later(); return; }
    if (t.dataset.fbin) { D[t.dataset.fbin] = t.type === "checkbox" ? t.checked : t.value; REAL = null; saveD(); if (t.type === "checkbox" || /date|time/.test(t.type) || t.dataset.fbin === "stop" || t.dataset.fbin === "note" || t.dataset.fbin === "rrEntry") later(); return; }
    if (t.dataset.icol) { D.icol[t.dataset.icol] = t.value; var dot = t.parentNode; if (dot) dot.style.background = t.value; saveD(); clearTimeout(onInput.c); onInput.c = setTimeout(function () { var w = host.querySelector(".fbx-cwrap"); if (w) { var CC = getCandles(frame()); w.innerHTML = pageChart({ F: CC.F, C: CC.C, ind: D.ind.filter(function (id) { var d = indDef(id); return d && fitsAsset(d); }), W: 980, H: 380 }); } }, 40); return; }
    if (t.dataset.iwhy) { var x = I.items.filter(function (z) { return z.id === t.dataset.iwhy; })[0]; if (x) { x.why = t.value; clearTimeout(onInput.t); onInput.t = setTimeout(saveI, 500); } }
  }
  function onChange(ev) {
    var t = ev.target; if (!host || !host.contains(t)) return;
    if (t.dataset.fbsym) { var tk = D.tickers.filter(function (x) { return x.id === t.value; })[0]; if (tk) { D.tickers = [tk].concat(D.tickers.filter(function (x) { return x !== tk; })); D.execs = []; REAL = null; saveD(); render(); } return; }
    if (t.dataset.tkcsv && t.files && t.files[0]) { var fr = new FileReader(); fr.onload = function () { addTickers(fr.result); }; fr.readAsText(t.files[0]); return; }
    if (t.dataset.tkpaste != null && t.value.trim()) { var v = t.value; t.value = ""; setTimeout(function () { addTickers(v); }, 0); return; }
    if (t.matches("[data-iacat]") && t.value === "New category…") { var n = prompt("New category name"); if (n) { var o = document.createElement("option"); o.textContent = n.slice(0, 30); t.insertBefore(o, t.lastChild); t.value = o.textContent; } else t.selectedIndex = 0; }
  }
  function onSubmit(ev) {
    var f = ev.target; if (!host || !host.contains(f) || !f.dataset.fbiadd) return; ev.preventDefault();
    var tx = f.querySelector("[data-iatxt]").value.trim(); if (!tx) return;
    I.items.push({ id: uid(), c: f.querySelector("[data-iacat]").value, t: tx, s: "open", why: "" }); saveI(); render(); toast("Idea added");
  }
  function onKey(ev) {
    if (!host || host.hidden || !host.offsetParent) return;
    if (/input|textarea|select/i.test(ev.target.tagName)) return;
    if (cur === "example") { if (ev.key === "ArrowRight") { flipAt++; render(); } else if (ev.key === "ArrowLeft") { flipAt--; render(); } }
    if (cur === "clear" && ev.key === "Escape" && tool) { tool = ""; render(); }
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
      ".fbx-svg{width:100%;height:auto;display:block}.fbx-ax{font:700 9px Inter,sans-serif;fill:#9AA0A8;letter-spacing:.08em}.fbx-lab{font:700 9.5px Inter,sans-serif;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}.fbx-rrl{cursor:ns-resize}.fbx-tag{font:800 10px Inter,sans-serif;letter-spacing:.06em}.fbx-note{font:600 9.5px Inter,sans-serif;fill:#6B5A12}",
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
      ".fbx-bookwrap{display:flex;align-items:stretch;width:min(860px,100%)}.fbx-spine{width:var(--th);min-width:8px;border-radius:8px 0 0 8px;background:linear-gradient(90deg,#0B0B0C,#2A2A2E);display:flex;align-items:flex-end;justify-content:center;padding-bottom:10px;transition:width .3s}.fbx-spine span{writing-mode:vertical-rl;transform:rotate(180deg);color:var(--gold);font:700 10px Inter,sans-serif;letter-spacing:.14em}.fbx-edge{width:var(--th);min-width:6px;margin:8px 0;border-radius:0 6px 6px 0;background:repeating-linear-gradient(90deg,#fff 0 1px,#E5E7EB 1px 2px);box-shadow:inset -1px 0 0 #D6D8DD;transition:width .3s}.fbx-bookwrap .fbx-sheet{flex:1;width:auto;border-radius:2px}.fbx-pno{position:absolute;bottom:10px;right:16px;font:600 11px Inter,sans-serif;color:#9AA0A8}",
      ".fbx-scrub{display:flex;align-items:center;gap:12px;max-width:640px;margin:14px auto 0;color:var(--g);font-size:12px}.fbx-scrub input{flex:1;accent-color:#0B0B0C;padding:0!important;border:0!important}",
      ".fbx-thumbs{display:flex;justify-content:center;gap:8px;margin-top:14px;flex-wrap:wrap}.fbx-thumbs button{border:0;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--g);font:600 11px Inter,sans-serif}.fbx-thumbs i{display:block;width:46px;height:32px;border-radius:3px;background:linear-gradient(#fff,#fff) padding-box;border:1px solid #E2E4E8;box-shadow:0 2px 6px rgba(0,0,0,.06);background-image:linear-gradient(transparent 60%,#E9F7EE 60%)}.fbx-thumbs i.cov{background:#0B0B0C}.fbx-thumbs i.mo{background:#F6F2EA}.fbx-thumbs .on i{outline:2px solid #0B0B0C;outline-offset:2px}.fbx-thumbs .on{color:var(--k)}",
      ".fbx-toc{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.fbx-toc button{border:1px solid var(--h);background:#FAFAFB;border-radius:12px;padding:10px 12px;text-align:left;cursor:pointer;font:inherit;display:flex;justify-content:space-between}.fbx-toc span{color:var(--g);font-size:12px}",
      ".fbx-custom{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-top:14px;padding:16px;border-radius:18px;background:#F7F8FA}.fbx-custom label{display:flex!important;flex-direction:column;gap:4px;font:600 12px Inter,sans-serif;color:var(--g)}.fbx-custom label input{width:auto!important}.fbx-custom .fbx-tg{flex-direction:row!important}.fbx-quick{display:flex;gap:6px;flex-wrap:wrap;flex-basis:100%}.fbx-quick button{border:1px solid #E2E4E8;background:#fff;border-radius:999px;padding:6px 12px;font:600 12px Inter,sans-serif;cursor:pointer;color:var(--k)}.fbx-quick button:hover{border-color:var(--k)}",
      ".fbx-frame{margin-top:16px;border:1px solid var(--h);border-radius:20px;padding:14px 16px;background:#fff}.fbx-fhead{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin-bottom:6px}.fbx-fhead>div{flex:1;min-width:200px}.fbx-fhead b{font:700 18px Fraunces,serif}.fbx-fhead span{color:var(--g);font-size:13px}.fbx-badge{font:700 12px Inter,sans-serif!important;padding:5px 10px;border-radius:999px;background:#F2F3F5;color:var(--k)!important}.fbx-badge.ok{background:#EAF7EF;color:#15803D!important}.fbx-badge.warn{background:#FFF4E5;color:#B45309!important}.fbx-badge button{border:0;background:#B45309;color:#fff;border-radius:999px;padding:2px 8px;margin-left:6px;cursor:pointer;font:700 11px Inter,sans-serif}",
      ".fbx-clear{grid-template-columns:minmax(360px,440px) minmax(0,1fr)!important}.fbx-pnl{border:1px solid var(--h);border-radius:20px;padding:18px;margin-bottom:14px;background:#fff}.fbx-pnl>h3{display:flex!important;align-items:center;gap:10px;font:700 16px Inter,sans-serif!important;margin:0 0 12px!important}.fbx-pnl>h3>span{width:26px;height:26px;border-radius:50%;background:var(--k);color:#fff;display:grid;place-items:center;font-size:12px}.fbx-pnl>h3 small{font-weight:500;color:var(--g);font-size:12px}",
      ".fbx-hint{color:var(--g);font-size:12.5px;margin:6px 0!important}.fbx-sym{display:flex;gap:8px}.fbx-sym select{flex:1}.fbx-btn.schwab{background:linear-gradient(135deg,#00A0DF,#0072CE);border-color:#0072CE;white-space:nowrap}",
      ".fbx-exh,.fbx-exr{display:grid;grid-template-columns:minmax(70px,90px) minmax(56px,80px) minmax(0,1fr) 34px;gap:6px;align-items:center}.fbx-exr{padding:8px;border:1px solid #EEF0F3;border-radius:12px;background:#FCFCFD}.fbx-exr input,.fbx-exr select{min-width:0;width:100%}.fbx-exr [data-exf=time]{grid-column:1/-1}.fbx-del{width:34px;height:34px;border:0;border-radius:10px;background:#F4F5F7;color:#8A9099;display:grid;place-items:center;cursor:pointer;transition:all .15s}.fbx-del:hover{background:#FDE8E8;color:#C2364A}.fbx-exh{margin-top:10px;font:700 10.5px Inter,sans-serif;color:var(--g);letter-spacing:.06em;text-transform:uppercase}.fbx-exr{margin-top:6px}.fbx-exr input,.fbx-exr select{padding:7px 8px!important;font-size:13px!important}.fbx-x.sm{width:28px;height:28px}",
      ".fbx-row3{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-top:12px}.fbx-row3 label,.fbx-full{display:flex!important;flex-direction:column;gap:4px;font:600 12px Inter,sans-serif;color:var(--g);flex:1;min-width:120px}.fbx-full{margin-top:10px}.fbx-inl{display:flex;gap:4px;align-items:center}.fbx-link{border:0;background:none;color:var(--bl);font:600 12.5px Inter,sans-serif;cursor:pointer;padding:4px 2px}",
      ".fbx-pregrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-bottom:6px}.fbx-pre{text-align:left;display:flex;flex-direction:column;gap:3px;min-width:0;overflow:hidden;border:1.5px solid #E2E4E8;background:#fff;border-radius:14px;padding:10px 12px;font:600 13px Inter,sans-serif;cursor:pointer;color:var(--k);transition:all .15s}.fbx-pre b{overflow-wrap:anywhere}.fbx-pre small{display:block;max-width:100%;font:500 11px/1.35 Inter,sans-serif;color:var(--g);white-space:normal;overflow-wrap:anywhere}.fbx-pre.on small{color:#C7C9CF}",
      ".fbx-itiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px}.fbx-itile{display:flex;align-items:center;gap:9px;text-align:left;border:1.5px solid #E7E9EC;background:#fff;border-radius:12px;padding:9px 10px;font:600 13px Inter,sans-serif;color:var(--k);cursor:pointer;transition:all .12s;min-width:0}.fbx-itile b{flex:1;min-width:0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fbx-itile .ck{flex:0 0 20px;height:20px;border-radius:6px;border:2px solid #C9CDD3;display:grid;place-items:center;font-style:normal;font-size:12px;color:#fff;font-weight:800}.fbx-itile .sw{flex:0 0 14px;height:4px;border-radius:2px;background:var(--c)}.fbx-itile:hover{border-color:#B9BDC5}.fbx-itile.on{border-color:var(--c);background:color-mix(in srgb,var(--c) 7%,#fff)}.fbx-itile.on .ck{background:var(--c);border-color:var(--c)}",
      ".fbx-src{font:600 12px Inter,sans-serif;color:#15803D;margin:6px 0 0!important}.fbx-src.load{color:var(--g)}.fbx-src.warn{color:#B45309}.fbx-pgh em.load{background:#F2F3F5}",
      ".fbx-dummy{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px;scrollbar-width:thin}.fbx-predummy{flex:0 0 auto;border:1px solid #E2E4E8;background:linear-gradient(180deg,#fff,#F7F8FA);border-radius:14px;padding:9px 12px;font:600 12.5px Inter,sans-serif;cursor:pointer;color:var(--k);transition:all .15s}.fbx-pre:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(0,0,0,.06)}.fbx-pre.on{background:var(--k);color:#fff;border-color:var(--k)}",
      ".fbx-tray{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px;border-radius:14px;background:#F7F8FA;margin-bottom:10px}.fbx-trh{flex:1 1 100%;display:flex;align-items:baseline;gap:8px;margin-bottom:2px}.fbx-trh b{font:700 12px Inter,sans-serif}.fbx-trh small{color:var(--g);font-size:11px;flex:1}.fbx-sel{display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid #E2E4E8;border-left:3px solid var(--c);border-radius:10px;padding:5px 5px 5px 8px;font:600 12px Inter,sans-serif;max-width:100%}.fbx-sel em{font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}.fbx-sel button{flex:0 0 22px;border:0;background:transparent;border-radius:7px;width:22px;height:22px;cursor:pointer;color:#9AA0A8;display:grid;place-items:center;transition:all .12s}.fbx-sel button:hover{background:#FDE8E8;color:#C2364A}",
      ".fbx-cdot{position:relative;flex:0 0 14px;width:14px;height:14px;border-radius:50%;display:inline-block;box-shadow:0 0 0 2px #fff,0 0 0 3px #E2E4E8;cursor:pointer;vertical-align:-2px}.fbx-cdot input{position:absolute;inset:-4px;opacity:0;cursor:pointer;width:22px;height:22px;padding:0;border:0}",
      ".fbx-zlen{flex:1 1 100%;display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-top:6px;font:600 11.5px Inter,sans-serif}.fbx-zlen span{color:var(--g);margin-right:4px}.fbx-zlen button{border:1px solid #E2E4E8;background:#fff;border-radius:999px;padding:5px 10px;font:600 11.5px Inter,sans-serif;cursor:pointer;color:var(--k)}.fbx-zlen button.on{background:#0B0B0C;color:#fff;border-color:#0B0B0C}",
      ".fbx-rr{margin-top:12px;padding:10px 12px;border:1px solid #EEF0F3;border-radius:12px;background:#FCFCFD}.fbx-rrrow{display:flex;gap:12px;align-items:flex-end;margin-top:8px;flex-wrap:wrap}.fbx-rrrow label{flex:1 1 120px}.fbx-rrout{display:flex;flex-direction:column;background:#0B0B0C;color:#fff;border-radius:10px;padding:6px 12px}.fbx-rrout b{font:800 16px Inter,sans-serif}.fbx-rrout small{font-size:11px;color:#C7C9CF}",
      ".fbx{padding-bottom:110px}.fbx-lt{display:inline-flex;align-items:center;gap:7px}",
      ".fbx-isearch{margin-bottom:8px!important}.fbx-cats{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px}.fbx-cats button{border:0;background:#F2F3F5;color:var(--g);border-radius:999px;padding:6px 11px;font:600 12px Inter,sans-serif;cursor:pointer}.fbx-cats .on{background:var(--k);color:#fff}.fbx-pnl .fbx-chip{padding:7px 11px;font-size:12.5px}",
      ".fbx-cma{margin-top:12px}.fbx-cma summary{cursor:pointer;color:var(--bl);font:600 13px Inter,sans-serif}.fbx-cmar{display:grid;grid-template-columns:1fr 70px 46px auto;gap:6px;margin-top:8px}.fbx-cmar input[type=color]{padding:2px!important;height:38px}",
      ".fbx-pnl>input,.fbx-pnl>textarea{margin-bottom:8px!important}.fbx-mystrat{display:inline-flex;align-items:center;gap:6px;background:#F6F2EA;color:#7A5B2A;border-radius:999px;padding:4px 4px 4px 12px;font:600 12px Inter,sans-serif}.fbx-mystrat button{border:0;background:none;color:#7A5B2A;cursor:pointer}",
      ".fbx-pgh em{margin-left:auto;font-style:normal;font:700 11px Inter,sans-serif;padding:4px 10px;border-radius:999px;background:#F2F3F5;color:var(--g)}.fbx-pgh em.real{background:#EAF7EF;color:#15803D}.fbx-pgh{flex-wrap:wrap}.fbx-stratbar{font:700 13px Inter,sans-serif;color:#7A5B2A;background:#F6F2EA;border-radius:10px;padding:6px 10px;margin:4px 0 8px}.fbx-stratbar span{font-weight:500}",
      ".fbx-tools{display:flex;gap:4px;flex-wrap:wrap;align-items:center;padding:6px;border-radius:14px;background:#F7F8FA;margin:6px 0 8px}.fbx-tools>button{border:0;background:none;border-radius:10px;padding:6px 10px;font:600 12px Inter,sans-serif;cursor:pointer;color:var(--k);display:flex;align-items:center;gap:5px}.fbx-tools>button span{font-size:15px}.fbx-tools>button.on{background:#0B0B0C;color:#fff}.fbx-cols{display:flex;gap:4px;margin-left:6px}.fbx-cols button{width:20px;height:20px;border-radius:50%;border:2px solid #fff;cursor:pointer;box-shadow:0 0 0 1px #E2E4E8}.fbx-cols .on{box-shadow:0 0 0 2px #0B0B0C}.fbx-dlab{width:110px!important;padding:6px 10px!important;font-size:12px!important;margin-left:6px!important}",
      ".fbx-csbar{display:flex;gap:2px;flex-wrap:wrap;align-items:center;background:#F2F3F5;border-radius:12px;padding:4px;margin:4px 0 2px}.fbx-csbar span{font:700 11px Inter,sans-serif;color:var(--g);padding:0 8px;text-transform:uppercase;letter-spacing:.08em}.fbx-csbar button{border:0;background:none;border-radius:8px;padding:5px 9px;font:600 12px Inter,sans-serif;cursor:pointer;color:var(--g)}.fbx-csbar button.on{background:#fff;color:var(--k);box-shadow:0 1px 4px rgba(0,0,0,.12)}",
      ".fbx-cwrap{border-radius:14px;overflow:hidden}.fbx-big.drawing{cursor:crosshair}.fbx-big.t-erase [data-dw]{cursor:not-allowed}.fbx-big:not(.drawing) [data-dw]{cursor:ns-resize}.fbx-big .hit{pointer-events:stroke}.fbx-ax.b{font-weight:800;fill:#3D4048}",
      ".fbx-cap2{display:block;color:var(--g);font-size:13px;margin:-4px 0 10px}.fbx-capbar{position:relative;height:22px;border-radius:999px;background:#F2F3F5;margin-bottom:12px;overflow:hidden}.fbx-capbar i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#D9C4A0,#B08D57)}.fbx-capbar span{position:relative;font:700 11px Inter,sans-serif;line-height:22px;padding-left:10px;color:#3D2E14}",
      ".fbx-addon{margin-top:12px;padding:14px 18px;border-radius:16px;background:#F7F8FA;font-size:14px;color:#3D4048}",
      ".fbx-fill{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:14px;padding:16px 20px;border-radius:20px;border:1px solid var(--h);max-width:760px}.fbx-fill>div:not(.fbx-fillbar){min-width:90px}.fbx-fill b{display:block;font:700 24px Fraunces,serif}.fbx-fill span{font-size:12px;color:var(--g)}.fbx-fillbar{flex:1;min-width:160px;height:12px;border-radius:99px;background:#F2F3F5;overflow:hidden}.fbx-fillbar i{display:block;height:100%;background:linear-gradient(90deg,#16A34A,#4ADE80)}.fbx-fillbar i.over{background:linear-gradient(90deg,#F59E0B,#DC2626)}.fbx-fill .fbx-mut{flex-basis:100%}",
      ".fbx-goalgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin:22px 0}.fbx-gcard{border:1px solid var(--h);border-radius:20px;padding:18px}.fbx-gcard h3{font:700 16px Inter,sans-serif!important;margin-bottom:10px!important}.fbx-gin{display:flex!important;flex-direction:row-reverse!important;justify-content:flex-end;align-items:center;gap:10px;font-size:13px;color:var(--g);margin:6px 0}.fbx-gin input{width:130px!important}",
      ".fbx-unit{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:8px 0 0}.fbx-unit div{border-radius:16px;background:#FAFAFB;border:1px solid var(--h);padding:14px}.fbx-unit small{color:var(--g);font-size:12px}.fbx-unit b{display:block;font:700 26px Fraunces,serif}.fbx-unit b.g{color:#16A34A}.fbx-unit b.r{color:#DC2626}",
      ".fbx-ms{display:flex;flex-direction:column;gap:8px;max-width:720px}.fbx-msr{display:grid;grid-template-columns:28px 1fr auto;gap:12px;align-items:center;border:1px solid var(--h);background:#fff;border-radius:16px;padding:12px 14px;cursor:pointer;font:inherit;text-align:left;color:var(--k)}.fbx-msr i{width:26px;height:26px;border-radius:8px;border:2px solid #C9CDD3;display:grid;place-items:center;font-style:normal;color:#fff;font-weight:800}.fbx-msr.on i{background:#16A34A;border-color:#16A34A}.fbx-msr.on b{text-decoration:line-through;color:var(--g)}.fbx-msr span{color:var(--g);font-size:13px}",
      "@media(prefers-reduced-motion:reduce){.fbx-stage,.fbx-ace,.fbx-gloss,.fbx-sheet{animation:none!important}}"
    ].join("");
    document.head.appendChild(s);
  }


  var wired = false;
  window.FbSite = {
    pages: PAGES,
    mount: async function (el, page) {
      host = el; css();
      if (!wired) { wired = true; document.addEventListener("click", function (e) { if (host && host.contains(e.target)) onClick(e); }); document.addEventListener("input", onInput); document.addEventListener("change", onChange); document.addEventListener("submit", onSubmit); document.addEventListener("keydown", onKey); document.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove, { passive: false }); window.addEventListener("pointerup", onUp); }
      if (page) cur = page;
      if (!loaded) { el.innerHTML = '<div class="fbx"><p style="padding:40px 0;color:#6B6F76">Loading…</p></div>'; await load(); }
      render();
    }
  };
})();
