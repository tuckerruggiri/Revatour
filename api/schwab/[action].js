// api/schwab/[action].js — connect a Schwab account (Trader API) and pull executed trades.
// Routes: /api/schwab/start  /callback  /save  /status  /trades  /quotes  /disconnect
// Vercel env vars: SCHWAB_APP_KEY, SCHWAB_APP_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY
// Optional: SCHWAB_REDIRECT_URI (must match the callback URL registered with Schwab; default below)
// The refresh token is encrypted with a key derived from SCHWAB_APP_SECRET and stored in the user's own row (ss_broker, RLS).

const crypto = require('crypto');
const REDIR = () => process.env.SCHWAB_REDIRECT_URI || 'https://revatour.com/api/schwab/callback';
const AUTH = 'https://api.schwabapi.com/v1/oauth/authorize';
const TOKEN = 'https://api.schwabapi.com/v1/oauth/token';
const TRADER = 'https://api.schwabapi.com/trader/v1';
const MARKET = 'https://api.schwabapi.com/marketdata/v1';
const atCache = new Map(); // user id -> { token, exp }  (Schwab access tokens last 30 minutes)
const REFRESH_DAYS = 7;

const k = (label) => crypto.createHash('sha256').update(label + ':' + (process.env.SCHWAB_APP_SECRET || '')).digest();
const b64u = (b) => Buffer.from(b).toString('base64url');
function seal(obj) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', k('enc'), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return b64u(Buffer.concat([iv, c.getAuthTag(), ct]));
}
function unseal(s) {
  try {
    const b = Buffer.from(String(s), 'base64url'), d = crypto.createDecipheriv('aes-256-gcm', k('enc'), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'));
  } catch (e) { return null; }
}
function sign(obj) { const p = b64u(JSON.stringify(obj)); return p + '.' + crypto.createHmac('sha256', k('state')).update(p).digest('base64url'); }
function verify(s) {
  const [p, m] = String(s || '').split('.'); if (!p || !m) return null;
  const e = crypto.createHmac('sha256', k('state')).update(p).digest('base64url');
  if (e.length !== m.length || !crypto.timingSafeEqual(Buffer.from(e), Buffer.from(m))) return null;
  try { const o = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')); return o.exp > Date.now() ? o : null; } catch (e) { return null; }
}
const basic = () => 'Basic ' + Buffer.from(process.env.SCHWAB_APP_KEY + ':' + process.env.SCHWAB_APP_SECRET).toString('base64');
async function tokenCall(params) {
  const r = await fetch(TOKEN, { method: 'POST', headers: { Authorization: basic(), 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params).toString() });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) { const e = new Error(j.error_description || j.error || 'token ' + r.status); e.status = r.status; throw e; }
  return j;
}
async function whoami(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null; const u = await r.json(); return u && u.id ? { id: u.id, token } : null;
  } catch (e) { return null; }
}
const rest = (u, path, opt) => fetch(`${process.env.SUPABASE_URL}/rest/v1/ss_broker${path}`, Object.assign({}, opt, {
  headers: Object.assign({ apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' }, (opt && opt.headers) || {}) }));
async function loadConn(u) {
  const r = await rest(u, `?user_id=eq.${u.id}&select=enc`); if (!r.ok) return null;
  const rows = await r.json(); return rows[0] ? unseal(rows[0].enc) : null;
}

// ---- time helpers (Eastern) ----
const ET = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function etParts(ms) { const o = {}; ET.formatToParts(new Date(ms)).forEach((p) => { o[p.type] = p.value; }); return o; }
function etStart(day) { // 00:00 Eastern of YYYY-MM-DD as UTC ms
  const [y, m, d] = day.split('-').map(Number);
  for (const off of [4, 5]) { const t = Date.UTC(y, m - 1, d, off, 0, 0); if (+etParts(t).hour === 0) return t; }
  return Date.UTC(y, m - 1, d, 5, 0, 0);
}
const fmtExec = (ms) => { const p = etParts(ms); return `${+p.month}/${+p.day}/${String(p.year).slice(2)} ${+p.hour}:${p.minute}:${p.second}`; };
const dayOf = (ms) => { const p = etParts(ms); return `${p.year}-${p.month}-${p.day}`; };

// Turn Schwab TRADE transactions into fills. Equities often come back with positionEffect AUTOMATIC, so the open/close
// side is worked out from the running position per instrument (oldest first).
function toFills(txns, fromMs, toMs) {
  const rows = [];
  (txns || []).forEach((t) => {
    if (!t || t.type !== 'TRADE' || (t.status && t.status !== 'VALID')) return;
    const when = Date.parse(t.time || t.tradeDate); if (!isFinite(when)) return;
    (t.transferItems || []).forEach((it) => {
      const ins = it.instrument || {};
      if (it.feeType || !ins.symbol || /CURRENCY|CASH/i.test(ins.assetType || '')) return;
      const q = Number(it.amount); if (!q || !isFinite(q)) return;
      const price = Number(it.price); if (!isFinite(price)) return;
      const opt = /OPTION/i.test(ins.assetType || '');
      rows.push({ when, order: t.orderId || '', buy: q > 0, qty: Math.abs(q), price, effect: String(it.positionEffect || '').toUpperCase(),
        sym: String((opt ? (ins.underlyingSymbol || ins.symbol) : ins.symbol)).toUpperCase(), key: ins.symbol, opt,
        exp: opt ? String(ins.optionExpirationDate || '').slice(0, 10) : '', strike: opt ? ins.strikePrice : '', type: opt ? String(ins.putCall || '').toUpperCase() : 'STOCK', id: t.activityId });
    });
  });
  rows.sort((a, b) => a.when - b.when);
  const pos = {};
  const out = [];
  rows.forEach((r) => {
    const cur = pos[r.key] || 0, delta = r.buy ? r.qty : -r.qty;
    let open;
    if (r.effect === 'OPENING') open = true;
    else if (r.effect === 'CLOSING') open = false;
    else open = !(cur !== 0 && (cur > 0) !== r.buy); // opposite direction of a held position closes it
    pos[r.key] = cur + delta;
    if (r.when < fromMs || r.when >= toMs) return;
    out.push({ exec: fmtExec(r.when), day: dayOf(r.when), side: r.buy ? 'BUY' : 'SELL', qty: r.qty, effect: open ? 'TO OPEN' : 'TO CLOSE',
      symbol: r.sym, exp: r.exp, strike: r.strike, type: r.type, price: r.price, order: String(r.order) });
  });
  return out;
}

async function trader(path, access) {
  const r = await fetch(TRADER + path, { headers: { Authorization: 'Bearer ' + access, Accept: 'application/json' } });
  if (r.status === 401) { const e = new Error('expired'); e.status = 401; throw e; }
  if (!r.ok) { const e = new Error('schwab ' + r.status); e.status = r.status; throw e; }
  return r.json();
}

module.exports = async (req, res) => {
  const action = String((req.query && req.query.action) || '');
  const need = ['SCHWAB_APP_KEY', 'SCHWAB_APP_SECRET', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const configured = need.every((n) => process.env[n]);
  res.setHeader('Cache-Control', 'no-store');

  if (action === 'callback') { // browser redirect from Schwab: no login header here, identity comes from the signed state
    const back = (q) => { res.statusCode = 302; res.setHeader('Location', '/?schwab=' + q); res.end(); };
    if (!configured) return back('error');
    const cookie = (req.headers.cookie || '').split(/;\s*/).map((c) => c.split('=')).find((c) => c[0] === 'ssb');
    const st = cookie ? verify(decodeURIComponent(cookie.slice(1).join('='))) : null;
    const q = req.query || {};
    if (q.error || !q.code || !st || (q.state && q.state !== decodeURIComponent(cookie.slice(1).join('=')))) return back('denied');
    try {
      const j = await tokenCall({ grant_type: 'authorization_code', code: String(q.code), redirect_uri: REDIR() });
      if (!j.refresh_token) return back('error');
      const blob = seal({ uid: st.uid, rt: j.refresh_token, at: Date.now() });
      res.setHeader('Set-Cookie', 'ssb=; Max-Age=0; Path=/api/schwab; HttpOnly; Secure; SameSite=Lax');
      res.statusCode = 302; res.setHeader('Location', '/?schwab=ok#sb=' + blob); return res.end();
    } catch (e) { return back('error'); }
  }

  if (!configured) return res.status(200).json({ configured: false });
  const u = await whoami(req);
  if (!u) return res.status(401).json({ error: 'log in first' });

  try {
    if (action === 'start') {
      const state = sign({ uid: u.id, exp: Date.now() + 10 * 60 * 1000, n: crypto.randomBytes(8).toString('hex') });
      res.setHeader('Set-Cookie', 'ssb=' + encodeURIComponent(state) + '; Max-Age=600; Path=/api/schwab; HttpOnly; Secure; SameSite=Lax');
      const q = new URLSearchParams({ client_id: process.env.SCHWAB_APP_KEY, redirect_uri: REDIR(), response_type: 'code', state });
      return res.status(200).json({ configured: true, url: AUTH + '?' + q.toString() });
    }
    if (action === 'save') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const c = unseal(body.blob);
      if (!c || c.uid !== u.id || Date.now() - c.at > 10 * 60 * 1000) return res.status(400).json({ error: 'expired, connect again' });
      const r = await rest(u, '', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ user_id: u.id, enc: seal({ uid: u.id, rt: c.rt, at: c.at }), updated_at: new Date().toISOString() }) });
      if (!r.ok) return res.status(500).json({ error: 'could not save connection (run social7.sql?)' });
      return res.status(200).json({ configured: true, connected: true, daysLeft: REFRESH_DAYS });
    }
    if (action === 'disconnect') { await rest(u, `?user_id=eq.${u.id}`, { method: 'DELETE' }); return res.status(200).json({ configured: true, connected: false }); }

    const c = await loadConn(u);
    const daysLeft = c ? Math.max(0, Math.ceil((c.at + REFRESH_DAYS * 864e5 - Date.now()) / 864e5)) : 0;
    if (action === 'status') return res.status(200).json({ configured: true, connected: !!c && daysLeft > 0, daysLeft, expired: !!c && daysLeft <= 0 });

    if (action === 'trades') {
      if (!c || daysLeft <= 0) return res.status(200).json({ configured: true, reconnect: true });
      const from = String(req.query.from || ''), to = String(req.query.to || from);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return res.status(400).json({ error: 'bad dates' });
      const fromMs = etStart(from), toMs = etStart(to) + 864e5;
      if (toMs - fromMs > 100 * 864e5) return res.status(400).json({ error: 'range too long' });
      let tk;
      try { tk = await tokenCall({ grant_type: 'refresh_token', refresh_token: c.rt }); }
      catch (e) { if (e.status === 400 || e.status === 401) return res.status(200).json({ configured: true, reconnect: true }); throw e; }
      const accts = await trader('/accounts/accountNumbers', tk.access_token);
      const lookStart = new Date(fromMs - 60 * 864e5).toISOString(), end = new Date(Math.min(toMs, Date.now() + 864e5)).toISOString();
      let fills = [];
      for (const a of accts || []) {
        const tx = await trader(`/accounts/${a.hashValue}/transactions?startDate=${encodeURIComponent(lookStart)}&endDate=${encodeURIComponent(end)}&types=TRADE`, tk.access_token);
        fills = fills.concat(toFills(tx, fromMs, toMs));
      }
      return res.status(200).json({ configured: true, accounts: (accts || []).length, fills });
    }
    if (action === 'quotes') { // live prices + volume for a watchlist (needs the Market Data product on the Schwab app)
      if (!c || daysLeft <= 0) return res.status(200).json({ configured: true, reconnect: true });
      const syms = Array.from(new Set(String(req.query.symbols || '').toUpperCase().split(',').map((x) => x.trim()).filter((x) => /^[A-Z]{1,5}([./][A-Z])?$/.test(x)))).slice(0, 50);
      if (!syms.length) return res.status(400).json({ error: 'no valid symbols' });
      let at = atCache.get(u.id);
      if (!at || at.exp < Date.now() + 60000) {
        try { const tk = await tokenCall({ grant_type: 'refresh_token', refresh_token: c.rt }); at = { token: tk.access_token, exp: Date.now() + (Number(tk.expires_in) || 1800) * 1000 }; atCache.set(u.id, at); }
        catch (e) { if (e.status === 400 || e.status === 401) return res.status(200).json({ configured: true, reconnect: true }); throw e; }
      }
      const r = await fetch(MARKET + '/quotes?' + new URLSearchParams({ symbols: syms.join(','), fields: 'quote' }).toString(), { headers: { Authorization: 'Bearer ' + at.token, Accept: 'application/json' } });
      if (r.status === 401) atCache.delete(u.id);
      if (!r.ok) return res.status(200).json({ configured: true, noMarket: true, status: r.status });
      const j = await r.json();
      const out = {};
      syms.forEach((s) => {
        const q = j && j[s] && j[s].quote; if (!q) return;
        const last = Number(q.lastPrice), mark = Number(q.mark), close = Number(q.closePrice);
        const p = isFinite(last) && last > 0 ? last : mark; if (!isFinite(p) || p <= 0) return;
        const m = isFinite(mark) && mark > 0 ? mark : p;
        const dp = isFinite(close) && close > 0 ? (m - close) / close * 100 : Number(q.netPercentChange);
        out[s] = { p, m, d: isFinite(close) && close > 0 ? m - close : Number(q.netChange), dp: isFinite(dp) ? dp : null, pc: isFinite(close) ? close : null, v: isFinite(Number(q.totalVolume)) ? Number(q.totalVolume) : null, t: Number(q.quoteTime) || null };
      });
      res.setHeader('Cache-Control', 'private, max-age=5');
      return res.status(200).json({ configured: true, source: 'schwab', ts: Date.now(), quotes: out });
    }
    return res.status(404).json({ error: 'unknown' });
  } catch (e) {
    return res.status(e.status === 401 ? 401 : 502).json({ error: 'Schwab request failed' + (e.status ? ' (' + e.status + ')' : '') });
  }
};
module.exports._t = { toFills, etStart, seal, unseal, sign, verify };
