// Load environment variables from .env if present
require('dotenv').config();
// load environment variables
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
// Optionally persist RSVPs to Neon Postgres when NEON_DATABASE_URL is provided.
const neon = require('./neon_client');
const jwtAuth = require('./middleware/jwtAuth');
const adminAuth = require('./middleware/adminAuth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize Neon DB pool if configured
if (process.env.NEON_DATABASE_URL) {
  try {
    neon.init();
    console.log('Neon DB pool initialized');
  } catch (err) {
    console.error('Failed to initialize Neon DB pool', err && err.message ? err.message : err);
  }
}

// API: Save RSVP entry
// Server-side persistence removed. The client now stores RSVPs in localStorage.
// Keep the endpoint as a 501 Not Implemented so integrations are explicit.
app.post('/api/rsvp', async (req, res) => {
  // Validate minimal payload
  const { name, side } = req.body || {};
  if (!name || !side) return res.status(422).json({ error: 'Missing name or side' });
  if (!process.env.NEON_DATABASE_URL) {
    return res.status(501).json({ error: 'Server-side DB not configured. RSVPs are stored in browser localStorage.' });
  }
  try {
    const rsvp = await neon.insertRsvp(req.body);
    res.status(201).json(rsvp);
  } catch (err) {
    console.error('Insert RSVP error', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to persist RSVP' });
  }
});

// Admin middleware to protect routes
// Simple local admin flow: accept any password and return a token
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret';
app.post('/api/admin/login', (req, res) => {
  // Keep existing local admin password flow as a fallback when JWKS isn't configured.
  const { password } = req.body || {};
  if (!process.env.NEON_JWKS_URL) {
    if (!password) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ token: ADMIN_TOKEN });
  }
  res.status(501).json({ error: 'Admin login disabled when JWKS is configured. Use a JWT from your IdP.' });
});

app.get('/api/rsvps', async (req, res) => {
  if (!process.env.NEON_DATABASE_URL) return res.status(501).json({ error: 'DB not configured.' });
  // adminAuth handles JWT via JWKS or static ADMIN_TOKEN fallback
  await adminAuth(req, res, async () => {
    try {
      const rows = await neon.listRsvps();
      res.json(rows);
    } catch (err) {
      console.error('List RSVPs error', err && err.message ? err.message : err);
      res.status(500).json({ error: 'Failed to list RSVPs' });
    }
  });
});

// Debug: return table schema and counts (admin only)
app.get('/api/_debug/schema', async (req, res) => {
  if (!process.env.NEON_DATABASE_URL) return res.status(501).json({ error: 'DB not configured.' });
  await adminAuth(req, res, async () => {
    try {
      const rows = await neon.listRsvps();
      res.json({ example: rows[0] || null });
    } catch (err) {
      res.status(500).json({ error: 'Failed to read schema' });
    }
  });
});

// Admin: Get single RSVP by ID
app.get('/api/rsvp/:id', async (req, res) => {
  if (!process.env.NEON_DATABASE_URL) return res.status(501).json({ error: 'DB not configured.' });
  await adminAuth(req, res, async () => {
    try {
      const r = await neon.getRsvp(req.params.id);
      if (!r) return res.status(404).json({ error: 'Not found' });
      res.json(r);
    } catch (err) {
      res.status(500).json({ error: 'Failed to get RSVP' });
    }
  });
});

app.delete('/api/rsvp/:id', async (req, res) => {
  if (!process.env.NEON_DATABASE_URL) return res.status(501).json({ error: 'DB not configured.' });
  await adminAuth(req, res, async () => {
    try {
      await neon.deleteRsvp(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete RSVP' });
    }
  });
});

// Admin: Export RSVPs as CSV (optionally filtered by side)
app.get('/api/export', (req, res) => {
  res.status(501).json({ error: 'DB removed. Export from browser localStorage.' });
});

// CSV export endpoint (admin only when DB configured)
app.get('/api/export/csv', async (req, res) => {
  if (!process.env.NEON_DATABASE_URL) return res.status(501).json({ error: 'DB not configured.' });
  await adminAuth(req, res, async () => {
    try {
      const rows = await neon.listRsvps();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="rsvps.csv"');
      // simple CSV header
      const headers = ['id', 'side', 'name', 'phone', 'guests', 'arrival_date', 'coming', 'notes', 'created_at'];
      res.write(headers.join(',') + '\n');
      for (const r of rows) {
        // basic CSV escaping: wrap fields that contain comma/quote/newline
        const vals = headers.map((h) => {
          let v = r[h];
          if (v === null || v === undefined) return '';
          v = String(v);
          if (/[",\n]/.test(v)) {
            return '"' + v.replace(/"/g, '""') + '"';
          }
          return v;
        });
        res.write(vals.join(',') + '\n');
      }
      res.end();
    } catch (err) {
      console.error('Export CSV failed', err && err.message ? err.message : err);
      res.status(500).json({ error: 'Failed to export CSV' });
    }
  });
});

// Serve React client build if exists
const buildPath = path.join(__dirname, '..', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});