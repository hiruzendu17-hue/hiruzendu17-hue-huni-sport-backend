const connectDB = require('./config/database');
const { bootstrapAdmin } = require('./controllers/authController');
const logger = require('./logger');
const app = require('./app');

const port = process.env.PORT || 3000;
const isTest = process.env.NODE_ENV === 'test';

// Fail fast if a critical env var is missing (only outside tests)
const requireEnv = (names) => {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) {
    const msg = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(msg);
    throw new Error(msg);
  }
};

if (!isTest) {
  const hasMongo = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!hasMongo) {
    requireEnv(['MONGO_URI', 'MONGODB_URI']);
  }
  requireEnv(['JWT_SECRET', 'PAYMENT_SMS_SECRET', 'METRICS_SECRET']);

  connectDB()
    .then(() => bootstrapAdmin())
    .then(() => {
      app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
      });
    })
    .catch((error) => {
      logger.error('Server failed to start', { error });
      process.exit(1);
    });
}

module.exports = app;
