/* Publish to Home: a tiny pin on every card, row and news item.
   Click it and that piece shows up in "Published" at the top of the Watchlist (home) screen.
   Pins are live: when the piece changes on its page, the home copy updates too (switch to Frozen to stop that). */
(function () {
  "use strict";
  var KEY = "rv-pins-v1", MAX = 60, MAXLEN = 40000;
  var SEL = [".nw-card", ".pl-card", ".fu-card", ".op-card", ".dy-card", ".dy-sec", ".dy-pi", ".dy-nw", ".dy-r",
    ".mv-card", ".mv-box", ".tpd", ".wl-card", ".sc-call", ".gd-card", ".ig-card", ".hm-tile", ".dy-tile",
    ".post", ".nitem", "#studio tbody tr", "#dayv tbody tr", "#pagev tbody tr", "#scv tbody tr", "#invv tbody tr"].join(",");
  var pins = load(), scanT = 0;

  function load() { try { var a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(pins)); } catch (e) { toast("Storage is full"); } }
  function toast(m) { var t = document.getElementById("toast"); if (t) { t.textContent = m; t.className = "on"; setTimeout(function () { t.className = ""; }, 1800); } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var css = document.createElement("style");
  css.textContent =
    ".px-c{position:relative}" +
    ".px-b{position:absolute;top:3px;right:3px;width:18px;height:18px;line-height:16px;padding:0;border:0;border-radius:50%;background:transparent;color:#7a8b99;font-size:11px;opacity:0;cursor:pointer;z-index:5;transition:opacity .15s}" +
    ".px-c:hover>.px-b,.px-b:focus-visible,.px-b.on{opacity:.55}.px-c:hover>.px-b:hover{opacity:1;background:rgba(122,139,153,.2)}" +
    "@media(hover:none){.px-b{opacity:.2}}" +
    "tr.px-c>.px-b{display:none}tr.px-c td:last-child{position:relative}tr.px-c td:last-child>.px-b{display:block}" +
    "#rvpins{margin:0 0 18px}#rvpins h2{font-size:1rem;margin:0 0 8px;display:flex;align-items:baseline;gap:8px}#rvpins h2 small{font-weight:400;opacity:.6;font-size:.78rem}" +
    "#rvpins .pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}" +
    "#rvpins .pc{position:relative;border:1px solid var(--line,#d6dde3);border-radius:10px;padding:8px 10px 22px;overflow:auto;max-height:340px;background:var(--card,transparent)}" +
    "#rvpins .pm{position:absolute;left:10px;bottom:3px;right:6px;display:flex;gap:8px;font-size:.68rem;opacity:.55}#rvpins .pm button{border:0;background:none;color:inherit;font:inherit;cursor:pointer;padding:0;text-decoration:underline}#rvpins .pm span{flex:1}";
  document.head.appendChild(css);

  function viewOf(el) { var w = el.closest(".wrap"); return w ? w.id : ""; }
  function label(v) { var n = document.getElementById("nav" + ({ dayv: "day", newsv: "news", pagev: "studio", scv: "sc", invv: "inv" }[v] || v.replace(/v$/, ""))); return n ? n.textContent.replace(/\s*\d*$/, "").trim() : v; }
  function matches(root) { // outermost matches only
    var all = Array.prototype.slice.call(root.querySelectorAll(SEL));
    return all.filter(function (e) { var p = e.parentElement && e.parentElement.closest(SEL); return !p || !root.contains(p); });
  }
  function sig(el) { return el.tagName + "." + String(el.className).replace(/\bpx-c\b/g, "").trim().split(/\s+/)[0]; }
  function keyOf(el) {
    var v = viewOf(el), w = document.getElementById(v); if (!w) return null;
    var list = matches(w), i = list.indexOf(el); return i < 0 ? null : v + "|" + sig(el) + "|" + i;
  }
  function snap(el) {
    var c = el.cloneNode(true);
    c.querySelectorAll(".px-b,script,style,input,select,textarea,form,canvas").forEach(function (n) { n.remove(); });
    c.querySelectorAll("button").forEach(function (b) {
      if (b.hasAttribute("data-tk") || b.hasAttribute("data-tk2")) return;
      var s = document.createElement("span"); s.innerHTML = b.innerHTML; s.className = b.className; b.replaceWith(s);
    });
    [c].concat(Array.prototype.slice.call(c.querySelectorAll("*"))).forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        var k = a.name;
        if (/^on/.test(k) || k === "id" || k === "contenteditable" || (/^data-/.test(k) && !/^data-(tk|tk2|un)$/.test(k))) n.removeAttribute(k);
      });
      if (n.tagName === "A") { n.setAttribute("target", "_blank"); n.setAttribute("rel", "noopener noreferrer"); if (!/^https?:/i.test(n.getAttribute("href") || "")) n.removeAttribute("href"); }
    });
    c.classList.remove("px-c");
    var h = c.outerHTML;
    if (el.tagName === "TR") h = "<table><tbody>" + h + "</tbody></table>";
    return h.length > MAXLEN ? null : h;
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
          var b = document.createElement("button"); b.type = "button"; b.className = "px-b"; b.textContent = "●"; b.title = "Publish to Home"; b.setAttribute("aria-label", "Publish to Home");
          (el.tagName === "TR" ? el.lastElementChild || el : el).appendChild(b);
        }
        var p = pins.find(function (x) { return x.k === k; }), b2 = el.querySelector(".px-b");
        if (b2) { b2.classList.toggle("on", !!p); b2.title = p ? "Published to Home (click to remove)" : "Publish to Home"; }
        if (p && p.live) { var h = snap(el); if (h && h !== p.h) { p.h = h; p.ts = Date.now(); changed = true; } }
      });
    });
    if (changed) { save(); paintHome(); }
    paintHome();
  }
  function later() { if (!scanT) scanT = setTimeout(scan, 200); }

  function paintHome() {
    var home = document.getElementById("home"); if (!home || home.hidden) return;
    var box = document.getElementById("rvpins");
    if (!pins.length) { if (box) box.remove(); return; }
    var html = '<h2>Published <small>' + pins.length + ' on your home screen</small></h2><div class="pg">' + pins.map(function (p, i) {
      return '<div class="pc">' + p.h + '<div class="pm"><span>' + esc(p.v) + " · " + new Date(p.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + '</span><button type="button" data-pxl="' + i + '">' + (p.live ? "Live" : "Frozen") + '</button><button type="button" data-pxr="' + i + '">Remove</button></div></div>';
    }).join("") + "</div>";
    if (box && box.dataset.sig === html.length + ":" + pins.length + ":" + pins.map(function (p) { return p.ts + (p.live ? "L" : "F"); }).join()) return;
    if (!box) { box = document.createElement("section"); box.id = "rvpins"; var top = home.querySelector(".hm-top"); if (top && top.nextSibling) home.insertBefore(box, top.nextSibling); else home.insertBefore(box, home.firstChild); }
    box.innerHTML = html;
    box.dataset.sig = html.length + ":" + pins.length + ":" + pins.map(function (p) { return p.ts + (p.live ? "L" : "F"); }).join();
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".px-b,[data-pxl],[data-pxr]"); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    if (t.dataset.pxl != null) { var q = pins[+t.dataset.pxl]; if (q) { q.live = !q.live; save(); paintHome(); toast(q.live ? "Live: updates when it changes" : "Frozen"); } return; }
    if (t.dataset.pxr != null) { pins.splice(+t.dataset.pxr, 1); save(); paintHome(); later(); toast("Removed from Home"); return; }
    var el = t.closest(".px-c"); if (!el) return;
    var k = keyOf(el); if (!k) return;
    var i = pins.findIndex(function (x) { return x.k === k; });
    if (i >= 0) { pins.splice(i, 1); save(); t.classList.remove("on"); toast("Removed from Home"); return; }
    if (pins.length >= MAX) { toast("Home is full (" + MAX + "). Remove one first."); return; }
    var h = snap(el); if (!h) { toast("That piece is too big to publish"); return; }
    pins.unshift({ k: k, v: label(viewOf(el)) || "Page", h: h, ts: Date.now(), live: true });
    save(); t.classList.add("on"); toast("Published to Home");
  }, true);

  new MutationObserver(function (m) {
    for (var i = 0; i < m.length; i++) { var t = m[i].target; if (t.closest && t.closest("#rvpins")) continue; if (m[i].target.nodeType === 1 && m[i].target.classList && m[i].target.classList.contains("px-b")) continue; later(); return; }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  later();
})();
