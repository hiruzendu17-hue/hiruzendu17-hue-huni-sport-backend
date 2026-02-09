const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    customerPhone: { type: String, required: true },
    transactionId: { type: String },
    smsText: { type: String, required: true },
    sender: { type: String },
    smsTimestamp: { type: Date },
    status: { type: String, enum: ['matched', 'unmatched', 'duplicate', 'ignored'], default: 'unmatched' },
    matchedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    receivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentLog', paymentLogSchema);
