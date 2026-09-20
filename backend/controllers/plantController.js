const { ObjectId } = require('mongodb');
const { collections } = require('../db/db');

exports.getGroupPlants = async (req, res) => {
    try {
        const groupId = req.params.groupId || req.params.id;
        const groupPlants = await collections.plantsCollection.find({
            $or: [{ groupId: groupId }, { ID_GR: groupId }]
        }).toArray();

        for (let plant of groupPlants) {
            const lastSync = await collections.misurazioniCollection.find({ ID_PI: plant.plantId }).sort({ data: -1 }).limit(1).toArray();
            if (lastSync.length > 0) {
                plant.lastSyncDate = lastSync[0].data;
                const keys = Object.keys(lastSync[0]);
                const sensorKeys = keys.filter(k => !['_id', 'ID_PI', 'ID_SE', 'data'].includes(k));
                plant.sensorsCount = sensorKeys.length;
            } else {
                plant.lastSyncDate = null;
                plant.sensorsCount = 0;
            }
        }
        res.status(200).json(groupPlants);
    } catch (error) { res.status(500).json({ error: "Errore interno del server" }); }
};

exports.addPlant = async (req, res) => {
    try {
        const groupId = req.params.id;
        const { name, description } = req.body;
        const newPlant = {
            plantId: `pianta-custom-${Date.now()}`, name: name, description: description || "Nuova pianta aggiunta",
            notes: 'Aggiunto di recente', imageUrl: 'assets/img/plants/default.jpeg', groupId: groupId
        };

        await collections.plantsCollection.insertOne(newPlant);
    		await collections.groupsCollection.updateOne({ _id: new ObjectId(groupId) },{ $push: { plants: newPlant.plantId } });

        const group = await collections.groupsCollection.findOne({ _id: new ObjectId(groupId) });
        if (group) {
            const allEmails = [group.ownerEmail, ...(group.adminEmails || []), ...(group.memberEmails || [])];
            const uniqueEmails = [...new Set(allEmails)];
            const notifications = uniqueEmails.map(email => ({
                userEmail: email, title: 'Nuova Pianta!', message: `È stata aggiunta una nuova pianta: <strong>${name}</strong> in ${group.name}.`,
                createdAt: new Date().toISOString(), icon: '🌱', iconColor: '#4caf50', isRead: false, type: 'plant_added', groupId: groupId
            }));
            if (notifications.length > 0) await collections.notificationsCollection.insertMany(notifications);
        }
        res.status(200).json({ message: "Pianta aggiunta con successo!", plant: newPlant });
    } catch (error) { res.status(500).json({ error: "Errore interno del server" }); }
};

exports.getPlantProfile = async (req, res) => {
    try {
        const plantId = req.params.plantId;
        const plant = await collections.plantsCollection.findOne({ plantId: plantId });
        if (!plant) return res.status(404).json({ error: "Pianta non trovata" });
        const events = await collections.eventsCollection.find({ plantId: plantId }).sort({ createdAt: -1 }).limit(5).toArray();
        res.status(200).json({ ...plant, events: events });
    } catch (error) { res.status(500).json({ error: "Errore caricamento pianta" }); }
};

exports.updatePlant = async (req, res) => {
    try {
        const updateData = req.body;
        const plantId = req.params.plantId;

        if (updateData.hardwareSensorId) {
            const existingPlant = await collections.plantsCollection.findOne({
                hardwareSensorId: updateData.hardwareSensorId,
                plantId: { $ne: plantId }
            });

            if (existingPlant) {
                return res.status(400).json({ error: "Questo sensore è già associato a un'altra pianta!" });
            }
        }

        if (updateData.hardwareSensorId === "") {
            updateData.hardwareSensorId = null;
        }

        await collections.plantsCollection.updateOne(
            { plantId: plantId },
            { $set: updateData }
        );

        res.status(200).json({ message: "Pianta aggiornata!" });
    } catch (error) {
        res.status(500).json({ error: "Errore aggiornamento" });
    }
};

