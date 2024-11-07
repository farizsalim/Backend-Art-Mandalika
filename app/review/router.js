const db = require('../../database/database');
const express = require('express');
const router = express.Router();
const {
    createReview,
    getReviewsByUser,
    getReviewById,
    deleteReview,
    getAllReviews
} = require('./review');
const { authenticateJWT } = require('../../middleware/index'); // Pastikan Anda memiliki middleware untuk autentikasi

// Endpoint untuk membuat review baru
router.post('/reviews', authenticateJWT, createReview);

// Endpoint untuk mengambil semua review oleh pengguna yang terautentikasi
router.get('/reviews', authenticateJWT, getReviewsByUser);

// Endpoint untuk mengambil detail review berdasarkan ID review
router.get('/reviews/:ID_Review', authenticateJWT, getReviewById);

// Endpoint untuk menghapus review berdasarkan ID
router.delete('/reviews/:ID_Review', authenticateJWT, deleteReview);

router.get('/pending-reviews', authenticateJWT, async (req, res) => {
    const ID_User = req.user.id;
    try {
        const [results] = await db.query(`
            SELECT o.ID_Order
            FROM Orders o
            LEFT JOIN Reviews r ON o.ID_Order = r.ID_Order
            WHERE o.ID_User = ? AND o.OrderStatus = 'completed' AND r.ID_Review IS NULL
        `, [ID_User]);

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching pending reviews:', error);
        res.status(500).json({ message: 'Failed to fetch pending reviews.' });
    }
});

router.get('/reviewsall', getAllReviews);
module.exports = router;
