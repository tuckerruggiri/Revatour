/* Futures page: a visual, quick-to-learn hub for futures day trading with funded accounts (Apex), NinjaTrader,
   trade copying, session timing, the 9:30 open, strategies and risk. Pictures first, short lines, a quiz per tab.
   Prop-firm rules change often, so rule blocks carry a "last checked" date. Education only. */
(function (root) {
  "use strict";
  var CHECKED = "October 2026";
  var CSS = [
    "#futv.wrap{max-width:none;width:100%;box-sizing:border-box;padding-left:28px;padding-right:28px}",
    ".fu-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 18px}",
    ".fu-tabs button{border:1px solid var(--line);border-radius:99px;padding:8px 16px;background:var(--panel);color:var(--ink);font:inherit;font-size:14px;cursor:pointer}",
    ".fu-tabs button:hover{background:var(--bg);color:var(--ink);border-color:var(--accent)}",
    ".fu-tabs button.on,.fu-tabs button.on:hover{background:var(--accent);border-color:var(--accent);color:var(--accent-ink,#fff)}",
    ".fu-h{margin:26px 0 10px;font-size:20px}.fu-h:first-child{margin-top:4px}",
    ".fu-sub{color:var(--mute);margin:-4px 0 12px;font-size:14px}",
    ".fu-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}",
    ".fu-tile{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:14px;display:grid;gap:4px;align-content:start}",
    ".fu-tile .ic{font-size:30px;line-height:1.1}.fu-tile b{font-size:16px}.fu-tile span{font-size:14px;color:var(--mute);line-height:1.4}",
    ".fu-tile.g{border-left:5px solid var(--gain)}.fu-tile.r{border-left:5px solid var(--loss)}.fu-tile.y{border-left:5px solid #d97706}.fu-tile.b{border-left:5px solid #2563eb}",
    ".fu-flow{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}",
    ".fu-step{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:14px;display:grid;gap:4px;align-content:start;position:relative}",
    ".fu-step .n{width:30px;height:30px;border-radius:50%;background:var(--accent);color:var(--accent-ink,#fff);display:flex;align-items:center;justify-content:center;font-weight:700}",
    ".fu-step .ic{font-size:30px;line-height:1.1;position:absolute;right:14px;top:10px}.fu-step b{font-size:16px;margin-top:4px}.fu-step span{font-size:14px;color:var(--mute);line-height:1.4}",
    ".fu-stat{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:14px;text-align:center}.fu-stat b{display:block;font-size:30px;line-height:1.1}.fu-stat span{font-size:13px;color:var(--mute)}",
    ".fu-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}",
    ".fu-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}@media(max-width:900px){.fu-2{grid-template-columns:1fr}}",
    ".fu-fig{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:10px}.fu-fig svg{width:100%;height:auto;display:block}.fu-fig figcaption{font-size:13px;color:var(--mute);margin:4px 4px 0}",
    ".fu-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:14px}@media(max-width:480px){.fu-cards{grid-template-columns:1fr}}",
    ".fu-card{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:14px 16px;display:grid;gap:8px;align-content:start}.fu-card h3{margin:0;font-size:17px}",
    ".fu-row{display:flex;gap:8px;align-items:baseline;font-size:14px;line-height:1.4}.fu-row i{font-style:normal;font-size:11px;font-weight:700;text-transform:uppercase;border-radius:6px;padding:2px 7px;min-width:54px;text-align:center;flex:none}",
    ".fu-row i.e{background:var(--accent);color:var(--accent-ink,#fff)}.fu-row i.s{background:rgba(220,38,38,.16);color:var(--loss)}.fu-row i.t{background:rgba(22,163,74,.18);color:var(--gain)}.fu-row i.k{background:var(--bg);color:var(--mute);border:1px solid var(--line)}",
    ".fu-big{font-size:17px;line-height:1.5}",
    ".fu-calc{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin:6px 0 10px}.fu-calc label{display:grid;gap:4px;font-size:13px;color:var(--mute)}",
    ".fu-calc input,.fu-calc select{width:auto;min-width:110px;padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit}",
    ".fu-out{display:flex;gap:10px;flex-wrap:wrap}.fu-out div{border:1px solid var(--line);border-radius:12px;background:var(--bg);padding:10px 16px;min-width:150px}.fu-out b{display:block;font-size:24px}.fu-out span{font-size:12px;color:var(--mute)}",
    ".fu-now{font-size:15px;line-height:1.5;margin:0 0 12px;padding:12px 16px;border-radius:12px;border:1px solid var(--line);border-left-width:5px;background:var(--panel)}.fu-now b{font-size:18px}",
    ".fu-now.fu-good{border-left-color:var(--gain)}.fu-now.fu-warn{border-left-color:#d97706}.fu-now.fu-bad{border-left-color:var(--loss)}",
    ".fu-note{border-left:5px solid #d97706;background:rgba(217,119,6,.10);border-radius:10px;padding:10px 14px;margin:14px 0;line-height:1.5;font-size:14px}",
    ".fu-chk{font-size:12px;color:var(--mute);margin:10px 0 0}.fu-chk a{color:var(--accent)}",
    ".fu-bar{display:grid;grid-template-columns:130px 1fr 40px;gap:10px;align-items:center;margin:6px 0;font-size:14px}.fu-bar div{height:22px;border-radius:6px;background:var(--bg);border:1px solid var(--line);overflow:hidden}.fu-bar i{display:block;height:100%}",
    ".fu-ck{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px}.fu-ck label{display:flex;gap:10px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:10px 12px;cursor:pointer;background:var(--panel);font-size:15px}.fu-ck input{flex:none;width:20px;height:20px;margin:0}",
    ".fu-quiz{border:2px dashed var(--line);border-radius:16px;padding:14px 16px;background:var(--panel)}.fu-q{margin:0 0 14px}.fu-q p{margin:0 0 6px;font-weight:700;font-size:16px}",
    ".fu-opt{display:block;width:100%;text-align:left;margin:6px 0;padding:10px 14px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;cursor:pointer}.fu-opt:hover{border-color:var(--accent)}",
    ".fu-opt.ok{border-color:var(--gain);background:rgba(22,163,74,.18)}.fu-opt.no{border-color:var(--loss);background:rgba(220,38,38,.14)}",
    ".fu-why{display:none;margin:4px 0 0;font-size:14px;color:var(--mute)}.fu-why.on{display:block}",
    ".fu-con{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:14px;display:grid;gap:6px}.fu-con .sym{font-size:22px;font-weight:800}.fu-con small{font-size:12px;color:var(--mute);font-weight:400}",
    ".fu-con .line{display:grid;grid-template-columns:44px 1fr;gap:8px;align-items:center;font-size:13px}.fu-con .line div{height:10px;border-radius:5px;background:#2563eb}.fu-con .line div.m{background:#16a34a}",
    "#futv .fu-ck label{display:flex;flex-direction:row;align-items:center;justify-content:flex-start;text-align:left;gap:10px}#futv .fu-ck label span{flex:1;color:var(--ink)}#futv .fu-ck input{width:20px;height:20px;margin:0;flex:none}",
    "#futv,#futv .fu-2>*,#futv .fu-cards>*,#futv .fu-card,#futv .fu-fig{min-width:0;max-width:100%}@media(max-width:700px){#futv .fu-fig{overflow-x:auto}#futv .fu-fig svg{min-width:560px}#futv .fu-tiles[style]{grid-template-columns:1fr!important}}"
  ].join("");

  var CON = [
    ["ES", "S&amp;P 500", 12.5, 50, "MES", 1.25, 5], ["NQ", "Nasdaq-100", 5, 20, "MNQ", 0.5, 2], ["YM", "Dow", 5, 5, "MYM", 0.5, 0.5],
    ["RTY", "Russell 2000", 5, 50, "M2K", 0.5, 5], ["CL", "Crude oil", 10, 1000, "MCL", 1, 100], ["GC", "Gold", 10, 100, "MGC", 1, 10]
  ];
  var TICK = { ES: 12.5, MES: 1.25, NQ: 5, MNQ: 0.5, YM: 5, MYM: 0.5, RTY: 5, M2K: 0.5, CL: 10, MCL: 1, GC: 10, MGC: 1 };
  var TABS = [["start", "🚀 Start here"], ["funded", "💰 Funded accounts"], ["nt", "🖥️ NinjaTrader"], ["copy", "🔁 Trade copying"], ["time", "⏰ Sessions & timing"], ["open", "🔔 9:30 open"], ["strat", "📈 Strategies"], ["risk", "🛡️ Risk"], ["tips", "💡 Tips & mistakes"]];
  var ST = { tab: "start", con: "MES", ticks: 8, n: 2, budget: 200, master: 2, msize: 50, o29: 6000, c29: 6001.5, px: 6012, stopPts: 3, cushion: 2500, dlim: 1000 };

  function money(x) { return "$" + (Math.round(x * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function link(u, t) { return '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + t + "</a>"; }
  function H(t, sub) { return '<h2 class="fu-h">' + t + "</h2>" + (sub ? '<p class="fu-sub">' + sub + "</p>" : ""); }
  function tile(ic, t, line, cls) { return '<div class="fu-tile ' + (cls || "") + '"><div class="ic">' + ic + "</div><b>" + t + "</b>" + (line ? "<span>" + line + "</span>" : "") + "</div>"; }
  function tiles(a) { return '<div class="fu-tiles">' + a.join("") + "</div>"; }
  function step(n, ic, t, line) { return '<div class="fu-step"><div class="n">' + n + '</div><div class="ic">' + ic + "</div><b>" + t + "</b><span>" + line + "</span></div>"; }
  function flow(a) { return '<div class="fu-flow">' + a.join("") + "</div>"; }
  function stat(v, l) { return '<div class="fu-stat"><b>' + v + "</b><span>" + l + "</span></div>"; }
  function row(k, l, t) { return '<div class="fu-row"><i class="' + k + '">' + l + "</i><span>" + t + "</span></div>"; }
  function checks(a) { return '<div class="fu-ck">' + a.map(function (t) { return '<label><input type="checkbox"><span>' + t + "</span></label>"; }).join("") + "</div>"; }
  function checked(x) { return '<p class="fu-chk">Last checked ' + CHECKED + (x ? ". " + x : "") + ". Rules change often: confirm in your own dashboard.</p>"; }
  var QN = 0;
  function quiz(items) {
    var id = "q" + (++QN);
    return H("🎮 Test yourself") + '<div class="fu-quiz">' + items.map(function (it, qi) {
      return '<div class="fu-q"><p>' + it.q + "</p>" + it.a.map(function (a, ai) { return '<button type="button" class="fu-opt" data-fuq="' + id + "-" + qi + '" data-ok="' + (ai === it.c ? 1 : 0) + '">' + a + "</button>"; }).join("") + '<div class="fu-why" data-why="' + id + "-" + qi + '">' + it.why + "</div></div>";
    }).join("") + "</div>";
  }

  /* ---------- mini candle chart ---------- */
  function mc(o) {
    var w = o.w || 440, h = o.h || 215, n = o.c.length, L = 12, R = 92, T = 26, B = 22, lo = 1e9, hi = -1e9;
    o.c.forEach(function (c) { lo = Math.min(lo, c[2]); hi = Math.max(hi, c[1]); });
    (o.lines || []).forEach(function (l) { lo = Math.min(lo, l.y); hi = Math.max(hi, l.y); });
    var pad = (hi - lo) * 0.14; lo -= pad; hi += pad;
    var Y = function (v) { return T + (h - T - B) * (1 - (v - lo) / (hi - lo)); }, dx = (w - L - R) / n, X = function (i) { return L + dx * (i + 0.5); }, cw = Math.min(16, dx * 0.55);
    var s = '<svg viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="' + (o.alt || "Candlestick example") + '">';
    (o.bands || []).forEach(function (b) { s += '<rect x="' + L + '" y="' + Y(Math.max(b.a, b.b)) + '" width="' + (w - L - R + 10) + '" height="' + Math.abs(Y(b.a) - Y(b.b)) + '" fill="' + b.col + '" opacity=".16"/>'; });
    (o.lines || []).forEach(function (l) { s += '<line x1="' + L + '" x2="' + (w - R + 8) + '" y1="' + Y(l.y) + '" y2="' + Y(l.y) + '" stroke="' + l.col + '" stroke-width="2" stroke-dasharray="6 4"/><text x="' + (w - 4) + '" y="' + (Y(l.y) + 4) + '" text-anchor="end" style="font:700 12px system-ui,sans-serif" fill="' + l.col + '">' + l.t + "</text>"; });
    [["ema", "#d97706"], ["vw", "#7c3aed"]].forEach(function (k) { if (o[k[0]]) s += '<polyline fill="none" stroke="' + k[1] + '" stroke-width="2.5" points="' + o[k[0]].map(function (v, i) { return X(i).toFixed(1) + "," + Y(v).toFixed(1); }).join(" ") + '"/>'; });
    o.c.forEach(function (c, i) { var up = c[3] >= c[0], col = up ? "#16a34a" : "#dc2626", x = X(i); s += '<line x1="' + x + '" x2="' + x + '" y1="' + Y(c[1]) + '" y2="' + Y(c[2]) + '" stroke="' + col + '" stroke-width="2"/><rect x="' + (x - cw / 2) + '" y="' + Y(Math.max(c[0], c[3])) + '" width="' + cw + '" height="' + Math.max(3, Math.abs(Y(c[0]) - Y(c[3]))) + '" fill="' + col + '"/>'; });
    (o.marks || []).forEach(function (m) {
      var x = X(m.i), y = Y(m.y), ty = m.pos === "below" ? y + 16 : y - 8;
      if (m.arrow) s += '<polygon points="' + (m.arrow === "up" ? x + "," + (y + 3) + " " + (x - 7) + "," + (y + 16) + " " + (x + 7) + "," + (y + 16) : x + "," + (y - 3) + " " + (x - 7) + "," + (y - 16) + " " + (x + 7) + "," + (y - 16)) + '" fill="' + m.col + '"/>';
      s += '<text x="' + x + '" y="' + (m.arrow === "up" ? y + 30 : m.arrow === "down" ? y - 21 : ty) + '" text-anchor="middle" style="font:700 12px system-ui,sans-serif;stroke:var(--panel);stroke-width:4px;paint-order:stroke" fill="' + m.col + '">' + m.t + "</text>";
    });
    return s + "</svg>";
  }
  function fig(svg, cap) { return '<figure class="fu-fig" style="margin:0">' + svg + (cap ? "<figcaption>" + cap + "</figcaption>" : "") + "</figure>"; }

  /* ---------- Start here ---------- */
  function riskOut() {
    var pt = ST.ticks * (TICK[ST.con] || 1.25), risk = pt * ST.n, maxN = pt > 0 ? Math.floor(ST.budget / pt) : 0;
    return '<div class="fu-out"><div><b>' + money(risk) + "</b><span>risk on this trade</span></div><div><b>" + money(pt) + "</b><span>risk per contract</span></div><div><b>" + maxN + "</b><span>contracts that fit " + money(ST.budget) + "</span></div></div>";
  }
  function tStart() {
    var cons = CON.map(function (c) {
      return '<div class="fu-con"><div class="sym">' + c[0] + " <small>" + c[1] + '</small></div><div class="line"><b>' + c[0] + '</b><div style="width:100%"></div></div><span style="font-size:13px">1 tick = <b>' + money(c[2]) + "</b> &middot; 1 point = <b>" + money(c[3]) + '</b></span><div class="line"><b>' + c[4] + '</b><div class="m" style="width:10%"></div></div><span style="font-size:13px">1 tick = <b>' + money(c[5]) + "</b> &middot; 1 point = <b>" + money(c[6]) + "</b></span></div>";
    }).join("");
    var opts = Object.keys(TICK).map(function (k) { return '<option value="' + k + '"' + (k === ST.con ? " selected" : "") + ">" + k + "</option>"; }).join("");
    return H("What are futures?", "Trade price moves. Open and close the same day.") + tiles([
      tile("🕐", "Nearly 24 hours", "Sunday night to Friday afternoon", "b"), tile("🚫", "No PDT rule", "No $25,000 minimum", "g"), tile("🌊", "Deep volume", "S&amp;P 500 fills fast", "b"),
      tile("💳", "Funded accounts", "Trade the firm's money, by their rules", "g"), tile("⚡", "Leverage", "Small move, real dollars. Respect it.", "y")]) +
      H("Pick a contract", "Every contract has a big version and a micro. The micro is 10x smaller. Start micro.") + '<div class="fu-tiles" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">' + cons + "</div>" +
      H("💵 How many dollars on the line?", "Pick the contract, your stop in ticks, and the contracts.") + '<div class="fu-card"><div class="fu-calc"><label>Contract<select data-fu="con">' + opts + '</select></label><label>Stop (ticks)<input data-fu="ticks" type="number" min="1" value="' + ST.ticks + '"></label><label>Contracts<input data-fu="n" type="number" min="1" value="' + ST.n + '"></label><label>Risk budget ($)<input data-fu="budget" type="number" min="1" step="10" value="' + ST.budget + '"></label></div><div id="fu-risk">' + riskOut() + "</div></div>" +
      quiz([{ q: "MES: 1 tick = $1.25. Stop is 8 ticks, you trade 2 contracts. What is your risk?", a: ["$10", "$20", "$40"], c: 1, why: "8 ticks x $1.25 x 2 contracts = $20." }, { q: "You are new. Mini or micro?", a: ["Mini (ES)", "Micro (MES)"], c: 1, why: "A micro is one tenth the size. Mistakes cost 10x less." }]) +
      '<div class="fu-note"><b>Education only.</b> Futures can lose money fast, and most people who try funded evaluations are not paid out.</div>';
  }

  /* ---------- Funded accounts ---------- */
  function ddSvg() {
    var W = 760, H2 = 280, L = 70, R = 24, T = 20, B = 36, xs = function (i) { return L + (W - L - R) * i / 9; };
    var bal = [50000, 50600, 51400, 51000, 52100, 51500, 52600, 51900, 52300, 52000], ysc = function (v) { return T + (H2 - T - B) * (1 - (v - 47000) / (53500 - 47000)); };
    var thr = [], peak = 0, i;
    for (i = 0; i < bal.length; i++) { peak = Math.max(peak, bal[i]); thr.push(Math.min(peak - 2500, 50100)); }
    function pts(a) { return a.map(function (v, k) { return xs(k).toFixed(1) + "," + ysc(v).toFixed(1); }).join(" "); }
    var s = '<svg viewBox="0 0 ' + W + " " + H2 + '" role="img" aria-label="Trailing drawdown: the loss limit rises behind your highest balance, then stops at starting balance plus 100 dollars in a performance account">';
    [48000, 50000, 52000].forEach(function (v) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + ysc(v) + '" y2="' + ysc(v) + '" stroke="currentColor" opacity=".12"/><text x="' + (L - 8) + '" y="' + (ysc(v) + 4) + '" text-anchor="end" style="font:11px system-ui,sans-serif" fill="currentColor" opacity=".7">' + money(v) + "</text>"; });
    s += '<polyline fill="none" stroke="#2563eb" stroke-width="3" points="' + pts(bal) + '"/><polyline fill="none" stroke="#dc2626" stroke-width="3" stroke-dasharray="7 5" points="' + pts(thr) + '"/>';
    s += '<text x="' + xs(5.2) + '" y="' + (ysc(52900) - 8) + '" style="font:700 13px system-ui,sans-serif" fill="#2563eb">Your balance</text>';
    s += '<text x="' + xs(0.1) + '" y="' + (ysc(47500) + 22) + '" style="font:700 13px system-ui,sans-serif" fill="#dc2626">Loss limit: touch it and you are out</text>';
    s += '<text x="' + xs(6.3) + '" y="' + (ysc(50100) - 8) + '" style="font:12px system-ui,sans-serif" fill="currentColor">Stops rising at start + $100 (PA)</text></svg>';
    return fig(s, "Example: $50,000 account, $2,500 trailing drawdown. Your numbers may differ.");
  }
  function tFunded() {
    return H("The journey", "From paying for a test to getting paid.") + flow([step(1, "🛒", "Buy an evaluation", "Pay a fee. Trade a sim account."), step(2, "🎯", "Hit the target", "Without breaking the loss limits."), step(3, "✅", "Activate a funded account", "Apex calls it a PA."), step(4, "💰", "Request payouts", "Minimums and caps apply.")]) +
      '<div class="fu-note">The firm earns from fees, not your trading. Treat the fee like a ticket. Only pay what you can afford to lose.</div>' +
      H("Apex at a glance") + '<div class="fu-stats">' + stat("30 days", "to pass the evaluation") + stat("$3,000", "profit target, 50K account") + stat("4:59 PM", "be flat (ET)") + stat("50%", "max single-day share of profit (new PA)") + stat("$500", "minimum payout") + stat("6", "payouts max (new PAs only)") + "</div>" + checked("Compiled from " + link("https://www.tradervana.com/guides/apex-trader-funding-rules", "Tradervana") + ". Sources disagree on some numbers, like 30% vs 50% consistency") +
      H("Which account do you have?", "Apex has two kinds. Their payout rules differ a lot.") + '<div class="fu-2"><div class="fu-card" style="border-left:5px solid #2563eb"><h3>🆕 New EOD / Intraday PA <small style="font-weight:400;color:var(--mute)">bought on or after Mar 1, 2026</small></h3>' + row("e", "Payouts", "Max 6, then the account closes") + row("e", "Caps", "A per-payout cap on all 6") + row("e", "Consistency", "No day 50% or more of profit since last payout") + row("e", "Split", "100%") + row("e", "To request", "5 qualifying days, $500 minimum") + '</div><div class="fu-card" style="border-left:5px solid #d97706"><h3>📼 Legacy PA <small style="font-weight:400;color:var(--mute)">bought before Mar 1, 2026</small></h3>' + row("t", "Payouts", "No limit on the number") + row("t", "Caps", "Only on the first 5 payouts") + row("t", "Consistency", "30% rule until the 6th payout, then it ends") + row("t", "Split", "100% of the first $25,000, then 90%") + row("t", "To request", "8-day cycle, $500 minimum") + '</div></div><div class="fu-note"><b>The "6" is not for Legacy accounts.</b> On a Legacy PA, 6 is where the consistency rule ends and caps stop, not where payouts stop. The 6-payout maximum is for the new accounts. The two types cannot be converted into each other.</div>' + checked("From " + link("https://propnavi.io/en/blog/apex-payout-guide/", "PropNavi") + " (updated Sept 2026). I could not open Apex's own help-center page, so check your account type there") +
      H("The rule that ends most accounts", "The trailing drawdown: your loss limit climbs with your best balance and never goes down.") + ddSvg() +
      '<div class="fu-2" style="margin-top:12px">' + tile("📅", "EOD trail", "Limit updates once a day from the closing balance.", "g") + tile("⏱️", "Intraday trail", "Follows your peak, even unrealized profit. Stricter.", "r") + "</div>" +
      H("Not just Apex") + tiles([tile("🅰️", "Apex", "Up to 20 PAs. Bots and others trading for you banned.", "b"), tile("🏔️", "Topstep", "Own platform (TopstepX). 5 funded accounts.", ""), tile("🚫", "Take Profit Trader", "No opposite positions across accounts. ES vs MES counts.", ""), tile("👥", "Tradeify", "Built-in group trading, up to 5 accounts.", ""), tile("🏠", "FundedNext", "Copy only between your own challenge accounts.", ""), tile("🔒", "Alpha Futures", "No automation, no group or reverse trading.", "")]) + checked("From " + link("https://damnpropfirms.com/blog/trade-copying-rules-for-futures-prop-firms/", "DamnPropFirms") + " (July 2026)") +
      H("✅ Before you buy any evaluation") + checks(["I know if the drawdown is end-of-day or intraday", "I know the daily loss limit", "I know the contract limit", "I know the consistency rule", "I know the fees and payout minimums", "I know when I must be flat", "I can afford to lose the fee"]) +
      quiz([{ q: "In a funded PA, the trailing loss limit stops rising at...", a: ["Never", "Starting balance + $100", "When you pass"], c: 1, why: "Per Apex's published rules, it locks at start + $100." }, { q: "You must close all trades before...", a: ["4:59 PM ET", "Midnight", "9:30 AM"], c: 0, why: "Apex requires flat before 4:59 PM ET." }, { q: "A Legacy PA (bought before Mar 1, 2026) has a maximum of 6 payouts.", a: ["True", "False"], c: 1, why: "Only the new EOD and Intraday PAs stop at 6. Legacy accounts have no payout-count limit." }, { q: "Which drawdown is stricter on open profits?", a: ["EOD trail", "Intraday trail"], c: 1, why: "Intraday trail counts unrealized peak profit, so a trade that goes green then red still ratchets the limit up." }]);
  }

  /* ---------- NinjaTrader ---------- */
  function bracketSvg() {
    return mc({ alt: "Trade bracket: entry line with an automatic stop below and target above", w: 460, h: 240, c: [[50, 51, 49.5, 50.6], [50.6, 52, 50.2, 51.8], [51.8, 52.2, 50.9, 51.2], [51.2, 53, 51, 52.8], [52.8, 55, 52.6, 54.7], [54.7, 56.5, 54.4, 56.2]], bands: [{ a: 52.4, b: 55.8, col: "#16a34a" }, { a: 50.6, b: 52.4, col: "#dc2626" }], lines: [{ y: 55.8, t: "TARGET", col: "#16a34a" }, { y: 52.4, t: "ENTRY", col: "#0a84ff" }, { y: 50.6, t: "STOP", col: "#dc2626" }], marks: [{ i: 3, y: 52.4, arrow: "up", t: "Buy", col: "#16a34a" }] });
  }
  function tNt() {
    return H("Get connected in 5 steps") + flow([step(1, "🔑", "Get your login", "From your Apex dashboard."), step(2, "🔌", "Connections", "Control Center, then Configure."), step(3, "📊", "Open MES", "1 minute chart. Pick the front month."), step(4, "🧪", "Practice in Sim", "Use the Sim101 account first."), step(5, "🎯", "Trade with ATM", "Stop and target attach for you.")]) +
      H("ATM strategy: your safety net", "Save it once. Every entry gets a stop and a target automatically.") + '<div class="fu-2">' + fig(bracketSvg(), "ENTRY with a STOP below and a TARGET above, placed for you.") + '<div class="fu-tiles" style="grid-template-columns:1fr 1fr">' + tile("🛑", "Stop on every trade", "No stop, no trade.", "r") + tile("🎯", "Target set", "1.5 to 2 times your risk.", "g") + tile("📏", "Size from the stop", "Contracts follow your risk budget.", "b") + tile("💾", "Save the template", "Same bracket each time.", "") + "</div></div>" +
      H("Tools to learn") + tiles([tile("🖱️", "Chart Trader", "Click on the chart to place orders."), tile("📚", "SuperDOM", "The order ladder for fast fills."), tile("🧩", "Templates", "Save your chart look."), tile("⌨️", "Hotkeys", "Flatten, move stop, reverse."), tile("📒", "Account Performance", "Your trade log."), tile("🚨", "Flatten Everything", "One click panic button.", "r")]) +
      H("When something breaks", "Problem &rarr; fix") + '<div class="fu-tiles" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">' + tile("📵", "No data", "Check login, provider, and other open sessions.") + tile("🧷", "No stop attached", "You skipped the ATM template.") + tile("📆", "Wrong contract month", "Roll to the front month.") + tile("🗂️", "Layout lost", "Save a workspace.") + "</div>" +
      quiz([{ q: "What puts a stop and target on every order automatically?", a: ["SuperDOM", "ATM strategy", "Hotkeys"], c: 1, why: "ATM strategies attach your saved bracket to each entry." }, { q: "Where do you practice first?", a: ["Live account", "Sim101"], c: 1, why: "Sim101 is NinjaTrader's built-in simulation account." }]) +
      '<p class="fu-chk">NinjaTrader menu names can differ between versions. Your firm tells you which connection to use.</p>';
  }

  /* ---------- Trade copying ---------- */
  function copyOut() {
    var sizes = [25, 50, 100, 150], res = sizes.map(function (z) { return Math.max(1, Math.round(ST.master * z / ST.msize)); }), mx = Math.max.apply(null, res.concat([ST.master]));
    function bar(l, n, col) { return '<div class="fu-bar"><span>' + l + '</span><div><i style="width:' + Math.max(4, n / mx * 100) + "%;background:" + col + '"></i></div><b>' + n + "</b></div>"; }
    return bar("⭐ Master " + ST.msize + "K", ST.master, "#d97706") + sizes.map(function (z, i) { return bar("Follower " + z + "K", res[i], "#2563eb"); }).join("");
  }
  function copySvg() {
    var s = '<svg viewBox="0 0 520 220" role="img" aria-label="One master account sends its orders to three follower accounts">';
    s += '<rect x="20" y="85" width="130" height="50" rx="12" fill="#d97706" opacity=".9"/><text x="85" y="115" text-anchor="middle" style="font:700 15px system-ui,sans-serif" fill="#fff">⭐ You trade here</text>';
    [[20, "Follower A"], [85, "Follower B"], [150, "Follower C"]].forEach(function (f) { s += '<path d="M150 110 C 250 110, 250 ' + (f[0] + 25) + ', 340 ' + (f[0] + 25) + '" fill="none" stroke="#2563eb" stroke-width="3"/><rect x="340" y="' + f[0] + '" width="150" height="50" rx="12" fill="none" stroke="#2563eb" stroke-width="2.5"/><text x="415" y="' + (f[0] + 31) + '" text-anchor="middle" style="font:700 14px system-ui,sans-serif" fill="currentColor">' + f[1] + "</text>"; });
    s += '<text x="250" y="210" text-anchor="middle" style="font:13px system-ui,sans-serif" fill="currentColor" opacity=".7">The copier mirrors each order</text></svg>';
    return fig(s);
  }
  function tCopy() {
    var so = [25, 50, 100, 150].map(function (z) { return '<option value="' + z + '"' + (z === ST.msize ? " selected" : "") + ">" + z + "K</option>"; }).join("");
    return H("What is it?", "You trade one account. Software copies it to the others.") + '<div class="fu-2">' + copySvg() + '<div class="fu-tiles" style="grid-template-columns:1fr">' + tile("⚡", "Faster", "Same trade in every account, no clicking.", "g") + tile("🧠", "You still decide", "You make every call. That keeps you within the rules.", "b") + "</div></div>" +
      H("What is allowed, what is not") + '<div class="fu-2"><div class="fu-card" style="border-left:5px solid var(--gain)"><h3>✅ Usually OK</h3>' + row("t", "OK", "Copying between accounts you own") + row("t", "OK", "Scaling size by account") + row("t", "OK", "You pressing the buttons") + '</div><div class="fu-card" style="border-left:5px solid var(--loss)"><h3>❌ Banned or risky</h3>' + row("s", "NO", "Signal services trading your account") + row("s", "NO", "Opposite trades across accounts") + row("s", "NO", "Fully automated bots") + "</div></div>" +
      H("How accounts get failed") + tiles([tile("↔️", "Hedging", "Long ES in one account, short MES in another.", "r"), tile("📏", "Same size everywhere", "Newer accounts have lower contract caps.", "r"), tile("🏆", "One huge winner", "Copied everywhere, it breaks consistency in all.", "r"), tile("🕹️", "Someone else in control", "You must be the trader.", "r")]) +
      H("Size the followers", "Smaller account, fewer contracts.") + '<div class="fu-card"><div class="fu-calc"><label>Master account<select data-fu="msize">' + so + '</select></label><label>Master contracts<input data-fu="master" type="number" min="1" value="' + ST.master + '"></label></div><div id="fu-copy">' + copyOut() + '</div><p class="fu-chk">Check each account\'s current contract cap in its dashboard.</p></div>' +
      H("Tools") + tiles([tile("🥷", "NinjaTrader copier", "Check what your version has."), tile("🧰", "Third-party", "Replikanto, Tradesyncer, Copilink."), tile("☁️", "VPS", "A rented PC keeps it running fast."), tile("🏢", "Firm tools", "Tradeify and TopstepX have built-in.")]) +
      checked("Sources: " + link("https://damnpropfirms.com/blog/trade-copying-rules-for-futures-prop-firms/", "DamnPropFirms") + " and " + link("https://blog.pickmytrade.io/apex-copy-trading-rules-account-failed/", "PickMyTrade") + ". Apex has no blanket approval of copier software, so ask their support") +
      H("✅ Safe setup") + checks(["All accounts are in my name", "I read each firm's copy rules", "I scale by account size", "All accounts trade the same direction", "I tested on sim first", "I have a flatten-all button"]) +
      quiz([{ q: "Account A long ES, account B short MES. This is...", a: ["Fine", "Hedging, which is banned"], c: 1, why: "Opposite positions on correlated products across your accounts count as hedging." }, { q: "Why not copy the same contract count to every account?", a: ["It costs more", "Newer accounts have lower caps"], c: 1, why: "Contract limits grow with profit, so small or new accounts can be over their cap." }]);
  }

  /* ---------- Sessions & timing ---------- */
  function etNow() {
    try {
      var p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()), o = {};
      p.forEach(function (x) { o[x.type] = x.value; });
      var h = parseInt(o.hour, 10) % 24, m = parseInt(o.minute, 10); return { day: o.weekday, min: h * 60 + m, h: h, m: m };
    } catch (e) { return null; }
  }
  function zoneOf(min, day) {
    if (day === "Sat" || (day === "Sun" && min < 18 * 60) || (day === "Fri" && min >= 17 * 60)) return ["🔴 Closed", "Reopens Sunday 6:00 PM ET.", "fu-bad"];
    if (min >= 17 * 60 && min < 18 * 60) return ["🔴 Daily break", "5 to 6 PM ET. Be flat.", "fu-bad"];
    if (min >= 16 * 60 + 59 || min < 3 * 60) return ["🟡 Thin overnight", "Low volume, sudden jumps.", "fu-warn"];
    if (min < 8 * 60) return ["🟡 Early (London)", "Volume builds around 3 AM. Less reliable.", "fu-warn"];
    if (min < 8 * 60 + 40) return ["🔴 Data time", "8:30 reports can spike price.", "fu-bad"];
    if (min < 9 * 60 + 30) return ["🟡 Pre-market", "Mark your levels.", "fu-warn"];
    if (min < 9 * 60 + 35) return ["🟡 The open", "Wild and noisy. Many wait a few minutes.", "fu-warn"];
    if (min < 11 * 60 + 30) return ["🟢 Prime time", "Best volume and cleanest moves.", "fu-good"];
    if (min < 13 * 60 + 30) return ["🟡 Lunch chop", "Slow and whippy. Trade small or skip.", "fu-warn"];
    if (min < 14 * 60 - 5) return ["🟡 Afternoon", "Volume returns.", "fu-warn"];
    if (min < 14 * 60 + 15) return ["🔴 Fed time (on Fed days)", "2:00 PM can whip price. Be flat.", "fu-bad"];
    if (min < 15 * 60) return ["🟡 Afternoon", "Wait for clear setups.", "fu-warn"];
    if (min < 15 * 60 + 50) return ["🟢 Power hour", "Second burst of volume.", "fu-good"];
    return ["🔴 Closing", "Be flat before 4:59 PM ET.", "fu-bad"];
  }
  function timeSvg() {
    var W = 900, H2 = 230, L = 24, R = 24, a = 8 * 60, b = 17 * 60, X = function (m) { return L + (W - L - R) * (m - a) / (b - a); };
    var bands = [[8 * 60, 9 * 60 + 30, "#9ca3af", ".2", "Pre-market"], [9 * 60 + 30, 11 * 60 + 30, "#16a34a", ".35", "PRIME TIME"], [11 * 60 + 30, 13 * 60 + 30, "#d97706", ".3", "Lunch chop"], [13 * 60 + 30, 15 * 60, "#9ca3af", ".2", "Afternoon"], [15 * 60, 16 * 60, "#16a34a", ".28", "Power hour"], [16 * 60, 17 * 60, "#dc2626", ".25", "Be flat"]];
    var s = '<svg viewBox="0 0 ' + W + " " + H2 + '" role="img" aria-label="Eastern time schedule from 8 AM to 5 PM">';
    bands.forEach(function (x) { s += '<rect x="' + X(x[0]) + '" y="70" width="' + (X(x[1]) - X(x[0])) + '" height="60" fill="' + x[2] + '" opacity="' + x[3] + '"/><text x="' + (X(x[0]) + (X(x[1]) - X(x[0])) / 2) + '" y="105" text-anchor="middle" style="font:700 14px system-ui,sans-serif" fill="currentColor">' + x[4] + "</text>"; });
    for (var h = 8; h <= 17; h++) s += '<line x1="' + X(h * 60) + '" x2="' + X(h * 60) + '" y1="130" y2="138" stroke="currentColor" opacity=".5"/><text x="' + X(h * 60) + '" y="154" text-anchor="middle" style="font:12px system-ui,sans-serif" fill="currentColor" opacity=".8">' + (h > 12 ? h - 12 : h) + (h < 12 ? " AM" : " PM") + "</text>";
    [[8 * 60 + 30, "8:30 data", 0], [9 * 60 + 30, "9:30 open", 1], [10 * 60, "10:00 data", 0], [10 * 60 + 30, "Wed 10:30 oil", 1], [14 * 60, "2:00 Fed", 0], [16 * 60 + 59, "4:59 flat", 1]].forEach(function (e) { var y = e[2] ? 28 : 52; s += '<line x1="' + X(e[0]) + '" x2="' + X(e[0]) + '" y1="' + (y + 4) + '" y2="130" stroke="#dc2626" stroke-dasharray="3 3" opacity=".8"/><text x="' + X(e[0]) + '" y="' + y + '" text-anchor="middle" style="font:12px system-ui,sans-serif" fill="currentColor">' + e[1] + "</text>"; });
    s += '<text x="' + L + '" y="' + (H2 - 20) + '" style="font:12px system-ui,sans-serif" fill="currentColor" opacity=".7">All times Eastern. Red dashes are scheduled events.</text></svg>';
    return fig(s);
  }
  function nowHtml() {
    var n = etNow(); if (!n) return "";
    var z = zoneOf(n.min, n.day), h = n.h % 12 || 12, t = h + ":" + (n.m < 10 ? "0" : "") + n.m + (n.h < 12 ? " AM" : " PM");
    return '<div class="fu-now ' + z[2] + '"><b>Right now: ' + z[0] + "</b> (" + n.day + " " + t + " ET)<br>" + z[1] + "</div>";
  }
  function tTime() {
    return H("Where is the market right now?") + '<div id="fu-now">' + nowHtml() + "</div>" + timeSvg() +
      H("Traffic light") + tiles([tile("🟢", "9:30 to 11:30", "Prime time. Most of the day's move.", "g"), tile("🟢", "3:00 to 4:00", "Power hour. Fast, but watch the clock.", "g"), tile("🟡", "11:30 to 1:30", "Lunch chop. Trade small or skip.", "y"), tile("🟡", "First 5 minutes", "Wild. Wait for the first pullback.", "y"), tile("🔴", "8:30 and 10:00", "Data reports. Stay out around them.", "r"), tile("🔴", "2:00 on Fed days", "Violent. Be flat.", "r"), tile("🔴", "Near 4:59", "No new trades. Be flat.", "r"), tile("🌙", "Overnight", "Thin. Not for most funded traders.", "")]) +
      H("Trading hours") + '<div class="fu-stats">' + stat("Sun 6 PM", "global open (ET)") + stat("5 to 6 PM", "daily break") + stat("9:30 to 4:00", "regular hours") + stat("4:59 PM", "Apex flat time") + "</div>" +
      '<p class="fu-chk">Index futures expire in Mar, Jun, Sep, Dec. Roll to the next contract about a week early.</p>' +
      quiz([{ q: "Best window for index futures?", a: ["9:30 to 11:30 AM", "12 to 1 PM", "Overnight"], c: 0, why: "Highest volume and cleanest trends and pullbacks." }, { q: "It is 2:00 PM on a Fed day. You should...", a: ["Add size", "Be flat"], c: 1, why: "The announcement can whip price both ways in seconds." }]);
  }

  /* ---------- 9:30 open ---------- */
  function openOut() {
    var hi = Math.max(ST.o29, ST.c29), lo = Math.min(ST.o29, ST.c29), px = ST.px, sp = ST.stopPts > 0 ? ST.stopPts : 1;
    if (hi === lo) return '<div class="fu-note">Open and close are the same: the zone is one line. Use the close.</div>';
    if (px >= lo && px <= hi) return '<div class="fu-note">Price is inside the body. The reversion is done. Wait for a new move.</div>';
    var up = px > hi, near = up ? hi : lo, far = up ? lo : hi, d1 = Math.abs(px - near), d2 = Math.abs(px - far);
    function box(l, d) { return "<div><b>" + (Math.round(d * 100) / 100) + " pts &middot; " + (Math.round(d / sp * 10) / 10) + "R</b><span>" + l + " &middot; " + Math.round(d / 0.25) + " ticks &middot; " + money(d * 5) + " per MES</span></div>"; }
    return '<div class="fu-out">' + box("to the near edge (" + near + ")", d1) + box("to the far edge (" + far + ")", d2) + "<div><b>" + (up ? "SHORT" : "LONG") + "</b><span>reversion direction. Want 2R+ to the near edge.</span></div></div>";
  }
  var OPENC = [[100, 101.5, 99.5, 101], [101, 105.5, 100.8, 105], [105, 108.3, 104.8, 108], [108, 108.4, 106.8, 107.2], [107.2, 110, 107, 109.5], [109.5, 112.2, 109.2, 112], [112, 113.8, 111.8, 113.2], [113.2, 113.4, 111.6, 112], [112, 113.4, 111.8, 112.6], [112.6, 112.8, 110.6, 111], [111, 111.2, 107.6, 108], [108, 108.2, 104.8, 105], [105, 105.2, 102.6, 103], [103, 103.3, 101.4, 101.8], [101.8, 102, 100.6, 101.2]];
  function openSvg() {
    var W = 760, H2 = 410, x0 = 56, dx = 40, Y = function (v) { return 320 - (v - 97) * 17; }, C = OPENC;
    function xi(i) { return x0 + 14 + i * dx; }
    function dot(x, y, n, col) { return '<circle cx="' + x + '" cy="' + y + '" r="11" fill="' + col + '"/><text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" style="font:700 12px system-ui,sans-serif;fill:#fff">' + n + "</text>"; }
    var s = '<svg viewBox="0 0 ' + W + " " + H2 + '" role="img" aria-label="The 9:29 candle body projected to 10:00, with a continuation trade away from it and a reversion trade back to it">';
    s += '<rect x="' + x0 + '" y="' + Y(101) + '" width="' + (W - 30 - x0) + '" height="' + (Y(100) - Y(101)) + '" fill="#2563eb" opacity=".22"/><line x1="' + x0 + '" x2="' + (W - 30) + '" y1="' + Y(101) + '" y2="' + Y(101) + '" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 4"/><line x1="' + x0 + '" x2="' + (W - 30) + '" y1="' + Y(100) + '" y2="' + Y(100) + '" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 4"/>';
    C.forEach(function (c, i) { var x = xi(i), up = c[3] >= c[0], col = i === 0 ? "#2563eb" : up ? "#16a34a" : "#dc2626"; s += '<line x1="' + x + '" x2="' + x + '" y1="' + Y(c[1]) + '" y2="' + Y(c[2]) + '" stroke="' + col + '" stroke-width="2"/><rect x="' + (x - 11) + '" y="' + Y(Math.max(c[0], c[3])) + '" width="22" height="' + Math.max(3, Math.abs(Y(c[0]) - Y(c[3]))) + '" fill="' + col + '"/>'; });
    s += '<text x="' + xi(0) + '" y="' + (Y(99.5) + 16) + '" text-anchor="middle" style="font:12px system-ui,sans-serif" fill="currentColor">9:29</text><text x="' + (xi(1) + 6) + '" y="' + (Y(99.5) + 16) + '" style="font:12px system-ui,sans-serif" fill="currentColor">9:30</text>';
    s += dot(xi(1), Y(105.5) - 16, "O", "#d97706") + dot(xi(4), Y(110) - 16, "1", "#16a34a") + dot(xi(10), Y(111.2) - 16, "2", "#dc2626");
    var ly = 372;
    s += dot(60, ly, "O", "#d97706") + '<text x="80" y="' + (ly - 2) + '" style="font:700 14px system-ui,sans-serif" fill="currentColor">The open</text><text x="80" y="' + (ly + 14) + '" style="font:12px system-ui,sans-serif" fill="currentColor" opacity=".75">volume floods in, price jumps away</text>';
    s += dot(300, ly, "1", "#16a34a") + '<text x="320" y="' + (ly - 2) + '" style="font:700 14px system-ui,sans-serif" fill="#16a34a">CONTINUATION long</text><text x="320" y="' + (ly + 14) + '" style="font:12px system-ui,sans-serif" fill="currentColor" opacity=".75">break of the first pullback high</text>';
    s += dot(540, ly, "2", "#dc2626") + '<text x="560" y="' + (ly - 2) + '" style="font:700 14px system-ui,sans-serif" fill="#dc2626">REVERSION short</text><text x="560" y="' + (ly + 14) + '" style="font:12px system-ui,sans-serif" fill="currentColor" opacity=".75">lower high, then the low breaks</text>';
    s += '<text x="' + (W - 34) + '" y="' + (Y(100) + 20) + '" text-anchor="end" style="font:700 13px system-ui,sans-serif" fill="#2563eb">9:29 body to 10:00 = the target zone</text></svg>';
    return fig(s, "Idea only, not real data.");
  }
  function tOpen() {
    return H("The 9:30 opening drive", "Volume floods in at 9:30 and shoves price away from the pre-open price. Trade the push, then the snap back.") + openSvg() +
      H("Two words to know") + '<div class="fu-2"><div class="fu-card" style="border-left:5px solid var(--gain)"><h3>➡️ Continuation</h3><div class="fu-big">Trade <b>with</b> the move.</div>' + row("k", "Idea", "It has more room to run") + '</div><div class="fu-card" style="border-left:5px solid var(--loss)"><h3>↩️ Reversion</h3><div class="fu-big">Trade <b>back</b> toward where it started.</div>' + row("k", "Idea", "The push was an overshoot") + "</div></div>" +
      H("Mark the 9:29 candle", "On the 1 minute MES chart.") + flow([step(1, "🕰️", "All-hours chart", "Regular-hours charts have no 9:29 bar."), step(2, "🕘", "Wait until 9:30:00", "The 9:29 candle must close."), step(3, "✏️", "Draw 2 rays", "One at its open, one at its close."), step(4, "➡️", "Extend to 10:00", "Same color for both."), step(5, "🧹", "Remove at 10:00", "The level has done its job.")]) +
      '<div class="fu-note">Tiny body? Use the close as your one pre-open price.</div>' +
      H("The two trades") + '<div class="fu-2"><div class="fu-card" style="border-left:5px solid var(--gain)"><h3>➡️ 1. Continuation</h3>' + row("e", "Entry", "Break of the first small pullback") + row("s", "Stop", "Past the pullback low") + row("t", "Target", "1.5 to 2R or opening range edge") + row("k", "Skip", "No pullback (do not chase)") + '</div><div class="fu-card" style="border-left:5px solid var(--loss)"><h3>↩️ 2. Reversion</h3>' + row("e", "Entry", "Break of the stall candle, back toward the zone") + row("s", "Stop", "Past the failed high or low") + row("t", "Target", "Near edge of the body, then far edge") + row("k", "Skip", "Strong new highs, or under 2R of room") + "</div></div>" +
      H("📐 Room to the body") + '<div class="fu-card"><div class="fu-calc"><label>9:29 open<input data-fu="o29" type="number" step="0.25" value="' + ST.o29 + '"></label><label>9:29 close<input data-fu="c29" type="number" step="0.25" value="' + ST.c29 + '"></label><label>Price now<input data-fu="px" type="number" step="0.25" value="' + ST.px + '"></label><label>Stop (points)<input data-fu="stopPts" type="number" step="0.25" min="0.25" value="' + ST.stopPts + '"></label></div><div id="fu-open">' + openOut() + '</div><p class="fu-chk">MES: 1 point = $5, 1 tick = 0.25 points. Example numbers.</p></div>' +
      H("Rules") + tiles([tile("⏱️", "9:30 to 10:00 only", "Lines come off at 10:00.", "b"), tile("🔬", "Micros only", "MES, 1 or 2 contracts.", "y"), tile("✋", "Wait for the pullback", "The first minutes are the noisiest."), tile("1️⃣", "One of each, then stop", "Two losers? Done for the open."), tile("📰", "Careful on data days", "CPI, jobs, Fed.", "r"), tile("🧪", "Test it on sim", "Count how often price returns to the body.", "g")]) +
      quiz([{ q: "Which candle's body marks the zone?", a: ["9:29", "9:30", "10:00"], c: 0, why: "The 9:29 candle is the last one before the open." }, { q: "A reversion trade goes...", a: ["With the opening move", "Back toward the zone"], c: 1, why: "You trade the overshoot back to the pre-open price." }, { q: "When do the lines come off?", a: ["10:00", "Never", "Lunch"], c: 0, why: "After the opening drive the level loses meaning." }]) +
      '<div class="fu-note">A strategy idea, not a tested system. Mark it on sim charts for a few weeks first.</div>';
  }

  /* ---------- Strategies ---------- */
  function sc(title, svg, rows) { return '<div class="fu-card"><h3>' + title + "</h3>" + fig(svg) + rows + "</div>"; }
  function tStrat() {
    var orb = mc({ alt: "Opening range breakout", c: [[55, 59, 53, 58], [58, 60, 56, 57], [57, 59, 54, 55], [55, 58, 53, 57], [57, 60, 56, 59], [59, 64, 58, 63], [63, 66, 60.2, 61], [61, 68, 60.4, 67], [67, 72, 66, 71]], bands: [{ a: 52.5, b: 60, col: "#9ca3af" }], lines: [{ y: 60, t: "Range high", col: "#16a34a" }, { y: 52.5, t: "Range low", col: "#dc2626" }], marks: [{ i: 7, y: 60.4, arrow: "up", t: "Entry", col: "#16a34a" }] });
    var ema = mc({ alt: "9 EMA pullback", c: [[50, 53, 49.5, 52.5], [52.5, 56, 52, 55.5], [55.5, 59, 55, 58.5], [58.5, 59, 56.4, 56.9], [56.9, 57.8, 55.6, 57.2], [57.2, 57.5, 56.2, 56.9], [56.9, 60.5, 56.8, 60]], ema: [51, 52.5, 54.6, 55.9, 56.3, 56.5, 57.4], lines: [{ y: 55.4, t: "Stop", col: "#dc2626" }], marks: [{ i: 5, y: 57.5, t: "Trigger", col: "#d97706", pos: "above" }, { i: 6, y: 56.8, arrow: "up", t: "Entry", col: "#16a34a" }] });
    var vw = mc({ alt: "VWAP pullback", c: [[50, 53, 49.5, 52.5], [52.5, 56, 52, 55.5], [55.5, 59, 55, 58.5], [58.5, 59, 56.2, 56.9], [56.9, 57.4, 55.4, 56.2], [56.2, 56.9, 55.5, 56.7], [56.7, 60.5, 56.5, 60]], vw: [50.5, 51.8, 53, 54.2, 55.2, 55.9, 56.5], lines: [{ y: 54.8, t: "Stop", col: "#dc2626" }], marks: [{ i: 5, y: 56.95, t: "Holds VWAP", col: "#d97706", pos: "above" }, { i: 6, y: 56.5, arrow: "up", t: "Entry", col: "#16a34a" }] });
    var fb = mc({ alt: "Failed breakout", c: [[54, 57, 53, 56], [56, 59, 55, 58], [58, 61, 57.5, 59.5], [59.5, 60.8, 58, 58.3], [58.3, 58.8, 56, 56.5], [56.5, 57, 53, 53.5], [53.5, 54, 51, 51.5]], lines: [{ y: 60, t: "Key level", col: "#2563eb" }, { y: 61.4, t: "Stop", col: "#dc2626" }], marks: [{ i: 3, y: 60.8, t: "Fails", col: "#d97706", pos: "above" }, { i: 4, y: 56, arrow: "down", t: "Entry", col: "#dc2626" }] });
    var sl = mc({ alt: "SL-1-RV 2 short", c: [[50, 52, 49.5, 51.8], [51.8, 54, 51.5, 53.8], [53.8, 56, 53.5, 55.8], [55.8, 58, 55.5, 57.8], [57.8, 58.2, 53.2, 53.8], [53.8, 55.2, 53.3, 55], [54.9, 55.1, 53.9, 54.5], [54.5, 54.8, 51, 51.6]], lines: [{ y: 55.12, t: "Stop", col: "#dc2626" }], marks: [{ i: 3, y: 58, t: "High", col: "#d97706", pos: "above" }, { i: 4, y: 53.2, t: "New low", col: "#dc2626", pos: "below" }, { i: 5, y: 55.2, t: "Green", col: "#16a34a", pos: "above" }, { i: 6, y: 53.9, t: "Trigger", col: "#d97706", pos: "below" }, { i: 7, y: 51, arrow: "down", t: "Entry", col: "#dc2626" }] });
    var om = mc({ alt: "Opening drive", c: OPENC.slice(0, 14), bands: [{ a: 100, b: 101, col: "#2563eb" }], lines: [{ y: 101, t: "9:29 body", col: "#2563eb" }, { y: 100, t: "", col: "#2563eb" }], marks: [{ i: 4, y: 110, t: "1 Cont.", col: "#16a34a", pos: "above" }, { i: 10, y: 111.2, t: "2 Rev.", col: "#dc2626", pos: "above" }] });
    return H("First: what kind of day?") + '<div class="fu-2">' + tile("📈", "Trend day", "Stays on one side of VWAP. Shallow pullbacks that hold the 9 EMA. Trade with it.", "g") + tile("↔️", "Range day", "Crosses VWAP, candles overlap. Trade the edges or sit out.", "y") + "</div>" +
      H("The setups") + '<div class="fu-cards">' +
      sc("🔔 9:30 opening drive", om, row("e", "Entry", "Continuation, then reversion") + row("k", "See", "The 9:30 open tab")) +
      sc("1. Opening range breakout", orb, row("e", "Entry", "Break and retest of the range") + row("s", "Stop", "Back inside the range") + row("t", "Target", "1.5 to 2R") + row("k", "Skip", "Huge range or instant fail")) +
      sc("2. 9 EMA pullback (FP9)", ema, row("e", "Entry", "Break of the small candle at the EMA") + row("s", "Stop", "Past the trigger candle") + row("t", "Target", "Previous high, then trail") + row("k", "Skip", "Flat EMA or lunch")) +
      sc("3. VWAP pullback", vw, row("e", "Entry", "Small candle holds VWAP, next breaks it") + row("s", "Stop", "A few ticks past VWAP") + row("t", "Target", "Day high or low") + row("k", "Skip", "VWAP crossed 3+ times")) +
      sc("4. Failed breakout", fb, row("e", "Entry", "Back under the level, then low breaks") + row("s", "Stop", "Above the failed high") + row("t", "Target", "VWAP or mid-range") + row("k", "Skip", "News-driven trend")) +
      sc("5. SL-1-RV 2' short", sl, row("e", "Entry", "Break of the trigger's low") + row("s", "Stop", "2 ticks above the trigger high") + row("t", "Target", "1.5R and up") + row("k", "Only", "Above VWAP with 2R+ of room")) +
      "</div>" + H("🧭 Mark these every morning") + tiles([tile("📅", "Prior day high and low", ""), tile("🌙", "Overnight high and low", ""), tile("🔔", "Opening range", ""), tile("🟣", "VWAP and 9 EMA", ""), tile("🔢", "Round numbers", "like 6000 on ES")]) +
      quiz([{ q: "Price is chopping back and forth across VWAP. Best plan?", a: ["Trend pullbacks", "Trade the edges, or sit out"], c: 1, why: "Overlapping candles around VWAP signal a range day." }, { q: "An SL-1-RV 2' short is only taken...", a: ["Anywhere", "Above VWAP with 2R+ of room"], c: 1, why: "Never short it below VWAP." }]) +
      '<div class="fu-note">No setup is guaranteed. Test on sim and keep a journal.</div>';
  }

  /* ---------- Risk ---------- */
  function meter() {
    var lim = Math.max(1, ST.dlim), stop = Math.round(lim * 0.4), W = 760, X = function (v) { return 20 + 720 * v / lim; };
    var s = '<svg viewBox="0 0 ' + W + ' 120" role="img" aria-label="Daily loss meter: stop for the day at 40 percent of the firm limit">';
    s += '<rect x="20" y="40" width="' + (X(stop) - 20) + '" height="30" fill="#16a34a" opacity=".5"/><rect x="' + X(stop) + '" y="40" width="' + (X(lim * 0.7) - X(stop)) + '" height="30" fill="#d97706" opacity=".5"/><rect x="' + X(lim * 0.7) + '" y="40" width="' + (X(lim) - X(lim * 0.7)) + '" height="30" fill="#dc2626" opacity=".5"/>';
    s += '<line x1="' + X(stop) + '" x2="' + X(stop) + '" y1="28" y2="82" stroke="currentColor" stroke-width="3"/><text x="' + X(stop) + '" y="20" text-anchor="middle" style="font:700 14px system-ui,sans-serif" fill="currentColor">YOUR stop: ' + money(stop) + "</text>";
    s += '<text x="20" y="100" style="font:12px system-ui,sans-serif" fill="currentColor">$0 lost today</text><text x="' + X(lim) + '" y="100" text-anchor="end" style="font:700 13px system-ui,sans-serif" fill="#dc2626">Firm limit: ' + money(lim) + "</text></svg>";
    return fig(s, "Your own stop fires first, long before the firm's limit.");
  }
  function riskCalc() { var c = Math.max(0, ST.cushion); return '<div class="fu-out"><div><b>' + money(c * 0.05) + " to " + money(c * 0.1) + "</b><span>risk per trade (5 to 10% of cushion)</span></div><div><b>" + money(c * 0.2) + "</b><span>stop for the day (about 20% of cushion)</span></div></div>"; }
  function tRisk() {
    return H("Stop yourself before the firm does") + '<div class="fu-card"><div class="fu-calc"><label>Firm daily loss limit ($)<input data-fu="dlim" type="number" min="1" step="50" value="' + ST.dlim + '"></label></div><div id="fu-meter">' + meter() + "</div></div>" +
      H("The 6 rules") + flow([step(1, "🪙", "Risk small", "Small slice of your cushion per trade."), step(2, "🛑", "Daily stop", "Quit well before the firm limit."), step(3, "📏", "Size from the stop", "Stop first, then contracts."), step(4, "✋", "3 losses? Done.", "No revenge trading."), step(5, "🏁", "Bank good days", "Trailing limits rise with highs."), step(6, "🐢", "Scale slowly", "Add size after steady days.")]) +
      H("📐 Starter numbers", "Rules of thumb, not firm rules.") + '<div class="fu-card"><div class="fu-calc"><label>Drawdown cushion ($)<input data-fu="cushion" type="number" min="1" step="100" value="' + ST.cushion + '"></label></div><div id="fu-rc">' + riskCalc() + "</div></div>" +
      H("Traps") + tiles([tile("❌", "&ldquo;It is only a sim&rdquo;", "Habits carry to real money.", "r"), tile("❌", "Going big near the target", "The top way evaluations fail.", "r"), tile("❌", "Chasing the first move", "Wait for your setup.", "r"), tile("❌", "Trading to make it back", "Stop for the day.", "r"), tile("❌", "Lunch boredom", "Boredom is not a signal.", "r")]) +
      H("✅ Daily routine") + checks(["Checked the data calendar", "Marked prior-day and overnight levels", "Wrote my daily stop", "ATM loaded with a stop", "Know my flat-by time"]) +
      quiz([{ q: "The firm limit is $1,000. A sensible daily stop is...", a: ["$950", "$400 to $500", "No stop"], c: 1, why: "Your rule must fire before the firm's limit." }, { q: "Three losses in a row. You should...", a: ["Double size", "Stop for the day"], c: 1, why: "Revenge trading is how one bad hour ruins a week." }]);
  }

  /* ---------- Tips ---------- */
  function tTips() {
    return H("Do and don't") + '<div class="fu-2"><div class="fu-tiles" style="grid-template-columns:1fr 1fr">' + tile("✅", "One market", "MES or MNQ until you know it.", "g") + tile("✅", "Micros first", "Even on a funded account.", "g") + tile("✅", "Stop on entry", "Every time.", "g") + tile("✅", "Fewer, better trades", "Two good beat ten average.", "g") + tile("✅", "Journal screenshots", "Entry, stop, reason.", "g") + tile("✅", "Alarm before flat time", "10 minutes early.", "g") + '</div><div class="fu-tiles" style="grid-template-columns:1fr 1fr">' + tile("❌", "Too many contracts day 1", "", "r") + tile("❌", "Unknown drawdown type", "Check before buying.", "r") + tile("❌", "Holding through news", "", "r") + tile("❌", "Hedging across accounts", "", "r") + tile("❌", "Moving the stop", "", "r") + tile("❌", "Old contract month", "Check the roll.", "r") + "</div></div>" +
      H("Words to know") + '<div class="fu-tiles" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))">' + [["Tick", "Smallest price move"], ["Point", "One whole price number (4 ticks on ES)"], ["Micro", "1/10 size contract"], ["RTH", "Regular hours, 9:30 to 4:00"], ["Drawdown", "How far you can fall from your high"], ["PA", "Apex's funded account"], ["ATM", "Auto stop and target in NinjaTrader"], ["Master / follower", "Account you trade / accounts that copy it"], ["R", "Your risk. 2R win = twice your risk"], ["Rollover", "Moving to the next contract month"]].map(function (g) { return tile("📘", g[0], g[1]); }).join("") + "</div>" +
      quiz([{ q: "When do you place your stop?", a: ["After it goes red", "When you enter"], c: 1, why: "A stop on every order, always." }, { q: "Best contract while learning?", a: ["ES", "MES"], c: 1, why: "Micros are one tenth the size." }]);
  }

  var BODY = { start: tStart, funded: tFunded, nt: tNt, copy: tCopy, time: tTime, open: tOpen, strat: tStrat, risk: tRisk, tips: tTips };
  var host = null, timer = null;

  function render() {
    if (!host) return;
    QN = 0;
    var tabs = TABS.map(function (t) { return '<button type="button" data-futab="' + t[0] + '" class="' + (t[0] === ST.tab ? "on" : "") + '">' + t[1] + "</button>"; }).join("");
    host.innerHTML = '<h1>Futures</h1><p class="hint">Learn it with pictures. Education only, not advice.</p><div class="fu-tabs">' + tabs + '</div><div id="fu-body">' + BODY[ST.tab]() + "</div>";
  }
  function onInput(e) {
    var k = e.target.getAttribute && e.target.getAttribute("data-fu"); if (!k) return;
    var v = e.target.value; if (k === "con") ST.con = v; else ST[k] = ["o29", "c29", "px"].indexOf(k) >= 0 ? (parseFloat(v) || 0) : Math.max(0, parseFloat(v) || 0);
    [["#fu-risk", riskOut], ["#fu-copy", copyOut], ["#fu-open", openOut], ["#fu-meter", meter], ["#fu-rc", riskCalc]].forEach(function (p) { var el = host.querySelector(p[0]); if (el) el.innerHTML = p[1](); });
  }
  function onClick(e) {
    var q = e.target.closest && e.target.closest("[data-fuq]");
    if (q) {
      var id = q.getAttribute("data-fuq"), ok = q.getAttribute("data-ok") === "1";
      host.querySelectorAll('[data-fuq="' + id + '"]').forEach(function (b) { b.classList.remove("no"); if (b.getAttribute("data-ok") === "1") b.classList.add("ok"); });
      if (!ok) q.classList.add("no");
      var w = host.querySelector('[data-why="' + id + '"]'); if (w) w.classList.add("on");
      return;
    }
    var b = e.target.closest && e.target.closest("[data-futab]"); if (!b) return;
    ST.tab = b.getAttribute("data-futab"); render(); window.scrollTo(0, 0);
  }
  function tick() { var n = host && host.querySelector("#fu-now"); if (n) n.innerHTML = nowHtml(); }

  root.FuturesPage = {
    mount: function (el) {
      var st = document.getElementById("fu-css"); if (!st) { st = document.createElement("style"); st.id = "fu-css"; document.head.appendChild(st); } st.textContent = CSS;
      if (host !== el) { host = el; el.addEventListener("input", onInput); el.addEventListener("change", onInput); el.addEventListener("click", onClick); }
      render(); if (timer) clearInterval(timer); timer = setInterval(tick, 30000);
    },
    _st: ST, _zone: zoneOf
  };
})(window);
