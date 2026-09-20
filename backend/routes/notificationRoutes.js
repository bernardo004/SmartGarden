const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/api/seed-notifications/:email', notificationController.seedNotifications);
router.get('/api/notifications/:email', notificationController.getNotifications);
router.put('/api/notifications/single/:id/read', notificationController.markSingleRead);
router.put('/api/notifications/:email/read-all', notificationController.markAllRead);
router.post('/api/notifications/action', notificationController.handleAction);
router.delete('/api/notifications/single/:id', notificationController.deleteSingleNotification);
router.delete('/api/notifications/:email/delete-all', notificationController.deleteAllNotifications);
router.get('/api/unread-count/:email', notificationController.getUnreadCount);

module.exports = router;