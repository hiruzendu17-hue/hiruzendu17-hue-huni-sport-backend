require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * Détecte la sous-catégorie Bottines à partir du brand, des tags ou du nom.
 */
const detectSubcategory = (product) => {
  const haystack = [
    product.brand,
    ...(product.tags || []),
    product.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (haystack.includes('nike')) return 'Nike';
  if (haystack.includes('adidas') || haystack.includes('f50')) return 'Adidas';
  if (haystack.includes('puma')) return 'Puma';
  return null;
};

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI manquant');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const bottines = await Product.find({
    category: { $regex: '^bottines$', $options: 'i' },
  });

  console.log(`Found ${bottines.length} bottines products`);

  let updated = 0;
  for (const product of bottines) {
    const sub = detectSubcategory(product);
    const categories = [];
    if (sub) categories.push(sub);

    const needsCategoryFix = product.category !== 'Bottines';
    const needsCategories = sub && (!product.categories || !product.categories.includes(sub));

    if (needsCategoryFix || needsCategories) {
      product.category = 'Bottines';
      if (categories.length) {
        product.categories = categories;
      } else {
        product.categories = undefined;
      }
      await product.save();
      updated += 1;
      console.log(`Updated ${product.name} -> category=Bottines, sub=${sub || 'none'}`);
    }
  }

  console.log(`Done. Updated ${updated} / ${bottines.length} products.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
