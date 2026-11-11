/* Screen recorder shared by Studio and Trading Day. Any button with data-rec toggles it; every such button shows the state.
   Record as many screens or windows as you like: each one is its own recorder and its own video file (so recording keeps
   working while you trade in another window). */
(function () {
  "use strict";
  var S = [], tick = null, t0 = 0, msg = "", saved = [];
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
      if (!nx || !nx.hasAttribute("data-recadd")) { nx = document.createElement("button"); nx.type = "button"; nx.setAttribute("data-recadd", "1"); nx.className = b.className.replace(/\brec\b/, "").trim(); nx.style.cssText = b.style.cssText; nx.title = "Record another screen or window at the same time"; nx.innerHTML = "&#43; Add another screen"; b.parentNode.insertBefore(nx, b.nextSibling); }
      nx.hidden = false; nx.innerHTML = on ? "&#43; Add another screen" : "&#43; Record 2 screens"; nx.title = "Record another screen or window at the same time. Each one saves as its own video.";
    });
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
  function begin(stream, first) {
    var n = S.length + 1;
    var mt = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].filter(function (t) { return window.MediaRecorder && MediaRecorder.isTypeSupported(t); })[0] || "";
    var item = { n: n, stream: stream, chunks: [], mr: new MediaRecorder(stream, mt ? { mimeType: mt } : undefined) };
    if (first) { S = []; saved = []; item.n = 1; t0 = Date.now(); }
    S.push(item);
    item.mr.ondataavailable = function (e) { if (e.data && e.data.size) item.chunks.push(e.data); };
    item.mr.onstop = function () {
      item.stream.getTracks().forEach(function (t) { t.stop(); });
      if (item.chunks.length) {
        var blob = new Blob(item.chunks, { type: item.mr.mimeType || "video/webm" }), a = document.createElement("a"), nm = "trades-" + iso() + "-" + hm() + "-screen" + item.n + ".webm";
        a.href = URL.createObjectURL(blob); a.download = nm; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
        saved.push(nm + " (" + (blob.size / 1048576).toFixed(1) + " MB)"); item.chunks = [];
      }
      if (!live()) { if (saved.length) { say("Saved " + saved.length + (saved.length === 1 ? " video" : " videos") + " to your Downloads."); showSaved(saved.slice()); } else say("Nothing was recorded."); } else paint();
    };
    item.stream.getVideoTracks()[0].addEventListener("ended", function () { try { if (item.mr.state !== "inactive") item.mr.stop(); } catch (e) {} });
    item.mr.start(1000); paint(); startTick();
  }
  async function add() { var st = await pick(!live()); if (st) begin(st, !live()); }

  /* Ctrl/Cmd + click: choose several screens first, then start them all together. The browser only lets a page pick one screen per prompt, so a small panel keeps the picker one click away. */
  var panel = null, chosen = [], target = 0;
  function closePanel(stopStreams) { if (stopStreams) chosen.forEach(function (s) { s.getTracks().forEach(function (t) { t.stop(); }); }); chosen = []; target = 0; if (panel) { panel.remove(); panel = null; } }
  function startAll() { var list = chosen.slice(); chosen = []; target = 0; if (panel) { panel.remove(); panel = null; } list.forEach(function (s, i) { begin(s, i === 0); }); }
  function drawPanel() {
    if (!panel) { panel = document.createElement("div"); panel.id = "recpanel"; panel.style.cssText = "position:fixed;left:50%;top:24px;transform:translateX(-50%);z-index:200;background:#11151c;color:#fff;border:1px solid #2b303b;border-radius:14px;padding:14px 16px;box-shadow:0 12px 40px rgba(0,0,0,.5);font:600 14px Instrument Sans,system-ui,sans-serif;display:flex;gap:10px;align-items:center;flex-wrap:wrap;max-width:94vw"; document.body.appendChild(panel); }
    var bs = "padding:7px 14px;border-radius:9px;border:1px solid #3a4150;background:#1c212b;color:#fff;font:inherit;cursor:pointer";
    panel.innerHTML = '<span>' + chosen.length + (target ? " of " + target : "") + (chosen.length === 1 && !target ? " screen chosen" : " screens chosen") + '</span><button type="button" data-rp="add" style="' + bs + '">+ Pick ' + (target ? "screen " + (chosen.length + 1) + " of " + target : "another screen") + '</button>' + (target ? "" : '<button type="button" data-rp="go" style="' + bs + ';background:#d64545;border-color:#d64545">&#9679; Start recording ' + chosen.length + '</button>') + '<button type="button" data-rp="x" style="' + bs + '">Cancel</button>';
  }
  /* Choose several screens in one go. Hold Ctrl (Cmd) while clicking Record, or use "Record 2 screens".
     The page asks for the next screen straight after you choose one. If the browser refuses a second prompt without a new click,
     a small panel takes over (one click per extra screen). Every screen starts recording at the same instant once the last one is chosen. */
  async function multi(n) {
    var st = await pick(true); if (!st) return; chosen = [st]; target = n || 0;
    for (;;) {
      if (target && chosen.length >= target) { startAll(); return; }
      var nx = await pick(false);
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
    if (a === "add") { var st = await pick(false); if (st) { chosen.push(st); if (target && chosen.length >= target) startAll(); else drawPanel(); } return; }
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
  function stopAll() { S.forEach(function (x) { try { if (x.mr.state !== "inactive") x.mr.stop(); } catch (e) {} }); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-rec],[data-recadd]"); if (!b) return;
    if (b.hasAttribute("data-recadd")) { if (live()) add(); else multi(2); return; }
    if (live()) { stopAll(); return; }
    if (e.ctrlKey || e.metaKey) multi(0); else add();
  });
  window.StockRec = { sync: paint, live: live };
  if (document.readyState !== "loading") paint(); else document.addEventListener("DOMContentLoaded", paint);
})();
