require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { register } = require('./metrics');
const traceId = require('./middleware/traceId');
const logger = require('./logger');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const walletRoutes = require('./routes/wallet');
const userRoutes = require('./routes/users');
const ipAllowlist = require('./middleware/ipAllowlist');

const app = express();

// Trust proxy (needed for correct client IP with reverse proxies/load balancers)
app.set('trust proxy', 1);

const corsOptions = {
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(traceId);
app.use(express.json({ limit: '10mb' }));

// Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Stricter limiter for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, try again later.' },
});

app.get('/api/status', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);

// Metrics endpoint (must be protected by METRICS_SECRET)
app.get('/api/metrics', ipAllowlist('METRICS_ALLOWED_IPS'), async (req, res) => {
  const secret = process.env.METRICS_SECRET;
  if (!secret) {
    return res.status(500).send('metrics disabled: missing METRICS_SECRET');
  }
  const provided = req.headers['x-metrics-secret'];
  if (!provided || provided !== secret) {
    return res.status(401).send('unauthorized');
  }
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = app;
