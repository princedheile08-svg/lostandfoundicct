const mysql = require('mysql2/promise');
let pool, ready;
const SCHEMA = require('fs').readFileSync(require('path').join(__dirname, '..', 'schema.sql'), 'utf8');
const DEMO = [
  ['Apple AirPods Pro case','Electronics','Found','Found','Library 2nd floor study desk','2026-10-20','White charging case near the window tables. Small scratch on the back.','Student'],
  ['Matte blue Hydro Flask','School Supplies','Lost','Lost','Gymnasium bleachers','2026-10-22','32oz bottle with a NASA sticker and a mountain sticker.','Student'],
  ['Student ID card (BSIT)','ID & Cards','Found','Found','Cafeteria counter 3','2026-10-23','ID inside a blue lanyard, found near the cash register.','Staff'],
  ['Black Herschel backpack','Bags & Clothing','Lost','Claimed','Science Building Room 201','2026-10-15','Contains notebooks and a red pencil case.','Student'],
];
function db() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
    pool = mysql.createPool({ uri: process.env.DATABASE_URL, ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }, connectionLimit: 2, maxIdle: 1, idleTimeout: 20000, enableKeepAlive: true });
  }
  return pool;
}
async function query(sql, params) {
  const p = db();
  if (!ready) ready = (async () => {
    await p.query(SCHEMA);
    const [[{ n }]] = await p.query('SELECT COUNT(*) n FROM items');
    if (!n) for (const d of DEMO) await p.query('INSERT INTO items (id,title,category,type,status,location,item_date,description,reported_by) VALUES (?,?,?,?,?,?,?,?,?)', ['demo' + Math.random().toString(36).slice(2, 9), ...d]);
  })().catch(e => { ready = null; throw e; });
  await ready;
  return (await p.query(sql, params))[0];
}
module.exports = { query };
