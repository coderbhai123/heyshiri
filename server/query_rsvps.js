require('dotenv').config();
const neon = require('./neon_client');

async function run() {
  if (!process.env.NEON_DATABASE_URL) {
    console.error('NEON_DATABASE_URL not set');
    process.exit(2);
  }
  neon.init();
  try {
    const rows = await neon.listRsvps();
    console.log('Found', rows.length, 'rsvps');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Query failed', err && err.message ? err.message : err);
    process.exit(3);
  }
}

run();
