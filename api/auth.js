const { issue, role, same } = require('../lib/auth');
const cors = require('../lib/cors');
module.exports = (req, res) => {
  if (cors(req, res)) return;
  if (req.method === 'GET') return res.json({ role: role(req) });
  if (req.method === 'DELETE') return res.json({ role: 'Student' });
  if (req.method !== 'POST') return res.status(405).end();
  const { role: r, password } = req.body || {};
  const expected = r === 'Admin' ? process.env.ADMIN_PASSWORD : r === 'Staff' ? process.env.STAFF_PASSWORD : null;
  if (!expected || !process.env.AUTH_SECRET || !same(password || '', expected)) return res.status(401).json({ error: 'Wrong role or password' });
  res.json({ role: r, token: issue(r) });
};
