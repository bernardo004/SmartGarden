const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.put('/api/settings/:email', settingsController.updateSettings);
router.get('/api/settings/:email', settingsController.getSettings);
router.put('/api/settings/security/password', settingsController.changePassword);
router.delete('/api/settings/account/:email', settingsController.deleteAccount);

module.exports = router;