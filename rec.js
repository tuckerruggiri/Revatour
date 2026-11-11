/* Screen recorder shared by Studio and Trading Day. Any button with data-rec toggles it; every such button shows the state. */
(function () {
  "use strict";
  var mr = null, chunks = [], tick = null, t0 = 0, stream = null, msg = "", live = false;
  function iso() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function toast(m) { var t = document.getElementById("toast"); if (!t) return; t.textContent = m; t.className = "on"; setTimeout(function () { t.className = ""; }, 2200); }
  function paint() {
    [].forEach.call(document.querySelectorAll("[data-rec]"), function (b) {
      b.classList.toggle("rec", live);
      b.innerHTML = live ? "&#9632; Stop recording" : "&#9679; Record screen";
    });
    [].forEach.call(document.querySelectorAll("[data-rectxt]"), function (t) { t.textContent = msg; });
  }
  function say(m) { msg = m; paint(); }
  function stop() { try { if (mr && mr.state !== "inactive") mr.stop(); } catch (e) {} }
  async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) { toast("Screen recording is not supported in this browser"); return; }
    try { stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true }); } catch (e) { toast("Recording cancelled"); return; }
    var mt = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].filter(function (t) { return window.MediaRecorder && MediaRecorder.isTypeSupported(t); })[0] || "";
    chunks = []; mr = new MediaRecorder(stream, mt ? { mimeType: mt } : undefined);
    mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = function () {
      clearInterval(tick); stream.getTracks().forEach(function (t) { t.stop(); }); live = false;
      if (!chunks.length) { say("Nothing was recorded."); return; }
      var blob = new Blob(chunks, { type: mr.mimeType || "video/webm" }), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "trades-" + iso() + "-" + new Date().toTimeString().slice(0, 5).replace(":", "") + ".webm";
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
      say("Saved " + a.download + " to your Downloads (" + (blob.size / 1048576).toFixed(1) + " MB). In Studio, Videos, press Choose from Downloads.");
      chunks = [];
    };
    stream.getVideoTracks()[0].addEventListener("ended", stop);
    mr.start(1000); t0 = Date.now(); live = true; paint();
    tick = setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); say("Recording " + Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2)); }, 500);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-rec]"); if (!b) return;
    if (live) stop(); else start();
  });
  window.StockRec = { sync: paint, live: function () { return live; } };
})();
