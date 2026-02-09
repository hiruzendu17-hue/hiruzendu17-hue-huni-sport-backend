require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { bootstrapAdmin } = require('./controllers/authController');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const walletRoutes = require('./routes/wallet');

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

app.get('/api/status', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);

const port = process.env.PORT || 5000;

connectDB()
  .then(() => bootstrapAdmin())
  .then(() => {
    app.listen(port, () => {
      console.log(`?? Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('? Server failed to start:', error);
    process.exit(1);
  });
