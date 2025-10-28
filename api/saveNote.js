// api/saveNote.js

import { supabaseAdmin } from './_supabaseClient.js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'use POST' });
    return;
  }

  const { ticker, body } = req.body || {};
  const userId = 'demo-user'; // placeholder until we add auth

  if (!ticker || !body) {
    res.status(400).json({ error: 'ticker and body are required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('notes')
    .insert([
      {
        ticker: ticker.toUpperCase(),
        body,
        user_id: userId,
        created_at: new Date().toISOString()
      }
    ])
    .select('*'); // return the inserted row

  if (error) {
    console.error('saveNote error:', error);
    res.status(500).json({ error: 'failed to save note' });
    return;
  }

  res.status(200).json({
    ok: true,
    note: data && data[0] ? data[0] : null
  });
}
