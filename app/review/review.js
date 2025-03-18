const db = require('../../database/database');

// Controller untuk membuat review baru
const createReview = async (req, res) => {
    try {
        const { ID_Order, Review_Text, Rating } = req.body;
        const ID_User = req.user.id; // Ambil ID pengguna yang terautentikasi dari token

        // Validasi input
        if (!ID_Order || !Review_Text || Rating == null) {
            return res.status(400).json({ message: 'ID_Order, Review_Text, dan Rating harus diisi.' });
        }

        // Cek apakah ID_Order valid dan milik ID_User
        const [orderCheck] = await db.query('SELECT * FROM Orders WHERE ID_Order = ? AND ID_User = ?', [ID_Order, ID_User]);
        if (orderCheck.length === 0) {
            return res.status(404).json({ message: 'Order tidak ditemukan atau bukan milik pengguna.' });
        }

        // Simpan review ke database
        const query = `
            INSERT INTO Reviews (ID_Order, ID_User, Review_Text, Rating)
            VALUES (?, ?, ?, ?)
        `;
        const values = [ID_Order, ID_User, Review_Text, Rating];

        await db.query(query, values);
        res.status(201).json({ message: 'Review berhasil dibuat.' });
    } catch (err) {
        console.error("Kesalahan saat membuat review:", err);
        res.status(500).json({ message: 'Gagal membuat review.' });
    }
};

// Controller untuk mengambil semua review berdasarkan ID pengguna
const getReviewsByUser = async (req, res) => {
    try {
        const ID_User = req.user.id; // Ambil ID pengguna yang terautentikasi dari token

        const [results] = await db.query('SELECT * FROM Reviews WHERE ID_User = ?', [ID_User]);
        res.status(200).json(results);
    } catch (err) {
        console.error("Kesalahan saat mengambil review:", err);
        res.status(500).json({ message: 'Gagal mengambil review.' });
    }
};

// Controller untuk mengambil detail review berdasarkan ID review
const getReviewById = async (req, res) => {
    try {
        const { ID_Review } = req.params;

        const [results] = await db.query('SELECT * FROM Reviews WHERE ID_Review = ?', [ID_Review]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Review tidak ditemukan.' });
        }

        res.status(200).json(results[0]);
    } catch (err) {
        console.error("Kesalahan saat mengambil detail review:", err);
        res.status(500).json({ message: 'Gagal mengambil detail review.' });
    }
};

// Controller untuk menghapus review berdasarkan ID
const deleteReview = async (req, res) => {
    try {
        const { ID_Review } = req.params;
        const ID_User = req.user.id; // Ambil ID pengguna yang terautentikasi dari token

        // Cek apakah review tersebut milik pengguna
        const [reviewCheck] = await db.query('SELECT * FROM Reviews WHERE ID_Review = ? AND ID_User = ?', [ID_Review, ID_User]);
        if (reviewCheck.length === 0) {
            return res.status(404).json({ message: 'Review tidak ditemukan atau bukan milik pengguna.' });
        }

        await db.query('DELETE FROM Reviews WHERE ID_Review = ?', [ID_Review]);
        res.status(200).json({ message: 'Review berhasil dihapus.' });
    } catch (err) {
        console.error("Kesalahan saat menghapus review:", err);
        res.status(500).json({ message: 'Gagal menghapus review.' });
    }
};

const getAllReviews = async (req, res) => {
    try {
        const query = `
            SELECT 
                r.*,
                u.Username,
                u.Photo AS ProfilePicture,
                COALESCE(a.Title_Artwork, ac.Title_Artwork) AS ArtworkTitle,
                COALESCE(a.Artworkimage, ac.RequestImage) AS ArtworkImage,
                CASE
                    WHEN o.ID_Artwork IS NOT NULL THEN 'artwork'
                    WHEN o.ID_ArtworkCustom IS NOT NULL THEN 'artworkcustom'
                END AS ArtworkType,
                creator.Username AS CreatorName  -- Nama creator diambil dari sini
            FROM Reviews r
            JOIN Users u ON r.ID_User = u.ID_User
            JOIN Orders o ON r.ID_Order = o.ID_Order
            LEFT JOIN Artwork a ON o.ID_Artwork = a.ID_Artwork
            LEFT JOIN Users AS creator ON a.ID_Creator = creator.ID_User  -- Join ke Users untuk creator
            LEFT JOIN ArtworkCustom ac ON o.ID_ArtworkCustom = ac.ID_ArtworkCustom
            ORDER BY r.Created_at DESC
        `;

        const [results] = await db.query(query);

        // Format image URL dan tambahkan default
        const formattedReviews = results.map(review => ({
            ...review,
            ArtworkImage: review.ArtworkImage 
                ? `http://localhost:8000/ARTM/images/uploads/${review.ArtworkType}/${review.ArtworkImage}`
                : 'http://localhost:8000/ARTM/images/default-artwork.jpg',
            CreatorName: review.CreatorName || 'Unknown Artist'  // Fallback jika null
        }));

        res.status(200).json(formattedReviews);
        
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ 
            message: 'Failed to fetch reviews.',
            error: {
                code: error.code,
                detail: error.sqlMessage
            }
        });
    }
};


module.exports = {
    createReview,
    getReviewsByUser,
    getReviewById,
    deleteReview,
    getAllReviews
};
