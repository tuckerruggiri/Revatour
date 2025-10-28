// api/toggleWatchlist.js

import { supabaseAdmin } from './_supabaseClient.js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'use POST' });
    return;
  }

  const { ticker, watching } = req.body || {};
  const userId = 'demo-user';

  if (!ticker || typeof watching === 'undefined') {
    res.status(400).json({ error: 'ticker and watching are required' });
    return;
  }

  if (watching) {
    // add (or keep) in watchlist
    const { error } = await supabaseAdmin
      .from('watchlist')
      .upsert(
        {
          ticker: ticker.toUpperCase(),
          user_id: userId,
          added_at: new Date().toISOString()
        },
        { onConflict: 'user_id,ticker' } // avoid duplicates
      );

    if (error) {
      console.error('toggleWatchlist upsert error:', error);
      res.status(500).json({ error: 'failed to add to watchlist' });
      return;
    }

    res.status(200).json({ ok: true, watching: true });
  } else {
    // remove from watchlist
    const { error } = await supabaseAdmin
      .from('watchlist')
      .delete()
      .eq('ticker', ticker.toUpperCase())
      .eq('user_id', userId);

    if (error) {
      console.error('toggleWatchlist delete error:', error);
      res.status(500).json({ error: 'failed to remove from watchlist' });
      return;
    }

    res.status(200).json({ ok: true, watching: false });
  }
}
