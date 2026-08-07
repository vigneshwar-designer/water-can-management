const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/auth');

router.get('/daily', authMiddleware, reportController.getDailyReport);
router.get('/customers', authMiddleware, reportController.getCustomerReport);
router.get('/cans', authMiddleware, reportController.getCanReport);
router.get('/inventory', authMiddleware, reportController.getInventoryReport);

module.exports = router;
