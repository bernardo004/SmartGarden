const { ObjectId } = require('mongodb');
const { collections } = require('../db/db');

exports.getUserGardens = async (req, res) => {
    try {
        const userEmail = req.params.email;

        const userGardens = await collections.groupsCollection.find({
            $or: [{ ownerEmail: userEmail }, { adminEmails: userEmail }, { memberEmails: userEmail }]
        }).toArray();

        const gardensWithCounts = await Promise.all(userGardens.map(async (garden) => {
            let pCount = 0;

            if (collections.plantsCollection) {
                pCount = await collections.plantsCollection.countDocuments({
                    groupId: garden._id.toString()
                });
            } else if (garden.plants) {
                pCount = garden.plants.length;
            }

            return {
                ...garden,
                plantCount: pCount
            };
        }));

        res.status(200).json(gardensWithCounts);
    } catch (error) {
        console.error("Errore fetch giardini:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
};

exports.getSingleGarden = async (req, res) => {
    try {
        const group = await collections.groupsCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!group) return res.status(404).json({ error: "Giardino non trovato nel database." });
        res.status(200).json(group);
    } catch (error) { res.status(500).json({ error: "Errore interno del server" }); }
};

exports.inviteToGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const { targetEmail, senderName, groupName } = req.body;
        const inviteNotification = {
            userEmail: targetEmail, title: 'Invito a collaborare', message: `<strong>${senderName}</strong> ti ha invitato a gestire il giardino "${groupName}".`,
            createdAt: new Date().toISOString(), icon: '🤝', iconColor: '#8e44ad', isRead: false, hasPrimaryAction: true, primaryText: 'Accetta', hasSecondaryAction: true, secondaryText: 'Rifiuta', type: 'group_invite', groupId: groupId
        };
        await collections.notificationsCollection.insertOne(inviteNotification);
        res.status(200).json({ message: "Invito inviato con successo!" });
    } catch (error) { res.status(500).json({ error: "Errore invio invito" }); }
};

exports.updateRole = async (req, res) => {
    try {
        const groupId = req.params.id;
        const { email, action } = req.body;

        if (action === 'promote') {
            await collections.groupsCollection.updateOne({ _id: new ObjectId(groupId) }, { $pull: { memberEmails: email }, $addToSet: { adminEmails: email } });
        } else if (action === 'demote') {
            await collections.groupsCollection.updateOne({ _id: new ObjectId(groupId) }, { $pull: { adminEmails: email }, $addToSet: { memberEmails: email } });
        }

        const group = await collections.groupsCollection.findOne({ _id: new ObjectId(groupId) });
        if (group) {
            const roleName = action === 'promote' ? 'Amministratore' : 'Membro';
            const iconStr = action === 'promote' ? '⭐' : '⬇️';
            const colorStr = action === 'promote' ? '#f57c00' : '#757575';
            const notifications = [
                { userEmail: email, title: 'Aggiornamento Ruolo', message: `Il tuo ruolo nel giardino <strong>${group.name}</strong> è ora: ${roleName}.`, createdAt: new Date().toISOString(), icon: iconStr, iconColor: colorStr, isRead: false, type: 'role_change', groupId: groupId },
                { userEmail: group.ownerEmail, title: 'Gestione Ruoli', message: `Il ruolo di <strong>${email}</strong> in ${group.name} è stato aggiornato a ${roleName}.`, createdAt: new Date().toISOString(), icon: '⚙️', iconColor: '#1976d2', isRead: false, type: 'role_change', groupId: groupId }
            ];
            const uniqueNotifs = notifications.filter(n => n.userEmail && n.userEmail !== '');
            await collections.notificationsCollection.insertMany(uniqueNotifs);
        }
        res.status(200).json({ message: "Ruolo aggiornato!" });
    } catch (error) { res.status(500).json({ error: "Errore aggiornamento ruolo" }); }
};

