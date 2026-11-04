/* Practice charts page: four synced candlestick charts (1, 2, 5, 15 minute) over 5 gap-up sessions.
   Drag to scroll, switch to Highlight and drag over an area to reveal the setup that formed there. */
(function () {
  "use strict";
  var PD = window.PracticeData, TFS = [1, 2, 5, 15], MIN = PD.MIN, PER = PD.PER, TOTAL = MIN * PD.NDAY;
  var ST = { stock: 0, tc: 0, z: 1, mode: "scroll", ema: true, vwap: true, ma: true, mark: false, wheel: window.innerWidth >= 900, active: null, hover: null, sel: null, msg: "", dirty: true, mounted: false };
  var P = [], root, dataFor, scrub, raf = 0, css = null;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function clock(m) { var t = 570 + Math.max(0, Math.floor(m)), h = Math.floor(t / 60), mm = t % 60; return (h > 12 ? h - 12 : h) + ":" + (mm < 10 ? "0" : "") + mm; }
  function f2(x) { return x.toFixed(2); }
  function nbFor() { return Math.max(12, Math.min(300, Math.round(90 / ST.z))); }
  function zoomBy(f, p, px) { // zoom in (f>1) or out (f<1), keeping the time under the cursor fixed
    var nz = Math.max(0.3, Math.min(8, ST.z * f)); if (nz === ST.z) return;
    if (p && px != null) { var v = view(p), m = v.mAt(px); ST.z = nz; var nb = nbFor(), pxb = v.pw / nb; setTc((m / p.tf - (px - v.padL) / pxb + nb / 2) * p.tf); }
    else { ST.z = nz; dirty(); }
  }
  function refresh() { ST.active = null; ST.sel = null; ST.msg = ""; renderInfo(); syncUI(); dirty(); }
  function data() { return PD.get(ST.stock); }
  function dirty() { ST.dirty = true; if (!raf) raf = requestAnimationFrame(frame); }

  function addCss() {
    if (document.getElementById("pc-css")) return;
    var s = document.createElement("style"); s.id = "pc-css";
    s.textContent = "#pracv.wrap{max-width:none;width:100%;box-sizing:border-box;padding-left:20px;padding-right:20px}" +
      ".pc h1{margin:0 0 6px}.pc-p{max-width:92ch;line-height:1.55;color:var(--mute);margin:0 0 12px}.pc-bar{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;margin:0 0 10px}.pc-grp{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.pc-lab{font-size:.74rem;text-transform:uppercase;letter-spacing:.05em;color:var(--mute);margin-right:2px}" +
      ".pc-b{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:9px;padding:6px 11px;font:inherit;font-size:.86rem;font-weight:600;cursor:pointer}.pc-b.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}.pc-b:disabled{opacity:.4;cursor:default}" +
      ".pc-ck{display:inline-flex!important;flex-direction:row!important;gap:5px;align-items:center;font-size:.86rem;cursor:pointer;margin:0;width:auto}.pc-ck input{width:auto!important;margin:0}.pc-scrub{display:block;width:100%;height:64px;border:1px solid var(--line);border-radius:10px;background:var(--panel);margin:0 0 10px;touch-action:none;cursor:ew-resize}" +
      ".pc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:899px){.pc-grid{grid-template-columns:1fr}}.pc-pan{border:1px solid var(--line);border-radius:12px;background:var(--panel);overflow:hidden;min-width:0}" +
      ".pc-ph{display:flex;gap:10px;align-items:baseline;padding:7px 10px 3px;font-size:.8rem}.pc-ph b{font-size:.95rem}.pc-ro{color:var(--mute);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".pc-cv{display:block;width:100%;height:330px}@media(max-width:899px){.pc-cv{height:280px}}.pc-cv.hl{cursor:crosshair}.pc-cv.sc{cursor:grab;touch-action:pan-y}.pc-cv.hl{touch-action:none}" +
      ".pc-info{margin:12px 0;border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:14px 16px}.pc-info h2{margin:0 0 4px;font-size:1.1rem}.pc-pill{display:inline-block;border-radius:999px;padding:2px 10px;font-size:.78rem;font-weight:700;margin-left:6px;border:1px solid var(--line)}.pc-pill.l{color:var(--gain)}.pc-pill.s{color:var(--loss)}.pc-pill.x{color:var(--mute)}" +
      ".pc-steps{margin:8px 0;padding:0;list-style:none;display:grid;gap:5px}.pc-steps li{display:flex;gap:8px;line-height:1.4}.pc-steps li.t{font-weight:700}.pc-steps li.bad{color:var(--loss)}.pc-lv{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:10px 0}.pc-lv div{background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:7px 10px}.pc-lv small{display:block;color:var(--mute);font-size:.72rem}.pc-lv b{font-variant-numeric:tabular-nums}" +
      ".pc-list{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.pc-day{width:100%;font-size:.74rem;text-transform:uppercase;letter-spacing:.05em;color:var(--mute);margin-top:6px}.pc-ch{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:4px 10px;font:inherit;font-size:.8rem;cursor:pointer}.pc-ch.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}.pc-ch.l{border-left:3px solid var(--gain)}.pc-ch.s{border-left:3px solid var(--loss)}.pc-ch.x{border-style:dashed;color:var(--mute)}" +
      ".pc-strip{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:var(--bg);padding:8px 0;margin:0 0 6px;border-bottom:1px solid var(--line)}.pc-rf{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}.pc-zh{margin-left:6px}@media(max-width:899px){.pc-zh{display:none}}" +
      ".pc-nav{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.pc-hint{color:var(--mute);font-size:.84rem;line-height:1.5}";
    document.head.appendChild(s);
  }

  function colors() {
    var cs = getComputedStyle(document.documentElement), g = function (n, d) { return (cs.getPropertyValue(n) || "").trim() || d; };
    css = { gain: g("--gain", "#0b6b5a"), loss: g("--loss", "#b3261e"), ink: g("--ink", "#111"), mute: g("--mute", "#777"), line: g("--line", "#ddd"), panel: g("--panel", "#fff"), bg: g("--bg", "#f3f3f3"), accent: g("--accent", "#111") };
    css.dark = /^#?(0|1)[0-9a-f]{5}$/i.test(css.panel.replace("#", "")) || css.panel === "#0f0f0f";
    css.ema = css.dark ? "#f5b942" : "#c27c00"; css.vw = css.dark ? "#b79cff" : "#6d3fd1"; css.ma = css.dark ? "#5ec8ff" : "#0a6cc4"; css.hl = css.dark ? "#ffffff" : "#000000";
  }

  /* ---------- data per timeframe ---------- */
  function loadPanels() {
    var d = data(); P.forEach(function (p) { p.bars = PD.agg(d.M, p.tf); p.bars.forEach(function (b, q) { b.m = d.MA[Math.min(d.MA.length - 1, Math.floor(((q + 1) * p.tf - 1) / 2))]; }); });
  }
  function view(p) {
    var cv = p.cv, W = cv.clientWidth, H = cv.clientHeight, padL = 4, padR = 74, padT = 8, padB = 20, volH = Math.round(H * 0.14), nb = nbFor();
    var pw = W - padL - padR, pxb = pw / nb, left = ST.tc / p.tf - nb / 2;
    return { W: W, H: H, padL: padL, padR: padR, padT: padT, padB: padB, volH: volH, pw: pw, nb: nb, pxb: pxb, left: left, ph: H - padT - padB - volH - 6, x: function (j) { return padL + (j - left + 0.5) * pxb; }, xm: function (m) { return padL + (m / p.tf - left) * pxb; }, mAt: function (px) { return (left + (px - padL) / pxb) * p.tf; } };
  }

  /* ---------- drawing ---------- */
  function niceStep(r) { var e = Math.pow(10, Math.floor(Math.log10(r))), f = r / e; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * e; }
  function barIdxAt(p, i2) { return Math.floor(i2 * 2 / p.tf); }
  function drawPanel(p) {
    var cv = p.cv, dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    var v = view(p), bars = p.bars, tf = p.tf, j0 = Math.max(0, Math.floor(v.left)), j1 = Math.min(bars.length - 1, Math.ceil(v.left + v.nb));
    var A = ST.active, hi = -1e9, lo = 1e9, vmax = 1, j;
    for (j = j0; j <= j1; j++) { var b = bars[j]; if (b.h > hi) hi = b.h; if (b.l < lo) lo = b.l; if (b.v > vmax) vmax = b.v; }
    if (hi < lo) { hi = 1; lo = 0; }
    if (A && A.kind === "setup") { [A.stop, A.entry, A.T[1]].forEach(function (x) { if (x > hi) hi = x; if (x < lo) lo = x; }); }
    var pad = (hi - lo) * 0.07 || 0.1; hi += pad; lo -= pad; if (A) { var ex = (hi - lo) * 0.14; if (A.s < 0) hi += ex; else lo -= ex; }
    var top = v.padT, bot = v.padT + v.ph, Y = function (x) { return top + (1 - (x - lo) / (hi - lo)) * v.ph; };
    g.font = "11px system-ui,sans-serif"; g.textBaseline = "middle";
    // grid + price axis
    var step = niceStep((hi - lo) / 6), t0 = Math.ceil(lo / step) * step; g.lineWidth = 1;
    for (var pr = t0; pr < hi; pr += step) { var yy = Math.round(Y(pr)) + .5; g.strokeStyle = css.line; g.globalAlpha = .55; g.beginPath(); g.moveTo(v.padL, yy); g.lineTo(v.W - v.padR, yy); g.stroke(); g.globalAlpha = 1; g.fillStyle = css.mute; g.textAlign = "left"; g.fillText(f2(pr), v.W - v.padR + 6, yy); }
    // day separators, gap marks
    for (j = j0; j <= j1; j++) {
      if ((j * tf) % MIN === 0) {
        var xs = v.x(j) - v.pxb / 2, dn = Math.round(j * tf / MIN), D = data().D[dn];
        if (j > 0) { g.strokeStyle = css.mute; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(xs + .5, top); g.lineTo(xs + .5, bot + v.volH + 6); g.stroke(); g.setLineDash([]); }
        g.fillStyle = css.mute; g.textAlign = "left"; var dl = "Day " + (dn + 1) + "  gap +" + ((D.open / D.prev - 1) * 100).toFixed(1) + "%"; if (xs + 8 + g.measureText(dl).width < v.W - v.padR) g.fillText(dl, xs + 4, top + 6);
        if (D.prev >= lo && D.prev <= hi && j > 0) { g.strokeStyle = css.mute; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(xs, Y(D.prev)); g.lineTo(xs + Math.min(v.pw * 0.22, 130), Y(D.prev)); g.stroke(); g.setLineDash([]); g.fillStyle = css.mute; if (xs + 90 < v.W - v.padR) g.fillText("prev close " + f2(D.prev), xs + 4, Y(D.prev) + 9); }
      }
    }
    // volume
    var vy = bot + 6 + v.volH;
    for (j = j0; j <= j1; j++) { var bb = bars[j], up = bb.c >= bb.o; g.fillStyle = up ? css.gain : css.loss; g.globalAlpha = .35; var vh = bb.v / vmax * v.volH; g.fillRect(v.x(j) - Math.max(1, v.pxb * .35), vy - vh, Math.max(1, v.pxb * .7), vh); g.globalAlpha = 1; }
    // active setup band (behind candles)
    if (A) { var xa = v.xm(A.span[0] * 2), xb = v.xm((A.span[1] + 1) * 2); g.fillStyle = css.accent; g.globalAlpha = .07; g.fillRect(xa, top, xb - xa, v.ph + v.volH + 6); g.globalAlpha = 1; }
    // candles
    for (j = j0; j <= j1; j++) {
      var c = bars[j], x = v.x(j), col = c.c >= c.o ? css.gain : css.loss, bw = Math.max(1, v.pxb * 0.68), y1 = Y(Math.max(c.o, c.c)), y2 = Y(Math.min(c.o, c.c));
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.round(x) + .5, Y(c.h)); g.lineTo(Math.round(x) + .5, Y(c.l)); g.stroke();
      g.fillRect(x - bw / 2, y1, bw, Math.max(1, y2 - y1));
    }
    // EMA / VWAP
    function line(key, col, breakDay) {
      g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); var on = false;
      for (var q = Math.max(0, j0 - 1); q <= Math.min(bars.length - 1, j1 + 1); q++) {
        var yv = Y(bars[q][key]), xq = v.x(q); if (breakDay && (q * tf) % MIN === 0) on = false;
        if (!on) { g.moveTo(xq, yv); on = true; } else g.lineTo(xq, yv);
      } g.stroke(); g.lineWidth = 1;
    }
    if (ST.ema) line("e", css.ema, false); if (ST.vwap) line("w", css.vw, true); if (ST.ma) line("m", css.ma, false);
    // time axis
    var minStep = 70 / v.pxb * tf, cand = [5, 10, 15, 30, 60, 120, 195, 390], ts = 390; for (var q = 0; q < cand.length; q++) if (cand[q] >= minStep && cand[q] % tf === 0) { ts = cand[q]; break; }
    g.fillStyle = css.mute; g.textAlign = "center"; g.textBaseline = "alphabetic";
    for (j = j0; j <= j1; j++) { var md = (j * tf) % MIN; if (md % ts === 0) g.fillText(clock(md), v.x(j), v.H - 5); }
    g.textBaseline = "middle";
    // marks for every setup
    var D2 = data();
    if (ST.mark || A) D2.S.forEach(function (s) {
      if (!ST.mark && s !== A) return; var jb = barIdxAt(p, s.trig); if (jb < j0 || jb > j1) return; var b2 = bars[jb], x = v.x(jb), long = s.s > 0;
      if (s.kind === "decoy") { g.fillStyle = css.mute; g.textAlign = "center"; g.fillText("✕", x, Y(b2.l) + 12); return; }
      g.fillStyle = long ? css.gain : css.loss; g.beginPath(); if (long) { g.moveTo(x, Y(b2.l) + 4); g.lineTo(x - 5, Y(b2.l) + 12); g.lineTo(x + 5, Y(b2.l) + 12); } else { g.moveTo(x, Y(b2.h) - 4); g.lineTo(x - 5, Y(b2.h) - 12); g.lineTo(x + 5, Y(b2.h) - 12); } g.fill();
      if (ST.mark && v.pxb >= 5) { g.textAlign = "center"; g.fillText(s.label || s.name, x, long ? Y(b2.l) + 22 : Y(b2.h) - 22); }
    });
    // active setup overlay
    if (A) overlay(g, p, v, Y, top, bot);
    // selection
    if (ST.sel) { var sa = v.xm(Math.min(ST.sel.a, ST.sel.b)), sb = v.xm(Math.max(ST.sel.a, ST.sel.b)); g.fillStyle = css.accent; g.globalAlpha = .12; g.fillRect(sa, top, sb - sa, v.ph + v.volH + 6); g.globalAlpha = 1; g.strokeStyle = css.accent; g.setLineDash([4, 3]); g.strokeRect(sa + .5, top + .5, sb - sa, v.ph + v.volH + 5); g.setLineDash([]); }
    // crosshair
    var ro = p.ro, h = ST.hover;
    if (h) {
      var xh = v.xm(Math.floor(h.m / tf) * tf + tf / 2); g.strokeStyle = css.mute; g.globalAlpha = .7; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(Math.round(xh) + .5, top); g.lineTo(Math.round(xh) + .5, bot + v.volH + 6); if (h.p === p) { g.moveTo(v.padL, Math.round(h.y) + .5); g.lineTo(v.W - v.padR, Math.round(h.y) + .5); } g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      if (h.p === p && h.y >= top && h.y <= bot) { var pv = hi - (h.y - top) / v.ph * (hi - lo); g.fillStyle = css.ink; g.fillRect(v.W - v.padR + 1, h.y - 8, v.padR - 2, 16); g.fillStyle = css.panel; g.textAlign = "left"; g.fillText(f2(pv), v.W - v.padR + 6, h.y); }
      var bi = Math.floor(h.m / tf), bq = bars[bi]; if (bq) ro.textContent = "D" + (Math.floor(bi * tf / MIN) + 1) + " " + clock((bi * tf) % MIN) + "   O " + f2(bq.o) + "  H " + f2(bq.h) + "  L " + f2(bq.l) + "  C " + f2(bq.c) + "  V " + Math.round(bq.v / 1000) + "k"; else ro.textContent = "";
    } else { var lb = bars[Math.min(bars.length - 1, Math.max(0, Math.floor(ST.tc / tf)))]; ro.textContent = lb ? "C " + f2(lb.c) + "   EMA " + f2(lb.e) + "   VWAP " + f2(lb.w) + "   200 MA " + f2(lb.m) : ""; }
  }

  function overlay(g, p, v, Y, top, bot) {
    var A = ST.active, bars = p.bars, tf = p.tf, long = A.s > 0, bad = A.kind === "decoy";
    // step badges
    A.steps.forEach(function (st, k) {
      var jb = barIdxAt(p, st.i), b = bars[jb]; if (!b) return; var x = tf === 1 ? v.xm(st.i * 2 + 1) : v.x(jb);
      var below = long, y = below ? Y(b.l) + 14 : Y(b.h) - 14, col = st.bad ? css.loss : (st.trig ? css.accent : css.mute);
      if (tf <= 5 && !st.trig) { g.fillStyle = col; g.beginPath(); g.arc(x, y, 8, 0, 6.3); g.fill(); g.fillStyle = css.panel; g.font = "bold 10px system-ui,sans-serif"; g.textAlign = "center"; g.fillText(String(k + 1), x, y + .5); g.font = "11px system-ui,sans-serif"; }
      if (st.trig) { // arrow pointing at trigger candle (like your screenshots)
        var ay = below ? Y(b.l) + 8 : Y(b.h) - 8, dir = below ? 1 : -1; g.fillStyle = bad ? css.mute : css.hl; g.beginPath(); g.moveTo(x, ay); g.lineTo(x - 6, ay + dir * 12); g.lineTo(x + 6, ay + dir * 12); g.closePath(); g.fill(); g.fillRect(x - 1.5, ay + dir * 12, 3, dir * 16);
        g.font = "bold 11px system-ui,sans-serif"; g.textAlign = "center"; g.fillText(bad ? "LOOKS LIKE A TRIGGER" : "TRIGGER", x, ay + dir * 36); g.font = "11px system-ui,sans-serif";
      }
    });
    if (bad) return;
    // entry, stop, targets
    var xe = v.xm(A.ent * 2), xr = Math.min(v.W - v.padR, v.xm((A.span[1] + 1) * 2) + 40), L = [[A.entry, "ENTRY " + f2(A.entry), css.ink, "solid"], [A.stop, "STOP " + f2(A.stop), css.loss, "dash"], [A.T[0], "0.7R " + f2(A.T[0]), css.gain, "dash"], [A.T[1], "1.5R " + f2(A.T[1]), css.gain, "dash"], [A.T[2], "5R " + f2(A.T[2]), css.gain, "dash"]];
    var tags = [];
    L.forEach(function (l) {
      var y = Y(l[0]); if (y < top - 2 || y > bot + 2) return; g.strokeStyle = l[2]; g.lineWidth = 1.4; g.setLineDash(l[3] === "dash" ? [6, 4] : []); g.beginPath(); g.moveTo(xe - 6, y); g.lineTo(v.W - v.padR, y); g.stroke(); g.setLineDash([]); g.lineWidth = 1;
      tags.push({ y: y, ty: y, t: l[1], c: l[2] });
    });
    tags.sort(function (a, b) { return a.y - b.y; });
    for (var q = 1; q < tags.length; q++) if (tags[q].ty - tags[q - 1].ty < 13) tags[q].ty = tags[q - 1].ty + 13;
    g.font = "bold 10px system-ui,sans-serif"; g.textAlign = "left";
    tags.forEach(function (t) { var w = v.padR - 4; g.fillStyle = css.panel; g.fillRect(v.W - v.padR + 2, t.ty - 7, w, 14); g.strokeStyle = t.c; g.strokeRect(v.W - v.padR + 2.5, t.ty - 6.5, w - 1, 13); g.fillStyle = t.c; g.fillText(t.t, v.W - v.padR + 5, t.ty + .5); });
    g.font = "11px system-ui,sans-serif";
  }

  function drawScrub() {
    var cv = scrub, dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    var bars = P[3].bars, hi = -1e9, lo = 1e9; bars.forEach(function (b) { if (b.h > hi) hi = b.h; if (b.l < lo) lo = b.l; });
    var X = function (m) { return 6 + m / TOTAL * (W - 12); }, Y = function (x) { return 14 + (1 - (x - lo) / (hi - lo)) * (H - 24); };
    g.font = "10px system-ui,sans-serif"; g.textBaseline = "middle";
    for (var d = 0; d < PD.NDAY; d++) { var x0 = X(d * MIN); g.strokeStyle = css.line; g.beginPath(); g.moveTo(x0 + .5, 2); g.lineTo(x0 + .5, H - 2); g.stroke(); g.fillStyle = css.mute; g.textAlign = "left"; g.fillText("Day " + (d + 1), x0 + 4, 8); }
    g.strokeStyle = css.ink; g.lineWidth = 1.2; g.beginPath(); bars.forEach(function (b, j) { var x = X(j * 15 + 7), y = Y(b.c); if (j % 26 === 0) g.moveTo(x, y); else g.lineTo(x, y); }); g.stroke(); g.lineWidth = 1;
    data().S.forEach(function (s) { var x = X(s.trig * 2), y = Y(P[3].bars[Math.floor(s.trig * 2 / 15)].c); g.beginPath(); g.arc(x, y, ST.active === s ? 6 : 3.4, 0, 6.3); if (s.kind === "decoy") { g.strokeStyle = css.mute; g.stroke(); } else { g.fillStyle = s.s > 0 ? css.gain : css.loss; g.fill(); } if (ST.active === s) { g.strokeStyle = css.ink; g.lineWidth = 2; g.stroke(); g.lineWidth = 1; } });
    var nb = nbFor(), a = X(ST.tc - nb), b = X(ST.tc + nb); g.strokeStyle = css.accent; g.lineWidth = 2; g.fillStyle = css.accent; g.globalAlpha = .1; g.fillRect(a, 2, b - a, H - 4); g.globalAlpha = 1; g.strokeRect(a, 2, b - a, H - 4); g.lineWidth = 1;
  }

  function frame() { raf = 0; if (!ST.dirty || !root || root.hidden) return; ST.dirty = false; if (!css) colors(); P.forEach(drawPanel); drawScrub(); }

  /* ---------- UI ---------- */
  function setTc(m) { ST.tc = Math.max(0, Math.min(TOTAL - 1, m)); dirty(); }
  function jumpDay(d) { ST.active = null; renderInfo(); setTc(d * MIN + nbFor()); syncUI(); }
  function activate(s, jump) { ST.active = s; ST.msg = ""; if (jump) setTc(s.trig * 2 + 8); renderInfo(); syncUI(); dirty(); }
  function outcomeText(s) {
    var h = s.hit, best = h[2] ? "5R" : h[1] ? "1.5R" : h[0] ? "0.7R" : "";
    if (!best) return "Price never reached 0.7R. It " + (s.stopped ? "came back and hit the stop (a 1R loss)." : "stalled and the day ended.");
    return "Price reached " + best + " after the entry" + (s.stopped ? ", then later in the day came back to the stop." : ".");
  }
  function renderInfo() {
    var el = root.querySelector(".pc-info"), A = ST.active, d = data();
    if (!A) { el.innerHTML = '<h2>Find the strategy</h2><p class="pc-hint">' + (ST.msg ? esc(ST.msg) + ' ' : '') + 'Scroll back through the 5 days, find where a setup formed, then press <b>Highlight</b> (or hold Shift) and drag across that area on any chart. The strategy appears on all four charts: numbered steps, an arrow on the trigger candle, and your entry, stop and 0.7R / 1.5R / 5R lines. Or tap a setup in the list below.</p>'; return; }
    var day = Math.floor(A.trig / PER) + 1, rules = "";
    A.steps.forEach(function (st) { rules += '<li class="' + (st.trig ? "t " : "") + (st.bad ? "bad" : "") + '"><span>' + esc(st.t) + '</span></li>'; });
    var h = '<h2>' + (A.kind === "decoy" ? "Not a setup: looks like " + esc(A.name) : esc(A.label || A.name)) + '<span class="pc-pill ' + (A.kind === "decoy" ? "x" : A.s > 0 ? "l" : "s") + '">' + (A.kind === "decoy" ? "NO TRADE" : A.s > 0 ? "LONG" : "SHORT") + '</span></h2><div class="pc-hint">' + esc(d.sym) + ' &middot; Day ' + day + ' &middot; trigger candle at ' + clock((A.trig % PER) * 2) + ' on the 2-minute chart</div>' + (A.sub ? '<div class="pc-hint">' + esc(A.sub) + '</div>' : '') + '<ul class="pc-steps">' + rules + '</ul>';
    if (A.kind === "decoy") h += '<p style="margin:6px 0"><b>Why it fails:</b> ' + esc(A.why) + '</p>';
    else h += '<div class="pc-lv"><div><small>Entry</small><b>' + f2(A.entry) + '</b></div><div><small>Stop (1R = ' + f2(A.R) + ')</small><b>' + f2(A.stop) + '</b></div><div><small>0.7R</small><b>' + f2(A.T[0]) + '</b></div><div><small>1.5R</small><b>' + f2(A.T[1]) + '</b></div><div><small>5R</small><b>' + f2(A.T[2]) + '</b></div></div><p style="margin:6px 0"><b>What happened:</b> ' + outcomeText(A) + '</p>';
    var i = d.S.indexOf(A);
    h += '<div class="pc-nav"><button class="pc-b" data-pc="prev"' + (i <= 0 ? " disabled" : "") + '>◀ Previous setup</button><button class="pc-b" data-pc="next"' + (i >= d.S.length - 1 ? " disabled" : "") + '>Next setup ▶</button><button class="pc-b" data-pc="clear">Hide the setup</button></div>';
    el.innerHTML = h;
  }
  function renderList() {
    var d = data(), h = "", cur = -1; d.S.forEach(function (s, k) {
      var dn = Math.floor(s.trig / PER); if (dn !== cur) { cur = dn; h += '<div class="pc-day">Day ' + (dn + 1) + '</div>'; }
      h += '<button class="pc-ch ' + (s.kind === "decoy" ? "x" : s.s > 0 ? "l" : "s") + (ST.active === s ? " on" : "") + '" data-pcs="' + k + '">' + clock((s.trig % PER) * 2) + ' ' + (s.kind === "decoy" ? "✕ " : (s.s > 0 ? "▲ " : "▼ ")) + esc(s.label || s.name) + '</button>';
    });
    root.querySelector(".pc-list").innerHTML = h;
    root.querySelector(".pc-lab2").textContent = "Every setup in this stock" + (d.S.some(function (x) { return x.kind === "decoy"; }) ? " (\u2715 = looks like one but is not)" : "");
  }
  function syncUI() {
    root.querySelectorAll("[data-pcstock]").forEach(function (b) { b.classList.toggle("on", +b.getAttribute("data-pcstock") === ST.stock); });
    root.querySelectorAll("[data-pcmode]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-pcmode") === ST.mode); });
    P.forEach(function (p) { p.cv.className = "pc-cv " + (ST.mode === "scroll" ? "sc" : "hl"); });
    renderList();
  }
  function html() {
    var h = '<div class="pc"><div class="pc-strip"><button class="pc-b pc-rf" data-pc="clear" title="Hide the setup and clear the highlight (Esc)">↻ Refresh</button><button class="pc-b" data-pc="back" title="Back 1 hour">◀</button><button class="pc-b" data-pc="fwd" title="Forward 1 hour">▶</button><button class="pc-b" data-pc="zout" title="Zoom out (Ctrl and minus)">Zoom −</button><button class="pc-b" data-pc="zin" title="Zoom in (Ctrl and plus)">Zoom +</button><button class="pc-b" data-pc="zreset" title="Reset zoom (Ctrl and 0)">Reset zoom</button><span class="pc-hint pc-zh">Ctrl + scroll wheel, or Ctrl + / Ctrl −, zooms the charts</span></div><h1>Practice charts</h1><p class="pc-p">Made-up gap-up stocks (every day opens 2.5% above the day before) so you can practice spotting your setups. The 1, 2, 5 and 15 minute charts move together. Drag to scroll back through 5 days, then highlight an area to see the strategy that formed there. Practice data only, not real prices.</p>';
    h += '<div class="pc-bar"><div class="pc-grp"><span class="pc-lab">Stock</span>' + PD.STOCKS.map(function (s, i) { return '<button class="pc-b" data-pcstock="' + i + '" title="' + esc(s.name) + '">' + s.sym + '</button>'; }).join("") + '</div>';
    h += '<div class="pc-grp"><span class="pc-lab">Jump to</span>' + [1, 2, 3, 4, 5].map(function (d) { return '<button class="pc-b" data-pcday="' + (d - 1) + '">Day ' + d + '</button>'; }).join("") + '</div>';
    h += '<div class="pc-grp"><span class="pc-lab">Drag does</span><button class="pc-b" data-pcmode="scroll">Scroll</button><button class="pc-b" data-pcmode="select">Highlight</button></div>';
    h += '<div class="pc-grp"><label class="pc-ck"><input type="checkbox" data-pck="ema" checked> 9 EMA</label><label class="pc-ck"><input type="checkbox" data-pck="vwap" checked> VWAP</label><label class="pc-ck"><input type="checkbox" data-pck="ma" checked> 200 MA</label><label class="pc-ck"><input type="checkbox" data-pck="mark"> Mark every setup</label><label class="pc-ck"><input type="checkbox" data-pck="wheel"' + (ST.wheel ? " checked" : "") + '> Mouse wheel scrolls time</label></div></div>';
    h += '<canvas class="pc-scrub" id="pc-scrub"></canvas><div class="pc-grid">' + TFS.map(function (t) { return '<div class="pc-pan"><div class="pc-ph"><b>' + t + ' min</b><span class="pc-ro"></span></div><canvas class="pc-cv sc" data-tf="' + t + '"></canvas></div>'; }).join("") + '</div>';
    h += '<div class="pc-info"></div><div class="pc-lab pc-lab2" style="margin-top:6px">Every setup in this stock</div><div class="pc-list"></div><p class="pc-hint">Educational practice only. These are scripted charts built to show your rules, not predictions or advice. Dots in the bar above the charts are the setups: green long, red short, hollow = not a setup.</p></div>';
    return h;
  }

  function pointer(p) {
    var cv = p.cv, drag = null;
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener("pointerdown", function (e) {
      if (e.button) return; var q = pos(e), v = view(p), sel = ST.mode === "select" || e.shiftKey;
      cv.setPointerCapture(e.pointerId); drag = sel ? { sel: 1, a: v.mAt(q.x) } : { x0: q.x, tc0: ST.tc };
      if (sel) { ST.sel = { a: drag.a, b: drag.a }; dirty(); } e.preventDefault();
    });
    cv.addEventListener("pointermove", function (e) {
      var q = pos(e), v = view(p); ST.hover = { m: Math.max(0, Math.min(TOTAL - 1, v.mAt(q.x))), y: q.y, p: p };
      if (drag) { if (drag.sel) ST.sel.b = v.mAt(q.x); else setTc(drag.tc0 - (q.x - drag.x0) / v.pxb * p.tf); }
      dirty();
    });
    function end(e) {
      if (!drag) return; var d0 = drag; drag = null;
      if (d0.sel && ST.sel) { var a = Math.min(ST.sel.a, ST.sel.b), b = Math.max(ST.sel.a, ST.sel.b); ST.sel = null; if (b - a < p.tf * 1.5) { a -= p.tf * 2; b += p.tf * 2; } reveal(a, b); }
      dirty();
    }
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", function () { drag = null; ST.sel = null; dirty(); });
    cv.addEventListener("pointerleave", function () { if (!drag) { ST.hover = null; dirty(); } });
    cv.addEventListener("wheel", function (e) {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomBy(Math.exp(-e.deltaY * 0.0022), p, pos(e).x); return; }
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || ST.wheel) { e.preventDefault(); var v = view(p), dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; setTc(ST.tc + dx / v.pxb * p.tf * 0.6); }
    }, { passive: false });
  }
  function reveal(a, b) {
    var best = null, bo = 0; data().S.forEach(function (s) { var s0 = s.span[0] * 2, s1 = (s.span[1] + 1) * 2, o = Math.min(b, s1) - Math.max(a, s0); if (o > bo) { bo = o; best = s; } });
    if (best) { ST.active = best; ST.msg = ""; setTc(best.trig * 2 + 8); } else { ST.active = null; ST.msg = "Nothing was planted in that area."; }
    renderInfo(); syncUI(); dirty();
  }

  function mount(el) {
    if (!ST.mounted) {
      addCss(); root = el; root.innerHTML = html(); ST.mounted = true; dataFor = ST.stock;
      scrub = root.querySelector("#pc-scrub");
      P = TFS.map(function (t) { var cv = root.querySelector('canvas[data-tf="' + t + '"]'); return { tf: t, cv: cv, ro: cv.parentNode.querySelector(".pc-ro"), bars: [] }; });
      P.forEach(pointer); loadPanels();
      var sd = false; function sc(e) { var r = scrub.getBoundingClientRect(); setTc((e.clientX - r.left - 6) / (r.width - 12) * TOTAL); }
      scrub.addEventListener("pointerdown", function (e) { sd = true; scrub.setPointerCapture(e.pointerId); sc(e); });
      scrub.addEventListener("pointermove", function (e) { if (sd) sc(e); }); scrub.addEventListener("pointerup", function () { sd = false; });
      root.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return; var k;
        if ((k = b.getAttribute("data-pcstock")) !== null) { ST.stock = +k; ST.active = null; ST.msg = ""; loadPanels(); setTc(nbFor()); renderInfo(); syncUI(); return; }
        if ((k = b.getAttribute("data-pcday")) !== null) { jumpDay(+k); return; }
        if ((k = b.getAttribute("data-pcmode")) !== null) { ST.mode = k; syncUI(); return; }
        if ((k = b.getAttribute("data-pcs")) !== null) { activate(data().S[+k], true); return; }
        if ((k = b.getAttribute("data-pc")) !== null) {
          var d = data(), i = d.S.indexOf(ST.active);
          if (k === "back") setTc(ST.tc - 60); else if (k === "fwd") setTc(ST.tc + 60);
          else if (k === "zin") zoomBy(1.3); else if (k === "zout") zoomBy(1 / 1.3); else if (k === "zreset") { ST.z = 1; dirty(); }
          else if (k === "prev" && i > 0) activate(d.S[i - 1], true); else if (k === "next" && i < d.S.length - 1) activate(d.S[i + 1], true);
          else if (k === "clear") refresh();
        }
      });
      root.addEventListener("change", function (e) { var k = e.target.getAttribute("data-pck"); if (k) { ST[k] = e.target.checked; dirty(); } });
      window.addEventListener("resize", function () { dirty(); });
      document.addEventListener("keydown", function (e) {
        if (root.hidden || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) return;
        if (e.ctrlKey || e.metaKey) { var k = e.key; if (k === "+" || k === "=") { e.preventDefault(); zoomBy(1.3); return; } if (k === "-" || k === "_") { e.preventDefault(); zoomBy(1 / 1.3); return; } if (k === "0") { e.preventDefault(); ST.z = 1; dirty(); return; } }
        if (e.key === "Escape") { refresh(); return; }
        if (e.key === "ArrowLeft") { setTc(ST.tc - 20); e.preventDefault(); } else if (e.key === "ArrowRight") { setTc(ST.tc + 20); e.preventDefault(); } });
      new MutationObserver(function () { if (!root.hidden) { css = null; dirty(); } }).observe(root, { attributes: true, attributeFilter: ["hidden"] });
      try { new MutationObserver(function () { css = null; dirty(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] }); matchMedia("(prefers-color-scheme:dark)").addEventListener("change", function () { css = null; dirty(); }); } catch (e) { }
      setTc(nbFor()); renderInfo(); syncUI();
    }
    css = null; dirty();
  }
  window.PracticeChart = { mount: mount, _st: ST, _panels: function () { return P; } };
})();
