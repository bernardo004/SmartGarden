const bcrypt = require('bcrypt');
const { collections } = require('../db/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 587, secure: false,
    auth: { user: 'pwmsmartgarden@gmail.com', pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
});

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await collections.userAccountsCollection.findOne({ userEmail: email });
        if (existingUser) return res.status(400).json({ error: "L'email è già registrata." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            username: username,
            userEmail: email,
            userPassword: hashedPassword,
            status: "offline",
            lastLogin: null,
            createdAt: new Date().toISOString()
        };

        await collections.userAccountsCollection.insertOne(newUser);
        console.log(`✔️ New user registered: ${username} (${email})`);
        res.status(201).json({ message: "Account creato con successo!" });
    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
};



exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await collections.userAccountsCollection.findOne({ userEmail: email });
        if (!user) {
            return res.status(401).json({ error: "Email o password errati." });
        }

        const isMatch = await bcrypt.compare(password, user.userPassword);
        if (!isMatch) {
            return res.status(401).json({ error: "Email o password errati." });
        }

		const result = await collections.userAccountsCollection.updateOne(
            { userEmail: email },
            { $set: { status: "online", lastLogin: new Date().toISOString(), lastActive: new Date().toISOString() } }
        );

        console.log(`[LOGIN] Richiesto per: ${email}`);
        console.log(`[LOGIN] Documenti modificati su MongoDB: ${result.modifiedCount}`);

        res.status(200).json({
            message: "Login effettuato",
            email: user.userEmail,
            username: user.username
        });

    } catch (error) {
        console.error("Errore durante il login:", error);
        res.status(500).json({ error: "Errore interno del server." });
    }
};

exports.setOffline = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`⚠️ [ATTENZIONE!] Angular ha appena chiamato setOffline per: ${email}`);

        if (!email) return res.status(400).send("Email mancante");

        await collections.userAccountsCollection.updateOne(
            { userEmail: email },
            { $set: { status: "offline", lastActive: new Date().toISOString() } }
        );
        res.status(200).send("Utente disconnesso");
    } catch (error) { res.status(500).send("Errore interno"); }
};

exports.setOnline = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).send("Email mancante");

        await collections.userAccountsCollection.updateOne(
            { userEmail: email },
            { $set: { status: "online", lastActive: new Date().toISOString() } }
        );
        res.status(200).send("Utente online");
    } catch (error) { res.status(500).send("Errore interno"); }
};

exports.heartbeat = async (req, res) => {
    try {
        const email = req.params.email;
        console.log(`💓 [HEARTBEAT] Ricevuto battito da: ${email}`);

        await collections.userAccountsCollection.updateOne(
            { userEmail: email },
            { $set: { status: "online", lastActive: new Date().toISOString() } }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Errore heartbeat" });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const email = req.params.email;
        const account = await collections.userAccountsCollection.findOne({ userEmail: email });
        const profile = await collections.userProfilesCollection.findOne({ userEmail: email });

        if (!account) return res.status(404).json({ error: "Utente non trovato" });

        let isActuallyOnline = false;
        if (account.status === 'online') {
            if (account.lastActive) {
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
                isActuallyOnline = new Date(account.lastActive) > fiveMinutesAgo;
            } else {
                isActuallyOnline = true;
            }
        }

        res.status(200).json({
            email: account.userEmail,
            username: profile && profile.username ? profile.username : account.username,
            status: isActuallyOnline ? 'online' : 'offline',
            avatar: profile ? profile.avatar : null,
            bio: profile && profile.bio ? profile.bio : ''
        });
    } catch (error) { res.status(500).json({ error: "Errore interno" }); }
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await collections.userAccountsCollection.findOne({ userEmail: email });
        if (!user) {
            console.log("Tentativo di reset per email non esistente:", email);
            return res.status(404).json({ error: "Email non trovata" });
        }

        const otp = crypto.randomInt(100000, 999999).toString();

        console.log("Tentativo invio email a:", email);

        await collections.userProfilesCollection.updateOne(
			{ userEmail: email },
			{ $set: { otp: otp, otpExpires: new Date(Date.now() + 5 * 60000) } },
			{ upsert: true }
		);

        await transporter.sendMail({
            from: '"SmartGarden" <pwmsmartgarden@gmail.com>',
            to: email,
            subject: 'Codice di recupero password',
            text: `Il tuo codice OTP è: ${otp}`
        });

        res.status(200).json({ message: "OTP inviato!" });
    } catch (error) {
        console.error("ERRORE CRITICO INVIO EMAIL:", error);
        res.status(500).json({ error: "Errore invio" });
    }
};


exports.verifyAndReset = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const user = await collections.userProfilesCollection.findOne({ userEmail: email });

    if (!user || user.otp !== otp || new Date() > user.otpExpires) {
        return res.status(400).json({ error: "OTP invalido o scaduto." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await collections.userAccountsCollection.updateOne(
        { userEmail: email },
        { $set: { userPassword: hashedPassword } }
    );

    await collections.userProfilesCollection.updateOne({ userEmail: email }, { $unset: { otp: "", otpExpires: "" } });

    res.status(200).json({ message: "Password aggiornata!" });
};
