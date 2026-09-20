require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

const collections = {};

async function connectDB() {
    try {
        await client.connect();

        const dbPlantInfo = client.db("IoT-Garden-Monitor");
        const dbUserInfo = client.db("User-Info");
        const dbOrders = client.db("Orders");

        collections.misurazioniCollection = dbPlantInfo.collection("Misurazioni");
        collections.eventsCollection = dbPlantInfo.collection("Eventi");
        collections.storicoInnaffiamentiCollection = dbPlantInfo.collection("StoricoInnaffiamenti");
        collections.plantsCollection = dbPlantInfo.collection("Piante");

        collections.groupsCollection = dbUserInfo.collection("Gruppi");
        collections.notificationsCollection = dbUserInfo.collection("notifications");
        collections.userAccountsCollection = dbUserInfo.collection("userAccounts");
        collections.userProfilesCollection = dbUserInfo.collection("userProfiles");

        collections.orderCollection = dbOrders.collection("order");
        collections.stockCollection = dbOrders.collection("stock");

        console.log("🌱 Isolated DB Plug connected to MongoDB Atlas!");
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
}

module.exports = { connectDB, collections, client };
