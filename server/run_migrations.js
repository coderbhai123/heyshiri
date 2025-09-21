require('dotenv').config();
const fs = require('fs');
const path = require('path');
const neon = require('./neon_client');

async function run() {
  const conn = process.env.NEON_DATABASE_URL;
  if (!conn) {
    console.error('NEON_DATABASE_URL not set');
    process.exit(2);
  }
  neon.init();
  const sqlPath = path.join(__dirname, 'migrations', 'create_rsvps.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  try {
    const { Pool } = require('pg');
    // reuse pool from neon_client
    const pool = require('./neon_client')._pool || null;
    // But neon_client doesn't expose pool; just run a new pool here quickly
    const tempPool = new Pool({ connectionString: conn });
    await tempPool.query(sql);
    await tempPool.end();
    console.log('Migrations applied');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err && err.message ? err.message : err);
    process.exit(3);
  }
}

run();
