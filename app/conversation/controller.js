const db = require('../../database/database');

const getOrCreateConversation = async (req, res) => {
    const id_customer = req.user.id; // Ambil ID customer dari token pengguna yang diautentikasi

    console.log("ID Customer:", id_customer); // Log ID customer untuk memastikan

    // Cek apakah percakapan sudah ada
    db.query(
        'SELECT * FROM Conversations WHERE ID_Customer = ?',
        [id_customer],
        (err, results) => {
            if (err) {
                console.error("Kesalahan saat mengambil percakapan:", err);
                return res.status(500).json({ message: 'Kesalahan server.' });
            }

            console.log("Hasil query percakapan:", results); // Log hasil query untuk debug

            if (results.length > 0) {
                // Percakapan sudah ada, kirim kembali ID percakapan
                console.log("Percakapan sudah ada, ID_Conversation:", results[0].ID_Conversation);
                return res.status(200).json({ conversationId: results[0].ID_Conversation });
            }

            // Jika belum ada percakapan, buat percakapan baru
            db.query(
                'INSERT INTO Conversations (ID_Customer, Last_Message) VALUES (?, ?)',
                [id_customer, ''],
                (insertErr, insertResult) => {
                    if (insertErr) {
                        console.error("Kesalahan saat membuat percakapan:", insertErr);
                        return res.status(500).json({ message: 'Gagal membuat percakapan.' });
                    }

                    console.log("Percakapan baru berhasil dibuat, ID_Conversation:", insertResult.insertId);
                    return res.status(201).json({ conversationId: insertResult.insertId });
                }
            );
        }
    );
};



const addMessageToConversation = async (req, res) => {
    const { messageContent } = req.body;
    const senderId = req.user.id; // Ambil ID pengguna yang mengirim pesan

    console.log("Sender ID:", senderId); // Log untuk memastikan senderId
    console.log("Message Content:", messageContent); // Log untuk memastikan isi pesan

    // Pertama, cari atau buat percakapan untuk senderId
    db.query(
        'SELECT ID_Conversation FROM Conversations WHERE ID_Customer = ?',
        [senderId],
        (err, results) => {
            if (err) {
                console.error("Kesalahan saat mencari percakapan:", err);
                return res.status(500).json({ message: 'Kesalahan server saat mencari percakapan.' });
            }

            console.log("Hasil Pencarian Conversation:", results); // Log hasil pencarian percakapan

            let conversationId;
            if (results.length > 0) {
                // Percakapan sudah ada, ambil ID_Conversation
                conversationId = results[0].ID_Conversation;
                console.log("Percakapan ditemukan, ID_Conversation:", conversationId);
            } else {
                // Jika belum ada percakapan, buat percakapan baru
                db.query(
                    'INSERT INTO Conversations (ID_Customer, Last_Message) VALUES (?, ?)',
                    [senderId, ''],
                    (insertErr, insertResult) => {
                        if (insertErr) {
                            console.error("Kesalahan saat membuat percakapan:", insertErr);
                            return res.status(500).json({ message: 'Gagal membuat percakapan baru.' });
                        }
                        conversationId = insertResult.insertId;
                        console.log("Percakapan baru dibuat, ID_Conversation:", conversationId);
                    }
                );
            }

            // Pastikan conversationId terisi sebelum lanjut ke penyimpanan pesan
            if (!conversationId) {
                console.error("Gagal mendapatkan conversationId.");
                return res.status(500).json({ message: 'Gagal mendapatkan atau membuat percakapan.' });
            }

            console.log("Menggunakan ID_Conversation:", conversationId);

            // Simpan pesan ke dalam percakapan yang ditemukan atau baru dibuat
            const messageQuery = `
                INSERT INTO Messages (ID_Conversation, Sender_ID, Message_Content)
                VALUES (?, ?, ?)
            `;
            const values = [conversationId, senderId, messageContent];

            console.log("Query Insert Pesan:", messageQuery);
            console.log("Values Insert Pesan:", values);

            db.query(messageQuery, values, (msgErr) => {
                if (msgErr) {
                    console.error("Kesalahan saat menyimpan pesan:", msgErr);
                    return res.status(500).json({ message: 'Gagal mengirim pesan.' });
                }

                console.log("Pesan berhasil disimpan dalam percakapan ID:", conversationId);

                // Update Last_Message dan Last_Updated di tabel Conversations
                db.query(
                    'UPDATE Conversations SET Last_Message = ?, Last_Updated = NOW() WHERE ID_Conversation = ?',
                    [messageContent, conversationId],
                    (updateErr) => {
                        if (updateErr) {
                            console.error("Kesalahan saat memperbarui percakapan:", updateErr);
                            return res.status(500).json({ message: 'Gagal memperbarui percakapan.' });
                        }

                        console.log("Percakapan berhasil diperbarui dengan Last_Message:", messageContent);
                        res.status(201).json({ message: 'Pesan berhasil dikirim.' });
                    }
                );
            });
        }
    );
};

const addMessageToConversationByAdmin = async (req, res) => {
    const { messageContent } = req.body;
    const adminId = req.user.id; // Ambil ID admin dari JWT yang terautentikasi
    const { conversationId } = req.params; // conversationId dari params

    console.log("Admin ID:", adminId);
    console.log("Conversation ID:", conversationId);
    console.log("Message Content:", messageContent);

    // Pastikan hanya admin yang dapat mengakses controller ini
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengirim pesan di sini.' });
    }

    // Simpan pesan ke dalam percakapan yang ditentukan
    const messageQuery = `
        INSERT INTO Messages (ID_Conversation, Sender_ID, Message_Content)
        VALUES (?, ?, ?)
    `;
    const values = [conversationId, adminId, messageContent];

    db.query(messageQuery, values, (msgErr) => {
        if (msgErr) {
            console.error("Kesalahan saat menyimpan pesan:", msgErr);
            return res.status(500).json({ message: 'Gagal mengirim pesan.' });
        }

        // Update Last_Message dan Last_Updated di tabel Conversations
        db.query(
            'UPDATE Conversations SET Last_Message = ?, Last_Updated = NOW() WHERE ID_Conversation = ?',
            [messageContent, conversationId],
            (updateErr) => {
                if (updateErr) {
                    console.error("Kesalahan saat memperbarui percakapan:", updateErr);
                    return res.status(500).json({ message: 'Gagal memperbarui percakapan.' });
                }

                res.status(201).json({ message: 'Pesan berhasil dikirim oleh admin.' });
            }
        );
    });
};

const getMessagesByConversation = async (req, res) => {
    const { conversationId } = req.params;

    const query = `
        SELECT m.ID_Message, m.Message_Content, m.Time_Sent, u.Username AS Sender
        FROM Messages m
        JOIN Users u ON m.Sender_ID = u.ID_User
        WHERE m.ID_Conversation = ?
        ORDER BY m.Time_Sent ASC
    `;

    db.query(query, [conversationId], (err, results) => {
        if (err) {
            console.error("Kesalahan saat mengambil pesan:", err);
            return res.status(500).json({ message: 'Gagal mengambil pesan.' });
        }

        res.status(200).json(results);
    });
};

module.exports = {getOrCreateConversation,addMessageToConversation,addMessageToConversationByAdmin,getMessagesByConversation}