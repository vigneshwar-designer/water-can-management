const { Can, Customer, LocalCustomer, Transaction, Settings } = require('../models');

exports.getSummary = async (req, res) => {
  try {
    // 1. Get today's range
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    // Fetch today's transactions
    const allTx = await Transaction.find({});
    const todayTx = allTx.filter(t => t.timestamp >= startOfToday && t.timestamp <= endOfToday);

    // Today's stats calculation
    let waterRevenue = 0;
    let pendingPayments = 0;
    let depositsHeld = 0;
    let depositsRefunded = 0;
    let cansDeliveredToday = 0;
    let cansReturnedToday = 0;

    todayTx.forEach(t => {
      if (t.type === 'Delivery') {
        waterRevenue += t.amount;
        cansDeliveredToday += t.quantity;
        if (t.status === 'Pending') {
          pendingPayments += t.amount; // default today's pending charges
        }
      } else if (t.type === 'Payment') {
        // Cash flows. Note: Payment transactions represent cash received.
        // We can display actual cash revenue or water bills.
      } else if (t.type === 'Deposit') {
        depositsHeld += t.amount;
      } else if (t.type === 'Refund') {
        depositsRefunded += t.amount;
      } else if (t.type === 'Return') {
        cansReturnedToday += t.quantity;
      }
    });

    // 2. Fetch inventory breakdown
    const cans = await Can.find({});
    const totalCans = cans.length;
    const available = cans.filter(c => c.status === 'Available').length;
    const withFixed = cans.filter(c => c.status === 'With Fixed Customer').length;
    const withLocal = cans.filter(c => c.status === 'With Local Customer').length;
    const maintenance = cans.filter(c => c.status === 'Maintenance').length;
    const lost = cans.filter(c => c.status === 'Lost').length;

    // Reconciliation warning check: Total = Sum of statuses
    const sumCans = available + withFixed + withLocal + maintenance + lost;
    const isMismatch = totalCans !== sumCans;

    // 3. Quick Lists
    // Recent 10 transactions
    const sortedTx = [...allTx].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentTransactions = sortedTx.slice(0, 10);

    // Fixed customers with outstanding payments
    const customers = await Customer.find({});
    const pendingCollections = customers
      .filter(c => c.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, 5); // Limit to top 5 for quick actions

    // 4. Overalls for extra summary power
    const overallDepositsHeld = customers.reduce((sum, c) => sum + (c.canBalance * 200), 0); // Estimate
    const overallLocalDeposits = (await LocalCustomer.find({})).reduce((sum, lc) => sum + lc.depositAmount, 0);

    res.json({
      todaySummary: {
        waterRevenue,
        pendingPayments,
        depositsHeld,
        depositsRefunded,
        cansDeliveredToday,
        cansReturnedToday
      },
      inventorySummary: {
        totalCans,
        available,
        withFixed,
        withLocal,
        maintenance,
        lost,
        isMismatch,
        mismatchDetail: isMismatch ? `Inventory mismatch: Registered Cans (${totalCans}) vs Sum of Cans (${sumCans}).` : null
      },
      recentTransactions,
      pendingCollections
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating dashboard summary' });
  }
};
