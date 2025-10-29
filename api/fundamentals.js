export default async function handler(req, res) {
  // read ?symbol=AMD from the URL
  const { symbol } = req.query;

  // read your secret key from Vercel env vars
  const FINNHUB_KEY = process.env.FINNHUB_KEY;

  if (!symbol) {
    return res.status(400).json({ error: 'Missing ?symbol= parameter' });
  }

  try {
    // 1. Company fundamentals / profile (name, HQ, etc)
    const profileRes = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(
        symbol
      )}&token=${FINNHUB_KEY}`
    );

    if (!profileRes.ok) {
      return res
        .status(502)
        .json({ error: 'Profile request to Finnhub failed' });
    }

    const profile = await profileRes.json();

    // 2. Latest quote (price, change %, etc)
    const quoteRes = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
        symbol
      )}&token=${FINNHUB_KEY}`
    );

    if (!quoteRes.ok) {
      return res
        .status(502)
        .json({ error: 'Quote request to Finnhub failed' });
    }

    const quote = await quoteRes.json();

    // Send back only what the frontend needs
    return res.status(200).json({
      ticker: profile.ticker || symbol.toUpperCase(),
      name: profile.name || '',
      hqCity: profile.city || '',
      hqState: profile.state || '',
      hqCountry: profile.country || '',
      price: quote.c ?? null,
      changePercent: quote.dp ?? null,
      marketCap: profile.marketCapitalization ?? null,
      sharesOut: profile.shareOutstanding ?? null,
      currency: profile.currency || 'USD',
      exchange: profile.exchange || '',
      logo: profile.logo || ''
    });
  } catch (err) {
    console.error('finnhub fundamentals error', err);
    return res
      .status(500)
      .json({ error: 'Something went wrong talking to Finnhub' });
  }
}
