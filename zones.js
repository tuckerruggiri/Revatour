/* Zones page extras: compact styling, candle-part and time-frame rules, Fair Value Gaps (FVG) and Inverse FVG lessons,
   more drawn examples, and a practice trainer (unlimited generated drills + live candles you can mark up).
   Everything the page shows as "answers" in drills is computed by the same rules the lessons teach.
   Needs the page's znChart drawing helper, handed over with ZoneKit.init(znChart). */
(function () {
  "use strict";
  var CSS = "#zonev h1{font-size:1.35rem;margin:0 0 4px}#zonev .pl-card{padding:12px 14px;margin:10px 0}#zonev .pl-card h2{font-size:1rem;margin:0 0 6px}#zonev .zn-p{font-size:.88rem;line-height:1.5;margin:0 0 8px}#zonev .zn-tb{font-size:.82rem}#zonev .zn-tb th,#zonev .zn-tb td{padding:6px 8px}#zonev .zn-h3{font-size:.9rem;margin:12px 0 4px}" +
    "#zonev .zn-p{max-width:none}#zonev .pl-card{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px;align-items:start}#zonev .pl-card>*{grid-column:1/-1;min-width:0}#zonev .pl-card>.zn-fig{grid-column:auto;height:100%;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center}#zonev .pl-card>.zn-fig svg{width:100%;height:auto;max-height:340px}#zonev .pl-card>.zn-fig:only-of-type{grid-column:1/-1}#zonev .pl-card:has(>.zn-steps):has(>.zn-fig:only-of-type)>.zn-steps{grid-column:1;grid-row:2/span 3}#zonev .pl-card:has(>.zn-steps):has(>.zn-fig:only-of-type)>.zn-fig{grid-column:2;grid-row:2/span 3}#zonev .zn-steps{margin:0}#zonev #znegs{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}#zonev .zn-2{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}#zonev .zn-ck{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}@media(max-width:900px){#zonev .zn-2{display:block}}@media(max-width:900px){#zonev .pl-card{display:block}}" +
    "#zonev .zn-fig{margin:0;padding:8px}#zonev .zn-fig svg{max-height:300px}#zonev figcaption{font-size:.8rem;line-height:1.4;margin-top:4px}" +
    ".zk-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 12px;position:sticky;top:0;z-index:5;background:var(--bg);padding:6px 0}.zk-tabs button{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:7px 14px;font:700 .8rem 'Instrument Sans',sans-serif;cursor:pointer}.zk-tabs button.on{background:var(--ink);color:var(--panel);border-color:var(--ink)}" +
    ".zk-gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px}.zk-gal.w2{grid-template-columns:repeat(auto-fit,minmax(380px,1fr))}.zk-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}@media(max-width:900px){.zk-cols{grid-template-columns:minmax(0,1fr)}}" +
    ".zk-do{border-left:4px solid var(--gain);background:rgba(22,163,74,.07);border-radius:8px;padding:8px 12px;font-size:.86rem;line-height:1.5}.zk-dont{border-left:4px solid var(--loss);background:rgba(220,38,38,.07);border-radius:8px;padding:8px 12px;font-size:.86rem;line-height:1.5}.zk-do>b,.zk-dont>b{display:block;margin-bottom:2px}.zk-do ul,.zk-dont ul{margin:4px 0 0;padding-left:18px}" +
    ".zk-gl{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;font-size:.84rem}.zk-gl div{border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:var(--bg)}.zk-gl b{display:block}" +
    ".zk-pr{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:12px 14px}.zk-prh{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px}.zk-prh select,.zk-prh input{padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit;max-width:190px}.zk-prh button,.zk-btn{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:9px;padding:7px 12px;font:700 .8rem 'Instrument Sans',sans-serif;cursor:pointer}.zk-btn.p{background:var(--ink);color:var(--panel);border-color:var(--ink)}.zk-btn:disabled{opacity:.45;cursor:default}.zk-btn.on{background:var(--accent);color:var(--accent-ink,#fff);border-color:var(--accent)}" +
    ".zk-q{font-weight:800;font-size:.95rem;margin:2px 0 6px}.zk-sc{margin-left:auto;font-size:.8rem;color:var(--mute);font-weight:700}.zk-ch{border:1px solid var(--line);border-radius:12px;background:var(--bg);padding:4px}.zk-ch svg{display:block;width:100%;height:auto;cursor:crosshair;touch-action:none;user-select:none}.zk-fb{margin-top:8px;font-size:.86rem;line-height:1.5}.zk-fb .ok{color:var(--gain);font-weight:800}.zk-fb .no{color:var(--loss);font-weight:800}.zk-info{font-size:.78rem;color:var(--mute);min-height:1.2em;margin:4px 2px}.zk-lg{display:flex;gap:12px;flex-wrap:wrap;font-size:.76rem;color:var(--mute);margin:6px 2px}.zk-lg i{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-2px;margin-right:4px}" +
    ".zk-lt{width:100%;border-collapse:collapse;font-size:.8rem;margin-top:8px}.zk-lt th,.zk-lt td{text-align:left;padding:5px 8px;border-bottom:1px solid var(--line)}";
  if (!document.getElementById("zk-css")) { var st = document.createElement("style"); st.id = "zk-css"; st.textContent = CSS; document.head.appendChild(st); }
  var ZC = function () { return ""; };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
  function mir(C) { return C.map(function (c) { return [100 - c[0], 100 - c[2], 100 - c[1], 100 - c[3]]; }); }
  function fig(svg, cap) { return '<figure class="zn-fig">' + svg + '<figcaption>' + cap + '</figcaption></figure>'; }
  function mb(b) { return { a: 0, b: 0, top: 100 - b.bot, bot: 100 - b.top, k: b.k === "d" ? "s" : "d", a2: 0 }; }

  /* ---------- lesson: which part of the candle ---------- */
  function anatomyFig() {
    var W = 520, H = 250, s = '';
    function candle(x, up, hi, top, bot, lo, label) {
      var col = up ? "var(--gain)" : "var(--loss)";
      s += '<line x1="' + x + '" x2="' + x + '" y1="' + hi + '" y2="' + lo + '" stroke="' + col + '" stroke-width="3"/><rect x="' + (x - 22) + '" y="' + top + '" width="44" height="' + (bot - top) + '" rx="2" fill="' + col + '"/><text x="' + x + '" y="' + (H - 6) + '" text-anchor="middle" class="zn-m">' + label + '</text>';
    }
    candle(90, true, 30, 60, 170, 205, "Green candle (closed up)"); candle(330, false, 30, 60, 170, 205, "Red candle (closed down)");
    function lab(x, y, tx, t, anchor) { s += '<line x1="' + x + '" x2="' + tx + '" y1="' + y + '" y2="' + y + '" stroke="var(--muted)" stroke-dasharray="3 3"/><text x="' + (anchor === "e" ? tx - 4 : tx + 4) + '" y="' + (y + 4) + '" text-anchor="' + (anchor === "e" ? "end" : "start") + '" class="zn-t">' + t + '</text>'; }
    lab(90, 30, 150, "HIGH (top of upper wick)"); lab(112, 60, 150, "CLOSE (body top)"); lab(112, 170, 150, "OPEN (body bottom)"); lab(90, 205, 150, "LOW (tip of lower wick)");
    lab(330, 30, 390, "HIGH (top of upper wick)"); lab(352, 60, 390, "OPEN (body top)"); lab(352, 170, 390, "CLOSE (body bottom)"); lab(330, 205, 390, "LOW (tip of lower wick)");
    s += '<text x="22" y="120" class="zn-h" transform="rotate(-90 22 120)" text-anchor="middle">BODY = open to close</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Parts of a candle: wicks, body, open, close, high, low" style="cursor:default">' + s + '</svg>';
  }
  function partsHtml() {
    return '<div class="pl-card" id="znparts"><h2>Exactly what part of the candle to cover</h2><div class="zk-cols"><div>' + fig(anatomyFig(), '<b>Know the parts.</b> The <b>body</b> is open to close, where price settled. The <b>wicks</b> are quick spikes. Zones and gaps use different parts, so learn this picture first.') + '</div><div>' +
      '<table class="zn-tb"><thead><tr><th></th><th>Cover this</th><th>Do NOT cover</th></tr></thead><tbody>' +
      '<tr><td><span class="zn-pill d">DEMAND</span></td><td>Only the 1 to 3 small <b>base</b> candles. <b>Top = highest body edge</b> (open or close). <b>Bottom = lowest wick.</b></td><td>The big green candles that left the base. The drop before the base. The wick tip on the top edge.</td></tr>' +
      '<tr><td><span class="zn-pill s">SUPPLY</span></td><td>Only the base candles. <b>Top = highest wick.</b> <b>Bottom = lowest body edge.</b></td><td>The big red candles that left. The rally before the base. The wick tip on the bottom edge.</td></tr>' +
      '<tr><td><span class="zn-pill d">BULLISH FVG</span></td><td>The empty space only. <b>Bottom = candle 1 HIGH</b> (wick tip). <b>Top = candle 3 LOW</b> (wick tip).</td><td>The big middle candle. The bodies of candles 1 and 3.</td></tr>' +
      '<tr><td><span class="zn-pill s">BEARISH FVG</span></td><td>The empty space only. <b>Top = candle 1 LOW.</b> <b>Bottom = candle 3 HIGH.</b></td><td>The big middle candle. The bodies of candles 1 and 3.</td></tr>' +
      '<tr><td><span class="zn-pill d">IFVG</span></td><td>The <b>same box</b> as the FVG that failed. It starts at the candle that closed through it.</td><td>Do not redraw a new box. Do not start it before the candle closed through.</td></tr>' +
      '</tbody></table><p class="zn-p" style="margin-top:8px"><b>Pattern to remember:</b> zones use <b>bodies on the near edge, wicks on the far edge</b>. Gaps use <b>wick tips on both edges</b>.</p></div></div></div>';
  }
  function tfHtml() {
    return '<div class="pl-card" id="zntf"><h2>Which time frames to use, and which to avoid</h2><div class="zk-cols"><div>' +
      '<table class="zn-tb"><thead><tr><th>Job</th><th>Zones</th><th>FVG / IFVG</th></tr></thead><tbody>' +
      '<tr><td><b>Find the ones that matter</b></td><td>Weekly, Daily, 60-min</td><td>Daily and 60-min (swing trades)</td></tr>' +
      '<tr><td><b>Trade day to day</b></td><td>60-min and 15-min</td><td>5-min, 15-min and 60-min</td></tr>' +
      '<tr><td><b>Tighten before entry</b></td><td>15-min, 5-min</td><td>5-min</td></tr>' +
      '<tr><td><b>Trigger only</b></td><td>2-min, 1-min</td><td>1 or 2-min only to time an entry <i>inside</i> a bigger FVG or zone</td></tr>' +
      '</tbody></table><p class="zn-p" style="margin-top:8px">Always go <b>big to small</b>: mark the Daily and 60-min first, then zoom in. A zone or gap on a bigger chart has more orders behind it.</p></div><div style="display:grid;gap:8px">' +
      '<div class="zk-do"><b>Do</b><ul><li>Start on Daily or 60-min before you ever open the 2-min chart.</li><li>Keep 2 or 3 zones above and 2 or 3 below price. More than that is clutter.</li><li>Use the same box rules on every chart.</li><li>Prefer a gap that sits inside or touches a bigger zone.</li></ul></div>' +
      '<div class="zk-dont"><b>Do not</b><ul><li>Draw zones or gaps first on the 1-min or 2-min chart. They appear and vanish in minutes and most are noise.</li><li>Trust gaps formed on thin premarket or after-hours candles without checking them after the open.</li><li>Mark tiny gaps (smaller than about a third of a normal candle). Skip them.</li><li>Use a weekly gap for a day trade, or a 1-min gap for a swing trade. Match the time frame to how long you hold.</li><li>Mark zones on illiquid stocks with random, jumpy candles.</li></ul></div></div></div></div>';
  }

  /* ---------- lesson: FVG and IFVG ---------- */
  var F1 = [[58, 59, 54, 55], [55, 56, 51, 52], [52, 53, 48, 49], [49, 50, 45, 46], [46, 47, 44, 46.5], [46.5, 58, 46, 57], [57, 62, 54, 61]];
  var T_A = [[61, 63, 58, 59], [59, 60, 55, 56], [56, 57, 53.8, 55.5], [55.5, 63, 55, 62], [62, 68, 61.5, 67]];
  var T_B = [[61, 63, 56, 57], [57, 58, 52, 53], [53, 54, 49.5, 50.8], [50.8, 59, 50.5, 58], [58, 65, 57.5, 64]];
  var T_C = [[61, 62, 55, 56], [56, 57, 49, 50], [50, 51, 43, 44], [44, 46, 41, 42], [42, 44, 40, 41]];
  var G1 = F1.concat(T_A), G2 = F1.concat(T_B), G3 = F1.concat(T_C);
  function fvgChart(C, boxes, alt, notes, lines) { return ZC(C, { w: 640, h: 300, T: 40, B: 40, alt: alt, boxes: boxes, notes: notes || [], lines: lines || [] }); }
  function recipeFigs() {
    var C = F1.slice(0, 7);
    var bull = ZC(C, { w: 640, h: 300, T: 40, B: 40, alt: "Bullish fair value gap: the space between candle 1 high and candle 3 low", boxes: [{ a: 5, b: 6, top: 54, bot: 47, k: "d", t: "FVG" }],
      notes: [{ i: 4, y: 44, t: "1", dx: 0, dy: 14 }, { i: 5, y: 46, t: "2 (big)", dx: 0, dy: 16 }, { i: 6, y: 54, t: "3", dx: 0, dy: -12 }] });
    var D = mir(C), bear = ZC(D, { w: 640, h: 300, T: 40, B: 40, alt: "Bearish fair value gap", boxes: [{ a: 5, b: 6, top: 53, bot: 46, k: "s", t: "FVG" }],
      notes: [{ i: 4, y: 56, t: "1", dx: 0, dy: -12 }, { i: 5, y: 54, t: "2 (big)", dx: 0, dy: -14 }, { i: 6, y: 46, t: "3", dx: 0, dy: 14 }] });
    return fig(bull, '<b>Bullish FVG.</b> Three candles. The big green middle candle moves so fast that candle 1\'s high and candle 3\'s low do not touch. The empty space between them is the gap. Look for longs when price comes back.') + fig(bear, '<b>Bearish FVG.</b> The mirror. A big red middle candle leaves a gap between candle 1\'s low and candle 3\'s high. Look for shorts when price comes back up into it.');
  }
  function outcomeFigs() {
    var a = fvgChart(G1, [{ a: 5, b: G1.length - 1, top: 54, bot: 47, k: "d", t: "FVG HELD" }], "Price returns to the top edge of the gap and bounces");
    var b = fvgChart(G2, [{ a: 5, b: G2.length - 1, top: 54, bot: 47, k: "d", t: "50% BOUNCE" }], "Price dips to the middle of the gap and bounces", [], [{ y: 50.5, c: "var(--accent)", dash: "2 3", t: "50% line" }]);
    var c = fvgChart(G3, [{ a: 5, b: 9, top: 54, bot: 47, k: "d", t: "FVG" }, { a: 9, b: G3.length - 1, top: 54, bot: 47, k: "s", t: "IFVG" }], "A candle closes below the gap, so it fails and flips", [{ i: 9, y: 44, t: "Closes below", dx: 0, dy: 20 }]);
    return '<div class="zk-gal">' + fig(a, '<b>1. Bounce at the edge.</b> Price comes back, touches the top edge, and the gap holds. Strongest outcome.') + fig(b, '<b>2. Bounce at 50%.</b> Price fills half the gap before turning. The middle (some call it the 50% level) is a common reaction spot. Many traders use it as the "last chance" line.') + fig(c, '<b>3. Close through = failed.</b> A candle <b>closes</b> below the bottom edge. A wick through does not count. The gap failed, and the same box now acts as resistance. That is an inverse FVG.') + '</div>';
  }
  function ifvgFigs() {
    var up = [[58, 59, 54, 55], [55, 56, 51, 52], [52, 53, 48, 49], [49, 50, 45, 46], [46, 47, 44, 46.5], [46.5, 58, 46, 57], [57, 62, 54, 61], [61, 63, 59, 60], [60, 60.5, 50, 51], [51, 51.5, 41, 42], [42, 45, 39, 40], [40, 46.5, 39.5, 45.5], [45.5, 52, 45, 51], [51, 53.5, 48, 49], [49, 50, 42, 43], [43, 44, 37, 38]];
    var s = ZC(up, { w: 700, h: 320, T: 40, B: 40, alt: "Bearish inverse fair value gap: a failed bullish gap that turns into resistance", boxes: [{ a: 5, b: 9, top: 54, bot: 47, k: "d", t: "FVG" }, { a: 9, b: up.length - 1, top: 54, bot: 47, k: "s", t: "IFVG" }],
      notes: [{ i: 6, y: 62, t: "1", dx: 0, dy: -14 }, { i: 9, y: 42, t: "2", dx: 0, dy: 16 }, { i: 12, y: 52, t: "3", dx: 0, dy: -26 }, { i: 13, y: 53.5, t: "4", dx: 0, dy: -26 }] });
    var m = mir(up), dn = ZC(m, { w: 700, h: 320, T: 40, B: 40, alt: "Bullish inverse fair value gap: a failed bearish gap that turns into support", boxes: [{ a: 5, b: 9, top: 53, bot: 46, k: "s", t: "FVG" }, { a: 9, b: m.length - 1, top: 53, bot: 46, k: "d", t: "IFVG" }],
      notes: [{ i: 6, y: 38, t: "1", dx: 0, dy: 16 }, { i: 9, y: 58, t: "2", dx: 0, dy: -16 }, { i: 12, y: 48, t: "3", dx: 0, dy: 26 }, { i: 13, y: 46.5, t: "4", dx: 0, dy: 26 }] });
    return '<div class="zk-gal w2">' + fig(s, '<b>Bearish IFVG.</b> <b>1</b> A bullish gap forms. <b>2</b> A candle closes <b>below</b> it, so the gap failed and the box flips into resistance. <b>3, 4</b> Price bounces back up into the box and gets rejected. Look for sellers there. The old support became the new ceiling.') + fig(dn, '<b>Bullish IFVG.</b> The mirror. <b>1</b> A bearish gap forms. <b>2</b> A candle closes <b>above</b> it, so it failed and the box flips into support. <b>3, 4</b> Price drops back into the box and holds. Look for buyers there.') + '</div>';
  }
  function fvgHtml() {
    return '<div class="pl-card" id="znfvg"><h2>Fair Value Gaps (FVG)</h2><p class="zn-p"><b>What it is:</b> a fast move that skips price levels. Price jumped so quickly that there is an empty space on the chart where little trading happened. Many traders expect price to come back and "fill" that space, then react. A <b>zone</b> comes from a pause (the base). A <b>gap</b> comes from the speed of one big candle. Both mark areas where orders may be waiting.</p>' +
      '<div class="zk-gal w2">' + recipeFigs() + '</div>' +
      '<h3 class="zn-h3">How to find one, in 3 steps</h3><ol class="zn-p"><li>Find a <b>big candle</b> with a long body (candle 2).</li><li>Look at the candle just before it (1) and just after it (3).</li><li>Bullish: is candle 3\'s <b>low higher</b> than candle 1\'s <b>high</b>? Bearish: is candle 3\'s <b>high lower</b> than candle 1\'s <b>low</b>? If yes, the space between is the gap. If the wicks overlap, there is no gap.</li></ol>' +
      '<h3 class="zn-h3">What price can do when it comes back</h3>' + outcomeFigs() +
      '<div id="znifvg"><h3 class="zn-h3">Inverse fair value gap (IFVG)</h3><p class="zn-p">An IFVG is a gap that <b>failed and flipped</b>. When a candle <b>closes</b> through a gap, it no longer acts like support or resistance in its old direction. It often acts as the opposite. Same box, new job.</p>' + ifvgFigs() + '</div>' +
      '<div class="zk-cols" style="margin-top:10px"><div class="zk-do"><b>A stronger gap has</b><ul><li>A big, fast middle candle (a clear push, with strong volume if you can see it).</li><li>A gap bigger than about a third of a normal candle.</li><li><b>Fresh</b>: price has not come back yet.</li><li>Matches the bigger trend (bullish gap in an uptrend).</li><li>Sits inside or against a higher time frame zone.</li></ul></div><div class="zk-dont"><b>A weaker gap has</b><ul><li>A tiny gap or a weak middle candle.</li><li>Already filled or tested several times.</li><li>Goes against the bigger trend.</li><li>Formed on thin premarket candles or a 1-min chart only.</li><li>Sits in the middle of nowhere with no zone or level near it.</li></ul></div></div>' +
      '<h3 class="zn-h3">A simple way to use it</h3><ol class="zn-p"><li>Mark the Daily or 60-min zones first.</li><li>On the 5 or 15-min chart, find a gap near one of them.</li><li>Wait for price to <b>come back</b> into the gap. Do not chase the first move.</li><li>Drop to the 2-min or 1-min chart and wait for your own trigger candle.</li><li>Put the stop just beyond the far edge of the gap. If a candle <b>closes through</b> it, the idea failed (and an IFVG may now be in play).</li></ol>' +
      '<p class="zn-p"><b>Zone vs FVG.</b> A zone is found from the <i>base</i> (the pause). A FVG is found from the <i>gap</i> (the speed). When one sits on top of the other, it is the best of both: two reasons for orders to be there.</p></div>';
  }

  /* ---------- more drawn examples ---------- */
  function moreEgs() {
    var out = [];
    var conf = [[58, 59, 54, 55], [55, 56, 51, 52], [52, 53, 48, 49], [49, 50, 46, 47], [47, 48, 45, 46.5], [46.5, 47.5, 45.5, 46.8], [46.8, 58, 46.5, 57], [57, 62, 55, 61], [61, 62, 57, 58], [58, 59, 53, 54], [54, 55, 49, 50], [50, 51, 46, 47.5], [47.5, 56, 47, 55], [55, 63, 54.5, 62]];
    out.push(fig(ZC(conf, { w: 640, h: 300, T: 40, B: 40, alt: "Demand zone with a fair value gap above it", boxes: [{ a: 4, b: 13, top: 47, bot: 45, k: "d", t: "ZONE" }, { a: 6, b: 13, top: 55, bot: 47.5, k: "d", t: "FVG" }] }), '<b>A. Zone plus FVG.</b> The rally left a gap sitting right above the demand zone. Price had to push through the gap first, then the zone caught it. Two reasons to look for a long.'));
    out.push(fig(ZC(mir(conf), { w: 640, h: 300, T: 40, B: 40, alt: "Supply zone with a fair value gap below it", boxes: [{ a: 4, b: 13, top: 55, bot: 53, k: "s", t: "ZONE" }, { a: 6, b: 13, top: 52.5, bot: 45, k: "s", t: "FVG" }] }), '<b>B. Supply zone plus FVG.</b> The mirror. A bearish gap below the supply zone, and price bounced into both.'));
    var tiny = [[44, 46, 43, 45.5], [45.5, 48, 45, 47.5], [47.5, 50, 47, 49.5], [50, 51, 49, 50.5], [50.5, 53, 50.3, 52.7], [52.7, 54, 51.2, 53.5], [53.5, 54, 51, 51.8], [51.8, 52.5, 49, 49.6]];
    out.push(fig(ZC(tiny, { w: 640, h: 300, T: 40, B: 40, alt: "A tiny fair value gap to skip", boxes: [{ a: 4, b: 7, top: 51.2, bot: 51, k: "d", t: "TINY: SKIP" }] }), '<b>C. Skip: tiny gap.</b> The space between candle 1\'s high and candle 3\'s low is so small it is hard to even see. Price sliced right through it.'));
    out.push(fig(fvgChart(G3, [{ a: 5, b: G3.length - 1, top: 54, bot: 47, k: "d", t: "FAILED FVG" }], "A bullish gap inside a falling market that fails"), '<b>D. Against the trend.</b> A bullish gap formed during a larger fall, and the next candles closed right through it. Trade gaps with the bigger trend.'));
    var old = [[50, 51, 48, 49], [49, 50, 46, 47], [47, 48, 44, 45], [45, 46, 43.5, 45.4], [45.4, 46, 44.2, 44.8], [44.8, 52, 44.5, 51.5], [51.5, 58, 51, 57], [57, 58, 52, 53], [53, 54, 46, 47], [47, 53, 45.5, 52], [52, 54, 46, 47.5], [47.5, 55, 45.6, 54], [54, 56, 47, 48]];
    out.push(fig(ZC(old, { w: 640, h: 300, T: 40, B: 40, alt: "A demand zone tested several times and weakening", boxes: [{ a: 3, b: 12, top: 45.4, bot: 43.5, k: "d", t: "TESTED 3 TIMES" }], notes: [{ i: 8, y: 46, t: "Test 1", dx: 0, dy: 26 }, { i: 10, y: 46, t: "Test 2", dx: 0, dy: 26 }] }), '<b>E. Tested zones weaken.</b> The first return is the best. Each time price comes back, fewer orders are left. By the third test, many traders skip it.'));
    var brk = [[60, 61, 56, 57], [57, 58, 52, 53], [53, 54, 49, 50], [50, 51, 46, 46.5], [46.5, 47.5, 45.5, 47], [47, 56, 46.8, 55], [55, 62, 54.5, 61], [61, 62, 55, 56], [56, 57, 48, 49], [49, 50, 41, 42], [42, 43, 38, 39], [39, 44, 38.5, 43], [43, 46.5, 42.5, 45.5], [45.5, 47, 42, 43]];
    out.push(fig(ZC(brk, { w: 640, h: 300, T: 40, B: 40, alt: "A demand zone breaks and flips into supply", boxes: [{ a: 3, b: 9, top: 47, bot: 45.5, k: "d", t: "DEMAND" }, { a: 9, b: 13, top: 47, bot: 45.5, k: "s", t: "NOW SUPPLY" }], notes: [{ i: 9, y: 42, t: "Closes below", dx: 30, dy: 16, a: "start" }] }), '<b>F. Broken zone flips.</b> Once a candle closes below the zone, it fails. The same box becomes supply, and price bounced off it from below.'));
    var big = G1;
    out.push(fig(fvgChart(big, [{ a: 5, b: big.length - 1, top: 54, bot: 47, k: "d", t: "FVG" }], "Where to put a stop for a gap trade", [], [{ y: 46.6, c: "var(--loss)", dash: "4 3", t: "Stop just|below the gap" }, { y: 54.4, c: "var(--accent)", dash: "4 3", t: "Look for a|trigger here" }]), '<b>G. Stop for a gap trade.</b> Wait for price to return to the gap, look for your trigger near the top edge, and place the stop just below the bottom edge. A close below it means you were wrong.'));
    out.push(fig(fvgChart(mir(G1), [{ a: 5, b: G1.length - 1, top: 53, bot: 46, k: "s", t: "FVG" }], "A bearish gap that held"), '<b>H. Bearish gap that held.</b> Price rallied back into the gap, found sellers at the bottom edge, and fell again.'));
    return '<div class="pl-card" id="znmore"><h2>More examples: gaps, flips and weak setups</h2><div class="zk-gal">' + out.join("") + '</div></div>';
  }

  function moreHtml() {
    var G = [["Displacement", "The big, fast candle(s) that leave a base or create a gap. It is the proof of strength."], ["Base", "The small pause candles a zone is built from."], ["Imbalance / FVG", "A gap left by fast movement between candle 1 and candle 3."], ["Fill (mitigation)", "Price returning into a zone or gap."], ["50% level", "The middle of a gap or zone. A common reaction spot."], ["Inversion (IFVG)", "A gap that failed, closed through, and now works the other way."], ["Fresh / tested", "Fresh = never revisited. Tested = price already came back at least once."], ["Flip", "A broken zone that turns from support into resistance, or the reverse."], ["Confluence", "Two or more reasons at the same price: zone plus gap, a zone plus VWAP, a gap plus yesterday\'s high."]];
    return '<div class="pl-card" id="znalso"><h2>Everything else worth learning with zones</h2><div class="zk-cols"><div><ol class="zn-p"><li><b>Trend first.</b> Take demand zones and bullish gaps in uptrends, supply zones and bearish gaps in downtrends. Against the trend, they fail more often.</li><li><b>Fresh beats tested.</b> The first return is best. By the third, skip it.</li><li><b>Confluence.</b> A zone plus a gap, or a zone near VWAP, yesterday\'s high or low, or the premarket high or low, is stronger than any one alone.</li><li><b>Wait for a trigger.</b> A zone or gap is only a place to look. Wait for your own entry candle on the small chart (like your FP9-A or SL1 RV setups) before you act.</li><li><b>Stop and target.</b> The stop goes just past the far edge. The target is usually the next opposite zone or level. If the room to the target is less than twice your risk, many traders skip it.</li><li><b>Volume.</b> A strong departure with heavy volume says real money moved. A weak departure on light volume is less convincing.</li><li><b>News and earnings.</b> Big news can blow through any zone. Mark them, but respect the headline.</li><li><b>Keep a journal.</b> Save screenshots of zones that worked and failed in the My examples tab. Patterns show up after 20 or so.</li></ol></div><div><h3 class="zn-h3" style="margin-top:0">Words you will hear</h3><div class="zk-gl">' + G.map(function (g) { return '<div><b>' + g[0] + '</b>' + g[1] + '</div>'; }).join("") + '</div></div></div></div>';
  }

  /* ---------- plot engine for the practice charts ---------- */
  function plot(C, o) {
    var W = o.W || 980, H = o.H || 400, L = 10, R = 70, T = 14, B = o.tl ? 30 : 12, mn = 1e9, mx = -1e9;
    C.forEach(function (c) { mn = Math.min(mn, c[2]); mx = Math.max(mx, c[1]); });
    (o.hl || []).forEach(function (y) { mn = Math.min(mn, y); mx = Math.max(mx, y); });
    var pd = (mx - mn) * 0.08 || 1; mn -= pd; mx += pd;
    var n = Math.max(C.length, o.min || 0), sl = (W - L - R) / n, cw = Math.max(2, sl * 0.6);
    var Y = function (v) { return T + (1 - (v - mn) / (mx - mn)) * (H - T - B); }, X = function (i) { return L + sl * (i + 0.5); }, s = "";
    function nice(lo, hi, k) { var step = Math.pow(10, Math.floor(Math.log10((hi - lo) / k))), e = (hi - lo) / k / step; step *= e >= 7 ? 10 : e >= 3 ? 5 : e >= 1.5 ? 2 : 1; var a = []; for (var v = Math.ceil(lo / step) * step; v <= hi; v += step) a.push(v); return { a: a, step: step }; }
    var tk = nice(mn, mx, 6); tk.a.forEach(function (v) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--line)" stroke-dasharray="2 5"/><text x="' + (W - R + 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" class="zn-m">' + v.toFixed(tk.step < 1 ? 2 : 0) + '</text>'; });
    (o.tl || []).forEach(function (t) { s += '<text x="' + X(t[0]).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" class="zn-m">' + esc(t[1]) + '</text>'; });
    (o.boxes || []).forEach(function (b) {
      var x0 = X(b.a) - sl / 2, x1 = b.b >= C.length - 1 ? W - R : X(b.b) + sl / 2, col = b.k === "s" ? "220,38,38" : b.k === "u" ? "37,99,235" : "22,163,74", c2 = b.k === "s" ? "var(--loss)" : b.k === "u" ? "#2563eb" : "var(--gain)";
      s += '<rect x="' + x0.toFixed(1) + '" y="' + Y(b.top).toFixed(1) + '" width="' + Math.max(2, x1 - x0).toFixed(1) + '" height="' + Math.max(1, Y(b.bot) - Y(b.top)).toFixed(1) + '" fill="rgba(' + col + ',.17)" stroke="' + c2 + '" stroke-width="1.5" rx="2"' + (b.dash ? ' stroke-dasharray="5 4"' : '') + '/>';
      if (b.t) s += '<text x="' + (x0 + 4).toFixed(1) + '" y="' + (Y(b.top) - 4).toFixed(1) + '" class="zn-h" style="fill:' + c2 + ';font-size:11px">' + esc(b.t) + '</text>';
    });
    C.forEach(function (c, i) { var up = c[3] >= c[0], col = up ? "var(--gain)" : "var(--loss)", x = X(i); s += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + Y(c[1]).toFixed(1) + '" y2="' + Y(c[2]).toFixed(1) + '" stroke="' + col + '" stroke-width="1.5"/><rect x="' + (x - cw / 2).toFixed(1) + '" y="' + Y(Math.max(c[0], c[3])).toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + Math.max(1.5, Math.abs(Y(c[0]) - Y(c[3]))).toFixed(1) + '" fill="' + col + '"/>'; });
    (o.lines || []).forEach(function (l) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(l.y).toFixed(1) + '" y2="' + Y(l.y).toFixed(1) + '" stroke="' + (l.c || "#2563eb") + '" stroke-width="1.6" ' + (l.dash ? 'stroke-dasharray="' + l.dash + '"' : '') + '/><text x="' + (W - R + 6) + '" y="' + (Y(l.y) - 4).toFixed(1) + '" class="zn-h" style="fill:' + (l.c || "#2563eb") + ';font-size:11px">' + esc(l.t || "") + '</text>'; });
    s += '<g class="zk-cross" style="display:none"><line class="zx" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--mute)" stroke-dasharray="3 3"/><line class="zy" x1="' + L + '" x2="' + (W - R) + '" stroke="var(--mute)" stroke-dasharray="3 3"/></g>';
    return { svg: '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.alt || "Practice chart") + '">' + s + '</svg>', W: W, H: H, L: L, R: R, T: T, B: B, sl: sl, n: n, Y: Y, X: X, inv: function (y) { return mn + (1 - (y - T) / (H - T - B)) * (mx - mn); }, idx: function (x) { return Math.max(0, Math.min(C.length - 1, Math.floor((x - L) / sl))); } };
  }
  function pt(svg, ev, g) { var r = svg.getBoundingClientRect(); return { x: (ev.clientX - r.left) * (g.W / r.width), y: (ev.clientY - r.top) * (g.H / r.height) }; }

  /* ---------- generated drills ---------- */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function cand(o, c, uw, dw) { return [o, Math.max(o, c) + uw, Math.min(o, c) - dw, c]; }
  function genBullFvg(r, fail) {
    var R = function (a, b) { return a + (b - a) * r(); }, C = [], p = 62, i;
    for (i = 0; i < 6; i++) { var d = R(1.2, 2.6) * (r() < 0.8 ? -1 : 1); C.push(cand(p, p + d, R(.3, .9), R(.3, .9))); p += d; }
    var c1 = cand(p, p + R(-.5, .5), R(.3, .8), R(.3, .8)); C.push(c1); var H1 = c1[1], gap = R(1.8, 3.2);
    var o2 = c1[3], c2c = H1 + gap + R(2, 3.5); C.push([o2, c2c + R(.2, .5), Math.min(o2, H1) - R(.1, .4), c2c]);
    var c3o = c2c - R(.1, .5), c3c = c3o + R(.5, 2), c3l = H1 + gap; C.push([c3o, c3c + R(.3, .9), c3l, c3c]); p = c3c;
    var top = c3l, bot = H1, a = 7;
    if (!fail) { for (i = 0; i < 2; i++) { var d2 = R(.8, 2); C.push(cand(p, p + d2, R(.3, .8), R(.2, .6))); p += d2; } var steps = 4, tgt = top + R(1, 1.8); for (i = 0; i < steps; i++) { var np = p + (tgt - p) / (steps - i) + R(-.3, .3); var cc = cand(p, np, R(.2, .6), R(.15, .4)); if (i === steps - 1) cc[2] = Math.max(cc[2], top + .2); C.push(cc); p = np; } }
    else { C.push(cand(p, p - R(1, 2), R(.4, .9), R(.3, .7))); p = C[C.length - 1][3]; C.push(cand(p, p - R(2, 3), R(.3, .7), R(.3, .7))); p = C[C.length - 1][3]; var big = cand(p, bot - R(3, 5), R(.2, .6), R(.4, .9)); C.push(big); p = big[3]; for (i = 0; i < 3; i++) { var np2 = p + R(.6, 1.6); C.push(cand(p, np2, R(.3, .8), R(.2, .6))); p = np2; } var cl = C[C.length - 1]; if (cl[1] >= bot) { var sh = cl[1] - bot + 0.3; C = C.slice(0, -3).concat(C.slice(-3).map(function (c) { return c.map(function (v) { return v - sh; }); })); } }
    return { C: C, top: top, bot: bot, a: a, c1: c1, c3: C[8], mid: C[7], inv: !!fail };
  }
  function genDemand(r) {
    var R = function (a, b) { return a + (b - a) * r(); }, C = [], p = 70, i, dbr = r() < 0.5;
    for (i = 0; i < 6; i++) { var d = (dbr ? -1 : 1) * R(1.5, 2.8); C.push(cand(p, p + d, R(.3, .9), R(.3, .9))); p += d; }
    var nb = 1 + Math.floor(r() * 3), a = C.length;
    for (i = 0; i < nb; i++) { var d1 = R(.2, .7) * (i % 2 ? 1 : -1); C.push(cand(p, p + d1, R(.4, 1.1), R(.4, 1.1))); p += d1; }
    var b = C.length - 1, top = -1e9, bot = 1e9, wtop = -1e9; for (i = a; i <= b; i++) { top = Math.max(top, C[i][0], C[i][3]); bot = Math.min(bot, C[i][2]); wtop = Math.max(wtop, C[i][1]); }
    for (i = 0; i < 3; i++) { var d3 = R(4, 6); C.push(cand(p, p + d3, R(.3, .8), R(.2, .5))); p += d3; }
    var steps = 5, tgt = top + R(1.4, 2.2); for (i = 0; i < steps; i++) { var np = p + (tgt - p) / (steps - i) + R(-.4, .4); var cc = cand(p, np, R(.2, .5), R(.15, .4)); if (i === steps - 1) cc[2] = Math.max(cc[2], top + .25); C.push(cc); p = np; }
    return { C: C, top: top, bot: bot, a: a, b: b, wtop: wtop, nb: nb, pat: dbr ? "drop, base, rally" : "rally, base, rally" };
  }
  var KINDS = { dem: "Demand zone", sup: "Supply zone", fvgb: "Bullish FVG", fvgs: "Bearish FVG", ifvgs: "Bearish IFVG", ifvgb: "Bullish IFVG" };
  var KEYS = ["dem", "sup", "fvgb", "fvgs", "ifvgs", "ifvgb"];
  function mkDrill(kind, seed) {
    var r = rng(seed), q = { kind: kind, seed: seed }, g, mirrored = (kind === "sup" || kind === "fvgs" || kind === "ifvgb");
    if (kind === "dem" || kind === "sup") { g = genDemand(r); q.nb = g.nb; q.pat = g.pat; } else g = genBullFvg(r, kind === "ifvgs" || kind === "ifvgb");
    var C = g.C;
    if (mirrored) { var M = mir(C); q.C = M; q.top = 100 - g.bot; q.bot = 100 - g.top; q.wtop = g.wtop != null ? 100 - g.wtop : null; q.m = { c1: M[6], c3: M[8] }; if (kind === "sup") { var hi = -1e9, bb = 1e9, i; for (i = g.a; i <= g.b; i++) { hi = Math.max(hi, M[i][1]); bb = Math.min(bb, M[i][0], M[i][3]); } q.top = hi; q.bot = bb; q.wbot = Math.min.apply(null, M.slice(g.a, g.b + 1).map(function (c) { return c[2]; })); q.wtopT = hi; q.btop = Math.max.apply(null, M.slice(g.a, g.b + 1).map(function (c) { return Math.max(c[0], c[3]); })); } }
    else { q.C = C; q.top = g.top; q.bot = g.bot; q.m = { c1: C[6], c3: C[8] }; if (kind === "dem") { q.wbot = g.bot; q.wtopD = g.wtop; } }
    q.a = g.a; q.b = g.b; return q;
  }
  function explain(q, u) {
    var tol = q.tol, hi = Math.max(u[0], u[1]), lo = Math.min(u[0], u[1]), ok1 = Math.abs(hi - q.top) <= tol, ok2 = Math.abs(lo - q.bot) <= tol, t = [];
    var isZ = q.kind === "dem" || q.kind === "sup";
    if (isZ) {
      if (q.kind === "dem") {
        t.push(ok1 ? "Top edge: correct. It is the highest body edge (open or close) of the base, " + f2(q.top) + "." : (q.wtopD != null && Math.abs(hi - q.wtopD) <= tol ? "Top edge: you went to the wick tip. For demand the top edge uses the highest <b>body</b> edge, " + f2(q.top) + "." : "Top edge: should be the highest body edge of the base, " + f2(q.top) + "; you chose " + f2(hi) + "."));
        t.push(ok2 ? "Bottom edge: correct. It is the lowest wick of the base, " + f2(q.bot) + "." : "Bottom edge: should be the lowest wick of the base, " + f2(q.bot) + "; you chose " + f2(lo) + ".");
      } else {
        t.push(ok1 ? "Top edge: correct. It is the highest wick of the base, " + f2(q.top) + "." : "Top edge: should be the highest wick of the base, " + f2(q.top) + "; you chose " + f2(hi) + ".");
        t.push(ok2 ? "Bottom edge: correct. It is the lowest body edge (open or close), " + f2(q.bot) + "." : (q.wbot != null && Math.abs(lo - q.wbot) <= tol ? "Bottom edge: you went to the wick tip. For supply the bottom edge uses the lowest <b>body</b> edge, " + f2(q.bot) + "." : "Bottom edge: should be the lowest body edge of the base, " + f2(q.bot) + "; you chose " + f2(lo) + "."));
      }
      t.push("The base was " + q.nb + " candle" + (q.nb > 1 ? "s" : "") + " (" + q.pat + (q.kind === "sup" ? ", flipped for supply" : "") + ").");
    } else {
      var up = q.kind === "fvgb" || q.kind === "ifvgs", c1 = q.m.c1, c3 = q.m.c3;
      t.push(ok1 ? "Top edge: correct, " + f2(q.top) + "." : "Top edge: should be " + f2(q.top) + (up ? " (the LOW of candle 3)" : " (the LOW of candle 1)") + "; you chose " + f2(hi) + (Math.abs(hi - Math.max(c3[0], c3[3])) <= tol && up ? ". That is candle 3's body. Use the wick tip." : "."));
      t.push(ok2 ? "Bottom edge: correct, " + f2(q.bot) + "." : "Bottom edge: should be " + f2(q.bot) + (up ? " (the HIGH of candle 1)" : " (the HIGH of candle 3)") + "; you chose " + f2(lo) + ".");
      t.push(q.kind.indexOf("ifvg") === 0 ? "This gap failed when a candle closed through it, so the same box flips and acts as " + (q.kind === "ifvgs" ? "resistance" : "support") + "." : "The gap is the empty space between the wick tips of candles 1 and 3. The big middle candle is not part of the box.");
    }
    return { pts: (ok1 ? 1 : 0) + (ok2 ? 1 : 0), ok1: ok1, ok2: ok2, text: t };
  }
  function task(kind) {
    return ({ dem: "Mark the <b>DEMAND zone</b> (where buyers stepped in). Click the <b>TOP</b> edge, then the <b>BOTTOM</b> edge.", sup: "Mark the <b>SUPPLY zone</b> (where sellers stepped in). Click the <b>TOP</b> edge, then the <b>BOTTOM</b> edge.", fvgb: "Find the <b>bullish fair value gap</b>. Click its <b>TOP</b> edge and its <b>BOTTOM</b> edge.", fvgs: "Find the <b>bearish fair value gap</b>. Click its <b>TOP</b> edge and its <b>BOTTOM</b> edge.", ifvgs: "A bullish gap formed here, then <b>failed</b>. Mark the box that is now a <b>bearish inverse FVG</b> (resistance). Click its two edges.", ifvgb: "A bearish gap formed here, then <b>failed</b>. Mark the box that is now a <b>bullish inverse FVG</b> (support). Click its two edges." })[kind];
  }

  /* ---------- live-chart detection (rules applied to real candles) ---------- */
  function atr(B) { var s = 0, n = Math.min(14, B.length - 1), i; for (i = B.length - n; i < B.length; i++) s += Math.max(B[i][2] - B[i][3], Math.abs(B[i][2] - B[i - 1][4]), Math.abs(B[i][3] - B[i - 1][4])); return s / n; }
  function findFvg(B) { // B = [t,o,h,l,c,v]
    var out = [], av = atr(B), i, j;
    for (i = 1; i < B.length - 1; i++) {
      var a = B[i - 1], m = B[i], c = B[i + 1], bull = c[3] > a[2] && m[4] > m[1], bear = c[2] < a[3] && m[4] < m[1];
      if (!bull && !bear) continue; var top = bull ? c[3] : a[3], bot = bull ? a[2] : c[2]; if (top - bot < av * 0.3) continue;
      var st = "open", inv = -1;
      for (j = i + 2; j < B.length; j++) {
        if (bull) { if (B[j][4] < bot) { st = "inverted"; inv = j; break; } if (B[j][3] <= top) st = "touched"; }
        else { if (B[j][4] > top) { st = "inverted"; inv = j; break; } if (B[j][2] >= bot) st = "touched"; }
      }
      out.push({ i: i, bull: bull, top: top, bot: bot, st: st, inv: inv });
    }
    return out.slice(-5);
  }
  function findZones(B) {
    var out = [], i, k, sum = 0, cnt = 0;
    B.forEach(function (b) { sum += Math.abs(b[4] - b[1]); cnt++; }); var avgB = sum / Math.max(1, cnt), av = atr(B);
    for (i = 4; i < B.length - 1; i++) {
      var d = B[i], body = Math.abs(d[4] - d[1]); if (body < avgB * 1.9 || body < av * 1.1) continue;
      var up = d[4] > d[1], bs = [], j = i - 1; while (j >= 0 && bs.length < 3 && Math.abs(B[j][4] - B[j][1]) <= avgB * 0.7) { bs.unshift(j); j--; } if (!bs.length) continue;
      var top, bot, bt = -1e9, bb = 1e9, hi = -1e9, lo = 1e9;
      bs.forEach(function (x) { bt = Math.max(bt, B[x][1], B[x][4]); bb = Math.min(bb, B[x][1], B[x][4]); hi = Math.max(hi, B[x][2]); lo = Math.min(lo, B[x][3]); });
      if (up) { top = bt; bot = lo; } else { top = hi; bot = bb; }
      var st = "fresh", end = B.length - 1; for (k = i + 1; k < B.length; k++) { if (up ? B[k][4] < bot : B[k][4] > top) { st = "broken"; end = k; break; } if (up ? B[k][3] <= top : B[k][2] >= bot) st = "tested"; }
      if (st === "broken" || top - bot > av * 3.2) continue;
      out.push({ a: bs[0], b: i - 1, up: up, top: top, bot: bot, st: st });
    }
    return out.slice(-3);
  }

  /* ---------- practice UI ---------- */
  var DRL = { kind: "any", n: 0, ok: 0, pts: 0, streak: 0, q: null, sel: [], res: null };
  var LIV = { sym: "SPY", iv: "15", bars: null, err: "", loading: false, boxes: [], show: false, drag: null, prev: null };
  var TAB = "drill";
  function newDrill() {
    var kind = DRL.kind === "any" ? KEYS[Math.floor(Math.random() * KEYS.length)] : DRL.kind, q = mkDrill(kind, (Math.random() * 1e9) | 0), rg = 0, i;
    q.C.forEach(function (c) { rg += c[1] - c[2]; }); q.tol = Math.max((q.top - q.bot) * 0.22, rg / q.C.length * 0.28);
    DRL.q = q; DRL.sel = []; DRL.res = null;
  }
  function drillHtml() {
    var q = DRL.q, hl = DRL.sel.slice(), P, lines = DRL.sel.map(function (y, i) { return { y: y, t: "click " + (i + 1), c: "#2563eb", dash: "5 4" }; }), boxes = [];
    if (DRL.res) { boxes.push({ a: q.a, b: q.C.length - 1, top: q.top, bot: q.bot, k: q.kind === "dem" || q.kind === "fvgb" || q.kind === "ifvgb" ? "d" : "s", t: "CORRECT" }); if (q.kind.indexOf("ifvg") === 0) boxes[0].a = 8; }
    P = plot(q.C, { alt: "Practice chart: " + KINDS[q.kind], lines: lines, boxes: boxes, hl: hl.concat(DRL.res ? [q.top, q.bot] : []), min: q.C.length + 2 });
    DRL._g = P;
    var fb = "";
    if (DRL.res) { fb = '<div class="zk-fb"><span class="' + (DRL.res.pts === 2 ? "ok" : "no") + '">' + DRL.res.pts + ' / 2 edges correct</span><ul style="margin:6px 0 0;padding-left:18px">' + DRL.res.text.map(function (x) { return '<li>' + x + '</li>'; }).join("") + '</ul></div>'; }
    return '<div class="zk-prh"><label>Practice<select id="zkdk"><option value="any"' + (DRL.kind === "any" ? " selected" : "") + '>Mixed (random)</option>' + KEYS.map(function (k) { return '<option value="' + k + '"' + (DRL.kind === k ? " selected" : "") + '>' + KINDS[k] + '</option>'; }).join("") + '</select></label>' +
      '<button class="zk-btn" data-zk="clear" ' + (DRL.sel.length && !DRL.res ? "" : "disabled") + '>Clear clicks</button><button class="zk-btn p" data-zk="check" ' + (DRL.sel.length === 2 && !DRL.res ? "" : "disabled") + '>Check my answer</button><button class="zk-btn" data-zk="next">' + (DRL.res ? "Next chart &rarr;" : "Skip &rarr;") + '</button>' +
      '<span class="zk-sc">Rounds ' + DRL.n + ' &middot; edges right ' + DRL.pts + ' of ' + (DRL.n * 2) + ' &middot; perfect streak ' + DRL.streak + '</span></div><div class="zk-q">' + task(q.kind) + '</div><div class="zk-ch" id="zkch">' + P.svg + '</div><div class="zk-info" id="zkinfo">' + (DRL.res ? "" : "Click on the chart at the price level you want. You get 2 clicks. Every chart is new and randomly built, so you can do this as often as you like.") + '</div>' + fb;
  }
  function liveHtml() {
    var h = '<div class="zk-prh"><label>Ticker<input id="zksym" value="' + esc(LIV.sym) + '" style="text-transform:uppercase;width:90px"></label><label>Time frame<select id="zkiv">' + [["5", "5 min"], ["15", "15 min"], ["60", "60 min"], ["D", "Daily"]].map(function (x) { return '<option value="' + x[0] + '"' + (LIV.iv === x[0] ? " selected" : "") + '>' + x[1] + '</option>'; }).join("") + '</select></label><button class="zk-btn p" data-zk="load">' + (LIV.loading ? "Loading..." : "Load live chart") + '</button>' +
      ["SPY", "QQQ", "AAPL", "NVDA", "TSLA", "AMD"].map(function (s) { return '<button class="zk-btn" data-zk="pick" data-s="' + s + '">' + s + '</button>'; }).join("") + '</div>';
    if (LIV.err) h += '<p class="zn-p" style="color:var(--loss)">' + esc(LIV.err) + '</p>';
    if (!LIV.bars) return h + '<p class="zn-p">Load any ticker to practice on real, recent candles. <b>Step 1:</b> drag a box over where you think a zone or gap is. <b>Step 2:</b> turn on "Show what the rules find" and compare. Candles may be delayed a few minutes.</p>';
    var B = LIV.bars, fv = LIV.show ? findFvg(B) : [], zn = LIV.show ? findZones(B) : [], boxes = [], tl = [], i;
    LIV.boxes.forEach(function (b) { boxes.push({ a: b.a, b: b.b, top: b.top, bot: b.bot, k: "u", t: "MINE" }); });
    if (LIV.drag) boxes.push({ a: LIV.drag.a, b: LIV.drag.b, top: LIV.drag.top, bot: LIV.drag.bot, k: "u", dash: 1 });
    zn.forEach(function (z) { boxes.push({ a: z.a, b: B.length - 1, top: z.top, bot: z.bot, k: z.up ? "d" : "s", t: z.up ? "Demand" : "Supply" }); });
    fv.forEach(function (f) { if (f.st === "inverted") { boxes.push({ a: f.i, b: f.inv, top: f.top, bot: f.bot, k: f.bull ? "d" : "s", t: "FVG" }); boxes.push({ a: f.inv, b: B.length - 1, top: f.top, bot: f.bot, k: f.bull ? "s" : "d", t: "IFVG" }); } else boxes.push({ a: f.i, b: B.length - 1, top: f.top, bot: f.bot, k: f.bull ? "d" : "s", t: "FVG" }); });
    var step = Math.max(1, Math.round(B.length / 7)); for (i = 0; i < B.length; i += step) { var d = new Date(B[i][0] * 1000); tl.push([i, LIV.iv === "D" ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }) : d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: "America/New_York" }) + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })]); }
    var C = B.map(function (b) { return [b[1], b[2], b[3], b[4]]; }), P = plot(C, { alt: "Live " + LIV.sym + " candles", boxes: boxes, tl: tl, min: C.length + 3, H: 460 }); LIV._g = P;
    h += '<div class="zk-prh"><button class="zk-btn' + (LIV.show ? " on" : "") + '" data-zk="show">' + (LIV.show ? "Hide" : "Show") + ' what the rules find</button><button class="zk-btn" data-zk="undo" ' + (LIV.boxes.length ? "" : "disabled") + '>Undo my last box</button><button class="zk-btn" data-zk="clearb" ' + (LIV.boxes.length ? "" : "disabled") + '>Clear my boxes</button><span class="zk-sc">' + esc(LIV.sym) + ' &middot; ' + esc(({ "5": "5 min", "15": "15 min", "60": "60 min", D: "Daily" })[LIV.iv]) + ' &middot; ' + B.length + ' candles</span></div>' +
      '<div class="zk-ch" id="zkch">' + P.svg + '</div><div class="zk-info" id="zkinfo">Drag on the chart to draw a box. Hover to see a candle\'s numbers.</div>';
    if (LIV.show) {
      h += '<div class="zk-lg"><span><i style="background:rgba(22,163,74,.5)"></i>Demand / bullish</span><span><i style="background:rgba(220,38,38,.5)"></i>Supply / bearish</span><span><i style="background:rgba(37,99,235,.5)"></i>Your boxes</span></div>';
      h += '<table class="zk-lt"><thead><tr><th>Found</th><th>From</th><th>Top</th><th>Bottom</th><th>Status</th></tr></thead><tbody>' + fv.map(function (f) { return '<tr><td>' + (f.bull ? "Bullish" : "Bearish") + ' ' + (f.st === "inverted" ? "FVG &rarr; IFVG" : "FVG") + '</td><td>candle ' + (f.i + 1) + '</td><td>' + f2(f.top) + '</td><td>' + f2(f.bot) + '</td><td>' + (f.st === "inverted" ? "failed, now flipped" : f.st === "touched" ? "price came back" : "fresh (not revisited)") + '</td></tr>'; }).join("") + zn.map(function (z) { return '<tr><td>' + (z.up ? "Demand" : "Supply") + ' zone</td><td>candle ' + (z.a + 1) + '</td><td>' + f2(z.top) + '</td><td>' + f2(z.bot) + '</td><td>' + z.st + '</td></tr>'; }).join("") + '</tbody></table><p class="zn-p" style="margin-top:6px">These boxes come from simple rules (a big candle, a small base or a gap bigger than a third of a normal candle). They are <b>practice answers, not trade signals</b>. Real zones also need trend, time frame and context.</p>';
    }
    return h;
  }
  function practiceHtml() {
    return '<div class="zk-pr"><div class="zk-tabs" style="position:static;margin:0 0 10px;padding:0"><button type="button" data-zktab="drill" class="' + (TAB === "drill" ? "on" : "") + '">Drills (unlimited)</button><button type="button" data-zktab="live" class="' + (TAB === "live" ? "on" : "") + '">Live charts</button></div>' + (TAB === "drill" ? drillHtml() : liveHtml()) + '</div>';
  }
  var HOST = null;
  function draw() { if (!HOST) return; var sy = window.scrollY; HOST.innerHTML = practiceHtml(); if (TAB === "drill" || LIV.bars) bindChart(); }
  function bindChart() {
    var ch = document.getElementById("zkch"); if (!ch) return; var svg = ch.querySelector("svg"), cr = svg.querySelector(".zk-cross"), info = document.getElementById("zkinfo");
    function cross(ev, P) { var p = pt(svg, ev, P); if (p.x < P.L || p.x > P.W - P.R || p.y < P.T || p.y > P.H - P.B) { cr.style.display = "none"; return null; } cr.style.display = ""; cr.querySelector(".zx").setAttribute("x1", p.x); cr.querySelector(".zx").setAttribute("x2", p.x); cr.querySelector(".zy").setAttribute("y1", p.y); cr.querySelector(".zy").setAttribute("y2", p.y); return p; }
    if (TAB === "drill") {
      var P = DRL._g;
      svg.addEventListener("pointermove", function (ev) { var p = cross(ev, P); if (p) info.textContent = "Price at your cursor: " + f2(P.inv(p.y)); });
      svg.addEventListener("pointerleave", function () { cr.style.display = "none"; });
      svg.addEventListener("click", function (ev) { if (DRL.res || DRL.sel.length >= 2) return; var p = pt(svg, ev, P); if (p.x < P.L || p.x > P.W - P.R) return; DRL.sel.push(P.inv(p.y)); draw(); });
    } else {
      var G = LIV._g, B = LIV.bars;
      svg.addEventListener("pointermove", function (ev) {
        var p = cross(ev, G); if (!p) return; var i = G.idx(p.x), b = B[i]; if (b) info.textContent = new Date(b[0] * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: LIV.iv === "D" ? undefined : "numeric", minute: LIV.iv === "D" ? undefined : "2-digit", timeZone: "America/New_York" }) + "  O " + f2(b[1]) + "  H " + f2(b[2]) + "  L " + f2(b[3]) + "  C " + f2(b[4]) + "  | cursor price " + f2(G.inv(p.y));
        if (LIV.drag) { var d = LIV.drag; d.b = Math.max(d.a, i); d.top = Math.max(d.y0, G.inv(p.y)); d.bot = Math.min(d.y0, G.inv(p.y)); var ch2 = document.getElementById("zkch"); LIV.drag.moved = true; var keep = LIV.drag; draw(); LIV.drag = keep; }
      });
      svg.addEventListener("pointerleave", function () { cr.style.display = "none"; });
      svg.addEventListener("pointerdown", function (ev) { var p = pt(svg, ev, G); if (p.x < G.L || p.x > G.W - G.R) return; var y = G.inv(p.y), i = G.idx(p.x); LIV.drag = { a: i, b: i, y0: y, top: y, bot: y }; try { svg.setPointerCapture(ev.pointerId); } catch (e) { } });
      svg.addEventListener("pointerup", function () { var d = LIV.drag; LIV.drag = null; if (d && d.moved && d.top - d.bot > 0 && d.b >= d.a) LIV.boxes.push({ a: d.a, b: d.b, top: d.top, bot: d.bot }); draw(); });
    }
  }
  function loadLive() {
    var So = window.stockspotSocial; LIV.err = ""; if (!So || !So.zoneBars) { LIV.err = "Live candles need you to be logged in."; draw(); return; }
    LIV.loading = true; draw();
    So.zoneBars(LIV.sym, LIV.iv).then(function (j) { LIV.loading = false; var b = j && j.bars; if (!b || b.error || !b.bars || b.bars.length < 20) { LIV.err = (b && b.error) || "Not enough candles for that ticker."; LIV.bars = null; } else { LIV.bars = b.bars.slice(-90); LIV.boxes = []; } draw(); }).catch(function (e) { LIV.loading = false; LIV.err = e.code === 401 ? "Log in to load live candles." : "Could not load candles right now. Try again in a minute."; draw(); });
  }
  function mount(host) {
    if (!host) return; HOST = host; if (!DRL.q) newDrill();
    host.onclick = function (ev) {
      var t = ev.target.closest && ev.target.closest("[data-zk],[data-zktab]"); if (!t) return;
      if (t.dataset.zktab) { TAB = t.dataset.zktab; draw(); return; }
      var a = t.dataset.zk;
      if (a === "clear") { DRL.sel = []; draw(); }
      else if (a === "check") { var u = DRL.sel.slice(), r = explain(DRL.q, u); DRL.res = r; DRL.n++; DRL.pts += r.pts; DRL.streak = r.pts === 2 ? DRL.streak + 1 : 0; draw(); }
      else if (a === "next") { newDrill(); draw(); }
      else if (a === "load") { var s = document.getElementById("zksym"); LIV.sym = (s && s.value || "SPY").toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 6) || "SPY"; var v = document.getElementById("zkiv"); LIV.iv = v ? v.value : "15"; loadLive(); }
      else if (a === "pick") { LIV.sym = t.dataset.s; var v2 = document.getElementById("zkiv"); LIV.iv = v2 ? v2.value : LIV.iv; loadLive(); }
      else if (a === "show") { LIV.show = !LIV.show; draw(); }
      else if (a === "undo") { LIV.boxes.pop(); draw(); }
      else if (a === "clearb") { LIV.boxes = []; draw(); }
    };
    host.onchange = function (ev) { if (ev.target.id === "zkdk") { DRL.kind = ev.target.value; newDrill(); draw(); } else if (ev.target.id === "zkiv") { LIV.iv = ev.target.value; } };
    host.onkeydown = function (ev) { if (ev.key === "Enter" && ev.target.id === "zksym") { ev.preventDefault(); host.querySelector('[data-zk="load"]').click(); } };
    draw();
  }

  window.ZoneKit = { init: function (fn) { ZC = fn; }, partsHtml: partsHtml, tfHtml: tfHtml, fvgHtml: fvgHtml, moreEgs: moreEgs, moreHtml: moreHtml, mount: mount, practiceHost: '<div id="znpr"></div>', _t: { mkDrill: mkDrill, explain: explain, findFvg: findFvg, findZones: findZones, genBullFvg: genBullFvg, genDemand: genDemand, rng: rng } };
})();
