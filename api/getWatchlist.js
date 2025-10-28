// api/getWatchlist.js

import { supabaseAdmin } from './_supabaseClient.js';

export default async function handler(req, res) {
  const userId = 'demo-user';

  const { data, error } = await supabaseAdmin
    .from('watchlist')
    .select('ticker')
    .eq('user_id', userId)
    .order('added_at', { ascending: true });

  if (error) {
    console.error('getWatchlist error:', error);
    res.status(500).json({ error: 'failed to load watchlist' });
    return;
  }

  // we only care about the tickers, not the row ids
  const tickers = (data || []).map(row => row.ticker);

  res.status(200).json({ watchlist: tickers });
}
