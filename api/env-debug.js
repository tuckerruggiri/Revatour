// api/env-debug.js

module.exports = (req, res) => {
  res.status(200).json({
    vercel: process.env.VERCEL || 'not-vercel',
    finnhubKeyExists: !!process.env.FINNHUB_API_KEY,
    finnhubKeyFirst5: process.env.FINNHUB_API_KEY
      ? process.env.FINNHUB_API_KEY.slice(0, 5) + '...'
      : null,
    allKeys: Object.keys(process.env).filter((k) =>
      k.toLowerCase().includes('finn')
    ),
  });
};
