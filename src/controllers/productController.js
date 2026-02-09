const Product = require('../models/Product');

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
      { categories: { $regex: term, $options: 'i' } },
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
    return res.json({ success: true, products });
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
    return res.json({ success: true, product });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const data = req.body;

    if (!data.name || !data.description || !data.category) {
      return res.status(400).json({ success: false, error: 'Name, description, category required' });
    }

    if (data.price === undefined || data.price === null) {
      return res.status(400).json({ success: false, error: 'Price required' });
    }

    const product = await Product.create(data);
    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    return res.json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
