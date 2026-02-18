const client = require('prom-client');

// Register and default labels
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const paymentsProcessed = new client.Counter({
  name: 'payments_processed_total',
  help: 'Total SMS payments processed',
});

const paymentsMatched = new client.Counter({
  name: 'payments_matched_total',
  help: 'Payments matched to an order',
});

const paymentsUnmatched = new client.Counter({
  name: 'payments_unmatched_total',
  help: 'Payments that could not be matched to an order',
});

const paymentsDuplicate = new client.Counter({
  name: 'payments_duplicate_total',
  help: 'Payments rejected as duplicate',
});

const paymentsError = new client.Counter({
  name: 'payments_error_total',
  help: 'Errors while processing payments',
});

register.registerMetric(paymentsProcessed);
register.registerMetric(paymentsMatched);
register.registerMetric(paymentsUnmatched);
register.registerMetric(paymentsDuplicate);
register.registerMetric(paymentsError);

module.exports = {
  register,
  paymentsProcessed,
  paymentsMatched,
  paymentsUnmatched,
  paymentsDuplicate,
  paymentsError,
};
