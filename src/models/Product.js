const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    images: [
      {
        url: { type: String },
        public_id: { type: String },
      },
    ],
    stock: { type: Number, default: 0, min: 0 },
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
