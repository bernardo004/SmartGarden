const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 587, secure: false,
    auth: { user: 'pwmsmartgarden@gmail.com', pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
});

exports.sendSupportRequest = async (req, res) => {
    try {
        const { username, email, titolo, descrizione } = req.body;
        const companyMailOptions = {
            from: 'SmartGarden Support <pwmsmartgarden@gmail.com>', to: 'pwmsmartgarden@gmail.com', replyTo: email, 
            subject: `⚠️ NUOVA RICHIESTA AIUTO: ${titolo}`,
            html: `<h2>Nuova Richiesta</h2><p><strong>Utente:</strong> ${username}</p><p><strong>Email:</strong> ${email}</p><p>${descrizione}</p>`
        };
        const customerMailOptions = {
            from: 'SmartGarden Support <pwmsmartgarden@gmail.com>', to: email, 
            subject: `Ricevuto: ${titolo}`,
            html: `<h2>Ciao ${username},</h2><p>Abbiamo ricevuto la tua richiesta: "${titolo}". Ti risponderemo presto.</p>`
        };

        await transporter.sendMail(companyMailOptions);
        await transporter.sendMail(customerMailOptions);
        res.status(200).json({ message: "Richiesta inviata con successo!" });
    } catch (error) { res.status(500).json({ error: "Errore invio supporto" }); }
};