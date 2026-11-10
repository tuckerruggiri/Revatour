/* Market Pulse: breaking news -> what it may mean for sectors, with history. Data: pulse-data.json */
(function () {
  "use strict";
  var DATA = null, ST = { cat: "all", scen: "mid", loaded: false, lq: null }, bound = false;
  var TAPE = ["SPY", "QQQ", "IWM", "XLF", "ITB", "GLD", "XLE", "TLT"];

  var CSS = '#pulsev{max-width:none;width:100%;box-sizing:border-box;padding-left:28px;padding-right:28px;--up:var(--gain);--dn:var(--loss)}#pulsev *{box-sizing:border-box}' +
    '#pulsev .c-fed{--cc:#8a4fe0}#pulsev .c-housing{--cc:#e0762b}#pulsev .c-banks{--cc:#2b7de0}#pulsev .c-economy{--cc:#1a9a9a}#pulsev .c-stocks{--cc:#d6478a}#pulsev .c-commodities{--cc:#c9961a}#pulsev .c-politics{--cc:#d2503f}#pulsev .c-all{--cc:var(--accent)}' +
    '#pulsev .pl-rf{border:1px solid var(--line);border-radius:10px;padding:6px 12px;background:var(--panel);color:var(--ink);font:inherit;font-size:13px;cursor:pointer;margin-left:10px}.pl-rf:hover{border-color:var(--accent)}.pl-rf:disabled{opacity:.6}.pl-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px;margin:0 0 12px}#pulsev .pl-h h2{margin:0;font-size:28px;letter-spacing:-.01em}#pulsev .pl-sub{color:var(--mute);font-size:14px}' +
    '#pulsev .pl-top{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin:0 0 14px}' +
    '#pulsev .pl-hero{position:relative;overflow:hidden;border:1px solid var(--line);border-radius:18px;padding:22px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 14%,var(--panel)),var(--panel) 62%);display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:24px;align-items:center}@media(max-width:700px){#pulsev .pl-hero{grid-template-columns:minmax(0,1fr)}}' +
    '#pulsev .pl-hero b{font-size:clamp(20px,2.2vw,28px);line-height:1.2;display:block;margin-bottom:10px;letter-spacing:-.01em}#pulsev .pl-hero p{margin:0;font-size:14px;color:var(--mute);line-height:1.55}' +
    '#pulsev .pl-mood{text-align:center}#pulsev .pl-mood svg{width:100%;max-width:230px;height:auto;display:block;margin:0 auto}#pulsev .pl-mood .mv{font-weight:800;font-size:16px;margin-top:-4px}#pulsev .pl-mood .ms{font-size:11px;color:var(--mute)}' +
    '#pulsev .pl-rt{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}@media(max-width:900px){#pulsev .pl-rt{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){#pulsev .pl-rt{grid-template-columns:minmax(0,1fr)}}' +
    '#pulsev .pl-rt div{border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:12px;padding:10px 12px;background:var(--panel)}#pulsev .pl-rt small{display:block;color:var(--mute);font-size:11px;text-transform:uppercase;letter-spacing:.05em}#pulsev .pl-rt b{font-size:24px;display:block;margin:2px 0;letter-spacing:-.01em}#pulsev .pl-rt span{font-size:11px;color:var(--mute);line-height:1.35;display:block}' +
    '#pulsev .pl-tape{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}#pulsev .pl-chip{border:1px solid var(--line);border-radius:999px;padding:4px 12px;font-size:13px;background:var(--panel)}#pulsev .pl-chip b{margin:0 5px 0 3px}' +
    '#pulsev h3.pl-s{display:flex;align-items:center;gap:10px;font-size:18px;margin:26px 0 4px;letter-spacing:-.01em}#pulsev h3.pl-s:after{content:"";flex:1;height:1px;background:var(--line)}#pulsev .pl-sec{margin:0 0 12px;color:var(--mute);font-size:13px}' +
    '#pulsev .pl-lean{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}@media(max-width:1000px){#pulsev .pl-lean{grid-template-columns:minmax(0,1fr)}}' +
    '#pulsev .pl-lc{border:1px solid var(--line);border-radius:16px;padding:16px;background:var(--panel)}#pulsev .pl-lc .tt{font-weight:800;font-size:16px}#pulsev .pl-lc .sb{color:var(--mute);font-size:12px}#pulsev .pl-lc .hd{font-weight:700;margin:10px 0 10px;font-size:15px}#pulsev .pl-lc p{margin:10px 0 0;font-size:13px;line-height:1.5;color:var(--mute)}' +
    '#pulsev .pl-g{position:relative;height:14px;border-radius:8px;background:linear-gradient(90deg,var(--dn),var(--line) 50%,var(--up))}#pulsev .pl-g i{position:absolute;top:-5px;width:8px;height:24px;border-radius:4px;background:var(--ink);box-shadow:0 0 0 3px var(--panel)}#pulsev .pl-gl{display:flex;justify-content:space-between;font-size:10px;color:var(--mute);margin-top:6px}' +
    '#pulsev .pl-sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}' +
    '#pulsev .pl-sc{border:1px solid var(--line);border-top:5px solid var(--line);border-radius:14px;padding:14px;background:var(--panel);position:relative}#pulsev .pl-sc.u{border-top-color:var(--up)}#pulsev .pl-sc.d{border-top-color:var(--dn)}#pulsev .pl-sc .nm{font-weight:800;font-size:15px;padding-right:56px}#pulsev .pl-sc .et{color:var(--mute);font-size:12px;margin-bottom:10px;letter-spacing:.04em;display:flex;gap:8px;flex-wrap:wrap}#pulsev .pl-sc .et .pl-tk{color:var(--ink)}#pulsev .pl-sc .nt{position:absolute;right:12px;top:12px;font-size:11px;font-weight:800;border-radius:999px;padding:2px 8px;background:var(--line);color:var(--mute)}#pulsev .pl-sc.u .nt{background:var(--up);color:#fff}#pulsev .pl-sc.d .nt{background:var(--dn);color:#fff}' +
    '#pulsev .pl-ar{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:10px}#pulsev .pl-ar span{text-align:center;border-radius:8px;padding:5px 0;font-size:11px;background:var(--line);color:var(--mute)}#pulsev .pl-ar span b{display:block;font-size:15px}#pulsev .pl-ar .u{background:var(--up);color:#fff}#pulsev .pl-ar .d{background:var(--dn);color:#fff}#pulsev .pl-sc p{margin:0;font-size:12px;color:var(--mute);line-height:1.5}' +
    '#pulsev .pl-sn{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}#pulsev .pl-b{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:7px 16px;font:inherit;font-size:13px;cursor:pointer;transition:transform .08s}#pulsev .pl-b:hover{border-color:var(--cc,var(--accent))}#pulsev .pl-b:active{transform:scale(.97)}#pulsev .pl-b.on{background:var(--cc,var(--accent));color:#fff;border-color:var(--cc,var(--accent));font-weight:700}#pulsev .pl-b.on.c-all{color:var(--accent-ink)}' +
    '#pulsev .pl-so{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}#pulsev .pl-so div{border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-size:12px;background:var(--panel);border-left:4px solid var(--line)}#pulsev .pl-so div.u{border-left-color:var(--up)}#pulsev .pl-so div.d{border-left-color:var(--dn)}#pulsev .pl-so b{display:block;font-size:14px;margin-bottom:2px}' +
    '#pulsev .pl-feed{display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:14px}@media(max-width:520px){#pulsev .pl-feed{grid-template-columns:minmax(0,1fr)}}' +
    '#pulsev .pl-n{border:1px solid var(--line);border-top:5px solid var(--cc);border-radius:16px;padding:16px;background:var(--panel);display:flex;flex-direction:column;gap:12px;min-width:0}' +
    '#pulsev .pl-n .top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--mute)}#pulsev .pl-n .tag{border-radius:999px;padding:2px 10px;background:var(--cc);color:#fff;font-weight:700;font-size:11px}#pulsev .pl-n .hd{font-size:18px;font-weight:800;line-height:1.25;letter-spacing:-.01em}' +
    '#pulsev .pl-n p{margin:0;font-size:13.5px;line-height:1.55}#pulsev .pl-rc{display:flex;flex-wrap:wrap;gap:6px}#pulsev .pl-rc span{border-radius:10px;padding:4px 10px;font-size:12px;border:1px solid var(--line);background:var(--bg)}#pulsev .pl-rc .u{border-color:var(--up);color:var(--up)}#pulsev .pl-rc .d{border-color:var(--dn);color:var(--dn)}#pulsev .pl-rc small{color:var(--mute);margin-left:5px}' +
    '#pulsev .pl-hi{border-left:4px solid var(--cc);padding:8px 12px;background:var(--bg);border-radius:8px;font-size:12.5px;line-height:1.5}#pulsev .pl-hi b{display:block;font-size:11px;color:var(--mute);margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em}#pulsev .pl-hi a{color:inherit}' +
    '#pulsev .pl-tl{display:grid;grid-template-columns:1fr 1fr;gap:8px}@media(max-width:520px){#pulsev .pl-tl{grid-template-columns:1fr}}#pulsev .pl-tl div{border-radius:10px;padding:9px 10px;font-size:12.5px;line-height:1.5;background:var(--bg);border:1px solid var(--line)}#pulsev .pl-tl div:first-child{border-top:3px solid #e0762b}#pulsev .pl-tl div:last-child{border-top:3px solid #1f9d63}#pulsev .pl-tl b{display:block;font-size:11px;color:var(--mute);margin-bottom:3px;letter-spacing:.05em}' +
    '#pulsev .pl-ft{display:flex;gap:10px;align-items:center;font-size:12px;color:var(--mute);flex-wrap:wrap;margin-top:auto}#pulsev .pl-ft a{color:inherit;margin-left:auto}#pulsev .pl-cf{display:inline-flex;gap:3px;align-items:center}#pulsev .pl-cf u{width:9px;height:9px;border-radius:50%;background:var(--line);text-decoration:none}#pulsev .pl-cf u.on{background:var(--cc)}' +
    '#pulsev .pl-cal{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}#pulsev .pl-ci{border:1px solid var(--line);border-radius:14px;padding:14px;background:var(--panel);font-size:13px;display:flex;flex-direction:column;gap:6px}#pulsev .pl-ci .dt{font-weight:800;font-size:20px;letter-spacing:-.01em}#pulsev .pl-ci .wh{display:inline-block;align-self:flex-start;font-size:11px;font-weight:700;border-radius:999px;padding:2px 10px;background:var(--accent);color:var(--accent-ink)}#pulsev .pl-ci p{margin:0;font-size:12.5px;color:var(--mute);line-height:1.5}' +
    '#pulsev .pl-pb{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}#pulsev .pl-pi{border:1px solid var(--line);border-radius:14px;padding:12px 14px;background:var(--panel);font-size:13px;line-height:1.5}#pulsev .pl-pi b{display:block;font-size:14px;margin-bottom:4px}#pulsev .pl-pi b:before{content:"IF ";color:var(--mute);font-size:11px;letter-spacing:.06em}#pulsev .pl-pi span{color:var(--mute)}#pulsev .pl-pi span:before{content:"THEN ";font-size:11px;letter-spacing:.06em;font-weight:700;color:var(--ink)}' +
    '#pulsev .pl-dis{color:var(--mute);font-size:12px;margin:24px 0 4px;line-height:1.55}' +
    '@media(max-width:700px){#pulsev{padding-left:14px;padding-right:14px}}';

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function dayNum(iso) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ""); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000 : NaN; }
  function today() { var d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000; }
  function when(iso) { var n = dayNum(iso) - today(); return isNaN(n) ? "" : n < 0 ? "passed" : n === 0 ? "today" : n === 1 ? "tomorrow" : "in " + n + " days"; }
  function fmt(iso) { return new Date(dayNum(iso) * 86400000).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }); }
  function cls(d) { return d > 0 ? "u" : d < 0 ? "d" : ""; }
  function arrow(d) { return d > 0 ? "▲" : d < 0 ? "▼" : "◆"; }
  function lk(t) { return window.StockChart ? window.StockChart.link(t) : esc(t); }
  function cid(c) { return /^[a-z]+$/.test(c) ? c : "all"; }

  function mood(L) {
    var avg = L.reduce(function (t, x) { return t + (+x.s || 0); }, 0) / (L.length || 1);
    var lab = avg < -40 ? "Bearish" : avg < -15 ? "Leaning bearish" : avg < 15 ? "Mixed" : avg < 40 ? "Leaning bullish" : "Bullish";
    var th = Math.PI * (1 - (Math.max(-100, Math.min(100, avg)) + 100) / 200), nx = (110 + 76 * Math.cos(th)).toFixed(1), ny = (110 - 76 * Math.sin(th)).toFixed(1);
    return '<div class="pl-mood"><svg viewBox="0 0 220 128" role="img" aria-label="Market mood: ' + esc(lab) + '"><defs><linearGradient id="plg" x1="0" x2="1"><stop offset="0" stop-color="var(--loss)"/><stop offset=".5" stop-color="var(--line)"/><stop offset="1" stop-color="var(--gain)"/></linearGradient></defs>' +
      '<path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="url(#plg)" stroke-width="16" stroke-linecap="round"/><line x1="110" y1="110" x2="' + nx + '" y2="' + ny + '" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><circle cx="110" cy="110" r="8" fill="var(--ink)"/>' +
      '<text x="14" y="126" font-size="10" fill="var(--mute)">Bearish</text><text x="206" y="126" font-size="10" fill="var(--mute)" text-anchor="end">Bullish</text></svg><div class="mv">' + esc(lab) + '</div><div class="ms">Blend of our three time-frame leans</div></div>';
  }
  function lean(L) {
    var pos = Math.max(0, Math.min(100, (L.s + 100) / 2));
    return '<div class="pl-lc"><div class="tt">' + esc(L.h) + '</div><div class="sb">' + esc(L.sub) + '</div><div class="hd">' + esc(L.t) + '</div>' +
      '<div class="pl-g" title="Our lean: ' + esc(L.s) + ' on a -100 to +100 scale"><i style="left:calc(' + pos + '% - 4px)"></i></div><div class="pl-gl"><span>Bearish</span><span>Neutral</span><span>Bullish</span></div><p>' + esc(L.why) + '</p></div>';
  }
  function sector(S) {
    var lab = ["Today", "2-4 wks", "6-12 mo"], net = S.d.reduce(function (t, x) { return t + x; }, 0);
    return '<div class="pl-sc ' + cls(net) + '"><span class="nt">' + (net > 0 ? "+" + net : net) + '</span><div class="nm">' + esc(S.s) + '</div><div class="et">' + lk(S.etf) + '</div><div class="pl-ar">' + S.d.map(function (d, i) { return '<span class="' + cls(d) + '"><b>' + arrow(d) + '</b>' + lab[i] + '</span>'; }).join("") + '</div><p>' + esc(S.why) + '</p></div>';
  }
  function newsCard(n) {
    var cf = ""; for (var i = 1; i <= 3; i++) cf += '<u class="' + (i <= n.conf ? "on" : "") + '"></u>';
    var catName = (DATA.cats.filter(function (c) { return c[0] === n.cat; })[0] || [0, n.cat])[1];
    return '<div class="pl-n c-' + cid(n.cat) + '"><div class="top"><span class="tag">' + esc(catName) + '</span><span>' + esc(n.when) + '</span></div><div class="hd">' + esc(n.head) + '</div>' +
      '<p><b>What it means:</b> ' + esc(n.mean) + '</p>' +
      '<div class="pl-rc">' + n.react.map(function (r) { return '<span class="' + cls(r[1]) + '">' + arrow(r[1]) + ' ' + lk(r[0]) + '<small>' + esc(r[2]) + '</small></span>'; }).join("") + '</div>' +
      '<div class="pl-hi"><b>What history says</b>' + esc(n.hist) + (n.histU && /^https:\/\//.test(n.histU) ? ' <a href="' + esc(n.histU) + '" target="_blank" rel="noopener">' + esc(n.histN || "source") + ' ↗</a>' : "") + '</div>' +
      '<div class="pl-tl"><div><b>⚡ TRADE TODAY</b>' + esc(n.today) + '</div><div><b>🌱 INVEST LATER</b>' + esc(n.later) + '</div></div>' +
      '<div class="pl-ft"><span class="pl-cf" title="How sure we are: more dots = more evidence">' + cf + '</span><span>Confidence</span><a href="' + esc(/^https:\/\//.test(n.src) ? n.src : "#") + '" target="_blank" rel="noopener">' + esc(n.srcN) + ' ↗</a></div></div>';
  }
  function tape() {
    if (!ST.lq) return "";
    return '<div class="pl-tape">' + TAPE.filter(function (t) { return ST.lq[t] && ST.lq[t].p; }).map(function (t) { var q = ST.lq[t], d = Number(q.dp); return '<span class="pl-chip">' + esc(t) + '<b>$' + Number(q.p).toFixed(2) + '</b><span style="color:var(--' + (d >= 0 ? "gain" : "loss") + ')">' + (d >= 0 ? "+" : "") + d.toFixed(2) + '% live</span></span>'; }).join("") + '</div>';
  }

  function render(el) {
    var D = DATA, sc = D.scen.opts.filter(function (o) { return o.k === ST.scen; })[0] || D.scen.opts[0];
    var feed = D.news.filter(function (n) { return ST.cat === "all" || n.cat === ST.cat; });
    el.innerHTML = '<style>' + CSS + '</style><div class="pl-h"><h2>Market Pulse</h2><span class="pl-sub">What the news may mean for sectors, and how it played out before · ' + esc(D.asof) + '</span><button type="button" class="pl-rf" data-plrf title="Reload the latest data and live prices">↻ Refresh</button><span class="pl-sub" id="plrfs">' + (ST.ref ? 'Refreshed ' + esc(ST.ref) : '') + '</span></div>' +
      '<div class="pl-top"><div class="pl-hero"><div><b>' + esc(D.headline) + '</b><p>' + esc(D.regime) + '</p></div>' + mood(D.lean) + '</div><div class="pl-rt">' + D.rates.map(function (r) { return '<div><small>' + esc(r.l) + '</small><b>' + esc(r.v) + '</b><span>' + esc(r.n) + '</span></div>'; }).join("") + '</div></div>' + tape() +
      '<h3 class="pl-s">Where we lean</h3><div class="pl-lean">' + D.lean.map(lean).join("") + '</div>' +
      '<h3 class="pl-s">Sector heat map</h3><p class="pl-sec">▲ lean up, ▼ lean down, ◆ no clear lean. Three time frames: day trade, swing, investment. The badge adds them up.</p><div class="pl-sg">' + D.sectors.map(sector).join("") + '</div>' +
      '<h3 class="pl-s">' + esc(D.scen.title) + '</h3><div class="pl-sn">' + D.scen.opts.map(function (o) { return '<button type="button" class="pl-b c-all ' + (o.k === sc.k ? "on" : "") + '" data-plsc="' + esc(o.k) + '">' + esc(o.l) + '</button>'; }).join("") + '</div><div class="pl-so">' + sc.out.map(function (o) { return '<div class="' + cls(o[1]) + '"><b style="color:var(--' + (o[1] > 0 ? "gain" : o[1] < 0 ? "loss" : "mute") + ')">' + arrow(o[1]) + ' ' + esc(o[0]) + '</b>' + esc(o[2]) + '</div>'; }).join("") + '</div>' +
      '<h3 class="pl-s">Breaking news and what to do with it</h3><div class="pl-sn">' + D.cats.map(function (c) { return '<button type="button" class="pl-b c-' + cid(c[0]) + ' ' + (ST.cat === c[0] ? "on" : "") + '" data-plc="' + esc(c[0]) + '">' + esc(c[1]) + '</button>'; }).join("") + '</div>' +
      '<div class="pl-feed">' + (feed.length ? feed.map(newsCard).join("") : '<p>Nothing in this category today.</p>') + '</div>' +
      '<h3 class="pl-s">Calendar: the next events that move markets</h3><div class="pl-cal">' + D.calendar.filter(function (c) { return dayNum(c.d) - today() >= -1; }).map(function (c) { return '<div class="pl-ci"><span class="wh">' + esc(when(c.d)) + '</span><div class="dt">' + esc(fmt(c.d)) + '</div><b>' + esc(c.t) + '</b><p>' + esc(c.usual) + '</p></div>'; }).join("") + '</div>' +
      '<h3 class="pl-s">The playbook: if this, then that</h3><div class="pl-pb">' + D.playbook.map(function (r) { return '<div class="pl-pi"><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></div>'; }).join("") + '</div>' +
      '<p class="pl-dis">Built from the dated articles linked on each card. "Our lean" and the arrows are judgment calls from those sources, not predictions, and many first-day moves reverse. Items marked "rule of thumb" are general market patterns, not statistics from a study. Past reactions do not guarantee future ones. This is education, not investment advice; know your stop before you trade.</p>';
    live(el);
  }

  function live(el) {
    var a = window.stockspotSocial; if (!a || !a.quotes || ST.lq) return;
    a.quotes(TAPE).then(function (r) { if (r && r.quotes) { ST.lq = r.quotes; var t = el.querySelector(".pl-top"); if (t && !el.querySelector(".pl-tape")) t.insertAdjacentHTML("afterend", tape()); } }).catch(function () { });
  }

  function load(fresh) {
    return fetch("pulse-data.json?v=" + (fresh ? Date.now() : Math.floor(Date.now() / 3600000)), fresh ? { cache: "no-store" } : undefined).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { if (j && j.news && j.news.length) { DATA = j; ST.loaded = true; } }).catch(function () { });
  }

  window.MarketPulse = { mount: function (el) {
    (ST.loaded ? Promise.resolve() : load()).then(function () { if (!DATA) { el.textContent = "Could not load Market Pulse. Refresh the page."; return; } render(el); });
    if (bound) return; bound = true;
    el.addEventListener("click", function (e) {
      var b;
      if ((b = e.target.closest("[data-plc]"))) { ST.cat = b.getAttribute("data-plc"); render(el); }
      else if ((b = e.target.closest("[data-plrf]"))) {
        b.disabled = true; b.textContent = "Refreshing…"; var old = DATA && DATA.asof;
        load(true).then(function () { ST.lq = null; ST.ref = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + (DATA && DATA.asof === old ? " (no newer news yet)" : ""); render(el); });
      }
      else if ((b = e.target.closest("[data-plsc]"))) { ST.scen = b.getAttribute("data-plsc"); render(el); }
    });
  } };
})();
