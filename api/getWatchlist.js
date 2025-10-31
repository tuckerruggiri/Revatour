// api/getWatchlist.js

module.exports = (req, res) => {
  try {
    const demoWatchlist = [
      { symbol: 'AAPL' },
      { symbol: 'MSFT' },
      { symbol: 'GOOGL' },
    ];

    res.status(200).json({ watchlist: demoWatchlist });
  } catch (err) {
    console.error('getWatchlist error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
