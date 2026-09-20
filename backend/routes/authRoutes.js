const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');


router.post('/api/register', authController.register);
router.post('/api/login', authController.login);
router.post('/api/user/offline', authController.setOffline);
router.post('/api/user/online', authController.setOnline);
router.put('/api/user/:email/heartbeat', authController.heartbeat);
router.get('/api/user/:email', authController.getUserProfile);
router.post('/api/auth/request-password-reset', authController.requestPasswordReset);
router.post('/api/auth/verify-and-reset', authController.verifyAndReset);

module.exports = router;
