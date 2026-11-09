// api/read.js — signed-in users send up to 6 {sym, iv} chart requests; we pull recent candles, compute levels
// (VWAP, EMAs, prior-day and session highs and lows, swing pivots, ATR) and ask Claude for a plain-English read:
// bias, support, resistance, trigger, target and where the idea is wrong. Needs ANTHROPIC_API_KEY, SUPABASE_URL,
// SUPABASE_ANON_KEY. Optional: ALLOWED_EMAILS, ANTHROPIC_MODEL. Candles come from Yahoo Finance's public chart feed
// (free, may be delayed, unofficial). Educational scenarios only, not advice.

const IV = { '1': ['1m', '1d'], '2': ['2m', '1d'], '5': ['5m', '5d'], '15': ['15m', '5d'], '60': ['60m', '1mo'], D: ['1d', '1y'], W: ['1wk', '5y'] };
const cache = new Map(); // key -> { t, data }
const TTL = 45 * 1000;

const r2 = (x) => (isFinite(x) ? Math.round(x * 100) / 100 : null);
function ema(v, n) { const k = 2 / (n + 1); let e = null; const out = []; v.forEach((x) => { e = e == null ? x : x * k + e * (1 - k); out.push(e); }); return out; }
function parseJson(t) { const s = String(t || '').replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim(); const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } }
const nyDay = (ts) => new Date(ts * 1000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

async function yahoo(sym, interval, range) {
  const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=${interval}&range=${range}&includePrePost=false`;
  const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Stockspot)', Accept: 'application/json' } });
  if (!r.ok) throw new Error('feed ' + r.status);
  const j = await r.json(); const c = j && j.chart && j.chart.result && j.chart.result[0];
  if (!c || !c.timestamp) throw new Error('no data');
  const q = c.indicators.quote[0], bars = [];
  c.timestamp.forEach((t, i) => { if (q.close[i] != null && q.high[i] != null && q.low[i] != null) bars.push({ t, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i], v: q.volume[i] || 0 }); });
  return { bars, meta: c.meta || {} };
}

async function build(sym, iv) {
  const [interval, range] = IV[iv] || IV['5'];
  const main = await yahoo(sym, interval, range);
  const B = main.bars; if (B.length < 12) throw new Error('not enough candles');
  const intraday = !/^(1d|1wk)$/.test(interval);
  const closes = B.map((b) => b.c), last = B[B.length - 1];
  const e9 = ema(closes, 9), e20 = ema(closes, 20);
  const s200 = closes.length >= 200 ? closes.slice(-200).reduce((a, b) => a + b, 0) / 200 : null;
  const s50 = closes.length >= 50 ? closes.slice(-50).reduce((a, b) => a + b, 0) / 50 : null;
  let atr = 0; const n = Math.min(14, B.length - 1);
  for (let i = B.length - n; i < B.length; i++) atr += Math.max(B[i].h - B[i].l, Math.abs(B[i].h - B[i - 1].c), Math.abs(B[i].l - B[i - 1].c)); atr /= n;
  const L = { last: r2(last.c), ema9: r2(e9[e9.length - 1]), ema20: r2(e20[e20.length - 1]), atr: r2(atr) };
  if (s50) L.sma50 = r2(s50); if (s200) L.sma200 = r2(s200);
  if (intraday) {
    const d = nyDay(last.t), today = B.filter((b) => nyDay(b.t) === d);
    let pv = 0, vv = 0; today.forEach((b) => { const tp = (b.h + b.l + b.c) / 3; pv += tp * b.v; vv += b.v; });
    if (vv > 0) L.vwap = r2(pv / vv);
    L.sessionHigh = r2(Math.max.apply(null, today.map((b) => b.h))); L.sessionLow = r2(Math.min.apply(null, today.map((b) => b.l))); L.sessionOpen = r2(today[0].o);
    const prior = B.filter((b) => nyDay(b.t) !== d);
    try {
      const dd = await yahoo(sym, '1d', '1mo'); const days = dd.bars.filter((b) => nyDay(b.t) !== d);
      const p = days[days.length - 1]; if (p) { L.priorDayHigh = r2(p.h); L.priorDayLow = r2(p.l); L.priorDayClose = r2(p.c); }
    } catch (e) { if (prior.length) { L.priorDayHigh = r2(Math.max.apply(null, prior.map((b) => b.h))); L.priorDayLow = r2(Math.min.apply(null, prior.map((b) => b.l))); } }
  } else { const w = B.slice(-60); L.rangeHigh = r2(Math.max.apply(null, w.map((b) => b.h))); L.rangeLow = r2(Math.min.apply(null, w.map((b) => b.l))); }
  const piv = { highs: [], lows: [] }, W = B.slice(-80);
  for (let i = 3; i < W.length - 3; i++) {
    const hs = W.slice(i - 3, i + 4).map((b) => b.h), ls = W.slice(i - 3, i + 4).map((b) => b.l);
    if (W[i].h === Math.max.apply(null, hs)) piv.highs.push(r2(W[i].h)); if (W[i].l === Math.min.apply(null, ls)) piv.lows.push(r2(W[i].l));
  }
  L.pivotHighs = piv.highs.slice(-5); L.pivotLows = piv.lows.slice(-5);
  const vols = B.map((b) => b.v), avgv = vols.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, vols.length);
  L.lastVolVsAvg = avgv ? r2(last.v / avgv) : null;
  const bars = B.slice(-60).map((b) => [b.t, r2(b.o), r2(b.h), r2(b.l), r2(b.c), b.v]);
  return { sym, iv, interval, levels: L, bars, asof: last.t };
}


/* ---------- deep read: extra context (insiders, news, earnings, macro) ---------- */
const UA = () => process.env.SEC_USER_AGENT || 'Revatour (set SEC_USER_AGENT in Vercel)';
const jget = async (u, h) => { const r = await fetch(u, { headers: h || {} }); if (!r.ok) throw new Error(String(r.status)); return r.json(); };
const ymd = (d) => d.toISOString().slice(0, 10);
let cikMap = null, cikAt = 0;
async function cikOf(sym) {
  if (!cikMap || Date.now() - cikAt > 12 * 3600 * 1000) { const j = await jget('https://www.sec.gov/files/company_tickers.json', { 'User-Agent': UA() }); cikMap = {}; Object.keys(j).forEach((k) => { cikMap[String(j[k].ticker).toUpperCase()] = j[k].cik_str; }); cikAt = Date.now(); }
  return cikMap[sym] || null;
}
const tag = (x, t) => { const m = new RegExp('<' + t + '>\\s*(?:<value>)?\\s*([^<]*?)\\s*(?:</value>)?\\s*</' + t + '>', 'i').exec(x); return m ? m[1] : ''; };
async function form4(sym) {
  const cik = await cikOf(sym); if (!cik) return [];
  const sub = await jget(`https://data.sec.gov/submissions/CIK${String(cik).padStart(10, '0')}.json`, { 'User-Agent': UA() });
  const f = (sub.filings && sub.filings.recent) || {}, rows = [];
  for (let i = 0; i < (f.form || []).length && rows.length < 8; i++) if (f.form[i] === '4') rows.push({ acc: f.accessionNumber[i], doc: f.primaryDocument[i], filed: f.filingDate[i] });
  const out = [];
  await Promise.all(rows.map(async (r) => {
    try {
      const u = `https://www.sec.gov/Archives/edgar/data/${cik}/${r.acc.replace(/-/g, '')}/${String(r.doc).replace(/^xsl[^/]*\//, '')}`;
      const x = await (await fetch(u, { headers: { 'User-Agent': UA() } })).text();
      const who = tag(x, 'rptOwnerName'), title = tag(x, 'officerTitle') || (/<isDirector>\s*(1|true)/i.test(x) ? 'Director' : /<isTenPercentOwner>\s*(1|true)/i.test(x) ? '10% owner' : 'Insider');
      (x.match(/<nonDerivativeTransaction>[\s\S]*?<\/nonDerivativeTransaction>/g) || []).forEach((t) => {
        const code = tag(t, 'transactionCode'), sh = Number(tag(t, 'transactionShares')), px = Number(tag(t, 'transactionPricePerShare'));
        if (!/^[PSMAFG]$/.test(code) || !sh) return;
        out.push({ date: tag(t, 'transactionDate') || r.filed, filed: r.filed, who, title, code, shares: Math.round(sh), price: isFinite(px) && px > 0 ? r2(px) : null, dir: tag(t, 'transactionAcquiredDisposedCode') });
      });
    } catch (e) { /* skip a filing we cannot read */ }
  }));
  return out.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 14);
}
async function news(sym) {
  const key = process.env.FINNHUB_KEY; if (!key) return [];
  const to = new Date(), from = new Date(Date.now() - 6 * 864e5);
  const j = await jget(`https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(sym)}&from=${ymd(from)}&to=${ymd(to)}&token=${key}`);
  return (Array.isArray(j) ? j : []).slice(0, 7).map((n) => ({ head: String(n.headline || '').slice(0, 160), src: n.source || '', url: n.url || '', t: n.datetime || 0 }));
}
async function earnings(sym) {
  const key = process.env.FINNHUB_KEY; if (!key) return null;
  const from = new Date(), to = new Date(Date.now() + 45 * 864e5);
  const j = await jget(`https://finnhub.io/api/v1/calendar/earnings?from=${ymd(from)}&to=${ymd(to)}&symbol=${encodeURIComponent(sym)}&token=${key}`);
  const e = j && j.earningsCalendar && j.earningsCalendar[0]; return e ? { date: e.date, hour: e.hour || '', epsEst: e.epsEstimate != null ? r2(e.epsEstimate) : null } : null;
}
const MAC = [['SPY', 'S&P 500 ETF'], ['^VIX', 'VIX'], ['^TNX', '10-yr yield'], ['DX-Y.NYB', 'Dollar index'], ['CL=F', 'Oil'], ['GC=F', 'Gold']];
async function macro() {
  const out = await Promise.all(MAC.map(async (m) => { try { const d = await yahoo(m[0], '1d', '5d'); const B = d.bars, a = B[B.length - 1], p = B[B.length - 2]; return { sym: m[0], name: m[1], last: r2(a.c), chg: p ? r2((a.c / p.c - 1) * 100) : null }; } catch (e) { return null; } }));
  return out.filter(Boolean);
}
const dcache = new Map();
async function deepData(sym, iv) {
  const k = sym + '|' + iv, hit = dcache.get(k); if (hit && Date.now() - hit.t < 3 * 60 * 1000) return hit.d;
  const [chart, ins, nws, ern, mac] = await Promise.all([build(sym, iv), form4(sym).catch(() => null), news(sym).catch(() => null), earnings(sym).catch(() => null), macro().catch(() => [])]);
  const d = { chart, ins, nws, ern, mac }; dcache.set(k, { t: Date.now(), d }); return d;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'use POST' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'log in first' });
  let user;
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return res.status(401).json({ error: 'invalid login' });
    user = await r.json();
  } catch (e) { return res.status(500).json({ error: 'auth check failed' }); }
  const allowed = (process.env.ALLOWED_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes((user.email || '').toLowerCase())) return res.status(403).json({ error: 'not on the allowed list' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'AI key not set' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const items = (Array.isArray(body && body.items) ? body.items : []).slice(0, 6)
    .map((i) => ({ sym: String(i.sym || '').toUpperCase(), iv: String(i.iv || '5') })).filter((i) => /^[A-Z]{1,5}([.-][A-Z])?$/.test(i.sym) && IV[i.iv]);
  if (!items.length) return res.status(400).json({ error: 'no valid charts' });


  if (body && body.deep) {
    const it = items[0]; if (!it) return res.status(400).json({ error: 'no valid chart' });
    let D; try { D = await deepData(it.sym, it.iv); } catch (e) { return res.status(200).json({ deep: { sym: it.sym, iv: it.iv, error: 'No candle data (' + String(e.message || 'failed') + ')' } }); }
    const L = D.chart.levels;
    const sysD = `You are a veteran trading-desk analyst writing a detailed, plain-English chart briefing for a day trader and swing trader. You receive: computed levels, the last 60 candles ([unix time, open, high, low, close, volume]) in the stated interval, recent SEC Form 4 insider transactions (code P = open-market buy, S = open-market sale, M = option exercise, A = grant/award, F = tax withholding, G = gift), recent headlines, the next earnings date, and a market snapshot (S&P ETF, VIX, 10-year yield, dollar, oil, gold, day change in percent). Use ONLY this data plus general market knowledge about how this kind of company and sector typically respond to rates, inflation, growth, the dollar, oil and the VIX. Never invent news, numbers, prices, dates or insider trades. If a data block is missing or empty say so. Prices must be near the current price (within about 5 ATR intraday, 12 ATR daily or weekly) and should use the computed levels where possible.
Insider rule: judge only the transactions given. Open-market buys (P) matter most; sales (S) are weaker evidence because insiders sell for many reasons; awards, option exercises and tax withholding are routine. Say plainly when activity is routine or absent.
Macro rule: "if X then Y" items are typical sensitivities, not predictions. Name a specific trigger (for example "hotter-than-expected inflation pushes the 10-year yield higher", "oil rises sharply", "VIX spikes above 25", "Fed signals cuts") and say whether it tends to help or hurt this stock, and why (rate sensitivity, growth vs value, energy cost, dollar exposure, risk appetite). Give 4 items, mixing up and down cases.
Return ONLY JSON in this shape: {"bias":"up|down|range","conf":1-3,"headline":"one line verdict","priceAction":"4 to 6 sentences: trend, where price sits versus VWAP and the EMAs, volume, recent swings, what the last few candles say","resistance":[{"p":0,"why":"..."}],"support":[{"p":0,"why":"..."}],"bull":{"trigger":"...","target":0,"stop":0,"note":"..."},"bear":{"trigger":"...","target":0,"stop":0,"note":"..."},"base":"what to expect if neither triggers","insiders":"2 to 3 sentences on the insider activity given","catalysts":"2 to 3 sentences on the news and earnings timing given","macro":[{"event":"...","effect":"up|down|mixed","why":"..."}],"risks":["..."],"wrongIf":"what would change this view"}. Up to 4 resistance and 4 support levels, nearest first; 3 to 4 risks.`;
    const payload = { sym: it.sym, interval: D.chart.interval, levels: L, candles: D.chart.bars, form4: D.ins === null ? 'unavailable' : D.ins, headlines: D.nws === null ? 'unavailable' : D.nws.map((n) => ({ head: n.head, src: n.src, date: new Date((n.t || 0) * 1000).toISOString().slice(0, 10) })), nextEarnings: D.ern || 'none found in the next 45 days (or unavailable)', market: D.mac };
    try {
      const up = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 4500, system: sysD, messages: [{ role: 'user', content: [{ type: 'text', text: JSON.stringify(payload) }] }] }) });
      if (!up.ok) { console.error('anthropic error', up.status, await up.text()); return res.status(up.status === 429 ? 429 : 502).json({ error: 'AI request failed' }); }
      const j = await up.json(); const a = parseJson((j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join(''));
      if (!a) return res.status(502).json({ error: 'AI answer could not be read' });
      const p = L.last, num = (x) => { x = Number(x); return isFinite(x) && x > 0 && Math.abs(x - p) / p < 0.6 ? r2(x) : null; };
      const lv = (arr) => (Array.isArray(arr) ? arr : []).map((o) => ({ p: num(o && o.p), why: String((o && o.why) || '').slice(0, 220) })).filter((o) => o.p != null).slice(0, 4);
      const sc = (o) => (o ? { trigger: String(o.trigger || '').slice(0, 240), target: num(o.target), stop: num(o.stop), note: String(o.note || '').slice(0, 260) } : null);
      const str = (x, n) => String(x || '').slice(0, n);
      const deep = { sym: it.sym, iv: it.iv, bias: /^(up|down|range)$/.test(a.bias) ? a.bias : 'range', conf: Math.max(1, Math.min(3, Math.round(Number(a.conf)) || 1)), headline: str(a.headline, 200),
        priceAction: str(a.priceAction, 1200), resistance: lv(a.resistance), support: lv(a.support), bull: sc(a.bull), bear: sc(a.bear), base: str(a.base, 400), insidersNote: str(a.insiders, 500), catalystsNote: str(a.catalysts, 500),
        macroIf: (Array.isArray(a.macro) ? a.macro : []).slice(0, 5).map((m) => ({ event: str(m && m.event, 140), effect: /^(up|down|mixed)$/.test(m && m.effect) ? m.effect : 'mixed', why: str(m && m.why, 260) })),
        risks: (Array.isArray(a.risks) ? a.risks : []).slice(0, 5).map((x) => str(x, 200)), wrongIf: str(a.wrongIf, 300),
        levels: L, asof: D.chart.asof, insiders: D.ins, news: D.nws, earnings: D.ern, market: D.mac, last: p };
      return res.status(200).json({ deep });
    } catch (e) { console.error(e); return res.status(502).json({ error: 'AI request failed' }); }
  }

  const data = {}, errs = {};
  await Promise.all(items.map(async (i) => {
    const k = i.sym + '|' + i.iv, hit = cache.get(k);
    try { data[k] = hit && Date.now() - hit.t < TTL ? hit.data : await build(i.sym, i.iv); if (!hit || hit.data !== data[k]) cache.set(k, { t: Date.now(), data: data[k] }); }
    catch (e) { errs[k] = String(e.message || 'failed'); }
  }));
  const ok = items.filter((i) => data[i.sym + '|' + i.iv]);
  const out = {};
  items.forEach((i) => { const k = i.sym + '|' + i.iv; if (errs[k]) out[k] = { sym: i.sym, iv: i.iv, error: 'No candle data (' + errs[k] + ')' }; });
  if (!ok.length) return res.status(200).json({ reads: out });

  const sys = `You read stock charts for a day trader. For each chart you get computed levels (VWAP, 9 and 20 EMA, prior day and session high/low, swing pivots, ATR) and the last 60 candles as [unix time, open, high, low, close, volume], in the time frame named by "interval". Judge ONLY from this data, in that time frame. Never invent news or numbers. Use prices that are near the current price (within about 4 ATR for intraday, 10 ATR for daily or weekly), preferring the computed levels.
For each chart say: bias ("up", "down" or "range"), a 1 to 2 sentence summary of what price is doing (trend, where it sits versus VWAP and the EMAs, volume), up to 3 support prices, up to 3 resistance prices (nearest first), a trigger (the price and action that would confirm the idea), a target, and an invalidation price (where the idea is wrong). conf is 1 to 3 (how clean the picture is). These are scenarios, not predictions or advice; if the chart is choppy or unclear, say "range" and say so.
Reply with ONLY JSON: {"reads":[{"sym":"...","iv":"...","bias":"up|down|range","summary":"...","support":[0],"resistance":[0],"trigger":"...","target":0,"invalid":0,"conf":1}]}. Every sym and iv given must appear once.`;
  const content = [{ type: 'text', text: JSON.stringify(ok.map((i) => { const d = data[i.sym + '|' + i.iv]; return { sym: d.sym, iv: d.iv, interval: d.interval, levels: d.levels, candles: d.bars }; })) }];
  try {
    const up = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 3000, system: sys, messages: [{ role: 'user', content }] }),
    });
    if (!up.ok) { console.error('anthropic error', up.status, await up.text()); return res.status(up.status === 429 ? 429 : 502).json({ error: 'AI request failed' }); }
    const j = await up.json(); const parsed = parseJson((j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join(''));
    if (!parsed || !Array.isArray(parsed.reads)) return res.status(502).json({ error: 'AI answer could not be read' });
    const num = (x, p) => { x = Number(x); return isFinite(x) && x > 0 && Math.abs(x - p) / p < 0.5 ? r2(x) : null; };
    parsed.reads.forEach((a) => {
      const k = String(a.sym || '').toUpperCase() + '|' + String(a.iv || ''), d = data[k]; if (!d) return;
      const p = d.levels.last;
      out[k] = { sym: d.sym, iv: d.iv, bias: /^(up|down|range)$/.test(a.bias) ? a.bias : 'range', summary: String(a.summary || '').slice(0, 400),
        support: (a.support || []).map((x) => num(x, p)).filter((x) => x != null).slice(0, 3), resistance: (a.resistance || []).map((x) => num(x, p)).filter((x) => x != null).slice(0, 3),
        trigger: String(a.trigger || '').slice(0, 200), target: num(a.target, p), invalid: num(a.invalid, p), conf: Math.max(1, Math.min(3, Math.round(Number(a.conf)) || 1)),
        levels: d.levels, asof: d.asof };
    });
    ok.forEach((i) => { const k = i.sym + '|' + i.iv; if (!out[k]) out[k] = { sym: i.sym, iv: i.iv, error: 'The AI skipped this chart. Try again.' }; });
    res.setHeader('Cache-Control', 'private, max-age=20');
    return res.status(200).json({ reads: out });
  } catch (e) { console.error(e); return res.status(502).json({ error: 'AI request failed' }); }
};
