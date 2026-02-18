const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customer: {
      phone: { type: String, required: true, match: /^\d{9}$/ },
      name: { type: String, required: true },
      email: { type: String, required: true },
      address: {
        city: { type: String },
        district: { type: String },
        details: { type: String },
      },
    },
    items: [
      {
        productId: { type: String },
        name: { type: String },
        price: { type: Number },
        quantity: { type: Number },
        size: { type: String },
        shoeSize: { type: Number },
        image: { type: String },
      },
    ],
    subtotal: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending_payment',
    },
    paymentMethod: {
      type: String,
      enum: ['airtel_money', 'cash', 'wallet'],
      default: 'airtel_money',
    },
    paymentReference: { type: String },
    paymentReceivedAt: { type: Date },
    paidAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
