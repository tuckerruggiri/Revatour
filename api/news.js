// api/news.js — signed-in users get fresh headlines and SEC filings for up to 15 tickers.
// News: Finnhub company news (free key, set FINNHUB_KEY in Vercel). Filings: SEC EDGAR (no key).
// SEC asks every caller to identify itself: set SEC_USER_AGENT in Vercel, e.g. "Revatour you@example.com".
// Results are cached for 60 seconds per ticker so many users do not multiply the upstream calls.

const cache = new Map(); // SYMBOL -> { t, items }
const TTL = 60 * 1000;
let cikMap = null, cikAt = 0;

const ITEM = {
  '1.01': 'Material agreement', '1.02': 'Agreement ended', '2.01': 'Acquisition or sale completed', '2.02': 'Earnings results',
  '2.03': 'New debt', '3.01': 'Listing notice', '3.02': 'Shares sold privately', '4.02': 'Past financials need restating',
  '5.01': 'Change in control', '5.02': 'Executive or director change', '5.03': 'Bylaws changed', '5.07': 'Shareholder vote',
  '7.01': 'Company disclosure', '8.01': 'Other event',
};
const FORMS = { '8-K': 1, '10-K': 1, '10-Q': 1, '6-K': 1, '20-F': 1, 'S-1': 1, 'SC 13D': 1, 'SC 13G': 1, 'DEF 14A': 1 };

function ua() { return process.env.SEC_USER_AGENT || 'Revatour (set SEC_USER_AGENT in Vercel)'; }
function ymd(d) { return d.toISOString().slice(0, 10); }

async function getCik(sym) {
  if (!cikMap || Date.now() - cikAt > 12 * 3600 * 1000) {
    const r = await fetch('https://www.sec.gov/files/company_tickers.json', { headers: { 'User-Agent': ua() } });
    if (!r.ok) throw new Error('sec tickers ' + r.status);
    const j = await r.json();
    cikMap = {};
    Object.keys(j).forEach((k) => { cikMap[String(j[k].ticker).toUpperCase()] = j[k].cik_str; });
    cikAt = Date.now();
  }
  return cikMap[sym] || null;
}

async function filings(sym) {
  const cik = await getCik(sym);
  if (!cik) return [];
  const pad = String(cik).padStart(10, '0');
  const r = await fetch(`https://data.sec.gov/submissions/CIK${pad}.json`, { headers: { 'User-Agent': ua() } });
  if (!r.ok) return [];
  const j = await r.json();
  const f = (j.filings && j.filings.recent) || {};
  const out = [];
  const n = Math.min((f.form || []).length, 40);
  for (let i = 0; i < n && out.length < 6; i++) {
    const form = f.form[i];
    if (!FORMS[form]) continue;
    const ts = Date.parse(f.acceptanceDateTime ? f.acceptanceDateTime[i] : f.filingDate[i] + 'T12:00:00Z');
    if (!isFinite(ts) || Date.now() - ts > 14 * 86400000) continue;
    const items = String((f.items && f.items[i]) || '').split(',').map((s) => s.trim()).filter(Boolean);
    const what = items.map((c) => ITEM[c]).filter(Boolean)[0];
    const acc = String(f.accessionNumber[i]).replace(/-/g, '');
    out.push({
      id: 'sec-' + f.accessionNumber[i], sym, kind: 'filing', ts,
      title: form + (what ? ': ' + what : ' filing') + ' from ' + (j.name || sym),
      url: `https://www.sec.gov/Archives/edgar/data/${cik}/${acc}/${f.primaryDocument[i]}`,
      source: 'SEC EDGAR', summary: '',
    });
  }
  return out;
}

async function headlines(sym, key) {
  const to = new Date(), from = new Date(Date.now() - 7 * 86400000);
  const q = new URLSearchParams({ symbol: sym, from: ymd(from), to: ymd(to), token: key });
  const r = await fetch('https://finnhub.io/api/v1/company-news?' + q.toString());
  if (!r.ok) return [];
  const j = await r.json();
  if (!Array.isArray(j)) return [];
  return j.slice(0, 12).map((x) => ({
    id: 'fh-' + x.id, sym, kind: 'news', ts: (x.datetime || 0) * 1000, title: String(x.headline || '').slice(0, 220),
    url: x.url, source: x.source || 'News', summary: String(x.summary || '').slice(0, 220),
  })).filter((x) => x.title && x.ts);
}

async function forSymbol(sym, key) {
  const hit = cache.get(sym);
  if (hit && Date.now() - hit.t < TTL) return hit.items;
  const [a, b] = await Promise.all([
    key ? headlines(sym, key).catch(() => []) : Promise.resolve([]),
    filings(sym).catch(() => []),
  ]);
  const items = a.concat(b);
  cache.set(sym, { t: Date.now(), items });
  return items;
}

module.exports = async (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'log in first' });
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(401).json({ error: 'invalid login' });
  } catch (e) { return res.status(500).json({ error: 'auth check failed' }); }

  const raw = String((req.query && (req.query.symbols || req.query.symbol)) || '');
  const syms = Array.from(new Set(raw.toUpperCase().split(',').map((s) => s.trim()).filter((s) => /^[A-Z]{1,5}(\.[A-Z])?$/.test(s)))).slice(0, 15);
  if (!syms.length) return res.status(400).json({ error: 'no valid symbols' });

  const key = process.env.FINNHUB_KEY || '';
  const lists = await Promise.all(syms.map((s) => forSymbol(s, key).catch(() => [])));
  const seen = new Set();
  const items = [].concat(...lists).filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)))
    .sort((a, b) => b.ts - a.ts).slice(0, 60);
  res.setHeader('Cache-Control', 'private, max-age=30');
  return res.status(200).json({ configured: !!key, ts: Date.now(), items });
};
