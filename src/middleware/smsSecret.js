// Simple shared-secret gate for the SMS webhook to prevent unauthorized calls.
module.exports = (req, res, next) => {
  const configured = process.env.PAYMENT_SMS_SECRET;
  if (!configured) {
    return res.status(500).json({ success: false, error: 'PAYMENT_SMS_SECRET not configured' });
  }

  const provided =
    req.headers['x-sms-webhook-secret'] ||
    req.headers['x-sms-secret'] ||
    req.headers['x-api-key'];

  if (!provided || provided !== configured) {
    return res.status(401).json({ success: false, error: 'Unauthorized webhook' });
  }

  return next();
};
