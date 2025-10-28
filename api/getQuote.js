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
    // Alpha Vantage endpoint: GLOBAL_QUOTE gives latest price + previous close
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
      ticker
    )}&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    // Alpha Vantage returns data like:
    // {
    //   "Global Quote": {
    //     "01. symbol": "MSFT",
    //     "05. price": "430.1200",
    //     "08. previous close": "428.3000",
    //     "09. change": "1.8200",
    //     "10. change percent": "0.4250%"
    //   }
    // }

    const quote = data["Global Quote"];
    if (!quote) {
      res.status(500).json({ error: "No quote data returned" });
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
      changePct, // number like 1.23 or -0.45
    });
  } catch (err) {
    console.error("getQuote error:", err);
    res.status(500).json({ error: "failed to fetch quote" });
  }
}
