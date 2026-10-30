module.exports = (req, res) => {
  const o = process.env.ALLOWED_ORIGIN; // e.g. https://yourname.github.io
  if (o) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
};
