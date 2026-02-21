const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    categories: [{ type: String, trim: true }],
    images: [
      {
        url: { type: String },
        public_id: { type: String },
      },
    ],
    stock: { type: Number, default: 0, min: 0 },
    sizes: [{ type: String }],
    stockBySize: {
      type: Map,
      of: Number,
      default: undefined,
    },
    featured: { type: Boolean, default: false },
    new: { type: Boolean, default: false },
    team: { type: String },
    league: { type: String },
    season: { type: String },
    type: { type: String },
    tags: [{ type: String }],
    brand: { type: String },
  },
  { timestamps: true }
);

// Indexes to avoid in-memory sorts and speed up common queries
productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ featured: -1, createdAt: -1 });
productSchema.index({ team: 1, createdAt: -1 });
productSchema.index({ league: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
