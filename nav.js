/* Sidebar organizer: grouped, color-coded, collapsible sections with icons, plus Cmd/Ctrl+K quick search.
   window.NAV_MODES = true switches to the Trade / Invest / Research mode switcher instead. */
(function () {
  "use strict";
  var MODES = window.NAV_MODES === true;
  var side = document.getElementById("side");
  if (!side) return;

  var P = {
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    candles: '<path d="M7 3v4M7 17v4M17 6v3M17 15v5"/><rect x="4.5" y="7" width="5" height="10" rx="1"/><rect x="14.5" y="9" width="5" height="6" rx="1"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    news: '<path d="M4 4h13v16H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v10a2 2 0 0 1-2 2"/><path d="M8 8h6M8 12h6M8 16h4"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    pie: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    ladder: '<path d="M8 3v18M16 3v18M8 7h8M8 12h8M8 17h8"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7.5 15h9"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17v4M17 19h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    chev: '<path d="M6 9l6 6 6-6"/>'
  };
  function svg(k, cls) { return '<svg class="' + (cls || "ni") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[k] + '</svg>'; }

  var ITEMS = {
    navhome: ["list", "Watchlist"], navals: ["bell", "Alerts"], navplan: ["target", "Trade Plan"], navfut: ["candles", "Futures"],
    navmov: ["zap", "Parabolic movers"], navpulse: ["pulse", "Market pulse"], navnews: ["news", "News"], navzone: ["layers", "Zones"],
    navinv: ["pie", "Investments"], navrl: ["ladder", "Risk Ladder"],
    navstudio: ["book", "Studio"], navsc: ["award", "Scorecard"], navlab: ["flask", "Setup Lab"], navprac: ["play", "Practice charts"], navcoach: ["spark", "AI Coach"],
    navprofile: ["user", "Profile"], navpub: ["send", "Publishes"], navnotif: ["inbox", "Notifications"], navgd: ["help", "How-To"], navset: ["gear", "Settings"]
  };
  var SECS = [
    { id: "today", t: "Today", c: "#e8782a", ids: ["navhome", "navals", "navplan", "navfut"] },
    { id: "research", t: "Research", c: "#2b7de0", ids: ["navpulse", "navmov", "navnews", "navzone"] },
    { id: "portfolio", t: "Portfolio", c: "#1f9d55", ids: ["navinv", "navrl"] },
    { id: "improve", t: "Improve", c: "#8b4fe0", ids: ["navstudio", "navsc", "navlab", "navprac", "navcoach"] },
    { id: "you", t: "You", c: "#7d8793", ids: ["navprofile", "navpub", "navnotif", "navgd", "navset"] }
  ];
  var YOU = ["navprofile", "navpub", "navnotif", "navgd", "navset"];
  var MODEDEF = {
    trade: { t: "Trade", c: "#e8782a", ic: "zap", home: "navhome", tag: "Your trading day",
      g: [["Today", ["navhome", "navals", "navplan", "navfut", "navmov"]], ["Review & practice", ["navstudio", "navsc", "navlab", "navprac", "navzone", "navrl", "navcoach"]], ["You", YOU]] },
    invest: { t: "Invest", c: "#1f9d55", ic: "pie", home: "navinv", tag: "Your long-term portfolio",
      g: [["My portfolio", ["navinv", "navrl", "navhome"]], ["Find ideas", ["navmov", "navpulse", "navnews"]], ["You", YOU]] },
    research: { t: "Research", c: "#2b7de0", ic: "search", home: "navpulse", tag: "Market research tools",
      g: [["Market", ["navpulse", "navnews", "navmov", "navfut"]], ["Charts & zones", ["navzone", "navprac", "navlab"]], ["My list", ["navhome", "navals"]], ["You", YOU]] }
  };

  var CSS = '#side .nsearch{display:flex;align-items:center;gap:9px;width:100%;margin:0 0 12px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--mute);font:500 .88rem "Instrument Sans",sans-serif;cursor:pointer;text-align:left;white-space:nowrap}#side .nsearch:hover{border-color:var(--accent);color:var(--ink)}#side .nsearch svg{width:15px;height:15px;flex:none}#side .nsearch kbd{white-space:nowrap;margin-left:auto;font:600 .68rem "Instrument Sans",sans-serif;border:1px solid var(--line);border-radius:5px;padding:2px 6px;background:var(--panel);color:var(--mute)}' +
    '.ns{margin:0 0 4px}.nsh{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;padding:9px 10px 5px;color:var(--mute);font:700 .66rem "Instrument Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;text-align:left}.nsh:hover{color:var(--ink)}.nsh i{width:8px;height:8px;border-radius:50%;background:var(--sc);flex:none}.nsh .nsc{width:13px;height:13px;margin-left:auto;transition:transform .2s;flex:none}.ns.c .nsh .nsc{transform:rotate(-90deg)}.ns.c.has-on .nsh::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--sc);order:3}' +
    '.nsb{display:grid;grid-template-rows:1fr;transition:grid-template-rows .22s ease}.ns.c .nsb{grid-template-rows:0fr}.nsi{overflow:hidden;min-height:0}' +
    '#side .ns .nav,#side .nmain .nav{position:relative;margin:1px 0;padding:7px 10px 7px 12px;border-radius:9px;color:var(--mute)}#side .nav .nl{display:flex;align-items:center;gap:11px;min-width:0}#side .nav .ni{width:18px;height:18px;flex:none;color:var(--sc,var(--mute));opacity:.7;transition:opacity .15s,transform .15s}#side .nav:hover .ni{opacity:1;transform:scale(1.08)}#side .nav:hover{color:var(--ink);background:var(--bg)}' +
    '#side .ns .nav.on,#side .nmain .nav.on{background:color-mix(in srgb,var(--sc,var(--accent)) 14%,transparent);color:var(--ink);font-weight:600}#side .nav.on .ni{opacity:1}#side .ns .nav.on::before,#side .nmain .nav.on::before{content:"";position:absolute;left:0;top:7px;bottom:7px;width:3px;border-radius:3px;background:var(--sc,var(--accent))}' +
    '.nmodes{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;margin:0 0 6px;background:var(--bg);border:1px solid var(--line);border-radius:14px}.nmodes button{display:flex;flex-direction:column;align-items:center;gap:4px;border:0;border-radius:10px;background:none;color:var(--mute);padding:9px 2px 8px;font:700 .74rem "Instrument Sans",sans-serif;cursor:pointer;transition:background .15s,color .15s}.nmodes button svg{width:19px;height:19px;color:var(--c)}.nmodes button:hover{color:var(--ink)}.nmodes button.on{background:color-mix(in srgb,var(--c) 16%,var(--panel));color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--c)}' +
    '.nmtag{margin:0 2px 8px;font-size:.78rem;color:var(--mute);text-align:center}.nmh{margin:12px 0 3px;padding:0 10px;font:700 .66rem "Instrument Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}.nmhold{display:none}' +
    'html.nm-on::before{content:"";position:fixed;top:0;left:0;right:0;height:3px;background:var(--mc);z-index:80;transition:background .25s}' +
    '.np-ov{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.45);display:flex;align-items:flex-start;justify-content:center;padding:12vh 16px 0}.np-box{width:min(580px,100%);background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.4);overflow:hidden}.np-in{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line)}.np-in svg{width:18px;height:18px;color:var(--mute);flex:none}.np-in input{flex:1;min-width:0;border:0;outline:0;background:none;color:var(--ink);font:500 1.05rem "Instrument Sans",sans-serif}.np-in kbd{font:600 .68rem sans-serif;border:1px solid var(--line);border-radius:5px;padding:2px 6px;color:var(--mute)}' +
    '.np-l{max-height:min(52vh,420px);overflow-y:auto;padding:6px}.np-g{padding:8px 10px 4px;font:700 .64rem "Instrument Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}.np-it{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;color:var(--ink);padding:9px 10px;border-radius:10px;font:500 .95rem "Instrument Sans",sans-serif;cursor:pointer;text-align:left}.np-it.on{background:var(--bg)}.np-it svg{width:18px;height:18px;flex:none;color:var(--c,var(--mute))}.np-it small{margin-left:auto;color:var(--mute);font-size:.76rem}.np-e{padding:18px;text-align:center;color:var(--mute)}' +
    '@media(max-width:760px){.np-ov{padding-top:6vh}}';
  var st = document.createElement("style"); st.id = "nav-css"; st.textContent = CSS; document.head.appendChild(st);

  function $(id) { return document.getElementById(id); }
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function decorate(id, color) {
    var b = $(id); if (!b || b.getAttribute("data-ni")) return b;
    b.setAttribute("data-ni", "1"); if (color) b.style.setProperty("--sc", color);
    var t = b.firstChild;
    if (t && t.nodeType === 3) {
      var s = document.createElement("span"); s.className = "nl"; s.innerHTML = svg(ITEMS[id][0]);
      s.appendChild(document.createTextNode(t.textContent.trim())); b.replaceChild(s, t);
    }
    return b;
  }

  var anchor = $("pnlcard") || side.querySelector(".brand");
  var searchBtn = document.createElement("button"); searchBtn.type = "button"; searchBtn.className = "nsearch";
  searchBtn.innerHTML = svg("search", "") + '<span>Search or jump to…</span><kbd>' + (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K") + '</kbd>';
  anchor.insertAdjacentElement("afterend", searchBtn);

  var secEls = [], mode = null, main = null, hold = null, tagEl = null, modeBtns = {};

  if (!MODES) {
    var collapsed = lsGet("ss-navsec", {}), prev = searchBtn;
    SECS.forEach(function (s) {
      var d = document.createElement("div"); d.className = "ns" + (collapsed[s.id] ? " c" : ""); d.style.setProperty("--sc", s.c); d.setAttribute("data-sec", s.id);
      d.innerHTML = '<button type="button" class="nsh" aria-expanded="' + (!collapsed[s.id]) + '"><i></i><span>' + s.t + '</span>' + svg("chev", "nsc") + '</button><div class="nsb"><div class="nsi"></div></div>';
      var body = d.querySelector(".nsi");
      s.ids.forEach(function (id) { var b = decorate(id, s.c); if (b) body.appendChild(b); });
      prev.insertAdjacentElement("afterend", d); prev = d; secEls.push(d);
      d.querySelector(".nsh").addEventListener("click", function () {
        var c = d.classList.toggle("c"); this.setAttribute("aria-expanded", String(!c)); collapsed[s.id] = c; lsSet("ss-navsec", collapsed);
      });
    });
  } else {
    document.documentElement.classList.add("nm-on");
    var mw = document.createElement("div"); mw.className = "nmodes";
    Object.keys(MODEDEF).forEach(function (k) {
      var m = MODEDEF[k], b = document.createElement("button"); b.type = "button"; b.style.setProperty("--c", m.c); b.setAttribute("data-mode", k);
      b.innerHTML = svg(m.ic, "") + '<span>' + m.t + '</span>'; modeBtns[k] = b; mw.appendChild(b);
      b.addEventListener("click", function () { setMode(k, true); });
    });
    tagEl = document.createElement("div"); tagEl.className = "nmtag";
    main = document.createElement("div"); main.className = "nmain"; hold = document.createElement("div"); hold.className = "nmhold";
    searchBtn.insertAdjacentElement("afterend", mw); mw.insertAdjacentElement("afterend", tagEl); tagEl.insertAdjacentElement("afterend", main); main.insertAdjacentElement("afterend", hold);
    Object.keys(ITEMS).forEach(function (id) { var b = decorate(id); if (b) hold.appendChild(b); });
    mode = lsGet("ss-navmode", "trade"); if (!MODEDEF[mode]) mode = "trade";
  }

  function setMode(k, go) {
    mode = k; lsSet("ss-navmode", k); var m = MODEDEF[k];
    document.documentElement.style.setProperty("--mc", m.c); tagEl.textContent = m.tag;
    Object.keys(modeBtns).forEach(function (x) { modeBtns[x].classList.toggle("on", x === k); });
    [].slice.call(main.querySelectorAll("button.nav")).forEach(function (b) { hold.appendChild(b); });
    main.innerHTML = "";
    m.g.forEach(function (g) {
      var h = document.createElement("div"); h.className = "nmh"; h.textContent = g[0]; main.appendChild(h);
      g[1].forEach(function (id) { var b = $(id); if (b) { b.style.setProperty("--sc", m.c); main.appendChild(b); } });
    });
    if (go) { var hb = $(m.home); if (hb) hb.click(); }
  }
  if (MODES) setMode(mode, false);

  function syncActive() {
    var on = side.querySelector(".nav.on[data-ni]");
    secEls.forEach(function (d) {
      var has = !!(on && d.contains(on)); d.classList.toggle("has-on", has);
      if (has && d.classList.contains("c")) { d.classList.remove("c"); d.querySelector(".nsh").setAttribute("aria-expanded", "true"); }
    });
    if (MODES && on && !main.contains(on)) {
      var k = Object.keys(MODEDEF).filter(function (x) { return MODEDEF[x].g.some(function (g) { return g[1].indexOf(on.id) > -1; }); })[0];
      if (k && k !== mode) setMode(k, false);
    }
  }
  new MutationObserver(syncActive).observe(side, { attributes: true, attributeFilter: ["class"], subtree: true });
  syncActive();

  /* ---------- quick search (Cmd/Ctrl+K) ---------- */
  var pal = null, sel = 0, rows = [];
  function secOf(id) { var s = SECS.filter(function (x) { return x.ids.indexOf(id) > -1; })[0]; return s || { t: "", c: "#888" }; }
  function results(q) {
    q = q.trim().toLowerCase(); var out = [];
    Object.keys(ITEMS).forEach(function (id) {
      var s = secOf(id), l = ITEMS[id][1];
      if (!q || l.toLowerCase().indexOf(q) > -1 || s.t.toLowerCase().indexOf(q) > -1) out.push({ g: "Pages", ic: ITEMS[id][0], c: s.c, l: l, tag: s.t, run: function () { var b = $(id); if (b) b.click(); } });
    });
    [].forEach.call(document.querySelectorAll("#pglist .navrow .nav"), function (b) {
      var l = (b.textContent || "").trim(); if (l && (!q || l.toLowerCase().indexOf(q) > -1)) out.push({ g: "Your pages", ic: "book", c: "#7d8793", l: l, tag: "Page", run: function () { b.click(); } });
    });
    if (/^[a-z]{1,5}$/i.test(q) && q) {
      var T = q.toUpperCase();
      out.push({ g: "Ticker", ic: "candles", c: "#e8782a", l: "Open $" + T + " page and chart", tag: "", run: function () { var t = document.createElement("button"); t.className = "tk"; t.setAttribute("data-tk", T); t.setAttribute("data-sci", "1"); t.style.display = "none"; document.body.appendChild(t); t.click(); t.remove(); } });
      if (window.StockWatch) out.push({ g: "Ticker", ic: "list", c: "#1f9d55", l: window.StockWatch.has(T) ? "$" + T + " is on your watchlist" : "Add $" + T + " to watchlist", tag: "", run: function () { if (!window.StockWatch.has(T)) window.StockWatch.add(T); } });
    }
    return out;
  }
  function paint() {
    var q = pal.querySelector("input").value; rows = results(q); if (sel >= rows.length) sel = Math.max(0, rows.length - 1);
    var list = pal.querySelector(".np-l"), h = "", g = "";
    rows.forEach(function (r, i) {
      if (r.g !== g) { g = r.g; h += '<div class="np-g">' + g + '</div>'; }
      h += '<button type="button" class="np-it' + (i === sel ? " on" : "") + '" data-i="' + i + '" style="--c:' + r.c + '">' + svg(r.ic, "") + '<span>' + r.l.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }) + '</span>' + (r.tag ? '<small>' + r.tag + '</small>' : '') + '</button>';
    });
    list.innerHTML = h || '<div class="np-e">No matches. Type a ticker like NVDA to open it.</div>';
    var on = list.querySelector(".np-it.on"); if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest" });
  }
  function closePal() { if (pal) { pal.remove(); pal = null; } }
  function runRow(i) { var r = rows[i]; if (!r) return; closePal(); r.run(); }
  function openPal() {
    if (pal) return closePal();
    pal = document.createElement("div"); pal.className = "np-ov";
    pal.innerHTML = '<div class="np-box" role="dialog" aria-label="Quick search"><div class="np-in">' + svg("search", "") + '<input type="text" placeholder="Jump to a page or type a ticker" aria-label="Search" autocomplete="off" spellcheck="false"><kbd>esc</kbd></div><div class="np-l"></div></div>';
    document.body.appendChild(pal); sel = 0; paint();
    var inp = pal.querySelector("input"); inp.focus();
    inp.addEventListener("input", function () { sel = 0; paint(); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(rows.length - 1, sel + 1); paint(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
      else if (e.key === "Enter") { e.preventDefault(); runRow(sel); }
      else if (e.key === "Escape") closePal();
    });
    pal.addEventListener("mousedown", function (e) { if (e.target === pal) closePal(); var b = e.target.closest(".np-it"); if (b) { e.preventDefault(); runRow(+b.getAttribute("data-i")); } });
  }
  searchBtn.addEventListener("click", openPal);
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); openPal(); }
  });
})();
