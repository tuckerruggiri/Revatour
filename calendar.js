/* Revatour private calendar: day / week / month / year / schedule views,
   events, reminders, to-dos, repeats, drag to move, and a link to the To-do list.
   Private to the signed-in user (Supabase docs "calendar/main", or this browser). */
(function () {
  "use strict";
  var KEY = "stockspot-calendar-v1";
  var C = { ev: [], link: true, view: "month", cur: today(), loaded: false, q: "", notified: {} };
  var COLORS = [["#2F6FE4", "Blue"], ["#17845B", "Green"], ["#E0662B", "Orange"], ["#C2364A", "Red"], ["#7C4DCC", "Purple"], ["#0F8A8A", "Teal"], ["#8A93A3", "Gray"]];
  var MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var host = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ds(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function pd(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function today() { return ds(new Date()); }
  function add(s, n) { var d = pd(s); d.setDate(d.getDate() + n); return ds(d); }
  function addM(s, n) { var d = pd(s), day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return ds(d); }
  function dow(s) { return pd(s).getDay(); }
  function wkStart(s) { return add(s, -dow(s)); }
  function diff(a, b) { return Math.round((pd(b) - pd(a)) / 864e5); }
  function mins(t) { if (!t) return 0; var p = t.split(":"); return +p[0] * 60 + +p[1]; }
  function fmtT(t) { if (!t) return ""; var m = mins(t), h = Math.floor(m / 60), mm = m % 60; return ((h % 12) || 12) + (mm ? ":" + pad(mm) : "") + (h < 12 ? "am" : "pm"); }
  function nice(s, long) { var d = pd(s); return (long ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()] + ", " : "") + MN[d.getMonth()].slice(0, long ? 99 : 3) + " " + d.getDate() + (long ? ", " + d.getFullYear() : ""); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(m) { if (window.toast) try { window.toast(m); return; } catch (e) {} }

  /* ---------- storage ---------- */
  function db() { try { return window.store && window.store.db; } catch (e) { return null; } }
  async function load() {
    var src = db() ? "db" : "ls";
    if (C.loaded && C.from === src) return;
    C.from = src;
    try {
      var d = null, s = db();
      if (s) { var r = await s.doc("calendar/main").get(); if (r && r.exists) d = r.data(); }
      else d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (d) { C.ev = d.ev || []; C.link = d.link !== false; C.view = d.view || "month"; }
    } catch (e) {}
    C.loaded = true;
  }
  async function save() {
    var o = { ev: C.ev.slice(0, 3000), link: C.link, view: C.view, updated: Date.now() };
    try { var s = db(); if (s) await s.doc("calendar/main").set(o); else localStorage.setItem(KEY, JSON.stringify(o)); }
    catch (e) { toast("Could not save your calendar"); }
  }

  /* ---------- to-do list link (uses the To-do tab's own data) ---------- */
  function TDx() { try { return window.TD; } catch (e) { return null; } }
  async function tdReady() { try { if (window.todoLoad) await window.todoLoad(); } catch (e) {} }
  function tdSave() { try { if (window.todoSave) window.todoSave(); } catch (e) {} }

  /* ---------- repeats ---------- */
  function hits(e, day) {
    if (e.ex && e.ex.indexOf(day) >= 0) return false;
    if (day < e.date) return false;
    var r = e.rec; if (!r || !r.f) return day === e.date;
    if (r.until && day > r.until) return false;
    var n = Math.max(1, r.n || 1), dd = diff(e.date, day), a = pd(e.date), b = pd(day);
    switch (r.f) {
      case "daily": return dd % n === 0;
      case "weekdays": return b.getDay() > 0 && b.getDay() < 6;
      case "weekly": return Math.floor(diff(wkStart(e.date), wkStart(day)) / 7) % n === 0 && (r.days && r.days.length ? r.days : [a.getDay()]).indexOf(b.getDay()) >= 0;
      case "monthly": var mo = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth(); return mo % n === 0 && (b.getDate() === a.getDate() || (a.getDate() > b.getDate() && b.getDate() === new Date(b.getFullYear(), b.getMonth() + 1, 0).getDate()));
      case "yearly": return b.getMonth() === a.getMonth() && b.getDate() === a.getDate() && (b.getFullYear() - a.getFullYear()) % n === 0;
    }
    return false;
  }
  function nextAfter(rec, from, anchor) { var probe = { date: anchor && anchor <= from ? anchor : from, rec: rec }; for (var i = 1; i < 800; i++) { var d = add(from, i); if (hits(probe, d)) return d; } return add(from, 1); }
  function recLabel(r, date) {
    if (!r || !r.f) return "";
    var n = r.n || 1, d = pd(date);
    var L = { daily: n > 1 ? "Every " + n + " days" : "Every day", weekdays: "Every weekday", weekly: (n > 1 ? "Every " + n + " weeks" : "Every week") + " on " + (r.days && r.days.length ? r.days : [d.getDay()]).map(function (x) { return DN[x]; }).join(", "), monthly: (n > 1 ? "Every " + n + " months" : "Every month") + " on the " + d.getDate() + ord(d.getDate()), yearly: "Every year on " + MN[d.getMonth()].slice(0, 3) + " " + d.getDate() }[r.f] || "";
    return L + (r.until ? ", until " + nice(r.until) : "");
  }
  function ord(n) { return (n % 100 > 10 && n % 100 < 14) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"); }

  /* ---------- items shown on a day ---------- */
  function itemsOn(day) {
    var q = C.q.toLowerCase(), out = [];
    C.ev.forEach(function (e) { if (hits(e, day) && (!q || (e.t + " " + (e.notes || "")).toLowerCase().indexOf(q) >= 0)) out.push({ src: "cal", e: e, day: day, done: !!(e.dn && e.dn.indexOf(day) >= 0) }); });
    var T = TDx();
    if (C.link && T && T.items) T.items.forEach(function (i) {
      if (!i.due) return;
      var on = i.rec && i.rec.f && !i.done ? hits({ date: i.due, rec: i.rec }, day) && day >= i.due : i.due === day;
      if (on && (!q || i.t.toLowerCase().indexOf(q) >= 0)) out.push({ src: "td", e: { id: i.id, t: i.t, kind: "todo", allDay: true, color: i.p === "h" ? "#C2364A" : "#17845B", rec: i.rec }, day: day, done: day === i.due ? !!i.done : false, ti: i });
    });
    out.sort(function (a, b) { var x = a.e.allDay ? -1 : mins(a.e.start), y = b.e.allDay ? -1 : mins(b.e.start); return x - y || (a.e.t > b.e.t ? 1 : -1); });
    return out;
  }
  function icon(k) { return k === "todo" ? "&#9744;" : k === "reminder" ? "&#128276;" : ""; }
  function chip(it, cls) {
    var e = it.e, k = e.kind || "event";
    return '<button type="button" class="ccal-chip ' + (cls || "") + (it.done ? " done" : "") + (k !== "event" ? " k-" + k : "") + '" style="--c:' + esc(e.color || "#2F6FE4") + '" data-cev="' + esc(e.id) + '" data-csrc="' + it.src + '" data-cday="' + it.day + '" draggable="false" title="' + esc(e.t) + '">' +
      (k !== "event" ? '<span class="ck" data-ctoggle="1" role="checkbox" aria-checked="' + it.done + '" aria-label="Mark done">' + (it.done ? "&#9745;" : (k === "reminder" ? "&#128276;" : "&#9744;")) + '</span>' : '') +
      (!e.allDay && e.start ? '<b>' + fmtT(e.start) + '</b> ' : '') + esc(e.t) + (e.rec && e.rec.f ? ' <i class="rp" aria-label="Repeats">&#8635;</i>' : '') + '</button>';
  }

  /* ---------- views ---------- */
  function title() {
    var c = C.cur, d = pd(c);
    if (C.view === "day") return nice(c, true);
    if (C.view === "week") { var a = wkStart(c), b = add(a, 6), A = pd(a), B = pd(b); return A.getMonth() === B.getMonth() ? MN[A.getMonth()] + " " + A.getDate() + " – " + B.getDate() + ", " + B.getFullYear() : nice(a) + " – " + nice(b) + ", " + B.getFullYear(); }
    if (C.view === "year") return String(d.getFullYear());
    if (C.view === "agenda") return "Schedule from " + nice(c);
    return MN[d.getMonth()] + " " + d.getFullYear();
  }
  function monthView() {
    var d = pd(C.cur), first = ds(new Date(d.getFullYear(), d.getMonth(), 1)), s = wkStart(first), t = today(), h = '<div class="ccal-mhead">' + DN.map(function (x) { return "<div>" + x + "</div>"; }).join("") + '</div><div class="ccal-month">';
    for (var i = 0; i < 42; i++) {
      var day = add(s, i), its = itemsOn(day), other = pd(day).getMonth() !== d.getMonth();
      if (i === 35 && other) break;
      h += '<div class="ccal-cell' + (other ? " other" : "") + (day === t ? " today" : "") + '" data-cdrop="' + day + '" data-cnew="' + day + '"><button type="button" class="dn" data-cgo="' + day + '" aria-label="Open ' + nice(day, true) + '">' + pd(day).getDate() + '</button>' +
        its.slice(0, 3).map(function (it) { return chip(it); }).join("") + (its.length > 3 ? '<button type="button" class="more" data-cgo="' + day + '">+' + (its.length - 3) + ' more</button>' : "") + '</div>';
    }
    return h + '</div>';
  }
  function gridView(days) {
    var t = today(), now = new Date(), nowM = now.getHours() * 60 + now.getMinutes();
    var h = '<div class="ccal-grid" style="--n:' + days.length + '"><div class="gh"><div></div>' + days.map(function (d) { var D = pd(d); return '<button type="button" class="gd' + (d === t ? " today" : "") + '" data-cgo="' + d + '"><small>' + DN[D.getDay()] + '</small><b>' + D.getDate() + '</b></button>'; }).join("") + '</div>' +
      '<div class="ga"><div class="lbl">all-day</div>' + days.map(function (d) { return '<div class="gac" data-cdrop="' + d + '" data-cnew="' + d + '">' + itemsOn(d).filter(function (it) { return it.e.allDay || !it.e.start; }).map(function (it) { return chip(it); }).join("") + '</div>'; }).join("") + '</div>' +
      '<div class="gb" id="ccalgb"><div class="hrs">';
    for (var hr = 0; hr < 24; hr++) h += '<div>' + (hr ? ((hr % 12) || 12) + (hr < 12 ? " am" : " pm") : "") + '</div>';
    h += '</div>' + days.map(function (d) {
      var its = itemsOn(d).filter(function (it) { return !it.e.allDay && it.e.start; }), cols = [];
      its.forEach(function (it) { var s = mins(it.e.start), e = Math.max(s + 30, mins(it.e.end || "") || s + 60); it.s = s; it.en = e; var c = 0; while (cols[c] && cols[c] > s) c++; cols[c] = e; it.col = c; });
      var nc = Math.max(1, cols.length);
      var slots = ""; for (var q = 0; q < 48; q++) slots += '<div class="sl" data-cdrop="' + d + '" data-ctime="' + pad(Math.floor(q / 2)) + ':' + (q % 2 ? "30" : "00") + '" data-cnew="' + d + '"></div>';
      return '<div class="gcol' + (d === t ? " today" : "") + '">' + slots + its.map(function (it) {
        return '<div class="gev" style="top:' + (it.s / 60 * 48) + 'px;height:' + Math.max(22, (it.en - it.s) / 60 * 48 - 2) + 'px;left:' + (it.col / nc * 100) + '%;width:' + (100 / nc) + '%">' + chip(it, "tall") + '</div>';
      }).join("") + (d === t ? '<div class="now" style="top:' + (nowM / 60 * 48) + 'px"></div>' : "") + '</div>';
    }).join("") + '</div></div>';
    return h;
  }
  function yearView() {
    var y = pd(C.cur).getFullYear(), t = today(), h = '<div class="ccal-year">';
    for (var m = 0; m < 12; m++) {
      var first = ds(new Date(y, m, 1)), s = wkStart(first);
      h += '<div class="ym"><button type="button" class="ymt" data-cmonth="' + first + '">' + MN[m] + '</button><div class="ymg">' + DN.map(function (x) { return "<i>" + x[0] + "</i>"; }).join("");
      for (var i = 0; i < 42; i++) { var d = add(s, i), o = pd(d).getMonth() !== m, n = o ? 0 : itemsOn(d).length; h += '<button type="button" class="' + (o ? "o" : "") + (d === t ? " t" : "") + (n ? " has" : "") + '" data-cgo="' + d + '"' + (o ? ' tabindex="-1"' : '') + '>' + (o ? "" : pd(d).getDate()) + '</button>'; }
      h += '</div></div>';
    }
    return h + '</div>';
  }
  function agendaView() {
    var h = '<div class="ccal-agenda">', any = false;
    for (var i = 0; i < 90; i++) {
      var d = add(C.cur, i), its = itemsOn(d); if (!its.length) continue; any = true;
      h += '<div class="ag"><button type="button" class="agd' + (d === today() ? " today" : "") + '" data-cgo="' + d + '"><b>' + pd(d).getDate() + '</b><small>' + DN[dow(d)] + ', ' + MN[pd(d).getMonth()].slice(0, 3) + '</small></button><div class="agl">' + its.map(function (it) { return '<div class="agr"><span class="agt">' + (it.e.allDay || !it.e.start ? "All day" : fmtT(it.e.start) + (it.e.end ? " – " + fmtT(it.e.end) : "")) + '</span>' + chip(it, "wide") + '</div>'; }).join("") + '</div></div>';
    }
    return h + (any ? "" : '<p class="hint">Nothing in the next 90 days' + (C.q ? ' that matches "' + esc(C.q) + '"' : '') + '. Click <b>+ Create</b> to add something.</p>') + '</div>';
  }
  function mini() {
    var d = pd(C.mini || C.cur), first = ds(new Date(d.getFullYear(), d.getMonth(), 1)), s = wkStart(first), t = today(), wk = C.view === "week" ? wkStart(C.cur) : null;
    var h = '<div class="ccal-mini"><div class="mt"><button type="button" data-cmini="-1" aria-label="Previous month">&#8249;</button><b>' + MN[d.getMonth()] + ' ' + d.getFullYear() + '</b><button type="button" data-cmini="1" aria-label="Next month">&#8250;</button></div><div class="mg">' + DN.map(function (x) { return "<i>" + x[0] + "</i>"; }).join("");
    for (var i = 0; i < 42; i++) { var day = add(s, i), o = pd(day).getMonth() !== d.getMonth(), inW = wk && day >= wk && day <= add(wk, 6); h += '<button type="button" class="' + (o ? "o " : "") + (day === t ? "t " : "") + (day === C.cur ? "s " : "") + (inW ? "w " : "") + (itemsOn(day).length ? "has" : "") + '" data-cgo="' + day + '">' + pd(day).getDate() + '</button>'; }
    return h + '</div></div>';
  }
  function sidebar() {
    var T = TDx(), un = (C.link && T && T.items ? T.items.filter(function (i) { return !i.done && !i.due; }) : []);
    var up = []; for (var i = 0; i < 14 && up.length < 6; i++) { var d = add(today(), i); itemsOn(d).forEach(function (it) { if (!it.done && up.length < 6) up.push(it); }); }
    return '<aside class="ccal-side">' +
      '<button type="button" class="ccal-create" data-cnew="' + C.cur + '"><span>+</span> Create</button>' + mini() +
      '<div class="ccal-box"><h4>Coming up</h4>' + (up.length ? up.map(function (it) { return '<div class="upr"><small>' + (it.day === today() ? "Today" : it.day === add(today(), 1) ? "Tomorrow" : nice(it.day)) + (it.e.start && !it.e.allDay ? " · " + fmtT(it.e.start) : "") + '</small>' + chip(it, "wide") + '</div>'; }).join("") : '<p class="hint">Nothing in the next 2 weeks.</p>') + '</div>' +
      '<div class="ccal-box"><h4>&#128279; To-do list</h4><label class="tg"><input type="checkbox" data-clink="1"' + (C.link ? " checked" : "") + '> Show my to-dos on the calendar</label>' +
      (C.link ? (un.length ? '<p class="hint" style="margin:8px 0 4px">No date yet. Drag one onto a day:</p>' + un.slice(0, 12).map(function (i) { return '<button type="button" class="ccal-chip wide k-todo un" style="--c:#17845B" data-cev="' + esc(i.id) + '" data-csrc="td" data-cday="">&#9744; ' + esc(i.t.length > 60 ? i.t.slice(0, 60) + "…" : i.t) + '</button>'; }).join("") : '<p class="hint" style="margin-top:8px">Every open to-do has a date.</p>') : '') + '</div>' +
      '<div class="ccal-box"><h4>&#128276; Reminder alerts</h4><p class="hint" style="margin:0 0 8px">Pop-ups show while Revatour is open.</p>' + ("Notification" in window && Notification.permission !== "granted" ? '<button type="button" data-cnotif="1">Turn on desktop alerts</button>' : '<p class="hint" style="margin:0">' + ("Notification" in window ? "Desktop alerts are on." : "This browser has no desktop alerts.") + '</p>') + '</div>' +
      '</aside>';
  }
  function paint() {
    if (!host || !document.body.contains(host)) return;
    var sy = host.querySelector("#ccalgb"), keep = sy ? sy.scrollTop : null;
    var V = C.view, body = V === "day" ? gridView([C.cur]) : V === "week" ? gridView([0, 1, 2, 3, 4, 5, 6].map(function (i) { return add(wkStart(C.cur), i); })) : V === "year" ? yearView() : V === "agenda" ? agendaView() : monthView();
    host.innerHTML = '<div class="ccal">' + sidebar() + '<div class="ccal-main"><div class="ccal-top">' +
      '<button type="button" data-ctoday="1">Today</button><button type="button" class="ar" data-cstep="-1" aria-label="Previous">&#8249;</button><button type="button" class="ar" data-cstep="1" aria-label="Next">&#8250;</button><h3>' + esc(title()) + '</h3>' +
      '<input type="search" class="ccal-q" placeholder="Search" value="' + esc(C.q) + '" aria-label="Search calendar">' +
      '<div class="ccal-views" role="tablist">' + [["day", "Day", "D"], ["week", "Week", "W"], ["month", "Month", "M"], ["year", "Year", "Y"], ["agenda", "Schedule", "A"]].map(function (v) { return '<button type="button" role="tab" data-cview="' + v[0] + '" aria-selected="' + (V === v[0]) + '" title="Shortcut: ' + v[2] + '">' + v[1] + '</button>'; }).join("") + '</div></div>' +
      '<div class="ccal-body">' + body + '</div><p class="hint ccal-keys">Tips: click any day or time to add. Drag items to move them. Keys: T today, ← → move, D W M Y A switch view, N new.</p></div></div>';
    var gb = host.querySelector("#ccalgb"); if (gb) gb.scrollTop = keep != null ? keep : 7 * 48;
  }

  /* ---------- editor ---------- */
  function editor(o) {
    var e = o.e || { t: "", kind: o.kind || "event", date: o.date || C.cur, allDay: !o.time, start: o.time || "09:00", end: o.time ? pad(Math.min(23, +o.time.slice(0, 2) + 1)) + o.time.slice(2) : "10:00", color: "#2F6FE4", rec: null, alert: "", notes: "" };
    var isNew = !o.e, r = e.rec || {}, wd = dow(e.date);
    var rsel = r.f === "weekly" && (r.n || 1) === 2 ? "biweekly" : (r.f || "");
    var bg = document.createElement("div"); bg.className = "ccal-modal"; bg.setAttribute("role", "dialog"); bg.setAttribute("aria-modal", "true"); bg.setAttribute("aria-label", isNew ? "New calendar item" : "Edit calendar item");
    bg.innerHTML = '<form class="ccal-ed"><div class="kinds">' + [["event", "&#128197; Event"], ["reminder", "&#128276; Reminder"], ["todo", "&#9745; To-do"]].map(function (k) { return '<button type="button" data-ekind="' + k[0] + '" aria-pressed="' + (e.kind === k[0]) + '">' + k[1] + '</button>'; }).join("") + '</div>' +
      '<input name="t" class="et" maxlength="300" placeholder="Add title" value="' + esc(e.t) + '" aria-label="Title" required>' +
      '<div class="er"><label>Date <input type="date" name="date" value="' + e.date + '" required></label><label class="ad"><input type="checkbox" name="allDay"' + (e.allDay ? " checked" : "") + '> All day</label></div>' +
      '<div class="er tm"' + (e.allDay ? ' hidden' : '') + '><label>Starts <input type="time" name="start" value="' + (e.start || "09:00") + '"></label><label>Ends <input type="time" name="end" value="' + (e.end || "") + '"></label></div>' +
      '<div class="er"><label>&#8635; Repeat <select name="rec"><option value="">Does not repeat</option><option value="daily"' + (rsel === "daily" ? " selected" : "") + '>Every day</option><option value="weekdays"' + (rsel === "weekdays" ? " selected" : "") + '>Every weekday (Mon–Fri)</option><option value="weekly"' + (rsel === "weekly" ? " selected" : "") + '>Every week</option><option value="biweekly"' + (rsel === "biweekly" ? " selected" : "") + '>Every 2 weeks</option><option value="monthly"' + (rsel === "monthly" ? " selected" : "") + '>Every month</option><option value="yearly"' + (rsel === "yearly" ? " selected" : "") + '>Every year</option></select></label>' +
      '<label class="un"' + (r.f ? '' : ' hidden') + '>Until <input type="date" name="until" value="' + (r.until || "") + '"></label></div>' +
      '<div class="er wd"' + (r.f === "weekly" ? '' : ' hidden') + '><span class="lb">On</span>' + DN.map(function (x, i) { var on = (r.days && r.days.length ? r.days : [wd]).indexOf(i) >= 0; return '<label class="dw"><input type="checkbox" name="d' + i + '"' + (on ? " checked" : "") + '><span>' + x[0] + '</span></label>'; }).join("") + '</div>' +
      '<div class="er"><label>&#128276; Alert <select name="alert">' + [["", "No alert"], ["0", "At start time"], ["10", "10 minutes before"], ["30", "30 minutes before"], ["60", "1 hour before"], ["1440", "1 day before"]].map(function (a) { return '<option value="' + a[0] + '"' + (String(e.alert) === a[0] ? " selected" : "") + '>' + a[1] + '</option>'; }).join("") + '</select></label></div>' +
      '<div class="er cols"><span class="lb">Color</span>' + COLORS.map(function (c) { return '<label class="sw" title="' + c[1] + '"><input type="radio" name="color" value="' + c[0] + '"' + (e.color === c[0] ? " checked" : "") + '><span style="background:' + c[0] + '"></span></label>'; }).join("") + '</div>' +
      '<textarea name="notes" rows="3" maxlength="3000" placeholder="Notes" aria-label="Notes">' + esc(e.notes || "") + '</textarea>' +
      '<div class="eb">' + (isNew ? "" : (e.rec && e.rec.f ? '<button type="button" data-edel="one">Delete this one</button><button type="button" data-edel="all">Delete all</button>' : '<button type="button" data-edel="all">Delete</button>') + '<button type="button" data-edup="1">Duplicate</button>') +
      '<span style="flex:1"></span><button type="button" data-eclose="1">Cancel</button><button type="submit" class="primary">Save</button></div></form>';
    document.body.appendChild(bg);
    var f = bg.querySelector("form"), kind = e.kind;
    setTimeout(function () { f.t.focus(); }, 30);
    function close() { bg.remove(); document.removeEventListener("keydown", onKey, true); }
    function onKey(ev) { if (ev.key === "Escape") { ev.stopPropagation(); close(); } }
    document.addEventListener("keydown", onKey, true);
    bg.addEventListener("click", function (ev) {
      if (ev.target === bg || ev.target.closest("[data-eclose]")) return close();
      var k = ev.target.closest("[data-ekind]"); if (k) { kind = k.dataset.ekind; bg.querySelectorAll("[data-ekind]").forEach(function (b) { b.setAttribute("aria-pressed", b === k); }); return; }
      var dl = ev.target.closest("[data-edel]"); if (dl) { if (dl.dataset.edel === "one") { o.e.ex = (o.e.ex || []).concat([o.day]); } else C.ev = C.ev.filter(function (x) { return x !== o.e; }); save(); close(); paint(); toast("Deleted"); return; }
      if (ev.target.closest("[data-edup]")) { var cp = JSON.parse(JSON.stringify(o.e)); cp.id = uid(); cp.t += " (copy)"; delete cp.dn; C.ev.push(cp); save(); close(); paint(); toast("Duplicated"); }
    });
    f.addEventListener("change", function () {
      bg.querySelector(".tm").hidden = f.allDay.checked;
      var rv = f.rec.value; bg.querySelector(".un").hidden = !rv; bg.querySelector(".wd").hidden = rv !== "weekly";
    });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var t = f.t.value.trim(); if (!t) return;
      var rv = f.rec.value, days = []; for (var i = 0; i < 7; i++) if (f["d" + i].checked) days.push(i);
      var rec = rv ? { f: rv === "biweekly" ? "weekly" : rv, n: rv === "biweekly" ? 2 : 1, until: f.until.value || "", days: rv === "weekly" ? days : (rv === "biweekly" ? [dow(f.date.value)] : []) } : null;
      var st = f.start.value || "09:00", en = f.end.value; if (en && mins(en) <= mins(st)) en = "";
      var tgt = o.e || { id: uid() };
      Object.assign(tgt, { t: t, kind: kind, date: f.date.value, allDay: f.allDay.checked, start: f.allDay.checked ? "" : st, end: f.allDay.checked ? "" : en, rec: rec, alert: f.alert.value, color: (f.querySelector("[name=color]:checked") || {}).value || "#2F6FE4", notes: f.notes.value.trim() });
      if (!o.e) C.ev.push(tgt);
      save(); close(); C.cur = tgt.date; paint(); toast(isNew ? "Added to your calendar" : "Saved");
    });
  }

  /* ---------- interactions ---------- */
  function step(n) {
    var v = C.view;
    C.cur = v === "day" ? add(C.cur, n) : v === "week" ? add(C.cur, 7 * n) : v === "year" ? addM(C.cur, 12 * n) : v === "agenda" ? add(C.cur, 30 * n) : addM(C.cur, n);
    C.mini = null; paint();
  }
  function toggleDone(src, id, day) {
    if (src === "td") {
      var T = TDx(), i = T && T.items.find(function (x) { return x.id === id; }); if (!i) return;
      if (i.rec && i.rec.f) { i.due = nextAfter(i.rec, day > i.due ? day : i.due, i.due); toast("Done! Next one: " + nice(i.due)); } else i.done = !i.done;
      tdSave();
    } else {
      var e = C.ev.find(function (x) { return x.id === id; }); if (!e) return;
      e.dn = e.dn || []; var k = e.dn.indexOf(day); if (k >= 0) e.dn.splice(k, 1); else e.dn.push(day); save();
    }
    paint();
  }
  function onClick(ev) {
    var t = ev.target;
    if (drag.moved) { drag.moved = false; return; }
    var b;
    if ((b = t.closest("[data-ctoggle]"))) { var c = b.closest("[data-cev]"); ev.stopPropagation(); return toggleDone(c.dataset.csrc, c.dataset.cev, c.dataset.cday); }
    if ((b = t.closest("[data-cev]"))) {
      if (b.dataset.csrc === "td") { toast("This is from your To-do list. Edit it there, or check it off here."); return; }
      var e = C.ev.find(function (x) { return x.id === b.dataset.cev; }); if (e) editor({ e: e, day: b.dataset.cday }); return;
    }
    if ((b = t.closest("[data-cview]"))) { C.view = b.dataset.cview; save(); return paint(); }
    if ((b = t.closest("[data-cstep]"))) return step(+b.dataset.cstep);
    if (t.closest("[data-ctoday]")) { C.cur = today(); C.mini = null; return paint(); }
    if ((b = t.closest("[data-cmini]"))) { C.mini = addM(C.mini || C.cur, +b.dataset.cmini); return paint(); }
    if ((b = t.closest("[data-cmonth]"))) { C.cur = b.dataset.cmonth; C.view = "month"; return paint(); }
    if ((b = t.closest("[data-cgo]"))) { C.cur = b.dataset.cgo; if (C.view === "month" || C.view === "year" || C.view === "agenda") C.view = "day"; C.mini = null; return paint(); }
    if (t.closest("[data-cnotif]")) { try { Notification.requestPermission().then(paint); } catch (e) {} return; }
    if ((b = t.closest("[data-cnew]"))) { var sl = t.closest("[data-ctime]"); return editor({ date: b.dataset.cnew, time: sl ? sl.dataset.ctime : null }); }
  }
  function onChange(ev) {
    var t = ev.target;
    if (t.dataset.clink) { C.link = t.checked; save(); paint(); }
  }
  function onInput(ev) { if (ev.target.classList.contains("ccal-q")) { C.q = ev.target.value; clearTimeout(onInput.t); onInput.t = setTimeout(function () { var p = ev.target.selectionStart; paint(); var q = host.querySelector(".ccal-q"); if (q) { q.focus(); try { q.setSelectionRange(p, p); } catch (e) {} } }, 250); } }
  function onKey(ev) {
    if (!host || !document.body.contains(host) || !host.offsetParent) return;
    if (document.querySelector(".ccal-modal")) return;
    if (/input|select|textarea/i.test(ev.target.tagName) || ev.target.isContentEditable || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var k = ev.key.toLowerCase(), V = { d: "day", w: "week", m: "month", y: "year", a: "agenda" }[k];
    if (V) { C.view = V; save(); paint(); }
    else if (k === "t") { C.cur = today(); paint(); }
    else if (k === "arrowleft" || k === "j") step(-1);
    else if (k === "arrowright" || k === "k") step(1);
    else if (k === "n" || k === "c") editor({ date: C.cur });
    else return;
    ev.preventDefault();
  }

  /* drag to move (mouse, pen or touch) */
  var drag = { el: null, moved: false };
  function onDown(ev) {
    var c = ev.target.closest("[data-cev]"); if (!c || ev.target.closest("[data-ctoggle]") || ev.button > 0) return;
    drag = { el: c, x: ev.clientX, y: ev.clientY, moved: false, ghost: null };
  }
  function onMove(ev) {
    if (!drag.el) return;
    if (!drag.moved && Math.abs(ev.clientX - drag.x) + Math.abs(ev.clientY - drag.y) < 6) return;
    if (!drag.moved) { drag.moved = true; drag.ghost = drag.el.cloneNode(true); drag.ghost.className += " ghost"; document.body.appendChild(drag.ghost); drag.el.classList.add("dragging"); }
    drag.ghost.style.left = ev.clientX + 8 + "px"; drag.ghost.style.top = ev.clientY + 8 + "px";
    host.querySelectorAll(".over").forEach(function (x) { x.classList.remove("over"); });
    var tg = document.elementFromPoint(ev.clientX, ev.clientY), dz = tg && tg.closest("[data-cdrop]"); if (dz) dz.classList.add("over");
    ev.preventDefault();
  }
  function onUp(ev) {
    if (!drag.el) return;
    var was = drag.moved, el = drag.el;
    if (drag.ghost) drag.ghost.remove(); el.classList.remove("dragging");
    host.querySelectorAll(".over").forEach(function (x) { x.classList.remove("over"); });
    drag.el = null;
    if (!was) return;
    var tg = document.elementFromPoint(ev.clientX, ev.clientY), dz = tg && tg.closest("[data-cdrop]"); if (!dz) return;
    var nd = dz.dataset.cdrop, tm = dz.dataset.ctime, id = el.dataset.cev, from = el.dataset.cday;
    if (el.dataset.csrc === "td") { var T = TDx(), i = T && T.items.find(function (x) { return x.id === id; }); if (i) { i.due = nd; tdSave(); toast("Due " + nice(nd)); } }
    else {
      var e = C.ev.find(function (x) { return x.id === id; }); if (!e) return;
      if (e.rec && e.rec.f && from && from !== e.date) {
        /* moving one repeat: skip it there and make a one-off copy */
        e.ex = (e.ex || []).concat([from]); var cp = JSON.parse(JSON.stringify(e)); cp.id = uid(); cp.rec = null; delete cp.ex; delete cp.dn; cp.date = nd; if (tm) { shiftTime(cp, tm); } C.ev.push(cp);
      } else { e.date = nd; if (tm) shiftTime(e, tm); else if (dz.classList.contains("gac")) { e.allDay = true; } }
      save();
    }
    paint();
    setTimeout(function () { drag.moved = false; }, 0);
  }
  function shiftTime(e, tm) { var len = e.end && e.start ? mins(e.end) - mins(e.start) : 60; e.allDay = false; e.start = tm; var en = Math.min(23 * 60 + 59, mins(tm) + len); e.end = pad(Math.floor(en / 60)) + ":" + pad(en % 60); }

  /* reminder alerts while the site is open */
  function tick() {
    if (!C.loaded) return;
    var now = new Date(), d = ds(now), nm = now.getHours() * 60 + now.getMinutes();
    [d, add(d, 1)].forEach(function (day) {
      C.ev.forEach(function (e) {
        if (e.alert === "" || e.alert == null || !hits(e, day)) return;
        var at = (day === d ? 0 : 1440) + (e.allDay || !e.start ? 9 * 60 : mins(e.start)) - (+e.alert), k = e.id + "|" + day;
        if (at <= nm && nm - at < 5 && !C.notified[k]) {
          C.notified[k] = 1;
          var msg = (e.kind === "reminder" ? "Reminder: " : "") + e.t + (e.start && !e.allDay ? " at " + fmtT(e.start) : "") + (day !== d ? " tomorrow" : "");
          toast("🔔 " + msg);
          try { if ("Notification" in window && Notification.permission === "granted") new Notification("Revatour calendar", { body: msg }); } catch (er) {}
        }
      });
    });
  }

  var wired = false, ticking = false;
  function startTick() { if (ticking) return; ticking = true; setInterval(tick, 30000); }
  function wire() {
    if (wired) return; wired = true;
    document.addEventListener("click", function (ev) { if (host && host.contains(ev.target)) onClick(ev); });
    document.addEventListener("change", function (ev) { if (host && host.contains(ev.target)) onChange(ev); });
    document.addEventListener("input", function (ev) { if (host && host.contains(ev.target)) onInput(ev); });
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", function (ev) { if (host && host.contains(ev.target)) onDown(ev); });
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    startTick();
    document.addEventListener("dragstart", function (ev) { if (host && host.contains(ev.target)) ev.preventDefault(); });
  }
  function css() {
    if (document.getElementById("ccalcss")) return;
    var s = document.createElement("style"); s.id = "ccalcss";
    s.textContent = [
      ".ccal{display:grid;grid-template-columns:260px 1fr;gap:18px;align-items:start;width:100%}@media(max-width:900px){.ccal{grid-template-columns:1fr}.ccal-side{order:2}}",
      ".ccal-side{display:flex;flex-direction:column;gap:12px;position:sticky;top:12px}",
      ".ccal-create{display:inline-flex;align-items:center;gap:10px;align-self:flex-start;padding:12px 22px!important;border-radius:16px!important;font-weight:700;font-size:15px;box-shadow:0 1px 3px rgba(0,0,0,.15),0 4px 10px rgba(0,0,0,.08);background:var(--panel)!important;border:1px solid var(--line)!important;color:var(--ink)!important;cursor:pointer}.ccal-create span{font-size:26px;line-height:1;color:var(--accent)}",
      ".ccal-box{border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--panel)}.ccal-box h4{margin:0 0 8px;font-size:13px}.ccal-box .tg{display:flex!important;gap:8px;align-items:center;font-size:13px;cursor:pointer}.ccal-box .upr{margin-bottom:6px}.ccal-box .upr small{display:block;color:var(--mute);font-size:11px;margin-bottom:2px}",
      ".ccal-mini .mt{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}.ccal-mini .mt b{font-size:13px}.ccal-mini .mt button{border:0;background:none;color:var(--ink);font-size:20px;cursor:pointer;padding:0 8px}",
      ".ccal-mini .mg{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;text-align:center}.ccal-mini i{font-style:normal;font-size:10px;color:var(--mute);padding:2px 0}.ccal-mini .mg button{border:0;background:none;color:var(--ink);font:inherit;font-size:12px;aspect-ratio:1;border-radius:50%;cursor:pointer;padding:0;position:relative}.ccal-mini .mg button:hover{background:var(--line)}.ccal-mini .o{color:var(--mute)!important;opacity:.6}.ccal-mini .w{background:color-mix(in srgb,var(--accent) 12%,transparent)!important;border-radius:0!important}.ccal-mini .s{background:color-mix(in srgb,var(--accent) 25%,transparent)!important;border-radius:50%!important;font-weight:700}.ccal-mini .t{background:var(--accent)!important;color:var(--accent-ink,#fff)!important;font-weight:700;border-radius:50%!important}.ccal-mini .has::after{content:'';position:absolute;bottom:2px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:var(--accent)}",
      ".ccal-main{min-width:0}.ccal-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}.ccal-top>button{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:8px 16px;font:inherit;font-weight:600;cursor:pointer}.ccal-top .ar{border:0;background:none;font-size:24px;padding:2px 10px;border-radius:50%}.ccal-top .ar:hover{background:var(--line)}.ccal-top h3{margin:0 8px;font-size:22px;flex:1;min-width:180px}",
      ".ccal-q{border:1px solid var(--line);border-radius:999px;padding:8px 14px;background:var(--panel);color:var(--ink);font:inherit;width:160px}",
      ".ccal-views{display:flex;border:1px solid var(--line);border-radius:999px;overflow:hidden}.ccal-views button{border:0;background:var(--panel);color:var(--ink);padding:8px 14px;font:inherit;font-weight:600;cursor:pointer}.ccal-views button+button{border-left:1px solid var(--line)}.ccal-views [aria-selected=true]{background:var(--accent);color:var(--accent-ink,#fff)}",
      ".ccal-mhead{display:grid;grid-template-columns:repeat(7,1fr);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mute);text-align:center;padding:6px 0}",
      ".ccal-month{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-top:1px solid var(--line);border-left:1px solid var(--line)}.ccal-cell{border-right:1px solid var(--line);border-bottom:1px solid var(--line);min-height:118px;padding:4px;display:flex;flex-direction:column;gap:2px;cursor:pointer;min-width:0}.ccal-cell:hover{background:color-mix(in srgb,var(--line) 35%,transparent)}.ccal-cell.other{opacity:.5}.ccal-cell .dn{align-self:center;border:0;background:none;color:var(--ink);font:inherit;font-size:13px;font-weight:600;width:28px;height:28px;border-radius:50%;cursor:pointer;padding:0}.ccal-cell .dn:hover{background:var(--line)}.ccal-cell.today .dn{background:var(--accent);color:var(--accent-ink,#fff)}.ccal-cell .more{border:0;background:none;color:var(--mute);font:inherit;font-size:12px;font-weight:700;text-align:left;cursor:pointer;padding:0 4px}",
      ".ccal-chip{display:block;width:100%;text-align:left;border:0;border-radius:6px;padding:2px 6px;font:inherit;font-size:12px;line-height:1.35;color:#fff;background:var(--c);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:grab;touch-action:none;min-width:0}.ccal-chip b{font-weight:700}.ccal-chip.k-todo,.ccal-chip.k-reminder{background:color-mix(in srgb,var(--c) 14%,transparent);color:var(--ink);border-left:3px solid var(--c)}.ccal-chip .ck{margin-right:4px;cursor:pointer}.ccal-chip.done{opacity:.55;text-decoration:line-through}.ccal-chip .rp{font-style:normal;opacity:.8}.ccal-chip.wide{white-space:normal;font-size:13px;padding:4px 8px}.ccal-chip.un{margin-bottom:4px}.ccal-chip.tall{height:100%;white-space:normal;align-items:flex-start;display:block}.ccal-chip.dragging{opacity:.35}.ccal-chip.ghost{position:fixed;z-index:9999;pointer-events:none;width:auto;max-width:240px;box-shadow:0 8px 20px rgba(0,0,0,.25)}",
      ".over{outline:2px dashed var(--accent);outline-offset:-2px;background:color-mix(in srgb,var(--accent) 10%,transparent)!important}",
      ".ccal-grid{border:1px solid var(--line);border-radius:12px;overflow:hidden}.ccal-grid .gh,.ccal-grid .ga{display:grid;grid-template-columns:56px repeat(var(--n),minmax(0,1fr));border-bottom:1px solid var(--line)}.ccal-grid .gd{border:0;background:none;color:var(--ink);padding:6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;font:inherit}.ccal-grid .gd small{font-size:11px;color:var(--mute);text-transform:uppercase;font-weight:700}.ccal-grid .gd b{font-size:22px;width:40px;height:40px;line-height:40px;border-radius:50%}.ccal-grid .gd.today b{background:var(--accent);color:var(--accent-ink,#fff)}.ccal-grid .ga .lbl{font-size:10px;color:var(--mute);padding:6px 4px;text-align:right}.ccal-grid .gac{border-left:1px solid var(--line);padding:3px;display:flex;flex-direction:column;gap:2px;min-height:30px;cursor:pointer;min-width:0}",
      ".ccal-grid .gb{display:grid;grid-template-columns:56px repeat(var(--n),minmax(0,1fr));height:560px;overflow-y:auto;position:relative}.ccal-grid .hrs div{height:48px;font-size:10px;color:var(--mute);text-align:right;padding-right:6px;transform:translateY(-6px)}.ccal-grid .gcol{position:relative;border-left:1px solid var(--line)}.ccal-grid .gcol.today{background:color-mix(in srgb,var(--accent) 4%,transparent)}.ccal-grid .sl{height:24px;cursor:pointer}.ccal-grid .sl:nth-child(odd){border-top:1px solid var(--line)}.ccal-grid .sl:hover{background:color-mix(in srgb,var(--line) 40%,transparent)}.ccal-grid .gev{position:absolute;padding:0 2px}.ccal-grid .now{position:absolute;left:0;right:0;height:2px;background:#E5484D;pointer-events:none}.ccal-grid .now::before{content:'';position:absolute;left:-5px;top:-4px;width:10px;height:10px;border-radius:50%;background:#E5484D}",
      ".ccal-year{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}.ccal-year .ymt{border:0;background:none;color:var(--ink);font:inherit;font-weight:700;font-size:15px;cursor:pointer;padding:0 0 6px}.ccal-year .ymg{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;gap:1px}.ccal-year i{font-style:normal;font-size:10px;color:var(--mute)}.ccal-year .ymg button{border:0;background:none;color:var(--ink);font:inherit;font-size:12px;aspect-ratio:1;border-radius:50%;cursor:pointer;padding:0;position:relative}.ccal-year .ymg button:hover{background:var(--line)}.ccal-year .t{background:var(--accent)!important;color:var(--accent-ink,#fff)!important;font-weight:700}.ccal-year .has::after{content:'';position:absolute;bottom:2px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:var(--accent)}",
      ".ccal-agenda .ag{display:grid;grid-template-columns:110px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}.ccal-agenda .agd{border:0;background:none;color:var(--ink);text-align:left;cursor:pointer;font:inherit;display:flex;align-items:center;gap:8px}.ccal-agenda .agd b{font-size:22px;width:38px;height:38px;line-height:38px;text-align:center;border-radius:50%}.ccal-agenda .agd.today b{background:var(--accent);color:var(--accent-ink,#fff)}.ccal-agenda .agd small{color:var(--mute);font-size:12px}.ccal-agenda .agr{display:grid;grid-template-columns:130px 1fr;gap:10px;align-items:center;margin-bottom:4px}.ccal-agenda .agt{font-size:13px;color:var(--mute)}",
      ".ccal-keys{font-size:12px;margin-top:10px}",
      ".ccal-modal{position:fixed;inset:0;background:rgba(10,14,22,.45);display:flex;align-items:center;justify-content:center;z-index:10000;padding:16px}.ccal-ed{background:var(--panel,#fff);color:var(--ink);border-radius:18px;padding:20px;width:min(520px,100%);max-height:92vh;overflow:auto;display:flex;flex-direction:column;gap:12px;box-shadow:0 20px 50px rgba(0,0,0,.3)}",
      ".ccal-ed .kinds{display:flex;gap:6px}.ccal-ed .kinds button{flex:1;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:10px;padding:8px;font:inherit;font-weight:600;cursor:pointer}.ccal-ed .kinds [aria-pressed=true]{background:var(--accent);color:var(--accent-ink,#fff);border-color:var(--accent)}",
      ".ccal-ed .et{font-size:22px;font-weight:700;border:0;border-bottom:2px solid var(--line);background:transparent;color:var(--ink);padding:6px 2px;outline:0}.ccal-ed .et:focus{border-bottom-color:var(--accent)}",
      ".ccal-ed .er{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.ccal-ed .er[hidden],.ccal-ed .un[hidden]{display:none!important}.ccal-ed label{display:flex!important;align-items:center;gap:6px;font-size:13px;font-weight:600;margin:0}.ccal-ed input[type=date],.ccal-ed input[type=time],.ccal-ed select{border:1px solid var(--line);border-radius:8px;padding:6px 8px;background:var(--panel);color:var(--ink);font:inherit}.ccal-ed .lb{font-size:13px;font-weight:600}",
      ".ccal-ed .dw input,.ccal-ed .sw input{position:absolute;opacity:0;width:1px;height:1px}.ccal-ed .dw span{display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;border-radius:50%;border:1px solid var(--line);cursor:pointer}.ccal-ed .dw input:checked+span{background:var(--accent);color:var(--accent-ink,#fff);border-color:var(--accent)}.ccal-ed .dw input:focus-visible+span,.ccal-ed .sw input:focus-visible+span{outline:2px solid var(--accent);outline-offset:2px}",
      ".ccal-ed .sw span{display:inline-block;width:24px;height:24px;border-radius:50%;cursor:pointer;border:3px solid transparent}.ccal-ed .sw input:checked+span{border-color:var(--ink)}",
      ".ccal-ed textarea{border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--panel);color:var(--ink);font:inherit;resize:vertical}.ccal-ed .eb{display:flex;gap:8px;flex-wrap:wrap}.ccal-ed .eb button{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:8px 16px;font:inherit;font-weight:600;cursor:pointer}.ccal-ed .eb [data-edel]{color:#C2364A}.ccal-ed .eb .primary{background:var(--accent);color:var(--accent-ink,#fff);border-color:var(--accent)}"
    ].join("");
    document.head.appendChild(s);
  }

  window.StockCal = {
    mount: async function (el) {
      host = el; css(); wire();
      el.innerHTML = '<p class="hint">Loading your calendar…</p>';
      await Promise.all([load(), tdReady()]);
      paint();
    },
    refresh: function () { paint(); },
    getLink: async function () { await load(); return C.link; },
    setLink: async function (v) { await load(); C.link = !!v; await save(); paint(); },
    nextAfter: nextAfter,
    recLabel: recLabel
  };
  /* start alert checks even before the tab is opened, once signed in */
  setTimeout(function boot() { if (!db()) return setTimeout(boot, 5000); load().then(function () { startTick(); tick(); }).catch(function () {}); }, 4000);
})();
