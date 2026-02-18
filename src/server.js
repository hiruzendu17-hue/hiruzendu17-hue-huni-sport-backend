const connectDB = require('./config/database');
const { bootstrapAdmin } = require('./controllers/authController');
const logger = require('./logger');
const app = require('./app');

const port = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
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
