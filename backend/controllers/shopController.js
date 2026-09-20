const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { collections } = require('../db/db');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 587, secure: false,
    auth: { user: 'pwmsmartgarden@gmail.com', pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
});

exports.checkout = async (req, res) => {
    try {
        const { email, items } = req.body;
        const orderId = "ORD-" + crypto.randomBytes(4).toString('hex').toUpperCase();
        
        let allAvailable = true;
        for (let item of items) {
            const stockItem = await collections.stockCollection.findOne({ product: item.product });
            if (!stockItem || stockItem.quantity < item.quantity) allAvailable = false; 
        }

        const newOrder = { orderId, userId: email, items, status: "pending", available: allAvailable, date: new Date().toISOString() };
        await collections.orderCollection.insertOne(newOrder);

        const itemsListHTML = items.map(i => `<li>${i.quantity}x ${i.product}</li>`).join('');
        const customerMailOptions = {
            from: 'SmartGarden pwmsmartgarden@gmail.com', to: email, subject: `Ordine Ricevuto: ${orderId}`,
            html: `<h2>Grazie per il tuo ordine!</h2><ul>${itemsListHTML}</ul><p>Disponibilità: ${allAvailable ? 'Sì' : 'No (In riordino)'}</p>`
        };
        const companyMailOptions = {
            from: 'SmartGarden System pwmsmartgarden@gmail.com', to: 'pwmsmartgarden@gmail.com', subject: `NUOVO ORDINE DA APPROVARE: ${orderId}`,
            html: `<h2>Nuovo Ordine</h2><p><strong>Cliente:</strong> ${email}</p><ul>${itemsListHTML}</ul>`
        };

        transporter.sendMail(customerMailOptions).catch(err => console.log("Failed customer email"));
        transporter.sendMail(companyMailOptions).catch(err => console.log("Failed company email"));

        res.status(200).json({ message: "Ordine creato con successo!", orderId: orderId });
    } catch (error) { res.status(500).json({ error: "Errore checkout" }); }
};

exports.seedStock = async (req, res) => {
    try {
        await collections.stockCollection.deleteMany({}); 
        const shopItems = [
            { product: 'SmartGarden Atmos', price: 24.99, image: 'assets/img/shop/temperaturaumidita.png', description: 'Monitoraggio climatico ultra-preciso.', manualUrl: 'assets/manual.pdf', isRecommended: true, quantity: 50 },
            { product: 'SmartGarden TerraMaster Pro', price: 32.99, image: 'assets/img/shop/sondaterreno.png', description: 'Sonda capacitiva in oro.', manualUrl: 'assets/manual.pdf', isRecommended: true, quantity: 30 },
            { product: 'SmartGarden Helios Dome', price: 19.99, image: 'assets/img/shop/crepuscolare.png', description: 'Tracking solare.', manualUrl: 'assets/manual.pdf', isRecommended: true, quantity: 15 },
            { product: 'DHT11', price: 4.50, image: 'assets/img/shop/DHT11.png', description: 'Modulo digitale.', manualUrl: 'assets/manual.pdf', isRecommended: false, quantity: 100 },
            { product: 'LDR', price: 3.20, image: 'assets/img/shop/LDR.png', description: 'Sensore di luce.', manualUrl: 'assets/manual.pdf', isRecommended: false, quantity: 200 },
            { product: 'HL69', price: 3.90, image: 'assets/img/shop/HL69.png', description: 'Sonda igrometrica.', manualUrl: 'assets/manual.pdf', isRecommended: false, quantity: 75 }
        ];
        await collections.stockCollection.insertMany(shopItems);
        res.status(200).send(`✅ Database ricaricato!`);
    } catch (error) { res.status(500).send("❌ Errore stock."); }
};

exports.getProducts = async (req, res) => {
    try {
        const products = await collections.stockCollection.find({ quantity: { $gt: 0 } }).toArray();
        res.status(200).json(products);
    } catch (error) { res.status(500).json({ error: "Errore interno del server" }); }
};