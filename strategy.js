/* Revatour Backtest Lab: "Build a strategy" tab. Step-by-step wizard or all-at-once blocks, same data.
   Needs btengine.js (the engine) and backtest.js (the page shell, chart and saved scenes). */
(function () {
  "use strict";
  var E = window.BTEngine, KEY = "revatour-btb-v1", X = null, root = null;
  var B = { msg: "", pull: { sym: "", d1: "", d2: "", tf: "2" }, strats: [], cur: null, mode: "wizard", step: 0, tpl: false, res: null, cmp: null, code: "", practice: 0, imp: false };
  var STEPS = [["basics", "Basics"], ["marker", "Marker candle"], ["signal", "Signal"], ["entry", "Entry"], ["stop", "Stop"], ["targets", "Targets and exits"], ["limits", "Filters and limits"], ["review", "Review and test"]];
  var CHIPS = [
    ["Closes below VWAP", E.C("close", "<", "vwap")], ["Closes above VWAP", E.C("close", ">", "vwap")], ["Closes below 9 EMA", E.C("close", "<", "ema9")], ["Closes above 9 EMA", E.C("close", ">", "ema9")],
    ["Red candle", E.IZ("red")], ["Green candle", E.IZ("green")], ["Doji", E.IZ("doji")], ["Hammer", E.IZ("hammer")], ["Inverted hammer", E.IZ("inv")], ["Inside bar", E.IZ("inside")], ["Spinning top", E.IZ("spin")],
    ["New high of day", E.IZ("newHod")], ["Touches VWAP", E.IZ("touchVwap")], ["Touches 9 EMA", E.IZ("touchEma")], ["Small candle (body 35% or less)", E.C("bodyPct", "<=", 35)],
    ["Long top wick (40%+)", E.C("upWickPct", ">=", 40)], ["Heavy volume (2x)", E.C("relVol", ">=", 2)], ["Gap up 8%+", E.C("gapPct", ">=", 8)], ["2 green candles in a row", { t: "run", color: "green", n: 2 }], ["2 red candles in a row", { t: "run", color: "red", n: 2 }]
  ];

  function ex() { return X || (X = window.BacktestLab && window.BacktestLab._x); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function norm(s) {
    var b = E.blank(); ["anchor", "trig", "entry", "stop", "mgmt", "exit", "window", "limits", "filters", "risk"].forEach(function (k) { s[k] = Object.assign({}, b[k], s[k] || {}); });
    s.anchor.conds = s.anchor.conds || []; s.trig.conds = s.trig.conds || []; s.exit.conds = s.exit.conds || []; s.targets = s.targets || []; s.side = s.side === "long" ? "long" : "short"; s.name = s.name || "My strategy"; s.id = s.id || b.id; return s;
  }
  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || "{}"); B.strats = (d.strats || []).map(norm); B.cur = d.cur || null; B.mode = d.mode === "blocks" ? "blocks" : "wizard"; B.step = Math.min(d.step || 0, STEPS.length - 1); B.practice = d.practice || 0; } catch (e) { } if (!B.strats.length) B.tpl = true; if (!cur() && B.strats.length) B.cur = B.strats[0].id; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ strats: B.strats, cur: B.cur, mode: B.mode, step: B.step, practice: B.practice })); } catch (e) { } }
  function cur() { return B.strats.filter(function (s) { return s.id === B.cur; })[0] || null; }
  function stale() { B.res = null; B.cmp = null; B.code = ""; var q = ex(); if (q) q.S.cres = null; }
  function setP(o, path, v) { var k = path.split("."), i; for (i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = v; }

  /* ---------- tiny pictures ---------- */
  function cd(x, top, bot, wt, wb, red) { var c = red ? "var(--loss)" : "var(--gain)"; return '<line x1="' + x + '" x2="' + x + '" y1="' + wt + '" y2="' + wb + '" stroke="' + c + '" stroke-width="1.6"/><rect x="' + (x - 5) + '" y="' + top + '" width="10" height="' + Math.max(2, bot - top) + '" fill="' + c + '" rx="1"/>'; }
  function dash(y, x1, x2, col) { return '<line x1="' + (x1 || 6) + '" x2="' + (x2 || 94) + '" y1="' + y + '" y2="' + y + '" stroke="' + (col || "var(--ink)") + '" stroke-width="1.4" stroke-dasharray="4 3"/>'; }
  function dot(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="var(--ink)" stroke="var(--panel)" stroke-width="1.5"/>'; }
  function svg(inner) { return '<svg viewBox="0 0 100 56" width="100" height="56" aria-hidden="true">' + inner + '</svg>'; }
  var PICS = {
    blank: svg('<rect x="22" y="10" width="56" height="36" rx="6" fill="none" stroke="var(--mute)" stroke-dasharray="4 3"/><text x="50" y="35" text-anchor="middle" font-size="22" fill="var(--mute)">+</text>'),
    short: svg(cd(24, 12, 28, 6, 32, true) + cd(44, 24, 38, 20, 44, true) + cd(64, 34, 46, 30, 52, true) + '<path d="M20 12 L84 48" stroke="#d4a017" stroke-width="2" fill="none"/>'),
    long: svg(cd(24, 36, 46, 30, 52, false) + cd(44, 26, 38, 20, 42, false) + cd(64, 12, 28, 6, 32, false) + '<path d="M20 48 L84 14" stroke="#2b7de0" stroke-width="2" fill="none"/>'),
    marker: svg(cd(22, 14, 24, 4, 26, true) + dash(26, 12, 92) + cd(44, 24, 36, 20, 42, true) + cd(64, 32, 42, 28, 48, true) + dot(64, 46)),
    gap: svg(dash(40, 6, 30, "var(--mute)") + cd(40, 12, 22, 8, 26, false) + cd(58, 14, 28, 8, 30, true) + cd(76, 26, 40, 22, 46, true)),
    break: svg(cd(32, 12, 28, 6, 36, true) + dash(36, 6, 94) + cd(62, 30, 44, 26, 50, true) + dot(62, 36)),
    close: svg(cd(40, 12, 30, 6, 36, true) + dot(40, 30) + '<path d="M54 30 h30" stroke="var(--mute)" stroke-width="1.2" stroke-dasharray="3 3"/>'),
    nextopen: svg(cd(30, 12, 30, 6, 36, true) + cd(62, 30, 44, 26, 50, true) + dot(62, 30)),
    s_candle: svg(cd(40, 20, 38, 14, 44, true) + dash(8) + '<text x="62" y="12" font-size="9" fill="var(--mute)">stop</text>'),
    s_mid: svg(cd(40, 14, 40, 8, 46, true) + dash(27) + '<text x="62" y="31" font-size="9" fill="var(--mute)">stop</text>'),
    s_fixed: svg(dot(40, 36) + dash(14, 20, 80) + '<path d="M70 14 V36" stroke="var(--ink)" stroke-width="1.4"/><text x="74" y="29" font-size="10" fill="var(--ink)">$</text>'),
    s_pct: svg(dot(40, 36) + dash(14, 20, 80) + '<text x="72" y="30" font-size="11" fill="var(--ink)">%</text>'),
    s_atr: svg(dot(40, 36) + dash(14, 20, 80) + '<text x="62" y="32" font-size="9" fill="var(--ink)">ATR</text>'),
    s_anchor: svg(cd(24, 12, 24, 4, 28, true) + dash(5) + cd(54, 28, 40, 24, 46, true) + dot(54, 40))
  };

  /* ---------- form pieces ---------- */
  function num(path, v, w, ph) { return '<input class="bb-n" data-bp="' + path + '" data-bty="n" inputmode="decimal" value="' + esc(v) + '" style="width:' + (w || 74) + 'px"' + (ph ? ' placeholder="' + ph + '"' : "") + '>'; }
  function sel(path, v, opts) { return '<select data-bp="' + path + '" data-bty="s">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === String(o[0]) ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select>'; }
  function chk(path, v, label) { return '<label class="bb-ck"><input type="checkbox" data-bp="' + path + '" data-bty="b"' + (v ? " checked" : "") + '><span>' + label + '</span></label>'; }
  function pick(path, v, cards) { return '<div class="bb-cards">' + cards.map(function (c) { return '<button type="button" class="bb-card2' + (String(v) === String(c[0]) ? " on" : "") + '" data-bset="' + path + '" data-bval="' + c[0] + '">' + (c[3] ? '<span class="bb-pic">' + c[3] + '</span>' : "") + '<b>' + c[1] + '</b><small>' + c[2] + '</small></button>'; }).join("") + '</div>'; }
  function fopts(skipAnchor) {
    var g = {}, order = []; E.FIELDS.forEach(function (f) { if (skipAnchor && f[2] === "Marker candle") return; if (!g[f[2]]) { g[f[2]] = []; order.push(f[2]); } g[f[2]].push(f); });
    return order.map(function (k) { return { g: k, f: g[k] }; });
  }
  function fsel(attr, v, skipAnchor, withNum) {
    return '<select ' + attr + '>' + (withNum ? '<option value="__num"' + (E.FMAP[v] ? "" : " selected") + '>a number:</option>' : "") + fopts(skipAnchor).map(function (o) { return '<optgroup label="' + o.g + '">' + o.f.map(function (f) { return '<option value="' + f[0] + '"' + (v === f[0] ? " selected" : "") + '>' + f[1] + '</option>'; }).join("") + '</optgroup>'; }).join("") + '</select>';
  }
  function condRow(sec, i, c, skipAnchor) {
    var a = 'data-bc="' + sec + "|" + i + "|", h = '<div class="bb-cond"><span class="bb-ix">' + (i + 1) + '</span>';
    if (c.t === "is") h += '<span>the candle is</span><select ' + a + 'not">' + '<option value="0"' + (c.not ? "" : " selected") + '>exactly</option><option value="1"' + (c.not ? " selected" : "") + '>NOT</option></select><select ' + a + 'v">' + E.IS.map(function (o) { return '<option value="' + o[0] + '"' + (c.v === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select>';
    else if (c.t === "run") h += '<input ' + a + 'n" inputmode="numeric" value="' + c.n + '" class="bb-n" style="width:50px"><select ' + a + 'color"><option value="green"' + (c.color === "green" ? " selected" : "") + '>green</option><option value="red"' + (c.color === "red" ? " selected" : "") + '>red</option></select><span>candles in a row (this one included)</span>';
    else { h += fsel(a + 'a"', c.a, skipAnchor, false) + '<select ' + a + 'op">' + E.OPS.map(function (o) { return '<option value="' + o[0] + '"' + (c.op === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select>' + fsel(a + 'bsel"', c.b, skipAnchor, true); if (!E.FMAP[c.b]) h += '<input ' + a + 'bnum" inputmode="decimal" value="' + esc(c.b) + '" class="bb-n" style="width:72px">'; }
    return h + '<button type="button" class="bb-x" data-bt-act="rm" data-sec="' + sec + '" data-i="' + i + '" title="Remove this rule">&times;</button></div>';
  }
  function condBox(sec, list, mode, modePath, emptyText, skipAnchor) {
    var h = '<div class="bb-conds">';
    if (list.length > 1) h += '<div class="bb-mode">Candle needs <div class="bb-seg2"><button type="button" data-bset="' + modePath + '" data-bval="all" class="' + (mode !== "any" ? "on" : "") + '">ALL of these</button><button type="button" data-bset="' + modePath + '" data-bval="any" class="' + (mode === "any" ? "on" : "") + '">ANY of these</button></div></div>';
    h += list.length ? list.map(function (c, i) { return condRow(sec, i, c, skipAnchor); }).join("") : '<div class="bb-empty">' + emptyText + '</div>';
    h += '<div class="bb-add"><span>Quick add:</span>' + CHIPS.map(function (c, k) { return '<button type="button" class="bb-chip" data-bt-act="chip" data-sec="' + sec + '" data-k="' + k + '">' + c[0] + '</button>'; }).join("") + '</div>';
    h += '<div class="bb-add"><span>Or build your own:</span><button type="button" class="bb-chip alt" data-bt-act="add" data-sec="' + sec + '" data-kind="cmp">Compare two things</button><button type="button" class="bb-chip alt" data-bt-act="add" data-sec="' + sec + '" data-kind="is">Candle is a...</button><button type="button" class="bb-chip alt" data-bt-act="add" data-sec="' + sec + '" data-kind="run">Candles in a row</button></div></div>';
    return h;
  }
  function card(key, no, title, sub, body) { return '<section class="bb-sec" data-sec="' + key + '"><div class="bb-sh"><span class="bb-no">' + no + '</span><div><h3>' + title + '</h3><p>' + sub + '</p></div></div>' + body + '</section>'; }

  /* ---------- the sections ---------- */
  function secBasics(s, n) {
    return card("basics", n, "The basics", "Name it, pick short or long, and set how much you risk on each trade.",
      '<div class="bb-row"><label>Name<input class="bb-t" data-bp="name" data-bty="t" value="' + esc(s.name) + '"></label></div>' +
      pick("side", s.side, [["short", "Short", "Bet the price goes DOWN", PICS.short], ["long", "Long", "Bet the price goes UP", PICS.long]]) +
      '<div class="bb-row"><label>Risk per trade $' + num("risk.dollars", s.risk.dollars) + '</label><label>Slippage $ per share' + num("risk.slip", s.risk.slip) + '</label><label>Smallest risk per share $' + num("risk.minRiskPS", s.risk.minRiskPS) + '</label></div><p class="bb-tip">Shares are sized so that hitting your stop loses about the risk amount. The smallest risk per share stops tiny candles from making huge positions.</p>');
  }
  function secMarker(s, n) {
    var sh = s.side === "short", A = s.anchor;
    var h = pick("anchor.on", A.on ? "1" : "0", [["0", "No marker candle", "Look for the signal candle anywhere in the day"], ["1", "Use a marker candle", "Find a special candle first, then wait for the setup to play out"]]).replace(/data-bset="anchor.on"/g, 'data-bset="anchor.on"');
    if (A.on) {
      h += '<h4 class="bb-h4">Which candle is the marker?</h4>' + condBox("anchor", A.conds, A.mode, "anchor.mode", "No rules yet, so any candle can be a marker. Add a rule below.", true) +
        '<h4 class="bb-h4">What must happen after the marker?</h4><div class="bb-rules">' + chk("anchor.needBreak", A.needBreak, "Wait for price to break the marker's " + (sh ? "LOW" : "HIGH")) + '<label>...within this many candles (0 = no limit)' + num("anchor.within", A.within) + '</label>' + chk("anchor.never", A.never, "Cancel the marker if price goes " + (sh ? "ABOVE its high" : "BELOW its low") + " at any time") + chk("anchor.once", A.once, "Trade each marker only once") + '</div><p class="bb-tip">The signal candle is only looked for AFTER the marker\'s ' + (sh ? "low" : "high") + ' breaks. That is the "HIGH candle, break, never above" idea from your SL-1-RV strategy.</p>';
    }
    return card("marker", n, "Marker candle (optional)", "A marker is a first candle that must show up before the real signal. Skip it if you do not need one.", h);
  }
  function secSignal(s, n) {
    return card("signal", n, "Signal candle", "Which candle tells you to get ready to trade? Add rules. Every rule is checked on that candle when it closes.", condBox("trig", s.trig.conds, s.trig.mode, "trig.mode", "No rules yet, so EVERY candle is a signal. Add at least one rule.", !s.anchor.on));
  }
  function secEntry(s, n) {
    var sh = s.side === "short", e = s.entry;
    var h = pick("entry.how", e.how, [["break", "Break of the signal candle", "Enter when price breaks the signal candle's " + (sh ? "low" : "high"), PICS.break], ["close", "Close of the signal candle", "Enter right at the close, no waiting", PICS.close], ["nextopen", "Next candle's open", "Enter at the open of the very next candle", PICS.nextopen]]);
    if (e.how === "break") h += '<div class="bb-row"><label>Break by $' + num("entry.offset", e.offset) + '</label><label>Wait up to this many candles' + num("entry.within", e.within) + '</label></div><p class="bb-tip">"Break by $0.02" means price must trade 2 cents ' + (sh ? "below the low" : "above the high") + '. Gaps fill at the open.</p>';
    return card("entry", n, "Entry", "How do you get into the trade?", h);
  }
  function secStop(s, n) {
    var sp = s.stop, sh = s.side === "short", opts = [["candle", "Beyond the signal candle", "Just past its " + (sh ? "high" : "low"), PICS.s_candle], ["mid", "Middle of the signal candle", "Tighter stop", PICS.s_mid], ["fixed", "Fixed $ from entry", "Same dollars every time", PICS.s_fixed], ["pct", "% from entry", "A set percent away", PICS.s_pct], ["atr", "Candle-size multiple", "Based on how big candles are (ATR)", PICS.s_atr]];
    if (s.anchor.on) opts.push(["anchor", "Beyond the marker candle", "Just past the marker's " + (sh ? "high" : "low"), PICS.s_anchor]);
    var h = pick("stop.how", sp.how, opts), r = '<div class="bb-row">';
    if (sp.how === "candle" || sp.how === "mid" || sp.how === "anchor") r += '<label>Extra room $' + num("stop.offset", sp.offset) + '</label>';
    if (sp.how === "fixed") r += '<label>Dollars away from entry $' + num("stop.v", sp.v) + '</label>';
    if (sp.how === "pct") r += '<label>Percent away from entry %' + num("stop.v", sp.v) + '</label>';
    if (sp.how === "atr") r += '<label>This many times the average candle size' + num("stop.v", sp.v) + '</label>';
    return card("stop", n, "Stop loss", "Where are you wrong? The stop sets how many shares you can buy.", h + r + '</div>');
  }
  function secTargets(s, n) {
    var h = '<h4 class="bb-h4">Take profits</h4><div class="bb-tg">';
    s.targets.forEach(function (t, i) { h += '<div class="bb-cond"><span class="bb-ix">T' + (i + 1) + '</span><span>Sell</span>' + num("targets." + i + ".pct", t.pct, 56) + '<span>% of the shares at</span>' + sel("targets." + i + ".kind", t.kind, [["r", "R multiple (1R = your risk)"], ["usd", "$ per share"], ["vwap", "VWAP"]]) + (t.kind === "vwap" ? "" : num("targets." + i + ".v", t.v, 64)) + '<button type="button" class="bb-x" data-bt-act="rmt" data-i="' + i + '" title="Remove">&times;</button></div>'; });
    if (!s.targets.length) h += '<div class="bb-empty">No targets. The trade ends at the stop or at the end of the day.</div>';
    h += '</div>' + (s.targets.length < 4 ? '<button type="button" class="bb-chip" data-bt-act="addt">+ Add a target</button>' : "") + '<p class="bb-tip">If the percentages do not add up to 100, the leftover shares ride until the stop, an exit rule, or end of day.</p>';
    h += '<h4 class="bb-h4">Move the stop to protect profit</h4><div class="bb-rules"><label>Move to breakeven when the trade is up this many R (0 = off)' + num("mgmt.beAtR", s.mgmt.beAtR) + '</label>' + chk("mgmt.beAfterT1", s.mgmt.beAfterT1, "Move to breakeven after the first target hits") + chk("mgmt.trail", s.mgmt.trail, "After the first target, trail the stop behind each candle") + '</div>';
    h += '<h4 class="bb-h4">Other ways to get out</h4>' + condBox("exit", s.exit.conds, s.exit.mode, "exit.mode", "No early-exit rules. Add one to leave when something happens (like a candle closing back over VWAP).", !s.anchor.on) + '<div class="bb-rules"><label>Leave after this many candles (0 = off)' + num("exit.maxBars", s.exit.maxBars) + '</label><label>Close everything at (HHMM, 1556 = 3:56pm)' + num("exit.eod", s.exit.eod) + '</label></div>';
    return card("targets", n, "Targets and exits", "How do you take profit, and when do you bail out?", h);
  }
  function secLimits(s, n) {
    return card("limits", n, "Filters and limits", "Keep the bot out of bad times and bad days. Use 0 to switch a limit off.",
      '<div class="bb-rules"><label>Enter no earlier than (HHMM, 934 = 9:34am)' + num("window.start", s.window.start) + '</label><label>Enter no later than (HHMM, 1548 = 3:48pm)' + num("window.end", s.window.end) + '</label><label>Max trades per chart (0 = off)' + num("limits.maxTrades", s.limits.maxTrades) + '</label><label>Stop trading after this many losses (0 = off)' + num("limits.stopAfterLosses", s.limits.stopAfterLosses) + '</label><label>Wait this many candles after a trade' + num("limits.cooldown", s.limits.cooldown) + '</label><label>Signal candle price at least $ (0 = off)' + num("filters.minPrice", s.filters.minPrice) + '</label><label>Gap at least % (0 = off)' + num("filters.minGap", s.filters.minGap) + '</label><label>Gap at most % (0 = off)' + num("filters.maxGap", s.filters.maxGap) + '</label></div><p class="bb-tip">More day-level rules (like volume or gap) can go in the Signal rules above.</p>');
  }

  /* ---------- testing ---------- */
  function charts() {
    var q = ex(), S = q.S, list = [];
    if (S.sim.c.length) list.push({ name: "Current chart", pc: S.sim.pc, tf: S.sim.tf, c: S.sim.c, vw: S.sim.vw, em: S.sim.em });
    S.scenes.forEach(function (sc) { list.push(sc); });
    for (var i = 0; i < B.practice; i++) list.push(E.randomDay(i + 1, S.sim.tf || 2));
    return list;
  }
  function runOne(st, list) {
    var all = [], diag = { bars: 0, anchors: 0, broken: 0, sigBars: 0, signals: 0, entries: 0, conds: st.trig.conds.map(function () { return 0; }) }, cur = [];
    list.forEach(function (sc, k) {
      var tr = E.run(st, sc), d = tr.diag; Object.keys(diag).forEach(function (key) { if (key !== "conds") diag[key] += d[key]; }); d.conds.forEach(function (v, j) { diag.conds[j] += v; });
      tr.forEach(function (t) { t.scene = sc.name; all.push(t); }); if (k === 0 && sc.name === "Current chart") cur = tr.slice();
    });
    return { all: all, cur: cur, diag: diag, sum: E.summarize(all), n: list.length };
  }
  function runTest() {
    var s = cur(), q = ex(), list = charts(); if (!s) return;
    if (!list.length) { q.toast("Add some candles in the simulator tab, or tick the practice days"); return; }
    B.res = runOne(s, list); B.res.id = s.id; q.S.cres = { cust: true, cur: B.res.cur };
    B.cmp = B.strats.length > 1 ? B.strats.map(function (t) { var r = t.id === s.id ? B.res : runOne(t, list); return { id: t.id, name: t.name, side: t.side, sum: r.sum }; }) : null;
    B.code = ""; q.render();
    var el = root && root.querySelector("#bb-results"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function parseCsv(txt, name, pc0) {
    var q = ex(), days = [], dayKey = null, lastTm = -1, counter = 0, cells, rows = txt.split(/\r?\n/);
    rows.forEach(function (line) {
      cells = line.trim().split(/[,\t;]+/).map(function (x) { return x.trim().replace(/^"|"$/g, ""); }); if (cells.length < 5) return;
      var k = cells.length; while (k > 0 && cells[k - 1] !== "" && !isNaN(Number(cells[k - 1]))) k--; var nums = cells.slice(k).map(Number);
      if (nums.length < 4) return; if (nums.length > 5) { k = cells.length - 5; nums = nums.slice(nums.length - 5); }
      var stamp = cells.slice(0, k).join(" "), tmM = /(\d{1,2}):(\d{2})/.exec(stamp), tm = tmM ? +tmM[1] * 60 + +tmM[2] : null;
      var dM = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(stamp), d2 = !dM && /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(stamp), key = dM ? dM[1] + "-" + ("0" + dM[2]).slice(-2) + "-" + ("0" + dM[3]).slice(-2) : d2 ? (d2[3].length === 2 ? "20" + d2[3] : d2[3]) + "-" + ("0" + d2[1]).slice(-2) + "-" + ("0" + d2[2]).slice(-2) : null;
      if (!key) { if (tm != null && lastTm >= 0 && tm <= lastTm) counter++; key = "day" + counter; }
      if (tm != null) { lastTm = tm; if (tm < 570 || tm >= 960) return; }
      var cur = days.length && days[days.length - 1].key === key ? days[days.length - 1] : null; if (!cur) { cur = { key: key, c: [], t: [] }; days.push(cur); }
      cur.c.push({ o: nums[0], h: nums[1], l: nums[2], c: nums[3], v: nums.length > 4 ? nums[4] : 0, k: "normal" }); cur.t.push(tm);
    });
    days = days.filter(function (d) { return d.c.length >= 5; }); if (!days.length) return null;
    var out = [], prev = pc0 > 0 ? pc0 : 0;
    days.forEach(function (d, n) {
      var tf = d.t.length > 1 && d.t[0] != null && d.t[1] != null ? Math.max(1, d.t[1] - d.t[0]) : (q.S.sim.tf || 2), pc = prev > 0 ? prev : d.c[0].o, label = /^day/.test(d.key) ? (days.length > 1 ? "day " + (n + 1) : "") : d.key;
      out.push({ name: ((name || "Real chart") + (label ? " " + label : "")).trim(), pc: Math.round(pc * 100) / 100, gap: Math.round((d.c[0].o / pc - 1) * 1000) / 10, tf: tf, c: d.c, vw: {}, em: {} }); prev = d.c[d.c.length - 1].c;
    });
    return out;
  }
  function aggDay(sym, d, tf) {
    var bk = {}, order = [];
    d.bars.forEach(function (x) { var k = Math.floor((x[0] - 570) / tf), c = bk[k]; if (!c) { bk[k] = { o: x[1], h: x[2], l: x[3], c: x[4], v: x[5], k: "normal" }; order.push(k); } else { c.h = Math.max(c.h, x[2]); c.l = Math.min(c.l, x[3]); c.c = x[4]; c.v += x[5]; } });
    var c = order.sort(function (a, b) { return a - b; }).map(function (k) { return bk[k]; }), pc = d.pc > 0 ? d.pc : c[0].o;
    return { name: sym + " " + d.day, pc: Math.round(pc * 100) / 100, gap: Math.round((c[0].o / pc - 1) * 1000) / 10, tf: tf, c: c, vw: {}, em: {} };
  }
  function pct(x) { return Math.round(x * 100) + "%"; }
  function resHtml(s) {
    var q = ex(), r = B.res, m = q.money, h = '';
    if (!r || r.id !== s.id) return '<p class="bb-tip">Press <b>Run test</b> to see how this strategy does on your charts.</p>';
    var u = r.sum;
    h += '<h3 class="bt-h">Results <small>ran on ' + r.n + (r.n === 1 ? ' chart' : ' charts') + ' and found ' + u.n + (u.n === 1 ? ' trade' : ' trades') + '</small></h3><div class="bt-tiles">' + q.tile(u.n, "Trades (" + r.n + (r.n === 1 ? " chart" : " charts") + ")") + q.tile(pct(u.wr), "Win rate", "", "<b>Win rate</b> is the share of trades that made money.") + q.tile(u.pf === Infinity ? "n/a" : q.f2(u.pf), "Profit factor", "", "<b>Profit factor</b> is dollars won divided by dollars lost. Above 1 is profitable.") + q.tile(q.sgn(u.net), "Net P/L", u.net >= 0 ? "gain" : "loss") + q.tile(q.rr(u.sumR), "Total R", u.sumR >= 0 ? "gain" : "loss", "R is profit divided by your risk per trade (" + m(s.risk.dollars) + ").") + q.tile(q.rr(u.exp), "Average per trade", u.exp >= 0 ? "gain" : "loss", "<b>Expectancy.</b> The average R each trade makes. Positive means an edge.") + q.tile(m(u.dd), "Worst drop", "loss", "The biggest slide from a peak in total profit.") + '</div>';
    if (B.practice > 0) h += '<div class="bt-note">Practice days are made-up price action. They show whether your rules FIRE, not whether the strategy truly works. Test on real charts before you trust any numbers.</div>';
    var d = r.diag, f = [["Candles checked", d.bars]]; if (s.anchor.on) f.push(["Marker candles found", d.anchors], ["Marker broke its " + (s.side === "short" ? "low" : "high"), d.broken]); f.push(["Candles checked for a signal", d.sigBars], ["Signal candles", d.signals], ["Trades taken", d.entries]);
    h += '<details class="bt-grp"' + (u.n ? "" : " open") + '><summary>Where setups drop out (why so few trades?)</summary><div class="bb-fun">' + f.map(function (x, i) { return (i ? '<span class="bb-ar">&rarr;</span>' : "") + '<span class="bb-fs"><b>' + x[1] + '</b><small>' + x[0] + '</small></span>'; }).join("") + '</div>' + (s.trig.conds.length ? '<p class="bb-tip">Each signal rule on its own, out of ' + d.sigBars + ' candles checked:</p><ul class="bb-ul">' + s.trig.conds.map(function (c, i) { return '<li>' + esc(E.describe(c)) + ': passed on <b>' + d.conds[i] + '</b></li>'; }).join("") + '</ul><p class="bb-tip">A rule that passes on very few candles is the one holding you back.</p>' : "") + '</details>';
    if (B.cmp && B.cmp.length > 1) h += '<h3 class="bt-h">Your strategies side by side <small>same charts, same risk rules</small></h3><div class="bt-tw"><table class="bt-t"><thead><tr><th>Strategy</th><th>Side</th><th>Trades</th><th>Win rate</th><th>Profit factor</th><th>Net P/L</th><th>Total R</th><th>Avg R</th></tr></thead><tbody>' + B.cmp.map(function (c) { var z = c.sum; return '<tr class="' + (c.id === s.id ? "on" : "") + '"><td><button type="button" class="bb-lnk" data-bt-act="pickstrat" data-id="' + c.id + '">' + esc(c.name) + '</button></td><td>' + c.side + '</td><td>' + z.n + '</td><td>' + pct(z.wr) + '</td><td>' + (z.pf === Infinity ? "n/a" : q.f2(z.pf)) + '</td><td class="' + (z.net >= 0 ? "gain" : "loss") + '">' + q.sgn(z.net) + '</td><td>' + q.rr(z.sumR) + '</td><td>' + q.rr(z.exp) + '</td></tr>'; }).join("") + '</tbody></table></div>';
    if (r.cur.length || (q.S.sim.c.length)) h += '<h3 class="bt-h">Your current chart <small>trades are marked with SIGNAL, entry, stop and target. Edit candles on the simulator tab.</small></h3><div id="bt-chart" class="bt-chart" style="pointer-events:none"></div>';
    if (!r.all.length) h += '<p class="hint">No trades. Check the drop-out line above to see which rule is stopping them.</p>';
    else h += '<div class="bt-tw"><table class="bt-t"><thead><tr><th>Chart</th><th>Side</th><th>Signal bar</th><th>Entry bar</th><th>Entry</th><th>Exit</th><th>Shares</th><th>P/L</th><th>R</th><th>How it ended</th></tr></thead><tbody>' + r.all.slice(0, 150).map(function (t) { return '<tr><td>' + esc(t.scene) + '</td><td>' + (t.dir > 0 ? "Long" : "Short") + '</td><td>' + (t.si + 1) + '</td><td>' + (t.ei + 1) + '</td><td>' + q.f2(t.entry) + '</td><td>' + (t.open ? "-" : q.f2(t.exit)) + '</td><td>' + t.shares + '</td><td class="' + (t.pnl >= 0 ? "gain" : "loss") + '">' + q.sgn(t.pnl) + '</td><td>' + q.rr(t.R) + '</td><td>' + esc(t.why) + (t.parts.length ? " (" + t.parts.join(", ") + " filled)" : "") + '</td></tr>'; }).join("") + '</tbody></table></div>';
    return h;
  }
  function codeBox(s) {
    if (!B.code) return '';
    return '<div class="bt-bar"><button type="button" class="bt-b on" data-bt-act="copycode">Copy code</button><button type="button" class="bt-b" data-bt-act="dlcode">Download bot.py</button><button type="button" class="bt-b" data-bt-act="dlcandles">Download current chart as candles.csv</button></div><pre class="bt-code">' + esc(B.code) + '</pre>';
  }
  function secReview(s, n) {
    var q = ex(), S = q.S, sent = E.sentence(s);
    var h = '<div class="bt-note"><b>Your strategy in plain English</b><ol class="bb-ol">' + sent.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join("") + '</ol></div>';
    if (!s.trig.conds.length) h += '<div class="bt-note" style="border-left-color:var(--loss)">No signal rules yet, so every candle counts as a signal. Add rules in the Signal step.</div>';
    h += '<div class="bt-bar"><span class="bt-hint">Tests run on: <b>' + (S.sim.c.length ? "your current chart (" + S.sim.c.length + " candles)" : "no current chart") + '</b>, <b>' + S.scenes.length + '</b> saved ' + (S.scenes.length === 1 ? "scene" : "scenes") + '</span><label>and <select data-bpr="1">' + [0, 10, 20, 50, 100].map(function (v) { return '<option value="' + v + '"' + (B.practice === v ? " selected" : "") + '>' + (v ? v + " random practice days" : "no practice days") + '</option>'; }).join("") + '</select></label></div>';
    h += '<div class="bt-note"><b>Pull from Schwab</b> <span class="bt-hint">1-minute candles, turned into the chart size you pick. Needs Schwab connected in Settings (same connection as Studio).</span><div class="bt-bar"><input id="bb-sym" placeholder="Ticker (GOOGL)" value="' + esc(B.pull.sym) + '" style="width:130px;text-transform:uppercase"><label>From <input id="bb-d1" type="date" value="' + esc(B.pull.d1) + '"></label><label>To (optional) <input id="bb-d2" type="date" value="' + esc(B.pull.d2) + '"></label><label>Chart size <select id="bb-tf">' + [["1", "1 minute"], ["2", "2 minute"], ["5", "5 minute"]].map(function (o) { return '<option value="' + o[0] + '"' + (B.pull.tf === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select></label><button type="button" class="bt-b on" data-bt-act="schwab">Pull candles</button></div><div id="bb-smsg" class="bt-hint">' + esc(B.msg) + '</div></div>' + (S.scenes.length ? '<div class="bt-note"><b>Your saved charts (' + S.scenes.length + ')</b> <span class="bt-hint">Saved in this browser. Every test runs on all of them.</span><div class="bt-sc" style="margin-top:6px">' + S.scenes.map(function (x, i) { return '<span class="bt-chip"><span style="padding:4px 8px;font-size:.78rem;font-weight:700">' + esc(x.name) + ' <small>' + x.c.length + ' candles, ' + (x.tf || 2) + ' min' + (x.gap != null ? ', gap ' + x.gap + '%' : "") + '</small></span><button type="button" data-bt-act="delscene" data-i="' + i + '" title="Delete this chart">&times;</button></span>'; }).join("") + '</div></div>' : '<div class="bt-note" style="border-left-color:var(--mute)">No saved charts yet. Pull one from Schwab or paste candles below.</div>');
    h += '<details class="bt-add"' + (B.imp || !S.scenes.length ? " open" : "") + '><summary>Add real charts (paste candles or upload a CSV, one day or many days)</summary><div class="bb-imp"><p class="bb-tip"><b>Many days at once is fine.</b> Put one candle per line: <b>date and time, open, high, low, close, volume</b>. Examples that work:<br><code>2026-10-01 09:30,4.52,4.60,4.48,4.55,120000</code><br><code>2026-10-01,09:30,4.52,4.60,4.48,4.55,120000</code><br><code>10/1/2026 9:30,4.52,4.60,4.48,4.55,120000</code><br>Each date becomes its own chart, and each day\'s "yesterday close" is the day before\'s last close. If your data has no dates, a new day starts whenever the time jumps back (like 15:59 to 09:30). Only 9:30am to 4:00pm candles are kept. Most brokers and TradingView can export a CSV like this, then open it in Notepad, copy everything, and paste it below, or use the upload button.</p><div class="bt-bar"><label>Upload a CSV file <input type="file" id="bb-file" accept=".csv,.txt,text/csv,text/plain"></label></div><textarea id="bb-csv" rows="6" placeholder="2026-10-01 09:30,4.52,4.60,4.48,4.55,120000&#10;2026-10-01 09:32,4.55,4.58,4.50,4.51,80000&#10;..."></textarea><div class="bt-bar"><input id="bb-csvn" placeholder="Name (e.g. XYZ)" style="width:200px"><label>Yesterday\'s close before the first day $ (optional)<input id="bb-csvpc" inputmode="decimal" style="width:80px"></label><button type="button" class="bt-b on" data-bt-act="import">Add charts</button>' + (S.scenes.length ? '<button type="button" class="bt-b" data-bt-act="clearscenes">Delete all ' + S.scenes.length + ' saved scenes</button>' : "") + '</div></div></details>';
    h += '<div class="bt-bar"><button type="button" class="bt-b on" data-bt-act="run">Run test</button><button type="button" class="bt-b" data-bt-act="code">Build bot code</button><span class="bt-hint">Run test also compares all your saved strategies.</span></div>' + '<div id="bb-results">' + resHtml(s) + '</div>' + codeBox(s);
    return card("review", n, "Review and test", "Check the plan, run it on your charts, then turn it into bot code.", h);
  }
  var SECS = { basics: secBasics, marker: secMarker, signal: secSignal, entry: secEntry, stop: secStop, targets: secTargets, limits: secLimits, review: secReview };

  /* ---------- page ---------- */
  function css() {
    return '<style>.bb-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.bb-top select,.bb-top input{font:inherit;font-size:.86rem;padding:7px 10px;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:9px}.bb-seg2{display:inline-flex;border:1px solid var(--line);border-radius:9px;overflow:hidden;vertical-align:middle}.bb-seg2 button{border:0;background:var(--panel);color:var(--ink);padding:7px 12px;font:inherit;font-weight:800;font-size:.8rem;cursor:pointer}.bb-seg2 button.on{background:var(--ink);color:var(--bg)}' +
      '.bb-steps{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.bb-steps button{border:1px solid var(--line);background:var(--panel);color:var(--ink);padding:7px 12px;border-radius:999px;font:inherit;font-weight:800;font-size:.78rem;cursor:pointer}.bb-steps button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}.bb-steps button.done{border-color:var(--gain)}' +
      '.bb-sec{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin:12px 0}.bb-sh{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px}.bb-sh h3{margin:0;font-size:1.05rem}.bb-sh p{margin:2px 0 0;font-size:.84rem;color:var(--mute)}.bb-no{background:var(--ink);color:var(--bg);width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.82rem;flex:none}.bb-h4{margin:16px 0 6px;font-size:.9rem}' +
      '.bb-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:8px 0}.bb-card2{display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;border:2px solid var(--line);background:var(--bg);color:var(--ink);border-radius:12px;padding:10px 12px;cursor:pointer;font:inherit}.bb-card2 b{font-size:.9rem}.bb-card2 small{color:var(--mute);font-size:.76rem;line-height:1.35}.bb-card2.on{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}.bb-card2:hover{border-color:var(--mute)}.bb-pic{display:block}.bb-pic svg{display:block;background:var(--panel);border-radius:8px;margin-bottom:4px}' +
      '.bb-row,.bb-rules{display:flex;flex-wrap:wrap;gap:12px 18px;margin:10px 0;align-items:flex-end}.bb-row label,.bb-rules>label{display:flex;flex-direction:column;gap:4px;font-size:.78rem;font-weight:700;color:var(--mute);max-width:260px}.bb-rules .bb-ck{flex-direction:row;color:var(--ink);align-items:center;max-width:none}.bb-ck{display:flex;gap:7px;align-items:center;font-size:.84rem;font-weight:700}.bb-sec select{width:auto!important;max-width:100%}.bb-cond select{max-width:260px}.bb-sec input.bb-n,.bb-sec input.bb-t,.bb-sec select{font:inherit;font-size:.86rem;padding:7px 9px;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:8px}.bb-sec input.bb-t{width:280px;max-width:100%}' +
      '.bb-sec .bb-ck{display:inline-flex!important;flex-direction:row!important;width:auto!important;max-width:none!important;gap:8px;align-items:center;color:var(--ink)!important}.bb-sec .bb-ck input{width:auto!important;margin:0;flex:none}.bb-sec .bb-ck span{white-space:normal}.bb-conds{margin:6px 0}.bb-cond{display:flex;flex-wrap:wrap;gap:7px;align-items:center;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin:6px 0;font-size:.84rem}.bb-ix{background:var(--line);color:var(--ink);border-radius:6px;font-weight:900;font-size:.72rem;min-width:22px;text-align:center;padding:3px 5px}.bb-x{margin-left:auto;border:0;background:transparent;color:var(--mute);font-size:1.3rem;line-height:1;cursor:pointer}.bb-x:hover{color:var(--loss)}.bb-empty{border:2px dashed var(--line);border-radius:10px;padding:12px;font-size:.84rem;color:var(--mute)}.bb-mode{margin:4px 0 6px;font-size:.84rem;font-weight:700}.bb-add{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0}.bb-add>span{font-size:.76rem;font-weight:800;color:var(--mute);margin-right:2px}.bb-chip{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:999px;padding:5px 11px;font:inherit;font-size:.76rem;font-weight:700;cursor:pointer}.bb-chip:hover{border-color:var(--ink)}.bb-chip.alt{border-style:dashed}' +
      '.bb-tip{font-size:.8rem;color:var(--mute);line-height:1.5;margin:6px 0}.bb-nav{display:flex;justify-content:space-between;gap:10px;margin:14px 0}.bb-lnk{border:0;background:none;color:var(--ink);font:inherit;font-weight:800;text-decoration:underline;cursor:pointer;padding:0}.bb-ol{margin:6px 0 0;padding-left:20px}.bb-ol li{margin:3px 0}.bb-ul{margin:4px 0;padding-left:20px;font-size:.84rem}' +
      '.bb-fun{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0}.bb-fs{background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:6px 12px;text-align:center;min-width:90px}.bb-fs b{display:block;font-size:1.05rem}.bb-fs small{color:var(--mute);font-size:.7rem}.bb-ar{color:var(--mute)}.bb-imp textarea{width:100%;box-sizing:border-box;font:12px/1.4 ui-monospace,Consolas,monospace;padding:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:8px}.bt-t tr.on td{background:var(--bg)}' +
      '.bb-tpl{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:12px 0}.bb-tpl .bb-card2{padding:14px}.bb-tpl .bb-card2 small{font-size:.8rem}</style>';
  }
  function tplHtml() {
    var h = '<div class="bb-sec"><div class="bb-sh"><span class="bb-no">+</span><div><h3>Start a new strategy</h3><p>Pick a starting point. You can change every rule afterwards.</p></div></div><div class="bb-tpl">' +
      E.TEMPLATES.map(function (t) { return '<button type="button" class="bb-card2" data-bt-act="tpl" data-k="' + t.key + '"><span class="bb-pic">' + PICS[t.pic] + '</span><b>' + t.name + '</b><small>' + t.text + '</small></button>'; }).join("") + '</div>' +
      '<p class="bb-tip">Your <b>SL-1-RV</b> strategy stays on the "Simulator (SL-1-RV)" tab with all its original options. Strategies you build here are separate, saved by name, and can be compared side by side.</p>' + (B.strats.length ? '<button type="button" class="bt-b" data-bt-act="cancelTpl">Cancel</button>' : "") + '</div>';
    return h;
  }
  function html() {
    var q = ex(); if (!q) return ""; q.S.edit = "";
    var h = css();
    if (B.tpl) return h + tplHtml();
    var s = cur(); if (!s) { B.tpl = true; return h + tplHtml(); }
    h += '<div class="bb-top"><select data-bsel="1" title="Your strategies">' + B.strats.map(function (t) { return '<option value="' + t.id + '"' + (t.id === s.id ? " selected" : "") + '>' + esc(t.name) + ' (' + t.side + ')</option>'; }).join("") + '</select><button type="button" class="bt-b" data-bt-act="new">+ New strategy</button><button type="button" class="bt-b" data-bt-act="dup">Duplicate</button><button type="button" class="bt-b" data-bt-act="del">Delete</button><span class="bt-sp" style="flex:1"></span><span class="bb-seg2"><button type="button" data-bset="@mode" data-bval="wizard" class="' + (B.mode === "wizard" ? "on" : "") + '">Step by step</button><button type="button" data-bset="@mode" data-bval="blocks" class="' + (B.mode === "blocks" ? "on" : "") + '">All at once</button></span></div>';
    if (B.mode === "wizard") {
      h += '<div class="bb-steps">' + STEPS.map(function (t, i) { return '<button type="button" data-bt-act="goto" data-i="' + i + '" class="' + (i === B.step ? "on" : i < B.step ? "done" : "") + '">' + (i + 1) + '. ' + t[1] + '</button>'; }).join("") + '</div>';
      h += SECS[STEPS[B.step][0]](s, B.step + 1);
      h += '<div class="bb-nav"><button type="button" class="bt-b"' + (B.step ? "" : " disabled") + ' data-bt-act="step" data-d="-1">&larr; Back</button>' + (B.step < STEPS.length - 1 ? '<button type="button" class="bt-b on" data-bt-act="step" data-d="1">Next: ' + STEPS[B.step + 1][1] + ' &rarr;</button>' : '<span></span>') + '</div>';
    } else h += STEPS.map(function (t, i) { return SECS[t[0]](s, i + 1); }).join("");
    return h;
  }

  /* ---------- events ---------- */
  function rerender() { var q = ex(); stale(); save(); q.render(); }
  function act(a, b) {
    var q = ex(), s = cur(), sec, list;
    if (a === "new") { B.tpl = true; q.render(); return; }
    if (a === "cancelTpl") { B.tpl = false; q.render(); return; }
    if (a === "tpl") { var t = E.TEMPLATES.filter(function (x) { return x.key === b.getAttribute("data-k"); })[0], ns = norm(t.make()); B.strats.push(ns); B.cur = ns.id; B.tpl = false; B.step = 0; stale(); save(); q.render(); window.scrollTo(0, 0); return; }
    if (!s) return;
    if (a === "dup") { var d = norm(clone(s)); d.id = E.blank().id; d.name = s.name + " copy"; B.strats.push(d); B.cur = d.id; rerender(); return; }
    if (a === "del") { if (!window.confirm('Delete "' + s.name + '"?')) return; B.strats = B.strats.filter(function (x) { return x.id !== s.id; }); B.cur = B.strats.length ? B.strats[0].id : null; if (!B.strats.length) B.tpl = true; rerender(); return; }
    if (a === "goto") { B.step = +b.getAttribute("data-i"); save(); q.render(); window.scrollTo(0, 0); return; }
    if (a === "step") { B.step = Math.max(0, Math.min(STEPS.length - 1, B.step + +b.getAttribute("data-d"))); save(); q.render(); window.scrollTo(0, 0); return; }
    if (a === "pickstrat") { B.cur = b.getAttribute("data-id"); B.res = null; q.S.cres = null; save(); q.render(); return; }
    sec = b.getAttribute("data-sec"); list = sec === "anchor" ? s.anchor.conds : sec === "exit" ? s.exit.conds : s.trig.conds;
    if (a === "chip") { list.push(clone(CHIPS[+b.getAttribute("data-k")][1])); rerender(); return; }
    if (a === "add") { var kd = b.getAttribute("data-kind"); list.push(kd === "is" ? E.IZ("doji") : kd === "run" ? { t: "run", color: "red", n: 2 } : E.C("close", "<", "vwap")); rerender(); return; }
    if (a === "rm") { list.splice(+b.getAttribute("data-i"), 1); rerender(); return; }
    if (a === "addt") { s.targets.push({ kind: "r", v: s.targets.length + 1, pct: s.targets.length ? 25 : 100 }); rerender(); return; }
    if (a === "rmt") { s.targets.splice(+b.getAttribute("data-i"), 1); rerender(); return; }
    if (a === "run") { runTest(); return; }
    if (a === "code") { if (!B.res || B.res.id !== s.id) { var lst = charts(); if (lst.length) { B.res = runOne(s, lst); B.res.id = s.id; q.S.cres = { cust: true, cur: B.res.cur }; } } var r = B.res && B.res.id === s.id ? B.res : null; B.code = E.pythonCode(s, { pc: q.S.sim.pc, tf: q.S.sim.tf || 2, result: r ? "Backtest in the Lab: " + r.sum.n + " trades, " + pct(r.sum.wr) + " wins, net " + q.sgn(r.sum.net) + " (" + q.rr(r.sum.sumR) + ")." : "" }); q.render(); return; }
    if (a === "copycode") { try { navigator.clipboard.writeText(B.code).then(function () { q.toast("Code copied"); }, function () { q.toast("Could not copy"); }); } catch (e) { q.toast("Could not copy"); } return; }
    if (a === "dlcode") { q.download("bot.py", B.code, "text/x-python"); return; }
    if (a === "dlcandles") { q.download("candles.csv", q.exportCandles(), "text/csv"); return; }
    if (a === "import") {
      var scs = parseCsv(root.querySelector("#bb-csv").value, (root.querySelector("#bb-csvn").value || "").trim(), parseFloat(root.querySelector("#bb-csvpc").value));
      if (!scs) { q.toast("Could not read those candles. Each line needs time, open, high, low, close, volume."); return; }
      scs.forEach(function (sc) { q.S.scenes.push(sc); }); q.save(); B.imp = false; stale(); q.toast(scs.length + (scs.length === 1 ? " chart" : " charts") + " added as scenes"); q.render();
    }
    if (a === "schwab") {
      var sym = (root.querySelector("#bb-sym").value || "").trim().toUpperCase(), d1 = root.querySelector("#bb-d1").value, d2 = root.querySelector("#bb-d2").value || d1, tf = +root.querySelector("#bb-tf").value || 2, msg = root.querySelector("#bb-smsg"), SB = window.StockBT || {};
      if (!sym || !d1) { msg.textContent = "Type a ticker and a date first."; return; }
      if (!SB.schwabCandles) { msg.textContent = "Schwab is not available here."; return; }
      B.pull = { sym: sym, d1: d1, d2: root.querySelector("#bb-d2").value, tf: String(tf) }; B.msg = "Pulling from Schwab..."; msg.textContent = B.msg; b.disabled = true;
      SB.schwabStatus().then(function (st) {
        if (!st || !st.configured) throw new Error("Schwab is not set up yet. See Settings.");
        if (!st.connected) throw new Error("Connect Schwab in Settings first.");
        return SB.schwabCandles({ symbol: sym, from: d1, to: d2 });
      }).then(function (r) {
        if (r.reconnect) throw new Error("Your Schwab sign-in expired. Reconnect in Settings.");
        if (r.noMarket) throw new Error("Schwab did not return candles (status " + r.status + "). Your Schwab app may need the Market Data product, or that date is too far back.");
        if (!r.days || !r.days.length) throw new Error("No candles found for " + sym + " on those dates (weekend, holiday, or too far back).");
        r.days.forEach(function (d) { q.S.scenes.push(aggDay(sym, d, tf)); });
        q.save(); stale(); B.msg = "Added " + r.days.length + (r.days.length === 1 ? " day" : " days") + " of " + sym + " (" + r.days.map(function (d) { return d.day; }).join(", ") + "). Saved below. Now press Run test."; q.toast("Charts saved"); q.render();
      }).catch(function (e) { B.msg = e.message || "Could not pull candles."; msg.textContent = B.msg; }).then(function () { b.disabled = false; });
      return;
    }
    if (a === "delscene") { q.S.scenes.splice(+b.getAttribute("data-i"), 1); q.save(); stale(); q.render(); return; }
    if (a === "clearscenes") { if (window.confirm("Delete all " + q.S.scenes.length + " saved scenes?")) { q.S.scenes = []; q.save(); stale(); q.render(); } }
  }
  function bind(r) {
    if (r.__bb) return; r.__bb = 1; root = r;
    r.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-bset]");
      if (b) { var p = b.getAttribute("data-bset"), v = b.getAttribute("data-bval"), s = cur(); if (p === "@mode") { B.mode = v; save(); ex().render(); return; } if (!s) return; if (p === "anchor.on") v = v === "1"; if (p === "side") { s.side = v; if (s.stop.how === "anchor" && !s.anchor.on) s.stop.how = "candle"; } setP(s, p, v); if (p === "anchor.on" && !v && s.stop.how === "anchor") s.stop.how = "candle"; rerender(); return; }
      b = ev.target.closest && ev.target.closest("[data-bt-act]"); if (b) { ev.preventDefault(); act(b.getAttribute("data-bt-act"), b); }
    });
    r.addEventListener("change", function (ev) {
      var t = ev.target, s = cur(), p;
      if (t.getAttribute && t.getAttribute("data-bsel")) { B.cur = t.value; B.res = null; ex().S.cres = null; save(); ex().render(); return; }
      if (t.getAttribute && t.getAttribute("data-bpr")) { B.practice = +t.value; B.res = null; save(); ex().render(); return; }
      if (t.id === "bb-file") { var fl = t.files && t.files[0]; if (fl) { var fr = new FileReader(); fr.onload = function () { var ta = root.querySelector("#bb-csv"); if (ta) ta.value = String(fr.result || ""); var nm = root.querySelector("#bb-csvn"); if (nm && !nm.value) nm.value = fl.name.replace(/\.[^.]+$/, ""); ex().toast("File loaded. Press Add charts."); }; fr.readAsText(fl); } return; }
      if (!s) return;
      if ((p = t.getAttribute("data-bp"))) {
        var ty = t.getAttribute("data-bty"), v = ty === "b" ? t.checked : ty === "n" ? parseFloat(t.value) : t.value;
        if (ty === "n") { if (isNaN(v) || v < 0) v = 0; t.value = v; } if (ty === "t") v = (v || "").trim() || "My strategy";
        if (p === "stop.v" && v <= 0) v = 1; if (p === "risk.dollars" && v <= 0) v = 50;
        setP(s, p, v); rerender(); return;
      }
      if ((p = t.getAttribute("data-bc"))) {
        var k = p.split("|"), list = k[0] === "anchor" ? s.anchor.conds : k[0] === "exit" ? s.exit.conds : s.trig.conds, c = list[+k[1]]; if (!c) return;
        if (k[2] === "not") c.not = t.value === "1"; else if (k[2] === "bsel") c.b = t.value === "__num" ? "0" : t.value; else if (k[2] === "bnum") { var nv = parseFloat(t.value); c.b = String(isNaN(nv) ? 0 : nv); } else if (k[2] === "n") c.n = Math.max(1, Math.min(10, parseInt(t.value, 10) || 1)); else c[k[2]] = t.value;
        rerender();
      }
    });
  }
  load();
  window.BTBuilder = { html: html, bind: bind, _B: B };
})();