exports.kickMember = async (req, res) => {
    try {
        const groupId = req.params.id;
        const targetEmail = req.params.email;
        const group = await collections.groupsCollection.findOne({ _id: new ObjectId(groupId) });

        await collections.groupsCollection.updateOne({ _id: new ObjectId(groupId) }, { $pull: { adminEmails: targetEmail, memberEmails: targetEmail } });

        if (group) {
            const notifications = [
                { userEmail: targetEmail, title: 'Rimosso dal gruppo', message: `Sei stato rimosso dal giardino <strong>${group.name}</strong>. Non hai più accesso ai suoi dati.`, createdAt: new Date().toISOString(), icon: '🚪', iconColor: '#d32f2f', isRead: false, type: 'kicked', groupId: groupId },
                { userEmail: group.ownerEmail, title: 'Membro Rimosso', message: `<strong>${targetEmail}</strong> è stato rimosso da ${group.name}.`, createdAt: new Date().toISOString(), icon: '👤', iconColor: '#757575', isRead: false, type: 'member_removed', groupId: groupId }
            ];
            const uniqueNotifs = notifications.filter((n, index, self) => index === self.findIndex((t) => t.userEmail === n.userEmail));
            await collections.notificationsCollection.insertMany(uniqueNotifs);
        }
        res.status(200).json({ message: "Membro rimosso!" });
    } catch (error) { res.status(500).json({ error: "Errore rimozione membro" }); }
};

exports.getGroupMembers = async (req, res) => {
    try {
        const groupId = req.params.id;
        const group = await collections.groupsCollection.findOne({ _id: new ObjectId(groupId) });
        if (!group) return res.status(404).json({ error: "Giardino non trovato." });

        const allEmails = [
            group.ownerEmail,
            ...(group.adminEmails || []),
            ...(group.memberEmails || [])
        ].filter(email => email);

        const users = await collections.userAccountsCollection.find({
			userEmail: { $in: allEmails }
		}).toArray();

        const admins = [];
        const participants = [];

        users.forEach(user => {
            let role = 'Membro';
            if (user.email === group.ownerEmail) role = 'Creatore';
            else if ((group.adminEmails || []).includes(user.email)) role = 'Admin';

            const memberProfile = {
                id: user.email,
                name: user.name || user.email.split('@')[0],
                role: role,
                isOnline: user.status || false,
                imageUrl: user.imageUrl || null,
                biography: user.biography || ''
            };

            if (role === 'Creatore' || role === 'Admin') {
                admins.push(memberProfile);
            } else {
                participants.push(memberProfile);
            }
        });

        res.status(200).json({ admins, participants });
    } catch (error) {
        console.error("Errore fetch membri:", error);
        res.status(500).json({ error: "Errore interno durante il recupero dei membri" });
    }
};

