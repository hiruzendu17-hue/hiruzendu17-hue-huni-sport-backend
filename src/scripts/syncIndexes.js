/* Run to (re)create DB indexes declared in schemas */
require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const PaymentLog = require('../models/PaymentLog');
const logger = require('../logger');

(async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB, syncing indexes...');

    await Promise.all([
      User.syncIndexes(),
      Product.syncIndexes(),
      Order.syncIndexes(),
      Wallet.syncIndexes(),
      PaymentLog.syncIndexes(),
    ]);

    logger.info('Indexes synced successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Failed to sync indexes', { err });
    process.exit(1);
  }
})();