exports.logPlantEvent = async (req, res) => {
    try {
        const plantId = req.params.plantId;
        const { userEmail, userName, icon, title, meta, type, waterAmount } = req.body;

        const plant = await collections.plantsCollection.findOne({ plantId: plantId });
        if (!plant) return res.status(404).json({ error: "Pianta non trovata" });

        if (type === 'water' && waterAmount) {
            await collections.storicoInnaffiamentiCollection.insertOne({ ID_PI: plantId, mlAcqua: parseInt(waterAmount), data: new Date().toISOString() });
        }

        const newEvent = { plantId: plantId, icon: icon, title: title, meta: meta, type: type, createdAt: new Date().toISOString() };
        await collections.eventsCollection.insertOne(newEvent);

        const group = await collections.groupsCollection.findOne({ _id: new ObjectId(plant.groupId) });
        if (group) {
            const allEmails = [group.ownerEmail, ...(group.adminEmails || []), ...(group.memberEmails || [])];
            const notifyEmails = [...new Set(allEmails)].filter(e => e !== userEmail);
            let notifTitle = 'Pianta Aggiornata'; let notifColor = '#3498db';
            if (type === 'water') { notifTitle = 'Pianta Innaffiata'; notifColor = '#3498db'; }
            if (type === 'status') { notifTitle = 'Stato Pianta Modificato'; notifColor = '#f39c12'; }
            if (type === 'description') { notifTitle = 'Dettagli Aggiornati'; notifColor = '#8e44ad'; }

            const notifications = notifyEmails.map(email => ({
                userEmail: email, title: notifTitle, message: `<strong>${userName}</strong> ha aggiornato ${plant.name}: ${title}`,
                createdAt: new Date().toISOString(), icon: icon, iconColor: notifColor, isRead: false, type: 'plant_event', groupId: plant.groupId
            }));
            if (notifications.length > 0) await collections.notificationsCollection.insertMany(notifications);
        }
        res.status(200).json(newEvent);
    } catch (error) { res.status(500).json({ error: "Errore evento" }); }
};

exports.deletePlant = async (req, res) => {
    try {
        const plantId = req.params.plantId;
        const { userEmail, userName } = req.body;

        const plant = await collections.plantsCollection.findOne({ plantId: plantId });
        if (!plant) return res.status(404).json({ error: "Pianta non trovata" });

        const deleteResult = await collections.plantsCollection.deleteOne({ plantId: plantId });
        if (deleteResult.deletedCount === 1) {
            await collections.eventsCollection.deleteMany({ plantId: plantId });
            await collections.storicoInnaffiamentiCollection.deleteMany({ ID_PI: plantId });

			if (plant.groupId) {
                await collections.groupsCollection.updateOne(
                    { _id: new ObjectId(plant.groupId) },
                    { $pull: { plants: plantId } }
                );
            }

            const group = await collections.groupsCollection.findOne({ _id: new ObjectId(plant.groupId) });
            if (group) {
                const allEmails = [group.ownerEmail, ...(group.adminEmails || []), ...(group.memberEmails || [])];
                const notifyEmails = [...new Set(allEmails)].filter(e => e !== userEmail);
                const notifications = notifyEmails.map(email => ({
                    userEmail: email, title: 'Pianta Rimossa', message: `<strong>${userName}</strong> ha rimosso la pianta <strong>${plant.name}</strong> dal giardino.`,
                    createdAt: new Date().toISOString(), icon: '🗑️', iconColor: '#e74c3c', isRead: false, type: 'plant_removed', groupId: plant.groupId
                }));
                if (notifications.length > 0) await collections.notificationsCollection.insertMany(notifications);
            }
            res.status(200).json({ success: true });
        }
    } catch (error) { res.status(500).json({ error: "Errore eliminazione" }); }
};

exports.getPlantMeasurements = async (req, res) => {
    try {
        const misurazioni = await collections.misurazioniCollection.find({ ID_PI: req.params.plantId }).sort({ data: -1 }).toArray();
        res.status(200).json(misurazioni.reverse());
    } catch (error) { res.status(500).json({ error: "Errore interno del server" }); }
};
