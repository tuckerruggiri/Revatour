/* Futures page: education hub for futures day trading with funded accounts (Apex), NinjaTrader, trade copying,
   session timing, strategies and risk. Mounts into a container; everything is static content plus small calculators.
   Prop-firm rules change often, so every rule block carries a "last checked" date and a link to confirm. */
(function (root) {
  "use strict";
  var CHECKED = "October 2026";
  var CSS = [
    ".fu-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 18px}",
    ".fu-tabs button{border:1px solid var(--line);border-radius:99px;padding:7px 15px;background:var(--panel);color:var(--ink);font:inherit;font-size:14px;cursor:pointer}",
    ".fu-tabs button.on{background:var(--accent);border-color:var(--accent);color:#fff}",
    ".fu-card{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:16px 18px;margin:0 0 16px}",
    ".fu-card h3{margin:0 0 6px;font-size:17px}",
    ".fu-warn{border-left:4px solid #d97706;background:rgba(217,119,6,.10);border-radius:8px;padding:10px 14px;margin:10px 0;line-height:1.55}",
    ".fu-good{border-left:4px solid var(--gain);background:rgba(22,163,74,.10);border-radius:8px;padding:10px 14px;margin:10px 0;line-height:1.55}",
    ".fu-bad{border-left:4px solid var(--loss);background:rgba(220,38,38,.09);border-radius:8px;padding:10px 14px;margin:10px 0;line-height:1.55}",
    ".fu-chk{font-size:12px;color:var(--muted);margin:8px 0 0}",
    ".fu-calc{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin:10px 0}",
    ".fu-calc label{display:grid;gap:4px;font-size:13px;color:var(--muted)}",
    ".fu-calc input,.fu-calc select{width:auto;min-width:110px;padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit}",
    ".fu-out{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0}",
    ".fu-out div{border:1px solid var(--line);border-radius:10px;background:var(--bg);padding:8px 14px;min-width:130px}",
    ".fu-out b{display:block;font-size:20px}.fu-out span{font-size:12px;color:var(--muted)}",
    ".fu-now{font-size:15px;line-height:1.5;margin:8px 0 12px;padding:10px 14px;border-radius:10px;border:1px solid var(--line);background:var(--bg)}",
    ".fu-now b{font-size:17px}",
    ".fu-strat{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}@media(max-width:900px){.fu-strat{grid-template-columns:1fr}}",
    ".fu-tbw{overflow-x:auto}",
    "#futv .zn-tb td:first-child{white-space:nowrap}",
    "#futv .zn-ck label{display:flex;flex-direction:row;align-items:flex-start;gap:10px;color:var(--ink);font-size:15px}#futv .zn-ck label span{color:var(--ink);flex:1}#futv .zn-ck input{flex:none;width:18px;height:18px;margin:2px 0 0}",
    "#futv .fu-chk a,#futv .zn-p a{color:var(--accent)}",
    "@media(max-width:700px){#futv,#futv .fu-card,#futv .zn-2>div{min-width:0;max-width:100%}#futv .zn-fig{overflow-x:auto;max-width:100%}#futv .zn-fig svg{min-width:620px}}"
  ].join("");

  var CON = [
    ["ES", "E-mini S&P 500", 0.25, 12.5, 50], ["MES", "Micro E-mini S&P 500", 0.25, 1.25, 5],
    ["NQ", "E-mini Nasdaq-100", 0.25, 5, 20], ["MNQ", "Micro E-mini Nasdaq-100", 0.25, 0.5, 2],
    ["YM", "E-mini Dow", 1, 5, 5], ["MYM", "Micro E-mini Dow", 1, 0.5, 0.5],
    ["RTY", "E-mini Russell 2000", 0.1, 5, 50], ["M2K", "Micro E-mini Russell 2000", 0.1, 0.5, 5],
    ["CL", "Crude oil", 0.01, 10, 1000], ["MCL", "Micro crude oil", 0.01, 1, 100],
    ["GC", "Gold", 0.1, 10, 100], ["MGC", "Micro gold", 0.1, 1, 10]
  ];
  var TABS = [["start", "Start here"], ["funded", "Funded accounts"], ["nt", "NinjaTrader"], ["copy", "Trade copying"], ["time", "Sessions & timing"], ["strat", "Strategies"], ["risk", "Risk & mindset"], ["tips", "Tips & mistakes"]];
  var ST = { tab: "start", con: "MES", ticks: 20, n: 2, budget: 200, master: 2, msize: 50 };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function money(x) { return "$" + (Math.round(x * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function conOf(k) { for (var i = 0; i < CON.length; i++) if (CON[i][0] === k) return CON[i]; return CON[1]; }
  function link(u, t) { return '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + t + "</a>"; }
  function checked(extra) { return '<p class="fu-chk">Last checked ' + CHECKED + (extra ? ". " + extra : "") + ". Firms change rules often: always confirm in your own account dashboard before you rely on this.</p>"; }

  /* ---------- Start here ---------- */
  function riskOut() {
    var c = conOf(ST.con), tickVal = c[3], perTick = ST.ticks * tickVal, risk = perTick * ST.n, maxN = perTick > 0 ? Math.floor(ST.budget / perTick) : 0;
    return '<div class="fu-out"><div><b>' + money(risk) + "</b><span>risk on this trade (" + ST.n + " x " + ST.ticks + " ticks)</span></div><div><b>" + money(perTick) + "</b><span>risk per contract</span></div><div><b>" + maxN + '</b><span>contracts that fit a ' + money(ST.budget) + " risk</span></div></div>";
  }
  function tStart() {
    var rows = CON.map(function (c) { return "<tr><td><b>" + c[0] + "</b></td><td>" + c[1] + "</td><td>" + c[2] + "</td><td>" + money(c[3]) + "</td><td>" + money(c[4]) + "</td></tr>"; }).join("");
    var opts = CON.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === ST.con ? " selected" : "") + ">" + c[0] + "</option>"; }).join("");
    return '<div class="fu-card"><h3>What futures are</h3><p class="zn-p">A futures contract is an agreement to buy or sell something at a set price later. Day traders never take delivery: they open a position and close it the same day, and the profit or loss is the price change times the contract\'s dollar value. The most traded are stock index futures (S&amp;P 500 as ES/MES, Nasdaq-100 as NQ/MNQ), plus crude oil (CL) and gold (GC).</p>' +
      '<div class="zn-2"><div><div class="zn-h3">Why traders like them</div><ul class="zn-p"><li>Nearly 24 hours a day, five days a week.</li><li>No pattern day trader rule, so no $25,000 minimum.</li><li>One market with a lot of volume (the S&amp;P 500), so fills are fast and clean.</li><li>Funded-account programs let you trade with the firm\'s rules instead of your own cash.</li><li>Simple costs: a small fee per contract.</li></ul></div>' +
      '<div><div class="zn-h3">What is different from stocks</div><ul class="zn-p"><li>You trade contracts, not shares, and each point is worth real dollars.</li><li>Leverage is built in, so a small move can be a big gain or loss.</li><li>Contracts expire (quarterly for index futures). Your platform rolls to the next one, usually about a week before.</li><li>Index futures react to news and data releases at set times, so timing matters more.</li><li>No gap-up scanner: you trade the same few markets every day.</li></ul></div></div></div>' +
      '<div class="fu-card"><h3>The contracts you will actually trade</h3><p class="zn-p">A <b>tick</b> is the smallest price move. The <b>tick value</b> is what one tick is worth per contract. Micros are one tenth the size of the E-minis, which is why most people start on them.</p><div class="fu-tbw"><table class="zn-tb"><tr><th>Symbol</th><th>Market</th><th>Tick size</th><th>Tick value</th><th>Per full point</th></tr>' + rows + "</table></div></div>" +
      '<div class="fu-card"><h3>Position size calculator</h3><p class="zn-p">Pick the contract, how many ticks away your stop is, and how many contracts you plan to trade. It shows the dollars at risk before you click buy.</p><div class="fu-calc"><label>Contract<select data-fu="con">' + opts + '</select></label><label>Stop distance (ticks)<input data-fu="ticks" type="number" min="1" step="1" value="' + ST.ticks + '"></label><label>Contracts<input data-fu="n" type="number" min="1" step="1" value="' + ST.n + '"></label><label>Risk budget per trade ($)<input data-fu="budget" type="number" min="1" step="10" value="' + ST.budget + '"></label></div><div id="fu-risk">' + riskOut() + '</div><p class="fu-chk">Tick values are exchange contract specs (CME). A 20-tick stop on MES is 5 points: 20 x $1.25 = $25 per contract.</p></div>' +
      '<div class="fu-warn"><b>Education only.</b> This page is general information about how futures and funded accounts work, not financial advice. Futures trading carries a high risk of loss, and most people who try funded evaluations do not get paid out.</div>';
  }

  /* ---------- Funded accounts ---------- */
  function ddSvg() {
    var W = 760, H = 300, L = 70, R = 24, T = 20, B = 36, xs = function (i) { return L + (W - L - R) * i / 9; };
    var bal = [50000, 50600, 51400, 51000, 52100, 51500, 52600, 51900, 52300, 52000], ysc = function (v) { return T + (H - T - B) * (1 - (v - 47000) / (53500 - 47000)); };
    var dd = 2500, thr = [], peak = 0, i, lock = 50100;
    for (i = 0; i < bal.length; i++) { peak = Math.max(peak, bal[i]); thr.push(Math.min(peak - dd, lock)); }
    function pts(a) { return a.map(function (v, k) { return xs(k).toFixed(1) + "," + ysc(v).toFixed(1); }).join(" "); }
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Example of a trailing drawdown: the loss limit rises as the account balance reaches new highs, then stops rising at the starting balance plus 100 dollars in a performance account">';
    [48000, 50000, 52000].forEach(function (v) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + ysc(v) + '" y2="' + ysc(v) + '" stroke="currentColor" opacity=".12"/><text class="zn-m" x="' + (L - 8) + '" y="' + (ysc(v) + 4) + '" text-anchor="end">' + money(v) + "</text>"; });
    s += '<polyline fill="none" stroke="#2563eb" stroke-width="2.5" points="' + pts(bal) + '"/><polyline fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6 4" points="' + pts(thr) + '"/>';
    s += '<text class="zn-h" x="' + xs(5.1) + '" y="' + (ysc(52900) - 6) + '" fill="#2563eb">Account balance</text>';
    s += '<text class="zn-h" x="' + xs(0.1) + '" y="' + (ysc(47500) + 20) + '" fill="#dc2626">Loss limit (threshold): breach it and the account fails</text>';
    s += '<text class="zn-m" x="' + xs(6.4) + '" y="' + (ysc(50100) - 8) + '">Stops rising here in a PA (start + $100)</text>';
    s += '<text class="zn-m" x="' + L + '" y="' + (H - 10) + '">Example: $50,000 account, $2,500 trailing drawdown. Illustrative numbers, check yours.</text></svg>';
    return '<figure class="zn-fig" style="margin:12px 0">' + s + '<figcaption>The loss limit climbs behind your highest balance. It never moves down, so giving back profits from a good day eats your cushion.</figcaption></figure>';
  }
  function tFunded() {
    return '<div class="fu-card"><h3>How a funded program works</h3><ol class="zn-steps"><li><b>Buy an evaluation.</b> You pay a fee and trade a simulated account with a profit target and loss limits.</li><li><b>Pass it.</b> Reach the target without breaking the drawdown, daily loss or contract rules, and any minimum-day rules.</li><li><b>Activate a funded account.</b> At Apex this is called a Performance Account (PA), which has an activation fee. It is still a simulated account in most programs, but real payouts are paid from the firm.</li><li><b>Trade by the rules and request payouts.</b> Payouts have minimums, minimum trading days and caps.</li></ol><div class="fu-warn">The firm earns from evaluation and activation fees, not from your trading, so the business model works even when most people fail. Treat the fee as the cost of a lottery-style ticket you are trying to beat, and size it against what you can afford to lose.</div></div>' +
      '<div class="fu-card"><h3>Apex Trader Funding: the rules that matter</h3><div class="fu-tbw"><table class="zn-tb"><tr><th>Topic</th><th>What third-party guides report</th></tr>' +
      "<tr><td>Evaluation</td><td>30 calendar days to hit the profit target without breaking the drawdown. The fee is one time. Failing means buying a new evaluation (no resets on current plans).</td></tr>" +
      "<tr><td>Profit targets</td><td>$1,500 (25K), $3,000 (50K), $6,000 (100K), $9,000 (150K).</td></tr>" +
      "<tr><td>Drawdown</td><td>Two styles. <b>EOD trail</b> recalculates once a day from the closing balance. <b>Intraday trail</b> follows your peak balance, including open profit, so a trade that goes green then red still ratchets the limit up. In a PA both stop trailing at starting balance + $100.</td></tr>" +
      "<tr><td>Daily loss limit</td><td>Fixed amount on EOD evaluations only. PAs use profit-based tiers (a starting 50K PA is around $1,000). Hitting it pauses you until the next session.</td></tr>" +
      "<tr><td>Contracts</td><td>Evaluations allow 4, 6, 8 or 12 contracts by account size. PAs start at 1 to 4 and scale up as you build profit.</td></tr>" +
      "<tr><td>Consistency</td><td>None in evaluations. In a PA, no single winning day can be half or more of profit since your last payout (some guides cite 30% on older accounts). Stay well under it.</td></tr>" +
      "<tr><td>Payouts</td><td>Up to weekly, 100% split, $500 minimum, at least 5 qualifying days, and a cap of 6 payouts per PA. Caps rise with each payout.</td></tr>" +
      "<tr><td>Flat by</td><td>All positions closed before 4:59 PM ET. Trading resumes at 6:00 PM ET.</td></tr>" +
      "<tr><td>News</td><td>Allowed as part of a normal strategy. Chasing the market or betting both sides of a release is prohibited.</td></tr>" +
      "<tr><td>Banned</td><td>Hedging (long and short correlated products, or opposite directions across your accounts), bots and fully automated systems, someone else trading your account.</td></tr></table></div>" +
      checked("Compiled from " + link("https://www.tradervana.com/guides/apex-trader-funding-rules", "Tradervana") + " (updated Oct 22, 2026). Sources disagree on a few details, such as 30% versus 50% consistency, which is why you should check Apex's help center") + "</div>" +
      '<div class="fu-card"><h3>The trailing drawdown, shown</h3><p class="zn-p">This is the rule that ends most accounts. Your loss limit is not a fixed number: it rises as your balance makes new highs.</p>' + ddSvg() +
      '<div class="fu-good"><b>How to use it:</b> after a good day, your cushion is whatever is left between your balance and the threshold. Trade smaller, not bigger, when you are close to it.</div></div>' +
      '<div class="fu-card"><h3>Other funded firms</h3><p class="zn-p">Apex is one of many. They differ in drawdown type, consistency rules, payout speed and copying rules, so compare before you buy. This is what one 2026 summary reports about each:</p><div class="fu-tbw"><table class="zn-tb"><tr><th>Firm</th><th>Copying and account notes</th></tr>' +
      "<tr><td>Apex</td><td>Up to 20 active PAs. Copying across your own accounts is generally tolerated; third-party control and bots are banned.</td></tr>" +
      "<tr><td>Topstep</td><td>Own trading platform option (TopstepX). Account cap reported at 5 funded accounts.</td></tr>" +
      "<tr><td>Take Profit Trader</td><td>Bans opposite positions across accounts, including ES versus MES. Five active funded accounts.</td></tr>" +
      "<tr><td>Tradeify</td><td>Built-in group trading on Tradovate for up to 5 accounts. Profit rules around trades held more than 10 seconds.</td></tr>" +
      "<tr><td>FundedNext Futures</td><td>Copying only between your own challenge accounts, local copier only, combined size capped.</td></tr>" +
      "<tr><td>Alpha Futures</td><td>One person copying their own listed accounts. Automation, group trading and reverse trading are banned.</td></tr>" +
      "<tr><td>Lucid Trading</td><td>Copiers allowed under general rules. You are responsible for software errors.</td></tr></table></div>" +
      checked("From " + link("https://damnpropfirms.com/blog/trade-copying-rules-for-futures-prop-firms/", "DamnPropFirms") + " (updated July 2026)") + "</div>" +
      '<div class="fu-card"><h3>Before you buy any evaluation</h3><div class="zn-ck">' +
      ["Do I understand whether the drawdown is end-of-day or intraday?", "Do I know the exact daily loss limit and the contract limit on this account?", "Does it have a consistency rule, and what are the numbers?", "What are the activation fee, monthly fee and payout minimums?", "When must I be flat, and are there news restrictions?", "Is the fee money I can afford to lose?"].map(function (t) { return '<label><input type="checkbox"><span>' + t + "</span></label>"; }).join("") + "</div></div>";
  }

  /* ---------- NinjaTrader ---------- */
  function tNt() {
    return '<div class="fu-card"><h3>How the pieces connect</h3><p class="zn-p">NinjaTrader is the software you trade in. The funded firm gives you credentials for a <b>data and order connection</b>, and NinjaTrader uses them to show live prices and send your orders. Apex has supported connections such as Rithmic and Tradovate, so open your Apex dashboard to see which one your account uses and copy the login details from there.</p><ol class="zn-steps">' +
      "<li><b>Install NinjaTrader 8</b> and sign in with your NinjaTrader account (the free version has simulation and charting).</li>" +
      "<li><b>Add the connection.</b> In Control Center, open Connections and choose Configure. Add the provider your firm uses, enter the user name and password from your firm dashboard, and connect.</li>" +
      "<li><b>Confirm the account.</b> Your funded or evaluation account should appear in the Accounts tab. If you can't see it, the connection or login is the problem, not the platform.</li>" +
      "<li><b>Open a chart</b> of the contract you trade (for example MES) and set the time frame you use. Futures show the front month; roll to the next contract when volume moves.</li>" +
      "<li><b>Test everything in Sim first</b> (the built-in Sim101 account). Place, move and cancel orders until it is muscle memory.</li></ol>" +
      '<div class="fu-warn">Many firms require you to be flat before the close and cap your contracts. NinjaTrader will let you break those rules, so set your own limits first.</div></div>' +
      '<div class="zn-2"><div class="fu-card"><h3>Tools worth learning</h3><ul class="zn-p"><li><b>Chart Trader:</b> click on the chart to place, drag and cancel orders at a price.</li><li><b>SuperDOM:</b> the order ladder, for fast entries and seeing resting orders.</li><li><b>ATM strategies:</b> save a stop and target template that attaches automatically to each entry. This is the single biggest safety feature.</li><li><b>Chart templates:</b> save your indicators (9 EMA, VWAP, prior-day levels) so every chart looks the same.</li><li><b>Hotkeys:</b> flatten everything, move stop to break even, reverse.</li><li><b>Account Performance:</b> a trade log so you can review by time of day and setup.</li></ul></div>' +
      '<div class="fu-card"><h3>Setup you should always do</h3><ul class="zn-p"><li>Build an ATM strategy with a stop on every order. Never enter without one.</li><li>Set a quantity that matches your risk budget (use the calculator on Start here).</li><li>Turn on order confirmation until you trust your hotkeys.</li><li>Add the sessions to the chart (RTH versus overnight) so you see opening range levels.</li><li>Keep a Flatten Everything button within reach.</li><li>Enable your firm\'s daily loss warning, or set a platform loss limit if available.</li></ul></div></div>' +
      '<div class="fu-card"><h3>Common NinjaTrader problems</h3><ul class="zn-p"><li><b>Not connected / no data:</b> your login, the wrong provider, or a connection already open on another computer.</li><li><b>Orders do not attach stops:</b> you traded without selecting your ATM template.</li><li><b>Wrong contract month:</b> you are on an expired or illiquid contract. Check the symbol name.</li><li><b>Different charts after reopening:</b> save a workspace and a chart template.</li></ul>' + checked("Menu names can differ between versions") + "</div>";
  }

  /* ---------- Trade copying ---------- */
  function copyOut() {
    var sizes = [25, 50, 100, 150], rows = sizes.map(function (s) {
      var m = s / ST.msize, n = ST.master * m, rn = Math.max(1, Math.round(n));
      return "<tr><td>" + s + "K account</td><td>" + (Math.round(m * 100) / 100) + "x</td><td>" + (Math.round(n * 100) / 100) + "</td><td><b>" + rn + "</b></td></tr>";
    }).join("");
    return '<table class="zn-tb"><tr><th>Follower</th><th>Multiplier</th><th>Exact size</th><th>Round to</th></tr>' + rows + "</table>";
  }
  function tCopy() {
    var so = [25, 50, 100, 150].map(function (s) { return '<option value="' + s + '"' + (s === ST.msize ? " selected" : "") + ">" + s + "K</option>"; }).join("");
    return '<div class="fu-card"><h3>What trade copying is</h3><p class="zn-p">You trade one <b>master</b> account. A copier software watches it and sends the same orders to your <b>follower</b> accounts, so one decision can be placed in several funded accounts at once. It saves clicks and removes the delay of entering each account by hand.</p><div class="fu-good"><b>The rule everywhere:</b> you must still be the one making the decisions. Copying between accounts you own is commonly allowed. Paying someone else to trade your account, or copying from a signal service, is banned almost everywhere.</div></div>' +
      '<div class="fu-card"><h3>The tools</h3><ul class="zn-p"><li><b>NinjaTrader copy tools:</b> NinjaTrader has a trade copier add-on and a marketplace of third-party ones. Check what your version offers.</li><li><b>Third-party copiers:</b> Replikanto, Tradesyncer, Copilink, Tradecopia and others. Some run on your computer (fast, about 1 to 3 ms) and some in the cloud (about 100 ms).</li><li><b>Firm-native tools:</b> some platforms (Tradeify, TopstepX) offer built-in group trading.</li><li><b>A VPS</b> (a rented computer in Chicago) keeps a local copier running and fast, and avoids your home internet dropping.</li></ul></div>' +
      '<div class="fu-card"><h3>Sizing followers</h3><p class="zn-p">Follower accounts are rarely the same size. Use a multiplier so risk scales with the account, instead of copying a fixed contract count everywhere.</p><div class="fu-calc"><label>Master account<select data-fu="msize">' + so + '</select></label><label>Master contracts<input data-fu="master" type="number" min="1" step="1" value="' + ST.master + '"></label></div><div id="fu-copy">' + copyOut() + '</div><p class="fu-chk">Always check each follower\'s current contract limit. Early in a funded account the cap can be lower than this multiplier suggests.</p></div>' +
      '<div class="fu-card"><h3>How copying gets accounts banned or failed</h3><ul class="zn-p"><li><b>Hedging across accounts:</b> one account long ES while another is short NQ or MES is treated as hedging, even if each account looks fine alone.</li><li><b>Same size everywhere:</b> newer accounts hit lower contract caps than your master.</li><li><b>Consistency rules per account:</b> one huge winner copied to ten accounts can break the rule on all ten at once.</li><li><b>Someone else in control:</b> signal services or a person trading your accounts.</li><li><b>Bots:</b> a copier that you operate is different from a fully automated strategy, but wording differs by firm. If unsure, email support first and keep the reply.</li><li><b>Copying across different firms:</b> some firms are fine with it, some are not, and none will tell you after the fact. Read both rule sets.</li><li><b>Account limits:</b> Apex has a cap of about 20 active PAs. Creating extra user accounts to get around it is bannable.</li></ul></div>' +
      '<div class="fu-card"><h3>Safe setup checklist</h3><div class="zn-ck">' + ["All accounts are in my own name and I make every trading decision.", "I read the copy-trading section of every firm's rules.", "I use multipliers per account size, not one fixed contract count.", "All accounts trade the same direction on correlated products.", "I tested on sim accounts first and checked that stops copy too.", "I have a flatten-everything button for all accounts.", "I reconcile positions at the end of every day."].map(function (t) { return '<label><input type="checkbox"><span>' + t + "</span></label>"; }).join("") + "</div>" +
      checked("Sources: " + link("https://damnpropfirms.com/blog/trade-copying-rules-for-futures-prop-firms/", "DamnPropFirms") + " and " + link("https://blog.pickmytrade.io/apex-copy-trading-rules-account-failed/", "PickMyTrade") + ", which sells copier software. Apex has not published a blanket approval of copier software, so confirm with their support") + "</div>";
  }

  /* ---------- Sessions & timing ---------- */
  function etNow() {
    try {
      var p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()), o = {};
      p.forEach(function (x) { o[x.type] = x.value; });
      var h = parseInt(o.hour, 10) % 24, m = parseInt(o.minute, 10); return { day: o.weekday, min: h * 60 + m, h: h, m: m };
    } catch (e) { return null; }
  }
  function zoneOf(min, day) {
    if (day === "Sat" || (day === "Sun" && min < 18 * 60)) return ["Closed", "Futures are closed for the weekend. They reopen Sunday at 6:00 PM ET.", "fu-bad"];
    if (day === "Fri" && min >= 17 * 60) return ["Closed", "Futures are closed for the weekend. They reopen Sunday at 6:00 PM ET.", "fu-bad"];
    if (min >= 17 * 60 && min < 18 * 60) return ["Daily break", "The daily maintenance break (5:00 to 6:00 PM ET). Most funded firms need you flat well before this.", "fu-bad"];
    if (min >= 16 * 60 + 59 || min < 3 * 60) return ["Thin overnight market", "Low volume and sudden moves. Funded firms usually have you flat by 4:59 PM ET, so this is mostly not for you.", "fu-warn"];
    if (min < 8 * 60) return ["Early (London) session", "Volume picks up around 3:00 AM ET. Fine for experienced traders, but spreads and moves are less reliable.", "fu-warn"];
    if (min < 8 * 60 + 25) return ["Pre-data", "Data comes at 8:30. Many traders stay out until it passes.", "fu-warn"];
    if (min < 8 * 60 + 40) return ["Data release window", "8:30 data (CPI, jobs, jobless claims) can spike price. Avoid unless you know why you are there.", "fu-bad"];
    if (min < 9 * 60 + 30) return ["Pre-market", "Build your levels: overnight high and low, prior day high and low, and where VWAP will start.", "fu-warn"];
    if (min < 9 * 60 + 35) return ["The open", "Wide, fast and noisy. Many traders wait for the first 5 to 15 minutes before trading.", "fu-warn"];
    if (min < 11 * 60 + 30) return ["Prime time", "The best window for index futures: highest volume and cleaner trends and pullbacks.", "fu-good"];
    if (min < 13 * 60 + 30) return ["Lunch chop", "Volume dries up and price drifts or whips. Most traders trade smaller or sit out.", "fu-warn"];
    if (min < 14 * 60 - 5) return ["Afternoon rebuild", "Volume starts to return. A trend that started in the morning can resume.", "fu-warn"];
    if (min < 14 * 60 + 15) return ["Possible Fed time", "On Fed days the 2:00 PM announcement can whip price in both directions. Be flat.", "fu-bad"];
    if (min < 15 * 60) return ["Afternoon", "Moderate volume. Wait for clear setups.", "fu-warn"];
    if (min < 15 * 60 + 50) return ["Power hour", "A second burst of volume. Good moves but reversals too. Remember your flat-by time.", "fu-good"];
    return ["Closing", "Close out and be flat before your firm's deadline (Apex: before 4:59 PM ET).", "fu-bad"];
  }
  function timeSvg() {
    var W = 900, H = 230, L = 24, R = 24, a = 8 * 60, b = 17 * 60, X = function (m) { return L + (W - L - R) * (m - a) / (b - a); };
    var bands = [[8 * 60, 9 * 60 + 30, "#9ca3af", ".18", "Pre-market"], [9 * 60 + 30, 11 * 60 + 30, "#16a34a", ".30", "PRIME TIME"], [11 * 60 + 30, 13 * 60 + 30, "#d97706", ".28", "Lunch chop"], [13 * 60 + 30, 15 * 60, "#9ca3af", ".18", "Afternoon"], [15 * 60, 16 * 60, "#16a34a", ".22", "Power hour"], [16 * 60, 17 * 60, "#dc2626", ".20", "Be flat"]];
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Eastern time schedule from 8 AM to 5 PM showing prime time 9:30 to 11:30, lunch chop 11:30 to 1:30, power hour 3 to 4, and key news times">';
    bands.forEach(function (x) { s += '<rect x="' + X(x[0]) + '" y="70" width="' + (X(x[1]) - X(x[0])) + '" height="60" fill="' + x[2] + '" opacity="' + x[3] + '"/><text class="zn-h" x="' + (X(x[0]) + (X(x[1]) - X(x[0])) / 2) + '" y="105" text-anchor="middle">' + x[4] + "</text>"; });
    for (var h = 8; h <= 17; h++) s += '<line x1="' + X(h * 60) + '" x2="' + X(h * 60) + '" y1="130" y2="138" stroke="currentColor" opacity=".5"/><text class="zn-m" x="' + X(h * 60) + '" y="154" text-anchor="middle">' + (h > 12 ? h - 12 : h) + (h < 12 ? " AM" : " PM") + "</text>";
    var ev = [[8 * 60 + 30, "8:30 data", 0], [9 * 60 + 30, "9:30 open", 1], [10 * 60, "10:00 data", 0], [10 * 60 + 30, "Wed 10:30 oil", 1], [14 * 60, "2:00 Fed", 0], [16 * 60 + 59, "4:59 flat", 1]];
    ev.forEach(function (e) { var y = e[2] ? 28 : 52; s += '<line x1="' + X(e[0]) + '" x2="' + X(e[0]) + '" y1="' + (y + 4) + '" y2="130" stroke="#dc2626" stroke-dasharray="3 3" opacity=".7"/><text class="zn-t" x="' + X(e[0]) + '" y="' + y + '" text-anchor="middle">' + e[1] + "</text>"; });
    s += '<text class="zn-m" x="' + L + '" y="' + (H - 18) + '">All times Eastern. Red dashed lines are scheduled events. Fed and oil only matter on those days.</text></svg>';
    return '<figure class="zn-fig" style="margin:10px 0">' + s + "</figure>";
  }
  function nowHtml() {
    var n = etNow(); if (!n) return "";
    var z = zoneOf(n.min, n.day), h = n.h % 12 || 12, t = h + ":" + (n.m < 10 ? "0" : "") + n.m + (n.h < 12 ? " AM" : " PM");
    return '<div class="fu-now ' + z[2] + '"><b>Right now: ' + esc(z[0]) + "</b> (" + esc(n.day) + " " + t + " ET)<br>" + esc(z[1]) + "</div>";
  }
  function tTime() {
    return '<div class="fu-card"><h3>Where the market is right now</h3><div id="fu-now">' + nowHtml() + "</div>" + timeSvg() + "</div>" +
      '<div class="fu-card"><h3>Trading hours</h3><ul class="zn-p"><li><b>Global session:</b> Sunday 6:00 PM ET to Friday 5:00 PM ET, with a one-hour break each day from 5:00 to 6:00 PM ET.</li><li><b>Regular hours (RTH):</b> 9:30 AM to 4:00 PM ET. This is when the stock market is open and index futures see the most volume.</li><li><b>Funded accounts:</b> most require you flat before the close. Apex lists 4:59 PM ET.</li><li><b>Contract rollover:</b> index futures expire in March, June, September and December. Traders move to the next contract about a week before.</li></ul></div>' +
      '<div class="zn-2"><div class="fu-card"><h3>The best times to trade</h3><ul class="zn-p"><li><b>9:30 to 11:30 AM:</b> highest volume and the cleanest moves. Most of the day\'s range is made here. If you can only trade 2 hours, trade these.</li><li><b>3:00 to 4:00 PM:</b> a second wave of volume. Good for trend-continuation, but reversals happen fast and you must be flat by your deadline.</li><li><b>First 5 to 15 minutes after the open:</b> a lot of traders wait, then trade the first pullback or the break of the opening range.</li></ul></div>' +
      '<div class="fu-card"><h3>Times to avoid or trade small</h3><ul class="zn-p"><li><b>8:30 AM data (CPI, jobs report, jobless claims):</b> price can jump several points in seconds. Stay out a few minutes before and after.</li><li><b>10:00 AM data:</b> a second wave of reports (ISM, consumer confidence, etc).</li><li><b>2:00 PM on Fed days:</b> violent in both directions. Be flat.</li><li><b>11:30 AM to 1:30 PM:</b> the lunch chop that turns clean setups into stop-outs.</li><li><b>The last few minutes before your flat-by time:</b> do not start a new trade.</li><li><b>Overnight:</b> thin liquidity, jumps on headlines. Not for most funded-account traders.</li></ul></div></div>' +
      '<div class="fu-card"><h3>Events to check every morning</h3><div class="fu-tbw"><table class="zn-tb"><tr><th>When</th><th>What</th><th>Why it matters</th></tr><tr><td>8:30 AM</td><td>CPI, jobs, jobless claims, GDP</td><td>Biggest scheduled movers for ES and NQ</td></tr><tr><td>10:00 AM</td><td>ISM, consumer confidence, new home sales</td><td>Medium impact</td></tr><tr><td>Wed 10:30 AM</td><td>Crude oil inventories</td><td>CL moves hard</td></tr><tr><td>2:00 PM</td><td>FOMC rate decision (on Fed days)</td><td>Can reverse the day</td></tr><tr><td>2:30 PM</td><td>Fed chair press conference</td><td>A second whipsaw</td></tr></table></div><p class="zn-p">Check an economic calendar before you trade. The News page in Revatour is a good place to add one.</p>' + checked("Typical event times; the exact schedule changes each week") + "</div>";
  }

  /* ---------- Strategies ---------- */
  function orbSvg() {
    var W = 760, H = 250, s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Opening range breakout: price makes a range in the first 15 minutes, breaks above it, and the stop goes back inside the range">';
    var C = [[40, 70, 52, 66], [66, 82, 60, 64], [64, 72, 54, 70], [70, 80, 62, 66], [66, 70, 58, 68], [68, 78, 66, 76], [76, 92, 74, 90], [90, 104, 86, 100], [100, 112, 96, 98], [98, 118, 96, 116]], x0 = 90, dx = 58, Y = function (v) { return 235 - v * 1.9; };
    s += '<rect x="' + (x0 - 18) + '" y="' + Y(82) + '" width="' + (dx * 5 + 18) + '" height="' + (Y(54) - Y(82)) + '" fill="#9ca3af" opacity=".18"/><text class="zn-h" x="' + (x0 - 12) + '" y="' + (Y(82) - 6) + '">Opening range (first 15 min)</text>';
    s += '<line x1="' + (x0 - 18) + '" x2="' + (W - 20) + '" y1="' + Y(82) + '" y2="' + Y(82) + '" stroke="#16a34a" stroke-dasharray="5 4"/><line x1="' + (x0 - 18) + '" x2="' + (W - 20) + '" y1="' + Y(54) + '" y2="' + Y(54) + '" stroke="#dc2626" stroke-dasharray="5 4"/>';
    C.forEach(function (c, i) { var x = x0 + i * dx, up = c[3] >= c[0], col = up ? "#16a34a" : "#dc2626"; s += '<line x1="' + x + '" x2="' + x + '" y1="' + Y(c[1]) + '" y2="' + Y(c[2]) + '" stroke="' + col + '" stroke-width="2"/><rect x="' + (x - 11) + '" y="' + Y(Math.max(c[0], c[3])) + '" width="22" height="' + Math.max(3, Math.abs(Y(c[0]) - Y(c[3]))) + '" fill="' + col + '"/>'; });
    s += '<text class="zn-h" x="' + (x0 + 6 * dx - 20) + '" y="' + (Y(92) - 16) + '" fill="#16a34a">Entry: breaks above the range</text><text class="zn-m" x="' + (x0 + 6 * dx - 20) + '" y="' + (Y(54) + 18) + '">Stop: back inside the range</text></svg>';
    return '<figure class="zn-fig" style="margin:10px 0">' + s + '<figcaption>Idea only (not real data). The opening range is the high and low of the first 5, 15 or 30 minutes.</figcaption></figure>';
  }
  function card(t, body) { return '<div class="fu-card"><h3>' + t + "</h3>" + body + "</div>"; }
  function tStrat() {
    return '<div class="fu-card"><h3>First, decide what kind of day it is</h3><p class="zn-p">Most losses come from using a trend strategy on a range day or the reverse. By 10:00 AM, ask: is price making higher highs (or lower lows) with small pullbacks that hold the 9 EMA, or is it overlapping candles chopping around VWAP?</p><div class="zn-2"><div class="fu-good"><b>Trend day:</b> price stays on one side of VWAP, pullbacks are shallow and hold the 9 EMA. Trade pullbacks and breakouts with the trend.</div><div class="fu-warn"><b>Range day:</b> price crosses VWAP often, candles overlap. Trade the edges of the range, or do nothing.</div></div></div>' +
      '<div class="fu-strat">' +
      card("1. Opening range breakout", '<p class="zn-p">Mark the high and low of the first 5, 15 or 30 minutes. Trade the first clean break and retest of one side.</p><ul class="zn-p"><li><b>Entry:</b> a candle closes outside the range, then a pullback that holds the edge.</li><li><b>Stop:</b> back inside the range, or beyond the pullback low.</li><li><b>Target:</b> 1.5 to 2 times the risk, or the next level.</li><li><b>Skip it when:</b> the range is huge (the stop is too far) or the first break fails immediately.</li></ul>' + orbSvg()) +
      card("2. 9 EMA pullback (your FP9 idea)", '<p class="zn-p">In a trend, price pulls back to the 9 EMA and a small candle holds it. You buy the break of that candle (a short is the mirror).</p><ul class="zn-p"><li><b>Entry:</b> break of the small trigger candle at the EMA.</li><li><b>Stop:</b> just beyond the trigger candle.</li><li><b>Target:</b> the previous high or low, then trail.</li><li><b>Skip it when:</b> the EMA is flat, price keeps crossing it, or it is lunch.</li></ul><div class="fu-good">This is the same logic as FP9-A in Practice charts. Use that page to train your eye, then look for it on a 1 or 2 minute MES chart.</div>') +
      card("3. VWAP pullback", '<p class="zn-p">VWAP is the day\'s average price weighted by volume. In a trend, price dips to VWAP, stalls, then continues.</p><ul class="zn-p"><li><b>Entry:</b> a small candle holds VWAP and the next candle breaks its high (for longs).</li><li><b>Stop:</b> a few ticks beyond VWAP.</li><li><b>Target:</b> the day\'s high or low.</li><li><b>Skip it when:</b> price has crossed VWAP three or more times, which says the day is a range.</li></ul>') +
      card("4. Failed breakout (reversal at a level)", '<p class="zn-p">Price pokes above a clear level (prior-day high, overnight high, opening range high) and cannot hold. Trapped buyers become sellers.</p><ul class="zn-p"><li><b>Entry:</b> price closes back below the level, then breaks the next small low (the mirror at lows).</li><li><b>Stop:</b> above the failed high.</li><li><b>Target:</b> back to VWAP or the middle of the range.</li><li><b>Skip it when:</b> it is a news-driven trend and nothing has stalled.</li></ul>') +
      card("5. SL-1-RV 2' short and long", '<p class="zn-p">Your own setups from the Practice charts page. The short is the first new low after a run of higher highs, then a green candle and a small trigger. The long is the mirror.</p><ul class="zn-p"><li>Shorts: only above VWAP with 2R or more of room to VWAP.</li><li>Longs: more common when price is below VWAP.</li><li>Stop is 2 cents (or 2 ticks on futures) beyond the trigger candle.</li></ul>') +
      card("6. Levels that count", '<p class="zn-p">Reactions happen at levels the whole market sees. Mark these every morning:</p><ul class="zn-p"><li>Prior day high, low and close</li><li>Overnight high and low</li><li>Opening range high and low</li><li>VWAP and the 9 EMA</li><li>Round numbers (for example 6000 on ES)</li></ul>') +
      "</div>" + '<div class="fu-warn">None of these is guaranteed. Test every strategy on simulated or tiny size first and keep a journal of your results by setup and time of day.</div>';
  }

  /* ---------- Risk ---------- */
  function tRisk() {
    return '<div class="fu-card"><h3>The rules that keep a funded account alive</h3><ol class="zn-steps"><li><b>Risk a small slice per trade.</b> A common guide is about 5 to 10% of your drawdown cushion, not of the whole account. On a $2,500 drawdown, that is $125 to $250.</li><li><b>Set a max daily loss below the firm\'s limit.</b> If the firm cuts you at $1,000, stop at $400 to $500. Your rule has to fire first.</li><li><b>Size from your stop, not your hope.</b> Decide the stop distance, then the contracts. Never widen a stop to avoid a loss.</li><li><b>Stop after two or three losses in a row.</b> Revenge trading is how one bad hour ruins a week.</li><li><b>Take profits on good days and stop.</b> A trailing drawdown rises with your highs. Protect the cushion you just built.</li><li><b>Scale up slowly.</b> Add contracts only after several profitable days and when the firm\'s scaling rules allow it.</li></ol></div>' +
      '<div class="zn-2"><div class="fu-card"><h3>Think of it as a business</h3><ul class="zn-p"><li>The fee is the cost of a job interview. Budget for several tries.</li><li>Your goal in an evaluation is to not fail first, and passing is a side effect.</li><li>A payout is the result of many boring, small, repeatable days.</li><li>Track your win rate, average winner, average loser and the time of day you make money.</li></ul></div>' +
      '<div class="fu-card"><h3>Common mindset traps</h3><ul class="zn-p"><li><b>"It is only a sim account":</b> the habits you build are the same ones you carry to real money.</li><li><b>Going big when close to the target:</b> the most common way evaluations fail.</li><li><b>Chasing the first move:</b> wait for your setup.</li><li><b>Trading to "make it back":</b> stop for the day.</li><li><b>Over-trading the lunch chop:</b> boredom is not a signal.</li></ul></div></div>' +
      '<div class="fu-card"><h3>Daily routine</h3><div class="zn-ck">' + ["Checked the economic calendar for 8:30, 10:00 and 2:00 events.", "Marked prior day high/low, overnight high/low and VWAP.", "Wrote down my max daily loss and my max trades.", "ATM strategy loaded with a stop and target.", "Know my flat-by time (Apex: before 4:59 PM ET).", "Plan to trade only my setups, and only in prime time unless a setup is clear."].map(function (t) { return '<label><input type="checkbox"><span>' + t + "</span></label>"; }).join("") + "</div></div>";
  }

  /* ---------- Tips ---------- */
  function tTips() {
    return '<div class="zn-2"><div class="fu-card"><h3>Tips that help</h3><ul class="zn-p"><li>Trade one market (MES or MNQ) until you know its rhythm.</li><li>Start with micros, even on a funded account.</li><li>Put the stop in as you enter, every time.</li><li>Trade fewer, better setups. Two good trades beat ten average ones.</li><li>Keep a screenshot journal with entry, stop and reason.</li><li>Review your trades by time of day. Many traders find they make money in one window and lose in the rest.</li><li>Know your firm\'s flat-by time and set an alarm 10 minutes before.</li><li>Practice a setup in the Practice charts page until you can find it fast.</li></ul></div>' +
      '<div class="fu-card"><h3>Mistakes to avoid</h3><ul class="zn-p"><li>Buying an evaluation, then trading the first day with too many contracts.</li><li>Not knowing whether the drawdown is intraday or end-of-day.</li><li>Holding through a major report.</li><li>Copying one oversized winner to many accounts and breaking consistency.</li><li>Hedging one account against another.</li><li>Moving or removing the stop.</li><li>Trading after hitting your loss limit.</li><li>Forgetting the contract has rolled to a new month.</li></ul></div></div>' +
      '<div class="fu-card"><h3>Glossary</h3><div class="fu-tbw"><table class="zn-tb"><tr><th>Term</th><th>Meaning</th></tr><tr><td>Tick</td><td>Smallest price move of a contract</td></tr><tr><td>Point</td><td>One whole number of price (4 ticks on ES)</td></tr><tr><td>Micro</td><td>A contract one tenth the size of the E-mini</td></tr><tr><td>RTH</td><td>Regular trading hours, 9:30 AM to 4:00 PM ET</td></tr><tr><td>ETH</td><td>Electronic (overnight) trading hours</td></tr><tr><td>Drawdown</td><td>How far your account can fall from its high</td></tr><tr><td>Trailing drawdown</td><td>A loss limit that moves up with your peak balance</td></tr><tr><td>PA</td><td>Performance account (Apex\'s funded stage)</td></tr><tr><td>ATM</td><td>NinjaTrader\'s automatic stop and target attachment</td></tr><tr><td>Master / follower</td><td>The account you trade and the accounts that copy it</td></tr><tr><td>Rollover</td><td>Moving to the next contract month before expiry</td></tr><tr><td>R</td><td>Your risk per trade. A 2R win makes twice what you risked.</td></tr></table></div></div>';
  }

  var BODY = { start: tStart, funded: tFunded, nt: tNt, copy: tCopy, time: tTime, strat: tStrat, risk: tRisk, tips: tTips };
  var host = null, timer = null;

  function render() {
    if (!host) return;
    var tabs = TABS.map(function (t) { return '<button type="button" data-futab="' + t[0] + '" class="' + (t[0] === ST.tab ? "on" : "") + '">' + t[1] + "</button>"; }).join("");
    host.innerHTML = "<h1>Futures</h1><p class=\"hint\">Futures day trading, funded accounts (Apex and others), NinjaTrader, trade copying, and the times that matter. General education, not advice.</p><div class=\"fu-tabs\">" + tabs + "</div><div id=\"fu-body\">" + BODY[ST.tab]() + "</div>";
  }
  function onInput(e) {
    var k = e.target.getAttribute && e.target.getAttribute("data-fu"); if (!k) return;
    var v = e.target.value; if (k === "con") ST.con = v; else ST[k] = Math.max(0, parseFloat(v) || 0);
    var r = host.querySelector("#fu-risk"), c = host.querySelector("#fu-copy"); if (r) r.innerHTML = riskOut(); if (c) c.innerHTML = copyOut();
  }
  function onClick(e) {
    var b = e.target.closest && e.target.closest("[data-futab]"); if (!b) return;
    ST.tab = b.getAttribute("data-futab"); render(); window.scrollTo(0, 0);
  }
  function tick() { var n = host && host.querySelector("#fu-now"); if (n) n.innerHTML = nowHtml(); }

  var api = {
    mount: function (el) {
      if (!document.getElementById("fu-css")) { var s = document.createElement("style"); s.id = "fu-css"; s.textContent = CSS; document.head.appendChild(s); }
      if (host !== el) { host = el; el.addEventListener("input", onInput); el.addEventListener("change", onInput); el.addEventListener("click", onClick); }
      render(); if (timer) clearInterval(timer); timer = setInterval(tick, 30000);
    },
    _st: ST, _zone: zoneOf
  };
  root.FuturesPage = api;
})(window);
