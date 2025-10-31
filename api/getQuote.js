// api/getQuote.js
const https = require('https');

// 🟣 only load .env.local when NOT on Vercel
if (process.env.VERCEL !== '1') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (e) {
    console.log('no .env.local found (local dev)');
  }
}

module.exports = (req, res) => {
  const symbol = req.query.symbol || req.query.ticker;
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!symbol) {
    return res.status(400).json({ error: 'symbol or ticker is required' });
  }

  if (!apiKey) {
    return res.status(400).json({ error: 'Server missing FINNHUB_API_KEY' });
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
