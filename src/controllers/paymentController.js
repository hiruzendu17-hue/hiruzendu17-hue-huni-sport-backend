const Order = require('../models/Order');
const PaymentLog = require('../models/PaymentLog');
const { parseAirtelSms, normalizePhone } = require('../utils/smsParser');

exports.processSMS = async (req, res) => {
  try {
    const { smsText, sender, timestamp } = req.body;

    if (!smsText) {
      return res.status(400).json({ success: false, error: 'smsText is required' });
    }

    const parsed = parseAirtelSms(smsText);

    if (!parsed.isAirtel) {
      await PaymentLog.create({
        amount: 0,
        customerPhone: normalizePhone(sender) || '000000000',
        transactionId: '',
        smsText,
        sender,
        smsTimestamp: timestamp ? new Date(timestamp) : undefined,
        status: 'ignored',
      });

      return res.json({ success: false, message: 'SMS non reconnu comme paiement Airtel' });
    }

    if (!parsed.amount || !parsed.phone) {
      return res.status(400).json({ success: false, error: 'Données SMS incomplètes' });
    }

    const amount = parsed.amount;
    const customerPhone = parsed.phone;
    const transactionId = parsed.transactionId || '';

    if (transactionId) {
      const existing = await PaymentLog.findOne({ transactionId });
      if (existing) {
        return res.json({ success: true, message: 'Paiement déjà traité', status: 'duplicate' });
      }
    }

    const order = await Order.findOne({
      'customer.phone': customerPhone,
      total: amount,
      status: 'pending_payment',
      paymentMethod: 'airtel_money',
    });

    if (order) {
      order.status = 'paid';
      order.paymentReference = transactionId;
      order.paidAt = new Date();
      await order.save();

      await PaymentLog.create({
        amount,
        customerPhone,
        transactionId,
        smsText,
        sender,
        smsTimestamp: timestamp ? new Date(timestamp) : undefined,
        status: 'matched',
        matchedOrder: order._id,
      });

      return res.json({
        success: true,
        message: 'Commande marquée comme payée',
        orderId: order._id,
        status: 'paid',
      });
    }

    await PaymentLog.create({
      amount,
      customerPhone,
      transactionId,
      smsText,
      sender,
      smsTimestamp: timestamp ? new Date(timestamp) : undefined,
      status: 'unmatched',
    });

    return res.json({
      success: true,
      message: 'Paiement reçu mais commande non trouvée',
      status: 'unmatched',
    });
  } catch (error) {
    console.error('? Erreur traitement SMS:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

exports.checkPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    }

    return res.json({
      success: true,
      orderId: order._id,
      status: order.status,
      paid: order.status === 'paid',
      paymentReference: order.paymentReference,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
