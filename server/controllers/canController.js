const { Can, Transaction, Customer, LocalCustomer } = require('../models');

// Helper to find the next sequence number for bulk generation
async function getNextCanSeqNumber() {
  const cans = await Can.find({});
  let maxSeq = 0;
  cans.forEach(c => {
    const match = c.canId.match(/WC-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });
  return maxSeq + 1;
}

exports.getCans = async (req, res) => {
  try {
    const { search, status } = req.query;
    let cans = await Can.find({});

    // Manual filtering for JSON DB fallback compatibility
    if (search) {
      const lowerSearch = search.toLowerCase();
      cans = cans.filter(c => 
        c.canName.toLowerCase().includes(lowerSearch) || 
        c.canId.toLowerCase().includes(lowerSearch)
      );
    }

    if (status) {
      cans = cans.filter(c => c.status === status);
    }

    // Sort by canId
    cans.sort((a, b) => a.canId.localeCompare(b.canId));

    res.json(cans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error listing cans' });
  }
};

exports.getCanByCanId = async (req, res) => {
  try {
    const { canId } = req.params;
    const can = await Can.findOne({ canId });
    if (!can) {
      return res.status(404).json({ message: 'Can not found' });
    }

    // Retrieve active customer details if the can is assigned
    let customerInfo = null;
    if (can.status === 'With Fixed Customer' && can.currentCustomerId) {
      customerInfo = await Customer.findOne({ customerId: can.currentCustomerId });
    } else if (can.status === 'With Local Customer' && can.currentCustomerId) {
      customerInfo = await LocalCustomer.findById(can.currentCustomerId);
    }

    res.json({ can, customer: customerInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error getting can info' });
  }
};

exports.getCanHistory = async (req, res) => {
  try {
    const { canId } = req.params;
    const can = await Can.findOne({ canId });
    if (!can) {
      return res.status(404).json({ message: 'Can not found' });
    }

    let history = await Transaction.find({ canId });
    history = history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ can, history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error getting can history' });
  }
};

exports.createCan = async (req, res) => {
  try {
    const { canName, canId } = req.body;
    if (!canName || !canId) {
      return res.status(400).json({ message: 'Can Name and Can ID are required' });
    }

    const existing = await Can.findOne({ canId });
    if (existing) {
      return res.status(400).json({ message: `Can with ID ${canId} already exists` });
    }

    const newCan = await Can.create({
      canId,
      canName,
      qrCodeData: canId, // The QR code content is just the unique ID
      status: 'Available',
      currentCustomerId: null,
      customerType: null
    });

    res.status(201).json(newCan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating can' });
  }
};

exports.bulkGenerateCans = async (req, res) => {
  try {
    const { count, baseName } = req.body;
    const itemsCount = parseInt(count, 10);
    const prefix = baseName || 'Blue Can';
    
    if (isNaN(itemsCount) || itemsCount <= 0) {
      return res.status(400).json({ message: 'Valid count is required' });
    }

    const startSeq = await getNextCanSeqNumber();
    const newCans = [];

    for (let i = 0; i < itemsCount; i++) {
      const currentSeq = startSeq + i;
      const formattedSeq = currentSeq.toString().padStart(4, '0');
      const canId = `WC-${formattedSeq}`;
      const canName = `${prefix} ${currentSeq.toString().padStart(2, '0')}`;

      newCans.push({
        canId,
        canName,
        qrCodeData: canId,
        status: 'Available',
        currentCustomerId: null,
        customerType: null,
        lastUpdated: new Date().toISOString()
      });
    }

    const created = await Can.insertMany(newCans);
    res.status(201).json({
      message: `Successfully generated ${itemsCount} cans`,
      cans: created
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error bulk generating cans' });
  }
};

exports.updateCan = async (req, res) => {
  try {
    const { status } = req.body;
    const can = await Can.findById(req.params.id);
    if (!can) {
      return res.status(404).json({ message: 'Can not found' });
    }

    if (status !== undefined) {
      can.status = status;
      // If we move it back to inventory or maintenance or lost, clear customer association
      if (['Available', 'Maintenance', 'Lost'].includes(status)) {
        can.currentCustomerId = null;
        can.customerType = null;
      }
    }
    
    can.lastUpdated = new Date().toISOString();
    await can.save();
    res.json(can);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating can' });
  }
};
