const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

(async () => {
  const MOCK_PORT = 50123;
  const SERVER_PORT = 50124;
  const APPS_SCRIPT_URL = `http://localhost:${MOCK_PORT}/`;

  // start mock receiver
  const received = [];
  const mock = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const j = JSON.parse(body || '{}');
        received.push(j);
      } catch (e) {
        // ignore
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise((r) => mock.listen(MOCK_PORT, r));
  console.log('Mock Apps Script listening on', MOCK_PORT);

  // start server with APPS_SCRIPT_URL and PORT=SERVER_PORT
  const env = Object.assign({}, process.env, { APPS_SCRIPT_URL, PORT: SERVER_PORT });
  const server = spawn('node', ['server/index.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });

  server.stdout.on('data', (d) => process.stdout.write('[server] ' + d.toString()));
  server.stderr.on('data', (d) => process.stderr.write('[server] ' + d.toString()));

  // wait a moment for server to boot
  await new Promise((r) => setTimeout(r, 1000));

  // POST an RSVP to the server
  const postData = JSON.stringify({ side: 'bride', name: 'TestForward', phone: '1234567890', guests: 1, arrivalDate: '10 Nov 2025', coming: 'cantwait' });
  await new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: SERVER_PORT, path: '/api/rsvp', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => {
        resolve(b);
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  // Wait up to 5 seconds for the mock to receive the data and DB to update
  const start = Date.now();
  while (Date.now() - start < 5000) {
    if (received.length > 0) break;
    await new Promise((r) => setTimeout(r, 200));
  }

  if (received.length === 0) {
    console.error('Mock did not receive Apps Script payload');
    process.exit(2);
  }

  console.log('Mock received payload:', received[0]);

  // check DB forwarded flag
  const dbPath = path.join(__dirname, '..', 'data.db');
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT * FROM rsvps ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error('DB error', err);
      process.exit(3);
    }
    console.log('Latest DB row:', row);
    if (row && row.forwarded === 1) {
      console.log('Forwarding succeeded and flagged in DB.');
      process.exit(0);
    } else {
      console.error('Forwarding not flagged in DB.');
      process.exit(4);
    }
  });
})();
