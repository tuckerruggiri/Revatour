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
    navhome: ["list", "Watchlist"], navday: ["cal", "Trading day"], navals: ["bell", "Alerts"], navplan: ["target", "Trade Plan"], navfut: ["candles", "Futures"], navopt: ["layers", "Options school"],
    navmov: ["zap", "Parabolic movers"], navpulse: ["pulse", "Market pulse"], navnews: ["news", "News"], navzone: ["layers", "Zones"],
    navinv: ["pie", "Investments"], navrl: ["ladder", "Risk Ladder"],
    navstudio: ["book", "Studio"], navsc: ["award", "Scorecard"], navlab: ["flask", "Setup Lab"], navprac: ["play", "Practice charts"], navcoach: ["spark", "AI Coach"],
    navprofile: ["user", "Profile"], navpub: ["send", "Publishes"], navnotif: ["inbox", "Notifications"], navgd: ["help", "How-To"], navset: ["gear", "Settings"]
  };
  P.sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  P.cal = '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 15h3"/>';
  P.clock = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
  P.folder = '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>';
  P.fold = '<path d="M7 9l5-5 5 5M7 15l5 5 5-5"/>';
  PICK.push("clock", "folder", "cal");
  var YOU = ["navprofile", "navpub", "navnotif", "navgd", "navset"];
  var DEF = [
    ["Trading day", "#e8782a", "zap", ["navday", "navhome", "navals", "navplan", "navfut", "navmov"]],
    ["Investing", "#1f9d55", "pie", ["navinv", "navrl", "navopt", "navhome"]],
    ["Research", "#2b7de0", "search", ["navpulse", "navnews", "navzone", "navmov"]],
    ["Review & practice", "#8b4fe0", "book", ["navstudio", "navsc", "navlab", "navprac", "navcoach"]],
    ["You", "#7d8793", "user", YOU]
  ];
  function defaults() {
    return { ts: 0, rec: true, pg: "bottom", v: 3, sections: DEF.map(function (s, i) { return { id: "s" + i, n: s[0], c: s[1], ic: s[2], ids: s[3].slice() }; }) };
  }

  var CSS = '#side .nsrow{display:flex;gap:6px;margin:0 0 12px}#side .nsearch{box-sizing:border-box;overflow:hidden;flex:1;min-width:0;display:flex;align-items:center;gap:9px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--mute);font:500 .88rem "Instrument Sans",sans-serif;cursor:pointer;text-align:left;white-space:nowrap}#side .nsearch:hover{border-color:var(--accent);color:var(--ink)}#side .nsearch svg{width:15px;height:15px;flex:none}#side .nsearch kbd{white-space:nowrap;margin-left:auto;font:600 .68rem "Instrument Sans",sans-serif;border:1px solid var(--line);border-radius:5px;padding:2px 6px;background:var(--panel);color:var(--mute)}' +
    '#side .nedbtn{padding:0;flex:none;width:38px;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--mute);cursor:pointer}#side .nedbtn svg{width:16px;height:16px}#side .nedbtn:hover{color:var(--ink);border-color:var(--accent)}#side.nedit .nedbtn{background:var(--ink);color:var(--panel);border-color:var(--ink)}' +
    '.ns{margin:0 0 4px}.nsh{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;padding:9px 10px 5px;color:var(--mute);font:700 .66rem "Instrument Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;text-align:left}.nsh:hover{color:var(--ink)}.nsh i{width:8px;height:8px;border-radius:50%;background:var(--sc);flex:none}.nsh .gi{width:14px;height:14px;color:var(--sc);flex:none}.nsh .nsc{width:13px;height:13px;margin-left:auto;transition:transform .2s;flex:none}.ns.c .nsh .nsc{transform:rotate(-90deg)}.ns.c.has-on .nsh::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--sc);order:3}' +
    '.nsb{display:grid;grid-template-rows:1fr;transition:grid-template-rows .22s ease}.ns.c .nsb{grid-template-rows:0fr}.nsi{overflow:hidden;min-height:0}' +
    '#side .ns .nav{position:relative;margin:1px 0;padding:7px 10px 7px 12px;border-radius:9px;color:var(--mute)}#side .nav .nl{display:flex;align-items:center;gap:11px;min-width:0}#side .nav .ni{width:18px;height:18px;flex:none;color:var(--sc,var(--mute));opacity:.7;transition:opacity .15s,transform .15s}#side .nav:hover .ni{opacity:1;transform:scale(1.08)}#side .nav:hover{color:var(--ink);background:var(--bg)}' +
    '#side .ns .nav.on{background:color-mix(in srgb,var(--sc,var(--accent)) 14%,transparent);color:var(--ink);font-weight:600}#side .nav.on .ni{opacity:1}#side .ns .nav.on::before{content:"";position:absolute;left:0;top:7px;bottom:7px;width:3px;border-radius:3px;background:var(--sc,var(--accent))}' +
    '@media(min-width:761px){.shell{transition:grid-template-columns .25s ease}html.nav-editing .shell{grid-template-columns:330px minmax(0,1fr)}}.ned-r{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px 4px 4px}.ned-sw{padding:0;flex:none;width:30px;height:30px;border-radius:9px;border:0;display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}.ned-sw svg{width:16px;height:16px}.ned-sw i{width:10px;height:10px;border-radius:50%;background:#fff;opacity:.9}' +
    '.ned-in{flex:1 1 120px;min-width:0;box-sizing:border-box;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:600 .86rem "Instrument Sans",sans-serif}.ned-b{padding:0;flex:none;width:26px;height:26px;border:0;border-radius:7px;background:none;color:var(--mute);display:flex;align-items:center;justify-content:center;cursor:pointer}.ned-b:hover{background:var(--bg);color:var(--ink)}.ned-b.dg:hover{color:var(--loss)}.ned-b svg,.ned-sw svg,.nedbtn svg{flex:none}.ned-b svg{width:14px;height:14px}.ned-b.arm{width:auto;padding:0 8px!important;background:var(--loss);color:#fff;font:700 .7rem sans-serif}' +
    '.npp{margin:2px 4px 8px;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--bg)}.npp-l{margin:0 0 6px;font:700 .62rem "Instrument Sans",sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--mute)}.npp-sw{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.npp-sw button,.npp-sw label{width:22px;height:22px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;box-sizing:border-box}.npp-sw button.on{border-color:var(--ink)}.npp-sw label{position:relative;background:conic-gradient(red,yellow,lime,aqua,blue,magenta,red);overflow:hidden}.npp-sw label input{position:absolute;inset:-6px;opacity:0;cursor:pointer}' +
    '.npp-ic{display:flex;flex-wrap:wrap;gap:4px}.npp-ic button{width:28px;height:28px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--mute);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}.npp-ic button svg{width:15px;height:15px}.npp-ic button:hover{color:var(--ink)}.npp-ic button.on{background:var(--ink);color:var(--panel);border-color:var(--ink)}.npp-ic .no{width:auto;padding:0 8px;font:600 .7rem sans-serif}' +
    '.ned-body{margin:0 0 4px;padding:2px 0;border-radius:10px;min-height:30px}.ned-body.over,.ned-tray.over{background:color-mix(in srgb,var(--sc,var(--accent)) 12%,transparent);outline:2px dashed var(--sc,var(--accent));outline-offset:-2px}.nr{display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:9px;color:var(--ink);font:500 .88rem "Instrument Sans",sans-serif;cursor:grab;background:var(--panel)}.nr:hover{background:var(--bg)}.nr.drag{opacity:.4}.nr .grip{width:14px;height:14px;color:var(--mute);flex:none}.nr .ni{width:17px;height:17px;flex:none;color:var(--sc,var(--mute))}.nr span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nr select{flex:none;max-width:96px;border:1px solid var(--line);border-radius:7px;background:var(--bg);color:var(--mute);font:600 .7rem sans-serif;padding:3px 4px}' +
    '.ned-empty{padding:8px 10px;color:var(--mute);font-size:.78rem;font-style:italic}.ned-tray{margin-top:10px;padding:8px 6px;border:1.5px dashed var(--line);border-radius:12px;--sc:var(--mute)}.ned-tray .npp-l{padding:0 4px}.ned-ft{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 4px}.ned-ft button{flex:1;border:1.5px dashed var(--line);border-radius:10px;background:none;color:var(--mute);padding:9px 8px;font:700 .78rem "Instrument Sans",sans-serif;cursor:pointer;white-space:nowrap}.ned-ft button:hover{color:var(--ink);border-color:var(--accent)}.ned-ft button.arm{background:var(--loss);color:#fff;border-color:var(--loss)}.ned-note{margin:6px 4px 0;font-size:.74rem;color:var(--mute);line-height:1.4}.ned-tabbox{margin:2px 0 10px;padding:6px 6px 2px;border:1px solid var(--line);border-radius:12px;background:var(--bg)}.ned-tabbox .npp{background:var(--panel)}' +
    '.np-ov{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.45);display:flex;align-items:flex-start;justify-content:center;padding:12vh 16px 0}.np-box{width:min(580px,100%);background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.4);overflow:hidden}.np-in{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line)}.np-in svg{width:18px;height:18px;color:var(--mute);flex:none}.np-in input{flex:1;min-width:0;border:0;outline:0;background:none;color:var(--ink);font:500 1.05rem "Instrument Sans",sans-serif}.np-in kbd{font:600 .68rem sans-serif;border:1px solid var(--line);border-radius:5px;padding:2px 6px;color:var(--mute)}' +
    '.ned-chk{display:flex;align-items:center;gap:8px;margin:12px 4px 0;font:600 .8rem "Instrument Sans",sans-serif;color:var(--ink);cursor:pointer}.ned-chk input{width:auto;margin:0}.nr select{max-width:120px}.nsh-row{display:flex;align-items:center;padding-right:6px}.nsh-row .nsh{flex:1;min-width:0}#side .nsh-row #addpg{margin:0;flex:none}.nspages .nsb #pglist{padding:0}#side .nsearch kbd{display:none}#side .nedbtn{width:36px}#side .pxy .nl{pointer-events:none}.ns[data-sid="__un"] .nsh,.ns[data-sid="__rec"] .nsh{opacity:.85}' +
    '.np-l{max-height:min(52vh,420px);overflow-y:auto;padding:6px}.np-g{padding:8px 10px 4px;font:700 .64rem "Instrument Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}.np-it{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;color:var(--ink);padding:9px 10px;border-radius:10px;font:500 .95rem "Instrument Sans",sans-serif;cursor:pointer;text-align:left}.np-it.on{background:var(--bg)}.np-it svg{width:18px;height:18px;flex:none;color:var(--c,var(--mute))}.np-it small{margin-left:auto;color:var(--mute);font-size:.76rem}.np-e{padding:18px;text-align:center;color:var(--mute)}@media(max-width:760px){.np-ov{padding-top:6vh}}';
  CSS += '#side .ns{margin:0 0 6px}#side .nsh{margin:12px 0 4px;padding:9px 12px;width:100%;box-sizing:border-box;border-radius:10px;background:color-mix(in srgb,var(--sc) 20%,var(--panel));border-left:5px solid var(--sc);color:var(--ink);font:800 .8rem "Instrument Sans",sans-serif;letter-spacing:.1em}#side .nsh:hover{background:color-mix(in srgb,var(--sc) 30%,var(--panel))}#side .nsh .gi{width:16px;height:16px}#side .nsh i{width:10px;height:10px}' +
    '#side .ns .nsi{margin-left:12px;padding-left:8px;border-left:2px solid color-mix(in srgb,var(--sc) 35%,transparent)}#side .ns .nav{padding:7px 10px;font-size:.92rem;font-weight:500;color:var(--ink)}#side .ns .nav .nl>svg.ni{display:none}#side .ns .nav:hover{background:color-mix(in srgb,var(--sc) 12%,transparent)}#side .ns .nav.on{font-weight:700;background:color-mix(in srgb,var(--sc) 22%,transparent)}#side .ns .nav.on::before{left:-10px;top:5px;bottom:5px;width:4px}';
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
  var KEY = "ss-navlayout-v3", CKEY = "ss-navsec-v3", RKEY = "ss-navrecent", layout, editing = false, pp = null, arm = null, dragId = null, dragFrom = null, pushT = null;
  function sanitize(L) {
    if (!L || !Array.isArray(L.sections)) return defaults();
    var out = { ts: +L.ts || 0, rec: L.rec !== false, pg: L.pg === "top" ? "top" : "bottom", v: 3, sections: [] };
    L.sections.slice(0, 14).forEach(function (s) {
      var seen = {}, ids = (s.ids || []).filter(function (i) { if (!ITEMS[i] || seen[i]) return false; seen[i] = 1; return true; });
      out.sections.push({ id: String(s.id || uid()), n: String(s.n || "Section").slice(0, 24), c: hex(s.c), ic: P[s.ic] ? s.ic : "", ids: ids });
    });
    if (!(L.v >= 2) && out.sections.length && !out.sections.some(function (s) { return s.ids.indexOf("navday") > -1; })) out.sections[0].ids.unshift("navday");
    if (!(L.v >= 3) && out.sections.length && !out.sections.some(function (s) { return s.ids.indexOf("navopt") > -1; })) { var iv = out.sections.filter(function (s) { return s.ids.indexOf("navinv") > -1; })[0] || out.sections[0]; iv.ids.push("navopt"); }
    return out;
  }
  layout = sanitize(lsGet(KEY, null));
  function save() {
    layout.ts = Date.now(); lsSet(KEY, layout);
    clearTimeout(pushT); pushT = setTimeout(function () { if (window.StockPrefs && window.StockPrefs.ready()) window.StockPrefs.set("navlayout3", { layout: layout, ts: layout.ts }); }, 700);
  }
  function pullRemote() {
    if (!window.StockPrefs) return; var tries = 0;
    (function poll() {
      if (window.StockPrefs.ready()) {
        window.StockPrefs.get("navlayout3").then(function (r) {
          if (r && r.layout && (+r.ts || 0) > layout.ts) { layout = sanitize(r.layout); layout.ts = +r.ts; lsSet(KEY, layout); render(); }
          else if (layout.ts > 0) { window.StockPrefs.set("navlayout3", { layout: layout, ts: layout.ts }); }
        });
      } else if (tries++ < 40) setTimeout(poll, 1000);
    })();
  }
  function recent() { return lsGet(RKEY, []).filter(function (i) { return ITEMS[i]; }); }
  function pushRecent(id) { var r = recent().filter(function (x) { return x !== id; }); r.unshift(id); lsSet(RKEY, r.slice(0, 6)); }

  /* ---------- static pieces ---------- */
  var anchor = $("pnlcard") || side.querySelector(".brand");
  var row = document.createElement("div"); row.className = "nsrow";
  var searchBtn = document.createElement("button"); searchBtn.type = "button"; searchBtn.className = "nsearch";
  searchBtn.innerHTML = svg("search", "") + '<span style="overflow:hidden;text-overflow:ellipsis">Search…</span><kbd>' + (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K") + '</kbd>';
  var foldBtn = document.createElement("button"); foldBtn.type = "button"; foldBtn.className = "nedbtn"; foldBtn.title = "Collapse / expand all sections"; foldBtn.setAttribute("aria-label", "Collapse or expand all sections"); foldBtn.innerHTML = svg("fold", "");
  var edBtn = document.createElement("button"); edBtn.type = "button"; edBtn.className = "nedbtn"; edBtn.title = "Customize sidebar"; edBtn.setAttribute("aria-label", "Customize sidebar");
  row.appendChild(searchBtn); row.appendChild(foldBtn); row.appendChild(edBtn); anchor.insertAdjacentElement("afterend", row);
  var main = document.createElement("div"); main.className = "nmain";
  var hold = document.createElement("div"); hold.className = "nmhold";
  row.insertAdjacentElement("afterend", main); main.insertAdjacentElement("afterend", hold);
  Object.keys(ITEMS).forEach(function (id) { var b = decorate(id); if (b) hold.appendChild(b); });
  var secEls = [];
  var pgSec = null, sechead = side.querySelector(".sechead");
  if (sechead && $("pglist")) {
    pgSec = document.createElement("div"); pgSec.className = "ns nspages"; pgSec.setAttribute("data-sid", "__pages"); pgSec.style.setProperty("--sc", "#7d8793");
    pgSec.innerHTML = '<div class="nsh-row"><button type="button" class="nsh" aria-expanded="true">' + svg("folder", "gi") + '<span>Pages</span>' + svg("chev", "nsc") + '</button></div><div class="nsb"><div class="nsi"></div></div>';
    var hrow = pgSec.querySelector(".nsh-row"), pbody = pgSec.querySelector(".nsi"), addb = $("addpg");
    if (addb) hrow.appendChild(addb);
    if ($("addrow")) pbody.appendChild($("addrow"));
    pbody.appendChild($("pglist"));
    sechead.style.display = "none";
    pgSec.querySelector(".nsh").addEventListener("click", function () {
      var c = pgSec.classList.toggle("c"), co = lsGet(CKEY, {}); this.setAttribute("aria-expanded", String(!c)); co.__pages = c; lsSet(CKEY, co);
    });
  }

  function groupIcon(g) { return g.ic ? svg(g.ic, "gi") : "<i></i>"; }
  function proxy(id, c) {
    var r = $(id), p = r.cloneNode(true);
    p.removeAttribute("id"); p.removeAttribute("data-ni"); p.classList.remove("on"); p.classList.add("pxy"); p.type = "button";
    p.setAttribute("data-for", id); p.style.setProperty("--sc", c); return p;
  }
  function rowHtml(id, c, sid) {
    var others = layout.sections.filter(function (s) { return s.id !== sid; }), tray = sid === "__tray", h = '<option value="">' + (tray ? "Add to…" : "Options…") + '</option>';
    if (tray) h += others.map(function (s) { return '<option value="m:' + s.id + '">' + esc(s.n) + '</option>'; }).join("");
    else {
      h += '<optgroup label="Move to">' + others.map(function (s) { return '<option value="m:' + s.id + '">' + esc(s.n) + '</option>'; }).join("") + '</optgroup>';
      var also = others.filter(function (s) { return s.ids.indexOf(id) < 0; });
      if (also.length) h += '<optgroup label="Also show in">' + also.map(function (s) { return '<option value="a:' + s.id + '">' + esc(s.n) + '</option>'; }).join("") + '</optgroup>';
      h += '<option value="r">Remove from this section</option>';
    }
    return '<div class="nr" draggable="true" data-id="' + id + '" style="--sc:' + c + '"><svg class="grip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">' + P.grip + '</svg>' + svg(ITEMS[id][0]) + '<span>' + esc(ITEMS[id][1]) + '</span><select data-act="mv" data-id="' + id + '" data-from="' + sid + '" aria-label="Options for ' + esc(ITEMS[id][1]) + '">' + h + '</select></div>';
  }
  function popHtml(target, color, icon) {
    return '<div class="npp" data-pp="' + target + '"><div class="npp-l">Color</div><div class="npp-sw">' + COLORS.map(function (c) { return '<button type="button" data-act="setc" data-c="' + c + '" class="' + (c === color ? "on" : "") + '" style="background:' + c + '" aria-label="Color ' + c + '"></button>'; }).join("") +
      '<label title="Custom color"><input type="color" data-act="cc" value="' + hex(color) + '"></label></div><div class="npp-l">Icon</div><div class="npp-ic">' +
      PICK.map(function (k) { return '<button type="button" data-act="seti" data-i="' + k + '" class="' + (k === icon ? "on" : "") + '" aria-label="Icon ' + k + '">' + svg(k, "") + '</button>'; }).join("") + '<button type="button" data-act="seti" data-i="" class="no' + (!icon ? " on" : "") + '">Dot</button></div></div>';
  }

  /* ---------- render ---------- */
  var shown = [];
  function render() {
    [].slice.call(main.querySelectorAll("button.nav[data-ni]")).forEach(function (b) { hold.appendChild(b); });
    if (pgSec) hold.appendChild(pgSec);
    secEls.length = 0; shown = [];
    side.classList.toggle("nedit", editing); document.documentElement.classList.toggle("nav-editing", editing);
    edBtn.innerHTML = svg(editing ? "check" : "pencil", ""); edBtn.title = editing ? "Done customizing" : "Customize sidebar";
    foldBtn.style.display = editing ? "none" : "";
    if (editing) return renderEdit();
    var coll = lsGet(CKEY, {}), placed = {}, used = {}, list = [];
    layout.sections.forEach(function (s) { s.ids.forEach(function (i) { used[i] = 1; }); });
    if (layout.rec) { var rc = recent().slice(0, 3); if (rc.length) list.push({ id: "__rec", n: "Recent", c: "#7d8793", ic: "clock", ids: rc, px: true }); }
    layout.sections.forEach(function (s) { if (s.ids.length) list.push(s); });
    var free = Object.keys(ITEMS).filter(function (i) { return !used[i]; });
    if (free.length) list.push({ id: "__un", n: "Unsorted", c: "#7d8793", ic: "folder", ids: free });
    main.innerHTML = "";
    if (pgSec) { pgSec.classList.toggle("c", !!coll.__pages); pgSec.querySelector(".nsh").setAttribute("aria-expanded", String(!coll.__pages)); if (layout.pg === "top") { main.appendChild(pgSec); secEls.push(pgSec); } }
    list.forEach(function (g) {
      var d = document.createElement("div"); shown.push(g.id);
      d.className = "ns" + (coll[g.id] ? " c" : ""); d.setAttribute("data-sid", g.id); d.style.setProperty("--sc", g.c);
      d.innerHTML = '<button type="button" class="nsh" aria-expanded="' + (!coll[g.id]) + '">' + groupIcon(g) + '<span>' + esc(g.n) + '</span>' + svg("chev", "nsc") + '</button><div class="nsb"><div class="nsi"></div></div>';
      var body = d.querySelector(".nsi");
      g.ids.forEach(function (id) {
        var b = $(id); if (!b) return;
        if (!g.px && !placed[id]) { placed[id] = 1; b.style.setProperty("--sc", g.c); body.appendChild(b); } else body.appendChild(proxy(id, g.c));
      });
      main.appendChild(d); secEls.push(d);
      d.querySelector(".nsh").addEventListener("click", function () {
        var c = d.classList.toggle("c"); this.setAttribute("aria-expanded", String(!c)); coll[g.id] = c; lsSet(CKEY, coll);
      });
    });
    if (pgSec && layout.pg !== "top") { main.appendChild(pgSec); secEls.push(pgSec); }
    if (!list.length && !pgSec) main.innerHTML = '<p class="ned-note">No sections yet. Tap the pencil above to make one.</p>';
    syncActive();
  }
  function renderEdit() {
    var used = {}, S = layout.sections; S.forEach(function (s) { s.ids.forEach(function (i) { used[i] = 1; }); });
    var free = Object.keys(ITEMS).filter(function (i) { return !used[i]; }), h = "";
    S.forEach(function (g, i) {
      h += '<div class="ns ned" data-g="' + g.id + '" style="--sc:' + g.c + '"><div class="ned-r"><button type="button" class="ned-sw" data-act="pp" data-g="' + g.id + '" style="background:' + g.c + '" aria-label="Color and icon">' + (g.ic ? svg(g.ic, "") : "<i></i>") + '</button><input class="ned-in" data-act="gname" data-g="' + g.id + '" value="' + esc(g.n) + '" maxlength="24" aria-label="Section name">' +
        '<button type="button" class="ned-b" data-act="gup" data-g="' + g.id + '"' + (i === 0 ? ' disabled style="opacity:.3"' : "") + ' aria-label="Move section up">' + svg("up", "") + '</button><button type="button" class="ned-b" data-act="gdn" data-g="' + g.id + '"' + (i === S.length - 1 ? ' disabled style="opacity:.3"' : "") + ' aria-label="Move section down">' + svg("down", "") + '</button>' +
        '<button type="button" class="ned-b dg' + (arm === g.id ? " arm" : "") + '" data-act="gdel" data-g="' + g.id + '" title="Delete section" aria-label="Delete section">' + (arm === g.id ? "Sure?" : svg("x", "")) + '</button></div>' + (pp === g.id ? popHtml(g.id, g.c, g.ic) : "") +
        '<div class="ned-body" data-drop="' + g.id + '">' + (g.ids.length ? g.ids.map(function (id) { return rowHtml(id, g.c, g.id); }).join("") : '<div class="ned-empty">Drag pages here</div>') + '</div></div>';
    });
    h += '<div class="ned-ft"><button type="button" data-act="addg"' + (S.length >= 14 ? " disabled" : "") + '>+ New section</button></div>';
    h += '<div class="ned-tray" data-drop="__tray"><div class="npp-l">Unsorted' + (free.length ? " (" + free.length + ")" : "") + '</div>' + (free.length ? free.map(function (id) { return rowHtml(id, "var(--mute)", "__tray"); }).join("") : '<div class="ned-empty">Every page is in a section. Drop one here to take it out of the section it came from.</div>') + '</div>';
    h += '<label class="ned-chk"><input type="checkbox" data-act="pgtop"' + (layout.pg === "top" ? " checked" : "") + '> Show Pages at the top (otherwise at the bottom)</label>';
    h += '<label class="ned-chk"><input type="checkbox" data-act="rec"' + (layout.rec ? " checked" : "") + '> Show a “Recent” section at the top</label>';
    h += '<p class="ned-note"><b>Tip:</b> a page can live in several sections. Hold <b>Alt</b> (Option) while dragging to copy it, or use the Options menu. Changes save automatically' + (window.StockPrefs && window.StockPrefs.ready() ? " and follow you across devices." : ".") + '</p>';
    h += '<div class="ned-ft"><button type="button" class="' + (arm === "reset" ? "arm" : "") + '" data-act="reset">' + (arm === "reset" ? "Click again to reset everything" : "Reset to default layout") + '</button></div>';
    var keep = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("data-g");
    main.innerHTML = h;
    if (keep) { var el = main.querySelector('input[data-g="' + keep + '"]'); if (el) el.focus(); }
  }

  /* ---------- editing actions ---------- */
  function findS(id) { return layout.sections.filter(function (g) { return g.id === id; })[0]; }
  function move(kind, id, to, from, before) {
    var F = from && from !== "__tray" ? findS(from) : null, T = findS(to);
    if (kind === "rm") { if (F) F.ids = F.ids.filter(function (x) { return x !== id; }); }
    else {
      var had = T && T.ids.indexOf(id) > -1;
      if (kind === "mv" && F) F.ids = F.ids.filter(function (x) { return x !== id; });
      if (T && (!had || (kind === "mv" && from === to))) {
        T.ids = T.ids.filter(function (x) { return x !== id; });
        var i = before ? T.ids.indexOf(before) : -1; if (i < 0) T.ids.push(id); else T.ids.splice(i, 0, id);
      }
    }
    save(); render();
  }
  function setEdit(v) { editing = v; pp = null; arm = null; render(); if (!v) syncActive(); }
  edBtn.addEventListener("click", function () { setEdit(!editing); });
  foldBtn.addEventListener("click", function () {
    var coll = lsGet(CKEY, {}), anyOpen = secEls.some(function (d) { return !d.classList.contains("c"); });
    secEls.forEach(function (d) { var c = anyOpen; d.classList.toggle("c", c); coll[d.getAttribute("data-sid")] = c; var h = d.querySelector(".nsh"); if (h) h.setAttribute("aria-expanded", String(!c)); });
    lsSet(CKEY, coll);
  });

  main.addEventListener("click", function (e) {
    var px = e.target.closest(".pxy");
    if (px && !editing) { var rb = $(px.getAttribute("data-for")); if (rb) rb.click(); return; }
    var a = e.target.closest("[data-act]"); if (!a || !editing) return; var act = a.getAttribute("data-act"), gid = a.getAttribute("data-g"), g = gid ? findS(gid) : null, S = layout.sections;
    if (act === "pp") { pp = pp === gid ? null : gid; render(); }
    else if (act === "setc") { var tg = findS(pp); if (tg) { tg.c = a.getAttribute("data-c"); save(); render(); } }
    else if (act === "seti") { var tg2 = findS(pp); if (tg2) { tg2.ic = a.getAttribute("data-i"); save(); render(); } }
    else if (act === "gup" || act === "gdn") { var i = S.indexOf(g), j = act === "gup" ? i - 1 : i + 1; if (g && j >= 0 && j < S.length) { S.splice(i, 1); S.splice(j, 0, g); save(); render(); } }
    else if (act === "gdel") { if (arm !== gid) { arm = gid; render(); setTimeout(function () { if (arm === gid) { arm = null; if (editing) render(); } }, 3000); } else { layout.sections = S.filter(function (x) { return x !== g; }); arm = null; pp = null; save(); render(); } }
    else if (act === "addg") { if (S.length >= 14) return; var ng = { id: uid(), n: "New section", c: COLORS[S.length % COLORS.length], ic: "star", ids: [] }; S.push(ng); pp = null; save(); render(); var inp = main.querySelector('input[data-g="' + ng.id + '"]'); if (inp) { inp.focus(); inp.select(); } }
    else if (act === "reset") { if (arm !== "reset") { arm = "reset"; render(); setTimeout(function () { if (arm === "reset") { arm = null; if (editing) render(); } }, 3500); } else { layout = defaults(); arm = null; pp = null; save(); render(); } }
  });
  main.addEventListener("input", function (e) {
    var a = e.target.getAttribute && e.target.getAttribute("data-act"); if (!a || !editing) return;
    if (a === "gname") { var g = findS(e.target.getAttribute("data-g")); if (g) { g.n = e.target.value.slice(0, 24); save(); } }
    else if (a === "cc") { var tg = findS(pp); if (tg) { tg.c = e.target.value; var ge = main.querySelector('.ns[data-g="' + pp + '"]'); if (ge) ge.style.setProperty("--sc", tg.c); } }
  });
  main.addEventListener("change", function (e) {
    var a = e.target.getAttribute && e.target.getAttribute("data-act"); if (!a || !editing) return;
    if (a === "mv") {
      var v = e.target.value, id = e.target.getAttribute("data-id"), from = e.target.getAttribute("data-from"); if (!v) return;
      if (v === "r") move("rm", id, null, from); else move(v.charAt(0) === "a" ? "cp" : "mv", id, v.slice(2), from);
    }
    else if (a === "cc") { save(); render(); }
    else if (a === "pgtop") { layout.pg = e.target.checked ? "top" : "bottom"; save(); }
    else if (a === "rec") { layout.rec = e.target.checked; save(); }
  });
  main.addEventListener("dragstart", function (e) {
    var r = e.target.closest && e.target.closest(".nr"); if (!r || !editing) return;
    dragId = r.getAttribute("data-id"); dragFrom = r.closest("[data-drop]").getAttribute("data-drop"); r.classList.add("drag");
    try { e.dataTransfer.setData("text/plain", dragId); e.dataTransfer.effectAllowed = "copyMove"; } catch (x) {}
  });
  main.addEventListener("dragend", function () { dragId = null; [].forEach.call(main.querySelectorAll(".drag,.over"), function (n) { n.classList.remove("drag", "over"); }); });
  main.addEventListener("dragover", function (e) { if (!dragId) return; var b = e.target.closest(".ned-body,.ned-tray"); if (!b) return; e.preventDefault(); [].forEach.call(main.querySelectorAll(".over"), function (n) { if (n !== b) n.classList.remove("over"); }); b.classList.add("over"); });
  main.addEventListener("drop", function (e) {
    if (!dragId) return; var b = e.target.closest(".ned-body,.ned-tray"); if (!b) return; e.preventDefault();
    var r = e.target.closest(".nr"), before = null, to = b.getAttribute("data-drop");
    if (r && r.getAttribute("data-id") !== dragId) { var box = r.getBoundingClientRect(), id = r.getAttribute("data-id"); if (e.clientY < box.top + box.height / 2) before = id; else { var sib = r.nextElementSibling; before = sib && sib.classList.contains("nr") ? sib.getAttribute("data-id") : null; } }
    var id2 = dragId, from = dragFrom; dragId = null;
    if (to === "__tray") { if (from !== "__tray") move("rm", id2, null, from); }
    else move(e.altKey && from !== "__tray" ? "cp" : "mv", id2, to, from, before);
  });
  var clickedSid = null;
  side.addEventListener("click", function (e) { var n = e.target.closest && e.target.closest(".nav"), sec = n && n.closest(".ns"); clickedSid = sec ? sec.getAttribute("data-sid") : null; }, true);
  side.addEventListener("click", function (e) {
    if (editing) return; var b = e.target.closest(".nav"); if (!b) return; var id = b.getAttribute("data-for") || b.id;
    if (ITEMS[id]) { pushRecent(id); setTimeout(function () { if (!editing && !document.querySelector(".nsh:focus")) render(); }, 350); }
  });

  var lastOn = null;
  function syncActive() {
    if (editing) return;
    var on = side.querySelector(".nav.on[data-ni]"), id = on && on.id;
    [].forEach.call(main.querySelectorAll(".pxy"), function (p) { p.classList.toggle("on", !!id && p.getAttribute("data-for") === id); });
    var changed = id !== lastOn; lastOn = id;
    /* only open the section you clicked in (or the first one holding the page when it was opened some other way), never every section that lists it */
    var opened = false, want = clickedSid;
    secEls.forEach(function (d) {
      var has = !!(d.querySelector(".nav.on")); d.classList.toggle("has-on", has);
      if (has && changed && d.classList.contains("c") && !opened && (want ? d.getAttribute("data-sid") === want : true)) { opened = true; d.classList.remove("c"); d.querySelector(".nsh").setAttribute("aria-expanded", "true"); }
    });
    if (changed) clickedSid = null;
  }
  new MutationObserver(syncActive).observe(side, { attributes: true, attributeFilter: ["class"], subtree: true });
  render(); pullRemote();

  /* ---------- quick search (Cmd/Ctrl+K) ---------- */
  var pal = null, sel = 0, rows = [];
  function tagOf(id) {
    var g = layout.sections.filter(function (x) { return x.ids.indexOf(id) > -1; });
    return g.length ? { t: g.map(function (x) { return x.n; }).join(" · "), c: g[0].c } : { t: "", c: "#888" };
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
