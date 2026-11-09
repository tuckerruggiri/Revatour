/* Customizable sidebar: your own tabs and groups, each with its own color and icon, pages you can move around.
   Layout is saved in this browser and synced to your account when signed in. Cmd/Ctrl+K opens quick search. */
(function () {
  "use strict";
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
    chev: '<path d="M6 9l6 6 6-6"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    flame: '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    dollar: '<path d="M12 3v18M16 7.5c-1-1-2.5-1.5-4-1.5-2.5 0-4 1.3-4 3s1.5 2.5 4 3 4 1.3 4 3-1.5 3-4 3c-1.6 0-3.1-.6-4.2-1.7"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    grip: '<path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01"/>'
  };
  var PICK = ["list", "bell", "target", "candles", "zap", "pulse", "news", "layers", "pie", "ladder", "book", "award", "flask", "play", "spark", "user", "star", "flame", "briefcase", "home", "globe", "trend", "heart", "dollar"];
  var COLORS = ["#e8782a", "#d4a017", "#1f9d55", "#0ea5a4", "#2b7de0", "#6366f1", "#8b4fe0", "#ec4899", "#e5484d", "#7d8793"];
  function svg(k, cls) { return '<svg class="' + (cls == null ? "ni" : cls) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[k] || P.list) + '</svg>'; }

  var ITEMS = {
    navhome: ["list", "Watchlist"], navals: ["bell", "Alerts"], navplan: ["target", "Trade Plan"], navfut: ["candles", "Futures"],
    navmov: ["zap", "Parabolic movers"], navpulse: ["pulse", "Market pulse"], navnews: ["news", "News"], navzone: ["layers", "Zones"],
    navinv: ["pie", "Investments"], navrl: ["ladder", "Risk Ladder"],
    navstudio: ["book", "Studio"], navsc: ["award", "Scorecard"], navlab: ["flask", "Setup Lab"], navprac: ["play", "Practice charts"], navcoach: ["spark", "AI Coach"],
    navprofile: ["user", "Profile"], navpub: ["send", "Publishes"], navnotif: ["inbox", "Notifications"], navgd: ["help", "How-To"], navset: ["gear", "Settings"]
  };
  var YOU = ["navprofile", "navpub", "navnotif", "navgd", "navset"];
  var DEF = [
    { id: "trade", n: "Trade", c: "#e8782a", ic: "zap", g: [["Today", "#e8782a", "", ["navhome", "navals", "navplan", "navfut", "navmov"]], ["Review & practice", "#8b4fe0", "", ["navstudio", "navsc", "navlab", "navprac", "navzone", "navrl", "navcoach"]], ["You", "#7d8793", "", YOU]] },
    { id: "invest", n: "Invest", c: "#1f9d55", ic: "pie", g: [["My portfolio", "#1f9d55", "", ["navinv", "navrl", "navhome"]], ["Find ideas", "#2b7de0", "", ["navmov", "navpulse", "navnews"]], ["You", "#7d8793", "", YOU]] },
    { id: "research", n: "Research", c: "#2b7de0", ic: "search", g: [["Market", "#2b7de0", "", ["navpulse", "navnews", "navmov", "navfut"]], ["Charts & zones", "#8b4fe0", "", ["navzone", "navprac", "navlab"]], ["My list", "#e8782a", "", ["navhome", "navals"]], ["You", "#7d8793", "", YOU]] }
  ];
  function defaults() {
    return { ts: 0, active: "trade", tabs: DEF.map(function (t) {
      return { id: t.id, n: t.n, c: t.c, ic: t.ic, g: t.g.map(function (g, i) { return { id: t.id + i, n: g[0], c: g[1], ic: g[2], ids: g[3].slice() }; }) };
    }) };
  }

  var CSS = '#side .nsrow{display:flex;gap:6px;margin:0 0 12px}#side .nsearch{box-sizing:border-box;overflow:hidden;flex:1;min-width:0;display:flex;align-items:center;gap:9px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--mute);font:500 .88rem "Instrument Sans",sans-serif;cursor:pointer;text-align:left;white-space:nowrap}#side .nsearch:hover{border-color:var(--accent);color:var(--ink)}#side .nsearch svg{width:15px;height:15px;flex:none}#side .nsearch kbd{white-space:nowrap;margin-left:auto;font:600 .68rem "Instrument Sans",sans-serif;border:1px solid var(--line);border-radius:5px;padding:2px 6px;background:var(--panel);color:var(--mute)}' +
    '#side .nedbtn{padding:0;flex:none;width:38px;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--mute);cursor:pointer}#side .nedbtn svg{width:16px;height:16px}#side .nedbtn:hover{color:var(--ink);border-color:var(--accent)}#side.nedit .nedbtn{background:var(--ink);color:var(--panel);border-color:var(--ink)}' +
    '.ns{margin:0 0 4px}.nsh{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;padding:9px 10px 5px;color:var(--mute);font:700 .66rem "Instrument Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;text-align:left}.nsh:hover{color:var(--ink)}.nsh i{width:8px;height:8px;border-radius:50%;background:var(--sc);flex:none}.nsh .gi{width:14px;height:14px;color:var(--sc);flex:none}.nsh .nsc{width:13px;height:13px;margin-left:auto;transition:transform .2s;flex:none}.ns.c .nsh .nsc{transform:rotate(-90deg)}.ns.c.has-on .nsh::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--sc);order:3}' +
    '.nsb{display:grid;grid-template-rows:1fr;transition:grid-template-rows .22s ease}.ns.c .nsb{grid-template-rows:0fr}.nsi{overflow:hidden;min-height:0}' +
    '#side .ns .nav{position:relative;margin:1px 0;padding:7px 10px 7px 12px;border-radius:9px;color:var(--mute)}#side .nav .nl{display:flex;align-items:center;gap:11px;min-width:0}#side .nav .ni{width:18px;height:18px;flex:none;color:var(--sc,var(--mute));opacity:.7;transition:opacity .15s,transform .15s}#side .nav:hover .ni{opacity:1;transform:scale(1.08)}#side .nav:hover{color:var(--ink);background:var(--bg)}' +
    '#side .ns .nav.on{background:color-mix(in srgb,var(--sc,var(--accent)) 14%,transparent);color:var(--ink);font-weight:600}#side .nav.on .ni{opacity:1}#side .ns .nav.on::before{content:"";position:absolute;left:0;top:7px;bottom:7px;width:3px;border-radius:3px;background:var(--sc,var(--accent))}' +
    '.nmodes{display:grid;grid-template-columns:repeat(auto-fit,minmax(58px,1fr));gap:4px;padding:4px;margin:0 0 6px;background:var(--bg);border:1px solid var(--line);border-radius:14px}.nmodes button{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;border:0;border-radius:10px;background:none;color:var(--mute);padding:9px 2px 8px;font:700 .74rem "Instrument Sans",sans-serif;cursor:pointer;transition:background .15s,color .15s}.nmodes button span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nmodes button svg{width:19px;height:19px;color:var(--c)}.nmodes button:hover{color:var(--ink)}.nmodes button.on{background:color-mix(in srgb,var(--c) 16%,var(--panel));color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--c)}.nmodes .nm-add{color:var(--mute);border:1.5px dashed var(--line)}.nmodes .nm-add svg{color:var(--mute)}' +
    '.nmhold{display:none}html.nm-on::before{content:"";position:fixed;top:0;left:0;right:0;height:3px;background:var(--mc);z-index:80;transition:background .25s}' +
    '@media(min-width:761px){.shell{transition:grid-template-columns .25s ease}html.nav-editing .shell{grid-template-columns:330px minmax(0,1fr)}}.ned-r{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px 4px 4px}.ned-sw{padding:0;flex:none;width:30px;height:30px;border-radius:9px;border:0;display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}.ned-sw svg{width:16px;height:16px}.ned-sw i{width:10px;height:10px;border-radius:50%;background:#fff;opacity:.9}' +
    '.ned-in{flex:1 1 120px;min-width:0;box-sizing:border-box;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:600 .86rem "Instrument Sans",sans-serif}.ned-b{padding:0;flex:none;width:26px;height:26px;border:0;border-radius:7px;background:none;color:var(--mute);display:flex;align-items:center;justify-content:center;cursor:pointer}.ned-b:hover{background:var(--bg);color:var(--ink)}.ned-b.dg:hover{color:var(--loss)}.ned-b svg,.ned-sw svg,.nedbtn svg{flex:none}.ned-b svg{width:14px;height:14px}.ned-b.arm{width:auto;padding:0 8px!important;background:var(--loss);color:#fff;font:700 .7rem sans-serif}' +
    '.npp{margin:2px 4px 8px;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--bg)}.npp-l{margin:0 0 6px;font:700 .62rem "Instrument Sans",sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--mute)}.npp-sw{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.npp-sw button,.npp-sw label{width:22px;height:22px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;box-sizing:border-box}.npp-sw button.on{border-color:var(--ink)}.npp-sw label{position:relative;background:conic-gradient(red,yellow,lime,aqua,blue,magenta,red);overflow:hidden}.npp-sw label input{position:absolute;inset:-6px;opacity:0;cursor:pointer}' +
    '.npp-ic{display:flex;flex-wrap:wrap;gap:4px}.npp-ic button{width:28px;height:28px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--mute);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}.npp-ic button svg{width:15px;height:15px}.npp-ic button:hover{color:var(--ink)}.npp-ic button.on{background:var(--ink);color:var(--panel);border-color:var(--ink)}.npp-ic .no{width:auto;padding:0 8px;font:600 .7rem sans-serif}' +
    '.ned-body{margin:0 0 4px;padding:2px 0;border-radius:10px;min-height:30px}.ned-body.over,.ned-tray.over{background:color-mix(in srgb,var(--sc,var(--accent)) 12%,transparent);outline:2px dashed var(--sc,var(--accent));outline-offset:-2px}.nr{display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:9px;color:var(--ink);font:500 .88rem "Instrument Sans",sans-serif;cursor:grab;background:var(--panel)}.nr:hover{background:var(--bg)}.nr.drag{opacity:.4}.nr .grip{width:14px;height:14px;color:var(--mute);flex:none}.nr .ni{width:17px;height:17px;flex:none;color:var(--sc,var(--mute))}.nr span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nr select{flex:none;max-width:96px;border:1px solid var(--line);border-radius:7px;background:var(--bg);color:var(--mute);font:600 .7rem sans-serif;padding:3px 4px}' +
    '.ned-empty{padding:8px 10px;color:var(--mute);font-size:.78rem;font-style:italic}.ned-tray{margin-top:10px;padding:8px 6px;border:1.5px dashed var(--line);border-radius:12px;--sc:var(--mute)}.ned-tray .npp-l{padding:0 4px}.ned-ft{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 4px}.ned-ft button{flex:1;border:1.5px dashed var(--line);border-radius:10px;background:none;color:var(--mute);padding:9px 8px;font:700 .78rem "Instrument Sans",sans-serif;cursor:pointer;white-space:nowrap}.ned-ft button:hover{color:var(--ink);border-color:var(--accent)}.ned-ft button.arm{background:var(--loss);color:#fff;border-color:var(--loss)}.ned-note{margin:6px 4px 0;font-size:.74rem;color:var(--mute);line-height:1.4}.ned-tabbox{margin:2px 0 10px;padding:6px 6px 2px;border:1px solid var(--line);border-radius:12px;background:var(--bg)}.ned-tabbox .npp{background:var(--panel)}' +
    '.np-ov{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.45);display:flex;align-items:flex-start;justify-content:center;padding:12vh 16px 0}.np-box{width:min(580px,100%);background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.4);overflow:hidden}.np-in{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line)}.np-in svg{width:18px;height:18px;color:var(--mute);flex:none}.np-in input{flex:1;min-width:0;border:0;outline:0;background:none;color:var(--ink);font:500 1.05rem "Instrument Sans",sans-serif}.np-in kbd{font:600 .68rem sans-serif;border:1px solid var(--line);border-radius:5px;padding:2px 6px;color:var(--mute)}' +
    '.np-l{max-height:min(52vh,420px);overflow-y:auto;padding:6px}.np-g{padding:8px 10px 4px;font:700 .64rem "Instrument Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}.np-it{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;color:var(--ink);padding:9px 10px;border-radius:10px;font:500 .95rem "Instrument Sans",sans-serif;cursor:pointer;text-align:left}.np-it.on{background:var(--bg)}.np-it svg{width:18px;height:18px;flex:none;color:var(--c,var(--mute))}.np-it small{margin-left:auto;color:var(--mute);font-size:.76rem}.np-e{padding:18px;text-align:center;color:var(--mute)}@media(max-width:760px){.np-ov{padding-top:6vh}}';
  var st = document.createElement("style"); st.id = "nav-css"; st.textContent = CSS; document.head.appendChild(st);

  function $(id) { return document.getElementById(id); }
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function uid() { return "g" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function hex(c) { return /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#7d8793"; }

  function decorate(id) {
    var b = $(id); if (!b || b.getAttribute("data-ni")) return b;
    b.setAttribute("data-ni", "1");
    var t = b.firstChild;
    if (t && t.nodeType === 3) {
      var s = document.createElement("span"); s.className = "nl"; s.innerHTML = svg(ITEMS[id][0]);
      s.appendChild(document.createTextNode(t.textContent.trim())); b.replaceChild(s, t);
    }
    return b;
  }

  /* ---------- layout state ---------- */
  var KEY = "ss-navlayout-v2", layout, editing = false, pp = null, arm = null, dragId = null, pushT = null;
  function sanitize(L) {
    if (!L || !Array.isArray(L.tabs) || !L.tabs.length) return defaults();
    var out = { ts: +L.ts || 0, active: L.active, tabs: [] };
    L.tabs.slice(0, 6).forEach(function (t) {
      var seen = {}, tab = { id: String(t.id || uid()), n: String(t.n || "Tab").slice(0, 14), c: hex(t.c), ic: P[t.ic] ? t.ic : "list", g: [] };
      (t.g || []).slice(0, 12).forEach(function (g) {
        var ids = (g.ids || []).filter(function (i) { if (!ITEMS[i] || seen[i]) return false; seen[i] = 1; return true; });
        tab.g.push({ id: String(g.id || uid()), n: String(g.n || "Group").slice(0, 22), c: hex(g.c), ic: P[g.ic] ? g.ic : "", ids: ids });
      });
      out.tabs.push(tab);
    });
    if (!out.tabs.some(function (t) { return t.id === out.active; })) out.active = out.tabs[0].id;
    return out;
  }
  layout = sanitize(lsGet(KEY, null));
  function cur() { return layout.tabs.filter(function (t) { return t.id === layout.active; })[0] || layout.tabs[0]; }
  function save() {
    layout.ts = Date.now(); lsSet(KEY, layout);
    clearTimeout(pushT); pushT = setTimeout(function () { if (window.StockPrefs && window.StockPrefs.ready()) window.StockPrefs.set("navlayout", { layout: layout, ts: layout.ts }); }, 700);
  }
  function pullRemote() {
    if (!window.StockPrefs) return; var tries = 0;
    (function poll() {
      if (window.StockPrefs.ready()) {
        window.StockPrefs.get("navlayout").then(function (r) {
          if (r && r.layout && (+r.ts || 0) > layout.ts) { layout = sanitize(r.layout); layout.ts = +r.ts; lsSet(KEY, layout); render(); }
          else if (layout.ts > 0) { window.StockPrefs.set("navlayout", { layout: layout, ts: layout.ts }); }
        });
      } else if (tries++ < 40) setTimeout(poll, 1000);
    })();
  }

  /* ---------- static pieces ---------- */
  var anchor = $("pnlcard") || side.querySelector(".brand");
  var row = document.createElement("div"); row.className = "nsrow";
  var searchBtn = document.createElement("button"); searchBtn.type = "button"; searchBtn.className = "nsearch";
  searchBtn.innerHTML = svg("search", "") + '<span style="overflow:hidden;text-overflow:ellipsis">Search…</span><kbd>' + (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K") + '</kbd>';
  var edBtn = document.createElement("button"); edBtn.type = "button"; edBtn.className = "nedbtn"; edBtn.title = "Customize sidebar"; edBtn.setAttribute("aria-label", "Customize sidebar");
  row.appendChild(searchBtn); row.appendChild(edBtn); anchor.insertAdjacentElement("afterend", row);
  var tabsEl = document.createElement("div"); tabsEl.className = "nmodes";
  var main = document.createElement("div"); main.className = "nmain";
  var hold = document.createElement("div"); hold.className = "nmhold";
  row.insertAdjacentElement("afterend", tabsEl); tabsEl.insertAdjacentElement("afterend", main); main.insertAdjacentElement("afterend", hold);
  document.documentElement.classList.add("nm-on");
  Object.keys(ITEMS).forEach(function (id) { var b = decorate(id); if (b) hold.appendChild(b); });
  var secEls = [];

  function groupIcon(g) { return g.ic ? svg(g.ic, "gi") : "<i></i>"; }
  function rowHtml(id, c, groups, label) {
    return '<div class="nr" draggable="true" data-id="' + id + '" style="--sc:' + c + '"><svg class="grip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">' + P.grip + '</svg>' + svg(ITEMS[id][0]) + '<span>' + esc(ITEMS[id][1]) + '</span><select data-act="mv" data-id="' + id + '"><option value="">' + label + '</option>' +
      groups.map(function (g) { return '<option value="' + g.id + '">' + esc(g.n) + '</option>'; }).join("") + (label === "Move…" ? '<option value="__x">Remove from tab</option>' : "") + '</select></div>';
  }
  function popHtml(target, color, icon) {
    return '<div class="npp" data-pp="' + target + '"><div class="npp-l">Color</div><div class="npp-sw">' + COLORS.map(function (c) { return '<button type="button" data-act="setc" data-c="' + c + '" class="' + (c === color ? "on" : "") + '" style="background:' + c + '" aria-label="Color ' + c + '"></button>'; }).join("") +
      '<label title="Custom color"><input type="color" data-act="cc" value="' + hex(color) + '"></label></div><div class="npp-l">Icon</div><div class="npp-ic">' +
      PICK.map(function (k) { return '<button type="button" data-act="seti" data-i="' + k + '" class="' + (k === icon ? "on" : "") + '" aria-label="Icon ' + k + '">' + svg(k, "") + '</button>'; }).join("") + (target !== "tab" ? '<button type="button" data-act="seti" data-i="" class="no' + (!icon ? " on" : "") + '">Dot</button>' : "") + '</div></div>';
  }

  /* ---------- render ---------- */
  function render() {
    [].slice.call(main.querySelectorAll("button.nav[data-ni]")).forEach(function (b) { hold.appendChild(b); });
    secEls.length = 0;
    var t = cur();
    document.documentElement.style.setProperty("--mc", t.c);
    side.classList.toggle("nedit", editing); document.documentElement.classList.toggle("nav-editing", editing);
    edBtn.innerHTML = svg(editing ? "check" : "pencil", ""); edBtn.title = editing ? "Done customizing" : "Customize sidebar";
    tabsEl.innerHTML = layout.tabs.map(function (x) {
      return '<button type="button" data-tab="' + esc(x.id) + '" style="--c:' + x.c + '" class="' + (x.id === t.id ? "on" : "") + '">' + svg(x.ic, "") + '<span>' + esc(x.n) + '</span></button>';
    }).join("") + (editing && layout.tabs.length < 6 ? '<button type="button" class="nm-add" data-act="addtab" aria-label="Add a tab">' + svg("plus", "") + '<span>New tab</span></button>' : "");
    if (editing) return renderEdit(t);
    var coll = lsGet("ss-navsec-m", {});
    main.innerHTML = "";
    t.g.forEach(function (g) {
      var key = t.id + "|" + g.id, d = document.createElement("div");
      d.className = "ns" + (coll[key] ? " c" : ""); d.style.setProperty("--sc", g.c);
      d.innerHTML = '<button type="button" class="nsh" aria-expanded="' + (!coll[key]) + '">' + groupIcon(g) + '<span>' + esc(g.n) + '</span>' + svg("chev", "nsc") + '</button><div class="nsb"><div class="nsi"></div></div>';
      var body = d.querySelector(".nsi");
      g.ids.forEach(function (id) { var b = $(id); if (b) { b.style.setProperty("--sc", g.c); body.appendChild(b); } });
      main.appendChild(d); secEls.push(d);
      d.querySelector(".nsh").addEventListener("click", function () {
        var c = d.classList.toggle("c"); this.setAttribute("aria-expanded", String(!c)); coll[key] = c; lsSet("ss-navsec-m", coll);
      });
    });
    if (!t.g.length) main.innerHTML = '<p class="ned-note">This tab is empty. Tap the pencil above to add groups and pages.</p>';
    syncActive();
  }
  function renderEdit(t) {
    var used = {}; t.g.forEach(function (g) { g.ids.forEach(function (i) { used[i] = 1; }); });
    var free = Object.keys(ITEMS).filter(function (i) { return !used[i]; });
    var h = '<div class="ned-tabbox"><div class="ned-r"><button type="button" class="ned-sw" data-act="pp" data-t="tab" style="background:' + t.c + '">' + svg(t.ic, "") + '</button><input class="ned-in" data-act="tname" value="' + esc(t.n) + '" maxlength="14" aria-label="Tab name"><button type="button" class="ned-b dg' + (arm === "tab" ? " arm" : "") + '" data-act="deltab" title="Delete this tab"' + (layout.tabs.length < 2 ? " disabled style=\"opacity:.3\"" : "") + '>' + (arm === "tab" ? "Sure?" : svg("x", "")) + '</button></div>' + (pp === "tab" ? popHtml("tab", t.c, t.ic) : "") + '</div>';
    t.g.forEach(function (g, i) {
      h += '<div class="ns ned" data-g="' + g.id + '" style="--sc:' + g.c + '"><div class="ned-r"><button type="button" class="ned-sw" data-act="pp" data-g="' + g.id + '" style="background:' + g.c + '">' + (g.ic ? svg(g.ic, "") : "<i></i>") + '</button><input class="ned-in" data-act="gname" data-g="' + g.id + '" value="' + esc(g.n) + '" maxlength="22" aria-label="Group name">' +
        '<button type="button" class="ned-b" data-act="gup" data-g="' + g.id + '"' + (i === 0 ? ' disabled style="opacity:.3"' : "") + ' aria-label="Move group up">' + svg("up", "") + '</button><button type="button" class="ned-b" data-act="gdn" data-g="' + g.id + '"' + (i === t.g.length - 1 ? ' disabled style="opacity:.3"' : "") + ' aria-label="Move group down">' + svg("down", "") + '</button>' +
        '<button type="button" class="ned-b dg' + (arm === g.id ? " arm" : "") + '" data-act="gdel" data-g="' + g.id + '" title="Delete group">' + (arm === g.id ? "Sure?" : svg("x", "")) + '</button></div>' + (pp === g.id ? popHtml(g.id, g.c, g.ic) : "") +
        '<div class="ned-body" data-drop="' + g.id + '">' + (g.ids.length ? g.ids.map(function (id) { return rowHtml(id, g.c, t.g.filter(function (x) { return x.id !== g.id; }), "Move…"); }).join("") : '<div class="ned-empty">Drag pages here</div>') + '</div></div>';
    });
    h += '<div class="ned-ft"><button type="button" data-act="addg">+ New group</button></div>';
    h += '<div class="ned-tray" data-drop="__tray"><div class="npp-l">Not in this tab' + (free.length ? " (" + free.length + ")" : "") + '</div>' + (free.length ? free.map(function (id) { return rowHtml(id, "var(--mute)", t.g, "Add to…"); }).join("") : '<div class="ned-empty">Every page is placed. Drag one here to take it off this tab.</div>') + '</div>';
    h += '<p class="ned-note">Pages you take off a tab stay one search away (' + (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl+K") + '). Changes save automatically' + (window.StockPrefs && window.StockPrefs.ready() ? " and follow you across devices." : ".") + '</p>';
    h += '<div class="ned-ft"><button type="button" class="' + (arm === "reset" ? "arm" : "") + '" data-act="reset">' + (arm === "reset" ? "Click again to reset everything" : "Reset to default layout") + '</button></div>';
    var keep = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("data-g");
    main.innerHTML = h;
    if (keep) { var el = main.querySelector('input[data-g="' + keep + '"]'); if (el) el.focus(); }
  }

  /* ---------- editing actions ---------- */
  function findG(id) { return cur().g.filter(function (g) { return g.id === id; })[0]; }
  function place(id, gid, beforeId) {
    var t = cur(); t.g.forEach(function (g) { g.ids = g.ids.filter(function (x) { return x !== id; }); });
    if (gid && gid !== "__tray" && gid !== "__x") {
      var g = findG(gid); if (g) { var i = beforeId ? g.ids.indexOf(beforeId) : -1; if (i < 0) g.ids.push(id); else g.ids.splice(i, 0, id); }
    }
    save(); render();
  }
  function setEdit(v) { editing = v; pp = null; arm = null; render(); if (!v) syncActive(); }
  edBtn.addEventListener("click", function () { setEdit(!editing); });

  tabsEl.addEventListener("click", function (e) {
    if (e.target.closest("[data-act=addtab]")) {
      var n = { id: uid(), n: "New tab", c: COLORS[layout.tabs.length % COLORS.length], ic: "star", g: [{ id: uid(), n: "Pages", c: COLORS[layout.tabs.length % COLORS.length], ic: "", ids: [] }] };
      layout.tabs.push(n); layout.active = n.id; pp = null; arm = null; save(); render(); return;
    }
    var b = e.target.closest("[data-tab]"); if (!b) return;
    var id = b.getAttribute("data-tab"); if (id === layout.active && !editing) return;
    layout.active = id; pp = null; arm = null; save(); render();
    if (!editing) { var t = cur(), first = null; t.g.some(function (g) { if (g.ids.length) { first = g.ids[0]; return true; } return false; }); var hb = first && $(first); if (hb) hb.click(); }
  });

  main.addEventListener("click", function (e) {
    var a = e.target.closest("[data-act]"); if (!a || !editing) return; var act = a.getAttribute("data-act"), gid = a.getAttribute("data-g"), t = cur(), g = gid ? findG(gid) : null;
    if (act === "pp") { var k = a.getAttribute("data-t") === "tab" ? "tab" : gid; pp = pp === k ? null : k; render(); }
    else if (act === "setc") { var c = a.getAttribute("data-c"); if (pp === "tab") t.c = c; else { var tg = findG(pp); if (tg) tg.c = c; } save(); render(); }
    else if (act === "seti") { var ic = a.getAttribute("data-i"); if (pp === "tab") t.ic = ic || "list"; else { var tg2 = findG(pp); if (tg2) tg2.ic = ic; } save(); render(); }
    else if (act === "gup" || act === "gdn") { var i = t.g.indexOf(g), j = act === "gup" ? i - 1 : i + 1; if (g && j >= 0 && j < t.g.length) { t.g.splice(i, 1); t.g.splice(j, 0, g); save(); render(); } }
    else if (act === "gdel") { if (arm !== gid) { arm = gid; render(); setTimeout(function () { if (arm === gid) { arm = null; if (editing) render(); } }, 3000); } else { t.g = t.g.filter(function (x) { return x !== g; }); arm = null; pp = null; save(); render(); } }
    else if (act === "deltab") { if (layout.tabs.length < 2) return; if (arm !== "tab") { arm = "tab"; render(); setTimeout(function () { if (arm === "tab") { arm = null; if (editing) render(); } }, 3000); } else { layout.tabs = layout.tabs.filter(function (x) { return x !== t; }); layout.active = layout.tabs[0].id; arm = null; pp = null; save(); render(); } }
    else if (act === "addg") { var ng = { id: uid(), n: "New group", c: COLORS[t.g.length % COLORS.length], ic: "", ids: [] }; t.g.push(ng); pp = null; save(); render(); var inp = main.querySelector('input[data-g="' + ng.id + '"]'); if (inp) { inp.focus(); inp.select(); } }
    else if (act === "reset") { if (arm !== "reset") { arm = "reset"; render(); setTimeout(function () { if (arm === "reset") { arm = null; if (editing) render(); } }, 3500); } else { layout = defaults(); arm = null; pp = null; save(); render(); } }
  });
  main.addEventListener("input", function (e) {
    var a = e.target.getAttribute && e.target.getAttribute("data-act"); if (!a || !editing) return;
    if (a === "gname") { var g = findG(e.target.getAttribute("data-g")); if (g) { g.n = e.target.value.slice(0, 22); save(); } }
    else if (a === "tname") { var t = cur(); t.n = e.target.value.slice(0, 14); save(); var tb = tabsEl.querySelector('[data-tab="' + t.id + '"] span'); if (tb) tb.textContent = t.n; }
    else if (a === "cc") {
      var c = e.target.value, tt = cur();
      if (pp === "tab") { tt.c = c; document.documentElement.style.setProperty("--mc", c); } else { var tg = findG(pp); if (tg) { tg.c = c; var ge = main.querySelector('.ns[data-g="' + pp + '"]'); if (ge) ge.style.setProperty("--sc", c); } }
    }
  });
  main.addEventListener("change", function (e) {
    var a = e.target.getAttribute && e.target.getAttribute("data-act"); if (!a || !editing) return;
    if (a === "mv") { var v = e.target.value; if (v) place(e.target.getAttribute("data-id"), v); }
    else if (a === "cc") { save(); render(); }
  });
  main.addEventListener("dragstart", function (e) { var r = e.target.closest && e.target.closest(".nr"); if (!r || !editing) return; dragId = r.getAttribute("data-id"); r.classList.add("drag"); try { e.dataTransfer.setData("text/plain", dragId); e.dataTransfer.effectAllowed = "move"; } catch (x) {} });
  main.addEventListener("dragend", function () { dragId = null; [].forEach.call(main.querySelectorAll(".drag,.over"), function (n) { n.classList.remove("drag", "over"); }); });
  main.addEventListener("dragover", function (e) { if (!dragId) return; var b = e.target.closest(".ned-body,.ned-tray"); if (!b) return; e.preventDefault(); [].forEach.call(main.querySelectorAll(".over"), function (n) { if (n !== b) n.classList.remove("over"); }); b.classList.add("over"); });
  main.addEventListener("drop", function (e) {
    if (!dragId) return; var b = e.target.closest(".ned-body,.ned-tray"); if (!b) return; e.preventDefault();
    var r = e.target.closest(".nr"), before = null;
    if (r && r.getAttribute("data-id") !== dragId) { var box = r.getBoundingClientRect(), id = r.getAttribute("data-id"); if (e.clientY < box.top + box.height / 2) before = id; else { var sib = r.nextElementSibling; before = sib && sib.classList.contains("nr") ? sib.getAttribute("data-id") : null; } }
    var id2 = dragId; dragId = null; place(id2, b.getAttribute("data-drop"), before);
  });

  function syncActive() {
    if (editing) return;
    var on = side.querySelector(".nav.on[data-ni]");
    secEls.forEach(function (d) {
      var has = !!(on && d.contains(on)); d.classList.toggle("has-on", has);
      if (has && d.classList.contains("c")) { d.classList.remove("c"); d.querySelector(".nsh").setAttribute("aria-expanded", "true"); }
    });
    if (on && !main.contains(on)) {
      var k = layout.tabs.filter(function (x) { return x.g.some(function (g) { return g.ids.indexOf(on.id) > -1; }); })[0];
      if (k && k.id !== layout.active) { layout.active = k.id; lsSet(KEY, layout); render(); }
    }
  }
  new MutationObserver(syncActive).observe(side, { attributes: true, attributeFilter: ["class"], subtree: true });
  render(); pullRemote();

  /* ---------- quick search (Cmd/Ctrl+K) ---------- */
  var pal = null, sel = 0, rows = [];
  function tagOf(id) {
    var t = cur(), g = t.g.filter(function (x) { return x.ids.indexOf(id) > -1; })[0];
    if (!g) { var any = layout.tabs.map(function (x) { return x.g.filter(function (y) { return y.ids.indexOf(id) > -1; })[0]; }).filter(Boolean)[0]; g = any; }
    return g ? { t: g.n, c: g.c } : { t: "", c: "#888" };
  }
  function results(q) {
    q = q.trim().toLowerCase(); var out = [];
    Object.keys(ITEMS).forEach(function (id) {
      var s = tagOf(id), l = ITEMS[id][1];
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
      h += '<button type="button" class="np-it' + (i === sel ? " on" : "") + '" data-i="' + i + '" style="--c:' + r.c + '">' + svg(r.ic, "") + '<span>' + esc(r.l) + '</span>' + (r.tag ? '<small>' + esc(r.tag) + '</small>' : '') + '</button>';
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
