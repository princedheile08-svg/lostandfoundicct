const { query } = require('../lib/db');
const cors = require('../lib/cors');
const { can, role } = require('../lib/auth');
const CATS = ['Electronics', 'ID & Cards', 'Bags & Clothing', 'School Supplies', 'Keys & Personal', 'Other'];
const map = r => ({ id: r.id, title: r.title, category: r.category, type: r.type, status: r.status, location: r.location, date: new Date(r.item_date).toLocaleDateString('en-CA'), description: r.description || '', image: r.image || '', reportedBy: r.reported_by });
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try {
    const id = req.query.id;
    if (req.method === 'GET') {
      const rows = await query('SELECT * FROM items ORDER BY created_at DESC LIMIT 500');
      return res.json({ items: rows.map(map), role: role(req) });
    }
    if (req.method === 'POST') {
      const b = req.body || {}, t = String(b.title || '').trim().slice(0, 160), l = String(b.location || '').trim().slice(0, 200);
      if (!t || !l || !/^\d{4}-\d{2}-\d{2}$/.test(b.date) || !['Lost', 'Found'].includes(b.type)) return res.status(400).json({ error: 'Title, location, date and type are required' });
      const img = typeof b.image === 'string' && b.image.startsWith('data:image/') && b.image.length < 400000 ? b.image : null;
      const nid = 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await query('INSERT INTO items (id,title,category,type,status,location,item_date,description,image,reported_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [nid, t, CATS.includes(b.category) ? b.category : 'Other', b.type, b.type, l, b.date, String(b.description || '').slice(0, 2000), img, role(req)]);
      return res.status(201).json({ id: nid });
    }
    if (req.method === 'PATCH') {
      if (!can(req, 'Staff')) return res.status(403).json({ error: 'Staff sign-in required' });
      const r = await query("UPDATE items SET status='Claimed' WHERE id=?", [id]);
      return res.json({ ok: r.affectedRows > 0 });
    }
    if (req.method === 'DELETE') {
      if (!can(req, 'Admin')) return res.status(403).json({ error: 'Admin sign-in required' });
      await query('DELETE FROM items WHERE id=?', [id]);
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (e) { console.error(e); res.status(500).json({ error: 'Database error: ' + e.message }); }
};
