const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/auth');

router.get('/', authMiddleware, transactionController.getTransactions);
router.post('/deliver/fixed', authMiddleware, transactionController.deliverFixed);
router.post('/deliver/local', authMiddleware, transactionController.deliverLocal);
router.post('/return', authMiddleware, transactionController.returnCan);

module.exports = router;
