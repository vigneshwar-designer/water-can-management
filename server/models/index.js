const mongoose = require('mongoose');
const { LocalModel } = require('./localDb');

// Helper to check if JSON fallback is enabled
const useJsonDb = () => process.env.USE_JSON_DB === 'true';

// ----------------- USER SCHEMA -----------------
const userSchemaConfig = {
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' }
};
const userSchema = new mongoose.Schema(userSchemaConfig, { timestamps: true });
const MongooseUser = mongoose.model('User', userSchema);
const LocalUser = new LocalModel('users', userSchemaConfig);

// ----------------- SETTINGS SCHEMA -----------------
const settingsSchemaConfig = {
  businessName: { type: String, default: 'Water Can Co.' },
  logo: { type: String, default: '' },
  waterPrice: { type: Number, default: 30 },
  depositAmount: { type: Number, default: 200 }
};
const settingsSchema = new mongoose.Schema(settingsSchemaConfig, { timestamps: true });
const MongooseSettings = mongoose.model('Settings', settingsSchema);
const LocalSettings = new LocalModel('settings', settingsSchemaConfig);

// ----------------- CAN SCHEMA -----------------
const canSchemaConfig = {
  canId: { type: String, required: true, unique: true },
  canName: { type: String, required: true },
  qrCodeData: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Available', 'With Fixed Customer', 'With Local Customer', 'Maintenance', 'Lost'], 
    default: 'Available' 
  },
  currentCustomerId: { type: String, default: null },
  customerType: { type: String, default: null }, // 'Fixed' or 'Local'
  lastUpdated: { type: String, default: () => new Date().toISOString() }
};
const canSchema = new mongoose.Schema(canSchemaConfig, { timestamps: true });
const MongooseCan = mongoose.model('Can', canSchema);
const LocalCan = new LocalModel('cans', canSchemaConfig);

// ----------------- CUSTOMER SCHEMA -----------------
const customerSchemaConfig = {
  customerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, default: '' },
  canBalance: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  totalDelivered: { type: Number, default: 0 },
  totalReturned: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  createdDate: { type: String, default: () => new Date().toISOString() }
};
const customerSchema = new mongoose.Schema(customerSchemaConfig, { timestamps: true });
const MongooseCustomer = mongoose.model('Customer', customerSchema);
const LocalCustomer = new LocalModel('customers', customerSchemaConfig);

// ----------------- LOCAL CUSTOMER SCHEMA -----------------
const localCustomerSchemaConfig = {
  name: { type: String, required: true },
  phone: { type: String, required: true },
  depositAmount: { type: Number, default: 0 },
  waterCharges: { type: Number, default: 0 },
  currentCans: { type: Array, default: [] }, // Array of Can IDs
  returnStatus: { type: String, enum: ['Pending', 'Returned'], default: 'Pending' },
  createdDate: { type: String, default: () => new Date().toISOString() }
};
const localCustomerSchema = new mongoose.Schema(localCustomerSchemaConfig, { timestamps: true });
const MongooseLocalCustomer = mongoose.model('LocalCustomer', localCustomerSchema);
const LocalLocalCustomer = new LocalModel('localCustomers', localCustomerSchemaConfig);

// ----------------- TRANSACTION SCHEMA -----------------
const transactionSchemaConfig = {
  transactionId: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['Delivery', 'Return', 'Payment', 'Deposit', 'Refund'], 
    required: true 
  },
  canId: { type: String, default: null }, // If linked to a specific can
  customerId: { type: String, required: true },
  customerType: { type: String, enum: ['Fixed', 'Local'], required: true },
  waterPrice: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  amount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Bank', 'None'], default: 'None' },
  status: { type: String, enum: ['Pending', 'Paid', 'Refunded'], default: 'Paid' },
  timestamp: { type: String, default: () => new Date().toISOString() }
};
const transactionSchema = new mongoose.Schema(transactionSchemaConfig, { timestamps: true });
const MongooseTransaction = mongoose.model('Transaction', transactionSchema);
const LocalTransaction = new LocalModel('transactions', transactionSchemaConfig);

// ----------------- PAYMENT SCHEMA -----------------
const paymentSchemaConfig = {
  paymentId: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Bank'], required: true },
  notes: { type: String, default: '' },
  timestamp: { type: String, default: () => new Date().toISOString() }
};
const paymentSchema = new mongoose.Schema(paymentSchemaConfig, { timestamps: true });
const MongoosePayment = mongoose.model('Payment', paymentSchema);
const LocalPayment = new LocalModel('payments', paymentSchemaConfig);

