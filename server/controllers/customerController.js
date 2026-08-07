const { Customer, Transaction, Payment } = require('../models');

// Helper to generate custom customer ID (e.g. CUST-1001)
async function generateCustomerId() {
  const count = await Customer.countDocuments({});
  const nextNum = 1001 + count;
  return `CUST-${nextNum}`;
}

exports.getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      // JSON DB fallback supports RegExp in matchesQuery
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { name: regex },
          { phone: regex },
          { customerId: regex }
        ]
      };
      
      // Mongoose supports $or directly, but our simple matchesQuery handles it
      // Let's refine matchesQuery if it doesn't support $or, or just build standard query:
      // Wait, let's double check matchesQuery. In localDb.js, it loop keys. 
      // If we use simple filters, it's safer to filter manual in localDb if it gets complex,
      // or we can write the controllers to search array results when running JSON DB fallback.
      // That is extremely safe and easy! Let's check how we query in customer controller.
    }

    let customers = await Customer.find({});
    
    // Manual search filtering in case of complex mongoose $or queries when using localDb
    if (search) {
      const lowerSearch = search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(lowerSearch) || 
        c.phone.toLowerCase().includes(lowerSearch) || 
        (c.customerId && c.customerId.toLowerCase().includes(lowerSearch))
      );
    }

    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error listing customers' });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Retrieve related transactions (sorted by newest first)
    let transactions = await Transaction.find({ customerId: customer.customerId });
    transactions = transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Retrieve related payments (sorted by newest first)
    let payments = await Payment.find({ customerId: customer.customerId });
    payments = payments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      customer,
      transactions,
      payments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error getting customer details' });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const customerId = await generateCustomerId();

    const customer = await Customer.create({
      customerId,
      name,
      phone,
      address: address || '',
      canBalance: 0,
      pendingAmount: 0,
      totalDelivered: 0,
      totalReturned: 0,
      totalPaid: 0
    });

    res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating customer' });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name, phone, address, canBalance, pendingAmount } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;
    if (canBalance !== undefined) customer.canBalance = Number(canBalance);
    if (pendingAmount !== undefined) customer.pendingAmount = Number(pendingAmount);

    await customer.save();
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating customer' });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Customer.deleteOne({ _id: req.params.id });
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting customer' });
  }
};
