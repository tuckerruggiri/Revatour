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
  var pins = load(), scanT = 0;

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
  function snap(el) {
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
        if (p && p.live) { var h = snap(el); if (h && h !== p.h) { p.h = h; p.w = el.offsetWidth; p.ts = Date.now(); changed = true; } }
      });
    });
    if (changed) { save(); paintHome(); }
    paintHome();
  }
  function later() { fabSync(); if (!scanT) scanT = setTimeout(scan, 200); }

  function paintHome() {
    var home = document.getElementById("home"); if (!home || home.hidden) return;
    var box = document.getElementById("rvpins");
    if (!pins.length) { if (box) box.remove(); return; }
    var html = '<h2>Published <small>' + pins.length + ' on your home screen</small></h2><div class="pg">' + pins.map(function (p, i) {
      return '<div class="pc" style="grid-column:span ' + (p.t === "link" ? 1 : Math.max(1, Math.min(4, Math.ceil((p.w || 0) / 330)))) + '">' + (p.t === "link" ? '<button type="button" class="pk" data-pxgo="' + esc(p.nav) + '">\ud83d\udccc ' + esc(p.v) + ' <small style="opacity:.6;font-weight:400">open page</small></button>' : p.h) + '<div class="pm"><span>' + esc(p.t === "link" ? "Page shortcut" : p.v) + " · " + new Date(p.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + '</span><button type="button" data-pxl="' + i + '">' + (p.live ? "Live" : "Frozen") + '</button><button type="button" data-pxr="' + i + '">Remove</button></div></div>';
    }).join("") + "</div>";
    if (box && box.dataset.sig === html.length + ":" + pins.length + ":" + pins.map(function (p) { return p.ts + (p.live ? "L" : "F"); }).join()) return;
    if (!box) { box = document.createElement("section"); box.id = "rvpins"; var top = home.querySelector(".hm-top"); if (top && top.nextSibling) home.insertBefore(box, top.nextSibling); else home.insertBefore(box, home.firstChild); }
    box.innerHTML = html;
    box.dataset.sig = html.length + ":" + pins.length + ":" + pins.map(function (p) { return p.ts + (p.live ? "L" : "F"); }).join();
  }

  function curNav() { var b = document.querySelector(".nav.on[id^=nav]"); return b ? b : null; }
  var fab = document.createElement("div"); fab.id = "pxfab";
  fab.innerHTML = '<button type="button" data-pxfab="show" title="Show every piece you can publish to Home">\ud83d\udccc Show pins</button><button type="button" data-pxfab="page" title="Add a shortcut to this page on Home">\ud83d\udcc4 Pin this page</button>';
  document.body.appendChild(fab);
  function fabSync() { var home = document.getElementById("home"); fab.style.display = home && !home.hidden ? "none" : "flex"; }
  document.addEventListener("click", function (e) {
    var go = e.target.closest && e.target.closest("[data-pxgo]");
    if (go) { var nb = document.getElementById(go.dataset.pxgo); if (nb) { e.preventDefault(); nb.click(); } return; }
    var fb = e.target.closest && e.target.closest("[data-pxfab]");
    if (fb) {
      if (fb.dataset.pxfab === "show") { var on = document.body.classList.toggle("px-show"); fb.classList.toggle("on", on); fb.textContent = on ? "\ud83d\udccc Hide pins" : "\ud83d\udccc Show pins"; if (on) toast("Click any blue dot to publish that piece to Home"); return; }
      var nv = curNav(); if (!nv) { toast("Open a page first"); return; }
      var name = nv.textContent.replace(/\s*\d*$/, "").trim(), i2 = pins.findIndex(function (x) { return x.t === "link" && x.nav === nv.id; });
      if (i2 >= 0) { pins.splice(i2, 1); save(); paintHome(); toast(name + " removed from Home"); return; }
      if (pins.length >= MAX) { toast("Home is full (" + MAX + ")"); return; }
      pins.unshift({ t: "link", k: "link|" + nv.id, nav: nv.id, v: name, h: "", ts: Date.now(), live: false }); save(); paintHome(); toast(name + " pinned to Home"); return;
    }
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
    pins.unshift({ k: k, v: label(viewOf(el)) || "Page", h: h, w: el.offsetWidth, ts: Date.now(), live: true });
    save(); t.classList.add("on"); toast("Published to Home");
  }, true);

  new MutationObserver(function (m) {
    for (var i = 0; i < m.length; i++) { var t = m[i].target; if (t.closest && t.closest("#rvpins")) continue; if (m[i].target.nodeType === 1 && m[i].target.classList && m[i].target.classList.contains("px-b")) continue; later(); return; }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  later();
})();
