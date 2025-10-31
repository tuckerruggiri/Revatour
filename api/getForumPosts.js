// api/getForumPosts.js

import { supabaseAdmin } from './_supabaseClient.js';

export default async function handler(req, res) {
  const { ticker } = req.query;
  
  if (!ticker) {
    return res.status(400).json({ error: 'ticker is required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('forum_posts')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getForumPosts error:', error);
      return res.status(500).json({ error: 'Failed to load forum posts' });
    }

    return res.status(200).json({ posts: data || [] });
  } catch (err) {
    console.error('getForumPosts exception:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}