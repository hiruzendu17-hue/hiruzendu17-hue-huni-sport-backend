const cloudinary = require('cloudinary').v2;

// Configure from explicit credentials or from CLOUDINARY_URL.
// If not configured, export a safe stub so the app can start but uploads will fail with a clear error.
const missingConfig =
  !process.env.CLOUDINARY_URL &&
  !(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (missingConfig) {
  console.warn('Cloudinary not configured: upload routes will fail until env vars are set');

  module.exports = {
    configured: false,
    uploader: {
      upload_stream: () => {
        throw new Error('Cloudinary not configured');
      },
      upload: () => {
        throw new Error('Cloudinary not configured');
      },
      destroy: () => {
        throw new Error('Cloudinary not configured');
      },
    },
  };
} else {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true }); // parses CLOUDINARY_URL automatically
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  module.exports = { ...cloudinary, configured: true };
}
