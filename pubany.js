/* Publish to Home: a tiny pin on every card, row and news item.
   Click it and that piece shows up in "Published" at the top of the Watchlist (home) screen.
   Pins are live: when the piece changes on its page, the home copy updates too (switch to Frozen to stop that). */
(function () {
  "use strict";
  var KEY = "rv-pins-v1", MAX = 60, MAXLEN = 120000;
  var SEL = [".nw-card", ".pl-card", ".fu-card", ".fu-tile", ".op-card", ".dy-card", ".dy-sec", ".dy-pi", ".dy-tr", ".dy-nw", ".dy-r", ".dy-tile",
    ".mv-card", ".mv-box", ".tpd", ".wl-card", ".sc-call", ".gd-card", ".ig-card", ".hm-tile", ".pf-panel", ".tp-card", ".pfc-box", ".sc-box", ".al-box",
    ".pl-hero", ".pl-rt>div", ".pl-vx", ".pl-chip", ".pl-lc", ".pl-sc", ".pl-n", ".pl-so>div", ".cal-cell:not(.empty)",
    ".post", ".nitem", "#studio tbody tr", "#dayv tbody tr", "#pagev tbody tr", "#scv tbody tr", "#invv tbody tr"].join(",");
  var pins = [], scanT = 0; try { localStorage.removeItem(KEY); } catch (e) {}

  function load() { try { var a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(pins)); } catch (e) { toast("Storage is full"); } }
  function toast(m) { var t = document.getElementById("toast"); if (t) { t.textContent = m; t.className = "on"; setTimeout(function () { t.className = ""; }, 1800); } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var css = document.createElement("style");
  css.textContent =
    ".px-c{position:relative}" +
    ".px-b{position:absolute;top:3px;right:3px;width:18px;height:18px;line-height:16px;padding:0;border:0;border-radius:50%;background:transparent;color:#7a8b99;font-size:11px;opacity:.3;cursor:pointer;z-index:5;transition:opacity .15s}" +
    ".px-c:hover>.px-b,.px-b:focus-visible,.px-b.on{opacity:.55}.px-c:hover>.px-b:hover{opacity:1;background:rgba(122,139,153,.2)}" +
    "@media(hover:none){.px-b{opacity:.3}}" +
    ".px-show .px-c{outline:1px dashed #2f7de1;outline-offset:-1px}.px-show .px-b{opacity:1;width:22px;height:22px;line-height:20px;background:#2f7de1;color:#fff;font-size:12px}.px-show .px-b.on{background:#0b6b5a}" +
    "#pxfab{position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;gap:6px;align-items:center}#pxfab button{border:1px solid var(--line,#ccc);background:var(--panel,#fff);color:var(--ink,#111);border-radius:99px;padding:6px 12px;font:600 12px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.18);opacity:.8}#pxfab button:hover,#pxfab button.on{opacity:1}#pxfab button.on{background:#2f7de1;color:#fff;border-color:#2f7de1}" +
    "#pxbox{position:fixed;right:14px;bottom:56px;width:min(380px,calc(100vw - 28px));max-height:80vh;overflow:auto;background:var(--panel,#fff);color:var(--ink,#111);border:1px solid var(--line,#ccc);border-radius:12px;box-shadow:0 10px 34px rgba(0,0,0,.3);padding:12px;z-index:2147483001;font:13px/1.4 system-ui,sans-serif}#pxbox .pv{border:1px solid var(--line,#ccc);border-radius:8px;padding:6px;margin:0 0 8px;max-height:220px;overflow:auto;text-align:center;opacity:.9}#pxbox .pv img{max-width:100%;display:block;margin:0 auto}#pxbox textarea{width:100%;box-sizing:border-box;height:84px;font:inherit;border:1px solid var(--line,#ccc);border-radius:6px;padding:6px;resize:vertical;background:var(--bg,#fff);color:inherit}#pxbox .ck{display:flex;gap:6px;align-items:center;margin:6px 0}#pxbox .r{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}#pxbox button{font:inherit;padding:6px 12px;border-radius:8px;border:1px solid var(--line,#ccc);background:var(--bg,#f3f6f9);color:inherit;cursor:pointer}#pxbox button.go{background:#2f7de1;color:#fff;border-color:#2f7de1}" +
    "#rvpins .pk{display:flex;align-items:center;gap:8px;width:100%;padding:14px;border-radius:10px;border:1px solid var(--line,#ccc);background:var(--panel,#fff);color:inherit;font:600 .95rem system-ui,sans-serif;cursor:pointer;text-align:left}#rvpins .pk:hover{border-color:#2f7de1}" +
    "tr.px-c>.px-b{display:none}tr.px-c td:last-child{position:relative}tr.px-c td:last-child>.px-b{display:block}" +
    "#rvpins{margin:0 0 18px}#rvpins h2{font-size:1rem;margin:0 0 8px;display:flex;align-items:baseline;gap:8px}#rvpins h2 small{font-weight:400;opacity:.6;font-size:.78rem}" +
    "#rvpins .pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;align-items:start}" +
    "#rvpins .pc{position:relative;border:1px solid var(--line,#d6dde3);border-radius:10px;padding:8px 10px 6px;overflow:hidden;background:var(--card,transparent)}" +
    "@media(max-width:760px){#rvpins .pc{grid-column:auto!important}}#rvpins .pm{margin-top:6px;display:flex;gap:8px;font-size:.68rem;opacity:.55}#rvpins .pm button{border:0;background:none;color:inherit;font:inherit;cursor:pointer;padding:0;text-decoration:underline}#rvpins .pm span{flex:1}";
  document.head.appendChild(css);

  function viewOf(el) { var w = el.closest(".wrap"); return w ? w.id : ""; }
  function label(v) { var n = document.getElementById("nav" + ({ dayv: "day", newsv: "news", pagev: "studio", scv: "sc", invv: "inv" }[v] || v.replace(/v$/, ""))); return n ? n.textContent.replace(/\s*\d*$/, "").trim() : v; }
  function matches(root) {
    var all = Array.prototype.slice.call(root.querySelectorAll(SEL));
    root.querySelectorAll("svg,canvas").forEach(function (g) {
      if (g.closest("svg") !== g && g.tagName === "svg") return; // nested svg
      var r = g.getBoundingClientRect(); if (r.width < 220 || r.height < 90) return;
      var host = g.parentElement; if (!host || host === root || host.closest("#rvpins")) return;
      if (all.indexOf(host) < 0 && !host.matches(SEL)) { host.setAttribute("data-pxchart", "1"); all.push(host); }
    });
    return all.filter(function (e) { return !e.closest("#rvpins"); });
  }
  function sig(el) { return (el.hasAttribute("data-pxchart") ? "CHART:" : "") + el.tagName + "." + String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className).replace(/\bpx-c\b/g, "").trim().split(/\s+/).slice(0, 2).join("."); }
  function keyOf(el) {
    var v = viewOf(el), w = document.getElementById(v); if (!w) return null;
    var sg = sig(el), list = matches(w).filter(function (x) { return sig(x) === sg; }), i = list.indexOf(el); return i < 0 ? null : v + "|" + sg + "|" + i;
  }
  var INH = ["color", "font-size", "font-weight", "font-style", "font-family", "line-height", "text-align", "text-transform", "letter-spacing", "white-space", "text-decoration-line", "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "text-anchor", "fill-opacity", "stroke-opacity"];
  var NON = ["display", "position", "left", "top", "right", "bottom", "flex-direction", "flex-wrap", "flex-grow", "flex-shrink", "flex-basis", "align-items", "align-self", "justify-content", "gap", "grid-template-columns", "grid-template-rows", "grid-column-start", "grid-column-end", "margin-top", "margin-right", "margin-bottom", "margin-left", "padding-top", "padding-right", "padding-bottom", "padding-left", "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius", "background-color", "background-image", "box-shadow", "opacity", "overflow-x", "overflow-y", "vertical-align", "text-overflow", "transform", "z-index"];
  var INIT = { "0px": 1, "none": 1, "normal": 1, "auto": 1, "static": 1, "visible": 1, "rgba(0, 0, 0, 0)": 1, "1": 1, "row": 1, "nowrap": 1, "stretch": 1, "start": 1, "0px 0px": 1 };
  var SIDES = ["top", "right", "bottom", "left"];
  function inl(o, c, isRoot) {
    var cs = getComputedStyle(o), par = o.parentElement && !isRoot ? getComputedStyle(o.parentElement) : null, out = "";
    var has = function (k) { return o.style && o.style.getPropertyValue(k); };
    INH.forEach(function (k) { var v = cs.getPropertyValue(k); if (!v || has(k)) return; if (par && par.getPropertyValue(k) === v) return; out += k + ":" + v + ";"; });
    NON.forEach(function (k) {
      var v = cs.getPropertyValue(k); if (!v || has(k) || INIT[v]) return;
      if (k === "flex-grow" && v === "0") return; if (k === "flex-shrink" && v === "1") return; if (k === "opacity" && v === "1") return;
      if (/^(justify-content|align-items|align-self)$/.test(k) && v === "normal") return;
      out += k + ":" + v + ";";
    });
    SIDES.forEach(function (sd) { var w = cs.getPropertyValue("border-" + sd + "-width"), st = cs.getPropertyValue("border-" + sd + "-style"); if (w && w !== "0px" && st !== "none" && !has("border-" + sd)) out += "border-" + sd + ":" + w + " " + st + " " + cs.getPropertyValue("border-" + sd + "-color") + ";"; });
    if (o.nodeName.toLowerCase() !== "svg" && !(o instanceof SVGElement) && !o.firstElementChild && !(o.textContent || "").trim()) { // decorative bit: keep its size
      ["width", "height"].forEach(function (k) { if (!has(k)) { var v = cs.getPropertyValue(k); if (v && v !== "auto") out += k + ":" + v + ";"; } });
    }
    if (out) c.setAttribute("style", (c.getAttribute("style") || "") + ";" + out);
  }
  function shot(cv) {
    try {
      var w = Math.min(cv.width, 640), h = Math.round(cv.height * w / cv.width), t = document.createElement("canvas"); t.width = w; t.height = h;
      t.getContext("2d").drawImage(cv, 0, 0, w, h); var u = t.toDataURL("image/png"); return u.length < 110000 ? u : null;
    } catch (e) { return null; }
  }
  function snap(el, big) {
    var c = el.cloneNode(true);
    var O = [el].concat(Array.prototype.slice.call(el.querySelectorAll("*"))), C = [c].concat(Array.prototype.slice.call(c.querySelectorAll("*")));
    if (O.length !== C.length) return null;
    for (var i = 0; i < O.length; i++) {
      var o = O[i], n = C[i];
      if (o.classList && o.classList.contains("px-b")) continue;
      if (o.tagName === "CANVAS") { var u = shot(o); if (u) { var im = document.createElement("img"); im.src = u; im.alt = "chart"; im.setAttribute("style", "width:100%;height:auto;max-width:100%;display:block"); n.replaceWith(im); } else n.remove(); continue; }
      if (/^(SCRIPT|STYLE|INPUT|SELECT|TEXTAREA|FORM)$/.test(o.tagName)) continue;
      inl(o, n, i === 0);
      if (o.tagName.toLowerCase() === "svg") {
        var r = o.getBoundingClientRect();
        if (!n.getAttribute("viewBox") && r.width) n.setAttribute("viewBox", "0 0 " + Math.round(r.width) + " " + Math.round(r.height));
        n.removeAttribute("width"); n.removeAttribute("height"); n.setAttribute("style", (n.getAttribute("style") || "") + ";width:100%;height:auto;max-width:100%");
      }
    }
    c.querySelectorAll(".px-b,script,style,input,select,textarea,form,canvas").forEach(function (n) { n.remove(); });
    c.querySelectorAll("button").forEach(function (b) {
      if (b.hasAttribute("data-tk") || b.hasAttribute("data-tk2")) return;
      var s = document.createElement("span"); s.innerHTML = b.innerHTML; s.className = b.className; if (b.getAttribute("style")) s.setAttribute("style", b.getAttribute("style")); b.replaceWith(s);
    });
    [c].concat(Array.prototype.slice.call(c.querySelectorAll("*"))).forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        var k = a.name;
        if (/^on/.test(k) || k === "id" || k === "contenteditable" || (/^data-/.test(k) && !/^data-(tk|tk2|un)$/.test(k))) n.removeAttribute(k);
      });
      if (n.tagName === "A") { n.setAttribute("target", "_blank"); n.setAttribute("rel", "noopener noreferrer"); if (!/^https?:/i.test(n.getAttribute("href") || "")) n.removeAttribute("href"); }
    });
    c.classList.remove("px-c"); c.style.margin = "0"; c.style.position = "static";
    var h = c.outerHTML;
    if (el.tagName === "TR") h = "<table><tbody>" + h + "</tbody></table>";
    return (!big && h.length > MAXLEN) ? null : h;
  }

  function scan() {
    scanT = 0;
    var changed = false;
    ["dayv", "newsv", "pagev", "studio", "scv", "invv", "alv", "labv", "zonev", "pracv", "futv", "optv", "movv", "pulsev", "planv", "rlv", "gdv", "tickerv", "profilev", "pubv", "notifv", "entry"].forEach(function (id) {
      var w = document.getElementById(id); if (!w || w.hidden) return;
      matches(w).forEach(function (el) {
        var k = keyOf(el); if (!k) return;
        if (!el.classList.contains("px-c") || !el.querySelector(":scope>.px-b,:scope td:last-child>.px-b")) {
          el.classList.add("px-c");
          var b = document.createElement("button"); b.type = "button"; b.className = "px-b"; b.textContent = "●"; b.title = "Post to your wall"; b.setAttribute("aria-label", "Post to your wall");
          (el.tagName === "TR" ? el.lastElementChild || el : el).appendChild(b);
        }
        var p = pins.find(function (x) { return x.k === k; }), b2 = el.querySelector(".px-b");
        if (b2) { b2.title = "Post to your wall"; }
        if (p && p.live) { var h = snap(el); if (h && h !== p.h) { p.h = h; p.w = el.offsetWidth; p.ts = Date.now(); changed = true; } }
      });
    });
    if (changed) { save(); paintHome(); }
    paintHome();
  }
  function later() { fabSync(); if (!scanT) scanT = setTimeout(scan, 200); }

  function paintHome() { var b = document.getElementById("rvpins"); if (b) b.remove(); }



  /* ---- publish to the profile wall ---- */
  var pbox = null;
  function toImage(el) {
    return new Promise(function (res) {
      try {
        if (el.querySelectorAll("*").length > 2500) return res(null);
        var h = snap(el, true); if (!h) return res(null);
        var w = Math.min(1400, Math.max(280, Math.round(el.getBoundingClientRect().width))), hh = Math.min(2600, Math.round(el.getBoundingClientRect().height)) + 24;
        var doc = new DOMParser().parseFromString("<!DOCTYPE html><body>" + h, "text/html"), node = doc.body.firstElementChild; if (!node) return res(null);
        var bg = getComputedStyle(document.body).backgroundColor; if (!bg || bg === "rgba(0, 0, 0, 0)") bg = "#fff";
        var xml = '<div xmlns="http://www.w3.org/1999/xhtml" style="background:' + bg + ';padding:12px;width:' + w + 'px;box-sizing:content-box;font-family:system-ui,sans-serif">' + new XMLSerializer().serializeToString(node) + "</div>";
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (w + 24) + '" height="' + hh + '"><foreignObject x="0" y="0" width="100%" height="100%">' + xml + "</foreignObject></svg>";
        var im = new Image(); im.onload = function () {
          try {
            var sc = Math.min(2, 2600 / Math.max(w + 24, hh)), c = document.createElement("canvas"); c.width = Math.round((w + 24) * sc); c.height = Math.round(hh * sc);
            var g = c.getContext("2d"); g.scale(sc, sc); g.drawImage(im, 0, 0);
            c.toBlob(function (b) { res(b); }, "image/png");
          } catch (e) { res(null); }
        };
        im.onerror = function () { res(null); }; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      } catch (e) { res(null); }
    });
  }
  function elText(el) { var bs = Array.prototype.slice.call(el.querySelectorAll(".px-b")); bs.forEach(function (b) { b.style.display = "none"; }); var t = el.innerText || el.textContent; bs.forEach(function (b) { b.style.display = ""; }); return t; }
  function cleanTxt(s) { return String(s || "").replace(/ /g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 900); }
  function closePub() { if (pbox) { if (pbox._url) URL.revokeObjectURL(pbox._url); pbox.remove(); pbox = null; } }
  function openPub(el, mode) {
    closePub();
    var page = mode === "page", nv = curNav(), pname = nv ? nv.textContent.replace(/\s*\d*$/, "").trim() : "Page", k = page ? null : keyOf(el);
    var txt = page ? "📄 " + pname + " · " + new Date().toLocaleDateString([], { month: "short", day: "numeric" }) : cleanTxt(elText(el));
    var already = page ? pins.some(function (x) { return x.t === "link" && nv && x.nav === nv.id; }) : pins.some(function (x) { return x.k === k; });
    pbox = document.createElement("div"); pbox.id = "pxbox";
    pbox.innerHTML = '<b style="display:block;margin:0 0 6px">Publish to your profile</b><div class="pv" id="pxpv">Making a picture…</div><textarea id="pxtx" maxlength="4000" aria-label="Post text"></textarea>' +
      '<label class="ck"><input type="checkbox" id="pxck" checked> Include the picture</label><div class="r"><button type="button" class="no">Cancel</button><button type="button" class="pn">' + (already ? "Remove from Watchlist" : "Pin to Watchlist") + '</button><button type="button" class="go">Publish</button></div>';
    document.body.appendChild(pbox);
    var ta = pbox.querySelector("#pxtx"); ta.value = txt;
    toImage(el).then(function (b) {
      if (!pbox) return; var pv = pbox.querySelector("#pxpv");
      if (b) { pbox._blob = b; pbox._url = URL.createObjectURL(b); pv.innerHTML = '<img alt="Preview" src="' + pbox._url + '">'; }
      else { pv.textContent = "Couldn't make a picture of this one. It will post as text."; pbox.querySelector("#pxck").checked = false; pbox.querySelector("#pxck").disabled = true; }
    });
    pbox.querySelector(".no").onclick = closePub;
    pbox.querySelector(".pn").onclick = function () {
      if (page) {
        if (!nv) return; var i2 = pins.findIndex(function (x) { return x.t === "link" && x.nav === nv.id; });
        if (i2 >= 0) { pins.splice(i2, 1); toast(pname + " removed from Watchlist"); } else pins.unshift({ t: "link", k: "link|" + nv.id, nav: nv.id, v: pname, h: "", ts: Date.now(), live: false });
      } else {
        var i3 = pins.findIndex(function (x) { return x.k === k; });
        if (i3 >= 0) { pins.splice(i3, 1); toast("Removed from Watchlist"); }
        else { var h = snap(el); if (!h) { toast("Too big to pin"); return; } pins.unshift({ k: k, v: label(viewOf(el)) || "Page", h: h, w: el.offsetWidth, ts: Date.now(), live: true }); toast("Pinned to Watchlist"); }
      }
      save(); paintHome(); later(); closePub();
    };
    pbox.querySelector(".go").onclick = async function () {
      var v = cleanTxt(ta.value), So = window.stockspotSocial, b = this;
      if (!So || !So.addPost) { toast("Sign in to publish"); return; }
      var imgs = [];
      b.disabled = true; b.textContent = "Publishing…";
      try {
        if (pbox._blob && pbox.querySelector("#pxck").checked) { try { imgs.push({ src: await So.uploadImage(pbox._blob) }); } catch (e) { toast("Picture couldn't be saved. Posting the text only."); } }
        if (!v && !imgs.length) { toast("Nothing to publish"); b.disabled = false; b.textContent = "Publish"; return; }
        await So.addPost(So.uid(), v, imgs); closePub(); toast("Published to your profile");
      } catch (e) { b.disabled = false; b.textContent = "Publish"; toast("Could not publish"); }
    };
  }


  var busy = false;
  async function quickPub(el, mode) {
    if (busy) return; var So = window.stockspotSocial;
    if (!So || !So.addPost) { toast("Sign in to publish"); return; }
    busy = true; var btn = el.querySelector(":scope>.px-b, td>.px-b, .px-b"), old = btn ? btn.textContent : ""; if (btn) btn.textContent = "\u23f3"; toast("Publishing to your wall\u2026");
    try {
      var nv = curNav(), pname = nv ? nv.textContent.replace(/\s*\d*$/, "").trim() : "Page";
      var txt = mode === "page" ? "\ud83d\udcc4 " + pname + " \u00b7 " + new Date().toLocaleDateString([], { month: "short", day: "numeric" }) : cleanTxt(elText(el)), imgs = [];
      var blob = await toImage(el);
      if (blob) { try { imgs.push({ src: await So.uploadImage(blob) }); } catch (e) { toast("Picture couldn't be saved. Posting the text only."); } }
      if (!txt && !imgs.length) { toast("Nothing to publish here"); return; }
      await So.addPost(So.uid(), txt, imgs); toast("Published to your wall" + (imgs.length ? "" : " (text only)"));
      if (btn) { var bb = btn; bb.textContent = "\u2713"; setTimeout(function () { bb.textContent = old; }, 1600); btn = null; }
    } catch (e) { toast("Could not publish"); }
    finally { busy = false; if (btn) btn.textContent = old; }
  }

  function curNav() { var b = document.querySelector(".nav.on[id^=nav]"); return b ? b : null; }
  var fab = document.createElement("div"); fab.id = "pxfab";
  fab.innerHTML = '<button type="button" data-pxfab="show" title="Show every piece you can publish">\ud83d\udccc Show publish dots</button><button type="button" data-pxfab="page" title="Post this whole page to your wall">\ud83d\udcc4 Publish this page</button>';
  document.body.appendChild(fab);
  function fabSync() { var home = document.getElementById("home"); fab.style.display = home && !home.hidden ? "none" : "flex"; }
  document.addEventListener("click", function (e) {
    var go = e.target.closest && e.target.closest("[data-pxgo]");
    if (go) { var nb = document.getElementById(go.dataset.pxgo); if (nb) { e.preventDefault(); nb.click(); } return; }
    var fb = e.target.closest && e.target.closest("[data-pxfab]");
    if (fb) {
      if (fb.dataset.pxfab === "show") { var on = document.body.classList.toggle("px-show"); fb.classList.toggle("on", on); fb.textContent = on ? "\ud83d\udccc Hide dots" : "\ud83d\udccc Show publish dots"; if (on) toast("Click any blue dot to post that piece to your wall"); return; }
      var vw = document.querySelector(".wrap:not([hidden])"); if (!vw || vw.id === "home") { toast("Open a page first"); return; }
      quickPub(vw, "page"); return;
    }
    var t = e.target.closest && e.target.closest(".px-b,[data-pxl],[data-pxr]"); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    if (t.dataset.pxl != null) { var q = pins[+t.dataset.pxl]; if (q) { q.live = !q.live; save(); paintHome(); toast(q.live ? "Live: updates when it changes" : "Frozen"); } return; }
    if (t.dataset.pxr != null) { pins.splice(+t.dataset.pxr, 1); save(); paintHome(); later(); toast("Removed from Home"); return; }
    var el = t.closest(".px-c"); if (!el) return;
    quickPub(el, "piece");
  }, true);

  new MutationObserver(function (m) {
    for (var i = 0; i < m.length; i++) { var t = m[i].target; if (t.closest && t.closest("#rvpins")) continue; if (m[i].target.nodeType === 1 && m[i].target.classList && m[i].target.classList.contains("px-b")) continue; later(); return; }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  later();
})();
