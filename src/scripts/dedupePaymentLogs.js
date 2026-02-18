/* Remove duplicate PaymentLog documents by transactionId (keep earliest) */
require('dotenv').config();
const connectDB = require('../config/database');
const PaymentLog = require('../models/PaymentLog');
const logger = require('../logger');

(async () => {
  try {
    await connectDB();
    logger.info('Connected. Searching for duplicate transactionId...');

    const dupes = await PaymentLog.aggregate([
      { $match: { transactionId: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$transactionId',
          ids: { $push: '$_id' },
          count: { $sum: 1 },
          firstId: { $first: '$_id' },
          firstCreated: { $first: '$createdAt' },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    if (!dupes.length) {
      logger.info('No duplicate TIDs found.');
      process.exit(0);
    }

    let removed = 0;
    for (const d of dupes) {
      const keepId = d.ids[0]; // keep first encountered (oldest by pipeline order)
      const toDelete = d.ids.filter((id) => String(id) !== String(keepId));
      const res = await PaymentLog.deleteMany({ _id: { $in: toDelete } });
      removed += res.deletedCount || 0;
      logger.warn(`TID ${d._id} duplicates: kept ${keepId}, removed ${toDelete.length}`);
    }

    logger.info(`Cleanup done. Removed ${removed} duplicate PaymentLog docs.`);
    process.exit(0);
  } catch (err) {
    logger.error('Failed dedupe', { err });
    process.exit(1);
  }
})();
