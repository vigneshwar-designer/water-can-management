const { Payment, Customer, Transaction, Settings } = require('../models');

exports.collectPayment = async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, notes } = req.body;
    const paidAmt = Number(amount);

    if (!customerId || isNaN(paidAmt) || paidAmt <= 0 || !paymentMethod) {
      return res.status(400).json({ message: 'Customer ID, valid payment amount, and method are required' });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Generate unique codes
    const payId = 'PAY-' + Date.now();
    const txId = 'TX-' + Date.now() + 'PAY';

    // 1. Create Payment record
    const payment = await Payment.create({
      paymentId: payId,
      customerId: customer.customerId,
      amount: paidAmt,
      paymentMethod,
      notes: notes || '',
      timestamp: new Date().toISOString()
    });

    // Fetch active settings for log completeness
    const settings = await Settings.findOne({});
    const waterPrice = settings ? settings.waterPrice : 30;
    const depositAmount = settings ? settings.depositAmount : 200;

    // 2. Log as a Payment Transaction
    await Transaction.create({
      transactionId: txId,
      type: 'Payment',
      customerId: customer.customerId,
      customerType: 'Fixed',
      waterPrice,
      depositAmount,
      quantity: 0,
      amount: paidAmt,
      paymentMethod,
      status: 'Paid',
      timestamp: new Date().toISOString()
    });

    // 3. Update Customer financial balances
    customer.pendingAmount = Math.max(0, customer.pendingAmount - paidAmt);
    customer.totalPaid += paidAmt;
    await customer.save();

    res.status(201).json({
      message: 'Payment collected successfully',
      payment,
      customer
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error collecting payment' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    let list = await Payment.find({});
    list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving payments' });
  }
};
