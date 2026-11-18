// api/ics.js — signed-in users can pull a read-only calendar feed (.ics) from Google, Outlook or Apple
// so it shows inside their Revatour calendar. Browsers can't fetch those links directly (CORS), so this relays them.
// Only well-known calendar hosts are allowed, so this can't be used to fetch arbitrary sites.
// Needs Vercel env vars: SUPABASE_URL, SUPABASE_ANON_KEY.

const ALLOWED = [
  /^calendar\.google\.com$/i,
  /^outlook\.office365\.com$/i,
  /^outlook\.live\.com$/i,
  /^outlook\.office\.com$/i,
  /^p\d+-caldav\.icloud\.com$/i,
  /^caldav\.icloud\.com$/i,
  /^calendar\.yahoo\.com$/i,
  /^export\.calendar\.yandex\.com$/i,
];
const MAX = 3 * 1024 * 1024;

module.exports = async (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'log in first' });
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(401).json({ error: 'invalid login' });
  } catch (e) { return res.status(500).json({ error: 'auth check failed' }); }

  let raw = String((req.query && req.query.url) || '').trim().replace(/^webcal:\/\//i, 'https://');
  let u;
  try { u = new URL(raw); } catch (e) { return res.status(400).json({ error: 'That doesn’t look like a link.' }); }
  if (u.protocol !== 'https:') return res.status(400).json({ error: 'The link must start with https:// or webcal://' });
  if (!ALLOWED.some((re) => re.test(u.hostname))) return res.status(400).json({ error: 'Only Google, Outlook, Apple (iCloud) and Yahoo calendar links are supported.' });

  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(u.toString(), { signal: ctl.signal, redirect: 'follow', headers: { Accept: 'text/calendar, text/plain, */*' } });
    clearTimeout(t);
    if (!r.ok) return res.status(200).json({ error: 'The calendar answered ' + r.status + '. Check that the link is the secret/public iCal (.ics) address.' });
    const finalHost = new URL(r.url || u.toString()).hostname;
    if (!ALLOWED.some((re) => re.test(finalHost))) return res.status(200).json({ error: 'That link redirected somewhere unexpected.' });
    const text = await r.text();
    if (text.length > MAX) return res.status(200).json({ error: 'That calendar is too big to load (over 3 MB).' });
    if (text.indexOf('BEGIN:VCALENDAR') < 0) return res.status(200).json({ error: 'That link didn’t return a calendar. Use the iCal (.ics) address.' });
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.status(200).json({ ics: text });
  } catch (e) {
    return res.status(200).json({ error: 'Could not reach that calendar. Try again in a minute.' });
  }
};
