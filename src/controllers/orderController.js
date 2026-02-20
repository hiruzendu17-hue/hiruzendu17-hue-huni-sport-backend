const mongoose = require('mongoose');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');

// Simplified phone normalizer (digits only, 9-15 chars)
const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return null;
  return digits;
};

const ALLOWED_STATUSES = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
const ALLOWED_PAYMENT_METHODS = ['airtel_money', 'cash', 'wallet'];

const buildOrderFromBody = (body) => {
  const customer = body.customer || {};
  const phone = normalizePhone(customer.phone);

  if (!phone) {
    return { error: 'Invalid phone number' };
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return { error: 'Order items required' };
  }

  const computedSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const subtotal = typeof body.subtotal === 'number' ? body.subtotal : computedSubtotal;
  const shipping = typeof body.shipping === 'number' ? body.shipping : 0;
  const total = typeof body.total === 'number' ? body.total : subtotal + shipping;
  const paymentMethod = body.paymentMethod || 'airtel_money';

  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    return { error: 'Invalid payment method' };
  }

  const data = {
    customer: {
      phone,
      name: customer.name,
      email: customer.email,
      address: {
        city: customer.address?.city || customer.city || '',
        district: customer.address?.district || customer.district || '',
        details: customer.address?.details || customer.address || '',
      },
    },
    items,
    subtotal,
    shipping,
    total,
    paymentMethod,
  };

  if (paymentMethod === 'wallet') {
    data.status = 'paid';
    data.paidAt = new Date();
  }

  return {
    data,
  };
};

exports.create = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { error, data } = buildOrderFromBody(req.body);
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    if (data.customer.email && data.customer.email !== req.user.email) {
      return res.status(403).json({ success: false, error: 'Email mismatch' });
    }

    data.customer.email = req.user.email;

    if (!data.customer.name || !data.customer.email) {
      return res.status(400).json({ success: false, error: 'Customer name and email required' });
    }

    if (data.paymentMethod === 'wallet') {
      const session = await mongoose.startSession();
      let order;

      try {
        await session.withTransaction(async () => {
          let wallet = await Wallet.findOne({ user: req.user.id }).session(session);
          if (!wallet) {
            const created = await Wallet.create(
              [
                {
                  user: req.user.id,
                  balance: 0,
                  currency: 'FCFA',
                  transactions: [],
                },
              ],
              { session }
            );
            wallet = created[0];
          }

          if (wallet.balance < data.total) {
            throw new Error('Insufficient wallet balance');
          }

          const createdOrder = await Order.create([data], { session });
          order = createdOrder[0];

          wallet.balance -= data.total;
          wallet.transactions.push({
            type: 'purchase',
            amount: -data.total,
            status: 'completed',
            method: 'wallet',
            reference: order._id.toString(),
            description: `Paiement commande ${order._id}`,
            createdAt: new Date(),
            completedAt: new Date(),
          });

          await wallet.save({ session });
        });
      } catch (error) {
        if (error.message === 'Insufficient wallet balance') {
          return res.status(400).json({ success: false, error: 'Insufficient wallet balance' });
        }
        console.error('Create wallet order error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
      } finally {
        session.endSession();
      }

      return res.status(201).json({
        success: true,
        orderId: order._id,
        total: order.total,
        status: order.status,
      });
    }

    const order = await Order.create(data);

    return res.status(201).json({
      success: true,
      orderId: order._id,
      total: order.total,
      status: order.status,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.phone) {
      const phone = normalizePhone(req.query.phone);
      if (phone) {
        filter['customer.phone'] = phone;
      }
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    return res.json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const orders = await Order.find({ 'customer.email': req.user.email }).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    console.error('Get my orders error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.markPaid = async (req, res) => {
  try {
    const { paymentReference } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = 'paid';
    order.paymentReference = paymentReference || order.paymentReference;
    order.paidAt = new Date();
    await order.save();

    return res.json({ success: true, order });
  } catch (error) {
    console.error('Mark paid error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.markShipped = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = 'shipped';
    order.shippedAt = new Date();
    await order.save();

    return res.json({ success: true, order });
  } catch (error) {
    console.error('Mark shipped error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = status;
    if (status === 'paid') {
      order.paidAt = order.paidAt || new Date();
    }
    if (status === 'shipped') {
      order.shippedAt = order.shippedAt || new Date();
    }
    if (status === 'delivered') {
      order.deliveredAt = order.deliveredAt || new Date();
    }

    await order.save();
    return res.json({ success: true, order });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.customer?.phone) {
      const phone = normalizePhone(payload.customer.phone);
      if (!phone) {
        return res.status(400).json({ success: false, error: 'Invalid phone number' });
      }
      payload.customer = { ...payload.customer, phone };
    }

    if (payload.status && !ALLOWED_STATUSES.includes(payload.status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    if (payload.paymentMethod && !ALLOWED_PAYMENT_METHODS.includes(payload.paymentMethod)) {
      return res.status(400).json({ success: false, error: 'Invalid payment method' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.set(payload);

    if (payload.status === 'paid') {
      order.paidAt = order.paidAt || new Date();
    }
    if (payload.status === 'shipped') {
      order.shippedAt = order.shippedAt || new Date();
    }
    if (payload.status === 'delivered') {
      order.deliveredAt = order.deliveredAt || new Date();
    }

    await order.save();
    return res.json({ success: true, order });
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete order error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
