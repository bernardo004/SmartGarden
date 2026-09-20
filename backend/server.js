require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./db/db');
const authRoutes = require('./routes/authRoutes');
const iotRoutes = require('./routes/iotRoutes');
const groupRoutes = require('./routes/groupRoutes');
const plantRoutes = require('./routes/plantRoutes');
const shopRoutes = require('./routes/shopRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const supportRoutes = require('./routes/supportRoutes');

const app = express();
const port = 3000;


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());


connectDB();


app.use('/', authRoutes);
app.use('/', iotRoutes);
app.use('/', groupRoutes);
app.use('/', plantRoutes);
app.use('/', shopRoutes);
app.use('/', notificationRoutes);
app.use('/', settingsRoutes);
app.use('/', supportRoutes);


app.listen(port, () => {
    console.log(`🚀 Node.js API Server running at http://localhost:${port}`);
});
