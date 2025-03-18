const express = require('express');
const router = express.Router();
const {
    createArtRequestCustomArtwork,
    getAllArtRequestCustomArtwork,
    getArtRequestCustomArtworkByCustomer,
    updateArtRequestCustomArtwork,
    deleteArtRequestCustomArtwork
} = require('./controller');
const { authenticateJWT, authorize, uploadArtworkCustom } = require('../../middleware/index');

// Rute untuk CRUD
router.post('/', authenticateJWT, authorize('create', 'ArtRequest_Artwork'), uploadArtworkCustom.single('file'), createArtRequestCustomArtwork);
router.get('/', authenticateJWT, getAllArtRequestCustomArtwork); // Mendapatkan semua permintaan
router.get('/user', authenticateJWT, getArtRequestCustomArtworkByCustomer); // Mendapatkan berdasarkan ID pengguna
router.put('/:id', authenticateJWT, authorize('update', 'ArtRequest_Artwork'), updateArtRequestCustomArtwork);
router.delete('/:id', authenticateJWT, authorize('delete', 'ArtRequest_Artwork'), deleteArtRequestCustomArtwork);

module.exports = router;