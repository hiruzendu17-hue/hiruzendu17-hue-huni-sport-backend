const bcrypt = require('bcryptjs');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const sanitizeUser = (user) => {
  const avatar =
    typeof user.avatar === 'string'
      ? { url: user.avatar, public_id: '' }
      : user.avatar || { url: '', public_id: '' };

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar,
    favoriteTeam: user.favoriteTeam,
    shirtSize: user.shirtSize,
    shoeSize: user.shoeSize,
    addresses: user.addresses,
    settings: user.settings,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    let currentUser = null;

    const allowed = [
      'name',
      'phone',
      'avatar',
      'favoriteTeam',
      'shirtSize',
      'shoeSize',
      'addresses',
      'email',
      'settings',
    ];

    const update = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    });

    if (req.body.password) {
      if (!req.body.currentPassword) {
        return res
          .status(400)
          .json({ success: false, error: 'Current password required' });
      }
      currentUser = currentUser || (await User.findById(req.user.id));
      if (!currentUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      const ok = await bcrypt.compare(req.body.currentPassword, currentUser.passwordHash);
      if (!ok) {
        return res
          .status(401)
          .json({ success: false, error: 'Invalid current password' });
      }
      update.passwordHash = await bcrypt.hash(req.body.password, 10);
    }

    // Email change validation
    if (update.email) {
      const newEmail = String(update.email).toLowerCase().trim();
      if (!req.body.currentPassword) {
        return res.status(400).json({ success: false, error: 'Mot de passe requis pour changer email' });
      }
      currentUser = currentUser || (await User.findById(req.user.id));
      if (!currentUser) return res.status(404).json({ success: false, error: 'User not found' });
      const ok = await bcrypt.compare(req.body.currentPassword, currentUser.passwordHash);
      if (!ok) {
        return res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
      }
      const existingEmail = await User.findOne({ email: newEmail, _id: { $ne: req.user.id } });
      if (existingEmail) {
        return res.status(409).json({ success: false, error: 'Email déjà utilisé' });
      }
      update.email = newEmail;
    }

    // Avatar upload handling
    if (update.avatar) {
      try {
        // Accept either base64 image or { url, public_id } from front
        currentUser = currentUser || (await User.findById(req.user.id));

        const asString = typeof update.avatar === 'string' ? update.avatar : null;
        if (asString) {
          const match = String(update.avatar).match(/^data:(image\/(png|jpe?g|webp));base64,(.+)$/i);
          if (!match) {
            return res.status(400).json({ success: false, error: 'Format image invalide (png, jpg, webp)' });
          }
          if (!process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_URL) {
            return res.status(500).json({ success: false, error: 'Upload image non configuré (Cloudinary).' });
          }
          const base64 = match[3];
          const sizeBytes = Math.floor((base64.length * 3) / 4);
          if (sizeBytes > 2_000_000) {
            return res.status(400).json({ success: false, error: 'Image trop lourde (max 2 Mo)' });
          }
          if (currentUser?.avatar?.public_id) {
            await cloudinary.uploader.destroy(currentUser.avatar.public_id).catch(() => null);
          }
          const uploadResult = await cloudinary.uploader.upload(update.avatar, {
            folder: 'huni/users',
            public_id: `user_${req.user.id}`,
            overwrite: true,
            transformation: [{ width: 400, height: 400, crop: 'thumb', gravity: 'face' }],
          });
          update.avatar = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
        } else if (update.avatar.url && update.avatar.public_id) {
          if (currentUser?.avatar?.public_id && currentUser.avatar.public_id !== update.avatar.public_id) {
            await cloudinary.uploader.destroy(currentUser.avatar.public_id).catch(() => null);
          }
          update.avatar = {
            url: String(update.avatar.url),
            public_id: String(update.avatar.public_id),
          };
        } else {
          return res.status(400).json({ success: false, error: 'Avatar invalide' });
        }
      } catch (err) {
        console.error('Upload avatar error:', err);
        return res.status(400).json({ success: false, error: err.message || 'Upload avatar échoué' });
      }
    }

    const updated = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
    });

    return res.json({ success: true, user: sanitizeUser(updated) });
  } catch (error) {
    console.error('Update me error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
