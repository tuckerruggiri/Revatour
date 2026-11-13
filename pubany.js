/* Publish anywhere: a barely-visible dot (bottom-right). Click it, then click anything
   (or select text first) and it posts that text to your profile wall. */
(function () {
  "use strict";
  var S = function () { return window.stockspotSocial || null; };
  var css = document.createElement("style");
  css.textContent =
    "#pxdot{position:fixed;right:6px;bottom:6px;width:9px;height:9px;border-radius:50%;background:#7a8b99;opacity:.14;z-index:2147483000;cursor:pointer;border:0;padding:0;transition:opacity .15s,transform .15s}" +
    "#pxdot:hover,#pxdot:focus-visible,#pxdot.on{opacity:.9;transform:scale(1.5)}" +
    ".px-hl{outline:2px dashed #2f7de1!important;outline-offset:1px;cursor:copy!important}" +
    "#pxbox{position:fixed;right:10px;bottom:24px;width:min(320px,calc(100vw - 20px));background:#fff;color:#10202e;border:1px solid #cfd8e0;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.25);padding:10px;z-index:2147483001;font:13px/1.4 system-ui,sans-serif}" +
    "#pxbox textarea{width:100%;box-sizing:border-box;height:110px;font:inherit;border:1px solid #cfd8e0;border-radius:6px;padding:6px;resize:vertical}" +
    "#pxbox .r{display:flex;gap:6px;justify-content:flex-end;margin-top:6px}" +
    "#pxbox button{font:inherit;padding:5px 12px;border-radius:6px;border:1px solid #cfd8e0;background:#f3f6f9;cursor:pointer}" +
    "#pxbox button.go{background:#2f7de1;color:#fff;border-color:#2f7de1}" +
    "#pxhint{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);background:#10202e;color:#fff;padding:5px 12px;border-radius:99px;font:12px system-ui,sans-serif;z-index:2147483001}";
  document.head.appendChild(css);

  var dot = document.createElement("button");
  dot.id = "pxdot"; dot.type = "button"; dot.title = "Publish to profile"; dot.setAttribute("aria-label", "Publish to profile");
  document.body.appendChild(dot);

  var picking = false, hl = null, box = null, hint = null;
  function say(m) { var t = document.getElementById("toast"); if (t) { t.textContent = m; t.className = "on"; setTimeout(function () { t.className = ""; }, 1800); } }
  function clean(s) { return String(s || "").replace(/ /g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 2000); }
  function selText() { var s = window.getSelection && window.getSelection(); return s ? clean(s.toString()) : ""; }
  function stop() {
    picking = false; dot.classList.remove("on");
    if (hl) { hl.classList.remove("px-hl"); hl = null; }
    if (hint) { hint.remove(); hint = null; }
    document.removeEventListener("mouseover", over, true);
    document.removeEventListener("click", pick, true);
    document.removeEventListener("keydown", esc, true);
  }
  function esc(e) { if (e.key === "Escape") stop(); }
  function skip(el) { return !el || el === dot || (box && box.contains(el)) || el === document.body || el === document.documentElement; }
  function over(e) {
    var el = e.target; if (skip(el)) return;
    if (hl) hl.classList.remove("px-hl");
    hl = el; hl.classList.add("px-hl");
  }
  function pick(e) {
    var el = e.target; if (skip(el)) return;
    e.preventDefault(); e.stopPropagation();
    var txt = clean(el.innerText || el.textContent);
    stop(); compose(txt);
  }
  function compose(txt) {
    if (box) box.remove();
    box = document.createElement("div"); box.id = "pxbox";
    box.innerHTML = '<textarea placeholder="Nothing found. Type something to publish."></textarea><div class="r"><button type="button" class="no">Cancel</button><button type="button" class="go">Publish</button></div>';
    document.body.appendChild(box);
    var ta = box.querySelector("textarea"); ta.value = txt; ta.focus();
    box.querySelector(".no").onclick = function () { box.remove(); box = null; };
    box.querySelector(".go").onclick = async function () {
      var v = clean(ta.value); if (!v) { say("Nothing to publish"); return; }
      var So = S(); if (!So || !So.addPost) { say("Sign in to publish"); return; }
      var b = this; b.disabled = true;
      try { await So.addPost(So.uid(), v); box.remove(); box = null; say("Published to your profile"); }
      catch (err) { b.disabled = false; say("Could not publish"); }
    };
  }
  dot.addEventListener("mousedown", function (e) { e.preventDefault(); }); /* keep text selection alive */
  dot.addEventListener("click", function (e) {
    e.stopPropagation();
    if (picking) { stop(); return; }
    var s = selText();
    if (s) { compose(s); return; }
    picking = true; dot.classList.add("on");
    hint = document.createElement("div"); hint.id = "pxhint"; hint.textContent = "Click what to publish · Esc to cancel";
    document.body.appendChild(hint);
    document.addEventListener("mouseover", over, true);
    document.addEventListener("click", pick, true);
    document.addEventListener("keydown", esc, true);
  });
})();
