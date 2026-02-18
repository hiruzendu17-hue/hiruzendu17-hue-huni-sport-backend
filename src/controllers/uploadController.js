const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

const uploadFromBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucune image envoyée' });
    }

    const result = await uploadFromBuffer(req.file.buffer, {
      folder: 'hunisport',
      resource_type: 'image',
    });

    return res.status(200).json({
      success: true,
      message: 'Upload réussi',
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    return next(error);
  }
};
