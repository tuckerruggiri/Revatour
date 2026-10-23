// api/quotes.js — signed-in users get live prices for up to 25 tickers (Finnhub /quote).
// Needs FINNHUB_KEY, SUPABASE_URL, SUPABASE_ANON_KEY. Results are cached for 15 seconds per ticker.

const cache = new Map(); // SYMBOL -> { t, q }
const TTL = 15 * 1000;

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
  res.setHeader('Cache-Control', 'private, max-age=10');
  return res.status(200).json({ configured: true, ts: Date.now(), quotes: out });
};
