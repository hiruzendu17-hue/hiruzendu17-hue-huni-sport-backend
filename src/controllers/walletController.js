const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');

const ensureWallet = async (userId, session) => {
  let query = Wallet.findOne({ user: userId });
  if (session) {
    query = query.session(session);
  }
  let wallet = await query;
  if (!wallet) {
    const created = await Wallet.create(
      [
        {
          user: userId,
          balance: 0,
          currency: 'FCFA',
          transactions: [],
        },
      ],
      session ? { session } : undefined
    );
    wallet = created[0];
  }
  return wallet;
};

exports.getWallet = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const wallet = await ensureWallet(req.user.id);
    const transactions = [...wallet.transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
        transactions,
      },
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.requestTopup = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const wallet = await ensureWallet(req.user.id);
    const transaction = {
      type: 'deposit',
      amount,
      status: 'pending',
      method: 'airtel_money',
      description: 'Recharge via Airtel Money',
      createdAt: new Date(),
    };

    wallet.transactions.push(transaction);
    await wallet.save();

    const topup = wallet.transactions[wallet.transactions.length - 1];

    return res.status(201).json({
      success: true,
      topupId: topup._id,
      amount: topup.amount,
      status: topup.status,
    });
  } catch (error) {
    console.error('Request topup error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.confirmTopup = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { topupId, reference } = req.body;
    if (!topupId || !mongoose.Types.ObjectId.isValid(topupId)) {
      return res.status(400).json({ success: false, error: 'Invalid topupId' });
    }

    const wallet = await Wallet.findOne({
      user: req.user.id,
      'transactions._id': topupId,
    });

    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Topup not found' });
    }

    const transaction = wallet.transactions.id(topupId);
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Topup not found' });
    }

    if (transaction.status === 'completed') {
      return res.json({
        success: true,
        balance: wallet.balance,
        status: transaction.status,
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Topup not pending' });
    }

    transaction.status = 'completed';
    transaction.completedAt = new Date();
    if (reference) {
      transaction.reference = String(reference);
    }

    wallet.balance += transaction.amount;
    await wallet.save();

    return res.json({
      success: true,
      balance: wallet.balance,
      status: transaction.status,
    });
  } catch (error) {
    console.error('Confirm topup error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.listTopups = async (req, res) => {
  try {
    const status = req.query.status || 'pending';

    const wallets = await Wallet.find({
      'transactions.type': 'deposit',
      'transactions.status': status,
    }).populate('user', 'name email phone');

    const topups = [];

    wallets.forEach((wallet) => {
      wallet.transactions.forEach((tx) => {
        if (tx.type === 'deposit' && tx.status === status) {
          topups.push({
            id: tx._id,
            amount: tx.amount,
            status: tx.status,
            method: tx.method,
            reference: tx.reference,
            createdAt: tx.createdAt,
            user: {
              id: wallet.user?._id,
              name: wallet.user?.name,
              email: wallet.user?.email,
              phone: wallet.user?.phone,
            },
          });
        }
      });
    });

    topups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ success: true, topups });
  } catch (error) {
    console.error('List topups error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.confirmTopupAdmin = async (req, res) => {
  try {
    const { topupId, reference } = req.body;
    if (!topupId || !mongoose.Types.ObjectId.isValid(topupId)) {
      return res.status(400).json({ success: false, error: 'Invalid topupId' });
    }

    const wallet = await Wallet.findOne({ 'transactions._id': topupId });
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Topup not found' });
    }

    const transaction = wallet.transactions.id(topupId);
    if (!transaction || transaction.type !== 'deposit') {
      return res.status(404).json({ success: false, error: 'Topup not found' });
    }

    if (transaction.status === 'completed') {
      return res.json({ success: true, balance: wallet.balance, status: transaction.status });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Topup not pending' });
    }

    transaction.status = 'completed';
    transaction.completedAt = new Date();
    if (reference) {
      transaction.reference = String(reference);
    }

    wallet.balance += transaction.amount;
    await wallet.save();

    return res.json({ success: true, balance: wallet.balance, status: transaction.status });
  } catch (error) {
    console.error('Confirm topup admin error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.ensureWallet = ensureWallet;
