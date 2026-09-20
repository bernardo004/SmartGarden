const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

router.post('/api/checkout', shopController.checkout);
router.get('/api/seed-stock', shopController.seedStock);
router.get('/api/products', shopController.getProducts);

module.exports = router;