// api/forum.js

module.exports = async (req, res) => {
  // only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel should give us req.body if JSON, but sometimes it's empty.
    let body = req.body;

    // If body is missing, try to read it manually
    if (!body) {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => {
          data += chunk;
        });
        req.on('end', () => {
          if (!data) return resolve({});
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            // bad JSON from client
            return reject(err);
          }
        });
        req.on('error', reject);
      });
    }

    const ticker = body.ticker;
    const content = body.content;
    const author = body.author || 'anonymous';

    // validate
    if (!ticker || !content) {
      return res
        .status(400)
        .json({ error: 'ticker and content are required' });
    }

    // 👉 here is where you'd actually save to DB / file
    console.log('Saving forum post:', { ticker, content, author });

    // respond OK so frontend stops showing 500
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('API /api/forum crashed:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
