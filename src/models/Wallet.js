const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['deposit', 'withdrawal', 'purchase', 'refund'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    method: { type: String, enum: ['airtel_money', 'wallet', 'system'], default: 'wallet' },
    reference: { type: String },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { _id: true }
);

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'FCFA' },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);
