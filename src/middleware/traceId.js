const { randomUUID } = require('crypto');

module.exports = (req, res, next) => {
  const id = randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  // Propagate request id to logger if present
  req.log = req.log || {};
  req.log.requestId = id;
  next();
};
