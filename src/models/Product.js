const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    categories: [{ type: String }],
    images: [{ type: String }],
    stock: { type: Number, default: 0 },
    stockBySize: { type: Map, of: Number },
    sizes: [{ type: String }],
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

module.exports = mongoose.model('Product', productSchema);
