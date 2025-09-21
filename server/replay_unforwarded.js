const sqlite3 = require('sqlite3').verbose();
const { URL } = require('url');
const http = require('http');
const https = require('https');
const path = require('path');

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyJE6T9RckqwFJQQCYKyGm_OW_a1zVARDM9UPAK67NspFBDHym1aRtkVQ0r5M6habvq/exec';
const DB_PATH = path.join(__dirname, 'data.db');

const db = new sqlite3.Database(DB_PATH);

function postToUrl(urlString, data, timeout = 15000, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlString);
      const body = JSON.stringify(data);
      const options = {
        hostname: url.hostname,
        path: url.pathname + (url.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout,
      };
      const lib = url.protocol === 'http:' ? http : https;
      const req = lib.request(options, (res) => {
        let resp = '';
        res.on('data', (c) => (resp += c));
        res.on('end', async () => {
          // handle redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers && res.headers.location && redirectsLeft > 0) {
            const loc = res.headers.location;
            try {
              const nextUrl = new URL(loc, url);
              const result = await postToUrl(nextUrl.toString(), data, timeout, redirectsLeft - 1);
              return resolve(result);
            } catch (e) {
              return reject(e);
            }
          }
          resolve({ statusCode: res.statusCode, body: resp });
        });
      });
      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy(new Error('timeout'));
      });
      req.write(body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

console.log('Using Apps Script URL:', APPS_SCRIPT_URL);

db.all('SELECT * FROM rsvps WHERE forwarded = 0 ORDER BY createdAt ASC', async (err, rows) => {
  if (err) {
    console.error('DB error:', err);
    process.exit(2);
  }
  if (!rows || rows.length === 0) {
    console.log('No unforwarded rows found.');
    process.exit(0);
  }
  console.log('Found', rows.length, 'unforwarded rows.');

  for (const r of rows) {
    const payload = {
      serverId: r.id,
      side: r.side,
      name: r.name,
      phone: r.phone,
      guests: Number(r.guests),
      arrivalDate: r.arrivalDate,
      coming: r.coming,
      createdAt: r.createdAt || new Date().toISOString(),
    };
    try {
      process.stdout.write(`Forwarding id=${r.id} ... `);
      const resp = await postToUrl(APPS_SCRIPT_URL, payload, 15000);
      if (resp && resp.statusCode >= 200 && resp.statusCode < 300) {
        // mark forwarded
        db.run('UPDATE rsvps SET forwarded = 1 WHERE id = ?', [r.id], (uerr) => {
          if (uerr) console.error(`Failed to mark forwarded for id=${r.id}:`, uerr.message || uerr);
          else console.log(`OK (status=${resp.statusCode})`);
        });
      } else {
        console.error(`FAILED (status=${resp && resp.statusCode}) body=${resp && resp.body}`);
      }
    } catch (err) {
      console.error('ERROR', err && err.message ? err.message : err);
    }
  }

  // close DB when done
  db.close(() => process.exit(0));
});
