/* Trading Day: one dense page for a single day. Chart (SPY always on), plan, watchlist, alerts, trades,
   screenshots, a day feed and breaking news. Opens from the Publishes calendar or the sidebar.
   Data lives on the same per-day entry Publishes already uses (trades, screenshots) plus feed, plans, grade, lesson. */
(function () {
  "use strict";
  var A = window.StockDay, root = document.getElementById("dayv");
  if (!A || !root) return;

  var D = { date: "", tab: "trades", sym: "SPY", q: {}, ent: null, pend: [], news: { tab: "watch", w: null, m: null, busy: false }, tside: "long", pside: "long", timers: [], built: false };
  try { var t0 = localStorage.getItem("ss-daytab"); if (/^(trades|feed|news)$/.test(t0)) D.tab = t0; } catch (e) {}

  var CSS = '#dayv{max-width:none;width:100%;box-sizing:border-box;padding:12px 18px 14px;display:flex;flex-direction:column;gap:10px;height:100vh;overflow:hidden;--up:var(--gain);--dn:var(--loss)}#dayv *{box-sizing:border-box}#dayv[hidden]{display:none}' +
    ':where(#dayv) input,:where(#dayv) select,:where(#dayv) textarea{padding:6px 8px;font:inherit;font-size:.82rem;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);width:auto;min-width:0;margin:0}:where(#dayv) textarea{width:100%;resize:none}#dayv input:focus,#dayv textarea:focus,#dayv select:focus{outline:2px solid color-mix(in srgb,var(--accent) 45%,transparent);outline-offset:0}' +
    ':where(#dayv) button{font:inherit}:where(#dayv) .b{padding:5px 10px;font-size:.78rem;font-weight:600;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink);cursor:pointer;white-space:nowrap}#dayv .b:hover{border-color:var(--accent)}#dayv .b.pri{background:var(--ink);color:var(--panel);border-color:var(--ink)}#dayv .b.on{background:var(--ink);color:var(--panel);border-color:var(--ink)}#dayv .b.arm{background:var(--loss);color:#fff;border-color:var(--loss)}:where(#dayv) .ib{padding:0;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:6px;background:none;color:var(--mute);cursor:pointer;font-size:.9rem;line-height:1;flex:none}#dayv .ib:hover{background:var(--bg);color:var(--ink)}' +
    '.dy-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;flex:none}.dy-dt{display:flex;align-items:center;gap:6px}.dy-dt h1{margin:0;font-size:1.25rem;letter-spacing:-.01em;white-space:nowrap}.dy-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid var(--line);border-radius:999px;background:var(--panel);font-size:.78rem;font-weight:600;white-space:nowrap}.dy-chip i{width:8px;height:8px;border-radius:50%;background:var(--mute)}.dy-chip.on i{background:var(--gain);box-shadow:0 0 0 3px color-mix(in srgb,var(--gain) 25%,transparent)}.dy-chip.pre i{background:#d4a017}.dy-chip small{color:var(--mute);font-weight:500}.dy-chip b{font-variant-numeric:tabular-nums}.gain{color:var(--gain)}.loss{color:var(--loss)}' +
    '.dy-clk b{font-size:.95rem;letter-spacing:.02em;min-width:5.6em;display:inline-block}.dy-clk{transition:background .15s,border-color .15s}.dy-clk.hot{border-color:var(--loss);animation:dyfl 1s infinite}.dy-clk.hot.fast{animation-duration:.4s}@keyframes dyfl{0%,100%{background:var(--panel)}50%{background:color-mix(in srgb,var(--loss) 38%,var(--panel))}}' +
    '.dy-sp{flex:1}.dy-les{flex:1 1 120px;min-width:110px;max-width:300px}.dy-grid{flex:1;min-height:0;display:grid;grid-template-columns:290px minmax(0,1fr) 370px;gap:10px}.dy-col{display:flex;flex-direction:column;gap:10px;min-height:0;min-width:0}' +
    '.dy-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden}.dy-h{display:flex;align-items:center;gap:8px;padding:8px 12px 6px;font:700 .68rem "Instrument Sans",sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);flex:none}.dy-h .dy-sp{flex:1}.dy-h .tt{color:var(--ink);letter-spacing:.06em}.dy-bd{padding:2px 12px 10px;overflow:auto;min-height:0;flex:1}.dy-bd.np{padding:0}' +
    '.dy-fm{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px;flex:none}.dy-fm input{flex:1 1 60px}.dy-fm .s{flex:none}.dy-fm .s{width:64px;flex:none;text-transform:uppercase}.dy-fm .b{flex:none}.dy-fm .n{flex:3 1 90px}' +
    '.dy-r{display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent);font-size:.82rem}.dy-r:last-child{border-bottom:0}.dy-sym{padding:2px 7px!important;border:0;border-radius:6px;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--ink);font-weight:700;font-size:.78rem;cursor:pointer}.dy-sym:hover{background:color-mix(in srgb,var(--accent) 28%,transparent)}.dy-nt{flex:1;min-width:0;color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dy-q{font-variant-numeric:tabular-nums;font-size:.76rem;white-space:nowrap}.dy-q b{font-weight:700}.dy-em{padding:10px 2px;color:var(--mute);font-size:.8rem}' +
    '.dy-al{padding:6px 0;border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent);font-size:.8rem}.dy-al:last-child{border-bottom:0}.dy-al .t{display:flex;align-items:center;gap:6px}.dy-al .lv{color:var(--mute);margin:2px 0 0;line-height:1.35}.dy-sd{font-size:.66rem;font-weight:700;padding:1px 6px;border-radius:5px;text-transform:uppercase;letter-spacing:.04em}.dy-sd.long{background:color-mix(in srgb,var(--gain) 18%,transparent);color:var(--gain)}.dy-sd.short{background:color-mix(in srgb,var(--loss) 18%,transparent);color:var(--loss)}.dy-al select{padding:2px 4px;font-size:.7rem;margin-left:auto}' +
    '.dy-chs{display:flex;flex-wrap:wrap;gap:5px;padding:0 12px 8px;flex:none}.dy-chs .b{padding:3px 9px}.dy-chs form{display:flex;gap:4px;margin-left:auto}.dy-chs form input{width:78px;text-transform:uppercase}.dy-cw{flex:1;min-height:0;display:flex;gap:8px;padding:0 8px 8px}.dy-cw>div{flex:1;min-width:0;min-height:0;display:flex}#dayv .sc-inl{margin:0;flex:1;display:flex;flex-direction:column;min-width:0;border-radius:10px}#dayv .sc-inl .sc-body{height:auto;flex:1;min-height:0}#dayv .sc-inl .sc-hd{padding:5px 10px}.dy-cw .sc-hd b{font-size:.78rem}' +
    '.dy-pf{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:0 12px 6px}.dy-pf input{width:74px}.dy-pf .s{width:66px;text-transform:uppercase}.dy-pc{font-size:.8rem;color:var(--mute);padding:0 12px 6px}.dy-pc b{color:var(--ink)}.dy-pl{padding:0 12px 8px;display:flex;flex-direction:column;gap:5px;max-height:104px;overflow:auto}.dy-pi{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:.78rem;padding:4px 8px;border:1px solid var(--line);border-radius:9px;background:var(--bg)}.dy-pi .sp{flex:1}.dy-pi.taken{border-color:var(--gain)}.dy-pi.skipped{opacity:.55}' +
    '.dy-tabs{display:flex;gap:4px;padding:8px 10px 0;flex:none}.dy-tabs .b{flex:1;border-radius:9px}.dy-tab{display:none;flex-direction:column;min-height:0;flex:1}.dy-tab.on{display:flex}' +
    '.dy-ts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:8px 12px 4px}.dy-ts div{border:1px solid var(--line);border-radius:10px;padding:5px 9px;background:var(--bg)}.dy-ts b{display:block;font-size:.98rem;font-variant-numeric:tabular-nums}.dy-ts small{color:var(--mute);font-size:.66rem;text-transform:uppercase;letter-spacing:.06em}' +
    '.dy-tr{padding:6px 0;border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent);font-size:.8rem}.dy-tr:last-child{border-bottom:0}.dy-tr .t{display:flex;align-items:center;gap:6px}.dy-tr .m{color:var(--mute);font-size:.74rem;margin-top:2px;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center}.dy-tr .p{margin-left:auto;font-weight:700;font-variant-numeric:tabular-nums}.dy-th{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}.dy-th a{display:block}.dy-th img{height:54px;border-radius:7px;border:1px solid var(--line);display:block}' +
    '.dy-cm{padding:8px 12px;flex:none;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px}.dy-cm .r{display:flex;gap:6px;align-items:center}.dy-pv{display:flex;gap:5px;flex-wrap:wrap}.dy-pv span{position:relative}.dy-pv img{height:46px;border-radius:7px;border:1px solid var(--line);display:block}.dy-pv button{position:absolute;top:-5px;right:-5px;width:16px;height:16px;padding:0;border:0;border-radius:50%;background:var(--ink);color:var(--panel);font-size:.65rem;cursor:pointer;line-height:1}' +
    '.dy-ps{padding:8px 0;border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent);font-size:.84rem}.dy-ps:last-child{border-bottom:0}.dy-ps .h{display:flex;gap:6px;align-items:center;color:var(--mute);font-size:.72rem;margin-bottom:2px}.dy-ps p{margin:0;white-space:pre-wrap;word-break:break-word;line-height:1.4}.dy-ps img{max-height:140px;max-width:100%;border-radius:8px;border:1px solid var(--line);margin-top:6px;display:block}' +
    '.dy-nt2{display:flex;gap:4px;padding:8px 12px 4px;flex-wrap:wrap;flex:none}.dy-nt2 .b{padding:3px 9px}.dy-nw{display:block;padding:8px 0;border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent);color:var(--ink);text-decoration:none}.dy-nw:last-child{border-bottom:0}.dy-nw:hover b{text-decoration:underline}.dy-nw b{display:block;font-size:.82rem;line-height:1.32;font-weight:600}.dy-nw small{color:var(--mute);font-size:.7rem}.dy-nw .nw{background:var(--loss);color:#fff;border-radius:4px;padding:0 5px;font-size:.6rem;font-weight:800;margin-right:4px;font-style:normal;vertical-align:1px}' +
    '.dy-live{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--gain);margin-right:4px;animation:dyp 1.6s infinite}@keyframes dyp{50%{opacity:.3}}' +
    '@media(max-width:1180px){#dayv{height:auto;overflow:visible}.dy-col .dy-card:not(.ch){flex:none!important;min-height:190px}.dy-col.c .dy-card{height:600px}.dy-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.dy-col.b{grid-column:1/-1;order:-1}.dy-col.b .dy-card.ch{height:420px}.dy-col.c{grid-column:1/-1}}@media(max-width:700px){#dayv{padding:10px 12px}.dy-grid{grid-template-columns:minmax(0,1fr)}.dy-cw{flex-direction:column}.dy-col.b .dy-card.ch{height:460px}.dy-les{max-width:none}}';
  CSS += 'body:has(#dayv:not([hidden])) .qw-fab,body:has(#dayv:not([hidden])) .qw-pop{display:none!important}';
  var st = document.createElement("style"); st.id = "day-css"; st.textContent = CSS; document.head.appendChild(st);

  function $(id) { return document.getElementById(id); }
  function esc(s) { return A.esc(s == null ? "" : s); }
  function today() { return A.todayISO(); }
  function num(v) { var n = parseFloat(String(v).replace(/,/g, "")); return isFinite(n) ? n : null; }
  function f2(v, d) { return v == null || !isFinite(v) ? "-" : Number(v).toLocaleString(undefined, { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); }
  function addDays(iso, n) { var p = iso.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2] + n); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function hm() { var d = new Date(); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function ago(ts) { var m = Math.round((Date.now() - ts) / 60000); if (m < 1) return "just now"; if (m < 60) return m + " min ago"; var h = Math.round(m / 60); if (h < 24) return h + " hr ago"; return Math.round(h / 24) + " d ago"; }
  function isToday() { return D.date === today(); }
  function fresh() { return { date: D.date, trades: [], imgs: [], outputs: [] }; }
  function cur() { return A.entries()[D.date] || null; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  async function mutate(fn) {
    var ent = cur() ? clone(cur()) : fresh(); fn(ent); ent.updated = Date.now();
    try { await A.put(ent); A.renderSide(); } catch (e) { A.toast("Could not save"); }
    D.ent = ent; return ent;
  }
  function uniq(a) { var s = {}; return a.filter(function (x) { if (!x || s[x]) return false; s[x] = 1; return true; }); }
  function board() { var b = A.al().board[D.date]; return (b && b.items) || []; }
  function daySyms() {
    var e = cur() || {}, s = board().map(function (i) { return i.sym; });
    (e.trades || []).forEach(function (t) { s.push(t.t); }); (e.dplans || []).forEach(function (p) { s.push(p.sym); });
    return uniq(s.filter(function (x) { return /^[A-Z]{1,5}(\.[A-Z])?$/.test(x); }));
  }
  function linkify(t) { return esc(t).replace(/\$([A-Za-z]{1,5})\b/g, function (m, s) { s = s.toUpperCase(); return '<button type="button" class="dy-sym" data-dysym="' + s + '">$' + s + '</button>'; }); }

  /* ---------- market clock ---------- */
  function dur(m) { var h = Math.floor(m / 60), mm = m % 60; return h ? h + "h " + mm + "m" : mm + "m"; }
  function mkt() {
    var o = {}; try { new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()).forEach(function (x) { o[x.type] = x.value; }); } catch (e) { return { s: "Market", c: "", t: "" }; }
    var m = (+o.hour % 24) * 60 + +o.minute;
    if (o.weekday === "Sat" || o.weekday === "Sun") return { s: "Closed", c: "", t: "weekend" };
    if (m >= 570 && m < 960) return { s: "Open", c: "on", t: "closes in " + dur(960 - m) };
    if (m >= 240 && m < 570) return { s: "Pre-market", c: "pre", t: "opens in " + dur(570 - m) };
    if (m >= 960 && m < 1200) return { s: "After hours", c: "pre", t: "ends in " + dur(1200 - m) };
    return { s: "Closed", c: "", t: "pre-market at 4:00" };
  }

  /* ---------- skeleton ---------- */
  function build() {
    D.built = true; D.pend = [];
    root.innerHTML = '<div class="dy-bar" id="dybar"></div>' +
      '<div class="dy-grid"><div class="dy-col a">' +
      '<div class="dy-card" style="flex:1"><div class="dy-h"><span class="tt">Watchlist</span><span class="dy-sp"></span><button type="button" class="b" data-dyact="wlimp" title="Add everything from your main watchlist">+ From my list</button></div><form class="dy-fm" id="dywf"><input class="s" id="dyws" placeholder="Ticker" maxlength="6" autocomplete="off"><input class="n" id="dywn" placeholder="Why / levels" autocomplete="off"><button class="b pri" type="submit">Add</button></form><div class="dy-bd" id="dywl"></div></div>' +
      '<div class="dy-card" style="flex:1.25"><div class="dy-h"><span class="tt">Alerts</span><span class="dy-sp"></span><span id="dyalc"></span></div><form class="dy-fm" id="dyaf"><input class="s" id="dyas" placeholder="Ticker" maxlength="6" autocomplete="off"><input class="n" id="dyat" placeholder="short below 248.8, target 246.5, stop 249.2" autocomplete="off"><button class="b pri" type="submit">Alert</button></form><div class="dy-bd" id="dyal"></div></div>' +
      '</div><div class="dy-col b">' +
      '<div class="dy-card ch" style="flex:1"><div class="dy-h"><span class="tt">Chart</span><span class="dy-sp"></span><span class="dy-q" style="text-transform:none;letter-spacing:0;font-weight:500">SPY is always on. Pick a stock to see it next to SPY.</span></div><div class="dy-chs" id="dychs"></div><div class="dy-cw" id="dycw"></div></div>' +
      '<div class="dy-card" id="dyplan" style="flex:none"></div>' +
      '</div><div class="dy-col c"><div class="dy-card" style="flex:1">' +
      '<div class="dy-tabs" id="dytabs"></div>' +
      '<div class="dy-tab" id="dytb-trades"></div><div class="dy-tab" id="dytb-feed"></div><div class="dy-tab" id="dytb-news"></div></div></div></div>';
    D.sym = "SPY"; D.charts = "";
    paintAll(); paintChart();
  }
  function paintAll() { paintBar(); paintWatch(); paintAlerts(); paintPlan(); paintTabs(); paintTrades(); paintFeed(); paintNews(); paintQuotes(); }

  /* ---------- top bar ---------- */
  function stats() {
    var t = (cur() || {}).trades || [], net = 0, w = 0, l = 0;
    t.forEach(function (x) { net += x.p || 0; if (x.open) return; if (x.p > 0) w++; else if (x.p < 0) l++; });
    return { n: t.length, net: net, w: w, l: l };
  }
  function paintBar() {
    var e = cur() || {}, s = stats(), m = mkt(), gr = e.grade || "";
    $("dybar").innerHTML = '<div class="dy-dt"><button type="button" class="ib" data-dyact="prev" aria-label="Previous day">&lsaquo;</button><h1>' + esc(A.dayLabel(D.date)) + '</h1><button type="button" class="ib" data-dyact="next" aria-label="Next day">&rsaquo;</button>' + (isToday() ? '' : '<button type="button" class="b" data-dyact="today">Today</button>') + '</div>' +
      (isToday() ? '<span class="dy-chip ' + m.c + '"><i></i>' + m.s + ' <small>' + esc(m.t) + '</small></span>' : '') +
      '<span class="dy-chip dy-clk" id="dyclk" title="New York time. Flashes in the last 10 seconds before the next 1-minute candle."><b id="dyct">--:--:--</b><small id="dycn"></small></span>' +
      '<span class="dy-chip">SPY <b data-q="SPY"></b></span>' +
      '<span class="dy-chip">Day P&amp;L <b class="' + (s.net >= 0 ? "gain" : "loss") + '">' + (s.n ? A.sgn(s.net) : "$0.00") + '</b> <small>' + s.n + (s.n === 1 ? ' trade · ' : ' trades · ') + s.w + 'W ' + s.l + 'L</small></span>' +
      '<span class="dy-sp"></span>' +
      '<input class="dy-les" id="dyles" maxlength="160" placeholder="One-line lesson from today…" value="' + esc(e.lesson || "") + '" aria-label="Lesson from today">' +
      '<select id="dygr" aria-label="Grade your day"><option value="">Grade</option>' + ["A", "B", "C", "D", "F"].map(function (g) { return '<option' + (gr === g ? " selected" : "") + '>' + g + '</option>'; }).join("") + '</select>' +
      '<button type="button" class="b" data-dyact="gen" title="Posts and write-ups generated for this day">Generated</button><button type="button" class="b" data-dyact="cal">Calendar</button>';
    paintQuotes(); tickClock();
  }

  /* ---------- watchlist ---------- */
  function paintWatch() {
    var it = board(), el = $("dywl"); if (!el) return;
    el.innerHTML = it.length ? it.map(function (i, k) {
      return '<div class="dy-r"><button type="button" class="dy-sym" data-dysym="' + esc(i.sym) + '">$' + esc(i.sym) + '</button><span class="dy-q" data-q="' + esc(i.sym) + '"></span><span class="dy-nt" title="' + esc(i.note || "") + '">' + esc(i.note || "") + '</span><button type="button" class="ib" data-dywrm="' + k + '" aria-label="Remove ' + esc(i.sym) + '">&times;</button></div>';
    }).join("") : '<div class="dy-em">Build the day\'s list. One line per stock, or pull in your main watchlist.</div>';
    paintQuotes(); paintChips();
  }
  async function addBoard(sym, note) {
    sym = String(sym || "").toUpperCase().replace(/[^A-Z.]/g, ""); if (!sym) return;
    var AL = A.al(), b = AL.board[D.date] || (AL.board[D.date] = { items: [] });
    var ex = b.items.filter(function (i) { return i.sym === sym; })[0];
    if (ex) { if (note) ex.note = note; } else b.items.push({ sym: sym, note: note || "" });
    await A.alSave(); paintWatch(); loadQ();
  }

  /* ---------- alerts ---------- */
  function dayAlerts() {
    var a = new Date(D.date + "T00:00:00").getTime(), b = a + 86400000;
    return A.al().list.filter(function (x) { return x.ts >= a && x.ts < b; });
  }
  function paintAlerts() {
    var L = dayAlerts(), el = $("dyal"); if (!el) return;
    $("dyalc").textContent = L.length ? L.length + (L.length === 1 ? " alert" : " alerts") : "";
    el.innerHTML = L.length ? L.map(function (a) {
      var f = A.alFmt(a).replace(/^(SHORT|LONG)\s?/, "");
      return '<div class="dy-al" data-alid="' + a.id + '"><div class="t"><button type="button" class="dy-sym" data-dysym="' + esc(a.sym) + '">$' + esc(a.sym) + '</button><span class="dy-sd ' + (a.side === "short" ? "short" : "long") + '">' + (a.side === "short" ? "Short" : "Long") + '</span><span class="dy-q" data-q="' + esc(a.sym) + '"></span><select data-dyalst="' + a.id + '" aria-label="Alert status">' + A.alSt.map(function (s) { return '<option value="' + s[0] + '"' + (a.status === s[0] ? " selected" : "") + '>' + s[1] + '</option>'; }).join("") + '</select><button type="button" class="ib" data-dyaldel="' + a.id + '" aria-label="Delete alert">&times;</button></div><div class="lv">' + esc(f) + ' · ' + esc(A.alAgo(a.ts)) + '</div></div>';
    }).join("") : '<div class="dy-em">Type it like you\'d say it. Alerts for ' + (isToday() ? "today" : "this day") + ' land here.</div>';
    paintQuotes();
  }

  /* ---------- chart ---------- */
  function paintChips() {
    var el = $("dychs"); if (!el) return;
    var s = uniq(["SPY", "QQQ"].concat(daySyms())).slice(0, 12);
    el.innerHTML = s.map(function (x) { return '<button type="button" class="b' + (x === D.sym ? " on" : "") + '" data-dysym="' + x + '">' + x + '</button>'; }).join("") + '<form id="dycf"><input id="dycs" placeholder="Any ticker" maxlength="6" autocomplete="off" aria-label="Chart ticker"><button class="b" type="submit">Go</button></form>';
  }
  function paintChart() {
    var host = $("dycw"); if (!host || !window.StockChart || !window.StockChart.embed) { if (host) host.innerHTML = '<div class="dy-em">Chart is not available.</div>'; return; }
    var key = D.sym; if (D.charts === key) return; D.charts = key;
    host.innerHTML = '<div id="dyc1"></div>' + (D.sym !== "SPY" ? '<div id="dyc2"></div>' : "");
    window.StockChart.embed($("dyc1"), "SPY", "5");
    if (D.sym !== "SPY") window.StockChart.embed($("dyc2"), D.sym, "5");
    paintChips();
  }
  function setSym(s) { s = String(s || "").toUpperCase().replace(/[^A-Z.]/g, ""); if (!s) return; D.sym = s; paintChart(); loadQ(); }

  /* ---------- quotes ---------- */
  async function loadQ() {
    var So = A.S(); if (!So || root.hidden) return;
    var syms = uniq(["SPY", "QQQ", D.sym].concat(daySyms())).slice(0, 24), got = {};
    if (So.schwab && D.sch !== false) { try { var r = await So.schwab("quotes", { symbols: syms.join(",") }); if (r && r.quotes && Object.keys(r.quotes).length) got = r.quotes; else D.sch = false; } catch (e) { D.sch = false; } }
    var miss = syms.filter(function (s) { return !got[s]; });
    if (miss.length && So.quotes) { try { var Q = await So.quotes(miss); Object.keys(Q.quotes || {}).forEach(function (k) { got[k] = Q.quotes[k]; }); } catch (e) {} }
    Object.keys(got).forEach(function (k) { D.q[k] = got[k]; }); paintQuotes();
  }
  function paintQuotes() {
    [].forEach.call(root.querySelectorAll("[data-q]"), function (el) {
      var q = D.q[el.getAttribute("data-q")]; if (!q || q.p == null) { el.textContent = ""; return; }
      var up = (q.dp || 0) >= 0; el.innerHTML = '<b>' + f2(q.p) + '</b> <span class="' + (up ? "gain" : "loss") + '">' + (up ? "+" : "") + f2(q.dp) + '%</span>';
    });
  }

  /* ---------- quick plan ---------- */
  function riskDefault() { var r = A.risk(); return r && r.bal > 0 && r.tpd > 0 ? Math.round(r.bal * (r.dpct || 1) / 100 / r.tpd) : ""; }
  function paintPlan() {
    var el = $("dyplan"); if (!el) return; var e = cur() || {}, L = e.dplans || [], keep = {};
    ["dpsym", "dpe", "dps", "dpt", "dpr"].forEach(function (i) { var x = $(i); if (x) keep[i] = x.value; });
    el.innerHTML = '<div class="dy-h"><span class="tt">Trade plan</span><span class="dy-sp"></span><button type="button" class="b" data-dyact="fullplan" title="Open the full A+ checklist plan">Full checklist &rarr;</button></div>' +
      '<form class="dy-pf" id="dypf"><input class="s" id="dpsym" placeholder="Ticker" maxlength="6" autocomplete="off" value="' + esc(keep.dpsym || "") + '"><button type="button" class="b ' + (D.pside === "long" ? "on" : "") + '" data-dyps="long">Long</button><button type="button" class="b ' + (D.pside === "short" ? "on" : "") + '" data-dyps="short">Short</button>' +
      '<input id="dpe" inputmode="decimal" placeholder="Entry" value="' + esc(keep.dpe || "") + '"><input id="dps" inputmode="decimal" placeholder="Stop" value="' + esc(keep.dps || "") + '"><input id="dpt" inputmode="decimal" placeholder="Target" value="' + esc(keep.dpt || "") + '"><input id="dpr" inputmode="decimal" placeholder="Risk $" value="' + esc(keep.dpr != null && keep.dpr !== "" ? keep.dpr : riskDefault()) + '"><button class="b pri" type="submit">Save plan</button></form>' +
      '<div class="dy-pc" id="dypc"></div>' +
      '<div class="dy-pl">' + L.map(function (p) {
        return '<div class="dy-pi ' + p.st + '"><button type="button" class="dy-sym" data-dysym="' + esc(p.sym) + '">$' + esc(p.sym) + '</button><span class="dy-sd ' + p.side + '">' + (p.side === "short" ? "Short" : "Long") + '</span><span>' + f2(p.e) + ' → stop ' + f2(p.s) + (p.t ? ' → ' + f2(p.t) : '') + '</span><span class="dy-nt">' + (p.sh ? p.sh + ' sh' : '') + (p.rr ? ' · ' + f2(p.rr, 1) + 'R' : '') + '</span><span class="sp"></span>' +
          ['planned', 'taken', 'skipped'].map(function (k) { return '<button type="button" class="b' + (p.st === k ? " on" : "") + '" style="padding:2px 7px" data-dypst="' + p.id + '|' + k + '">' + k[0].toUpperCase() + k.slice(1) + '</button>'; }).join("") +
          '<button type="button" class="b" style="padding:2px 7px" data-dypalert="' + p.id + '">Alert</button><button type="button" class="b" style="padding:2px 7px" data-dyplog="' + p.id + '">Log trade</button><button type="button" class="ib" data-dypdel="' + p.id + '" aria-label="Delete plan">&times;</button></div>';
      }).join("") + '</div>';
    calcPlan();
  }
  function planCalc() {
    var e = num($("dpe") && $("dpe").value), s = num($("dps") && $("dps").value), t = num($("dpt") && $("dpt").value), r = num($("dpr") && $("dpr").value);
    if (e == null || s == null || e === s) return null;
    var per = Math.abs(e - s), sh = r > 0 ? Math.floor(r / per) : 0, rr = t != null ? Math.abs(t - e) / per : null;
    return { e: e, s: s, t: t, r: r, per: per, sh: sh, rr: rr, ok: (D.pside === "long" ? s < e : s > e) };
  }
  function calcPlan() {
    var c = planCalc(), el = $("dypc"); if (!el) return;
    if (!c) { el.innerHTML = 'Enter entry and stop and I\'ll size it from your risk.'; return; }
    el.innerHTML = (c.ok ? '' : '<span class="loss">Stop is on the wrong side of entry for a ' + D.pside + '. </span>') + 'Shares <b>' + c.sh + '</b> · Risk <b>' + (c.r > 0 ? '$' + f2(c.sh * c.per) : '-') + '</b>' + (c.rr != null ? ' · R:R <b>' + f2(c.rr, 1) + '</b> · Reward <b>$' + f2(c.sh * Math.abs(c.t - c.e)) + '</b>' : '');
  }

  /* ---------- right column ---------- */
  function paintTabs() {
    var el = $("dytabs"); if (!el) return;
    el.innerHTML = [["trades", "Trades"], ["feed", "Feed"], ["news", "News"]].map(function (t) { return '<button type="button" class="b' + (D.tab === t[0] ? " on" : "") + '" data-dytab="' + t[0] + '">' + t[1] + '</button>'; }).join("");
    ["trades", "feed", "news"].forEach(function (k) { var p = $("dytb-" + k); if (p) p.classList.toggle("on", D.tab === k); });
  }
  function setTab(t) { D.tab = t; try { localStorage.setItem("ss-daytab", t); } catch (e) {} paintTabs(); if (t === "news") loadNews(); }

  /* trades */
  function paintTrades() {
    var el = $("dytb-trades"); if (!el) return; var e = cur() || {}, T = e.trades || [], s = stats(), imgs = e.imgs || [];
    var best = T.filter(function (t) { return !t.open; }).sort(function (a, b) { return b.p - a.p; })[0];
    var setups = uniq(T.map(function (t) { return t.u; }));
    var keep = {}; ["dtsym", "dtq", "dte", "dtx", "dtu", "dtn"].forEach(function (i) { var x = $(i); if (x) keep[i] = x.value; });
    el.innerHTML = '<div class="dy-ts"><div><b class="' + (s.net >= 0 ? "gain" : "loss") + '">' + (s.n ? A.sgn(s.net) : "$0.00") + '</b><small>Net P&amp;L</small></div><div><b>' + (s.w + s.l ? Math.round(s.w / (s.w + s.l) * 100) + "%" : "-") + '</b><small>Win rate</small></div><div><b>' + (best ? A.sgn(best.p) : "-") + '</b><small>Best</small></div></div>' +
      '<form class="dy-fm" id="dytf" style="padding-top:4px"><input class="s" id="dtsym" placeholder="Ticker" maxlength="6" autocomplete="off" value="' + esc(keep.dtsym || "") + '"><button type="button" class="b ' + (D.tside === "long" ? "on" : "") + '" data-dyts="long">Long</button><button type="button" class="b ' + (D.tside === "short" ? "on" : "") + '" data-dyts="short">Short</button>' +
      '<input id="dtq" inputmode="decimal" placeholder="Qty" style="width:60px;flex:none" value="' + esc(keep.dtq || "") + '"><input id="dte" inputmode="decimal" placeholder="Entry" style="width:72px;flex:none" value="' + esc(keep.dte || "") + '"><input id="dtx" inputmode="decimal" placeholder="Exit" style="width:72px;flex:none" value="' + esc(keep.dtx || "") + '">' +
      '<input id="dtu" class="n" list="dysetups" placeholder="Setup" value="' + esc(keep.dtu || "") + '"><datalist id="dysetups">' + setups.map(function (u) { return '<option value="' + esc(u) + '">'; }).join("") + '</datalist><input id="dtn" class="n" placeholder="Note" value="' + esc(keep.dtn || "") + '"><button class="b pri" type="submit">Log trade</button></form>' +
      '<div class="dy-bd" id="dytl">' + (T.length ? T.map(function (t, i) {
        var pics = t.id ? imgs.filter(function (m) { return m.ti === t.id; }) : [];
        return '<div class="dy-tr"><div class="t"><button type="button" class="dy-sym" data-dysym="' + esc(t.t) + '">$' + esc(t.t) + '</button><span class="dy-sd ' + (t.s === "Short" ? "short" : "long") + '">' + esc(t.s) + '</span><span>' + esc(t.q) + ' @ ' + f2(t.e) + (t.open ? '' : ' → ' + f2(t.x)) + '</span>' +
          (t.open ? '<input data-dyclose="' + i + '" placeholder="Exit price" inputmode="decimal" style="width:84px;margin-left:auto"><button type="button" class="b" data-dyclosego="' + i + '">Close</button>' : '<span class="p ' + (t.p >= 0 ? "gain" : "loss") + '">' + A.sgn(t.p) + '</span>') +
          '</div><div class="m"><span>' + esc(t.tm || "") + '</span>' + (t.u ? '<span>' + esc(t.u) + '</span>' : '') + (t.n ? '<span>' + esc(t.n) + '</span>' : '') + '<span style="margin-left:auto"><button type="button" class="ib" data-dytpic="' + i + '" title="Attach a screenshot" aria-label="Attach a screenshot">&#128247;</button><button type="button" class="ib" data-dytdel="' + i + '" aria-label="Delete trade">&times;</button></span></div>' +
          (pics.length ? '<div class="dy-th">' + pics.map(function (m) { var u = A.imgUrl(m); return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img alt="Trade screenshot" src="' + esc(u) + '"></a>' : ""; }).join("") + '</div>' : '') + '</div>';
      }).join("") : '<div class="dy-em">Log trades as you take them. Add a screenshot to any trade with the camera.</div>') + '</div>' +
      '<input type="file" id="dytfile" accept="image/*" hidden>';
    D.tpic = null;
  }

  /* feed */
  function paintFeed() {
    var el = $("dytb-feed"); if (!el) return; var e = cur() || {}, P = (e.feed || []).slice().reverse();
    var keep = $("dyft") ? $("dyft").value : "";
    el.innerHTML = '<div class="dy-bd" id="dyfl">' + (P.length ? P.map(function (p) {
      var u = A.imgUrl(p);
      return '<div class="dy-ps"><div class="h"><span>' + esc(new Date(p.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })) + '</span><span class="dy-sp"></span><button type="button" class="b" style="padding:1px 7px;font-size:.68rem" data-dyshare="' + p.id + '">Share to wall</button><button type="button" class="ib" data-dyfdel="' + p.id + '" aria-label="Delete post">&times;</button></div>' + (p.tx ? '<p>' + linkify(p.tx) + '</p>' : '') + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img alt="Screenshot" src="' + esc(u) + '"></a>' : '') + '</div>';
    }).join("") : '<div class="dy-em">Your running log for the day. Post a thought, a read on the market, or paste a screenshot with Ctrl+V.</div>') + '</div>' +
      '<div class="dy-cm"><div class="dy-pv" id="dypv">' + D.pend.map(function (d, i) { return '<span><img alt="Pending screenshot" src="' + d + '"><button type="button" data-dypvx="' + i + '" aria-label="Remove">&times;</button></span>'; }).join("") + '</div>' +
      '<textarea id="dyft" rows="2" placeholder="Comment on the day, post anything… use $NVDA to tag a stock" maxlength="2000">' + esc(keep) + '</textarea><div class="r"><button type="button" class="b" data-dyact="fpic">&#128247; Screenshot</button><input type="file" id="dyffile" accept="image/*" multiple hidden><span class="dy-sp" style="flex:1"></span><button type="button" class="b pri" data-dyact="post">Post</button></div></div>';
  }
  async function packImg(d) {
    var s = A.store(); if (s.db && s.assets) { try { return { aid: (await s.assets.upload(A.dataToBlob(d), { type: "image/jpeg" })).id }; } catch (e) { return null; } }
    return { src: d };
  }
  async function addPend(files) {
    var n = 0; for (var i = 0; i < files.length; i++) { var f = files[i]; if (!/^image\//.test(f.type)) continue; if (D.pend.length >= 4) { A.toast("Up to 4 screenshots per post"); break; } try { D.pend.push(await A.shrink(f, 1100)); n++; } catch (e) { A.toast("Could not read that image"); } }
    if (n) { if (D.tab !== "feed") setTab("feed"); else paintFeed(); }
  }

  /* news */
  function nwItem(x) {
    var u = /^https?:\/\//.test(x.url || "") ? x.url : "", isNew = Date.now() - x.ts < 30 * 60000;
    return (u ? '<a class="dy-nw" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' : '<div class="dy-nw">') + '<b>' + (isNew ? '<i class="nw">NEW</i>' : '') + (x.sym ? '<span class="dy-sym" style="margin-right:5px" data-dysym="' + esc(x.sym) + '">$' + esc(x.sym) + '</span>' : '') + esc(x.title) + '</b><small>' + esc(x.source || "") + ' · ' + esc(ago(x.ts)) + (x.kind === "filing" ? ' · SEC filing' : '') + '</small>' + (u ? '</a>' : '</div>');
  }
  function paintNews() {
    var el = $("dytb-news"); if (!el) return; var N = D.news, tab = N.tab;
    var tabs = [["watch", "My stocks"], ["market", "Market"], ["econ", "Economic"], ["earn", "Earnings"]];
    var body = "";
    if (!isToday()) body = '<div class="dy-em">News is live, so it shows today\'s headlines. Open today to use it.</div>';
    else if (tab === "watch") body = N.w == null ? '<div class="dy-em">' + (N.busy ? "Loading…" : "Add stocks to the day\'s watchlist or log a trade and their headlines show up here.") + '</div>' : N.w.length ? N.w.map(nwItem).join("") : '<div class="dy-em">No fresh headlines for your stocks right now.</div>';
    else {
      var M = N.m; if (!M) body = '<div class="dy-em">' + (N.busy ? "Loading…" : "Market news is not available right now.") + '</div>';
      else if (M.configured === false) body = '<div class="dy-em">Add FINNHUB_KEY in Vercel to turn on market and economic headlines.</div>';
      else if (tab === "market") body = (M.market || []).length ? M.market.map(nwItem).join("") : '<div class="dy-em">Nothing yet.</div>';
      else if (tab === "econ") body = (M.econ || []).length ? M.econ.map(nwItem).join("") : '<div class="dy-em">No economic headlines right now. Fed, inflation, jobs and rates stories show here.</div>';
      else body = (M.earnings || []).length ? M.earnings.map(function (e) {
        var when = { bmo: "Before open", amc: "After close", dmh: "During hours" }[e.hour] || "";
        return '<div class="dy-r"><button type="button" class="dy-sym" data-dysym="' + esc(e.sym) + '">$' + esc(e.sym) + '</button><span class="dy-nt">' + esc(when) + '</span><span class="dy-q">' + (e.eps != null ? 'EPS est ' + f2(e.eps) : '') + '</span></div>';
      }).join("") : '<div class="dy-em">No earnings reports scheduled today.</div>';
    }
    el.innerHTML = '<div class="dy-nt2">' + tabs.map(function (t) { return '<button type="button" class="b' + (tab === t[0] ? " on" : "") + '" data-dynw="' + t[0] + '">' + t[1] + '</button>'; }).join("") + '<span class="dy-sp" style="flex:1"></span>' + (isToday() ? '<span class="dy-q" style="align-self:center"><span class="dy-live"></span>Live</span><button type="button" class="b" data-dyact="nwref">Refresh</button>' : '') + '</div><div class="dy-bd">' + body + '</div>';
  }
  async function loadNews() {
    var So = A.S(); if (!So || D.news.busy || !isToday()) return; D.news.busy = true;
    try {
      if (D.news.tab === "watch") {
        var syms = daySyms(); if (!syms.length && window.StockWatch) syms = window.StockWatch.list();
        if (syms.length && So.news) { var r = await So.news(syms.slice(0, 15)); D.news.w = (r.items || []).slice(0, 40); } else D.news.w = [];
      } else if (So.marketNews) D.news.m = await So.marketNews();
    } catch (e) { if (D.news.tab === "watch") D.news.w = []; }
    D.news.busy = false; if (!root.hidden) paintNews();
  }

  /* ---------- events ---------- */
  function confirmBtn(b, label, fn) { if (b.dataset.armed) { delete b.dataset.armed; fn(); return; } var t = b.innerHTML; b.dataset.armed = "1"; b.classList.add("arm"); b.textContent = label; setTimeout(function () { if (b.dataset.armed) { delete b.dataset.armed; b.classList.remove("arm"); b.innerHTML = t; } }, 2600); }
  root.addEventListener("click", async function (ev) {
    var b = ev.target.closest && ev.target.closest("button, .dy-sym[data-dysym]"); if (!b) return; var d = b.dataset;
    if (d.dysym) { setSym(d.dysym); return; }
    if (d.dytab) { setTab(d.dytab); return; }
    if (d.dynw) { D.news.tab = d.dynw; paintNews(); loadNews(); return; }
    if (d.dyts) { D.tside = d.dyts; paintTrades(); return; }
    if (d.dyps) { D.pside = d.dyps; paintPlan(); return; }
    var act = d.dyact;
    if (act === "prev") return open(addDays(D.date, -1)); if (act === "next") return open(addDays(D.date, 1)); if (act === "today") return open(today());
    if (act === "cal") return A.calendar();
    if (act === "gen") { var e = cur(); if (e && (e.outputs || []).length) A.openEntry(D.date); else A.toast("Nothing generated for this day yet. Use Studio to create posts from your trades."); return; }
    if (act === "fullplan") return A.plan();
    if (act === "nwref") { D.news.w = null; D.news.m = null; paintNews(); loadNews(); return; }
    if (act === "wlimp") { var L = window.StockWatch ? window.StockWatch.list() : []; if (!L.length) { A.toast("Your main watchlist is empty"); return; } var AL = A.al(), bd = AL.board[D.date] || (AL.board[D.date] = { items: [] }); L.slice(0, 25).forEach(function (s) { if (!bd.items.some(function (i) { return i.sym === s; })) bd.items.push({ sym: s, note: "" }); }); await A.alSave(); paintWatch(); loadQ(); return; }
    if (d.dywrm != null) { var AL2 = A.al(), b2 = AL2.board[D.date]; if (b2) { b2.items.splice(+d.dywrm, 1); await A.alSave(); paintWatch(); } return; }
    if (d.dyaldel) { var AL3 = A.al(); AL3.list = AL3.list.filter(function (x) { return x.id !== d.dyaldel; }); await A.alSave(); paintAlerts(); return; }
    if (d.dypst) { var pp = d.dypst.split("|"); await mutate(function (e2) { (e2.dplans || []).forEach(function (p) { if (p.id === pp[0]) p.st = pp[1]; }); }); paintPlan(); return; }
    if (d.dypdel) { await mutate(function (e2) { e2.dplans = (e2.dplans || []).filter(function (p) { return p.id !== d.dypdel; }); }); paintPlan(); return; }
    if (d.dypalert) { var pl = ((cur() || {}).dplans || []).filter(function (p) { return p.id === d.dypalert; })[0]; if (!pl) return; var AL4 = A.al();
      AL4.list.unshift({ id: "a" + Date.now().toString(36) + Math.floor(Math.random() * 1e3), ts: isToday() ? Date.now() : new Date(D.date + "T12:00:00").getTime(), sym: pl.sym, side: pl.side, trig: pl.e, tw: null, t1: pl.t || null, stop: pl.s, rr: pl.rr || null, raw: pl.sym + " " + pl.side + " entry " + pl.e + " stop " + pl.s + (pl.t ? " target " + pl.t : ""), status: "watching", posted: 0 });
      await A.alSave(); paintAlerts(); A.toast("Alert created from your plan"); return; }
    if (d.dyplog) { var pl2 = ((cur() || {}).dplans || []).filter(function (p) { return p.id === d.dyplog; })[0]; if (!pl2) return; D.tside = pl2.side; setTab("trades"); paintTrades(); $("dtsym").value = pl2.sym; $("dtq").value = pl2.sh || ""; $("dte").value = pl2.e; $("dtq").focus(); return; }
    if (d.dytdel != null) { confirmBtn(b, "Sure?", async function () { await mutate(function (e2) { e2.trades.splice(+d.dytdel, 1); }); paintTrades(); paintBar(); }); return; }
    if (d.dytpic != null) { D.tpic = +d.dytpic; $("dytfile").click(); return; }
    if (d.dyclosego != null) { var inp = root.querySelector('[data-dyclose="' + d.dyclosego + '"]'), x = num(inp && inp.value); if (x == null || x <= 0) { A.toast("Enter the exit price"); return; }
      await mutate(function (e2) { var t = e2.trades[+d.dyclosego]; if (!t) return; t.x = x; t.open = 0; t.p = Math.round((x - t.e) * t.q * (t.s === "Short" ? -1 : 1) * 100) / 100; }); paintTrades(); paintBar(); return; }
    if (act === "fpic") { $("dyffile").click(); return; }
    if (d.dypvx != null) { D.pend.splice(+d.dypvx, 1); paintFeed(); return; }
    if (d.dyfdel) { confirmBtn(b, "Sure?", async function () { await mutate(function (e2) { e2.feed = (e2.feed || []).filter(function (p) { return p.id !== d.dyfdel; }); }); paintFeed(); }); return; }
    if (d.dyshare) { var po = ((cur() || {}).feed || []).filter(function (p) { return p.id === d.dyshare; })[0], So = A.S(); if (!po || !po.tx || !So || !So.addPost) { A.toast("Only text posts can be shared"); return; }
      confirmBtn(b, "Post to wall?", async function () { try { await So.addPost(So.uid(), po.tx + "\n\nSelf-reported. Not financial advice.", []); A.toast("Posted to your wall"); } catch (e3) { A.toast("Could not post"); } }); return; }
    if (act === "post") {
      var tx = ($("dyft").value || "").trim(); if (!tx && !D.pend.length) return; b.disabled = true;
      try {
        var packs = []; for (var i = 0; i < D.pend.length; i++) { var pk = await packImg(D.pend[i]); if (pk) packs.push(pk); }
        var base = tx, ts = Date.now();
        await mutate(function (e2) { e2.feed = e2.feed || []; if (packs.length) packs.forEach(function (pk2, k) { e2.feed.push(Object.assign({ id: A.newId(), ts: ts + k, tx: k === 0 ? base : "" }, pk2)); }); else e2.feed.push({ id: A.newId(), ts: ts, tx: base }); e2.feed = e2.feed.slice(-200); });
        D.pend = []; $("dyft").value = ""; paintFeed();
      } finally { b.disabled = false; }
    }
  });
  root.addEventListener("submit", async function (ev) {
    ev.preventDefault(); var f = ev.target.id;
    if (f === "dywf") { await addBoard($("dyws").value, $("dywn").value.trim()); $("dyws").value = ""; $("dywn").value = ""; $("dyws").focus(); return; }
    if (f === "dycf") { setSym($("dycs").value); return; }
    if (f === "dyaf") {
      var p = A.alParse($("dyat").value, $("dyas").value); if (!p.raw) return; if (!p.sym) { A.toast("Add a ticker"); return; }
      var AL = A.al(); AL.list.unshift({ id: "a" + Date.now().toString(36) + Math.floor(Math.random() * 1e3), ts: isToday() ? Date.now() : new Date(D.date + "T12:00:00").getTime(), sym: p.sym, side: p.side, trig: p.trig, tw: p.tw, t1: p.t1, stop: p.stop, rr: p.rr, raw: p.raw, status: "watching", posted: 0 });
      await A.alSave(); $("dyat").value = ""; $("dyas").value = ""; paintAlerts(); loadQ(); return;
    }
    if (f === "dypf") {
      var sym = ($("dpsym").value || "").toUpperCase().replace(/[^A-Z.]/g, ""), c = planCalc(); if (!sym) { A.toast("Add the ticker"); return; } if (!c) { A.toast("Add entry and stop"); return; } if (!c.ok) { A.toast("Stop is on the wrong side of entry"); return; }
      await mutate(function (e) { e.dplans = e.dplans || []; e.dplans.push({ id: A.newId(), ts: Date.now(), sym: sym, side: D.pside, e: c.e, s: c.s, t: c.t || 0, sh: c.sh, risk: c.r || 0, rr: c.rr ? Math.round(c.rr * 100) / 100 : 0, st: "planned" }); });
      ["dpsym", "dpe", "dps", "dpt"].forEach(function (i) { $(i).value = ""; }); paintPlan(); paintChips(); loadQ(); return;
    }
    if (f === "dytf") {
      var s = ($("dtsym").value || "").toUpperCase().replace(/[^A-Z.]/g, ""), q = num($("dtq").value), en = num($("dte").value), ex = num($("dtx").value);
      if (!s || !(q > 0) || !(en > 0)) { A.toast("Ticker, quantity and entry are needed"); return; }
      var side = D.tside === "short" ? "Short" : "Long", open = !(ex > 0), pnl = open ? 0 : Math.round((ex - en) * q * (side === "Short" ? -1 : 1) * 100) / 100;
      await mutate(function (e) { e.trades = e.trades || []; e.trades.push({ id: A.newId(), t: s, s: side, q: q, e: en, x: open ? 0 : ex, d: D.date, tm: isToday() ? hm() : "", ot: "", u: $("dtu").value.trim(), n: $("dtn").value.trim(), p: pnl, open: open ? 1 : 0 }); });
      ["dtsym", "dtq", "dte", "dtx", "dtn"].forEach(function (i) { $(i).value = ""; }); paintTrades(); paintBar(); paintChips(); loadQ(); $("dtsym").focus();
    }
  });
  root.addEventListener("input", function (ev) { var id = ev.target.id; if (/^dp(e|s|t|r)$/.test(id)) calcPlan(); });
  root.addEventListener("change", async function (ev) {
    var t = ev.target;
    if (t.id === "dygr") { await mutate(function (e) { e.grade = t.value; }); return; }
    if (t.id === "dyles") { await mutate(function (e) { e.lesson = t.value.trim().slice(0, 160); }); A.toast("Lesson saved"); return; }
    if (t.dataset && t.dataset.dyalst) { var AL = A.al(); AL.list.forEach(function (a) { if (a.id === t.dataset.dyalst) a.status = t.value; }); await A.alSave(); return; }
    if (t.id === "dyffile") { await addPend(t.files); t.value = ""; return; }
    if (t.id === "dytfile") {
      var f = t.files[0], idx = D.tpic; t.value = ""; if (!f || idx == null) return;
      try {
        var d = await A.shrink(f, 1100), pk = await packImg(d); if (!pk) { A.toast("Could not save that picture"); return; }
        await mutate(function (e) { var tr = e.trades[idx]; if (!tr) return; if (!tr.id) tr.id = A.newId(); e.imgs = e.imgs || []; if (e.imgs.length >= 24) e.imgs.shift(); e.imgs.push(Object.assign({ cap: tr.t + " trade", tid: "", sl: 0, ti: tr.id }, pk)); });
        paintTrades(); A.toast("Screenshot added");
      } catch (e2) { A.toast("Could not read that image"); }
    }
  });
  document.addEventListener("paste", function (ev) {
    if (root.hidden || !ev.clipboardData) return; var tg = ev.target, files = [];
    [].forEach.call(ev.clipboardData.items || [], function (it) { if (it.kind === "file" && /^image\//.test(it.type)) { var f = it.getAsFile(); if (f) files.push(f); } });
    if (!files.length) return; ev.preventDefault(); addPend(files);
  });
  root.addEventListener("dragover", function (ev) { if (ev.dataTransfer && [].indexOf.call(ev.dataTransfer.types || [], "Files") > -1) ev.preventDefault(); });
  root.addEventListener("drop", function (ev) { if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length) { ev.preventDefault(); addPend(ev.dataTransfer.files); } });

  /* ---------- real-time clock: New York time, seconds, flashes before the next candle ---------- */
  var clkFmt = null;
  function tickClock() {
    var b = $("dyct"); if (!b) return;
    var now = Date.now();
    try { clkFmt = clkFmt || new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }); b.textContent = clkFmt.format(now); } catch (e) { b.textContent = new Date(now).toLocaleTimeString([], { hour12: false }); }
    var s1 = 60 - (Math.floor(now / 1000) % 60), m5 = 300 - (Math.floor(now / 1000) % 300);
    var f = function (n) { return Math.floor(n / 60) + ":" + ("0" + (n % 60)).slice(-2); };
    var cn = $("dycn"); if (cn) cn.textContent = "1m " + f(s1) + " · 5m " + f(m5);
    var box = $("dyclk"); if (box) { box.classList.toggle("hot", s1 <= 10); box.classList.toggle("fast", s1 <= 3); }
  }
  /* ---------- show ---------- */
  function stop() { D.timers.forEach(clearInterval); D.timers = []; }
  function startTimers() {
    stop();
    D.timers.push(setInterval(function () { if (root.hidden) return stop(); tickClock(); }, 250));
    D.timers.push(setInterval(function () { if (root.hidden) return stop(); if (isToday()) { paintBarClock(); } }, 30000));
    D.timers.push(setInterval(function () { if (root.hidden) return stop(); if (!document.hidden) loadQ(); }, 20000));
    D.timers.push(setInterval(function () { if (root.hidden) return stop(); if (!document.hidden && D.tab === "news" && isToday()) { D.news.w = D.news.tab === "watch" ? null : D.news.w; loadNews(); } }, 60000));
  }
  function paintBarClock() { if (!document.activeElement || document.activeElement.id !== "dyles") paintBar(); }
  async function open(date) {
    D.date = /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? date : (D.date || today());
    A.hide(); root.hidden = false; $("navday").classList.add("on"); window.scrollTo(0, 0);
    try { await A.alLoad(); if (window.StockWatch) await window.StockWatch.load(); } catch (e) {}
    if (root.hidden) return;
    D.news.w = null; D.news.m = null; D.pend = [];
    build(); loadQ(); if (D.tab === "news") loadNews(); startTimers();
  }
  window.TradingDay = { show: open };
  new MutationObserver(function () { if (root.hidden) stop(); }).observe(root, { attributes: true, attributeFilter: ["hidden"] });
})();
