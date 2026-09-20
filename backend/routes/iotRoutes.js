const express = require('express');
const router = express.Router();

const iotController = require('../controllers/iotController');

router.post('/dati-sensore', iotController.receiveSensorData);
router.get('/api/misurazioni', iotController.getMeasurements);
router.get('/api/debug/seed-measurements/:plantId', iotController.seedPlantMeasurements);

module.exports = router;
