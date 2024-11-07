const express = require('express');
const router = express.Router();
const {
    createArtRequestArtwork,
    getArtRequestsArtworkByCustomer,
    getAllArtRequestsArtwork,
    getArtRequestArtworkById,
    updateArtRequestArtwork,
    deleteArtRequestArtwork,
    canRequestArt,
    getArtRequestByOrderId
} = require('./controller');
const { authenticateJWT, authorize } = require('../../middleware/index'); // Sesuaikan path dengan middleware Anda

// Endpoint untuk membuat art request, hanya dapat dilakukan oleh pengguna yang terautentikasi dan dapat melakukan permintaan
router.post('/request/artwork', authenticateJWT, canRequestArt, authorize('create', 'ArtRequest_Artwork'), createArtRequestArtwork);

// Endpoint untuk mengambil semua art request oleh pelanggan yang terautentikasi
router.get('/request/artwork', authenticateJWT, authorize('read', 'ArtRequest_Artwork'), getArtRequestsArtworkByCustomer);

// Endpoint untuk mengambil semua art request (hanya untuk admin atau pengguna yang berwenang)
router.get('/request/artwork/all', authenticateJWT, authorize('read', 'all'), getAllArtRequestsArtwork);

// Endpoint untuk mengambil detail art request berdasarkan ID
router.get('/request/artwork/:ID_ArtRequest', authenticateJWT, authorize('read', 'ArtRequest_Artwork'), getArtRequestArtworkById);

// Endpoint untuk memperbarui art request berdasarkan ID (hanya pengguna berwenang)
router.put('/request/artwork/:ID_ArtRequest', authenticateJWT, authorize('update', 'ArtRequest_Artwork'), updateArtRequestArtwork);

// Endpoint untuk menghapus art request, hanya pengguna terautentikasi yang bisa menghapus miliknya, atau admin
router.delete('/request/artwork/:ID_ArtRequest', authenticateJWT, authorize('delete', 'ArtRequest_Artwork'), deleteArtRequestArtwork);

router.get('/request/by-order/:ID_Order', authenticateJWT, getArtRequestByOrderId);
module.exports = router;
