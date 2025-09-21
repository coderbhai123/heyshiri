const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH, (err)=>{ if(err) { console.error('Open DB error:', err.message); process.exit(2);} });

console.log('Inspecting DB at', DB_PATH);

db.serialize(()=>{
  db.all("PRAGMA table_info('rsvps')", (err, cols)=>{
    if(err) { console.error('PRAGMA error:', err.message); return; }
    console.log('Columns:');
    cols.forEach(c => console.log(` - ${c.name} (${c.type})`));

    db.all('SELECT id, side, name, phone, guests, arrivalDate, coming, createdAt, forwarded, attempts, last_error FROM rsvps ORDER BY createdAt DESC LIMIT 20', (e, rows)=>{
      if(e) { console.error('Query error:', e.message); db.close(); return; }
      console.log('\nRecent rows:');
      if(!rows || rows.length===0) console.log(' (no rows)');
      rows.forEach(r=> console.log(JSON.stringify(r)));
      db.close();
    });
  });
});
