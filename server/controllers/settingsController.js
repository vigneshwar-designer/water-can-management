const { Settings } = require('../models');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      // Create default settings if not exists
      settings = await Settings.create({
        businessName: 'Water Can Co.',
        logo: '',
        waterPrice: 30,
        depositAmount: 200
      });
    }
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error getting settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { businessName, logo, waterPrice, depositAmount } = req.body;
    
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({
        businessName: businessName || 'Water Can Co.',
        logo: logo || '',
        waterPrice: Number(waterPrice) || 30,
        depositAmount: Number(depositAmount) || 200
      });
    } else {
      settings.businessName = businessName !== undefined ? businessName : settings.businessName;
      settings.logo = logo !== undefined ? logo : settings.logo;
      settings.waterPrice = waterPrice !== undefined ? Number(waterPrice) : settings.waterPrice;
      settings.depositAmount = depositAmount !== undefined ? Number(depositAmount) : settings.depositAmount;
      await settings.save();
    }
    
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating settings' });
  }
};

// Seed default settings helper
exports.seedDefaultSettings = async () => {
  try {
    const count = await Settings.countDocuments({});
    if (count === 0) {
      console.log('🌱 No settings found. Seeding default settings...');
      await Settings.create({
        businessName: 'Water Can Co.',
        logo: '',
        waterPrice: 30,
        depositAmount: 200
      });
      console.log('✅ Default settings seeded: Price = ₹30, Deposit = ₹200');
    }
  } catch (err) {
    console.error('Error seeding settings:', err);
  }
};
