const db = require('../../database/database');

// Controller untuk membuat Art Request baru berdasarkan Artwork
const createArtRequestArtwork = async (req, res) => {
    try {
        const { ID_Artwork, ID_Size, Title_Artrequest, Custom_Description } = req.body;
        const ID_Customer = req.user.id;

        // Validasi input
        if (!ID_Artwork || !ID_Size || !Title_Artrequest) {
            return res.status(400).json({ message: 'ID_Artwork, ID_Size, dan Title_Artrequest harus diisi.' });
        }

        // Ambil harga dari tabel Size berdasarkan ID_Size dan ID_Artwork
        const [sizeResult] = await db.query('SELECT Price FROM Size WHERE ID_Size = ? AND ID_Artwork = ?', [ID_Size, ID_Artwork]);
        if (sizeResult.length === 0) {
            return res.status(400).json({ message: 'Ukuran atau artwork tidak valid.' });
        }

        const finalPrice = sizeResult[0].Price;

        // Simpan Art Request di database
        const query = `
            INSERT INTO ArtRequest_Artwork (ID_Customer, ID_Artwork, ID_Size, Title_Artrequest, Custom_Description, Price)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [ID_Customer, ID_Artwork, ID_Size, Title_Artrequest, Custom_Description || null, finalPrice];

        const [result] = await db.query(query, values);
        res.status(201).json({ message: 'Art request berhasil dibuat.', ID_ArtRequest: result.insertId });
    } catch (err) {
        console.error('Kesalahan saat membuat art request:', err);
        res.status(500).json({ message: 'Gagal membuat art request.' });
    }
};

// Controller untuk mengambil semua Art Request oleh pelanggan berdasarkan Artwork
const getArtRequestsArtworkByCustomer = async (req, res) => {
    try {
        const ID_Customer = req.user.id;
        const [results] = await db.query('SELECT * FROM ArtRequest_Artwork WHERE ID_Customer = ?', [ID_Customer]);

        res.status(200).json(results);
    } catch (err) {
        console.error('Kesalahan saat mengambil art request:', err);
        res.status(500).json({ message: 'Gagal mengambil art request.' });
    }
};

// Controller untuk mengambil semua Art Request
const getAllArtRequestsArtwork = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM ArtRequest_Artwork');
        res.status(200).json(results);
    } catch (err) {
        console.error('Kesalahan saat mengambil semua art request:', err);
        res.status(500).json({ message: 'Gagal mengambil art request.' });
    }
};

// Controller untuk mengambil detail Art Request berdasarkan ID
const getArtRequestArtworkById = async (req, res) => {
    try {
        const { ID_ArtRequest } = req.params;
        const [results] = await db.query('SELECT * FROM ArtRequest_Artwork WHERE ID_ArtRequest = ?', [ID_ArtRequest]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Art request tidak ditemukan.' });
        }

        res.status(200).json(results[0]);
    } catch (err) {
        console.error('Kesalahan saat mengambil detail art request:', err);
        res.status(500).json({ message: 'Gagal mengambil detail art request.' });
    }
};

// Controller untuk memperbarui Art Request berdasarkan Artwork
const updateArtRequestArtwork = async (req, res) => {
    try {
        const { ID_ArtRequest } = req.params;
        const { ID_Artwork, ID_Size, Title_Artrequest, Custom_Description } = req.body;

        // Validasi input
        if (!ID_Artwork || !ID_Size || !Title_Artrequest) {
            return res.status(400).json({ message: 'ID_Artwork, ID_Size, dan Title_Artrequest harus diisi.' });
        }

        // Ambil harga dari tabel Size berdasarkan ID_Size dan ID_Artwork
        const [sizeResult] = await db.query('SELECT Price FROM Size WHERE ID_Size = ? AND ID_Artwork = ?', [ID_Size, ID_Artwork]);
        if (sizeResult.length === 0) {
            return res.status(400).json({ message: 'Ukuran atau artwork tidak valid.' });
        }

        const finalPrice = sizeResult[0].Price;

        // Update Art Request di database
        const updateQuery = `
            UPDATE ArtRequest_Artwork
            SET ID_Artwork = ?, ID_Size = ?, Title_Artrequest = ?, Custom_Description = ?, Price = ?
            WHERE ID_ArtRequest = ?
        `;
        const values = [ID_Artwork, ID_Size, Title_Artrequest, Custom_Description || null, finalPrice, ID_ArtRequest];

        await db.query(updateQuery, values);
        res.status(200).json({ message: 'Art request berhasil diperbarui.' });
    } catch (err) {
        console.error('Kesalahan saat memperbarui art request:', err);
        res.status(500).json({ message: 'Gagal memperbarui art request.' });
    }
};

// Controller untuk menghapus Art Request berdasarkan Artwork
const deleteArtRequestArtwork = async (req, res) => {
    try {
        const { ID_ArtRequest } = req.params;
        const [result] = await db.query('DELETE FROM ArtRequest_Artwork WHERE ID_ArtRequest = ?', [ID_ArtRequest]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Art request tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Art request berhasil dihapus.' });
    } catch (err) {
        console.error('Kesalahan saat menghapus art request:', err);
        res.status(500).json({ message: 'Gagal menghapus art request.' });
    }
};

// Middleware untuk memeriksa apakah pengguna dapat membuat art request
const canRequestArt = async (req, res, next) => {
    const { id: userId } = req.user;

    try {
        const [orders] = await db.query(`
            SELECT o.ID_Order
            FROM Orders o
            LEFT JOIN Reviews r ON o.ID_Order = r.ID_Order
            WHERE o.ID_User = ? AND o.OrderStatus = 'completed' AND r.ID_Review IS NULL
        `, [userId]);

        if (orders.length > 0) {
            return res.status(403).json({ message: 'Anda harus memberikan review untuk order yang telah selesai sebelum membuat art request.' });
        }

        next();
    } catch (error) {
        console.error('Kesalahan saat memeriksa status review:', error);
        res.status(500).json({ message: 'Kesalahan saat memeriksa status review.' });
    }
};

const getArtRequestByOrderId = async (req, res) => {
    const { ID_Order } = req.params;

    try {
        // Ambil data ArtRequest dengan join dari tabel Orders
        const [results] = await db.query(`
            SELECT ar.*
            FROM Orders o
            JOIN ArtRequest_Artwork ar ON o.ID_ArtRequest = ar.ID_ArtRequest
            WHERE o.ID_Order = ?
        `, [ID_Order]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Art request tidak ditemukan untuk ID Order tersebut.' });
        }

        res.status(200).json(results[0]);
    } catch (error) {
        console.error('Kesalahan saat mengambil art request berdasarkan order ID:', error);
        res.status(500).json({ message: 'Gagal mengambil art request berdasarkan order ID.' });
    }
};

module.exports = {
    createArtRequestArtwork,
    getArtRequestsArtworkByCustomer,
    getAllArtRequestsArtwork,
    getArtRequestArtworkById,
    updateArtRequestArtwork,
    deleteArtRequestArtwork,
    canRequestArt,
    getArtRequestByOrderId
};
