const { ObjectId } = require('mongodb');
const { collections } = require('../db/db');

exports.seedNotifications = async (req, res) => {
    try {
        const userEmail = req.params.email;
        await collections.notificationsCollection.deleteMany({ userEmail: userEmail }); 
        const now = new Date();
        const sampleNotifications = [
            { userEmail: userEmail, title: 'Pomodori Pachino: Irrigazione Necessaria', message: 'L\'umidità del terreno è scesa.', createdAt: new Date(now.getTime() - 10 * 60000).toISOString(), icon: '💧', iconColor: '#3498db', isRead: false, hasPrimaryAction: true, primaryText: 'Vai alla pianta', hasSecondaryAction: false },
            { userEmail: userEmail, title: 'Invito a collaborare', message: 'Ti hanno invitato al giardino.', createdAt: new Date(now.getTime() - 60 * 60000).toISOString(), icon: '🤝', iconColor: '#8e44ad', isRead: false, hasPrimaryAction: true, primaryText: 'Accetta', hasSecondaryAction: true, secondaryText: 'Rifiuta', type: 'group_invite', groupId: 'ID_TEST' }
        ];
        await collections.notificationsCollection.insertMany(sampleNotifications);
        res.status(200).send(`✅ Notifiche generate per ${userEmail}!`);
    } catch (error) { res.status(500).send("❌ Errore generazione notifiche."); }
};

exports.getNotifications = async (req, res) => {
    try {
        const notifs = await collections.notificationsCollection.find({ userEmail: req.params.email }).toArray();
        res.status(200).json(notifs);
    } catch (error) { res.status(500).json({ error: "Errore interno" }); }
};

exports.markSingleRead = async (req, res) => {
    try {
        await collections.notificationsCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { isRead: true } });
        res.status(200).send("Notifica aggiornata");
    } catch (error) { res.status(500).send("Errore aggiornamento"); }
};

exports.markAllRead = async (req, res) => {
    try {
        await collections.notificationsCollection.updateMany({ userEmail: req.params.email, isRead: false }, { $set: { isRead: true } });
        res.status(200).json({ message: "Tutte le notifiche lette" });
    } catch (error) { res.status(500).json({ error: "Errore aggiornamento" }); }
};

exports.handleAction = async (req, res) => {
    try {
        const { notificationId, action, userEmail, groupId } = req.body;
        if (action === 'accept') {
            await collections.groupsCollection.updateOne({ _id: new ObjectId(groupId) }, { $addToSet: { memberEmails: userEmail } });
            const group = await collections.groupsCollection.findOne({ _id: new ObjectId(groupId) });
            if (group) {
                const allEmails = [group.ownerEmail, ...(group.adminEmails || []), ...(group.memberEmails || [])];
                const notifyEmails = [...new Set(allEmails)].filter(e => e !== userEmail);
                const newMemberNotifications = notifyEmails.map(email => ({
                    userEmail: email, title: 'Nuovo Membro!', message: `<strong>${userEmail.split('@')[0]}</strong> si è unito!`,
                    createdAt: new Date().toISOString(), icon: '👋', iconColor: '#8e44ad', isRead: false, type: 'new_member', groupId: groupId
                }));
                if (newMemberNotifications.length > 0) await collections.notificationsCollection.insertMany(newMemberNotifications);
            }
        }
        const nuovoMessaggio = action === 'accept' ? 'Hai accettato l\'invito al gruppo.' : 'Hai rifiutato l\'invito.';
        await collections.notificationsCollection.updateOne(
            { _id: new ObjectId(notificationId) },
            { $set: { isRead: true, hasPrimaryAction: false, hasSecondaryAction: false, message: nuovoMessaggio } }
        );
        res.status(200).json({ success: true, message: nuovoMessaggio });
    } catch (error) { res.status(500).json({ error: "Errore interno del server" }); }
};

exports.deleteSingleNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await collections.notificationsCollection.deleteOne({ 
            _id: new ObjectId(id) 
        });

        if (result.deletedCount === 1) {
            res.status(200).json({ message: "Notifica eliminata con successo." });
        } else {
            res.status(404).json({ error: "Notifica non trovata." });
        }
    } catch (error) {
        console.error("Errore durante l'eliminazione della notifica:", error);
        res.status(500).json({ error: "Errore interno del server." });
    }
};

exports.deleteAllNotifications = async (req, res) => {
    try {
        const { email } = req.params;

        const result = await collections.notificationsCollection.deleteMany({ 
            userEmail: email
        });

        res.status(200).json({ 
            message: "Tutte le notifiche eliminate.",
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        console.error("Errore durante lo svuotamento delle notifiche:", error);
        res.status(500).json({ error: "Errore interno del server." });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const email = req.params.email;
        
        const count = await collections.notificationsCollection.countDocuments({ 
            userEmail: email, 
            isRead: false 
        });
        
        res.status(200).json({ count });
    } catch (error) {
        console.error("Errore nel conteggio notifiche:", error);
        res.status(500).json({ error: "Errore nel conteggio" });
    }
};