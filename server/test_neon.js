require('dotenv').config();
const { Pool } = require('pg');

async function test() {
  const conn = process.env.NEON_DATABASE_URL;
  if (!conn) {
    console.error('NEON_DATABASE_URL not set in env');
    process.exit(2);
  }
  const pool = new Pool({ connectionString: conn });
  try {
    const r = await pool.query('SELECT 1 as ok');
    console.log('DB test ok:', r.rows[0]);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('DB test failed:', err && err.message ? err.message : err);
    process.exit(3);
  }
}

test();
