/* Visitors page (owner only): visitors, page views, where they come from, devices and sign-ups. */
(function (root) {
  "use strict";
  var host = null, tf = 30, data = null, busy = false;
  var CSS = "#trafficv.wrap{max-width:none;width:100%;box-sizing:border-box;padding-left:28px;padding-right:28px}.tr-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:12px 0}.tr-kp{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:10px 12px}.tr-kp span{display:block;font-size:.74rem;font-weight:700;color:var(--mute);text-transform:uppercase;letter-spacing:.05em}.tr-kp b{font-size:1.7rem;font-variant-numeric:tabular-nums}.tr-kp small{display:block;color:var(--mute)}" +
    ".tr-seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;overflow:hidden}.tr-seg button{border:0;background:none;color:var(--mute);font:inherit;font-weight:700;font-size:.8rem;padding:5px 12px;cursor:pointer;border-radius:0;margin:0}.tr-seg button.on{background:var(--ink);color:var(--bg)}" +
    ".tr-box{position:relative;border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:8px 6px 4px;margin:8px 0 14px}.tr-box svg{display:block;width:100%;height:auto}.tr-tip{position:absolute;pointer-events:none;background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);padding:7px 10px;font-size:.78rem;opacity:0;z-index:3}" +
    ".tr-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}.tr-t{width:100%;border-collapse:collapse;font-size:.85rem}.tr-t th{text-align:left;color:var(--mute);font-size:.72rem;text-transform:uppercase;padding:4px 6px}.tr-t td{padding:5px 6px;border-top:1px solid var(--line);word-break:break-all}.tr-t td.r,.tr-t th.r{text-align:right;font-variant-numeric:tabular-nums}" +
    ".tr-bar{height:6px;border-radius:3px;background:var(--accent);opacity:.5;margin-top:3px}.tr-note{font-size:.78rem;color:var(--mute);margin:10px 2px}";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nf(n) { return Number(n || 0).toLocaleString(); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function lab(d) { var M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], p = d.split("-"); return M[+p[1] - 1] + " " + +p[2]; }
  function chart(daily, sign, n) {
    var days = [], m = {}, sg = {}, now = Date.now(); daily.forEach(function (x) { m[x.d] = x; }); (sign || []).forEach(function (x) { sg[x.d] = x.n; });
    var today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })); today.setHours(12);
    for (var i = n - 1; i >= 0; i--) { var d = new Date(today.getTime() - i * 864e5), k = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); days.push({ d: k, v: (m[k] || {}).visitors || 0, w: (m[k] || {}).views || 0, s: sg[k] || 0 }); }
    var W = 900, H = 260, L = 44, R = 12, T = 12, B = 30, pw = W - L - R, ph = H - T - B, mx = Math.max(3, Math.max.apply(null, days.map(function (x) { return Math.max(x.v, x.w); }))), top = Math.ceil(mx * 1.1);
    var bw = pw / days.length, X = function (i) { return L + i * bw; }, Y = function (v) { return T + ph * (1 - v / top); }, s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Visitors per day">';
    var step = Math.max(1, Math.round(top / 4)); for (var g = 0; g <= top; g += step) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g) + '" y2="' + Y(g) + '" stroke="var(--line)"/><text x="' + (L - 6) + '" y="' + (Y(g) + 4) + '" text-anchor="end" font-size="11" fill="var(--mute)">' + g + '</text>';
    days.forEach(function (x, i) { s += '<rect x="' + (X(i) + bw * .15).toFixed(1) + '" y="' + Y(x.v).toFixed(1) + '" width="' + (bw * .7).toFixed(1) + '" height="' + (ph * x.v / top).toFixed(1) + '" rx="2" fill="var(--accent)" opacity=".85"/>'; if (x.s) s += '<circle cx="' + (X(i) + bw / 2).toFixed(1) + '" cy="' + (Y(x.v) - 8).toFixed(1) + '" r="4" fill="var(--gain)"/>'; });
    s += '<path d="' + days.map(function (x, i) { return (i ? "L" : "M") + (X(i) + bw / 2).toFixed(1) + " " + Y(x.w).toFixed(1); }).join(" ") + '" fill="none" stroke="var(--ink)" stroke-width="1.8" opacity=".7"/>';
    var ev = Math.max(1, Math.ceil(days.length / 7)); days.forEach(function (x, i) { if (i % ev === 0 || i === days.length - 1) s += '<text x="' + (X(i) + bw / 2).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="11" fill="var(--mute)">' + lab(x.d) + '</text>'; });
    return { svg: s + '</svg>', days: days, geo: { W: W, H: H, L: L, bw: bw } };
  }
  function tbl(rows, h) { var mx = Math.max.apply(null, rows.map(function (r) { return r.views; }).concat([1])); return '<table class="tr-t"><thead><tr><th>' + h + '</th><th class="r">Visitors</th><th class="r">Views</th></tr></thead><tbody>' + (rows.length ? rows.map(function (r) { return '<tr><td>' + esc(r.k) + '<div class="tr-bar" style="width:' + Math.round(r.views / mx * 100) + '%"></div></td><td class="r">' + nf(r.visitors) + '</td><td class="r">' + nf(r.views) + '</td></tr>'; }).join("") : '<tr><td colspan="3" style="color:var(--mute)">Nothing yet</td></tr>') + '</tbody></table>'; }
  function paint() {
    var el = host; if (!el) return;
    var top = '<div class="hm-top"><div><h1>Visitors</h1><p class="sub">Only you can see this page. Counts start from the day tracking was switched on.</p></div><div class="tr-seg" role="group" aria-label="Time frame">' + [[7, "7 days"], [30, "30 days"], [90, "90 days"]].map(function (x) { return '<button type="button" data-trd="' + x[0] + '" class="' + (tf === x[0] ? "on" : "") + '">' + x[1] + '</button>'; }).join("") + '</div></div>';
    if (!data) { el.innerHTML = top + '<p class="hint">' + (busy ? "Loading…" : "Could not load. Make sure the visitor database step was done and you are signed in as the site owner.") + '</p>'; return; }
    var t = data.totals || {}, td = data.today || {}, sg = data.signups || {}, c = chart(data.daily || [], sg.daily, tf);
    el.innerHTML = top + '<div class="tr-k"><div class="tr-kp"><span>Visitors today</span><b>' + nf(td.visitors) + '</b><small>' + nf(td.views) + ' page views</small></div><div class="tr-kp"><span>Visitors, ' + tf + ' days</span><b>' + nf(t.visitors) + '</b><small>' + nf(t.views) + ' page views</small></div><div class="tr-kp"><span>Total sign-ups</span><b>' + nf(sg.total) + '</b><small>' + nf(sg.period) + ' in the last ' + tf + ' days</small></div></div>' +
      '<div class="tr-box" id="trbox">' + c.svg + '<div class="tr-tip" id="trtip"></div></div><p class="tr-note">Bars = people per day. Line = page views. Green dots = a day someone signed up. Days are in New York time.</p>' +
      '<div class="tr-g"><div class="pl-card"><h2>Top pages</h2>' + tbl(data.pages || [], "Page") + '</div><div class="pl-card"><h2>Where visitors come from</h2>' + tbl(data.refs || [], "Source") + '</div><div class="pl-card"><h2>Phone or computer</h2>' + tbl(data.devs || [], "Device") + '</div>' +
      '<div class="pl-card"><h2>Newest sign-ups</h2><table class="tr-t"><tbody>' + ((sg.recent || []).length ? sg.recent.map(function (r) { return '<tr><td>' + esc(r.who) + '</td><td class="r">' + esc(String(r.at).slice(0, 10)) + '</td></tr>'; }).join("") : '<tr><td style="color:var(--mute)">No sign-ups yet</td></tr>') + '</tbody></table></div></div>' +
      '<p class="tr-note"><label><input type="checkbox" id="trskip"' + (localStorage.getItem("ss-notrack") === "1" ? " checked" : "") + '> Don\'t count my own visits from this browser</label><br>Visitors are counted by a random id in the browser, so the same person on two devices counts twice. No names, emails or IP addresses are stored. Emails above are partly hidden.</p>';
    var box = $("trbox"), tip = $("trtip"); if (!box) return;
    box.addEventListener("pointermove", function (e) { var svg = box.querySelector("svg"), r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * c.geo.W / r.width, i = Math.floor((x - c.geo.L) / c.geo.bw); if (i < 0 || i >= c.days.length) { tip.style.opacity = 0; return; } var d = c.days[i]; tip.innerHTML = '<b>' + lab(d.d) + '</b><br>' + d.v + ' visitors<br>' + d.w + ' views' + (d.s ? '<br>' + d.s + ' sign-up' + (d.s > 1 ? "s" : "") : ""); var bx = box.getBoundingClientRect(); tip.style.left = Math.min(bx.width - 130, Math.max(4, e.clientX - bx.left + 12)) + "px"; tip.style.top = "10px"; tip.style.opacity = 1; });
    box.addEventListener("pointerleave", function () { tip.style.opacity = 0; });
  }
  function $(id) { return document.getElementById(id); }
  function load() { busy = true; data = null; paint(); if (!root.stockspotRPC) { busy = false; paint(); return; } root.stockspotRPC("ss_traffic", { days: tf }).then(function (d) { data = d; busy = false; paint(); }).catch(function () { busy = false; paint(); }); }
  function mount(h) {
    host = h; if (!document.getElementById("tr-css")) { var s = document.createElement("style"); s.id = "tr-css"; s.textContent = CSS; document.head.appendChild(s); }
    if (!h._wired) { h._wired = 1; h.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-trd]"); if (b) { tf = +b.dataset.trd; load(); } }); h.addEventListener("change", function (e) { if (e.target.id === "trskip") { try { if (e.target.checked) localStorage.setItem("ss-notrack", "1"); else localStorage.removeItem("ss-notrack"); } catch (x) {} } }); }
    load();
  }
  root.TrafficPage = { mount: mount };
})(window);
