const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open DB:', err && err.message ? err.message : err);
    process.exit(2);
  }
});

console.log('Running DB migration: indexes + createdAt normalization');

db.serialize(() => {
  // create indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_rsvps_createdAt ON rsvps(createdAt)');
  db.run('CREATE INDEX IF NOT EXISTS idx_rsvps_phone ON rsvps(phone)');
  db.run('CREATE INDEX IF NOT EXISTS idx_rsvps_side ON rsvps(side)');

  db.all('SELECT id, createdAt FROM rsvps', (err, rows) => {
    if (err) {
      console.error('Failed to read rows for normalization:', err && err.message ? err.message : err);
      db.close();
      return;
    }
    let updated = 0;
    let skipped = 0;
    rows.forEach((r) => {
      const raw = r.createdAt;
      if (!raw) {
        skipped++;
        return;
      }
      // if already looks like ISO (contains 'T' and ends with Z or offset) skip
      if (typeof raw === 'string' && raw.includes('T') && /Z$|[+-]\d\d:\d\d$/.test(raw)) {
        skipped++;
        return;
      }
      // Attempt to parse using JS Date
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        const iso = parsed.toISOString();
        if (iso !== raw) {
          db.run('UPDATE rsvps SET createdAt = ? WHERE id = ?', [iso, r.id], (uerr) => {
            if (uerr) console.error('Failed to update id', r.id, uerr && uerr.message ? uerr.message : uerr);
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // cannot parse - log for manual inspection
        console.warn('Could not parse createdAt for id', r.id, 'value:', raw);
        skipped++;
      }
    });

    // Wait a bit for updates to flush
    setTimeout(() => {
      console.log(`Migration complete. Updated: ${updated}, Skipped: ${skipped}`);
      db.close();
    }, 500);
  });
});
