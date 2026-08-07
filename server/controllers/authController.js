const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Helper to generate token
function generateToken(user) {
  return jwt.sign(
    { userId: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'dev_secret_water_can_management_system',
    { expiresIn: '7d' }
  );
}

exports.register = async (req, res) => {
  return res.status(400).json({ message: 'Registration is disabled.' });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error getting profile' });
  }
};

// Seed default admin accounts and enforce ONLY these accounts
exports.seedDefaultAdmin = async () => {
  try {
    console.log('🌱 Enforcing permanent admin accounts...');
    
    // Clear all existing user accounts to guarantee only the two specified accounts exist
    await User.deleteMany({});
    
    const salt1 = await bcrypt.genSalt(10);
    const hash1 = await bcrypt.hash('Admin@123', salt1);
    
    const salt2 = await bcrypt.genSalt(10);
    const hash2 = await bcrypt.hash('Admin@456', salt2);
    
    await User.create({
      username: 'admin@123.com',
      password: hash1,
      role: 'admin'
    });
    
    await User.create({
      username: 'admin@456.com',
      password: hash2,
      role: 'admin'
    });
    
    console.log('✅ Permanent admin accounts seeded successfully (admin@123.com and admin@456.com)');
  } catch (err) {
    console.error('Error seeding default admin:', err);
  }
};
