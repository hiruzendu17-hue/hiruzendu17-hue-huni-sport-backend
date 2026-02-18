const cloudinary = require('cloudinary').v2;

// Configure from explicit credentials or from CLOUDINARY_URL
// (secure=true forces https URLs)
const configureCloudinary = () => {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true }); // will parse CLOUDINARY_URL automatically
    return;
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary not configured: set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET');
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
};

configureCloudinary();

module.exports = cloudinary;
