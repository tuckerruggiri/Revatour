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
      b.innerHTML = on ? "&#9632; Stop all (" + nlive() + ")" : "&#9679; Record screen";
      var nx = b.nextElementSibling;
      if (!nx || !nx.hasAttribute("data-recadd")) { nx = document.createElement("button"); nx.type = "button"; nx.setAttribute("data-recadd", "1"); nx.className = b.className.replace(/\brec\b/, "").trim(); nx.style.cssText = b.style.cssText; nx.title = "Record another screen or window at the same time"; nx.innerHTML = "&#43; Add another screen"; b.parentNode.insertBefore(nx, b.nextSibling); }
      nx.hidden = false; nx.innerHTML = on ? "&#43; Add another screen" : "&#43; Record 2 screens"; nx.title = "Record another screen or window at the same time. Each one saves as its own video.";
    });
    [].forEach.call(document.querySelectorAll("[data-rectxt]"), function (t) { t.textContent = msg; });
  }
  function say(m) { msg = m; paint(); }
  function elapsed() { var s = Math.floor((Date.now() - t0) / 1000); return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }
  function startTick() { if (tick) return; tick = setInterval(function () { if (!live()) { clearInterval(tick); tick = null; return; } say("Recording " + nlive() + (nlive() === 1 ? " screen " : " screens ") + elapsed()); }, 500); }
  async function add() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) { toast("Screen recording is not supported in this browser"); return; }
    var first = !live(), n = S.length + 1, stream;
    try { stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: first }); } catch (e) { toast("Recording cancelled"); return; }
    var mt = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].filter(function (t) { return window.MediaRecorder && MediaRecorder.isTypeSupported(t); })[0] || "";
    var item = { n: n, stream: stream, chunks: [], mr: new MediaRecorder(stream, mt ? { mimeType: mt } : undefined) };
    if (first) { S = []; saved = []; n = 1; item.n = 1; t0 = Date.now(); }
    S.push(item);
    item.mr.ondataavailable = function (e) { if (e.data && e.data.size) item.chunks.push(e.data); };
    item.mr.onstop = function () {
      item.stream.getTracks().forEach(function (t) { t.stop(); });
      if (item.chunks.length) {
        var blob = new Blob(item.chunks, { type: item.mr.mimeType || "video/webm" }), a = document.createElement("a"), nm = "trades-" + iso() + "-" + hm() + "-screen" + item.n + ".webm";
        a.href = URL.createObjectURL(blob); a.download = nm; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
        saved.push(nm + " (" + (blob.size / 1048576).toFixed(1) + " MB)"); item.chunks = [];
      }
      if (!live()) say(saved.length ? "Saved to your Downloads: " + saved.join(", ") + ". In Studio, Videos, press Choose from Downloads." : "Nothing was recorded."); else paint();
    };
    item.stream.getVideoTracks()[0].addEventListener("ended", function () { try { if (item.mr.state !== "inactive") item.mr.stop(); } catch (e) {} });
    item.mr.start(1000); paint(); startTick();
  }
  function stopAll() { S.forEach(function (x) { try { if (x.mr.state !== "inactive") x.mr.stop(); } catch (e) {} }); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-rec],[data-recadd]"); if (!b) return;
    if (b.hasAttribute("data-recadd")) { add(); return; }
    if (live()) stopAll(); else add();
  });
  window.StockRec = { sync: paint, live: live };
  if (document.readyState !== "loading") paint(); else document.addEventListener("DOMContentLoaded", paint);
})();
