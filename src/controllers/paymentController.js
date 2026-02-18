const Order = require('../models/Order');
const PaymentLog = require('../models/PaymentLog');
const { parseAirtelSms, normalizePhone } = require('../utils/smsParser');
const logger = require('../logger');
const {
  paymentsProcessed,
  paymentsMatched,
  paymentsUnmatched,
  paymentsDuplicate,
  paymentsError,
} = require('../metrics');

const postOpsNotification = async (text) => {
  try {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook || !global.fetch) return;
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error('⚠️ Ops notification failed:', err.message);
  }
};

// Traite un SMS Airtel Money reçu par l'app mobile (relayé côté backend).
exports.processSMS = async (req, res) => {
  try {
    const { smsText, sender, timestamp } = req.body;
    paymentsProcessed.inc();

    if (!smsText) {
      return res.status(400).json({ success: false, error: 'smsText is required' });
    }

    if (!timestamp) {
      return res.status(400).json({ success: false, error: 'timestamp is required' });
    }

    const smsTimestamp = new Date(timestamp);
    if (Number.isNaN(smsTimestamp.getTime())) {
      return res.status(400).json({ success: false, error: 'timestamp invalide' });
    }

    const parsed = parseAirtelSms(smsText);

    if (!parsed.isAirtel) {
      await PaymentLog.create({
        amount: 0,
        customerPhone: normalizePhone(sender) || '000000000',
        transactionId: '',
        smsText,
        sender,
        smsTimestamp,
        status: 'ignored',
      });

      return res.json({ success: false, message: 'SMS non reconnu comme paiement Airtel' });
    }

    if (!parsed.amount || !parsed.phone || !parsed.transactionId) {
      return res.status(400).json({ success: false, error: 'Données SMS incomplètes (montant/phone/TID requis)' });
    }

    const amount = parsed.amount;
    const customerPhone = parsed.phone;
    const transactionId = parsed.transactionId.trim();

    if (transactionId) {
      const existing = await PaymentLog.findOne({ transactionId });
      if (existing) {
        paymentsDuplicate.inc();
        return res.json({ success: true, message: 'Paiement déjà traité', status: 'duplicate' });
      }
    } else {
      // Dédoublonnage additionnel (sécurité) : même phone + montant le même jour (fenêtre 24h) uniquement si pas de TID
      const dayStart = new Date(
        Date.UTC(smsTimestamp.getUTCFullYear(), smsTimestamp.getUTCMonth(), smsTimestamp.getUTCDate())
      );
      const dayEnd = new Date(
        Date.UTC(smsTimestamp.getUTCFullYear(), smsTimestamp.getUTCMonth(), smsTimestamp.getUTCDate(), 23, 59, 59, 999)
      );
      const nearDuplicate = await PaymentLog.findOne({
        customerPhone,
        amount,
        smsTimestamp: { $gte: dayStart, $lte: dayEnd },
      });
      if (nearDuplicate) {
        return res.json({ success: true, message: 'Paiement déjà reçu (même date)', status: 'duplicate' });
      }
    }

    // Tolérance de rapprochement pour les montants (arrondis/commissions)
    const tolerance = Number(process.env.PAYMENT_MATCH_TOLERANCE || 100);
    const candidates = await Order.find({
      'customer.phone': customerPhone,
      status: 'pending_payment',
      paymentMethod: 'airtel_money',
      total: { $gte: amount - tolerance, $lte: amount + tolerance },
    }).sort({ createdAt: -1 });

    const order = candidates.reduce(
      (best, current) => {
        const diff = Math.abs(current.total - amount);
        if (!best || diff < best.diff) {
          return { doc: current, diff };
        }
        return best;
      },
      null
    )?.doc;

    if (order) {
      // Atomique : ne payer que si toujours en attente
      const updated = await Order.findOneAndUpdate(
        {
          _id: order._id,
          status: 'pending_payment',
        },
        {
          $set: {
            status: 'paid',
            paymentReference: transactionId || order.paymentReference,
            paymentReceivedAt: smsTimestamp,
            paidAt: order.paidAt || new Date(),
          },
        },
        { new: true }
      );

      if (!updated) {
        return res.json({
          success: false,
          message: 'Commande déjà traitée ou verrouillée',
          status: order.status,
        });
      }

      await PaymentLog.create({
        amount,
        customerPhone,
        transactionId,
        smsText,
        sender,
        smsTimestamp,
        status: 'matched',
        matchedOrder: updated._id,
      });

      paymentsMatched.inc();
      return res.json({
        success: true,
        message: 'Commande marquée comme payée',
        orderId: updated._id,
        status: updated.status,
      });
    }

    await PaymentLog.create({
      amount,
      customerPhone,
      transactionId,
      smsText,
      sender,
      smsTimestamp,
      status: 'unmatched',
    });

    // Alerte ops (optionnelle) pour rapprocher manuellement
    paymentsUnmatched.inc();
    postOpsNotification(
      `🚧 Paiement Airtel non rapproché : amount=${amount}, phone=${customerPhone}, TID=${transactionId || 'N/A'}`
    );

    return res.json({
      success: true,
      message: 'Paiement reçu mais commande non trouvée',
      status: 'unmatched',
    });
  } catch (error) {
    logger.error('Erreur traitement SMS', { error, smsText: req.body?.smsText, sender: req.body?.sender });
    paymentsError.inc();
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

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

// Observabilité : liste paginée des logs de paiement pour réconciliation.
exports.listLogs = async (req, res) => {
  try {
    const { status, phone, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (phone) {
      const normalized = normalizePhone(phone);
      if (normalized) {
        filter.customerPhone = normalized;
      }
    }

    const pageSize = Math.min(Number(limit) || 50, 200);
    const skip = (Number(page) - 1) * pageSize;

    const [logs, total] = await Promise.all([
      PaymentLog.find(filter)
        .sort({ smsTimestamp: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      PaymentLog.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      total,
      page: Number(page),
      pageSize,
      logs,
    });
  } catch (error) {
    console.error('🚨 Erreur listLogs:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
