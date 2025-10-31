// api/fundamentals.js

const https = require('https');

// 🟣 only load .env.local when NOT on Vercel
if (process.env.VERCEL !== '1') {
  // local dev
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (e) {
    console.log('no .env.local found (local dev)');
  }
}

module.exports = (req, res) => {
  // ✅ accept symbol OR ticker
  const symbol =
    (req.query && (req.query.symbol || req.query.ticker || req.query.sym)) || null;

  const apiKey = process.env.FINNHUB_API_KEY; // ← will be set by Vercel in prod

  if (!symbol) {
    return res.status(400).json({ error: 'symbol or ticker is required' });
  }

  // if key is still missing, tell us WHERE we are
  if (!apiKey) {
    console.log('⚠️ FINNHUB_API_KEY not found in env');
    return res.status(200).json({
      symbol,
      name: symbol,
      price: 0,
      changePercent: 0,
      marketCap: null,
      sharesOut: null,
      source: 'mock (no FINNHUB_API_KEY)',
      where: process.env.VERCEL ? 'vercel' : 'local'
    });
  }

  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
    symbol
  )}&token=${apiKey}`;

  https
    .get(url, (r) => {
      let data = '';
      r.on('data', (chunk) => (data += chunk));
      r.on('end', () => {
        try {
          const json = JSON.parse(data);

          const price = Number(json.c);
          const change = Number(json.d);
          const changePercent = Number(json.dp);

          return res.status(200).json({
            ticker: symbol,
            symbol,
            name: symbol,
            price: isNaN(price) ? 0 : price,
            change: isNaN(change) ? 0 : change,
            changePercent: isNaN(changePercent) ? 0 : changePercent,
            marketCap: null,
            sharesOut: null,
            source: 'finnhub',
            where: process.env.VERCEL ? 'vercel' : 'local'
          });
        } catch (err) {
          console.error('finnhub parse error:', err);
          return res.status(500).json({ error: 'failed to parse finnhub data' });
        }
      });
    })
    .on('error', (err) => {
      console.error('finnhub request error:', err);
      return res.status(500).json({ error: 'finnhub request failed' });
    });
};
