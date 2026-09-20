const { collections } = require('../db/db');

exports.receiveSensorData = async (req, res) => {
    try {
        const payload = req.body;

        if (!payload.ID_SE) {
            return res.status(400).json({ error: "Manca ID_SE nel payload." });
        }

        const plant = await collections.plantsCollection.findOne({
            hardwareSensorId: payload.ID_SE
        });

        if (!plant) {
            console.log(`⚠️ Ricevuti dati dal sensore ${payload.ID_SE}, ma non è associato a nessuna pianta!`);
            return res.status(404).json({ error: "Sensore non associato a nessuna pianta." });
        }

        payload.ID_PI = plant.plantId || plant._id.toString();

        if (!payload.data) {
            payload.data = new Date().toISOString();
        }

        await collections.misurazioniCollection.insertOne(payload);

        console.log(`✅ Dati salvati con successo per la pianta: ${plant.name}`);
        res.status(200).json({ message: "Dati ricevuti e salvati correttamente." });

    } catch (error) {
        console.error("❌ Errore durante il salvataggio dei dati del sensore:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
};

exports.getMeasurements = async (req, res) => {
    try {
        const recentData = await collections.misurazioniCollection.find({}).sort({ data: -1 }).limit(20).toArray();
        res.status(200).json(recentData);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
};

exports.seedPlantMeasurements = async (req, res) => {
    try {
        const plantId = req.params.plantId;
        const mockData = [];
        const now = new Date();

        const GIORNI_DA_GENERARE = 60;


        await collections.misurazioniCollection.deleteMany({ ID_PI: plantId });

        for (let day = GIORNI_DA_GENERARE; day >= 0; day--) {
            let luce = 0;


            for (let hour = 0; hour < 24; hour++) {


                const pastDate = new Date(now);
                pastDate.setDate(pastDate.getDate() - day);
                pastDate.setHours(hour, 0, 0, 0);


                if (hour >= 6 && hour <= 13) {
                    luce = luce + (Math.floor(Math.random() * 15000) + 5000);
                }
                else if (hour > 13 && hour <= 19) {
                    luce = luce - (Math.floor(Math.random() * 15000) + 2000);
                }
                else {
                    luce = 0;
                }

                if (luce < 0) {
                    luce = 0;
                }

                let finalLuce = luce === 0 ? Math.floor(Math.random() * 10) : luce;

                mockData.push({
                    ID_PI: plantId,
                    ID_SE: `sensore-simulato`,
                    data: pastDate.toISOString(),
                    umidita_terreno: Math.floor(Math.random() * 30) + 40,
                    umidita_ambiente: Math.floor(Math.random() * 20) + 50,
                    temperatura: Math.floor(Math.random() * 12) + 18,
                    esposizione_luce: finalLuce
                });
            }
        }

        await collections.misurazioniCollection.insertMany(mockData);

        res.status(200).send(`<h1 style="color: #27ae60; font-family: sans-serif;">✅ ${GIORNI_DA_GENERARE} giorni di misurazioni (circa ${mockData.length} record) generati con successo per la pianta: ${plantId}!</h1>`);

    } catch (error) {
        console.error(error);
        res.status(500).send("❌ Errore durante la generazione delle misurazioni.");
    }
};
