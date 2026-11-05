/* Parabolic Movers: a news-driven radar of stocks with the ingredients for a fast run.
   The list below is curated from dated news articles (source + date on every card). Live prices and headlines load when you are signed in. */
(function () {
  "use strict";
  var ASOF = "Nov 4, 2026";
  var CRIT = [
    ["cat", "Catalyst this week", "A dated event (earnings, a big interview) that can move it"],
    ["low", "Far below its high", "Down 30%+ from the peak, so a rebound has room"],
    ["gro", "Sales outrunning costs", "Revenue growing faster than expenses"],
    ["sel", "Sold off hard lately", "A sharp recent drop: coiled spring or falling knife"],
    ["fun", "Funded to survive", "Can pay its bills without a bad refinancing"]
  ];
  // v: 1 = yes, 0 = no, -1 = the article did not say
  var PICKS = [
    { t: "IREN", n: "Iren", theme: "Neocloud / AI power", px: 21.71, hi: 77, lo: 5, hiN: "Nov 2025 high ~$77", cat: "Earnings Nov 5 (FQ1 2027)",
      v: { cat: 1, low: 1, gro: -1, sel: 1, fun: -1 },
      why: "Trades near a third of its high. 5.8 GW power pipeline; plans 500 MW online in 2027 to reach 800 MW. Talks for 2027 and 2028 capacity.",
      risk: "The writer owns shares and calls. Earnings can gap it either way.",
      src: "https://www.fool.com/investing/2026/11/04/a-major-neocloud-stock-rally-may-be-coming-these-3/", srcN: "Motley Fool, Nov 4" },
    { t: "NBIS", n: "Nebius", theme: "Neocloud / AI cloud", px: 141.52, cat: "No date set",
      v: { cat: 0, low: 1, gro: 1, sel: 1, fun: 1 },
      why: "Q2 revenue +454% vs costs +251%. Contract value quadrupled from last quarter. Customer prepayments fund 50-60% of build-out; $3.5B Citi facility in October.",
      risk: "Down about 42% in a month. Still unprofitable.",
      src: "https://www.fool.com/investing/2026/11/04/a-major-neocloud-stock-rally-may-be-coming-these-3/", srcN: "Motley Fool, Nov 4" },
    { t: "CRWV", n: "CoreWeave", theme: "Neocloud / AI cloud", px: 48.42, cat: "Debt refinancing",
      v: { cat: 0, low: -1, gro: 1, sel: -1, fun: 0 },
      why: "$104.2B backlog (3x last year). Q2 revenue more than doubled to $2.6B; operating margin nearly positive. 1.5 GW live, about 4.2 GW contracted.",
      risk: "Current ratio 0.46 and debt coming due. The writer's least favorite of the three.",
      src: "https://www.fool.com/investing/2026/11/04/a-major-neocloud-stock-rally-may-be-coming-these-3/", srcN: "Motley Fool, Nov 4" },
    { t: "SPCX", n: "SpaceX", theme: "Space / AI infrastructure", px: 141.31, hi: 225.64, lo: 104.83, hiN: "52-wk range $104.83 - $225.64", cat: "Nov 6 Baron-Musk chat",
      v: { cat: 1, low: 1, gro: -1, sel: 1, fun: -1 },
      why: "Down about 38% from its post-IPO high. Baron, whose biggest holding is SpaceX, interviews Elon Musk on Nov 6. Topics could be Starlink Mobile, AI, orbital computing.",
      risk: "Hype events are mixed: Tesla fell after Baron's 2022 event and rose about 6.5% after 2023.",
      src: "https://www.fool.com/investing/2026/11/04/prediction-spacex-stock-will-go-parabolic-after-no/", srcN: "Motley Fool, Nov 4" }
  ];

  var CSS = '#movv{max-width:none;width:100%;box-sizing:border-box}#movv *{box-sizing:border-box}' +
    '#movv .mv-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 16px;margin:0 0 6px}#movv .mv-h h2{margin:0;font-size:26px}#movv .mv-sub{color:var(--mute);font-size:14px}' +
    '#movv .mv-top{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;margin:14px 0}@media(max-width:900px){#movv .mv-top{grid-template-columns:minmax(0,1fr)}}' +
    '#movv .mv-box{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;min-width:0}#movv .mv-box h3{margin:0 0 8px;font-size:15px}' +
    '#movv .mv-box svg{width:100%;height:auto;display:block}#movv .mv-lg{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--mute);margin-top:6px}' +
    '#movv .mv-ck{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}#movv .mv-ck div{border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:13px}#movv .mv-ck b{display:block;font-size:20px}' +
    '#movv .mv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}' +
    '#movv .mv-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0}' +
    '#movv .mv-r1{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}#movv .mv-t{font-size:22px;font-weight:800;letter-spacing:.5px}#movv .mv-n{color:var(--mute);font-size:13px}' +
    '#movv .mv-px{text-align:right;font-weight:700;font-size:18px}#movv .mv-px small{display:block;font-weight:500;color:var(--mute);font-size:11px}' +
    '#movv .up{color:var(--gain)}#movv .dn{color:var(--loss)}' +
    '#movv .mv-tag{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:2px 9px;font-size:12px;color:var(--mute);margin-right:6px}' +
    '#movv .mv-cat{background:var(--accent);color:var(--accent-ink,#fff);border-color:var(--accent)}' +
    '#movv .mv-dots{display:flex;gap:6px;align-items:center}#movv .mv-dot{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;border:2px solid var(--line);color:var(--mute)}' +
    '#movv .mv-dot.y{background:var(--gain);border-color:var(--gain);color:#fff}#movv .mv-dot.n{border-color:var(--loss);color:var(--loss)}' +
    '#movv .mv-sc{font-weight:800;font-size:13px;margin-left:6px}' +
    '#movv .mv-bar{position:relative;height:10px;border-radius:6px;background:var(--line)}#movv .mv-bar i{position:absolute;top:-4px;width:4px;height:18px;border-radius:2px;background:var(--accent)}' +
    '#movv .mv-bl{display:flex;justify-content:space-between;font-size:11px;color:var(--mute);margin-top:4px}' +
    '#movv .mv-p{margin:0;font-size:14px;line-height:1.45}#movv .mv-p b{font-weight:700}#movv .mv-rk{color:var(--loss)}' +
    '#movv .mv-ft{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12px;color:var(--mute)}#movv .mv-ft a{color:inherit}' +
    '#movv .mv-b{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:8px;padding:5px 10px;font:inherit;font-size:12px;cursor:pointer}#movv .mv-b:hover{border-color:var(--accent)}' +
    '#movv .mv-nw{font-size:13px;border-top:1px dashed var(--line);padding-top:8px;display:flex;flex-direction:column;gap:6px}#movv .mv-nw a{color:var(--ink)}#movv .mv-nw span{color:var(--mute);font-size:11px}' +
    '#movv .mv-dis{color:var(--mute);font-size:12px;margin:16px 0 4px}';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function score(p) { var n = 0; CRIT.forEach(function (c) { if (p.v[c[0]] === 1) n++; }); return n; }

  function curve() { // what a parabolic move looks like: base, breakout, blow-off, crash
    return '<svg viewBox="0 0 560 210" role="img" aria-label="Price curve: quiet base, breakout, steep blow-off, sharp drop">' +
      '<defs><linearGradient id="mvg" x1="0" x2="1"><stop offset="0" stop-color="var(--mute)"/><stop offset=".6" stop-color="var(--gain)"/><stop offset="1" stop-color="var(--loss)"/></linearGradient></defs>' +
      '<path d="M10 170 L70 166 L120 172 L170 160 L215 150 L260 132 L300 108 L335 78 L365 44 L388 16 L402 12 L418 40 L440 90 L470 140 L520 160" fill="none" stroke="url(#mvg)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<g font-size="12" fill="var(--ink)" font-family="system-ui,sans-serif"><text x="14" y="198">1 Quiet base</text><text x="190" y="198">2 Breakout</text><text x="318" y="198">3 Blow-off</text><text x="440" y="198">4 Air pocket</text></g>' +
      '<g stroke="var(--line)" stroke-dasharray="3 4"><path d="M180 20V182M310 20V182M430 20V182"/></g></svg>';
  }

  function card(p, i) {
    var dots = CRIT.map(function (c) { var v = p.v[c[0]]; return '<span class="mv-dot ' + (v === 1 ? "y" : v === 0 ? "n" : "") + '" title="' + esc(c[1] + (v === -1 ? " (not stated)" : v ? ": yes" : ": no")) + '">' + (v === 1 ? "✓" : v === 0 ? "✕" : "?") + '</span>'; }).join("");
    var range = p.hi ? '<div><div class="mv-bar"><i style="left:calc(' + Math.max(0, Math.min(100, (p.px - p.lo) / (p.hi - p.lo) * 100)).toFixed(1) + '% - 2px)"></i></div><div class="mv-bl"><span>' + (p.lo ? "$" + p.lo : "") + '</span><span>' + esc(p.hiN) + '</span></div></div>' : '';
    return '<div class="mv-card" data-mv="' + i + '"><div class="mv-r1"><div><div class="mv-t">' + p.t + '</div><div class="mv-n">' + esc(p.n) + '</div></div><div class="mv-px" data-mvpx>$' + p.px.toFixed(2) + '<small>Nov 4 article</small></div></div>' +
      '<div><span class="mv-tag">' + esc(p.theme) + '</span><span class="mv-tag mv-cat">' + esc(p.cat) + '</span></div>' +
      '<div class="mv-dots">' + dots + '<span class="mv-sc">' + score(p) + '/5</span></div>' + range +
      '<p class="mv-p"><b>Why it could run:</b> ' + esc(p.why) + '</p><p class="mv-p mv-rk"><b>Watch out:</b> ' + esc(p.risk) + '</p>' +
      '<div class="mv-ft"><a href="' + p.src + '" target="_blank" rel="noopener">' + esc(p.srcN) + ' ↗</a><button class="mv-b" type="button" data-mvnews="' + i + '">Latest headlines</button></div><div data-mvnw></div></div>';
  }

  function render(el) {
    var legend = CRIT.map(function (c, k) { return '<div><b>' + (k + 1) + '</b>' + esc(c[1]) + '<br><span style="color:var(--mute)">' + esc(c[2]) + '</span></div>'; }).join("");
    var sorted = PICKS.map(function (p, i) { return [p, i]; }).sort(function (a, b) { return score(b[0]) - score(a[0]); });
    el.innerHTML = '<style>' + CSS + '</style><div class="mv-h"><h2>Parabolic Movers</h2><span class="mv-sub">News-driven radar · updated ' + ASOF + '</span></div>' +
      '<div class="mv-top"><div class="mv-box"><h3>What a parabolic move looks like</h3>' + curve() + '<div class="mv-lg"><span>Most of the money is made in step 2 to 3.</span><span>Step 4 is why you plan the exit before the entry.</span></div></div>' +
      '<div class="mv-box"><h3>The 5-point check on every card</h3><div class="mv-ck">' + legend + '</div><div class="mv-lg"><span>✓ yes</span><span>✕ no</span><span>? the article did not say</span></div></div></div>' +
      '<div class="mv-grid">' + sorted.map(function (x) { return card(x[0], x[1]); }).join("") + '</div>' +
      '<p class="mv-dis">Built from the dated news articles linked on each card, not from a price screen. The checks are Revatour\'s read of those articles, not predictions or advice. Parabolic runs fail often and end fast; size small and know your stop first.</p>';
    live(el);
  }

  function api() { return window.stockspotSocial; }
  function live(el) {
    var a = api(); if (!a || !a.quotes) return;
    a.quotes(PICKS.map(function (p) { return p.t; })).then(function (r) {
      if (!r || !r.quotes) return;
      PICKS.forEach(function (p, i) {
        var q = r.quotes[p.t], c = el.querySelector('[data-mv="' + i + '"] [data-mvpx]'); if (!q || !c) return;
        c.innerHTML = '$' + Number(q.p).toFixed(2) + '<small class="' + (q.dp >= 0 ? "up" : "dn") + '">' + (q.dp >= 0 ? "+" : "") + Number(q.dp).toFixed(2) + '% today</small>';
      });
    }).catch(function () { /* keep the article prices */ });
  }

  function news(el, i) {
    var box = el.querySelector('[data-mv="' + i + '"] [data-mvnw]'), a = api(); if (!box) return;
    if (!a || !a.news) { box.innerHTML = '<div class="mv-nw">Sign in to see live headlines.</div>'; return; }
    box.innerHTML = '<div class="mv-nw">Loading…</div>';
    a.news([PICKS[i].t]).then(function (r) {
      var items = (r && r.items || []).slice(0, 5);
      box.innerHTML = '<div class="mv-nw">' + (items.length ? items.map(function (x) { return '<div><a href="' + esc(x.url || "#") + '" target="_blank" rel="noopener">' + esc(x.title) + '</a><br><span>' + esc(x.source || "") + ' · ' + new Date(x.ts).toLocaleDateString() + '</span></div>'; }).join("") : (r && r.configured === false ? "News feed is not set up yet." : "No headlines in the last week.")) + '</div>';
    }).catch(function () { box.innerHTML = '<div class="mv-nw">Could not load headlines. Sign in and try again.</div>'; });
  }

  var bound = false;
  window.ParabolicMovers = { mount: function (el) {
    render(el);
    if (!bound) { bound = true; el.addEventListener("click", function (e) { var b = e.target.closest("[data-mvnews]"); if (b) news(el, +b.getAttribute("data-mvnews")); }); }
  } };
})();
