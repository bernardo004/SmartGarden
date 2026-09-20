const express = require('express');
const router = express.Router();

const plantController = require('../controllers/plantController');


router.get('/api/group/:groupId/plants', plantController.getGroupPlants);
router.post('/api/group/:id/plants', plantController.addPlant);
router.get('/api/plants/:plantId', plantController.getPlantProfile);
router.put('/api/plants/:plantId', plantController.updatePlant);
router.post('/api/plants/:plantId/events', plantController.logPlantEvent);
router.delete('/api/plants/:plantId', plantController.deletePlant);
router.get('/api/plants/:plantId/misurazioni', plantController.getPlantMeasurements);

module.exports = router;
