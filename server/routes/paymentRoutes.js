const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/auth');

router.get('/', authMiddleware, paymentController.getPayments);
router.post('/', authMiddleware, paymentController.collectPayment);

module.exports = router;
