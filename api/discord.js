// api/discord.js — bulk-import YOUR OWN messages from YOUR Discord server into Revatour pages.
// Vercel env vars: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_USER_ID (your Discord user id),
// DISCORD_OWNER_EMAIL (the email you log in to Revatour with; only that account may use this).
// The bot only needs View Channels + Read Message History. The token never leaves the server.
// Actions (?action=): status | channels | messages&channel=ID&after=ID | file&url=https://cdn.discordapp.com/...

const API = 'https://discord.com/api/v10';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function dget(path) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(API + path, { headers: { Authorization: 'Bot ' + process.env.DISCORD_BOT_TOKEN, 'User-Agent': 'Revatour (import, 1.0)' } });
    if (r.status === 429) {
      const j = await r.json().catch(() => ({}));
      const w = Math.ceil((j.retry_after || 1) * 1000);
      if (w > 6000) { const e = new Error('rate limited'); e.code = 429; throw e; }
      await sleep(w + 50); continue;
    }
    if (!r.ok) { const e = new Error('discord ' + r.status); e.code = r.status; throw e; }
    return r.json();
  }
  const e = new Error('rate limited'); e.code = 429; throw e;
}

function fileUrl(u) {
  // Discord's media proxy can resize on the fly, which keeps big screenshots under Vercel's response limit.
  try {
    const x = new URL(u);
    if (x.hostname !== 'cdn.discordapp.com' && x.hostname !== 'media.discordapp.net') return null;
    return x;
  } catch (e) { return null; }
}

module.exports = async (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'log in first' });
  let email = '';
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(401).json({ error: 'invalid login' });
    email = String((await r.json()).email || '').toLowerCase();
  } catch (e) { return res.status(500).json({ error: 'auth check failed' }); }

  const need = ['DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID', 'DISCORD_USER_ID', 'DISCORD_OWNER_EMAIL'];
  const missing = need.filter((k) => !process.env[k]);
  const q = req.query || {};
  const action = String(q.action || 'status');
  if (missing.length) return res.status(200).json({ configured: false, missing });
  if (email !== String(process.env.DISCORD_OWNER_EMAIL).trim().toLowerCase()) {
    return res.status(403).json({ configured: true, allowed: false, error: 'This Discord connection belongs to another account.' });
  }
  if (action === 'status') return res.status(200).json({ configured: true, allowed: true });

  try {
    if (action === 'channels') {
      const list = await dget(`/guilds/${process.env.DISCORD_GUILD_ID}/channels`);
      const cats = list.filter((c) => c.type === 4).sort((a, b) => a.position - b.position).map((c) => ({ id: c.id, name: c.name }));
      const chans = list.filter((c) => c.type === 0 || c.type === 5).sort((a, b) => a.position - b.position)
        .map((c) => ({ id: c.id, name: c.name, parent: c.parent_id || '' }));
      return res.status(200).json({ configured: true, allowed: true, categories: cats, channels: chans });
    }

    if (action === 'messages') {
      const ch = String(q.channel || '');
      if (!/^\d{5,25}$/.test(ch)) return res.status(400).json({ error: 'bad channel' });
      let after = /^\d{1,25}$/.test(String(q.after || '')) ? String(q.after) : '0';
      const mine = [];
      let scanned = 0, done = false;
      const t0 = Date.now();
      for (let page = 0; page < 5 && Date.now() - t0 < 18000; page++) {
        let batch;
        try { batch = await dget(`/channels/${ch}/messages?limit=100&after=${after}`); }
        catch (e) {
          if (e.code === 429 && scanned > 0) break;
          if (e.code === 403 || e.code === 404) return res.status(200).json({ ok: false, error: 'The bot cannot see that channel. Give it View Channel and Read Message History there.' });
          throw e;
        }
        if (!batch.length) { done = true; break; }
        batch.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
        scanned += batch.length;
        after = batch[batch.length - 1].id;
        batch.forEach((m) => {
          if (!m.author || m.author.id !== process.env.DISCORD_USER_ID) return;
          if (m.type !== 0 && m.type !== 19) return;
          const imgs = [], other = [];
          (m.attachments || []).forEach((a) => {
            if (/^image\//.test(a.content_type || '') || /\.(png|jpe?g|gif|webp)$/i.test(a.filename || '')) imgs.push({ url: a.url, name: a.filename, size: a.size });
            else other.push(a.filename);
          });
          mine.push({ id: m.id, ts: Date.parse(m.timestamp), text: m.content || '', imgs, other });
        });
        if (batch.length < 100) { done = true; break; }
      }
      return res.status(200).json({ ok: true, items: mine, next: after, scanned, done });
    }

    if (action === 'file') {
      const u = fileUrl(String(q.url || ''));
      if (!u) return res.status(400).json({ error: 'bad url' });
      const tries = [];
      const small = new URL(u.toString());
      small.hostname = 'media.discordapp.net';
      small.searchParams.set('width', '1600'); small.searchParams.set('height', '1600'); small.searchParams.set('format', 'webp');
      tries.push(small.toString(), u.toString());
      for (const t of tries) {
        try {
          const r = await fetch(t);
          if (!r.ok) continue;
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.length > 4300000) continue;
          res.setHeader('Content-Type', r.headers.get('content-type') || 'application/octet-stream');
          res.setHeader('Cache-Control', 'private, no-store');
          return res.status(200).send(buf);
        } catch (e) { /* try next */ }
      }
      return res.status(502).json({ error: 'could not fetch that file' });
    }
    return res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    return res.status(500).json({ error: 'discord request failed', code: e.code || 0 });
  }
};
