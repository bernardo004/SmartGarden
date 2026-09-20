const bcrypt = require('bcrypt');
const { collections } = require('../db/db');

exports.updateSettings = async (req, res) => {
    try {
        const email = req.params.email;
        const updates = { ...req.body };

        delete updates._id;

        await collections.userProfilesCollection.updateOne(
            { userEmail: email }, 
            { $set: updates }
        );
        
        if (updates.username) {
            await collections.userAccountsCollection.updateOne(
                { userEmail: email }, 
                { $set: { username: updates.username } }
            );
        }
        res.status(200).json({ message: "Impostazioni salvate!" });
    } catch (error) { 
        console.error("Errore salvataggio MongoDB:", error);
        res.status(500).json({ error: "Errore salvataggio" }); 
    }
};

exports.getSettings = async (req, res) => {
    try {
        const email = req.params.email;
        let profile = await collections.userProfilesCollection.findOne({ userEmail: email });
        if (!profile) {
            const userAccount = await collections.userAccountsCollection.findOne({ userEmail: email });
            profile = {
                userEmail: email, username: userAccount ? userAccount.username : 'Utente', bio: '', gender: 'Non specificato',
                avatar: { url: '', zoom: 0, posY: 50 }, prefs: { tempUnit: 'C', language: 'it', emailNotifs: true, pushNotifs: true }
            };
            await collections.userProfilesCollection.insertOne(profile);
        }
        res.status(200).json(profile);
    } catch (error) { res.status(500).json({ error: "Errore caricamento impostazioni" }); }
};

exports.changePassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10); 
        await collections.userAccountsCollection.updateOne({ userEmail: email }, { $set: { userPassword: hashedPassword } });
        res.status(200).json({ message: "Password aggiornata!" });
    } catch (error) { res.status(500).json({ error: "Errore aggiornamento password" }); }
};

exports.deleteAccount = async (req, res) => {
    try {
        const email = req.params.email;

        const ownedGardens = await collections.groupsCollection.find({ ownerEmail: email }).toArray();
        
        if (ownedGardens.length > 0) {
            return res.status(400).json({ 
                error: "Sei il Creatore di uno o più giardini. Prima di eliminare l'account, devi eliminare i tuoi giardini o trasferirne la proprietà a un altro membro." 
            });
        }

        await collections.groupsCollection.updateMany(
            {},
            { 
                $pull: { 
                    adminEmails: email, 
                    memberEmails: email 
                } 
            }
        );

        if (collections.notificationsCollection) {
            await collections.notificationsCollection.deleteMany({ userEmail: email });
        }

        await collections.userAccountsCollection.deleteOne({ userEmail: email });
        await collections.userProfilesCollection.deleteOne({ userEmail: email });

        res.status(200).json({ message: "Account e dati associati eliminati con successo." });
        
    } catch (error) { 
        console.error("Errore eliminazione account:", error);
        res.status(500).json({ error: "Errore interno del server durante l'eliminazione." }); 
    }
};