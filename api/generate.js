// api/generate.js — signed-in users send a prompt, the AI's text streams back.
// Needs Vercel env vars: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY.
// Optional: ALLOWED_EMAILS (comma list) to limit who can spend your API credits.
// Optional: ANTHROPIC_MODEL (defaults to claude-sonnet-5-5).

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'use POST' });

  // 1) who is asking? verify the Supabase login token
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'log in first' });
  let user;
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(401).json({ error: 'invalid login' });
    user = await r.json();
  } catch (e) {
    return res.status(500).json({ error: 'auth check failed' });
  }

  const allowed = (process.env.ALLOWED_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes((user.email || '').toLowerCase())) {
    return res.status(403).json({ error: 'not on the allowed list' });
  }

  // 2) the prompt
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const prompt = body && typeof body.prompt === 'string' ? body.prompt : '';
  if (!prompt || prompt.length > 120000) return res.status(400).json({ error: 'prompt missing or too long' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'AI key not set' });

  // 3) ask the AI, stream plain text back
  try {
    const up = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 8000,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!up.ok) {
      console.error('anthropic error', up.status, await up.text());
      return res.status(up.status === 429 ? 429 : 502).json({ error: 'AI request failed' });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const reader = up.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        try {
          const ev = JSON.parse(line.slice(5));
          if (ev.type === 'content_block_delta' && ev.delta && ev.delta.text) res.write(ev.delta.text);
        } catch (e) { /* ignore partial lines */ }
      }
    }
    res.end();
  } catch (e) {
    console.error('generate crashed', e);
    if (!res.headersSent) res.status(500).json({ error: 'generate failed' });
    else res.end();
  }
};
