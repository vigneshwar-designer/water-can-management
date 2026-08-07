require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Save PID on startup
const { cleanDuplicateProcesses } = require('./config/processManager');
cleanDuplicateProcesses(true);

const connectDB = require('./config/db');

// Import Seeding Helpers
const { seedDefaultAdmin } = require('./controllers/authController');
const { seedDefaultSettings } = require('./controllers/settingsController');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const customerRoutes = require('./routes/customerRoutes');
const localCustomerRoutes = require('./routes/localCustomerRoutes');
const canRoutes = require('./routes/canRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Base health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    dbMode: process.env.USE_JSON_DB === 'true' ? 'JSON-FALLBACK' : 'MONGODB',
    timestamp: new Date().toISOString()
  });
});

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/local-customers', localCustomerRoutes);
app.use('/api/cans', canRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

const DEFAULT_PORT = parseInt(process.env.PORT || '5000', 10);

// Helper to check if a port is in use
function checkPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true); // Port in use
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(false))
          .close();
      })
      .listen(port, '127.0.0.1');
  });
}

// Helper to get active frontend port
async function getFrontendPort() {
  const filePath = path.join(__dirname, 'data/frontend_port.txt');
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8').trim();
    }
  } catch (e) {}

  // Fallback to checking active ports
  const is5173InUse = await checkPortInUse(5173);
  if (is5173InUse) return '5173';
  const is5174InUse = await checkPortInUse(5174);
  if (is5174InUse) return '5174';
  return '5173';
}

// Initialize Database and Start Server
async function startServer() {
  // Connect to DB (will check if MongoDB URI is available, otherwise toggle process.env.USE_JSON_DB)
  await connectDB();

  // Run seed scripts
  await seedDefaultAdmin();
  await seedDefaultSettings();

  // Dynamically resolve port
  let port = DEFAULT_PORT;

  function tryListen() {
    const server = app.listen(port, async () => {
      // Save port to file
      try {
        fs.writeFileSync(path.join(__dirname, 'data/port.txt'), port.toString(), 'utf8');
      } catch (err) {
        console.error('Error writing port.txt:', err.message);
      }

      const frontendPort = await getFrontendPort();
      const dbStatus = process.env.USE_JSON_DB === 'true' ? 'Local JSON Fallback' : 'Connected';

      console.log('\n------------------------------------------------');
      console.log(`Backend running on http://localhost:${port}`);
      console.log(`Frontend running on http://localhost:${frontendPort}`);
      console.log(`MongoDB: ${dbStatus}`);
      console.log('------------------------------------------------\n');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${port} in use, scanning next port...`);
        port++;
        tryListen();
      } else {
        console.error('❌ Server startup error:', err.message);
        process.exit(1);
      }
    });
  }

  tryListen();
}

startServer();

