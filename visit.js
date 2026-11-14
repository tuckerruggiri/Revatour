/* Counts a page view (anonymous random id, page, where they came from, phone or computer).
   No names, emails or IP addresses are stored. Skips bots, localhost and the owner's own browser. */
(function () {
  try {
    var h = location.hostname; if (h === "localhost" || h === "127.0.0.1" || h === "") return;
    if (localStorage.getItem("ss-notrack") === "1") return;
    if (/bot|crawl|spider|preview|headless|lighthouse/i.test(navigator.userAgent || "")) return;
    var p = location.pathname.replace(/\/index\.html$/, "/").slice(0, 190) || "/", k = "ss-hit:" + p;
    if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1");
    var vid = localStorage.getItem("ss-vid"); if (!vid) { vid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/-/g, "").slice(0, 32); localStorage.setItem("ss-vid", vid); }
    var ref = ""; try { var u = new URL(document.referrer); if (u.hostname && u.hostname !== h) ref = u.hostname.replace(/^www\./, ""); } catch (e) {}
    var dev = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "phone" : "computer";
    fetch("/api/config").then(function (r) { return r.json(); }).then(function (c) {
      if (!c || !c.url || !c.anonKey) return;
      fetch(c.url + "/rest/v1/ss_visits", { method: "POST", keepalive: true, headers: { apikey: c.anonKey, Authorization: "Bearer " + c.anonKey, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ vid: vid, path: p, ref: ref, dev: dev }) }).catch(function () {});
    }).catch(function () {});
  } catch (e) {}
})();
