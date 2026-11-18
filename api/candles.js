// api/candles.js — real price candles for Flipbook pages (stocks, ETFs, futures, crypto, forex).
// Signed-in users only. Relays Yahoo Finance's public chart data and caches it briefly.
// Needs Vercel env vars: SUPABASE_URL, SUPABASE_ANON_KEY.

const cache = new Map(); // key -> { t, data }
const TTL = 5 * 60 * 1000;
const OK_INTERVALS = ['1m', '2m', '5m', '15m', '30m', '60m', '1d', '1wk'];

module.exports = async (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'log in first' });
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(401).json({ error: 'invalid login' });
  } catch (e) { return res.status(500).json({ error: 'auth check failed' }); }

  const sym = String((req.query && req.query.symbol) || '').toUpperCase().trim();
  const iv = String((req.query && req.query.interval) || '5m');
  const p1 = Math.floor(Number(req.query && req.query.start) / 1000), p2 = Math.ceil(Number(req.query && req.query.end) / 1000);
  const ext = String((req.query && req.query.ext) || '') === '1';
  if (!/^\^?[A-Z0-9.=-]{1,15}$/.test(sym)) return res.status(400).json({ error: 'bad symbol' });
  if (!OK_INTERVALS.includes(iv)) return res.status(400).json({ error: 'bad interval' });
  if (!isFinite(p1) || !isFinite(p2) || p2 <= p1 || p2 - p1 > 40 * 366 * 86400) return res.status(400).json({ error: 'bad range' });

  const key = [sym, iv, p1, p2, ext].join('|');
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return res.status(200).json(hit.data);

  const q = new URLSearchParams({ period1: String(p1), period2: String(p2), interval: iv, includePrePost: ext ? 'true' : 'false', events: 'div,splits' });
  const hosts = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];
  let last = null;
  for (const h of hosts) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 10000);
      const r = await fetch(`${h}/v8/finance/chart/${encodeURIComponent(sym)}?${q.toString()}`, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', Accept: 'application/json' } });
      clearTimeout(t);
      const j = await r.json().catch(() => null);
      const R = j && j.chart && j.chart.result && j.chart.result[0];
      if (!r.ok || !R) { last = (j && j.chart && j.chart.error && j.chart.error.description) || ('status ' + r.status); continue; }
      const ts = R.timestamp || [], Q = (R.indicators && R.indicators.quote && R.indicators.quote[0]) || {};
      const candles = [];
      ts.forEach((s, i) => {
        const o = Q.open && Q.open[i], hi = Q.high && Q.high[i], lo = Q.low && Q.low[i], c = Q.close && Q.close[i];
        if (![o, hi, lo, c].every((x) => typeof x === 'number' && isFinite(x))) return;
        candles.push({ t: s * 1000, o, h: hi, l: lo, c, v: (Q.volume && Q.volume[i]) || 0 });
      });
      const meta = R.meta || {};
      const data = { symbol: sym, interval: iv, source: 'Yahoo Finance', name: meta.longName || meta.shortName || '', tz: meta.exchangeTimezoneName || '', candles };
      cache.set(key, { t: Date.now(), data });
      if (cache.size > 300) cache.delete(cache.keys().next().value);
      res.setHeader('Cache-Control', 'private, max-age=120');
      return res.status(200).json(data);
    } catch (e) { last = 'timeout'; }
  }
  return res.status(200).json({ error: 'Could not load real candles right now (' + last + ').', candles: [] });
};
