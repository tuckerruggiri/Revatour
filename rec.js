/* Screen recorder shared by Studio and Trading Day. Any button with data-rec toggles it; every such button shows the state.
   Record as many screens or windows as you like: each one is its own recorder and its own video file (so recording keeps
   working while you trade in another window). */
(function () {
  "use strict";
  var S = [], tick = null, t0 = 0, msg = "", saved = [], stamp = "";
  function iso() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function hm() { return new Date().toTimeString().slice(0, 5).replace(":", ""); }
  function toast(m) { var t = document.getElementById("toast"); if (!t) return; t.textContent = m; t.className = "on"; setTimeout(function () { t.className = ""; }, 2400); }
  function live() { return S.some(function (x) { return x.mr && x.mr.state !== "inactive"; }); }
  function nlive() { return S.filter(function (x) { return x.mr && x.mr.state !== "inactive"; }).length; }
  function paint() {
    var on = live();
    [].forEach.call(document.querySelectorAll("[data-rec]"), function (b) {
      b.classList.toggle("rec", on);
      b.innerHTML = on ? "&#9632; Stop all (" + nlive() + ")" : "&#9679; Record screen"; b.title = on ? "Stop every screen" : "Click to record one screen. Hold Ctrl (Cmd on Mac) while clicking to choose several screens first";
      var nx = b.nextElementSibling;
      while (nx && (nx.hasAttribute("data-recadd") || nx.hasAttribute("data-recarea"))) { var d = nx; nx = nx.nextElementSibling; d.remove(); }
      nx = b.nextElementSibling;
      if (!nx || !nx.hasAttribute("data-recmenu")) { nx = document.createElement("button"); nx.type = "button"; nx.setAttribute("data-recmenu", "1"); nx.className = b.className.replace(/\brec\b/, "").trim(); nx.style.cssText = b.style.cssText; nx.setAttribute("aria-haspopup", "menu"); b.parentNode.insertBefore(nx, b.nextSibling); }
      nx.classList.remove("rec"); nx.innerHTML = "&#9662;"; nx.title = "More ways to record: several screens, an area, several areas"; nx.setAttribute("aria-label", "More recording options");
    });
    var fr = document.getElementById("recframe");
    if (on && !fr) { fr = document.createElement("div"); fr.id = "recframe"; fr.style.cssText = "position:fixed;inset:0;z-index:240;pointer-events:none;border:4px solid #e5282b;box-sizing:border-box;box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)"; fr.innerHTML = '<span style="position:absolute;top:8px;right:12px;background:#e5282b;color:#fff;font:700 12px/1 sans-serif;padding:5px 9px;border-radius:999px">&#9679; REC</span>'; document.body.appendChild(fr); }
    if (!on && fr) fr.remove();
    var tt = document.title.replace(/^\u{1F534} /u, ""); document.title = on ? "\u{1F534} " + tt : tt;
    [].forEach.call(document.querySelectorAll("[data-rectxt]"), function (t) { t.textContent = msg; });
  }
  function say(m) { msg = m; paint(); }
  function elapsed() { var s = Math.floor((Date.now() - t0) / 1000); return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }
  function startTick() { if (tick) return; tick = setInterval(function () { if (!live()) { clearInterval(tick); tick = null; return; } say("Recording " + nlive() + (nlive() === 1 ? " screen " : " screens ") + elapsed()); }, 500); }
  var blocked = false;
  async function pick(audio) {
    blocked = false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) { toast("Screen recording is not supported in this browser"); return null; }
    try { return await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: !!audio }); }
    catch (e) { blocked = /activation|gesture/i.test(String(e && e.message)); if (!blocked) toast("Recording cancelled"); return null; }
  }
  function begin(stream, first, orig, kind) {
    var n = S.length + 1;
    var mt = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].filter(function (t) { return window.MediaRecorder && MediaRecorder.isTypeSupported(t); })[0] || "";
    var item = { n: n, kind: kind || "screen", stream: stream, orig: orig || null, chunks: [], mr: new MediaRecorder(stream, mt ? { mimeType: mt } : undefined) };
    if (first) { S = []; saved = []; item.n = 1; t0 = Date.now(); stamp = iso() + "-" + hm(); }
    if (!stamp) stamp = iso() + "-" + hm();
    S.push(item);
    item.mr.ondataavailable = function (e) { if (e.data && e.data.size) item.chunks.push(e.data); };
    item.mr.onstop = function () {
      item.stream.getTracks().forEach(function (t) { t.stop(); }); if (item.orig) item.orig.getTracks().forEach(function (t) { t.stop(); });
      if (item.chunks.length) {
        var blob = new Blob(item.chunks, { type: item.mr.mimeType || "video/webm" }), a = document.createElement("a"), nm = "trades-" + stamp + "-" + item.kind + item.n + ".webm";
        a.href = URL.createObjectURL(blob); a.download = nm; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
        saved.push(nm + " (" + (blob.size / 1048576).toFixed(1) + " MB)"); item.chunks = [];
      }
      if (!live()) { if (saved.length) { say("Saved " + saved.length + (saved.length === 1 ? " video" : " videos") + " to your Downloads."); showSaved(saved.slice()); } else say("Nothing was recorded."); } else paint();
    };
    (orig || stream).getVideoTracks()[0].addEventListener("ended", function () { try { if (item.mr.state !== "inactive") item.mr.stop(); } catch (e) {} });
    item.mr.start(1000); paint(); startTick();
  }
  async function getOne(audio) {
    if (mode === "area") return prepArea(audio);
    var st = await pick(audio); return st ? { s: st, orig: null, kind: "screen" } : null;
  }
  async function add() { var first = !live(), it = await getOne(first); if (it) begin(it.s, first, it.orig, it.kind); }

  /* Ctrl/Cmd + click: choose several screens first, then start them all together. The browser only lets a page pick one screen per prompt, so a small panel keeps the picker one click away. */
  var panel = null, chosen = [], target = 0;
  var mode = "screen";
  function stopItem(it) { it.s.getTracks().forEach(function (t) { t.stop(); }); if (it.orig) it.orig.getTracks().forEach(function (t) { t.stop(); }); }
  function closePanel(stopStreams) { if (stopStreams) chosen.forEach(stopItem); chosen = []; target = 0; if (panel) { panel.remove(); panel = null; } }
  function startAll() { var list = chosen.slice(); chosen = []; target = 0; if (panel) { panel.remove(); panel = null; } list.forEach(function (it, i) { begin(it.s, i === 0, it.orig, it.kind); }); }
  function drawPanel() {
    if (!panel) { panel = document.createElement("div"); panel.id = "recpanel"; panel.style.cssText = "position:fixed;left:50%;top:24px;transform:translateX(-50%);z-index:200;background:#11151c;color:#fff;border:1px solid #2b303b;border-radius:14px;padding:14px 16px;box-shadow:0 12px 40px rgba(0,0,0,.5);font:600 14px Instrument Sans,system-ui,sans-serif;display:flex;gap:10px;align-items:center;flex-wrap:wrap;max-width:94vw"; document.body.appendChild(panel); }
    var bs = "padding:7px 14px;border-radius:9px;border:1px solid #3a4150;background:#1c212b;color:#fff;font:inherit;cursor:pointer";
    panel.innerHTML = '<span>' + chosen.length + (target ? " of " + target : "") + (chosen.length === 1 && !target ? (mode === "area" ? " area chosen" : " screen chosen") : (mode === "area" ? " areas chosen" : " screens chosen")) + '</span><button type="button" data-rp="add" style="' + bs + '">+ Pick ' + (target ? "screen " + (chosen.length + 1) + " of " + target : "another screen") + '</button>' + (target ? "" : '<button type="button" data-rp="go" style="' + bs + ';background:#d64545;border-color:#d64545">&#9679; Start recording ' + chosen.length + '</button>') + '<button type="button" data-rp="x" style="' + bs + '">Cancel</button>';
  }
  /* Choose several screens in one go. Hold Ctrl (Cmd) while clicking Record, or use "Record 2 screens".
     The page asks for the next screen straight after you choose one. If the browser refuses a second prompt without a new click,
     a small panel takes over (one click per extra screen). Every screen starts recording at the same instant once the last one is chosen. */
  async function multi(n, m) {
    mode = m || "screen";
    var st = await getOne(true); if (!st) return; chosen = [st]; target = n || 0;
    for (;;) {
      if (target && chosen.length >= target) { startAll(); return; }
      var nx = await getOne(false);
      if (nx) { chosen.push(nx); continue; }
      if (blocked) { drawPanel(); return; }
      if (target) { closePanel(true); return; }
      startAll(); return; /* open-ended: you cancelled the picker, so start what you have */
    }
  }
  document.addEventListener("click", async function (e) {
    var b = e.target.closest && e.target.closest("[data-rp]"); if (!b) return;
    var a = b.getAttribute("data-rp");
    if (a === "x") { closePanel(true); return; }
    if (a === "add") { var st = await getOne(false); if (st) { chosen.push(st); if (target && chosen.length >= target) startAll(); else drawPanel(); } return; }
    if (a === "go") startAll();
  });
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function showSaved(list) {
    var old = document.getElementById("recdone"); if (old) old.remove();
    var d = document.createElement("div"); d.id = "recdone"; d.setAttribute("role", "status");
    d.style.cssText = "position:fixed;left:50%;top:22px;transform:translateX(-50%);z-index:210;width:min(560px,94vw);box-sizing:border-box;background:var(--panel,#fff);color:var(--ink,#111);border:2px solid var(--gain,#1a9d5a);border-radius:16px;padding:18px 20px;box-shadow:0 18px 60px rgba(0,0,0,.45);font:500 15px/1.45 'Instrument Sans',system-ui,sans-serif";
    var bs = "padding:9px 16px;border-radius:10px;border:1px solid var(--line,#ccc);background:var(--panel,#fff);color:var(--ink,#111);font:600 14px 'Instrument Sans',system-ui,sans-serif;cursor:pointer";
    d.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="display:inline-flex;width:30px;height:30px;border-radius:50%;background:var(--gain,#1a9d5a);color:#fff;align-items:center;justify-content:center;font-size:18px;font-weight:800">&#10003;</span><b style="font-size:1.1rem">Recording saved to your Downloads</b></div>' +
      '<ul style="margin:0 0 10px;padding-left:22px">' + list.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
      '<div style="color:var(--mute,#666);margin-bottom:14px">Next: open <b>Studio</b>, find <b>Videos</b>, and press <b>Choose from Downloads</b> (or drag the files onto the Videos box).</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" data-rd="go" style="' + bs + ';background:var(--ink,#111);border-color:var(--ink,#111);color:var(--bg,#fff)">Go to Studio Videos</button><button type="button" data-rd="x" style="' + bs + '">Close</button></div>';
    document.body.appendChild(d);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-rd]"); if (!b) return;
    var d = document.getElementById("recdone"); if (d) d.remove();
    if (b.getAttribute("data-rd") === "go") {
      var nav = document.getElementById("navstudio"); if (nav) nav.click();
      setTimeout(function () { var v = document.getElementById("videos"); if (v) { v.scrollIntoView({ block: "center", behavior: "smooth" }); v.focus({ preventScroll: true }); v.style.outline = "3px solid var(--accent,#2a6df4)"; setTimeout(function () { v.style.outline = ""; }, 2500); } }, 350);
    }
  });

  /* Record just a highlighted part of a screen or window (Chrome and Edge). Pick the screen, drag a box over a snapshot of it, and only that box is recorded. */
  function areaOk() { return !!(window.MediaStreamTrackProcessor && window.MediaStreamTrackGenerator && window.VideoFrame); }
  function selectRect(cv, w, h) {
    return new Promise(function (res) {
      var ov = document.createElement("div"); ov.id = "recarea"; ov.style.cssText = "position:fixed;inset:0;z-index:230;background:rgba(5,7,10,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;font:600 14px 'Instrument Sans',system-ui,sans-serif;color:#fff";
      var scale = Math.min((window.innerWidth - 40) / w, (window.innerHeight - 150) / h, 1), dw = Math.round(w * scale), dh = Math.round(h * scale);
      ov.innerHTML = '<div id="raHint">Drag a box over the part you want to record</div><div id="raBox" style="position:relative;width:' + dw + 'px;height:' + dh + 'px;cursor:crosshair;user-select:none;touch-action:none"></div><div style="display:flex;gap:10px"><button type="button" id="raGo" disabled style="padding:9px 18px;border-radius:10px;border:0;background:#d64545;color:#fff;font:inherit;cursor:pointer;opacity:.5">&#9679; Record this area</button><button type="button" id="raFull" style="padding:9px 18px;border-radius:10px;border:1px solid #3a4150;background:#1c212b;color:#fff;font:inherit;cursor:pointer">Whole screen instead</button><button type="button" id="raX" style="padding:9px 18px;border-radius:10px;border:1px solid #3a4150;background:#1c212b;color:#fff;font:inherit;cursor:pointer">Cancel</button></div>';
      document.body.appendChild(ov);
      var host = ov.querySelector("#raBox"), go = ov.querySelector("#raGo"), sel = null, st = null;
      cv.style.cssText = "width:" + dw + "px;height:" + dh + "px;display:block;border-radius:8px;pointer-events:none"; host.appendChild(cv);
      var bx = document.createElement("div"); bx.style.cssText = "position:absolute;border:2px dashed #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.62);display:none;pointer-events:none;box-sizing:border-box"; host.appendChild(bx);
      function pt(e) { var r = host.getBoundingClientRect(); return { x: Math.max(0, Math.min(dw, e.clientX - r.left)), y: Math.max(0, Math.min(dh, e.clientY - r.top)) }; }
      function draw(a, b) { var x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), ww = Math.abs(a.x - b.x), hh = Math.abs(a.y - b.y); bx.style.cssText += ";display:block;left:" + x + "px;top:" + y + "px;width:" + ww + "px;height:" + hh + "px"; return { x: x, y: y, w: ww, h: hh }; }
      host.addEventListener("pointerdown", function (e) { st = pt(e); host.setPointerCapture(e.pointerId); sel = null; go.disabled = true; go.style.opacity = ".5"; });
      host.addEventListener("pointermove", function (e) { if (st) sel = draw(st, pt(e)); });
      host.addEventListener("pointerup", function (e) { if (!st) return; var r = draw(st, pt(e)); st = null; if (r.w >= 40 && r.h >= 40) { sel = r; go.disabled = false; go.style.opacity = "1"; ov.querySelector("#raHint").textContent = "Press Record this area (or Enter). Drag again to change it."; } else { sel = null; bx.style.display = "none"; } });
      function done(v) { document.removeEventListener("keydown", kd); ov.remove(); res(v); }
      var kd = function (e) { if (e.key === "Escape") done(null); else if (e.key === "Enter" && sel) go.click(); };
      document.addEventListener("keydown", kd);
      go.onclick = function () { if (sel) done({ x: sel.x / scale, y: sel.y / scale, w: sel.w / scale, h: sel.h / scale }); };
      ov.querySelector("#raFull").onclick = function () { done({ x: 0, y: 0, w: w, h: h }); };
      ov.querySelector("#raX").onclick = function () { done(null); };
    });
  }
  function cropStream(st, rc, W, H) {
    var vt = st.getVideoTracks()[0], proc = new MediaStreamTrackProcessor({ track: vt }), gen = new MediaStreamTrackGenerator({ kind: "video" });
    var ev = function (n) { n = Math.round(n); return n - (n % 2); };
    var tf = new TransformStream({ transform: function (frame, ctl) {
      try {
        var cw = frame.codedWidth, ch = frame.codedHeight, sx = cw / W, sy = ch / H;
        var x = ev(rc.x * sx), y = ev(rc.y * sy), w = Math.max(16, ev(Math.min(rc.w * sx, cw - x))), h = Math.max(16, ev(Math.min(rc.h * sy, ch - y)));
        ctl.enqueue(new VideoFrame(frame, { visibleRect: { x: x, y: y, width: w, height: h }, displayWidth: w, displayHeight: h }));
      } catch (e) {}
      frame.close();
    } });
    proc.readable.pipeThrough(tf).pipeTo(gen.writable).catch(function () {});
    var out = new MediaStream([gen]); st.getAudioTracks().forEach(function (a) { out.addTrack(a); });
    return out;
  }
  async function prepArea(audio) {
    if (!areaOk()) { toast("Recording an area needs Chrome or Edge"); return null; }
    var st = await pick(audio); if (!st) return null;
    var vt = st.getVideoTracks()[0], v = document.createElement("video"); v.muted = true; v.playsInline = true; v.srcObject = new MediaStream([vt]);
    try { await v.play(); await new Promise(function (ok) { if (v.videoWidth) ok(); else v.onloadedmetadata = ok; }); await new Promise(function (ok) { setTimeout(ok, 250); }); } catch (e) {}
    var W = v.videoWidth, H = v.videoHeight; if (!W || !H) { st.getTracks().forEach(function (t) { t.stop(); }); toast("Could not read that screen"); return null; }
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H; cv.getContext("2d").drawImage(v, 0, 0, W, H); v.srcObject = null;
    var rc = await selectRect(cv, W, H);
    if (!rc) { st.getTracks().forEach(function (t) { t.stop(); }); return null; }
    return { s: cropStream(st, rc, W, H), orig: st, kind: "area" };
  }
  function addArea() { mode = "area"; return add(); }

  /* The little menu next to the Record button */
  var menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function openMenu(btn) {
    closeMenu(); var on = live(), r = btn.getBoundingClientRect();
    var items = on ? [["addscreen", "&#43; Add another screen"], ["addarea", "&#9635; Add another area"], ["stop", "&#9632; Stop all"]]
      : [["screen1", "&#9679; Record a screen"], ["screen2", "&#9679;&#9679; Record 2 screens"], ["area1", "&#9635; Record an area"], ["area2", "&#9635;&#9635; Record 2 areas"]];
    menu = document.createElement("div"); menu.id = "recmenu"; menu.setAttribute("role", "menu");
    menu.style.cssText = "position:fixed;z-index:220;top:" + (r.bottom + 6) + "px;left:" + Math.max(8, Math.min(r.left, window.innerWidth - 230)) + "px;min-width:210px;background:var(--panel,#fff);color:var(--ink,#111);border:1px solid var(--line,#ccc);border-radius:12px;padding:6px;box-shadow:0 12px 36px rgba(0,0,0,.35);font:600 14px 'Instrument Sans',system-ui,sans-serif";
    menu.innerHTML = items.map(function (i) { return '<button type="button" role="menuitem" data-rm="' + i[0] + '" style="display:block;width:100%;text-align:left;padding:10px 12px;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer">' + i[1] + "</button>"; }).join("") +
      '<div style="padding:6px 12px 4px;font:500 12px sans-serif;opacity:.65">Each screen or area saves as its own video.</div>';
    [].forEach.call(menu.querySelectorAll("button"), function (x) { x.onmouseenter = function () { x.style.background = "color-mix(in srgb,currentColor 10%,transparent)"; }; x.onmouseleave = function () { x.style.background = "transparent"; }; });
    document.body.appendChild(menu);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  function stopAll() { S.forEach(function (x) { try { if (x.mr.state !== "inactive") x.mr.stop(); } catch (e) {} }); }
  document.addEventListener("click", function (e) {
    var m = e.target.closest && e.target.closest("[data-rm]");
    if (m) { var k = m.getAttribute("data-rm"); closeMenu();
      if (k === "stop") stopAll(); else if (k === "addscreen") { mode = "screen"; add(); } else if (k === "addarea") addArea();
      else if (k === "screen1") { mode = "screen"; add(); } else if (k === "screen2") multi(2, "screen"); else if (k === "area1") addArea(); else if (k === "area2") multi(2, "area");
      return; }
    var c = e.target.closest && e.target.closest("[data-recmenu]");
    if (c) { if (menu) closeMenu(); else openMenu(c); return; }
    if (menu && !(e.target.closest && e.target.closest("#recmenu"))) closeMenu();
    var b = e.target.closest && e.target.closest("[data-rec]"); if (!b) return;
    if (live()) { stopAll(); return; }
    if (e.ctrlKey || e.metaKey) multi(0, "screen"); else { mode = "screen"; add(); }
  });
  window.StockRec = { sync: paint, live: live };
  if (document.readyState !== "loading") paint(); else document.addEventListener("DOMContentLoaded", paint);
})();