exports.createGarden = async (req, res) => {
    try {
        const { name, description, ownerEmail } = req.body;

        if (!name || !ownerEmail) {
            return res.status(400).json({ error: "Nome e proprietario sono obbligatori." });
        }

        const newGarden = {
            name: name,
            description: description || "",
            ownerEmail: ownerEmail,
            adminEmails: [],
            memberEmails: [],
            plants: [],
            createdAt: new Date().toISOString()
        };

        const result = await collections.groupsCollection.insertOne(newGarden);
        console.log(`🌱 Nuovo giardino creato: ${name} da ${ownerEmail}`);
        res.status(201).json({ message: "Giardino creato con successo", gardenId: result.insertedId });

    } catch (error) {
        console.error("❌ Errore creazione giardino:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const groupId = req.params.id;

        const bgPosY = req.body.bgPosY ? parseInt(req.body.bgPosY, 10) : undefined;
        const bgZoom = req.body.bgZoom ? parseInt(req.body.bgZoom, 10) : undefined;
        const name = req.body.name;
        const description = req.body.description;

        const updateFields = {};

        if (bgPosY !== undefined) updateFields.bgPosY = bgPosY;
        if (bgZoom !== undefined) updateFields.bgZoom = bgZoom;
        if (name) updateFields.name = name;

        if (description !== undefined) {
            updateFields.description = description.trim();
        }

        if (req.file) {
            const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            updateFields.imageUrl = base64Image;
        }
        else if (req.body.imageUrl) {
            updateFields.imageUrl = req.body.imageUrl;
        }

        const result = await collections.groupsCollection.updateOne(
            { _id: new ObjectId(groupId) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Giardino non trovato" });
        }

        res.status(200).json({ message: "Giardino aggiornato con successo!" });
    } catch (error) {
        console.error("Errore aggiornamento giardino:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
};

exports.leaveGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const { email } = req.body;
        const group = await collections.groupsCollection.findOne({ _id: new ObjectId(groupId) });

        if (!group) return res.status(404).json({ error: "Gruppo non trovato." });
        if (group.ownerEmail === email) {
            return res.status(400).json({ error: "Il creatore non può abbandonare il gruppo." });
        }

        await collections.groupsCollection.updateOne(
            { _id: new ObjectId(groupId) },
            { $pull: { adminEmails: email, memberEmails: email } }
        );

        if (collections.notificationsCollection) {
            const notification = {
                userEmail: group.ownerEmail,
                title: 'Un membro ha lasciato il gruppo',
                message: `L'utente <strong>${email}</strong> ha abbandonato volontariamente il giardino "${group.name}".`,
                createdAt: new Date().toISOString(),
                icon: '🏃‍♂️', iconColor: '#e67e22', isRead: false, type: 'member_left', groupId: groupId
            };
            await collections.notificationsCollection.insertOne(notification);
        }

        res.status(200).json({ message: "Hai lasciato il gruppo con successo." });
    } catch (error) {
        console.error("❌ ERRORE LEAVE GROUP:", error);
        res.status(500).json({ error: "Errore durante l'abbandono del gruppo" });
    }
};

exports.transferOwnership = async (req, res) => {
    try {
        const groupId = req.params.id;
        const { newOwnerEmail, currentOwnerEmail } = req.body;

        const group = await collections.groupsCollection.findOne({ _id: new ObjectId(groupId) });
        if (!group) return res.status(404).json({ error: "Gruppo non trovato." });

        if (group.ownerEmail !== currentOwnerEmail) {
            return res.status(403).json({ error: "Solo l'attuale creatore può trasferire la proprietà." });
        }


        await collections.groupsCollection.updateOne(
            { _id: new ObjectId(groupId) },
            {
                $set: { ownerEmail: newOwnerEmail },
                $pull: { adminEmails: newOwnerEmail, memberEmails: newOwnerEmail }
            }
        );

        await collections.groupsCollection.updateOne(
            { _id: new ObjectId(groupId) },
            {
                $addToSet: { adminEmails: currentOwnerEmail }
            }
        );

        if (collections.notificationsCollection) {
            const notifications = [
                { userEmail: newOwnerEmail, title: '👑 Nuovo Creatore', message: `Sei diventato il nuovo Creatore del giardino <strong>${group.name}</strong>.`, createdAt: new Date().toISOString(), icon: '👑', iconColor: '#f1c40f', isRead: false, type: 'ownership_transferred', groupId: groupId },
                { userEmail: currentOwnerEmail, title: 'Proprietà trasferita', message: `Hai trasferito la proprietà di <strong>${group.name}</strong> a ${newOwnerEmail}. Ora sei un Amministratore.`, createdAt: new Date().toISOString(), icon: '🔄', iconColor: '#3498db', isRead: false, type: 'ownership_transferred', groupId: groupId }
            ];
            await collections.notificationsCollection.insertMany(notifications);
        }

        res.status(200).json({ message: "Proprietà trasferita con successo!" });
    } catch (error) {
        console.error("❌ ERRORE TRANSFER OWNERSHIP:", error);
        res.status(500).json({ error: "Errore trasferimento proprietà" });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const { email } = req.body;

        const group = await collections.groupsCollection.findOne({ _id: new ObjectId(groupId) });
        if (!group) return res.status(404).json({ error: "Gruppo non trovato." });
        if (group.ownerEmail !== email) return res.status(403).json({ error: "Solo il creatore può eliminare il gruppo." });

        if (collections.plantsCollection) {
            await collections.plantsCollection.deleteMany({ groupId: groupId });
        }

        if (collections.misurazioniCollection) {
            await collections.misurazioniCollection.deleteMany({ groupId: groupId });
        }

        if (collections.storicoInnaffiamentiCollection) {
            await collections.storicoInnaffiamentiCollection.deleteMany({ groupId: groupId });
        }

        await collections.groupsCollection.deleteOne({ _id: new ObjectId(groupId) });

        if (collections.notificationsCollection) {
            const allMembers = [...(group.adminEmails || []), ...(group.memberEmails || [])];
            if (allMembers.length > 0) {
                const notifications = allMembers.map(memberEmail => ({
                    userEmail: memberEmail,
                    title: 'Giardino Eliminato',
                    message: `Il giardino <strong>${group.name}</strong> è stato eliminato definitivamente dal creatore. Tutti i dati sono andati persi.`,
                    createdAt: new Date().toISOString(),
                    icon: '💥', iconColor: '#d32f2f', isRead: false, type: 'group_deleted'
                }));
                await collections.notificationsCollection.insertMany(notifications);
            }
        }

        res.status(200).json({ message: "Giardino e dati associati eliminati." });
    } catch (error) {
        console.error("❌ ERRORE CRITICO ELIMINAZIONE GIARDINO:", error);
        res.status(500).json({ error: "Errore interno del server durante l'eliminazione" });
    }
};
