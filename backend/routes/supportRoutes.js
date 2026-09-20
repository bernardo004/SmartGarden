const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');

router.post('/api/support', supportController.sendSupportRequest);

module.exports = router;