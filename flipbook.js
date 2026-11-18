/* Flipbook: your retirement as a coffee-table book, one month at a time.
   Market data comes from flipbook-data.js (public). Your own numbers are private:
   they are saved to your account settings (or this browser when signed out). */
(function () {
  "use strict";
  var D = window.FLIPBOOK_DATA;
  var KEY = "flipbook", LKEY = "ss-flipbook";
  var ST = { tab: "book", page: 0, clear: false, cfg: null, acct: null, loaded: false, years: 30, extra: 100, rate: 7 };
  var MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var CAT = { "Market": "#2F6BD8", "Economy": "#7046C2", "Companies": "#C45A1C", "World": "#0F7C7C", "Hedge funds": "#B02E56", "Crypto": "#8A5A10" };
  var INK = "#1B2333", MUT = "#586172", GRN = "#17845B", RED = "#C93A30", ORG = "#E0672B", BLU = "#2F6BD8", YEL = "#F5C543";

  /* ---------- what can go in the book (the checklist) ---------- */
  var GROUPS = [
    { n: "The big picture", items: [["big", "“You started here” page", "The stock market since 2000 with a flag on the month you started"]] },
    { n: "Every month: the chart page", items: [
      ["blurbs", "News & economy stories", "Numbered pins on the candles with short, plain-English stories"],
      ["mood", "Market mood meter", "How scared or calm investors were that month"],
      ["sectors", "Sector scoreboard", "Which parts of the market won and lost"],
      ["econ", "Economy dashboard", "Fed rate, inflation, jobs and oil at a glance"],
      ["history", "This month in history", "A famous market moment from the same month"]] },
    { n: "Every month: clear pages", items: [
      ["clear", "You vs. the market", "Your 401(k) line over the candles, with your buys, match and dividends"],
      ["panic", "“If you’d panicked”", "What selling in the worst month would have cost you"],
      ["top", "How far from the top", "How close you are to your all-time high"]] },
    { n: "Every month: proud pages", items: [
      ["month", "Your month", "What you put in, your company match and earnings"],
      ["paycheck", "Your paycheck became…", "Where your last deposit went, fund by fund"],
      ["own", "What you actually own", "Your slice of Nvidia, Apple, Microsoft and more"],
      ["vest", "Match, vesting & limit tracker", "How much of the match is yours and how much room is left this year"],
      ["race", "The race", "Your 401(k) vs. the market, inflation and cash"],
      ["report", "12-month report card", "Every month vs. the market, green when you beat it"],
      ["heading", "Where you’re heading + what-ifs", "Add $25, $50, $100 or $200 a month and see the difference"]] },
    { n: "Collectibles & extras", items: [
      ["stickers", "Milestone stickers", "Earned stickers mailed with your pages"],
      ["learn", "Learn-it card", "One easy money lesson every month"],
      ["specials", "Specials", "Quarterly poster, year in review, tax-time page, letter to future you"],
      ["qr", "QR code on every page", "Opens your live numbers on Revatour"]] }
  ];
  var ALL = []; GROUPS.forEach(function (g) { g.items.forEach(function (i) { ALL.push(i[0]); }); });
  function defCfg() { var c = { on: {}, start: null, freq: "m" }; ALL.forEach(function (k) { c.on[k] = true; }); return c; }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function money(v, d) { v = +v || 0; return (v < 0 ? "−" : "") + "$" + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: d == null ? 0 : d, maximumFractionDigits: d == null ? 0 : d }); }
  function pct(v, d) { v = +v || 0; return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(d == null ? 1 : d) + "%"; }
  function on(k) { return !!(ST.cfg && ST.cfg.on[k]); }
  function A() { return ST.acct || D.sample; }
  function isSample() { return !ST.acct; }
  function total() { return A().plans.reduce(function (t, p) { return t + (+p.bal || 0); }, 0); }
  function spDollars() { return A().plans.reduce(function (t, p) { return t + (p.sp500 != null ? (p.sp500 <= 1 ? p.sp500 * p.bal : p.sp500) : 0); }, 0); }
  function mkey() { var ks = Object.keys(D.months).sort(); return ST.mk && D.months[ST.mk] ? ST.mk : ks[ks.length - 1]; }
  function month() { return D.months[mkey()]; }
  function mFull() { return (month().label || "").split(" ")[0]; }
  function mShort() { return mFull().slice(0, 3); }
  function inMo(L) { var mm = mkey().slice(5); return (L || []).filter(function (d) { return d.d && d.d.slice(0, 2) === mm; }); }
  function startIdx() {
    var s = (ST.cfg && ST.cfg.start) || A().start || "2019-06", m = /^(\d{4})-(\d\d)$/.exec(s), N = D.spyMonthly.length;
    if (!m) return N - 1; var i = (+m[1] - 2000) * 12 + (+m[2] - 1); return Math.max(0, Math.min(N - 1, i));
  }
  function monthName(i) { return MN[i % 12] + " " + (2000 + Math.floor(i / 12)); }
  function toast(t) { try { var e = document.createElement("div"); e.className = "fb-toast"; e.textContent = t; document.body.appendChild(e); setTimeout(function () { e.remove(); }, 2600); } catch (x) {} }

  /* ---------- storage: private to each user ---------- */
  function load() {
    var P = window.StockPrefs, done = function (d) {
      d = d || {}; ST.cfg = Object.assign(defCfg(), d.cfg || {}); ST.cfg.on = Object.assign(defCfg().on, (d.cfg && d.cfg.on) || {}); ST.acct = d.acct || null; ST.loaded = true; render();
    };
    if (P && P.ready && P.ready()) { ST.remote = true; P.get(KEY).then(function (d) { if (!d) { try { d = JSON.parse(localStorage.getItem(LKEY) || "null"); } catch (e) {} } done(d); }); }
    else { var d = null; try { d = JSON.parse(localStorage.getItem(LKEY) || "null"); } catch (e) {} done(d); }
  }
  function save() {
    var d = { cfg: ST.cfg, acct: ST.acct, ts: Date.now() }, tries = 0;
    try { localStorage.setItem(LKEY, JSON.stringify(d)); } catch (e) {}
    (function push() { var P = window.StockPrefs; if (P && P.ready && P.ready()) { P.set(KEY, d); ST.remote = true; } else if (tries++ < 20) setTimeout(push, 1500); })();
  }
  /* If we first loaded from this browser, pick up the copy saved to the account once sign-in finishes. */
  function syncRemote() {
    var P = window.StockPrefs; if (ST.remote || !P || !P.ready || !P.ready()) return; ST.remote = true;
    P.get(KEY).then(function (d) {
      var mine = null; try { mine = JSON.parse(localStorage.getItem(LKEY) || "null"); } catch (e) {}
      if (d && (!mine || (d.ts || 0) > (mine.ts || 0))) { ST.cfg = Object.assign(defCfg(), d.cfg || {}); ST.cfg.on = Object.assign(defCfg().on, (d.cfg && d.cfg.on) || {}); ST.acct = d.acct || null; render(); }
      else if (mine && (!d || (mine.ts || 0) > (d.ts || 0))) P.set(KEY, mine);
    });
  }
  /* One-time private import link: revatour.com/#flipbook=<data>. The data stays in the link and your own account. */
  function importFromHash(txt) {
    var m = /flipbook=([A-Za-z0-9_\-]+)/.exec(txt || location.hash || ""); if (!m) return false;
    try {
      var b = m[1].replace(/-/g, "+").replace(/_/g, "/"); while (b.length % 4) b += "=";
      var j = JSON.parse(decodeURIComponent(escape(atob(b))));
      var go = function () {
        ST.acct = j.acct || null; if (j.start) { ST.cfg = ST.cfg || defCfg(); ST.cfg.start = j.start; }
        save(); if (/flipbook=/.test(location.hash || "")) history.replaceState(null, "", location.pathname + location.search); toast("Your 401(k) numbers were saved to your Flipbook");
        var b2 = document.getElementById("navflip"); if (b2) b2.click();
      };
      var tries = 0; (function wait() { if (ST.loaded || tries > 40) go(); else { tries++; setTimeout(wait, 250); } })();
      return true;
    } catch (e) { return false; }
  }

  /* ---------- the pages ---------- */
  var PW = 1500;
  function paper(kicker, title, sub, inner, opts) {
    opts = opts || {};
    return '<article class="fb-paper' + (opts.cls ? " " + opts.cls : "") + '"><div class="fb-holes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
      '<header class="fb-ph"><div><div class="fb-kick">' + kicker + '</div><h2 class="fb-title">' + title + '</h2>' + (sub ? '<div class="fb-sub">' + sub + '</div>' : "") + '</div>' + (opts.right || "") + '</header>' +
      inner + '<footer class="fb-foot"><span>For education and fun — <b>not investment advice</b>. Past results don’t promise future ones.</span>' +
      (on("qr") ? '<span class="fb-qr" title="Scan to open your live numbers"><svg viewBox="0 0 21 21" aria-hidden="true">' + qrArt() + '</svg>Live on Revatour</span>' : "") + '</footer></article>';
  }
  function qrArt() { var s = "", seed = 7; for (var y = 0; y < 21; y++) for (var x = 0; x < 21; x++) { var f = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); var edge = f && (x % 20 === 0 || y % 20 === 0 || x === 6 || y === 6 || x === 14 || y === 14 || (x > 1 && x < 5 && y > 1 && y < 5) || (x > 15 && x < 19 && y > 1 && y < 5) || (x > 1 && x < 5 && y > 15 && y < 19)); seed = (seed * 9301 + 49297) % 233280; if (edge || (!f && seed / 233280 > 0.55)) s += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>'; } return s; }
  function stat(k, v, s, c) { return '<div class="fb-stat"><small>' + k + '</small><b style="color:' + (c || INK) + '">' + v + '</b><span>' + s + '</span></div>'; }
  function sampleNote() { return isSample() ? '<div class="fb-samp">Sample numbers. Connect your 401(k) in <b>My accounts</b> to see yours.</div>' : ""; }

  /* Big picture */
  function pgBig() {
    var S = D.spyMonthly, N = S.length, W = 1360, H = 520, pl = 64, pr = 30, pt = 40, pb = 46, hi = 820;
    var X = function (i) { return pl + i * (W - pl - pr) / (N - 1); }, Y = function (v) { return pt + (hi - v) * (H - pt - pb) / hi; };
    var path = "M" + S.map(function (v, i) { return X(i).toFixed(1) + "," + Y(v).toFixed(1); }).join(" L");
    var si = startIdx(), sv = S[si], ev = S[N - 1];
    var area = "M" + X(si).toFixed(1) + "," + Y(0) + " " + S.slice(si).map(function (v, k) { return "L" + X(si + k).toFixed(1) + "," + Y(v).toFixed(1); }).join(" ") + " L" + X(N - 1).toFixed(1) + "," + Y(0) + " Z";
    var g = ""; for (var v = 0; v <= 800; v += 200) g += '<line x1="' + pl + '" y1="' + Y(v) + '" x2="' + (W - pr) + '" y2="' + Y(v) + '" class="gl"/><text x="' + (pl - 10) + '" y="' + (Y(v) + 4) + '" text-anchor="end" class="ax">$' + v + '</text>';
    for (var y = 2000; y <= 2026; y += 2) g += '<text x="' + X((y - 2000) * 12).toFixed(1) + '" y="' + (H - 16) + '" text-anchor="middle" class="ax">' + y + '</text>';
    var tags = [[2002, 9, "Dot-com bust", -90], [2009, 2, "2008 financial crisis", -90], [2020, 3, "Covid crash", 70], [2022, 9, "2022 slump", 80]].map(function (t) {
      var i = (t[0] - 2000) * 12 + t[1] - 1, x = X(i), yy = Y(S[i]) + t[3];
      return '<circle cx="' + x.toFixed(1) + '" cy="' + Y(S[i]).toFixed(1) + '" r="6" fill="#8A93A3"/><text x="' + x.toFixed(1) + '" y="' + yy.toFixed(1) + '" text-anchor="middle" class="tg">' + t[2] + '</text>';
    }).join("");
    var sx = X(si), sy = Y(sv), fl = sx > 220 ? sx - 190 : sx + 10;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="fb-svg" role="img" aria-label="S&amp;P 500 since 2000 with your start marked">' + g +
      '<path d="' + area + '" fill="' + GRN + '" fill-opacity=".16"/><path d="' + path + '" fill="none" stroke="' + INK + '" stroke-width="2.6"/>' + tags +
      '<line x1="' + sx + '" y1="' + sy + '" x2="' + sx + '" y2="' + Math.max(30, sy - 150) + '" stroke="' + ORG + '" stroke-width="3"/>' +
      '<rect x="' + fl + '" y="' + Math.max(30, sy - 150) + '" width="180" height="56" rx="10" fill="' + ORG + '"/><text x="' + (fl + 90) + '" y="' + (Math.max(30, sy - 150) + 25) + '" text-anchor="middle" class="fl1">You started here</text><text x="' + (fl + 90) + '" y="' + (Math.max(30, sy - 150) + 44) + '" text-anchor="middle" class="fl2">' + monthName(si) + ' · SPY $' + sv.toFixed(2) + '</text>' +
      '<circle cx="' + sx + '" cy="' + sy + '" r="11" fill="' + ORG + '" stroke="#fff" stroke-width="4"/>' +
      '<circle cx="' + X(N - 1) + '" cy="' + Y(ev) + '" r="11" fill="' + GRN + '" stroke="#fff" stroke-width="4"/></svg>';
    var since = (ev / sv - 1) * 100, yrs = (N - 1 - si) / 12;
    var inner = svg + '<div class="fb-g3">' + stat("Since you started", pct(since, 0), "SPY went from $" + sv.toFixed(2) + " to $" + ev.toFixed(2), ORG) +
      stat("Time in the market", yrs < 1 ? Math.round(yrs * 12) + " months" : yrs.toFixed(1) + " years", "Every month counts", GRN) +
      '<div class="fb-stat"><small>The big lesson</small><p>Every big drop on this chart was eventually made back — after 2000 and 2008 it took <b>years</b>. Time in the market is your superpower.</p></div></div>' +
      '<div class="fb-row"><button type="button" class="fb-btn" data-act="tab" data-v="build">Change my start date</button><span class="fb-mut">SPY price only, dividends not included.</span></div>';
    return paper("The big picture", "You started here", "26 years of the stock market, and the moment you joined it.", inner);
  }

  /* Monthly chart page with the clear page */
  function chartPage() {
    var M = month(), C = M.candles, n = C.length, PR = M.prior || [], off = PR.reduce(function (t, m) { return t + m.candles.length; }, 0), FW = off ? 3 : 1, N = off + n * FW, W = 1400, H = 470, pl = 58, pr = 64, pt = 34, pb = 66, lo = off ? 722 : 745, hi = 786, base = M.prevClose;
    var X = function (i) { return pl + (i < 0 ? i + off + 0.5 : off + i * FW + FW / 2) * UW; }, Y = function (v) { return pt + (hi - v) * (H - pt - pb) / (hi - lo); };
    var s = "", UW = (W - pl - pr) / N, bw = UW * FW * 0.56, idx = {};
    for (var v = off ? 730 : 750; v <= 785; v += off ? 10 : 5) s += '<line x1="' + pl + '" y1="' + Y(v).toFixed(1) + '" x2="' + (W - pr) + '" y2="' + Y(v).toFixed(1) + '" class="gl"/><text x="' + (pl - 10) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" class="ax">$' + v + '</text>';
    (off ? [-4, -2, 0, 2] : [-2, -1, 0, 1, 2]).forEach(function (p) { var vv = base * (1 + p / 100); s += '<text x="' + (W - pr + 10) + '" y="' + (Y(vv) + 4).toFixed(1) + '" class="ax b">' + (p > 0 ? "+" : p < 0 ? "−" : "±") + Math.abs(p) + '%</text>'; });
    s += '<line x1="' + pl + '" y1="' + Y(base).toFixed(1) + '" x2="' + (W - pr) + '" y2="' + Y(base).toFixed(1) + '" stroke="' + INK + '" stroke-opacity=".3" stroke-dasharray="4 5"/>';
    var gc = 0;
    PR.forEach(function (m, k) {
      var a = gc; gc += m.candles.length;
      if (k) s += '<line x1="' + ((X(a - off - 1) + X(a - off)) / 2).toFixed(1) + '" y1="' + pt + '" x2="' + ((X(a - off - 1) + X(a - off)) / 2).toFixed(1) + '" y2="' + (H - pb + 8) + '" stroke="' + INK + '" stroke-opacity=".12" stroke-dasharray="3 5"/>';
      s += '<text x="' + ((X(a - off) + X(gc - 1 - off)) / 2).toFixed(1) + '" y="' + (H - pb + 22) + '" text-anchor="middle" class="ax">' + esc(m.label) + '</text>';
      m.candles.forEach(function (c, j) {
        var i = a + j - off, col = "#B9BFCB", bwp = UW * 0.62, y0 = Y(Math.max(c[1], c[4])), hh = Math.max(2, Y(Math.min(c[1], c[4])) - y0);
        s += '<line x1="' + X(i).toFixed(1) + '" y1="' + Y(c[2]).toFixed(1) + '" x2="' + X(i).toFixed(1) + '" y2="' + Y(c[3]).toFixed(1) + '" stroke="' + col + '" stroke-width="1.5"/><rect x="' + (X(i) - bwp / 2).toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + bwp.toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + col + '" rx="1.5"/>';
      });
    });
    if (off) s += '<line x1="' + ((X(-1) + X(0)) / 2).toFixed(1) + '" y1="' + pt + '" x2="' + ((X(-1) + X(0)) / 2).toFixed(1) + '" y2="' + (H - pb + 8) + '" stroke="' + INK + '" stroke-opacity=".12" stroke-dasharray="3 5"/>';
    C.forEach(function (c, i) {
      idx[c[0]] = i; var col = c[4] >= c[1] ? GRN : RED, y0 = Y(Math.max(c[1], c[4])), hh = Math.max(2, Y(Math.min(c[1], c[4])) - y0);
      s += '<line x1="' + X(i).toFixed(1) + '" y1="' + Y(c[2]).toFixed(1) + '" x2="' + X(i).toFixed(1) + '" y2="' + Y(c[3]).toFixed(1) + '" stroke="' + col + '" stroke-width="2"/><rect x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + col + '" rx="2"/>' +
        '<text x="' + X(i).toFixed(1) + '" y="' + (H - pb + 22) + '" text-anchor="middle" class="ax">' + (+c[0].slice(3)) + '</text>';
    });
    s += '<text x="' + ((pl + W - pr) / 2) + '" y="' + (H - pb + 46) + '" text-anchor="middle" class="ax cap">' + esc(((M.label || "").split(" ")[0] || "").toUpperCase()) + ' TRADING DAYS</text>';
    if (on("blurbs")) M.events.forEach(function (e, k) {
      var i = idx[e[0]]; if (i == null) return; var x = X(i), y = Y(C[i][2]) - 30 - (e[0] === "10-29" ? 36 : 0), col = CAT[e[1]] || BLU;
      s += '<line x1="' + x.toFixed(1) + '" y1="' + (Y(C[i][2]) - 3).toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + (y + 15).toFixed(1) + '" stroke="' + col + '" stroke-width="2"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="15" fill="' + col + '" stroke="#fff" stroke-width="3"/><text x="' + x.toFixed(1) + '" y="' + (y + 5).toFixed(1) + '" text-anchor="middle" class="pin">' + (k + 1) + '</text>';
    });
    // clear page layer
    var line = (A().line && A().line.length === n + 1) ? A().line : M.sampleLine, xs = [X(-1)].concat(C.map(function (c, i) { return X(i); }));
    var P = line.map(function (q) { return base * (1 + q / 100); }), Sp = [base].concat(C.map(function (c) { return c[4]; }));
    var pp = "M" + xs.map(function (x, i) { return x.toFixed(1) + "," + Y(P[i]).toFixed(1); }).join(" L"), sp = "M" + xs.map(function (x, i) { return x.toFixed(1) + "," + Y(Sp[i]).toFixed(1); }).join(" L");
    var yY = Y(P[P.length - 1]) + 28, yM = Y(Sp[Sp.length - 1]) - 14; if (Math.abs(yY - yM) < 24) { if (yY >= yM) yY = yM + 24; else yM = yY + 24; }
    var you = line[line.length - 1], mkt = (Sp[Sp.length - 1] / base - 1) * 100, xe = xs[xs.length - 1];
    var dots = (inMo(A().deposits).concat(inMo(A().earnings).map(function (e) { return Object.assign({ t: "earn" }, e); }))).map(function (d) {
      var i = idx[d.d]; if (i == null) { C.forEach(function (c, k) { if (c[0] <= d.d) i = k; }); } if (i == null) return ""; var x = xs[i + 1], y = Y(P[i + 1]), col = d.t === "earn" ? "#8A5A10" : GRN, lab = d.t === "earn" ? "EARNINGS +" + money(d.a, 2) : "BUY " + money(d.a, 2), late = i >= n - 4, bx = late ? x - 90 : x, by = late ? y - 34 : y + 31;
      return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="11" fill="' + col + '" stroke="#fff" stroke-width="3"/><rect x="' + (bx - 72).toFixed(1) + '" y="' + (by - 13).toFixed(1) + '" width="144" height="26" rx="13" fill="' + col + '"/><text x="' + bx.toFixed(1) + '" y="' + (by + 5).toFixed(1) + '" text-anchor="middle" class="dl">' + lab + '</text>';
    }).join("");
    var clear = '<g class="fb-clear"><rect x="0" y="0" width="' + W + '" height="' + H + '" rx="12" fill="rgba(226,236,252,.45)" stroke="rgba(47,107,216,.5)" stroke-width="1.5"/>' +
      '<path d="' + sp + '" fill="none" stroke="' + INK + '" stroke-width="3" stroke-dasharray="9 6" stroke-opacity=".7"/><path d="' + pp + '" fill="none" stroke="' + BLU + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>' + dots +
      '<circle cx="' + xe + '" cy="' + Y(P[P.length - 1]).toFixed(1) + '" r="7" fill="' + BLU + '" stroke="#fff" stroke-width="3"/><text x="' + (xe - 12) + '" y="' + yY.toFixed(1) + '" text-anchor="end" class="ll" fill="' + BLU + '">You ' + pct(you) + '</text>' +
      '<text x="' + (xe - 12) + '" y="' + yM.toFixed(1) + '" text-anchor="end" class="ll" fill="' + INK + '">Market ' + pct(mkt) + '</text>' +
      '<rect x="18" y="12" width="270" height="30" rx="15" fill="' + BLU + '"/><text x="153" y="32" text-anchor="middle" class="dl">CLEAR PAGE · YOU VS. THE MARKET</text>' + (A().lineNote ? '<text x="' + (W - 22) + '" y="34" text-anchor="end" class="ax">' + esc(A().lineNote) + '</text>' : '') + '</g>';
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="fb-svg" role="img" aria-label="Daily S&amp;P 500 candles for ' + esc(month().label) + (ST.clear ? " with your 401(k) line on top" : "") + '">' + s + (ST.clear ? clear : "") + '</svg>';
    var best = { v: -99 }, worst = { v: 99 }, pc = base; C.forEach(function (c) { var ch = (c[4] / pc - 1) * 100; if (ch > best.v) best = { v: ch, d: c[0] }; if (ch < worst.v) worst = { v: ch, d: c[0] }; pc = c[4]; });
    var right = '<div class="fb-g3 tight">' + stat("The market (SPY)", pct(mkt, 2), "$" + base + " → $" + Sp[Sp.length - 1], mkt >= 0 ? GRN : RED) + stat("Best day", mShort() + " " + (+best.d.slice(3)), pct(best.v, 2) + " in one day", GRN) + stat("Worst day", mShort() + " " + (+worst.d.slice(3)), pct(worst.v, 2) + " in one day", RED) + '</div>';
    var leg = '<div class="fb-leg"><span><i style="background:' + GRN + '"></i>Green day: price went up</span><span><i style="background:' + RED + '"></i>Red day: price went down</span>' + (on("blurbs") ? '<span><i class="o">1</i>Pin: read the story below</span>' : "") +
      (on("clear") ? '<button type="button" class="fb-flip' + (ST.clear ? " on" : "") + '" data-act="clear">' + (ST.clear ? "Lift the clear page" : "Flip the clear page over the chart") + '</button>' : "") + '</div>';
    var blurbs = "";
    if (on("blurbs")) { pc = base; var ch = {}; C.forEach(function (c) { ch[c[0]] = (c[4] / pc - 1) * 100; pc = c[4]; });
      blurbs = '<div class="fb-blurbs">' + M.events.map(function (e, k) { var v = ch[e[0]] || 0; return '<div class="fb-bl"><i style="background:' + (CAT[e[1]] || BLU) + '">' + (k + 1) + '</i><div><div class="t"><span class="chip" style="background:' + (CAT[e[1]] || BLU) + '">' + esc(e[1]) + '</span><span>' + mShort().toUpperCase() + ' ' + (+e[0].slice(3)) + '</span><span style="color:' + (v >= 0 ? GRN : RED) + '">' + (v >= 0 ? "▲" : "▼") + " " + Math.abs(v).toFixed(1) + '%</span></div><b>' + esc(e[2]) + '</b><p>' + esc(e[3]) + '</p></div></div>'; }).join("") + '</div>'; }
    var extras = [];
    if (on("mood")) extras.push(moodMeter(M));
    if (on("sectors")) extras.push('<div class="fb-box"><h4>Sector scoreboard</h4>' + M.sectors.map(function (x) { var w = Math.abs(x[1]) / 14 * 100; return '<div class="fb-sec"><span>' + esc(x[0]) + '</span><div><i style="width:' + w + '%;background:' + (x[1] >= 0 ? GRN : RED) + '"></i></div><b style="color:' + (x[1] >= 0 ? GRN : RED) + '">' + pct(x[1]) + '</b></div>'; }).join("") + (M.sectorNote ? '<p class="fb-mut">' + esc(M.sectorNote) + '</p>' : '') + '</div>');
    if (on("econ")) extras.push('<div class="fb-box"><h4>Economy dashboard</h4><div class="fb-econ">' + M.economy.map(function (x) { return '<div><small>' + esc(x[0]) + '</small><b>' + esc(x[1]) + '</b><span>' + esc(x[2]) + '</span></div>'; }).join("") + '</div></div>');
    if (on("history")) extras.push('<div class="fb-box hist"><h4>This month in history</h4>' + M.history.map(function (h) { return '<div class="fb-hi"><small>' + esc(h[0]) + '</small><b>' + esc(h[1]) + '</b><p>' + esc(h[2]) + '</p></div>'; }).join("") + '</div>');
    var inner = leg + '<div class="fb-chartwrap">' + svg + '</div>' + blurbs + (extras.length ? '<div class="fb-extras">' + extras.join("") + '</div>' : "") +
      (ST.clear ? '<div class="fb-cleargrid">' + clearCards(you, mkt) + '</div>' : "");
    return paper(esc(M.label) + " · the market’s month", esc(mFull()) + ' <span class="fb-yr">' + esc((M.label || "").split(" ")[1] || "") + '</span>', esc(M.mood) + " Here’s the market, one candle per day.", inner, { right: right });
  }
  function moodMeter(M) {
    var v = Math.max(-1, Math.min(1, M.vixChange / 50)), ang = -90 + (v + 1) * 90, r = 80, cx = 100, cy = 96;
    var a = ang * Math.PI / 180, nx = cx + Math.sin(a) * r * 0.85, ny = cy - Math.cos(a) * r * 0.85;
    var arc = function (a0, a1, col) { var p0 = [cx + Math.sin(a0 * Math.PI / 180) * r, cy - Math.cos(a0 * Math.PI / 180) * r], p1 = [cx + Math.sin(a1 * Math.PI / 180) * r, cy - Math.cos(a1 * Math.PI / 180) * r]; return '<path d="M' + p0 + ' A' + r + ',' + r + ' 0 0 1 ' + p1 + '" stroke="' + col + '" stroke-width="18" fill="none"/>'; };
    return '<div class="fb-box"><h4>Market mood</h4><svg viewBox="0 0 200 116" class="fb-mood" role="img" aria-label="Mood needle leaning toward nervous">' + arc(-90, -36, "#2e9e6b") + arc(-36, 18, "#f0b429") + arc(18, 90, "#d64545") +
      '<line x1="' + cx + '" y1="' + cy + '" x2="' + nx.toFixed(1) + '" y2="' + ny.toFixed(1) + '" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><circle cx="' + cx + '" cy="' + cy + '" r="8" fill="' + INK + '"/><text x="22" y="114" class="ax">Calm</text><text x="178" y="114" text-anchor="end" class="ax">Scared</text></svg>' +
      '<p><b>Getting nervous.</b> The VIX “fear gauge” rose about ' + Math.round(M.vixChange) + '% in ' + esc(mFull()) + ' ' + esc(M.vixNote || "") + '.</p></div>';
  }
  function clearCards(you, mkt) {
    var a = A(), dep = inMo(a.deposits)[0], earn = inMo(a.earnings)[0];
    return [["Your buys", dep ? money(dep.a, 2) : money(a.deposit, 2), dep ? "Paycheck deposit (green dot)" : "Each paycheck buy gets a dot", INK],
      ["Company match", a.matchPct != null ? a.matchPct + "% so far" : money(a.match, 2), a.matchTotal ? money(a.matchTotal, 2) + " from your company to date" : "Free money from your company", GRN],
      ["Dividends reinvested", "+" + money(earn ? earn.a : a.earn, 2), earn ? "Bought more shares for you (gold dot)" : "Companies paying you to own them", "#8A5A10"],
      ["You vs. the market", pct(you) + " vs " + pct(mkt), a.drag ? "Biggest drag: " + esc(a.drag.n) + " " + pct(a.drag.v) : "A spread-out mix won’t match SPY every month", you >= mkt ? GRN : RED]]
      .map(function (c) { return '<div class="fb-stat"><small>' + c[0] + '</small><b style="color:' + c[3] + '">' + c[1] + '</b><span>' + c[2] + '</span></div>'; }).join("");
  }

  function tile(icon, k, v, s, col, bg) { return '<div class="fb-tile" style="background:' + bg + '"><span class="ic" style="background:' + col + '">' + icon + '</span><small>' + k + '</small><b style="color:' + col + '">' + v + '</b><p>' + s + '</p></div>'; }
  var I = {
    dep: '<svg viewBox="0 0 24 24"><path d="M12 3v14M6 11l6 6 6-6M4 21h16"/></svg>', gift: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18"/></svg>',
    seed: '<svg viewBox="0 0 24 24"><path d="M12 21V11M12 11c0-4 3-7 8-7 0 5-3 7-8 7zM12 14c0-3-2-5-7-5 0 4 2 5 7 5z"/></svg>', wave: '<svg viewBox="0 0 24 24"><path d="M3 15c3 0 3-6 6-6s3 6 6 6 3-6 6-6"/></svg>'
  };
  function pgMonth() {
    var a = A(), t = total(), dep = inMo(a.deposits)[0], earn = inMo(a.earnings)[0];
    var mv = a.plans.reduce(function (s, p) { return s + (+p.rm || 0) * (+p.bal || 0); }, 0) / (t || 1);
    var cols = ["#2F6BD8", "#17845B", "#E0672B", "#8A5BA8", "#0F7C7C"];
    var bar = a.plans.map(function (p, i) { return '<i style="width:' + ((+p.bal || 0) / t * 100).toFixed(2) + '%;background:' + cols[i % 5] + '"></i>'; }).join("");
    var leg = a.plans.map(function (p, i) { return '<span><i style="background:' + cols[i % 5] + '"></i><b>' + esc(p.n) + '</b> ' + esc(p.p || "") + ' <em>' + money(p.bal, 2) + '</em></span>'; }).join("");
    var inner = sampleNote() + '<div class="fb-g4">' +
      tile(I.dep, "You put in", money(dep ? dep.a : a.deposit, 2), dep ? "Paycheck deposit on " + mShort() + " " + (+dep.d.slice(3)) + ". It bought shares automatically." : "Your paycheck deposits this month.", BLU, "#EEF3FC") +
      tile(I.gift, "Company match", a.matchPct != null ? a.matchPct + "%" : money(a.match, 2), a.matchTotal ? "Your company has added " + money(a.matchTotal, 2) + " so far." : "Free money your company added.", GRN, "#E9F6EF") +
      tile(I.seed, "Earnings reinvested", "+" + money(earn ? earn.a : a.earn, 2), "Your funds paid you and bought more shares. Small seeds grow.", "#8A5A10", "#FBF3E3") +
      tile(I.wave, "Market wobble", "≈ " + pct(mv), "Your investments moved with the market in " + mFull() + ". Normal — markets breathe.", mv >= 0 ? GRN : RED, mv >= 0 ? "#E9F6EF" : "#FCEDEB") + '</div>' +
      '<div class="fb-totbox"><div class="r"><small>Everything you’ve saved for retirement</small><b>' + money(t, 2) + '</b></div><div class="fb-bar">' + bar + '</div><div class="fb-bleg">' + leg + '</div></div>';
    return paper("Your money", "Your " + esc(mFull()), "What you added, what your company added, and what the market did.", inner);
  }
  function pgPaycheck() {
    var a = A(), dep = inMo(a.deposits)[0], amt = dep ? dep.a : a.deposit, mix = a.alloc || [["S&P 500 index", 60], ["International index", 25], ["Mid-cap index", 10], ["Small-cap index", 5]];
    var cols = [BLU, GRN, ORG, "#8A5BA8", "#0F7C7C"];
    var cards = mix.map(function (m, i) {
      var d = amt * m[1] / 100, coins = Math.max(1, Math.round(m[1] / 8)), st = ""; for (var k = 0; k < coins; k++) st += '<i style="bottom:' + (k * 11) + 'px"></i>';
      return '<div class="fb-pc"><div class="coins" style="--cc:' + cols[i % 5] + ';height:' + (coins * 11 + 14) + 'px">' + st + '</div><b>' + money(d, 2) + '</b><span>' + esc(m[0]) + '</span><small>' + m[1] + '% of each deposit</small></div>';
    }).join("");
    return paper("Proud page", "Your paycheck became…", "Every deposit is split across your funds automatically. Here’s where " + money(amt, 2) + " goes.", sampleNote() + '<div class="fb-pcs">' + cards + '</div><p class="fb-big">You’re not “saving money” — you’re <b>buying a piece of thousands of companies</b> every payday.</p>');
  }
  function pgOwn() {
    var sp = spDollars(), H = D.topHoldings;
    var cards = H.map(function (h, i) { var d = sp * h[1] / 100; return '<div class="fb-own"><span class="lg" style="background:' + ["#76B900", "#1B2333", "#2F6BD8", "#E0672B", "#0866FF", "#C93A30", "#8A93A3"][i % 7] + '">' + esc(h[2] || ({"Nvidia":"NVDA","Apple":"AAPL","Microsoft":"MSFT","Alphabet (Google)":"GOOGL","Meta":"META","Broadcom":"AVGO","Tesla":"TSLA"})[h[0]] || h[0].slice(0, 1)) + '</span><b>' + money(d) + '</b><span>' + esc(h[0]) + '</span><small>' + h[1] + '% of the S&amp;P 500</small></div>'; }).join("");
    return paper("Proud page", "What you actually own", "Your S&amp;P 500 index money (" + money(sp) + ") is spread across 500 companies. Your biggest slices:", sampleNote() + '<div class="fb-owns">' + cards + '</div><p class="fb-big">You’re a part-owner of the biggest companies on earth. When they grow, <b>you grow</b>.</p><p class="fb-mut">Approximate, using S&amp;P 500 weights from late October 2026 and only your S&amp;P 500 funds.</p>');
  }
  function pgVest() {
    var a = A(), vp = a.vestedOf ? a.vested / a.vestedOf : (a.vested || 0), lim = 24500, used = a.limitUsed || 0;
    var ring = function (p, col, lab) { var r = 70, c = 2 * Math.PI * r; return '<svg viewBox="0 0 180 180" class="fb-ring" role="img" aria-label="' + lab + '"><circle cx="90" cy="90" r="' + r + '" stroke="#EEF0F3" stroke-width="22" fill="none"/><circle cx="90" cy="90" r="' + r + '" stroke="' + col + '" stroke-width="22" fill="none" stroke-dasharray="' + (c * p).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 90 90)" stroke-linecap="round"/><text x="90" y="100" text-anchor="middle" class="rg">' + Math.round(p * 100) + '%</text></svg>'; };
    var inner = sampleNote() + '<div class="fb-g2"><div class="fb-box big">' + ring(vp, GRN, "Vested") + '<div><h4>Your match: how much is yours</h4><p><b>' + (a.vestedOf ? money(a.vested, 2) + " of " + money(a.vestedOf, 2) : Math.round(vp * 100) + "%") + '</b> is fully yours to keep. The rest becomes yours the longer you stay.</p></div></div>' +
      '<div class="fb-box big">' + ring(Math.min(1, used / lim), BLU, "Limit used") + '<div><h4>This year’s 401(k) limit</h4><p><b>' + money(used, 2) + ' of ' + money(lim) + '</b> used for 2026. ' + (a.limitNote ? esc(a.limitNote) : "Contributions at other jobs this year count too.") + '</p></div></div></div>';
    return paper("Proud page", "Match, vesting & your limit", "Two fill-up meters that grow every payday.", inner);
  }
  function hist() { var a = A(); return a.hist || { labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"], plans: [{ n: "Sample 401(k)", c: spyCum().map(function (v) { return v * 0.92; }) }] }; }
  function spyCum() { var S = D.spyMonthly, s = S.slice(-13); return s.map(function (v) { return (v / s[0] - 1) * 100; }); }
  function pgReport() {
    var h = hist(), p0 = h.plans[0], spy = spyCum(), W = 1360, H = 360, pl = 60, pr = 300, pt = 20, pb = 40, lo = -8, hi = 16;
    var X = function (i) { return pl + i * (W - pl - pr) / 12; }, Y = function (v) { return pt + (hi - v) * (H - pt - pb) / (hi - lo); }, pth = function (s) { return "M" + s.map(function (v, i) { return X(i).toFixed(1) + "," + Y(v).toFixed(1); }).join(" L"); };
    var g = ""; [-5, 0, 5, 10, 15].forEach(function (v) { g += '<line x1="' + pl + '" y1="' + Y(v) + '" x2="' + (W - pr) + '" y2="' + Y(v) + '" class="gl' + (v === 0 ? " z" : "") + '"/><text x="' + (pl - 10) + '" y="' + (Y(v) + 4) + '" text-anchor="end" class="ax">' + (v > 0 ? "+" : "") + v + '%</text>'; });
    h.labels.forEach(function (l, i) { g += '<text x="' + X(i + 1) + '" y="' + (H - 12) + '" text-anchor="middle" class="ax">' + l + '</text>'; });
    var cols = [BLU, "#7FA6EA", ORG];
    var lines = h.plans.map(function (p, i) { return '<path d="' + pth(p.c) + '" fill="none" stroke="' + cols[i % 3] + '" stroke-width="' + (i ? 3.5 : 5)  + '"/>'; }).join("");
    var labs = h.plans.map(function (p, i) { return { y: Y(p.c[12]), t: esc(p.n) + " " + pct(p.c[12]), c: cols[i % 3] }; });
    var mx = Math.max.apply(null, p0.c), mi = p0.c.indexOf(mx), dd = ((1 + p0.c[12] / 100) / (1 + mx / 100) - 1) * 100;
    var top = on("top") ? '<line x1="' + X(mi) + '" y1="' + Y(mx) + '" x2="' + X(12) + '" y2="' + Y(mx) + '" stroke="' + GRN + '" stroke-dasharray="4 4"/><rect x="' + X(12) + '" y="' + Y(mx) + '" width="0" height="0"/><path d="M' + X(12) + ',' + Y(mx) + ' L' + X(12) + ',' + Y(p0.c[12]) + '" stroke="' + RED + '" stroke-width="3"/>' : "";
    if (on("top")) labs.push({ y: Y(mx), t: "All-time high " + pct(mx), t2: "you’re " + pct(dd) + " below it", c: GRN });
    labs.push({ y: Y(spy[12]), t: "SPY " + pct(spy[12]), c: INK });
    labs.sort(function (a, b) { return a.y - b.y; });
    labs.forEach(function (l, k) { l.ty = Math.max(l.y + 5, k ? labs[k - 1].ty + (labs[k - 1].t2 ? 40 : 22) : pt + 10); });
    var over = labs.length ? labs[labs.length - 1].ty + (labs[labs.length - 1].t2 ? 18 : 0) - (H - pb) : 0; if (over > 0) labs.forEach(function (l) { l.ty -= over; });
    var lt = labs.map(function (l) { return '<line x1="' + (X(12) + 4) + '" y1="' + l.y.toFixed(1) + '" x2="' + (X(12) + 14) + '" y2="' + (l.ty - 5).toFixed(1) + '" stroke="' + l.c + '" stroke-opacity=".5"/><text x="' + (X(12) + 18) + '" y="' + l.ty.toFixed(1) + '" class="ll" fill="' + l.c + '">' + l.t + (l.t2 ? '<tspan x="' + (X(12) + 18) + '" dy="18" font-weight="500">' + l.t2 + '</tspan>' : '') + '</text>'; }).join("");
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="fb-svg" role="img" aria-label="12-month returns versus SPY">' + g + '<path d="' + pth(spy) + '" fill="none" stroke="' + INK + '" stroke-width="3" stroke-dasharray="9 6" stroke-opacity=".7"/>' + lines + top + lt + '</svg>';
    var mk = [], ms = []; for (var i = 0; i < 12; i++) { mk.push(((1 + p0.c[i + 1] / 100) / (1 + p0.c[i] / 100) - 1) * 100); ms.push(((1 + spy[i + 1] / 100) / (1 + spy[i] / 100) - 1) * 100); }
    var beat = 0, up = 0, cells = mk.map(function (a2, i) { var b = a2 >= ms[i]; if (b) beat++; if (a2 >= 0) up++; return '<div class="fb-cell' + (b ? " w" : "") + '"><small>' + h.labels[i] + '</small><b style="color:' + (a2 >= 0 ? GRN : RED) + '">' + pct(a2) + '</b><span>SPY ' + pct(ms[i]) + '</span>' + (b ? '<em>BEAT</em>' : "") + '</div>'; }).join("");
    var inner = sampleNote() + svg + '<div class="fb-cells">' + cells + '</div><div class="fb-g3">' + stat("Months up", up + " of 12", "Your plan went up", GRN) + stat("Beat the market", beat + " of 12", "Green boxes", BLU) + stat("You stayed", "Invested", "Through every dip this year", "#8A5A10") + '</div><p class="fb-mut">Your plan returns include reinvested dividends; SPY shows price change only.</p>';
    return paper("Report card", "Your year vs. the market", "Twelve months, one line each. Green boxes are months you beat the market.", inner);
  }
  function pgPanic() {
    var h = hist(), c = h.plans[0].c, mi = 1; for (var i = 1; i < 12; i++) if (c[i] < c[mi]) mi = i;
    var stayed = c[12], panicked = ((1 + c[mi] / 100) * (1 + c[12] / 100) / (1 + c[mi + 1] / 100) - 1) * 100, bal = A().plans[0].bal, cost = bal * (stayed - panicked) / (100 + stayed);
    var bars = '<div class="fb-race">' + [["You (stayed in)", stayed, GRN], ["“Panic you” (sold in " + h.labels[mi - 1] + ", came back a month later)", panicked, RED]].map(function (r) { var w = Math.max(3, Math.abs(r[1]) / 14 * 100); return '<div class="fb-rr"><span>' + r[0] + '</span><div><i style="width:' + w + '%;background:' + r[2] + '"></i></div><b style="color:' + r[2] + '">' + pct(r[1]) + '</b></div>'; }).join("") + '</div>';
    return paper("Clear page", "If you’d panicked…", "The scariest month of the year was " + h.labels[mi - 1] + ". Here’s what selling would have done.", sampleNote() + bars + '<div class="fb-g2"><div class="fb-stat"><small>Staying in was worth about</small><b style="color:' + GRN + '">' + money(cost) + '</b><span>on your ' + esc(h.plans[0].n) + ' balance</span></div><div class="fb-stat"><small>Why</small><p>The month right after the drop was one of the best of the year. Sellers usually miss the bounce.</p></div></div>');
  }
  function pgRace() {
    var a = A(), p = a.plans.filter(function (x) { return x.r12 != null; }), spy = spyCum()[12];
    var R = p.map(function (x, i) { return [esc(x.n), +x.r12, [BLU, "#7FA6EA", ORG][i % 3]]; }).concat([["The market (SPY, price)", spy, INK], ["Inflation", 3.7, "#8A93A3"], ["Cash under the mattress", 0, "#C9CED6"]]);
    R.sort(function (x, y) { return y[1] - x[1]; });
    var lane = R.map(function (r, i) { var w = Math.max(2, r[1] / 14 * 100); return '<div class="fb-lane"><span class="pos">' + (i + 1) + '</span><span class="nm">' + r[0] + '</span><div class="trk"><i style="width:' + w + '%;background:' + r[2] + '"></i><em style="left:' + w + '%;border-color:' + r[2] + '"></em></div><b>' + pct(r[1]) + '</b></div>'; }).join("");
    return paper("Proud page", "The race", "Last 12 months. Who went the farthest?", sampleNote() + '<div class="fb-lanes">' + lane + '</div><p class="fb-big">Beating inflation means your money <b>buys more</b> next year, not less.</p><p class="fb-mut">Inflation: September CPI, 3.7% over 12 months.</p>');
  }
  function pgHeading() {
    var a = A(), t = total(), r = ST.rate / 100, n = ST.years, f = Math.pow(1 + r, n), ann = (f - 1) / r, mo = a.monthly || 0;
    var base = t * f + mo * 12 * ann, ex = ST.extra * 12 * ann;
    var btn = function (v, cur, act, lab) { return '<button type="button" class="fb-pill' + (v === cur ? " on" : "") + '" data-act="' + act + '" data-v="' + v + '">' + lab + '</button>'; };
    var rows = [25, 50, 100, 200].map(function (x) { var v = x * 12 * ann, w = v / (200 * 12 * ann) * 100; return '<div class="fb-wi' + (x === ST.extra ? " on" : "") + '"><b>+$' + x + '<small>/mo</small></b><div><i style="width:' + w + '%"></i></div><em>+' + money(v) + '</em></div>'; }).join("");
    var inner = sampleNote() + '<div class="fb-g2 head"><div class="fb-dark"><small>At your current pace</small><b>' + money(base + ex * 0) + '</b><p>in ' + n + ' years if your <b>' + money(t) + '</b> keeps growing and you keep adding <b>' + money(mo) + ' a month</b>.</p>' +
      '<div class="fb-ctl"><span>Years</span>' + [10, 20, 30, 40].map(function (v) { return btn(v, n, "yrs", v); }).join("") + '</div><div class="fb-ctl"><span>Growth</span>' + [5, 7, 9].map(function (v) { return btn(v, ST.rate, "rate", v + "%"); }).join("") + '</div></div>' +
      '<div><h3 class="fb-h3">What if you added a little more?</h3>' + rows + '<div class="fb-ctl light"><span>Try it</span>' + [25, 50, 100, 200].map(function (v) { return btn(v, ST.extra, "extra", "+$" + v); }).join("") + '</div>' +
      '<div class="fb-wires"><small>With +$' + ST.extra + ' a month</small><b>' + money(base + ex) + '</b><span>that’s ' + money(ex) + ' more</span></div>' +
      (a.limitNote2 ? '<div class="fb-note">' + esc(a.limitNote2) + '</div>' : '<div class="fb-note">401(k)s have a yearly limit ($24,500 in 2026). Extra money could also go into an IRA.</div>') + '</div></div>' +
      '<div class="fb-nadv"><b>This is not investment advice.</b> These are “what if” math examples that assume a steady ' + ST.rate + '% a year. Real markets go up and down, and nothing here is a promise or a recommendation.</div>';
    return paper("The future", "Where you’re heading", "Small, steady amounts turn into big numbers. Tap the buttons to play with it.", inner);
  }
  function pgStickers() {
    var a = A(), t = total(), h = hist(), minC = Math.min.apply(null, h.plans[0].c);
    var S = [["$10K saved", t >= 10000, "#2F6BD8"], ["$25K saved", t >= 25000, "#17845B"], ["$50K saved", t >= 50000, "#E0672B"], ["$100K saved", t >= 100000, "#8A5BA8"],
      ["Match unlocked", (a.matchTotal || a.match) > 0, "#0F7C7C"], ["Held through a dip", minC < -2, "#C93A30"], ["Saving 10%+", (a.rate || 0) >= 10, "#8A5A10"], ["1 year in", startIdx() <= D.spyMonthly.length - 13, "#1B2333"]];
    var next = [10000, 25000, 50000, 100000, 250000, 500000, 1000000].filter(function (v) { return v > t; })[0];
    var st = S.map(function (s) { return '<div class="fb-stk' + (s[1] ? "" : " off") + '" style="--sc:' + s[2] + '"><div class="b"><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg></div><b>' + s[0] + '</b><span>' + (s[1] ? "Earned!" : "Locked") + '</span></div>'; }).join("");
    return paper("Collectibles", "Your stickers", "Earned stickers come in the mail with your pages. Stick them right here.", sampleNote() + '<div class="fb-stks">' + st + '</div>' + (next ? '<div class="fb-totbox"><div class="r"><small>Next sticker: ' + money(next) + ' saved</small><b>' + Math.round(t / next * 100) + '%</b></div><div class="fb-bar"><i style="width:' + Math.min(100, t / next * 100) + '%;background:' + ORG + '"></i></div></div>' : ""));
  }
  function pgLearn() {
    return paper("Learn-it card", "What’s a dividend?", "One easy money lesson every month — cut it out and keep it.", '<div class="fb-learn"><div class="front"><small>Front</small><b>What’s a dividend?</b><svg viewBox="0 0 120 80" aria-hidden="true"><rect x="10" y="20" width="60" height="44" rx="6" fill="#EEF3FC" stroke="' + BLU + '" stroke-width="3"/><path d="M78 42h30M98 32l10 10-10 10" stroke="' + GRN + '" stroke-width="4" fill="none"/><circle cx="40" cy="42" r="10" fill="' + YEL + '"/></svg></div><div class="back"><small>Back</small><p>When a company makes a profit, it can <b>share some of it</b> with the people who own its stock. That payment is a dividend.</p><p>In your 401(k), dividends are usually <b>reinvested</b> — they buy more shares for you automatically. More shares → more dividends → more shares. That’s compounding.</p></div></div>');
  }
  function pgSpecials() {
    var S = [["Quarterly poster", "A fold-out report card every 3 months", "#2F6BD8"], ["Year in review", "12 tiny candle charts, your best and worst moments (December)", "#17845B"], ["Tax-time page", "Pre-tax vs. Roth explained with your own numbers (spring)", "#E0672B"], ["Letter to future you", "Write it, seal it, open it at your next milestone", "#8A5BA8"]];
    return paper("Specials", "Coming a few times a year", "Surprise pages that make the book feel like yours.", '<div class="fb-g4">' + S.map(function (s) { return '<div class="fb-spec" style="--sc:' + s[2] + '"><b>' + s[0] + '</b><p>' + s[1] + '</p></div>'; }).join("") + '</div>');
  }
  function pages() {
    var L = [];
    if (on("big")) L.push(["You started here", pgBig]);
    L.push([mFull() + " chart", chartPage]);
    if (on("panic")) L.push(["If you’d panicked", pgPanic]);
    if (on("month")) L.push(["Your " + mFull(), pgMonth]);
    if (on("paycheck")) L.push(["Paycheck became", pgPaycheck]);
    if (on("own")) L.push(["What you own", pgOwn]);
    if (on("vest")) L.push(["Match & limit", pgVest]);
    if (on("race")) L.push(["The race", pgRace]);
    if (on("report")) L.push(["Report card", pgReport]);
    if (on("heading")) L.push(["Where you’re heading", pgHeading]);
    if (on("stickers")) L.push(["Stickers", pgStickers]);
    if (on("learn")) L.push(["Learn-it card", pgLearn]);
    if (on("specials")) L.push(["Specials", pgSpecials]);
    return L;
  }

  /* ---------- tabs ---------- */
  function viewBook() {
    var L = pages(); if (ST.page >= L.length) ST.page = L.length - 1; if (ST.page < 0) ST.page = 0;
    var thumbs = L.map(function (p, i) { return '<button type="button" class="fb-th' + (i === ST.page ? " on" : "") + '" data-act="go" data-v="' + i + '"><span>' + (i + 1) + '</span>' + esc(p[0]) + '</button>'; }).join("");
    return '<div class="fb-nav"><button type="button" class="fb-arrow" data-act="prev" aria-label="Previous page"' + (ST.page ? "" : " disabled") + '>‹</button><div class="fb-ths">' + thumbs + '</div><button type="button" class="fb-arrow" data-act="next" aria-label="Next page"' + (ST.page < L.length - 1 ? "" : " disabled") + '>›</button></div>' +
      '<div class="fb-stage" data-p="' + ST.page + '">' + L[ST.page][1]() + '</div><div class="fb-pn">Page ' + (ST.page + 1) + ' of ' + L.length + ' · use ← → keys to flip</div>';
  }
  function viewBuild() {
    var c = ST.cfg, count = pages().length + (on("clear") ? 1 : 0), si = startIdx(), y0 = 2000 + Math.floor(si / 12), m0 = si % 12;
    var groups = GROUPS.map(function (g) { return '<fieldset class="fb-grp"><legend>' + esc(g.n) + '</legend>' + g.items.map(function (it) { return '<label class="fb-ck"><input type="checkbox" data-act="ck" data-v="' + it[0] + '"' + (c.on[it[0]] ? " checked" : "") + '><span><b>' + esc(it[1]) + '</b><small>' + esc(it[2]) + '</small></span></label>'; }).join("") + '</fieldset>'; }).join("");
    var ys = ""; for (var y = 2000; y <= 2026; y++) ys += '<option value="' + y + '"' + (y === y0 ? " selected" : "") + '>' + y + '</option>';
    var ms = MN.map(function (m, i) { return '<option value="' + i + '"' + (i === m0 ? " selected" : "") + '>' + m + '</option>'; }).join("");
    var quick = (A().plansStart || []).map(function (p) { return '<button type="button" class="fb-pill" data-act="qs" data-v="' + esc(p.d) + '">' + esc(p.n) + ' · ' + esc(p.d) + '</button>'; }).join("");
    return '<div class="fb-build"><div class="fb-bhead"><div><h3>What goes in your Flipbook?</h3><p>Tick what you want. Your book updates instantly — flip through it in <b>My book</b>.</p></div><div class="fb-count"><b>' + count + '</b><span>printed sheets a month</span></div></div>' +
      '<div class="fb-startbox"><h4>When did your 401(k) journey start?</h4><p>We’ll put a “You started here” flag on your big-picture page.</p><div class="fb-row"><label>Month <select data-act="sm">' + ms + '</select></label><label>Year <select data-act="sy">' + ys + '</select></label>' + quick + '</div><div class="fb-mini">' + miniStart() + '</div></div>' +
      '<div class="fb-grps">' + groups + '</div><div class="fb-row end"><button type="button" class="fb-btn" data-act="all">Select everything</button><button type="button" class="fb-btn pri" data-act="tab" data-v="book">Preview my book →</button></div></div>';
  }
  function miniStart() {
    var S = D.spyMonthly, N = S.length, W = 1000, H = 160, X = function (i) { return 10 + i * (W - 20) / (N - 1); }, Y = function (v) { return 150 - v / 820 * 140; }, si = startIdx();
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="fb-svg" aria-hidden="true"><path d="M' + S.map(function (v, i) { return X(i).toFixed(1) + "," + Y(v).toFixed(1); }).join(" L") + '" fill="none" stroke="currentColor" stroke-width="2"/><line x1="' + X(si) + '" y1="10" x2="' + X(si) + '" y2="150" stroke="' + ORG + '" stroke-width="3"/><circle cx="' + X(si) + '" cy="' + Y(S[si]) + '" r="7" fill="' + ORG + '"/><text x="' + Math.min(W - 160, X(si) + 8) + '" y="24" fill="' + ORG + '" font-weight="800" font-size="16">You started: ' + monthName(si) + '</text></svg>';
  }
  function viewAcct() {
    var a = ST.acct;
    if (!a) return '<div class="fb-build"><h3>My accounts</h3><p>Your Flipbook is showing <b>sample numbers</b> right now.</p><ol class="fb-steps"><li>Ask Claude in your Revatour chat to “connect my 401(k) to Flipbook.”</li><li>Claude reads your Fidelity and Principal pages (read-only) and gives you a <b>private link</b>.</li><li>Open that link while signed in to Revatour. Your numbers are saved only to <b>your</b> account.</li></ol><p class="fb-mut">Your balances are never stored in Revatour’s public files.</p>'+'<div class="fb-row" style="margin-top:12px"><input id="fbimp" type="text" placeholder="Paste your private link here" aria-label="Private link" style="flex:1;min-width:240px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink)"><button type="button" class="fb-btn pri" data-act="imp">Load my accounts</button></div></div></div>';
    var rows = a.plans.map(function (p) { return '<tr><td><b>' + esc(p.n) + '</b><br><small>' + esc(p.p || "") + '</small></td><td>' + money(p.bal, 2) + '</td><td>' + (p.r12 != null ? pct(p.r12) : "—") + '</td><td>' + (p.rm != null ? pct(p.rm, 2) : "—") + '</td><td>' + esc(p.since || "") + '</td></tr>'; }).join("");
    return '<div class="fb-build"><h3>My accounts</h3><p>Private to you. Updated ' + esc(a.asOf || "") + '.</p><div class="fb-tbl"><table><thead><tr><th>Plan</th><th>Balance</th><th>12 months</th><th>October</th><th>Started</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="fb-g3">' + stat("Total", money(total(), 2), "All plans together", INK) + stat("Saving rate", (a.rate || 0) + "%", "of each paycheck", GRN) + stat("Monthly", money(a.monthly || 0), "going in", BLU) + '</div>' +
      '<div class="fb-row"><button type="button" class="fb-btn" data-act="forget">Remove my numbers from Flipbook</button></div>'+'<div class="fb-row" style="margin-top:12px"><input id="fbimp" type="text" placeholder="Paste your private link here" aria-label="Private link" style="flex:1;min-width:240px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink)"><button type="button" class="fb-btn pri" data-act="imp">Load my accounts</button></div></div></div>';
  }

  /* ---------- render + events ---------- */
  var root = null, bound = false;
  function render() {
    if (!root) return;
    if (!ST.loaded) { root.innerHTML = '<p class="fb-mut">Opening your Flipbook…</p>'; return; }
    var mks = Object.keys(D.months).sort().reverse(), msel = mks.length > 1 ? '<label class="fb-mk">Month <select data-act="mk" aria-label="Pick a month">' + mks.map(function (k) { return '<option value="' + k + '"' + (k === mkey() ? " selected" : "") + '>' + esc(D.months[k].label) + '</option>'; }).join("") + '</select></label>' : "";
    var tabs = msel + [["book", "My book"], ["build", "Build my book"], ["acct", "My accounts"]].map(function (t) { return '<button type="button" class="fb-tab' + (ST.tab === t[0] ? " on" : "") + '" data-act="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join("");
    root.innerHTML = '<div class="fb-top"><div><h2>Flipbook</h2><p>Your retirement, page by page. A new set of pages every month to snap into your book.</p></div><div class="fb-tabs">' + tabs + '</div></div>' +
      (ST.tab === "book" ? viewBook() : ST.tab === "build" ? viewBuild() : viewAcct());
  }
  function act(e) {
    var t = e.target.closest("[data-act]"); if (!t || !root.contains(t)) return;
    var a = t.getAttribute("data-act"), v = t.getAttribute("data-v");
    if (e.type === "change" && !/^(ck|sm|sy|mk)$/.test(a)) return;
    if (e.type === "click" && /^(ck|sm|sy|mk)$/.test(a)) return;
    if (a === "tab") { ST.tab = v; ST.clear = false; }
    else if (a === "go") { ST.page = +v; ST.clear = false; }
    else if (a === "prev") { ST.page--; ST.clear = false; }
    else if (a === "next") { ST.page++; ST.clear = false; }
    else if (a === "clear") ST.clear = !ST.clear;
    else if (a === "yrs") ST.years = +v; else if (a === "rate") ST.rate = +v; else if (a === "extra") ST.extra = +v;
    else if (a === "ck") { ST.cfg.on[v] = t.checked; save(); }
    else if (a === "all") { ALL.forEach(function (k) { ST.cfg.on[k] = true; }); save(); }
    else if (a === "sm" || a === "sy") { var si = startIdx(), y = 2000 + Math.floor(si / 12), m = si % 12; if (a === "sm") m = +t.value; else y = +t.value; ST.cfg.start = y + "-" + String(m + 1).padStart(2, "0"); save(); }
    else if (a === "qs") { var mm = /([A-Za-z]{3}) (\d{4})/.exec(v); if (mm) { ST.cfg.start = mm[2] + "-" + String(MN.indexOf(mm[1]) + 1).padStart(2, "0"); save(); } }
    else if (a === "imp") { var iv = document.getElementById("fbimp"); if (!iv || !iv.value.trim() || !importFromHash(iv.value.trim())) toast("That link didn’t work. Paste the whole private link."); }
    else if (a === "mk") { ST.mk = t.value; ST.clear = false; }
    else if (a === "forget") { if (window.confirm("Remove your 401(k) numbers from Flipbook? You can add them again later.")) { ST.acct = null; save(); } }
    var y0 = window.scrollY; render(); if (a === "go" || a === "prev" || a === "next") { var s = root.querySelector(".fb-stage"); if (s) s.classList.add("turn"); } else window.scrollTo(0, y0);
  }
  function key(e) {
    if (!root || root.closest("[hidden]") || root.hidden || ST.tab !== "book") return;
    if (/input|select|textarea/i.test((e.target && e.target.tagName) || "")) return;
    if (e.key === "ArrowRight") { ST.page++; ST.clear = false; render(); } else if (e.key === "ArrowLeft") { ST.page--; ST.clear = false; render(); }
  }

  var CSS = '#flipv{max-width:none;width:100%;box-sizing:border-box;padding:0 28px 40px}#flipv *{box-sizing:border-box}' +
    '.fb-top{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:14px;margin:4px 0 16px}.fb-top h2{margin:0;font-size:30px;letter-spacing:-.01em}.fb-top p{margin:4px 0 0;color:var(--mute);font-size:14px}' +
    '.fb-tabs{display:flex;gap:6px;flex-wrap:wrap}.fb-tab{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:10px 18px;min-height:44px;font:inherit;font-weight:600;cursor:pointer}.fb-tab.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}' +
    '.fb-nav{display:flex;align-items:center;gap:8px;margin:0 0 14px}.fb-ths{display:flex;gap:6px;overflow-x:auto;flex:1;padding:2px}.fb-th{flex:none;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:12px;padding:8px 12px;min-height:44px;font:inherit;font-size:13px;cursor:pointer;display:flex;gap:8px;align-items:center}.fb-th span{width:22px;height:22px;border-radius:11px;background:var(--line);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}.fb-th.on{border-color:#E0672B;box-shadow:0 0 0 2px #E0672B inset}.fb-th.on span{background:#E0672B;color:#fff}' +
    '.fb-arrow{flex:none;width:48px;height:48px;border-radius:24px;border:1px solid var(--line);background:var(--panel);color:var(--ink);font-size:26px;line-height:1;cursor:pointer}.fb-arrow:disabled{opacity:.35;cursor:default}.fb-pn{text-align:center;color:var(--mute);font-size:12px;margin-top:10px}' +
    '@keyframes fbturn{from{transform:perspective(2200px) rotateY(-14deg) translateX(18px);opacity:.35}to{transform:none;opacity:1}}@keyframes fbclear{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:none}}.fb-stage.turn .fb-paper{animation:fbturn .45s cubic-bezier(.2,.8,.2,1);transform-origin:left center}' +
    '.fb-paper{position:relative;background:#fff;color:#1B2333;border-radius:8px;box-shadow:0 1px 0 #E6E8EC,0 18px 50px rgba(0,0,0,.18);padding:40px 44px 26px 74px;font-family:Inter,system-ui,sans-serif;display:flex;flex-direction:column;gap:20px;min-height:600px}' +
    '.fb-holes{position:absolute;left:22px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:space-around}.fb-holes i{display:block;width:18px;height:18px;border-radius:9px;background:#E9E4DA;box-shadow:inset 0 2px 3px rgba(0,0,0,.18)}' +
    '.fb-ph{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:18px}.fb-kick{font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#E0672B}.fb-title{margin:4px 0 0;font-family:Fraunces,Georgia,serif;font-weight:900;font-size:clamp(40px,5vw,76px);line-height:.98;color:#1B2333}.fb-yr{color:#C9CED6}.fb-sub{margin-top:8px;font-size:17px;color:#586172;max-width:820px}' +
    '.fb-stat{background:#F6F7F9;border-radius:16px;padding:14px 18px;display:flex;flex-direction:column;gap:2px;min-width:0}.fb-stat small{font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#586172}.fb-stat b{font-family:Fraunces,Georgia,serif;font-size:clamp(24px,2.4vw,36px);font-weight:900;line-height:1.05}.fb-stat span,.fb-stat p{font-size:13.5px;color:#586172;margin:0;line-height:1.45}' +
    '.fb-g2,.fb-g3,.fb-g4{display:grid;gap:14px}.fb-g2{grid-template-columns:repeat(2,minmax(0,1fr))}.fb-g3{grid-template-columns:repeat(3,minmax(0,1fr))}.fb-g4{grid-template-columns:repeat(4,minmax(0,1fr))}.fb-g3.tight{min-width:min(640px,100%)}@media(max-width:900px){.fb-g3,.fb-g4{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.fb-g2,.fb-g3,.fb-g4{grid-template-columns:minmax(0,1fr)}.fb-paper{padding:26px 18px 20px 44px}.fb-holes{left:12px}}' +
    '.fb-svg{width:100%;height:auto;display:block}.fb-svg .gl{stroke:#1B2333;stroke-opacity:.07}.fb-svg .gl.z{stroke-opacity:.3}.fb-svg .ax{font:13px Inter,sans-serif;fill:#586172}.fb-svg .ax.b{font-weight:600}.fb-svg .ax.cap{font-weight:700;letter-spacing:2px;font-size:12px}.fb-svg .pin{font:800 14px Inter,sans-serif;fill:#fff}.fb-svg .tg{font:800 13px Inter,sans-serif;fill:#1B2333}.fb-svg .fl1{font:900 19px Fraunces,serif;fill:#fff}.fb-svg .fl2{font:700 12.5px Inter,sans-serif;fill:#fff}.fb-svg .dl{font:800 12px Inter,sans-serif;fill:#fff}.fb-svg .ll{font:800 15px Inter,sans-serif}.fb-svg .rg{font:900 34px Fraunces,serif;fill:#1B2333}.fb-clear{animation:fbclear .5s cubic-bezier(.2,.8,.2,1)}' +
    '.fb-leg{display:flex;flex-wrap:wrap;gap:18px;align-items:center;font-size:13px;color:#586172}.fb-leg span{display:inline-flex;gap:7px;align-items:center}.fb-leg i{width:12px;height:22px;border-radius:2px;display:inline-block}.fb-leg i.o{width:22px;height:22px;border-radius:11px;background:#1B2333;color:#fff;font-style:normal;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center}' +
    '.fb-flip{margin-left:auto;border:2px solid #2F6BD8;background:#fff;color:#2F6BD8;border-radius:999px;padding:12px 20px;min-height:48px;font:inherit;font-weight:800;cursor:pointer}.fb-flip.on,.fb-flip:hover{background:#2F6BD8;color:#fff}' +
    '.fb-blurbs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px 24px}@media(max-width:1000px){.fb-blurbs{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.fb-blurbs{grid-template-columns:minmax(0,1fr)}}' +
    '.fb-bl{display:flex;gap:12px;align-items:flex-start}.fb-bl>i{flex:0 0 32px;height:32px;border-radius:16px;color:#fff;font-style:normal;font-weight:800;display:flex;align-items:center;justify-content:center}.fb-bl .t{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12px;font-weight:800;color:#586172}.fb-bl .chip{color:#fff;border-radius:999px;padding:3px 9px;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase}.fb-bl b{display:block;font-family:Fraunces,Georgia,serif;font-size:19px;line-height:1.15;margin:4px 0}.fb-bl p{margin:0;font-size:13.5px;line-height:1.45;color:#586172}' +
    '.fb-extras{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.fb-box{border:1px solid #E6E8EC;border-radius:16px;padding:16px 18px;background:#fff}.fb-box h4{margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#586172}.fb-box p{margin:8px 0 0;font-size:13.5px;line-height:1.5}.fb-box.big{display:flex;gap:18px;align-items:center}.fb-box.big h4{font-size:15px;letter-spacing:0;text-transform:none;color:#1B2333}' +
    '.fb-mood{width:100%;max-width:240px;display:block;margin:0 auto}.fb-sec{display:grid;grid-template-columns:110px 1fr 60px;gap:8px;align-items:center;font-size:13px;margin:6px 0}.fb-sec div{height:12px;background:#F1F3F6;border-radius:6px;overflow:hidden}.fb-sec i{display:block;height:100%;border-radius:6px}.fb-sec b{text-align:right}' +
    '.fb-econ{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fb-econ div{background:#F6F7F9;border-radius:10px;padding:8px 10px}.fb-econ small{display:block;font-size:11px;color:#586172;font-weight:700;text-transform:uppercase}.fb-econ b{font-family:Fraunces,serif;font-size:22px}.fb-econ span{display:block;font-size:11.5px;color:#586172}' +
    '.fb-hi small{font-weight:800;color:#E0672B;font-size:12px}.fb-hi b{display:block;font-family:Fraunces,serif;font-size:18px}.fb-hi p{margin:2px 0 10px}' +
    '.fb-cleargrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;animation:fbclear .5s}@media(max-width:900px){.fb-cleargrid{grid-template-columns:repeat(2,minmax(0,1fr))}}.fb-cleargrid .fb-stat{background:#EEF3FC}' +
    '#flipv{padding-bottom:180px}.fb-foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11.5px;color:#586172;flex-wrap:wrap}.fb-qr{display:inline-flex;gap:8px;align-items:center;font-weight:700}.fb-qr svg{width:38px;height:38px;fill:#1B2333}' +
    '.fb-samp{background:#FFF7E0;border-radius:12px;padding:10px 14px;font-size:13.5px}.fb-mut{color:#586172;font-size:12.5px;margin:0}#flipv>.fb-build .fb-mut,#flipv>.fb-mut{color:var(--mute)}.fb-big{font-family:Fraunces,Georgia,serif;font-size:clamp(20px,2vw,28px);line-height:1.3;margin:0}' +
    '.fb-tile{border-radius:22px;padding:22px 24px;display:flex;flex-direction:column;gap:8px}.fb-tile .ic{width:50px;height:50px;border-radius:25px;display:flex;align-items:center;justify-content:center}.fb-tile .ic svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.fb-tile small{font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#586172}.fb-tile b{font-family:Fraunces,serif;font-size:clamp(30px,3vw,48px);font-weight:900;line-height:1}.fb-tile p{margin:0;font-size:14px;line-height:1.45}' +
    '.fb-totbox{background:#F6F7F9;border-radius:22px;padding:22px 26px;display:flex;flex-direction:column;gap:14px}.fb-totbox .r{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap}.fb-totbox small{font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#586172}.fb-totbox b{font-family:Fraunces,serif;font-size:clamp(34px,4vw,60px);font-weight:900;line-height:1}' +
    '.fb-bar{height:30px;border-radius:15px;overflow:hidden;display:flex;background:#E6E8EC}.fb-bar i{display:block;height:100%}.fb-bleg{display:flex;flex-wrap:wrap;gap:20px;font-size:14px}.fb-bleg span{display:inline-flex;gap:8px;align-items:center}.fb-bleg i{width:14px;height:14px;border-radius:4px;display:inline-block}.fb-bleg em{font-style:normal;color:#586172}' +
    '.fb-pcs{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;align-items:end}.fb-pc{background:#F6F7F9;border-radius:20px;padding:18px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}.fb-pc .coins{position:relative;width:70px}.fb-pc .coins i{position:absolute;left:0;width:70px;height:14px;border-radius:7px;background:' + YEL + ';box-shadow:inset 0 -4px 0 #D9A92C,0 0 0 2px var(--cc)}.fb-pc b{font-family:Fraunces,serif;font-size:34px;font-weight:900}.fb-pc span{font-weight:700}.fb-pc small{color:#586172}' +
    '.fb-owns{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}.fb-own{border:1px solid #E6E8EC;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:4px}.fb-own .lg{min-width:44px;width:max-content;padding:0 10px;height:44px;font-size:16px!important;letter-spacing:.02em;border-radius:12px;color:#fff;font:900 22px Fraunces,serif;display:flex;align-items:center;justify-content:center;margin-bottom:6px}.fb-own b{font-family:Fraunces,serif;font-size:32px;font-weight:900}.fb-own small{color:#586172}' +
    '.fb-ring{width:160px;flex:none}' +
    '.fb-cells{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:6px}@media(max-width:900px){.fb-cells{grid-template-columns:repeat(6,minmax(0,1fr))}}.fb-cell{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 2px;border-radius:12px;background:#F6F7F9;text-align:center}.fb-cell.w{background:#E9F6EF}.fb-cell small{font-weight:800;color:#586172}.fb-cell b{font-family:Fraunces,serif;font-size:19px}.fb-cell span{font-size:11px;color:#586172}.fb-cell em{font-style:normal;font-size:10.5px;font-weight:800;color:#fff;background:#17845B;border-radius:8px;padding:2px 7px}' +
    '.fb-race,.fb-lanes{display:flex;flex-direction:column;gap:12px}.fb-rr{display:grid;grid-template-columns:minmax(0,1.3fr) 2fr 90px;gap:14px;align-items:center;font-size:15px}.fb-rr div{height:30px;background:#F1F3F6;border-radius:15px;overflow:hidden}.fb-rr i{display:block;height:100%;border-radius:15px}.fb-rr b{font-family:Fraunces,serif;font-size:28px}' +
    '.fb-lane{display:grid;grid-template-columns:34px minmax(0,1.2fr) 3fr 80px;gap:12px;align-items:center;font-size:15px}.fb-lane .pos{width:30px;height:30px;border-radius:15px;background:#1B2333;color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}.fb-lane .trk{position:relative;height:16px;background:repeating-linear-gradient(90deg,#F1F3F6 0 30px,#E6E8EC 30px 32px);border-radius:8px}.fb-lane .trk i{display:block;height:100%;border-radius:8px}.fb-lane .trk em{position:absolute;top:-7px;width:30px;height:30px;margin-left:-15px;border-radius:15px;background:#fff;border:4px solid}.fb-lane b{font-family:Fraunces,serif;font-size:22px;text-align:right}' +
    '.fb-dark{background:#1B2333;color:#fff;border-radius:24px;padding:28px;display:flex;flex-direction:column;gap:12px}.fb-dark small{color:#9FD8BC;font-weight:800;letter-spacing:.1em;text-transform:uppercase;font-size:13px}.fb-dark b{font-family:Fraunces,serif;font-size:clamp(44px,5vw,80px);font-weight:900;line-height:1}.fb-dark p{margin:0;color:#D9DEE6;font-size:16px;line-height:1.5}' +
    '.fb-ctl{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.fb-ctl span{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#9FD8BC;width:62px}.fb-ctl.light span{color:#586172}.fb-pill{border:2px solid #D5DAE2;background:#fff;color:#1B2333;border-radius:999px;padding:9px 14px;min-height:44px;font:inherit;font-weight:700;cursor:pointer}.fb-pill.on{background:#E0672B;border-color:#E0672B;color:#fff}' +
    '.fb-h3{font-family:Fraunces,serif;font-size:28px;margin:0 0 10px}.fb-wi{display:grid;grid-template-columns:110px 1fr 110px;gap:12px;align-items:center;padding:10px 14px;border:1px solid #E6E8EC;border-radius:14px;margin-bottom:8px}.fb-wi.on{border-color:#17845B;box-shadow:0 0 0 2px #17845B inset}.fb-wi b{font-family:Fraunces,serif;font-size:28px}.fb-wi b small{font-size:13px;color:#586172}.fb-wi div{height:24px;background:#F1F3F6;border-radius:12px;overflow:hidden}.fb-wi i{display:block;height:100%;background:linear-gradient(90deg,#17845B,#3BB27F)}.fb-wi em{font-style:normal;font-family:Fraunces,serif;font-size:24px;font-weight:900;color:#17845B;text-align:right}' +
    '.fb-wires{margin:10px 0;background:#E9F6EF;border-radius:16px;padding:14px 18px;display:flex;gap:14px;align-items:baseline;flex-wrap:wrap}.fb-wires small{font-weight:800;color:#586172}.fb-wires b{font-family:Fraunces,serif;font-size:34px;color:#17845B}.fb-note{background:#FFF7E0;border-radius:14px;padding:12px 16px;font-size:14px;line-height:1.5}.fb-nadv{border:3px solid #1B2333;border-radius:16px;padding:14px 20px;font-size:15px;line-height:1.5}' +
    '.fb-stks{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px}.fb-stk{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}.fb-stk .b{width:110px;height:110px;border-radius:55px;background:var(--sc);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 0 rgba(0,0,0,.15);transform:rotate(-6deg)}.fb-stk .b svg{width:56px;height:56px;fill:#fff}.fb-stk.off .b{background:#E6E8EC;box-shadow:none;transform:none}.fb-stk.off .b svg{fill:#C9CED6}.fb-stk span{font-size:12px;color:#586172;font-weight:700}' +
    '.fb-learn{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}@media(max-width:700px){.fb-learn{grid-template-columns:minmax(0,1fr)}}.fb-learn>div{border:3px dashed #D5DAE2;border-radius:22px;padding:24px;min-height:260px;display:flex;flex-direction:column;gap:12px}.fb-learn small{font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#E0672B}.fb-learn b{font-family:Fraunces,serif;font-size:40px}.fb-learn svg{width:220px}.fb-learn p{margin:0;font-size:17px;line-height:1.55}' +
    '.fb-spec{border-radius:20px;padding:22px;background:color-mix(in srgb,var(--sc) 12%,#fff);border-top:6px solid var(--sc)}.fb-spec b{font-family:Fraunces,serif;font-size:24px}.fb-spec p{margin:6px 0 0;font-size:14px;line-height:1.45}' +
    '.fb-build{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:22px;display:flex;flex-direction:column;gap:18px}.fb-build h3{margin:0;font-size:24px}.fb-build p{margin:4px 0 0;color:var(--mute)}.fb-bhead{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:flex-end}.fb-count{text-align:right}.fb-count b{display:block;font-size:44px;line-height:1;color:#E0672B}.fb-count span{color:var(--mute);font-size:13px}' +
    '.fb-startbox{border:1px solid var(--line);border-radius:16px;padding:16px 18px}.fb-startbox h4{margin:0;font-size:17px}.fb-startbox select{font:inherit;font-size:16px;padding:8px 12px;min-height:44px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);margin-left:6px}.fb-mini{margin-top:12px;color:var(--ink)}' +
    '.fb-grps{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}.fb-grp{border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin:0;display:flex;flex-direction:column;gap:6px}.fb-grp legend{font-weight:800;padding:0 6px;font-size:14px}.fb-ck{display:flex;gap:12px;align-items:flex-start;padding:8px 6px;border-radius:10px;cursor:pointer;min-height:44px}.fb-ck:hover{background:var(--bg)}.fb-ck input{width:22px;height:22px;flex:none;margin:2px 0 0;accent-color:#17845B}.fb-ck b{display:block;font-size:14.5px}.fb-ck small{display:block;color:var(--mute);font-size:12.5px;line-height:1.4}' +
    '.fb-mk{display:flex!important;flex-direction:row!important;align-items:center;gap:8px;font-weight:700;margin-right:6px}.fb-mk select{font:inherit;font-weight:700;padding:10px 14px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--ink);cursor:pointer}.fb-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.fb-row.end{justify-content:flex-end}.fb-btn{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:10px 18px;min-height:44px;font:inherit;font-weight:700;cursor:pointer}.fb-paper .fb-btn{background:#fff;color:#1B2333;border-color:#D5DAE2}.fb-btn.pri{background:#E0672B;border-color:#E0672B;color:#fff}' +
    '.fb-steps{margin:0;padding-left:20px;line-height:1.7}.fb-tbl{overflow-x:auto}.fb-tbl table{width:100%;border-collapse:collapse;font-size:14px}.fb-tbl th,.fb-tbl td{text-align:left;padding:10px;border-bottom:1px solid var(--line)}.fb-tbl small{color:var(--mute)}.fb-build .fb-stat{background:var(--bg);color:var(--ink)}.fb-build .fb-stat small,.fb-build .fb-stat span{color:var(--mute)}' +
    '.fb-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#1B2333;color:#fff;padding:12px 18px;border-radius:12px;font:600 14px Inter,system-ui,sans-serif;z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,.3)}' +
    '@media(max-width:700px){#flipv{padding:0 12px 30px}.fb-flip{margin-left:0}}';

  window.Flipbook = {
    mount: function (el) {
      root = el;
      if (!document.getElementById("fb-css")) { var s = document.createElement("style"); s.id = "fb-css"; s.textContent = CSS; document.head.appendChild(s); var f = document.createElement("link"); f.rel = "stylesheet"; f.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800;9..144,900&family=Inter:wght@400;600;700;800&display=swap"; document.head.appendChild(f); }
      if (!bound) { bound = true; el.addEventListener("click", act); el.addEventListener("change", act); document.addEventListener("keydown", key); }
      if (!D) { el.textContent = "Flipbook data could not load. Refresh the page."; return; }
      if (!ST.loaded) { render(); load(); } else { render(); syncRemote(); }
    }
  };
  if (/#flipbook=/.test(location.hash || "")) { if (!ST.loaded) load(); importFromHash(); }
  /* Opening the link in a tab that is already open only changes the # part, so listen for that too. */
  window.addEventListener("hashchange", function () { if (/#flipbook=/.test(location.hash || "")) { if (!ST.loaded) load(); importFromHash(); } });
})();
