// api/config.js
// Hands the browser the PUBLIC Supabase values (URL + anon key). Never put the service key here.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  });
};
