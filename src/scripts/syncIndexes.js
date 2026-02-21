require('dotenv').config();
const connectDB = require('../config/database');
const Product = require('../models/Product');

const run = async () => {
  try {
    await connectDB();
    const result = await Product.syncIndexes();
    console.log('Indexes synchronized:', result);
    process.exit(0);
  } catch (error) {
    console.error('Failed to sync indexes:', error);
    process.exit(1);
  }
};

run();
