const express = require('express');
const router = express.Router();
const { collections } = require('../db/db');
const multer = require('multer');

const groupController = require('../controllers/groupController');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/api/user-gardens/:email', groupController.getUserGardens);
router.get('/api/group/:id', groupController.getSingleGarden);
router.post('/api/group/:id/invite', groupController.inviteToGroup);
router.put('/api/group/:id/role', groupController.updateRole);
router.delete('/api/group/:id/member/:email', groupController.kickMember);
router.get('/:id/members', groupController.getGroupMembers);
router.post('/api/user-gardens/create', groupController.createGarden);
router.put('/api/group/:id', upload.single('image'), groupController.updateGroup);
router.post('/api/group/:id/leave', groupController.leaveGroup);
router.put('/api/group/:id/transfer-ownership', groupController.transferOwnership);
router.delete('/api/group/:id', groupController.deleteGroup);

module.exports = router;
