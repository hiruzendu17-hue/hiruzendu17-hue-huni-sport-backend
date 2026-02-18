const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    avatar: { type: String, trim: true },
    favoriteTeam: { type: String, trim: true },
    shirtSize: { type: String, trim: true },
    shoeSize: { type: Number, min: 30, max: 60 },
    addresses: [
      {
        id: { type: String, required: true },
        label: { type: String, trim: true },
        line1: { type: String, trim: true, required: true },
        line2: { type: String, trim: true },
        city: { type: String, trim: true, required: true },
        country: { type: String, trim: true, required: true },
        phone: { type: String, trim: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    settings: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      orderUpdates: { type: Boolean, default: true },
      promoEmails: { type: Boolean, default: true },
      language: { type: String, default: 'fr' },
      currency: { type: String, default: 'FCFA' },
      theme: { type: String, enum: ['dark', 'light', 'auto'], default: 'dark' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
