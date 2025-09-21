require('dotenv').config();
const jwtAuth = require('./jwtAuth');

/**
 * adminAuth middleware: if NEON_JWKS_URL is configured, validate JWT via jwtAuth.
 * Otherwise accept static ADMIN_TOKEN from env in Authorization Bearer header.
 */
module.exports = async function adminAuth(req, res, next) {
  const jwks = process.env.NEON_JWKS_URL;
  if (jwks) {
    // delegate to jwtAuth which will return 401/403 as appropriate
    return jwtAuth(req, res, next);
  }

  // fallback: static token
  const auth = req.headers.authorization;
  const adminToken = process.env.ADMIN_TOKEN || 'admin-secret';
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Bearer token' });
  const token = auth.slice(7);
  if (token !== adminToken) return res.status(403).json({ error: 'Forbidden: invalid admin token' });
  // simple user object for parity
  req.user = { sub: 'local-admin', tokenType: 'static' };
  return next();
};
