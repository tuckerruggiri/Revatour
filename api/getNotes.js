// api/getNotes.js

import { supabaseAdmin } from './_supabaseClient.js';

export default async function handler(req, res) {
  // Example request: GET /api/getNotes?ticker=AAPL
  const { ticker } = req.query;
  const userId = 'demo-user'; // placeholder until we add auth

  if (!ticker) {
    res.status(400).json({ error: 'ticker is required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('notes')
    .select('*')
    .eq('ticker', ticker.toUpperCase())
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getNotes error:', error);
    res.status(500).json({ error: 'failed to load notes' });
    return;
  }

  // Return an array of note objects
  res.status(200).json({ notes: data || [] });
}
