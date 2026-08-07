const { Can, Customer, LocalCustomer, Transaction, Settings } = require('../models');

exports.getDailyReport = async (req, res) => {
  try {
    const { date } = req.query; // Expect format YYYY-MM-DD
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString();
    const endOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999).toISOString();

    const allTx = await Transaction.find({});
    const targetTx = allTx.filter(t => t.timestamp >= startOfTarget && t.timestamp <= endOfTarget);

    let waterRevenue = 0;
    let deposits = 0;
    let refunds = 0;
    let deliveries = 0;
    let returns = 0;
    let pendingPayments = 0;

    targetTx.forEach(t => {
      if (t.type === 'Delivery') {
        waterRevenue += t.amount;
        deliveries += t.quantity;
        if (t.status === 'Pending') {
          pendingPayments += t.amount;
        }
      } else if (t.type === 'Deposit') {
        deposits += t.amount;
      } else if (t.type === 'Refund') {
        refunds += t.amount;
      } else if (t.type === 'Return') {
        returns += t.quantity;
      }
    });

    // Outstanding cans = Cans currently out with customer (delivered - returned)
    const cans = await Can.find({});
    const outstandingCans = cans.filter(c => ['With Fixed Customer', 'With Local Customer'].includes(c.status)).length;

    res.json({
      date: targetDate.toISOString().split('T')[0],
      waterRevenue,
      deposits,
      refunds,
      deliveries,
      returns,
      pendingPayments,
      outstandingCans
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating daily report' });
  }
};

exports.getCustomerReport = async (req, res) => {
  try {
    const customers = await Customer.find({});
    const localCustomers = await LocalCustomer.find({});

    const fixedReport = customers.map(c => ({
      customerId: c.customerId,
      name: c.name,
      phone: c.phone,
      type: 'Fixed',
      canBalance: c.canBalance,
      pendingAmount: c.pendingAmount,
      totalDelivered: c.totalDelivered,
      totalReturned: c.totalReturned,
      totalPaid: c.totalPaid
    }));

    const localReport = localCustomers.map(lc => ({
      customerId: lc._id.toString(),
      name: lc.name,
      phone: lc.phone,
      type: 'Local',
      canBalance: lc.currentCans.length,
      pendingAmount: lc.returnStatus === 'Pending' ? lc.waterCharges : 0, // Quick estimate
      totalDelivered: lc.currentCans.length, // Initial count
      totalReturned: lc.returnStatus === 'Returned' ? lc.currentCans.length : 0,
      totalPaid: lc.waterCharges + lc.depositAmount // Paid upfront
    }));

    res.json({
      fixedCustomers: fixedReport,
      localCustomers: localReport
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating customer report' });
  }
};

exports.getCanReport = async (req, res) => {
  try {
    const cans = await Can.find({});
    const transactions = await Transaction.find({});

    const canReport = cans.map(c => {
      // Find how many times this can was delivered
      const canTx = transactions.filter(t => t.canId === c.canId);
      const deliveryCount = canTx.filter(t => t.type === 'Delivery').length;
      const returnCount = canTx.filter(t => t.type === 'Return').length;

      return {
        canId: c.canId,
        canName: c.canName,
        status: c.status,
        currentCustomerId: c.currentCustomerId,
        customerType: c.customerType,
        deliveryCount,
        returnCount,
        lastUpdated: c.lastUpdated
      };
    });

    res.json(canReport);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating can report' });
  }
};

exports.getInventoryReport = async (req, res) => {
  try {
    const cans = await Can.find({});
    const totalCans = cans.length;
    const available = cans.filter(c => c.status === 'Available').length;
    const withFixed = cans.filter(c => c.status === 'With Fixed Customer').length;
    const withLocal = cans.filter(c => c.status === 'With Local Customer').length;
    const maintenance = cans.filter(c => c.status === 'Maintenance').length;
    const lost = cans.filter(c => c.status === 'Lost').length;

    const sumCans = available + withFixed + withLocal + maintenance + lost;
    const isMismatch = totalCans !== sumCans;

    res.json({
      totalCans,
      available,
      withFixed,
      withLocal,
      maintenance,
      lost,
      isMismatch,
      validationMessage: isMismatch 
        ? `⚠️ ALERT: Total Cans (${totalCans}) does NOT match sum of statuses (${sumCans})!`
        : `✅ VERIFIED: Inventory matches perfectly (Total = ${totalCans}).`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating inventory report' });
  }
};
