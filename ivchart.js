/* Clean interactive XY chart for the Investments page.
   IvChart.mount(host, pts, st)  pts = [{d:"YYYY-MM-DD", v, tg, cb, hasCb}]  st = {tf, mode} (kept by the caller)
   Time frames, Value / Gain-Loss / Return views, hover crosshair + tooltip, axis labels. */
(function () {
  "use strict";
  var CSS = ".ivc-top{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:flex-end;justify-content:space-between;margin:2px 0 10px}" +
    ".ivc-big{font-size:1.9rem;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}.ivc-chg{font-size:.9rem;font-weight:700;margin-top:3px}" +
    ".ivc-chg.up{color:var(--gain)}.ivc-chg.dn{color:var(--loss)}.ivc-chg small{color:var(--mute);font-weight:600}" +
    ".ivc-ctl{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:0 0 8px}.ivc-seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;overflow:hidden}" +
    ".ivc-seg button{border:0;background:none;color:var(--mute);font:inherit;font-size:.8rem;font-weight:700;padding:5px 12px;cursor:pointer;border-radius:0;margin:0}.ivc-seg button.on{background:var(--ink);color:var(--bg)}" +
    ".ivc-seg button:disabled{opacity:.35;cursor:default}" +
    ".ivc-box{position:relative;border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:6px 4px 2px;touch-action:pan-y}.ivc-box svg{display:block;width:100%;height:auto;overflow:visible}" +
    ".ivc-tip{position:absolute;pointer-events:none;z-index:3;min-width:130px;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);padding:8px 10px;font-size:.78rem;line-height:1.45;opacity:0;transition:opacity .08s}" +
    ".ivc-tip b{display:block;font-size:.95rem}.ivc-tip .up{color:var(--gain)}.ivc-tip .dn{color:var(--loss)}.ivc-hint{margin:6px 2px 0;font-size:.74rem;color:var(--mute)}";
  if (!document.getElementById("ivc-css")) { var st0 = document.createElement("style"); st0.id = "ivc-css"; st0.textContent = CSS; document.head.appendChild(st0); }
  var DAY = 86400000, MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function ms(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return Date.UTC(+m[1], +m[2] - 1, +m[3], 12); }
  function lab(t, long) { var d = new Date(t); return MN[d.getUTCMonth()] + " " + d.getUTCDate() + (long ? ", " + d.getUTCFullYear() : ""); }
  function money(v) { return typeof window.money === "function" ? window.money(v) : "$" + (Math.round(v * 100) / 100).toLocaleString(); }
  function compact(v) { var a = Math.abs(v), s = v < 0 ? "-" : ""; return a >= 1e6 ? s + "$" + (a / 1e6).toFixed(2) + "M" : a >= 1e4 ? s + "$" + (a / 1e3).toFixed(0) + "K" : a >= 1e3 ? s + "$" + (a / 1e3).toFixed(1) + "K" : s + "$" + Math.round(a); }
  function sgn(v) { return (v > 0 ? "+" : v < 0 ? "-" : "") + money(Math.abs(v)); }
  function pct(v) { return (v > 0 ? "+" : "") + v.toFixed(2) + "%"; }
  function nice(lo, hi, n) {
    var span = hi - lo || 1, step = Math.pow(10, Math.floor(Math.log10(span / n))), err = span / n / step;
    step *= err >= 7 ? 10 : err >= 3 ? 5 : err >= 1.5 ? 2 : 1; var out = [], v = Math.ceil(lo / step) * step;
    for (; v <= hi + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-6 ? 0 : v); return out;
  }
  var TF = [["1W", 7], ["1M", 30], ["3M", 91], ["6M", 182], ["YTD", -1], ["1Y", 365], ["ALL", 0]];
  var MODES = [["v", "Value"], ["g", "Gain / loss"], ["p", "Return %"]];

  function mount(host, pts, st) {
    if (!host) return;
    st.tf = st.tf || "ALL"; st.mode = st.mode || "v";
    var data = pts.map(function (p) { return { t: ms(p.d), d: p.d, v: p.v, tg: p.tg, cb: p.cb, has: !!p.hasCb && p.cb > 0 }; }).sort(function (a, b) { return a.t - b.t; });
    var anyCb = data.some(function (p) { return p.has; });
    if (!anyCb && st.mode !== "v") st.mode = "v";
    function val(p) { return st.mode === "v" ? p.v : st.mode === "g" ? (p.has ? p.tg : null) : (p.has ? p.tg / p.cb * 100 : null); }
    function fmt(v, tick) { return st.mode === "p" ? (tick ? v.toFixed(v % 1 ? 1 : 0) + "%" : pct(v)) : st.mode === "g" ? (tick ? compact(v) : sgn(v)) : (tick ? compact(v) : money(v)); }
    function windowed() {
      var cfg = TF.filter(function (x) { return x[0] === st.tf; })[0] || TF[6], end = data.length ? data[data.length - 1].t : Date.now(), start;
      if (cfg[1] === 0) return data.filter(function (p) { return val(p) != null; });
      if (cfg[1] === -1) { var y = new Date(end).getUTCFullYear(); start = Date.UTC(y, 0, 1, 0); } else start = end - cfg[1] * DAY;
      var vis = data.filter(function (p) { return p.t >= start && val(p) != null; }), prev = data.filter(function (p) { return p.t < start && val(p) != null; }).pop();
      if (prev) vis.unshift(prev); return vis;
    }
    host.innerHTML = '<div class="ivc-top"><div><div class="ivc-big" data-big></div><div class="ivc-chg" data-chg></div></div>' +
      '<div class="ivc-ctl" style="margin:0"><div class="ivc-seg" role="group" aria-label="View">' + MODES.map(function (m) { return '<button type="button" data-mode="' + m[0] + '"' + (m[0] !== "v" && !anyCb ? " disabled title=\"Needs cost basis in your file\"" : "") + '>' + m[1] + '</button>'; }).join("") + '</div></div></div>' +
      '<div class="ivc-ctl"><div class="ivc-seg" role="group" aria-label="Time frame">' + TF.map(function (t) { return '<button type="button" data-tf="' + t[0] + '">' + t[0] + '</button>'; }).join("") + '</div></div>' +
      '<div class="ivc-box"><div data-svg></div><div class="ivc-tip" data-tip></div></div><p class="ivc-hint" data-hint></p>';
    var box = host.querySelector(".ivc-box"), svgHost = host.querySelector("[data-svg]"), tip = host.querySelector("[data-tip]");
    var geo = null, vis = [];

    function draw() {
      [].forEach.call(host.querySelectorAll("[data-mode]"), function (b) { b.classList.toggle("on", b.dataset.mode === st.mode); });
      [].forEach.call(host.querySelectorAll("[data-tf]"), function (b) { b.classList.toggle("on", b.dataset.tf === st.tf); });
      vis = windowed();
      var big = host.querySelector("[data-big]"), chg = host.querySelector("[data-chg]"), hint = host.querySelector("[data-hint]");
      if (!vis.length) { svgHost.innerHTML = '<p class="hint" style="padding:30px 14px;text-align:center">Nothing to draw for this view yet.</p>'; big.textContent = "-"; chg.textContent = ""; hint.textContent = ""; geo = null; return; }
      var last = vis[vis.length - 1], first = vis[0], lv = val(last), fv = val(first), up = lv >= fv, col = up ? "var(--gain)" : "var(--loss)";
      big.textContent = fmt(lv);
      if (vis.length > 1) {
        var dlt = lv - fv, rel = st.mode === "p" ? "" : (fv ? " (" + pct(dlt / Math.abs(fv) * 100) + ")" : "");
        chg.className = "ivc-chg " + (dlt >= 0 ? "up" : "dn");
        chg.innerHTML = (st.mode === "p" ? (dlt >= 0 ? "+" : "") + dlt.toFixed(2) + " pts" : sgn(dlt)) + rel + ' <small>' + lab(first.t) + ' to ' + lab(last.t) + '</small>';
      } else { chg.className = "ivc-chg"; chg.innerHTML = '<small>As of ' + lab(last.t, true) + '</small>'; }
      hint.textContent = vis.length < 2 ? "Only one saved day so far. Import again on another day, or add a balance with a past date, and the line fills in." : "Hover or touch the chart to see each saved day. " + vis.length + " saved days shown.";
      var W = Math.max(300, svgHost.clientWidth || host.clientWidth || 700), H = W < 520 ? 250 : 330, L = W < 520 ? 52 : 64, R = 16, T = 14, B = 34, pw = W - L - R, ph = H - T - B;
      var vals = vis.map(val), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      if (st.mode !== "v") { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
      if (hi === lo) { hi += Math.abs(hi) * .02 || 1; lo -= Math.abs(lo) * .02 || 1; }
      var pad = (hi - lo) * .1; hi += pad; lo -= pad; if (st.mode === "v" && lo < 0) lo = 0;
      var t0 = vis[0].t, t1 = vis[vis.length - 1].t; if (t1 === t0) { t0 -= 3 * DAY; t1 += 3 * DAY; }
      var X = function (t) { return L + pw * (t - t0) / (t1 - t0); }, Y = function (v) { return T + ph * (1 - (v - lo) / (hi - lo)); };
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Investments over time"><defs><linearGradient id="ivcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".28"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
      nice(lo, hi, 5).forEach(function (v) {
        s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--line)" stroke-opacity="' + (v === 0 && st.mode !== "v" ? 1 : .55) + '" stroke-width="' + (v === 0 && st.mode !== "v" ? 1.5 : 1) + '"/>' +
          '<text x="' + (L - 8) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--mute)">' + fmt(v, true) + '</text>';
      });
      var span = (t1 - t0) / DAY, tk = [], nt = Math.max(2, Math.min(6, Math.floor(pw / 90)));
      for (var i = 0; i <= nt; i++) tk.push(t0 + (t1 - t0) * i / nt);
      tk.forEach(function (t, i) { s += '<text x="' + X(t).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="' + (i === 0 ? "start" : i === nt ? "end" : "middle") + '" font-size="11" fill="var(--mute)">' + lab(t, span > 300) + '</text>'; });
      var base = Y(st.mode === "v" ? lo : Math.max(lo, Math.min(hi, 0)));
      var path = vis.map(function (p, i) { return (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(val(p)).toFixed(1); }).join(" ");
      if (vis.length > 1) s += '<path d="' + path + ' L' + X(vis[vis.length - 1].t).toFixed(1) + " " + base.toFixed(1) + " L" + X(vis[0].t).toFixed(1) + " " + base.toFixed(1) + ' Z" fill="url(#ivcg)"/>' +
        '<path d="' + path + '" fill="none" stroke="' + col + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
      if (vis.length <= 45) vis.forEach(function (p) { s += '<circle cx="' + X(p.t).toFixed(1) + '" cy="' + Y(val(p)).toFixed(1) + '" r="' + (vis.length > 1 ? 3 : 5) + '" fill="var(--panel)" stroke="' + col + '" stroke-width="2"/>'; });
      s += '<g data-cross style="display:none"><line y1="' + T + '" y2="' + (T + ph) + '" stroke="var(--mute)" stroke-dasharray="4 4"/><circle r="5.5" fill="' + col + '" stroke="var(--panel)" stroke-width="2"/></g></svg>';
      svgHost.innerHTML = s; geo = { W: W, H: H, X: X, Y: Y, L: L, R: R, T: T, ph: ph, col: col };
    }

    function hover(ev) {
      if (!geo || !vis.length) return;
      var svg = svgHost.querySelector("svg"); if (!svg) return; var r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * geo.W / r.width, best = 0, bd = 1e9;
      vis.forEach(function (p, i) { var d = Math.abs(geo.X(p.t) - x); if (d < bd) { bd = d; best = i; } });
      var p = vis[best], v = val(p), px = geo.X(p.t), py = geo.Y(v), g = svg.querySelector("[data-cross]");
      g.style.display = ""; g.querySelector("line").setAttribute("x1", px); g.querySelector("line").setAttribute("x2", px); g.querySelector("circle").setAttribute("cx", px); g.querySelector("circle").setAttribute("cy", py);
      var dlt = v - val(vis[0]), cls = dlt >= 0 ? "up" : "dn", extra = "";
      if (st.mode === "v" && p.has) extra = '<div>Gain/loss: <span class="' + (p.tg >= 0 ? "up" : "dn") + '">' + sgn(p.tg) + '</span></div>';
      tip.innerHTML = '<div style="color:var(--mute)">' + lab(p.t, true) + '</div><b>' + fmt(v) + '</b>' + extra + (best > 0 ? '<div>vs start: <span class="' + cls + '">' + (st.mode === "p" ? (dlt >= 0 ? "+" : "") + dlt.toFixed(2) + " pts" : sgn(dlt)) + '</span></div>' : "");
      var bx = box.getBoundingClientRect(), tx = r.left - bx.left + px * r.width / geo.W, tw = 150;
      tip.style.left = Math.max(4, Math.min(bx.width - tw - 4, tx + 12 + (tx > bx.width * .6 ? -tw - 24 : 0))) + "px"; tip.style.top = Math.max(4, r.top - bx.top + py * r.height / geo.H - 56) + "px"; tip.style.opacity = 1;
    }
    function leave() { tip.style.opacity = 0; var g = svgHost.querySelector("[data-cross]"); if (g) g.style.display = "none"; }
    box.addEventListener("pointermove", hover); box.addEventListener("pointerdown", hover); box.addEventListener("pointerleave", leave);
    host.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("button"); if (!b || b.disabled) return;
      if (b.dataset.tf) { st.tf = b.dataset.tf; draw(); } else if (b.dataset.mode) { st.mode = b.dataset.mode; draw(); }
    });
    var rt = 0, lastW = 0;
    function onResize() { if (!host.isConnected) { window.removeEventListener("resize", onResize); return; } clearTimeout(rt); rt = setTimeout(function () { if (svgHost.clientWidth !== lastW) { lastW = svgHost.clientWidth; draw(); } }, 120); }
    window.addEventListener("resize", onResize);
    draw(); lastW = svgHost.clientWidth;
  }
  window.IvChart = { mount: mount };
})();
