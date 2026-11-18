const crypto = require('crypto');

// Lab-grade authorization: a single shared admin token, compared in constant
// time to avoid leaking its value via response-timing side channels. Good
// enough to gate write access in a teaching environment; not a substitute
// for per-user auth in a real production system.
function requireAdminAuth(req, res, next) {
  const configuredToken = process.env.ADMIN_API_TOKEN;
  if (!configuredToken) {
    return res.status(500).json({ error: 'Server is missing ADMIN_API_TOKEN configuration' });
  }

  const header = req.get('Authorization') || '';
  const [scheme, providedToken] = header.split(' ');

  if (scheme !== 'Bearer' || !providedToken) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const expected = Buffer.from(configuredToken);
  const provided = Buffer.from(providedToken);
  const isValid =
    expected.length === provided.length && crypto.timingSafeEqual(expected, provided);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }

  next();
}

module.exports = { requireAdminAuth };
