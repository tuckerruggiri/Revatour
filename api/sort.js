// api/sort.js — signed-in users send a small batch of posts (caption text + screenshot URLs) and the AI
// sorts them into strategy groups. Needs ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY.
// Optional: ALLOWED_EMAILS (same list as /api/generate), ANTHROPIC_MODEL.
// Images must be publicly reachable URLs (your Supabase "images" bucket is public).

const MAX_POSTS = 10, MAX_IMGS = 3;

function parseJson(t) {
  const s = String(t || '').replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
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

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const posts = Array.isArray(body && body.posts) ? body.posts.slice(0, MAX_POSTS) : [];
  if (!posts.length) return res.status(400).json({ error: 'no posts' });
  const groups = (Array.isArray(body.groups) ? body.groups : []).slice(0, 40).map((g) => ({ name: String(g.name || '').slice(0, 40), desc: String(g.desc || '').slice(0, 200) })).filter((g) => g.name);
  const hints = (Array.isArray(body.hints) ? body.hints : []).slice(0, 30).map((h) => String(h).slice(0, 40));

  const content = [];
  const ids = {};
  posts.forEach((p) => {
    const id = String(p.id || '').slice(0, 60); if (!id) return;
    ids[id] = 1;
    content.push({ type: 'text', text: `POST ${id}\nCaption: ${String(p.text || '').slice(0, 500) || '(none)'}` });
    (Array.isArray(p.imgs) ? p.imgs : []).slice(0, MAX_IMGS).forEach((u) => {
      if (/^https:\/\//.test(String(u))) content.push({ type: 'image', source: { type: 'url', url: String(u) } });
    });
  });
  const sys = `You sort a day trader's saved A+ setup posts into trading strategies. The screenshots are usually thinkorswim charts. Text drawn on the chart or in the caption often names the setup (for example lines like "SETUP = ...", "TRIGGER = ...", or short tags). Use those labels first; the trader's own names are the best group names. Otherwise group by the visible pattern and entry logic (what the trade was, which direction, what triggered it).
${hints.length ? 'Setup names the trader already uses (use these exact names when a post matches): ' + hints.join(', ') + '.\n' : ''}${groups.length ? 'Groups so far (reuse one when a post clearly matches it, with the exact same name): ' + JSON.stringify(groups) + '\n' : 'No groups exist yet.\n'}Create a new group only when a post does not fit an existing one. Group names are short (1 to 3 words) and describe the strategy. If a post cannot be placed (no readable label, unclear picture), put it in the group "Not sure".
Reply with ONLY JSON, no other text: {"groups":[{"name":"...","desc":"one short sentence on what defines it"}],"posts":[{"id":"...","group":"..."}]}. "groups" lists only groups that are new in this batch. Every post id must appear once in "posts".`;
  try {
    const up = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 2500, system: sys, messages: [{ role: 'user', content }] }),
    });
    if (!up.ok) { console.error('anthropic error', up.status, await up.text()); return res.status(up.status === 429 ? 429 : 502).json({ error: 'AI request failed' }); }
    const j = await up.json();
    const text = (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    const out = parseJson(text);
    if (!out || !Array.isArray(out.posts)) return res.status(502).json({ error: 'AI answer could not be read' });
    const assigned = out.posts.filter((p) => p && ids[String(p.id)]).map((p) => ({ id: String(p.id), group: String(p.group || 'Not sure').slice(0, 40) }));
    const newGroups = (Array.isArray(out.groups) ? out.groups : []).map((g) => ({ name: String(g.name || '').slice(0, 40), desc: String(g.desc || '').slice(0, 200) })).filter((g) => g.name);
    return res.status(200).json({ ok: true, groups: newGroups, posts: assigned });
  } catch (e) { return res.status(502).json({ error: 'AI request failed' }); }
};
module.exports._t = { parseJson };
