/* Parabolic Movers: news-sourced candidates for three styles: day trades, swing trades, investments.
   The picks live in movers-data.json (refreshed daily). Live prices and headlines load when you are signed in. */
(function () {
  "use strict";
  var DATA = { asof: "", tape: [], events: [], picks: [] }, ST = { kind: "radar", sort: "heat", theme: "", loaded: false, view: "picks", lq: null }, LED = null;
  var ICON = {
    radar: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12 19 5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    day: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    swing: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 14c3-8 6-8 9 0s6 8 9 0"/><path d="M2 20h20"/></svg>',
    penny: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.6 2.5 1.6c0 2.2-5 1.2-5 3.6 0 1 1.1 1.6 2.5 1.6s2.5-.6 2.5-1.6"/></svg>',
    invest: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10"/><path d="M12 10c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 14c0-3-2-5-6-5 0 3 2 5 6 5z"/></svg>'
  };
  var KINDS = {
    radar: { name: "Early radar", tag: "Before it runs", hold: "Days to weeks", goal: "Get in before the crowd", look: "Quiet buying, rising volume, a base", risk: 4, pos: [8, 40],
      play: ["Smart money moves first: insiders, funds and options traders.", "Stage matters. Asleep is cheap but can stay asleep. Breaking out is confirmed but costs more.", "No signal is a promise. Want 3+ signals lined up, and size small."],
      crit: [["inst", "Institutions adding", "Funds raising or opening positions"], ["ins", "Insiders buying", "Executives or 10% owners buying with their own cash"], ["vol", "Volume or options surging", "Trading well above normal before the move"], ["base", "Base or breakout, not extended", "Holding above its 50-day average, not already stretched"], ["cat", "Catalyst ahead", "A dated reason for the market to care"]] },
    day: { name: "Day trades", tag: "In and out today", hold: "Minutes to hours", goal: "Small, fast gains", look: "Gap, volume, the first 30 minutes", risk: 5, pos: [0, 4],
      play: ["Trade the first 30 minutes. That is where the volume is.", "Mark the premarket high and low plus VWAP. Take the break, or the failed break.", "Flat by the close. No overnight surprises."],
      crit: [["news", "Fresh news today", "A headline that is moving it right now"], ["gap", "Big gap or move", "Already moving 5%+ so there is range to trade"], ["vol", "Volume way up", "Several times its normal share volume"], ["iv", "Big swings priced in", "Options or short interest signal a wild ride"], ["liq", "Easy to trade", "Plenty of shares changing hands"]] },
    swing: { name: "Swing trades", tag: "Days to weeks", hold: "2 days to 6 weeks", goal: "A real move off a catalyst", look: "A dated catalyst and a pullback to buy", risk: 3, pos: [18, 40],
      play: ["Wait for the catalyst, then let the move prove itself.", "Buy pullbacks to the 9 EMA or VWAP, not the first spike.", "You hold overnight, so size it for a gap against you."],
      crit: [["cat", "Catalyst within 2 weeks", "Earnings, a decision or an event with a date"], ["low", "Far below its high", "Down 30%+ so a rebound has room"], ["sel", "Sold off hard", "A sharp drop: coiled spring or falling knife"], ["mom", "Momentum building", "Buyers are already stepping in"], ["thm", "Hot theme", "Part of a story the market is chasing"]] },
    penny: { name: "Penny stocks", tag: "Under $5, wild ride", hold: "Minutes to days", goal: "A fast multiple, or none", look: "A real catalyst, volume, cash in the bank", risk: 5, pos: [0, 14], stg: ["Real catalyst", "Speculative", "Spike already ran", "Likely trap"],
      play: ["Most pennies that spike are traps. Look for a real, dated catalyst, not just a big green candle.", "Check the three killers first: dilution (new shares), reverse splits and delisting notices.", "Spreads are wide and halts happen. Use limit orders, tiny size, and a stop you can live with."],
      crit: [["news", "Real, specific catalyst", "Earnings, an FDA date or a contract, not just a spike"], ["vol", "Volume way above normal", "Many times its average share volume"], ["list", "Safe listing", "On a major exchange with no delisting notice"], ["cash", "Cash to survive", "Enough money that it need not raise soon"], ["dil", "No dilution trap", "No reverse split or share-cancelling deal"]] },
    invest: { name: "Investments", tag: "Own it for years", hold: "1 to 10+ years", goal: "Own great businesses as they compound", look: "Growth, margins, the long-term story", risk: 2, pos: [58, 100],
      play: ["Own the business, not the ticker: growth, margins, moat.", "Buy in pieces. Prices can swing 30%+ in a year (see the range bars).", "Check the thesis each quarter, not each minute."],
      crit: [["gro", "Fast growth", "Revenue growing much faster than the economy"], ["moat", "Strong position", "Backlog, scale or tech that rivals struggle to copy"], ["val", "Valuation looks fair", "The article calls it cheap against its growth"], ["mar", "Healthy margins", "Keeps a good share of each dollar of sales"], ["dur", "Years of demand", "A tailwind that lasts beyond this year"]] }
  };
  var QUIZ = [
    ["How much time can you watch charts?", ["All day, I love it", "day"], ["A few minutes a day", "swing"], ["Almost none", "invest"]],
    ["A position drops 5% on you. You...", ["Cut it right now", "day"], ["Check if the story still holds", "swing"], ["Buy more, it is on sale", "invest"]],
    ["What sounds most fun?", ["Catching the open", "day"], ["Riding a story for a week", "swing"], ["Owning great companies", "invest"]]
  ];

  var CSS = '#movv{max-width:none;width:100%;box-sizing:border-box}#movv *{box-sizing:border-box}' +
    '#movv .mv-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 16px;margin:0 0 10px}#movv .mv-h h2{margin:0;font-size:26px}#movv .mv-sub{color:var(--mute);font-size:14px}' +
    '#movv .mv-tape{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}#movv .mv-chip{display:inline-flex;gap:6px;align-items:center;border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:4px 11px;font-size:13px}' +
    '#movv .mv-chip b{font-weight:700}#movv .up{color:var(--gain)}#movv .dn{color:var(--loss)}' +
    '#movv .mv-box{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;min-width:0;margin:0 0 14px}#movv .mv-box h3{margin:0 0 10px;font-size:15px}' +
    '#movv .mv-tl{position:relative;height:140px;margin:6px 8px 0}#movv .mv-tl .ax{position:absolute;left:0;right:0;top:64px;height:3px;background:var(--line);border-radius:2px}' +
    '#movv .mv-tl .dot{position:absolute;transform:translateX(-50%);font-size:11px;font-weight:700;text-align:center;white-space:nowrap}#movv .mv-tl .dot i{display:block;width:12px;height:12px;border-radius:50%;margin:0 auto 2px;border:2px solid var(--panel)}' +
    '#movv .mv-tl .tk{position:absolute;top:124px;transform:translateX(-50%);font-size:10px;color:var(--mute);white-space:nowrap}#movv .mv-tl .now{position:absolute;top:20px;width:2px;height:92px;opacity:.5;background:var(--accent)}' +
    '#movv .k-radar{--kc:#8a4fe0}#movv .k-day{--kc:#e0762b}#movv .k-swing{--kc:#2b7de0}#movv .k-invest{--kc:#1f9d63}#movv .k-penny{--kc:#c9961a}' +
    '#movv .mv-styles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:0 0 14px}@media(max-width:1300px){#movv .mv-styles{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:1100px){#movv .mv-styles{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){#movv .mv-styles{grid-template-columns:minmax(0,1fr)}}' +
    '#movv .mv-sty{text-align:left;background:var(--panel);color:var(--ink);border:2px solid var(--line);border-radius:14px;padding:14px;cursor:pointer;font:inherit;display:flex;flex-direction:column;gap:8px;min-width:0}' +
    '#movv .mv-sty:hover{border-color:var(--kc)}#movv .mv-sty.on{border-color:var(--kc);box-shadow:0 0 0 3px color-mix(in srgb,var(--kc) 22%,transparent)}' +
    '#movv .mv-sty .hd{display:flex;align-items:center;gap:10px}#movv .mv-sty .ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--kc);color:#fff}' +
    '#movv .mv-sty .nm{font-size:18px;font-weight:800}#movv .mv-sty .tg{color:var(--mute);font-size:13px}#movv .mv-sty .n{margin-left:auto;font-weight:800;font-size:22px;color:var(--kc)}' +
    '#movv .mv-hz{position:relative;height:10px;border-radius:6px;background:var(--line)}#movv .mv-hz i{position:absolute;top:0;height:10px;border-radius:6px;background:var(--kc)}' +
    '#movv .mv-hzl{display:flex;justify-content:space-between;font-size:10px;color:var(--mute);margin-top:-4px}' +
    '#movv .mv-fx{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:13px}#movv .mv-fx span{color:var(--mute)}' +
    '#movv .mv-rk{display:flex;gap:3px;align-items:center}#movv .mv-rk u{width:14px;height:8px;border-radius:2px;background:var(--line);text-decoration:none}#movv .mv-rk u.on{background:var(--kc)}' +
    '#movv .mv-play{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:0 0 12px}#movv .mv-play div{border-left:4px solid var(--kc);padding:6px 10px;font-size:14px;background:var(--panel);border-radius:0 10px 10px 0;border-top:1px solid var(--line);border-right:1px solid var(--line);border-bottom:1px solid var(--line)}' +
    '#movv .mv-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 12px}#movv .mv-b{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:999px;padding:5px 12px;font:inherit;font-size:13px;cursor:pointer}' +
    '#movv .mv-b:hover{border-color:var(--accent)}#movv .mv-b.on{background:var(--accent);color:var(--accent-ink,#fff);border-color:var(--accent)}#movv .mv-sp{flex:1}' +
    '#movv .mv-leg{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin:0 0 12px}#movv .mv-leg div{border:1px solid var(--line);border-radius:10px;padding:7px 10px;font-size:12px;background:var(--panel)}#movv .mv-leg b{display:block;font-size:13px}#movv .mv-leg span{color:var(--mute)}' +
    '#movv .mv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}' +
    '#movv .mv-card{position:relative;background:var(--panel);border:1px solid var(--line);border-top:4px solid var(--kc);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0}' +
    '#movv .mv-card.top{border-color:var(--kc);box-shadow:0 0 0 2px color-mix(in srgb,var(--kc) 30%,transparent)}#movv .mv-rib{position:absolute;top:-4px;left:14px;background:var(--kc);color:#fff;font-size:11px;font-weight:800;padding:3px 9px;border-radius:0 0 8px 8px}' +
    '#movv .mv-r1{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}#movv .mv-t{font-size:22px;font-weight:800;letter-spacing:.5px}#movv .mv-n{color:var(--mute);font-size:13px}' +
    '#movv .mv-px{text-align:right;font-weight:700;font-size:18px}#movv .mv-px small{display:block;font-weight:600;color:var(--mute);font-size:11px}#movv .mv-px small.up{color:var(--gain)}#movv .mv-px small.dn{color:var(--loss)}' +
    '#movv .mv-tag{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:2px 9px;font-size:12px;color:var(--mute);margin:0 6px 4px 0}#movv .mv-cat{background:var(--kc);color:#fff;border-color:var(--kc)}' +
    '#movv .mv-heat{display:flex;align-items:center;gap:8px}#movv .mv-fl{display:flex;gap:3px}#movv .mv-fl u{width:26px;height:10px;border-radius:3px;background:var(--line);text-decoration:none}#movv .mv-fl u.y{background:var(--kc)}#movv .mv-fl u.q{background:repeating-linear-gradient(45deg,var(--line),var(--line) 3px,transparent 3px,transparent 6px)}' +
    '#movv .mv-sc{font-weight:800;font-size:13px}#movv .mv-why{font-size:13px;color:var(--mute)}' +
    '#movv .mv-dots{display:flex;gap:5px;flex-wrap:wrap}#movv .mv-dot{display:inline-flex;align-items:center;gap:4px;font-size:11px;border:1px solid var(--line);border-radius:999px;padding:2px 8px;color:var(--mute)}#movv .mv-dot.y{background:var(--gain);border-color:var(--gain);color:#fff}#movv .mv-dot.n{border-color:var(--loss);color:var(--loss)}' +
    '#movv .mv-bar{position:relative;height:10px;border-radius:6px;background:var(--line)}#movv .mv-bar i{position:absolute;top:-4px;width:4px;height:18px;border-radius:2px;background:var(--ink)}' +
    '#movv .mv-bl{display:flex;justify-content:space-between;font-size:11px;color:var(--mute);margin-top:4px}' +
    '#movv .mv-p{margin:0;font-size:14px;line-height:1.45}#movv .mv-p b{font-weight:700}#movv .mv-rkp{color:var(--loss)}' +
    '#movv .mv-ft{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12px;color:var(--mute)}#movv .mv-ft a{color:inherit}' +
    '#movv .mv-nw{font-size:13px;border-top:1px dashed var(--line);padding-top:8px;display:flex;flex-direction:column;gap:6px}#movv .mv-nw a{color:var(--ink)}#movv .mv-nw span{color:var(--mute);font-size:11px}' +
    '#movv .mv-q{display:grid;gap:8px}#movv .mv-q .qq{font-weight:700;font-size:14px}#movv .mv-q .ops{display:flex;flex-wrap:wrap;gap:8px}#movv .mv-res{margin-top:10px;font-weight:700}' +
    '#movv .mv-stg{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}#movv .mv-stg span{font-size:11px;text-align:center;padding:5px 2px;border-radius:6px;background:var(--line);color:var(--mute)}#movv .mv-stg span.on{background:var(--kc);color:#fff;font-weight:800}#movv .mv-stg span.late.on{background:var(--loss)}#movv .mv-stgt{font-size:11px;color:var(--mute);margin:-4px 0 0}#movv .mv-edge{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin:0 0 12px}#movv .mv-edge div{border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:12px;background:var(--panel)}#movv .mv-edge b{display:block;font-size:13px}#movv .mv-edge i{font-style:normal;color:var(--kc);font-weight:800;font-size:11px}#movv .mv-dis{color:var(--mute);font-size:12px;margin:16px 0 4px}' +
    '#movv .mv-vt{display:flex;gap:8px;margin:0 0 12px}#movv .mv-vt .mv-b{font-size:14px;padding:8px 16px}' +
    '#movv .mv-sk{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:0 0 12px}#movv .mv-sk>div{border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--panel)}#movv .mv-sk .big{font-size:26px;font-weight:800;line-height:1.1}#movv .mv-sk small{display:block;color:var(--mute);font-size:11px;margin-top:2px}' +
    '#movv .up{color:var(--gain)}#movv .dn{color:var(--loss)}' +
    '#movv .mv-dv{display:grid;grid-template-columns:64px 1fr 74px;gap:8px;align-items:center;font-size:12px;margin:5px 0}#movv .mv-dv .tr{position:relative;height:16px;background:var(--line);border-radius:4px}#movv .mv-dv .tr:before{content:"";position:absolute;left:50%;top:-2px;bottom:-2px;width:2px;background:var(--ink);opacity:.5}#movv .mv-dv .tr i{position:absolute;top:2px;bottom:2px;border-radius:3px}#movv .mv-dv b{font-weight:800}#movv .mv-dv em{font-style:normal;color:var(--mute);font-size:10px;margin-left:4px}' +
    '#movv .mv-tb{width:100%;border-collapse:collapse;font-size:12px}#movv .mv-tb th{text-align:right;color:var(--mute);font-weight:600;padding:6px 6px;border-bottom:1px solid var(--line);white-space:nowrap}#movv .mv-tb td{text-align:right;padding:6px;border-bottom:1px solid var(--line);white-space:nowrap}#movv .mv-tb th:first-child,#movv .mv-tb td:first-child{text-align:left}#movv .mv-tw{overflow-x:auto}' +
    '#movv .mv-note{border-left:4px solid var(--accent);background:var(--panel);padding:10px 12px;border-radius:8px;font-size:13px;margin:0 0 12px}';

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function score(p) { var n = 0; KINDS[p.kind].crit.forEach(function (c) { if (p.v && p.v[c[0]] === 1) n++; }); return n; }
  function dayNum(iso) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ""); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000 : NaN; }
  function today() { var d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000; }
  function inDays(iso) { var n = dayNum(iso) - today(); if (isNaN(n)) return ""; return n < 0 ? "passed" : n === 0 ? "today" : n === 1 ? "tomorrow" : "in " + n + " days"; }
  function fmtDate(iso) { var d = new Date(dayNum(iso) * 86400000); return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }); }
  function picksOf(k) { return DATA.picks.filter(function (p) { return KINDS[p.kind] && p.kind === k; }); }

  function timeline() {
    var t0 = today(), span = 16, items = [];
    DATA.picks.forEach(function (p) { var n = dayNum(p.catDate) - t0; if (n >= -1 && n <= span) items.push({ n: n, t: p.t, k: p.kind, w: p.cat }); });
    (DATA.events || []).forEach(function (e) { var n = dayNum(e.d) - t0; if (n >= -1 && n <= span) items.push({ n: n, t: e.l, k: "ev", ev: 1 }); });
    if (!items.length) return "";
    items.sort(function (a, b) { return a.n - b.n; });
    var seen = {}, out = '<div class="mv-box"><h3>Catalyst calendar: the next 2 weeks</h3><div class="mv-tl"><div class="ax"></div><div class="now" style="left:' + (1 / (span + 1) * 100) + '%"></div>';
    items.forEach(function (it) {
      var left = (it.n + 1) / (span + 1) * 100, slot = seen[it.n] = (seen[it.n] || 0) + 1, col = it.ev ? "var(--mute)" : "var(--kc)";
      out += '<div class="dot k-' + esc(it.k) + '" style="left:' + left.toFixed(1) + '%;top:' + (it.ev ? 76 + 16 * (it.n % 2 ? 1 : 0) : slot === 1 ? 38 : slot === 2 ? 14 : 0) + 'px;max-width:150px;overflow:hidden;text-overflow:ellipsis" title="' + esc(it.w || it.t) + '"><i style="background:' + col + '"></i>' + esc(it.t) + '</div>';
    });
    for (var d = -1; d <= span; d += 3) out += '<div class="tk" style="left:' + ((d + 1) / (span + 1) * 100).toFixed(1) + '%">' + (d === 0 ? "today" : fmtDate(new Date((t0 + d) * 86400000).toISOString().slice(0, 10))) + '</div>';
    return out + '</div><div class="mv-chip" style="margin-top:8px"><span style="color:var(--kc)" class="k-day">●</span> day <span class="k-swing" style="color:var(--kc)">●</span> swing <span class="k-invest" style="color:var(--kc)">●</span> invest <span class="k-penny" style="color:var(--kc)">●</span> penny <span style="color:var(--mute)">●</span> market event</div></div>';
  }

  function styleCard(k) {
    var K = KINDS[k], rk = ""; for (var i = 1; i <= 5; i++) rk += '<u class="' + (i <= K.risk ? "on" : "") + '"></u>';
    return '<button type="button" class="mv-sty k-' + k + (ST.kind === k ? " on" : "") + '" data-mvk="' + k + '"><div class="hd"><div class="ic">' + ICON[k] + '</div><div><div class="nm">' + K.name + '</div><div class="tg">' + K.tag + '</div></div><div class="n">' + picksOf(k).length + '</div></div>' +
      '<div><div class="mv-hz"><i style="left:' + K.pos[0] + '%;width:' + (K.pos[1] - K.pos[0]) + '%"></i></div><div class="mv-hzl"><span>minutes</span><span>days</span><span>years</span></div></div>' +
      '<div class="mv-fx"><span>Hold</span><div>' + K.hold + '</div><span>Goal</span><div>' + K.goal + '</div><span>Look for</span><div>' + K.look + '</div><span>Risk</span><div class="mv-rk">' + rk + '</div></div></button>';
  }

  function card(p, i, top) {
    var K = KINDS[p.kind], hasV = p.v || {}, dots = K.crit.map(function (c) { var v = hasV[c[0]]; return '<span class="mv-dot ' + (v === 1 ? "y" : v === 0 ? "n" : "") + '" title="' + esc(c[2] + (v === -1 || v == null ? " (not stated)" : "")) + '">' + (v === 1 ? "✓" : v === 0 ? "✕" : "?") + ' ' + esc(c[1]) + '</span>'; }).join("");
    var sc = score(p), fl = ""; K.crit.forEach(function (c, q) { var v = hasV[c[0]]; fl += '<u class="' + (v === 1 ? "y" : v === -1 || v == null ? "q" : "") + '"></u>'; });
    var range = p.hi && p.lo && p.px ? '<div><div class="mv-bar"><i style="left:calc(' + Math.max(0, Math.min(100, (p.px - p.lo) / (p.hi - p.lo) * 100)).toFixed(1) + '% - 2px)"></i></div><div class="mv-bl"><span>$' + esc(p.lo) + '</span><span>' + esc(p.hiN || "") + '</span></div></div>' : "";
    var chg = typeof p.chg === "number" ? '<small class="' + (p.chg >= 0 ? "up" : "dn") + '">' + (p.chg >= 0 ? "+" : "") + p.chg.toFixed(2) + '%</small>' : "";
    var cd = p.catDate ? " · " + inDays(p.catDate) : "";
    return '<div class="mv-card k-' + esc(p.kind) + (top ? " top" : "") + '" data-i="' + i + '">' + (top ? '<div class="mv-rib">' + (p.kind === "radar" ? "STRONGEST SETUP" : p.kind === "penny" ? "BEST OF A RISKY LOT" : "HOTTEST RIGHT NOW") + '</div>' : "") +
      '<div class="mv-r1"><div><div class="mv-t">' + esc(p.t) + '</div><div class="mv-n">' + esc(p.n) + '</div></div><div class="mv-px" data-mvpx>' + (p.px ? "$" + Number(p.px).toFixed(2) : "price n/a") + chg + '<small>' + esc(p.pxN || "") + '</small></div></div>' +
      '<div><span class="mv-tag">' + esc(p.theme) + '</span><span class="mv-tag mv-cat">' + esc(p.cat) + esc(cd) + '</span></div>' +
      '<div class="mv-heat"><div class="mv-fl" title="Heat: how many of the 5 checks the article supports">' + fl + '</div><span class="mv-sc">' + sc + '/5</span><span class="mv-why">' + esc(p.setup || "") + '</span></div>' +
      (p.stage ? '<div class="mv-stg">' + (K.stg || ["Asleep", "Waking up", "Breaking out", "Already ran"]).map(function (n, q) { return '<span class="' + (q === 3 ? "late " : "") + (p.stage === q + 1 ? "on" : "") + '">' + n + '</span>'; }).join("") + '</div>' + (p.stageN ? '<div class="mv-stgt">' + esc(p.stageN) + '</div>' : "") : "") + '<div class="mv-dots">' + dots + '</div>' + range +
      '<p class="mv-p"><b>The story:</b> ' + esc(p.why) + '</p><p class="mv-p mv-rkp"><b>Watch out:</b> ' + esc(p.risk) + '</p>' +
      '<div class="mv-ft"><a href="' + esc(/^https:\/\//.test(p.src) ? p.src : "#") + '" target="_blank" rel="noopener">' + esc(p.srcN) + ' ↗</a><button class="mv-b" type="button" data-mvnews="' + i + '">Latest headlines</button></div><div data-mvnw></div></div>';
  }

  function quiz() {
    return '<div class="mv-box"><h3>Which style fits you? 3 quick questions</h3><div class="mv-q" id="mvq">' + QUIZ.map(function (q, i) {
      return '<div><div class="qq">' + (i + 1) + '. ' + esc(q[0]) + '</div><div class="ops">' + q.slice(1).map(function (o) { return '<button type="button" class="mv-b" data-mvq="' + i + '" data-mva="' + o[1] + '">' + esc(o[0]) + '</button>'; }).join("") + '</div></div>';
    }).join("") + '</div><div class="mv-res" id="mvres"></div></div>';
  }


  function pct(x) { return (x >= 0 ? "+" : "") + x.toFixed(1) + "%"; }
  function usd(x) { return (x >= 0 ? "+$" : "-$") + Math.abs(x).toFixed(2); }
  function cur(e) { if (e.status === "closed" && e.closed != null) return e.closed; var q = ST.lq && ST.lq[e.t]; return q && q.p ? Number(q.p) : e.last; }
  function spyNow(e) { if (e.status === "closed" && e.spyClosed) return e.spyClosed; var q = ST.lq && ST.lq.SPY; return q && q.p ? Number(q.p) : LED.spyLast; }
  function rowsOf() {
    return LED.entries.filter(function (e) { return e.entry > 0 && e.spy > 0 && KINDS[e.kind]; }).map(function (e) {
      var c = cur(e), r = (c - e.entry) / e.entry * 100, sr = (spyNow(e) - e.spy) / e.spy * 100;
      return { e: e, c: c, r: r, d: c - e.entry, sr: sr, a: r - sr, days: Math.max(0, today() - dayNum(e.posted)) };
    });
  }
  function stat(rs) {
    if (!rs.length) return null;
    var n = rs.length, w = rs.filter(function (x) { return x.r > 0; }).length, b = rs.filter(function (x) { return x.a > 0; }).length, sum = function (f) { return rs.reduce(function (t, x) { return t + f(x); }, 0); };
    var srt = rs.slice().sort(function (x, y) { return y.r - x.r; });
    return { n: n, w: w, b: b, ar: sum(function (x) { return x.r; }) / n, aa: sum(function (x) { return x.a; }) / n, sr: sum(function (x) { return x.sr; }) / n, best: srt[0], worst: srt[n - 1] };
  }
  function scoreView() {
    if (!LED) return '<div class="mv-box">The scorecard file could not load. Refresh the page.</div>';
    var rs = rowsOf(), all = stat(rs), pend = LED.entries.filter(function (e) { return !(e.entry > 0); });
    var age = rs.length ? Math.max.apply(null, rs.map(function (x) { return x.days; })) : 0, hzs = LED.horizon || {};
    var out = '<div class="mv-note"><b>How honest is this?</b> Every pick is logged on the day it is posted, at the price printed in its source. No backtests, no deleting losers. Tracking began ' + esc(fmtDate(LED.started)) + '. The market benchmark is ' + esc(LED.bench) + ' measured from the same moment. Holding periods: day trades 1 day, radar and swing about ' + (hzs.swing || 10) + ' trading days, investments about ' + (hzs.invest || 90) + ' days.' + (age < 3 ? ' <b>It is day ' + age + '.</b> Baselines are set; real results need days and weeks, so treat early numbers as noise.' : '') + (rs.length < 30 ? ' With only ' + rs.length + ' priced picks, even a good start is not proof of an edge (it takes 30+ to say much).' : '') + '</div>';
    if (!all) return out + '<div class="mv-box">No priced picks yet.</div>';
    var flat = rs.every(function (x) { return Math.abs(x.r) < 0.005; });
    var edgeTxt = all.aa >= 0 ? "+" + all.aa.toFixed(1) + " pts" : all.aa.toFixed(1) + " pts";
    out += '<div class="mv-sk"><div><div class="big ' + (all.w / all.n >= .5 ? "up" : "dn") + '">' + Math.round(all.w / all.n * 100) + '%</div>Hit rate<small>' + all.w + ' of ' + all.n + ' are up since posting</small></div>' +
      '<div><div class="big ' + (all.ar >= 0 ? "up" : "dn") + '">' + pct(all.ar) + '</div>Average move<small>from the posted price</small></div>' +
      '<div><div class="big ' + (all.sr >= 0 ? "up" : "dn") + '">' + edgeTxt + '</div>Edge vs ' + esc(LED.bench) + '<small>average pick minus the market over the same time</small></div>' +
      '<div><div class="big up">' + esc(all.best.e.t) + '</div>Best so far<small>' + pct(all.best.r) + ' (' + usd(all.best.d) + '/share)</small></div>' +
      '<div><div class="big dn">' + esc(all.worst.e.t) + '</div>Worst so far<small>' + pct(all.worst.r) + ' (' + usd(all.worst.d) + '/share)</small></div></div>';
    out += '<div class="mv-box"><h3>Which style is earning its keep?</h3>' + ["radar", "day", "swing", "invest", "penny"].map(function (k) {
      var st = stat(rs.filter(function (x) { return x.e.kind === k; }));
      return '<div class="mv-dv k-' + k + '"><span style="color:var(--kc);font-weight:800">' + esc(KINDS[k].name) + '</span>' + (st ? '<div class="tr"><i style="background:' + (st.aa >= 0 ? "var(--gain)" : "var(--loss)") + ';' + (st.aa >= 0 ? "left:50%;" : "right:50%;") + 'width:' + Math.min(50, Math.abs(st.aa) * 2.5).toFixed(1) + '%"></i></div><span><b class="' + (st.aa >= 0 ? "up" : "dn") + '">' + pct(st.aa) + '</b><em>' + st.n + ' picks</em></span>' : '<div class="tr"></div><span>none</span>') + '</div>';
    }).join("") + '<div class="mv-bl"><span>Beating the market ← 0 → Lagging</span><span>bars show average edge vs ' + esc(LED.bench) + ' in points</span></div></div>';
    var sorted = rs.slice().sort(function (x, y) { return y.r - x.r; }), mx = Math.max(5, Math.max.apply(null, sorted.map(function (x) { return Math.abs(x.r); })));
    out += '<div class="mv-box"><h3>Every pick since it was posted</h3>' + sorted.map(function (x) {
      return '<div class="mv-dv k-' + x.e.kind + '"><span style="font-weight:800">' + esc(x.e.t) + '</span><div class="tr"><i style="background:' + (x.r >= 0 ? "var(--gain)" : "var(--loss)") + ';' + (x.r >= 0 ? "left:50%;" : "right:50%;") + 'width:' + (Math.abs(x.r) / mx * 50).toFixed(1) + '%"></i></div><span><b class="' + (x.r >= 0 ? "up" : "dn") + '">' + pct(x.r) + '</b></span></div>';
    }).join("") + '</div>';
    out += '<div class="mv-box"><h3>The full ledger</h3><div class="mv-tw"><table class="mv-tb"><thead><tr><th>Stock</th><th>Style</th><th>Posted</th><th>Entry</th><th>Now</th><th>$ move</th><th>% move</th><th>vs ' + esc(LED.bench) + '</th><th>Days</th><th>Status</th></tr></thead><tbody>' + sorted.map(function (x) {
      var hz = hzs[x.e.kind] || 10, done = x.e.status === "closed";
      return '<tr><td><b>' + esc(x.e.t) + '</b></td><td class="k-' + esc(x.e.kind) + '" style="color:var(--kc)">' + esc(KINDS[x.e.kind].name) + '</td><td>' + esc(fmtDate(x.e.posted)) + '</td><td title="' + esc(x.e.entryN || "") + '">$' + x.e.entry.toFixed(2) + '</td><td>$' + x.c.toFixed(2) + '</td><td class="' + (x.d >= 0 ? "up" : "dn") + '">' + usd(x.d) + '</td><td class="' + (x.r >= 0 ? "up" : "dn") + '">' + pct(x.r) + '</td><td class="' + (x.a >= 0 ? "up" : "dn") + '">' + pct(x.a) + '</td><td>' + x.days + '</td><td>' + (done ? "closed" : "open · " + hz + "d plan") + '</td></tr>';
    }).join("") + '</tbody></table></div>' + (pend.length ? '<p class="mv-dis">Awaiting a first price (no price in the source article): ' + pend.map(function (e) { return esc(e.t); }).join(", ") + '. They join the stats once a price is logged.</p>' : "") + '</div>';
    return out + '<p class="mv-dis">Entry prices come from the source articles and may be an intraday or prior-close quote, so the first day can be off by the gap. "Now" is live when you are signed in, otherwise the last price logged by the daily refresh. Past results do not predict future ones. Not advice.</p>';
  }
  function loadLed() {
    return fetch("movers-ledger.json?v=" + Math.floor(Date.now() / 3600000)).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { if (j && j.entries) LED = j; }).catch(function () { });
  }
  function liveScore(el) {
    var a = api(); if (!a || !a.quotes || !LED) return;
    var syms = ["SPY"]; LED.entries.forEach(function (e) { if (e.status !== "closed" && e.entry > 0 && syms.indexOf(e.t) < 0 && syms.length < 30) syms.push(e.t); });
    a.quotes(syms).then(function (r) { if (r && r.quotes && r.quotes.SPY) { ST.lq = r.quotes; if (ST.view === "score") render(el, true); } }).catch(function () { });
  }

  function tabs() { return '<div class="mv-vt"><button type="button" class="mv-b ' + (ST.view === "picks" ? "on" : "") + '" data-mvv="picks">Picks</button><button type="button" class="mv-b ' + (ST.view === "score" ? "on" : "") + '" data-mvv="score">Scorecard</button></div>'; }
  var ans = [];
  function render(el, noLive) {
    if (ST.view === "score") {
      el.innerHTML = '<style>' + CSS + '</style><div class="mv-h"><h2>Parabolic Movers</h2><span class="mv-sub">Scorecard · how the picks are doing</span></div>' + tabs() + scoreView();
      if (!noLive) liveScore(el); return;
    }
    var K = KINDS[ST.kind], all = picksOf(ST.kind), themes = {}; all.forEach(function (p) { themes[p.theme] = 1; });
    var list = all.map(function (p, i) { return { p: p, i: DATA.picks.indexOf(p) }; }).filter(function (x) { return !ST.theme || x.p.theme === ST.theme; });
    list.sort(function (a, b) {
      if (ST.sort === "date") { var da = dayNum(a.p.catDate), db = dayNum(b.p.catDate); da = isNaN(da) ? 1e9 : da; db = isNaN(db) ? 1e9 : db; return da - db || score(b.p) - score(a.p); }
      return ((a.p.stage === 4) - (b.p.stage === 4)) || score(b.p) - score(a.p);
    });
    var tape = (DATA.tape || []).map(function (t) { return '<span class="mv-chip">' + esc(t.l) + ' <b>' + esc(t.v) + '</b>' + (typeof t.d === "number" ? '<span class="' + (t.d >= 0 ? "up" : "dn") + '">' + (t.d >= 0 ? "+" : "") + t.d.toFixed(2) + '%</span>' : "") + '</span>'; }).join("");
    var leg = K.crit.map(function (c) { return '<div><b>' + esc(c[1]) + '</b><span>' + esc(c[2]) + '</span></div>'; }).join("");
    el.innerHTML = '<style>' + CSS + '</style><div class="mv-h"><h2>Parabolic Movers</h2><span class="mv-sub">News-sourced candidates · updated ' + esc(DATA.asof) + '</span></div>' + tabs() +
      (tape ? '<div class="mv-tape">' + tape + '</div>' : "") + timeline() +
      '<div class="mv-styles">' + ["radar", "day", "swing", "invest", "penny"].map(styleCard).join("") + '</div>' +
      '<div class="k-' + ST.kind + '"><div class="mv-play">' + K.play.map(function (t) { return '<div>' + esc(t) + '</div>'; }).join("") + '</div>' +
      (ST.kind === "day" ? '<div class="mv-ctl"><button class="mv-b" type="button" data-mvprac="1">Practice day-trade setups →</button></div>' : "") +
      '<div class="mv-leg">' + leg + '</div>' + (ST.kind === "penny" ? '<div class="mv-edge"><div><i>KILLER #1</i><b>Dilution</b>Tiny companies pay bills by selling new shares. Each sale makes yours worth less.</div><div><i>KILLER #2</i><b>Reverse splits</b>A 1-for-10 split makes the price look 10x higher while changing nothing. Repeat ones usually mean trouble.</div><div><i>KILLER #3</i><b>Delisting notices</b>Under $1 for 30 days gets a Nasdaq warning. Suspension can freeze your exit.</div><div><i>PUMP PATTERN</i><b>Spike with no news</b>Huge volume, no filing and a low float is how pump-and-dumps look. Study, do not chase.</div></div>' : "") + (ST.kind === "radar" ? '<div class="mv-edge"><div><i>2 DAYS OLD</i><b>Insider buys</b>Form 4 filings land within 2 business days. Cluster buys by several people count most.</div><div><i>SAME DAY</i><b>Volume and options</b>Calls and share volume well above normal show up before the headline does.</div><div><i>UP TO 45 DAYS OLD</i><b>Fund buys (13F)</b>Quarterly filings lag, so treat them as a clue, not a trigger.</div><div><i>YOUR EYES</i><b>The chart</b>A quiet base above the 50-day average beats a stock already up 4x.</div></div>' : "") +
      '<div class="mv-ctl"><button class="mv-b ' + (ST.sort === "heat" ? "on" : "") + '" data-mvs="heat" type="button">Hottest first</button><button class="mv-b ' + (ST.sort === "date" ? "on" : "") + '" data-mvs="date" type="button">Soonest catalyst</button><span class="mv-sp"></span>' +
      '<button class="mv-b ' + (ST.theme ? "" : "on") + '" data-mvt="" type="button">All themes</button>' + Object.keys(themes).map(function (t) { return '<button class="mv-b ' + (ST.theme === t ? "on" : "") + '" data-mvt="' + esc(t) + '" type="button">' + esc(t) + '</button>'; }).join("") + '</div>' +
      '<div class="mv-grid">' + list.map(function (x, n) { return card(x.p, x.i, n === 0 && ST.sort === "heat" && !ST.theme && score(x.p) >= (ST.kind === "penny" ? 3 : 4)); }).join("") + '</div></div>' +
      '<div style="height:14px"></div>' + quiz() +
      '<p class="mv-dis">Every card is built from the dated article linked on it, not from a price screen. Heat counts how many of the 5 checks the article supports (? = it did not say). These are not predictions or advice: day and swing trades can lose money fast, and even investments fall. Know your stop before you enter. Penny stocks are the riskiest style here: many spikes fade the same day, and a trade can be impossible to exit.</p>';
    live(el);
  }

  function api() { return window.stockspotSocial; }
  function live(el) {
    var a = api(); if (!a || !a.quotes) return;
    var syms = []; DATA.picks.forEach(function (p) { if (syms.indexOf(p.t) < 0 && syms.length < 25) syms.push(p.t); });
    a.quotes(syms).then(function (r) {
      if (!r || !r.quotes) return;
      DATA.picks.forEach(function (p, i) {
        var q = r.quotes[p.t], c = el.querySelector('[data-i="' + i + '"] [data-mvpx]'); if (!q || !c) return;
        c.innerHTML = '$' + Number(q.p).toFixed(2) + '<small class="' + (q.dp >= 0 ? "up" : "dn") + '">' + (q.dp >= 0 ? "+" : "") + Number(q.dp).toFixed(2) + '% live</small>';
      });
    }).catch(function () { });
  }

  function news(el, i) {
    var box = el.querySelector('[data-i="' + i + '"] [data-mvnw]'), a = api(); if (!box) return;
    if (!a || !a.news) { box.innerHTML = '<div class="mv-nw">Sign in to see live headlines.</div>'; return; }
    box.innerHTML = '<div class="mv-nw">Loading…</div>';
    a.news([DATA.picks[i].t]).then(function (r) {
      var items = (r && r.items || []).slice(0, 5);
      box.innerHTML = '<div class="mv-nw">' + (items.length ? items.map(function (x) { return '<div><a href="' + esc(/^https?:\/\//.test(x.url) ? x.url : "#") + '" target="_blank" rel="noopener">' + esc(x.title) + '</a><br><span>' + esc(x.source || "") + ' · ' + new Date(x.ts).toLocaleDateString() + '</span></div>'; }).join("") : (r && r.configured === false ? "News feed is not set up yet." : "No headlines in the last week.")) + '</div>';
    }).catch(function () { box.innerHTML = '<div class="mv-nw">Could not load headlines. Sign in and try again.</div>'; });
  }

  function load() {
    return fetch("movers-data.json?v=" + Math.floor(Date.now() / 3600000)).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { if (j && j.picks && j.picks.length) { DATA = j; DATA.picks = DATA.picks.filter(function (p) { return p && KINDS[p.kind] && p.t; }); ST.loaded = true; } }).catch(function () { });
  }

  var bound = false;
  window.ParabolicMovers = { mount: function (el) {
    (ST.loaded ? Promise.resolve() : Promise.all([load(), loadLed()])).then(function () { if (!DATA.picks.length) { el.textContent = "Could not load the movers list. Refresh the page."; return; } render(el); });
    if (bound) return; bound = true;
    el.addEventListener("click", function (e) {
      var t = e.target, b;
      if ((b = t.closest("[data-mvv]"))) { ST.view = b.getAttribute("data-mvv"); render(el); }
      else if ((b = t.closest("[data-mvk]"))) { ST.kind = b.getAttribute("data-mvk"); ST.theme = ""; ST.view = "picks"; render(el); }
      else if ((b = t.closest("[data-mvs]"))) { ST.sort = b.getAttribute("data-mvs"); render(el); }
      else if ((b = t.closest("[data-mvt]"))) { ST.theme = b.getAttribute("data-mvt"); render(el); }
      else if ((b = t.closest("[data-mvnews]"))) news(el, +b.getAttribute("data-mvnews"));
      else if (t.closest("[data-mvprac]")) { var np = document.getElementById("navprac"); if (np) np.click(); }
      else if ((b = t.closest("[data-mvq]"))) {
        ans[+b.getAttribute("data-mvq")] = b.getAttribute("data-mva");
        Array.prototype.forEach.call(el.querySelectorAll('[data-mvq="' + b.getAttribute("data-mvq") + '"]'), function (x) { x.classList.toggle("on", x === b); });
        if (ans.filter(Boolean).length === QUIZ.length) {
          var c = { day: 0, swing: 0, invest: 0 }; ans.forEach(function (a) { if (c[a] != null) c[a]++; });
          var best = ["swing", "day", "invest"].sort(function (x, y) { return c[y] - c[x]; })[0], r = el.querySelector("#mvres");
          r.innerHTML = 'You look like ' + ({ day: 'a day trader', swing: 'a swing trader', invest: 'an investor', radar: 'a hunter' }[best]) + '. <span class="k-' + best + '" style="display:none"></span><button class="mv-b" type="button" data-mvk="' + best + '">Show me ' + KINDS[best].name.toLowerCase() + '</button>';
        }
      }
    });
  } };
})();
