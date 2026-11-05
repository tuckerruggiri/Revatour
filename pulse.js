/* Market Pulse: breaking news -> what it may mean for sectors, with history. Data: pulse-data.json */
(function () {
  "use strict";
  var DATA = null, ST = { cat: "all", scen: "mid", loaded: false, lq: null }, bound = false;
  var TAPE = ["SPY", "QQQ", "IWM", "XLF", "ITB", "GLD", "XLE", "TLT"];

  var CSS = '#pulsev{--up:var(--gain);--dn:var(--loss)}' +
    '#pulsev .pl-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;margin:0 0 6px}#pulsev .pl-h h2{margin:0;font-size:26px}#pulsev .pl-sub{color:var(--mute);font-size:13px}' +
    '#pulsev .pl-hero{border:1px solid var(--line);border-radius:14px;padding:16px;background:var(--panel);margin:0 0 12px}#pulsev .pl-hero b{font-size:19px;display:block;margin-bottom:6px}#pulsev .pl-hero p{margin:0;font-size:13px;color:var(--mute);line-height:1.5}' +
    '#pulsev .pl-tape{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}#pulsev .pl-chip{border:1px solid var(--line);border-radius:999px;padding:3px 10px;font-size:12px;background:var(--panel)}#pulsev .pl-chip b{margin:0 4px 0 2px}' +
    '#pulsev h3{font-size:16px;margin:18px 0 8px}#pulsev .pl-sec{margin:0 0 6px;color:var(--mute);font-size:12px}' +
    '#pulsev .pl-lean{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}#pulsev .pl-lc{border:1px solid var(--line);border-radius:14px;padding:14px;background:var(--panel)}#pulsev .pl-lc .tt{font-weight:800;font-size:15px}#pulsev .pl-lc .sb{color:var(--mute);font-size:12px}#pulsev .pl-lc .hd{font-weight:700;margin:8px 0 6px;font-size:14px}#pulsev .pl-lc p{margin:8px 0 0;font-size:13px;line-height:1.45;color:var(--mute)}' +
    '#pulsev .pl-g{position:relative;height:12px;border-radius:7px;background:linear-gradient(90deg,var(--dn),var(--line) 50%,var(--up));opacity:.9}#pulsev .pl-g i{position:absolute;top:-5px;width:6px;height:22px;border-radius:3px;background:var(--ink);box-shadow:0 0 0 2px var(--panel)}#pulsev .pl-gl{display:flex;justify-content:space-between;font-size:10px;color:var(--mute);margin-top:4px}' +
    '#pulsev .pl-rt{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}#pulsev .pl-rt div{border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--panel)}#pulsev .pl-rt small{display:block;color:var(--mute);font-size:11px}#pulsev .pl-rt b{font-size:20px;display:block;margin:2px 0}#pulsev .pl-rt span{font-size:11px;color:var(--mute);line-height:1.35;display:block}' +
    '#pulsev .pl-sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}#pulsev .pl-sc{border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--panel)}#pulsev .pl-sc .nm{font-weight:800;font-size:14px}#pulsev .pl-sc .et{color:var(--mute);font-size:11px;margin-bottom:8px}#pulsev .pl-ar{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:8px}#pulsev .pl-ar span{text-align:center;border-radius:6px;padding:4px 0;font-size:11px;background:var(--line);color:var(--mute)}#pulsev .pl-ar span b{display:block;font-size:14px}#pulsev .pl-ar .u{background:var(--up);color:#fff}#pulsev .pl-ar .d{background:var(--dn);color:#fff}#pulsev .pl-sc p{margin:0;font-size:12px;color:var(--mute);line-height:1.45}' +
    '#pulsev .pl-sn{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 8px}#pulsev .pl-b{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:6px 14px;font:inherit;font-size:13px;cursor:pointer}#pulsev .pl-b.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:700}' +
    '#pulsev .pl-so{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}#pulsev .pl-so div{border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:12px;background:var(--panel)}#pulsev .pl-so b{display:block;font-size:13px}' +
    '#pulsev .pl-feed{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:12px}#pulsev .pl-n{border:1px solid var(--line);border-radius:14px;padding:14px;background:var(--panel);display:flex;flex-direction:column;gap:10px}' +
    '#pulsev .pl-n .top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11px;color:var(--mute)}#pulsev .pl-n .tag{border:1px solid var(--line);border-radius:999px;padding:1px 8px}#pulsev .pl-n .hd{font-size:16px;font-weight:800;line-height:1.3}' +
    '#pulsev .pl-n p{margin:0;font-size:13px;line-height:1.5}#pulsev .pl-rc{display:flex;flex-wrap:wrap;gap:6px}#pulsev .pl-rc span{border-radius:8px;padding:3px 8px;font-size:12px;border:1px solid var(--line)}#pulsev .pl-rc .u{border-color:var(--up);color:var(--up)}#pulsev .pl-rc .d{border-color:var(--dn);color:var(--dn)}#pulsev .pl-rc small{color:var(--mute);margin-left:4px}' +
    '#pulsev .pl-hi{border-left:4px solid var(--accent);padding:6px 10px;background:var(--bg);border-radius:6px;font-size:12px;line-height:1.45}#pulsev .pl-hi b{display:block;font-size:11px;color:var(--mute);margin-bottom:2px;text-transform:uppercase;letter-spacing:.04em}' +
    '#pulsev .pl-tl{display:grid;grid-template-columns:1fr 1fr;gap:8px}#pulsev .pl-tl div{border:1px solid var(--line);border-radius:10px;padding:8px;font-size:12px;line-height:1.45}#pulsev .pl-tl b{display:block;font-size:11px;color:var(--mute);margin-bottom:2px}' +
    '#pulsev .pl-ft{display:flex;gap:10px;align-items:center;font-size:12px;color:var(--mute);flex-wrap:wrap}#pulsev .pl-ft a{color:inherit}#pulsev .pl-cf{display:inline-flex;gap:3px;align-items:center}#pulsev .pl-cf u{width:8px;height:8px;border-radius:50%;background:var(--line);text-decoration:none}#pulsev .pl-cf u.on{background:var(--ink)}' +
    '#pulsev .pl-cal{display:grid;gap:8px}#pulsev .pl-ci{display:grid;grid-template-columns:90px 1fr;gap:10px;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--panel);font-size:13px}#pulsev .pl-ci .dt{font-weight:800}#pulsev .pl-ci small{display:block;color:var(--mute);font-size:11px}#pulsev .pl-ci p{margin:2px 0 0;font-size:12px;color:var(--mute)}' +
    '#pulsev .pl-pb{width:100%;border-collapse:collapse;font-size:13px}#pulsev .pl-pb td{padding:8px;border-bottom:1px solid var(--line);vertical-align:top}#pulsev .pl-pb td:first-child{font-weight:700;width:34%}' +
    '#pulsev .pl-dis{color:var(--mute);font-size:12px;margin:18px 0 4px;line-height:1.5}' +
    '@media(max-width:620px){#pulsev .pl-feed{grid-template-columns:1fr}#pulsev .pl-tl{grid-template-columns:1fr}#pulsev .pl-ci{grid-template-columns:1fr}}';

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function dayNum(iso) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ""); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000 : NaN; }
  function today() { var d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000; }
  function when(iso) { var n = dayNum(iso) - today(); return isNaN(n) ? "" : n < 0 ? "passed" : n === 0 ? "today" : n === 1 ? "tomorrow" : "in " + n + " days"; }
  function fmt(iso) { return new Date(dayNum(iso) * 86400000).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }); }
  function cls(d) { return d > 0 ? "u" : d < 0 ? "d" : ""; }
  function arrow(d) { return d > 0 ? "▲" : d < 0 ? "▼" : "◆"; }

  function lean(L) {
    var pos = Math.max(0, Math.min(100, (L.s + 100) / 2));
    return '<div class="pl-lc"><div class="tt">' + esc(L.h) + '</div><div class="sb">' + esc(L.sub) + '</div><div class="hd">' + esc(L.t) + '</div>' +
      '<div class="pl-g" title="Our lean: ' + esc(L.s) + ' on a -100 to +100 scale"><i style="left:calc(' + pos + '% - 3px)"></i></div><div class="pl-gl"><span>Bearish</span><span>Neutral</span><span>Bullish</span></div><p>' + esc(L.why) + '</p></div>';
  }
  function sector(S) {
    var lab = ["Today", "2-4 wks", "6-12 mo"];
    return '<div class="pl-sc"><div class="nm">' + esc(S.s) + '</div><div class="et">' + esc(S.etf) + '</div><div class="pl-ar">' + S.d.map(function (d, i) { return '<span class="' + cls(d) + '"><b>' + arrow(d) + '</b>' + lab[i] + '</span>'; }).join("") + '</div><p>' + esc(S.why) + '</p></div>';
  }
  function newsCard(n) {
    var cf = ""; for (var i = 1; i <= 3; i++) cf += '<u class="' + (i <= n.conf ? "on" : "") + '"></u>';
    var catName = (DATA.cats.filter(function (c) { return c[0] === n.cat; })[0] || [0, n.cat])[1];
    return '<div class="pl-n"><div class="top"><span class="tag">' + esc(catName) + '</span><span>' + esc(n.when) + '</span></div><div class="hd">' + esc(n.head) + '</div>' +
      '<p><b>What it means:</b> ' + esc(n.mean) + '</p>' +
      '<div class="pl-rc">' + n.react.map(function (r) { return '<span class="' + cls(r[1]) + '">' + arrow(r[1]) + ' ' + esc(r[0]) + '<small>' + esc(r[2]) + '</small></span>'; }).join("") + '</div>' +
      '<div class="pl-hi"><b>What history says</b>' + esc(n.hist) + (n.histU && /^https:\/\//.test(n.histU) ? ' <a href="' + esc(n.histU) + '" target="_blank" rel="noopener">' + esc(n.histN || "source") + ' ↗</a>' : "") + '</div>' +
      '<div class="pl-tl"><div><b>TRADE TODAY</b>' + esc(n.today) + '</div><div><b>INVEST LATER</b>' + esc(n.later) + '</div></div>' +
      '<div class="pl-ft"><span class="pl-cf" title="How sure we are: more dots = more evidence">' + cf + '</span><span>Confidence</span><a href="' + esc(/^https:\/\//.test(n.src) ? n.src : "#") + '" target="_blank" rel="noopener">' + esc(n.srcN) + ' ↗</a></div></div>';
  }
  function tape() {
    if (!ST.lq) return "";
    return '<div class="pl-tape">' + TAPE.filter(function (t) { return ST.lq[t] && ST.lq[t].p; }).map(function (t) { var q = ST.lq[t], d = Number(q.dp); return '<span class="pl-chip">' + esc(t) + '<b>$' + Number(q.p).toFixed(2) + '</b><span class="' + (d >= 0 ? "up" : "dn") + '" style="color:var(--' + (d >= 0 ? "gain" : "loss") + ')">' + (d >= 0 ? "+" : "") + d.toFixed(2) + '% live</span></span>'; }).join("") + '</div>';
  }

  function render(el) {
    var D = DATA, sc = D.scen.opts.filter(function (o) { return o.k === ST.scen; })[0] || D.scen.opts[0];
    var feed = D.news.filter(function (n) { return ST.cat === "all" || n.cat === ST.cat; });
    el.innerHTML = '<style>' + CSS + '</style><div class="pl-h"><h2>Market Pulse</h2><span class="pl-sub">What the news may mean for sectors, and how it played out before · ' + esc(D.asof) + '</span></div>' +
      '<div class="pl-hero"><b>' + esc(D.headline) + '</b><p>' + esc(D.regime) + '</p></div>' + tape() +
      '<h3>Where we lean</h3><div class="pl-lean">' + D.lean.map(lean).join("") + '</div>' +
      '<h3>The rates dashboard</h3><div class="pl-rt">' + D.rates.map(function (r) { return '<div><small>' + esc(r.l) + '</small><b>' + esc(r.v) + '</b><span>' + esc(r.n) + '</span></div>'; }).join("") + '</div>' +
      '<h3>Sector heat map</h3><p class="pl-sec">▲ lean up, ▼ lean down, ◆ no clear lean. Three time frames: day trade, swing, investment.</p><div class="pl-sg">' + D.sectors.map(sector).join("") + '</div>' +
      '<h3>' + esc(D.scen.title) + '</h3><div class="pl-sn">' + D.scen.opts.map(function (o) { return '<button type="button" class="pl-b ' + (o.k === sc.k ? "on" : "") + '" data-plsc="' + esc(o.k) + '">' + esc(o.l) + '</button>'; }).join("") + '</div><div class="pl-so">' + sc.out.map(function (o) { return '<div><b class="' + cls(o[1]) + '" style="color:var(--' + (o[1] > 0 ? "gain" : o[1] < 0 ? "loss" : "mute") + ')">' + arrow(o[1]) + ' ' + esc(o[0]) + '</b>' + esc(o[2]) + '</div>'; }).join("") + '</div>' +
      '<h3>Breaking news and what to do with it</h3><div class="pl-sn">' + D.cats.map(function (c) { return '<button type="button" class="pl-b ' + (ST.cat === c[0] ? "on" : "") + '" data-plc="' + esc(c[0]) + '">' + esc(c[1]) + '</button>'; }).join("") + '</div>' +
      '<div class="pl-feed">' + (feed.length ? feed.map(newsCard).join("") : '<p>Nothing in this category today.</p>') + '</div>' +
      '<h3>Calendar: the next events that move markets</h3><div class="pl-cal">' + D.calendar.filter(function (c) { return dayNum(c.d) - today() >= -1; }).map(function (c) { return '<div class="pl-ci"><div class="dt">' + esc(fmt(c.d)) + '<small>' + esc(when(c.d)) + '</small></div><div><b>' + esc(c.t) + '</b><p>' + esc(c.usual) + '</p></div></div>'; }).join("") + '</div>' +
      '<h3>The playbook: if this, then that</h3><table class="pl-pb"><tbody>' + D.playbook.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join("") + '</tbody></table>' +
      '<p class="pl-dis">Built from the dated articles linked on each card. "Our lean" and the arrows are judgment calls from those sources, not predictions, and many first-day moves reverse. Items marked "rule of thumb" are general market patterns, not statistics from a study. Past reactions do not guarantee future ones. This is education, not investment advice; know your stop before you trade.</p>';
    live(el);
  }

  function live(el) {
    var a = window.stockspotSocial; if (!a || !a.quotes || ST.lq) return;
    a.quotes(TAPE).then(function (r) { if (r && r.quotes) { ST.lq = r.quotes; var t = el.querySelector(".pl-hero"); if (t && !el.querySelector(".pl-tape")) t.insertAdjacentHTML("afterend", tape()); } }).catch(function () { });
  }

  function load() {
    return fetch("pulse-data.json?v=" + Math.floor(Date.now() / 3600000)).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { if (j && j.news && j.news.length) { DATA = j; ST.loaded = true; } }).catch(function () { });
  }

  window.MarketPulse = { mount: function (el) {
    (ST.loaded ? Promise.resolve() : load()).then(function () { if (!DATA) { el.textContent = "Could not load Market Pulse. Refresh the page."; return; } render(el); });
    if (bound) return; bound = true;
    el.addEventListener("click", function (e) {
      var b;
      if ((b = e.target.closest("[data-plc]"))) { ST.cat = b.getAttribute("data-plc"); render(el); }
      else if ((b = e.target.closest("[data-plsc]"))) { ST.scen = b.getAttribute("data-plsc"); render(el); }
    });
  } };
})();
