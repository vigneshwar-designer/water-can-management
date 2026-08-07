const express = require('express');
const router = express.Router();
const localCustomerController = require('../controllers/localCustomerController');
const authMiddleware = require('../middlewares/auth');

router.get('/', authMiddleware, localCustomerController.getLocalCustomers);
router.get('/:id', authMiddleware, localCustomerController.getLocalCustomerById);

module.exports = router;
