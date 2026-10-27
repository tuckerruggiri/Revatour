// api/lab.js — Setup Lab. Signed-in users send trading screenshots (public image URLs) and the AI
// (1) analyze: writes up one trade and names the strategy, (2) sig: makes a short text fingerprint per post,
// (3) match: compares a trade's fingerprint with many saved fingerprints (text only, cheap).
// Needs ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY. Optional ALLOWED_EMAILS, ANTHROPIC_MODEL.

function parseJson(t) {
  const s = String(t || '').replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
}
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
const urls = (a) => (Array.isArray(a) ? a : []).filter((u) => /^https:\/\//.test(String(u))).slice(0, 3).map(String);
const imgBlocks = (a) => urls(a).map((u) => ({ type: 'image', source: { type: 'url', url: u } }));
const known = (a) => (Array.isArray(a) ? a : []).slice(0, 40).map((g) => ({ name: str(g.name, 40), desc: str(g.desc, 300) })).filter((g) => g.name);

const NAMING = `NAMING RULES. The trader names strategies with short CODES, not sentences. Examples of his own: FP9-A (first pullback holds the 9 EMA, long), FP9-V (pullback holds VWAP), FP9-S (short version), SL1 RV (his reversal sequence off the 9 EMA on a gap). A name is UPPERCASE, at most 8 characters, a family code (2 to 4 letters or digits for the core mechanic, like FP9, RV, VWR, GAP, ORB) optionally followed by a hyphen and a one-letter variant for the version (A, V, S, L for long, S for short, and so on). Keep the family codes consistent: if a trade belongs to an existing family, reuse that family code and only change the variant. If it matches an existing strategy, reuse that exact name. Only invent a new family code when the mechanic is genuinely different, and never reuse an existing name for something different.`;

const READ = `You are a veteran day-trading coach reading the trader's chart screenshots (usually thinkorswim, often 2-minute, with 1, 5, 15-minute or daily alongside). Look carefully and say only what you can actually see. Read: the time frame of each chart, direction of the trade, price versus VWAP, price versus the 9 EMA (and any other averages drawn), the volume (spikes, fading, dry-up, relative to earlier bars), the candle pattern at the entry, gap or premarket context, where entry, stop and targets are if drawn, and what the larger time frames show. If something is not visible, say "not visible" rather than guessing.`;

async function authUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { code: 401, error: 'log in first' };
  let user;
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return { code: 401, error: 'invalid login' };
    user = await r.json();
  } catch (e) { return { code: 500, error: 'auth check failed' }; }
  const allowed = (process.env.ALLOWED_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes((user.email || '').toLowerCase())) return { code: 403, error: 'not on the allowed list' };
  if (!process.env.ANTHROPIC_API_KEY) return { code: 500, error: 'AI key not set' };
  return { user };
}

