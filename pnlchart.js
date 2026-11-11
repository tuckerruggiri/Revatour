/* Interactive yearly P&L charts: scroll to zoom, drag to move, hover for details, date and $ range inputs.
   window.PnlChart.mount(host, rows, helpers) where rows = [{d:"YYYY-MM-DD", pnl, cum, pct, cumPct, n}]
   helpers = { money(v), sgn(v), pct(v), label(iso) } */
(function () {
  "use strict";
  var CSS = ".pfc-ctl{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:8px 0 10px}.pfc-ctl label{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:700;color:var(--mute);text-transform:uppercase;letter-spacing:.05em}.pfc-ctl input{width:140px;box-sizing:border-box}.pfc-ctl input[type=number]{width:110px}.pfc-ctl .pfc-b{display:flex;gap:6px;flex-wrap:wrap}.pfc-ctl button{padding:7px 12px}.pfc-ctl button.on{background:var(--ink);color:var(--panel);border-color:var(--ink)}.pfc-hint{margin:0 0 6px;color:var(--mute);font-size:.8rem}" +
    ".pfc-box{position:relative;border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:8px 8px 4px;margin:6px 0 14px;touch-action:pan-y}.pfc-box svg.pfc{display:block;width:100%;height:auto;cursor:grab;user-select:none}.pfc-box.drag svg.pfc{cursor:grabbing}.pfc-tip{position:absolute;pointer-events:none;z-index:3;min-width:150px;background:var(--ink);color:var(--panel);border-radius:10px;padding:8px 10px;font-size:.78rem;line-height:1.45;box-shadow:0 6px 20px rgba(0,0,0,.25);display:none}.pfc-tip b{display:block;font-size:.85rem;margin-bottom:2px}.pfc-tip i{font-style:normal;opacity:.75}" +
    ".pfc-ttl{margin:0 0 2px 6px;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--mute)}";
  if (!document.getElementById("pfc-css")) { var st = document.createElement("style"); st.id = "pfc-css"; st.textContent = CSS; document.head.appendChild(st); }
  var DAY = 86400000;
  function ms(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return Date.UTC(+m[1], +m[2] - 1, +m[3], 12); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  var MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nice(lo, hi, n) {
    var span = hi - lo || 1, step = Math.pow(10, Math.floor(Math.log10(span / n))), err = span / n / step;
    step *= err >= 7 ? 10 : err >= 3 ? 5 : err >= 1.5 ? 2 : 1; var out = [], v = Math.ceil(lo / step) * step;
    for (; v <= hi + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-6 ? 0 : v); return out;
  }
  function xticks(a, b, w) {
    var span = (b - a) / DAY, out = [], d = new Date(a);
    if (span > 120) { d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)); while (d.getTime() <= b) { out.push([d.getTime(), MN[d.getUTCMonth()] + (d.getUTCMonth() === 0 ? " " + d.getUTCFullYear() : "")]); d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)); } }
    else {
      var step = span > 60 ? 14 : span > 25 ? 7 : span > 12 ? 3 : 1, t = Math.ceil(a / DAY / step) * step * DAY;
      for (; t <= b; t += step * DAY) { var e = new Date(t); out.push([t + 12 * 3600000 - (t % DAY) * 0, MN[e.getUTCMonth()] + " " + e.getUTCDate()]); }
    }
    var max = Math.max(3, Math.floor(w / 80)); if (out.length > max) { var k = Math.ceil(out.length / max); out = out.filter(function (_, i) { return i % k === 0; }); }
    return out;
  }
  function mount(host, rows, H) {
    if (!rows.length) { host.innerHTML = ""; return; }
    var pts = rows.map(function (r) { return { t: ms(r.d), r: r }; }), full = [pts[0].t - 3 * DAY, pts[pts.length - 1].t + 3 * DAY];
    var V = { a: full[0], b: full[1], ymin: null, ymax: null };
    host.innerHTML = '<div class="pfc-ctl"><label>From<input type="date" data-f="from"></label><label>To<input type="date" data-f="to"></label>' +
      '<label>Min $ (cumulative)<input type="number" step="any" data-f="ymin" placeholder="auto"></label><label>Max $ (cumulative)<input type="number" step="any" data-f="ymax" placeholder="auto"></label>' +
      '<div class="pfc-b"><button type="button" data-z="30">1M</button><button type="button" data-z="90">3M</button><button type="button" data-z="180">6M</button><button type="button" data-z="0" class="on">All</button></div></div>' +
      '<p class="pfc-hint">Scroll over a chart to zoom, drag to move left or right, hover for the day. Double-click to reset.</p>' +
      '<div class="pfc-ttl">Cumulative P&amp;L ($) by date</div><div class="pfc-box" data-c="cum"></div><div class="pfc-ttl">Daily P&amp;L ($) by date</div><div class="pfc-box" data-c="day"></div>';
    var boxes = { cum: host.querySelector('[data-c="cum"]'), day: host.querySelector('[data-c="day"]') }, inp = {};
    [].forEach.call(host.querySelectorAll("[data-f]"), function (i) { inp[i.getAttribute("data-f")] = i; });
    var tips = {};
    function draw() {
      ["cum", "day"].forEach(function (k) {
        var box = boxes[k], W = Math.max(320, box.clientWidth - 16 || 800), Ht = k === "cum" ? 300 : 210, L = 74, R = 16, T = 12, B = 46, pw = W - L - R, ph = Ht - T - B;
        var vis = pts.filter(function (p) { return p.t >= V.a - DAY && p.t <= V.b + DAY; }), vals;
        if (k === "cum") { vals = vis.map(function (p) { return p.r.cum; }).concat([0]); if (vis.length && vis[0] !== pts[0]) { var pi = pts.indexOf(vis[0]); if (pi > 0) vals.push(pts[pi - 1].r.cum); } }
        else vals = vis.map(function (p) { return p.r.pnl; }).concat([0]);
        var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = (hi - lo || 1) * 0.1; lo -= pad; hi += pad;
        if (k === "cum") { if (V.ymin != null) lo = V.ymin; if (V.ymax != null) hi = V.ymax; if (hi <= lo) hi = lo + 1; }
        var X = function (t) { return L + pw * (t - V.a) / (V.b - V.a); }, Y = function (v) { return T + ph * (1 - (v - lo) / (hi - lo)); }, s = "", id = "pfclip" + k;
        s += '<defs><clipPath id="' + id + '"><rect x="' + L + '" y="' + T + '" width="' + pw + '" height="' + ph + '"/></clipPath></defs>';
        nice(lo, hi, 5).forEach(function (v) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--line)" ' + (v === 0 ? 'stroke-width="1.5"' : 'stroke-dasharray="3 4"') + '/><text x="' + (L - 8) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="12" fill="var(--mute)">' + esc(H.money(v).replace(/\.00$/, "")) + '</text>'; });
        xticks(V.a, V.b, pw).forEach(function (tk) { s += '<line x1="' + X(tk[0]).toFixed(1) + '" x2="' + X(tk[0]).toFixed(1) + '" y1="' + T + '" y2="' + (T + ph) + '" stroke="var(--line)" stroke-opacity=".5"/><text x="' + X(tk[0]).toFixed(1) + '" y="' + (T + ph + 16) + '" text-anchor="middle" font-size="12" fill="var(--mute)">' + esc(tk[1]) + '</text>'; });
        s += '<text x="' + (L + pw / 2) + '" y="' + (Ht - 6) + '" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">Date</text>' +
          '<text transform="translate(14 ' + (T + ph / 2) + ') rotate(-90)" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">' + (k === "cum" ? "Cumulative P&amp;L ($)" : "Daily P&amp;L ($)") + '</text>';
        s += '<g clip-path="url(#' + id + ')">';
        if (k === "cum") {
          var up = rows[rows.length - 1].cum >= 0, col = "var(--" + (up ? "gain" : "loss") + ")", d = "M" + X(pts[0].t - DAY).toFixed(1) + " " + Y(0).toFixed(1) + pts.map(function (p) { return " L" + X(p.t).toFixed(1) + " " + Y(p.r.cum).toFixed(1); }).join("");
          s += '<path d="' + d + ' L' + X(pts[pts.length - 1].t).toFixed(1) + " " + Y(0).toFixed(1) + ' Z" fill="' + col + '" fill-opacity=".08"/><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2.5" stroke-linejoin="round"/>';
          var showDots = vis.length <= 80; if (showDots) pts.forEach(function (p) { s += '<circle cx="' + X(p.t).toFixed(1) + '" cy="' + Y(p.r.cum).toFixed(1) + '" r="3.5" fill="' + col + '"/>'; });
        } else {
          var bw = pw / Math.max(1, (V.b - V.a) / DAY) * 0.8, w = Math.max(2, Math.min(36, bw)), z = Y(0);
          pts.forEach(function (p) { var y = Math.min(Y(p.r.pnl), z), h = Math.max(1, Math.abs(Y(p.r.pnl) - z)); s += '<rect x="' + (X(p.t) - w / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" fill="var(--' + (p.r.pnl >= 0 ? "gain" : "loss") + ')"/>'; });
        }
        s += '</g><line class="pfc-x" y1="' + T + '" y2="' + (T + ph) + '" stroke="var(--ink)" stroke-opacity=".5" style="display:none"/><circle class="pfc-dot" r="5" fill="var(--panel)" stroke="var(--ink)" stroke-width="2" style="display:none"/>';
        box.innerHTML = '<svg class="pfc" viewBox="0 0 ' + W + " " + Ht + '" role="img" aria-label="' + (k === "cum" ? "Cumulative" : "Daily") + ' P&amp;L chart">' + s + '</svg><div class="pfc-tip"></div>';
        box._g = { L: L, R: R, T: T, pw: pw, ph: ph, W: W, Ht: Ht, X: X, Y: Y }; tips[k] = box.querySelector(".pfc-tip");
      });
      inp.from.value = iso(Math.max(V.a, pts[0].t - 0)); inp.to.value = iso(Math.min(V.b, pts[pts.length - 1].t));
      var allv = V.b - V.a >= full[1] - full[0] - DAY;
      [].forEach.call(host.querySelectorAll("[data-z]"), function (b) { var z = +b.getAttribute("data-z"); b.classList.toggle("on", z === 0 ? allv : Math.abs((V.b - V.a) / DAY - z) < 2); });
    }
    function clamp() {
      var span = Math.max(3 * DAY, Math.min(V.b - V.a, full[1] - full[0])); if (V.a < full[0]) { V.a = full[0]; V.b = V.a + span; } if (V.b > full[1]) { V.b = full[1]; V.a = V.b - span; }
    }
    function pos(box, ev) { var r = box.querySelector("svg").getBoundingClientRect(), g = box._g, sc = g.W / r.width; return { x: (ev.clientX - r.left) * sc, y: (ev.clientY - r.top) * sc, k: sc, r: r }; }
    function hover(k, ev) {
      var box = boxes[k], g = box._g, p = pos(box, ev), t = V.a + (p.x - g.L) / g.pw * (V.b - V.a), best = null, bd = 1e18;
      if (p.x < g.L || p.x > g.L + g.pw) { hide(k); return; }
      pts.forEach(function (q) { var d = Math.abs(q.t - t); if (d < bd) { bd = d; best = q; } }); if (!best) return;
      var r = best.r, X = g.X(best.t), svg = box.querySelector("svg");
      var ln = svg.querySelector(".pfc-x"), dot = svg.querySelector(".pfc-dot"); ln.setAttribute("x1", X); ln.setAttribute("x2", X); ln.style.display = ""; dot.setAttribute("cx", X); dot.setAttribute("cy", g.Y(k === "cum" ? r.cum : r.pnl)); dot.style.display = "";
      var tip = tips[k]; tip.innerHTML = "<b>" + esc(H.label(r.d)) + "</b>Day P&amp;L: " + esc(H.sgn(r.pnl)) + (r.pct == null ? "" : " <i>(" + esc(H.pct(r.pct)) + ")</i>") + "<br>Running: " + esc(H.sgn(r.cum)) + (r.cumPct == null ? "" : " <i>(" + esc(H.pct(r.cumPct)) + ")</i>") + "<br><i>" + r.n + (r.n === 1 ? " trade" : " trades") + "</i>"; tip.style.display = "block";
      var bx = box.getBoundingClientRect(), left = (X / g.W) * p.r.width + 12; if (left + 170 > bx.width) left -= 190; tip.style.left = Math.max(4, left) + "px"; tip.style.top = "14px";
    }
    function hide(k) { var box = boxes[k], svg = box.querySelector("svg"); if (!svg) return; svg.querySelector(".pfc-x").style.display = "none"; svg.querySelector(".pfc-dot").style.display = "none"; tips[k].style.display = "none"; }
    function zoomAt(k, ev, f) { var box = boxes[k], g = box._g, p = pos(box, ev), fr = Math.max(0, Math.min(1, (p.x - g.L) / g.pw)), c = V.a + fr * (V.b - V.a), span = (V.b - V.a) * f; span = Math.max(3 * DAY, Math.min(span, full[1] - full[0])); V.a = c - fr * span; V.b = V.a + span; clamp(); draw(); }
    ["cum", "day"].forEach(function (k) {
      var box = boxes[k], drag = null;
      box.addEventListener("wheel", function (ev) { ev.preventDefault(); if (ev.shiftKey || Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) { var sh = (ev.deltaX || ev.deltaY) / box._g.pw * (V.b - V.a); V.a += sh; V.b += sh; clamp(); draw(); } else zoomAt(k, ev, ev.deltaY > 0 ? 1.18 : 1 / 1.18); }, { passive: false });
      box.addEventListener("pointerdown", function (ev) { if (ev.button !== 0) return; drag = { x: ev.clientX, a: V.a, b: V.b }; box.classList.add("drag"); try { box.setPointerCapture(ev.pointerId); } catch (e) { } });
      box.addEventListener("pointermove", function (ev) { if (drag) { var g = box._g, r = box.querySelector("svg").getBoundingClientRect(), dx = (ev.clientX - drag.x) * (g.W / r.width) / g.pw * (drag.b - drag.a); V.a = drag.a - dx; V.b = drag.b - dx; clamp(); draw(); hover(k, ev); } else hover(k, ev); });
      box.addEventListener("pointerup", function () { drag = null; box.classList.remove("drag"); });
      box.addEventListener("pointerleave", function () { hide(k); });
      box.addEventListener("dblclick", function () { V.a = full[0]; V.b = full[1]; V.ymin = V.ymax = null; inp.ymin.value = inp.ymax.value = ""; draw(); });
    });
    host.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("[data-z]"); if (!b) return; var z = +b.getAttribute("data-z"); if (!z) { V.a = full[0]; V.b = full[1]; } else { V.b = full[1]; V.a = V.b - z * DAY; } clamp(); draw(); });
    host.addEventListener("change", function (ev) {
      var f = ev.target.getAttribute && ev.target.getAttribute("data-f"); if (!f) return; var v = ev.target.value;
      if (f === "from" && v) V.a = Math.min(ms(v) - DAY / 2, V.b - 3 * DAY); else if (f === "to" && v) V.b = Math.max(ms(v) + DAY / 2, V.a + 3 * DAY);
      else if (f === "ymin") V.ymin = v === "" || isNaN(+v) ? null : +v; else if (f === "ymax") V.ymax = v === "" || isNaN(+v) ? null : +v;
      clamp(); draw();
    });
    var rt; if (host._ro) host._ro.disconnect(); if (window.ResizeObserver) { host._ro = new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(draw, 80); }); host._ro.observe(host); }
    draw();
  }
  window.PnlChart = { mount: mount };
})();
