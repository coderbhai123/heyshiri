// Simple migration runner: runs server/migrations/create_rsvps.sql against NEON_DATABASE_URL
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function runMigrations() {
  const conn = process.env.NEON_DATABASE_URL;
  if (!conn) {
    console.error('NEON_DATABASE_URL not set in environment. Aborting.');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, 'migrations', 'create_rsvps.sql');
  let sql;
  try {
    sql = fs.readFileSync(sqlPath, 'utf8');
  } catch (err) {
    console.error('Unable to read migration file:', err.message || err);
    process.exit(2);
  }

  const pool = new Pool({ connectionString: conn });
  try {
    console.log('Running migrations...');
    await pool.query(sql);
    console.log('Migrations completed successfully.');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err && err.message ? err.message : err);
    try { await pool.end(); } catch (e) {}
    process.exit(3);
  }
}

runMigrations();