async function ask(system, content, max) {
  const up = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: max, system, messages: [{ role: 'user', content }] }),
  });
  if (!up.ok) { console.error('anthropic error', up.status, await up.text()); const e = new Error('AI request failed'); e.code = up.status === 429 ? 429 : 502; throw e; }
  const j = await up.json();
  return parseJson((j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join(''));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'use POST' });
  const a = await authUser(req);
  if (a.error) return res.status(a.code).json({ error: a.error });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const action = body.action;
  try {
    if (action === 'analyze') {
      const imgs = imgBlocks(body.imgs);
      if (!imgs.length) return res.status(400).json({ error: 'no picture' });
      const names = known(body.names);
      const sys = `${READ}\n${NAMING}\n${names.length ? "The trader's existing strategies (name: what he wrote about it): " + JSON.stringify(names) + '\n' : 'He has no saved strategies yet.\n'}Reply with ONLY JSON: {"summary":"2-3 plain sentences: what this trade is and why it worked or did not","read":{"timeframes":"...","direction":"long or short","vwap":"...","ema9":"...","volume":"...","pattern":"...","levels":"entry / stop / targets if drawn","bigger_picture":"what the other time frames or daily context show"},"name":"CODE","existing":true or false,"family":"what the family code stands for","desc":"one sentence that defines this strategy so another screenshot can be checked against it","sig":"one line fingerprint, max 220 chars: direction | time frame | price vs VWAP | price vs 9 EMA | volume behavior | candle pattern | gap/context"}`;
      const out = await ask(sys, [{ type: 'text', text: `Caption: ${str(body.text, 600) || '(none)'}` }].concat(imgs), 1800);
      if (!out || !out.name) return res.status(502).json({ error: 'AI answer could not be read' });
      return res.status(200).json({ ok: true, a: out });
    }
    if (action === 'sig') {
      const items = (Array.isArray(body.items) ? body.items : []).slice(0, 6);
      const content = []; const ids = {};
      items.forEach((p) => {
        const id = str(p.id, 80); if (!id) return; ids[id] = 1;
        content.push({ type: 'text', text: `POST ${id}\nCaption: ${str(p.text, 400) || '(none)'}` });
        imgBlocks(p.imgs).forEach((b) => content.push(b));
      });
      if (!Object.keys(ids).length) return res.status(400).json({ error: 'no posts' });
      const sys = `${READ}\nFor each post write ONE line fingerprint (max 220 chars) in exactly this order: direction | time frame | price vs VWAP | price vs 9 EMA | volume behavior | candle pattern | gap/context. If a post is not a trade chart, make its fingerprint "not a trade chart". Reply with ONLY JSON: {"posts":[{"id":"...","s":"..."}]} with every id once.`;
      const out = await ask(sys, content, 1800);
      if (!out || !Array.isArray(out.posts)) return res.status(502).json({ error: 'AI answer could not be read' });
      return res.status(200).json({ ok: true, posts: out.posts.filter((p) => p && ids[String(p.id)]).map((p) => ({ id: String(p.id), s: str(p.s, 260) })) });
    }
    if (action === 'match') {
      const cands = (Array.isArray(body.cands) ? body.cands : []).slice(0, 250).map((c) => ({ id: str(c.id, 80), s: str(c.s, 260), t: str(c.t, 100) })).filter((c) => c.id && c.s && !/^not a trade chart/i.test(c.s));
      if (!cands.length) return res.status(200).json({ ok: true, posts: [] });
      const sys = `You compare a day trader's trade setups by their fingerprints. The TARGET is the trade he picked. For each CANDIDATE decide whether it is the SAME setup (same mechanic and direction, similar VWAP and 9 EMA relationship, similar volume behavior and candle pattern), ignoring the ticker, the date and price level. Score 0-100 (80+ = clearly the same setup, 50-79 = close but different in one important way, below 50 = different). Return only candidates scoring 50 or more, best first, at most 40. Reply with ONLY JSON: {"posts":[{"id":"...","score":85,"why":"max 14 words on what matches (and what differs)"}]}`;
      const out = await ask(sys, [{ type: 'text', text: `TARGET: ${str(body.target, 1200)}\n\nCANDIDATES:\n${cands.map((c) => `${c.id} :: ${c.s}${c.t ? ' :: caption: ' + c.t : ''}`).join('\n')}` }], 3000);
      if (!out || !Array.isArray(out.posts)) return res.status(502).json({ error: 'AI answer could not be read' });
      const ok = {}; cands.forEach((c) => { ok[c.id] = 1; });
      return res.status(200).json({ ok: true, posts: out.posts.filter((p) => p && ok[String(p.id)]).slice(0, 40).map((p) => ({ id: String(p.id), score: Math.max(0, Math.min(100, Number(p.score) || 0)), why: str(p.why, 140) })) });
    }
    return res.status(400).json({ error: 'unknown action' });
  } catch (e) { return res.status(e.code || 502).json({ error: e.message || 'AI request failed' }); }
};
module.exports._t = { parseJson };
