const { Pool } = require('pg');
require('dotenv').config();

let pool;

function init() {
  const conn = process.env.NEON_DATABASE_URL;
  if (!conn) return null;
  pool = new Pool({ connectionString: conn });
  return pool;
}

async function insertRsvp(rsvp) {
  if (!pool) throw new Error('DB pool not initialized');
  const text = `INSERT INTO rsvps(side, name, phone, guests, arrival_date, coming, notes, created_at)
    VALUES($1,$2,$3,$4,$5,$6,$7, NOW()) RETURNING *`;
  const vals = [rsvp.side, rsvp.name, rsvp.phone, rsvp.guests || 0, rsvp.arrivalDate || null, rsvp.coming || 0, rsvp.notes || null];
  const res = await pool.query(text, vals);
  return res.rows[0];
}

async function listRsvps() {
  if (!pool) throw new Error('DB pool not initialized');
  const res = await pool.query('SELECT * FROM rsvps ORDER BY created_at DESC');
  return res.rows;
}

async function getRsvp(id) {
  if (!pool) throw new Error('DB pool not initialized');
  const res = await pool.query('SELECT * FROM rsvps WHERE id = $1', [id]);
  return res.rows[0];
}

async function deleteRsvp(id) {
  if (!pool) throw new Error('DB pool not initialized');
  await pool.query('DELETE FROM rsvps WHERE id = $1', [id]);
  return true;
}

module.exports = { init, insertRsvp, listRsvps, getRsvp, deleteRsvp };
