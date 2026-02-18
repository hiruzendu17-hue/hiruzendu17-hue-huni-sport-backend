const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

const sanitizeProductPayload = (payload = {}) => {
  const data = { ...payload };

  // Backward compatibility: if old payload sends categories array, use the first value.
  if (!data.category && Array.isArray(data.categories) && data.categories.length > 0) {
    data.category = data.categories[0];
  }

  if (typeof data.name === 'string') {
    data.name = data.name.trim();
  }

  if (typeof data.category === 'string') {
    data.category = data.category.trim();
  }

  if (typeof data.description === 'string') {
    data.description = data.description.trim();
    if (!data.description) {
      delete data.description;
    }
  }

  // Accept quantity alias from admin UI and map to global stock.
  if (data.quantity !== undefined && data.quantity !== null && data.stock === undefined) {
    data.stock = data.quantity;
  }

  if (data.stock !== undefined && data.stock !== null) {
    data.stock = Number(data.stock);
  }

  delete data.quantity;
  delete data.categories;
  delete data.stockBySize;

  return data;
};

const toProductResponse = (product) => {
  const obj = product.toObject ? product.toObject() : { ...product };
  delete obj.categories;
  delete obj.stockBySize;
  obj.quantity = typeof obj.stock === 'number' ? obj.stock : 0;
  if (Array.isArray(obj.images)) {
    obj.images = obj.images.map((img) => {
      if (!img) return img;
      if (typeof img === 'string') {
        return { url: img, public_id: '' };
      }
      return { url: img.url || '', public_id: img.public_id || '' };
    });
  }
  return obj;
};

const buildFilter = (query) => {
  const filter = {};
  if (query.category) {
    filter.category = query.category;
  }
  if (query.featured !== undefined) {
    filter.featured = query.featured === 'true';
  }
  if (query.new !== undefined) {
    filter.new = query.new === 'true';
  }
  if (query.search) {
    const term = query.search.trim();
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      { category: { $regex: term, $options: 'i' } },
      { team: { $regex: term, $options: 'i' } },
      { league: { $regex: term, $options: 'i' } },
    ];
  }
  return filter;
};

exports.getAll = async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const products = await Product.find(filter).sort({ createdAt: -1 });
    const normalizedProducts = products.map(toProductResponse);
    return res.json({ success: true, products: normalizedProducts });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    return res.json({ success: true, product: toProductResponse(product) });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

const destroyImages = async (images = []) => {
  const jobs = images
    .map((img) => (typeof img === 'string' ? { public_id: '' } : img))
    .filter((img) => img?.public_id)
    .map((img) => cloudinary.uploader.destroy(img.public_id).catch(() => null));
  await Promise.all(jobs);
};

exports.create = async (req, res) => {
  try {
    const data = sanitizeProductPayload(req.body);

    if (!data.name || !data.category) {
      return res.status(400).json({ success: false, error: 'Name and category required' });
    }

    if (data.price === undefined || data.price === null) {
      return res.status(400).json({ success: false, error: 'Price required' });
    }

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'hunisport/products', resource_type: 'image' },
          (err, uploadResult) => {
            if (err) return reject(err);
            return resolve(uploadResult);
          }
        );
        stream.end(req.file.buffer);
      });

      data.images = [
        {
          url: result.secure_url,
          public_id: result.public_id,
        },
      ];
    }

    const product = await Product.create(data);
    return res.status(201).json({ success: true, product: toProductResponse(product) });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const payload = sanitizeProductPayload(req.body);
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Replace image if a new file is provided
    if (req.file) {
      await destroyImages(product.images);

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'hunisport/products', resource_type: 'image' },
          (err, uploadResult) => {
            if (err) return reject(err);
            return resolve(uploadResult);
          }
        );
        stream.end(req.file.buffer);
      });

      payload.images = [
        {
          url: result.secure_url,
          public_id: result.public_id,
        },
      ];
    }

    product.set(payload);
    await product.save();

    return res.json({ success: true, product: toProductResponse(product) });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    await destroyImages(product.images);
    await product.deleteOne();
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
