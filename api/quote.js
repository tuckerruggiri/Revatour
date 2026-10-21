// api/quote.js — signed-in users get market data for one ticker (price, daily history, fundamentals, news).
// Needs Vercel env vars: ALPHAVANTAGE_KEY, SUPABASE_URL, SUPABASE_ANON_KEY.
// The free Alpha Vantage key allows about 25 requests a day and each ticker page uses 4, so results are cached.

const cache = new Map(); // symbol -> { t, data }
const TTL = 10 * 60 * 1000;

async function av(fn, params, key) {
  const q = new URLSearchParams({ function: fn, apikey: key, ...params });
  const r = await fetch('https://www.alphavantage.co/query?' + q.toString());
  if (!r.ok) return { error: 'upstream ' + r.status };
  const j = await r.json();
  if (j.Note || j.Information) return { error: 'limit' };
  if (j['Error Message']) return { error: 'unknown symbol' };
  return j;
}
const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : null; };

module.exports = async (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'log in first' });
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(401).json({ error: 'invalid login' });
  } catch (e) { return res.status(500).json({ error: 'auth check failed' }); }

  const key = process.env.ALPHAVANTAGE_KEY;
  if (!key) return res.status(200).json({ configured: false });

  const sym = String((req.query && req.query.symbol) || '').toUpperCase();
  if (!/^[A-Z]{1,5}(\.[A-Z])?$/.test(sym)) return res.status(400).json({ error: 'bad symbol' });

  const hit = cache.get(sym);
  if (hit && Date.now() - hit.t < TTL) return res.status(200).json(hit.data);

  // Free keys allow about 1 request per second, so run them one after another
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const q = await av('GLOBAL_QUOTE', { symbol: sym }, key);
  await sleep(1100);
  const d = await av('TIME_SERIES_DAILY', { symbol: sym, outputsize: 'compact' }, key);
  await sleep(1100);
  const o = await av('OVERVIEW', { symbol: sym }, key);
  await sleep(1100);
  const n = await av('NEWS_SENTIMENT', { tickers: sym, limit: '8', sort: 'LATEST' }, key);

  const out = { configured: true, symbol: sym, ts: Date.now() };
  const g = q.error ? null : q['Global Quote'];
  if (g && g['05. price']) {
    out.quote = { price: num(g['05. price']), open: num(g['02. open']), high: num(g['03. high']), low: num(g['04. low']),
      prev: num(g['08. previous close']), change: num(g['09. change']), pct: parseFloat(String(g['10. change percent']).replace('%', '')) || null,
      volume: num(g['06. volume']), day: g['07. latest trading day'] };
  } else out.quoteError = q.error || 'no data';
  const ts = d.error ? null : d['Time Series (Daily)'];
  if (ts) {
    out.daily = Object.keys(ts).sort().slice(-100).map((k) => ({ d: k, c: num(ts[k]['4. close']) })).filter((x) => x.c != null);
  } else out.dailyError = d.error || 'no data';
  if (!o.error && o.Symbol) {
    out.about = { name: o.Name, sector: o.Sector, industry: o.Industry, cap: num(o.MarketCapitalization), pe: num(o.PERatio), eps: num(o.EPS),
      yield: num(o.DividendYield), hi52: num(o['52WeekHigh']), lo52: num(o['52WeekLow']), desc: String(o.Description || '').slice(0, 400) };
  } else out.aboutError = o.error || 'no data';
  if (!n.error && Array.isArray(n.feed)) {
    out.news = n.feed.slice(0, 8).map((x) => ({ title: x.title, url: x.url, source: x.source, time: x.time_published }));
  } else out.newsError = n.error || 'no data';

  // only cache complete results so a rate-limited section is retried next time
  if (out.quote && out.daily && out.about) cache.set(sym, { t: Date.now(), data: out });
  res.setHeader('Cache-Control', 'private, max-age=60');
  return res.status(200).json(out);
};