// Dynamic proxy model definitions
module.exports = {
  User: {
    find: (q) => useJsonDb() ? LocalUser.find(q) : MongooseUser.find(q),
    findOne: (q) => useJsonDb() ? LocalUser.findOne(q) : MongooseUser.findOne(q),
    findById: (id) => useJsonDb() ? LocalUser.findById(id) : MongooseUser.findById(id),
    create: (d) => useJsonDb() ? LocalUser.create(d) : MongooseUser.create(d),
    insertMany: (a) => useJsonDb() ? LocalUser.insertMany(a) : MongooseUser.insertMany(a),
    findByIdAndUpdate: (id, u, o) => useJsonDb() ? LocalUser.findByIdAndUpdate(id, u, o) : MongooseUser.findByIdAndUpdate(id, u, o),
    findOneAndUpdate: (q, u, o) => useJsonDb() ? LocalUser.findOneAndUpdate(q, u, o) : MongooseUser.findOneAndUpdate(q, u, o),
    updateOne: (q, u) => useJsonDb() ? LocalUser.updateOne(q, u) : MongooseUser.updateOne(q, u),
    deleteOne: (q) => useJsonDb() ? LocalUser.deleteOne(q) : MongooseUser.deleteOne(q),
    deleteMany: (q) => useJsonDb() ? LocalUser.deleteMany(q) : MongooseUser.deleteMany(q),
    countDocuments: (q) => useJsonDb() ? LocalUser.countDocuments(q) : MongooseUser.countDocuments(q),
  },
  Settings: {
    find: (q) => useJsonDb() ? LocalSettings.find(q) : MongooseSettings.find(q),
    findOne: (q) => useJsonDb() ? LocalSettings.findOne(q) : MongooseSettings.findOne(q),
    findById: (id) => useJsonDb() ? LocalSettings.findById(id) : MongooseSettings.findById(id),
    create: (d) => useJsonDb() ? LocalSettings.create(d) : MongooseSettings.create(d),
    findByIdAndUpdate: (id, u, o) => useJsonDb() ? LocalSettings.findByIdAndUpdate(id, u, o) : MongooseSettings.findByIdAndUpdate(id, u, o),
    findOneAndUpdate: (q, u, o) => useJsonDb() ? LocalSettings.findOneAndUpdate(q, u, o) : MongooseSettings.findOneAndUpdate(q, u, o),
    updateOne: (q, u) => useJsonDb() ? LocalSettings.updateOne(q, u) : MongooseSettings.updateOne(q, u),
    countDocuments: (q) => useJsonDb() ? LocalSettings.countDocuments(q) : MongooseSettings.countDocuments(q),
  },
  Can: {
    find: (q) => useJsonDb() ? LocalCan.find(q) : MongooseCan.find(q),
    findOne: (q) => useJsonDb() ? LocalCan.findOne(q) : MongooseCan.findOne(q),
    findById: (id) => useJsonDb() ? LocalCan.findById(id) : MongooseCan.findById(id),
    create: (d) => useJsonDb() ? LocalCan.create(d) : MongooseCan.create(d),
    insertMany: (a) => useJsonDb() ? LocalCan.insertMany(a) : MongooseCan.insertMany(a),
    findByIdAndUpdate: (id, u, o) => useJsonDb() ? LocalCan.findByIdAndUpdate(id, u, o) : MongooseCan.findByIdAndUpdate(id, u, o),
    findOneAndUpdate: (q, u, o) => useJsonDb() ? LocalCan.findOneAndUpdate(q, u, o) : MongooseCan.findOneAndUpdate(q, u, o),
    updateOne: (q, u) => useJsonDb() ? LocalCan.updateOne(q, u) : MongooseCan.updateOne(q, u),
    deleteOne: (q) => useJsonDb() ? LocalCan.deleteOne(q) : MongooseCan.deleteOne(q),
    deleteMany: (q) => useJsonDb() ? LocalCan.deleteMany(q) : MongooseCan.deleteMany(q),
    countDocuments: (q) => useJsonDb() ? LocalCan.countDocuments(q) : MongooseCan.countDocuments(q),
  },
  Customer: {
    find: (q) => useJsonDb() ? LocalCustomer.find(q) : MongooseCustomer.find(q),
    findOne: (q) => useJsonDb() ? LocalCustomer.findOne(q) : MongooseCustomer.findOne(q),
    findById: (id) => useJsonDb() ? LocalCustomer.findById(id) : MongooseCustomer.findById(id),
    create: (d) => useJsonDb() ? LocalCustomer.create(d) : MongooseCustomer.create(d),
    findByIdAndUpdate: (id, u, o) => useJsonDb() ? LocalCustomer.findByIdAndUpdate(id, u, o) : MongooseCustomer.findByIdAndUpdate(id, u, o),
    findOneAndUpdate: (q, u, o) => useJsonDb() ? LocalCustomer.findOneAndUpdate(q, u, o) : MongooseCustomer.findOneAndUpdate(q, u, o),
    updateOne: (q, u) => useJsonDb() ? LocalCustomer.updateOne(q, u) : MongooseCustomer.updateOne(q, u),
    deleteOne: (q) => useJsonDb() ? LocalCustomer.deleteOne(q) : MongooseCustomer.deleteOne(q),
    countDocuments: (q) => useJsonDb() ? LocalCustomer.countDocuments(q) : MongooseCustomer.countDocuments(q),
  },
  LocalCustomer: {
    find: (q) => useJsonDb() ? LocalLocalCustomer.find(q) : MongooseLocalCustomer.find(q),
    findOne: (q) => useJsonDb() ? LocalLocalCustomer.findOne(q) : MongooseLocalCustomer.findOne(q),
    findById: (id) => useJsonDb() ? LocalLocalCustomer.findById(id) : MongooseLocalCustomer.findById(id),
    create: (d) => useJsonDb() ? LocalLocalCustomer.create(d) : MongooseLocalCustomer.create(d),
    findByIdAndUpdate: (id, u, o) => useJsonDb() ? LocalLocalCustomer.findByIdAndUpdate(id, u, o) : MongooseLocalCustomer.findByIdAndUpdate(id, u, o),
    findOneAndUpdate: (q, u, o) => useJsonDb() ? LocalLocalCustomer.findOneAndUpdate(q, u, o) : MongooseLocalCustomer.findOneAndUpdate(q, u, o),
    updateOne: (q, u) => useJsonDb() ? LocalLocalCustomer.updateOne(q, u) : MongooseLocalCustomer.updateOne(q, u),
    deleteOne: (q) => useJsonDb() ? LocalLocalCustomer.deleteOne(q) : MongooseLocalCustomer.deleteOne(q),
    countDocuments: (q) => useJsonDb() ? LocalLocalCustomer.countDocuments(q) : MongooseLocalCustomer.countDocuments(q),
  },
  Transaction: {
    find: (q) => useJsonDb() ? LocalTransaction.find(q) : MongooseTransaction.find(q),
    findOne: (q) => useJsonDb() ? LocalTransaction.findOne(q) : MongooseTransaction.findOne(q),
    findById: (id) => useJsonDb() ? LocalTransaction.findById(id) : MongooseTransaction.findById(id),
    create: (d) => useJsonDb() ? LocalTransaction.create(d) : MongooseTransaction.create(d),
    findByIdAndUpdate: (id, u, o) => useJsonDb() ? LocalTransaction.findByIdAndUpdate(id, u, o) : MongooseTransaction.findByIdAndUpdate(id, u, o),
    findOneAndUpdate: (q, u, o) => useJsonDb() ? LocalTransaction.findOneAndUpdate(q, u, o) : MongooseTransaction.findOneAndUpdate(q, u, o),
    deleteOne: (q) => useJsonDb() ? LocalTransaction.deleteOne(q) : MongooseTransaction.deleteOne(q),
    deleteMany: (q) => useJsonDb() ? LocalTransaction.deleteMany(q) : MongooseTransaction.deleteMany(q),
    countDocuments: (q) => useJsonDb() ? LocalTransaction.countDocuments(q) : MongooseTransaction.countDocuments(q),
  },
  Payment: {
    find: (q) => useJsonDb() ? LocalPayment.find(q) : MongoosePayment.find(q),
    findOne: (q) => useJsonDb() ? LocalPayment.findOne(q) : MongoosePayment.findOne(q),
    findById: (id) => useJsonDb() ? LocalPayment.findById(id) : MongoosePayment.findById(id),
    create: (d) => useJsonDb() ? LocalPayment.create(d) : MongoosePayment.create(d),
    findByIdAndUpdate: (id, u, o) => useJsonDb() ? LocalPayment.findByIdAndUpdate(id, u, o) : MongoosePayment.findByIdAndUpdate(id, u, o),
    findOneAndUpdate: (q, u, o) => useJsonDb() ? LocalPayment.findOneAndUpdate(q, u, o) : MongoosePayment.findOneAndUpdate(q, u, o),
    deleteOne: (q) => useJsonDb() ? LocalPayment.deleteOne(q) : MongoosePayment.deleteOne(q),
    countDocuments: (q) => useJsonDb() ? LocalPayment.countDocuments(q) : MongoosePayment.countDocuments(q),
  }
};
