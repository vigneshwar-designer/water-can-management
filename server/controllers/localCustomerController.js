const { LocalCustomer, Transaction } = require('../models');

exports.getLocalCustomers = async (req, res) => {
  try {
    const { search, status } = req.query;
    
    let customers = await LocalCustomer.find({});
    
    // Perform manual filters for safety with Local JSON DB fallback compatibility
    if (search) {
      const lowerSearch = search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(lowerSearch) || 
        c.phone.toLowerCase().includes(lowerSearch)
      );
    }
    
    if (status) {
      customers = customers.filter(c => c.returnStatus === status);
    }

    // Sort by createdDate descending
    customers.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error listing local customers' });
  }
};

exports.getLocalCustomerById = async (req, res) => {
  try {
    const customer = await LocalCustomer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Local customer not found' });
    }

    // Fetch related transactions (using customer phone or id as search criteria)
    // For local customers, we map transactions using their _id as the customerId string
    let transactions = await Transaction.find({ customerId: customer._id });
    transactions = transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      customer,
      transactions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error getting local customer details' });
  }
};
