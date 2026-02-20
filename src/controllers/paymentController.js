const Order = require('../models/Order');

exports.checkPayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    }

    const isOwner = order.customer?.email && req.user.email && order.customer.email === req.user.email;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    return res.json({
      success: true,
      orderId: order._id,
      status: order.status,
      paid: order.status === 'paid',
      paymentReference: order.paymentReference,
      paymentReceivedAt: order.paymentReceivedAt,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

