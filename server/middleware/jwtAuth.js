const { createRemoteJWKSet, jwtVerify } = require('jose');
const { URL } = require('url');
require('dotenv').config();

const jwksUrl = process.env.NEON_JWKS_URL;
const adminClaim = process.env.ADMIN_ROLE_CLAIM || 'role';
const adminValue = process.env.ADMIN_ROLE_VALUE || 'admin';
const issuer = process.env.ADMIN_ISS;
const audience = process.env.ADMIN_AUD;

let JWKS;
if (jwksUrl) {
  JWKS = createRemoteJWKSet(new URL(jwksUrl));
}

async function jwtAuth(req, res, next) {
  try {
    if (!JWKS) return res.status(500).json({ error: 'JWKS not configured on server.' });
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Bearer token' });
    const token = auth.slice(7);
    const opts = {};
    if (issuer) opts.issuer = issuer;
    if (audience) opts.audience = audience;
    const { payload } = await jwtVerify(token, JWKS, opts);
    // require admin claim
    if (!payload || payload[adminClaim] !== adminValue) {
      return res.status(403).json({ error: 'Forbidden: admin claim missing or invalid' });
    }
    req.user = payload;
    next();
  } catch (err) {
    console.error('jwtAuth error', err && err.message ? err.message : err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = jwtAuth;
