const express = require('express');
const router = express.Router();
const canController = require('../controllers/canController');
const authMiddleware = require('../middlewares/auth');

router.get('/', authMiddleware, canController.getCans);
router.get('/info/:canId', authMiddleware, canController.getCanByCanId);
router.get('/history/:canId', authMiddleware, canController.getCanHistory);
router.post('/', authMiddleware, canController.createCan);
router.post('/bulk', authMiddleware, canController.bulkGenerateCans);
router.put('/:id', authMiddleware, canController.updateCan);

module.exports = router;
