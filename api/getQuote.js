// api/getQuote.js

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    res.status(400).json({ error: "ticker is required, ex: /api/getQuote?ticker=MSFT" });
    return;
  }

  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server missing ALPHAVANTAGE_API_KEY" });
    return;
  }

  try {
    // Alpha Vantage GLOBAL_QUOTE gives latest price + previous close
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
      ticker
    )}&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    // Helpful debug info to see what we actually got back
    // NOTE: console.log runs server-side (shows up in Vercel function logs)
    console.log("AlphaVantage raw response for", ticker, data);

    const quote = data["Global Quote"];
    if (!quote) {
      res.status(502).json({
        error: "No quote data returned",
        note: "Alpha Vantage didn't include Global Quote. Possibly rate limit or invalid ticker.",
        tickerRequested: ticker,
        raw: data
      });
      return;
    }

    const currentPrice = parseFloat(quote["05. price"]);
    const prevClose = parseFloat(quote["08. previous close"]);

    let changePct = null;
    if (!isNaN(currentPrice) && !isNaN(prevClose) && prevClose !== 0) {
      changePct = ((currentPrice - prevClose) / prevClose) * 100;
    }

    res.status(200).json({
      ticker: ticker.toUpperCase(),
      currentPrice,
      prevClose,
      changePct // number like 1.23 or -0.45
    });
  } catch (err) {
    console.error("getQuote error for", ticker, err);
    res.status(500).json({ error: "failed to fetch quote", tickerRequested: ticker });
  }
}
