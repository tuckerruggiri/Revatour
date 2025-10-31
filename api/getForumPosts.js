// api/getForumPosts.js

module.exports = (req, res) => {
  try {
    const ticker = req.query && req.query.ticker ? req.query.ticker : null;

    res.status(200).json({
      ticker,
      posts: [],
    });
  } catch (err) {
    console.error('getForumPosts error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
