const { Can, Customer, LocalCustomer, Transaction, Settings, Payment } = require('../models');

// Helper to generate unique transaction ID
function generateTxId() {
  return 'TX-' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

exports.deliverFixed = async (req, res) => {
  try {
    const { customerId, canIds, amountPaid, paymentMethod } = req.body;
    const paidAmt = Number(amountPaid || 0);

    if (!customerId || !canIds || !Array.isArray(canIds) || canIds.length === 0) {
      return res.status(400).json({ message: 'Customer ID and at least one Can ID are required' });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Fixed Customer not found' });
    }

    // Verify all cans are available
    const cans = [];
    for (const canId of canIds) {
      const can = await Can.findOne({ canId });
      if (!can) {
        return res.status(404).json({ message: `Can with ID ${canId} not found` });
      }
      if (can.status !== 'Available') {
        return res.status(400).json({ message: `Can ${can.canName} (${canId}) is not Available (current status: ${can.status})` });
      }
      cans.push(can);
    }

    // Fetch active price settings
    const settings = await Settings.findOne({});
    const waterPrice = settings ? settings.waterPrice : 30;
    const depositAmount = settings ? settings.depositAmount : 200;

    const totalWaterCharges = waterPrice * canIds.length;
    const balanceOwed = totalWaterCharges - paidAmt;

    const txId = generateTxId();

    // 1. Create Delivery Transaction
    await Transaction.create({
      transactionId: txId,
      type: 'Delivery',
      customerId: customer.customerId,
      customerType: 'Fixed',
      waterPrice,
      depositAmount,
      quantity: canIds.length,
      amount: totalWaterCharges,
      paymentMethod: paidAmt > 0 ? paymentMethod : 'None',
      status: balanceOwed <= 0 ? 'Paid' : 'Pending',
      timestamp: new Date().toISOString()
    });

    // 2. If any payment was made, create a Payment record and Transaction log
    if (paidAmt > 0) {
      const payId = 'PAY-' + Date.now();
      await Payment.create({
        paymentId: payId,
        customerId: customer.customerId,
        amount: paidAmt,
        paymentMethod,
        notes: `Paid during delivery ${txId}`,
        timestamp: new Date().toISOString()
      });

      await Transaction.create({
        transactionId: generateTxId(),
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
    }

    // 3. Update Cans
    for (const can of cans) {
      can.status = 'With Fixed Customer';
      can.currentCustomerId = customer.customerId;
      can.customerType = 'Fixed';
      can.lastUpdated = new Date().toISOString();
      await can.save();
    }

    // 4. Update Customer balances
    customer.canBalance += canIds.length;
    customer.totalDelivered += canIds.length;
    customer.pendingAmount += balanceOwed;
    customer.totalPaid += paidAmt;
    await customer.save();

    res.status(201).json({
      message: 'Delivery recorded successfully',
      deliveryTx: txId,
      waterCharges: totalWaterCharges,
      amountPaid: paidAmt,
      pendingAmount: customer.pendingAmount,
      canBalance: customer.canBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error processing fixed delivery' });
  }
};

exports.deliverLocal = async (req, res) => {
  try {
    const { name, phone, canIds, amountPaid, paymentMethod } = req.body;
    const paidAmt = Number(amountPaid || 0);

    if (!name || !phone || !canIds || !Array.isArray(canIds) || canIds.length === 0) {
      return res.status(400).json({ message: 'Name, Phone, and at least one Can ID are required' });
    }

    // Verify all cans are available
    const cans = [];
    for (const canId of canIds) {
      const can = await Can.findOne({ canId });
      if (!can) {
        return res.status(404).json({ message: `Can with ID ${canId} not found` });
      }
      if (can.status !== 'Available') {
        return res.status(400).json({ message: `Can ${can.canName} (${canId}) is not Available` });
      }
      cans.push(can);
    }

    // Fetch active settings
    const settings = await Settings.findOne({});
    const waterPrice = settings ? settings.waterPrice : 30;
    const depositAmount = settings ? settings.depositAmount : 200;

    const totalWaterCharges = waterPrice * canIds.length;
    const totalDeposit = depositAmount * canIds.length;
    const grandTotal = totalWaterCharges + totalDeposit;

    // Create Temporary Local Customer profile
    const localCustomer = await LocalCustomer.create({
      name,
      phone,
      depositAmount: totalDeposit,
      waterCharges: totalWaterCharges,
      currentCans: canIds,
      returnStatus: 'Pending'
    });

    const customerIdStr = localCustomer._id.toString();

    // Create transactions for history tracking
    // Delivery transaction
    await Transaction.create({
      transactionId: generateTxId(),
      type: 'Delivery',
      customerId: customerIdStr,
      customerType: 'Local',
      waterPrice,
      depositAmount,
      quantity: canIds.length,
      amount: totalWaterCharges,
      paymentMethod,
      status: 'Paid', // Temporary customer transactions are paid upfront
      timestamp: new Date().toISOString()
    });

    // Deposit transaction
    await Transaction.create({
      transactionId: generateTxId(),
      type: 'Deposit',
      customerId: customerIdStr,
      customerType: 'Local',
      waterPrice,
      depositAmount,
      quantity: canIds.length,
      amount: totalDeposit,
      paymentMethod,
      status: 'Paid',
      timestamp: new Date().toISOString()
    });

    // Update Cans ownership
    for (const can of cans) {
      can.status = 'With Local Customer';
      can.currentCustomerId = customerIdStr;
      can.customerType = 'Local';
      can.lastUpdated = new Date().toISOString();
      await can.save();
    }

    res.status(201).json({
      message: 'Local delivery registered successfully',
      localCustomerId: customerIdStr,
      waterCharges: totalWaterCharges,
      depositAmount: totalDeposit,
      grandTotal
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error processing local delivery' });
  }
};

exports.returnCan = async (req, res) => {
  try {
    const { canId } = req.body;
    if (!canId) {
      return res.status(400).json({ message: 'Can ID is required' });
    }

    const can = await Can.findOne({ canId });
    if (!can) {
      return res.status(404).json({ message: `Can with ID ${canId} not found` });
    }

    if (can.status === 'Available') {
      return res.status(400).json({ message: `Can ${can.canName} is already back in inventory` });
    }

    const settings = await Settings.findOne({});
    const waterPrice = settings ? settings.waterPrice : 30;
    const depositAmount = settings ? settings.depositAmount : 200;

    const prevStatus = can.status;
    const customerId = can.currentCustomerId;

    if (prevStatus === 'With Fixed Customer') {
      const customer = await Customer.findOne({ customerId });
      if (customer) {
        // Record return transaction
        await Transaction.create({
          transactionId: generateTxId(),
          type: 'Return',
          canId: can.canId,
          customerId: customer.customerId,
          customerType: 'Fixed',
          waterPrice,
          depositAmount,
          quantity: 1,
          amount: 0,
          paymentMethod: 'None',
          status: 'Paid',
          timestamp: new Date().toISOString()
        });

        // Update customer details
        customer.canBalance = Math.max(0, customer.canBalance - 1);
        customer.totalReturned += 1;
        await customer.save();
      }
    } else if (prevStatus === 'With Local Customer') {
      const localCustomer = await LocalCustomer.findById(customerId);
      if (localCustomer) {
        // Remove can from local customer's holding list
        localCustomer.currentCans = (localCustomer.currentCans || []).filter(id => id !== can.canId);
        
        // Calculate refund (₹200 per returned can)
        const refundAmt = depositAmount;
        localCustomer.depositAmount = Math.max(0, localCustomer.depositAmount - refundAmt);
        
        if (localCustomer.currentCans.length === 0) {
          localCustomer.returnStatus = 'Returned';
        }
        await localCustomer.save();

        // Create return transaction
        await Transaction.create({
          transactionId: generateTxId(),
          type: 'Return',
          canId: can.canId,
          customerId: localCustomer._id.toString(),
          customerType: 'Local',
          waterPrice,
          depositAmount,
          quantity: 1,
          amount: 0,
          paymentMethod: 'None',
          status: 'Paid',
          timestamp: new Date().toISOString()
        });

        // Create refund transaction
        await Transaction.create({
          transactionId: generateTxId(),
          type: 'Refund',
          canId: can.canId,
          customerId: localCustomer._id.toString(),
          customerType: 'Local',
          waterPrice,
          depositAmount,
          quantity: 1,
          amount: refundAmt,
          paymentMethod: 'Cash', // Defaulting to Cash refund for deposits
          status: 'Refunded',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Move can back to inventory
    can.status = 'Available';
    can.currentCustomerId = null;
    can.customerType = null;
    can.lastUpdated = new Date().toISOString();
    await can.save();

    res.json({
      message: `Can ${canId} returned successfully.`,
      previousStatus: prevStatus,
      newStatus: 'Available'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error processing returns' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    let list = await Transaction.find({});
    // Sort transactions by date descending
    list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving transaction logs' });
  }
};
