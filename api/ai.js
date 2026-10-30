const { query } = require('../lib/db');
const cors = require('../lib/cors');
const { can } = require('../lib/auth');
const CATS = ['Electronics', 'ID & Cards', 'Bags & Clothing', 'School Supplies', 'Keys & Personal', 'Other'];
const FAST = process.env.MODEL_FAST || 'claude-haiku-5-5', MAIN = process.env.MODEL_MAIN || 'claude-sonnet-5-5';
async function claude(model, content, max = 600) {
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: max, messages: [{ role: 'user', content }] }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || 'AI error');
  return j.content.filter(c => c.type === 'text').map(c => c.text).join('');
}
const json = t => { const m = t.match(/[\[{][\s\S]*[\]}]/); return JSON.parse(m ? m[0] : t); };
const brief = rows => rows.map(r => ({ id: r.id, title: r.title, category: r.category, type: r.type, status: r.status, location: r.location, date: new Date(r.item_date).toLocaleDateString('en-CA'), description: r.description }));
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'AI is not configured' });
  const { action, id, image, messages } = req.body || {};
  try {
    if (action === 'fill') {
      const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(image || '');
      if (!m || m[2].length > 400000) return res.status(400).json({ error: 'Invalid image' });
      const t = await claude(FAST, [{ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } }, { type: 'text', text: `Photo of a school lost-and-found item. Reply with JSON only: {"title":short item name,"category":one of ${JSON.stringify(CATS)},"description":one or two sentences on color, brand, marks}` }]);
      return res.json(json(t));
    }
    const rows = brief(await query('SELECT * FROM items ORDER BY created_at DESC LIMIT 100'));
    if (action === 'match') {
      const it = rows.find(r => r.id === id); if (!it) return res.status(404).json({ error: 'Not found' });
      const pool = rows.filter(r => r.id !== id && r.status !== 'Claimed' && r.type !== it.type);
      if (!pool.length) return res.json({ matches: [] });
      const t = await claude(MAIN, `Target: ${JSON.stringify(it)}\nCandidates: ${JSON.stringify(pool)}\nRank candidates that could be the same physical object. JSON only: array of up to 3 {"id","score":0-100,"reason":one short sentence}. [] if none.`);
      const ids = new Set(pool.map(p => p.id));
      return res.json({ matches: json(t).filter(m => ids.has(m.id)) });
    }
    if (action === 'insights') {
      if (!can(req, 'Staff')) return res.status(403).json({ error: 'Staff sign-in required' });
      return res.json({ text: await claude(MAIN, `You assist a campus administrator. Summarize these lost-and-found reports in under 120 words: hotspots, unclaimed items needing follow-up, one suggestion. Plain text.\n${JSON.stringify(rows)}`) });
    }
    if (action === 'chat') {
      const convo = (messages || []).slice(-8).map(m => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${String(m.content).slice(0, 500)}`).join('\n');
      return res.json({ text: await claude(MAIN, `You are the assistant for ICCT Colleges Foundation Inc. campus Lost & Found. Be concise (max 90 words). To claim an item, bring a valid school ID to the guard house and describe a detail only the owner knows. Reports: ${JSON.stringify(rows.filter(r => r.status !== 'Claimed'))}\nIf the user describes an item, point to likely matches by title and location. Never invent items.\n\n${convo}\nAssistant:`, 400) });
    }
    res.status(400).json({ error: 'Unknown action' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'AI request failed' }); }
};
