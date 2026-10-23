// api/quotes.js — signed-in users get live prices for up to 25 tickers (Finnhub /quote).
// Needs FINNHUB_KEY, SUPABASE_URL, SUPABASE_ANON_KEY. Results are cached for 15 seconds per ticker.

const cache = new Map(); // SYMBOL -> { t, q }
const TTL = 15 * 1000;
// Finnhub's free quote has no volume, so volume comes from Alpha Vantage (ALPHAVANTAGE_KEY) when it is set.
// The free Alpha Vantage key is only about 25 requests a day, so each volume is kept for 3 hours and at most
// 4 new ones are fetched per request. Anything not fetched yet simply shows as a dash.
const vcache = new Map(); // SYMBOL -> { t, v }
const VTTL = 3 * 3600 * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'log in first' });
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(401).json({ error: 'invalid login' });
  } catch (e) { return res.status(500).json({ error: 'auth check failed' }); }

  const key = process.env.FINNHUB_KEY || '';
  if (!key) return res.status(200).json({ configured: false, quotes: {} });
  const syms = Array.from(new Set(String((req.query && req.query.symbols) || '').toUpperCase().split(',')
    .map((s) => s.trim()).filter((s) => /^[A-Z]{1,5}(\.[A-Z])?$/.test(s)))).slice(0, 25);
  if (!syms.length) return res.status(400).json({ error: 'no valid symbols' });

  const out = {};
  await Promise.all(syms.map(async (s) => {
    const hit = cache.get(s);
    if (hit && Date.now() - hit.t < TTL) { out[s] = hit.q; return; }
    try {
      const r = await fetch('https://finnhub.io/api/v1/quote?' + new URLSearchParams({ symbol: s, token: key }).toString());
      if (!r.ok) return;
      const j = await r.json();
      if (!j || !isFinite(j.c) || j.c === 0) return;
      const q = { p: j.c, d: j.d, dp: j.dp, pc: j.pc, t: j.t ? j.t * 1000 : null };
      cache.set(s, { t: Date.now(), q });
      out[s] = q;
    } catch (e) { /* skip this ticker */ }
  }));
  const avKey = process.env.ALPHAVANTAGE_KEY || '';
  let budget = 4;
  for (const s of Object.keys(out)) {
    const hit = vcache.get(s);
    if (hit && Date.now() - hit.t < VTTL) { out[s] = Object.assign({}, out[s], { v: hit.v }); continue; }
    if (!avKey || budget <= 0) { if (hit) out[s] = Object.assign({}, out[s], { v: hit.v }); continue; }
    budget--;
    try {
      const r = await fetch('https://www.alphavantage.co/query?' + new URLSearchParams({ function: 'GLOBAL_QUOTE', symbol: s, apikey: avKey }).toString());
      const j = r.ok ? await r.json() : null;
      const v = j && j['Global Quote'] ? parseFloat(j['Global Quote']['06. volume']) : NaN;
      if (isFinite(v)) { vcache.set(s, { t: Date.now(), v }); out[s] = Object.assign({}, out[s], { v }); }
      else if (j && (j.Note || j.Information)) budget = 0;
    } catch (e) { /* leave volume blank */ }
    if (budget > 0) await sleep(1100);
  }
  res.setHeader('Cache-Control', 'private, max-age=10');
  return res.status(200).json({ configured: true, ts: Date.now(), quotes: out });
};
