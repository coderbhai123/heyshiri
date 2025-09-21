const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH);

function insert(row) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO rsvps (side, name, phone, guests, arrivalDate, coming, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(row.side, row.name, row.phone, row.guests, row.arrivalDate, row.coming, row.createdAt, function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
    stmt.finalize();
  });
}

async function main() {
  try {
    const now = new Date().toISOString();
    const id1 = await insert({ side: 'bride', name: 'Seed Bride', phone: '7000000001', guests: 2, arrivalDate: '2025-11-12', coming: 1, createdAt: now });
    console.log('Inserted bride id=', id1);
    const id2 = await insert({ side: 'groom', name: 'Seed Groom', phone: '7000000002', guests: 3, arrivalDate: '2025-11-12', coming: 1, createdAt: now });
    console.log('Inserted groom id=', id2);
    console.log('Done. Now run: node replay_unforwarded.js to forward unforwarded rows (or let the retry loop handle it).');
    db.close();
  } catch (err) {
    console.error('Failed to insert test rows:', err && err.message ? err.message : err);
    db.close();
    process.exit(1);
  }
}

main();
