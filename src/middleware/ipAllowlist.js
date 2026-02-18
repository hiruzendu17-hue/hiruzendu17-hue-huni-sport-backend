// Simple IP allowlist middleware.
// Configure with a comma-separated list of IPs/CIDRs via `ALLOWED_IPS` (general),
// or pass a specific env var name when creating the middleware.
const ip = require('ip');

const parseList = (value) =>
  (value || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

module.exports = (envVarName = 'ALLOWED_IPS') => {
  const list = parseList(process.env[envVarName]);
  if (list.length === 0) {
    return (_req, _res, next) => next(); // no restriction configured
  }

  // Pre-parse CIDRs
  const cidrs = list.map((entry) => {
    try {
      if (entry.includes('/')) return entry; // CIDR
      // single IP -> turn into /32
      return `${entry}/32`;
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  return (req, res, next) => {
    const remote = req.ip || req.connection?.remoteAddress || '';
    const ok = cidrs.some((cidr) => {
      try {
        return ip.cidrSubnet(cidr).contains(remote);
      } catch (e) {
        return false;
      }
    });

    if (!ok) {
      return res.status(403).json({ success: false, error: 'Access denied (IP)' });
    }
    return next();
  };
};
