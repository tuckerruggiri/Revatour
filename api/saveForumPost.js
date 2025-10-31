// api/saveForumPost.js

// load env locally only
if (process.env.VERCEL !== '1') {
  require('dotenv').config({ path: '.env.local' });
}

module.exports = async (req, res) => {
  // 1) allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2) sometimes req.body is empty in Vercel dev → read it manually
    let body = req.body;
    if (!body) {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => {
          if (!data) return resolve({});
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            return reject(err);
          }
        });
        req.on('error', reject);
      });
    }

    // 3) normalize payload
    const ticker = (body.ticker || '').toUpperCase();
    const text = body.text || body.content || '';
    const confidence =
      typeof body.confidence === 'number'
        ? body.confidence
        : parseInt(body.confidence || '3', 10);
    const image_data = body.image_data || null;

    // 4) validate
    if (!ticker || !text) {
      console.log('❌ saveForumPost missing field:', body);
      return res.status(400).json({
        error: 'ticker and text/content are required',
      });
    }

    // 5) build a post object to send back to the client
    const post = {
      ticker,
      text,
      content: text,
      confidence: confidence || 3,
      image_data,
      author: 'You', // in real app you’d read user
      created_at: new Date().toISOString(),
    };

    // 6) (optional) store to real DB here

    console.log('✅ saveForumPost OK:', post);

    // 7) send it back so frontend can .unshift()
    return res.status(200).json({ ok: true, post });
  } catch (err) {
    console.error('❌ /api/saveForumPost crashed:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
