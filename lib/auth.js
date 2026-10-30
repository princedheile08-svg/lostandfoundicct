const crypto = require('crypto');
const secret = () => process.env.AUTH_SECRET || '';
const sign = v => crypto.createHmac('sha256', secret()).update(v).digest('base64url');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
// Signed bearer token (works from GitHub Pages and Vercel alike; no cross-site cookies needed)
function issue(role) {
  const v = Buffer.from(JSON.stringify({ role, exp: Date.now() + 12 * 3600e3 })).toString('base64url');
  return v + '.' + sign(v);
}
function role(req) {
  if (!secret()) return 'Student';
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return 'Student';
  const [v, sig] = m[1].split('.');
  if (!v || !sig || !same(sig, sign(v))) return 'Student';
  try { const p = JSON.parse(Buffer.from(v, 'base64url')); return p.exp > Date.now() ? p.role : 'Student'; } catch { return 'Student'; }
}
const rank = { Student: 0, Staff: 1, Admin: 2 };
const can = (req, min) => rank[role(req)] >= rank[min];
module.exports = { issue, role, can, same };
